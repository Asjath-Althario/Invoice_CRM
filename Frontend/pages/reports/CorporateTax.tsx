import React, { useEffect, useMemo, useState } from 'react';
import type { TaxCalculationLine } from '../../types';
import ExportOptions from '../../components/ExportOptions';
import { formatCurrency } from '../../utils/formatting';
import { apiService } from '../../services/api';

const CorporateTax: React.FC = () => {
  const today = new Date().toLocaleDateString('en-CA');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [invs, purs] = await Promise.all([
        apiService.getInvoices(),
        apiService.getPurchases().catch(()=>[])
      ]);
      setInvoices(invs as any[]);
      setPurchases(purs as any[]);
    } catch (e:any) {
      setError(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=> { loadData(); }, []);

  // Simple corporate tax computation assumptions
  const grossProfit = useMemo(() => invoices.reduce((s,i)=> s + Number(i.subtotal || 0),0) - purchases.reduce((s,p)=> s + Number(p.subtotal || 0),0), [invoices, purchases]);
  const allowableDeductions = useMemo(() => purchases.reduce((s,p)=> s + Number(p.subtotal || 0),0), [purchases]);
  const taxableIncome = grossProfit - 0; // Adjust if additional deductions
  const taxRate = 0.09; // 9% example rate
  const taxPayable = Math.max(0, taxableIncome * taxRate);

  const lines: TaxCalculationLine[] = [
    { label: 'Gross Profit', amount: grossProfit },
    { label: 'Allowable Deductions', amount: allowableDeductions },
    { label: 'Taxable Income', amount: taxableIncome, isTotal: true },
    { label: 'Tax Rate', amount: taxRate },
    { label: 'Tax Payable', amount: taxPayable, isTotal: true },
  ];

  const convertToCSV = () => {
    let csv = 'Corporate Tax Summary\nDescription,Amount\n';
    lines.forEach(line => {
      const amount = line.label === 'Tax Rate' ? `${(line.amount! * 100).toFixed(2)}%` : line.amount?.toFixed(2);
      csv += `"${line.label}",${amount}\n`;
    });
    return csv;
  };

  return (
    <div id="printable-report" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold dark:text-white">Corporate Tax Summary</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">For the period ending {today}</p>
        </div>
        <ExportOptions reportName="Corporate Tax" csvGenerator={convertToCSV} />
      </div>
      {loading && <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !error && (
        <div className="overflow-x-auto border dark:border-gray-700 rounded-lg max-w-2xl mx-auto">
          <table className="min-w-full bg-white dark:bg-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {lines.map((line, index) => (
                <tr key={index}>
                  <td className={`px-6 py-3 whitespace-nowrap text-sm ${line.isTotal ? 'font-bold' : ''} dark:text-gray-200`}>{line.label}</td>
                  <td className={`px-6 py-3 whitespace-nowrap text-sm text-right font-mono ${line.isTotal ? 'font-bold border-t-2 border-black dark:border-gray-600' : ''} dark:text-gray-100`}>
                    {line.label === 'Tax Rate' ? `${(line.amount! * 100).toFixed(2)}%` : formatCurrency(line.amount!)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CorporateTax;
