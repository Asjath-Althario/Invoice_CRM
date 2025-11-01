const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class PurchaseModel {
  static async findAll() {
    const [rows] = await db.query(`
      SELECT p.*, c.name as supplier_name
      FROM purchases p
      LEFT JOIN contacts c ON p.supplier_id = c.id
    `);
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query(`
      SELECT p.*, c.name as supplier_name
      FROM purchases p
      LEFT JOIN contacts c ON p.supplier_id = c.id
      WHERE p.id = ?
    `, [id]);

    if (rows.length === 0) return null;

    const purchase = rows[0];
    const [lineItems] = await db.query('SELECT * FROM purchase_line_items WHERE purchase_id = ?', [id]);
    purchase.lineItems = lineItems;

    return purchase;
  }

  static async create(purchaseData) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const purchaseId = uuidv4();
      const { lineItems, ...purchaseFields } = purchaseData;
      const purchase = { id: purchaseId, ...purchaseFields };

      await connection.query('INSERT INTO purchases SET ?', purchase);

      if (lineItems && lineItems.length > 0) {
        for (const item of lineItems) {
          const itemId = uuidv4();
          await connection.query('INSERT INTO purchase_line_items SET ?', {
            id: itemId,
            purchase_id: purchaseId,
            ...item
          });
        }
      }

      await connection.commit();
      return purchase;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async update(id, purchaseData) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const { lineItems, ...purchaseFields } = purchaseData;
      await connection.query('UPDATE purchases SET ? WHERE id = ?', [purchaseFields, id]);

      if (lineItems) {
        await connection.query('DELETE FROM purchase_line_items WHERE purchase_id = ?', [id]);
        for (const item of lineItems) {
          const itemId = uuidv4();
          await connection.query('INSERT INTO purchase_line_items SET ?', {
            id: itemId,
            purchase_id: id,
            ...item
          });
        }
      }

      await connection.commit();
      return { id, ...purchaseData };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async delete(id) {
    await db.query('DELETE FROM purchases WHERE id = ?', [id]);
    return true;
  }
}

module.exports = PurchaseModel;