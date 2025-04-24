const express = require("express");
const cors = require("cors");
const axios = require("axios");
const dotenv = require("dotenv");
const firebaseAuth = require("./middleware/firebaseAuth.js");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://192.168.1.22:3001";

const TRANSACTION_SERVICE_URL =
  process.env.TRANSACTION_SERVICE_URL || "http://192.168.1.22:3003";

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

app.post("/api/transaction", firebaseAuth, async (req, res) => {
  try {
    const forwardedBody = {
      ...req.body,
      uid: req.user.uid, // inject user dari firebaseAuth
    };

    const response = await axios.post(
      `${TRANSACTION_SERVICE_URL}/api/transaction`,
      forwardedBody,
      {
        headers: {
          Authorization: req.headers.authorization, // forward token juga jika perlu
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
