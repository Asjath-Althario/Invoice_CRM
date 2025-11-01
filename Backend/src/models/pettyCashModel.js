const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class PettyCashModel {
  static async findAll() {
    const [rows] = await db.query('SELECT * FROM petty_cash_transactions ORDER BY date DESC');
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM petty_cash_transactions WHERE id = ?', [id]);
    return rows[0];
  }

  static async create(transactionData) {
    const newTransaction = { id: uuidv4(), ...transactionData };
    await db.query('INSERT INTO petty_cash_transactions SET ?', newTransaction);
    return newTransaction;
  }

  static async update(id, transactionData) {
    await db.query('UPDATE petty_cash_transactions SET ? WHERE id = ?', [transactionData, id]);
    return { id, ...transactionData };
  }

  static async delete(id) {
    await db.query('DELETE FROM petty_cash_transactions WHERE id = ?', [id]);
    return true;
  }
}

module.exports = PettyCashModel;