const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Get all recurring invoices
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [recurringInvoices] = await db.query(`
      SELECT r.*, c.name as contact_name, c.email as contact_email, c.phone as contact_phone, c.address as contact_address, c.type as contact_type, c.trn as contact_trn
      FROM recurring_invoices r
      LEFT JOIN contacts c ON r.contact_id = c.id
      ORDER BY r.created_at DESC
    `);

    // Convert snake_case fields to camelCase and format dates for frontend
    const formattedInvoices = recurringInvoices.map(invoice => {
      if (invoice.start_date) {
        invoice.startDate = invoice.start_date.toISOString().split('T')[0];
      }
      if (invoice.end_date) {
        invoice.endDate = invoice.end_date.toISOString().split('T')[0];
      }
      
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

      return invoice;
    });

    res.json(formattedInvoices);
  } catch (error) {
    console.error('Get recurring invoices error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single recurring invoice by ID
router.get('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const [recurringInvoices] = await db.query(`
      SELECT r.*, c.name as contact_name, c.email as contact_email, c.phone as contact_phone, c.address as contact_address, c.type as contact_type, c.trn as contact_trn
      FROM recurring_invoices r
      LEFT JOIN contacts c ON r.contact_id = c.id
      WHERE r.id = ?
    `, [id]);

    if (recurringInvoices.length === 0) {
      return res.status(404).json({ message: 'Recurring invoice not found' });
    }

    const invoice = recurringInvoices[0];
    
    // Get invoice items
    const [items] = await db.query(`
      SELECT ri.*, p.name as product_name, p.description as product_description, p.type as product_type
      FROM recurring_invoice_items ri
      LEFT JOIN products p ON ri.product_id = p.id
      WHERE ri.recurring_invoice_id = ?
    `, [id]);
    
    invoice.items = items.map(item => ({
      ...item,
      unitPrice: item.unit_price,
      product_id: item.product_id
    }));

    // Format dates for frontend
    if (invoice.start_date) {
      invoice.startDate = invoice.start_date.toISOString().split('T')[0];
    }
    if (invoice.end_date) {
      invoice.endDate = invoice.end_date.toISOString().split('T')[0];
    }

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
    console.error(`Get recurring invoice ${id} error:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new recurring invoice
router.post('/', authMiddleware, async (req, res) => {
  const { contact_id, start_date, end_date, frequency, subtotal, tax_amount, total_amount, notes, items } = req.body;
  const recurringInvoiceId = uuidv4();
  
  // Convert dates from ISO format to MySQL DATE format (YYYY-MM-DD)
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Gets YYYY-MM-DD part
  };

  const formattedStartDate = formatDate(start_date);
  const formattedEndDate = formatDate(end_date);
  
  try {
    await db.query(
      'INSERT INTO recurring_invoices (id, contact_id, start_date, end_date, frequency, subtotal, tax_amount, total_amount, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [recurringInvoiceId, contact_id, formattedStartDate, formattedEndDate, frequency, subtotal, tax_amount, total_amount, notes]
    );

    if (items && items.length > 0) {
      for (const item of items) {
        await db.query(
          'INSERT INTO recurring_invoice_items (id, recurring_invoice_id, product_id, description, quantity, unit_price, total) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [uuidv4(), recurringInvoiceId, item.product_id, item.description, item.quantity, item.unitPrice, item.total]
        );
      }
    }
    // Fetch the created recurring invoice with contact details
    const [createdInvoice] = await db.query(`
      SELECT r.*, c.name as contact_name, c.email as contact_email, c.phone as contact_phone, c.address as contact_address, c.type as contact_type, c.trn as contact_trn
      FROM recurring_invoices r
      LEFT JOIN contacts c ON r.contact_id = c.id
      WHERE r.id = ?
    `, [recurringInvoiceId]);

    const invoice = createdInvoice[0];
    const [items] = await db.query(`
      SELECT ri.*, p.name as product_name, p.description as product_description, p.type as product_type
      FROM recurring_invoice_items ri
      LEFT JOIN products p ON ri.product_id = p.id
      WHERE ri.recurring_invoice_id = ?
    `, [recurringInvoiceId]);
    invoice.items = items.map(item => ({
      ...item,
      unitPrice: item.unit_price,
      product_id: item.product_id
    }));

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

    res.status(201).json(invoice);
  } catch (error) {
    console.error('Create recurring invoice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update recurring invoice
router.put('/:id', authMiddleware, async (req, res) => {
    console.log('=== RECURRING INVOICE UPDATE REQUEST RECEIVED ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', req.headers);
    
    const { id } = req.params;
    const { contact_id, start_date, end_date, frequency, status, subtotal, tax_amount, total_amount, notes, items } = req.body;

    console.log('Recurring invoice update request:', { id, body: req.body });

    // Convert dates from ISO format to MySQL DATE format (YYYY-MM-DD)
    const formatDate = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toISOString().split('T')[0]; // Gets YYYY-MM-DD part
    };

    const formattedStartDate = formatDate(start_date);
    const formattedEndDate = formatDate(end_date);
    
    console.log('Date conversion:', { 
        original_start_date: start_date, 
        formatted_start_date: formattedStartDate,
        original_end_date: end_date, 
        formatted_end_date: formattedEndDate 
    });

    try {
        console.log('About to execute database query for recurring invoice update');
        console.log('Query parameters:', [contact_id, formattedStartDate, formattedEndDate, frequency, status, subtotal, tax_amount, total_amount, notes, id]);
        
        const result = await db.query(
            'UPDATE recurring_invoices SET contact_id = ?, start_date = ?, end_date = ?, frequency = ?, status = ?, subtotal = ?, tax_amount = ?, total_amount = ?, notes = ? WHERE id = ?',
            [contact_id, formattedStartDate, formattedEndDate, frequency, status, subtotal, tax_amount, total_amount, notes, id]
        );
        
        console.log('Database query executed successfully:', result);

        if (items) {
            console.log('Updating recurring invoice items for:', id);
            console.log('Items data:', items);
            
            await db.query('DELETE FROM recurring_invoice_items WHERE recurring_invoice_id = ?', [id]);
            for (const item of items) {
                console.log('Inserting recurring invoice item:', {
                    id: uuidv4(), 
                    recurring_invoice_id: id, 
                    product_id: item.product_id, 
                    description: item.description, 
                    quantity: item.quantity, 
                    unitPrice: item.unitPrice, 
                    total: item.total
                });
                
                await db.query(
                    'INSERT INTO recurring_invoice_items (id, recurring_invoice_id, product_id, description, quantity, unit_price, total) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [uuidv4(), id, item.product_id, item.description, item.quantity, item.unitPrice, item.total]
                );
            }
            console.log('Recurring invoice items updated successfully');
        }

        // Fetch the updated recurring invoice with contact details
        const [updatedInvoice] = await db.query(`
          SELECT r.*, c.name as contact_name, c.email as contact_email, c.phone as contact_phone, c.address as contact_address, c.type as contact_type, c.trn as contact_trn
          FROM recurring_invoices r
          LEFT JOIN contacts c ON r.contact_id = c.id
          WHERE r.id = ?
        `, [id]);

        const invoice = updatedInvoice[0];
        const [items] = await db.query(`
          SELECT ri.*, p.name as product_name, p.description as product_description, p.type as product_type
          FROM recurring_invoice_items ri
          LEFT JOIN products p ON ri.product_id = p.id
          WHERE ri.recurring_invoice_id = ?
        `, [id]);
        invoice.items = items.map(item => ({
          ...item,
          unitPrice: item.unit_price,
          product_id: item.product_id
        }));

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
        console.error(`❌ Update recurring invoice ${id} error:`, error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Error code:', error.code);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete recurring invoice
router.delete('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM recurring_invoices WHERE id = ?', [id]);
        res.json({ message: 'Recurring invoice deleted successfully' });
    } catch (error) {
        console.error(`Delete recurring invoice ${id} error:`, error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
