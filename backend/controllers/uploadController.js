const AWS = require('aws-sdk');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const uploadToS3 = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileExtension = req.file.originalname.split('.').pop();
        const fileName = `${uuidv4()}.${fileExtension}`;

        const params = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: fileName,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
            ACL: 'public-read',
            CacheControl: 'max-age=31536000'
        };

        const uploadResult = await s3.upload(params).promise();

        res.status(200).json({
            success: true,
            url: uploadResult.Location,
            key: uploadResult.Key
        });
    } catch (error) {
        console.error('S3 upload error:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
};

module.exports = {
    upload,
    uploadToS3
};