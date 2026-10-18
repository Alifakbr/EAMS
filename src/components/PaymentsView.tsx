import React, { useState } from 'react';
import { Payment, Customer, Invoice, PaymentMethod } from '../types/index.ts';
import { api } from '../services/api.ts';
<<<<<<< HEAD
import { formatRupiahAmount } from '../shared/currency.tsx';
=======
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
import {
  Banknote,
  Plus,
  Printer,
  X,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Building,
} from 'lucide-react';

interface PaymentsViewProps {
  payments: Payment[];
  customers: Customer[];
  invoices: Invoice[];
  onRefresh: () => void;
  preselectedInvoiceId?: string;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  payments,
  customers,
  invoices,
  onRefresh,
  preselectedInvoiceId,
}) => {
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedPreviewPayment, setSelectedPreviewPayment] = useState<Payment | null>(null);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [paymentAmount, setPaymentAmount] = useState('10000');
  const [method, setMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Invoice allocations: record of invoiceId -> allocated amount
  const [allocations, setAllocations] = useState<Record<string, number>>({});

  // When customer changes, clear allocations
  const openInvoicesForCustomer = invoices.filter(
    (inv) => inv.customerId === selectedCustomerId && inv.outstandingBalance > 0 && inv.status !== 'CANCELLED'
  );

  const handleOpenRecordModal = () => {
    if (preselectedInvoiceId) {
      const inv = invoices.find((i) => i.id === preselectedInvoiceId);
      if (inv) {
        setSelectedCustomerId(inv.customerId);
        setPaymentAmount(String(inv.outstandingBalance));
        setAllocations({ [inv.id]: inv.outstandingBalance });
      }
    }
    setShowRecordModal(true);
  };

  const handleAllocationChange = (invId: string, amount: number) => {
    setAllocations({
      ...allocations,
      [invId]: amount,
    });
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid positive payment amount.');
      return;
    }

    try {
      const allocationList = Object.entries(allocations)
        .filter(([_, amt]) => amt > 0)
        .map(([invoiceId, allocatedAmount]) => ({
          invoiceId,
          allocatedAmount,
        }));

      await api.createPayment({
        customerId: selectedCustomerId,
        amount,
        method,
        referenceNumber: referenceNumber || `REF-CHASE-${Date.now().toString().slice(-6)}`,
        paymentDate,
        allocations: allocationList,
        notes,
      });

      setShowRecordModal(false);
      setAllocations({});
      alert('Payment confirmed! Ledger updated and invoice balances reduced.');
      onRefresh();
    } catch (err: any) {
      alert(`Payment recording failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 border border-slate-200 rounded-md">
        <div className="flex items-center gap-2">
          <Banknote className="w-5 h-5 text-slate-700" />
          <h2 className="text-base font-bold text-slate-900">Payments &amp; Collections Ledger</h2>
          <span className="text-xs text-slate-400">({payments.length} transactions)</span>
        </div>

        <button
          onClick={handleOpenRecordModal}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
        >
          <Plus className="w-4 h-4" />
          Record Customer Payment
        </button>
      </div>

      {/* Payments Table */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-4">Payment #</th>
                <th className="py-2.5 px-4">Customer</th>
                <th className="py-2.5 px-4">Payment Date</th>
                <th className="py-2.5 px-4">Method &amp; Reference</th>
                <th className="py-2.5 px-4">Allocated Invoices</th>
                <th className="py-2.5 px-4 text-right">Amount Received</th>
                <th className="py-2.5 px-4 text-right">Unallocated</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {payments.map((pmt) => (
                <tr key={pmt.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    <div>{pmt.paymentNumber}</div>
                    <div className="text-[10px] text-slate-400 font-sans">{pmt.receiptNumber}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{pmt.customerName}</div>
                    <div className="text-[11px] text-slate-500">By: {pmt.recordedBy}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{pmt.paymentDate}</td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-800">{pmt.method.replace('_', ' ')}</div>
                    <div className="font-mono text-[10px] text-slate-400">{pmt.referenceNumber}</div>
                  </td>
                  <td className="py-3 px-4">
                    {pmt.allocations.length > 0 ? (
                      pmt.allocations.map((a, idx) => (
                        <div key={idx} className="font-mono text-[11px] text-slate-700">
<<<<<<< HEAD
                          {a.invoiceNumber}: <span className="font-semibold">{formatRupiahAmount(a.allocatedAmount)}</span>
=======
                          {a.invoiceNumber}: <span className="font-semibold">${a.allocatedAmount.toFixed(2)}</span>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                        </div>
                      ))
                    ) : (
                      <span className="text-slate-400 italic">No direct allocation</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono-numbers font-bold text-emerald-700">
<<<<<<< HEAD
                    {formatRupiahAmount(pmt.amount)}
=======
                    ${pmt.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  </td>
                  <td className="py-3 px-4 text-right font-mono-numbers">
                    {pmt.unallocatedAmount > 0 ? (
                      <span className="font-semibold text-amber-700">
<<<<<<< HEAD
                        {formatRupiahAmount(pmt.unallocatedAmount)}
                      </span>
                    ) : (
                      <span className="text-slate-400">Rp0</span>
=======
                        ${pmt.unallocatedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    ) : (
                      <span className="text-slate-400">$0.00</span>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {pmt.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedPreviewPayment(pmt)}
                      className="px-2 py-1 text-[11px] font-medium border border-slate-300 text-slate-700 rounded hover:bg-slate-50"
                    >
                      Receipt
                    </button>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No payment transactions recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Payment Receipt Modal */}
      {selectedPreviewPayment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-300 max-w-xl w-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 no-print">
              <span className="text-sm font-bold text-slate-900">Official Payment Receipt</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Receipt
                </button>
                <button
                  onClick={() => setSelectedPreviewPayment(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6 text-xs text-slate-800">
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <h1 className="text-lg font-bold text-slate-900">Apex Industrial Solutions Corp.</h1>
                  <p className="text-slate-500 text-[11px]">Treasury &amp; Financial Operations</p>
                </div>
                <div className="text-right font-mono">
                  <div className="text-sm font-bold text-slate-900">PAYMENT RECEIPT</div>
                  <div className="font-bold text-slate-800">{selectedPreviewPayment.receiptNumber}</div>
                  <div className="text-slate-500 text-[11px]">{selectedPreviewPayment.paymentDate}</div>
                </div>
              </div>

              <div className="bg-emerald-50/50 p-4 rounded border border-emerald-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Confirmed Payment</span>
                  <div className="text-2xl font-bold font-mono-numbers text-emerald-700 mt-1">
<<<<<<< HEAD
                    {formatRupiahAmount(selectedPreviewPayment.amount)}
=======
                    ${selectedPreviewPayment.amount.toFixed(2)}
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="font-semibold text-slate-800">{selectedPreviewPayment.method.replace('_', ' ')}</div>
                  <div className="font-mono text-slate-500 text-[11px]">Ref: {selectedPreviewPayment.referenceNumber}</div>
                  <div className="text-emerald-700 font-bold mt-1">Status: CONFIRMED</div>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Customer Remitter</span>
                <div className="font-bold text-slate-900 text-sm">{selectedPreviewPayment.customerName}</div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
                  Invoice Settlement Allocations
                </h4>
                <table className="w-full text-left text-xs border border-slate-200 rounded">
                  <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-3">Invoice #</th>
                      <th className="py-2 px-3 text-right">Settled Allocation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {selectedPreviewPayment.allocations.map((a, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-semibold">{a.invoiceNumber}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">
<<<<<<< HEAD
                          {formatRupiahAmount(a.allocatedAmount)}
=======
                          ${a.allocatedAmount.toFixed(2)}
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                        </td>
                      </tr>
                    ))}
                    {selectedPreviewPayment.allocations.length === 0 && (
                      <tr>
                        <td colSpan={2} className="py-2 px-3 text-slate-400 italic font-sans">
                          Payment held as unallocated account credit.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-between items-end text-[11px] text-slate-500">
                <div>
                  <div>Recorded by: <span className="font-medium text-slate-700">{selectedPreviewPayment.recordedBy}</span></div>
                  <div>Audit Timestamp: <span className="font-mono">{selectedPreviewPayment.paymentDate}</span></div>
                </div>
                <div className="font-medium text-emerald-700">Official Electronic Receipt</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Record Customer Payment</h3>
              <button
                onClick={() => setShowRecordModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Select Customer Account *</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => {
                    setSelectedCustomerId(e.target.value);
                    setAllocations({});
                  }}
                  className="w-full p-2 border border-slate-300 rounded outline-none"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
<<<<<<< HEAD
                      {c.name} (Outstanding: {formatRupiahAmount(c.outstandingBalance)})
=======
                      {c.name} (Outstanding: ${c.outstandingBalance.toFixed(2)})
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
<<<<<<< HEAD
                  <label className="block text-slate-600 font-semibold mb-1">Total Payment Received (IDR) *</label>
=======
                  <label className="block text-slate-600 font-semibold mb-1">Total Payment Received ($) *</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-mono outline-none text-sm font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Payment Method *</label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                    className="w-full p-2 border border-slate-300 rounded outline-none"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer (ACH / Wire)</option>
                    <option value="CARD">Credit / Debit Card</option>
                    <option value="CHECK">Certified Bank Check</option>
                    <option value="CASH">Cash / Physical Settlement</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Reference / Transaction ID</label>
                  <input
                    type="text"
                    placeholder="e.g. WIRE-CHASE-889104"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded outline-none"
                  />
                </div>
              </div>

              {/* Multi-Invoice Allocation Section */}
              <div className="border border-slate-200 rounded p-3 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                    Allocate Payment to Open Invoices
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    {openInvoicesForCustomer.length} open invoices
                  </span>
                </div>

                {openInvoicesForCustomer.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {openInvoicesForCustomer.map((inv) => (
                      <div key={inv.id} className="p-2.5 bg-white border border-slate-200 rounded flex items-center justify-between">
                        <div>
                          <div className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</div>
                          <div className="text-[10px] text-slate-500">
<<<<<<< HEAD
                            Due: {inv.dueDate} · Balance Due: <span className="font-mono font-semibold text-amber-700">{formatRupiahAmount(inv.outstandingBalance)}</span>
=======
                            Due: {inv.dueDate} · Balance Due: <span className="font-mono font-semibold text-amber-700">${inv.outstandingBalance.toFixed(2)}</span>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
<<<<<<< HEAD
                          <span className="text-slate-400 text-[11px]">Rp</span>
=======
                          <span className="text-slate-400 text-[11px]">$</span>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                          <input
                            type="number"
                            step="0.01"
                            max={inv.outstandingBalance}
                            placeholder="0.00"
                            value={allocations[inv.id] || ''}
                            onChange={(e) => handleAllocationChange(inv.id, parseFloat(e.target.value) || 0)}
                            className="w-24 p-1 border border-slate-300 rounded font-mono text-right text-xs outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleAllocationChange(inv.id, inv.outstandingBalance)}
                            className="text-[10px] font-semibold text-blue-700 hover:text-blue-900 border border-blue-200 px-1.5 py-1 rounded"
                          >
                            Pay Full
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No open invoices for this customer. Payment will be credited as unallocated deposit.</p>
                )}
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Notes / Audit Remarks</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Remittance details, wire advice notes..."
                  className="w-full p-2 border border-slate-300 rounded outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowRecordModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded font-semibold hover:bg-emerald-700"
                >
                  Confirm &amp; Post Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
