import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Landmark, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
// FIX: Corrected import paths for the new file location
import type { BankAccount } from '../types';
import { apiService } from '../services/api';
import { formatCurrency } from '../utils/formatting';
import eventBus from '../utils/eventBus';

const BankAccountModal = ({ account, onClose, onSave }: { account: Partial<BankAccount> | null, onClose: () => void, onSave: (account: BankAccount) => void }) => {
    const [formData, setFormData] = useState<Partial<BankAccount>>(account || { accountName: '', bankName: '', accountNumber: '', balance: 0, type: 'Bank' });

    if (!account) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'balance' ? Number(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form data before validation:', formData); // Debug log
        // Ensure all required fields are provided
        if (!formData.accountName?.trim() || !formData.bankName?.trim() || !formData.accountNumber?.trim()) {
            alert('Please fill in all required fields.');
            return;
        }
        console.log('Form data being submitted:', formData); // Debug log
        onSave(formData as BankAccount);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg relative animate-fade-in-up">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"><X size={24} /></button>
                <h2 className="text-2xl font-bold mb-6 dark:text-white">{formData.id ? 'Edit Bank Account' : 'New Bank Account'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account Name</label>
                        <input type="text" name="accountName" value={formData.accountName || ''} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bank Name</label>
                        <input type="text" name="bankName" value={formData.bankName || ''} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account Number</label>
                        <input type="text" name="accountNumber" value={formData.accountNumber || ''} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Balance</label>
                        <input type="number" step="0.01" name="balance" value={formData.balance || ''} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md" required />
                    </div>
                    <div className="pt-4 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                        <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90">Save Account</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Banks: React.FC = () => {
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<Partial<BankAccount> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const refreshData = async () => {
        try {
            const data = await apiService.getBankAccounts();
            setAccounts(data);
        } catch (error) {
            console.error('Failed to fetch bank accounts:', error);
        }
    };

    useEffect(() => {
        refreshData();
        const unsubscribe = eventBus.on('dataChanged', refreshData);
        return () => unsubscribe();
    }, []);

    const handleSaveAccount = async (accountToSave: BankAccount) => {
        try {
            if (accountToSave.id && accounts.some(a => a.id === accountToSave.id)) {
                await apiService.updateBankAccount(accountToSave.id, accountToSave);
            } else {
                await apiService.createBankAccount(accountToSave);
            }
            setSelectedAccount(null);
            eventBus.emit('dataChanged');
            refreshData();
        } catch (error) {
            console.error('Failed to save bank account:', error);
            alert('Failed to save bank account. Please check all required fields.');
        }
    };

    const handleDeleteAccount = async (accountId: string) => {
        if (window.confirm('Are you sure you want to delete this bank account?')) {
            try {
                await apiService.deleteBankAccount(accountId);
                refreshData();
            } catch (error) {
                console.error('Failed to delete bank account:', error);
                alert('Failed to delete bank account. Please try again.');
            }
        }
    };
    
    const filteredAccounts = accounts.filter(account =>
        (account.accountName || account.account_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (account.bankName || account.bank_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (account.accountNumber || account.account_number || '').includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <h1 className="text-3xl font-bold text-dark dark:text-light">Bank Accounts</h1>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search accounts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary dark:text-gray-200"
                        />
                    </div>
                    <button
                        onClick={() => setSelectedAccount({})}
                        className="flex-shrink-0 flex items-center bg-primary text-white px-4 py-2 rounded-lg shadow-md hover:bg-primary/90 transition-colors"
                    >
                        <Plus size={20} className="mr-2" />
                        New Account
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAccounts.map(account => (
                    <div key={account.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col justify-between">
                        <div>
                            <div className="flex items-center mb-2">
                                <Landmark size={20} className="text-gray-400 dark:text-gray-500 mr-3" />
                                <h2 className="text-lg font-semibold text-dark dark:text-white truncate">{account.accountName || account.account_name}</h2>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{account.bankName || account.bank_name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{(account.accountNumber || account.account_number || '').slice(-4).padStart((account.accountNumber || account.account_number || '').length, '*')}</p>
                            <p 
                                className="text-2xl font-bold mt-4 font-mono"
                                style={{ 
                                    color: '#ff0000',
                                    backgroundColor: '#ffff00' 
                                }}
                            >{formatCurrency(account.balance)}</p>
                        </div>
                        <div className="mt-6 flex items-center justify-between">
                             <Link to={`/banks/${account.id}`} className="text-sm font-semibold text-primary hover:underline">View Transactions</Link>
                             <div className="flex space-x-2">
                                <button onClick={() => setSelectedAccount(account)} className="text-primary hover:text-primary/80"><Edit size={18}/></button>
                                <button onClick={() => handleDeleteAccount(account.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18}/></button>
                             </div>
                        </div>
                    </div>
                ))}
            </div>
            {filteredAccounts.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <p>No bank accounts found matching your search.</p>
                </div>
            )}
            {selectedAccount && <BankAccountModal account={selectedAccount} onClose={() => setSelectedAccount(null)} onSave={handleSaveAccount} />}
        </div>
    );
};

export default Banks;
