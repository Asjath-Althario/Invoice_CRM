import React, { useEffect, useMemo, useState } from 'react';
// import { mockAgedDebtors } from '../../data/mockData';
import ExportOptions from '../../components/ExportOptions';
import { formatCurrency } from '../../utils/formatting';
import { apiService } from '../../services/api';

interface Row { contactName: string; totalDue: number; current: number; days30: number; days60: number; days90plus: number; }

const AgedDebtors: React.FC = () => {
  const today = new Date().toLocaleDateString('en-CA');
  const [contacts, setContacts] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [cts, invs] = await Promise.all([
        apiService.getContacts(),
        apiService.getInvoices()
      ]);
      setContacts(cts as any[]);
      setInvoices(invs as any[]);
    } catch (e:any) {
      setError(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{ loadData(); }, []);

  const rows: Row[] = useMemo(() => {
    const customers = contacts.filter(c => c.type === 'Customer');
    const byCustomer: Record<string, Row> = {};
    const now = new Date();

    customers.forEach(c => {
      byCustomer[c.id] = { contactName: c.name, totalDue: 0, current: 0, days30: 0, days60: 0, days90plus: 0 };
    });

    invoices.filter(i => i.status && i.status !== 'Paid').forEach(inv => {
      const id = inv.contact?.id || inv.contact_id; const row = byCustomer[id];
      if (!row) return;
      const amount = Number(inv.total || inv.total_amount || 0);
      const dueStr = inv.dueDate || inv.due_date || inv.issueDate || inv.issue_date;
      const due = dueStr ? new Date(dueStr) : now;
      const diffDays = Math.floor((now.getTime() - due.getTime()) / (1000*60*60*24));
      row.totalDue += amount;
      if (diffDays <= 0) row.current += amount;
      else if (diffDays <= 30) row.days30 += amount;
      else if (diffDays <= 60) row.days60 += amount;
      else row.days90plus += amount;
    });

    return Object.values(byCustomer).filter(r => r.totalDue > 0);
  }, [contacts, invoices]);

  const convertToCSV = () => {
    let csv = 'Aged Debtors Report\nContact,Total Due,Current,1-30 Days,31-60 Days,60+ Days\n';
    rows.forEach(line => { csv += `"${line.contactName}",${line.totalDue},${line.current},${line.days30},${line.days60},${line.days90plus}\n`; });
    return csv;
  };

  return (
    <div id="printable-report" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold dark:text-white">Aged Debtors</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">As of {today}</p>
        </div>
        <ExportOptions reportName="Aged Debtors" csvGenerator={convertToCSV} />
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
              {rows.map((debtor) => (
                <tr key={debtor.contactName}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{debtor.contactName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono font-bold dark:text-gray-200">{formatCurrency(debtor.totalDue)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono dark:text-gray-300">{formatCurrency(debtor.current)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono dark:text-gray-300">{formatCurrency(debtor.days30)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono dark:text-gray-300">{formatCurrency(debtor.days60)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono dark:text-gray-300">{formatCurrency(debtor.days90plus)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AgedDebtors;
