import { exportExcelFromHtml } from '../utils/download.ts';
import React, { useState } from 'react';
import { RentalRateCalculator } from './RentalRateCalculator.tsx';
import { Quotation, Customer, Product, Asset, UserRole, RentalRateModel, CommercialTransactionType } from '../types/index.ts';
import { api } from '../services/api.ts';
import { formatRupiahAmount } from '../shared/currency.tsx';
import {
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  Printer,
  Download,
  X,
  Building2,
  Calendar,
  DollarSign,
  Truck,
  ArrowRight,
  ShieldCheck,
  Tag,
  Clock,
  Layers,
  Calculator,
  Sparkles,
  Link as LinkIcon,
} from 'lucide-react';

interface QuotationsViewProps {
  quotations: Quotation[];
  customers: Customer[];
  products: Product[];
  assets: Asset[];
  userRole?: UserRole;
  onRefresh: () => void;
  onNavigateToOrder?: (orderId: string) => void;
}

interface NewQuotationItemRow {
  productId: string;
  productName: string;
  equipmentNumber: string;
  equipmentType: string;
  rateModel: RentalRateModel;
  rentalRate: number;
  quantity: number;
  mobilizationFee: number;
  demobilizationFee: number;
  mobilizationDate: string;
  demobilizationDate: string;
  discountPercent: number;
  taxRatePercent: number;
  assignedAssetId?: string;
}

