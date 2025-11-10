
import React from 'react';
import { mockVatReport } from '../../data/mockData';
import ExportOptions from '../../components/ExportOptions';
import { formatCurrency } from '../../utils/formatting';

const convertToCSV = () => {
    let csv = 'VAT Report\n\nSales\nDate,Description,Net Amount,VAT Amount\n';
    mockVatReport.sales.forEach(line => {
        csv += `${line.date},"${line.description}",${line.netAmount},${line.vatAmount}\n`;
    });
    csv += '\nPurchases\nDate,Description,Net Amount,VAT Amount\n';
     mockVatReport.purchases.forEach(line => {
        csv += `${line.date},"${line.description}",${line.netAmount},${line.vatAmount}\n`;
    });
    return csv;
};

const VatReport: React.FC = () => {
    const today = new Date().toLocaleDateString('en-CA');
    const totalSalesVat = mockVatReport.sales.reduce((sum, item) => sum + item.vatAmount, 0);
    const totalPurchasesVat = mockVatReport.purchases.reduce((sum, item) => sum + item.vatAmount, 0);
    const netVatPayable = totalSalesVat - totalPurchasesVat;

    return (
        <div id="printable-report" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-2xl font-bold dark:text-white">VAT Report</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">For the period ending {today}</p>
                </div>
                <ExportOptions reportName="VAT Report" csvGenerator={convertToCSV} />
            </div>

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
                                {mockVatReport.sales.map((item, index) => (
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
                                {mockVatReport.purchases.map((item, index) => (
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
        </div>
    );
};

export default VatReport;
