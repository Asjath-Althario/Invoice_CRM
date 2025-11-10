const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Get all purchases
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [purchases] = await db.query('SELECT * FROM purchases ORDER BY date DESC');
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
    const { supplier_id, date, due_date, subtotal, vat, total, purchase_order_number, status, purchase_type, currency, file_path } = req.body;
    const purchaseId = uuidv4();

    await db.query(
      'INSERT INTO purchases (id, supplier_id, date, due_date, purchase_order_number, subtotal, vat, total, status, purchase_type, currency, file_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [purchaseId, supplier_id, date, due_date, purchase_order_number, subtotal, vat, total, status || 'Draft', purchase_type || 'Credit', currency || 'AED', file_path]
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
    const updateData = req.body;

    // Build dynamic update query based on provided fields
    const updateFields = [];
    const updateValues = [];

    const addField = (field, value) => {
        if (value !== undefined && value !== null) {
            updateFields.push(`${field} = ?`);
            updateValues.push(value);
        }
    };

    addField('supplier_id', updateData.supplier_id);
    addField('date', updateData.date);
    addField('due_date', updateData.due_date);
    addField('subtotal', updateData.subtotal);
    addField('vat', updateData.vat);
    addField('total', updateData.total);
    addField('status', updateData.status);
    addField('purchase_order_number', updateData.purchase_order_number);
    addField('purchase_type', updateData.purchase_type);
    addField('currency', updateData.currency);
    addField('file_path', updateData.file_path);

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    const updateQuery = `UPDATE purchases SET ${updateFields.join(', ')} WHERE id = ?`;
    updateValues.push(id);
    await db.query(updateQuery, updateValues);

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