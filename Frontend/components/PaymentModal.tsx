import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Invoice, BankAccount } from '../types';
import { updateInvoice, addBankTransaction, getBankAccounts } from '../data/mockData';
import { formatCurrency } from '../utils/formatting';

interface PaymentModalProps {
  invoice: Invoice | null;
  onClose: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ invoice, onClose }) => {
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState(invoice?.total || 0);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [depositToAccountId, setDepositToAccountId] = useState('');
  const [notes, setNotes] = useState('');
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  useEffect(() => {
    if (invoice) {
      setAmount(invoice.total);
      const accounts = getBankAccounts();
      setBankAccounts(accounts);
      if (accounts.length > 0) {
        setDepositToAccountId(accounts[0].id);
      }
    }
  }, [invoice]);
  
  if (!invoice) return null;

  const handleSave = () => {
    if (!depositToAccountId) {
      alert('Please select an account to deposit to.');
      return;
    }
    
    updateInvoice({ ...invoice, status: 'Paid' });

    addBankTransaction({
      accountId: depositToAccountId,
      date: paymentDate,
      description: `Payment for Invoice #${invoice.invoiceNumber}`,
      amount: amount,
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg relative animate-fade-in-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"><X size={24} /></button>
        <h2 className="text-2xl font-bold mb-2 dark:text-white">Record Payment</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">For Invoice #{invoice.invoiceNumber} - Total: {formatCurrency(invoice.total)}</p>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Date</label>
                  <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount Paid</label>
                  <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Method</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <option>Bank Transfer</option>
                  <option>Cash</option>
                  <option>Credit Card</option>
                  <option>Check</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Deposit to Account</label>
              <select value={depositToAccountId} onChange={e => setDepositToAccountId(e.target.value)} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <option value="">Select account...</option>
                  {bankAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.accountName} ({acc.bankName})</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes (Optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="e.g., Payment reference number" className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
        </div>

        <div className="pt-6 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
            <button onClick={handleSave} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90">Confirm Payment</button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
