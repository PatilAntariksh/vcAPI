// server.js - 100ms token generator ready for Render hosting
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());

// ✅ Replace with your actual 100ms API key and secret
const HMS_API_KEY = "REPLACE_ME";
const HMS_API_SECRET = "REPLACE_ME";
const SUB_DOMAIN = "REPLACE_ME"; // e.g., 'myapp' if your 100ms subdomain is myapp.app.100ms.live

app.get("/get-token", async (req, res) => {
  const { user_id, room_id, role = "host" } = req.query;

  if (!user_id || !room_id) {
    return res.status(400).json({ error: "user_id and room_id required" });
  }

  try {
    const response = await axios.post(
      `https://prod-in.100ms.live/hmsapi/${SUB_DOMAIN}.app.100ms.live/api/token`,
      {
        user_id,
        role,
        room_id,
      },
      {
        auth: {
          username: HMS_API_KEY,
          password: HMS_API_SECRET,
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    res.json({ token: response.data.token });
  } catch (error) {
    console.error("Failed to fetch token", error);
    res.status(500).json({ error: "Token fetch failed" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ 100ms Token Server running on http://localhost:${PORT}`);
});
