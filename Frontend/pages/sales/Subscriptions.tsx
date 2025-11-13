import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Calendar, DollarSign, User } from 'lucide-react';
import { apiService } from '../../services/api';
import { formatCurrency } from '../../utils/formatting';

interface Subscription {
    id: string;
    contact: {
        id: string;
        name: string;
        email: string;
    };
    startDate: string;
    endDate?: string;
    frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
    status: 'Active' | 'Paused' | 'Finished';
    subtotal: number;
    tax_amount: number;
    total_amount: number;
    notes?: string;
}

const getStatusChip = (status: Subscription['status']) => {
    switch (status) {
        case 'Active': return 'bg-green-100 text-green-800';
        case 'Paused': return 'bg-yellow-100 text-yellow-800';
        case 'Finished': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const getFrequencyChip = (frequency: Subscription['frequency']) => {
    switch (frequency) {
        case 'Daily': return 'bg-blue-100 text-blue-800';
        case 'Weekly': return 'bg-purple-100 text-purple-800';
        case 'Monthly': return 'bg-indigo-100 text-indigo-800';
        case 'Yearly': return 'bg-pink-100 text-pink-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const Subscriptions: React.FC = () => {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const refreshData = async () => {
        try {
            setLoading(true);
            const response = await apiService.getRecurringInvoices();
            // @ts-ignore
            setSubscriptions(response || []);
        } catch (error) {
            console.error('Failed to fetch subscriptions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this subscription?')) {
            try {
                await apiService.deleteRecurringInvoice(id);
                refreshData();
            } catch (error) {
                console.error('Failed to delete subscription:', error);
                alert('Failed to delete subscription');
            }
        }
    };

    const handleNew = () => {
        navigate('/sales/recurring/new');
    };

    const handleView = (id: string) => {
        navigate(`/sales/recurring/${id}`);
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <p className="text-gray-600 dark:text-gray-400">Loading subscriptions...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscriptions</h1>
                <button
                    onClick={handleNew}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={20} />
                    New Subscription
                </button>
            </div>

            {/* Subscriptions Grid */}
            {subscriptions.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 p-12 rounded-lg shadow-md text-center">
                    <Calendar size={48} className="mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">No subscriptions yet</p>
                    <button
                        onClick={handleNew}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={20} />
                        Create Your First Subscription
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {subscriptions.map((subscription) => (
                        <div
                            key={subscription.id}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                        >
                            {/* Card Header */}
                            <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <User size={18} />
                                            <h3 className="font-semibold truncate">{subscription.contact.name}</h3>
                                        </div>
                                        <p className="text-sm text-blue-100 truncate">{subscription.contact.email}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusChip(subscription.status)}`}>
                                        {subscription.status}
                                    </span>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-4 space-y-3">
                                {/* Frequency & Dates */}
                                <div className="flex items-center justify-between">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getFrequencyChip(subscription.frequency)}`}>
                                        {subscription.frequency}
                                    </span>
                                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                        <Calendar size={14} />
                                        <span>{new Date(subscription.startDate).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                {/* Amount */}
                                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center gap-2">
                                        <DollarSign size={18} className="text-green-600" />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
                                    </div>
                                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                                        {formatCurrency(subscription.total_amount)}
                                    </span>
                                </div>

                                {/* End Date */}
                                {subscription.endDate && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        Ends: {new Date(subscription.endDate).toLocaleDateString()}
                                    </div>
                                )}

                                {/* Notes */}
                                {subscription.notes && (
                                    <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                        {subscription.notes}
                                    </div>
                                )}
                            </div>

                            {/* Card Footer */}
                            <div className="p-3 bg-gray-50 dark:bg-gray-700 flex justify-end gap-2">
                                <button
                                    onClick={() => handleView(subscription.id)}
                                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                >
                                    <Edit size={14} />
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(subscription.id)}
                                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                >
                                    <Trash2 size={14} />
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Subscriptions;
