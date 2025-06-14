const logger = require("../utils/logUtils.js");
const User = require("../models/user.model.js");
const admin = require("firebase-admin");
const {
  sendEmailVerificationOTP,
  sendPasswordResetOTP,
  verifyOTP,
  deleteOTP,
} = require("../utils/otpService");
const bcrypt = require("bcrypt");

// Google Sign-In / Register
const loginOrRegisterWithGoogle = async (req, res) => {
  const { uid, email, name, token, provider } = req.body;

  if (!uid) {
    logger.warn("Firebase UID is missing");
    return res.status(400).json({ message: "Firebase UID is missing" });
  }

  try {
    let user = await User.findOne({ uid });

    if (!user) {
      user = await User.create({
        uid,
        email,
        name,
        provider: provider || "google",
        emailVerified: true,
      });
    } else {
      user.lastLogin = new Date();
      await user.save();
    }

    res.status(200).json({
      message: "Authenticated",
      user: {
        uid: user.uid,
        email: user.email,
        name: user.name,
        provider: user.provider,
      },
    });
  } catch (err) {
    logger.error("Error during Google login or registration", err);
    res
      .status(500)
      .json({ error: "Something went wrong", details: err.message });
  }
};

// Register user with email/password
const registerWithEmailPassword = async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(409).json({ message: "User already exists" });

    const firebaseUser = await admin.auth().createUser({
      email,
      password,
      displayName: name || email.split("@")[0],
    });

    // Lakukan hash pada kata sandi untuk disimpan dengan aman di database Anda
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      uid: firebaseUser.uid,
      email,
      password: hashedPassword, // Simpan kata sandi yang sudah di-hash
      name: name || email.split("@")[0],
      provider: "email",
      emailVerified: false,
    });

    await sendEmailVerificationOTP(email);
    res
      .status(201)
      .json({ message: "User registered successfully", user: newUser });
  } catch (err) {
    logger.error("Error during registration", err);
    res
      .status(500)
      .json({ error: "Registration failed", details: err.message });
  }
};

// Login user with email/password
const loginWithEmailPassword = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    user.lastLogin = new Date();
    await user.save();

    res.status(200).json({ message: "Login successful", user });
  } catch (err) {
    logger.error("Error during login", err);
    res.status(500).json({ error: "Login failed", details: err.message });
  }
};

// Reset Password Request
const resetPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "No user found with this email" });

    const otp = await sendPasswordResetOTP(email);
    res.status(200).json({ message: "Password reset OTP sent", otpSent: true });
  } catch (err) {
    logger.error("Error during password reset", err);
    res
      .status(500)
      .json({ error: "Password reset failed", details: err.message });
  }
};

// Verify Reset Password OTP
const verifyResetPasswordOTP = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp)
    return res.status(400).json({ message: "Email and OTP are required" });

  try {
    console.log("Verifying OTP for email:", email, "OTP:", otp);
    const otpRecord = await verifyOTP(email, otp, "password");
    if (!otpRecord)
      return res.status(400).json({ message: "Invalid or expired OTP" });

    res.status(200).json({
      message: "OTP verified, you can now reset your password",
      otpId: otpRecord._id.toString(),
    });
    await deleteOTP(otpRecord._id);
  } catch (err) {
    logger.error("Error during OTP verification", err);
    res
      .status(500)
      .json({ error: "OTP verification failed", details: err.message });
  }
};

// Set new password after OTP verification
const setNewPassword = async (req, res) => {
  const { email, new_password } = req.body;

  if (!email || !new_password)
    return res
      .status(400)
      .json({ message: "Email and new password are required" });
  if (new_password.length < 6)
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Perbarui kata sandi di Firebase
    await admin.auth().updateUser(user.uid, { password: new_password });

    // Lakukan hash pada kata sandi baru dan perbarui di database lokal
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);
    user.password = hashedPassword;
    
    user.lastLogin = new Date();
    await user.save();

    res
      .status(200)
      .json({ message: "Password reset successfully, you can now sign in" });
  } catch (err) {
    logger.error("Error during password reset", err);
    res
      .status(500)
      .json({ error: "Password reset failed", details: err.message });
  }
};


// Email Verification
const verifyEmailOTP = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp)
    return res.status(400).json({ message: "Email and OTP are required" });

  try {
    const otpRecord = await verifyOTP(email, otp, "verification");
    if (!otpRecord)
      return res.status(400).json({ message: "Invalid or expired OTP" });

    const user = await User.findOneAndUpdate(
      { email },
      { emailVerified: true, updatedAt: new Date() },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    await deleteOTP(otpRecord._id);
    await admin.auth().updateUser(user.uid, { emailVerified: true });

    res.status(200).json({ message: "Email verified successfully", user });
  } catch (err) {
    logger.error("Error during email verification", err);
    res
      .status(500)
      .json({ error: "Email verification failed", details: err.message });
  }
};

const resendOTP = async (req, res) => {
  const { email, purpose } = req.body;

  // Ensure email and purpose are provided
  if (!email || !purpose) {
    return res.status(400).json({ message: "Email and purpose are required" });
  }

  try {
    // Check if the user exists in the database
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No user found with this email" });
    }

    // Validate the purpose (either email verification or password reset)
    if (purpose !== "verification" && purpose !== "password") {
      return res.status(400).json({ message: "Invalid OTP purpose" });
    }

    // Generate and send the OTP
    let otp;
    if (purpose === "verification") {
      otp = await sendEmailVerificationOTP(email);
    } else if (purpose === "password") {
      otp = await sendPasswordResetOTP(email);
    }

    res.status(200).json({
      message: `${purpose} OTP sent successfully`,
      otpSent: true,
    });
  } catch (err) {
    logger.error("Error during OTP resend", err);
    res.status(500).json({ error: "OTP resend failed", details: err.message });
  }
};

module.exports = {
  loginOrRegisterWithGoogle,
  registerWithEmailPassword,
  loginWithEmailPassword,
  resetPassword,
  verifyResetPasswordOTP,
  setNewPassword,
  verifyEmailOTP,
  resendOTP,
};
