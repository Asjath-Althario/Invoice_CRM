const PettyCashModel = require('../models/pettyCashModel');

exports.getAllPettyCashTransactions = async (req, res) => {
  try {
    const transactions = await PettyCashModel.findAll();
    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching petty cash transactions' });
  }
};

exports.getPettyCashTransactionById = async (req, res) => {
  try {
    const transaction = await PettyCashModel.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Petty cash transaction not found' });
    }
    res.json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching petty cash transaction' });
  }
};

exports.createPettyCashTransaction = async (req, res) => {
  try {
    const newTransaction = await PettyCashModel.create(req.body);
    res.status(201).json(newTransaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating petty cash transaction' });
  }
};

exports.updatePettyCashTransaction = async (req, res) => {
  try {
    const updatedTransaction = await PettyCashModel.update(req.params.id, req.body);
    res.json(updatedTransaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating petty cash transaction' });
  }
};

exports.deletePettyCashTransaction = async (req, res) => {
  try {
    await PettyCashModel.delete(req.params.id);
    res.json({ message: 'Petty cash transaction deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting petty cash transaction' });
  }
};