
import React, { useState } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import { formatCurrency } from '../../utils/formatting';

interface JournalLine {
    id: number;
    account: string;
    debit: number;
    credit: number;
}

const Worksheet: React.FC = () => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [lines, setLines] = useState<JournalLine[]>([
        { id: 1, account: '', debit: 0, credit: 0 },
        { id: 2, account: '', debit: 0, credit: 0 },
    ]);
    
    const addLine = () => {
        setLines([...lines, { id: Date.now(), account: '', debit: 0, credit: 0 }]);
    };

    const removeLine = (id: number) => {
        setLines(lines.filter(line => line.id !== id));
    };

    const handleLineChange = (id: number, field: keyof JournalLine, value: string | number) => {
        setLines(lines.map(line => line.id === id ? { ...line, [field]: value } : line));
    };
    
    const totalDebit = lines.reduce((sum, line) => sum + Number(line.debit), 0);
    const totalCredit = lines.reduce((sum, line) => sum + Number(line.credit), 0);
    const isBalanced = totalDebit === totalCredit && totalDebit > 0;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-6">
            <h1 className="text-2xl font-bold text-dark dark:text-light">Journal Entry Worksheet</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                    <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g., Record monthly office rent" className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
            </div>

            {/* Journal Lines Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full">
                     <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Account</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-40">Debit</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-40">Credit</th>
                            <th className="w-12"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {lines.map(line => (
                            <tr key={line.id}>
                                <td><input type="text" value={line.account} onChange={e => handleLineChange(line.id, 'account', e.target.value)} className="w-full p-2 bg-transparent focus:outline-none dark:text-white" placeholder="Select account"/></td>
                                <td><input type="number" value={line.debit || ''} onChange={e => handleLineChange(line.id, 'debit', Number(e.target.value))} className="w-full p-2 text-right bg-transparent focus:outline-none dark:text-white" /></td>
                                <td><input type="number" value={line.credit || ''} onChange={e => handleLineChange(line.id, 'credit', Number(e.target.value))} className="w-full p-2 text-right bg-transparent focus:outline-none dark:text-white" /></td>
                                <td><button onClick={() => removeLine(line.id)} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={16}/></button></td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <td className="px-4 py-2 text-right font-bold dark:text-gray-200">Totals</td>
                            <td className="px-4 py-2 text-right font-mono font-bold dark:text-gray-200">{formatCurrency(totalDebit)}</td>
                            <td className="px-4 py-2 text-right font-mono font-bold dark:text-gray-200">{formatCurrency(totalCredit)}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
                <button onClick={addLine} className="mt-4 flex items-center text-primary hover:underline">
                    <Plus size={16} className="mr-1"/> Add Line
                </button>
            </div>
            
             <div className="flex justify-between items-center pt-6">
                <div>
                    {!isBalanced && totalDebit > 0 && (
                        <p className="text-sm text-red-600 dark:text-red-400">Totals do not balance.</p>
                    )}
                </div>
                <button disabled={!isBalanced} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg shadow-md hover:bg-primary/90 disabled:bg-gray-400 disabled:cursor-not-allowed">
                    <Save size={18} className="mr-2" /> Post Journal Entry
                </button>
            </div>
        </div>
    );
};

export default Worksheet;
