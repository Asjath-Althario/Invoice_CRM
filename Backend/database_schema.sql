-- Zenith ERP Database Schema

-- Create database
CREATE DATABASE IF NOT EXISTS zenith_erp;
USE zenith_erp;

-- User Management & Authentication
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Member') NOT NULL,
    status ENUM('Active', 'Invited') NOT NULL
);

-- Core Business Entities
CREATE TABLE contacts (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    phone VARCHAR(50),
    type ENUM('Customer', 'Vendor') NOT NULL,
    trn VARCHAR(255)
);

CREATE TABLE products_services (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type ENUM('Product', 'Service') NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    stock_level INT,
    reorder_point INT
);

-- Sales Module
CREATE TABLE invoices (
    id VARCHAR(255) PRIMARY KEY,
    invoice_number VARCHAR(255) UNIQUE NOT NULL,
    contact_id VARCHAR(255) NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    comments TEXT,
    status ENUM('Paid', 'Sent', 'Draft', 'Approved') NOT NULL,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);

CREATE TABLE invoice_items (
    id VARCHAR(255) PRIMARY KEY,
    invoice_id VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

CREATE TABLE quotes (
    id VARCHAR(255) PRIMARY KEY,
    quote_number VARCHAR(255) UNIQUE NOT NULL,
    contact_id VARCHAR(255) NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    comments TEXT,
    status ENUM('Draft', 'Sent', 'Accepted', 'Declined', 'Converted') NOT NULL,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);

CREATE TABLE quote_items (
    id VARCHAR(255) PRIMARY KEY,
    quote_id VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
);

-- Accounting Module
CREATE TABLE purchases (
    id VARCHAR(255) PRIMARY KEY,
    supplier_id VARCHAR(255),
    date DATE NOT NULL,
    due_date DATE,
    purchase_order_number VARCHAR(255),
    subtotal DECIMAL(10, 2) NOT NULL,
    vat DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    status ENUM('Paid', 'Pending', 'Scheduled', 'Draft') NOT NULL,
    purchase_type ENUM('Cash', 'Credit') NOT NULL,
    currency VARCHAR(10) NOT NULL,
    file_path VARCHAR(1024),
    FOREIGN KEY (supplier_id) REFERENCES contacts(id) ON DELETE SET NULL
);

CREATE TABLE purchase_line_items (
    id VARCHAR(255) PRIMARY KEY,
    purchase_id VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    account VARCHAR(255),
    vat DECIMAL(5, 2) NOT NULL,
    FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE
);

-- Banking Module
CREATE TABLE bank_accounts (
    id VARCHAR(255) PRIMARY KEY,
    account_name VARCHAR(255) NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(255) NOT NULL,
    balance DECIMAL(12, 2) NOT NULL,
    type ENUM('Bank', 'Cash') NOT NULL
);

CREATE TABLE bank_transactions (
    id VARCHAR(255) PRIMARY KEY,
    account_id VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    FOREIGN KEY (account_id) REFERENCES bank_accounts(id) ON DELETE CASCADE
);

CREATE TABLE petty_cash_transactions (
    id VARCHAR(255) PRIMARY KEY,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    type ENUM('Funding', 'Expense', 'Reimbursement') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status ENUM('Approved', 'Pending', 'Rejected') NOT NULL
);

-- Settings & Configuration
CREATE TABLE company_profile (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    email VARCHAR(255),
    phone VARCHAR(50),
    logo_url VARCHAR(1024)
);

CREATE TABLE preferences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(255) NOT NULL,
    theme ENUM('Light', 'Dark') NOT NULL,
    date_format VARCHAR(50),
    default_currency VARCHAR(10),
    default_tax_rate DECIMAL(5, 2),
    notifications JSON,
    dashboard_widgets JSON,
    whatsapp_message_template TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Integrations & Notifications
CREATE TABLE integrations (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo VARCHAR(1024),
    is_connected TINYINT(1) DEFAULT 0
);

CREATE TABLE notifications (
    id VARCHAR(255) PRIMARY KEY,
    message TEXT NOT NULL,
    date DATETIME NOT NULL,
    is_read TINYINT(1) DEFAULT 0,
    link VARCHAR(1024),
    type ENUM('payment', 'quote', 'stock', 'general') NOT NULL
);