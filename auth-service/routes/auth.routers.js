const express = require("express");
const verifyFirebaseToken = require("../middleware/firebaseAuth.js");
const { loginOrRegister } = require("../controllers/auth.controller.js");

const router = express.Router();

router.post("/auth", verifyFirebaseToken, loginOrRegister);

module.exports = router;
