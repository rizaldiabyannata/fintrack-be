const express = require("express");
const route = express.Router();

const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/category.controller");
const verifyFirebaseToken = require("../middleware/firebaseAuth");

route.get("/", verifyFirebaseToken, getAllCategories);
route.get("/:id", verifyFirebaseToken, getCategoryById);
route.post("/", verifyFirebaseToken, createCategory);
route.put("/:id", verifyFirebaseToken, updateCategory);
route.delete("/:id", verifyFirebaseToken, deleteCategory);

module.exports = route;
