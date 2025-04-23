const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { File } = require('../models');
const storageService = require('../services/storageService');

const router = express.Router();
const upload = multer({ dest: path.join(__dirname, '..', 'tmp') });

// Simulate multiple providers
const providers = ['aws', 'gcp']; //TODO: add 3rd provider?

function chooseRandomProvider() {
  return providers[Math.floor(Math.random() * providers.length)];
}

// Upload file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const provider = chooseRandomProvider();
    const key = `${Date.now()}-${req.file.originalname}`;

    // Upload on cloud storage
    await storageService.uploadFile(req.file, key, provider);
    //Remove temp file from mutler 
    fs.unlinkSync(req.file.path); 
    // Create record on local db
    await File.create({
      filename: req.file.originalname,
      storageKey: key,
      provider
    });

    res.json({ message: `Uploaded to ${provider}`, key });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// List all files (in the DB)
router.get('/', async (req, res) => {
  try {
    const files = await File.findAll({
      where: { deletedAt: null },
      order: [['uploadedAt', 'DESC']]
    });
    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// Download by DB id
router.get('/:id', async (req, res) => {
  try {
    const file = await File.findByPk(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });

    await storageService.downloadFile(file.provider, file.storageKey, file.filename, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Download failed' });
  }
});

// Delete by DB id
router.delete('/:id', async (req, res) => {
  try {
    const file = await File.findByPk(req.params.id);
    if (!file || file.deletedAt) {
      return res.status(404).json({ error: 'File not found or already deleted' });
    }
    await file.update({ deletedAt: new Date() });
    res.json({ message: 'File deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// Restore by DB id
router.post('/:id/restore', async (req, res) => {
  try {
    const file = await File.findByPk(req.params.id);
    if (!file || !file.deletedAt) {
      return res.status(404).json({ error: 'File not found or not deleted' });
    }
    await file.update({ deletedAt: null });
    res.json({ message: 'File restored' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Restore failed' });
  }
});

// Shuffle files between providers
router.post('/shuffle', async (req, res) => {
  try {
    // List all files from the database that aren't marked for deletion
    const files = await File.findAll({
      where: { deletedAt: null }
  });

    if (files.length === 0) {
      return res.status(404).json({ error: 'No files found to shuffle' });
    }

    for (const file of files) {
      // Save old metadata
      const oldProvider = file.provider;
      const oldKey = file.storageKey;

      // Choose a new random provider for each file
      const newProvider = chooseRandomProvider();
      // Generate a new key to avoid conflicts
      const newKey = `${Date.now()}-${file.filename}`;

      if (file.provider != newProvider) {
        // Get file from old provider
        const stream = await storageService.internalDownloadFile(file.provider, file.storageKey);

        // Save temp file
        const tempPath = path.join(__dirname, '..', 'tmp', `${Date.now()}-${file.filename}`);
        const writeStream = fs.createWriteStream(tempPath);
        await new Promise((resolve, reject) => {
          stream.pipe(writeStream).on('finish', resolve).on('error', reject);
        });
        
        // Upload to new provider
        await storageService.uploadFile({ path: tempPath }, newKey, newProvider);

        // Update the database with the new provider and storage key
        await file.update({
          provider: newProvider,
          storageKey: newKey,
        });

        // Delete the file from the old provider
        await storageService.deleteFile(oldProvider, oldKey);

        fs.unlinkSync(tempPath);
      }
    }

    res.json({ message: 'Files shuffled between providers successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error shuffling files' });
  }
});

module.exports = router;