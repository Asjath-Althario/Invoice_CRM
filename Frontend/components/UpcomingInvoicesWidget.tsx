
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { getInvoices } from '../data/mockData';
import type { Invoice } from '../types';
import { formatCurrency } from '../utils/formatting';
import eventBus from '../utils/eventBus';

const UpcomingInvoicesWidget: React.FC = () => {
    const [upcoming, setUpcoming] = useState<Invoice[]>([]);

    const refreshData = () => {
        const invoices = getInvoices();
        const today = new Date();
        const next30Days = new Date();
        next30Days.setDate(today.getDate() + 30);

        const upcomingInvoices = invoices
            .filter(inv => inv.status !== 'Paid' && new Date(inv.dueDate) >= today && new Date(inv.dueDate) <= next30Days)
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
            .slice(0, 5);
        
        setUpcoming(upcomingInvoices);
    };

    useEffect(() => {
        refreshData();
        const unsubscribe = eventBus.on('dataChanged', refreshData);
        return () => unsubscribe();
    }, []);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-full">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Upcoming Invoices (Next 30 Days)</h2>
            {upcoming.length > 0 ? (
                <ul className="space-y-4">
                    {upcoming.map(invoice => (
                        <li key={invoice.id} className="flex items-center justify-between">
                            <div>
                                <Link to={`/sales/invoice/${invoice.id}`} className="font-medium text-primary hover:underline">{invoice.contact.name}</Link>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Due: {invoice.dueDate}</p>
                            </div>
                            <span className="font-mono font-semibold text-sm dark:text-gray-200">{formatCurrency(invoice.total)}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
                    <Calendar size={32} className="mb-2" />
                    <p>No invoices due in the next 30 days.</p>
                </div>
            )}
        </div>
    );
};

export default UpcomingInvoicesWidget;