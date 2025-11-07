const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Get all contacts
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [contacts] = await db.query('SELECT * FROM contacts ORDER BY name ASC');
    res.json(contacts);
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create contact
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, email, phone, address, type, trn } = req.body;
    const contactId = uuidv4();

    // Ensure type has a default value if not provided
    const contactType = type || 'Customer';

    await db.query(
      'INSERT INTO contacts (id, name, email, phone, address, type, trn, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [contactId, name, email, phone, address, contactType, trn]
    );

    const [contact] = await db.query('SELECT * FROM contacts WHERE id = ?', [contactId]);
    res.status(201).json(contact[0]);
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update contact
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, type, trn } = req.body;

    // Ensure type has a default value if not provided
    const contactType = type || 'Customer';

    await db.query(
      'UPDATE contacts SET name = ?, email = ?, phone = ?, address = ?, type = ?, trn = ?, updated_at = NOW() WHERE id = ?',
      [name, email, phone, address, contactType, trn, id]
    );

    const [contact] = await db.query('SELECT * FROM contacts WHERE id = ?', [id]);
    res.json(contact[0]);
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete contact
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM contacts WHERE id = ?', [id]);
    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;