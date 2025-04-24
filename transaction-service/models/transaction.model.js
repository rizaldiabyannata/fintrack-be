const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: true, // UID Firebase
    },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    note: {
      type: String,
      default: "",
    },
    date: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

transactionSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model("Transaction", transactionSchema);
