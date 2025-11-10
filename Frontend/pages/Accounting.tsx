

import React from 'react';
import { Plus } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import eventBus from '../utils/eventBus';

const Accounting: React.FC = () => {
    const location = useLocation();

    const tabs = [
        { name: 'Purchases', path: '/accounting/purchases' },
        { name: 'Petty Cash', path: '/accounting/petty-cash' },
        { name: 'Templates', path: '/accounting/templates' },
    ];
    
    const getActionButton = () => {
        const currentPath = location.pathname;
        if (currentPath.startsWith('/accounting/purchases')) {
            return { text: 'New Purchase', path: '/accounting/purchases/new' };
        }
         if (currentPath.startsWith('/accounting/worksheet')) {
            return { text: 'New Journal Entry', path: '/accounting/worksheet' };
        }
        if (currentPath.startsWith('/accounting/petty-cash')) {
            return { text: 'New Transaction', path: '#', action: () => eventBus.emit('openNewPettyCashModal') };
        }
        return { text: 'New Purchase', path: '/accounting/purchases/new' }; // Default
    };

    const actionButton = getActionButton();

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
                <h1 className="text-3xl font-bold text-dark dark:text-light">Accounting</h1>
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

export default Accounting;