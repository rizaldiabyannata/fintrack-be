const Budget = require("../models/budget.model");
const Category = require("../models/category.model");
const User = require("../models/user.model");
const Transaction = require("../models/transaction.model");
const logger = require("../utils/logUtils");

const handleError = (
  res,
  error,
  message = "An error occurred",
  status = 500
) => {
  if (process.env.NODE_ENV === "development") {
    logger.error(`${message}: ${error.message}`);
  }
  res.status(status).json({ message, error });
};

const findCategoryByName = async (name, userId) => {
  return await Category.findOne({ name, userId });
};

exports.createBudget = async (req, res) => {
  const { category, amountLimit } = req.body;
  const userUid = req.user?._id;

  if (!userUid || !category || !amountLimit) {
    logger.warn("Missing required fields");
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const user = await User.findOne({ _id: userUid });
    if (!user) {
      logger.warn("User not found");
      return res.status(404).json({ message: "User not found" });
    }

    // PENGGUNAAN 1: Nama kategori dari request digunakan untuk mencari ID kategori di database.
    const categoryData = await findCategoryByName(category, user._id);
    if (!categoryData) {
      logger.warn("Category not found");
      return res.status(404).json({ message: "Category not found" });
    }

    const budget = new Budget({
      userId: user._id,
      // PENGGUNAAN 2: ID kategori yang ditemukan disimpan ke dalam budget baru.
      category: categoryData._id,
      amountLimit,
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    });

    await budget.save();
    logger.info("Budget created successfully", budget);
    res.status(201).json({ message: "Budget created successfully" });
  } catch (error) {
    handleError(res, error, "Error creating budget");
  }
};

exports.getAllBudgets = async (req, res) => {
  const userUid = req.user?._id;
  if (!userUid) {
    logger.warn("User id Not Found");
    return res.status(404).json({ message: "User id Not Found" });
  }
  const user = await User.findOne({ _id: userUid });
  if (!user) {
    logger.warn("User not found");
    return res.status(404).json({ message: "User not found" });
  }
  try {
    // PENGGUNAAN 3: .populate() digunakan untuk mengambil detail kategori (dalam hal ini 'name')
    // dan menyertakannya langsung dalam respons. Ini memperkaya data budget.
    const budgets = await Budget.find({ userId: user._id }).populate(
      "category",
      "name"
    );

    logger.info("Budgets fetched successfully", budgets);
    res.status(200).json(budgets);
  } catch (error) {
    handleError(res, error, "Error fetching budgets");
  }
};

exports.getBudgetMonthly = async (req, res) => {
  const { month } = req.query;
  const userUid = req.user?._id;

  if (!userUid || !month) {
    logger.warn("Missing required fields");
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const startOfMonth = new Date(month);
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(startOfMonth.getMonth() + 1);

    const user = await User.findOne({ _id: userUid });
    if (!user) {
      logger.warn("User not found");
      return res.status(404).json({ message: "User not found" });
    }

    // Mengambil data budget dan mem-populate nama kategori.
    const budgets = await Budget.find({
      userId: user._id,
      startDate: { $lte: endOfMonth },
      endDate: { $gte: startOfMonth },
    }).populate("category", "name");

    if (!budgets.length) {
      logger.warn("No budgets found for the specified month");
      return res.status(404).json({ message: "No budgets found" });
    }

    const transactions = await Transaction.find({
      userId: user._id,
      createdAt: { $gte: startOfMonth, $lt: endOfMonth },
    });

    const totalExpense = transactions.reduce((acc, transaction) => {
      if (transaction.type === "expense") {
        acc += transaction.amount;
      }
      return acc;
    }, 0);

    const totalBudget = budgets.reduce(
      (acc, budget) => acc + budget.amountLimit,
      0
    );

    const remainingBudgetList = budgets.map((budget) => {
      // PENGGUNAAN 4: ID Kategori dari budget yang sudah di-populate
      // digunakan untuk memfilter dan menjumlahkan transaksi yang relevan.
      const spentAmount = transactions
        .filter(
          (transaction) =>
            budget.category &&
            transaction.categoryId.toString() === budget.category._id.toString()
        )
        .reduce((acc, transaction) => acc + transaction.amount, 0);

      const remainingAmount = budget.amountLimit - spentAmount;
      const percentage = (remainingAmount / budget.amountLimit) * 100;

      return {
        ...budget._doc,
        // PENGGUNAAN 5: Nama kategori yang sudah di-populate ditambahkan ke objek respons.
        categoryName: budget.category ? budget.category.name : null,
        spentAmount,
        remainingAmount,
        percentage,
      };
    });

    logger.info("Budgets fetched successfully", remainingBudgetList);

    res.status(200).json({ totalBudget, totalExpense, remainingBudgetList });
  } catch (error) {
    handleError(res, error, "Error calculating budget");
  }
};

exports.getBudgetById = async (req, res) => {
  const { id } = req.params;
  const userUid = req.user?._id;

  if (!userUid) {
    logger.warn("User id not found");
    return res.status(400).json({ message: "User id not found" });
  }

  try {
    // Melakukan populate pada field 'category' untuk mendapatkan detailnya
    const budget = await Budget.findById(id).populate("category", "name icon");

    if (!budget) {
      logger.warn("Budget not found");
      return res.status(404).json({ message: "Budget not found" });
    }

    const user = await User.findOne({ _id: userUid });
    if (!user) {
      logger.warn("User not found");
      return res.status(404).json({ message: "User not found" });
    }

    if (budget.userId.toString() !== user._id.toString()) {
      logger.warn("User not authorized to view this budget");
      return res
        .status(403)
        .json({ message: "You are not authorized to view this budget" });
    }

    const startOfBudget = new Date(budget.startDate);
    const endOfBudget = new Date(budget.endDate);

    // PENGGUNAAN 6: Objek 'category' dari budget digunakan sebagai filter
    // untuk mencari semua transaksi yang terkait dengan kategori tersebut.
    const transactions = await Transaction.find({
      userId: user._id,
      categoryId: budget.category,
      createdAt: { $gte: startOfBudget, $lte: endOfBudget },
    });

    const budgetData = {
      ...budget._doc,
      transactions,
    };

    logger.info("Budget fetched successfully", budgetData);

    res.status(200).json(budgetData);
  } catch (error) {
    handleError(res, error, "Error fetching budget");
  }
};

exports.updateBudget = async (req, res) => {
  try {
    const budget = await Budget.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!budget) {
      logger.warn("Budget not found");
      return res.status(404).json({ message: "Budget not found" });
    }
    logger.info("Budget updated successfully", budget);
    res.status(200).json({ message: "Budget updated successfully", budget });
  } catch (error) {
    handleError(res, error, "Error updating budget");
  }
};

exports.deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findByIdAndDelete(req.params.id);
    if (!budget) {
      logger.warn("Budget not found");
      return res.status(404).json({ message: "Budget not found" });
    }

    logger.info("Budget deleted successfully", budget);
    res.status(200).json({ message: "Budget deleted successfully" });
  } catch (error) {
    handleError(res, error, "Error deleting budget");
  }
};
