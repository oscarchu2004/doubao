const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Ensure uploads folder exists
const uploadPath = path.join(__dirname, '../upload');
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath);
}

// Use disk storage instead of memory
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const fileExtension = file.originalname.split('.').pop();
        const fileName = `${uuidv4()}.${fileExtension}`;
        cb(null, fileName);
    }
});

const upload = multer({ storage: storage });

// Controller (still called uploadToS3 for compatibility)
const uploadToS3 = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Build file URL served from /upload
        const fileUrl = `${req.protocol}://${req.get('host')}/upload/${req.file.filename}`;

        res.status(200).json({
            success: true,
            url: fileUrl,
            key: req.file.filename
        });
    } catch (error) {
        console.error('Local upload error:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
};

module.exports = {
    upload,
    uploadToS3
};
