

import React from 'react';
import { mockCorporateTax } from '../../data/mockData';
import type { TaxCalculationLine } from '../../types';
import ExportOptions from '../../components/ExportOptions';
import { formatCurrency } from '../../utils/formatting';

const convertToCSV = () => {
    let csv = 'Corporate Tax Summary\n';
    csv += 'Description,Amount\n';
    mockCorporateTax.forEach(line => {
        const amount = line.amount !== undefined ? (line.label === 'Tax Rate' ? `${line.amount * 100}%` : line.amount) : '';
        csv += `"${line.label}",${amount}\n`;
    });
    return csv;
};

const CorporateTax: React.FC = () => {
    const today = new Date().toLocaleDateString('en-CA');

    return (
        <div id="printable-report" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-2xl font-bold dark:text-white">Corporate Tax Summary</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">For the period ending {today}</p>
                </div>
                <ExportOptions reportName="Corporate Tax" csvGenerator={convertToCSV} />
            </div>
            <div className="overflow-x-auto border dark:border-gray-700 rounded-lg max-w-2xl mx-auto">
                <table className="min-w-full bg-white dark:bg-gray-800">
                     <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {mockCorporateTax.map((line, index) => (
                            <tr key={index}>
                                <td className={`px-6 py-3 whitespace-nowrap text-sm ${line.isTotal ? 'font-bold' : ''} dark:text-gray-200`}>
                                    {line.label}
                                </td>
                                <td className={`px-6 py-3 whitespace-nowrap text-sm text-right font-mono ${line.isTotal ? 'font-bold border-t-2 border-black dark:border-gray-600' : ''} dark:text-gray-100`}>
                                    {line.amount !== undefined ? (
                                        line.label === 'Tax Rate'
                                        ? `${line.amount * 100}%`
                                        : formatCurrency(line.amount)
                                    ) : ''}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CorporateTax;
