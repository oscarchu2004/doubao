const express = require("express");
const userAuthController = require("../controllers/authController");
const router = express.Router();

// Signup route
router.post("/signup", userAuthController.signupUser);
router.post("/login", userAuthController.loginUser);
router.post("/logout", userAuthController.logoutUser);
router.post("/forgot-password", userAuthController.forgotPassword);

module.exports = router;
