const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*" }
});

io.on("connection", (socket) => {
  socket.on("join", (room) => socket.join(room));

  socket.on("offer", (data) => socket.to(data.room).emit("offer", data));
  socket.on("answer", (data) => socket.to(data.room).emit("answer", data));
  socket.on("candidate", (data) => socket.to(data.room).emit("candidate", data));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Signaling server running on ${PORT}`));
