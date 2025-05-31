const express = require("express");
const {
  loginOrRegisterWithGoogle,
  registerWithEmailPassword,
  loginWithEmailPassword,
  resetPassword,
  verifyResetPasswordOTP,
  setNewPassword,
  verifyEmailOTP,
  resendOTP,
} = require("../controllers/auth.controller.js");

const verifyFirebaseToken = require("../middleware/firebaseAuth.js");

const admin = require("../config/firebase.config.js");

const router = express.Router();

// Google Sign-In / Register (OAuth)
router.post("/google", verifyFirebaseToken, loginOrRegisterWithGoogle);

// Email/Password Authentication Routes
router.post("/register", registerWithEmailPassword); // Register user with email/password
router.post("/login", loginWithEmailPassword); // Login user with email/password

// Password Reset Routes
router.post("/reset-password", resetPassword); // Request password reset OTP
router.post("/verify-reset-password-otp", verifyResetPasswordOTP); // Verify password reset OTP
router.post("/set-new-password", setNewPassword); // Set new password after OTP verification

// Email Verification Routes
router.post("/verify-email-otp", verifyEmailOTP); // Verify email verification OTP

router.post("/resend-verification", resendOTP);

// Test endpoint (optional)
router.get("/test", (req, res) => {
  res.send("Auth Service is reachable");
});

router.get("/get-token", (req, res) => {
  // Simulasikan pengguna yang sudah ada (gunakan UID pengguna yang Anda inginkan)
  const uid = "Naj3FebfBbZ9S8cnZ4wxRUrl5hD3";
  admin
    .auth()
    .createCustomToken(uid)
    .then((customToken) => {
      res.send({ token: customToken });
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

module.exports = router;
