import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save } from 'lucide-react';
import { apiService } from '../../services/api';
import type { RecurringInvoice, InvoiceItem, Contact, ProductOrService, Preferences } from '../../types';
import { formatCurrency } from '../../utils/formatting';

const RecurringInvoiceDetail: React.FC = () => {
    const { recurringInvoiceId } = useParams();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState<Partial<RecurringInvoice>>({
        contact: undefined,
        start_date: new Date().toISOString().split('T')[0],
        frequency: 'Monthly',
        items: [{ id: '1', description: '', quantity: 1, unitPrice: 0, total: 0 }],
        status: 'Active',
    });
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [products, setProducts] = useState<ProductOrService[]>([]);
    const [suggestions, setSuggestions] = useState<ProductOrService[]>([]);
    const [activeSuggestionBox, setActiveSuggestionBox] = useState<number | null>(null);
    const [preferences, setPreferences] = useState<Preferences | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [contactsData, productsData, prefsData] = await Promise.all([
                    apiService.getContacts(),
                    apiService.getProductsServices(),
                    apiService.getPreferences(),
                ]);
                setContacts((contactsData as Contact[]).filter(c => c.type === 'Customer'));
                setProducts(productsData as ProductOrService[]);
                setPreferences(prefsData as Preferences);

                if (recurringInvoiceId) {
                    const existing = await apiService.getRecurringInvoiceById(recurringInvoiceId);
                    setInvoice(existing as RecurringInvoice);
                }
            } catch (error) {
                console.error("Failed to load recurring invoice data:", error);
            }
        };
        loadData();
    }, [recurringInvoiceId]);
    
    useEffect(() => {
        if (preferences) {
            const subtotal = invoice.items?.reduce((sum, item) => {
                const itemTotal = Number(item.total) || 0;
                return sum + itemTotal;
            }, 0) || 0;
            const tax_amount = subtotal * ((preferences.defaultTaxRate || 0) / 100);
            const total_amount = subtotal + tax_amount;
            setInvoice(prev => ({ ...prev, subtotal, tax_amount, total_amount }));
        }
    }, [invoice.items, preferences]);

    const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
        const newItems = [...(invoice.items || [])];
        const item = { ...newItems[index] };
        (item[field] as any) = value;

        if (field === 'description') {
            const input = value as string;
            if (input.length > 1) {
                setSuggestions(products.filter(p => p.name.toLowerCase().includes(input.toLowerCase())));
                setActiveSuggestionBox(index);
            } else {
                setSuggestions([]);
                 setActiveSuggestionBox(null);
            }
        }

        if (field === 'quantity' || field === 'unitPrice') {
            // Ensure we have valid numbers for calculation
            const quantity = Number(item.quantity) || 0;
            const unitPrice = Number(item.unitPrice) || 0;
            item.total = quantity * unitPrice;
        }
        
        newItems[index] = item;
        setInvoice(prev => ({ ...prev, items: newItems }));
    };

    const handleSuggestionClick = (index: number, product: ProductOrService) => {
        const newItems = [...(invoice.items || [])];
        const item = { ...newItems[index] };
        item.description = product.name;
        item.unitPrice = product.price || product.unitPrice || 0;
        const quantity = Number(item.quantity) || 0;
        const unitPrice = Number(item.unitPrice) || 0;
        item.total = quantity * unitPrice;
        newItems[index] = item;
        setInvoice(prev => ({ ...prev, items: newItems }));
        setSuggestions([]);
        setActiveSuggestionBox(null);
    };

    const addItem = () => {
        const newItem: InvoiceItem = { id: `${Date.now()}`, description: '', quantity: 1, unitPrice: 0, total: 0 };
        setInvoice(prev => ({ ...prev, items: [...(prev.items || []), newItem] }));
    };

    const removeItem = (index: number) => {
        const newItems = [...(invoice.items || [])];
        newItems.splice(index, 1);
        setInvoice(prev => ({ ...prev, items: newItems }));
    };

    const handleSave = async () => {
        if (!invoice.contact) {
            alert('Please select a customer.');
            return;
        }
        const recurringInvoiceData = {
            contact_id: invoice.contact?.id || invoice.contact_id,
            start_date: invoice.start_date,
            end_date: invoice.end_date,
            frequency: invoice.frequency,
            status: invoice.status,
            subtotal: Number(invoice.subtotal) || 0,
            tax_amount: Number(invoice.tax_amount) || 0,
            total_amount: Number(invoice.total_amount) || 0,
            notes: invoice.notes || '',
            items: (invoice.items || []).map(item => ({
                ...item,
                quantity: Number(item.quantity) || 0,
                unitPrice: Number(item.unitPrice) || 0,
                total: Number(item.total) || 0
            }))
        };

        try {
            if (recurringInvoiceId) {
                await apiService.updateRecurringInvoice(recurringInvoiceId, recurringInvoiceData);
            } else {
                await apiService.createRecurringInvoice(recurringInvoiceData);
            }
            navigate('/sales/recurring');
        } catch (error) {
            console.error("Failed to save recurring invoice:", error);
            alert('Failed to save recurring invoice. Please try again.');
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-6">
            <h1 className="text-2xl font-bold text-dark dark:text-light">{recurringInvoiceId ? 'Edit Recurring Invoice' : 'New Recurring Invoice'}</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer</label>
                    <select
                        value={invoice.contact?.id || ''}
                        onChange={e => {
                            const selectedContact = contacts.find(c => c.id === e.target.value);
                            setInvoice(prev => ({ ...prev, contact: selectedContact, contact_id: e.target.value }));
                        }}
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        <option value="">Select a customer</option>
                        {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {invoice.contact && (
                        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md border dark:border-gray-600">
                            {invoice.contact.trn && <p><strong>TRN:</strong> {invoice.contact.trn}</p>}
                            <p><strong>Email:</strong> {invoice.contact.email}</p>
                        </div>
                    )}
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                    <input type="date" value={invoice.start_date} onChange={e => setInvoice(p => ({...p, start_date: e.target.value}))} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date (Optional)</label>
                    <input type="date" value={invoice.end_date || ''} onChange={e => setInvoice(p => ({...p, end_date: e.target.value}))} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Frequency</label>
                     <select
                        value={invoice.frequency}
                        onChange={e => setInvoice(prev => ({ ...prev, frequency: e.target.value as any }))}
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        <option>Daily</option>
                        <option>Weekly</option>
                        <option>Monthly</option>
                        <option>Yearly</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                    <select
                        value={invoice.status}
                        onChange={e => setInvoice(prev => ({ ...prev, status: e.target.value as 'Active' | 'Paused' | 'Ended' }))}
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        <option>Active</option>
                        <option>Paused</option>
                        <option>Ended</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                    <textarea
                        value={invoice.notes || ''}
                        onChange={e => setInvoice(prev => ({ ...prev, notes: e.target.value }))}
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        rows={3}
                        placeholder="Additional notes for this recurring invoice..."
                    />
                </div>
            </div>

             <div className="overflow-x-auto">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">Line Items</h3>
                <table className="min-w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Description</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-24">Qty</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-32">Unit Price</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-32">Total</th>
                            <th className="w-12"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {invoice.items?.map((item, index) => (
                            <tr key={item.id}>
                                <td className="relative">
                                    <input
                                        type="text"
                                        value={item.description}
                                        onChange={e => handleItemChange(index, 'description', e.target.value)}
                                        onFocus={() => setActiveSuggestionBox(index)}
                                        onBlur={() => {
                                            // Delay to allow click on suggestion
                                            setTimeout(() => setActiveSuggestionBox(null), 150);
                                        }}
                                        className="w-full p-2 bg-transparent focus:outline-none dark:text-white"
                                        placeholder="Item description"
                                    />
                                     {activeSuggestionBox === index && suggestions.length > 0 && (
                                        <ul className="absolute z-10 w-full bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                            {suggestions.map(p => (
                                                <li key={p.id} onClick={() => handleSuggestionClick(index, p)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-sm dark:text-gray-200">
                                                    {p.name} - <span className="text-xs text-gray-500 dark:text-gray-400">{formatCurrency(p.price)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </td>
                                <td><input type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))} className="w-full p-2 text-right bg-transparent focus:outline-none dark:text-white" /></td>
                                <td><input type="number" value={item.unitPrice} onChange={e => handleItemChange(index, 'unitPrice', Number(e.target.value))} className="w-full p-2 text-right bg-transparent focus:outline-none dark:text-white" /></td>
                                <td className="p-2 text-right font-mono dark:text-gray-300">{formatCurrency(item.total)}</td>
                                <td><button onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={16}/></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 <button onClick={addItem} className="mt-4 flex items-center text-primary hover:underline">
                    <Plus size={16} className="mr-1"/> Add Item
                </button>
            </div>

            <div className="flex justify-end">
                <div className="w-full max-w-xs space-y-2">
                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                        <span className="font-mono dark:text-white">{formatCurrency(invoice.subtotal || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Tax ({preferences?.defaultTaxRate || 0}%):</span>
                        <span className="font-mono dark:text-white">{formatCurrency(invoice.tax_amount || 0)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2 border-gray-300 dark:border-gray-600">
                        <span className="dark:text-white">Total:</span>
                        <span className="font-mono dark:text-white">{formatCurrency(invoice.total_amount || 0)}</span>
                    </div>
                </div>
            </div>
            
            <div className="flex justify-end pt-6">
                <button onClick={handleSave} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg shadow-md hover:bg-primary/90">
                    <Save size={18} className="mr-2" /> Save Profile
                </button>
            </div>
        </div>
    );
};

export default RecurringInvoiceDetail;