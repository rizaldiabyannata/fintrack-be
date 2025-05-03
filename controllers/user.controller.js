const User = require("../models/user.model");
const logger = require("../utils/logUtils.js");

// Get a single user by ID
exports.getUser = async (req, res) => {
  try {
    const userUid = req.user.uid;
    const user = await User.findOne({ uid: userUid });
    if (!user) {
      logger.warn("User not found");
      return res.status(404).json({ message: "User not found" });
    }
    logger.info("User found", user);
    res.status(200).json(user);
  } catch (error) {
    logger.error("Error fetching user", error);
    res.status(500).json({ message: "Error fetching user", error });
  }
};

// Update a user by ID
exports.updateUser = async (req, res) => {
  try {
    const userUid = req.user?.uid;

    if (!userUid) {
      logger.warn("User ID not provided");
      return res.status(400).json({ error: "User ID not provided" });
    }

    // Jika ada file yang di-upload, kita akan menambahkannya ke body
    let userData = { ...req.body };
    if (req.file) {
      // Jika file di-upload, kita masukkan file path ke dalam user data
      userData.photoURL = req.file.path; // Misalnya, simpan path file ke field 'profileImage'
      logger.info(`File uploaded: ${req.file.path}`);
    }

    // Perbarui data pengguna
    const user = await User.findOneAndUpdate({ uid: userUid }, userData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      logger.warn("User not found");
      return res.status(404).json({ message: "User not found" });
    }

    logger.info("User updated successfully", user);
    res.status(200).json({ message: "User updated successfully", user });
  } catch (error) {
    logger.error("Error updating user", error);
    res.status(500).json({ message: "Error updating user", error });
  }
};

// Delete a user by ID
exports.deleteUser = async (req, res) => {
  const userUid = req.user?.uid;
  if (!userUid) {
    logger.warn("User ID not provided");
    return res.status(400).json({ error: "User ID not provided" });
  }
  try {
    const user = await User.findOneAndDelete({ uid: userUid });
    if (!user) {
      logger.warn("User not found");
      return res.status(404).json({ message: "User not found" });
    }
    logger.info("User deleted successfully", user);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    logger.error("Error deleting user", error);
    res.status(500).json({ message: "Error deleting user", error });
  }
};
