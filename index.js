// ✅ index.js - Updated Signaling Server
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: '*' },
});

const rooms = {};

io.on('connection', (socket) => {
  console.log('🔌 A user connected:', socket.id);

  socket.on('join', ({ room }) => {
    socket.join(room);
    const clients = io.sockets.adapter.rooms.get(room);
    const numberOfClients = clients ? clients.size : 0;

    rooms[socket.id] = room;
    console.log(`👤 User ${socket.id} joined room: ${room}`);

    // Inform user if they are the initiator
    socket.emit('joined', {
      isInitiator: numberOfClients === 1,
    });
  });

  socket.on('offer', (data) => {
    const room = data.room;
    socket.to(room).emit('offer', data);
    console.log(`📡 Offer sent to room ${room}`);
  });

  socket.on('answer', (data) => {
    const room = data.room;
    socket.to(room).emit('answer', data);
    console.log(`📡 Answer sent to room ${room}`);
  });

  socket.on('ice-candidate', (data) => {
    const room = data.room;
    socket.to(room).emit('ice-candidate', data);
  });

  socket.on('disconnect', () => {
    const room = rooms[socket.id];
    if (room) {
      socket.to(room).emit('user-left', { id: socket.id });
      console.log(`❌ User ${socket.id} left room: ${room}`);
      delete rooms[socket.id];
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Signaling server is running on port ${PORT}`);
});
