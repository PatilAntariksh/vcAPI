const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",  // Allow all origins for now
    methods: ["GET", "POST"],
  }
});

const rooms = {}; // { roomId: [{socketId, userId}] }

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', ({ roomId, userId }) => {
    console.log(`User ${userId} joining room ${roomId}`);
    socket.join(roomId);

    if (!rooms[roomId]) rooms[roomId] = [];
    rooms[roomId].push({ socketId: socket.id, userId });

    // Notify others in the room
    socket.to(roomId).emit('user-joined', { socketId: socket.id });
  });

  socket.on('offer', ({ offer, to }) => {
    console.log('Sending offer to', to);
    io.to(to).emit('offer', { offer, from: socket.id });
  });

  socket.on('answer', ({ answer, to }) => {
    console.log('Sending answer to', to);
    io.to(to).emit('answer', { answer, from: socket.id });
  });

  socket.on('ice-candidate', ({ candidate, roomId }) => {
    console.log('Broadcasting ICE candidate in room', roomId);
    socket.to(roomId).emit('ice-candidate', { candidate });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    // Remove user from room
    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter(u => u.socketId !== socket.id);
      if (rooms[roomId].length === 0) {
        delete rooms[roomId];
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Signaling server listening on port ${PORT}`);
});
