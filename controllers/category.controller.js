const Category = require("../models/category.model");
const User = require("../models/user.model.js");
const logger = require("../utils/logUtils.js");

const createCategory = async (req, res) => {
  const { name, type, icon } = req.body;
  const userUid = req.user?._id;

  if (!name || !type) {
    logger.warn("Name and type are required");
    return res.status(400).json({ message: "Name and type are required" });
  }

  const user = await User.findOne({ _id: userUid });

  if (!user) {
    logger.warn("User not found");
    return res.status(404).json({ message: "User not found" });
  }

  if (await Category.findOne({ name, userId: user._id })) {
    logger.warn("Category already exists");
    return res.status(400).json({ message: "Category already exists" });
  }

  try {
    const newCategory = await Category.create({
      name,
      type,
      icon,
      userId: user._id,
    });
    logger.info("Category created successfully", newCategory);
    res.status(201).json(newCategory);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

const getAllCategories = async (req, res) => {
  const userUid = req.user?._id;
  if (!userUid) {
    logger.warn("User ID not provided");
    return res.status(400).json({ error: "User ID not provided" });
  }
  try {
    const user = await User.findOne({ _id: userUid });
    if (!user) {
      logger.warn("User not found");
      return res.status(404).json({ message: "User not found" });
    }
    const categories = await Category.find({ userId: user._id });
    if (!categories) {
      logger.warn("No categories found");
      return res.status(404).json({ message: "No categories found" });
    }
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
      logger.warn("Category not found");
      return res.status(404).json({ message: "Category not found" });
    }

    logger.info("Category found", category);
    res.status(200).json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

const updateCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const updatedCategory = await Category.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedCategory) {
      logger.warn("Category not found");
      return res.status(404).json({ message: "Category not found" });
    }

    logger.info("Category updated successfully", updatedCategory);
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
      logger.warn("Category not found");
      return res.status(404).json({ message: "Category not found" });
    }

    logger.info("Category deleted successfully", deletedCategory);
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
