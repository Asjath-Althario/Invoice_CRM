const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class ProductModel {
  static async findAll() {
    const [rows] = await db.query('SELECT id, name, description, type, unit_price as unitPrice, stock_level as stockLevel, reorder_point as reorderPoint FROM products_services');
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM products_services WHERE id = ?', [id]);
    return rows[0];
  }

  static async create(productData) {
    const newProduct = {
      id: uuidv4(),
      name: productData.name,
      description: productData.description || '',
      type: productData.type,
      unit_price: productData.unitPrice,
      stock_level: productData.stockLevel || null,
      reorder_point: productData.reorderPoint || null
    };
    await db.query('INSERT INTO products_services SET ?', newProduct);
    return { id: newProduct.id, ...productData };
  }

  static async update(id, productData) {
    const updateData = {
      name: productData.name,
      description: productData.description || '',
      type: productData.type,
      unit_price: productData.unitPrice,
      stock_level: productData.stockLevel || null,
      reorder_point: productData.reorderPoint || null
    };
    await db.query('UPDATE products_services SET ? WHERE id = ?', [updateData, id]);
    return { id, ...productData };
  }

  static async delete(id) {
    await db.query('DELETE FROM products_services WHERE id = ?', [id]);
    return true;
  }
}

module.exports = ProductModel;