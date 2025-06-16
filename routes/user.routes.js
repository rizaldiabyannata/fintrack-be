const express = require("express");
const {
  getUser,
  updateUser,
  deleteUser,
} = require("../controllers/user.controller");
// Ganti middleware firebaseAuth dengan middleware otorisasi JWT internal Anda
const verifyAuthToken = require("../middleware/verifyAuthToken.js"); // Asumsi nama file middleware baru
const { uploadSingle } = require("../middleware/multer.js");
const router = express.Router();

// Gunakan verifyAuthToken untuk melindungi rute
router.get("/", verifyAuthToken, getUser);
router.put("/", verifyAuthToken, uploadSingle, updateUser);
router.delete("/", verifyAuthToken, deleteUser);

module.exports = router;