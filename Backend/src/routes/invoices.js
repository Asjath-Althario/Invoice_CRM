const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Get all invoices
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [invoices] = await db.query(`
      SELECT i.*, c.name as contact_name, c.email as contact_email, c.phone as contact_phone, c.address as contact_address, c.type as contact_type, c.trn as contact_trn
      FROM invoices i
      LEFT JOIN contacts c ON i.contact_id = c.id
      ORDER BY i.issue_date DESC
    `);

    // Load items for each invoice with product/service details
    for (let invoice of invoices) {
      const [items] = await db.query(`
        SELECT ii.*, p.name as product_name, p.description as product_description, p.type as product_type
        FROM invoice_items ii
        LEFT JOIN products p ON ii.product_id = p.id
        WHERE ii.invoice_id = ?
      `, [invoice.id]);
      invoice.items = items;
    }

    res.json(invoices);
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create invoice
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { contact_id, issue_date, due_date, subtotal, tax, total, comments, items } = req.body;
    const invoiceId = uuidv4();
    const invoiceNumber = `INV-${Date.now()}`;

    // Ensure dates are not null
    const issueDate = issue_date || new Date().toISOString().split('T')[0];
    const dueDate = due_date || new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0];

    await db.query(
      'INSERT INTO invoices (id, invoice_number, contact_id, issue_date, due_date, subtotal, tax, total, comments, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [invoiceId, invoiceNumber, contact_id, issueDate, dueDate, subtotal, tax, total, comments, 'Draft']
    );

    // Insert invoice items
    if (items && items.length > 0) {
      for (const item of items) {
        const itemId = uuidv4();
        await db.query(
          'INSERT INTO invoice_items (id, invoice_id, product_id, description, quantity, unit_price, total) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [itemId, invoiceId, item.product_id || null, item.description, item.quantity, item.unitPrice, item.total]
        );
      }
    }

    const [invoice] = await db.query(`
      SELECT i.*, c.name as contact_name, c.email as contact_email, c.phone as contact_phone, c.address as contact_address, c.type as contact_type, c.trn as contact_trn
      FROM invoices i
      LEFT JOIN contacts c ON i.contact_id = c.id
      WHERE i.id = ?
    `, [invoiceId]);

    const [invoiceItems] = await db.query(`
      SELECT ii.*, p.name as product_name, p.description as product_description, p.type as product_type
      FROM invoice_items ii
      LEFT JOIN products p ON ii.product_id = p.id
      WHERE ii.invoice_id = ?
    `, [invoiceId]);

    invoice[0].items = invoiceItems;

    res.status(201).json(invoice[0]);
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update invoice
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log('Invoice update request:', { id, updateData });

    // Simple status update for payment recording
    if (updateData.status) {
      await db.query('UPDATE invoices SET status = ? WHERE id = ?', [updateData.status, id]);
    } else {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    // Only handle items if they are provided in the update
    if (updateData.items !== undefined) {
      // Delete existing items and insert new ones
      await db.query('DELETE FROM invoice_items WHERE invoice_id = ?', [id]);
      if (updateData.items && updateData.items.length > 0) {
        for (const item of updateData.items) {
          const itemId = uuidv4();
          await db.query(
            'INSERT INTO invoice_items (id, invoice_id, product_id, description, quantity, unit_price, total) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [itemId, id, item.product_id || null, item.description, item.quantity, item.unitPrice, item.total]
          );
        }
      }
    }

    const [invoice] = await db.query(`
      SELECT i.*, c.name as contact_name, c.email as contact_email, c.phone as contact_phone, c.address as contact_address, c.type as contact_type, c.trn as contact_trn
      FROM invoices i
      LEFT JOIN contacts c ON i.contact_id = c.id
      WHERE i.id = ?
    `, [id]);

    const [invoiceItems] = await db.query(`
      SELECT ii.*, p.name as product_name, p.description as product_description, p.type as product_type
      FROM invoice_items ii
      LEFT JOIN products p ON ii.product_id = p.id
      WHERE ii.invoice_id = ?
    `, [id]);

    invoice[0].items = invoiceItems;

    res.json(invoice[0]);
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete invoice
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM invoices WHERE id = ?', [id]);
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single invoice by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const [invoices] = await db.query(`
      SELECT i.*, c.name as contact_name, c.email as contact_email, c.phone as contact_phone, c.address as contact_address, c.type as contact_type, c.trn as contact_trn
      FROM invoices i
      LEFT JOIN contacts c ON i.contact_id = c.id
      WHERE i.id = ?
    `, [id]);

    if (invoices.length === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const invoice = invoices[0];

    // Load items for the invoice with product/service details
    const [items] = await db.query(`
      SELECT ii.*, p.name as product_name, p.description as product_description, p.type as product_type
      FROM invoice_items ii
      LEFT JOIN products p ON ii.product_id = p.id
      WHERE ii.invoice_id = ?
    `, [id]);

    invoice.items = items;

    res.json(invoice);
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;