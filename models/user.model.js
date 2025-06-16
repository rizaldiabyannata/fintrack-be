const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
      "Please enter a valid email address",
    ], // Regex untuk validasi email
  },
  password: {
    type: String,
    minlength: 6, // Minimal panjang password
  },
  name: {
    type: String,
    required: true,
  },
  provider: {
    type: String,
    enum: ["google", "email", "facebook", "twitter"],
    default: "email",
  },
  phone: {
    type: String,
    match: [/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number"], // Validasi untuk nomor telepon internasional
  },
  photoURL: {
    type: String,
    default: "",
  },
  company: {
    type: String,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  role: {
    type: String,
    enum: ["user", "admin", "moderator"],
    default: "user",
  },
  refreshToken: {
    // Field baru untuk menyimpan refresh token
    type: [String],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Add pre-save middleware to update updatedAt
userSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

userSchema.index({ email: 1 });

module.exports = mongoose.model("User", userSchema);
