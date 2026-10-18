import React, { useState } from 'react';
import { SalesOrder, Customer, Product, Asset } from '../types/index.ts';
import { api } from '../services/api.ts';
<<<<<<< HEAD
import { formatRupiahAmount } from '../shared/currency.tsx';
=======
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
import {
  ShoppingBag,
  Plus,
  Truck,
  DollarSign,
  AlertOctagon,
  X,
  FileCheck,
  Package,
  FileText,
} from 'lucide-react';
import { DocumentPreviewModal, SupportedDocType } from './DocumentPreviewModal.tsx';

interface SalesOrdersViewProps {
  salesOrders: SalesOrder[];
  customers: Customer[];
  products: Product[];
  assets: Asset[];
  onRefresh: () => void;
  onNavigateToDelivery?: (deliveryId: string) => void;
  onNavigateToInvoice?: (invoiceId: string) => void;
}

export const SalesOrdersView: React.FC<SalesOrdersViewProps> = ({
  salesOrders,
  customers,
  products,
  assets,
  onRefresh,
  onNavigateToDelivery,
  onNavigateToInvoice,
}) => {
  const [showDirectOrderModal, setShowDirectOrderModal] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState<SalesOrder | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [previewDoc, setPreviewDoc] = useState<{ type: SupportedDocType; data: any } | null>(null);

  // Direct Order Form
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [poRef, setPoRef] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [shippingFee, setShippingFee] = useState('1200');
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [selectedAssetTag, setSelectedAssetTag] = useState('');

  const handleCreateDirectOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !selectedProductId) {
      alert('Customer and Product selection are required.');
      return;
    }

    try {
      const prod = products.find((p) => p.id === selectedProductId);
      await api.createSalesOrder({
        customerId,
        customerPoReference: poRef || `DIRECT-PO-${Date.now().toString().slice(-4)}`,
        targetDeliveryDate: targetDate || new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
        shippingFee: parseFloat(shippingFee) || 0,
        items: [
          {
            productId: selectedProductId,
            quantity: 1,
            unitPrice: prod?.salesPrice || 10000,
            discountPercent: 0,
            taxRatePercent: prod?.taxRatePercent || 8.25,
            allocatedAssetTag: selectedAssetTag || undefined,
          },
        ],
      });

      setShowDirectOrderModal(false);
      onRefresh();
    } catch (err: any) {
      alert(`Error creating sales order: ${err.message}`);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancellingOrder || !cancelReason.trim()) {
      alert('A valid corporate cancellation reason is required.');
      return;
    }

    try {
      await api.cancelSalesOrder(cancellingOrder.id, cancelReason);
      setCancellingOrder(null);
      setCancelReason('');
      onRefresh();
    } catch (err: any) {
      alert(`Cancellation failed: ${err.message}`);
    }
  };

  const handleCreateDelivery = async (order: SalesOrder) => {
    try {
      const delivery = await api.createDelivery({
        sourceType: 'SALES_ORDER',
        sourceReferenceId: order.id,
        recipientName: order.customerName,
        recipientPhone: '+1 (555) 019-2834',
        driverName: 'Travis Vance (Apex Heavy Haul)',
        conditionNotes: 'Dispatched for site commissioning.',
      });
<<<<<<< HEAD
      alert(`Delivery Order ${delivery.deliveryNumber} created and awaiting Manager approval.`);
=======
      alert(`Delivery Order ${delivery.deliveryNumber} generated!`);
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
      onRefresh();
      if (onNavigateToDelivery) onNavigateToDelivery(delivery.id);
    } catch (err: any) {
      alert(`Delivery creation failed: ${err.message}`);
    }
  };

  const handleCreateInvoice = async (order: SalesOrder) => {
    try {
      const inv = await api.createInvoice({
        customerId: order.customerId,
        type: 'SALES',
        relatedSourceId: order.id,
        relatedSourceType: 'SALES_ORDER',
        items: order.items.map((i) => ({
          description: `${i.productName} (${i.allocatedAssetTag || 'Stock'})`,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discountPercent: i.discountPercent,
          taxRatePercent: i.taxRatePercent,
          assetTag: i.allocatedAssetTag,
        })),
        additionalCharges: order.shippingFee,
        terms: `Net 30 days. Reference Sales Order ${order.orderNumber}`,
      });
      alert(`Invoice ${inv.invoiceNumber} created in Draft status.`);
      onRefresh();
      if (onNavigateToInvoice) onNavigateToInvoice(inv.id);
    } catch (err: any) {
      alert(`Invoice generation failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 border border-slate-200 rounded-md">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-slate-700" />
          <h2 className="text-base font-bold text-slate-900">Commercial Sales Orders</h2>
          <span className="text-xs text-slate-400">({salesOrders.length} orders)</span>
        </div>

        <button
          onClick={() => setShowDirectOrderModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
        >
          <Plus className="w-4 h-4" />
          Direct Sales Order
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-4">Order # / PO Ref</th>
                <th className="py-2.5 px-4">Customer &amp; Site</th>
                <th className="py-2.5 px-4">Allocated Equipment</th>
                <th className="py-2.5 px-4">Delivery Date</th>
                <th className="py-2.5 px-4 text-right">Order Value</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {salesOrders.map((order) => {
                const canDeliver = order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && order.status !== 'COMPLETED';
                const canCancel = order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && order.status !== 'DELIVERED';

                return (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc({ type: 'SALES_ORDER', data: order })}
                        className="text-left font-mono font-bold text-indigo-700 hover:text-indigo-900 hover:underline cursor-pointer flex items-center gap-1"
<<<<<<< HEAD
                        title="Open the official sales order"
=======
                        title="Klik untuk membuka view data Sales Order resmi"
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>{order.orderNumber}</span>
                      </button>
                      {order.customerPoReference && (
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewDoc({
                              type: 'CLIENT_PO',
                              data: {
                                ...order,
                                customerPoNumber: order.customerPoReference,
                                poNumber: order.customerPoReference,
                                clientPoNumber: order.customerPoReference,
                              },
                            })
                          }
                          className="text-[11px] text-sky-700 hover:text-sky-900 hover:underline cursor-pointer mt-0.5 block text-left font-mono font-semibold"
<<<<<<< HEAD
                          title="Open the customer purchase order"
=======
                          title="Klik untuk membuka view data PO dari Client"
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                        >
                          PO Client: {order.customerPoReference}
                        </button>
                      )}
                      {order.quotationReference && (
                        <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          QT: {order.quotationReference}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{order.customerName}</div>
                      <div className="text-[11px] text-slate-400">
                        {order.deliveryAddress.city}, {order.deliveryAddress.state}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex flex-wrap items-center gap-1.5 text-[11px]">
                            <Package className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-medium text-slate-800">{item.productName}</span>
                            {(item.allocatedAssetTag || item.equipmentNumber) && (
                              <span className="font-mono text-[10px] bg-slate-100 text-slate-800 px-1 py-0.2 rounded font-bold">
                                {item.allocatedAssetTag || item.equipmentNumber}
                              </span>
                            )}
                            {item.rateModel && (
                              <span className={`text-[9px] font-bold px-1 py-0.2 rounded uppercase ${item.rateModel === 'LUMPSUM' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                                {item.rateModel}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      {order.targetDeliveryDate}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-numbers">
                      <div className="font-bold text-slate-900">
<<<<<<< HEAD
                        {formatRupiahAmount(order.grandTotal)}
                      </div>
                      {(order.mobilizationTotal || 0) > 0 && (
                        <div className="text-[10px] text-slate-400">
                          Mobilization: {formatRupiahAmount(order.mobilizationTotal)} · Demobilization: {formatRupiahAmount(order.demobilizationTotal || 0)}
=======
                        ${order.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      {(order.mobilizationTotal || 0) > 0 && (
                        <div className="text-[10px] text-slate-400">
                          Mob: ${order.mobilizationTotal} · Demob: ${order.demobilizationTotal || 0}
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                          order.status === 'COMPLETED' || order.status === 'DELIVERED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : order.status === 'ALLOCATED' || order.status === 'CONFIRMED'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : order.status === 'CANCELLED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {canDeliver && (
                        <button
                          onClick={() => handleCreateDelivery(order)}
                          className="px-2 py-1 text-[11px] font-semibold bg-slate-900 text-white rounded hover:bg-slate-800 inline-flex items-center gap-1"
                        >
                          <Truck className="w-3 h-3" />
                          Dispatch
                        </button>
                      )}

                      {!order.invoiceId && order.status !== 'CANCELLED' && (
                        <button
                          onClick={() => handleCreateInvoice(order)}
                          className="px-2 py-1 text-[11px] font-medium border border-slate-300 text-slate-700 rounded hover:bg-slate-50 inline-flex items-center gap-1"
                        >
                          <DollarSign className="w-3 h-3" />
                          Invoice
                        </button>
                      )}

                      {canCancel && (
                        <button
                          onClick={() => setCancellingOrder(order)}
                          className="px-2 py-1 text-[11px] text-rose-600 hover:text-rose-800"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {salesOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No sales orders recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Direct Sales Order Modal */}
      {showDirectOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-xl w-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Direct Commercial Sales Order</h3>
              <button
                onClick={() => setShowDirectOrderModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDirectOrder} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Customer Account *</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded outline-none"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.customerCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Customer PO Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. PO-CLIENT-98210"
                    value={poRef}
                    onChange={(e) => setPoRef(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Target Delivery Date</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Select Sellable Product *</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
<<<<<<< HEAD
                      {p.name} - {formatRupiahAmount(p.salesPrice)} ({p.stockQuantity} in stock)
=======
                      {p.name} - ${p.salesPrice.toLocaleString()} ({p.stockQuantity} in stock)
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Allocate Serialized Asset Tag (Optional)
                </label>
                <select
                  value={selectedAssetTag}
                  onChange={(e) => setSelectedAssetTag(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded outline-none font-mono"
                >
                  <option value="">-- No Serialized Tag (Quantity / Bulk) --</option>
                  {assets
                    .filter((a) => a.status === 'AVAILABLE')
                    .map((a) => (
                      <option key={a.id} value={a.assetTag}>
                        {a.assetTag} - {a.name} (SN: {a.serialNumber})
                      </option>
                    ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Only AVAILABLE assets can be allocated. Once allocated, asset is locked from other rentals or sales.
                </span>
              </div>

              <div>
<<<<<<< HEAD
                <label className="block text-slate-600 font-semibold mb-1">Freight / Mobilization Fee (IDR)</label>
=======
                <label className="block text-slate-600 font-semibold mb-1">Freight / Mobilization Fee ($)</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                <input
                  type="number"
                  value={shippingFee}
                  onChange={(e) => setShippingFee(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded font-mono outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowDirectOrderModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded font-semibold hover:bg-slate-800"
                >
                  Confirm Sales Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mandatory Cancellation Modal */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-5 text-xs">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm mb-2">
              <AlertOctagon className="w-5 h-5" />
              <span>Cancel Order: {cancellingOrder.orderNumber}</span>
            </div>
            <p className="text-slate-600 mb-3">
              Per enterprise policy, cancellation of an active sales order requires a mandatory audit reason. Allocated serialized assets will be immediately unlocked and returned to AVAILABLE status.
            </p>

            <label className="block font-semibold text-slate-700 mb-1">Mandatory Cancellation Reason *</label>
            <textarea
              rows={3}
              required
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Customer cancelled site expansion project due to weather delay..."
              className="w-full p-2 border border-slate-300 rounded outline-none"
            />

            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-200">
              <button
                onClick={() => setCancellingOrder(null)}
                className="px-3.5 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
              >
                Keep Order
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-4 py-1.5 bg-rose-600 text-white font-semibold rounded hover:bg-rose-700"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          docType={previewDoc.type}
          data={previewDoc.data}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
};
