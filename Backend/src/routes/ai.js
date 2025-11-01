const express = require('express');
const multer = require('multer');
const GeminiService = require('../services/geminiService');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authMiddleware);

// Configure multer for file uploads
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Extract purchase details from uploaded receipt
router.post('/extract-purchase-details', upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const extractedData = await GeminiService.extractPurchaseDetails(
      req.file.buffer,
      req.file.mimetype
    );

    res.json(extractedData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to extract purchase details' });
  }
});

// Chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const response = await GeminiService.chat(message, history || []);
    res.json({ response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to get chat response' });
  }
});

module.exports = router;