import React, { useState } from 'react';
import { Asset, AssetStatus, HeavyEquipmentDocs } from '../types/index.ts';
import { api } from '../services/api.ts';
import { formatRupiahAmount } from '../shared/currency.tsx';
import { FleetGpsMap } from './FleetGpsMap.tsx';
import {
  Cpu,
  Search,
  Plus,
  History,
  X,
  Wrench,
  Calendar,
  DollarSign,
  Tag,
  CheckCircle2,
  Clock,
  AlertCircle,
  Truck,
  QrCode,
  FileText,
  Upload,
  Printer,
  ShieldCheck,
  AlertTriangle,
  Building2,
  FileCheck,
  Eye,
  MapPin,
  Navigation,
  Layers,
} from 'lucide-react';

interface AssetsViewProps {
  assets: Asset[];
  onRefresh: () => void;
}

export const AssetsView: React.FC<AssetsViewProps> = ({ assets, onRefresh }) => {
  const [assetViewMode, setAssetViewMode] = useState<'map' | 'table'>('map');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [docFilter, setDocFilter] = useState<string>('ALL');
  const [selectedAssetHistory, setSelectedAssetHistory] = useState<any | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [managingDocsAsset, setManagingDocsAsset] = useState<Asset | null>(null);
  const [printingLabelAsset, setPrintingLabelAsset] = useState<Asset | null>(null);

  // Registration Form State
  const [formData, setFormData] = useState({
    assetTag: '',
    serialNumber: '',
    name: '',
    category: 'Excavator & Earthmoving',
    brand: 'Caterpillar',
    model: '320D3',
    purchaseCost: '185000',
    dailyRentalRate: '450',
    weeklyRentalRate: '2600',
    monthlyRentalRate: '9500',
    sellPrice: '210000',
    warehouseLocation: 'Balikpapan Depot & Workshop',
    plateNumber: 'B 9821 TQ',
    chassisNumber: 'CAT320D-VIN-99021',
    engineNumber: 'C7.1-ENG-48921',
    hourMeter: '2450',
    // Legal Docs
    stnkNumber: 'STNK/POL/2025/9981',
    stnkExpiry: '2027-08-20',
    bpkbNumber: 'BPKB-A-8829104',
    siaNumber: 'SIA/DISN/EXC/2025/0812',
    siaExpiry: '2028-02-15',
    siaIssuer: 'Kemenaker RI - Pengawas K3',
  });

  // Manage Docs Modal State
  const [docsModalData, setDocsModalData] = useState<HeavyEquipmentDocs>({});
  const [stnkFilePreview, setStnkFilePreview] = useState<string | null>(null);
  const [bpkbFilePreview, setBpkbFilePreview] = useState<string | null>(null);
  const [siaFilePreview, setSiaFilePreview] = useState<string | null>(null);
  const [savingDocs, setSavingDocs] = useState(false);

  const filtered = assets.filter((a) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      a.name.toLowerCase().includes(q) ||
      a.assetTag.toLowerCase().includes(q) ||
      a.serialNumber.toLowerCase().includes(q) ||
      a.brand.toLowerCase().includes(q) ||
      (a.legalDocs?.plateNumber && a.legalDocs.plateNumber.toLowerCase().includes(q)) ||
      (a.legalDocs?.siaNumber && a.legalDocs.siaNumber.toLowerCase().includes(q));

    const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;
    const matchDoc =
      docFilter === 'ALL' ||
      (docFilter === 'VALID' && (!a.legalDocs?.documentStatus || a.legalDocs?.documentStatus === 'VALID')) ||
      (docFilter === 'EXPIRING' && a.legalDocs?.documentStatus === 'EXPIRING_SOON');

    return matchSearch && matchStatus && matchDoc;
  });

  const handleOpenHistory = async (asset: Asset) => {
    setLoadingHistory(true);
    try {
      const data = await api.getAssetHistory(asset.id);
      setSelectedAssetHistory(data);
    } catch (err: any) {
      alert(`Failed to load asset history: ${err.message}`);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.assetTag || !formData.serialNumber || !formData.name) {
      alert('Asset Tag, Serial Number, and Equipment Name are required.');
      return;
    }

    try {
      await api.createAsset({
        assetTag: formData.assetTag,
        serialNumber: formData.serialNumber,
        name: formData.name,
        category: formData.category,
        brand: formData.brand,
        model: formData.model,
        purchaseCost: parseFloat(formData.purchaseCost) || 0,
        dailyRentalRate: parseFloat(formData.dailyRentalRate) || 0,
        weeklyRentalRate: parseFloat(formData.weeklyRentalRate) || 0,
        monthlyRentalRate: parseFloat(formData.monthlyRentalRate) || 0,
        sellPrice: parseFloat(formData.sellPrice) || 0,
        warehouseLocation: formData.warehouseLocation,
        legalDocs: {
          plateNumber: formData.plateNumber,
          chassisNumber: formData.chassisNumber,
          engineNumber: formData.engineNumber,
          hourMeter: parseFloat(formData.hourMeter) || 0,
          stnkNumber: formData.stnkNumber,
          stnkExpiry: formData.stnkExpiry,
          stnkFileName: 'STNK_Original_Scanned.pdf',
          bpkbNumber: formData.bpkbNumber,
          bpkbFileName: 'BPKB_Arsip_Pusat.pdf',
          siaNumber: formData.siaNumber,
          siaExpiry: formData.siaExpiry,
          siaIssuer: formData.siaIssuer,
          siaFileName: 'SIA_Kelaikan_Kemenaker.pdf',
          documentStatus: 'VALID',
        },
      });

      alert(`Equipment ${formData.assetTag} (${formData.name}) was registered successfully.`);
      setShowCreateModal(false);
      onRefresh();
    } catch (err: any) {
      alert(`Failed to register asset: ${err.message}`);
    }
  };

  const handleOpenDocsModal = (asset: Asset) => {
    setManagingDocsAsset(asset);
    setDocsModalData(
      asset.legalDocs || {
        plateNumber: '',
        chassisNumber: '',
        engineNumber: '',
        hourMeter: 0,
        stnkNumber: '',
        stnkExpiry: '2028-12-31',
        bpkbNumber: '',
        siaNumber: '',
        siaExpiry: '2028-12-31',
        siaIssuer: 'Kemenaker RI',
        documentStatus: 'VALID',
      }
    );
    setStnkFilePreview(asset.legalDocs?.stnkFileUrl || null);
    setBpkbFilePreview(asset.legalDocs?.bpkbFileUrl || null);
    setSiaFilePreview(asset.legalDocs?.siaFileUrl || null);
  };

  const handleSaveDocs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingDocsAsset) return;

    setSavingDocs(true);
    try {
      await api.updateAssetDocuments(managingDocsAsset.id, {
        ...docsModalData,
        stnkFileUrl: stnkFilePreview || undefined,
        stnkFileName: stnkFilePreview ? 'STNK_Uploaded_Document.jpg' : docsModalData.stnkFileName,
        bpkbFileUrl: bpkbFilePreview || undefined,
        bpkbFileName: bpkbFilePreview ? 'BPKB_Uploaded_Document.jpg' : docsModalData.bpkbFileName,
        siaFileUrl: siaFilePreview || undefined,
        siaFileName: siaFilePreview ? 'SIA_Kelaikan_Uploaded.jpg' : docsModalData.siaFileName,
      });

      alert(`Compliance documents (STNK, BPKB, SIA) for asset ${managingDocsAsset.assetTag} were updated successfully.`);
      setManagingDocsAsset(null);
      onRefresh();
    } catch (err: any) {
      alert(`Failed to save documents: ${err.message}`);
    } finally {
      setSavingDocs(false);
    }
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getStatusBadge = (status: AssetStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">AVAILABLE</span>;
      case 'RENTED':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">RENTED</span>;
      case 'RESERVED':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">RESERVED</span>;
      case 'IN_MAINTENANCE':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">IN MAINTENANCE</span>;
      case 'SOLD':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">SOLD / DISPOSED</span>;
      case 'DISPOSED':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">DISPOSED</span>;
      default:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">{status}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 border border-slate-200 rounded-md">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-700" />
            <h2 className="text-base font-bold text-slate-900">
              Asset Registration &amp; Heavy Equipment Compliance
            </h2>
            <span className="text-xs text-slate-500 font-mono">({assets.length} fleet units)</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage vehicle registration (STNK), ownership documents (BPKB), and Ministry of Manpower equipment certificates (SIA), and print barcode labels.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Switcher: Map vs Table */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-300">
            <button
              type="button"
              onClick={() => setAssetViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition-colors ${
                assetViewMode === 'map'
                  ? 'bg-slate-900 text-amber-300 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Live GPS Map</span>
            </button>
            <button
              type="button"
              onClick={() => setAssetViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition-colors ${
                assetViewMode === 'table'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Catalog &amp; Compliance</span>
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            Register Heavy Equipment
          </button>
        </div>
      </div>

      {/* 1. Live fleet GPS telematics map */}
      {assetViewMode === 'map' && (
        <FleetGpsMap
          assets={assets}
          onOpenLegalDocs={(asset) => handleOpenDocsModal(asset)}
        />
      )}

      {/* Table & Legal Vault View */}
      {assetViewMode === 'table' && (
        <>
          {/* Filter and Search Bar */}
          <div className="bg-white p-3 rounded-md border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search tag, serial number, equipment name, plate, or SIA..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded font-mono outline-none focus:border-slate-800"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-2.5 border border-slate-300 rounded bg-slate-50 font-medium text-slate-700 outline-none cursor-pointer"
          >
            <option value="ALL">All Operational Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="RENTED">Rented</option>
            <option value="IN_MAINTENANCE">In Maintenance</option>
            <option value="RESERVED">Reserved</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={docFilter}
            onChange={(e) => setDocFilter(e.target.value)}
            className="w-full py-2 px-2.5 border border-slate-300 rounded bg-slate-50 font-medium text-slate-700 outline-none cursor-pointer"
          >
            <option value="ALL">All Compliance Statuses</option>
            <option value="VALID">Complete &amp; Valid</option>
            <option value="EXPIRING">Expiring Soon</option>
          </select>
        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-4">Tag Barcode / Serial</th>
                <th className="py-2.5 px-4">Equipment / Identification</th>
                <th className="py-2.5 px-4">Category &amp; Location</th>
                <th className="py-2.5 px-4">Compliance Documents (STNK, BPKB, SIA)</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-right">Monthly Rental Rate</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((asset) => {
                const docs = asset.legalDocs;
                return (
                  <tr key={asset.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Barcode & Serial */}
                    <td className="py-3 px-4 font-mono">
                      <div className="flex items-center gap-1.5">
                        <QrCode className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="font-bold text-slate-900">{asset.assetTag}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{asset.serialNumber}</div>
                    </td>

                    {/* Name & Plate */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{asset.name}</div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {asset.brand} · {asset.model}
                      </div>
                      <div className="text-[10px] font-mono text-slate-600 mt-0.5">
                        Plate: <span className="font-semibold text-slate-800">{docs?.plateNumber || 'B 9201 TQ'}</span> · HM: <span className="font-semibold">{docs?.hourMeter || 0} hrs</span>
                      </div>
                    </td>

                    {/* Category & Location */}
                    <td className="py-3 px-4">
                      <div className="text-slate-800 font-medium">{asset.category}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Truck className="w-3 h-3" />
                        <span>{asset.warehouseLocation}</span>
                      </div>
                    </td>

                    {/* Centralized Legal Documents */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1 py-0.2 rounded text-[10px]">
                            SIA
                          </span>
                          <span className="font-mono text-slate-800 text-[11px]">
                            {docs?.siaNumber || 'SIA-PENDING'}
                          </span>
                          <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                            Valid s/d {docs?.siaExpiry || '2028'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                          <span>STNK: {docs?.stnkNumber || 'STNK-OK'}</span>
                          <span>·</span>
                          <span>BPKB: {docs?.bpkbNumber || 'BPKB-OK'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">{getStatusBadge(asset.status)}</td>

                    {/* Rate */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatRupiahAmount(asset.monthlyRentalRate)}/mo
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Print Barcode Label */}
                        <button
                          type="button"
                          onClick={() => setPrintingLabelAsset(asset)}
                          title="Print the heavy equipment barcode / QR label"
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-indigo-600 cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>

                        {/* Upload / Manage Legal Docs */}
                        <button
                          type="button"
                          onClick={() => handleOpenDocsModal(asset)}
                          title="Manage and upload compliance documents (STNK/BPKB/SIA)"
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-emerald-700 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>

                        {/* Lifecycle Log */}
                        <button
                          type="button"
                          onClick={() => handleOpenHistory(asset)}
                          title="Complete usage and maintenance history"
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 cursor-pointer"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No equipment matches the selected search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* MODAL 1: Centralized Document Vault & Upload (STNK, BPKB, SIA) */}
      {managingDocsAsset && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-2xl w-full p-6 text-xs space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Compliance Documents: {managingDocsAsset.assetTag}
                  </h3>
                  <span className="text-[11px] text-slate-500">{managingDocsAsset.name}</span>
                </div>
              </div>
              <button onClick={() => setManagingDocsAsset(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDocs} className="flex-1 overflow-y-auto space-y-5 pr-1">
              {/* Unit Identifiers */}
              <div className="p-3 bg-slate-50 rounded border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-500 text-[10px] uppercase font-semibold">License Plate</label>
                  <input
                    type="text"
                    value={docsModalData.plateNumber || ''}
                    onChange={(e) => setDocsModalData({ ...docsModalData, plateNumber: e.target.value })}
                    placeholder="B 9821 TQ"
                    className="w-full p-1.5 border border-slate-300 rounded font-mono font-bold text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] uppercase font-semibold">Chassis Number (VIN)</label>
                  <input
                    type="text"
                    value={docsModalData.chassisNumber || ''}
                    onChange={(e) => setDocsModalData({ ...docsModalData, chassisNumber: e.target.value })}
                    placeholder="CHASSIS-VIN-01"
                    className="w-full p-1.5 border border-slate-300 rounded font-mono text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] uppercase font-semibold">Engine Number</label>
                  <input
                    type="text"
                    value={docsModalData.engineNumber || ''}
                    onChange={(e) => setDocsModalData({ ...docsModalData, engineNumber: e.target.value })}
                    placeholder="ENG-9982"
                    className="w-full p-1.5 border border-slate-300 rounded font-mono text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] uppercase font-semibold">Hour Meter (HM)</label>
                  <input
                    type="number"
                    value={docsModalData.hourMeter || 0}
                    onChange={(e) => setDocsModalData({ ...docsModalData, hourMeter: parseFloat(e.target.value) || 0 })}
                    className="w-full p-1.5 border border-slate-300 rounded font-mono font-bold text-slate-900 bg-white"
                  />
                </div>
              </div>

              {/* 1. SIA Section */}
              <div className="p-4 rounded-lg border border-indigo-200 bg-indigo-50/30 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-700" />
                    <span className="font-bold text-indigo-950">1. SIA (Ministry of Manpower Equipment Certificate)</span>
                  </div>
                  <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                    Required for heavy equipment
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">SIA Registration Number *</label>
                    <input
                      type="text"
                      required
                      value={docsModalData.siaNumber || ''}
                      onChange={(e) => setDocsModalData({ ...docsModalData, siaNumber: e.target.value })}
                      placeholder="SIA/DISN/EXC/2025/0812"
                      className="w-full p-2 border border-slate-300 rounded font-mono bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">SIA Expiry Date *</label>
                    <input
                      type="date"
                      required
                      value={docsModalData.siaExpiry || ''}
                      onChange={(e) => setDocsModalData({ ...docsModalData, siaExpiry: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded font-mono bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Instansi Penerbit / Pengawas</label>
                    <input
                      type="text"
                      value={docsModalData.siaIssuer || ''}
                      onChange={(e) => setDocsModalData({ ...docsModalData, siaIssuer: e.target.value })}
                      placeholder="Ministry of Manpower (Kemenaker) / Regional Manpower Office"
                      className="w-full p-2 border border-slate-300 rounded bg-white"
                    />
                  </div>
                </div>

                {/* Upload SIA */}
                <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-indigo-100">
                  <div className="flex items-center gap-3">
                    <label className="px-3 py-1.5 bg-white border border-indigo-300 text-indigo-800 rounded font-semibold text-xs hover:bg-indigo-50 cursor-pointer flex items-center gap-2">
                      <Upload className="w-3.5 h-3.5" />
                      Upload SIA Certificate (PDF / Image)
                      <input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, setSiaFilePreview)} className="hidden" />
                    </label>
                    {siaFilePreview && (
                      <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> SIA file attached
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">File is securely stored on the centralized ERP server</span>
                </div>
              </div>

              {/* 2. STNK Section */}
              <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-700" />
                    <span className="font-bold text-slate-900">2. STNK (Vehicle Registration Certificate)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">STNK Number</label>
                    <input
                      type="text"
                      value={docsModalData.stnkNumber || ''}
                      onChange={(e) => setDocsModalData({ ...docsModalData, stnkNumber: e.target.value })}
                      placeholder="STNK/POL/2025/9981"
                      className="w-full p-2 border border-slate-300 rounded font-mono bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">STNK Tax Expiry Date</label>
                    <input
                      type="date"
                      value={docsModalData.stnkExpiry || ''}
                      onChange={(e) => setDocsModalData({ ...docsModalData, stnkExpiry: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded font-mono bg-white"
                    />
                  </div>
                </div>

                {/* Upload STNK */}
                <div className="pt-2 flex items-center gap-3">
                  <label className="px-3 py-1.5 bg-slate-50 border border-slate-300 text-slate-700 rounded font-semibold text-xs hover:bg-slate-100 cursor-pointer flex items-center gap-2">
                    <Upload className="w-3.5 h-3.5" />
                    Upload STNK Document
                    <input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, setStnkFilePreview)} className="hidden" />
                  </label>
                  {stnkFilePreview && (
                    <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> STNK attached
                    </span>
                  )}
                </div>
              </div>

              {/* 3. BPKB Section */}
              <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-700" />
                    <span className="font-bold text-slate-900">3. BPKB (Vehicle Ownership Certificate)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">BPKB Number</label>
                    <input
                      type="text"
                      value={docsModalData.bpkbNumber || ''}
                      onChange={(e) => setDocsModalData({ ...docsModalData, bpkbNumber: e.target.value })}
                      placeholder="BPKB-A-8829104"
                      className="w-full p-2 border border-slate-300 rounded font-mono bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Issuing Authority / Police Department</label>
                    <input
                      type="text"
                      value={docsModalData.bpkbIssuer || 'Ditlantas Polda Metro Jaya'}
                      onChange={(e) => setDocsModalData({ ...docsModalData, bpkbIssuer: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded bg-white"
                    />
                  </div>
                </div>

                {/* Upload BPKB */}
                <div className="pt-2 flex items-center gap-3">
                  <label className="px-3 py-1.5 bg-slate-50 border border-slate-300 text-slate-700 rounded font-semibold text-xs hover:bg-slate-100 cursor-pointer flex items-center gap-2">
                    <Upload className="w-3.5 h-3.5" />
                    Upload BPKB Document
                    <input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, setBpkbFilePreview)} className="hidden" />
                  </label>
                  {bpkbFilePreview && (
                    <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> BPKB attached
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setManagingDocsAsset(null)}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDocs}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded cursor-pointer disabled:opacity-50"
                >
                  {savingDocs ? 'Saving...' : 'Save All Documents'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Printable Barcode & QR Label */}
      {printingLabelAsset && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-300 max-w-sm w-full p-6 text-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Heavy Equipment Barcode Label
              </h3>
              <button onClick={() => setPrintingLabelAsset(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Industrial Tag Style Container */}
            <div className="bg-white border-2 border-slate-900 rounded-lg p-4 shadow-sm space-y-3 text-center">
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
                <span className="font-bold text-xs uppercase tracking-tight text-slate-900">
                  Apex Heavy Fleet Registry
                </span>
                <span className="font-mono text-[10px] font-bold text-slate-600">CENTRALIZED</span>
              </div>

              <div className="py-2">
                <QrCode className="w-24 h-24 text-slate-900 mx-auto" />
                <div className="font-mono text-base font-extrabold tracking-widest text-slate-900 mt-1">
                  *{printingLabelAsset.assetTag}*
                </div>
              </div>

              <div className="text-left bg-slate-50 p-2.5 rounded border border-slate-300 space-y-1 font-mono text-[10px]">
                <div><span className="text-slate-500">UNIT:</span> <strong className="text-slate-900">{printingLabelAsset.name}</strong></div>
                <div><span className="text-slate-500">SERIAL:</span> {printingLabelAsset.serialNumber}</div>
                <div><span className="text-slate-500">PLAT NO:</span> {printingLabelAsset.legalDocs?.plateNumber || 'B 9821 TQ'}</div>
                <div><span className="text-slate-500">SIA NO:</span> {printingLabelAsset.legalDocs?.siaNumber || 'SIA-KEM-2025'}</div>
                <div><span className="text-slate-500">BRANCH:</span> {printingLabelAsset.warehouseLocation}</div>
              </div>

              <p className="text-[9px] text-slate-500 italic">
                Scan with a smartphone camera to record daily status (Working / Damaged) or create a repair ticket.
              </p>
            </div>

            <div className="no-print pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPrintingLabelAsset(null)}
                className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Asset Label
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Register New Heavy Equipment Asset Tag Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col p-6 text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900">Heavy Equipment Registration &amp; Compliance Documents</h3>
                <span className="text-[11px] text-slate-500">Asset identification and STNK, BPKB, and SIA compliance records</span>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAsset} className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Asset Tag Barcode *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., AST-10028"
                    value={formData.assetTag}
                    onChange={(e) => setFormData({ ...formData, assetTag: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded font-mono font-bold focus:border-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Manufacturer Serial Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., CAT-SN-99821"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded font-mono focus:border-slate-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Equipment Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Caterpillar 320D3 Hydraulic Excavator, 20 Ton"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded font-medium focus:border-slate-800 outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Equipment Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 outline-none"
                  >
                    <option value="Excavator & Earthmoving">Excavator &amp; Earthmoving</option>
                    <option value="Mobile & Tower Crane">Mobile &amp; Tower Crane</option>
                    <option value="Bulldozer & Motor Grader">Bulldozer &amp; Motor Grader</option>
                    <option value="Material Handling & Forklift">Material Handling &amp; Forklift</option>
                    <option value="Power Generation & Genset">Power Generation &amp; Genset</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Merk / Brand</label>
                  <input
                    type="text"
                    placeholder="Caterpillar, Komatsu, Kobelco"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Type / Model</label>
                  <input
                    type="text"
                    placeholder="320D3, PC200-10M0"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded outline-none"
                  />
                </div>
              </div>

              {/* Physical Identifiers */}
              <div className="p-3 bg-slate-50 rounded border border-slate-200 grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">License Plate</label>
                  <input
                    type="text"
                    placeholder="B 9821 TQ"
                    value={formData.plateNumber}
                    onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded font-mono font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Chassis Number</label>
                  <input
                    type="text"
                    placeholder="CAT320-VIN"
                    value={formData.chassisNumber}
                    onChange={(e) => setFormData({ ...formData, chassisNumber: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Hour Meter Awal</label>
                  <input
                    type="number"
                    value={formData.hourMeter}
                    onChange={(e) => setFormData({ ...formData, hourMeter: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded font-mono font-bold bg-white"
                  />
                </div>
              </div>

              {/* Legal Documents Inputs */}
              <div className="p-3 bg-indigo-50/50 rounded border border-indigo-200 space-y-3">
                <span className="font-bold text-indigo-900 block">Compliance Documents &amp; Initial Certification</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">SIA Permit Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="SIA/DISN/EXC/2026/0129"
                      value={formData.siaNumber}
                      onChange={(e) => setFormData({ ...formData, siaNumber: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded font-mono bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">SIA Expiry Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.siaExpiry}
                      onChange={(e) => setFormData({ ...formData, siaExpiry: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded font-mono bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">STNK Number</label>
                    <input
                      type="text"
                      value={formData.stnkNumber}
                      onChange={(e) => setFormData({ ...formData, stnkNumber: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded font-mono bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">BPKB Number</label>
                    <input
                      type="text"
                      value={formData.bpkbNumber}
                      onChange={(e) => setFormData({ ...formData, bpkbNumber: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded font-mono bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Commercial Valuation */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Purchase Price (IDR)</label>
                  <input
                    type="number"
                    value={formData.purchaseCost}
                    onChange={(e) => setFormData({ ...formData, purchaseCost: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Daily Rental Rate (IDR)</label>
                  <input
                    type="number"
                    value={formData.dailyRentalRate}
                    onChange={(e) => setFormData({ ...formData, dailyRentalRate: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Monthly Rental Rate (IDR)</label>
                  <input
                    type="number"
                    value={formData.monthlyRentalRate}
                    onChange={(e) => setFormData({ ...formData, monthlyRentalRate: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Warehouse / Workshop / Site Location</label>
                <select
                  value={formData.warehouseLocation}
                  onChange={(e) => setFormData({ ...formData, warehouseLocation: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800"
                >
                  <option value="Balikpapan Depot & Workshop">Balikpapan Depot &amp; Workshop</option>
                  <option value="Site Project Morowali">Site Project Morowali</option>
                  <option value="Site IKN Nusantara">Site IKN Nusantara</option>
                  <option value="Jakarta Central Depot">Jakarta Central Depot</option>
                  <option value="Surabaya Branch">Surabaya Branch</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded font-semibold hover:bg-slate-800 cursor-pointer"
                >
                  Save &amp; Generate Barcode Tag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Asset Lifecycle History Modal */}
      {selectedAssetHistory && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Lifecycle History: {selectedAssetHistory.asset.assetTag}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedAssetHistory.asset.name} · Serial: {selectedAssetHistory.asset.serialNumber}
                </p>
              </div>
              <button
                onClick={() => setSelectedAssetHistory(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Asset Technical Specifications */}
              <div className="bg-slate-50 p-3.5 rounded border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-slate-400 block text-[11px]">Current Status</span>
                  <span className="font-semibold text-slate-800">{selectedAssetHistory.asset.status}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Physical Condition</span>
                  <span className="font-semibold text-slate-800">{selectedAssetHistory.asset.condition}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">SIA Number</span>
                  <span className="font-semibold font-mono text-slate-800">{selectedAssetHistory.asset.legalDocs?.siaNumber || 'SIA-OK'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Hour Meter (HM)</span>
                  <span className="font-semibold font-mono text-slate-800">{selectedAssetHistory.asset.legalDocs?.hourMeter || 0} hrs</span>
                </div>
              </div>

              {/* Maintenance Work Orders */}
              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-slate-500" />
                  Service &amp; Barcode Repair History ({selectedAssetHistory.workOrders?.length || 0})
                </h4>
                {selectedAssetHistory.workOrders?.length > 0 ? (
                  <div className="space-y-2">
                    {selectedAssetHistory.workOrders.map((wo: any) => (
                      <div key={wo.id} className="p-2.5 border border-slate-200 rounded bg-white">
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-semibold text-slate-900">{wo.workOrderNumber}</span>
                          <span className="font-bold font-mono text-slate-800">Cost: {formatRupiahAmount(wo.totalCost)}</span>
                        </div>
                        <div className="text-slate-700 mt-1 font-medium">{wo.title}</div>
                        <div className="text-slate-500 text-[11px] mt-0.5">{wo.description}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No repair tickets recorded.</p>
                )}
              </div>

              {/* Status Checks Submitted by Operators */}
              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Field Inspection Reports ({selectedAssetHistory.statusLogs?.length || 0})
                </h4>
                {selectedAssetHistory.statusLogs?.length > 0 ? (
                  <div className="space-y-2">
                    {selectedAssetHistory.statusLogs.map((log: any) => (
                      <div key={log.id} className="p-2.5 border border-slate-200 rounded bg-white flex justify-between items-center">
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span>{log.status === 'WORKING' ? 'WORKING / NORMAL' : 'DAMAGED / BREAKDOWN'}</span>
                            <span className="text-[10px] text-slate-400 font-normal">by {log.submittedBy}</span>
                          </div>
                          <div className="text-slate-500 text-[11px]">{log.damageDescription || log.location}</div>
                        </div>
                        <div className="text-right font-mono text-[11px] text-slate-600">
                          HM: {log.hourMeter} hrs
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No daily inspection logs recorded.</p>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedAssetHistory(null)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
