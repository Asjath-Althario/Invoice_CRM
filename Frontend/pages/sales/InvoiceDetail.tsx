import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, DollarSign, Printer, MessageSquare, X } from 'lucide-react';
import { apiService } from '../../services/api';
import type { Invoice, InvoiceItem, Contact, ProductOrService, CompanyProfile } from '../../types';
import { formatCurrency } from '../../utils/formatting';
import eventBus from '../../utils/eventBus';
import PaymentModal from '../../components/PaymentModal';
import PrintableInvoice from '../../components/PrintableInvoice';

const InvoiceDetail: React.FC = () => {
    const { invoiceId } = useParams();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState<Partial<Invoice>>({
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        contact: undefined,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
        items: [{ id: '1', description: '', quantity: 1, unitPrice: 0, total: 0 }],
        status: 'Draft',
        comments: '',
    });
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [products, setProducts] = useState<ProductOrService[]>([]);
    const [suggestions, setSuggestions] = useState<ProductOrService[]>([]);
    const [activeSuggestionBox, setActiveSuggestionBox] = useState<number | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [preferences, setPreferences] = useState<any>(null);
    const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
    const [isWhatsAppPreviewOpen, setIsWhatsAppPreviewOpen] = useState(false);
    const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
    const [whatsAppMessage, setWhatsAppMessage] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                const [contactsData, productsData, companyData, prefsData] = await Promise.all([
                    apiService.getContacts(),
                    apiService.getProductsServices(),
                    apiService.getCompanyProfile(),
                    apiService.getPreferences()
                ]);

                console.log('Contacts data:', contactsData);
                const filteredContacts = (contactsData as Contact[]).filter(c => c.type === 'Customer');
                console.log('Filtered contacts:', filteredContacts);
                setContacts(filteredContacts);
                setProducts(productsData);
                setCompanyProfile(companyData);
                setPreferences(prefsData);

                if (invoiceId) {
                    const invoiceData = await apiService.getInvoiceById(invoiceId) as Invoice;
                    if (invoiceData) {
                        setInvoice({
                            ...invoiceData,
                            tax: invoiceData.tax || 0,
                            total: invoiceData.total || 0,
                            comments: invoiceData.comments || '',
                            items: invoiceData.items || []
                        });
                    }
                }
            } catch (error) {
                console.error('Failed to load data:', error);
            }
        };

        loadData();
    }, [invoiceId]);

    useEffect(() => {
        if (preferences) {
            const subtotal = invoice.items?.reduce((sum, item) => sum + item.total, 0) || 0;
            const tax = subtotal * (preferences.defaultTaxRate / 100);
            const total = subtotal + tax;
            setInvoice(prev => ({ ...prev, subtotal, tax, total }));
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
            item.total = item.quantity * item.unitPrice;
        }
        
        newItems[index] = item;
        setInvoice(prev => ({ ...prev, items: newItems }));
    };
    
    const handleSuggestionClick = (index: number, product: ProductOrService) => {
        const newItems = [...(invoice.items || [])];
        const item = { ...newItems[index] };
        item.description = product.name;
        item.unitPrice = product.price || product.unitPrice || 0;
        item.total = item.quantity * item.unitPrice;
        newItems[index] = item;
        setInvoice(prev => ({ ...prev, items: newItems }));
        setSuggestions([]);
        setActiveSuggestionBox(null);
    };


    const addItem = () => {
        const newItem: InvoiceItem = {
            id: `${Date.now()}`,
            description: '',
            quantity: 1,
            unitPrice: 0,
            total: 0
        };
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
        try {
            const invoiceData = {
                contact_id: invoice.contact.id,
                issue_date: invoice.issueDate,
                due_date: invoice.dueDate,
                subtotal: invoice.subtotal,
                tax: invoice.tax,
                total: invoice.total,
                comments: invoice.comments,
                items: invoice.items?.map(item => ({
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    total: item.total
                }))
            };

            if (invoiceId) {
                await apiService.updateInvoice(invoiceId, invoiceData);
            } else {
                await apiService.createInvoice(invoiceData);
            }
            eventBus.emit('dataChanged');
            navigate('/sales/invoices');
        } catch (error) {
            console.error('Failed to save invoice:', error);
            alert('Failed to save invoice. Please try again.');
        }
    };

    const handleExportPdf = () => {
        setIsPrintPreviewOpen(true);
    };
    
    const confirmAndPrint = () => {
        setIsPrintPreviewOpen(false);
        // A short timeout to allow modal to close before print dialog opens
        setTimeout(() => {
            window.print();
        }, 100);
    };

    const handleSendWhatsApp = () => {
        if (!invoice.contact?.phone) {
            alert('This customer does not have a phone number on file.');
            return;
        }
        if (!invoice.contact || !invoice.invoiceNumber || !invoice.total) {
            alert('Invoice details are incomplete.');
            return;
        }

        const template = preferences.whatsappMessageTemplate || 'Dear [CustomerName], here is invoice #[InvoiceNumber] for [TotalAmount].';
        const message = template
            .replace(/\[CustomerName\]/g, invoice.contact.name)
            .replace(/\[InvoiceNumber\]/g, invoice.invoiceNumber)
            .replace(/\[TotalAmount\]/g, formatCurrency(invoice.total))
            .replace(/\[Your Name \/ Company Name\]/g, companyProfile?.name || 'Your Company')
            .replace(/\[Contact Number\]/g, companyProfile?.phone || 'Your Phone');
    
        setWhatsAppMessage(message);
        setIsWhatsAppPreviewOpen(true);
    };

    const confirmAndSendWhatsApp = () => {
        if (!invoice.contact?.phone) return;
        const whatsappUrl = `https://wa.me/${invoice.contact.phone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsAppMessage)}`;
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        setIsWhatsAppPreviewOpen(false);
    };

    return (
        <>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-6 print:hidden">
                <div className="flex justify-between items-start">
                    <h1 className="text-2xl font-bold text-dark dark:text-light">{invoiceId ? 'Edit Invoice' : 'New Invoice'}</h1>
                    <div className="flex items-center space-x-2">
                        {invoiceId && invoice.status !== 'Paid' && (
                            <button onClick={() => setIsPaymentModalOpen(true)} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-700">
                                <DollarSign size={18} className="mr-2"/> Record Payment
                            </button>
                        )}
                        {invoiceId && (
                            <>
                                <button onClick={handleExportPdf} className="flex items-center bg-gray-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-700">
                                    <Printer size={18} className="mr-2" /> Export as PDF
                                </button>
                                <button onClick={handleSendWhatsApp} className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-600">
                                    <MessageSquare size={18} className="mr-2" /> Send via WhatsApp
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Header section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer</label>
                        <select
                            value={invoice.contact?.id || ''}
                            onChange={e => setInvoice(prev => ({ ...prev, contact: contacts.find(c => c.id === e.target.value) }))}
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
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Issue Date</label>
                        <input type="date" value={invoice.issueDate} onChange={e => setInvoice(p => ({...p, issueDate: e.target.value}))} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</label>
                        <input type="date" value={invoice.dueDate} onChange={e => setInvoice(p => ({...p, dueDate: e.target.value}))} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                </div>

                {/* Items Table */}
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
                                                        {p.name} - <span className="text-xs text-gray-500 dark:text-gray-400">{formatCurrency(p.price || p.unitPrice || 0)}</span>
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
                
                {/* Comments and Totals Section */}
                <div className="flex justify-between items-start pt-6 border-t dark:border-gray-700 mt-6">
                    <div className="w-1/2 pr-8">
                        <label htmlFor="comments" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Comments / Notes</label>
                        <textarea
                            id="comments"
                            name="comments"
                            rows={4}
                            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            value={invoice.comments || ''}
                            onChange={e => setInvoice(prev => ({ ...prev, comments: e.target.value }))}
                            placeholder="e.g., Payment instructions, terms of service, or a simple thank you note."
                        />
                    </div>
                    <div className="w-full max-w-xs space-y-2">
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                            <span className="font-mono dark:text-white">{formatCurrency(invoice.subtotal || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Tax ({preferences?.defaultTaxRate || 0}%):</span>
                            <span className="font-mono dark:text-white">{formatCurrency(invoice.tax || 0)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg border-t pt-2 border-gray-300 dark:border-gray-600">
                            <span className="dark:text-white">Total:</span>
                            <span className="font-mono dark:text-white">{formatCurrency(invoice.total || 0)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-6">
                    <button onClick={handleSave} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg shadow-md hover:bg-primary/90">
                        <Save size={18} className="mr-2" /> Save Invoice
                    </button>
                </div>

                {isPaymentModalOpen && invoice.id && (
                    <PaymentModal invoice={invoice as Invoice} onClose={() => setIsPaymentModalOpen(false)} />
                )}
            </div>

            {isWhatsAppPreviewOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg relative animate-fade-in-up">
                        <button onClick={() => setIsWhatsAppPreviewOpen(false)} className="absolute top-4 right-4 text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"><X size={24} /></button>
                        <h2 className="text-2xl font-bold mb-4 dark:text-white">WhatsApp Message Preview</h2>
                        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 border dark:border-gray-600">
                            {whatsAppMessage}
                        </div>
                        <div className="pt-6 flex justify-end space-x-3">
                            <button type="button" onClick={() => setIsWhatsAppPreviewOpen(false)} className="bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                            <button onClick={confirmAndSendWhatsApp} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center">
                                <MessageSquare size={16} className="mr-2"/> Send
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {isPrintPreviewOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 p-4 print:hidden flex items-center justify-center">
                    <div className="bg-gray-100 dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-5xl flex flex-col animate-fade-in-up" style={{height: '90vh'}}>
                        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800 rounded-t-lg">
                            <h2 className="text-2xl font-bold dark:text-white">Invoice Preview</h2>
                            <button onClick={() => setIsPrintPreviewOpen(false)} className="text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"><X size={24} /></button>
                        </div>
                        <div className="p-8 overflow-y-auto flex-grow">
                             <div className="mx-auto bg-white shadow-lg">
                                {companyProfile && <PrintableInvoice invoice={invoice} companyProfile={companyProfile} taxRate={preferences?.defaultTaxRate || 0} />}
                             </div>
                        </div>
                        <div className="p-4 border-t dark:border-gray-700 flex justify-end space-x-3 flex-shrink-0 bg-white dark:bg-gray-800 rounded-b-lg">
                            <button type="button" onClick={() => setIsPrintPreviewOpen(false)} className="bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                            <button onClick={confirmAndPrint} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 flex items-center">
                                <Printer size={16} className="mr-2"/> Confirm & Print
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div id="printable-invoice" className="hidden print:block">
                {companyProfile && <PrintableInvoice invoice={invoice} companyProfile={companyProfile} taxRate={preferences?.defaultTaxRate || 0} />}
            </div>
        </>
    );
};

export default InvoiceDetail;