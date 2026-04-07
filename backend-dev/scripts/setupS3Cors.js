require('dotenv').config({ path: '../.env' });
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const corsConfiguration = {
    CORSRules: [
        {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
            AllowedOrigins: [
                'http://localhost:8081',
                'http://localhost:8091',
                'http://localhost:8092',
                'http://localhost:8080',
                'http://localhost:3000',
                'http://localhost:5173',
                '*' // In production, replace with your actual domain
            ],
            ExposeHeaders: [
                'ETag',
                'x-amz-request-id',
                'x-amz-id-2',
                'x-amz-server-side-encryption',
                'x-amz-version-id',
                'Content-Length',
                'Content-Type'
            ],
            MaxAgeSeconds: 3000
        }
    ]
};

async function setupCORS() {
    try {
        const params = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            CORSConfiguration: corsConfiguration
        };

        await s3.putBucketCors(params).promise();
        console.log(`CORS configuration has been set for bucket: ${process.env.AWS_S3_BUCKET_NAME}`);
        
        // Verify the CORS configuration
        const corsResult = await s3.getBucketCors({ Bucket: process.env.AWS_S3_BUCKET_NAME }).promise();
        console.log('Current CORS configuration:', JSON.stringify(corsResult.CORSRules, null, 2));
        
    } catch (error) {
        console.error('Error setting CORS configuration:', error);
    }
}

setupCORS();

