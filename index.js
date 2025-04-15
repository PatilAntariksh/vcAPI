const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

// Add root route handler
app.get('/', (req, res) => {
  res.send('Signaling Server is running');
});

const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*'
  }
});

io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  socket.on('join-room', (room) => {
    console.log(`🚪 ${socket.id} joined room: ${room}`);
    socket.join(room);
    
    socket.to(room).emit('user-connected', socket.id);
    
    io.in(room).fetchSockets().then(sockets => {
      const otherUsers = sockets.map(s => s.id).filter(id => id !== socket.id);
      if (otherUsers.length > 0) {
        socket.emit('existing-users', otherUsers);
      }
    });

    socket.on('ice-candidate', (data) => {
      socket.to(data.target).emit('ice-candidate', {
        candidate: data.candidate,
        sender: socket.id,
      });
    });

    socket.on('sdp', (data) => {
      socket.to(data.target).emit('sdp', {
        description: data.description,
        type: data.type,
        sender: socket.id,
      });
    });

    socket.on('disconnect', () => {
      console.log(`❌ ${socket.id} disconnected from room: ${room}`);
      socket.to(room).emit('user-disconnected', socket.id);
    });
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`✅ Signaling server running on port ${PORT}`);
});
