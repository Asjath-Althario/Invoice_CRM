import type {
  Contact, Invoice, InvoiceItem, RecurringInvoice, Quote, ProductOrService,
  Purchase, PurchaseLineItem, PettyCashTransaction, BankAccount, BankTransaction,
  CompanyProfile, User, Preferences, Integration, TrialBalanceAccount, ProfitLossLine,
  CashFlowSection, TaxCalculationLine, PostingDetail, AgedPayable, VatTransaction, StatementTransaction, Notification
} from '../types';
import eventBus from '../utils/eventBus';

// Helper to generate unique IDs
const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// --- DATA STORE ---

let contacts: Contact[] = [
  { id: '1', name: 'Innovate Inc.', email: 'contact@innovate.com', address: '123 Tech Park, Silicon Valley', phone: '555-0101', type: 'Customer', trn: '100200300400500' },
  { id: '2', name: 'Quantum Solutions', email: 'sales@quantum.com', address: '456 Future Ave, Metropolis', phone: '555-0102', type: 'Customer', trn: '100987654321000' },
  { id: '3', name: 'Office Supplies Co.', email: 'orders@officesupplies.com', address: '789 Business Blvd, Commerce City', phone: '555-0103', type: 'Vendor' },
  { id: '4', name: 'Cloud Services LLC', email: 'support@cloudsvc.com', address: '101 Data Dr, Server Farm', phone: '555-0104', type: 'Vendor' },
];

let productsOrServices: ProductOrService[] = [
  { id: 'p1', name: 'Web Development', description: 'Custom website development services.', type: 'Service', unitPrice: 5000 },
  { id: 'p2', name: 'Cloud Hosting', description: '1-year standard cloud hosting.', type: 'Service', unitPrice: 1200 },
  { id: 'p3', name: 'Office Chairs', description: 'Ergonomic office chairs.', type: 'Product', unitPrice: 250, stockLevel: 8, reorderPoint: 10 },
  { id: 'p4', name: 'Consulting Hours', description: 'Business strategy consulting.', type: 'Service', unitPrice: 150 },
  { id: 'p5', name: 'Wireless Mouse', description: 'A comfortable wireless mouse.', type: 'Product', unitPrice: 45, stockLevel: 25, reorderPoint: 20 },
];

let invoices: Invoice[] = [
  { id: 'inv1', invoiceNumber: 'INV-001', contact: contacts[0], issueDate: '2024-07-15', dueDate: '2024-08-14', items: [{id: 'i1', description: 'Web Development', quantity: 1, unitPrice: 5000, total: 5000}], subtotal: 5000, tax: 500, total: 5500, comments: 'Thank you for your business.', status: 'Paid' },
  { id: 'inv2', invoiceNumber: 'INV-002', contact: contacts[1], issueDate: '2024-07-20', dueDate: '2024-08-19', items: [{id: 'i2', description: 'Cloud Hosting', quantity: 2, unitPrice: 1200, total: 2400}], subtotal: 2400, tax: 240, total: 2640, comments: '', status: 'Sent' },
];

let recurringInvoices: RecurringInvoice[] = [
    { id: 'rec1', contact: contacts[1], startDate: '2024-01-01', frequency: 'Monthly', items: [{id: 'ri1', description: 'Cloud Hosting Subscription', quantity: 1, unitPrice: 100, total: 100}], subtotal: 100, tax: 10, total: 110, comments: 'Monthly hosting fee', status: 'Active' }
];

let quotes: Quote[] = [
    { id: 'qt1', quoteNumber: 'QT-001', contact: contacts[0], issueDate: '2024-06-01', expiryDate: '2024-06-30', items: [{id: 'qi1', description: 'New Website Design', quantity: 1, unitPrice: 8000, total: 8000}], subtotal: 8000, tax: 800, total: 8800, comments: 'Proposal for website redesign.', status: 'Accepted'}
];

