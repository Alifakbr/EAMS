import React, { useState, useEffect } from 'react';
import { WorkOrder, Asset, HeavyEquipmentOperator, AssetDailyStatusLog, Customer } from '../types/index.ts';
import { api } from '../services/api.ts';
<<<<<<< HEAD
import { formatRupiahAmount } from '../shared/currency.tsx';
=======
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
import {
  Wrench,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  DollarSign,
  X,
  QrCode,
  Search,
  Camera,
  FileCheck,
  ShieldAlert,
  Calendar,
  Building2,
  Upload,
  UserCheck,
  AlertCircle,
  Truck,
  FileText,
  Printer,
  RefreshCw,
  Trash2,
  Users,
} from 'lucide-react';

interface MaintenanceViewProps {
  workOrders: WorkOrder[];
  assets: Asset[];
  customers?: Customer[];
  onRefresh: () => void;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  workOrders,
  assets,
  customers = [],
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'WORK_ORDERS' | 'OPERATORS_SIO' | 'DAILY_STATUS_LOGS'>('WORK_ORDERS');

  // Work Orders & Barcode Repair
  const [scannedBarcode, setScannedBarcode] = useState('AST-10024');
  const [scannedAsset, setScannedAsset] = useState<Asset | null>(assets[0] || null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [completingWo, setCompletingWo] = useState<WorkOrder | null>(null);
<<<<<<< HEAD
  const [resolutionNotes, setResolutionNotes] = useState('All hydraulic components and filters have been replaced. Pressure test stable at 3,500 PSI.');
=======
  const [resolutionNotes, setResolutionNotes] = useState('Semua komponen hidrolik dan filter telah diganti baru. Uji tekanan stabil 3,500 PSI.');
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
  const [printingCertWo, setPrintingCertWo] = useState<WorkOrder | null>(null);

  // Operators & SIO State
  const [operators, setOperators] = useState<HeavyEquipmentOperator[]>([]);
  const [loadingOperators, setLoadingOperators] = useState(false);
  const [showAddOperatorModal, setShowAddOperatorModal] = useState(false);
  const [sioFilePreview, setSioFilePreview] = useState<string | null>(null);

  // Status Logs
  const [statusLogs, setStatusLogs] = useState<AssetDailyStatusLog[]>([]);

  // Create Work Order Form State
  const [assetId, setAssetId] = useState(assets[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [type, setType] = useState<'PREVENTIVE' | 'CORRECTIVE' | 'RENTAL_RETURN_INSPECTION'>('CORRECTIVE');
  const [partsCost, setPartsCost] = useState('350');
  const [laborCost, setLaborCost] = useState('250');
<<<<<<< HEAD
  const [technician, setTechnician] = useState('Derrick Vance (Field Service Manager)');
=======
  const [technician, setTechnician] = useState('Derrick Vance (Kepala Mekanik Lapangan)');
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443

  // New Operator Form State
  const [newOpName, setNewOpName] = useState('');
  const [newOpBadge, setNewOpBadge] = useState('');
  const [newOpPhone, setNewOpPhone] = useState('');
  const [newOpSioNumber, setNewOpSioNumber] = useState('');
  const [newOpSioClass, setNewOpSioClass] = useState<'KELAS_1' | 'KELAS_2' | 'KELAS_3'>('KELAS_1');
  const [newOpSioExpiry, setNewOpSioExpiry] = useState('2028-12-31');
  const [newOpSpecialization, setNewOpSpecialization] = useState('Excavator 20-30 Ton & Earthmoving');
  const [newOpAssignedAsset, setNewOpAssignedAsset] = useState('');
  const [newOpLocation, setNewOpLocation] = useState('Site Project Morowali');

  // Assignment Modal State (Pemilihan siapa operator, project, client, dan alat mana)
  const [assigningOp, setAssigningOp] = useState<HeavyEquipmentOperator | null>(null);
  const [assignCustomerId, setAssignCustomerId] = useState('');
  const [assignProjectName, setAssignProjectName] = useState('');
  const [assignAssetId, setAssignAssetId] = useState('');

  const handleOpenAssignModal = (op: HeavyEquipmentOperator) => {
    setAssigningOp(op);
    setAssignCustomerId(op.assignedCustomerId || (customers[0]?.id || ''));
<<<<<<< HEAD
    setAssignProjectName(op.assignedProjectName || op.currentProjectLocation || 'Project Site');
=======
    setAssignProjectName(op.assignedProjectName || op.currentProjectLocation || 'Site Proyek');
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
    setAssignAssetId(op.assignedAssetId || (assets[0]?.id || ''));
  };

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningOp) return;

    const cust = customers.find((c) => c.id === assignCustomerId);
    const asset = assets.find((a) => a.id === assignAssetId);

    try {
      await api.assignOperator(assigningOp.id, {
        customerId: cust?.id,
        customerName: cust?.name,
        projectName: assignProjectName,
        assetId: asset?.id,
        assetTag: asset?.assetTag,
        assetName: asset?.name,
      });

      alert(
<<<<<<< HEAD
        `Assignment saved! Operator ${assigningOp.name} assigned to client: ${cust?.name || 'Internal'}, project: ${assignProjectName}, equipment: ${asset?.assetTag || 'Standby'}.`
=======
        `Penugasan berhasil disimpan! Operator ${assigningOp.name} ditugaskan pada Client: ${cust?.name || 'Internal'}, Proyek: ${assignProjectName}, Alat: ${asset?.assetTag || 'Standby'}.`
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
      );
      setAssigningOp(null);
      await loadOperators();
    } catch (err: any) {
<<<<<<< HEAD
      alert(`Failed to save operator assignment: ${err.message}`);
=======
      alert(`Gagal menyimpan penugasan operator: ${err.message}`);
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
    }
  };

  const handleDeleteOperator = async (opId: string, name: string) => {
<<<<<<< HEAD
    if (!confirm(`Delete operator ${name} from the system?`)) return;
    try {
      await api.deleteOperator(opId);
      alert(`Operator ${name} was deleted successfully.`);
      await loadOperators();
    } catch (err: any) {
      alert(`Failed to delete operator: ${err.message}`);
=======
    if (!confirm(`Hapus data operator ${name} dari sistem?`)) return;
    try {
      await api.deleteOperator(opId);
      alert(`Operator ${name} berhasil dihapus.`);
      await loadOperators();
    } catch (err: any) {
      alert(`Gagal menghapus operator: ${err.message}`);
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
    }
  };

  const loadOperators = async () => {
    setLoadingOperators(true);
    try {
      const res = await api.getOperators();
      setOperators(res.data);
    } catch (err) {
      console.error('Failed to load operators:', err);
    } finally {
      setLoadingOperators(false);
    }
  };

  const loadStatusLogs = async () => {
    try {
      const res = await api.getStatusLogs();
      setStatusLogs(res.data);
    } catch (err) {
      console.error('Failed to load status logs:', err);
    }
  };

  useEffect(() => {
    loadOperators();
    loadStatusLogs();
  }, []);

  const handleBarcodeLookup = (code: string) => {
    setScannedBarcode(code);
    const found = assets.find(
      (a) =>
        a.assetTag.toLowerCase() === code.trim().toLowerCase() ||
        a.serialNumber.toLowerCase() === code.trim().toLowerCase() ||
        a.legalDocs?.plateNumber?.toLowerCase() === code.trim().toLowerCase()
    );
    if (found) {
      setScannedAsset(found);
      setAssetId(found.id);
<<<<<<< HEAD
      setTitle(`Equipment Repair: ${found.name}`);
    } else {
      alert(`Equipment with barcode/tag "${code}" was not found.`);
=======
      setTitle(`Perbaikan Kerusakan Alat: ${found.name}`);
    } else {
      alert(`Alat berat dengan barcode/tag "${code}" tidak ditemukan.`);
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
    }
  };

  const handleCreateWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId || !title) {
<<<<<<< HEAD
      alert('Equipment and repair work order title are required.');
=======
      alert('Alat berat dan Judul Pekerjaan Perbaikan wajib diisi.');
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
      return;
    }

    try {
      await api.createWorkOrder({
        assetId,
        title,
        description,
        priority,
        type,
        partsCost: parseFloat(partsCost) || 0,
        laborCost: parseFloat(laborCost) || 0,
        assignedTechnician: technician,
      });

<<<<<<< HEAD
      alert('Repair ticket created and awaiting Manager approval.');
      setShowCreateModal(false);
      onRefresh();
    } catch (err: any) {
      alert(`Failed to create repair ticket: ${err.message}`);
=======
      alert('Tiket perbaikan alat berat via Barcode berhasil diterbitkan! Status alat dialihkan ke IN_MAINTENANCE.');
      setShowCreateModal(false);
      onRefresh();
    } catch (err: any) {
      alert(`Gagal membuat tiket perbaikan: ${err.message}`);
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
    }
  };

