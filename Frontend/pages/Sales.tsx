

import React from 'react';
import { Plus } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import eventBus from '../utils/eventBus';

const Sales: React.FC = () => {
    const location = useLocation();

    const tabs = [
        { name: 'Invoices', path: '/sales/invoices' },
        { name: 'Recurring Invoices', path: '/sales/recurring' },
        { name: 'Quotes', path: '/sales/quotes' },
        { name: 'Subscriptions', path: '/sales/subscriptions' },
        { name: 'Products & Services', path: '/sales/products' },
    ];

    const getActionBuTton = () => {
        const currentPath = location.pathname;
        if (currentPath.startsWith('/sales/invoices')) {
            return { text: 'New Invoice', path: '/sales/invoice/new' };
        }
        if (currentPath.startsWith('/sales/recurring')) {
            return { text: 'New Recurring Invoice', path: '/sales/recurring/new' };
        }
        if (currentPath.startsWith('/sales/quotes')) {
            return { text: 'New Quote', path: '/sales/quote/new' };
        }
        if (currentPath.startsWith('/sales/products')) {
             return { text: 'New Product / Service', path: '#', action: () => eventBus.emit('openNewProductModal') };
        }
        return { text: 'New Invoice', path: '/sales/invoice/new' }; // Default
    };

    const actionButton = getActionBuTton();
    
    const handleActionClick = (e: React.MouseEvent) => {
        if (actionButton?.path === '#') {
            e.preventDefault();
            if (actionButton.action) {
                actionButton.action();
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-dark dark:text-light">Sales</h1>
                 <Link
                    to={actionButton.path}
                    onClick={handleActionClick}
                    className="flex items-center bg-primary text-white px-4 py-2 rounded-lg shadow-md hover:bg-primary/90 transition-colors"
                >
                    <Plus size={20} className="mr-2" />
                    {actionButton.text}
                </Link>
            </div>

            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
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

export default Sales;