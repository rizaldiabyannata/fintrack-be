const express = require("express");
const { loginOrRegister } = require("../controllers/auth.controller.js");
const verifyFirebaseToken = require("../middleware/firebaseAuth.js");

const router = express.Router();

router.post("/auth", verifyFirebaseToken, loginOrRegister);

module.exports = router;
