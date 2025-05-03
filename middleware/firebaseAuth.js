const admin = require("../config/firebase.config.js");
const logger = require("../utils/logUtils.js");

const verifyFirebaseToken = async (req, res, next) => {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) {
    logger.warn("❌ Token not provided");
    return res.status(401).json({ message: "Token missing" });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    logger.info("✅ Token verified successfully", decoded);
    req.user = decoded;
    next();
  } catch (err) {
    logger.error("❌ Gagal verifikasi token:", err);
    return res.status(403).json({ message: "Invalid token" });
  }
};

module.exports = verifyFirebaseToken;
