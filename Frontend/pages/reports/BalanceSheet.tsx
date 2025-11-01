
import React, { useState, useEffect } from 'react';
import { getCompanyProfile, mockBalanceSheet } from '../../data/mockData';
import type { CompanyProfile } from '../../types';
import ExportOptions from '../../components/ExportOptions';
import { formatCurrency } from '../../utils/formatting';
import eventBus from '../../utils/eventBus';

const convertToCSV = () => {
    let csv = 'Balance Sheet\n\n';
    csv += 'Assets\n';
    mockBalanceSheet.assets.current.forEach(a => csv += `"${a.label}",${a.amount}\n`);
    mockBalanceSheet.assets.fixed.forEach(a => csv += `"${a.label}",${a.amount}\n`);
    csv += '\nLiabilities\n';
    mockBalanceSheet.liabilities.current.forEach(l => csv += `"${l.label}",${l.amount}\n`);
    csv += '\nEquity\n';
    mockBalanceSheet.equity.forEach(e => csv += `"${e.label}",${e.amount}\n`);
    return csv;
};

const ReportSection: React.FC<{ title: string; items: { label: string; amount: number }[]; total: number }> = ({ title, items, total }) => (
    <>
        <tr><td colSpan={2} className="px-6 py-3 text-left text-sm font-bold text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-700">{title}</td></tr>
        {items.map(item => (
            <tr key={item.label}>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 pl-8">{item.label}</td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-right font-mono text-gray-800 dark:text-gray-200">{formatCurrency(item.amount)}</td>
            </tr>
        ))}
        <tr>
            <td className="px-6 py-3 text-left text-sm font-bold text-gray-800 dark:text-gray-100">Total {title}</td>
            <td className="px-6 py-3 text-right text-sm font-bold font-mono text-gray-800 dark:text-gray-100 border-t-2 border-black dark:border-gray-500">{formatCurrency(total)}</td>
        </tr>
        <tr><td colSpan={2} className="py-2"></td></tr>
    </>
);


const BalanceSheet: React.FC = () => {
    const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(getCompanyProfile());

    useEffect(() => {
        const refreshProfile = () => setCompanyProfile(getCompanyProfile());
        const unsubscribe = eventBus.on('dataChanged', refreshProfile);
        return () => unsubscribe();
    }, []);

    const today = new Date().toLocaleDateString('en-CA');
    const totalCurrentAssets = mockBalanceSheet.assets.current.reduce((sum, i) => sum + i.amount, 0);
    const totalFixedAssets = mockBalanceSheet.assets.fixed.reduce((sum, i) => sum + i.amount, 0);
    const totalAssets = totalCurrentAssets + totalFixedAssets;
    const totalLiabilities = mockBalanceSheet.liabilities.current.reduce((sum, i) => sum + i.amount, 0);
    const totalEquity = mockBalanceSheet.equity.reduce((sum, i) => sum + i.amount, 0);
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

    return (
        <div id="printable-report" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-2xl font-bold dark:text-white">Balance Sheet</h2>
                    <p className="text-gray-600 dark:text-gray-400 font-semibold">{companyProfile.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">As of {today}</p>
                </div>
                <ExportOptions reportName="Balance Sheet" csvGenerator={convertToCSV} />
            </div>
            <div className="overflow-x-auto border dark:border-gray-700 rounded-lg max-w-3xl mx-auto">
                <table className="min-w-full bg-white dark:bg-gray-800">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Account</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        <ReportSection title="Current Assets" items={mockBalanceSheet.assets.current} total={totalCurrentAssets}/>
                        <ReportSection title="Fixed Assets" items={mockBalanceSheet.assets.fixed} total={totalFixedAssets}/>
                        <tr>
                            <td className="px-6 py-3 text-left text-lg font-extrabold text-gray-900 dark:text-white">Total Assets</td>
                            <td className="px-6 py-3 text-right text-lg font-extrabold font-mono text-gray-900 dark:text-white border-t-4 border-b-4 border-double border-black dark:border-gray-400">{formatCurrency(totalAssets)}</td>
                        </tr>
                        <tr><td colSpan={2} className="py-4"></td></tr>
                        <ReportSection title="Current Liabilities" items={mockBalanceSheet.liabilities.current} total={totalLiabilities}/>
                        <ReportSection title="Equity" items={mockBalanceSheet.equity} total={totalEquity}/>
                        <tr>
                            <td className="px-6 py-3 text-left text-lg font-extrabold text-gray-900 dark:text-white">Total Liabilities & Equity</td>
                            <td className="px-6 py-3 text-right text-lg font-extrabold font-mono text-gray-900 dark:text-white border-t-4 border-b-4 border-double border-black dark:border-gray-400">{formatCurrency(totalLiabilitiesAndEquity)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BalanceSheet;
