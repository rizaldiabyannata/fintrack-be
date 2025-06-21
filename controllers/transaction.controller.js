const Transaction = require("../models/transaction.model");
const User = require("../models/user.model.js");
const Category = require("../models/category.model.js");
const { createCategory } = require("./category.controller.js");
const logger = require("../utils/logUtils.js");
const mongoose = require("mongoose");

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
    res.status(201).json(`Transaction ${categoryName} created successfully`);
  } catch (error) {
    console.error(error);
    logger.error("Error creating transaction", error);
    res.status(400).json({ error: error.message });
  }
};

exports.getAllTransactions = async (req, res) => {
  try {
    const userUid = req.user?._id;
    if (!userUid) {
      logger.warn("User ID not provided");
      return res.status(404).json({ error: "User id Not Found" });
    }
    const user = await User.findOne({ _id: userUid });

    const { month, year } = req.query;

    const targetMonth = month ? parseInt(month, 10) - 1 : new Date().getMonth();
    const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 1);

    const transactions = await Transaction.find({
      userId: user._id,
      createdAt: {
        $gte: startDate,
        $lt: endDate,
      },
    }).populate("categoryId");

    if (transactions.length === 0) {
      logger.warn("No transactions found for this month");
      return res.status(200).json([]);
    }

    const groupedTransactions = transactions.reduce((acc, transaction) => {
      const transactionDate = transaction.createdAt.toISOString().split("T")[0];
      const transactionObject = transaction.toObject();
      transactionObject.category = transactionObject.categoryId
        ? transactionObject.categoryId.name
        : null;
      delete transactionObject.categoryId;

      if (!acc[transactionDate]) {
        acc[transactionDate] = { transactions: [], income: 0, expense: 0 };
      }

      acc[transactionDate].transactions.push(transactionObject);

      if (transactionObject.type === "income") {
        acc[transactionDate].income += transactionObject.amount;
      } else if (transactionObject.type === "expense") {
        acc[transactionDate].expense += transactionObject.amount;
      }

      return acc;
    }, {});

    const formattedResponse = Object.keys(groupedTransactions).map((date) => ({
      date,
      transactions: groupedTransactions[date].transactions,
      income: groupedTransactions[date].income,
      expense: groupedTransactions[date].expense,
    }));

    logger.info(
      "Transactions grouped by date with income and expense totals",
      formattedResponse
    );
    res.status(200).json(formattedResponse);
  } catch (error) {
    logger.error("Error fetching transactions", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id).populate(
      "categoryId",
      "name"
    );

    if (!transaction) {
      logger.warn("Transaction not found");
      return res.status(404).json({ error: "Transaction not found" });
    }

    const transactionObject = transaction.toObject();

    transactionObject.category = transactionObject.categoryId
      ? transactionObject.categoryId.name
      : null;

    delete transactionObject.categoryId;

    logger.info("Transaction found", transactionObject);

    res.status(200).json(transactionObject);
  } catch (error) {
    logger.error("Error fetching transaction", error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateTransaction = async (req, res) => {
  try {
    const transactionId = req.params.id;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
      logger.warn("Invalid transaction ID");
      return res.status(400).json({ error: "Invalid transaction ID" });
    }

    const updatedTransaction = await Transaction.findOneAndUpdate(
      { _id: transactionId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedTransaction) {
      logger.warn("Transaction not found");
      return res.status(404).json({ error: "Transaction not found" });
    }

    logger.info(`Transaction updated successfully`);
    res.status(200).json(updatedTransaction);
  } catch (error) {
    console.error(error);
    logger.error("Error updating transaction", error);
    res
      .status(500)
      .json({ error: "Internal server error", message: error.message });
  }
};

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