let purchases: Purchase[] = [
    { id: 'pur1', vendor: 'Office Supplies Co.', supplier: contacts[2], date: '2024-07-10', purchaseOrderNumber: 'PO-2024-07-101', total: 450, status: 'Paid', purchaseType: 'Credit', currency: 'AED', lineItems: [{ id: 'pli1', description: 'Office Chairs', amount: 400, account: 'Assets', vat: 50 }], subtotal: 400, vat: 50 },
    { id: 'pur2', vendor: 'Cloud Services LLC', supplier: contacts[3], date: '2024-07-18', purchaseOrderNumber: 'PO-2024-07-102', total: 120, status: 'Pending', purchaseType: 'Credit', currency: 'USD', lineItems: [{ id: 'pli2', description: 'Server Maintenance', amount: 120, account: 'Expenses', vat: 0 }], subtotal: 120, vat: 0 },
];

let pettyCashTransactions: PettyCashTransaction[] = [
    { id: 'pc1', date: '2024-07-05', description: 'Initial funding', type: 'Funding', amount: 500, status: 'Approved' },
    { id: 'pc2', date: '2024-07-12', description: 'Office snacks', type: 'Expense', amount: 45.50, status: 'Approved' },
    { id: 'pc3', date: '2024-07-25', description: 'Taxi for client meeting', type: 'Expense', amount: 30.00, status: 'Pending' },
];

let bankAccounts: BankAccount[] = [
    { id: 'bk1', accountName: 'Main Checking Account', bankName: 'First National Bank', accountNumber: '**** **** **** 1234', balance: 54321.89, type: 'Bank' },
    { id: 'bk2', accountName: 'Business Savings', bankName: 'First National Bank', accountNumber: '**** **** **** 5678', balance: 120540.11, type: 'Bank' },
    { id: 'pc-account', accountName: 'Petty Cash on Hand', bankName: 'Internal Fund', accountNumber: 'N/A', balance: 454.50, type: 'Cash' },
];

let bankTransactions: BankTransaction[] = [
    { id: 'tx1', accountId: 'bk1', date: '2024-07-20', description: 'Client Payment - Innovate Inc. for Invoice #INV-001', amount: 5500 },
    { id: 'tx2', accountId: 'bk1', date: '2024-07-22', description: 'Vendor Payment - Office Supplies Co.', amount: -450 },
    { id: 'tx3', accountId: 'bk2', date: '2024-07-01', description: 'Interest Earned', amount: 150.23 },
    { id: 'tx4', accountId: 'pc-account', date: '2024-07-05', description: 'Initial funding', amount: 500 },
    { id: 'tx5', accountId: 'pc-account', date: '2024-07-12', description: 'Office snacks', amount: -45.50 },
];

let companyProfile: CompanyProfile = {
  name: 'Your Company Name',
  address: '123 Enterprise Way, Business City',
  email: 'admin@zenith.com',
  phone: '555-0100',
  logoUrl: 'https://picsum.photos/100',
};

let users: User[] = [
    { id: 'u1', name: 'Admin User', email: 'admin@zenith.com', role: 'Admin', status: 'Active' },
    { id: 'u2', name: 'Jane Doe', email: 'jane.doe@zenith.com', role: 'Member', status: 'Active' },
    { id: 'u3', name: 'John Smith', email: 'john.smith@zenith.com', role: 'Member', status: 'Invited' },
];

