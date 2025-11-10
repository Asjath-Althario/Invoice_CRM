import React, { useState, useEffect } from 'react';
import { getCompanyProfile, generateStatementReport, getContacts } from '../../data/mockData';
import type { CompanyProfile, Contact, StatementTransaction } from '../../types';
import ExportOptions from '../../components/ExportOptions';
import { formatCurrency } from '../../utils/formatting';
import eventBus from '../../utils/eventBus';

const StatementReport: React.FC = () => {
    const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(getCompanyProfile());
    const [customers, setCustomers] = useState<Contact[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
    const [reportData, setReportData] = useState<{ contact: Contact, transactions: StatementTransaction[], balance: number } | null>(null);

    const today = new Date().toLocaleDateString('en-CA');

    useEffect(() => {
        const refreshData = () => {
            setCompanyProfile(getCompanyProfile());
            const customerList = getContacts().filter(c => c.type === 'Customer');
            setCustomers(customerList);
            
            if (customerList.length > 0 && !selectedCustomerId) {
                setSelectedCustomerId(customerList[0].id);
            }
        };
        refreshData();
        const unsubscribe = eventBus.on('dataChanged', refreshData);
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (selectedCustomerId) {
            setReportData(generateStatementReport(selectedCustomerId));
        } else {
            setReportData(null);
        }
    }, [selectedCustomerId]);

    const convertToCSV = () => {
        if (!reportData) return '';
        let csv = `Statement for ${reportData.contact.name}\n`;
        csv += 'Date,Type,Details,Amount,Balance\n';
        let runningBalance = 0;
        reportData.transactions.forEach(tx => {
            runningBalance += tx.amount;
            csv += `${tx.date},${tx.type},"${tx.details}",${tx.amount},${runningBalance}\n`;
        });
        csv += `\nBalance Due,${reportData.balance}\n`;
        return csv;
    };

    return (
        <div id="printable-report" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start mb-6">
                 <div>
                    <h2 className="text-2xl font-bold dark:text-white">Statement of Account</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Date: {today}</p>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="print:hidden">
                        <label htmlFor="customer-select" className="sr-only">Select Customer</label>
                        <select
                            id="customer-select"
                            value={selectedCustomerId}
                            onChange={(e) => setSelectedCustomerId(e.target.value)}
                            className="block w-full max-w-xs bg-white text-gray-900 border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="" disabled>Select a customer</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <ExportOptions reportName="Statement" csvGenerator={convertToCSV} />
                </div>
            </div>

            {reportData ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="border dark:border-gray-700 rounded-lg p-4">
                            <h3 className="font-semibold dark:text-white">From:</h3>
                            <p className="text-gray-700 dark:text-gray-300">{companyProfile.name}</p>
                            <p className="text-gray-700 dark:text-gray-300">{companyProfile.address}</p>
                            <p className="text-gray-700 dark:text-gray-300">{companyProfile.email}</p>
                        </div>
                        <div className="border dark:border-gray-700 rounded-lg p-4">
                            <h3 className="font-semibold dark:text-white">To:</h3>
                            <p className="text-gray-700 dark:text-gray-300">{reportData.contact.name}</p>
                            <p className="text-gray-700 dark:text-gray-300">{reportData.contact.address}</p>
                            <p className="text-gray-700 dark:text-gray-300">{reportData.contact.email}</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto border dark:border-gray-700 rounded-lg">
                        <table className="min-w-full">
                             <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Details</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Amount</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                {(() => {
                                    let runningBalance = 0;
                                    return reportData.transactions.map((tx, index) => {
                                        runningBalance += tx.amount;
                                        return (
                                            <tr key={index}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-gray-300">{tx.date}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-gray-300">{tx.type}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-gray-300">{tx.details}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono dark:text-gray-200">{formatCurrency(tx.amount)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono dark:text-gray-200">{formatCurrency(runningBalance)}</td>
                                            </tr>
                                        );
                                    })
                                })()}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 text-right">
                        <p className="text-2xl font-bold dark:text-white">
                            Balance Due: <span className="font-mono">{formatCurrency(reportData.balance)}</span>
                        </p>
                    </div>
                </>
            ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <p>Please select a customer to view their statement.</p>
                </div>
            )}
        </div>
    );
};

export default StatementReport;