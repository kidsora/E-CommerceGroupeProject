const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const speakeasy = require("speakeasy");

const securePassword = async (password) => {
  try {
    return await bcrypt.hash(password, 10);
  } catch (error) {
    console.log(error.message);
    throw new Error("Error hashing password");
  }
};

const sendEmail = async (emailOptions) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail(emailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.log("Email sending error:", error.message);
  }
};

const sendVerifyMail = async (name, email, user_id) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verify Your Email",
    html: `<p>Hi ${name}, please verify your email by clicking <a href="http://localhost:5000/api/user/verify?id=${user_id}">here</a>.</p>`,
  };
  await sendEmail(mailOptions);
};

const insertUser = async (req, res) => {
  try {
    const { name, email, password, mobile } = req.body;
    if (!name || !email || !password || !mobile || !req.file) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const spassword = await securePassword(password);
    const user = new User({
      name,
      email,
      mobile,
      image: req.file.filename,
      password: spassword,
      is_admin: false,
    });

    const userData = await user.save();
    if (userData) {
      await sendVerifyMail(name, email, userData._id);
      return res.status(201).json({
        message: "Registration successful. Please verify your email.",
      });
    } else {
      return res.status(500).json({ message: "Registration failed." });
    }
  } catch (error) {
    console.log("Registration error:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

const verifyMail = async (req, res) => {
  try {
    const updateInfo = await User.updateOne(
      { _id: req.query.id },
      { $set: { is_verified: true } }
    );

    if (updateInfo.modifiedCount > 0) {
      return res.status(200).json({ message: "Email verified successfully." });
    } else {
      return res
        .status(400)
        .json({ message: "Verification failed. Please try again." });
    }
  } catch (error) {
    console.log("Email verification error:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Incorrect password." });

    if (!user.is_verified) {
      return res
        .status(403)
        .json({ message: "Please verify your email before logging in." });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({ message: "Login successful.", token });
  } catch (error) {
    console.log("Login error:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token)
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ message: "Invalid token." });
  }
};

const logoutUser = (req, res) => {
  res.status(200).json({ message: "Logged out successfully!" });
};

const sendResetPasswordEmail = async (name, email, token) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Reset Your Password",
    html: `<p>Hi ${name}, please reset your password by clicking <a href="http://localhost:5000/user/reset-password?token=${token}">here</a>.</p>`,
  };
  await sendEmail(mailOptions);
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const token = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    await sendResetPasswordEmail(user.name, user.email, token);
    res.status(200).json({ message: "Reset password email sent." });
  } catch (error) {
    console.log("Forgot password error:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

const handleResetPasswordLink = async (req, res) => {
  try {
    const { token } = req.query;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      console.log("Invalid or expired token:", token);
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    const newToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    console.log("Password reset successful for user:", user.email);

    res
      .status(200)
      .json({ message: "Password reset successful.", token: newToken });
  } catch (error) {
    console.log("Reset password error:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });
    }

    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const hashedPassword = await securePassword(newPassword);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password reset successful." });
  } catch (error) {
    console.log("Reset password error:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    res.status(200).json(user);
  } catch (error) {
    console.log("Get profile error:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const { name, mobile } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.name = name || user.name;
    user.mobile = mobile || user.mobile;

    if (req.file) {
      user.image = req.file.filename;
    }

    await user.save();
    res.status(200).json({ message: "Profile updated successfully.", user });
  } catch (error) {
    console.log("Update profile error:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

const enable2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const secret = speakeasy.generateSecret({ length: 20 });
    user.twoFASecret = secret.base32;
    await user.save();

    res.status(200).json({ secret: secret.base32 });
  } catch (error) {
    console.log("Enable 2FA error:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

const verify2FA = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user.id);

    const verified = speakeasy.totp.verify({
      secret: user.twoFASecret,
      encoding: "base32",
      token,
    });

    if (verified) {
      res.status(200).json({ message: "2FA verification successful." });
    } else {
      res.status(400).json({ message: "Invalid token." });
    }
  } catch (error) {
    console.log("Verify 2FA error:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    console.log("Get all users error:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    console.log("Delete user error:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

module.exports = {
  insertUser,
  verifyMail,
  loginUser,
  authenticate,
  logoutUser,
  forgotPassword,
  handleResetPasswordLink,
  resetPassword,
  getUserProfile,
  updateUserProfile,
  enable2FA,
  verify2FA,
  getAllUsers,
  deleteUser,
};
