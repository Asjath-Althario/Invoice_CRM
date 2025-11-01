const BankAccountModel = require('../models/bankAccountModel');

exports.getAllBankAccounts = async (req, res) => {
  try {
    const accounts = await BankAccountModel.findAll();
    res.json(accounts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching bank accounts' });
  }
};

exports.getBankAccountById = async (req, res) => {
  try {
    const account = await BankAccountModel.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ message: 'Bank account not found' });
    }
    res.json(account);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching bank account' });
  }
};

exports.createBankAccount = async (req, res) => {
  try {
    const newAccount = await BankAccountModel.create(req.body);
    res.status(201).json(newAccount);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating bank account' });
  }
};

exports.updateBankAccount = async (req, res) => {
  try {
    const updatedAccount = await BankAccountModel.update(req.params.id, req.body);
    res.json(updatedAccount);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating bank account' });
  }
};

exports.deleteBankAccount = async (req, res) => {
  try {
    await BankAccountModel.delete(req.params.id);
    res.json({ message: 'Bank account deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting bank account' });
  }
};

exports.getAccountTransactions = async (req, res) => {
  try {
    const transactions = await BankAccountModel.getTransactions(req.params.accountId);
    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching transactions' });
  }
};

exports.addTransaction = async (req, res) => {
  try {
    const transaction = await BankAccountModel.addTransaction(req.params.accountId, req.body);
    res.status(201).json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding transaction' });
  }
};