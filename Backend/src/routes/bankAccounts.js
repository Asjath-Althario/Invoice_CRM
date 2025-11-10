const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Get all bank accounts
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [accounts] = await db.query('SELECT * FROM bank_accounts ORDER BY account_name ASC');
    res.json(accounts);
  } catch (error) {
    console.error('Get bank accounts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create bank account
router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log('=== BANK ACCOUNT CREATION DEBUG ===');
    console.log('req.body exists:', !!req.body);
    console.log('req.body type:', typeof req.body);
    console.log('req.body value:', req.body);
    console.log('req.body keys:', req.body ? Object.keys(req.body) : 'N/A');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    console.log('Content-Type:', req.headers['content-type']);

    // Check if req.body exists and has the expected structure
    if (!req.body) {
      console.log('ERROR: req.body is null or undefined');
      return res.status(400).json({ message: 'Request body is missing' });
    }

    const { accountName = '', accountNumber = '', bankName = '', balance = 0, type = 'Bank' } = req.body;

    console.log('Destructured values:', { accountName, accountNumber, bankName, balance, type });

    // Ensure required fields are not null or empty - all fields are NOT NULL in database
    if (!accountName.trim() || !accountNumber.trim() || !bankName.trim()) {
      console.log('Validation failed - missing or empty required fields');
      return res.status(400).json({ message: 'Account name, number, and bank name are required and cannot be empty' });
    }

    const accountId = uuidv4();
    console.log('Generated accountId:', accountId);
    console.log('Inserting with values:', [accountId, accountName.trim(), accountNumber.trim(), bankName.trim(), balance || 0, type || 'Bank']);

    await db.query(
      'INSERT INTO bank_accounts (id, account_name, account_number, bank_name, balance, type) VALUES (?, ?, ?, ?, ?, ?)',
      [accountId, accountName.trim(), accountNumber.trim(), bankName.trim(), balance || 0, type || 'Bank']
    );

    const [account] = await db.query('SELECT * FROM bank_accounts WHERE id = ?', [accountId]);
    console.log('Created account:', account[0]);
    res.status(201).json(account[0]);
  } catch (error) {
    console.error('Create bank account error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update bank account
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { accountName, accountNumber, bankName, balance, type } = req.body;

    await db.query(
      'UPDATE bank_accounts SET account_name = ?, account_number = ?, bank_name = ?, balance = ?, type = ? WHERE id = ?',
      [accountName, accountNumber, bankName, balance, type, id]
    );

    const [account] = await db.query('SELECT * FROM bank_accounts WHERE id = ?', [id]);
    res.json(account[0]);
  } catch (error) {
    console.error('Update bank account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete bank account
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM bank_accounts WHERE id = ?', [id]);
    res.json({ message: 'Bank account deleted successfully' });
  } catch (error) {
    console.error('Delete bank account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get transactions for a bank account
router.get('/:id/transactions', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const [transactions] = await db.query('SELECT * FROM bank_transactions WHERE account_id = ? ORDER BY date DESC', [id]);
    res.json(transactions);
  } catch (error) {
    console.error('Get bank transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add transaction to bank account
router.post('/:id/transactions', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description, date } = req.body;
    const transactionId = uuidv4();

    // Convert date to proper format if it's an ISO string
    const formattedDate = date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    await db.query(
      'INSERT INTO bank_transactions (id, account_id, date, amount, description) VALUES (?, ?, ?, ?, ?)',
      [transactionId, id, formattedDate, amount, description]
    );

    // Update account balance - for payments (credit to business), add to balance
    const balanceChange = parseFloat(amount);
    await db.query('UPDATE bank_accounts SET balance = balance + ? WHERE id = ?', [balanceChange, id]);

    const [transaction] = await db.query('SELECT * FROM bank_transactions WHERE id = ?', [transactionId]);
    res.status(201).json(transaction[0]);
  } catch (error) {
    console.error('Add bank transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;