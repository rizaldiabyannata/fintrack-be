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

const verifyFirebaseToken = require("../middleware/firebaseAuth");

// Rute untuk mendapatkan semua anggaran
route.get("/", verifyFirebaseToken, getAllBudgets);

// Rute untuk mendapatkan anggaran berdasarkan bulan (tempatkan di atas rute ID)
route.get("/monthly", verifyFirebaseToken, getBudgetMonthly); // Pastikan /monthly diletakkan pertama

// Rute untuk mendapatkan anggaran berdasarkan ID
route.get("/:id", verifyFirebaseToken, getBudgetById);

// Rute untuk membuat anggaran baru
route.post("/", verifyFirebaseToken, createBudget);

// Rute untuk memperbarui anggaran berdasarkan ID
route.put("/:id", verifyFirebaseToken, updateBudget);

// Rute untuk menghapus anggaran berdasarkan ID
route.delete("/:id", verifyFirebaseToken, deleteBudget);

module.exports = route;
