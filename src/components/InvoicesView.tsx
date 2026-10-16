import React, { useState } from 'react';
import { Invoice, InvoiceStatus, Customer } from '../types/index.ts';
import { api } from '../services/api.ts';
import {
  CreditCard,
  Plus,
  Printer,
  X,
  DollarSign,
  AlertCircle,
  FileMinus,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Download,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';

interface InvoicesViewProps {
  invoices: Invoice[];
  customers: Customer[];
  onRefresh: () => void;
  onNavigateToPayment?: (invoiceId: string) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  invoices,
  customers,
  onRefresh,
  onNavigateToPayment,
}) => {
  const [selectedPreviewInvoice, setSelectedPreviewInvoice] = useState<Invoice | null>(null);
  const [creditNoteInvoice, setCreditNoteInvoice] = useState<Invoice | null>(null);
  const [creditReason, setCreditReason] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = invoices.filter((i) => {
    return statusFilter === 'ALL' || i.status === statusFilter;
  });

  const handleIssueInvoice = async (invoice: Invoice) => {
    try {
      await api.issueInvoice(invoice.id);
      alert(`Invoice ${invoice.invoiceNumber} has been officially issued! Customer ledger balance updated.`);
      onRefresh();
    } catch (err: any) {
      alert(`Failed to issue invoice: ${err.message}`);
    }
  };

  const handleCreateCreditNote = async () => {
    if (!creditNoteInvoice || !creditReason.trim()) {
      alert('Credit note reason is mandatory.');
      return;
    }

    try {
      await api.createCreditNote(creditNoteInvoice.id, {
        reason: creditReason,
        creditAmount: creditAmount ? parseFloat(creditAmount) : undefined,
      });

      alert('Credit Note successfully issued and applied to invoice balance.');
      setCreditNoteInvoice(null);
      setCreditReason('');
      setCreditAmount('');
      onRefresh();
    } catch (err: any) {
      alert(`Credit note creation error: ${err.message}`);
    }
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'PAID':
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">PAID</span>;
      case 'PARTIALLY_PAID':
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">PARTIALLY PAID</span>;
      case 'ISSUED':
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">ISSUED (OPEN)</span>;
      case 'OVERDUE':
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">OVERDUE</span>;
      case 'DRAFT':
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">DRAFT</span>;
      case 'CREDITED':
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">CREDITED</span>;
      default:
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">{status}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 border border-slate-200 rounded-md">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-slate-700" />
          <h2 className="text-base font-bold text-slate-900">Commercial Invoicing &amp; Billing</h2>
          <span className="text-xs text-slate-400">({invoices.length} billing documents)</span>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-1.5 px-2.5 text-xs border border-slate-200 rounded bg-white text-slate-700 outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Drafts</option>
            <option value="ISSUED">Issued (Open)</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PAID">Paid</option>
            <option value="CREDITED">Credited</option>
          </select>

          <button
            type="button"
            onClick={() => {
              const filename = `Apex_Invoices_Report_${new Date().toISOString().slice(0, 10)}.xls`;
              const rows = filtered
                .map(
                  (inv) => `
                <tr>
                  <td><strong>${inv.invoiceNumber}</strong></td>
                  <td>${inv.type}</td>
                  <td>${inv.customerName}</td>
                  <td>${inv.issueDate}</td>
                  <td>${inv.dueDate}</td>
                  <td>$${inv.grandTotal.toFixed(2)}</td>
                  <td>$${inv.paidAmount.toFixed(2)}</td>
                  <td>$${inv.outstandingBalance.toFixed(2)}</td>
                  <td>${inv.status}</td>
                </tr>`
                )
                .join('');
              const content = `
                <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
                  <head><meta charset="utf-8"/></head>
                  <body>
                    <h2>APEX COMMERCIAL INVOICING &amp; BILLING REPORT</h2>
                    <table border="1">
                      <tr style="background:#0f172a; color:#fff; font-weight:bold;">
                        <th>Invoice #</th><th>Type</th><th>Customer</th><th>Issue Date</th><th>Due Date</th>
                        <th>Grand Total</th><th>Paid Amount</th><th>Balance Due</th><th>Status</th>
                      </tr>
                      ${rows}
                    </table>
                  </body>
                </html>
              `;
              const blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = filename;
              link.click();
              URL.revokeObjectURL(url);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded shadow-xs cursor-pointer"
            title="Download Invoices to Excel"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Download Excel</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded shadow-xs cursor-pointer"
            title="Print Invoices list to PDF"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print PDF</span>
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-4">Invoice # / Type</th>
                <th className="py-2.5 px-4">Customer</th>
                <th className="py-2.5 px-4">Issue Date</th>
                <th className="py-2.5 px-4">Due Date</th>
                <th className="py-2.5 px-4 text-right">Grand Total</th>
                <th className="py-2.5 px-4 text-right">Settled Amount</th>
                <th className="py-2.5 px-4 text-right">Balance Due</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((inv) => {
                const isDraft = inv.status === 'DRAFT' || inv.status === 'PENDING_APPROVAL';
                const canCredit = inv.status === 'ISSUED' || inv.status === 'PARTIALLY_PAID';
                const canPay = (inv.status === 'ISSUED' || inv.status === 'PARTIALLY_PAID') && inv.outstandingBalance > 0;

                return (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono">
                      <button
                        type="button"
                        onClick={() => setSelectedPreviewInvoice(inv)}
                        className="text-left font-mono font-bold text-indigo-700 hover:text-indigo-900 hover:underline cursor-pointer flex items-center gap-1"
                        title="Klik untuk membuka view data Faktur Tagihan resmi"
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>{inv.invoiceNumber}</span>
                      </button>
                      <div className="text-[10px] text-slate-500 font-sans uppercase font-medium">
                        {inv.type.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{inv.customerName}</div>
                      <div className="text-[11px] font-mono text-slate-400">{inv.customerTaxId}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{inv.issueDate}</td>
                    <td className="py-3 px-4 text-slate-700 font-mono text-[11px]">{inv.dueDate}</td>
                    <td className="py-3 px-4 text-right font-mono-numbers font-medium text-slate-800">
                      ${inv.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-numbers text-emerald-600">
                      ${inv.paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-numbers">
                      <span className={`font-bold ${inv.outstandingBalance > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                        ${inv.outstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">{getStatusBadge(inv.status)}</td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedPreviewInvoice(inv)}
                        className="px-2 py-1 text-[11px] font-medium border border-slate-300 text-slate-700 rounded hover:bg-slate-50"
                      >
                        PDF View
                      </button>

                      {isDraft && (
                        <button
                          onClick={() => handleIssueInvoice(inv)}
                          className="px-2 py-1 text-[11px] font-semibold bg-slate-900 text-white rounded hover:bg-slate-800"
                        >
                          Issue
                        </button>
                      )}

                      {canPay && (
                        <button
                          onClick={() => onNavigateToPayment && onNavigateToPayment(inv.id)}
                          className="px-2 py-1 text-[11px] font-semibold bg-emerald-600 text-white rounded hover:bg-emerald-700"
                        >
                          Receive $
                        </button>
                      )}

                      {canCredit && (
                        <button
                          onClick={() => {
                            setCreditNoteInvoice(inv);
                            setCreditAmount(String(inv.outstandingBalance));
                          }}
                          className="px-2 py-1 text-[11px] text-purple-700 hover:text-purple-900 font-medium"
                        >
                          Credit Note
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No invoices matching filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Invoice PDF Document Modal */}
      {selectedPreviewInvoice && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-300 max-w-3xl w-full max-h-[95vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 no-print">
              <span className="text-sm font-bold text-slate-900">Commercial Tax Invoice</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / Save PDF
                </button>
                <button
                  onClick={() => setSelectedPreviewInvoice(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto space-y-6 text-xs text-slate-800">
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900">Apex Industrial Solutions Corp.</h1>
                  <p className="text-slate-500 text-[11px] mt-0.5">Commercial Asset Management &amp; Equipment Leasing</p>
                  <p className="text-slate-500 text-[11px]">4250 Innovation Parkway, Suite 800, Dallas, TX 75201</p>
                  <p className="text-slate-500 text-[11px]">Tax ID: US-TX-883920194</p>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold text-slate-900 uppercase font-mono">
                    {selectedPreviewInvoice.type.replace('_', ' ')} INVOICE
                  </div>
                  <div className="font-mono font-bold text-slate-800 mt-1">{selectedPreviewInvoice.invoiceNumber}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">Date Issued: {selectedPreviewInvoice.issueDate}</div>
                  <div className="text-rose-700 font-semibold text-[11px]">Due Date: {selectedPreviewInvoice.dueDate}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Bill To Client</span>
                  <div className="font-bold text-slate-900 text-sm">{selectedPreviewInvoice.customerName}</div>
                  <div className="text-slate-600 mt-0.5">Tax Registration / EIN: {selectedPreviewInvoice.customerTaxId}</div>
                  <div className="text-slate-500 text-[11px]">Payment Terms: Net {selectedPreviewInvoice.paymentTermsDays} Days</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Invoice Status &amp; Settlement</span>
                  <div className="mt-1">{getStatusBadge(selectedPreviewInvoice.status)}</div>
                  <div className="mt-2 text-slate-600">
                    Paid to Date: <span className="font-mono font-bold text-emerald-700">${selectedPreviewInvoice.paidAmount.toFixed(2)}</span>
                  </div>
                  <div className="text-slate-900 font-bold">
                    Balance Due: <span className="font-mono">${selectedPreviewInvoice.outstandingBalance.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <table className="w-full text-left text-xs border border-slate-200 rounded">
                  <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Tax (8.25%)</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedPreviewInvoice.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-medium text-slate-900">
                          {item.description}
                          {item.assetTag && (
                            <span className="ml-2 font-mono text-[10px] bg-slate-100 text-slate-700 px-1 py-0.2 rounded">
                              {item.assetTag}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono-numbers">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-right font-mono-numbers">${item.unitPrice.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-mono-numbers text-slate-500">${item.taxAmount.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-mono-numbers font-semibold text-slate-900">
                          ${item.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono-numbers">${selectedPreviewInvoice.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedPreviewInvoice.additionalCharges > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Logistics / Additional Fees:</span>
                      <span className="font-mono-numbers">${selectedPreviewInvoice.additionalCharges.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Total Taxes:</span>
                    <span className="font-mono-numbers">${selectedPreviewInvoice.taxTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-300 text-sm font-bold text-slate-900">
                    <span>Grand Total:</span>
                    <span className="font-mono-numbers">${selectedPreviewInvoice.grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-1 text-xs text-amber-800 font-bold">
                    <span>Remaining Balance:</span>
                    <span className="font-mono-numbers">${selectedPreviewInvoice.outstandingBalance.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-500 space-y-2">
                <span className="font-semibold text-slate-700 block">Remittance &amp; Wire Instructions:</span>
                <p>
                  Apex Industrial Solutions Corp. · JPMorgan Chase Bank N.A. · Routing: 111000614 · Account: 849201948 · Swift: CHASUS33
                </p>
                <p className="italic text-slate-400">Please quote invoice number on bank transfer reference.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Credit Note Modal */}
      {creditNoteInvoice && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-5 text-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              Issue Official Credit Note against {creditNoteInvoice.invoiceNumber}
            </h3>
            <p className="text-slate-600">
              Per strict corporate accounting policy, issued invoices cannot be silently edited. Any price corrections, returns, or billing adjustments require a formal credit note.
            </p>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Credit Amount ($) *</label>
              <input
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded font-mono outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Current outstanding balance on invoice: ${creditNoteInvoice.outstandingBalance.toFixed(2)}
              </span>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Mandatory Credit Reason *</label>
              <textarea
                rows={3}
                required
                value={creditReason}
                onChange={(e) => setCreditReason(e.target.value)}
                placeholder="e.g. Approved 5% commercial goodwill discount on equipment mobilization..."
                className="w-full p-2 border border-slate-300 rounded outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setCreditNoteInvoice(null)}
                className="px-3.5 py-1.5 border border-slate-300 text-slate-700 rounded hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCreditNote}
                className="px-4 py-1.5 bg-purple-700 text-white font-semibold rounded hover:bg-purple-800"
              >
                Issue Credit Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
