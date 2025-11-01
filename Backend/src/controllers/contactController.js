const ContactModel = require('../models/contactModel');

exports.getAllContacts = async (req, res) => {
  try {
    const contacts = await ContactModel.findAll();
    res.json(contacts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching contacts' });
  }
};

exports.getContactById = async (req, res) => {
  try {
    const contact = await ContactModel.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    res.json(contact);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching contact' });
  }
};

exports.createContact = async (req, res) => {
  try {
    const newContact = await ContactModel.create(req.body);
    res.status(201).json(newContact);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating contact' });
  }
};

exports.updateContact = async (req, res) => {
  try {
    const updatedContact = await ContactModel.update(req.params.id, req.body);
    res.json(updatedContact);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating contact' });
  }
};

exports.deleteContact = async (req, res) => {
  try {
    await ContactModel.delete(req.params.id);
    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting contact' });
  }
};