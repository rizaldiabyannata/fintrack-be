const express = require("express");
const { loginOrRegister } = require("../controllers/auth.controller.js");
const verifyFirebaseToken = require("../middleware/firebaseAuth.js");

const router = express.Router();

router.post("/", verifyFirebaseToken, loginOrRegister);
router.get("/test", (req, res) => {
  res.send("Auth Service is reachable");
});

module.exports = router;
