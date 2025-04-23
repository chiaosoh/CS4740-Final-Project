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
    const files = await File.findAll({ order: [['uploadedAt', 'DESC']] });
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
    if (!file) return res.status(404).json({ error: 'File not found' });

    // Delete on cloud storage
    await storageService.deleteFile(file.provider, file.storageKey);
    // Delete on local db
    await file.destroy();

    res.json({ message: 'File deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;