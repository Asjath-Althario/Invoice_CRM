
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Package } from 'lucide-react';
import { getProductsServices } from '../data/mockData';
import type { ProductOrService } from '../types';
import eventBus from '../utils/eventBus';

const LowStockAlertsWidget: React.FC = () => {
    const [lowStockItems, setLowStockItems] = useState<ProductOrService[]>([]);

    const refreshData = () => {
        const products = getProductsServices().filter(p => p.type === 'Product');
        const alerts = products
            .filter(p => p.stockLevel !== undefined && p.reorderPoint !== undefined && p.stockLevel <= p.reorderPoint)
            .sort((a, b) => (a.stockLevel || 0) - (b.stockLevel || 0));
            
        setLowStockItems(alerts);
    };

    useEffect(() => {
        refreshData();
        const unsubscribe = eventBus.on('dataChanged', refreshData);
        return () => unsubscribe();
    }, []);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-full">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Low Stock Alerts</h2>
            {lowStockItems.length > 0 ? (
                <ul className="space-y-4">
                    {lowStockItems.map(item => (
                        <li key={item.id} className="flex items-center justify-between">
                            <div className="flex items-center">
                                <AlertTriangle size={18} className="text-red-500 mr-3" />
                                <div>
                                    <p className="font-medium dark:text-gray-200">{item.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Reorder at: {item.reorderPoint}</p>
                                </div>
                            </div>
                            <span className="font-mono font-semibold text-sm text-red-500">{item.stockLevel} in stock</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
                    <Package size={32} className="mb-2" />
                    <p>All product stock levels are healthy.</p>
                </div>
            )}
        </div>
    );
};

export default LowStockAlertsWidget;