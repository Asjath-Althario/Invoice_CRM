const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Get all purchases
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [purchases] = await db.query('SELECT * FROM purchases ORDER BY created_at DESC');
    res.json(purchases);
  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get purchase by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const [purchase] = await db.query('SELECT * FROM purchases WHERE id = ?', [id]);
    if (purchase.length === 0) {
      return res.status(404).json({ message: 'Purchase not found' });
    }
    res.json(purchase[0]);
  } catch (error) {
    console.error('Get purchase error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create purchase
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { supplier_id, items, total_amount, tax_amount, discount_amount, notes } = req.body;
    const purchaseId = uuidv4();
    const purchaseNumber = `PUR-${Date.now()}`;

    await db.query(
      'INSERT INTO purchases (id, purchase_number, supplier_id, items, total_amount, tax_amount, discount_amount, notes, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [purchaseId, purchaseNumber, supplier_id, JSON.stringify(items), total_amount, tax_amount, discount_amount, notes, 'Draft']
    );

    const [purchase] = await db.query('SELECT * FROM purchases WHERE id = ?', [purchaseId]);
    res.status(201).json(purchase[0]);
  } catch (error) {
    console.error('Create purchase error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update purchase
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { supplier_id, items, total_amount, tax_amount, discount_amount, notes, status } = req.body;

    await db.query(
      'UPDATE purchases SET supplier_id = ?, items = ?, total_amount = ?, tax_amount = ?, discount_amount = ?, notes = ?, status = ?, updated_at = NOW() WHERE id = ?',
      [supplier_id, JSON.stringify(items), total_amount, tax_amount, discount_amount, notes, status, id]
    );

    const [purchase] = await db.query('SELECT * FROM purchases WHERE id = ?', [id]);
    res.json(purchase[0]);
  } catch (error) {
    console.error('Update purchase error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete purchase
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM purchases WHERE id = ?', [id]);
    res.json({ message: 'Purchase deleted successfully' });
  } catch (error) {
    console.error('Delete purchase error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;