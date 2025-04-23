const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["income", "expense"],
    required: true,
  },
  icon: {
    type: String,
    required: false,
    default: "",
  },
});

const Category = mongoose.model("Category", categorySchema);
module.exports = Category;
