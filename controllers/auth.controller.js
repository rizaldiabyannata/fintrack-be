const User = require("../models/user.model.js");

const loginOrRegister = async (req, res) => {
  const { uid, email, name, token, provider } = req.body;
  console.log("Received token:", token);

  if (!uid) {
    return res.status(400).json({ message: "Firebase UID is missing" });
  }

  try {
    const user = await User.findOne({ uid: uid });

    if (!user) {
      await User.create({ uid: uid, email, name, provider });
    } else {
      user.lastLogin = new Date();
      await user.save();
    }

    res.status(200).json({ message: "Authenticated", user });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Something went wrong", details: err.message });
  }
};

module.exports = {
  loginOrRegister,
};
