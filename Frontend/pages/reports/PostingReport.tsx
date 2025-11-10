
import React from 'react';
import { mockPostingReport } from '../../data/mockData';
import ExportOptions from '../../components/ExportOptions';
import { formatCurrency } from '../../utils/formatting';

const convertToCSV = () => {
    let csv = 'Posting Report\nDate,Description,Account,Debit,Credit\n';
    mockPostingReport.forEach(line => {
        csv += `${line.date},"${line.description}","${line.account}",${line.debit || 0},${line.credit || 0}\n`;
    });
    return csv;
};

const PostingReport: React.FC = () => {
    const today = new Date().toLocaleDateString('en-CA');

    return (
        <div id="printable-report" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-2xl font-bold dark:text-white">Posting Report</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">For the period ending {today}</p>
                </div>
                <ExportOptions reportName="Posting Report" csvGenerator={convertToCSV} />
            </div>
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
                        {mockPostingReport.map((detail, index) => (
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
        </div>
    );
};

export default PostingReport;
