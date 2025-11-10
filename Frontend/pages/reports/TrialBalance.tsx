
import React, { useState, useEffect } from 'react';
import { getCompanyProfile, mockTrialBalance } from '../../data/mockData';
import type { CompanyProfile, TrialBalanceAccount } from '../../types';
import ExportOptions from '../../components/ExportOptions';
import { formatCurrency } from '../../utils/formatting';
import eventBus from '../../utils/eventBus';

const convertToCSV = () => {
    let csv = 'Trial Balance\nAccount Code,Account Name,Debit,Credit\n';
    let totalDebit = 0;
    let totalCredit = 0;
    mockTrialBalance.forEach(line => {
        csv += `${line.accountCode},"${line.accountName}",${line.debit},${line.credit}\n`;
        totalDebit += line.debit;
        totalCredit += line.credit;
    });
    csv += `\nTotal,"",${totalDebit},${totalCredit}\n`;
    return csv;
};

const TrialBalance: React.FC = () => {
    const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(getCompanyProfile());

    useEffect(() => {
        const refreshProfile = () => setCompanyProfile(getCompanyProfile());
        const unsubscribe = eventBus.on('dataChanged', refreshProfile);
        return () => unsubscribe();
    }, []);

    const today = new Date().toLocaleDateString('en-CA');
    const totalDebit = mockTrialBalance.reduce((sum, item) => sum + item.debit, 0);
    const totalCredit = mockTrialBalance.reduce((sum, item) => sum + item.credit, 0);

    return (
        <div id="printable-report" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-2xl font-bold dark:text-white">Trial Balance</h2>
                    <p className="text-gray-600 dark:text-gray-400 font-semibold">{companyProfile.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">As of {today}</p>
                </div>
                <ExportOptions reportName="Trial Balance" csvGenerator={convertToCSV} />
            </div>
            <div className="overflow-x-auto border dark:border-gray-700 rounded-lg">
                <table className="min-w-full bg-white dark:bg-gray-800">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Account Code</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Account Name</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Debit</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Credit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {mockTrialBalance.map((account) => (
                            <tr key={account.accountCode}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{account.accountCode}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{account.accountName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right font-mono">{account.debit > 0 ? formatCurrency(account.debit) : '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right font-mono">{account.credit > 0 ? formatCurrency(account.credit) : '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <td colSpan={2} className="px-6 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-200 uppercase">Totals</td>
                            <td className="px-6 py-3 text-right text-sm font-bold font-mono text-gray-700 dark:text-gray-200">{formatCurrency(totalDebit)}</td>
                            <td className="px-6 py-3 text-right text-sm font-bold font-mono text-gray-700 dark:text-gray-200">{formatCurrency(totalCredit)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default TrialBalance;
