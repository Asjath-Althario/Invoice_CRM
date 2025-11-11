import React, { useEffect, useMemo, useState } from 'react';
import ExportOptions from '../../components/ExportOptions';
import { formatCurrency } from '../../utils/formatting';
import { apiService } from '../../services/api';

interface PostingDetail { date: string; description: string; account: string; debit?: number; credit?: number; }

const PostingReport: React.FC = () => {
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

  useEffect(()=>{ loadData(); }, []);

  const details: PostingDetail[] = useMemo(() => {
    const rows: PostingDetail[] = [];
    invoices.forEach(inv => {
      const desc = `Invoice ${inv.invoiceNumber || inv.invoice_number}`;
      const total = Number(inv.total || inv.total_amount || 0);
      const net = Number(inv.subtotal || 0);
      const vat = Number(inv.tax || inv.tax_amount || 0);
      rows.push({ date: inv.issueDate || inv.issue_date, description: desc, account: 'Accounts Receivable', debit: total });
      rows.push({ date: inv.issueDate || inv.issue_date, description: desc, account: 'Sales Revenue', credit: net });
      if (vat) rows.push({ date: inv.issueDate || inv.issue_date, description: desc, account: 'VAT Payable', credit: vat });
    });
    purchases.forEach(p => {
      const desc = `Purchase ${p.purchaseOrderNumber || p.purchase_order_number || p.id}`;
      const total = Number(p.total || p.total_amount || 0);
      const net = Number(p.subtotal || 0);
      const vat = Number(p.vat || p.tax_amount || 0);
      rows.push({ date: p.date || p.order_date, description: desc, account: 'Expenses/COGS', debit: net });
      if (vat) rows.push({ date: p.date || p.order_date, description: desc, account: 'VAT Recoverable', debit: vat });
      rows.push({ date: p.date || p.order_date, description: desc, account: 'Accounts Payable', credit: total });
    });
    return rows.sort((a,b)=> new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [invoices, purchases]);

  const convertToCSV = () => {
    let csv = 'Posting Report\nDate,Description,Account,Debit,Credit\n';
    details.forEach(line => {
      csv += `${line.date},"${line.description}","${line.account}",${line.debit || 0},${line.credit || 0}\n`;
    });
    return csv;
  };

  return (
    <div id="printable-report" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold dark:text-white">Posting Report</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">For the period ending {today}</p>
        </div>
        <ExportOptions reportName="Posting Report" csvGenerator={convertToCSV} />
      </div>

      {loading && <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto border dark:border-gray-700 rounded-lg">
          <table className="min-w-full bg-white dark:bg-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Account</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Debit</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {details.map((detail, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{detail.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{detail.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{detail.account}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-gray-900 dark:text-gray-100">{detail.debit ? formatCurrency(detail.debit) : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-gray-900 dark:text-gray-100">{detail.credit ? formatCurrency(detail.credit) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PostingReport;
