const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const authMiddleware = require('../middleware/authMiddleware');
const emailService = require('../services/emailService');
const path = require('path');
const multer = require('multer');
const upload = multer({ dest: path.join(process.cwd(), 'uploads') });

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
      invoice.items = items.map(item => ({
        ...item,
        unitPrice: item.unit_price,
        product_id: item.product_id
      }));

      // Format dates for frontend display - handle Date objects from MySQL
      if (invoice.issue_date) {
        invoice.issueDate = invoice.issue_date.toISOString().split('T')[0];
      }
      if (invoice.due_date) {
        invoice.dueDate = invoice.due_date.toISOString().split('T')[0];
      }
      // Map database field names to frontend expected field names
      if (invoice.invoice_number) invoice.invoiceNumber = invoice.invoice_number;
      // Provide API response aliases expected by frontend
      if (invoice.tax !== undefined) invoice.tax = invoice.tax;
      if (invoice.total !== undefined) invoice.total = invoice.total;
      if (invoice.comments !== undefined) invoice.comments = invoice.comments;

      // Build contact object from flattened fields
      invoice.contact = {
        id: invoice.contact_id,
        name: invoice.contact_name,
        email: invoice.contact_email,
        phone: invoice.contact_phone,
        address: invoice.contact_address,
        type: invoice.contact_type,
        trn: invoice.contact_trn
      };
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
    const { contact_id, issue_date, due_date, subtotal, tax_amount, total_amount, notes, items } = req.body;
    console.log('Create invoice request (raw body):', req.body);
    console.log('Items received:', items);

    const invoiceId = uuidv4();
    const invoiceNumber = `INV-${Date.now()}`;

    if (!contact_id) {
      return res.status(400).json({ message: 'Contact ID is required' });
    }

    const issueDate = issue_date || new Date().toISOString().split('T')[0];
    const dueDate = due_date || new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0];

    // Support legacy field names from frontend (tax, total, comments)
    const taxValue = (tax_amount !== undefined ? tax_amount : (req.body.tax !== undefined ? req.body.tax : 0));
    const totalValue = (total_amount !== undefined ? total_amount : (req.body.total !== undefined ? req.body.total : 0));
    const notesValue = (notes !== undefined ? notes : (req.body.comments !== undefined ? req.body.comments : ''));

    console.log('Inserting invoice with values:', [invoiceId, invoiceNumber, contact_id, issueDate, dueDate, subtotal || 0, taxValue, totalValue, notesValue, 'Draft']);
    await db.query(
      'INSERT INTO invoices (id, invoice_number, contact_id, issue_date, due_date, subtotal, tax_amount, total_amount, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [invoiceId, invoiceNumber, contact_id, issueDate, dueDate, subtotal || 0, taxValue, totalValue, notesValue, 'Draft']
    );

    if (items && items.length > 0) {
      console.log('Processing items:', items);
      for (const item of items) {
        const itemId = uuidv4();
        console.log('Inserting item:', {
          itemId,
          invoiceId,
          product_id: item.product_id || null,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice || item.unit_price || 0,
          total: item.total || 0
        });
        await db.query(
          'INSERT INTO invoice_items (id, invoice_id, product_id, description, quantity, unit_price, total) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [itemId, invoiceId, item.product_id || null, item.description, item.quantity, item.unitPrice || item.unit_price || 0, item.total || 0]
        );
      }
    }

    const [invoice] = await db.query(
      'SELECT i.*, c.name as contact_name, c.email as contact_email, c.phone as contact_phone, c.address as contact_address, c.type as contact_type, c.trn as contact_trn FROM invoices i LEFT JOIN contacts c ON i.contact_id = c.id WHERE i.id = ?',
      [invoiceId]
    );
    const [invoiceItems] = await db.query(
      'SELECT ii.*, p.name as product_name, p.description as product_description, p.type as product_type FROM invoice_items ii LEFT JOIN products p ON ii.product_id = p.id WHERE ii.invoice_id = ?',
      [invoiceId]
    );

    invoice[0].items = invoiceItems.map(item => ({ ...item, unitPrice: item.unit_price, product_id: item.product_id }));
    invoice[0].contact = {
      id: invoice[0].contact_id,
      name: invoice[0].contact_name,
      email: invoice[0].contact_email,
      phone: invoice[0].contact_phone,
      address: invoice[0].contact_address,
      type: invoice[0].contact_type,
      trn: invoice[0].contact_trn
    };
    if (invoice[0].invoice_number) invoice[0].invoiceNumber = invoice[0].invoice_number;
    // Map schema fields to frontend expectations
    invoice[0].tax = invoice[0].tax_amount;
    invoice[0].total = invoice[0].total_amount;
    invoice[0].comments = invoice[0].notes;

    res.status(201).json(invoice[0]);
  } catch (error) {
    console.error('Create invoice error:', error);
    console.error('Error details:', error.message, error.sqlMessage, error.code);
    res.status(500).json({ message: 'Server error', sqlMessage: error.sqlMessage });
  }
});

