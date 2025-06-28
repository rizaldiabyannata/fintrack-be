const express = require("express");
const router = express.Router();
const statisticController = require("../controllers/statistic.controller");
const verifyAuthToken = require("../middleware/verifyAuthToken.js");

router.get("/monthly", verifyAuthToken, statisticController.getMonthlyStats);

router.get("/yearly", verifyAuthToken, statisticController.getYearlyStats);

module.exports = router;
