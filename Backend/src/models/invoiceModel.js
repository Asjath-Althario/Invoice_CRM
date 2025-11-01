const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class InvoiceModel {
  static async findAll() {
    const [rows] = await db.query(`
      SELECT i.*, c.name as contact_name, c.email as contact_email
      FROM invoices i
      LEFT JOIN contacts c ON i.contact_id = c.id
    `);
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query(`
      SELECT i.*, c.name as contact_name, c.email as contact_email
      FROM invoices i
      LEFT JOIN contacts c ON i.contact_id = c.id
      WHERE i.id = ?
    `, [id]);

    if (rows.length === 0) return null;

    const invoice = rows[0];
    const [items] = await db.query('SELECT * FROM invoice_items WHERE invoice_id = ?', [id]);
    invoice.items = items;

    return invoice;
  }

  static async create(invoiceData) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const invoiceId = uuidv4();
      const { items, ...invoiceFields } = invoiceData;
      const invoice = { id: invoiceId, ...invoiceFields };

      await connection.query('INSERT INTO invoices SET ?', invoice);

      if (items && items.length > 0) {
        for (const item of items) {
          const itemId = uuidv4();
          await connection.query('INSERT INTO invoice_items SET ?', {
            id: itemId,
            invoice_id: invoiceId,
            ...item
          });
        }
      }

      await connection.commit();
      return invoice;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async update(id, invoiceData) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const { items, ...invoiceFields } = invoiceData;
      await connection.query('UPDATE invoices SET ? WHERE id = ?', [invoiceFields, id]);

      if (items) {
        await connection.query('DELETE FROM invoice_items WHERE invoice_id = ?', [id]);
        for (const item of items) {
          const itemId = uuidv4();
          await connection.query('INSERT INTO invoice_items SET ?', {
            id: itemId,
            invoice_id: id,
            ...item
          });
        }
      }

      await connection.commit();
      return { id, ...invoiceData };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async delete(id) {
    await db.query('DELETE FROM invoices WHERE id = ?', [id]);
    return true;
  }
}

module.exports = InvoiceModel;