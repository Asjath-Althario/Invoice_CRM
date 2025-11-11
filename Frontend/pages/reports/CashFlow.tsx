import React, { useEffect, useMemo, useState } from 'react';
import type { CompanyProfile } from '../../types';
import ExportOptions from '../../components/ExportOptions';
import { formatCurrency } from '../../utils/formatting';
import eventBus from '../../utils/eventBus';
import { apiService } from '../../services/api';

interface CashFlowSection { title: string; items: { label: string; amount: number }[]; total: number; }

const CashFlow: React.FC = () => {
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>({ name: '', address: '', email: '', phone: '', logoUrl: '' });
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [bankTransactions, setBankTransactions] = useState<Record<string, any[]>>({});
  const [pettyCash, setPettyCash] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [profileRaw, banks, petty] = await Promise.all([
        apiService.getCompanyProfile(),
        apiService.getBankAccounts(),
        apiService.getPettyCashTransactions().catch(()=>[]),
      ]);
      const profile: any = profileRaw as any;
      setCompanyProfile({
        name: profile.name || profile.company_name || '',
        address: profile.address || '',
        email: profile.email || '',
        phone: profile.phone || '',
        logoUrl: profile.logoUrl || profile.logo_url || ''
      });
      setBankAccounts(banks as any[]);
      setPettyCash(petty as any[]);
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
    const fetchTransactions = async () => {
      const txMap: Record<string, any[]> = {};
      for (const acct of bankAccounts) {
        try { txMap[acct.id] = await apiService.getBankTransactions(acct.id) as any[]; }
        catch { txMap[acct.id] = []; }
      }
      setBankTransactions(txMap);
    };
    if (bankAccounts.length) fetchTransactions();
  }, [bankAccounts]);

  const operatingItems = useMemo(() => {
    const items: { label: string; amount: number }[] = [];
    const allBankTx = Object.values(bankTransactions).flat() as any[];
    const cashFromCustomers = allBankTx.filter(tx => tx.amount > 0 && tx.description && tx.description.toLowerCase().includes('invoice')).reduce((s,tx)=> s + Number(tx.amount||0), 0);
    const paidToSuppliers = allBankTx.filter(tx => tx.amount < 0 && tx.description && tx.description.toLowerCase().includes('vendor')).reduce((s,tx)=> s + Number(tx.amount||0), 0);
    const pettyNet = pettyCash.reduce((sum, tx:any) => {
      if (tx.type === 'Expense') return sum - Number(tx.amount || 0);
      if (tx.type === 'Funding' || tx.type === 'Income') return sum + Number(tx.amount || 0);
      return sum;
    }, 0);
    if (cashFromCustomers) items.push({ label: 'Cash from customers', amount: cashFromCustomers });
    if (paidToSuppliers) items.push({ label: 'Cash paid to suppliers', amount: paidToSuppliers });
    if (pettyNet) items.push({ label: 'Net petty cash activity', amount: pettyNet });
    return items;
  }, [bankTransactions, pettyCash]);

  const operatingTotal = operatingItems.reduce((s,i)=> s + i.amount, 0);

  const sections: CashFlowSection[] = [
    { title: 'Operating Activities', items: operatingItems, total: operatingTotal },
    { title: 'Investing Activities', items: [], total: 0 },
    { title: 'Financing Activities', items: [], total: 0 },
  ];

  const netCashFlow = sections.reduce((sum, section) => sum + section.total, 0);

  const convertToCSV = () => {
    let csv = 'Cash Flow Statement\n\n';
    sections.forEach(section => {
      csv += `${section.title}\n`;
      section.items.forEach(item => csv += `"${item.label}",${item.amount}\n`);
      csv += `Total ${section.title},${section.total}\n\n`;
    });
    return csv;
  };

  return (
    <div id="printable-report" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold dark:text-white">Cash Flow Statement</h2>
          <p className="text-gray-600 dark:text-gray-400 font-semibold">{companyProfile.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">For the period ending {new Date().toLocaleDateString('en-CA')}</p>
        </div>
        <ExportOptions reportName="Cash Flow" csvGenerator={convertToCSV} />
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
              {sections.map(section => (
                <React.Fragment key={section.title}>
                  <tr><td colSpan={2} className="px-6 py-3 text-left text-sm font-bold text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-700">{section.title}</td></tr>
                  {section.items.map(item => (
                    <tr key={item.label}>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 pl-8">{item.label}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-right font-mono text-gray-800 dark:text-gray-200">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="px-6 py-3 text-left text-sm font-bold text-gray-800 dark:text-gray-100">Net Cash from {section.title}</td>
                    <td className="px-6 py-3 text-right text-sm font-bold font-mono text-gray-800 dark:text-gray-100 border-t border-black dark:border-gray-500">{formatCurrency(section.total)}</td>
                  </tr>
                  <tr><td colSpan={2} className="py-2"></td></tr>
                </React.Fragment>
              ))}
              <tr className="bg-gray-100 dark:bg-gray-700">
                <td className="px-6 py-3 text-left text-lg font-extrabold text-gray-900 dark:text-white">Net Increase in Cash</td>
                <td className="px-6 py-3 text-right text-lg font-extrabold font-mono text-gray-900 dark:text-white border-t-2 border-black dark:border-gray-400">{formatCurrency(netCashFlow)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CashFlow;
