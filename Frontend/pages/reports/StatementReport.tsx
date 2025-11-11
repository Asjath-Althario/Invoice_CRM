import React, { useEffect, useMemo, useState } from 'react';
import type { CompanyProfile, Contact, StatementTransaction } from '../../types';
import ExportOptions from '../../components/ExportOptions';
import { formatCurrency } from '../../utils/formatting';
import eventBus from '../../utils/eventBus';
import { apiService } from '../../services/api';

const StatementReport: React.FC = () => {
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>({ name: '', address: '', email: '', phone: '', logoUrl: '' });
  const [customers, setCustomers] = useState<Contact[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [bankTransactions, setBankTransactions] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toLocaleDateString('en-CA');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [profileRaw, contactsRaw, invoicesRaw, bankAccountsRaw] = await Promise.all([
        apiService.getCompanyProfile(),
        apiService.getContacts(),
        apiService.getInvoices(),
        apiService.getBankAccounts(),
      ]);
      const profile: any = profileRaw as any;
      setCompanyProfile({
        name: profile.name || profile.company_name || '',
        address: profile.address || '',
        email: profile.email || '',
        phone: profile.phone || '',
        logoUrl: profile.logoUrl || profile.logo_url || ''
      });
      const custs = (contactsRaw as any[]).filter(c => c.type === 'Customer');
      setCustomers(custs as Contact[]);
      setInvoices(invoicesRaw as any[]);
      setBankAccounts(bankAccountsRaw as any[]);
      if (custs.length > 0 && !selectedCustomerId) setSelectedCustomerId(custs[0].id);
    } catch (e:any) {
      setError(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = eventBus.on('dataChanged', loadData);
    return () => unsub();
  }, []);

  useEffect(() => {
    // Load transactions per bank account when accounts change
    const fetchTransactions = async () => {
      const txMap: Record<string, any[]> = {};
      for (const acct of bankAccounts) {
        try {
          const txs = await apiService.getBankTransactions(acct.id);
          txMap[acct.id] = txs as any[];
        } catch { txMap[acct.id] = []; }
      }
      setBankTransactions(txMap);
    };
    if (bankAccounts.length) fetchTransactions();
  }, [bankAccounts]);

  const statementData = useMemo(() => {
    if (!selectedCustomerId) return null;
    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) return null;
    const customerInvoices = invoices.filter(inv => inv.contact && (inv.contact.id === selectedCustomerId || inv.contact_id === selectedCustomerId));

    const transactions: StatementTransaction[] = [];
    customerInvoices.forEach(inv => {
      transactions.push({
        date: inv.issueDate || inv.issue_date,
        type: 'Invoice',
        details: `Invoice #${inv.invoiceNumber || inv.invoice_number}`,
        amount: Number(inv.total || inv.total_amount || 0)
      });
    });

    // Match payments: search bank transactions containing invoice number and positive amount
    const allBankTx = Object.values(bankTransactions).flat() as any[];
    customerInvoices.forEach(inv => {
      const number = inv.invoiceNumber || inv.invoice_number;
      const paymentTx = allBankTx.find((tx:any) => tx.description && number && tx.description.includes(number) && Number(tx.amount) > 0);
      if (paymentTx) {
        transactions.push({
          date: paymentTx.date,
          type: 'Payment',
          details: 'Payment received',
          amount: -Number(paymentTx.amount)
        });
      }
    });

    transactions.sort((a,b)=> new Date(a.date).getTime() - new Date(b.date).getTime());
    const balance = transactions.reduce((s,t)=> s + t.amount,0);
    return { contact: customer, transactions, balance };
  }, [selectedCustomerId, customers, invoices, bankTransactions]);

  const convertToCSV = () => {
    if (!statementData) return '';
    let csv = `Statement for ${statementData.contact.name}\n`;
    csv += 'Date,Type,Details,Amount,Balance\n';
    let runningBalance = 0;
    statementData.transactions.forEach(tx => {
      runningBalance += tx.amount;
      csv += `${tx.date},${tx.type},"${tx.details}",${tx.amount},${runningBalance}\n`;
    });
    csv += `\nBalance Due,${statementData.balance}\n`;
    return csv;
  };

  return (
    <div id="printable-report" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold dark:text-white">Statement of Account</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Date: {today}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="print:hidden">
            <label htmlFor="customer-select" className="sr-only">Select Customer</label>
            <select
              id="customer-select"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="block w-full max-w-xs bg-white text-gray-900 border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="" disabled>Select a customer</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <ExportOptions reportName="Statement" csvGenerator={convertToCSV} />
        </div>
      </div>

      {loading && <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && statementData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="border dark:border-gray-700 rounded-lg p-4">
              <h3 className="font-semibold dark:text-white">From:</h3>
              <p className="text-gray-700 dark:text-gray-300">{companyProfile.name}</p>
              <p className="text-gray-700 dark:text-gray-300">{companyProfile.address}</p>
              <p className="text-gray-700 dark:text-gray-300">{companyProfile.email}</p>
            </div>
            <div className="border dark:border-gray-700 rounded-lg p-4">
              <h3 className="font-semibold dark:text-white">To:</h3>
              <p className="text-gray-700 dark:text-gray-300">{statementData.contact.name}</p>
              <p className="text-gray-700 dark:text-gray-300">{statementData.contact.address}</p>
              <p className="text-gray-700 dark:text-gray-300">{statementData.contact.email}</p>
            </div>
          </div>
          <div className="overflow-x-auto border dark:border-gray-700 rounded-lg">
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Details</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Amount</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {(() => {
                  let runningBalance = 0;
                  return statementData.transactions.map((tx, index) => {
                    runningBalance += tx.amount;
                    return (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-gray-300">{tx.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-gray-300">{tx.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-gray-300">{tx.details}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono dark:text-gray-200">{formatCurrency(tx.amount)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono dark:text-gray-200">{formatCurrency(runningBalance)}</td>
                      </tr>
                    );
                  })
                })()}
              </tbody>
            </table>
          </div>
          <div className="mt-6 text-right">
            <p className="text-2xl font-bold dark:text-white">Balance Due: <span className="font-mono">{formatCurrency(statementData.balance)}</span></p>
          </div>
        </>
      )}
      {!loading && !error && !statementData && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>Please select a customer to view their statement.</p>
        </div>
      )}
    </div>
  );
};

export default StatementReport;