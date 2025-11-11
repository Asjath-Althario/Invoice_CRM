

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { apiService } from '../../services/api';
import type { PettyCashTransaction, BankAccount } from '../../types';
import { formatCurrency } from '../../utils/formatting';
import eventBus from '../../utils/eventBus';

const getStatusChip = (status: PettyCashTransaction['status']) => {
    switch (status) {
        case 'Approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
        case 'Rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
};

interface TransactionModalProps {
  onClose: () => void;
  onSave: (transaction: Omit<PettyCashTransaction, 'id' | 'status'>, fundingAccountId?: string) => void;
  bankAccounts: BankAccount[];
}

const TransactionModal: React.FC<TransactionModalProps> = ({ onClose, onSave, bankAccounts }) => {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        description: '',
        type: 'Expense' as PettyCashTransaction['type'],
        amount: 0,
    });
    const [fundingAccountId, setFundingAccountId] = useState<string>(bankAccounts[0]?.id || '');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'amount' ? Number(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.type === 'Funding' && !fundingAccountId) {
            alert('Please select a funding source account.');
            return;
        }
        onSave(formData, formData.type === 'Funding' ? fundingAccountId : undefined);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg relative animate-fade-in-up">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"><X size={24} /></button>
                <h2 className="text-2xl font-bold mb-6 dark:text-white">New Petty Cash Transaction</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                        <input type="date" name="date" value={formData.date} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                        <input type="text" name="description" value={formData.description} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                            <select name="type" value={formData.type} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                <option>Expense</option>
                                <option>Reimbursement</option>
                                <option>Funding</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                            <input type="number" step="0.01" name="amount" value={formData.amount || ''} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                        </div>
                    </div>

                    {formData.type === 'Funding' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fund from Account</label>
                            <select 
                                name="fundingAccountId" 
                                value={fundingAccountId} 
                                onChange={e => setFundingAccountId(e.target.value)} 
                                className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                                required
                            >
                                <option value="">Select funding account...</option>
                                {bankAccounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.accountName} ({formatCurrency(acc.balance || 0)})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="pt-4 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                        <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90">Save Transaction</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const PettyCash: React.FC = () => {
    const [transactions, setTransactions] = useState<PettyCashTransaction[]>([]);
    const [pettyCashAccount, setPettyCashAccount] = useState<BankAccount | null>(null);
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const refreshData = async () => {
        try {
            setIsLoading(true);
            const [allAccounts, transactionsData] = await Promise.all([
                apiService.getBankAccounts(),
                apiService.getPettyCashTransactions()
            ]);
            const pcAccount = (allAccounts as BankAccount[]).find(acc => acc.type === 'Cash') || null;
            setPettyCashAccount(pcAccount);
            setBankAccounts((allAccounts as BankAccount[]).filter(acc => acc.type === 'Bank'));
            setTransactions(transactionsData);
        } catch (error) {
            console.error('Failed to fetch petty cash data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveTransaction = async (transaction: Omit<PettyCashTransaction, 'id' | 'status'>, fundingAccountId?: string) => {
        try {
            // Create the petty cash transaction
            const pettyCashTx = {
                ...transaction,
                status: transaction.type === 'Funding' ? 'Approved' : 'Pending', // Auto-approve funding
            };
            await apiService.createPettyCashTransaction(pettyCashTx);

            // If it's funding, create corresponding bank transactions
            if (transaction.type === 'Funding' && fundingAccountId && pettyCashAccount) {
                // Create withdrawal from funding source account
                await apiService.addBankTransaction(fundingAccountId, {
                    date: transaction.date,
                    description: `Petty Cash Funding - ${transaction.description}`,
                    amount: -transaction.amount, // Negative for withdrawal
                    type: 'debit',
                    action: 'Fund Transfer to Petty Cash'
                });

                // Create deposit to petty cash account
                await apiService.addBankTransaction(pettyCashAccount.id, {
                    date: transaction.date,
                    description: `Funding from ${bankAccounts.find(acc => acc.id === fundingAccountId)?.accountName || 'Bank'} - ${transaction.description}`,
                    amount: transaction.amount, // Positive for deposit
                    type: 'credit',
                    action: 'Receive Funding from Bank Account'
                });
            }
            
            setIsModalOpen(false);
            refreshData();
        } catch (error) {
            console.error('Failed to save petty cash transaction:', error);
            alert('Failed to save transaction. Please try again.');
        }
    };

    const handleApprove = async (transaction: PettyCashTransaction) => {
        try {
            console.log('Approving transaction:', transaction);
            
            // Step 1: Update petty cash transaction status
            await apiService.updatePettyCashTransaction(transaction.id, { 
                ...transaction, 
                status: 'Approved' 
            });
            console.log('Petty cash transaction updated successfully');

            // Step 2: Create bank transaction for approved petty cash transactions
            if (!pettyCashAccount) {
                console.error('Petty cash account not found!');
                alert('Error: Petty cash account not found. Please refresh the page and try again.');
                return;
            }

            console.log('Petty cash account found:', pettyCashAccount.id);
            
            if (transaction.type === 'Expense' || transaction.type === 'Reimbursement') {
                console.log('Creating debit bank transaction for expense/reimbursement');
                // Create a debit transaction (negative amount for expense/reimbursement)
                const bankTxResult = await apiService.addBankTransaction(pettyCashAccount.id, {
                    date: transaction.date,
                    description: transaction.description,
                    amount: -transaction.amount, // Negative for expense/reimbursement
                    type: 'debit',
                    action: transaction.type === 'Expense' ? 'Petty Cash Expense' : 'Employee Reimbursement'
                });
                console.log('Bank transaction created:', bankTxResult);
            } else if (transaction.type === 'Funding') {
                console.log('Creating credit bank transaction for funding');
                console.log('Transaction amount:', transaction.amount, 'Type:', typeof transaction.amount);
                
                // Ensure amount is a number
                const amount = typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : transaction.amount;
                console.log('Parsed amount:', amount);
                
                // Create a credit transaction (positive amount for funding)
                const bankTxResult = await apiService.addBankTransaction(pettyCashAccount.id, {
                    date: transaction.date,
                    description: transaction.description,
                    amount: amount, // Positive for funding
                    type: 'credit',
                    action: 'Receive Funding from Bank Account'
                });
                console.log('Bank transaction created:', bankTxResult);
            }

            console.log('Refreshing data...');
            refreshData();
            console.log('Transaction approval completed successfully');
        } catch (error) {
            console.error('Failed to approve transaction:', error);
            console.error('Error details:', error.response?.data || error.message);
            alert(`Failed to approve transaction: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleReject = async (transaction: PettyCashTransaction) => {
        if (window.confirm('Are you sure you want to reject this transaction? This action cannot be undone.')) {
            try {
                await apiService.updatePettyCashTransaction(transaction.id, { 
                    ...transaction, 
                    status: 'Rejected' 
                });
                refreshData();
            } catch (error) {
                console.error('Failed to reject transaction:', error);
                alert('Failed to reject transaction. Please try again.');
            }
        }
    };

    useEffect(() => {
        const initializeData = async () => {
            await refreshData();
        };
        
        initializeData();
        const dataSub = eventBus.on('dataChanged', refreshData);
        const modalSub = eventBus.on('openNewPettyCashModal', () => setIsModalOpen(true));
        return () => {
            dataSub();
            modalSub();
        };
    }, []);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold dark:text-white">Petty Cash Ledger</h2>
                    <button
                        onClick={refreshData}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
                        title="Refresh data"
                    >
                        <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                        {isLoading ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Current Balance</p>
                    <p className="text-2xl font-bold font-mono dark:text-white">{formatCurrency(pettyCashAccount?.balance || 0)}</p>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white dark:bg-gray-800">
                    <thead className="bg-gray-50 dark:bg-transparent border-b border-gray-200 dark:border-gray-600">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase">Type</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-200 uppercase">Amount</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-200 uppercase">Status</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-200 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {transactions.map((t) => (
                            <tr key={t.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{t.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{t.description}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{t.type}</td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-mono ${t.type === 'Expense' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                    {t.type === 'Expense' ? '-' : ''}{formatCurrency(t.amount)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusChip(t.status)}`}>
                                        {t.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                    {t.status === 'Pending' ? (
                                        <>
                                            <button 
                                                onClick={() => handleApprove(t)} 
                                                title="Approve" 
                                                className="text-green-600 hover:text-green-800 dark:text-green-500 dark:hover:text-green-400 p-1"
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleReject(t)} 
                                                title="Reject" 
                                                className="text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400 p-1"
                                            >
                                                <XCircle size={18} />
                                            </button>
                                        </>
                                    ) : (
                                        <span>-</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <TransactionModal onClose={() => setIsModalOpen(false)} onSave={handleSaveTransaction} bankAccounts={bankAccounts} />}
        </div>
    );
};

export default PettyCash;