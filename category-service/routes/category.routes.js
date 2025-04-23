const express = require("express");
const {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryById,
} = require("../controllers/category.controller.js");
const verifyFirebaseToken = require("../middleware/firebaseAuth.js");

const route = express.Router();

// Route untuk mendapatkan semua kategori
route.get("/categories", verifyFirebaseToken, getAllCategories);
// Route untuk membuat kategori baru
route.post("/categories", verifyFirebaseToken, createCategory);
// Route untuk memperbarui kategori berdasarkan ID
route.put("/categories/:id", verifyFirebaseToken, updateCategory);
// Route untuk menghapus kategori berdasarkan ID
route.delete("/categories/:id", verifyFirebaseToken, deleteCategory);
// Route untuk mendapatkan kategori berdasarkan ID
route.get("/categories/:id", verifyFirebaseToken, getCategoryById);

module.exports = route;
