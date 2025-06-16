// middleware/verifyAuthToken.js
const jwt = require('jsonwebtoken');
const User = require('../models/user.model.js');
const logger = require('../utils/logUtils.js');

const verifyAuthToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn("Authorization token missing or malformed");
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ambil user dari DB berdasarkan _id dari payload token
    const user = await User.findById(decoded.id).select('-password'); // Jangan sertakan password
    if (!user) {
        logger.warn(`User with ID ${decoded.id} not found.`);
        return res.status(401).json({ message: 'Invalid token - user not found.' });
    }

    req.user = user; // Sisipkan seluruh dokumen user dari DB ke req.user
    next();
  } catch (ex) {
    logger.error("Invalid token:", ex);
    res.status(400).json({ message: "Invalid token." });
  }
};

module.exports = verifyAuthToken;