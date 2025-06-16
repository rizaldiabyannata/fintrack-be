const express = require("express");
const route = express.Router();

const {
  getAllBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetMonthly,
} = require("../controllers/budget.controller");
// Ganti middleware
const verifyAuthToken = require("../middleware/verifyAuthToken.js"); // Asumsi nama file middleware baru

// Rute untuk mendapatkan semua anggaran
route.get("/", verifyAuthToken, getAllBudgets);

// Rute untuk mendapatkan anggaran berdasarkan bulan (tempatkan di atas rute ID)
route.get("/monthly", verifyAuthToken, getBudgetMonthly);

// Rute untuk mendapatkan anggaran berdasarkan ID
route.get("/:id", verifyAuthToken, getBudgetById);

// Rute untuk membuat anggaran baru
route.post("/", verifyAuthToken, createBudget);

// Rute untuk memperbarui anggaran berdasarkan ID
route.put("/:id", verifyAuthToken, updateBudget);

// Rute untuk menghapus anggaran berdasarkan ID
route.delete("/:id", verifyAuthToken, deleteBudget);

module.exports = route;