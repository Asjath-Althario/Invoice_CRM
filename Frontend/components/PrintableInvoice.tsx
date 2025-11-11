import React from 'react';
import type { Invoice, CompanyProfile, Preferences } from '../types';
import { formatCurrency } from '../utils/formatting';

interface PrintableInvoiceProps {
  invoice: Partial<Invoice>;
  companyProfile: CompanyProfile;
  taxRate: number;
  preferences?: Preferences;
}

const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({ invoice, companyProfile, taxRate, preferences }) => {
  if (!invoice || !invoice.contact || !invoice.items) {
    return null;
  }

  const {
    invoiceNumber,
    contact,
    issueDate,
    dueDate,
    items,
    subtotal = 0,
    tax = 0,
    total = 0,
    comments,
  } = invoice;

  return (
    <div className="p-8 font-sans text-gray-900 bg-white" style={{ width: '210mm', minHeight: '297mm' }}>
      <header className="flex justify-between items-start pb-6 border-b-2 border-gray-200">
        <div className="w-1/2">
          {companyProfile.logoUrl && <img src={companyProfile.logoUrl} alt="Company Logo" className="h-16 w-auto mb-4" />}
          <h1 className="text-2xl font-bold text-gray-800">{companyProfile.name}</h1>
          <p className="text-sm text-gray-600 whitespace-pre-line">{companyProfile.address}</p>
          <p className="text-sm text-gray-600">{companyProfile.email}</p>
          <p className="text-sm text-gray-600">{companyProfile.phone}</p>
        </div>
        <div className="w-1/2 text-right">
          <h2 className="text-4xl font-bold uppercase text-gray-700">Invoice</h2>
          <p className="text-sm text-gray-500 mt-2">Invoice #: <span className="font-semibold">{invoiceNumber}</span></p>
          <p className="text-sm text-gray-500">Date Issued: <span className="font-semibold">{issueDate}</span></p>
          <p className="text-sm text-gray-500">Date Due: <span className="font-semibold">{dueDate}</span></p>
        </div>
      </header>

      <section className="mt-8">
        <div className="flex justify-between">
          <div>
            <h3 className="text-md font-semibold text-gray-600">Bill To:</h3>
            <p className="font-bold text-gray-800">{contact.name}</p>
            {contact.trn && <p className="text-sm text-gray-600 font-semibold">TRN: {contact.trn}</p>}
            <p className="text-sm text-gray-600">{contact.address}</p>
            <p className="text-sm text-gray-600">{contact.email}</p>
            <p className="text-sm text-gray-600">{contact.phone}</p>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-sm font-semibold uppercase text-gray-600">Description</th>
              <th className="p-3 text-sm font-semibold uppercase text-gray-600 text-right w-32">Unit Price</th>
              <th className="p-3 text-sm font-semibold uppercase text-gray-600 text-right w-32">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="p-3 text-sm">{item.description}</td>
                <td className="p-3 text-sm text-right">{formatCurrency(item.unitPrice)}</td>
                <td className="p-3 text-sm text-right">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      
      <section className="mt-8 flex justify-end">
        <div className="w-full max-w-sm">
          <div className="flex justify-between py-2">
            <span className="text-sm text-gray-600">Subtotal</span>
            <span className="text-sm font-mono">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm text-gray-600">Tax ({taxRate}%)</span>
            <span className="text-sm font-mono">{formatCurrency(tax)}</span>
          </div>
          <div className="flex justify-between py-2 mt-2 border-t-2 border-gray-200">
            <span className="text-lg font-bold text-gray-800">Total</span>
            <span className="text-lg font-bold font-mono">{formatCurrency(total)}</span>
          </div>
        </div>
      </section>

      {/* Terms & Conditions */}
      <section className="mt-10">
        <h3 className="text-md font-semibold text-gray-700 mb-2">Terms & Conditions</h3>
        {preferences?.invoiceTerms ? (
          <div className="text-xs whitespace-pre-line leading-relaxed text-gray-600 border border-gray-200 rounded p-3 bg-gray-50">
            {preferences.invoiceTerms}
          </div>
        ) : (
          <ul className="text-xs leading-relaxed text-gray-600 list-disc pl-5 space-y-1">
            <li>Payment due within 30 days unless otherwise agreed in writing.</li>
            <li>Late payments may incur a service charge of 1.5% per month.</li>
            <li>Please quote the invoice number on all remittances.</li>
            <li>Goods/services remain the property of {companyProfile.name} until fully paid.</li>
            <li>Discrepancies must be reported within 7 days of receipt.</li>
          </ul>
        )}
      </section>

      {comments && (
        <section className="mt-8">
          <h3 className="text-md font-semibold text-gray-600">Comments</h3>
          <p className="text-sm text-gray-500 mt-1">{comments}</p>
        </section>
      )}

      <footer className="mt-12 pt-6 border-t-2 border-gray-200 text-center text-sm text-gray-500">
        <p>Thank you for your business!</p>
      </footer>
    </div>
  );
};

export default PrintableInvoice;