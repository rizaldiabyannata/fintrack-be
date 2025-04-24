const express = require("express");
const cors = require("cors");
const axios = require("axios");
const dotenv = require("dotenv");
const firebaseAuth = require("./middleware/firebaseAuth.js");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://10.70.4.174:3001";

// middleware
app.use(cors("*"));
app.use(express.json());

// route
app.post("/api/auth", firebaseAuth, async (req, res) => {
  try {
    const response = await axios.post(
      `${AUTH_SERVICE_URL}/api/auth`,
      req.body,
      {
        headers: {
          Authorization: req.headers.authorization,
        },
      }
    );

    res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const data = error.response?.data || { message: "Internal server error" };
    console.error("Gateway Error:", data);
    res.status(status).json(data);
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Gateway Service running on port ${PORT}`);
});
