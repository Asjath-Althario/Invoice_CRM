


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit, Trash2, DollarSign } from 'lucide-react';
import { getPurchases, deletePurchase } from '../../data/mockData';
import type { Purchase } from '../../types';
import { formatCurrency } from '../../utils/formatting';
import eventBus from '../../utils/eventBus';
import PurchasePaymentModal from '../../components/PurchasePaymentModal';

const getStatusChip = (status: Purchase['status']) => {
    switch (status) {
        case 'Paid': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
        case 'Scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
};

const PurchaseList: React.FC = () => {
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [purchaseToPay, setPurchaseToPay] = useState<Purchase | null>(null);
    const navigate = useNavigate();

    const refreshPurchases = () => setPurchases(getPurchases());

    useEffect(() => {
        refreshPurchases();
        const unsubscribe = eventBus.on('dataChanged', refreshPurchases);
        return () => unsubscribe();
    }, []);

    const handleDelete = (purchaseId: string) => {
        if (window.confirm('Are you sure you want to delete this purchase record?')) {
            deletePurchase(purchaseId);
        }
    };
    
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white dark:bg-gray-800">
                    <thead className="bg-gray-50 dark:bg-transparent border-b border-gray-200 dark:border-gray-600">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Vendor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">PO Number</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Total</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {purchases.map((purchase) => (
                            <tr key={purchase.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{purchase.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 font-medium">{purchase.vendor}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{purchase.purchaseOrderNumber || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right font-mono">{formatCurrency(purchase.total)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusChip(purchase.status)}`}>
                                        {purchase.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                     {purchase.status !== 'Paid' && (
                                        <button 
                                            onClick={() => setPurchaseToPay(purchase)} 
                                            title="Record Payment" 
                                            className="text-green-600 hover:text-green-800 dark:text-green-500 dark:hover:text-green-400"
                                        >
                                            <DollarSign size={18}/>
                                        </button>
                                     )}
                                     <button onClick={() => navigate(`/accounting/purchases/${purchase.id}`)} title="View Details" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"><Eye size={18}/></button>
                                     <button onClick={() => navigate(`/accounting/purchases/${purchase.id}`)} title="Edit Purchase" className="text-primary hover:text-primary/80 dark:text-blue-400 dark:hover:text-blue-300"><Edit size={18}/></button>
                                     <button title="Delete Purchase" onClick={() => handleDelete(purchase.id)} className="text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400"><Trash2 size={18}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <PurchasePaymentModal purchase={purchaseToPay} onClose={() => setPurchaseToPay(null)} />
        </div>
    );
};

export default PurchaseList;