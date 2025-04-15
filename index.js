const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

// Add these root route handlers
app.get('/', (req, res) => {
  res.status(200).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>WebRTC Signaling Server</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
        .status { color: #4CAF50; font-weight: bold; }
      </style>
    </head>
    <body>
      <h1>WebRTC Signaling Server</h1>
      <p class="status">🟢 Server is running</p>
      <p>Connected clients: ${io.engine.clientsCount}</p>
      <p>Active rooms: ${rooms.size}</p>
    </body>
    </html>
  `);
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: Date.now() });
});

const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingInterval: 10000,
  pingTimeout: 5000,
  cookie: false
});

// Room management
const rooms = new Map();
const activeSockets = new Map();

// Connection cleanup
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  activeSockets.forEach((lastActive, socketId) => {
    if (now - lastActive > 30000) { // 30s timeout
      const socket = io.sockets.sockets.get(socketId);
      if (socket) socket.disconnect(true);
    }
  });
}, 15000);

io.on('connection', (socket) => {
  console.log(`🔌 New connection: ${socket.id} from ${socket.handshake.address}`);
  activeSockets.set(socket.id, Date.now());

  // Heartbeat mechanism
  socket.on('ping', () => {
    activeSockets.set(socket.id, Date.now());
    socket.emit('pong');
  });

  socket.on('join-room', (roomCode) => {
    try {
      // Validation
      if (!roomCode || typeof roomCode !== 'string' || roomCode.length < 6) {
        return socket.emit('room-error', { 
          message: 'Room code must be at least 6 characters',
          code: 'INVALID_CODE'
        });
      }

      // Rate limiting check
      if (activeSockets.get(socket.id) < Date.now() - 1000) {
        return socket.emit('room-error', {
          message: 'Too many requests',
          code: 'RATE_LIMITED'
        });
      }

      activeSockets.set(socket.id, Date.now());

      // Room management
      let room = rooms.get(roomCode);
      if (!room) {
        room = {
          participants: [],
          createdAt: Date.now(),
          lastActivity: Date.now()
        };
        rooms.set(roomCode, room);
        console.log(`🆕 Room created: ${roomCode} by ${socket.id}`);
      }

      // Check if already in room
      if (room.participants.includes(socket.id)) {
        return socket.emit('room-error', {
          message: 'Already in this room',
          code: 'DUPLICATE_JOIN'
        });
      }

      // Capacity check
      if (room.participants.length >= 2) {
        return socket.emit('room-error', {
          message: 'Room is full (max 2 users)',
          code: 'ROOM_FULL'
        });
      }

      // Join room
      room.participants.push(socket.id);
      room.lastActivity = Date.now();
      socket.join(roomCode);

      console.log(`🚪 ${socket.id} joined ${roomCode} (${room.participants.length}/2)`);

      // Notify users when pair is complete
      if (room.participants.length === 2) {
        const [caller, callee] = room.participants;
        
        io.to(caller).emit('ready', { 
          partnerId: callee, 
          isCaller: true,
          roomCode,
          timestamp: Date.now()
        });
        
        io.to(callee).emit('ready', { 
          partnerId: caller, 
          isCaller: false,
          roomCode,
          timestamp: Date.now()
        });

        console.log(`🤝 Peer connection initiated in ${roomCode} between ${caller} and ${callee}`);
      }

    } catch (err) {
      console.error(`⚠️ Room join error: ${err.message}`);
      socket.emit('room-error', {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      });
    }
  });

  // WebRTC signaling relay
  socket.on('webrtc-signal', ({ target, type, payload }) => {
    try {
      if (!target || !type || !payload) {
        throw new Error('Invalid signal format');
      }

      console.log(`📶 Relay ${type} from ${socket.id} to ${target}`);
      socket.to(target).emit('webrtc-signal', { 
        sender: socket.id, 
        type, 
        payload,
        timestamp: Date.now()
      });

      // Update room activity
      rooms.forEach((room, code) => {
        if (room.participants.includes(socket.id)) {
          room.lastActivity = Date.now();
        }
      });

    } catch (err) {
      console.error(`⚠️ Signal relay error: ${err.message}`);
    }
  });

  // Leave room explicitly
  socket.on('leave-room', (roomCode) => {
    _cleanupRoom(socket, roomCode);
  });

  // Disconnect handler
  socket.on('disconnect', (reason) => {
    console.log(`❌ ${socket.id} disconnected (${reason})`);
    activeSockets.delete(socket.id);
    
    // Clean up all rooms this socket was in
    rooms.forEach((room, code) => {
      if (room.participants.includes(socket.id)) {
        _cleanupRoom(socket, code);
      }
    });
  });

  // Error handler
  socket.on('error', (err) => {
    console.error(`⚠️ Socket error for ${socket.id}: ${err.message}`);
  });
});

// Room cleanup helper
function _cleanupRoom(socket, roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;

  room.participants = room.participants.filter(id => id !== socket.id);
  
  if (room.participants.length > 0) {
    // Notify remaining participant
    io.to(room.participants[0]).emit('peer-disconnected', {
      partnerId: socket.id,
      roomCode,
      timestamp: Date.now()
    });
  } else {
    // Delete empty room
    rooms.delete(roomCode);
  }

  console.log(`🧹 ${socket.id} left ${roomCode} (${room.participants.length} remaining)`);
}

// Server startup
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`✅ Signaling server running on port ${PORT}`);
  
  // Log server info
  console.log('Server configuration:');
  console.log(`- CORS: Enabled`);
  console.log(`- Ping Interval: ${io._pingInterval}ms`);
  console.log(`- Ping Timeout: ${io._pingTimeout}ms`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  clearInterval(cleanupInterval);
  io.close(() => {
    console.log('🛑 Signaling server gracefully terminated');
    process.exit(0);
  });
});
