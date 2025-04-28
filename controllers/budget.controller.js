const Budget = require("../models/budget.model");

// Create a new budget
exports.createBudget = async (req, res) => {
  const { userUid, category, amountLimit } = req.body;
  if (!userUid || !category || !amountLimit) {
    return res.status(400).json({ message: "All fields are required" });
  }
  try {
    const budget = new Budget({
      userUid,
      category,
      amountLimit,
      startDate: new Date(),
      endDate: new Date().setMonth(new Date().getMonth() + 1),
    });
    await budget.save();
    res.status(201).json({ message: "Budget created successfully", budget });
  } catch (error) {
    res.status(500).json({ message: "Error creating budget", error });
  }
};

// Get all budgets
exports.getAllBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find();
    res.status(200).json(budgets);
  } catch (error) {
    res.status(500).json({ message: "Error fetching budgets", error });
  }
};

exports.getBudgetMonthly = async (req, res) => {
  try {
    const { userUid, category, month } = req.body;

    if (!userUid || !category || !month) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const startOfMonth = new Date(month);
    const endOfMonth = new Date(month);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);

    const budgets = await Budget.find({
      userUid,
      category,
      startDate: { $lte: endOfMonth },
      endDate: { $gte: startOfMonth },
    });

    if (budgets.length === 0) {
      return res.status(404).json({ message: "No budgets found" });
    }

    const totalBudget = budgets.reduce(
      (acc, budget) => acc + budget.amountLimit,
      0
    );

    res.status(200).json({
      totalBudget,
      budgets,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error calculating budget", error: err });
  }
};

// Get a single budget by ID
exports.getBudgetById = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);
    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }
    res.status(200).json(budget);
  } catch (error) {
    res.status(500).json({ message: "Error fetching budget", error });
  }
};

// Update a budget by ID
exports.updateBudget = async (req, res) => {
  try {
    const budget = await Budget.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }
    res.status(200).json({ message: "Budget updated successfully", budget });
  } catch (error) {
    res.status(500).json({ message: "Error updating budget", error });
  }
};

// Delete a budget by ID
exports.deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findByIdAndDelete(req.params.id);
    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }
    res.status(200).json({ message: "Budget deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting budget", error });
  }
};

exports.budgetCalculation = async (req, res) => {
  try {
    const { userUid, category } = req.body;

    if (!userUid || !category) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const budgets = await Budget.find({
      userUid,
      category,
    });

    if (budgets.length === 0) {
      return res.status(404).json({ message: "No budgets found" });
    }

    const totalBudget = budgets.reduce(
      (acc, budget) => acc + budget.amountLimit,
      0
    );
    const currentDate = new Date();
    const remainingBudgets = budgets.filter(
      (budget) => new Date(budget.endDate) > currentDate
    );

    res.status(200).json({
      totalBudget,
      remainingBudgets,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error calculating budget", error: err });
  }
};
