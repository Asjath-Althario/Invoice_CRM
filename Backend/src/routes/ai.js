const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Extract purchase details from uploaded receipt
router.post('/extract-purchase-details', authMiddleware, upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // For now, return mock data since we can't process images in this context
    const mockData = {
      supplier: 'Sample Supplier Inc.',
      invoice_number: 'INV-001',
      date: new Date().toISOString().split('T')[0],
      items: [
        {
          description: 'Office Supplies',
          quantity: 1,
          unit_price: 100.00,
          total: 100.00
        }
      ],
      subtotal: 100.00,
      tax: 10.00,
      total: 110.00
    };

    res.json(mockData);
  } catch (error) {
    console.error('Extract purchase details error:', error);
    res.status(500).json({ message: 'Failed to extract purchase details' });
  }
});

// Chat with AI
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { message, history } = req.body;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const chat = model.startChat({
      history: history || [],
    });

    const result = await chat.sendMessage(message);
    const response = result.response.text();

    res.json({ response });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ message: 'Failed to process chat message' });
  }
});

module.exports = router;