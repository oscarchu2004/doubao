const express = require("express");
const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/auth");
const router = express.Router();

// route
router.get("/profile", authMiddleware.authenticate , userController.getUserProfile);
module.exports = router;
