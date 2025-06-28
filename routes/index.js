const authRoutes = require("./auth.routes");
const transactionRoutes = require("./transaction.routes");
const categoryRoutes = require("./category.routes");
const budgetRoutes = require("./budget.routes");
const userRoutes = require("./user.routes");
const statisticRoutes = require("./statistic.routes");

const express = require("express");
const router = express.Router();

// Import routes
router.use("/auth", authRoutes);
router.use("/transaction", transactionRoutes);
router.use("/category", categoryRoutes);
router.use("/budget", budgetRoutes);
router.use("/user", userRoutes);
router.use("/statistics", statisticRoutes);

module.exports = router;