export const QuotationsView: React.FC<QuotationsViewProps> = ({
  quotations,
  customers,
  products,
  assets,
  userRole,
  onRefresh,
  onNavigateToOrder,
}) => {
  const availableAssets = assets.filter((asset) => asset.status === 'AVAILABLE');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRateCalculator, setShowRateCalculator] = useState(false);
  const [selectedPreviewQuote, setSelectedPreviewQuote] = useState<Quotation | null>(null);
  const [transactionType, setTransactionType] = useState<CommercialTransactionType>('RENTAL');

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [validDays, setValidDays] = useState('30');
  const [notes, setNotes] = useState('Heavy equipment rental quotation includes an SIO-certified operator and maintenance.');
  const [terms, setTerms] = useState(
    'Payment terms: Net 30 calendar days after invoice issuance with the equipment timesheet attached. Mobilization and demobilization costs will be charged on the first invoice.'
  );

  // Dynamic Multi-Equipment Items
  const [items, setItems] = useState<NewQuotationItemRow[]>([
    {
      productId: products[0]?.id || 'PRD-101',
      productName: products[0]?.name || 'Excavator Komatsu PC200-8',
      equipmentNumber: availableAssets[0]?.assetTag || '',
      equipmentType: availableAssets[0] ? `${availableAssets[0].category} ${availableAssets[0].model}` : 'Heavy Equipment',
      rateModel: 'REGULAR',
      rentalRate: availableAssets[0]?.monthlyRentalRate || 0,
      quantity: 1,
      mobilizationFee: 0,
      demobilizationFee: 0,
      mobilizationDate: new Date().toISOString().split('T')[0],
      demobilizationDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      discountPercent: 0,
      taxRatePercent: 11,
      assignedAssetId: availableAssets[0]?.id,
    },
  ]);

  const handleAddItem = () => {
    const nextAsset = availableAssets[items.length % Math.max(availableAssets.length, 1)] || availableAssets[0];
    setItems([
      ...items,
      {
        productId: products[0]?.id || `PRD-${Date.now()}`,
        productName: nextAsset ? nextAsset.name : 'Heavy Equipment Unit',
        equipmentNumber: nextAsset?.assetTag || '',
        equipmentType: nextAsset ? `${nextAsset.category} - ${nextAsset.model}` : 'Heavy Machinery',
        rateModel: 'REGULAR',
        rentalRate: nextAsset ? (transactionType === 'SALE' ? (nextAsset.sellPrice || nextAsset.purchaseCost) : nextAsset.monthlyRentalRate) : 0,
        quantity: 1,
        mobilizationFee: 750,
        demobilizationFee: 750,
        mobilizationDate: new Date(Date.now() + items.length * 86400000 * 2).toISOString().split('T')[0],
        demobilizationDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        discountPercent: 0,
        taxRatePercent: 11,
        assignedAssetId: nextAsset?.id,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemFieldChange = (index: number, field: keyof NewQuotationItemRow, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;

    // If equipmentNumber changed, sync asset info
    if (field === 'equipmentNumber') {
      const matched = assets.find((a) => a.assetTag === value);
      if (matched) {
        updated[index].equipmentType = `${matched.category} ${matched.model}`;
        updated[index].productName = matched.name;
        updated[index].rentalRate = transactionType === 'SALE'
          ? (matched.sellPrice || matched.purchaseCost)
          : matched.monthlyRentalRate;
        updated[index].assignedAssetId = matched.id;
      }
    }

    setItems(updated);
  };

  const handleTransactionTypeChange = (value: CommercialTransactionType) => {
    setTransactionType(value);
    setItems((current) => current.map((item) => {
      const asset = availableAssets.find((candidate) => candidate.id === item.assignedAssetId);
      return {
        ...item,
        quantity: value === 'SALE' ? 1 : item.quantity,
        rentalRate: asset
          ? (value === 'SALE' ? (asset.sellPrice || asset.purchaseCost) : asset.monthlyRentalRate)
          : item.rentalRate,
        demobilizationFee: value === 'SALE' ? 0 : item.demobilizationFee,
      };
    }));
  };

  // Calculations
  const calculatedRentalSubtotal = items.reduce((sum, item) => sum + item.quantity * item.rentalRate, 0);
  const calculatedMobTotal = items.reduce((sum, item) => sum + item.mobilizationFee, 0);
  const calculatedDemobTotal = items.reduce((sum, item) => sum + item.demobilizationFee, 0);
  const baseSubtotal = calculatedRentalSubtotal + calculatedMobTotal + calculatedDemobTotal;
  const calculatedTaxTotal = items.reduce((sum, item) => {
    const lineTotal = item.quantity * item.rentalRate + item.mobilizationFee + item.demobilizationFee;
    return sum + lineTotal * (item.taxRatePercent / 100);
  }, 0);
  const calculatedGrandTotal = baseSubtotal + calculatedTaxTotal;

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      alert('Please select a customer first.');
      return;
    }

    try {
      const validUntil = new Date(Date.now() + parseInt(validDays, 10) * 86400000).toISOString().split('T')[0];
      const payloadItems = items.map((it) => ({
        productId: it.productId,
        productName: it.productName,
        sku: it.equipmentNumber,
        productType: 'SERIALIZED',
        quantity: it.quantity,
        unitPrice: it.rentalRate,
        discountPercent: it.discountPercent,
        taxRatePercent: it.taxRatePercent,
        assignedAssetId: it.assignedAssetId,
        // Customized Heavy Equipment & Rate Specs
        equipmentNumber: it.equipmentNumber,
        equipmentType: it.equipmentType,
        rateModel: it.rateModel,
        rentalRate: it.rentalRate,
        mobilizationFee: it.mobilizationFee,
        demobilizationFee: it.demobilizationFee,
        mobilizationDate: it.mobilizationDate,
        demobilizationDate: it.demobilizationDate,
      }));

      await api.createQuotation({
        customerId: selectedCustomerId,
        transactionType,
        items: payloadItems,
        validUntil,
        notes,
        remarks: notes,
        termsAndConditions: terms,
      });

      alert('Equipment rental quotation created successfully!');
      setShowCreateModal(false);
      onRefresh();
    } catch (err: any) {
      alert(`Failed to create quotation: ${err.message}`);
    }
  };

  const handleApprove = async (quote: Quotation) => {
    try {
      await api.approveQuotation(quote.id);
      onRefresh();
    } catch (err: any) {
      alert(`Approval error: ${err.message}`);
    }
  };

  const handleAccept = async (quote: Quotation) => {
    try {
      await api.acceptQuotation(quote.id);
      onRefresh();
    } catch (err: any) {
      alert(`Acceptance error: ${err.message}`);
    }
  };

  const handleConvertToOrder = async (quote: Quotation) => {
    const poRef = prompt(
      `Enter the customer PO reference number:`,
      `PO-${quote.customerName.slice(0, 4).toUpperCase()}-${Date.now().toString().slice(-4)}`
    );
    if (!poRef) return;

    try {
      const order = await api.convertToOrder(quote.id, {
        customerPoReference: poRef,
        shippingFee: 0,
      });
      alert(
        `Quotation ${quote.quotationNumber} was successfully converted to Sales Order ${order.orderNumber}! The sales order and quotation are now linked, equipment has been allocated, and mobilization can be scheduled.`
      );
      onRefresh();
      if (onNavigateToOrder) {
        onNavigateToOrder(order.id);
      }
    } catch (err: any) {
      alert(`Failed to convert to Sales Order: ${err.message}`);
    }
  };

  return (
    <div data-print-area className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 border border-slate-200 rounded-md">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-700" />
            <h2 className="text-base font-bold text-slate-900">Rental Offers &amp; Sales Quotations</h2>
            <span className="text-xs text-slate-400 font-mono">({quotations.length} records)</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Support for multiple equipment items per quotation, different mobilization dates, regular or lump-sum rates, and sales order integration.
          </p>
        </div>

        <div className="no-print flex items-center gap-2 flex-wrap">
          <button type="button" onClick={() => setShowRateCalculator(true)} className="inline-flex items-center gap-1.5 rounded border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-800 hover:bg-indigo-100 cursor-pointer" title="Calculate standard and reference rental rates">
            <Calculator className="h-3.5 w-3.5" /> Rate Calculator
          </button>
          <button
            type="button"
            onClick={() => {
              const filename = `Apex_Quotations_Report_${new Date().toISOString().slice(0, 10)}.xls`;
              const rows = quotations
                .map(
                  (q) => `
                <tr>
                  <td><strong>${q.quotationNumber}</strong></td>
                  <td>${q.customerName}</td>
                  <td>${q.date}</td>
                  <td>${formatRupiahAmount((q as any).totalAmount || q.grandTotal || 0)}</td>
                  <td>${q.status}</td>
                  <td>${q.linkedSalesOrderNumber || '-'}</td>
                </tr>`
                )
                .join('');
              const content = `
                <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
                  <head><meta charset="utf-8"/></head>
                  <body>
                    <h2>APEX COMMERCIAL QUOTATIONS REPORT</h2>
                    <table border="1">
                      <tr style="background:#0f172a; color:#fff; font-weight:bold;">
                        <th>Quotation #</th><th>Customer</th><th>Date</th><th>Total Amount</th><th>Status</th><th>Linked SO</th>
                      </tr>
                      ${rows}
                    </table>
                  </body>
                </html>
              `;
              exportExcelFromHtml(content, filename);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded shadow-xs cursor-pointer"
            title="Download Quotations to Excel"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Download Excel</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded shadow-xs cursor-pointer"
            title="Print the quotation list or save it as a PDF"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print PDF</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            Create New Quotation
          </button>
        </div>
      </div>

      {/* Quotation Table */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-4">Quotation # &amp; Sales Order</th>
                <th className="py-2.5 px-4">Customer / Project</th>
                <th className="py-2.5 px-4">Equipment &amp; Rate (Regular / Lump Sum)</th>
                <th className="py-2.5 px-4 text-right">Mob. / Demob. Fees</th>
                <th className="py-2.5 px-4 text-right">Quotation Amount</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {quotations.map((quote) => {
                const canApprove =
                  (userRole === 'EXECUTIVE' || userRole === 'ADMIN_IT' || userRole === 'SALES_MARKETING') &&
                  quote.status === 'PENDING_APPROVAL';
                const canAccept = quote.status === 'APPROVED';
                const canConvert = quote.status === 'APPROVED' || quote.status === 'ACCEPTED';

                return (
                  <tr key={quote.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* No Quotation & Linked SO */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      <button
                        type="button"
                        onClick={() => setSelectedPreviewQuote(quote)}
                        className="text-left font-mono font-bold text-indigo-700 hover:text-indigo-900 hover:underline cursor-pointer flex items-center gap-1"
                        title="Open the official quotation document"
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>{quote.quotationNumber}</span>
                      </button>
                      <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                        Rev {quote.revision} · {quote.date}
                      </div>

                      {/* Linked SO Number Badge */}
                      {quote.linkedSalesOrderNumber ? (
                        <div
                          onClick={() => onNavigateToOrder && onNavigateToOrder(quote.convertedSalesOrderId || '')}
                          className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200 cursor-pointer hover:bg-purple-100 transition-colors"
                          title="Open the related sales order"
                        >
                          <LinkIcon className="w-3 h-3" />
                          SO: {quote.linkedSalesOrderNumber}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-sans italic">
                          Not Converted to a Sales Order
                        </span>
                      )}
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{quote.customerName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Valid Until: {quote.validUntil}
                      </div>
                    </td>

                    {/* Equipment & Rate Details */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        {quote.items.map((it, idx) => (
                          <div key={idx} className="flex flex-wrap items-center gap-1.5 text-[11px]">
                            <span className="font-mono font-bold px-1.5 py-0.2 bg-slate-100 text-slate-800 rounded">
                              {it.equipmentNumber || it.sku || `Unit ${idx + 1}`}
                            </span>
                            <span className="text-slate-800 font-medium">
                              {it.equipmentType || it.productName}
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded font-bold text-[9px] uppercase ${
                                it.rateModel === 'LUMPSUM'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}
                            >
                              {it.rateModel || 'REGULAR'}
                            </span>
                            {it.mobilizationDate && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                Mob: {it.mobilizationDate}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Mob / Demob */}
                    <td className="py-3 px-4 text-right font-mono text-[11px]">
                      <div className="text-slate-700">
                        Mobilization: {formatRupiahAmount(quote.mobilizationTotal || 0)}
                      </div>
                      <div className="text-slate-500 text-[10px]">
                        Demobilization: {formatRupiahAmount(quote.demobilizationTotal || 0)}
                      </div>
                    </td>

                    {/* Grand Total */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatRupiahAmount(quote.grandTotal)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                          quote.status === 'CONVERTED'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : quote.status === 'ACCEPTED' || quote.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : quote.status === 'PENDING_APPROVAL'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {quote.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedPreviewQuote(quote)}
                        className="px-2 py-1 text-[11px] font-medium border border-slate-200 rounded text-slate-700 hover:bg-slate-100 cursor-pointer"
                        title="View the official quotation"
                      >
                        Official PDF
                      </button>

                      {canApprove && (
                        <button
                          onClick={() => handleApprove(quote)}
                          className="px-2 py-1 text-[11px] font-semibold bg-emerald-600 text-white rounded hover:bg-emerald-700 cursor-pointer"
                        >
                          Approve
                        </button>
                      )}

                      {canAccept && (
                        <button
                          onClick={() => handleAccept(quote)}
                          className="px-2 py-1 text-[11px] font-semibold bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
                        >
                          Accept
                        </button>
                      )}

                      {canConvert && (
                        <button
                          onClick={() => handleConvertToOrder(quote)}
                          className="px-2.5 py-1 text-[11px] font-bold bg-slate-900 text-white rounded hover:bg-slate-800 cursor-pointer"
                        >
                          Konversi ke SO →
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE QUOTATION MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Create Heavy Equipment Rental Quotation
                </h3>
                <p className="text-xs text-slate-500">
                  Konfigurasikan unit alat berat, tanggal mobilisasi masing-masing, tarif regular vs lumpsum, serta biaya mob &amp; demob kustom.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuotation} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Select Customer Account *</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded outline-none"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.customerCode})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Quotation Validity (Days)</label>
                  <input
                    type="number"
                    value={validDays}
                    onChange={(e) => setValidDays(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-mono outline-none"
                  />
                </div>
              </div>

              {/* Dynamic Multiple Equipment Items Table */}
              <div className="border border-slate-200 rounded p-4 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                      Equipment, Mobilization Dates &amp; Rates
                    </h4>
                    <span className="text-[10px] text-slate-500">
                      One quotation can include multiple equipment items with different mobilization dates.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-2.5 py-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 border border-indigo-200 rounded flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Add Equipment
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                        <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-indigo-600" />
                          Unit #{index + 1}: {item.equipmentNumber} ({item.equipmentType})
                        </span>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="text-slate-400 hover:text-rose-600 text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove Equipment
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                        {/* Equipment Tag Number */}
                        <div className="sm:col-span-3">
                          <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                            Equipment (Barcode Tag) *
                          </label>
                          <select
                            value={item.equipmentNumber}
                            onChange={(e) => handleItemFieldChange(index, 'equipmentNumber', e.target.value)}
                            className="w-full p-1.5 border border-slate-300 rounded text-xs font-mono outline-none"
                          >
                            {assets.map((a) => (
                              <option key={a.id} value={a.assetTag}>
                                {a.assetTag} - {a.name.slice(0, 18)}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Equipment Type */}
                        <div className="sm:col-span-3">
                          <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                            Jenis / Tipe Alat *
                          </label>
                          <input
                            type="text"
                            value={item.equipmentType}
                            onChange={(e) => handleItemFieldChange(index, 'equipmentType', e.target.value)}
                            placeholder="e.g., 20-Ton Excavator"
                            className="w-full p-1.5 border border-slate-300 rounded text-xs outline-none"
                          />
                        </div>

                        {/* Rate Model: REGULAR vs LUMPSUM */}
                        <div className="sm:col-span-3">
                          <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                            Model Tarif Sewa *
                          </label>
                          <select
                            value={item.rateModel}
                            onChange={(e) => handleItemFieldChange(index, 'rateModel', e.target.value)}
                            className="w-full p-1.5 border border-slate-300 rounded text-xs font-semibold outline-none"
                          >
                            <option value="REGULAR">REGULAR (Per Jam/Hari/Bulan)</option>
                            <option value="LUMPSUM">LUMPSUM (Project Lump-Sum Contract)</option>
                          </select>
                        </div>

                        {/* Rental Rate */}
                        <div className="sm:col-span-3">
                          <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                            Rental Rate (IDR) *
                          </label>
                          <input
                            type="number"
                            value={item.rentalRate}
                            onChange={(e) => handleItemFieldChange(index, 'rentalRate', parseFloat(e.target.value) || 0)}
                            className="w-full p-1.5 border border-slate-300 rounded text-xs font-mono outline-none"
                          />
                        </div>
                      </div>

                      {/* Mobilization & Demobilization Dates and Customized Fees */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1.5 bg-slate-50/60 p-2 rounded">
                        <div>
                          <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                            Mobilization Date (Delivery)
                          </label>
                          <input
                            type="date"
                            value={item.mobilizationDate}
                            onChange={(e) => handleItemFieldChange(index, 'mobilizationDate', e.target.value)}
                            className="w-full p-1.5 border border-slate-300 rounded text-xs font-mono outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                            Mobilization Fee (IDR)
                          </label>
                          <input
                            type="number"
                            value={item.mobilizationFee}
                            onChange={(e) =>
                              handleItemFieldChange(index, 'mobilizationFee', parseFloat(e.target.value) || 0)
                            }
                            className="w-full p-1.5 border border-slate-300 rounded text-xs font-mono outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                            Demobilization Date (Return)
                          </label>
                          <input
                            type="date"
                            value={item.demobilizationDate}
                            onChange={(e) => handleItemFieldChange(index, 'demobilizationDate', e.target.value)}
                            className="w-full p-1.5 border border-slate-300 rounded text-xs font-mono outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                            Demobilization Fee (IDR)
                          </label>
                          <input
                            type="number"
                            value={item.demobilizationFee}
                            onChange={(e) =>
                              handleItemFieldChange(index, 'demobilizationFee', parseFloat(e.target.value) || 0)
                            }
                            className="w-full p-1.5 border border-slate-300 rounded text-xs font-mono outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Financial Summary */}
                <div className="flex justify-end pt-2">
                  <div className="w-72 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Equipment Rental Subtotal:</span>
                      <span className="font-mono">{formatRupiahAmount(calculatedRentalSubtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Total Mobilization Cost:</span>
                      <span className="font-mono">{formatRupiahAmount(calculatedMobTotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Total Demobilization Cost:</span>
                      <span className="font-mono">{formatRupiahAmount(calculatedDemobTotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>VAT (11%):</span>
                      <span className="font-mono">{formatRupiahAmount(calculatedTaxTotal)}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-300 font-bold text-slate-900 text-sm">
                      <span>Quotation Grand Total:</span>
                      <span className="font-mono text-emerald-700">{formatRupiahAmount(calculatedGrandTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Commercial Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Syarat &amp; Ketentuan Rental</label>
                <textarea
                  rows={2}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-white rounded font-bold hover:bg-slate-800 cursor-pointer shadow-xs"
                >
                  Issue Official Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE PDF QUOTATION MODAL */}
      {selectedPreviewQuote && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-300 max-w-3xl w-full max-h-[95vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 no-print">
              <span className="text-sm font-bold text-slate-900">
                Official Heavy Equipment Rental Quotation
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-slate-900 text-white rounded hover:bg-slate-800 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / Save as PDF
                </button>
                <button
                  onClick={() => setSelectedPreviewQuote(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Body */}
            <div className="p-8 overflow-y-auto space-y-6 text-xs text-slate-800">
              <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900">PT Apex Commercial Assets Indonesia</h1>
                  <p className="text-slate-500 mt-0.5">Heavy Equipment Rental, Asset Management &amp; Fleet Operations</p>
                  <p className="text-slate-500 text-[11px] mt-1">Indonesia Stock Exchange Building, Tower 2, 18th Floor, South Jakarta</p>
                  <p className="text-slate-500 text-[11px]">Telepon: (021) 515-8899 · Email: commercial@apex-earms.co.id</p>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold text-slate-900 uppercase font-mono">
                    RENTAL QUOTATION
                  </div>
                  <div className="font-mono font-bold text-slate-800 mt-1">{selectedPreviewQuote.quotationNumber}</div>
                  {selectedPreviewQuote.linkedSalesOrderNumber && (
                    <div className="text-purple-700 font-mono font-bold text-[11px] mt-0.5">
                      Sales Order Reference: {selectedPreviewQuote.linkedSalesOrderNumber}
                    </div>
                  )}
                  <div className="text-slate-500 text-[11px] mt-0.5">Date: {selectedPreviewQuote.date}</div>
                  <div className="text-amber-800 font-semibold text-[11px]">Valid Until: {selectedPreviewQuote.validUntil}</div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Prepared For:</span>
                  <div className="font-bold text-slate-900 text-sm">{selectedPreviewQuote.customerName}</div>
                  <div className="text-slate-600 mt-1">Project Procurement</div>
                  <div className="text-slate-500 text-[11px]">Registered Delivery Site</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Sales Representative:</span>
                  <div className="font-semibold text-slate-800">{selectedPreviewQuote.salespersonName}</div>
                  <div className="text-slate-500 text-[11px] mt-1">Senior Commercial Sales Engineer</div>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <table className="w-full text-left text-xs border border-slate-200 rounded">
                  <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Equipment ID &amp; Type</th>
                      <th className="py-2.5 px-3">Model Tarif</th>
                      <th className="py-2.5 px-3">Mobilization Date</th>
                      <th className="py-2.5 px-3 text-right">Rental Rate</th>
                      <th className="py-2.5 px-3 text-right">Mob./Demob. Fees</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedPreviewQuote.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900 font-mono">
                            {it.equipmentNumber || it.sku || `AST-${10024 + idx}`}
                          </div>
                          <div className="text-[11px] text-slate-600">{it.equipmentType || it.productName}</div>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-[11px]">
                          <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-800">
                            {it.rateModel || 'REGULAR'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                          {it.mobilizationDate || 'As Scheduled'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">{formatRupiahAmount(it.rentalRate || it.unitPrice)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-[11px]">
                          {formatRupiahAmount((it.mobilizationFee || 0) + (it.demobilizationFee || 0))}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {formatRupiahAmount(it.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-72 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Equipment Rental Subtotal:</span>
                    <span className="font-mono">{formatRupiahAmount(selectedPreviewQuote.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Mobilization &amp; Demobilization:</span>
                    <span className="font-mono">
                      {formatRupiahAmount((selectedPreviewQuote.mobilizationTotal || 0) + (selectedPreviewQuote.demobilizationTotal || 0))}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Sales Tax (11%):</span>
                    <span className="font-mono">{formatRupiahAmount(selectedPreviewQuote.taxTotal)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-300 text-sm font-bold text-slate-900">
                    <span>Grand Total:</span>
                    <span className="font-mono text-emerald-700">{formatRupiahAmount(selectedPreviewQuote.grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-6 border-t border-slate-200 text-center grid grid-cols-2 gap-8">
                <div>
                  <div className="text-[11px] text-slate-500">Prepared by Commercial Sales:</div>
                  <div className="font-bold text-slate-800 mt-8 pt-1 border-t border-slate-300">
                    {selectedPreviewQuote.salespersonName}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Customer Acceptance:</div>
                  <div className="font-bold text-slate-800 mt-8 pt-1 border-t border-slate-300">
                    ( Authorized Signature &amp; Company Stamp )
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showRateCalculator && (
        <RentalRateCalculator
          onClose={() => setShowRateCalculator(false)}
          onApplyRate={(rate, rateModel) => {
            setItems((current) => current.map((item, index) => index === 0 ? { ...item, rentalRate: rate, rateModel } : item));
          }}
        />
      )}
    </div>
  );
};
