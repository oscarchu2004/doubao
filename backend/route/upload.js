const express = require("express");
const path = require("path");
const multer = require("multer");
const router = express.Router();

const authMiddleware = require("../middlewares/auth");

// 1. Setup storage (save files in backend/uploads)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads")); // saves in backend/uploads
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname); // unique filename
  }
});

const upload = multer({ storage });

// 2. Upload route
router.post(
  "/local",
  authMiddleware.authenticate,
  upload.single("file"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Build public URL
    const fileUrl = `https://shome.hudini.online/uploads/${req.file.filename}`;

    res.json({
      message: "File uploaded successfully to local storage",
      url: fileUrl
    });
  }
);

module.exports = router;
