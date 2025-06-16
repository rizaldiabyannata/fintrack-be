const express = require("express");
const router = express.Router();

const {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} = require("../controllers/transaction.controller.js");
// Ganti middleware
const verifyAuthToken = require("../middleware/verifyAuthToken.js"); // Asumsi nama file middleware baru

// Gunakan verifyAuthToken untuk semua rute transaksi
router.post("/", verifyAuthToken, createTransaction);
router.get("/", verifyAuthToken, getAllTransactions);
router.get("/:id", verifyAuthToken, getTransactionById);
router.put("/:id", verifyAuthToken, updateTransaction);
router.delete("/:id", verifyAuthToken, deleteTransaction);

module.exports = router;