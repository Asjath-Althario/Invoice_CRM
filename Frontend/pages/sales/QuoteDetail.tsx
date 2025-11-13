import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, RefreshCw } from 'lucide-react';
import { apiService } from '../../services/api';
import type { Quote, InvoiceItem, Contact, ProductOrService } from '../../types';
import { formatCurrency } from '../../utils/formatting';
import eventBus from '../../utils/eventBus';

const QuoteDetail: React.FC = () => {
    const { quoteId } = useParams();
    const navigate = useNavigate();
    const [quote, setQuote] = useState<Partial<Quote>>({
        quoteNumber: `QT-${Date.now().toString().slice(-6)}`,
        contact: undefined,
        issueDate: new Date().toISOString().split('T')[0],
        expiryDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
        items: [{ id: '1', description: '', quantity: 1, unitPrice: 0, total: 0 }],
        status: 'Draft',
        comments: '',
        subtotal: 0,
        tax: 0,
        total: 0,
    });
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [products, setProducts] = useState<ProductOrService[]>([]);
    const [suggestions, setSuggestions] = useState<ProductOrService[]>([]);
    const [activeSuggestionBox, setActiveSuggestionBox] = useState<number | null>(null);
    const [preferences, setPreferences] = useState({ defaultTaxRate: 0 });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [contactsData, productsData, prefsData] = await Promise.all([
                    apiService.getContacts(),
                    apiService.getProductsServices(),
                    apiService.getPreferences()
                ]);
                // @ts-ignore
                setContacts(contactsData.filter(c => c.type === 'Customer'));
                // @ts-ignore
                setProducts(productsData);
                // @ts-ignore
                setPreferences(prefsData);

                if (quoteId) {
                    const existingQuote = await apiService.getQuoteById(quoteId);
                    // @ts-ignore
                    const quoteData = existingQuote;
                    setQuote({
                        id: (quoteData as any).id,
                        quoteNumber: (quoteData as any).quote_number,
                        contact: {
                            id: (quoteData as any).contact_id,
                            name: (quoteData as any).contact_name,
                            email: (quoteData as any).contact_email || '',
                            address: (quoteData as any).contact_address || '',
                            phone: (quoteData as any).contact_phone || '',
                            type: (quoteData as any).contact_type || 'Customer'
                        },
                        issueDate: (quoteData as any).issueDate || (quoteData as any).issue_date,
                        expiryDate: (quoteData as any).expiryDate || (quoteData as any).expiry_date,
                        items: ((quoteData as any).items || []).map((item: any) => ({
                            ...item,
                            unitPrice: item.unitPrice || item.unit_price || 0,
                            quantity: Number(item.quantity) || 0,
                            total: Number(item.total) || 0
                        })),
                        status: (quoteData as any).status,
                        comments: (quoteData as any).comments || (quoteData as any).notes,
                        subtotal: Number((quoteData as any).subtotal) || 0,
                        tax: Number((quoteData as any).tax || (quoteData as any).tax_amount) || 0,
                        total: Number((quoteData as any).total || (quoteData as any).total_amount) || 0,
                    });
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
            }
        };

        fetchData();
    }, [quoteId]);

    useEffect(() => {
        const subtotal = quote.items?.reduce((sum, item) => sum + item.total, 0) || 0;
        const tax = subtotal * (preferences.defaultTaxRate / 100);
        const total = subtotal + tax;
        setQuote(prev => ({ ...prev, subtotal, tax, total }));
    }, [quote.items, preferences.defaultTaxRate]);

    const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
        const newItems = [...(quote.items || [])];
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
            item.total = item.quantity * item.unitPrice;
        }
        
        newItems[index] = item;
        setQuote(prev => ({ ...prev, items: newItems }));
    };
    
    const handleSuggestionClick = (index: number, product: ProductOrService) => {
        const newItems = [...(quote.items || [])];
        const item = { ...newItems[index] };
        item.description = product.name;
        item.unitPrice = product.unitPrice || product.price || 0;
        item.total = item.quantity * item.unitPrice;
        newItems[index] = item;
        setQuote(prev => ({ ...prev, items: newItems }));
        setSuggestions([]);
        setActiveSuggestionBox(null);
    };

    const addItem = () => {
        const newItem: InvoiceItem = { id: `${Date.now()}`, description: '', quantity: 1, unitPrice: 0, total: 0 };
        setQuote(prev => ({ ...prev, items: [...(prev.items || []), newItem] }));
    };

    const removeItem = (index: number) => {
        const newItems = [...(quote.items || [])];
        newItems.splice(index, 1);
        setQuote(prev => ({ ...prev, items: newItems }));
    };

    const handleSave = async () => {
        if (!quote.contact) {
            alert('Please select a customer.');
            return;
        }

        try {
            const quoteData = {
                contact_id: quote.contact.id,
                issue_date: quote.issueDate,
                expiry_date: quote.expiryDate,
                subtotal: quote.subtotal || 0,
                tax_amount: quote.tax || 0,
                total_amount: quote.total || 0,
                notes: quote.comments || '',
                status: quote.status || 'Draft',
                items: quote.items || []
            };

            if (quoteId) {
                await apiService.updateQuote(quoteId, quoteData);
            } else {
                await apiService.createQuote(quoteData);
            }
            navigate('/sales/quotes');
        } catch (error: any) {
            console.error('Failed to save quote:', error);
            alert(`Failed to save quote: ${error.message}`);
        }
    };
    
    const handleConvertToInvoice = async () => {
        if (!quote.contact || !quote.items) return;

        // Ensure data types and field names are correct
        const invoiceData = {
            contact_id: String(quote.contact.id),
            issue_date: new Date().toISOString().split('T')[0],
            due_date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
            items: quote.items.map(item => ({
                description: item.description || '',
                quantity: Number(item.quantity) || 0,
                unitPrice: Number(item.unitPrice || item.unit_price) || 0,
                total: Number(item.total) || 0,
                product_id: item.product_id || null
            })),
            comments: `Based on Quote #${quote.quoteNumber || 'Unknown'}`,
            subtotal: Number(quote.subtotal) || 0,
            tax: Number(quote.tax) || 0,
            total: Number(quote.total) || 0,
        };

        try {
            console.log('Converting quote to invoice with data:', invoiceData);
            // @ts-ignore
            const newInvoice = await apiService.createInvoice(invoiceData);
            console.log('Invoice created:', newInvoice);
            // Properly map quote fields for update (backend expects *_date and *_amount names)
            await apiService.updateQuote(String(quote.id), {
                contact_id: String(quote.contact.id),
                issue_date: quote.issueDate,
                expiry_date: quote.expiryDate,
                subtotal: Number(quote.subtotal) || 0,
                tax_amount: Number(quote.tax) || 0,
                total_amount: Number(quote.total) || 0,
                notes: quote.comments || '',
                status: 'Converted',
                items: quote.items.map(item => ({
                    description: item.description || '',
                    quantity: Number(item.quantity) || 0,
                    unitPrice: Number(item.unitPrice || item.unit_price) || 0,
                    total: Number(item.total) || 0,
                    product_id: item.product_id || null
                }))
            });
            eventBus.emit('quoteConverted', { message: `Quote ${quote.quoteNumber} converted to Invoice successfully.` });
            navigate('/sales/quotes');
            // navigate(`/sales/invoice/${newInvoice.id}`); // optional navigation to invoice detail
        } catch (error: any) {
            console.error('Failed to convert quote to invoice:', error);
            alert(`Failed to convert quote: ${error.message || 'Unknown error'}`);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-6">
            <div className="flex justify-between items-start">
                <h1 className="text-2xl font-bold text-dark dark:text-light">{quoteId ? 'Edit Quote' : 'New Quote'}</h1>
                {quote.status === 'Accepted' && (
                    <button onClick={handleConvertToInvoice} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-700">
                        <RefreshCw size={18} className="mr-2"/> Convert to Invoice
                    </button>
                )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer</label>
                    <select
                        value={quote.contact?.id || ''}
                        onChange={e => setQuote(prev => ({ ...prev, contact: contacts.find(c => c.id === e.target.value) }))}
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        <option value="">Select a customer</option>
                        {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Issue Date</label>
                    <input type="date" value={quote.issueDate} onChange={e => setQuote(p => ({...p, issueDate: e.target.value}))} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Expiry Date</label>
                    <input type="date" value={quote.expiryDate} onChange={e => setQuote(p => ({...p, expiryDate: e.target.value}))} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                 {quoteId && (
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                         <select value={quote.status} onChange={e => setQuote(p => ({...p, status: e.target.value as Quote['status']}))} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                            <option>Draft</option>
                            <option>Sent</option>
                            <option>Accepted</option>
                            <option>Declined</option>
                            <option disabled>Converted</option>
                         </select>
                     </div>
                 )}
            </div>

            <div className="overflow-x-auto">
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
                        {quote.items?.map((item, index) => (
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
                                                    {p.name} - <span className="text-xs text-gray-500 dark:text-gray-400">{formatCurrency(p.unitPrice || p.price || 0)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </td>
                                <td><input type="number" value={item.quantity || 0} onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))} className="w-full p-2 text-right bg-transparent focus:outline-none dark:text-white" /></td>
                                <td><input type="number" value={item.unitPrice || 0} onChange={e => handleItemChange(index, 'unitPrice', Number(e.target.value))} className="w-full p-2 text-right bg-transparent focus:outline-none dark:text-white" /></td>
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
                        <span className="font-mono dark:text-white">{formatCurrency(quote.subtotal || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Tax ({preferences.defaultTaxRate}%):</span>
                        <span className="font-mono dark:text-white">{formatCurrency(quote.tax || 0)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2 border-gray-300 dark:border-gray-600">
                        <span className="dark:text-white">Total:</span>
                        <span className="font-mono dark:text-white">{formatCurrency(quote.total || 0)}</span>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-6">
                <button onClick={handleSave} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg shadow-md hover:bg-primary/90">
                    <Save size={18} className="mr-2" /> Save Quote
                </button>
            </div>
        </div>
    );
};

export default QuoteDetail;