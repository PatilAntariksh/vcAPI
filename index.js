const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 10000;

const accessKey = "67feda414944f067313a9702";
const secret = "BnX7u-WuK4nOi8Hkdw5T3n7zuz9P1GbJmlZvXkmJ_u-65e5SZnjaa8Sw2gdeXy90Zgh16xj6iLiagJ37VC5roGxRKrGfyVTB1M41A_OBJlR6KA5ezVrfE9APvt0huJ_PELppe3ZZrGMsrCOjW4tdUYIibVnbGg4TsCOsTUwzBXg=";

app.get("/token", (req, res) => {
  const user_id = req.query.user_id || "user_" + Math.floor(Math.random() * 1000);
  const room_id = req.query.room_id;

  if (!room_id) return res.status(400).send({ error: "room_id is required" });

  const payload = {
    access_key: accessKey,
    type: "app",
    version: 2,
    iat: Math.floor(Date.now() / 1000),
    nbf: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
    room_id: room_id,
    user_id: user_id,
    role: "host"
  };

  const token = jwt.sign(payload, secret, { algorithm: "HS256" });

  res.send({ token, user_id, room_id });
});

app.listen(PORT, () => {
  console.log(`✅ HMS token server running on http://localhost:${PORT}`);
});
