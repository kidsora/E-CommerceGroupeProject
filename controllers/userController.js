const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};
const sendVerifyMail = async (name, email, user_id) => {
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
    const mailOptions = {
      from: "mohamed666abassi@gmail.com",
      to: email,
      subject: "For Verification mail.",
      html: `<p>Hi ${name}, please click here to <a href="http://localhost:5000/verify?id=${user_id}">Verify</a> your email.</p>`,
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log("Email has been sent: ", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

const loadRegister = async (req, res) => {
  try {
    res.render("users/registration");
  } catch (error) {
    console.log(error);
  }
};

const insertUser = async (req, res) => {
  console.log(req.body);
  try {
    const spassword = await securePassword(req.body.password);
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      mobile: req.body["mobile-num"],
      image: req.file.filename,
      password: spassword,
      is_admin: 0,
    });
    const userData = await user.save();
    if (userData) {
      sendVerifyMail(req.body.name, req.body.email, userData._id);
      res.render("users/registration", {
        message:
          "Your registration has been successfully, Please verify your email.",
      });
    } else {
      res.render("/users/registration", {
        message: "Your registration has been failed.",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const verifyMail = async (req, res) => {
  try {
    const updateInfo = await User.updateOne(
      { _id: req.query.id },
      { $set: { is_verified: 1 } }
    );

    if (updateInfo.modifiedCount > 0) {
      res.render("users/email-verified");
    } else {
      res.render("users/email-verified", {
        message: "Verification failed. Please try again.",
      });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server error");
  }
};
const loginUser = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      const isMatch = await bcrypt.compare(req.body.password, user.password);
      if (isMatch) {
        if (user.is_verified) {
          res.send("Login successful!");
        } else {
          res.send("Please verify your email before logging in.");
        }
      } else {
        res.send("Incorrect password.");
      }
    } else {
      res.send("User not found.");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server error.");
  }
  const token = jwt.sign({ id: user._id }, "your_secret_key", { expiresIn: "1h" });
res.cookie("token", token).send("Login successful!");
};

module.exports = {
  loadRegister,
  insertUser,
  verifyMail,
  loginUser,
};
