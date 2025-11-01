const PurchaseModel = require('../models/purchaseModel');

exports.getAllPurchases = async (req, res) => {
  try {
    const purchases = await PurchaseModel.findAll();
    res.json(purchases);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching purchases' });
  }
};

exports.getPurchaseById = async (req, res) => {
  try {
    const purchase = await PurchaseModel.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }
    res.json(purchase);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching purchase' });
  }
};

exports.createPurchase = async (req, res) => {
  try {
    const newPurchase = await PurchaseModel.create(req.body);
    res.status(201).json(newPurchase);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating purchase' });
  }
};

exports.updatePurchase = async (req, res) => {
  try {
    const updatedPurchase = await PurchaseModel.update(req.params.id, req.body);
    res.json(updatedPurchase);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating purchase' });
  }
};

exports.deletePurchase = async (req, res) => {
  try {
    await PurchaseModel.delete(req.params.id);
    res.json({ message: 'Purchase deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting purchase' });
  }
};