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
    const { contact_id, issue_date, due_date, subtotal, tax, total, comments, items } = req.body;
    console.log('Create invoice request:', { contact_id, issue_date, due_date, subtotal, tax, total, comments, items });
    
    const invoiceId = uuidv4();
    const invoiceNumber = `INV-${Date.now()}`;

    // Validate required fields
    if (!contact_id) {
      return res.status(400).json({ message: 'Contact ID is required' });
    }

    // Ensure dates are not null
    const issueDate = issue_date || new Date().toISOString().split('T')[0];
    const dueDate = due_date || new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0];

    console.log('Inserting invoice with values:', [invoiceId, invoiceNumber, contact_id, issueDate, dueDate, subtotal, tax, total, comments, 'Draft']);

    await db.query(
      'INSERT INTO invoices (id, invoice_number, contact_id, issue_date, due_date, subtotal, tax, total, comments, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [invoiceId, invoiceNumber, contact_id, issueDate, dueDate, subtotal, tax, total, comments, 'Draft']
    );

    // Insert invoice items
    if (items && items.length > 0) {
      console.log('Inserting items:', items);
      for (const item of items) {
        const itemId = uuidv4();
        console.log('Inserting item:', [itemId, invoiceId, item.product_id || null, item.description, item.quantity, item.unitPrice, item.total]);
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

    invoice[0].items = invoiceItems.map(item => ({
      ...item,
      unitPrice: item.unit_price,
      product_id: item.product_id
    }));

    // Build contact object from flattened fields
    invoice[0].contact = {
      id: invoice[0].contact_id,
      name: invoice[0].contact_name,
      email: invoice[0].contact_email,
      phone: invoice[0].contact_phone,
      address: invoice[0].contact_address,
      type: invoice[0].contact_type,
      trn: invoice[0].contact_trn
    };

    // Map database field names to frontend expected field names
    if (invoice[0].invoice_number) invoice[0].invoiceNumber = invoice[0].invoice_number;

    res.status(201).json(invoice[0]);
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ message: 'Server error' });
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

    console.log('Invoice update request:', { id, updateData });

    // Validate required fields
    if (!updateData.contact_id) {
      return res.status(400).json({ message: 'Contact ID is required' });
    }

    // Build dynamic update query based on provided fields
    const updateFields = [];
    const updateValues = [];

    const addField = (dbField, frontendField) => {
        const value = updateData[frontendField];
        if (value !== undefined && value !== null) {
            updateFields.push(`${dbField} = ?`);
            updateValues.push(value);
        }
    };
    
    // Map frontend field names to database field names
    addField('status', 'status');
    addField('contact_id', 'contact_id');
    addField('issue_date', 'issue_date');
    addField('due_date', 'due_date');
    addField('subtotal', 'subtotal');
    addField('tax', 'tax'); // Database uses 'tax', not 'tax_amount'
    addField('total', 'total'); // Database uses 'total', not 'total_amount'
    addField('comments', 'comments'); // Database uses 'comments', not 'notes'

    console.log('Update fields found:', updateFields.length, updateFields);
    console.log('Update values:', updateValues);

    if (updateFields.length === 0) {
      console.log('No valid fields to update - rejecting request');
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    const updateQuery = `UPDATE invoices SET ${updateFields.join(', ')} WHERE id = ?`;
    updateValues.push(id);
    
    console.log('Executing query:', updateQuery);
    console.log('With values:', updateValues);
    
    await db.query(updateQuery, updateValues);

    // Only handle items if they are provided in the update
    if (updateData.items !== undefined) {
      console.log('Updating items for invoice:', id);
      console.log('Items data:', updateData.items);
      
      // Delete existing items and insert new ones
      await db.query('DELETE FROM invoice_items WHERE invoice_id = ?', [id]);
      
      if (updateData.items && updateData.items.length > 0) {
        for (const item of updateData.items) {
          const itemId = uuidv4();
          console.log('Inserting item:', {
            itemId, 
            invoiceId: id, 
            product_id: item.product_id || null, 
            description: item.description, 
            quantity: item.quantity, 
            unitPrice: item.unitPrice, 
            total: item.total
          });
          
          await db.query(
            'INSERT INTO invoice_items (id, invoice_id, product_id, description, quantity, unit_price, total) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [itemId, id, item.product_id || null, item.description, item.quantity, item.unitPrice || 0, item.total]
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

    invoice[0].items = invoiceItems.map(item => ({
      ...item,
      unitPrice: item.unit_price,
      product_id: item.product_id
    }));

    // Build contact object from flattened fields
    invoice[0].contact = {
      id: invoice[0].contact_id,
      name: invoice[0].contact_name,
      email: invoice[0].contact_email,
      phone: invoice[0].contact_phone,
      address: invoice[0].contact_address,
      type: invoice[0].contact_type,
      trn: invoice[0].contact_trn
    };

    // Map database field names to frontend expected field names
    if (invoice[0].invoice_number) invoice[0].invoiceNumber = invoice[0].invoice_number;

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

    res.json(invoice);
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;