const Transaction = require("../models/transaction.model");
const User = require("../models/user.model.js");
const Category = require("../models/category.model.js");
const { createCategory } = require("./category.controller.js");
const logger = require("../utils/logUtils.js");
const mongoose = require("mongoose");
const { Parser } = require("json2csv");
const { sendEmailWithAttachment } = require("../utils/otpService.js");

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

exports.exportTransactionsByEmail = async (req, res) => {
  const user = req.user; // Diambil dari middleware verifyAuthToken

  try {
    // 1. Ambil semua data transaksi pengguna dari database
    const transactions = await Transaction.find({ userId: user._id })
      .populate("categoryId", "name")
      .sort({ createdAt: "asc" });

    if (transactions.length === 0) {
      logger.info(`No transactions to export for user ${user.email}.`);
      return res
        .status(404)
        .json({ message: "Anda tidak memiliki transaksi untuk diekspor." });
    }

    // 2. Lakukan kalkulasi ringkasan
    let totalIncome = 0;
    let totalExpense = 0;
    transactions.forEach((tx) => {
      if (tx.type === "income") totalIncome += tx.amount;
      if (tx.type === "expense") totalExpense += tx.amount;
    });

    // 3. Siapkan data untuk CSV
    // Bagian Ringkasan
    const summaryData = [
      { field: "Total Pemasukan", value: totalIncome },
      { field: "Total Pengeluaran", value: totalExpense },
      { field: "Saldo Akhir", value: totalIncome - totalExpense },
    ];

    // Bagian Daftar Transaksi
    const transactionList = transactions.map((tx) => ({
      Tanggal: tx.createdAt.toISOString().split("T")[0],
      Kategori: tx.categoryId ? tx.categoryId.name : "Uncategorized",
      Tipe: tx.type,
      Jumlah: tx.amount,
      Deskripsi: tx.description || "-",
    }));

    // 4. Buat konten CSV dari data
    const summaryCsv = new Parser({ header: false }).parse(summaryData);
    const transactionCsv = new Parser().parse(transactionList);

    // Gabungkan kedua bagian menjadi satu file CSV
    const finalCsv = `RINGKASAN KESELURUHAN\n${summaryCsv}\n\nDAFTAR TRANSAKSI\n${transactionCsv}`;

    // 5. Kirim email dengan lampiran CSV
    const fileName = `Fintrack_Laporan_Keseluruhan.csv`;
    const subject = `Laporan Keuangan Fintrack Anda (Keseluruhan)`;
    const htmlBody = `
      <p>Halo ${user.name},</p>
      <p>Terima kasih telah meminta laporan keuangan Anda. Berikut terlampir laporan keuangan keseluruhan dalam format CSV.</p>
      <br>
      <p>Salam,</p>
      <p>Tim Fintrack</p>
    `;

    await sendEmailWithAttachment(user.email, subject, htmlBody, [
      {
        filename: fileName,
        content: finalCsv,
        contentType: "text/csv",
      },
    ]);

    logger.info(`Financial report sent to ${user.email}`);
    res.status(200).json({
      message: `Laporan keuangan telah berhasil dikirim ke email Anda: ${user.email}`,
    });
  } catch (error) {
    logger.error("Error during synchronous export of transactions", error);
    res
      .status(500)
      .json({ error: "Gagal mengekspor transaksi.", details: error.message });
  }
};
