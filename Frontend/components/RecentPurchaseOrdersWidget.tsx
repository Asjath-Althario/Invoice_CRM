import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import type { Purchase } from '../types';
import { formatCurrency } from '../utils/formatting';
import eventBus from '../utils/eventBus';
import { apiService } from '../services/api';

const RecentPurchaseOrdersWidget: React.FC = () => {
    const [recentPurchases, setRecentPurchases] = useState<Purchase[]>([]);

    const refreshData = async () => {
        try {
            const raw = (await apiService.getPurchases()) as any[];
            const purchases = raw.map(p => ({
                ...p,
                date: p.date || p.purchase_date,
                purchaseOrderNumber: p.purchase_order_number || p.purchaseOrderNumber,
                total: p.total ?? p.total_amount ?? 0,
                status: p.status || 'Draft',
                purchaseType: p.purchase_type || p.purchaseType || 'Credit',
                currency: p.currency || 'AED',
                vendor: p.vendor || p.supplier_name || p.supplier || 'Vendor',
                lineItems: p.lineItems || [],
                subtotal: p.subtotal ?? 0,
                vat: p.vat ?? p.tax ?? 0,
            }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5) as Purchase[];
            setRecentPurchases(purchases);
        } catch (e) {
            console.error('Failed to load recent purchases:', e);
            setRecentPurchases([]);
        }
    };

    useEffect(() => {
        refreshData();
        const unsubscribe = eventBus.on('dataChanged', refreshData);
        return () => unsubscribe();
    }, []);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-full">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Recent Purchases</h2>
            {recentPurchases.length > 0 ? (
                <ul className="space-y-4">
                    {recentPurchases.map(purchase => (
                        <li key={purchase.id} className="flex items-center justify-between">
                            <div>
                                <Link to={`/accounting/purchases/${purchase.id}`} className="font-medium text-primary hover:underline">{purchase.vendor}</Link>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Date: {purchase.date}</p>
                            </div>
                            <span className="font-mono font-semibold text-sm dark:text-gray-200">{formatCurrency(purchase.total)}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
                    <ShoppingCart size={32} className="mb-2" />
                    <p>No recent purchases recorded.</p>
                </div>
            )}
        </div>
    );
};

export default RecentPurchaseOrdersWidget;