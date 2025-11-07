const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Get all petty cash transactions
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [transactions] = await db.query('SELECT * FROM petty_cash_transactions ORDER BY date DESC');
    res.json(transactions);
  } catch (error) {
    console.error('Get petty cash transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create petty cash transaction
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { type, amount, description, date } = req.body;
    const transactionId = uuidv4();

    await db.query(
      'INSERT INTO petty_cash_transactions (id, type, amount, description, date, status) VALUES (?, ?, ?, ?, ?, ?)',
      [transactionId, type, amount, description, date, 'Approved']
    );

    const [transaction] = await db.query('SELECT * FROM petty_cash_transactions WHERE id = ?', [transactionId]);
    res.status(201).json(transaction[0]);
  } catch (error) {
    console.error('Create petty cash transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update petty cash transaction
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { type, amount, description, date } = req.body;

    await db.query(
      'UPDATE petty_cash_transactions SET type = ?, amount = ?, description = ?, date = ? WHERE id = ?',
      [type, amount, description, date, id]
    );

    const [transaction] = await db.query('SELECT * FROM petty_cash_transactions WHERE id = ?', [id]);
    res.json(transaction[0]);
  } catch (error) {
    console.error('Update petty cash transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete petty cash transaction
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM petty_cash_transactions WHERE id = ?', [id]);
    res.json({ message: 'Petty cash transaction deleted successfully' });
  } catch (error) {
    console.error('Delete petty cash transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;