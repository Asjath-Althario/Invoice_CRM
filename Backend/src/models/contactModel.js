const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class ContactModel {
  static async findAll() {
    const [rows] = await db.query('SELECT * FROM contacts');
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM contacts WHERE id = ?', [id]);
    return rows[0];
  }

  static async create(contactData) {
    const newContact = { id: uuidv4(), ...contactData };
    await db.query('INSERT INTO contacts SET ?', newContact);
    return newContact;
  }

  static async update(id, contactData) {
    await db.query('UPDATE contacts SET ? WHERE id = ?', [contactData, id]);
    return { id, ...contactData };
  }

  static async delete(id) {
    await db.query('DELETE FROM contacts WHERE id = ?', [id]);
    return true;
  }
}

module.exports = ContactModel;