// Update invoice
router.put('/:id', authMiddleware, async (req, res) => {
  console.log('=== INVOICE UPDATE REQUEST RECEIVED ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', req.headers);
  try {
    const { id } = req.params;
    const updateData = req.body;
    console.log('Invoice update request body:', updateData);

    if (!updateData.contact_id) {
      return res.status(400).json({ message: 'Contact ID is required' });
    }

    const updateFields = [];
    const updateValues = [];

    const addField = (dbField, value) => {
      if (value !== undefined && value !== null) {
        updateFields.push(`${dbField} = ?`);
        updateValues.push(value);
      }
    };

    addField('status', updateData.status);
    addField('contact_id', updateData.contact_id);
    addField('issue_date', updateData.issue_date);
    addField('due_date', updateData.due_date);
    addField('subtotal', updateData.subtotal);
    // Support both tax_amount & tax
    addField('tax_amount', updateData.tax_amount !== undefined ? updateData.tax_amount : updateData.tax);
    addField('total_amount', updateData.total_amount !== undefined ? updateData.total_amount : updateData.total);
    addField('notes', updateData.notes !== undefined ? updateData.notes : updateData.comments);

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    const updateQuery = `UPDATE invoices SET ${updateFields.join(', ')} WHERE id = ?`;
    updateValues.push(id);
    await db.query(updateQuery, updateValues);

    if (updateData.items !== undefined) {
      await db.query('DELETE FROM invoice_items WHERE invoice_id = ?', [id]);
      if (Array.isArray(updateData.items) && updateData.items.length > 0) {
        for (const item of updateData.items) {
          const itemId = uuidv4();
          await db.query(
            'INSERT INTO invoice_items (id, invoice_id, product_id, description, quantity, unit_price, total) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [itemId, id, item.product_id || null, item.description, item.quantity, item.unitPrice || 0, item.total || 0]
          );
        }
      }
    }

    const [invoice] = await db.query(
      'SELECT i.*, c.name as contact_name, c.email as contact_email, c.phone as contact_phone, c.address as contact_address, c.type as contact_type, c.trn as contact_trn FROM invoices i LEFT JOIN contacts c ON i.contact_id = c.id WHERE i.id = ?',
      [id]
    );
    const [invoiceItems] = await db.query(
      'SELECT ii.*, p.name as product_name, p.description as product_description, p.type as product_type FROM invoice_items ii LEFT JOIN products p ON ii.product_id = p.id WHERE ii.invoice_id = ?',
      [id]
    );

    invoice[0].items = invoiceItems.map(item => ({ ...item, unitPrice: item.unit_price, product_id: item.product_id }));
    invoice[0].contact = {
      id: invoice[0].contact_id,
      name: invoice[0].contact_name,
      email: invoice[0].contact_email,
      phone: invoice[0].contact_phone,
      address: invoice[0].contact_address,
      type: invoice[0].contact_type,
      trn: invoice[0].contact_trn
    };
    if (invoice[0].invoice_number) invoice[0].invoiceNumber = invoice[0].invoice_number;
    invoice[0].tax = invoice[0].tax_amount;
    invoice[0].total = invoice[0].total_amount;
    invoice[0].comments = invoice[0].notes;

    res.json(invoice[0]);
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ message: 'Server error', sqlMessage: error.sqlMessage });
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

    invoice.items = items.map(item => ({
      ...item,
      unitPrice: item.unit_price,
      product_id: item.product_id
    }));

    // Format dates for frontend display
    if (invoice.issue_date) {
        invoice.issueDate = new Date(invoice.issue_date).toISOString().split('T')[0];
    }
    if (invoice.due_date) {
        invoice.dueDate = new Date(invoice.due_date).toISOString().split('T')[0];
    }
    // Map database field names to frontend expected field names
    if (invoice.invoice_number) invoice.invoiceNumber = invoice.invoice_number;
    // Provide API response aliases expected by frontend
    if (invoice.tax_amount !== undefined) invoice.tax = invoice.tax_amount;
    if (invoice.total_amount !== undefined) invoice.total = invoice.total_amount;
    if (invoice.notes !== undefined) invoice.comments = invoice.notes;

    // Build contact object from flattened fields
    invoice.contact = {
      id: invoice.contact_id,
      name: invoice.contact_name,
      email: invoice.contact_email,
      phone: invoice.contact_phone,
      address: invoice.contact_address,
      type: invoice.contact_type,
      trn: invoice.contact_trn
    };

    res.json(invoice);
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send invoice via email
router.post('/:id/send', authMiddleware, upload.single('invoicePdf'), async (req, res) => {
  try {
    console.log('=== SEND INVOICE REQUEST ===');
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Raw req.body value:', req.body);
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    console.log('Body keys:', Object.keys(body));
    console.log('File:', req.file ? { originalname: req.file.originalname, path: req.file.path, size: req.file.size } : 'NO FILE');

    const { id } = req.params;
    const recipientEmail = body.recipientEmail || body.recipient_email || undefined;
    const recipientName = body.recipientName || body.recipient_name || undefined;

    // Get invoice data
    const [invoices] = await db.query(`
      SELECT i.*, c.name as contact_name, c.email as contact_email
      FROM invoices i
      LEFT JOIN contacts c ON i.contact_id = c.id
      WHERE i.id = ?
    `, [id]);

    if (invoices.length === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const invoice = invoices[0];

    // Load items
    const [items] = await db.query(`
      SELECT ii.*, p.name as product_name
      FROM invoice_items ii
      LEFT JOIN products p ON ii.product_id = p.id
      WHERE ii.invoice_id = ?
    `, [id]);
    invoice.items = items;

    // Get company profile
    const [profiles] = await db.query("SELECT * FROM company_profile WHERE id = 'default' LIMIT 1");
    const companyProfile = profiles[0] || {};

    const emailTo = recipientEmail || invoice.contact_email;
    const nameTo = recipientName || invoice.contact_name || 'Valued Customer';

    if (!emailTo) {
      return res.status(400).json({ message: 'Recipient email is required' });
    }

    let externalAttachment = null;
    if (req.file) {
      externalAttachment = {
        filename: req.file.originalname || `Invoice-${invoice.invoice_number || invoice.invoiceNumber}.pdf`,
        path: req.file.path,
        contentType: 'application/pdf'
      };
      console.log('Using client-provided PDF attachment');
    } else {
      console.log('No client PDF provided; backend will generate one if configured');
    }

    await emailService.sendInvoice(invoice, companyProfile, emailTo, nameTo, externalAttachment);

    if (invoice.status === 'Draft') {
      await db.query('UPDATE invoices SET status = ? WHERE id = ?', ['Sent', id]);
    }

    res.json({ success: true, message: `Invoice sent successfully to ${emailTo}` });
  } catch (error) {
    console.error('Send invoice error:', error);
    res.status(500).json({ message: 'Failed to send invoice', error: error.message });
  }
});

// Delete invoice
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if invoice exists
    const [invoice] = await db.query('SELECT * FROM invoices WHERE id = ?', [id]);
    if (invoice.length === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Delete associated invoice items
    await db.query('DELETE FROM invoice_items WHERE invoice_id = ?', [id]);
    // Delete the invoice
    await db.query('DELETE FROM invoices WHERE id = ?', [id]);

    res.status(200).json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;