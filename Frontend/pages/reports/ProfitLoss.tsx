import React, { useEffect, useMemo, useState } from 'react';
import type { CompanyProfile, ProfitLossLine } from '../../types';
import ExportOptions from '../../components/ExportOptions';
import { formatCurrency } from '../../utils/formatting';
import eventBus from '../../utils/eventBus';
import { apiService } from '../../services/api';

const ReportSection: React.FC<{ title: string, items: ProfitLossLine[], total: number }> = ({ title, items, total }) => (
  <>
    <tr><td colSpan={2} className="px-6 py-3 text-left text-sm font-bold text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-700">{title}</td></tr>
    {items.map(item => (
      <tr key={item.label}>
        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 pl-8">{item.label}</td>
        <td className="px-6 py-3 whitespace-nowrap text-sm text-right font-mono text-gray-800 dark:text-gray-200">{formatCurrency(item.amount || 0)}</td>
      </tr>
    ))}
    <tr>
      <td className="px-6 py-3 text-left text-sm font-bold text-gray-800 dark:text-gray-100">Total {title}</td>
      <td className="px-6 py-3 text-right text-sm font-bold font-mono text-gray-800 dark:text-gray-100 border-t border-black dark:border-gray-500">{formatCurrency(total)}</td>
    </tr>
    <tr><td colSpan={2} className="py-2"></td></tr>
  </>
);

const ProfitLoss: React.FC = () => {
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>({ name: '', address: '', email: '', phone: '', logoUrl: '' });
  const [invoices, setInvoices] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [profileRaw, invs, purs] = await Promise.all([
        apiService.getCompanyProfile(),
        apiService.getInvoices(),
        apiService.getPurchases().catch(()=>[]),
      ]);
      const profile: any = profileRaw as any;
      setCompanyProfile({
        name: profile.name || profile.company_name || '',
        address: profile.address || '',
        email: profile.email || '',
        phone: profile.phone || '',
        logoUrl: profile.logoUrl || profile.logo_url || ''
      });
      setInvoices(invs as any[]);
      setPurchases(purs as any[]);
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

  // Aggregate
  const incomeItems: ProfitLossLine[] = useMemo(() => [
    { label: 'Sales Revenue', amount: invoices.reduce((s,i)=> s + Number(i.subtotal || 0), 0) },
  ], [invoices]);

  const expenseItems: ProfitLossLine[] = useMemo(() => {
    const purchaseTotal = purchases.reduce((s,p)=> s + Number(p.subtotal || 0), 0);
    const pettyCashExpenses = 0; // If needed, can pull petty cash and sum Expense type
    return [
      { label: 'Cost of Goods/Services', amount: purchaseTotal },
      ...(pettyCashExpenses ? [{ label: 'Petty Cash Expenses', amount: pettyCashExpenses }] : []),
    ];
  }, [purchases]);

  const totalIncome = incomeItems.reduce((s,i)=> s + i.amount, 0);
  const totalExpenses = expenseItems.reduce((s,i)=> s + i.amount, 0);
  const netProfit = totalIncome - totalExpenses;

  const today = new Date().toLocaleDateString('en-CA');

  const convertToCSV = () => {
    let csv = 'Profit & Loss\n\n';
    csv += 'Income\n';
    incomeItems.forEach(i => csv += `"${i.label}",${i.amount}\n`);
    csv += '\nExpenses\n';
    expenseItems.forEach(e => csv += `"${e.label}",${e.amount}\n`);
    csv += `\nNet Profit,${netProfit}\n`;
    return csv;
  };

  return (
    <div id="printable-report" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold dark:text-white">Profit & Loss</h2>
          <p className="text-gray-600 dark:text-gray-400 font-semibold">{companyProfile.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">For the period ending {today}</p>
        </div>
        <ExportOptions reportName="Profit and Loss" csvGenerator={convertToCSV} />
      </div>

      {loading && <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto border dark:border-gray-700 rounded-lg max-w-3xl mx-auto">
          <table className="min-w-full bg-white dark:bg-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              <ReportSection title="Income" items={incomeItems} total={totalIncome} />
              <ReportSection title="Expenses" items={expenseItems} total={totalExpenses} />
              <tr>
                <td className="px-6 py-3 text-left text-lg font-extrabold text-gray-900 dark:text-white">Net Profit</td>
                <td className="px-6 py-3 text-right text-lg font-extrabold font-mono text-gray-900 dark:text-white border-t-4 border-b-4 border-double border-black dark:border-gray-400">{formatCurrency(netProfit)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProfitLoss;