let preferences: Preferences = {
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
Hope you’re doing well!

Please find attached your Invoice #[InvoiceNumber] with a total amount of [TotalAmount].
Kindly review the details and let us know if you have any questions.

We’d appreciate it if you could make the payment at your earliest convenience.
Once payment is completed, please share the confirmation so we can update our records.

Thank you for your continued support and trust in us! 💙

Best regards,
[Your Name / Company Name]
📞 [Contact Number] | 💬 WhatsApp Support`,
};

let integrations: Integration[] = [
    { id: 'int1', name: 'Stripe', description: 'Connect your Stripe account for online payments.', logo: 'https://picsum.photos/40?random=1', isConnected: true },
    { id: 'int2', name: 'Slack', description: 'Get notifications directly in your Slack workspace.', logo: 'https://picsum.photos/40?random=2', isConnected: false },
    { id: 'int3', name: 'Google Drive', description: 'Sync documents and attachments with Google Drive.', logo: 'https://picsum.photos/40?random=3', isConnected: false },
];

let notifications: Notification[] = [
    { id: 'n1', message: 'Payment of $5,500 received from Innovate Inc. for INV-001.', date: '2024-07-20', read: true, link: '/sales/invoice/inv1', type: 'payment'},
    { id: 'n2', message: 'Quote QT-001 for $8,800 was accepted by Innovate Inc.', date: '2024-06-15', read: true, link: '/sales/quote/qt1', type: 'quote'},
    { id: 'n3', message: 'Stock for "Office Chairs" is low (8 remaining).', date: '2024-07-28', read: false, link: '/sales/products', type: 'stock'},
    { id: 'n4', message: 'New invoice INV-002 for Quantum Solutions is due in 10 days.', date: '2024-08-09', read: false, link: '/sales/invoice/inv2', type: 'general'},
];


// --- API FUNCTIONS ---

// Authentication
export const authenticateUser = (email: string, password: string): User | null => {
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  // In a real app, you'd check a hashed password. Here we'll just check for a dummy password.
  if (user && password === 'password123') { 
    return user;
  }
  return null;
};

// Contacts
export const getContacts = () => contacts;
export const addContact = (contact: Omit<Contact, 'id'>) => { contacts.push({ ...contact, id: generateId() }); eventBus.emit('dataChanged'); };
export const updateContact = (updatedContact: Contact) => { contacts = contacts.map(c => c.id === updatedContact.id ? updatedContact : c); eventBus.emit('dataChanged'); };
export const deleteContact = (id: string) => { contacts = contacts.filter(c => c.id !== id); eventBus.emit('dataChanged'); };

// Invoices
export const getInvoices = () => invoices;
// FIX: The addInvoice function should return the newly created invoice.
export const addInvoice = (invoice: Omit<Invoice, 'id'>): Invoice => { 
    const newInvoice = { ...invoice, id: generateId() };
    invoices.push(newInvoice); 
    eventBus.emit('dataChanged');
    return newInvoice;
};
export const updateInvoice = (updatedInvoice: Invoice) => { invoices = invoices.map(i => i.id === updatedInvoice.id ? updatedInvoice : i); eventBus.emit('dataChanged'); };
export const deleteInvoice = (id: string) => { invoices = invoices.filter(i => i.id !== id); eventBus.emit('dataChanged'); };

// Recurring Invoices
export const getRecurringInvoices = () => recurringInvoices;
export const addRecurringInvoice = (invoice: Omit<RecurringInvoice, 'id'>) => { recurringInvoices.push({ ...invoice, id: generateId() }); eventBus.emit('dataChanged'); };
export const updateRecurringInvoice = (updatedInvoice: RecurringInvoice) => { recurringInvoices = recurringInvoices.map(i => i.id === updatedInvoice.id ? updatedInvoice : i); eventBus.emit('dataChanged'); };
export const deleteRecurringInvoice = (id: string) => { recurringInvoices = recurringInvoices.filter(i => i.id !== id); eventBus.emit('dataChanged'); };

// Quotes
export const getQuotes = () => quotes;
export const addQuote = (quote: Omit<Quote, 'id'>) => { quotes.push({ ...quote, id: generateId() }); eventBus.emit('dataChanged'); };
export const updateQuote = (updatedQuote: Quote) => { quotes = quotes.map(q => q.id === updatedQuote.id ? updatedQuote : q); eventBus.emit('dataChanged'); };
export const deleteQuote = (id: string) => { quotes = quotes.filter(q => q.id !== id); eventBus.emit('dataChanged'); };

// Products & Services
export const getProductsServices = () => productsOrServices;
export const addProductOrService = (item: Omit<ProductOrService, 'id'>) => { productsOrServices.push({ ...item, id: generateId() }); eventBus.emit('dataChanged'); };
export const updateProductOrService = (updatedItem: ProductOrService) => { productsOrServices = productsOrServices.map(i => i.id === updatedItem.id ? updatedItem : i); eventBus.emit('dataChanged'); };
export const deleteProductOrService = (id: string) => { productsOrServices = productsOrServices.filter(i => i.id !== id); eventBus.emit('dataChanged'); };

// Purchases
export const getPurchases = () => purchases;
export const getPurchaseById = (id: string) => purchases.find(p => p.id === id);
export const addPurchase = (purchase: Omit<Purchase, 'id'>) => { purchases.unshift({ ...purchase, id: generateId(), vendor: purchase.supplier?.name }); eventBus.emit('dataChanged'); };
export const updatePurchase = (updatedPurchase: Purchase) => {
    purchases = purchases.map(p => p.id === updatedPurchase.id ? { ...updatedPurchase, vendor: updatedPurchase.supplier?.name } : p);
    eventBus.emit('dataChanged');
};
export const deletePurchase = (id: string) => {
    purchases = purchases.filter(p => p.id !== id);
    eventBus.emit('dataChanged');
};

// Petty Cash
export const getPettyCashTransactions = () => pettyCashTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
export const addPettyCashTransaction = (transaction: Omit<PettyCashTransaction, 'id'>, fundingAccountId?: string) => { 
    pettyCashTransactions.push({ ...transaction, id: generateId() }); 
    if (transaction.type === 'Funding' && fundingAccountId) {
        addBankTransaction({
            accountId: fundingAccountId,
            date: transaction.date,
            description: `Transfer to Petty Cash: ${transaction.description}`,
            amount: -transaction.amount,
        });
        addBankTransaction({
            accountId: 'pc-account',
            date: transaction.date,
            description: `Funding from bank: ${transaction.description}`,
            amount: transaction.amount,
        });
    }
    eventBus.emit('dataChanged'); 
};
export const updatePettyCashTransaction = (updatedTransaction: PettyCashTransaction) => {
    const originalTransaction = pettyCashTransactions.find(t => t.id === updatedTransaction.id);
    pettyCashTransactions = pettyCashTransactions.map(t => t.id === updatedTransaction.id ? updatedTransaction : t);

    // If a pending transaction is now approved, create the bank transaction
    if (originalTransaction?.status === 'Pending' && updatedTransaction.status === 'Approved') {
        let amount = updatedTransaction.amount;
        if (updatedTransaction.type === 'Expense') {
            amount = -amount;
        }
        addBankTransaction({
            accountId: 'pc-account',
            date: updatedTransaction.date,
            description: updatedTransaction.description,
            amount: amount,
        });
    }

    eventBus.emit('dataChanged');
};

// Bank
export const getBankAccounts = () => bankAccounts;
export const addBankAccount = (account: Omit<BankAccount, 'id'>) => { bankAccounts.push({ ...account, id: generateId(), type: 'Bank' }); eventBus.emit('dataChanged'); };
export const updateBankAccount = (updatedAccount: BankAccount) => { bankAccounts = bankAccounts.map(a => a.id === updatedAccount.id ? updatedAccount : a); eventBus.emit('dataChanged'); };
export const deleteBankAccount = (id: string) => { bankAccounts = bankAccounts.filter(a => a.id !== id); eventBus.emit('dataChanged'); };
export const getBankTransactions = (accountId: string) => bankTransactions.filter(tx => tx.accountId === accountId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
export const addBankTransaction = (transaction: Omit<BankTransaction, 'id'>) => { 
    bankTransactions.push({ ...transaction, id: generateId() }); 
    const account = bankAccounts.find(a => a.id === transaction.accountId);
    if (account) {
        account.balance += transaction.amount;
    }
    eventBus.emit('dataChanged'); 
};

// Settings
export const getCompanyProfile = () => companyProfile;
export const updateCompanyProfile = (profile: CompanyProfile) => { companyProfile = profile; eventBus.emit('dataChanged'); };
export const getUsers = () => users;
export const inviteUser = (email: string, role: 'Admin' | 'Member') => { users.push({ id: generateId(), name: 'Invited User', email, role, status: 'Invited' }); eventBus.emit('dataChanged'); };
export const updateUser = (updatedUser: User) => { users = users.map(u => u.id === updatedUser.id ? updatedUser : u); eventBus.emit('dataChanged'); };
export const deleteUser = (id: string) => { users = users.filter(u => u.id !== id); eventBus.emit('dataChanged'); };
export const getPreferences = () => preferences;
export const updatePreferences = (prefs: Preferences) => { preferences = prefs; eventBus.emit('dataChanged'); eventBus.emit('themeChanged'); };
export const getIntegrations = () => integrations;
export const updateIntegrationStatus = (id: string, isConnected: boolean) => { integrations = integrations.map(i => i.id === id ? { ...i, isConnected } : i); eventBus.emit('dataChanged'); };
export const getNotifications = () => notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
export const markAllNotificationsAsRead = () => {
    notifications.forEach(n => n.read = true);
    eventBus.emit('dataChanged');
};


// --- REPORT DATA ---

export const mockTrialBalance: TrialBalanceAccount[] = [
    { accountCode: '1010', accountName: 'Cash and Bank', debit: 173811.00, credit: 0 },
    { accountCode: '1020', accountName: 'Petty Cash', debit: 454.50, credit: 0 },
    { accountCode: '1200', accountName: 'Accounts Receivable', debit: 2640.00, credit: 0 },
    { accountCode: '1510', accountName: 'Office Equipment', debit: 400.00, credit: 0 },
    { accountCode: '2010', accountName: 'Accounts Payable', debit: 0, credit: 120.00 },
    { accountCode: '3000', accountName: 'Owner\'s Equity', debit: 0, credit: 170000.00 },
    { accountCode: '4010', accountName: 'Sales Revenue', debit: 0, credit: 7400.00 },
    { accountCode: '6010', accountName: 'Bank Fees', debit: 20.00, credit: 0 },
    { accountCode: '6020', accountName: 'Office Expenses', debit: 120.00, credit: 0 },
     { accountCode: '6030', accountName: 'General Expenses (Petty Cash)', debit: 45.50, credit: 0 },
    { accountCode: '2210', accountName: 'VAT Payable', debit: 50.00, credit: 740.00 },
];

export const mockProfitLoss: { income: ProfitLossLine[], expenses: ProfitLossLine[] } = {
    income: [
        { label: 'Sales Revenue', amount: 7400.00 },
    ],
    expenses: [
        { label: 'Bank Fees', amount: 20.00 },
        { label: 'Office Expenses', amount: 120.00 },
        { label: 'General Expenses', amount: 45.50 },
    ]
};

export const mockBalanceSheet = {
    assets: {
        current: [
            { label: 'Cash and Bank', amount: 173811.00 },
            { label: 'Petty Cash', amount: 454.50 },
            { label: 'Accounts Receivable', amount: 2640.00 },
        ],
        fixed: [
            { label: 'Office Equipment', amount: 400.00 },
        ]
    },
    liabilities: {
        current: [
            { label: 'Accounts Payable', amount: 120.00 },
            { label: 'VAT Payable', amount: 690.00 },
        ]
    },
    equity: [
        { label: 'Owner\'s Equity', amount: 170000.00 },
        { label: 'Retained Earnings (Net Profit)', amount: 7214.50 },
    ]
};

export const mockCashFlow: CashFlowSection[] = [
    {
        title: 'Operating Activities',
        items: [
            { label: 'Cash from customers', amount: 5500 },
            { label: 'Cash paid to suppliers', amount: -450 },
            { label: 'Cash paid for expenses', amount: -185.50 },
        ],
        total: 4864.5
    },
    {
        title: 'Investing Activities',
        items: [],
        total: 0
    },
    {
        title: 'Financing Activities',
        items: [
             { label: 'Owner\'s Contribution', amount: 170000 },
        ],
        total: 170000
    }
];

export const mockCorporateTax: TaxCalculationLine[] = [
    { label: 'Gross Profit', amount: 7214.50 },
    { label: 'Allowable Deductions', amount: 185.50 },
    { label: 'Taxable Income', amount: 7029.00, isTotal: true },
    { label: 'Tax Rate', amount: 0.09 },
    { label: 'Tax Payable', amount: 632.61, isTotal: true },
];

export const mockPostingReport: PostingDetail[] = [
    { date: '2024-07-15', description: 'Invoice INV-001', account: 'Accounts Receivable', debit: 5500 },
    { date: '2024-07-15', description: 'Invoice INV-001', account: 'Sales Revenue', credit: 5000 },
    { date: '2024-07-15', description: 'Invoice INV-001', account: 'VAT Payable', credit: 500 },
    { date: '2024-07-20', description: 'Payment for INV-001', account: 'Cash and Bank', debit: 5500 },
    { date: '2024-07-20', description: 'Payment for INV-001', account: 'Accounts Receivable', credit: 5500 },
];

export const mockAgedDebtors: AgedPayable[] = [
    { contactName: 'Quantum Solutions', totalDue: 2640.00, current: 2640.00, days30: 0, days60: 0, days90plus: 0 }
];
export const mockAgedCreditors: AgedPayable[] = [
    { contactName: 'Cloud Services LLC', totalDue: 120.00, current: 120.00, days30: 0, days60: 0, days90plus: 0 }
];

export const generateStatementReport = (customerId: string): { contact: Contact, transactions: StatementTransaction[], balance: number } | null => {
  const customer = contacts.find(c => c.id === customerId);
  if (!customer) return null;

  const customerInvoices = invoices.filter(inv => inv.contact.id === customerId);

  let statementTransactions: StatementTransaction[] = [];

  // Add invoices to transactions
  customerInvoices.forEach(invoice => {
    statementTransactions.push({
      date: invoice.issueDate,
      type: 'Invoice',
      details: `Invoice #${invoice.invoiceNumber}`,
      amount: invoice.total,
    });
  });
  
  // Find payments from bank transactions
  const allTransactions: BankTransaction[] = [];
  bankAccounts.forEach(account => {
      const accountTransactions = bankTransactions.filter(tx => tx.accountId === account.id);
      allTransactions.push(...accountTransactions);
  });
  
  customerInvoices.forEach(invoice => {
    // Find payment associated with an invoice
    const paymentTx = allTransactions.find(tx => 
        tx.description.includes(`Invoice #${invoice.invoiceNumber}`) && tx.amount > 0
    );
    if (paymentTx) {
      statementTransactions.push({
        date: paymentTx.date,
        type: 'Payment',
        details: 'Thank you',
        amount: -paymentTx.amount, // Payment reduces balance due
      });
    }
  });

  // Sort all transactions by date
  statementTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const balance = statementTransactions.reduce((acc, tx) => acc + tx.amount, 0);

  return {
    contact: customer,
    transactions: statementTransactions,
    balance: balance
  };
};

export const mockVatReport: { sales: VatTransaction[], purchases: VatTransaction[] } = {
    sales: [
        { date: '2024-07-15', description: 'INV-001', type: 'Sale', netAmount: 5000, vatAmount: 500 },
        { date: '2024-07-20', description: 'INV-002', type: 'Sale', netAmount: 2400, vatAmount: 240 },
    ],
    purchases: [
        { date: '2024-07-10', description: 'pur1', type: 'Purchase', netAmount: 400, vatAmount: 50 },
    ]
};