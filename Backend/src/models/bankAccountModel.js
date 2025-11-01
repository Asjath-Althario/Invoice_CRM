const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class BankAccountModel {
  static async findAll() {
    const [rows] = await db.query('SELECT id, account_name as accountName, bank_name as bankName, account_number as accountNumber, balance, type FROM bank_accounts');
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT id, account_name as accountName, bank_name as bankName, account_number as accountNumber, balance, type FROM bank_accounts WHERE id = ?', [id]);
    return rows[0];
  }

  static async create(accountData) {
    const newAccount = { id: uuidv4(), account_name: accountData.accountName, bank_name: accountData.bankName, account_number: accountData.accountNumber, balance: accountData.balance, type: accountData.type };
    await db.query('INSERT INTO bank_accounts SET ?', newAccount);
    return newAccount;
  }

  static async update(id, accountData) {
    const updateData = { account_name: accountData.accountName, bank_name: accountData.bankName, account_number: accountData.accountNumber, balance: accountData.balance, type: accountData.type };
    await db.query('UPDATE bank_accounts SET ? WHERE id = ?', [updateData, id]);
    return { id, ...accountData };
  }

  static async delete(id) {
    await db.query('DELETE FROM bank_accounts WHERE id = ?', [id]);
    return true;
  }

  static async getTransactions(accountId) {
    const [rows] = await db.query('SELECT * FROM bank_transactions WHERE account_id = ? ORDER BY date DESC', [accountId]);
    return rows;
  }

  static async addTransaction(accountId, transactionData) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const transactionId = uuidv4();
      const transaction = { id: transactionId, account_id: accountId, ...transactionData };

      await connection.query('INSERT INTO bank_transactions SET ?', transaction);

      // Update account balance
      await connection.query('UPDATE bank_accounts SET balance = balance + ? WHERE id = ?', [transactionData.amount, accountId]);

      await connection.commit();
      return transaction;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = BankAccountModel;