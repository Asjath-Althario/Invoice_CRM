const InvoiceModel = require('../models/invoiceModel');

exports.getAllInvoices = async (req, res) => {
  try {
    const invoices = await InvoiceModel.findAll();
    res.json(invoices);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching invoices' });
  }
};

exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await InvoiceModel.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json(invoice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching invoice' });
  }
};

exports.createInvoice = async (req, res) => {
  try {
    const newInvoice = await InvoiceModel.create(req.body);
    res.status(201).json(newInvoice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating invoice' });
  }
};

exports.updateInvoice = async (req, res) => {
  try {
    const updatedInvoice = await InvoiceModel.update(req.params.id, req.body);
    res.json(updatedInvoice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating invoice' });
  }
};

exports.deleteInvoice = async (req, res) => {
  try {
    await InvoiceModel.delete(req.params.id);
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting invoice' });
  }
};