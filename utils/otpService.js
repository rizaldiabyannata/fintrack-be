const logger = require("../utils/logUtils.js");
const bcrypt = require("bcrypt");
const OtpModel = require("../models/otpModel");
const nodemailer = require("nodemailer");

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // Use Gmail service or other email providers
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(10000 + Math.random() * 9000).toString();
};

// Send OTP via email (generic function)
const sendOTP = async (email, otp, subject, htmlContent) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      html: htmlContent,
    });
    logger.info(`${subject} sent to: ${email}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send OTP email: ${error.message}`);
    throw new Error(`Failed to send OTP: ${error.message}`);
  }
};

// Handle OTP creation (for both email verification and password reset)
const handleOTPGenerationAndEmail = async (
  email,
  purpose,
  otpTemplate,
  subject
) => {
  const plainOTP = generateOTP();

  // Hash the OTP using bcrypt
  const salt = await bcrypt.genSalt(10);
  const hashedOTP = await bcrypt.hash(plainOTP, salt);

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

  // Save OTP to the database (upsert based on email and purpose)
  await OtpModel.findOneAndUpdate(
    { email, purpose },
    { email, otp: hashedOTP, purpose, expiresAt },
    { upsert: true, new: true } // Upsert ensures only one record per purpose (e.g., password or verification)
  );

  // Prepare OTP email content
  const htmlContent = otpTemplate(plainOTP);

  // Send OTP email
  await sendOTP(email, plainOTP, subject, htmlContent);

  return plainOTP;
};

// Send email verification OTP
const sendEmailVerificationOTP = async (email) => {
  return await handleOTPGenerationAndEmail(
    email,
    "verification",
    (otp) => `
      <h2>Email Verification OTP</h2>
      <p>Your verification code is <strong>${otp}</strong></p>
      <p>This code will expire in 10 minutes.</p>
    `,
    "Email Verification - One-Time Password"
  );
};

// Send password reset OTP
const sendPasswordResetOTP = async (email) => {
  return await handleOTPGenerationAndEmail(
    email,
    "password",
    (otp) => `
      <h1>Password Reset OTP</h1>
      <p>Your OTP for password reset is: <strong>${otp}</strong></p>
      <p>This code will expire in 10 minutes.</p>
    `,
    "Password Reset OTP"
  );
};

// Verify OTP
const verifyOTP = async (email, plainOTP, purpose) => {
  try {
    const otpRecords = await OtpModel.find({
      email,
      purpose,
      expiresAt: { $gt: new Date() }, // Only check for non-expired OTPs
    });

    if (otpRecords.length === 0) {
      logger.warn(`No valid OTP found for: ${email}`);
      return null;
    }

    // Check each OTP record for matching OTP
    for (const record of otpRecords) {
      const isMatch = await bcrypt.compare(plainOTP, record.otp);
      if (isMatch) {
        return record;
      }
    }

    logger.warn(`Invalid OTP attempt for: ${email}`);
    return null;
  } catch (error) {
    logger.error(`Error verifying OTP: ${error.message}`);
    throw new Error(`Error verifying OTP: ${error.message}`);
  }
};

// Delete OTP after use
const deleteOTP = async (otpId) => {
  try {
    await OtpModel.deleteOne({ _id: otpId });
    logger.info(`OTP with ID ${otpId} deleted successfully`);
    return true;
  } catch (error) {
    logger.error(`Error deleting OTP: ${error.message}`);
    throw new Error(`Error deleting OTP: ${error.message}`);
  }
};

const sendEmailWithAttachment = async (to, subject, html, attachments) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
      attachments, // Array objek lampiran
    });
    logger.info(`Email with attachment sent to: ${to}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send email with attachment: ${error.message}`);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

module.exports = {
  generateOTP,
  sendEmailVerificationOTP,
  sendPasswordResetOTP,
  verifyOTP,
  deleteOTP,
  sendEmailWithAttachment,
};
