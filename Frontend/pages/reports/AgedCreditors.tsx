import React, { useEffect, useMemo, useState } from 'react';
// import { mockAgedCreditors } from '../../data/mockData';
import ExportOptions from '../../components/ExportOptions';
import { formatCurrency } from '../../utils/formatting';
import { apiService } from '../../services/api';

interface Row { contactName: string; totalDue: number; current: number; days30: number; days60: number; days90plus: number; }

const AgedCreditors: React.FC = () => {
  const today = new Date().toLocaleDateString('en-CA');
  const [contacts, setContacts] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [cts, purs] = await Promise.all([
        apiService.getContacts(),
        apiService.getPurchases().catch(()=>[]),
      ]);
      setContacts(cts as any[]);
      setPurchases(purs as any[]);
    } catch (e:any) {
      setError(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{ loadData(); }, []);

  const rows: Row[] = useMemo(() => {
    const vendors = contacts.filter(c => c.type === 'Vendor');
    const byVendor: Record<string, Row> = {};
    const now = new Date();

    vendors.forEach(c => {
      byVendor[c.id] = { contactName: c.name, totalDue: 0, current: 0, days30: 0, days60: 0, days90plus: 0 };
    });

    purchases.filter(p => p.status && p.status !== 'Paid').forEach(p => {
      const id = p.supplier?.id || p.supplier_id; const row = byVendor[id];
      if (!row) return;
      const amount = Number(p.total || p.total_amount || 0);
      const dueStr = p.dueDate || p.due_date || p.date || p.order_date;
      const due = dueStr ? new Date(dueStr) : now;
      const diffDays = Math.floor((now.getTime() - due.getTime()) / (1000*60*60*24));
      row.totalDue += amount;
      if (diffDays <= 0) row.current += amount;
      else if (diffDays <= 30) row.days30 += amount;
      else if (diffDays <= 60) row.days60 += amount;
      else row.days90plus += amount;
    });

    return Object.values(byVendor).filter(r => r.totalDue > 0);
  }, [contacts, purchases]);

  const convertToCSV = () => {
    let csv = 'Aged Creditors Report\nContact,Total Due,Current,1-30 Days,31-60 Days,60+ Days\n';
    rows.forEach(line => { csv += `"${line.contactName}",${line.totalDue},${line.current},${line.days30},${line.days60},${line.days90plus}\n`; });
    return csv;
  };

  return (
    <div id="printable-report" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold dark:text-white">Aged Creditors</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">As of {today}</p>
        </div>
        <ExportOptions reportName="Aged Creditors" csvGenerator={convertToCSV} />
      </div>
      {loading && <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !error && (
        <div className="overflow-x-auto border dark:border-gray-700 rounded-lg">
          <table className="min-w-full bg-white dark:bg-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Due</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Current</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">1-30 Days</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">31-60 Days</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">60+ Days</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {rows.map((creditor) => (
                <tr key={creditor.contactName}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{creditor.contactName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono font-bold dark:text-gray-200">{formatCurrency(creditor.totalDue)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono dark:text-gray-300">{formatCurrency(creditor.current)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono dark:text-gray-300">{formatCurrency(creditor.days30)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono dark:text-gray-300">{formatCurrency(creditor.days60)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono dark:text-gray-300">{formatCurrency(creditor.days90plus)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AgedCreditors;
