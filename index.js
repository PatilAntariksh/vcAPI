// server.js - 100ms token generator ready for Render hosting
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());

// ✅ Replace with your actual 100ms API key and secret
const HMS_API_KEY = "67feda414944f067313a9702";
const HMS_API_SECRET = "BnX7u-WuK4nOi8Hkdw5T3n7zuz9P1GbJmlZvXkmJ_u-65e5SZnjaa8Sw2gdeXy90Zgh16xj6iLiagJ37VC5roGxRKrGfyVTB1M41A_OBJlR6KA5ezVrfE9APvt0huJ_PELppe3ZZrGMsrCOjW4tdUYIibVnbGg4TsCOsTUwzBXg=";
const SUB_DOMAIN = "mind-videoconf-1814"; // e.g., 'myapp' if your 100ms subdomain is myapp.app.100ms.live

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
