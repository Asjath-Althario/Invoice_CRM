import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Info } from 'lucide-react';
import { apiService } from '../../services/api';
import type { BankAccount, BankTransaction } from '../../types';
import { formatCurrency } from '../../utils/formatting';
import eventBus from '../../utils/eventBus';
import BankTransactionModal from '../../components/BankTransactionModal';

const BankDetail: React.FC = () => {
    const { accountId } = useParams<{ accountId: string }>();
    const [account, setAccount] = useState<BankAccount | undefined>(undefined);
    const [transactions, setTransactions] = useState<BankTransaction[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const refreshData = async () => {
        if (accountId) {
            try {
                const accounts = await apiService.getBankAccounts() as BankAccount[];
                const account = accounts.find(acc => acc.id === accountId);
                setAccount(account);

                if (account) {
                    const transactions = await apiService.getBankTransactions(accountId) as BankTransaction[];
                    setTransactions(transactions);
                }
            } catch (error) {
                console.error('Failed to load bank account details:', error);
            }
        }
    };
    
    useEffect(() => {
        refreshData();
        const unsubscribe = eventBus.on('dataChanged', refreshData);
        return () => unsubscribe();
    }, [accountId]);

    if (!account) {
        return <div className="p-6 text-center dark:text-white">Bank account not found.</div>;
    }

    const isPettyCash = account.type === 'Cash' || account.type === 'Petty Cash';

    return (
        <div className="space-y-6">
            <Link to="/banks" className="flex items-center text-primary hover:underline mb-4">
                <ArrowLeft size={18} className="mr-2" />
                Back to all accounts
            </Link>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-dark dark:text-light">{account.account_name || account.accountName}</h1>
                        <p className="text-gray-500 dark:text-gray-400">{account.bank_name || account.bankName} - {account.account_number || account.accountNumber}</p>
                    </div>
                    <div className="text-right">
                         <p className="text-sm text-gray-500 dark:text-gray-400">Current Balance</p>
                         <p className="text-3xl font-bold font-mono dark:text-white">{formatCurrency(account.balance)}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold dark:text-white">Transactions</h2>
                    {isPettyCash ? (
                        <div className="flex items-center p-2 rounded-md bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-sm">
                            <Info size={16} className="mr-2 flex-shrink-0" />
                            <span>Manage transactions in the <Link to="/accounting/petty-cash" className="font-bold hover:underline">Petty Cash Ledger</Link>.</span>
                        </div>
                    ) : (
                        <button onClick={() => setIsModalOpen(true)} className="flex items-center bg-primary text-white px-3 py-1.5 rounded-lg text-sm shadow-md hover:bg-primary/90">
                            <Plus size={16} className="mr-1"/> Add Transaction
                        </button>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                             <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Description</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="text-center py-10 text-gray-500 dark:text-gray-400">No transactions yet.</td>
                                </tr>
                            ) : (
                                transactions.map(tx => (
                                    <tr key={tx.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{tx.date}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">{tx.description}</td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-mono ${tx.amount < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                            {formatCurrency(tx.amount)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {isModalOpen && accountId && !isPettyCash && (
                <BankTransactionModal accountId={accountId} onClose={() => setIsModalOpen(false)} />
            )}
        </div>
    );
};

export default BankDetail;