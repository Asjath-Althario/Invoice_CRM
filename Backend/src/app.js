const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware

// Explicit CORS configuration to ensure preflight (OPTIONS) requests are handled correctly
const corsOptions = {
  origin: true, // reflect request origin
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin'],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contacts');
const invoiceRoutes = require('./routes/invoices');
const purchaseRoutes = require('./routes/purchases');
const productRoutes = require('./routes/products');
const bankAccountRoutes = require('./routes/bankAccounts');
const pettyCashRoutes = require('./routes/pettyCash');
const aiRoutes = require('./routes/ai');
const purchaseUploadRoutes = require('./routes/purchaseUploads');

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/products-services', productRoutes);
app.use('/api/bank-accounts', bankAccountRoutes);
app.use('/api/petty-cash', pettyCashRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/purchase-uploads', purchaseUploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Zenith ERP Backend is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

module.exports = app;