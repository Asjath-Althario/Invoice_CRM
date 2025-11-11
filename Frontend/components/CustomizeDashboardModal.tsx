import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Preferences } from '../types';

interface CustomizeDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPreferences: Preferences['dashboardWidgets'];
  onSave: (newPreferences: Preferences['dashboardWidgets']) => void;
}

const WIDGETS = [
    { id: 'salesOverview', name: 'Sales Overview' },
    { id: 'recentActivity', name: 'Recent Activity' },
    { id: 'upcomingInvoices', name: 'Upcoming Invoices' },
    { id: 'lowStockAlerts', name: 'Low Stock Alerts' },
    { id: 'recentPurchases', name: 'Recent Purchases' },
];

const CustomizeDashboardModal: React.FC<CustomizeDashboardModalProps> = ({ isOpen, onClose, currentPreferences, onSave }) => {
    const [widgets, setWidgets] = useState(currentPreferences);

    // Sync when opening or when prefs change
    useEffect(() => {
        if (isOpen) {
            setWidgets(currentPreferences);
        }
    }, [currentPreferences, isOpen]);

    if (!isOpen) return null;

    const handleToggle = (widgetId: string) => {
        setWidgets(prev => ({ ...prev, [widgetId]: !prev[widgetId] }));
    };

    const handleSave = () => {
        onSave(widgets);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg relative animate-fade-in-up">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"><X size={24} /></button>
                <h2 className="text-2xl font-bold mb-6 dark:text-white">Customize Dashboard Widgets</h2>
                
                <div className="space-y-4">
                    {WIDGETS.map(widget => (
                        <label key={widget.id} className="flex items-center justify-between p-3 border dark:border-gray-600 rounded-lg cursor-pointer">
                            <span className="font-medium dark:text-gray-200">{widget.name}</span>
                            <input
                                type="checkbox"
                                checked={!!widgets[widget.id as keyof typeof widgets]}
                                onChange={() => handleToggle(widget.id)}
                                className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                        </label>
                    ))}
                </div>

                <div className="pt-6 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                    <button onClick={handleSave} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90">Save Preferences</button>
                </div>
            </div>
        </div>
    );
};

export default CustomizeDashboardModal;