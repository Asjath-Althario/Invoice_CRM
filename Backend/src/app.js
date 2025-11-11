const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Increase body size limits to support large base64 logo uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Auth middleware
const authMiddleware = require('./middleware/authMiddleware');

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
const quotesRouter = require('./routes/quotes');
const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contacts');
const invoiceRoutes = require('./routes/invoices');
const purchaseRoutes = require('./routes/purchases');
const productRoutes = require('./routes/products');
const bankAccountRoutes = require('./routes/bankAccounts');
const pettyCashRoutes = require('./routes/pettyCash');
const aiRoutes = require('./routes/ai');
const purchaseUploadRoutes = require('./routes/purchaseUploads');
const settingsRoutes = require('./routes/settings');
const recurringInvoiceRoutes = require('./routes/recurringInvoices');
const userRoutes = require('./routes/users');

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/quotes', authMiddleware, quotesRouter);
app.use('/api/contacts', authMiddleware, contactRoutes);
app.use('/api/invoices', authMiddleware, invoiceRoutes);
app.use('/api/purchases', authMiddleware, purchaseRoutes);
app.use('/api/products-services', authMiddleware, productRoutes);
app.use('/api/bank-accounts', authMiddleware, bankAccountRoutes);
app.use('/api/petty-cash', authMiddleware, pettyCashRoutes);
app.use('/api/ai', authMiddleware, aiRoutes);
app.use('/api/purchase-uploads', authMiddleware, purchaseUploadRoutes);
app.use('/api/recurring-invoices', authMiddleware, recurringInvoiceRoutes);
app.use('/api/settings', authMiddleware, settingsRoutes);
app.use('/api/users', authMiddleware, userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Zenith ERP Backend is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || err.statusCode || 500;
  const payload = { message: err.message || 'Something went wrong!' };
  if (err && (err.code || err.errno || err.sqlMessage)) {
    payload.code = err.code;
    payload.errno = err.errno;
    payload.sqlMessage = err.sqlMessage;
  }
  res.status(status).json(payload);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

module.exports = app;