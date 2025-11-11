import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../../services/api';
import type { CompanyProfile } from '../../types';
import ExportOptions from '../../components/ExportOptions';
import { formatCurrency } from '../../utils/formatting';
import eventBus from '../../utils/eventBus';

type TrialBalanceAccount = { accountCode: string; accountName: string; debit: number; credit: number };

interface RawDataState {
  invoices: any[];
  purchases: any[];
  bankAccounts: any[];
  pettyCash: any[];
}

const TrialBalance: React.FC = () => {
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>({ name: '', address: '', email: '', phone: '', logoUrl: '' });
  const [raw, setRaw] = useState<RawDataState>({ invoices: [], purchases: [], bankAccounts: [], pettyCash: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [profileRaw, invoices, purchases, bankAccounts, pettyCash] = await Promise.all([
        apiService.getCompanyProfile(),
        apiService.getInvoices(),
        apiService.getPurchases().catch(()=>[]),
        apiService.getBankAccounts(),
        apiService.getPettyCashTransactions().catch(()=>[])
      ]);
      const profile: any = profileRaw as any;
      setCompanyProfile({
        name: profile.name || profile.company_name || '',
        address: profile.address || '',
        email: profile.email || '',
        phone: profile.phone || '',
        logoUrl: profile.logoUrl || profile.logo_url || ''
      });
      setRaw({ invoices: invoices as any[], purchases: purchases as any[], bankAccounts: bankAccounts as any[], pettyCash: pettyCash as any[] });
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

  const pettyCashBalance = useMemo(() => raw.pettyCash.reduce((sum, tx:any) => {
    if (tx.type === 'Income' || tx.type === 'Funding') return sum + Number(tx.amount || 0);
    if (tx.type === 'Expense') return sum - Number(tx.amount || 0);
    return sum;
  }, 0), [raw.pettyCash]);

  const bankBalance = useMemo(() => raw.bankAccounts.reduce((s,a)=> s + Number(a.balance||0),0), [raw.bankAccounts]);
  const accountsReceivable = useMemo(() => raw.invoices.filter(i=> i.status && i.status !== 'Paid').reduce((s,i)=> s + Number(i.total || i.total_amount || 0),0), [raw.invoices]);
  const accountsPayable = useMemo(() => raw.purchases.filter(p=> p.status && p.status !== 'Paid').reduce((s,p)=> s + Number(p.total || p.total_amount || 0),0), [raw.purchases]);
  const salesRevenue = useMemo(()=> raw.invoices.reduce((s,i)=> s + Number(i.subtotal || 0),0), [raw.invoices]);
  const vatOnSales = useMemo(()=> raw.invoices.reduce((s,i)=> s + Number(i.tax || i.tax_amount || 0),0), [raw.invoices]);
  const vatOnPurchases = useMemo(()=> raw.purchases.reduce((s,p)=> s + Number(p.vat || p.tax_amount || 0),0), [raw.purchases]);
  const vatPayableNet = vatOnSales - vatOnPurchases; // positive => liability

  const lines: TrialBalanceAccount[] = useMemo(()=> {
    const arr: TrialBalanceAccount[] = [
      { accountCode: '1010', accountName: 'Cash and Bank', debit: bankBalance, credit: 0 },
      { accountCode: '1020', accountName: 'Petty Cash', debit: pettyCashBalance, credit: 0 },
      { accountCode: '1200', accountName: 'Accounts Receivable', debit: accountsReceivable, credit: 0 },
      { accountCode: '2010', accountName: 'Accounts Payable', debit: 0, credit: accountsPayable },
      { accountCode: '2210', accountName: 'VAT Payable', debit: vatPayableNet < 0 ? Math.abs(vatPayableNet) : 0, credit: vatPayableNet > 0 ? vatPayableNet : 0 },
      { accountCode: '4010', accountName: 'Sales Revenue', debit: 0, credit: salesRevenue },
    ];
    return arr.filter(l => (l.debit || l.credit));
  }, [bankBalance, pettyCashBalance, accountsReceivable, accountsPayable, salesRevenue, vatPayableNet]);

  const totalDebit = lines.reduce((s,l)=> s + l.debit,0);
  const totalCredit = lines.reduce((s,l)=> s + l.credit,0);

  const convertToCSV = () => {
    let csv = 'Trial Balance\nAccount Code,Account Name,Debit,Credit\n';
    lines.forEach(line => { csv += `${line.accountCode},"${line.accountName}",${line.debit.toFixed(2)},${line.credit.toFixed(2)}\n`; });
    csv += `Totals,,${totalDebit.toFixed(2)},${totalCredit.toFixed(2)}\n`;
    return csv;
  };

  const today = new Date().toLocaleDateString('en-CA');

  return (
    <div id="printable-report" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold dark:text-white">Trial Balance</h2>
          <p className="text-gray-600 dark:text-gray-400 font-semibold">{companyProfile.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">As of {today}</p>
        </div>
        <ExportOptions reportName="Trial Balance" csvGenerator={convertToCSV} />
      </div>
      {loading && <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !error && (
        <div className="overflow-x-auto border dark:border-gray-700 rounded-lg">
          <table className="min-w-full bg-white dark:bg-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Account Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Account Name</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Debit</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {lines.map(account => (
                <tr key={account.accountCode}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{account.accountCode}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{account.accountName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right font-mono">{account.debit > 0 ? formatCurrency(account.debit) : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right font-mono">{account.credit > 0 ? formatCurrency(account.credit) : '-'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <td colSpan={2} className="px-6 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-200 uppercase">Totals</td>
                <td className="px-6 py-3 text-right text-sm font-bold font-mono text-gray-700 dark:text-gray-200">{formatCurrency(totalDebit)}</td>
                <td className="px-6 py-3 text-right text-sm font-bold font-mono text-gray-700 dark:text-gray-200">{formatCurrency(totalCredit)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

export default TrialBalance;
