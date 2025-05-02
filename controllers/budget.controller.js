const Budget = require("../models/budget.model");
const Category = require("../models/category.model");
const User = require("../models/user.model");
const Transaction = require("../models/transaction.model");

const handleError = (
  res,
  error,
  message = "An error occurred",
  status = 500
) => {
  console.error(error);
  res.status(status).json({ message, error });
};

const findCategoryByName = async (name, userId) => {
  return await Category.findOne({ name, userId });
};

const remainingBudgets = (budgets) => {
  const currentDate = new Date();
  return budgets.filter((budget) => new Date(budget.endDate) > currentDate);
};

exports.createBudget = async (req, res) => {
  const { category, amountLimit } = req.body;
  const userUid = req.user.uid;

  if (!userUid || !category || !amountLimit) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const user = await User.findOne({ uid: userUid });
    if (!user) return res.status(404).json({ message: "User not found" });

    const categoryData = await findCategoryByName(category, user._id);
    if (!categoryData)
      return res.status(404).json({ message: "Category not found" });

    const budget = new Budget({
      userId: user._id,
      category: categoryData._id,
      amountLimit,
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    });

    await budget.save();
    res.status(201).json({ message: "Budget created successfully", budget });
  } catch (error) {
    handleError(res, error, "Error creating budget");
  }
};

exports.getAllBudgets = async (req, res) => {
  const userUid = req.user?.uid;
  if (!userUid) return res.status(404).json({ message: "User id Not Found" });
  const user = await User.findOne({ uid: userUid });
  console.log("user", user);
  if (!user) return res.status(404).json({ message: "User not found" });
  try {
    const budgets = await Budget.find({ userId: user._id }).populate(
      "createdAt"
    );
    res.status(200).json(budgets);
  } catch (error) {
    handleError(res, error, "Error fetching budgets");
  }
};

exports.getBudgetMonthly = async (req, res) => {
  const { month } = req.query;
  const userUid = req.user?.uid;

  if (!userUid || !month) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const startOfMonth = new Date(month);
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(startOfMonth.getMonth() + 1);

    const user = await User.findOne({ uid: userUid });
    if (!user) return res.status(404).json({ message: "User not found" });

    const budgets = await Budget.find({
      userId: user._id,
      startDate: { $lte: endOfMonth },
      endDate: { $gte: startOfMonth },
    });

    if (!budgets.length) {
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
      const spentAmount = transactions
        .filter(
          (transaction) =>
            transaction.categoryId.toString() === budget.category.toString()
        )
        .reduce((acc, transaction) => acc + transaction.amount, 0);

      const remainingAmount = budget.amountLimit - spentAmount;
      const percentage = (remainingAmount / budget.amountLimit) * 100;

      return {
        ...budget._doc,
        spentAmount,
        remainingAmount,
        percentage,
      };
    });

    res.status(200).json({ totalBudget, totalExpense, remainingBudgetList });
  } catch (error) {
    handleError(res, error, "Error calculating budget");
  }
};

exports.getBudgetById = async (req, res) => {
  const { id } = req.params;
  const userUid = req.user?.uid;

  if (!userUid) {
    return res.status(400).json({ message: "User id not found" });
  }

  try {
    const budget = await Budget.findById(id);
    if (!budget) return res.status(404).json({ message: "Budget not found" });

    const user = await User.findOne({ uid: userUid });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (budget.userId.toString() !== user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to view this budget" });
    }

    const startOfBudget = new Date(budget.startDate);
    const endOfBudget = new Date(budget.endDate);

    const transactions = await Transaction.find({
      userId: user._id,
      categoryId: budget.category,
      createdAt: { $gte: startOfBudget, $lte: endOfBudget },
    });

    const budgetData = {
      ...budget._doc,
      transactions,
    };

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
    if (!budget) return res.status(404).json({ message: "Budget not found" });

    res.status(200).json({ message: "Budget updated successfully", budget });
  } catch (error) {
    handleError(res, error, "Error updating budget");
  }
};

exports.deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findByIdAndDelete(req.params.id);
    if (!budget) return res.status(404).json({ message: "Budget not found" });

    res.status(200).json({ message: "Budget deleted successfully" });
  } catch (error) {
    handleError(res, error, "Error deleting budget");
  }
};

exports.budgetCalculation = async (req, res) => {
  const { userUid, category } = req.body;

  if (!userUid || !category) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const budgets = await Budget.find({ userUid, category });

    if (!budgets.length)
      return res.status(404).json({ message: "No budgets found" });

    const totalBudget = budgets.reduce(
      (acc, budget) => acc + budget.amountLimit,
      0
    );

    const remainingBudgetList = remainingBudgets(budgets);

    res.status(200).json({ totalBudget, remainingBudgetList });
  } catch (error) {
    handleError(res, error, "Error calculating budget");
  }
};
