const Transaction = require("../models/transaction.model");
const User = require("../models/user.model.js");
const Category = require("../models/category.model.js");
const { createCategory } = require("./category.controller.js");

// Create a new transaction
exports.createTransaction = async (req, res) => {
  const { category: categoryName, type, amount, description, date } = req.body;
  const userUid = req.user.uid;

  if (!userUid || !categoryName || !type || !amount) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const user = await User.findOne({ uid: userUid });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let category = await Category.findOne({ name: categoryName });
    if (!category) {
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
    res.status(201).json(savedTransaction);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

// Get all transactions
exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find().populate("userUid category");
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single transaction by ID
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id).populate(
      "userUid category"
    );
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    res.status(200).json(transaction);
  } catch (error) {
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
      return res.status(404).json({ error: "Transaction not found" });
    }

    // Mengirimkan transaksi yang sudah diperbarui
    res.status(200).json(updatedTransaction);
  } catch (error) {
    // Penanganan error yang lebih jelas
    console.error(error);
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
      return res.status(404).json({ error: "Transaction not found" });
    }
    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
