

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2 } from 'lucide-react';
import { apiService } from '../../services/api';
import type { Quote } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatting';
import eventBus from '../../utils/eventBus';


const getStatusChip = (status: Quote['status']) => {
    switch (status) {
        case 'Accepted': return 'bg-green-100 text-green-800';
        case 'Sent': return 'bg-blue-100 text-blue-800';
        case 'Draft': return 'bg-yellow-100 text-yellow-800';
        case 'Declined': return 'bg-red-100 text-red-800';
        case 'Converted': return 'bg-purple-100 text-purple-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const Quotes: React.FC = () => {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const navigate = useNavigate();

    const refreshData = async () => {
        try {
            const response = await apiService.getQuotes();
            // @ts-ignore
            const quotesData = response || [];
            const formattedQuotes = (quotesData as any[]).map((quote: any) => ({
                ...quote,
                quoteNumber: quote.quote_number,
                issueDate: quote.issue_date,
                expiryDate: quote.expiry_date,
                contact: {
                    id: quote.contact_id,
                    name: quote.contact_name,
                    email: '',
                    address: '',
                    phone: '',
                    type: 'Customer' as const
                },
                total: quote.total_amount,
                tax: quote.tax_amount,
                subtotal: quote.subtotal,
                comments: quote.notes,
                items: quote.items || []
            }));
            setQuotes(formattedQuotes);
        } catch (error) {
            console.error('Failed to fetch quotes:', error);
        }
    };

    useEffect(() => {
        refreshData();
    }, []);


    const handleDelete = async (quoteId: string) => {
        if (window.confirm('Are you sure you want to delete this quote?')) {
            try {
                await apiService.deleteQuote(quoteId);
                refreshData();
            } catch (error) {
                console.error('Failed to delete quote:', error);
            }
        }
    };
    
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white dark:bg-gray-800">
                    <thead className="bg-gray-50 dark:bg-transparent border-b border-gray-200 dark:border-gray-600">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Quote #</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Issue Date</th>
                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Expiry Date</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {quotes.map((quote) => (
                            <tr key={quote.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary dark:text-blue-400 hover:underline cursor-pointer" onClick={() => navigate(`/sales/quote/${quote.id}`)}>{quote.quoteNumber}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{quote.contact.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDate(quote.issueDate)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDate(quote.expiryDate)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right font-mono">{formatCurrency(quote.total)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusChip(quote.status)}`}>
                                        {quote.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                     <button onClick={() => navigate(`/sales/quote/${quote.id}`)} className="text-primary hover:text-primary/80 dark:text-blue-400 dark:hover:text-blue-300"><Edit size={18}/></button>
                                     <button onClick={() => handleDelete(quote.id)} className="text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400"><Trash2 size={18}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Quotes;