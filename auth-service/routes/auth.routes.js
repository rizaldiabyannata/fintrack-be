const express = require("express");
const { loginOrRegister } = require("../controllers/auth.controller.js");

const router = express.Router();

router.post("/auth", loginOrRegister);

module.exports = router;
