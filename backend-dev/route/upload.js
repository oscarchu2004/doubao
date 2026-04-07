const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const authMiddleware = require("../middlewares/auth");

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../upload");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});

const upload = multer({ storage });

// Replace S3 with local save
router.post(
  "/s3",
  authMiddleware.authenticate,
  upload.single("file"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Public URL for accessing the file
    const fileUrl = `/upload/${req.file.filename}`;

    res.json({
      message: "File uploaded successfully",
      url: fileUrl
    });
  }
);

module.exports = router;
