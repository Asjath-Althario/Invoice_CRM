const express = require('express');
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Get company profile
router.get('/company-profile', authMiddleware, async (req, res) => {
  try {
    console.log('Fetching company profile...');
    const [rows] = await db.query("SELECT * FROM company_profile WHERE id = 'default' LIMIT 1");

    if (!rows || rows.length === 0) {
      return res.json({
        id: 'default',
        name: '',
        address: '',
        email: '',
        phone: '',
        logoUrl: '',
        website: '',
        taxId: ''
      });
    }

    const profile = rows[0];
    const response = {
      id: profile.id,
      name: profile.company_name || '',
      address: profile.address || '',
      email: profile.email || '',
      phone: profile.phone || '',
      logoUrl: profile.logo_url || '',
      website: profile.website || '',
      taxId: profile.tax_id || ''
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching company profile:', error);
    if (error && (error.code || error.errno || error.sqlMessage)) {
      console.error('DB Error details:', { code: error.code, errno: error.errno, sqlMessage: error.sqlMessage });
    }
    res.status(500).json({ error: 'Failed to fetch company profile', details: error.message });
  }
});

// Update company profile
router.put('/company-profile', authMiddleware, async (req, res) => {
  try {
    console.log('=== UPDATE COMPANY PROFILE REQUEST ===');
    console.log('Request body keys:', Object.keys(req.body || {}));
    let { name, address, email, phone, logoUrl, website, taxId } = req.body || {};
    
    if (logoUrl) {
      console.log('logoUrl type:', typeof logoUrl);
      console.log('logoUrl length:', logoUrl?.length);
      console.log('logoUrl starts with data:image:', logoUrl?.startsWith?.('data:image/'));
      console.log('logoUrl preview:', logoUrl?.substring(0, 100) + '...');
    }

    // Ensure a default row exists
    console.log('Ensuring default profile row exists...');
    await db.query("INSERT IGNORE INTO company_profile (id, company_name) VALUES ('default', '')");
    console.log('Default row check complete');

    // Validate base64 size if provided
    if (typeof logoUrl === 'string' && logoUrl.startsWith('data:image/')) {
      console.log('Validating logo size...');
      try {
        const base64 = logoUrl.split(',')[1] || '';
        const approxBytes = Math.floor((base64.length * 3) / 4); // base64 -> bytes approximation
        const maxBytes = 2 * 1024 * 1024; // 2MB limit for upload
        console.log('Estimated logo size:', approxBytes, 'bytes (max:', maxBytes, ')');
        if (approxBytes > maxBytes) {
          return res.status(413).json({ message: 'Logo image too large. Please upload an image under 2MB.' });
        }
      } catch (sizingErr) {
        console.error('Failed to estimate base64 size:', sizingErr);
      }
    }

    // If logoUrl is a data URL, save it as a file and store the URL instead of base64
    if (typeof logoUrl === 'string' && logoUrl.startsWith('data:image/')) {
      try {
        console.log('Processing base64 logo data...');
        const match = logoUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
        if (match) {
          const mime = match[1];
          const base64Data = match[2];
          const buffer = Buffer.from(base64Data, 'base64');
          const ext = mime.split('/')[1].replace('jpeg', 'jpg');

          // Save to Backend/uploads (match app.js static path)
          const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }

          const filename = `company-logo-${Date.now()}.${ext}`;
          const filePath = path.join(uploadsDir, filename);
          fs.writeFileSync(filePath, buffer);

          // Replace with public URL (served by app.js at /uploads)
          logoUrl = `/uploads/${filename}`;
        } else {
          console.log('Base64 regex match failed');
        }
      } catch (fileErr) {
        console.error('Failed to save logo file:', fileErr);
        return res.status(500).json({ message: 'Failed to save logo image.' });
      }
    }

    // If logoUrl is not a string, ignore it (partial update)
    if (typeof logoUrl !== 'string') {
      logoUrl = undefined;
    }

    // Load existing profile
    console.log('Loading existing profile...');
    const [existingRows] = await db.query("SELECT * FROM company_profile WHERE id = 'default' LIMIT 1");
    const existing = existingRows[0] || {};
    console.log('Existing profile loaded');

    // Merge partial update
    const next = {
      company_name: name != null ? name : existing.company_name || '',
      address: address != null ? address : existing.address || '',
      email: email != null ? email : existing.email || '',
      phone: phone != null ? phone : existing.phone || '',
      logo_url: logoUrl != null ? logoUrl : existing.logo_url || '',
      website: website != null ? website : existing.website || '',
      tax_id: taxId != null ? taxId : existing.tax_id || ''
    };

    console.log('Updating database with values:', {
      company_name: next.company_name,
      has_logo: !!next.logo_url,
      logo_url_length: next.logo_url?.length,
      logo_url_preview: next.logo_url?.substring(0, 50) + '...'
    });

    const updateResult = await db.query(
      'UPDATE company_profile SET company_name = ?, address = ?, email = ?, phone = ?, logo_url = ?, website = ?, tax_id = ?, updated_at = NOW() WHERE id = ?',
      [ next.company_name, next.address, next.email, next.phone, next.logo_url, next.website, next.tax_id, 'default' ]
    );

    console.log('Database update result:', updateResult);
    console.log('Database update completed successfully');

    const [profiles] = await db.query("SELECT * FROM company_profile WHERE id = 'default' LIMIT 1");
    const profile = profiles[0];
    console.log('Retrieved updated profile:', {
      id: profile.id,
      logoUrl: profile.logo_url?.substring(0, 50) + '...'
    });

    const response = {
      id: profile.id,
      name: profile.company_name || '',
      address: profile.address || '',
      email: profile.email || '',
      phone: profile.phone || '',
      logoUrl: profile.logo_url || '',
      website: profile.website || '',
      taxId: profile.tax_id || ''
    };

    console.log('Sending response');
    res.json(response);

  } catch (error) {
    console.error('=== UPDATE COMPANY PROFILE ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    if (error && (error.code || error.errno || error.sqlMessage)) {
      console.error('DB Error details:', { 
        code: error.code, 
        errno: error.errno, 
        sqlMessage: error.sqlMessage,
        sql: error.sql 
      });
    }
    res.status(500).json({ 
      message: 'Failed to update company profile', 
      details: error.message,
      sqlMessage: error.sqlMessage || undefined
    });
  }
});

