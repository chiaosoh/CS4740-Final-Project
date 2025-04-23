const fs = require('fs');
const stream = require('stream');
const { promisify } = require('util');
const pipeline = promisify(stream.pipeline);

// AWS
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} = require('@aws-sdk/client-s3');

const awsClient = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});
const AWS_BUCKET = process.env.AWS_BUCKET_NAME;

// GCP
const { Storage } = require('@google-cloud/storage');
const gcsClient = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  keyFilename: process.env.GCS_KEYFILE_PATH
});
const GCS_BUCKET = gcsClient.bucket(process.env.GCS_BUCKET_NAME);

// ------------------------------------------------------------------

const aws = {
  uploadFile: async (file, key) => {
    const fileStream = fs.createReadStream(file.path);
    const command = new PutObjectCommand({
      Bucket: AWS_BUCKET,
      Key: key,
      Body: fileStream
    });
    await awsClient.send(command);
  },

  downloadFile: async (key, filename, res) => {
    const command = new GetObjectCommand({ Bucket: AWS_BUCKET, Key: key });
    const { Body } = await awsClient.send(command);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    await pipeline(Body, res);
  },

  deleteFile: async (key) => {
    const command = new DeleteObjectCommand({ Bucket: AWS_BUCKET, Key: key });
    await awsClient.send(command);
  }
};

// ------------------------------------------------------------------

const gcs = {
  uploadFile: async (file, key) => {
    await GCS_BUCKET.upload(file.path, {
      destination: key
    });
  },

  downloadFile: async (key, filename, res) => {
    const remoteFile = GCS_BUCKET.file(key);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    const gcsStream = remoteFile.createReadStream();
    await pipeline(gcsStream, res);
  },

  deleteFile: async (key) => {
    const remoteFile = GCS_BUCKET.file(key);
    await remoteFile.delete();
  }
};

// ------------------------------------------------------------------

module.exports = {
  uploadFile: async (file, key, provider) => {
    if (provider === 'aws') return aws.uploadFile(file, key);
    if (provider === 'gcp') return gcs.uploadFile(file, key);
    throw new Error(`Unsupported provider: ${provider}`);
  },

  downloadFile: async (provider, key, filename, res) => {
    if (provider === 'aws') return aws.downloadFile(key, filename, res);
    if (provider === 'gcp') return gcs.downloadFile(key, filename, res);
    throw new Error(`Unsupported provider: ${provider}`);
  },

  deleteFile: async (provider, key) => {
    if (provider === 'aws') return aws.deleteFile(key);
    if (provider === 'gcp') return gcs.deleteFile(key);
    throw new Error(`Unsupported provider: ${provider}`);
  }
};