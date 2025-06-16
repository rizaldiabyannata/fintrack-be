const express = require("express");
const route = express.Router();

const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/category.controller");
// Ganti middleware
const verifyAuthToken = require("../middleware/verifyAuthToken.js"); // Asumsi nama file middleware baru

// Gunakan verifyAuthToken untuk semua rute kategori
route.get("/", verifyAuthToken, getAllCategories);
route.get("/:id", verifyAuthToken, getCategoryById);
route.post("/", verifyAuthToken, createCategory);
route.put("/:id", verifyAuthToken, updateCategory);
route.delete("/:id", verifyAuthToken, deleteCategory);

module.exports = route;