
import React from 'react';
import { mockAgedCreditors } from '../../data/mockData';
import ExportOptions from '../../components/ExportOptions';
import { formatCurrency } from '../../utils/formatting';

const convertToCSV = () => {
    let csv = 'Aged Creditors Report\nContact,Total Due,Current,1-30 Days,31-60 Days,60+ Days\n';
    mockAgedCreditors.forEach(line => {
        csv += `"${line.contactName}",${line.totalDue},${line.current},${line.days30},${line.days60},${line.days90plus}\n`;
    });
    return csv;
};

const AgedCreditors: React.FC = () => {
    const today = new Date().toLocaleDateString('en-CA');

    return (
        <div id="printable-report" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-2xl font-bold dark:text-white">Aged Creditors</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">As of {today}</p>
                </div>
                <ExportOptions reportName="Aged Creditors" csvGenerator={convertToCSV} />
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
                        {mockAgedCreditors.map((creditor) => (
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
        </div>
    );
};

export default AgedCreditors;
