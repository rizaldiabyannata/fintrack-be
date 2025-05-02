const User = require("../models/user.model");

// Get a single user by ID
exports.getUser = async (req, res) => {
  try {
    const userUid = req.user.uid;
    const user = await User.findOne({ uid: userUid });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user", error });
  }
};

// Update a user by ID
exports.updateUser = async (req, res) => {
  try {
    const userUid = req.user?.uid;
    if (!userUid) {
      return res.status(400).json({ error: "User ID not provided" });
    }

    const user = await User.findOneAndUpdate({ uid: userUid }, req.body, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Error updating user", error });
  }
};

// Delete a user by ID
exports.deleteUser = async (req, res) => {
  const userUid = req.user?.uid;
  if (!userUid) {
    return res.status(400).json({ error: "User ID not provided" });
  }
  try {
    const user = await User.findOneAndDelete({ uid: userUid });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error });
  }
};
