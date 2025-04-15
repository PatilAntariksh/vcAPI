// jitsi_like_signaling_server.js

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

const rooms = {}; // roomName: Set<socket.id>
const peers = {}; // socket.id: roomName

io.on('connection', (socket) => {
  console.log(`📡 New connection: ${socket.id}`);
  socket.emit('me', socket.id); // Mimic Jitsi-style unique user ID assignment

  socket.on('join-room', ({ roomId }) => {
    if (!rooms[roomId]) rooms[roomId] = new Set();

    rooms[roomId].add(socket.id);
    peers[socket.id] = roomId;

    console.log(`👥 ${socket.id} joined room ${roomId}`);

    // Notify other users in the room
    rooms[roomId].forEach((peerId) => {
      if (peerId !== socket.id) {
        socket.to(peerId).emit('user-connected', socket.id);
      }
    });
  });

  socket.on('send-offer', ({ targetId, offer }) => {
    socket.to(targetId).emit('receive-offer', {
      senderId: socket.id,
      offer,
    });
  });

  socket.on('send-answer', ({ targetId, answer }) => {
    socket.to(targetId).emit('receive-answer', {
      senderId: socket.id,
      answer,
    });
  });

  socket.on('ice-candidate', ({ targetId, candidate }) => {
    socket.to(targetId).emit('ice-candidate', {
      senderId: socket.id,
      candidate,
    });
  });

  socket.on('disconnect', () => {
    const roomId = peers[socket.id];
    if (roomId && rooms[roomId]) {
      rooms[roomId].delete(socket.id);
      if (rooms[roomId].size === 0) delete rooms[roomId];
    }

    delete peers[socket.id];
    io.emit('user-disconnected', socket.id);
    console.log(`❌ ${socket.id} disconnected`);
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`✅ Jitsi-style signaling server running on port ${PORT}`);
});
