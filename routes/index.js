const authRoutes = require("./auth.routes");

const express = require("express");
const router = express.Router();

// Import routes
router.use("/auth", authRoutes);

module.exports = router;
