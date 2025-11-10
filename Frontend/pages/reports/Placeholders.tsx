import React from 'react';
import { BarChart3 } from 'lucide-react';

export const ReportPlaceholder: React.FC<{ title: string }> = ({ title }) => {
    return (
        <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col items-center justify-center text-center">
            <BarChart3 size={48} className="text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-dark">{title}</h2>
            <p className="mt-2 text-gray-500 max-w-md">
                This report is currently under construction. Please check back later for updates.
            </p>
        </div>
    );
};
