import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Paperclip, Folder, Trash2, HelpCircle, Info, Plus, DollarSign } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { apiService } from '../../services/api';
import type { Purchase, PurchaseLineItem, Contact } from '../../types';
import { formatCurrency } from '../../utils/formatting';
import PurchasePaymentModal from '../../components/PurchasePaymentModal';

// Helper to get default tax rate from saved preferences
const getDefaultTaxRate = (): number => {
  try {
    const raw = localStorage.getItem('zenith-preferences');
    if (raw) {
      const prefs = JSON.parse(raw);
      const rate = Number(prefs?.defaultTaxRate);
      if (!isNaN(rate)) return rate;
    }
  } catch {}
  return 10; // fallback
};

const NewPurchase: React.FC = () => {
    const { purchaseId } = useParams<{ purchaseId: string }>();
    const location = window.location; // simple access
    const readOnly = location.search.includes('mode=view');
    const navigate = useNavigate();
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [suppliers, setSuppliers] = useState<Contact[]>([]);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const isEditing = !!purchaseId;

    // Form State
    const [purchase, setPurchase] = useState<Partial<Purchase>>({
        purchaseType: 'Credit',
        date: new Date().toISOString().split('T')[0],
        dueDate: '',
        purchaseOrderNumber: '',
        currency: 'AED',
        supplier: undefined,
        lineItems: [{ id: '1', description: '', amount: 0, account: 'Expenses', vat: 0 }],
        subtotal: 0,
        vat: 0,
        total: 0,
    });
    
    useEffect(() => {
        const loadData = async () => {
            try {
                const contactsData = await apiService.getContacts();
                setSuppliers((contactsData as Contact[]).filter(c => c.type === 'Vendor'));
                if (purchaseId) {
                    const existingPurchase: any = await apiService.getPurchaseById(purchaseId);
                    if (existingPurchase) {
                        // Normalize backend field names to controlled frontend state keys
                        setPurchase(prev => ({
                            // Keep defaults from previous (initial) to avoid undefined transitions
                            ...prev,
                            id: existingPurchase.id,
                            purchaseType: existingPurchase.purchaseType || existingPurchase.purchase_type || prev.purchaseType || 'Credit',
                            date: existingPurchase.date || prev.date || new Date().toISOString().split('T')[0],
                            dueDate: existingPurchase.dueDate || existingPurchase.due_date || prev.dueDate || '',
                            purchaseOrderNumber: existingPurchase.purchaseOrderNumber || existingPurchase.purchase_order_number || prev.purchaseOrderNumber || '',
                            currency: existingPurchase.currency || prev.currency || 'AED',
                            supplier: (contactsData as Contact[]).find(c => c.id === (existingPurchase.supplier?.id || existingPurchase.supplier_id)) || prev.supplier,
                            lineItems: prev.lineItems && prev.lineItems.length ? prev.lineItems : [{ id: '1', description: '', amount: 0, account: 'Expenses', vat: 0 }],
                            subtotal: existingPurchase.subtotal ?? prev.subtotal ?? 0,
                            vat: existingPurchase.vat ?? prev.vat ?? 0,
                            total: existingPurchase.total ?? prev.total ?? 0,
                            status: existingPurchase.status || prev.status,
                        }));
                    }
                }
            } catch (error) {
                console.error('Failed to load data:', error);
            }
        };
        loadData();
    }, [purchaseId]);

    useEffect(() => {
        const subtotal = purchase.lineItems?.reduce((sum, item) => sum + item.amount, 0) || 0;
        const vat = purchase.lineItems?.reduce((sum, item) => sum + (item.amount * (item.vat / 100)), 0) || 0;
        const total = subtotal + vat;
        setPurchase(p => ({ ...p, subtotal, vat, total }));
    }, [purchase.lineItems]);
    
    const handleExtraction = async (acceptedFile: File) => {
        setIsLoading(true);
        setError(null);
        setFile(acceptedFile);
        
        try {
            const formData = new FormData();
            formData.append('receipt', acceptedFile);
            const details = await apiService.extractPurchaseDetails(formData);
            const contactsData = await apiService.getContacts();
            const foundSupplier = (contactsData as Contact[]).find(c => c.name.toLowerCase() === details.vendorName.toLowerCase());
            
            const extractedLineItems = (details.lineItems && details.lineItems.length > 0)
                ? details.lineItems.map((item, index) => ({
                    id: `line-${index}-${Date.now()}`,
                    description: item.description,
                    amount: item.total || (item.quantity * item.unitPrice),
                    account: 'Expenses',
                    vat: 0
                  }))
                : [{ id: `line-0-${Date.now()}`, description: 'Total purchase', amount: details.totalAmount || 0, account: 'Expenses', vat: 0 }];

            setPurchase(p => ({
                ...p,
                supplier: foundSupplier,
                date: details.purchaseDate || p.date,
                lineItems: extractedLineItems,
            }));

        } catch (err: any) {
            setError(err.message || 'An unknown error occurred during extraction.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            handleExtraction(acceptedFiles[0]);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/jpeg': ['.jpeg', '.jpg'],
            'image/png': ['.png'],
            'application/pdf': ['.pdf']
        },
        multiple: false,
    } as any);
    
    const handleLineChange = (id: string, field: keyof PurchaseLineItem, value: string | number) => {
        const newItems = purchase.lineItems?.map(item => item.id === id ? { ...item, [field]: value } : item);
        setPurchase(p => ({ ...p, lineItems: newItems }));
    };

    const handleToggleVat = (id: string) => {
        const defaultRate = getDefaultTaxRate();
        const newItems = (purchase.lineItems || []).map(item =>
            item.id === id ? { ...item, vat: item.vat && item.vat > 0 ? 0 : defaultRate } : item
        );
        setPurchase(p => ({ ...p, lineItems: newItems }));
    };

    const addLine = () => {
        const newItem = { id: `line-${Date.now()}`, description: '', amount: 0, account: 'Expenses', vat: 0 };
        setPurchase(p => ({ ...p, lineItems: [...(p.lineItems || []), newItem] }));
    };

    const removeLine = (id: string) => {
        const newItems = purchase.lineItems?.filter(item => item.id !== id);
        setPurchase(p => ({...p, lineItems: newItems }));
    };

    const handleSave = async (status: 'Draft' | 'Pending') => {
        if (!purchase.supplier && purchase.purchaseType === 'Credit') {
            alert('Please select a supplier for credit purchases.');
            return;
        }

        const payload: any = {
            supplier_id: purchase.supplier?.id || null,
            date: purchase.date,
            due_date: purchase.purchaseType === 'Credit' ? (purchase.dueDate || null) : null,
            subtotal: purchase.subtotal ?? 0,
            vat: purchase.vat ?? 0,
            total: purchase.total ?? 0,
            status,
            purchase_order_number: purchase.purchaseOrderNumber || null,
            purchase_type: purchase.purchaseType || 'Credit',
            currency: purchase.currency || 'AED',
            file_path: (purchase as any).file?.name || null,
        };

        try {
            if (isEditing) {
                await apiService.updatePurchase(purchaseId!, payload);
            } else {
                await apiService.createPurchase(payload);
            }
            navigate('/accounting/purchases');
        } catch (error) {
            console.error('Failed to save purchase:', error);
            alert('Failed to save purchase. Please try again.');
        }
    };
    
    const handleFieldChange = (field: keyof Purchase, value: any) => {
      setPurchase(p => ({ ...p, [field]: value }));
    };
    
    const handleSupplierChange = (supplierId: string) => {
      const selected = suppliers.find(s => s.id === supplierId);
      setPurchase(p => ({ ...p, supplier: selected }));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-dark dark:text-light">{readOnly ? 'View Purchase' : (isEditing ? 'Edit Purchase' : 'New Purchase')}</h1>
                {isEditing && !readOnly && purchase.status !== 'Paid' && (
                     <button onClick={() => setIsPaymentModalOpen(true)} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-700">
                        <DollarSign size={18} className="mr-2"/> Record Payment
                    </button>
                )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                {/* Left Column */}
                <div className="space-y-4">
                     <div {...getRootProps()} className={`relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors h-80 flex flex-col items-center justify-center ${isDragActive ? 'border-primary bg-primary/10' : 'border-purple-300 dark:border-purple-600 hover:border-primary/80'}`}>
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                                    <p>Extracting details...</p>
                                </>
                            ) : file || (purchase as Purchase).file ? (
                                <p className="font-semibold text-green-600">File Attached: {(file || (purchase as Purchase).file)?.name}</p>
                            ) : (
                                <>
                                    <Paperclip size={48} className="mb-4 text-purple-500" />
                                    <p className="font-semibold text-purple-600 dark:text-purple-400">Attach file</p>
                                    <p className="text-sm">Drag & drop or click to upload</p>
                                </>
                            )}
                        </div>
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button className="w-full flex items-center justify-center bg-white dark:bg-gray-700 border border-purple-300 dark:border-purple-600 text-purple-600 dark:text-purple-400 font-semibold px-4 py-3 rounded-lg hover:bg-purple-50 dark:hover:bg-gray-600 transition-colors">
                        <Folder size={20} className="mr-2" />
                        SELECT EXISTING DOCUMENTS
                    </button>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold dark:text-white">Purchase Type</h2>
                            <HelpCircle size={20} className="text-gray-400" />
                        </div>
                        <div className="space-y-3">
                            <label className={`flex items-center p-3 border rounded-lg cursor-pointer ${purchase.purchaseType === 'Cash' ? 'border-primary bg-primary/5' : 'dark:border-gray-600'}`}>
                                <input type="radio" name="purchaseType" value="Cash" checked={purchase.purchaseType === 'Cash'} onChange={() => handleFieldChange('purchaseType', 'Cash')} className="h-4 w-4 text-primary focus:ring-primary"/>
                                <span className="ml-3 text-sm font-medium dark:text-gray-200">Cash - This was paid immediately</span>
                                <Info size={16} className="ml-auto text-gray-400" />
                            </label>
                             <label className={`flex items-center p-3 border rounded-lg cursor-pointer ${purchase.purchaseType === 'Credit' ? 'border-primary bg-primary/5' : 'dark:border-gray-600'}`}>
                                <input type="radio" name="purchaseType" value="Credit" checked={purchase.purchaseType === 'Credit'} onChange={() => handleFieldChange('purchaseType', 'Credit')} className="h-4 w-4 text-primary focus:ring-primary"/>
                                <span className="ml-3 text-sm font-medium dark:text-gray-200">Credit - This will be paid later</span>
                                <Info size={16} className="ml-auto text-gray-400" />
                            </label>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative">
                                <label className="text-xs text-gray-500 dark:text-gray-300">Date</label>
                                <input type="date" value={purchase.date || ''} onChange={(e) => !readOnly && handleFieldChange('date', e.target.value)} disabled={readOnly} className="w-full p-2 border-b-2 bg-white dark:bg-transparent dark:border-gray-600 focus:outline-none focus:border-primary disabled:opacity-60"/>
                            </div>
                            <div className="relative">
                                <label className="text-xs text-gray-500 dark:text-gray-300">Due Date</label>
                                <input type="date" value={purchase.dueDate || ''} onChange={(e) => !readOnly && handleFieldChange('dueDate', e.target.value)} disabled={readOnly || purchase.purchaseType === 'Cash'} className="w-full p-2 border-b-2 bg-white dark:bg-transparent dark:border-gray-600 focus:outline-none focus:border-primary disabled:opacity-60"/>
                            </div>
                        </div>
                        
                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-300">Purchase Order Number</label>
                            <input 
                                type="text" 
                                value={purchase.purchaseOrderNumber || ''} 
                                onChange={(e) => !readOnly && handleFieldChange('purchaseOrderNumber', e.target.value)} 
                                disabled={readOnly}
                                className="w-full p-2 border-b-2 bg-white dark:bg-transparent dark:border-gray-600 focus:outline-none focus:border-primary disabled:opacity-60"
                            />
                        </div>

                         <div>
                             <label className="text-xs text-gray-500 dark:text-gray-300">Currency</label>
                             <select value={purchase.currency} onChange={(e) => !readOnly && handleFieldChange('currency', e.target.value as any)} disabled={readOnly} className="w-full p-2 border-b-2 bg-white dark:bg-transparent dark:border-gray-600 focus:outline-none focus:border-primary disabled:opacity-60">
                                <option value="AED">AED</option>
                                <option value="USD">USD</option>
                                 <option value="EUR">EUR</option>
                                 <option value="GBP">GBP</option>
                             </select>
                        </div>
                         <div>
                             <label className="text-xs text-gray-500 dark:text-gray-300">Supplier</label>
                             <select value={purchase.supplier?.id || ''} onChange={(e) => !readOnly && handleSupplierChange(e.target.value)} disabled={readOnly} className="w-full p-2 border-b-2 bg-white dark:bg-transparent dark:border-gray-600 focus:outline-none focus:border-primary disabled:opacity-60">
                                <option value="">Select a supplier</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                             </select>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-4">
                        {purchase.lineItems?.map((line, index) => (
                            <div key={line.id} className="space-y-3 border-b dark:border-gray-700 pb-4 last:border-b-0">
                                 <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-primary">Line #{index + 1}</h3>
                                    <button onClick={() => removeLine(line.id)} className="text-red-500 hover:text-red-700"><Trash2 size={18}/></button>
                                 </div>
                                 <div className="relative">
                                     <input type="number" placeholder="Amount" value={line.amount ?? ''} onChange={e => !readOnly && handleLineChange(line.id, 'amount', Number(e.target.value))} disabled={readOnly} className="w-full p-2 border-b-2 bg-white dark:bg-transparent dark:border-gray-600 focus:outline-none focus:border-primary disabled:opacity-60"/>
                                 </div>
                                 <div className="relative">
                                     <input type="text" placeholder="Description" value={line.description || ''} onChange={e => !readOnly && handleLineChange(line.id, 'description', e.target.value)} disabled={readOnly} className="w-full p-2 border-b-2 bg-white dark:bg-transparent dark:border-gray-600 focus:outline-none focus:border-primary disabled:opacity-60"/>
                                 </div>
                                  <div>
                                     <select value={line.account || 'Expenses'} onChange={e => !readOnly && handleLineChange(line.id, 'account', e.target.value)} disabled={readOnly} className="w-full p-2 border-b-2 bg-white dark:bg-transparent dark:border-gray-600 focus:outline-none focus:border-primary disabled:opacity-60">
                                        <option>Expenses</option>
                                        <option>Cost of Goods Sold</option>
                                        <option>Assets</option>
                                     </select>
                                </div>
                                {Number(line.vat) > 0 && (
                                  <div className="grid grid-cols-2 gap-3 items-end">
                                    <div>
                                      <label className="text-xs text-gray-500 dark:text-gray-300">VAT %</label>
                                      <input type="number" min={0} max={100} step={0.5} value={line.vat} onChange={e => !readOnly && handleLineChange(line.id, 'vat', Number(e.target.value))} disabled={readOnly} className="w-full p-2 border-b-2 bg-white dark:bg-transparent dark:border-gray-600 focus:outline-none focus:border-primary disabled:opacity-60"/>
                                    </div>
                                    <div className="text-right text-sm text-gray-600 dark:text-gray-300">
                                      VAT Amount: <span className="font-mono">{formatCurrency((line.amount || 0) * (Number(line.vat || 0)/100))}</span>
                                    </div>
                                  </div>
                                )}
                                <button type="button" onClick={() => !readOnly && handleToggleVat(line.id)} disabled={readOnly} className={`text-xs font-semibold ${readOnly ? 'text-gray-400 cursor-not-allowed' : 'text-primary'}`}>
                                  {Number(line.vat) > 0 ? 'REMOVE VAT' : 'ADD VAT'}
                                </button>
                            </div>
                        ))}
                         {!readOnly && <button onClick={addLine} className="text-primary font-bold flex items-center"><Plus size={16} className="mr-1"/> ADD LINE</button>}
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                            <span className="font-mono dark:text-white">{formatCurrency(purchase.subtotal || 0)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">VAT</span>
                            <span className="font-mono dark:text-white">{formatCurrency(purchase.vat || 0)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2 dark:border-gray-600">
                            <span className="dark:text-white">Total {purchase.currency}</span>
                            <span className="font-mono dark:text-white">{formatCurrency(purchase.total || 0)}</span>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                        {!readOnly && (
                          <>
                            <button onClick={() => handleSave('Draft')} className="bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-500">SAVE DRAFT</button>
                            <button onClick={() => handleSave('Pending')} className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90">{isEditing ? 'UPDATE' : 'CREATE'}</button>
                          </>
                        )}
                    </div>
                </div>
            </div>
            {isPaymentModalOpen && purchase.id && (
                <PurchasePaymentModal purchase={purchase as Purchase} onClose={() => setIsPaymentModalOpen(false)} />
            )}
        </div>
    );
};

export default NewPurchase;