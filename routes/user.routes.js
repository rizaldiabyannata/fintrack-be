const express = require("express");
const {
  getUser,
  updateUser,
  deleteUser,
} = require("../controllers/user.controller");
const verifyFirebaseToken = require("../middleware/firebaseAuth.js");
const { uploadSingle } = require("../middleware/multer.js");
const router = express.Router();

router.get("/", verifyFirebaseToken, getUser);
router.put("/", verifyFirebaseToken, uploadSingle, updateUser);
router.delete("/", verifyFirebaseToken, deleteUser);

module.exports = router;
