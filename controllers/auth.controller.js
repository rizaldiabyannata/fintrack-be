const logger = require("../utils/logUtils.js");
const User = require("../models/user.model.js");

const loginOrRegister = async (req, res) => {
  const { uid, email, name, token, provider } = req.body;
  console.log("Received request:", token);
  logger.debug("Received token:", token);

  if (!uid) {
    logger.warn("Firebase UID is missing");
    return res.status(400).json({ message: "Firebase UID is missing" });
  }

  try {
    const user = await User.findOne({ uid: uid });

    if (!user) {
      logger.info("User not found, creating a new user");
      await User.create({ uid: uid, email, name, provider });
    } else {
      logger.info("User found, updating last login");
      user.lastLogin = new Date();
      await user.save();
    }

    logger.info("User authenticated successfully");
    res.status(200).json({ message: "Authenticated", user });
  } catch (err) {
    logger.error("Error during login or registration", { error: err });
    res
      .status(500)
      .json({ error: "Something went wrong", details: err.message });
  }
};

module.exports = {
  loginOrRegister,
};
