// server.js (Jitsi-like signaling server)
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
    if (!rooms[room]) rooms[room] = [];
    rooms[room].push(socket.id);
    socket.join(room);
    console.log(`👥 ${socket.id} joined room: ${room}`);

    const otherUsers = rooms[room].filter((id) => id !== socket.id);
    socket.emit('all-users', otherUsers);
  });

  socket.on('offer', (payload) => {
    io.to(payload.target).emit('offer', {
      sdp: payload.sdp,
      caller: payload.caller,
    });
  });

  socket.on('answer', (payload) => {
    io.to(payload.target).emit('answer', {
      sdp: payload.sdp,
      caller: payload.caller,
    });
  });

  socket.on('ice-candidate', (incoming) => {
    io.to(incoming.target).emit('ice-candidate', {
      candidate: incoming.candidate,
      sender: socket.id,
    });
  });

  socket.on('disconnect', () => {
    for (const room in rooms) {
      rooms[room] = rooms[room].filter((id) => id !== socket.id);
      socket.to(room).emit('user-disconnected', socket.id);
      if (rooms[room].length === 0) delete rooms[room];
    }
    console.log('❌ A user disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`✅ signaling server running on port ${PORT}`);
});
