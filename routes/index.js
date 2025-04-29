const authRoutes = require("./auth.routes");
const transactionRoutes = require("./transaction.routes");
const categoryRoutes = require("./category.routes");

const express = require("express");
const router = express.Router();

// Import routes
router.use("/auth", authRoutes);
router.use("/transaction", transactionRoutes);
router.use("/category", categoryRoutes);

module.exports = router;
