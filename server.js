const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const rooms = {};

io.on("connection", (socket) => {
  console.log("User connected: " + socket.id);

  socket.on("join-room", ({ roomId, userId }) => {
    socket.join(roomId);
    if (!rooms[roomId]) rooms[roomId] = [];
    rooms[roomId].push(userId);

    socket.to(roomId).emit("user-joined", userId);

    socket.on("send-offer", (data) => {
      socket.to(roomId).emit("receive-offer", data);
    });

    socket.on("send-answer", (data) => {
      socket.to(roomId).emit("receive-answer", data);
    });

    socket.on("send-ice-candidate", (data) => {
      socket.to(roomId).emit("receive-ice-candidate", data);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected: " + socket.id);
      socket.to(roomId).emit("user-disconnected", userId);
      rooms[roomId] = rooms[roomId].filter((id) => id !== userId);
    });
  });
});

app.get("/", (req, res) => {
  res.send("WebRTC signaling server is running");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
