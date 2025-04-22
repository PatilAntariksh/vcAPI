const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*" }
});

let rooms = {}; // Track users per room

io.on('connection', (socket) => {
  socket.on('join', (room) => {
    socket.join(room);

    if (!rooms[room]) rooms[room] = [];
    rooms[room].push(socket.id);

    // First user creates the room
    if (rooms[room].length === 1) {
      socket.emit('room_created');
    } else {
      // Second user joins and tells the first user to start the call
      socket.emit('room_joined');
      socket.to(room).emit('ready'); // notify caller to send offer
    }

    socket.on('disconnect', () => {
      rooms[room] = rooms[room].filter(id => id !== socket.id);
      if (rooms[room].length === 0) delete rooms[room];
    });
  });

  socket.on('offer', (data) => {
    socket.to(data.room).emit('offer', data);
  });

  socket.on('answer', (data) => {
    socket.to(data.room).emit('answer', data);
  });

  socket.on('candidate', (data) => {
    socket.to(data.room).emit('candidate', data);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Signaling server running on ${PORT}`));
