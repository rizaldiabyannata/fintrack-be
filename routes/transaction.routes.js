const express = require("express");
const router = express.Router();

const {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} = require("../controllers/transaction.controller.js");
const verifyFirebaseToken = require("../middleware/firebaseAuth.js");

// Create a new transaction
router.post("/", verifyFirebaseToken, createTransaction);
// Get all transactions
router.get("/", verifyFirebaseToken, getAllTransactions);
// Get a single transaction by ID
router.get("/:id", verifyFirebaseToken, getTransactionById);
// Update a transaction
router.put("/:id", verifyFirebaseToken, updateTransaction);
// Delete a transaction
router.delete("/:id", verifyFirebaseToken, deleteTransaction);

module.exports = router;
