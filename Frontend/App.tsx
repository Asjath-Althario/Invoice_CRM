import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import Accounting from './pages/Accounting';
import Reports from './pages/Reports';
import Contacts from './pages/Contacts';
import Banks from './pages/banks/Banks';
import Settings from './pages/Settings';
import NewPurchase from './pages/accounting/NewPurchase';
import PurchaseList from './pages/accounting/PurchaseList';
import Templates from './pages/accounting/Templates';
import InvoiceDetail from './pages/sales/InvoiceDetail';
import PettyCash from './pages/accounting/PettyCash';
import InvoiceList from './pages/sales/InvoiceList';
import RecurringInvoices from './pages/sales/RecurringInvoices';
import Quotes from './pages/sales/Quotes';
import Subscriptions from './pages/sales/Subscriptions';
import ProductsServices from './pages/sales/ProductsServices';
import RecurringInvoiceDetail from './pages/sales/RecurringInvoiceDetail';
import QuoteDetail from './pages/sales/QuoteDetail';
import TrialBalance from './pages/reports/TrialBalance';
import BalanceSheet from './pages/reports/BalanceSheet';
import ProfitLoss from './pages/reports/ProfitLoss';
import CashFlow from './pages/reports/CashFlow';
import CorporateTax from './pages/reports/CorporateTax';
import PostingReport from './pages/reports/PostingReport';
import VatReport from './pages/reports/VatReport';
import AgedDebtors from './pages/reports/AgedDebtors';
import AgedCreditors from './pages/reports/AgedCreditors';
import StatementReport from './pages/reports/StatementReport';
import BankDetail from './pages/banks/BankDetail';
import { applyTheme } from './utils/theme';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Chatbot from './components/Chatbot';

const MainLayout: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-light dark:bg-gray-900">
      <Sidebar isOpen={isSidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-light dark:bg-gray-900 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
      <Chatbot />
    </div>
  );
};

const App: React.FC = () => {
  useEffect(() => {
    applyTheme();
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/sales" element={<Sales />}>
            <Route index element={<Navigate to="invoices" replace />} />
            <Route path="invoices" element={<InvoiceList />} />
            <Route path="invoice/new" element={<InvoiceDetail />} />
            <Route path="invoice/:invoiceId" element={<InvoiceDetail />} />
            <Route path="recurring" element={<RecurringInvoices />} />
            <Route path="recurring/new" element={<RecurringInvoiceDetail />} />
            <Route path="recurring/:recurringInvoiceId" element={<RecurringInvoiceDetail />} />
            <Route path="quotes" element={<Quotes />} />
            <Route path="quote/new" element={<QuoteDetail />} />
            <Route path="quote/:quoteId" element={<QuoteDetail />} />
            <Route path="subscriptions" element={<Subscriptions />} />
            <Route path="products" element={<ProductsServices />} />
          </Route>
          <Route path="/accounting" element={<Accounting />}>
            <Route index element={<Navigate to="purchases" replace />} />
            <Route path="purchases" element={<PurchaseList />} />
            <Route path="purchases/new" element={<NewPurchase />} />
            <Route path="purchases/:purchaseId" element={<NewPurchase />} />
            <Route path="templates" element={<Templates />} />
            <Route path="petty-cash" element={<PettyCash />} />
          </Route>
          <Route path="/reports" element={<Reports />}>
            <Route index element={<Navigate to="trial-balance" replace />} />
            <Route path="trial-balance" element={<TrialBalance />} />
            <Route path="balance-sheet" element={<BalanceSheet />} />
            <Route path="profit-loss" element={<ProfitLoss />} />
            <Route path="cash-flow" element={<CashFlow />} />
            <Route path="corporate-tax" element={<CorporateTax />} />
            <Route path="posting" element={<PostingReport />} />
            <Route path="vat" element={<VatReport />} />
            <Route path="aged-debtors" element={<AgedDebtors />} />
            <Route path="aged-creditors" element={<AgedCreditors />} />
            <Route path="statement" element={<StatementReport />} />
          </Route>
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/banks" element={<Banks />} />
          <Route path="/banks/:accountId" element={<BankDetail />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default App;