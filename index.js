// index.js
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketIO(server, { cors: { origin: '*' } });

const rooms = {};

io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  socket.on('join', ({ room }) => {
    socket.join(room);
    if (!rooms[room]) rooms[room] = [];
    rooms[room].push(socket.id);

    const isInitiator = rooms[room].length === 1;
    socket.emit('joined', { isInitiator });

    if (!isInitiator && rooms[room].length === 2) {
      const initiatorSocketId = rooms[room][0];
      io.to(initiatorSocketId).emit('ready');
    }

    console.log(`👥 Room "${room}" has ${rooms[room].length} user(s)`);
  });

  socket.on('offer', (data) => {
    socket.to(data.room).emit('offer', data);
  });

  socket.on('answer', (data) => {
    socket.to(data.room).emit('answer', data);
  });

  socket.on('ice-candidate', (data) => {
    socket.to(data.room).emit('ice-candidate', data);
  });

  socket.on('disconnect', () => {
    for (const room in rooms) {
      rooms[room] = rooms[room].filter((id) => id !== socket.id);
      if (rooms[room].length === 0) delete rooms[room];
    }
    console.log(`❌ Disconnected: ${socket.id}`);
  });
});

server.listen(10000, () => {
  console.log('✅ Signaling server running on port 10000');
});
