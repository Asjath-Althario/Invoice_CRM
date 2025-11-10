
import React from 'react';
import { mockAgedDebtors } from '../../data/mockData';
import ExportOptions from '../../components/ExportOptions';
import { formatCurrency } from '../../utils/formatting';

const convertToCSV = () => {
    let csv = 'Aged Debtors Report\nContact,Total Due,Current,1-30 Days,31-60 Days,60+ Days\n';
    mockAgedDebtors.forEach(line => {
        csv += `"${line.contactName}",${line.totalDue},${line.current},${line.days30},${line.days60},${line.days90plus}\n`;
    });
    return csv;
};

const AgedDebtors: React.FC = () => {
    const today = new Date().toLocaleDateString('en-CA');

    return (
        <div id="printable-report" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-2xl font-bold dark:text-white">Aged Debtors</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">As of {today}</p>
                </div>
                <ExportOptions reportName="Aged Debtors" csvGenerator={convertToCSV} />
            </div>
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
                        {mockAgedDebtors.map((debtor) => (
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
        </div>
    );
};

export default AgedDebtors;
