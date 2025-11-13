const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

const router = express.Router();

// Get all quotes
router.get('/', async (req, res) => {
  try {
    const [quotes] = await db.query(`
      SELECT
        q.id,
        q.quote_number,
        q.contact_id,
        q.issue_date,
        q.expiry_date,
        q.subtotal,
        q.tax_amount,
        q.total_amount,
        q.notes,
        q.status,
        c.name as contact_name
      FROM quotes q
      LEFT JOIN contacts c ON q.contact_id = c.id
      ORDER BY q.issue_date DESC
    `);

    for (let quote of quotes) {
      const [items] = await db.query('SELECT * FROM quote_items WHERE quote_id = ?', [quote.id]);
      // Map database field names to frontend expected field names
      quote.items = items.map(item => ({
        ...item,
        unitPrice: item.unit_price
      }));
    }

    res.json(quotes);
  } catch (error) {
    console.error('Get quotes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create quote
router.post('/', async (req, res) => {
  try {
    const { contact_id, issue_date, expiry_date, subtotal, tax_amount, total_amount, notes, status, items } = req.body;
    console.log('Create quote request:', req.body);
    const quoteId = uuidv4();
    const quoteNumber = `QT-${Date.now().toString().slice(-6)}`;

    // Ensure dates are in YYYY-MM-DD format
    const formattedIssueDate = issue_date ? new Date(issue_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const formattedExpiryDate = expiry_date ? new Date(expiry_date).toISOString().split('T')[0] : new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0];

    console.log('Inserting quote:', [quoteId, quoteNumber, contact_id, formattedIssueDate, formattedExpiryDate, subtotal, tax_amount, total_amount, notes, status]);
    await db.query(
      'INSERT INTO quotes (id, quote_number, contact_id, issue_date, expiry_date, subtotal, tax_amount, total_amount, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [quoteId, quoteNumber, contact_id, formattedIssueDate, formattedExpiryDate, subtotal || 0, tax_amount || 0, total_amount || 0, notes || '', status || 'Draft']
    );

    if (items && items.length > 0) {
      console.log('Inserting quote items:', items);
      for (const item of items) {
        await db.query(
          'INSERT INTO quote_items (id, quote_id, description, quantity, unit_price, total, product_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [uuidv4(), quoteId, item.description, item.quantity, item.unitPrice || 0, item.total || 0, item.product_id || null]
        );
      }
    }

    const [newQuote] = await db.query('SELECT * FROM quotes WHERE id = ?', [quoteId]);
    res.status(201).json(newQuote[0]);
  } catch (error) {
    console.error('Create quote error:', error);
    console.error('Error details:', error.message, error.sqlMessage, error.code);
    res.status(500).json({ message: 'Server error', sqlMessage: error.sqlMessage });
  }
});

// Get quote by ID
router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const [quotes] = await db.query(`
        SELECT
          q.*,
          c.name as contact_name,
          c.email as contact_email,
          c.phone as contact_phone,
          c.address as contact_address,
          c.type as contact_type,
          c.trn as contact_trn
        FROM quotes q
        LEFT JOIN contacts c ON q.contact_id = c.id
        WHERE q.id = ?
      `, [id]);

      if (quotes.length === 0) {
        return res.status(404).json({ message: 'Quote not found' });
      }

      const quote = quotes[0];
      const [items] = await db.query('SELECT * FROM quote_items WHERE quote_id = ?', [id]);
      // Map database field names to frontend expected field names for items
      quote.items = items.map(item => ({
        ...item,
        unitPrice: item.unit_price,
        unit_price: undefined // Remove the snake_case version
      }));

      // Format dates for frontend display
      if (quote.issue_date) {
        quote.issueDate = quote.issue_date.toISOString().split('T')[0];
      }
      if (quote.expiry_date) {
        quote.expiryDate = quote.expiry_date.toISOString().split('T')[0];
      }
      // Provide API response aliases expected by frontend
      if (quote.tax_amount !== undefined) quote.tax = quote.tax_amount;
      if (quote.total_amount !== undefined) quote.total = quote.total_amount;
      if (quote.notes !== undefined) quote.comments = quote.notes;

      res.json(quote);
    } catch (error) {
      console.error('Get quote by ID error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

// Update quote
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { contact_id, issue_date, expiry_date, subtotal, tax_amount, total_amount, notes, status, items } = req.body;
    console.log('Update quote request:', { id, body: req.body });

    // Ensure dates are in YYYY-MM-DD format
    const formattedIssueDate = issue_date ? new Date(issue_date).toISOString().substring(0, 10) : null;
    const formattedExpiryDate = expiry_date ? new Date(expiry_date).toISOString().substring(0, 10) : null;

    console.log('Updating quote:', [contact_id, formattedIssueDate, formattedExpiryDate, subtotal, tax_amount, total_amount, notes, status, id]);
    await db.query(
      'UPDATE quotes SET contact_id = ?, issue_date = ?, expiry_date = ?, subtotal = ?, tax_amount = ?, total_amount = ?, notes = ?, status = ? WHERE id = ?',
      [contact_id, formattedIssueDate, formattedExpiryDate, subtotal || 0, tax_amount || 0, total_amount || 0, notes || '', status || 'Draft', id]
    );

    await db.query('DELETE FROM quote_items WHERE quote_id = ?', [id]);

    if (items && items.length > 0) {
      console.log('Updating quote items:', items);
      for (const item of items) {
        await db.query(
          'INSERT INTO quote_items (id, quote_id, description, quantity, unit_price, total, product_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [uuidv4(), id, item.description, item.quantity, item.unitPrice || 0, item.total || 0, item.product_id || null]
        );
      }
    }

    const [updatedQuote] = await db.query('SELECT * FROM quotes WHERE id = ?', [id]);
    res.json(updatedQuote[0]);
  } catch (error) {
    console.error('Update quote error:', error);
    console.error('Error details:', error.message, error.sqlMessage, error.code);
    res.status(500).json({ message: 'Server error', sqlMessage: error.sqlMessage });
  }
});

// Delete quote
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM quote_items WHERE quote_id = ?', [id]);
    await db.query('DELETE FROM quotes WHERE id = ?', [id]);
    res.json({ message: 'Quote deleted successfully' });
  } catch (error) {
    console.error('Delete quote error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;