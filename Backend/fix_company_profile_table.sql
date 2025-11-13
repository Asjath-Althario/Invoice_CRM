-- Fix company_profile table structure to match schema.sql

-- First, backup data if exists
CREATE TABLE IF NOT EXISTS company_profile_backup AS SELECT * FROM company_profile;

-- Drop the old table
DROP TABLE IF EXISTS company_profile;

-- Create the correct structure
CREATE TABLE company_profile (
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

-- Insert default row
INSERT INTO company_profile (id, company_name, address, email, phone, logo_url) VALUES ('default', '', '', '', '', '');

-- Try to restore data from backup if it exists
INSERT INTO company_profile (id, company_name, address, email, phone, logo_url)
SELECT 
  'default',
  name,
  address,
  email,
  phone,
  logo_url
FROM company_profile_backup
LIMIT 1
ON DUPLICATE KEY UPDATE
  company_name = VALUES(company_name),
  address = VALUES(address),
  email = VALUES(email),
  phone = VALUES(phone),
  logo_url = VALUES(logo_url);

-- Clean up backup table
DROP TABLE IF EXISTS company_profile_backup;
