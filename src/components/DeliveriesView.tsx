import React, { useState } from 'react';
import { Delivery } from '../types/index.ts';
import { api } from '../services/api.ts';
import {
  Truck,
  CheckCircle2,
  Clock,
  Printer,
  X,
  ShieldCheck,
  FileText,
  MapPin,
  UserCheck,
} from 'lucide-react';

interface DeliveriesViewProps {
  deliveries: Delivery[];
  onRefresh: () => void;
}

export const DeliveriesView: React.FC<DeliveriesViewProps> = ({ deliveries, onRefresh }) => {
  const [selectedPreviewDelivery, setSelectedPreviewDelivery] = useState<Delivery | null>(null);
  const [confirmingDelivery, setConfirmingDelivery] = useState<Delivery | null>(null);
  const [signerName, setSignerName] = useState('');
  const [conditionNotes, setConditionNotes] = useState('Operating hours 0.0, all fluids full, zero transport damage.');

  const handleConfirmHandover = async () => {
    if (!confirmingDelivery || !signerName.trim()) {
      alert('Recipient full name or digital e-signature is required for handover verification.');
      return;
    }

    try {
      await api.confirmDelivery(confirmingDelivery.id, {
        digitalSignature: `${signerName} (Verified Customer E-Sign)`,
        acceptedBy: signerName,
        conditionNotes,
      });

      alert(`Handover verified! Serialized assets marked as DELIVERED/SOLD.`);
      setConfirmingDelivery(null);
      setSignerName('');
      onRefresh();
    } catch (err: any) {
      alert(`Handover error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 border border-slate-200 rounded-md">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-slate-700" />
          <h2 className="text-base font-bold text-slate-900">Delivery &amp; Equipment Handover Logistics</h2>
          <span className="text-xs text-slate-400">({deliveries.length} shipments)</span>
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-4">Delivery Order #</th>
                <th className="py-2.5 px-4">Recipient &amp; Customer</th>
                <th className="py-2.5 px-4">Destination Site</th>
                <th className="py-2.5 px-4">Equipment Tags &amp; Serials</th>
                <th className="py-2.5 px-4">Dispatch / Courier</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {deliveries.map((delivery) => {
                const isPendingAcceptance = delivery.status === 'IN_TRANSIT' || delivery.status === 'DRAFT' || delivery.status === 'PICKED';

                return (
                  <tr key={delivery.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      <button
                        type="button"
                        onClick={() => setSelectedPreviewDelivery(delivery)}
                        className="text-left font-mono font-bold text-indigo-700 hover:text-indigo-900 hover:underline cursor-pointer flex items-center gap-1"
<<<<<<< HEAD
                        title="Open the official delivery note"
=======
                        title="Klik untuk membuka view data Surat Jalan resmi"
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>{delivery.deliveryNumber}</span>
                      </button>
                      <div className="text-[10px] text-slate-400 font-sans">
                        Ref: {delivery.sourceReferenceId}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{delivery.customerName}</div>
                      <div className="text-[11px] text-slate-500">Contact: {delivery.recipientName}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{delivery.deliveryAddress.street}</div>
                      <div className="text-[11px] text-slate-400">
                        {delivery.deliveryAddress.city}, {delivery.deliveryAddress.state} {delivery.deliveryAddress.postalCode}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {delivery.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-slate-800 font-mono text-[11px]">
                          <span className="font-bold text-slate-900 bg-slate-100 px-1 py-0.2 rounded">
                            {item.assetTag || 'N/A'}
                          </span>
                          <span className="text-slate-500 font-sans">{item.productName}</span>
                          {item.serialNumber && (
                            <span className="text-slate-400 text-[10px]">(SN: {item.serialNumber})</span>
                          )}
                        </div>
                      ))}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-800">{delivery.driverName || 'Dedicated Haul'}</div>
                      <div className="font-mono text-[10px] text-slate-400">{delivery.trackingNumber}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                          delivery.status === 'CUSTOMER_ACCEPTED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {delivery.status === 'CUSTOMER_ACCEPTED' ? 'ACCEPTED' : delivery.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedPreviewDelivery(delivery)}
                        className="px-2 py-1 text-[11px] font-medium border border-slate-300 text-slate-700 rounded hover:bg-slate-50"
                      >
                        Delivery Note
                      </button>

                      {isPendingAcceptance && (
                        <button
                          onClick={() => {
                            setConfirmingDelivery(delivery);
                            setSignerName(delivery.recipientName);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-600 text-white rounded hover:bg-emerald-700"
                        >
                          Confirm Handover
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {deliveries.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No active deliveries.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Delivery Note Modal */}
      {selectedPreviewDelivery && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-300 max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 no-print">
              <span className="text-sm font-bold text-slate-900">Equipment Delivery Note &amp; Proof of Delivery</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
                >
                  <Printer className="w-3.5 h-3.5" />
<<<<<<< HEAD
                  Print Delivery Note
=======
                  Print Note
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                </button>
                <button
                  onClick={() => setSelectedPreviewDelivery(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto space-y-6 text-xs text-slate-800">
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <h1 className="text-lg font-bold text-slate-900">Apex Industrial Solutions Corp.</h1>
                  <p className="text-slate-500 text-[11px]">Heavy Equipment Hauling &amp; Technical Logistics</p>
                  <p className="text-slate-500 text-[11px]">Dispatch Yard: 4250 Innovation Pkwy, Dallas TX</p>
                </div>
                <div className="text-right font-mono">
                  <div className="text-sm font-bold text-slate-900">DELIVERY NOTE</div>
                  <div className="font-bold text-slate-800 mt-0.5">{selectedPreviewDelivery.deliveryNumber}</div>
<<<<<<< HEAD
                  <div className="text-slate-500 text-[11px]">Dispatch Date: {new Date(selectedPreviewDelivery.dispatchDate).toLocaleDateString('en-US')}</div>
=======
                  <div className="text-slate-500 text-[11px]">Dispatch: {new Date(selectedPreviewDelivery.dispatchDate).toLocaleDateString()}</div>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Deliver To</span>
                  <div className="font-bold text-slate-900">{selectedPreviewDelivery.customerName}</div>
                  <div className="text-slate-600 mt-0.5">{selectedPreviewDelivery.deliveryAddress.street}</div>
                  <div className="text-slate-600">
                    {selectedPreviewDelivery.deliveryAddress.city}, {selectedPreviewDelivery.deliveryAddress.state} {selectedPreviewDelivery.deliveryAddress.postalCode}
                  </div>
                  <div className="text-slate-500 mt-1">Recipient: {selectedPreviewDelivery.recipientName} ({selectedPreviewDelivery.recipientPhone})</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Logistics Reference</span>
                  <div>Order Reference: <span className="font-mono font-medium">{selectedPreviewDelivery.sourceReferenceId}</span></div>
                  <div>Carrier / Driver: <span className="font-medium">{selectedPreviewDelivery.driverName}</span></div>
                  <div>Tracking: <span className="font-mono text-slate-600">{selectedPreviewDelivery.trackingNumber}</span></div>
<<<<<<< HEAD
                  <div className="mt-1 text-emerald-700 font-semibold">Status: {selectedPreviewDelivery.status.replaceAll('_', ' ')}</div>
=======
                  <div className="mt-1 text-emerald-700 font-semibold">Status: {selectedPreviewDelivery.status}</div>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
                  Serialized Machinery &amp; Handover Manifest
                </h4>
                <table className="w-full text-left text-xs border border-slate-200 rounded">
                  <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-3">Item Description</th>
                      <th className="py-2 px-3">Asset Tag</th>
                      <th className="py-2 px-3">Serial Number</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-center">Verified</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {selectedPreviewDelivery.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-sans font-semibold text-slate-900">{item.productName}</td>
                        <td className="py-2 px-3 font-bold text-slate-800">{item.assetTag || 'STOCK'}</td>
                        <td className="py-2 px-3 text-slate-600">{item.serialNumber || 'N/A'}</td>
                        <td className="py-2 px-3 text-center font-sans">{item.quantity}</td>
                        <td className="py-2 px-3 text-center font-sans text-emerald-700 font-bold">YES</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <span className="font-semibold text-slate-700 block mb-1">Condition at Handover:</span>
                <p className="text-slate-600">{selectedPreviewDelivery.conditionNotes}</p>
              </div>

              {/* Proof of Delivery / Signature */}
              <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-8 text-[11px]">
                <div className="border border-slate-200 p-3 rounded bg-slate-50/50">
                  <span className="text-slate-400 block mb-1">Carrier Driver Confirmation</span>
                  <div className="font-medium text-slate-800">{selectedPreviewDelivery.driverName}</div>
                  <div className="text-[10px] text-slate-400 mt-2">Dispatched and loaded securely</div>
                </div>
                <div className="border border-slate-200 p-3 rounded bg-emerald-50/30">
                  <span className="text-slate-400 block mb-1">Customer Proof of Acceptance</span>
                  <div className="font-bold text-slate-900">
                    {selectedPreviewDelivery.digitalSignature || 'Pending site arrival & signature'}
                  </div>
                  {selectedPreviewDelivery.actualDeliveryDate && (
                    <div className="text-[10px] text-emerald-700 font-mono mt-1">
<<<<<<< HEAD
                      Received: {new Date(selectedPreviewDelivery.actualDeliveryDate).toLocaleString('en-US')}
=======
                      Received: {new Date(selectedPreviewDelivery.actualDeliveryDate).toLocaleString()}
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Handover Modal */}
      {confirmingDelivery && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-5 text-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              Confirm Customer Receipt &amp; Digital Handover: {confirmingDelivery.deliveryNumber}
            </h3>
            <p className="text-slate-600">
              Confirming this delivery updates equipment serial status to DELIVERED/SOLD, records recipient acceptance, and issues official digital proof of delivery.
            </p>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Authorized Site Signatory Name *</label>
              <input
                type="text"
                required
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="e.g. Clara Miller (Site Superintendent)"
                className="w-full p-2 border border-slate-300 rounded outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Delivery Condition &amp; Acceptance Notes</label>
              <textarea
                rows={2}
                value={conditionNotes}
                onChange={(e) => setConditionNotes(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setConfirmingDelivery(null)}
                className="px-3.5 py-1.5 border border-slate-300 text-slate-700 rounded hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmHandover}
                className="px-4 py-1.5 bg-emerald-600 text-white font-semibold rounded hover:bg-emerald-700"
              >
                Sign &amp; Verify Handover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
