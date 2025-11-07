

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, DollarSign, Plus } from 'lucide-react';
import { apiService } from '../../services/api';
import type { Invoice } from '../../types';
import { formatCurrency } from '../../utils/formatting';
import eventBus from '../../utils/eventBus';
import PaymentModal from '../../components/PaymentModal';

const getStatusChip = (status: Invoice['status']) => {
    switch (status) {
        case 'Paid': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        case 'Sent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        case 'Approved': return 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200';
        case 'Draft': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
};

const InvoiceList: React.FC = () => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [invoiceToPay, setInvoiceToPay] = useState<Invoice | null>(null);
    const navigate = useNavigate();

    const refreshInvoices = async () => {
        try {
            const data = await apiService.getInvoices();
            setInvoices(data);
        } catch (error) {
            console.error('Failed to load invoices:', error);
        }
    };

    useEffect(() => {
        refreshInvoices();
        const unsubscribe = eventBus.on('dataChanged', refreshInvoices);
        return () => unsubscribe();
    }, []);

    const handleDelete = async (invoiceId: string) => {
        if (window.confirm('Are you sure you want to delete this invoice?')) {
            try {
                await apiService.deleteInvoice(invoiceId);
                refreshInvoices();
            } catch (error) {
                console.error('Failed to delete invoice:', error);
                alert('Failed to delete invoice. Please try again.');
            }
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-dark dark:text-light">Invoices</h1>
                <button
                    onClick={() => navigate('/sales/invoice')}
                    className="flex items-center bg-primary text-white px-4 py-2 rounded-lg shadow-md hover:bg-primary/90 transition-colors"
                >
                    <Plus size={20} className="mr-2" />
                    New Invoice
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="overflow-x-auto">
                <table className="min-w-full bg-white dark:bg-gray-800">
                    <thead className="bg-gray-50 dark:bg-transparent border-b border-gray-200 dark:border-gray-600">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Invoice #</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Issue Date</th>
                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Due Date</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {invoices.map((invoice) => (
                            <tr key={invoice.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary dark:text-blue-400 hover:underline cursor-pointer" onClick={() => navigate(`/sales/invoice/${invoice.id}`)}>{invoice.invoiceNumber}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{invoice.contact_name || invoice.contact?.name || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{invoice.issueDate}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{invoice.dueDate}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right font-mono">{formatCurrency(invoice.total)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusChip(invoice.status)}`}>
                                        {invoice.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                     {invoice.status !== 'Paid' && (
                                        <button 
                                            onClick={() => setInvoiceToPay(invoice)} 
                                            title="Record Payment" 
                                            className="text-green-600 hover:text-green-800 dark:text-green-500 dark:hover:text-green-400"
                                        >
                                            <DollarSign size={18}/>
                                        </button>
                                     )}
                                     <button onClick={() => navigate(`/sales/invoice/${invoice.id}`)} className="text-primary hover:text-primary/80 dark:text-blue-400 dark:hover:text-blue-300"><Edit size={18}/></button>
                                     <button onClick={() => handleDelete(invoice.id)} className="text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400"><Trash2 size={18}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <PaymentModal invoice={invoiceToPay} onClose={() => setInvoiceToPay(null)} />
        </div>
        </div>
    );
};

export default InvoiceList;