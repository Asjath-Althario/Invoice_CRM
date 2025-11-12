

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, Plus } from 'lucide-react';
import { apiService } from '../../services/api';
import type { RecurringInvoice } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatting';
import eventBus from '../../utils/eventBus';

const getStatusChip = (status: RecurringInvoice['status']) => {
    switch (status) {
        case 'Active': return 'bg-green-100 text-green-800';
        case 'Paused': return 'bg-yellow-100 text-yellow-800';
        case 'Ended': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const calculateNextInvoiceDate = (startDate: string, frequency: RecurringInvoice['frequency']): string => {
    const date = new Date(startDate);
    const today = new Date();
    
    while (date <= today) {
        switch (frequency) {
            case 'Daily': date.setDate(date.getDate() + 1); break;
            case 'Weekly': date.setDate(date.getDate() + 7); break;
            case 'Monthly': date.setMonth(date.getMonth() + 1); break;
            case 'Yearly': date.setFullYear(date.getFullYear() + 1); break;
        }
    }
    return date.toISOString().split('T')[0];
};

const RecurringInvoices: React.FC = () => {
    const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoice[]>([]);
    const navigate = useNavigate();

    const refreshData = async () => {
        try {
            const data = await apiService.getRecurringInvoices();
            setRecurringInvoices(data as RecurringInvoice[]);
        } catch (error) {
            console.error("Failed to fetch recurring invoices:", error);
        }
    };

    useEffect(() => {
        refreshData();
        const unsubscribe = eventBus.on('dataChanged', refreshData);
        return () => unsubscribe();
    }, []);

    const handleDelete = async (invoiceId: string) => {
        if (window.confirm('Are you sure you want to delete this recurring invoice profile?')) {
            try {
                await apiService.deleteRecurringInvoice(invoiceId);
                refreshData();
            } catch (error) {
                console.error("Failed to delete recurring invoice:", error);
            }
        }
    };
    
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white dark:bg-gray-800">
                    <thead className="bg-gray-50 dark:bg-transparent border-b border-gray-200 dark:border-gray-600">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Start Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Frequency</th>
                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Next Invoice Date</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {recurringInvoices.map((invoice) => (
                            <tr key={invoice.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{invoice.contact_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDate(invoice.start_date)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{invoice.frequency}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-medium">{calculateNextInvoiceDate(invoice.start_date, invoice.frequency)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right font-mono">{formatCurrency(invoice.total_amount)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusChip(invoice.status)}`}>
                                        {invoice.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                     <button onClick={() => navigate(`/sales/recurring/${invoice.id}`)} className="text-primary hover:text-primary/80 dark:text-blue-400 dark:hover:text-blue-300"><Edit size={18}/></button>
                                     <button onClick={() => handleDelete(invoice.id)} className="text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400"><Trash2 size={18}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RecurringInvoices;