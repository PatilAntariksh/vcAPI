// signaling_server.js
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*'
  }
});

const rooms = {}; // Map room names to socket ids

io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  socket.on('join-room', (room) => {
    console.log(`🚪 ${socket.id} joined room: ${room}`);
    socket.join(room);
    socket.to(room).emit('peer-connected', socket.id); // Notify others in room

    // Handle relaying ICE candidates
    socket.on('ice-candidate', (data) => {
      socket.to(room).emit('ice-candidate', {
        candidate: data.candidate,
        sender: socket.id,
      });
    });

    // Handle relaying SDP
    socket.on('sdp', (data) => {
      socket.to(room).emit('sdp', {
        description: data.description,
        sender: socket.id,
      });
    });

    // On disconnect
    socket.on('disconnect', () => {
      console.log(`❌ ${socket.id} disconnected from room: ${room}`);
      socket.to(room).emit('peer-disconnected', socket.id);
    });
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`✅ Signaling server running on port ${PORT}`);
});
