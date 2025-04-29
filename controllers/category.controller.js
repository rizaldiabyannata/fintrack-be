const Category = require("../models/category.model");
const User = require("../models/user.model.js");

const createCategory = async (req, res) => {
  const { name, type, icon } = req.body;
  const userUid = req.user.uid;

  if (!name || !type) {
    return res.status(400).json({ message: "Name and type are required" });
  }

  const user = await User.findOne({ uid: userUid });

  try {
    const newCategory = await Category.create({
      name,
      type,
      icon,
      userId: user._id,
    });

    res.status(201).json(newCategory);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
};
const getAllCategories = async (req, res) => {
  const userUid = req.user.uid;
  try {
    const user = await User.findOne({ uid: userUid });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const categories = await Category.find({ userId: user._id });
    res.status(200).json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

const getCategoryById = async (req, res) => {
  const { id } = req.params;

  try {
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, type, icon } = req.body;

  try {
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { name, type, icon },
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json(updatedCategory);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

const deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
