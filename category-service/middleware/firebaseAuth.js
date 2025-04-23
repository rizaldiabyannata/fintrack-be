const admin = require("../config/firebase.config.js");

const verifyFirebaseToken = async (req, res, next) => {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) return res.status(401).json({ message: "Token missing" });

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    console.log("✅ Token berhasil diverifikasi:", decoded.uid); // Tambahkan ini
    req.user = decoded;
    next();
  } catch (err) {
    console.error("❌ Gagal verifikasi token:", err);
    return res.status(403).json({ message: "Invalid token" });
  }
};

module.exports = verifyFirebaseToken;
