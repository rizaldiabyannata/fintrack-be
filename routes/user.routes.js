const express = require("express");
const {
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/user.controller");
const verifyFirebaseToken = require("../middleware/firebaseAuth.js");
const router = express.Router();

router.get("/:id", verifyFirebaseToken, getUserById);
router.put("/:id", verifyFirebaseToken, updateUser);
router.delete("/:id", verifyFirebaseToken, deleteUser);

module.exports = router;
