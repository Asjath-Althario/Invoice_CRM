-- Zenith ERP Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('Admin', 'Member') DEFAULT 'Member',
  status ENUM('Active', 'Inactive') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  type ENUM('Customer', 'Vendor') NOT NULL,
  trn VARCHAR(50),
  status ENUM('Active', 'Inactive') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Products/Services table
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type ENUM('Product', 'Service') NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  cost DECIMAL(10,2) DEFAULT 0.00,
  stock_quantity INT DEFAULT 0,
  low_stock_threshold INT DEFAULT 10,
  status ENUM('Active', 'Inactive') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(36) PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  contact_id VARCHAR(36),
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status ENUM('Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled') DEFAULT 'Draft',
  subtotal DECIMAL(10,2) DEFAULT 0.00,
  tax_amount DECIMAL(10,2) DEFAULT 0.00,
  total_amount DECIMAL(10,2) DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (contact_id) REFERENCES contacts(id)
);

-- Invoice items table
CREATE TABLE IF NOT EXISTS invoice_items (
  id VARCHAR(36) PRIMARY KEY,
  invoice_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(36),
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id VARCHAR(36) PRIMARY KEY,
  purchase_order_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id VARCHAR(36),
  order_date DATE NOT NULL,
  expected_date DATE,
  status ENUM('Draft', 'Ordered', 'Received', 'Cancelled') DEFAULT 'Draft',
  subtotal DECIMAL(10,2) DEFAULT 0.00,
  tax_amount DECIMAL(10,2) DEFAULT 0.00,
  total_amount DECIMAL(10,2) DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES contacts(id)
);

-- Purchase items table
CREATE TABLE IF NOT EXISTS purchase_items (
  id VARCHAR(36) PRIMARY KEY,
  purchase_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(36),
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  received_quantity DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Bank accounts table
CREATE TABLE IF NOT EXISTS bank_accounts (
  id VARCHAR(36) PRIMARY KEY,
  account_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  bank_name VARCHAR(255),
  balance DECIMAL(15,2) DEFAULT 0.00,
  type VARCHAR(50) DEFAULT 'Bank',
  currency VARCHAR(3) DEFAULT 'USD',
  status ENUM('Active', 'Inactive') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bank transactions table
CREATE TABLE IF NOT EXISTS bank_transactions (
  id VARCHAR(36) PRIMARY KEY,
  account_id VARCHAR(36) NOT NULL,
  transaction_date DATE NOT NULL,
  description TEXT,
  amount DECIMAL(15,2) NOT NULL,
  type ENUM('Deposit', 'Withdrawal', 'Transfer') NOT NULL,
  reference VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES bank_accounts(id) ON DELETE CASCADE
);

-- Petty cash transactions table
CREATE TABLE IF NOT EXISTS petty_cash_transactions (
  id VARCHAR(36) PRIMARY KEY,
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  type ENUM('Income', 'Expense') NOT NULL,
  category VARCHAR(100),
  reference VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Company profile table
CREATE TABLE IF NOT EXISTS company_profile (
  id VARCHAR(36) PRIMARY KEY DEFAULT 'default',
  company_name VARCHAR(255),
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(255),
  tax_id VARCHAR(50),
  logo_url LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL UNIQUE,
  preferences JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert default company profile
INSERT IGNORE INTO company_profile (id) VALUES ('default');

-- Recurring Invoices table
CREATE TABLE IF NOT EXISTS recurring_invoices (
  id VARCHAR(36) PRIMARY KEY,
  contact_id VARCHAR(36),
  start_date DATE NOT NULL,
  end_date DATE,
  frequency ENUM('Daily', 'Weekly', 'Monthly', 'Yearly') NOT NULL,
  status ENUM('Active', 'Paused', 'Finished') DEFAULT 'Active',
  subtotal DECIMAL(10,2) DEFAULT 0.00,
  tax_amount DECIMAL(10,2) DEFAULT 0.00,
  total_amount DECIMAL(10,2) DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (contact_id) REFERENCES contacts(id)
);

-- Recurring Invoice items table
CREATE TABLE IF NOT EXISTS recurring_invoice_items (
  id VARCHAR(36) PRIMARY KEY,
  recurring_invoice_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(36),
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recurring_invoice_id) REFERENCES recurring_invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id VARCHAR(36) PRIMARY KEY,
  quote_number VARCHAR(50) UNIQUE NOT NULL,
  contact_id VARCHAR(36),
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  status ENUM('Draft', 'Sent', 'Accepted', 'Declined', 'Converted') DEFAULT 'Draft',
  subtotal DECIMAL(10,2) DEFAULT 0.00,
  tax_amount DECIMAL(10,2) DEFAULT 0.00,
  total_amount DECIMAL(10,2) DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (contact_id) REFERENCES contacts(id)
);

-- Quote items table
CREATE TABLE IF NOT EXISTS quote_items (
  id VARCHAR(36) PRIMARY KEY,
  quote_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(36),
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Insert default admin user (password: password123)
INSERT IGNORE INTO users (id, name, email, password_hash, role, status)
VALUES (
  'admin-default',
  'Admin User',
  'admin@zenith.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'Admin',
  'Active'
);