// Get user preferences
router.get('/preferences', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const [preferencesRows] = await db.query('SELECT id, preferences FROM user_preferences WHERE user_id = ?', [userId]);

    const defaultPrefs = {
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
📞 [Contact Number] | 💬 WhatsApp Support`,
      invoiceTerms: `Payment due within 30 days unless otherwise agreed.
Late payments may incur a 1.5% monthly service charge.
Quote the invoice number on all correspondence and payments.
Goods/services remain property of the supplier until fully paid.
Report discrepancies within 7 days of receipt.`
    };

    if (!preferencesRows || preferencesRows.length === 0 || preferencesRows[0].preferences == null) {
      return res.json(defaultPrefs);
    }

    const raw = preferencesRows[0].preferences;
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return res.json({ ...defaultPrefs, ...parsed });
    } catch (parseErr) {
      console.error('Preferences JSON parse error:', parseErr);
      console.error('Raw preferences value:', raw);
      return res.json(defaultPrefs);
    }
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user preferences
router.put('/preferences', authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication error: User not found on request.' });
    }
    const userId = req.user.id;
    const incoming = req.body || {};

    const [existingRows] = await db.query('SELECT preferences FROM user_preferences WHERE user_id = ?', [userId]);
    let existingPrefs = {};
    if (existingRows.length && existingRows[0].preferences) {
      try {
        existingPrefs = typeof existingRows[0].preferences === 'string'
          ? JSON.parse(existingRows[0].preferences)
          : existingRows[0].preferences;
      } catch {}
    }

    const merged = { ...existingPrefs, ...incoming };
    const preferences = JSON.stringify(merged);

    console.log('Updating preferences for user:', userId);

    const [userRows] = await db.query('SELECT id FROM users WHERE id = ?', [userId]);
    if (!userRows || userRows.length === 0) {
      return res.status(400).json({ message: 'User not found' });
    }

    const id = uuidv4();
    await db.query(
      'INSERT INTO user_preferences (id, user_id, preferences, updated_at) VALUES (?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE preferences = VALUES(preferences), updated_at = NOW()',
      [id, userId, preferences]
    );

    res.json(merged);
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;