// 📁 index.js
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv\config");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 10000;
const APP_ID = process.env.JITSI_APP_ID;
const PRIVATE_KEY = process.env.JITSI_PRIVATE_KEY.replace(/\\n/g, "\n");
const JITSI_DOMAIN = process.env.JITSI_DOMAIN || "meet.jit.si";

app.get("/token", (req, res) => {
  const { room, name } = req.query;
  if (!room || !name) return res.status(400).json({ error: "Missing room or name" });

  const payload = {
    aud: "jitsi",
    iss: APP_ID,
    sub: JITSI_DOMAIN,
    room: room,
    context: {
      user: {
        name: name,
        id: Math.random().toString(36).substring(2, 15)
      }
    },
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  };

  const token = jwt.sign(payload, PRIVATE_KEY, { algorithm: "RS256" });
  res.json({ token });
});

app.listen(PORT, () => {
  console.log(`✅ JaaS Token server running on http://localhost:${PORT}`);
});
