const express = require("express");
const user_route = express.Router();
const userController = require("../controllers/userController");
const multer = require("multer");
const { authenticate } = require("../controllers/userController");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/userImages");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

user_route.use(express.json());
user_route.use(express.urlencoded({ extended: true }));

user_route.post("/register", upload.single("image"), userController.insertUser);

user_route.get("/verify", userController.verifyMail);

user_route.post("/login", userController.loginUser);

user_route.get("/dashboard", authenticate, (req, res) => {
  res.json({ message: "Welcome to the dashboard!", user: req.user });
});

user_route.post("/logout", userController.logoutUser);

user_route.post("/forgot-password", userController.forgotPassword);

user_route.post("/reset-password", userController.resetPassword);

user_route.get("/profile", authenticate, userController.getUserProfile);

user_route.put("/profile", authenticate, upload.single("image"), userController.updateUserProfile);

user_route.post("/enable-2fa", authenticate, userController.enable2FA);

user_route.post("/verify-2fa", authenticate, userController.verify2FA);

user_route.get("/admin/users", authenticate, userController.getAllUsers);

user_route.delete("/admin/users/:id", authenticate, userController.deleteUser);

module.exports = user_route;
