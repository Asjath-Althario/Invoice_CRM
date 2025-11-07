const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Upload receipt for purchase
router.post('/:purchaseId/upload-receipt', authMiddleware, upload.single('receipt'), async (req, res) => {
  try {
    const { purchaseId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Check if purchase exists
    const [purchase] = await db.query('SELECT id FROM purchases WHERE id = ?', [purchaseId]);
    if (purchase.length === 0) {
      return res.status(404).json({ message: 'Purchase not found' });
    }

    const fileId = uuidv4();
    const filePath = req.file.path;
    const fileName = req.file.originalname;
    const fileSize = req.file.size;
    const mimeType = req.file.mimetype;

    // Save file info to database
    await db.query(
      'INSERT INTO purchase_receipts (id, purchase_id, file_name, file_path, file_size, mime_type, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [fileId, purchaseId, fileName, filePath, fileSize, mimeType]
    );

    res.json({
      id: fileId,
      file_name: fileName,
      file_path: filePath,
      file_size: fileSize,
      mime_type: mimeType,
      message: 'Receipt uploaded successfully'
    });
  } catch (error) {
    console.error('Upload receipt error:', error);
    res.status(500).json({ message: 'Failed to upload receipt' });
  }
});

module.exports = router;