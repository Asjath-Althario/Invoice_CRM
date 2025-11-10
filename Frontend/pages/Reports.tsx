

import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const Reports: React.FC = () => {
    const tabs = [
        { name: 'Trial Balance', path: '/reports/trial-balance' },
        { name: 'Balance Sheet', path: '/reports/balance-sheet' },
        { name: 'Profit & Loss', path: '/reports/profit-loss' },
        { name: 'Cash Flow', path: '/reports/cash-flow' },
        { name: 'Aged Debtors', path: '/reports/aged-debtors' },
        { name: 'Aged Creditors', path: '/reports/aged-creditors' },
        { name: 'VAT Report', path: '/reports/vat' },
        { name: 'Posting', path: '/reports/posting' },
        { name: 'Statement', path: '/reports/statement' },
        { name: 'Corporate Tax', path: '/reports/corporate-tax' },
    ];

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-dark dark:text-light">Reports</h1>
             </div>
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                    {tabs.map((tab) => (
                        <NavLink
                            key={tab.name}
                            to={tab.path}
                            className={({ isActive }) =>
                                `${
                                    isActive
                                        ? 'border-primary text-primary dark:border-secondary dark:text-secondary'
                                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`
                            }
                        >
                            {tab.name}
                        </NavLink>
                    ))}
                </nav>
            </div>
            
            <Outlet />
        </div>
    );
};

export default Reports;