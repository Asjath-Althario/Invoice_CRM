const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Get all products/services
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [products] = await db.query('SELECT * FROM products ORDER BY name ASC');
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create product/service
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, type, unitPrice, stockLevel, reorderPoint } = req.body;
    const productId = uuidv4();

    // Ensure type has a default value if not provided
    const productType = type || 'Service';

    // For services, stock fields are not applicable
    const stockQty = productType === 'Product' ? stockLevel : null;
    const reorderPt = productType === 'Product' ? reorderPoint : null;

    await db.query(
      'INSERT INTO products (id, name, description, type, price, stock_quantity, low_stock_threshold, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [productId, name, description, productType, unitPrice, stockQty, reorderPt]
    );

    const [product] = await db.query('SELECT * FROM products WHERE id = ?', [productId]);
    res.status(201).json(product[0]);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update product/service
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, type, unitPrice, stockLevel, reorderPoint } = req.body;

    // Ensure type has a default value if not provided
    const productType = type || 'Service';

    // For services, stock fields are not applicable
    const stockQty = productType === 'Product' ? stockLevel : null;
    const reorderPt = productType === 'Product' ? reorderPoint : null;

    await db.query(
      'UPDATE products SET name = ?, description = ?, type = ?, price = ?, stock_quantity = ?, low_stock_threshold = ?, updated_at = NOW() WHERE id = ?',
      [name, description, productType, unitPrice, stockQty, reorderPt, id]
    );

    const [product] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    res.json(product[0]);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete product/service
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM products WHERE id = ?', [id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;