import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import type { JournalEntry } from '../../types';

const mockJournalEntries: JournalEntry[] = [
    { id: '1', number: 'JE-001', date: '2024-07-28', description: 'Purchase counter', contact: 'Stationary Supplies', type: 'journalEntry' },
    { id: '2', number: 'JE-002', date: '2024-07-29', description: 'Office rent', contact: 'Landlord', type: 'journalEntry' },
    { id: '3', number: 'JE-003', date: '2024-07-30', description: 'Salary payment', contact: 'Employees', type: 'journalEntry' },
];


const Journal: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-dark">Journal ({mockJournalEntries.length})</h2>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                        <input id="show-voided" type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                        <label htmlFor="show-voided" className="ml-2 block text-sm text-gray-900">Show voided</label>
                    </div>
                    <button
                        onClick={() => navigate('/accounting/worksheet')}
                        className="flex items-center bg-primary text-white px-4 py-2 rounded-lg shadow-md hover:bg-primary/90 transition-colors"
                    >
                        <Plus size={20} className="mr-2" />
                        Add Journal Entry
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Number</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Docs</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {mockJournalEntries.map((entry) => (
                                <tr key={entry.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">{entry.number}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.contact}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.docs || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 mt-4">
                    <div>
                        <p className="text-sm text-gray-700">
                            Rows per page: <select className="mx-1 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"><option>25</option></select>
                            1-1 of 1
                        </p>
                    </div>
                    <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Journal;