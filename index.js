// File: index.js (Backend for 100ms.live token generation)

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Replace with your actual 100ms credentials from the dashboard
const APP_ACCESS_KEY = "67feda414944f067313a9702";
const APP_SECRET = "BnX7u-WuK4nOi8Hkdw5T3n7zuz9P1GbJmlZvXkmJ_u-65e5SZnjaa8Sw2gdeXy90Zgh16xj6iLiagJ37VC5roGxRKrGfyVTB1M41A_OBJlR6KA5ezVrfE9APvt0huJ_PELppe3ZZrGMsrCOjW4tdUYIibVnbGg4TsCOsTUwzBXg=";
const SUBDOMAIN = "mind-videoconf-1814";

// Helper to generate token
function generateToken({ user_id, room_id }) {
  const payload = {
    access_key: APP_ACCESS_KEY,
    room_id: room_id,
    user_id: user_id,
    role: "host",
    type: "app",
    version: 2,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
  };

  return jwt.sign(payload, APP_SECRET);
}

app.get("/get-token", (req, res) => {
  const room_id = req.query.room;
  const user_id = req.query.user || "user_" + Date.now();

  if (!room_id) {
    return res.status(400).json({ error: "Room name is required." });
  }

  const token = generateToken({ user_id, room_id });
  return res.json({ token });
});

app.listen(PORT, () => {
  console.log(`✅ 100ms token server running at http://localhost:${PORT}`);
});
