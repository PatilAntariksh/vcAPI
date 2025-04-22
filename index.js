const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { 
    origin: "*",
    methods: ["GET", "POST"]
  }
});

let rooms = {}; // Track users per room

io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);

  socket.on('join', (room) => {
    console.log(`${socket.id} joining room: ${room}`);
    socket.join(room);

    if (!rooms[room]) rooms[room] = [];
    rooms[room].push(socket.id);

    // First user creates the room
    if (rooms[room].length === 1) {
      console.log(`Room created: ${room}`);
      socket.emit('room_created');
    } else if (rooms[room].length === 2) {
      // Second user joins and tells the first user to start the call
      console.log(`Room joined: ${room}`);
      socket.emit('room_joined');
      socket.to(room).emit('ready'); // notify caller to send offer
    } else {
      // Room is full
      console.log(`Room ${room} is full`);
      socket.emit('room_full');
    }

    console.log(`Current room state: ${JSON.stringify(rooms)}`);
  });

  socket.on('offer', (data) => {
    console.log(`Offer received in room ${data.room}`);
    socket.to(data.room).emit('offer', data);
  });

  socket.on('answer', (data) => {
    console.log(`Answer received in room ${data.room}`);
    socket.to(data.room).emit('answer', data);
  });

  socket.on('candidate', (data) => {
    console.log(`Candidate received in room ${data.room}`);
    socket.to(data.room).emit('candidate', data);
  });

  socket.on('disconnect', () => {
    console.log(`Disconnected: ${socket.id}`);
    // Clean up rooms
    for (const room in rooms) {
      rooms[room] = rooms[room].filter(id => id !== socket.id);
      if (rooms[room].length === 0) {
        delete rooms[room];
        console.log(`Room ${room} deleted (empty)`);
      }
    }
    console.log(`Updated room state: ${JSON.stringify(rooms)}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Signaling server running on ${PORT}`));