  const handleCompleteWorkOrder = async () => {
    if (!completingWo) return;

    try {
      await api.completeWorkOrder(completingWo.id, resolutionNotes);
<<<<<<< HEAD
      alert(`Repair ticket ${completingWo.workOrderNumber} is complete. The equipment is AVAILABLE and safe to operate.`);
      setCompletingWo(null);
      onRefresh();
    } catch (err: any) {
      alert(`Failed to complete ticket: ${err.message}`);
=======
      alert(`Tiket Perbaikan ${completingWo.workOrderNumber} telah SELESAI (COMPLETED). Alat berat kembali ke status AVAILABLE & laik jalan!`);
      setCompletingWo(null);
      onRefresh();
    } catch (err: any) {
      alert(`Gagal menyelesaikan tiket: ${err.message}`);
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
    }
  };

  const handleCreateOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOpName || !newOpSioNumber) {
<<<<<<< HEAD
      alert('Operator name and SIO certificate number are required.');
=======
      alert('Nama Operator dan Nomor SIO Kemenaker wajib diisi.');
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
      return;
    }

    try {
      const assigned = assets.find((a) => a.id === newOpAssignedAsset);
      await api.createOperator({
        name: newOpName,
        badgeNumber: newOpBadge || `OPR-${Date.now().toString().slice(-3)}`,
        phone: newOpPhone,
        sioNumber: newOpSioNumber,
        sioClass: newOpSioClass,
        sioExpiry: newOpSioExpiry,
        equipmentSpecialization: newOpSpecialization,
        assignedAssetId: assigned ? assigned.id : null,
        assignedAssetName: assigned ? assigned.name : null,
        currentProjectLocation: newOpLocation,
        sioFileUrl: sioFilePreview || undefined,
        sioFileName: sioFilePreview ? 'SIO_Kemenaker_Uploaded.jpg' : 'SIO_Dokumen_Resmi.pdf',
        status: 'ACTIVE',
      });

<<<<<<< HEAD
      alert(`Operator ${newOpName} with SIO ${newOpSioNumber} was registered successfully.`);
=======
      alert(`Operator ${newOpName} dengan SIO ${newOpSioNumber} berhasil didaftarkan di Field Operation!`);
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
      setShowAddOperatorModal(false);
      setNewOpName('');
      setNewOpBadge('');
      setNewOpPhone('');
      setNewOpSioNumber('');
      setSioFilePreview(null);
      await loadOperators();
    } catch (err: any) {
<<<<<<< HEAD
      alert(`Failed to register operator: ${err.message}`);
=======
      alert(`Gagal mendaftarkan operator: ${err.message}`);
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 border border-slate-200 rounded-md shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-indigo-700" />
            <h1 className="text-base font-bold text-slate-900">
<<<<<<< HEAD
              Field Operations &amp; Barcode Repair
            </h1>
            <span className="text-xs text-slate-500 font-mono">({workOrders.length} active tickets)</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Heavy equipment repair center with barcode scanning and operator safety certificate (SIO) management.
=======
              Operasional Lapangan &amp; Perbaikan Barcode (Field Operations)
            </h1>
            <span className="text-xs text-slate-500 font-mono">({workOrders.length} tiket aktif)</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pusat perbaikan alat berat berbasis scan barcode dan pengelolaan lisensi kualifikasi operator (SIO Kemenaker).
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'WORK_ORDERS' ? (
            <button
              onClick={() => {
                if (scannedAsset) {
                  setAssetId(scannedAsset.id);
<<<<<<< HEAD
                  setTitle(`Equipment Repair: ${scannedAsset.name}`);
=======
                  setTitle(`Perbaikan Unit: ${scannedAsset.name}`);
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                }
                setShowCreateModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-400" />
<<<<<<< HEAD
              Create Repair Ticket by Barcode
=======
              Catat Perbaikan via Barcode
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
            </button>
          ) : activeTab === 'OPERATORS_SIO' ? (
            <button
              onClick={() => setShowAddOperatorModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded shadow-xs cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-amber-400" />
<<<<<<< HEAD
              Add Operator &amp; SIO Certificate
=======
              Tambah Operator &amp; SIO Baru
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
            </button>
          ) : (
            <button
              onClick={loadStatusLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-300 hover:bg-slate-50 text-slate-700 rounded cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
<<<<<<< HEAD
              Refresh Status Logs
=======
              Refresh Data Log
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 bg-white px-3 pt-2 rounded-t-md text-xs font-semibold">
        <button
          onClick={() => setActiveTab('WORK_ORDERS')}
          className={`px-4 py-2.5 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'WORK_ORDERS'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wrench className="w-4 h-4" />
<<<<<<< HEAD
          <span>Barcode Repairs &amp; Work Orders ({workOrders.length})</span>
=======
          <span>Perbaikan Barcode &amp; Work Orders ({workOrders.length})</span>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
        </button>

        <button
          onClick={() => setActiveTab('OPERATORS_SIO')}
          className={`px-4 py-2.5 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'OPERATORS_SIO'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
<<<<<<< HEAD
          <span>Field Operators &amp; SIO Licenses ({operators.length})</span>
=======
          <span>Operator Lapangan &amp; Lisensi SIO ({operators.length})</span>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
        </button>

        <button
          onClick={() => setActiveTab('DAILY_STATUS_LOGS')}
          className={`px-4 py-2.5 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'DAILY_STATUS_LOGS'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
<<<<<<< HEAD
          <span>Daily Equipment Status Reports ({statusLogs.length})</span>
=======
          <span>Laporan Harian Status Alat ({statusLogs.length})</span>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
        </button>
      </div>

      {/* TAB 1: WORK ORDERS & BARCODE REPAIR */}
      {activeTab === 'WORK_ORDERS' && (
        <div className="space-y-4">
          {/* Barcode Quick Repair Panel */}
          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <QrCode className="w-4 h-4 text-indigo-600" />
<<<<<<< HEAD
                <span>Heavy Equipment Barcode Scanner for Service / Repairs</span>
              </div>
              <span className="text-[11px] text-slate-400">Scan an equipment tag to create a repair log</span>
=======
                <span>Pemindai Cepat Barcode Alat Berat untuk Servis / Perbaikan</span>
              </div>
              <span className="text-[11px] text-slate-400">Pindai tag mesin untuk log perbaikan instan</span>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-8 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
<<<<<<< HEAD
                  placeholder="Enter equipment barcode (e.g., AST-10024, AST-10088)..."
=======
                  placeholder="Ketik Tag Barcode Alat Berat (cth: AST-10024, AST-10088)..."
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  value={scannedBarcode}
                  onChange={(e) => setScannedBarcode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleBarcodeLookup(scannedBarcode);
                  }}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded font-mono outline-none focus:border-indigo-600"
                />
              </div>

              <div className="sm:col-span-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleBarcodeLookup(scannedBarcode)}
                  className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
<<<<<<< HEAD
                  Search
=======
                  Pindai / Lookup
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                </button>
              </div>
            </div>

            {/* Scanned Machine Card */}
            {scannedAsset && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 bg-white border border-slate-300 px-2 py-0.5 rounded">
                      {scannedAsset.assetTag}
                    </span>
                    <span className="font-bold text-slate-900">{scannedAsset.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {scannedAsset.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 font-mono">
<<<<<<< HEAD
                    Plate: {scannedAsset.legalDocs?.plateNumber || 'B 9821 TQ'} · SIA: {scannedAsset.legalDocs?.siaNumber || 'SIA-2026'} · Location: {scannedAsset.warehouseLocation}
=======
                    Plat: {scannedAsset.legalDocs?.plateNumber || 'B 9821 TQ'} · SIA: {scannedAsset.legalDocs?.siaNumber || 'SIA-2026'} · Lokasi: {scannedAsset.warehouseLocation}
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAssetId(scannedAsset.id);
<<<<<<< HEAD
                    setTitle(`Repair ${scannedAsset.name} (${scannedAsset.assetTag})`);
=======
                    setTitle(`Perbaikan Unit ${scannedAsset.name} (${scannedAsset.assetTag})`);
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                    setShowCreateModal(true);
                  }}
                  className="px-3.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Wrench className="w-3.5 h-3.5 text-amber-400" />
<<<<<<< HEAD
                  Create Repair Work Order
=======
                  Buka Work Order Perbaikan Unit Ini
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                </button>
              </div>
            )}
          </div>

          {/* Work Orders Table */}
          <div className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
<<<<<<< HEAD
                    <th className="py-2.5 px-4">WO # / Date</th>
                    <th className="py-2.5 px-4">Barcode Tag &amp; Equipment</th>
                    <th className="py-2.5 px-4">Repair Title &amp; Issue</th>
                    <th className="py-2.5 px-4">Technician / Mechanic</th>
                    <th className="py-2.5 px-4 text-center">Priority / Type</th>
                    <th className="py-2.5 px-4 text-right">Service Cost (IDR)</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                    <th className="py-2.5 px-4 text-right">Mechanic Actions</th>
=======
                    <th className="py-2.5 px-4">WO # / Tanggal</th>
                    <th className="py-2.5 px-4">Tag Barcode &amp; Alat Berat</th>
                    <th className="py-2.5 px-4">Judul Perbaikan &amp; Kendala</th>
                    <th className="py-2.5 px-4">Teknisi / Mekanik</th>
                    <th className="py-2.5 px-4 text-center">Prioritas / Tipe</th>
                    <th className="py-2.5 px-4 text-right">Biaya Servis ($)</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                    <th className="py-2.5 px-4 text-right">Aksi Mekanik</th>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {workOrders.map((wo) => {
                    const isOpen = wo.status === 'SCHEDULED' || wo.status === 'IN_PROGRESS';
                    return (
                      <tr key={wo.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono">
                          <div className="font-bold text-slate-900">{wo.workOrderNumber}</div>
                          <div className="text-[11px] text-slate-400">{wo.scheduledDate}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-slate-900 flex items-center gap-1">
                            <QrCode className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span>{wo.assetTag}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">{wo.assetName}</div>
                        </td>

                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-semibold text-slate-900">{wo.title}</div>
                          <div className="text-[11px] text-slate-500 truncate">{wo.description}</div>
                        </td>

                        <td className="py-3 px-4 font-medium text-slate-800">{wo.assignedTechnician}</td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              wo.priority === 'CRITICAL'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : wo.priority === 'HIGH'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {wo.priority}
                          </span>
                          <div className="text-[9px] text-slate-400 uppercase mt-0.5">{wo.type}</div>
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
<<<<<<< HEAD
                          {formatRupiahAmount(wo.totalCost)}
=======
                          ${wo.totalCost?.toFixed(2)}
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              wo.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {wo.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {isOpen ? (
                              <button
                                type="button"
                                onClick={() => setCompletingWo(wo)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3 h-3" />
<<<<<<< HEAD
                                Complete Service
=======
                                Selesaikan Servis
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setPrintingCertWo(wo)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                <Printer className="w-3 h-3" />
<<<<<<< HEAD
                                Service Certificate
=======
                                Sertifikat Servis
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: OPERATOR ALAT BERAT & SIO MANAGEMENT */}
      {activeTab === 'OPERATORS_SIO' && (
        <div className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-2xs space-y-3 p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
<<<<<<< HEAD
                Heavy Equipment Operator Directory &amp; SIO Qualification Documents
              </h3>
              <p className="text-xs text-slate-500">
                Track K3 operator competency certificates (SIO Classes 1, 2, 3), license expiry, and assigned equipment.
=======
                Direktori Operator Alat Berat &amp; Dokumen Kualifikasi SIO
              </h3>
              <p className="text-xs text-slate-500">
                Pengawasan sertifikat kompetensi K3 Kemenaker (SIO Kelas 1, 2, 3), masa berlaku lisensi, dan unit yang ditugaskan.
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
              </p>
            </div>
            <span className="text-[11px] font-mono font-semibold px-2 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              K3 Kemenaker Standard
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
<<<<<<< HEAD
                  <th className="py-2.5 px-3">Operator / Badge ID</th>
                  <th className="py-2.5 px-3">SIO &amp; Class</th>
                  <th className="py-2.5 px-3">Specialization</th>
                  <th className="py-2.5 px-3">Assigned Client &amp; Project</th>
                  <th className="py-2.5 px-3">Assigned Equipment</th>
                  <th className="py-2.5 px-3">SIO Expiry</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Assignment Actions</th>
=======
                  <th className="py-2.5 px-3">Operator / Badge</th>
                  <th className="py-2.5 px-3">SIO &amp; Kelas</th>
                  <th className="py-2.5 px-3">Spesialisasi</th>
                  <th className="py-2.5 px-3">Client &amp; Proyek Ditugaskan</th>
                  <th className="py-2.5 px-3">Alat Berat Ditugaskan</th>
                  <th className="py-2.5 px-3">Masa Berlaku SIO</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Aksi Penugasan</th>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {operators.map((op) => {
                  const isExpiringSoon = op.sioExpiry && op.sioExpiry < '2026-12-31';
                  return (
                    <tr key={op.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{op.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {op.badgeNumber} · {op.phone || '0812-xxxx'}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-indigo-900">{op.sioNumber}</div>
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 mt-0.5 inline-block">
                          {op.sioClass}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-medium text-slate-800">{op.equipmentSpecialization}</td>

                      <td className="py-3 px-3">
                        {op.assignedCustomerName ? (
                          <div>
                            <span className="font-bold text-slate-900">{op.assignedCustomerName}</span>
                            <div className="text-[11px] text-slate-500 mt-0.5">{op.assignedProjectName || op.currentProjectLocation}</div>
                          </div>
                        ) : (
<<<<<<< HEAD
                          <span className="text-slate-400 italic">No Client Assigned</span>
=======
                          <span className="text-slate-400 italic">Belum Ada Client</span>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                        )}
                      </td>

                      <td className="py-3 px-3">
                        {op.assignedAssetTag ? (
                          <div className="flex items-center gap-1 font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded w-max">
                            <span>{op.assignedAssetTag}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Standby</span>
                        )}
                        <div className="text-[11px] text-slate-500 mt-0.5">{op.assignedAssetName}</div>
                      </td>

                      <td className="py-3 px-3 font-mono">
                        <div className="font-semibold text-slate-800">{op.sioExpiry}</div>
                        {isExpiringSoon ? (
                          <span className="text-[10px] font-bold text-rose-700 flex items-center gap-1 mt-0.5">
<<<<<<< HEAD
                            <AlertCircle className="w-3 h-3" /> Renew Soon
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1 mt-0.5">
                            <CheckCircle2 className="w-3 h-3" /> License Valid
=======
                            <AlertCircle className="w-3 h-3" /> Segera Perpanjang
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1 mt-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Lisensi Valid
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            op.status === 'ASSIGNED'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : op.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {op.status}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenAssignModal(op)}
                            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-semibold cursor-pointer"
<<<<<<< HEAD
                            title="Assign to Client, Project, and Equipment"
                          >
                            Assign
=======
                            title="Tugaskan ke Client, Project, dan Alat"
                          >
                            Pilih Penugasan
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteOperator(op.id, op.name)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
<<<<<<< HEAD
                            title="Delete Operator"
=======
                            title="Hapus Operator"
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DAILY STATUS LOGS */}
      {activeTab === 'DAILY_STATUS_LOGS' && (
        <div className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-2xs space-y-3 p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
<<<<<<< HEAD
                Equipment Status Reports Submitted by Users / Field Operators
=======
                Feed Status Alat Berat yang Disubmit Pengguna / Operator Lapangan
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
              </h3>
              <p className="text-xs text-slate-500">
                Pembaruan real-time kondisi alat harian: Bekerja Normal vs Rusak / Breakdown.
              </p>
            </div>
            <button
              onClick={loadStatusLogs}
              className="px-3 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
<<<<<<< HEAD
              Refresh Data
=======
              Perbarui Data
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
<<<<<<< HEAD
                  <th className="py-2.5 px-4">Submission Time</th>
                  <th className="py-2.5 px-4">Asset Tag / Equipment</th>
                  <th className="py-2.5 px-4">Reporting Operator</th>
                  <th className="py-2.5 px-4 text-center">Equipment Status</th>
                  <th className="py-2.5 px-4 text-right">Hour Meter (HM)</th>
                  <th className="py-2.5 px-4">Project Location</th>
                  <th className="py-2.5 px-4">Issue / Damage Notes</th>
=======
                  <th className="py-2.5 px-4">Waktu Submit</th>
                  <th className="py-2.5 px-4">Asset Tag / Alat Berat</th>
                  <th className="py-2.5 px-4">Operator Pelapor</th>
                  <th className="py-2.5 px-4 text-center">Status Alat</th>
                  <th className="py-2.5 px-4 text-right">Hour Meter (HM)</th>
                  <th className="py-2.5 px-4">Lokasi Proyek</th>
                  <th className="py-2.5 px-4">Catatan Kendala / Kerusakan</th>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {statusLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {new Date(log.submittedAt).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}{' '}
                      {new Date(log.submittedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900">{log.assetTag}</div>
                      <div className="text-[11px] text-slate-500">{log.assetName}</div>
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-800">{log.submittedBy}</td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          log.status === 'WORKING'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : log.status === 'DAMAGED'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300 font-extrabold'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {log.status === 'WORKING' ? 'BEKERJA' : log.status === 'DAMAGED' ? 'RUSAK / BREAKDOWN' : 'STANDBY'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {log.hourMeter} hrs
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-700">{log.location}</td>

                    <td className="py-3 px-4 max-w-xs">
                      <div className="text-slate-800">{log.damageDescription || '-'}</div>
                      {log.workOrderIdCreated && (
                        <div className="text-[10px] font-mono text-indigo-700 font-bold mt-0.5">
                          Linked WO: {log.workOrderIdCreated}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Create Work Order */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full p-6 text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-indigo-600" />
<<<<<<< HEAD
                <h3 className="text-sm font-bold text-slate-900">Create Repair Ticket by Barcode</h3>
=======
                <h3 className="text-sm font-bold text-slate-900">Catat Tiket Perbaikan via Barcode</h3>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWorkOrder} className="space-y-3">
              <div>
<<<<<<< HEAD
                <label className="block font-semibold text-slate-700 mb-1">Select Equipment *</label>
=======
                <label className="block font-semibold text-slate-700 mb-1">Pilih Alat Berat *</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                <select
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded bg-white font-medium"
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      [{a.assetTag}] {a.name} ({a.warehouseLocation})
                    </option>
                  ))}
                </select>
              </div>

              <div>
<<<<<<< HEAD
                <label className="block font-semibold text-slate-700 mb-1">Repair Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Replace boom hydraulic hose & perform 2,500-hour service"
=======
                <label className="block font-semibold text-slate-700 mb-1">Judul Perbaikan *</label>
                <input
                  type="text"
                  required
                  placeholder="cth: Ganti Selang Hidrolik Boom & Servis Rutin 2500 HM"
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded font-medium focus:border-slate-800 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
<<<<<<< HEAD
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
=======
                  <label className="block font-semibold text-slate-700 mb-1">Prioritas</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  <select
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800"
                  >
<<<<<<< HEAD
                    <option value="LOW">Low (Routine)</option>
                    <option value="MEDIUM">Medium (Standard Service)</option>
                    <option value="HIGH">High (Urgent)</option>
                    <option value="CRITICAL">Critical (Equipment Breakdown)</option>
=======
                    <option value="LOW">Low (Rutin Ringan)</option>
                    <option value="MEDIUM">Medium (Standar Servis)</option>
                    <option value="HIGH">High (Prioritas Segera)</option>
                    <option value="CRITICAL">Critical (Breakdown Mogok)</option>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  </select>
                </div>

                <div>
<<<<<<< HEAD
                  <label className="block font-semibold text-slate-700 mb-1">Service Type</label>
=======
                  <label className="block font-semibold text-slate-700 mb-1">Tipe Servis</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  <select
                    value={type}
                    onChange={(e: any) => setType(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800"
                  >
<<<<<<< HEAD
                    <option value="CORRECTIVE">Corrective (Damage Repair)</option>
                    <option value="PREVENTIVE">Preventive (Scheduled Maintenance)</option>
                    <option value="RENTAL_RETURN_INSPECTION">Rental Return Inspection</option>
=======
                    <option value="CORRECTIVE">Corrective (Perbaikan Kerusakan)</option>
                    <option value="PREVENTIVE">Preventive (Perawatan Berkala)</option>
                    <option value="RENTAL_RETURN_INSPECTION">Inspeksi Kembali Sewa</option>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  </select>
                </div>
              </div>

              <div>
<<<<<<< HEAD
                <label className="block font-semibold text-slate-700 mb-1">Assigned Technician / Lead Mechanic</label>
=======
                <label className="block font-semibold text-slate-700 mb-1">Teknisi / Kepala Mekanik Bertugas</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                <input
                  type="text"
                  value={technician}
                  onChange={(e) => setTechnician(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:border-slate-800 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
<<<<<<< HEAD
                  <label className="block font-semibold text-slate-700 mb-1">Estimated Spare Parts Cost (IDR)</label>
=======
                  <label className="block font-semibold text-slate-700 mb-1">Estimasi Biaya Sparepart ($)</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  <input
                    type="number"
                    value={partsCost}
                    onChange={(e) => setPartsCost(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
<<<<<<< HEAD
                  <label className="block font-semibold text-slate-700 mb-1">Estimated Labor Cost (IDR)</label>
=======
                  <label className="block font-semibold text-slate-700 mb-1">Estimasi Ongkos Kerja ($)</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  <input
                    type="number"
                    value={laborCost}
                    onChange={(e) => setLaborCost(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              <div>
<<<<<<< HEAD
                <label className="block font-semibold text-slate-700 mb-1">Damage Description &amp; Work Instructions</label>
=======
                <label className="block font-semibold text-slate-700 mb-1">Deskripsi Kerusakan &amp; Instruksi Kerja</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
<<<<<<< HEAD
                  placeholder="Replacement parts, mechanic's analysis, and work notes..."
=======
                  placeholder="Rincian part yang diganti, analisa mekanik, dan catatan pengerjaan..."
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  className="w-full p-2 border border-slate-300 rounded outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
<<<<<<< HEAD
                  Cancel
=======
                  Batal
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded cursor-pointer"
                >
<<<<<<< HEAD
                  Create Work Order
=======
                  Terbitkan Work Order
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Selesaikan Work Order */}
      {completingWo && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-6 text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
<<<<<<< HEAD
                Complete Work Order: {completingWo.workOrderNumber}
=======
                Selesaikan Work Order: {completingWo.workOrderNumber}
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
              </h3>
              <button onClick={() => setCompletingWo(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded border border-slate-200 text-slate-700">
                <div className="font-bold">{completingWo.assetTag} - {completingWo.assetName}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{completingWo.title}</div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
<<<<<<< HEAD
                  Completion Notes &amp; Operational Safety Test *
=======
                  Catatan Penyelesaian &amp; Uji Kelayakan Operasi *
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                </label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded font-medium focus:border-emerald-600 outline-none"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded border border-emerald-200 text-emerald-800 text-[11px]">
<<<<<<< HEAD
                The equipment will automatically return to <strong>AVAILABLE</strong> status and be ready for rental or project use.
=======
                Unit alat berat akan otomatis dialihkan kembali ke status <strong>AVAILABLE</strong> dan siap disewa atau digunakan di proyek.
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCompletingWo(null)}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleCompleteWorkOrder}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded cursor-pointer"
                >
<<<<<<< HEAD
                  Confirm Completion &amp; Activate Equipment
=======
                  Konfirmasi Selesai &amp; Aktifkan Unit
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Tambah Operator & SIO Baru */}
      {showAddOperatorModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full p-6 text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
<<<<<<< HEAD
                  Register Operator &amp; SIO Certificate (K3)
=======
                  Registrasi Operator &amp; Sertifikat SIO (K3 Kemenaker)
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                </h3>
              </div>
              <button onClick={() => setShowAddOperatorModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOperator} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
<<<<<<< HEAD
                  <label className="block font-semibold text-slate-700 mb-1">Operator Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Alex Morgan"
=======
                  <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Operator *</label>
                  <input
                    type="text"
                    required
                    placeholder="cth: Bambang Sunaryo"
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                    value={newOpName}
                    onChange={(e) => setNewOpName(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-medium focus:border-slate-800 outline-none"
                  />
                </div>
                <div>
<<<<<<< HEAD
                  <label className="block font-semibold text-slate-700 mb-1">Operator Badge ID</label>
=======
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Badge Operator</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  <input
                    type="text"
                    placeholder="OPR-B-108"
                    value={newOpBadge}
                    onChange={(e) => setNewOpBadge(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-mono focus:border-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
<<<<<<< HEAD
                  <label className="block font-semibold text-slate-700 mb-1">SIO Certificate Number *</label>
=======
                  <label className="block font-semibold text-slate-700 mb-1">Nomor SIO Kemenaker *</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  <input
                    type="text"
                    required
                    placeholder="SIO/KEM/EXC/2026/0411"
                    value={newOpSioNumber}
                    onChange={(e) => setNewOpSioNumber(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-mono font-bold focus:border-slate-800 outline-none"
                  />
                </div>

                <div>
<<<<<<< HEAD
                  <label className="block font-semibold text-slate-700 mb-1">SIO License Class *</label>
=======
                  <label className="block font-semibold text-slate-700 mb-1">Kelas Lisensi SIO *</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  <select
                    value={newOpSioClass}
                    onChange={(e: any) => setNewOpSioClass(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 font-semibold"
                  >
<<<<<<< HEAD
                    <option value="KELAS_1">Class I (Capacity &gt; 100 Tons / Heavy)</option>
                    <option value="KELAS_2">Class II (Capacity 25 - 100 Tons)</option>
                    <option value="KELAS_3">Class III (Capacity &lt; 25 Tons)</option>
=======
                    <option value="KELAS_1">Kelas I (Kapasitas &gt; 100 Ton / Heavy)</option>
                    <option value="KELAS_2">Kelas II (Kapasitas 25 - 100 Ton)</option>
                    <option value="KELAS_3">Kelas III (Kapasitas &lt; 25 Ton)</option>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
<<<<<<< HEAD
                  <label className="block font-semibold text-slate-700 mb-1">SIO Expiration Date *</label>
=======
                  <label className="block font-semibold text-slate-700 mb-1">Masa Berlaku SIO s/d *</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  <input
                    type="date"
                    required
                    value={newOpSioExpiry}
                    onChange={(e) => setNewOpSioExpiry(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>

                <div>
<<<<<<< HEAD
                  <label className="block font-semibold text-slate-700 mb-1">Phone / WhatsApp Number</label>
=======
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Telepon / WA</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  <input
                    type="text"
                    placeholder="0812-xxxx-xxxx"
                    value={newOpPhone}
                    onChange={(e) => setNewOpPhone(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              <div>
<<<<<<< HEAD
                <label className="block font-semibold text-slate-700 mb-1">Equipment Specialization</label>
=======
                <label className="block font-semibold text-slate-700 mb-1">Spesialisasi Alat Berat</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                <input
                  type="text"
                  placeholder="Hydraulic Excavator 20-40T, Crawler Crane, Forklift"
                  value={newOpSpecialization}
                  onChange={(e) => setNewOpSpecialization(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
<<<<<<< HEAD
                  <label className="block font-semibold text-slate-700 mb-1">Assign to Equipment</label>
=======
                  <label className="block font-semibold text-slate-700 mb-1">Tugaskan ke Alat Berat</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  <select
                    value={newOpAssignedAsset}
                    onChange={(e) => setNewOpAssignedAsset(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800"
                  >
<<<<<<< HEAD
                    <option value="">-- Standby / Unassigned --</option>
=======
                    <option value="">-- Standby / Belum Ditugaskan --</option>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                    {assets.map((a) => (
                      <option key={a.id} value={a.id}>
                        [{a.assetTag}] {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
<<<<<<< HEAD
                  <label className="block font-semibold text-slate-700 mb-1">Project / Site Location</label>
=======
                  <label className="block font-semibold text-slate-700 mb-1">Lokasi Proyek / Site</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  <input
                    type="text"
                    value={newOpLocation}
                    onChange={(e) => setNewOpLocation(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded"
                  />
                </div>
              </div>

              {/* Upload SIO Document */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
                <div>
<<<<<<< HEAD
                  <span className="font-semibold block text-slate-700">Attach SIO Document (PDF / Image)</span>
                  <span className="text-[10px] text-slate-400">Digital K3 work safety certificate</span>
                </div>
                <label className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded font-semibold text-xs hover:bg-slate-100 cursor-pointer flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  Upload SIO
=======
                  <span className="font-semibold block text-slate-700">Lampirkan Dokumen SIO (PDF / Foto)</span>
                  <span className="text-[10px] text-slate-400">Arsip digital kelaikan kerja K3</span>
                </div>
                <label className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded font-semibold text-xs hover:bg-slate-100 cursor-pointer flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  Unggah SIO
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setSioFilePreview(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddOperatorModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
<<<<<<< HEAD
                  Cancel
=======
                  Batal
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded cursor-pointer"
                >
<<<<<<< HEAD
                  Save Operator &amp; SIO
=======
                  Simpan Operator &amp; SIO
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Printable Maintenance Certification Tag */}
      {printingCertWo && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-300 max-w-sm w-full p-6 text-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
<<<<<<< HEAD
                Maintenance Serviceability Certificate &amp; Barcode
=======
                Sertifikat Kelayakan Servis &amp; Barcode
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
              </h3>
              <button onClick={() => setPrintingCertWo(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-white border-2 border-emerald-600 rounded-lg p-4 text-center space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-xs text-emerald-800">MAINTENANCE CERTIFICATE</span>
<<<<<<< HEAD
                <span className="text-[10px] font-mono font-bold text-emerald-700">ROADWORTHY</span>
=======
                <span className="text-[10px] font-mono font-bold text-emerald-700">LAIK JALAN</span>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
              </div>

              <QrCode className="w-20 h-20 text-slate-900 mx-auto" />
              <div className="font-mono text-sm font-bold text-slate-900">{printingCertWo.workOrderNumber}</div>

              <div className="text-left bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1 font-mono text-[10px]">
                <div>TAG: <strong>{printingCertWo.assetTag}</strong></div>
                <div>UNIT: {printingCertWo.assetName}</div>
<<<<<<< HEAD
                <div>TECHNICIAN: {printingCertWo.assignedTechnician}</div>
                <div>COMPLETION DATE: {printingCertWo.completedDate || '2026-10-15'}</div>
                <div>NOTES: {printingCertWo.resolutionNotes}</div>
              </div>

              <span className="text-[9px] text-slate-400 block italic">
                This unit has passed pressure testing and workplace safety inspection.
              </span>
            </div>

            <div className="no-print pt-2 flex items-center justify-end gap-2">
=======
                <div>MEKANIK: {printingCertWo.assignedTechnician}</div>
                <div>TANGGAL SELESAI: {printingCertWo.completedDate || '2026-10-15'}</div>
                <div>CATATAN: {printingCertWo.resolutionNotes}</div>
              </div>

              <span className="text-[9px] text-slate-400 block italic">
                Unit telah melalui uji tekanan dan inspeksi keselamatan kerja.
              </span>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
              <button
                type="button"
                onClick={() => setPrintingCertWo(null)}
                className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
<<<<<<< HEAD
                Close
=======
                Tutup
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
<<<<<<< HEAD
                Print Service Tag
=======
                Cetak Tag Servis
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Assign Operator to Client, Project, and Asset */}
      {assigningOp && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-6 text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
<<<<<<< HEAD
                  Assign Operator: {assigningOp.name}
=======
                  Tugaskan Operator: {assigningOp.name}
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                </h3>
              </div>
              <button onClick={() => setAssigningOp(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded text-slate-700 space-y-1 font-mono text-[11px]">
              <div>Badge: <strong>{assigningOp.badgeNumber}</strong></div>
              <div>SIO: <strong>{assigningOp.sioNumber} ({assigningOp.sioClass})</strong></div>
              <div>Spesialisasi: {assigningOp.equipmentSpecialization}</div>
            </div>

            <form onSubmit={handleSaveAssignment} className="space-y-3">
              <div>
<<<<<<< HEAD
                <label className="block font-semibold text-slate-700 mb-1">Select Client / Customer *</label>
=======
                <label className="block font-semibold text-slate-700 mb-1">Pilih Client / Customer *</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                <select
                  value={assignCustomerId}
                  onChange={(e) => setAssignCustomerId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded bg-white font-medium"
                >
<<<<<<< HEAD
                  <option value="">-- Internal Project / Depot --</option>
=======
                  <option value="">-- Proyek Internal / Depot --</option>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.customerCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
<<<<<<< HEAD
                <label className="block font-semibold text-slate-700 mb-1">Project / Work Site Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Morowali Smelter Project, Block B-4"
=======
                <label className="block font-semibold text-slate-700 mb-1">Nama Proyek / Site Kerja *</label>
                <input
                  type="text"
                  required
                  placeholder="cth: Proyek Smelter Morowali Blok B-4"
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  value={assignProjectName}
                  onChange={(e) => setAssignProjectName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded outline-none"
                />
              </div>

              <div>
<<<<<<< HEAD
                <label className="block font-semibold text-slate-700 mb-1">Select Operated Equipment *</label>
=======
                <label className="block font-semibold text-slate-700 mb-1">Pilih Unit Alat Berat yang Dioperasikan *</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                <select
                  value={assignAssetId}
                  onChange={(e) => setAssignAssetId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded bg-white font-medium"
                >
<<<<<<< HEAD
                  <option value="">-- Standby / No Equipment Assigned --</option>
=======
                  <option value="">-- Standby / Belum Ada Alat --</option>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      [{a.assetTag}] {a.name} ({a.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssigningOp(null)}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
<<<<<<< HEAD
                  Cancel
=======
                  Batal
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded cursor-pointer"
                >
<<<<<<< HEAD
                  Save Assignment
=======
                  Simpan Penugasan
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
