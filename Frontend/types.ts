import React from 'react';

export interface Contact {
  id: string;
  name: string;
  email: string;
  address: string;
  phone: string;
  type: 'Customer' | 'Vendor';
  trn?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  contact: Contact;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  comments: string;
  status: 'Paid' | 'Sent' | 'Draft' | 'Approved';
}

export interface RecurringInvoice {
  id: string;
  contact: Contact;
  contact_id?: string;
  start_date: string;
  end_date?: string;
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
  items: InvoiceItem[];
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
  status: 'Active' | 'Paused' | 'Ended';
}

export interface Quote {
  id: string;
  quoteNumber: string;
  contact: Contact;
  issueDate: string;
  expiryDate: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  comments: string;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Declined' | 'Converted';
}

export interface ProductOrService {
   id: string;
   name: string;
   description: string;
   type: 'Product' | 'Service';
   unitPrice: number;
   price?: number;
   stockLevel?: number;
   reorderPoint?: number;
}

export interface PurchaseLineItem {
  id:string;
  description: string;
  amount: number;
  account: string;
  vat: number;
}

export interface Purchase {
  id: string;
  vendor?: string;
  supplier?: Contact;
  date: string;
  dueDate?: string;
  purchaseOrderNumber?: string;
  total: number;
  status: 'Paid' | 'Pending' | 'Scheduled' | 'Draft';
  purchaseType: 'Cash' | 'Credit';
  currency: 'USD' | 'EUR' | 'GBP' | 'AED';
  lineItems: PurchaseLineItem[];
  subtotal: number;
  vat: number;
  file?: File;
}

export interface PettyCashTransaction {
  id: string;
  date: string;
  description: string;
  type: 'Funding' | 'Expense' | 'Reimbursement';
  amount: number;
  status: 'Approved' | 'Pending' | 'Rejected';
}

export interface BankAccount {
  id: string;
  accountName: string;
  bankName: string;
  accountNumber: string;
  balance: number;
  type?: 'Bank' | 'Cash';
}

export interface BankTransaction {
  id: string;
  accountId: string;
  date: string;
  description: string;
  amount: number;
}

export interface CompanyProfile {
  name: string;
  address: string;
  email: string;
  phone: string;
  logoUrl: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Member';
  status: 'Active' | 'Invited';
}

export interface Preferences {
  theme: 'Light' | 'Dark';
  dateFormat: string;
  defaultCurrency: string;
  defaultTaxRate: number;
  notifications: {
    weeklySummary: boolean;
    invoicePaid: boolean;
    quoteAccepted: boolean;
  };
  dashboardWidgets: {
    salesOverview: boolean;
    recentActivity: boolean;
    upcomingInvoices: boolean;
    lowStockAlerts: boolean;
    recentPurchases: boolean;
  };
  whatsappMessageTemplate?: string;
  invoiceTerms?: string;
}

export interface Integration {
  id: string;
  name: string;
  description: string;
  logo: string;
  isConnected: boolean;
}

export interface TrialBalanceAccount {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

export interface ProfitLossLine {
  label: string;
  amount: number;
}

export interface CashFlowSection {
  title: string;
  items: { label: string; amount: number }[];
  total: number;
}

export interface TaxCalculationLine {
  label: string;
  amount: number;
  isTotal?: boolean;
}

export interface PostingDetail {
  date: string;
  description: string;
  account: string;
  debit?: number;
  credit?: number;
}

export interface AgedPayable {
  contactName: string;
  totalDue: number;
  current: number;
  days30: number;
  days60: number;
  days90plus: number;
}

export interface VatTransaction {
    date: string;
    description: string;
    type: string;
    netAmount: number;
    vatAmount: number;
}

export interface StatementTransaction {
    date: string;
    type: string;
    details: string;
    amount: number;
}

export interface ExtractedPurchaseDetails {
  vendorName: string;
  purchaseDate: string;
  totalAmount: number;
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
}

export interface JournalEntry {
    id: string;
    number: string;
    date: string;
    description: string;
    contact: string;
    type: 'journalEntry';
    docs?: string;
}

export interface Notification {
  id: string;
  message: string;
  date: string;
  read: boolean;
  link: string;
  type: 'payment' | 'quote' | 'stock' | 'general';
}