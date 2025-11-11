import React, { useEffect, useMemo, useState } from 'react';
import ExportOptions from '../../components/ExportOptions';
import { formatCurrency } from '../../utils/formatting';
import { apiService } from '../../services/api';

interface VatLine { date: string; description: string; netAmount: number; vatAmount: number; }

const VatReport: React.FC = () => {
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

  const salesLines: VatLine[] = useMemo(() => invoices.map(inv => ({
    date: inv.issueDate || inv.issue_date || '',
    description: inv.invoiceNumber || inv.invoice_number || inv.id,
    netAmount: Number(inv.subtotal || 0),
    vatAmount: Number(inv.tax || inv.tax_amount || 0)
  })), [invoices]);

  const purchaseLines: VatLine[] = useMemo(() => purchases.map(p => ({
    date: p.date || p.order_date || '',
    description: p.purchaseOrderNumber || p.purchase_order_number || p.id,
    netAmount: Number(p.subtotal || 0),
    vatAmount: Number(p.vat || p.tax_amount || 0)
  })), [purchases]);

  const totalSalesVat = salesLines.reduce((s,l)=> s + l.vatAmount,0);
  const totalPurchasesVat = purchaseLines.reduce((s,l)=> s + l.vatAmount,0);
  const netVatPayable = totalSalesVat - totalPurchasesVat;

  const convertToCSV = () => {
    let csv = 'VAT Report\n\nSales\nDate,Description,Net Amount,VAT Amount\n';
    salesLines.forEach(line => { csv += `${line.date},"${line.description}",${line.netAmount},${line.vatAmount}\n`; });
    csv += '\nPurchases\nDate,Description,Net Amount,VAT Amount\n';
    purchaseLines.forEach(line => { csv += `${line.date},"${line.description}",${line.netAmount},${line.vatAmount}\n`; });
    csv += `\nTotals,,${totalSalesVat},${totalPurchasesVat},Net VAT Payable,${netVatPayable}\n`;
    return csv;
  };

  return (
    <div id="printable-report" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold dark:text-white">VAT Report</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">For the period ending {today}</p>
        </div>
        <ExportOptions reportName="VAT Report" csvGenerator={convertToCSV} />
      </div>
      {loading && <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !error && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2 dark:text-white">VAT on Sales</h3>
            <div className="overflow-x-auto border dark:border-gray-700 rounded-lg">
              <table className="min-w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Description</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Net Amount</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">VAT Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {salesLines.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm dark:text-gray-300">{item.date}</td>
                      <td className="px-4 py-2 text-sm dark:text-gray-300">{item.description}</td>
                      <td className="px-4 py-2 text-sm text-right font-mono dark:text-gray-200">{formatCurrency(item.netAmount)}</td>
                      <td className="px-4 py-2 text-sm text-right font-mono dark:text-gray-200">{formatCurrency(item.vatAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2 dark:text-white">VAT on Purchases</h3>
            <div className="overflow-x-auto border dark:border-gray-700 rounded-lg">
              <table className="min-w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Description</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Net Amount</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">VAT Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {purchaseLines.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm dark:text-gray-300">{item.date}</td>
                      <td className="px-4 py-2 text-sm dark:text-gray-300">{item.description}</td>
                      <td className="px-4 py-2 text-sm text-right font-mono dark:text-gray-200">{formatCurrency(item.netAmount)}</td>
                      <td className="px-4 py-2 text-sm text-right font-mono dark:text-gray-200">{formatCurrency(item.vatAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="pt-4 text-right">
            <p className="text-gray-600 dark:text-gray-400">Total VAT on Sales: <span className="font-mono">{formatCurrency(totalSalesVat)}</span></p>
            <p className="text-gray-600 dark:text-gray-400">Total VAT on Purchases: <span className="font-mono">{formatCurrency(totalPurchasesVat)}</span></p>
            <p className="text-xl font-bold mt-2 dark:text-white">Net VAT Payable: <span className="font-mono">{formatCurrency(netVatPayable)}</span></p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VatReport;
