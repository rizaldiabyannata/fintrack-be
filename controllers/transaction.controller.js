const Transaction = require("../models/transaction.model");
const User = require("../models/user.model.js");
const Category = require("../models/category.model.js");
const { createCategory } = require("./category.controller.js");
const logger = require("../utils/logUtils.js");
const mongoose = require("mongoose");

// Create a new transaction
exports.createTransaction = async (req, res) => {
  const { category: categoryName, type, amount, description, date } = req.body;
  const userUid = req.user?._id;

  if (!userUid || !categoryName || !type || !amount) {
    logger.warn("Missing required fields");
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const user = await User.findOne({ _id: userUid });
    if (!user) {
      logger.warn("User not found");
      return res.status(404).json({ message: "User not found" });
    }

    let category = await Category.findOne({ name: categoryName });
    if (!category) {
      logger.info("Category not found, creating a new one");
      const newCategory = new Category({
        name: categoryName,
        type,
        userId: user._id,
      });
      category = await newCategory.save();
    }

    const transaction = new Transaction({
      userId: user._id,
      amount,
      categoryId: category._id,
      type,
      description: description || "",
      date: date ? new Date(date) : new Date(),
    });

    const savedTransaction = await transaction.save();
    logger.info("Creating transaction", transaction);
    res.status(201).json(savedTransaction);
  } catch (error) {
    console.error(error);
    logger.error("Error creating transaction", error);
    res.status(400).json({ error: error.message });
  }
};

// Get all transactions
exports.getAllTransactions = async (req, res) => {
  try {
    const userUid = req.user?._id;
    if (!userUid) {
      logger.warn("User ID not provided");
      return res.status(404).json({ error: "User id Not Found" });
    }
    const user = await User.findOne({ _id: userUid });
    const transactions = await Transaction.find({ userId: user._id }).populate(
      "categoryId"
    );
    if (!transactions) {
      logger.warn("No transactions found");
      return res.status(404).json({ message: "No transactions found" });
    }
    logger.info("Transactions found", transactions);
    res.status(200).json(transactions);
  } catch (error) {
    logger.error("Error fetching transactions", error);
    res.status(500).json({ error: error.message });
  }
};

// Get a single transaction by ID
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id).populate(
      "userId categoryId"
    );
    if (!transaction) {
      logger.warn("Transaction not found");
      return res.status(404).json({ error: "Transaction not found" });
    }
    logger.info("Transaction found", transaction);
    res.status(200).json(transaction);
  } catch (error) {
    logger.error("Error fetching transaction", error);
    res.status(500).json({ error: error.message });
  }
};

// Update a transaction by ID
exports.updateTransaction = async (req, res) => {
  try {
    const transactionId = req.params.id;
    const updateData = req.body;

    // Validasi apakah ID transaksi valid
    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
      logger.warn("Invalid transaction ID");
      return res.status(400).json({ error: "Invalid transaction ID" });
    }

    // Update transaksi
    const updatedTransaction = await Transaction.findOneAndUpdate(
      { _id: transactionId },
      updateData,
      { new: true, runValidators: true }
    );

    // Jika transaksi tidak ditemukan
    if (!updatedTransaction) {
      logger.warn("Transaction not found");
      return res.status(404).json({ error: "Transaction not found" });
    }

    // Mengirimkan transaksi yang sudah diperbarui
    logger.info("Transaction updated successfully", updatedTransaction);
    res.status(200).json(updatedTransaction);
  } catch (error) {
    // Penanganan error yang lebih jelas
    console.error(error);
    logger.error("Error updating transaction", error);
    res
      .status(500)
      .json({ error: "Internal server error", message: error.message });
  }
};

// Delete a transaction by ID
exports.deleteTransaction = async (req, res) => {
  try {
    const deletedTransaction = await Transaction.findByIdAndDelete(
      req.params.id
    );
    if (!deletedTransaction) {
      logger.warn("Transaction not found");
      return res.status(404).json({ error: "Transaction not found" });
    }
    logger.info("Transaction deleted successfully", deletedTransaction);
    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (error) {
    logger.error("Error deleting transaction", error);
    res.status(500).json({ error: error.message });
  }
};
