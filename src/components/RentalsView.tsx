import React, { useState } from 'react';
import { RentalContract, Customer, Asset, AssetCondition } from '../types/index.ts';
import { api } from '../services/api.ts';
import {
  CalendarDays,
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle,
  X,
  Boxes,
  ShieldCheck,
  Calendar,
  DollarSign,
} from 'lucide-react';

interface RentalsViewProps {
  rentals: RentalContract[];
  customers: Customer[];
  assets: Asset[];
  onRefresh: () => void;
  onNavigateToInvoice?: (invId: string) => void;
}

export const RentalsView: React.FC<RentalsViewProps> = ({
  rentals,
  customers,
  assets,
  onRefresh,
  onNavigateToInvoice,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [extendingContract, setExtendingContract] = useState<RentalContract | null>(null);
  const [returningContract, setReturningContract] = useState<RentalContract | null>(null);

  // Create Form State
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [rateType, setRateType] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('MONTHLY');
  const [durationUnits, setDurationUnits] = useState('1');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [securityDeposit, setSecurityDeposit] = useState('2500');
  const [deliveryFee, setDeliveryFee] = useState('650');
  const [notes, setNotes] = useState('');

  // Extension Form
  const [newReturnDate, setNewReturnDate] = useState('');
  const [extensionAmount, setExtensionAmount] = useState('1500');

  // Return Inspection Form
  const [returnCondition, setReturnCondition] = useState<AssetCondition>('GOOD');
  const [damageCharge, setDamageCharge] = useState('0');
  const [inspectionNotes, setInspectionNotes] = useState('');

  const toggleAssetSelect = (assetId: string) => {
    if (selectedAssetIds.includes(assetId)) {
      setSelectedAssetIds(selectedAssetIds.filter((id) => id !== assetId));
    } else {
      setSelectedAssetIds([...selectedAssetIds, assetId]);
    }
  };

  const handleCreateRental = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || selectedAssetIds.length === 0) {
      alert('Please select a customer and at least one available asset.');
      return;
    }

    try {
      await api.createRental({
        customerId,
        assetIds: selectedAssetIds,
        rateType,
        durationUnits: parseInt(durationUnits, 10) || 1,
        startDate,
        securityDeposit: parseFloat(securityDeposit) || 0,
        deliveryFee: parseFloat(deliveryFee) || 0,
        notes,
      });

      setShowCreateModal(false);
      setSelectedAssetIds([]);
      onRefresh();
    } catch (err: any) {
      alert(`Rental reservation error: ${err.message}`);
    }
  };

  const handleConfirmExtension = async () => {
    if (!extendingContract || !newReturnDate) {
      alert('A new expected return date is required.');
      return;
    }

    try {
      await api.extendRental(extendingContract.id, {
        newReturnDate,
        additionalAmount: parseFloat(extensionAmount) || 0,
      });
      setExtendingContract(null);
      onRefresh();
    } catch (err: any) {
      alert(`Extension error: ${err.message}`);
    }
  };

  const handleConfirmReturn = async () => {
    if (!returningContract) return;

    try {
      await api.returnRental(returningContract.id, {
        returnCondition,
        damageCharge: parseFloat(damageCharge) || 0,
        inspectionNotes,
      });
      setReturningContract(null);
      onRefresh();
    } catch (err: any) {
      alert(`Return inspection error: ${err.message}`);
    }
  };

  const handleCreateRentalInvoice = async (contract: RentalContract) => {
    try {
      const inv = await api.createInvoice({
        customerId: contract.customerId,
        type: 'RENTAL',
        relatedSourceId: contract.id,
        relatedSourceType: 'RENTAL_CONTRACT',
        items: contract.items.map((i) => ({
          description: `Rental - ${i.assetName} (${i.durationUnits} ${i.rateType.toLowerCase()}s: ${i.startDate} to ${i.expectedReturnDate})`,
          quantity: i.durationUnits,
          unitPrice: i.unitRate,
          discountPercent: 0,
          taxRatePercent: 8.25,
          assetTag: i.assetTag,
        })),
        additionalCharges: contract.deliveryFee + contract.pickupFee,
        terms: `Rental contract billing Net 30. Security deposit held separately: $${contract.securityDeposit.toFixed(2)}`,
      });
      alert(`Rental Invoice ${inv.invoiceNumber} drafted successfully!`);
      onRefresh();
      if (onNavigateToInvoice) onNavigateToInvoice(inv.id);
    } catch (err: any) {
      alert(`Invoice generation error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 border border-slate-200 rounded-md">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-slate-700" />
          <h2 className="text-base font-bold text-slate-900">Equipment Rental &amp; Lease Contracts</h2>
          <span className="text-xs text-slate-400">({rentals.length} contracts)</span>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
        >
          <Plus className="w-4 h-4" />
          Book Rental Deployment
        </button>
      </div>

      {/* Contract Table */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-4">Contract #</th>
                <th className="py-2.5 px-4">Client / Site Contact</th>
                <th className="py-2.5 px-4">Assets Deployed</th>
                <th className="py-2.5 px-4">Lease Period</th>
                <th className="py-2.5 px-4 text-right">Security Deposit</th>
                <th className="py-2.5 px-4 text-right">Contract Volume</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {rentals.map((contract) => {
                const isActive = contract.status === 'ACTIVE' || contract.status === 'RESERVED';
                return (
                  <tr key={contract.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {contract.contractNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{contract.customerName}</div>
                      <div className="text-[11px] text-slate-400">{contract.customerContact}</div>
                    </td>
                    <td className="py-3 px-4">
                      {contract.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-slate-800">
                          <span className="font-mono text-[10px] bg-slate-100 px-1 py-0.2 rounded font-semibold text-slate-700">
                            {item.assetTag}
                          </span>
                          <span className="font-medium">{item.assetName}</span>
                        </div>
                      ))}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      <div>{contract.startDate} → {contract.expectedReturnDate}</div>
                      {contract.actualReturnDate && (
                        <div className="text-slate-400 text-[10px]">Returned: {contract.actualReturnDate}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-numbers">
                      <div className="font-medium text-slate-800">
                        ${contract.securityDeposit.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {contract.depositStatus}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono-numbers font-bold text-slate-900">
                      ${contract.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                          contract.status === 'ACTIVE'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : contract.status === 'SETTLED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {contract.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {isActive && (
                        <>
                          <button
                            onClick={() => {
                              setExtendingContract(contract);
                              setNewReturnDate(contract.expectedReturnDate);
                            }}
                            className="px-2 py-1 text-[11px] font-medium border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
                          >
                            Extend
                          </button>
                          <button
                            onClick={() => {
                              setReturningContract(contract);
                              setReturnCondition('GOOD');
                              setDamageCharge('0');
                            }}
                            className="px-2 py-1 text-[11px] font-semibold bg-emerald-600 text-white rounded hover:bg-emerald-700"
                          >
                            Return &amp; Inspect
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => handleCreateRentalInvoice(contract)}
                        className="px-2 py-1 text-[11px] font-medium border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
                      >
                        Invoice
                      </button>
                    </td>
                  </tr>
                );
              })}
              {rentals.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No rental contracts logged.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Book Rental Deployment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Book Equipment Rental Contract</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRental} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Rental Customer *</label>
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

              {/* Asset Selection with Anti-Double Booking Protection */}
              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Select Serialized Assets for Rental (Only AVAILABLE units shown) *
                </label>
                <div className="border border-slate-200 rounded p-2.5 max-h-44 overflow-y-auto space-y-1.5 bg-slate-50">
                  {assets
                    .filter((a) => a.status === 'AVAILABLE')
                    .map((asset) => {
                      const isSelected = selectedAssetIds.includes(asset.id);
                      return (
                        <div
                          key={asset.id}
                          onClick={() => toggleAssetSelect(asset.id)}
                          className={`p-2 rounded border cursor-pointer flex items-center justify-between text-xs transition-colors ${
                            isSelected
                              ? 'bg-blue-50 border-blue-400 text-blue-900'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // handled by parent div
                              className="rounded text-blue-600 pointer-events-none"
                            />
                            <span className="font-mono font-bold text-slate-900">{asset.assetTag}</span>
                            <span>{asset.name}</span>
                          </div>
                          <div className="font-mono font-medium text-slate-600">
                            ${asset.monthlyRentalRate}/mo · ${asset.dailyRentalRate}/day
                          </div>
                        </div>
                      );
                    })}
                  {assets.filter((a) => a.status === 'AVAILABLE').length === 0 && (
                    <p className="text-rose-600 p-2 font-medium">
                      No assets currently AVAILABLE in warehouse registry.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Rate Structure</label>
                  <select
                    value={rateType}
                    onChange={(e) => setRateType(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded outline-none"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="DAILY">Daily</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Duration Units</label>
                  <input
                    type="number"
                    min="1"
                    value={durationUnits}
                    onChange={(e) => setDurationUnits(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Security Deposit ($)</label>
                  <input
                    type="number"
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Mobilization Fee ($)</label>
                  <input
                    type="number"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Contract / Operating Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="On-site requirements, fuel specifications, 24/7 service plan..."
                  className="w-full p-2 border border-slate-300 rounded outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={selectedAssetIds.length === 0}
                  className="px-4 py-2 bg-slate-900 text-white rounded font-semibold hover:bg-slate-800 disabled:opacity-50"
                >
                  Confirm Rental Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Extension Modal */}
      {extendingContract && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-5 text-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              Extend Rental Duration: {extendingContract.contractNumber}
            </h3>
            <p className="text-slate-500">
              Current expected return date: {extendingContract.expectedReturnDate}
            </p>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">New Return Date *</label>
              <input
                type="date"
                required
                value={newReturnDate}
                onChange={(e) => setNewReturnDate(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Additional Fee ($)</label>
              <input
                type="number"
                value={extensionAmount}
                onChange={(e) => setExtensionAmount(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded font-mono outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setExtendingContract(null)}
                className="px-3.5 py-1.5 border border-slate-300 text-slate-700 rounded hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmExtension}
                className="px-4 py-1.5 bg-slate-900 text-white font-semibold rounded hover:bg-slate-800"
              >
                Apply Extension
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return & Condition Inspection Modal */}
      {returningContract && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full p-5 text-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              Process Return &amp; Condition Inspection: {returningContract.contractNumber}
            </h3>
            <p className="text-slate-600">
              Inspect assets for damages or wear before closing contract and settling the ${returningContract.securityDeposit} security deposit.
            </p>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Returned Physical Condition *</label>
              <select
                value={returnCondition}
                onChange={(e) => setReturnCondition(e.target.value as AssetCondition)}
                className="w-full p-2 border border-slate-300 rounded outline-none"
              >
                <option value="EXCELLENT">Excellent - Ready for immediate re-lease</option>
                <option value="GOOD">Good - Nominal operational wear</option>
                <option value="FAIR">Fair - Minor cosmetic scratches</option>
                <option value="NEEDS_REPAIR">Needs Repair - Automated Maintenance Work Order will be triggered</option>
                <option value="DAMAGED">Damaged / Abuse - Deduct from Security Deposit</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Damage / Loss Charge ($)</label>
              <input
                type="number"
                value={damageCharge}
                onChange={(e) => setDamageCharge(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded font-mono outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                If damage charge &gt; 0, deposit is marked APPLIED_TO_DAMAGES.
              </span>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Inspection Checklist Notes</label>
              <textarea
                rows={3}
                value={inspectionNotes}
                onChange={(e) => setInspectionNotes(e.target.value)}
                placeholder="Hour meter readings, fuel level, hydraulic fluid check, physical damage notes..."
                className="w-full p-2 border border-slate-300 rounded outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setReturningContract(null)}
                className="px-3.5 py-1.5 border border-slate-300 text-slate-700 rounded hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReturn}
                className="px-4 py-1.5 bg-emerald-600 text-white font-semibold rounded hover:bg-emerald-700"
              >
                Complete Inspection &amp; Settle Deposit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
