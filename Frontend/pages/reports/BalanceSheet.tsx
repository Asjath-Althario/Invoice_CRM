import React, { useEffect, useMemo, useState } from 'react';
import type { CompanyProfile } from '../../types';
import ExportOptions from '../../components/ExportOptions';
import { formatCurrency } from '../../utils/formatting';
import eventBus from '../../utils/eventBus';
import { apiService } from '../../services/api';

const ReportSection: React.FC<{ title: string; items: { label: string; amount: number }[]; total: number }> = ({ title, items, total }) => (
  <>
    <tr><td colSpan={2} className="px-6 py-3 text-left text-sm font-bold text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-700">{title}</td></tr>
    {items.map(item => (
      <tr key={item.label}>
        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 pl-8">{item.label}</td>
        <td className="px-6 py-3 whitespace-nowrap text-sm text-right font-mono text-gray-800 dark:text-gray-200">{formatCurrency(item.amount)}</td>
      </tr>
    ))}
    <tr>
      <td className="px-6 py-3 text-left text-sm font-bold text-gray-800 dark:text-gray-100">Total {title}</td>
      <td className="px-6 py-3 text-right text-sm font-bold font-mono text-gray-800 dark:text-gray-100 border-t-2 border-black dark:border-gray-500">{formatCurrency(total)}</td>
    </tr>
    <tr><td colSpan={2} className="py-2"></td></tr>
  </>
);

const BalanceSheet: React.FC = () => {
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>({ name: '', address: '', email: '', phone: '', logoUrl: '' });
  const [invoices, setInvoices] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [pettyCash, setPettyCash] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [profileRaw, invs, purs, banks, petty] = await Promise.all([
        apiService.getCompanyProfile(),
        apiService.getInvoices(),
        apiService.getPurchases().catch(()=>[]),
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
      setInvoices(invs as any[]);
      setPurchases(purs as any[]);
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

  const totalCurrentAssets = useMemo(() => {
    const bank = bankAccounts.reduce((s,a)=> s + Number(a.balance||0), 0);
    const pettyBal = pettyCash.reduce((sum, tx:any) => {
      if (tx.type === 'Income' || tx.type === 'Funding') return sum + Number(tx.amount || 0);
      if (tx.type === 'Expense') return sum - Number(tx.amount || 0);
      return sum;
    }, 0);
    const receivables = invoices.filter(i=> i.status && i.status !== 'Paid').reduce((s,i)=> s + Number(i.total || i.total_amount || 0),0);
    return bank + pettyBal + receivables;
  }, [bankAccounts, pettyCash, invoices]);

  const totalFixedAssets = useMemo(() => 0, []); // Not tracked yet

  const totalLiabilities = useMemo(() => {
    const payables = purchases.filter(p=> p.status && p.status !== 'Paid').reduce((s,p)=> s + Number(p.total || p.total_amount || 0),0);
    const vatOnSales = invoices.reduce((s,i)=> s + Number(i.tax || i.tax_amount || 0),0);
    const vatOnPurchases = purchases.reduce((s,p)=> s + Number(p.vat || p.tax_amount || 0),0);
    const vatNet = Math.max(0, vatOnSales - vatOnPurchases);
    return payables + vatNet;
  }, [purchases, invoices]);

  const totalEquity = useMemo(() => {
    const sales = invoices.reduce((s,i)=> s + Number(i.subtotal || 0),0);
    const cost = purchases.reduce((s,p)=> s + Number(p.subtotal || 0),0);
    const net = sales - cost;
    const ownerEquity = 0; // Could be tracked separately
    return ownerEquity + net;
  }, [invoices, purchases]);

  const assetsSections = useMemo(() => ({
    current: [
      { label: 'Cash and Bank', amount: bankAccounts.reduce((s,a)=> s + Number(a.balance||0), 0) },
      { label: 'Petty Cash', amount: pettyCash.reduce((sum, tx:any) => (tx.type === 'Expense' ? sum - Number(tx.amount||0) : sum + Number(tx.amount||0)), 0) },
      { label: 'Accounts Receivable', amount: invoices.filter(i=> i.status && i.status !== 'Paid').reduce((s,i)=> s + Number(i.total || i.total_amount || 0),0) },
    ],
    fixed: [] as {label:string;amount:number}[],
  }), [bankAccounts, pettyCash, invoices]);

  const liabilitiesSections = useMemo(() => ({
    current: [
      { label: 'Accounts Payable', amount: purchases.filter(p=> p.status && p.status !== 'Paid').reduce((s,p)=> s + Number(p.total || p.total_amount || 0),0) },
      { label: 'VAT Payable', amount: Math.max(0, invoices.reduce((s,i)=> s + Number(i.tax || i.tax_amount || 0),0) - purchases.reduce((s,p)=> s + Number(p.vat || p.tax_amount || 0),0)) },
    ],
  }), [purchases, invoices]);

  const equitySection = useMemo(() => ([
    { label: "Retained Earnings (Net Profit)", amount: invoices.reduce((s,i)=> s + Number(i.subtotal || 0),0) - purchases.reduce((s,p)=> s + Number(p.subtotal || 0),0) },
  ]), [invoices, purchases]);

  const totalAssets = totalCurrentAssets + totalFixedAssets;
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

  const today = new Date().toLocaleDateString('en-CA');

  const convertToCSV = () => {
    let csv = 'Balance Sheet\n\n';
    csv += 'Current Assets\n';
    assetsSections.current.forEach(a => csv += `"${a.label}",${a.amount}\n`);
    csv += '\nLiabilities\n';
    liabilitiesSections.current.forEach(l => csv += `"${l.label}",${l.amount}\n`);
    csv += '\nEquity\n';
    equitySection.forEach(e => csv += `"${e.label}",${e.amount}\n`);
    return csv;
  };

  return (
    <div id="printable-report" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold dark:text-white">Balance Sheet</h2>
          <p className="text-gray-600 dark:text-gray-400 font-semibold">{companyProfile.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">As of {today}</p>
        </div>
        <ExportOptions reportName="Balance Sheet" csvGenerator={convertToCSV} />
      </div>
      {loading && <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !error && (
        <div className="overflow-x-auto border dark:border-gray-700 rounded-lg max-w-3xl mx-auto">
          <table className="min-w-full bg-white dark:bg-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Account</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              <ReportSection title="Current Assets" items={assetsSections.current} total={assetsSections.current.reduce((s,i)=> s + i.amount,0)} />
              <tr>
                <td className="px-6 py-3 text-left text-lg font-extrabold text-gray-900 dark:text-white">Total Assets</td>
                <td className="px-6 py-3 text-right text-lg font-extrabold font-mono text-gray-900 dark:text-white border-t-4 border-b-4 border-double border-black dark:border-gray-400">{formatCurrency(totalAssets)}</td>
              </tr>
              <tr><td colSpan={2} className="py-4"></td></tr>
              <ReportSection title="Current Liabilities" items={liabilitiesSections.current} total={liabilitiesSections.current.reduce((s,i)=> s + i.amount,0)} />
              <ReportSection title="Equity" items={equitySection} total={equitySection.reduce((s,i)=> s + i.amount,0)} />
              <tr>
                <td className="px-6 py-3 text-left text-lg font-extrabold text-gray-900 dark:text-white">Total Liabilities & Equity</td>
                <td className="px-6 py-3 text-right text-lg font-extrabold font-mono text-gray-900 dark:text-white border-t-4 border-b-4 border-double border-black dark:border-gray-400">{formatCurrency(totalLiabilitiesAndEquity)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BalanceSheet;
