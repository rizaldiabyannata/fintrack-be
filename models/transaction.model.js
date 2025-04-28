const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userUid: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  amount: { type: Number, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  type: { type: String, enum: ["income", "expense"], required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
  updateAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Transaction", transactionSchema);
