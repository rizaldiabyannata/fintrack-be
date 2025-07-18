const logger = require("../utils/logUtils.js");
const User = require("../models/user.model.js");
const {
  sendEmailVerificationOTP,
  sendPasswordResetOTP,
  verifyOTP,
  deleteOTP,
} = require("../utils/otpService");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

/**
 * Helper function untuk membuat objek respons pengguna yang konsisten.
 * @param {object} user - Objek user dari database.
 * @param {string} accessToken - JWT Access Token.
 * @param {string} refreshToken - JWT Refresh Token.
 * @returns {object} Objek user yang siap dikirim sebagai respons.
 */
const createAuthResponse = (user, accessToken, refreshToken) => {
  // Menggunakan toObject() untuk mendapatkan plain object dari Mongoose document
  const userObject = user.toObject();

  // Hapus field yang tidak seharusnya dikirim ke client
  delete userObject.password;
  delete userObject.refreshTokens; // Array token tidak perlu dikirim

  return {
    ...userObject,
    accessToken,
    refreshToken,
  };
};

const loginOrRegisterWithGoogle = async (req, res) => {
  const { uid, email, name, provider } = req.user;

  try {
    let user = await User.findOne({ uid });
    let isNewUser = false;

    if (!user) {
      user = await User.create({
        uid,
        email,
        name,
        provider: provider || "google",
        emailVerified: true,
      });
      isNewUser = true;
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    // Simpan refresh token dan last login
    if (!user.refreshTokens) {
      user.refreshTokens = [];
    }
    user.refreshTokens.push(refreshToken);
    user.lastLogin = new Date();
    await user.save();

    const responseUser = createAuthResponse(user, accessToken, refreshToken);

    res.status(isNewUser ? 201 : 200).json({
      message: isNewUser
        ? "User registered and authenticated successfully"
        : "User authenticated successfully",
      user: responseUser,
    });
  } catch (err) {
    logger.error("Error during Google login or registration", err);
    res
      .status(500)
      .json({ error: "Something went wrong", details: err.message });
  }
};

const registerWithEmailPassword = async (req, res) => {
  const { name, email, password } = req.body;

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

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      uid: null,
      email,
      password: hashedPassword,
      name: name || email.split("@")[0],
      provider: "email",
      emailVerified: false,
    });

    await sendEmailVerificationOTP(email);

    // Mengirim respons tanpa token karena perlu verifikasi email dulu
    const userObject = newUser.toObject();
    delete userObject.password;
    delete userObject.refreshTokens;

    res.status(201).json({
      message: "User registered successfully. Please verify your email.",
      user: userObject,
    });
  } catch (err) {
    logger.error("Error during registration", err);
    res
      .status(500)
      .json({ error: "Registration failed", details: err.message });
  }
};

const loginWithEmailPassword = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      logger.warn(`User with email ${email} not found in the database.`);
      return res.status(404).json({ message: "User not found." });
    }

    if (!user.password) {
      return res.status(401).json({
        message: "Please log in with your registered provider (e.g., Google).",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (!user.emailVerified) {
      return res
        .status(403)
        .json({ message: "Please verify your email before logging in." });
    }

    const accessToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    if (!user.refreshTokens) {
      user.refreshTokens = [];
    }

    user.refreshTokens.push(refreshToken);
    user.lastLogin = new Date();
    await user.save();

    const responseUser = createAuthResponse(user, accessToken, refreshToken);

    res.status(200).json({ user: responseUser });
  } catch (err) {
    logger.error("Error during login", err);
    res.status(500).json({ error: "Login failed", details: err.message });
  }
};

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

    // Setelah verifikasi berhasil, langsung loginkan user dan kirim token
    const accessToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    if (!user.refreshTokens) {
      user.refreshTokens = [];
    }

    user.refreshTokens.push(refreshToken);
    await user.save();

    const responseUser = createAuthResponse(user, accessToken, refreshToken);

    res
      .status(200)
      .json({ message: "Email verified successfully", user: responseUser });
  } catch (err) {
    logger.error("Error during email verification", err);
    res
      .status(500)
      .json({ error: "Email verification failed", details: err.message });
  }
};

const resetPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "No user found with this email" });

    await sendPasswordResetOTP(email);
    res.status(200).json({ message: "Password reset OTP sent", otpSent: true });
  } catch (err) {
    logger.error("Error during password reset", err);
    res
      .status(500)
      .json({ error: "Password reset failed", details: err.message });
  }
};

const verifyResetPasswordOTP = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp)
    return res.status(400).json({ message: "Email and OTP are required" });

  try {
    const otpRecord = await verifyOTP(email, otp, "password");
    if (!otpRecord)
      return res.status(400).json({ message: "Invalid or expired OTP" });

    // OTP yang valid hanya digunakan sekali
    await deleteOTP(otpRecord._id);

    res.status(200).json({
      message: "OTP verified, you can now reset your password",
    });
  } catch (err) {
    logger.error("Error during OTP verification", err);
    res
      .status(500)
      .json({ error: "OTP verification failed", details: err.message });
  }
};

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

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);
    user.password = hashedPassword;

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

const resendOTP = async (req, res) => {
  const { email, purpose } = req.body;

  if (!email || !purpose) {
    return res.status(400).json({ message: "Email and purpose are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No user found with this email" });
    }

    if (purpose !== "verification" && purpose !== "password") {
      return res.status(400).json({ message: "Invalid OTP purpose" });
    }

    if (purpose === "verification") {
      await sendEmailVerificationOTP(email);
    } else if (purpose === "password") {
      await sendPasswordResetOTP(email);
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

const refreshAccessToken = async (req, res) => {
  const { token: requestToken } = req.body;

  if (!requestToken) {
    return res.status(401).json({ message: "Refresh Token is required." });
  }

  try {
    const decoded = jwt.verify(requestToken, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decoded.id);

    if (
      !user ||
      !user.refreshTokens ||
      !user.refreshTokens.includes(requestToken)
    ) {
      logger.warn(
        `Invalid or revoked refresh token used for user ID: ${decoded.id}`
      );
      return res.status(403).json({
        message: "Forbidden: Refresh token is not valid or has been revoked.",
      });
    }

    const newAccessToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    logger.info(`Access token refreshed for user: ${user.email}`);

    res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    logger.error(`Error during token refresh: ${error.message}`);
    return res.status(403).json({ message: `Forbidden: ${error.message}` });
  }
};

const logout = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.sendStatus(204);
  }

  try {
    await User.updateOne(
      { refreshTokens: refreshToken },
      { $pull: { refreshTokens: refreshToken } }
    );

    logger.info(`A refresh token was successfully revoked.`);

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    logger.error(`Error during logout process: ${error.message}`);

    res.status(500).json({ message: "An error occurred during logout." });
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
  refreshAccessToken,
  logout,
};
