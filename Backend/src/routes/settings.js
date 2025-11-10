const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const db = require('../config/database');

const router = express.Router();

// Get company profile
router.get('/company-profile', authMiddleware, async (req, res) => {
  try {
    const [profiles] = await db.query('SELECT * FROM company_profile WHERE id = ?', ['default']);
    if (profiles.length === 0) {
      return res.json({
        name: '',
        address: '',
        email: '',
        phone: '',
        logoUrl: ''
      });
    }
    res.json(profiles[0]);
  } catch (error) {
    console.error('Get company profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update company profile
router.put('/company-profile', authMiddleware, async (req, res) => {
  try {
    const { name, address, email, phone, logoUrl } = req.body;

    await db.query(
      'UPDATE company_profile SET name = ?, address = ?, phone = ?, email = ?, logo_url = ? WHERE id = ?',
      [name, address, phone, email, logoUrl, 'default']
    );

    const [profiles] = await db.query('SELECT * FROM company_profile WHERE id = ?', ['default']);
    res.json(profiles[0]);
  } catch (error) {
    console.error('Update company profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user preferences
router.get('/preferences', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const [preferences] = await db.query('SELECT preferences FROM user_preferences WHERE user_id = ?', [userId]);

    if (preferences.length === 0) {
      // Return default preferences
      return res.json({
        theme: 'Light',
        dateFormat: 'YYYY-MM-DD',
        defaultCurrency: 'AED',
        defaultTaxRate: 10,
        notifications: {
          weeklySummary: true,
          invoicePaid: true,
          quoteAccepted: false,
        },
        dashboardWidgets: {
          salesOverview: true,
          recentActivity: true,
          upcomingInvoices: false,
          lowStockAlerts: false,
          recentPurchases: false,
        },
        whatsappMessageTemplate: `Hi [CustomerName], 👋
Hope you're doing well!

Please find attached your Invoice #[InvoiceNumber] with a total amount of [TotalAmount].
Kindly review the details and let us know if you have any questions.

We'd appreciate it if you could make the payment at your earliest convenience.
Once payment is completed, please share the confirmation so we can update our records.

Thank you for your continued support and trust in us! 💙

Best regards,
[Your Name / Company Name]
📞 [Contact Number] | 💬 WhatsApp Support`
      });
    }

    res.json(JSON.parse(preferences[0].preferences));
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user preferences
router.put('/preferences', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = JSON.stringify(req.body);

    await db.query(
      'INSERT INTO user_preferences (user_id, preferences, updated_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE preferences = ?, updated_at = NOW()',
      [userId, preferences, preferences]
    );

    res.json(req.body);
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;