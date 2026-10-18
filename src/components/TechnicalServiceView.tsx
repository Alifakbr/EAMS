import { BarcodeScanner } from './BarcodeScanner.tsx';
import React, { useState, useEffect } from 'react';
import { WorkOrder, Asset, Product, WorkOrderSparePartUsed } from '../types/index.ts';
import { api } from '../services/api.ts';
<<<<<<< HEAD
import { formatRupiahAmount } from '../shared/currency.tsx';
=======
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
import {
  Wrench,
  QrCode,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Plus,
  Trash2,
  Edit3,
  FileText,
  Printer,
  Boxes,
  ShieldCheck,
  RefreshCw,
  X,
  Sparkles,
  ArrowRight,
  Cpu,
} from 'lucide-react';

interface TechnicalServiceViewProps {
  workOrders: WorkOrder[];
  assets: Asset[];
  products: Product[];
  currentUserName?: string;
  onRefreshAll?: () => void;
}

export const TechnicalServiceView: React.FC<TechnicalServiceViewProps> = ({
  workOrders,
  assets,
  products,
  currentUserName = 'Dani Prasetyo (Technical Service Specialist)',
  onRefreshAll,
}) => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'SCAN_WORKFLOW' | 'HISTORY'>('DASHBOARD');

  // Scanner & Active Repair State
  const [scannedBarcode, setScannedBarcode] = useState<string>('AST-10024');
  const [manualInput, setManualInput] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [activeWo, setActiveWo] = useState<WorkOrder | null>(null);
  const [activeAsset, setActiveAsset] = useState<Asset | null>(null);

  // Repair Form Inputs
  const [repairDescription, setRepairDescription] = useState<string>('');
  const [laborCost, setLaborCost] = useState<string>('250');
  const [downtimeHours, setDowntimeHours] = useState<string>('4.5');
  const [resolutionNotes, setResolutionNotes] = useState<string>(
<<<<<<< HEAD
    'Comprehensive inspection completed. The hydraulic filter was replaced, oil pressure tested stable, and the unit is operational and safe to use.'
=======
    'Pemeriksaan komprehensif selesai. Penggantian sparepart filter hidrolik tuntas, tekanan oli uji stabil, unit normal dan laik operasi kembali.'
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
  );

  // Spare Parts & Services list used in repair (selected from Procurement)
  const [selectedParts, setSelectedParts] = useState<WorkOrderSparePartUsed[]>([]);
  const [partProductId, setPartProductId] = useState<string>('');
  const [partQty, setPartQty] = useState<string>('1');

  // Modal edit work order
  const [editingWo, setEditingWo] = useState<WorkOrder | null>(null);
  const [editDesc, setEditDesc] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editLabor, setEditLabor] = useState<string>('0');
  const [editParts, setEditParts] = useState<string>('0');

  // Print Certificate Modal
  const [printWo, setPrintWo] = useState<WorkOrder | null>(null);
  const [loadingAction, setLoadingAction] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter lists
  const repairRequests = workOrders.filter((w) => w.status === 'REPORTED' || w.status === 'SCHEDULED');
  const inProgressList = workOrders.filter((w) => w.status === 'IN_PROGRESS');
  const completedList = workOrders.filter((w) => w.status === 'COMPLETED');

  // Set default product for spare parts picker
  useEffect(() => {
    if (products.length > 0 && !partProductId) {
      setPartProductId(products[0].id);
    }
  }, [products, partProductId]);

  // Handle barcode search
  const handleBarcodeSearch = (code: string) => {
    const clean = code.trim().toLowerCase();
    if (!clean) return;

    // First search in work orders
    const matchedWo = workOrders.find(
      (w) =>
        (w.assetTag.toLowerCase() === clean || w.id.toLowerCase() === clean || w.workOrderNumber.toLowerCase() === clean) &&
        w.status !== 'COMPLETED'
    );

    // Also match asset
    const matchedAsset = assets.find(
      (a) =>
        a.assetTag.toLowerCase() === clean ||
        a.serialNumber.toLowerCase() === clean ||
        a.legalDocs?.plateNumber?.toLowerCase() === clean
    );

    if (matchedWo) {
      setActiveWo(matchedWo);
      setScannedBarcode(matchedWo.assetTag);
      setRepairDescription(matchedWo.description || '');
      setLaborCost(matchedWo.laborCost?.toString() || '250');
      if (matchedWo.sparePartsUsed && matchedWo.sparePartsUsed.length > 0) {
        setSelectedParts(matchedWo.sparePartsUsed);
      }
    } else {
      setActiveWo(null);
    }

    if (matchedAsset) {
      setActiveAsset(matchedAsset);
    } else if (matchedWo) {
      const a = assets.find((x) => x.id === matchedWo.assetId || x.assetTag === matchedWo.assetTag);
      if (a) setActiveAsset(a);
    }

    setIsCameraActive(false);
  };

  // Add spare part / service to repair list
  const handleAddPart = () => {
    const prod = products.find((p) => p.id === partProductId);
    if (!prod) return;

    const qty = parseInt(partQty, 10) || 1;
    const unit = prod.purchaseCost || 50;
    const newItem: WorkOrderSparePartUsed = {
      productId: prod.id,
      productName: prod.name,
      itemType: prod.productType === 'SERVICE' ? 'SERVICE' : 'GOODS',
      quantity: qty,
      unitCost: unit,
      totalCost: qty * unit,
    };

    setSelectedParts([...selectedParts, newItem]);
    setPartQty('1');
  };

  const handleRemovePart = (index: number) => {
    setSelectedParts(selectedParts.filter((_, i) => i !== index));
  };

  const calculatedPartsCost = selectedParts.reduce((sum, p) => sum + p.totalCost, 0);
  const calculatedTotalCost = calculatedPartsCost + (parseFloat(laborCost) || 0);

<<<<<<< HEAD
  // Check-in scan: start repair
  const handleStartRepair = async (woTarget?: WorkOrder) => {
    const target = woTarget || activeWo;
    if (!target) {
      alert('Select or scan a repair ticket barcode first.');
=======
  // Datang Scan: Mulai Perbaikan
  const handleStartRepair = async (woTarget?: WorkOrder) => {
    const target = woTarget || activeWo;
    if (!target) {
      alert('Pilih atau scan barcode tiket perbaikan terlebih dahulu.');
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
      return;
    }

    setLoadingAction(true);
    setSuccessMessage(null);
    try {
      const res = await api.scanStartTechnicalService({
        workOrderId: target.id,
        barcode: target.assetTag,
        technicianName: currentUserName,
      });

      setActiveWo(res);
<<<<<<< HEAD
      setSuccessMessage(`Check-in successful! Work order ${res.workOrderNumber} for asset ${res.assetTag} has started (Status: IN_PROGRESS). The asset is marked IN_MAINTENANCE.`);
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      alert(`Failed to start repair: ${err.message}`);
=======
      setSuccessMessage(`Scan Datang Berhasil! Pekerjaan ${res.workOrderNumber} pada alat ${res.assetTag} telah dimulai (Status: IN_PROGRESS). Status alat terkunci IN_MAINTENANCE.`);
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      alert(`Gagal memulai perbaikan: ${err.message}`);
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
    } finally {
      setLoadingAction(false);
    }
  };

<<<<<<< HEAD
  // Check-out scan: complete repair and return equipment to service
  const handleCompleteRepair = async () => {
    if (!activeWo) {
      alert('There is no active repair work to complete.');
=======
  // Scan Pulang: Selesaikan Perbaikan (Alat Normal)
  const handleCompleteRepair = async () => {
    if (!activeWo) {
      alert('Tidak ada pekerjaan perbaikan yang aktif untuk diselesaikan.');
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
      return;
    }

    if (!resolutionNotes.trim()) {
<<<<<<< HEAD
      alert('Resolution notes and equipment safety verification are required.');
=======
      alert('Catatan resolusi dan verifikasi kelaikan alat wajib diisi.');
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
      return;
    }

    setLoadingAction(true);
    setSuccessMessage(null);
    try {
      const res = await api.scanCompleteTechnicalService({
        workOrderId: activeWo.id,
        barcode: activeWo.assetTag,
        resolutionNotes,
        partsCost: calculatedPartsCost,
        laborCost: parseFloat(laborCost) || 0,
        sparePartsUsed: selectedParts,
        technicianName: currentUserName,
      });

      setSuccessMessage(
<<<<<<< HEAD
        `CHECK-OUT COMPLETE! Asset ${res.assetTag} has been repaired and confirmed operational and safe to use. Its Asset Management status is now AVAILABLE. Spare parts inventory has been updated.`
=======
        `SCAN PULANG SELESAI! Alat ${res.assetTag} telah tuntas diperbaiki dan dinyatakan NORMAL & LAIK OPERASI. Status alat di Asset Management telah kembali menjadi AVAILABLE. Stok suku cadang inventori telah diperbarui.`
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
      );
      setActiveWo(null);
      setSelectedParts([]);
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
<<<<<<< HEAD
      alert(`Failed to complete repair: ${err.message}`);
=======
      alert(`Gagal menyelesaikan perbaikan: ${err.message}`);
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
    } finally {
      setLoadingAction(false);
    }
  };

  // Open Edit Work Order
  const handleOpenEdit = (wo: WorkOrder) => {
    setEditingWo(wo);
    setEditDesc(wo.description || '');
    setEditNotes(wo.resolutionNotes || '');
    setEditLabor(wo.laborCost?.toString() || '0');
    setEditParts(wo.partsCost?.toString() || '0');
  };

  // Save Edit Work Order
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWo) return;

    setLoadingAction(true);
    try {
      await api.updateTechnicalWorkOrder(editingWo.id, {
        description: editDesc,
        resolutionNotes: editNotes,
        laborCost: parseFloat(editLabor) || 0,
        partsCost: parseFloat(editParts) || 0,
      });
<<<<<<< HEAD
      alert(`Work order ${editingWo.workOrderNumber} was updated successfully.`);
      setEditingWo(null);
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      alert(`Failed to update work order: ${err.message}`);
=======
      alert(`Work Order ${editingWo.workOrderNumber} berhasil diperbarui.`);
      setEditingWo(null);
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      alert(`Gagal memperbarui work order: ${err.message}`);
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner Header */}
      <div className="bg-slate-900 text-white rounded-lg p-5 shadow-lg border border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-wider font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                Technical Service Division · Workshop &amp; Field Repairs
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white mt-1.5 flex items-center gap-2">
              <Wrench className="w-6 h-6 text-amber-400" />
<<<<<<< HEAD
              Technical Service &amp; Equipment Repair Scanner
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Repair control center: review field damage reports, check in work, allocate spare parts from Procurement, and check out equipment after repairs.
=======
              Technical Service &amp; Scan Barcode Perbaikan Alat Berat
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Pusat kendali perbaikan: menerima laporan kerusakan lapangan, scan datang pengerjaan, alokasi suku cadang dari Procurement, dan scan pulang ketika alat normal kembali.
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
            </p>
          </div>

          <div className="text-right text-xs bg-slate-800/80 px-4 py-2.5 rounded-md border border-slate-700">
<<<<<<< HEAD
            <span className="text-slate-400 block text-[10px]">Assigned Technician:</span>
=======
            <span className="text-slate-400 block text-[10px]">Teknisi Bertugas:</span>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
            <span className="font-semibold text-amber-300">{currentUserName}</span>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800">
          <div className="bg-slate-950/60 p-3 rounded border border-slate-800">
<<<<<<< HEAD
            <span className="text-[10px] text-slate-400 uppercase font-semibold">New Field Reports</span>
            <div className="text-xl font-bold text-rose-400 mt-0.5">{repairRequests.length} Unit</div>
            <span className="text-[10px] text-slate-500">Awaiting technician</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">In Progress</span>
            <div className="text-xl font-bold text-amber-400 mt-0.5">{inProgressList.length} Unit</div>
            <span className="text-[10px] text-slate-500">Active repair check-ins</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Operational &amp; Completed</span>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">{completedList.length} Unit</div>
            <span className="text-[10px] text-slate-500">Ready to rent / available</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Procurement Spare Parts</span>
            <div className="text-xl font-bold text-indigo-400 mt-0.5">{products.length} SKU</div>
            <span className="text-[10px] text-slate-500">Integrated with procurement</span>
=======
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Laporan Lapangan Baru</span>
            <div className="text-xl font-bold text-rose-400 mt-0.5">{repairRequests.length} Unit</div>
            <span className="text-[10px] text-slate-500">Menunggu teknisi</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Sedang Dikerjakan</span>
            <div className="text-xl font-bold text-amber-400 mt-0.5">{inProgressList.length} Unit</div>
            <span className="text-[10px] text-slate-500">Datang scan aktif</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Alat Normal &amp; Selesai</span>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">{completedList.length} Unit</div>
            <span className="text-[10px] text-slate-500">Siap sewa / Available</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Suku Cadang Procurement</span>
            <div className="text-xl font-bold text-indigo-400 mt-0.5">{products.length} SKU</div>
            <span className="text-[10px] text-slate-500">Terintegrasi pengadaan</span>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 bg-white px-4 pt-2 rounded-t-lg shadow-2xs gap-3">
        <button
          onClick={() => setActiveTab('DASHBOARD')}
          className={`pb-3 px-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'DASHBOARD'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-500" />
<<<<<<< HEAD
          Field Damage Requests ({repairRequests.length})
=======
          Dashboard Request Kerusakan Lapangan ({repairRequests.length})
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
        </button>

        <button
          onClick={() => setActiveTab('SCAN_WORKFLOW')}
          className={`pb-3 px-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'SCAN_WORKFLOW'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <QrCode className="w-4 h-4 text-amber-500" />
<<<<<<< HEAD
          Equipment Repair Check-In &amp; Check-Out
=======
          Scan Datang &amp; Pulang Perbaikan Alat
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
        </button>

        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`pb-3 px-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'HISTORY'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 text-slate-500" />
<<<<<<< HEAD
          Repair History ({inProgressList.length + completedList.length})
=======
          History Alat Sedang Dikerjakan &amp; Selesai ({inProgressList.length + completedList.length})
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
        </button>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-start gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="font-medium">{successMessage}</div>
        </div>
      )}

      {/* TAB 1: DASHBOARD & REPAIR REQUESTS */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
<<<<<<< HEAD
                Field Operator Damage / Breakdown Tickets
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Field operators have scanned their attendance barcode and reported equipment failures. Select the button to start the repair (check in).
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded">
              {repairRequests.length} Awaiting Service
=======
                Daftar Tiket Kerusakan / Breakdown dari Operator Lapangan
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Operator lapangan telah melakukan scan barcode absensi dan melaporkan alat berat mogok/rusak. Klik tombol untuk memulai pengerjaan (Datang Scan).
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded">
              {repairRequests.length} Menunggu Penanganan
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {repairRequests.length === 0 ? (
              <div className="col-span-2 bg-white p-8 rounded-lg border border-slate-200 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
<<<<<<< HEAD
                <p className="font-semibold text-slate-800">There are no active field damage reports.</p>
                <p className="text-slate-400 mt-1">All equipment is currently operating normally or is serviceable.</p>
=======
                <p className="font-semibold text-slate-800">Tidak ada laporan kerusakan aktif dari lapangan!</p>
                <p className="text-slate-400 mt-1">Semua unit alat berat saat ini beroperasi normal atau dalam kondisi laik.</p>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
              </div>
            ) : (
              repairRequests.map((wo) => {
                const asset = assets.find((a) => a.id === wo.assetId || a.assetTag === wo.assetTag);
                return (
                  <div
                    key={wo.id}
                    className="bg-white rounded-lg border-2 border-rose-200 p-4 shadow-xs space-y-3 hover:border-rose-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-slate-900 text-amber-400 px-2 py-0.5 rounded">
                            {wo.assetTag}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                            {wo.priority} PRIORITY
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm mt-1">{wo.title}</h3>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">Tiket: {wo.workOrderNumber}</p>
                      </div>

                      <div className="p-2 rounded bg-slate-100 text-slate-800 border border-slate-200 text-center">
                        <QrCode className="w-8 h-8 mx-auto" />
                        <span className="text-[9px] font-mono block mt-0.5">{wo.assetTag}</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs text-slate-700 space-y-1">
<<<<<<< HEAD
                      <div className="font-semibold text-slate-900">Issue &amp; Damage Symptoms:</div>
                      <p className="text-slate-600 italic">"{wo.description}"</p>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-200 mt-2">
                        <div>
                          <span>Reported by:</span> <strong className="text-slate-700">{wo.reportedByOperator || 'Field Operator'}</strong>
                        </div>
                        <div>
                          <span>Category:</span> <strong className="text-slate-700">{wo.damageCategory || 'Engine/Hydraulic'}</strong>
                        </div>
                        <div>
                          <span>Equipment Location:</span> <strong className="text-slate-700">{asset?.warehouseLocation || 'Project Site'}</strong>
                        </div>
                        <div>
                          <span>Equipment Status:</span> <strong className="text-rose-600">{asset?.status || 'IN_MAINTENANCE'}</strong>
=======
                      <div className="font-semibold text-slate-900">Keluhan &amp; Gejala Kerusakan:</div>
                      <p className="text-slate-600 italic">"{wo.description}"</p>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-200 mt-2">
                        <div>
                          <span>Pelapor:</span> <strong className="text-slate-700">{wo.reportedByOperator || 'Operator Lapangan'}</strong>
                        </div>
                        <div>
                          <span>Kategori:</span> <strong className="text-slate-700">{wo.damageCategory || 'Engine/Hydraulic'}</strong>
                        </div>
                        <div>
                          <span>Lokasi Unit:</span> <strong className="text-slate-700">{asset?.warehouseLocation || 'Site Proyek'}</strong>
                        </div>
                        <div>
                          <span>Status Alat:</span> <strong className="text-rose-600">{asset?.status || 'IN_MAINTENANCE'}</strong>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleOpenEdit(wo)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit Work Order
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('SCAN_WORKFLOW');
                          handleBarcodeSearch(wo.assetTag);
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" />
<<<<<<< HEAD
                        Check In &amp; Start Repair
=======
                        Datang Scan &amp; Mulai Perbaikan
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SCAN WORKFLOW (DATANG SCAN -> PENGERJAAN -> SCAN PULANG NORMAL) */}
      {activeTab === 'SCAN_WORKFLOW' && (
        <div className="space-y-5">
          {/* Section 1: Scan Barcode Alat */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-600" />
<<<<<<< HEAD
                <h2 className="text-sm font-bold text-slate-900">1. Scan Equipment Barcode (Check In)</h2>
=======
                <h2 className="text-sm font-bold text-slate-900">1. Identifikasi Barcode Alat Berat (Datang Scan)</h2>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
              </div>
              <button
                type="button"
                onClick={() => setIsCameraActive(!isCameraActive)}
                className="px-3 py-1 text-xs font-semibold rounded bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 flex items-center gap-1.5 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
<<<<<<< HEAD
                {isCameraActive ? 'Close Camera Scanner' : 'Open Camera Scanner'}
=======
                {isCameraActive ? 'Tutup Scanner Kamera' : 'Buka Scanner Kamera'}
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
              </button>
            </div>

            {/* Scanner kamera asli (QR / Barcode) */}
            {isCameraActive && (
              <BarcodeScanner
                onClose={() => setIsCameraActive(false)}
                onDetected={(code) => {
                  setManualInput(code);
                  handleBarcodeSearch(code);
                }}
              />
            )}

            {/* Barcode input row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-8">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
<<<<<<< HEAD
                  Equipment Barcode Tag or Ticket Number:
=======
                  Tag Barcode Alat Berat atau Nomor Tiket:
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
<<<<<<< HEAD
                    placeholder="Enter barcode (e.g., AST-10024, AST-10088)..."
=======
                    placeholder="Ketik Barcode (cth: AST-10024, AST-10088)..."
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleBarcodeSearch(manualInput);
                    }}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded font-mono focus:border-indigo-600 outline-none"
                  />
                </div>
              </div>

              <div className="sm:col-span-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleBarcodeSearch(manualInput || scannedBarcode)}
                  className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
<<<<<<< HEAD
                  Find Equipment
=======
                  Cari Unit
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                </button>

                <select
                  value={scannedBarcode}
                  onChange={(e) => handleBarcodeSearch(e.target.value)}
                  className="py-2 px-2.5 text-xs border border-slate-300 rounded bg-slate-50 font-medium text-slate-700 outline-none cursor-pointer"
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.assetTag}>
                      {a.assetTag} ({a.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Asset & Work Order Card */}
            {activeAsset && (
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-8 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold text-slate-900 bg-white border border-slate-300 px-2 py-0.5 rounded shadow-2xs">
                      {activeAsset.assetTag}
                    </span>
                    <span className="text-xs font-bold text-slate-800">{activeAsset.name}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        activeAsset.status === 'AVAILABLE'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : activeAsset.status === 'IN_MAINTENANCE'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      Status: {activeAsset.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600 pt-1 font-mono">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Serial No:</span>
                      <span className="font-semibold text-slate-800">{activeAsset.serialNumber}</span>
                    </div>
                    <div>
<<<<<<< HEAD
                      <span className="text-slate-400 block text-[10px]">SIA Permit (Kemenaker):</span>
=======
                      <span className="text-slate-400 block text-[10px]">SIA Kemenaker:</span>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                      <span className="font-semibold text-slate-800">{activeAsset.legalDocs?.siaNumber || 'SIA-2025'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Hour Meter (HM):</span>
                      <span className="font-semibold text-slate-800">{activeAsset.legalDocs?.hourMeter || '2450.5'} HM</span>
                    </div>
                    <div>
<<<<<<< HEAD
                      <span className="text-slate-400 block text-[10px]">Workshop / Site Location:</span>
=======
                      <span className="text-slate-400 block text-[10px]">Lokasi Workshop/Site:</span>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                      <span className="font-semibold text-slate-800">{activeAsset.warehouseLocation}</span>
                    </div>
                  </div>

                  {activeWo && (
                    <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 flex items-center justify-between">
                      <div>
<<<<<<< HEAD
                        <span className="font-bold">Repair Ticket: {activeWo.workOrderNumber}</span> · Status: <strong>{activeWo.status}</strong>
=======
                        <span className="font-bold">Tiket Perbaikan: {activeWo.workOrderNumber}</span> · Status: <strong>{activeWo.status}</strong>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                      </div>
                      {activeWo.status !== 'IN_PROGRESS' && activeWo.status !== 'COMPLETED' && (
                        <button
                          onClick={() => handleStartRepair(activeWo)}
                          disabled={loadingAction}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-[11px] cursor-pointer"
                        >
<<<<<<< HEAD
                          Check In: Start Work
=======
                          Scan Datang: Mulai Kerja
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="md:col-span-4 flex flex-col items-center justify-center p-3 bg-white rounded border border-slate-200 text-center">
                  <QrCode className="w-12 h-12 text-slate-800" />
                  <span className="text-[10px] font-mono font-bold text-slate-700 mt-1">{activeAsset.assetTag}</span>
<<<<<<< HEAD
                  <span className="text-[9px] text-slate-400">Physical Barcode Verified</span>
=======
                  <span className="text-[9px] text-slate-400">Barcode Fisik Terverifikasi</span>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Pengerjaan Perbaikan & Penggantian Sparepart / Jasa dari Procurement */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900">
<<<<<<< HEAD
                  2. Repair Details &amp; Spare Parts (Procurement Inventory)
                </h2>
              </div>
              <span className="text-xs text-slate-400">Automatically integrated with maintenance costs and inventory</span>
=======
                  2. Deskripsi Perbaikan &amp; Penggantian Sparepart (Data Stok Procurement)
                </h2>
              </div>
              <span className="text-xs text-slate-400">Terintegrasi otomatis ke Biaya Maintenance &amp; Inventori</span>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
            </div>

            {/* Description & Diagnosis */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
<<<<<<< HEAD
                Service / Repair Work Description *
              </label>
              <textarea
                rows={3}
                placeholder="Describe the repaired components, technical issues, welding, oil flushing, seal replacement, system calibration..."
=======
                Deskripsi Pekerjaan Servis / Tindakan Perbaikan *
              </label>
              <textarea
                rows={3}
                placeholder="Tuliskan komponen yang diperbaiki, kendala teknis, pengelasan, flushing oli, penggantian sil, kalibrasi sistem..."
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                value={repairDescription}
                onChange={(e) => setRepairDescription(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-300 rounded focus:border-indigo-600 outline-none"
              />
            </div>

            {/* Spare Parts & Services Selection from Procurement Products */}
            <div className="border border-slate-200 rounded-md p-4 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 uppercase">
<<<<<<< HEAD
                  Select Spare Parts / Services from Procurement Inventory
                </span>
                <span className="text-[11px] text-slate-500">Goods &amp; Services Catalog</span>
=======
                  Pilih Sparepart / Jasa dari Pengadaan (Procurement Stock)
                </span>
                <span className="text-[11px] text-slate-500">Katalog Barang &amp; Jasa</span>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                <div className="sm:col-span-7">
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
<<<<<<< HEAD
                    Spare Parts / Service Components:
=======
                    Komponen Sparepart / Jasa Servis:
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  </label>
                  <select
                    value={partProductId}
                    onChange={(e) => setPartProductId(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded text-xs bg-white outline-none"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
<<<<<<< HEAD
                        [{p.productType === 'SERVICE' ? 'SERVICE' : 'GOODS'}] {p.name} - Unit Cost: {formatRupiahAmount(p.purchaseCost || 0)} (Stock: {p.stockQuantity})
=======
                        [{p.productType === 'SERVICE' ? 'JASA' : 'BARANG'}] {p.name} - Biaya Satuan: ${p.purchaseCost || 0} (Stok: {p.stockQuantity})
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3">
<<<<<<< HEAD
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Quantity:</label>
=======
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Jumlah / Qty:</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  <input
                    type="number"
                    min="1"
                    value={partQty}
                    onChange={(e) => setPartQty(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded text-xs font-mono bg-white outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={handleAddPart}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Pasang Part
                  </button>
                </div>
              </div>

              {/* Table of selected spare parts */}
              {selectedParts.length > 0 ? (
                <div className="mt-3 bg-white rounded border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[10px]">
                      <tr>
<<<<<<< HEAD
                        <th className="p-2">Spare Part / Service Item</th>
                        <th className="p-2">Type</th>
                        <th className="p-2 text-right">Qty</th>
                        <th className="p-2 text-right">Unit Cost</th>
                        <th className="p-2 text-right">Subtotal</th>
                        <th className="p-2 text-center">Actions</th>
=======
                        <th className="p-2">Item Sparepart / Jasa</th>
                        <th className="p-2">Tipe</th>
                        <th className="p-2 text-right">Qty</th>
                        <th className="p-2 text-right">Biaya Satuan</th>
                        <th className="p-2 text-right">Subtotal</th>
                        <th className="p-2 text-center">Aksi</th>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedParts.map((sp, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-medium text-slate-900">{sp.productName}</td>
                          <td className="p-2 text-[10px]">
                            <span
                              className={`px-1.5 py-0.5 rounded font-bold ${
                                sp.itemType === 'SERVICE' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {sp.itemType}
                            </span>
                          </td>
                          <td className="p-2 text-right font-mono">{sp.quantity}</td>
<<<<<<< HEAD
                          <td className="p-2 text-right font-mono">{formatRupiahAmount(sp.unitCost)}</td>
                          <td className="p-2 text-right font-mono font-bold text-slate-900">
                            {formatRupiahAmount(sp.totalCost)}
=======
                          <td className="p-2 text-right font-mono">${sp.unitCost.toFixed(2)}</td>
                          <td className="p-2 text-right font-mono font-bold text-slate-900">
                            ${sp.totalCost.toFixed(2)}
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemovePart(idx)}
                              className="text-slate-400 hover:text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-2 text-xs text-slate-400 italic">
<<<<<<< HEAD
                  No spare parts or services have been added to this repair yet.
=======
                  Belum ada sparepart atau jasa yang ditambahkan untuk perbaikan ini.
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                </div>
              )}
            </div>

            {/* Financial & Time Calculation */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
<<<<<<< HEAD
                <label className="block text-xs font-semibold text-slate-700 mb-1">Total Spare Parts Cost (IDR)</label>
                <input
                  type="text"
                  readOnly
                  value={formatRupiahAmount(calculatedPartsCost)}
=======
                <label className="block text-xs font-semibold text-slate-700 mb-1">Total Biaya Suku Cadang (USD)</label>
                <input
                  type="text"
                  readOnly
                  value={`$${calculatedPartsCost.toFixed(2)}`}
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  className="w-full p-2 border border-slate-300 rounded font-mono text-xs bg-slate-100 text-slate-800 font-bold outline-none"
                />
              </div>

              <div>
<<<<<<< HEAD
                <label className="block text-xs font-semibold text-slate-700 mb-1">Service / Technician Labor Cost (IDR)</label>
=======
                <label className="block text-xs font-semibold text-slate-700 mb-1">Biaya Jasa / Ongkos Teknisi ($)</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                <input
                  type="number"
                  value={laborCost}
                  onChange={(e) => setLaborCost(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded font-mono text-xs outline-none"
                />
              </div>

              <div>
<<<<<<< HEAD
                <label className="block text-xs font-semibold text-slate-700 mb-1">Equipment Downtime (Hours)</label>
=======
                <label className="block text-xs font-semibold text-slate-700 mb-1">Durasi Downtime Alat (Jam)</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                <input
                  type="number"
                  step="0.5"
                  value={downtimeHours}
                  onChange={(e) => setDowntimeHours(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded font-mono text-xs outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Scan Pulang Saat Alat Sudah Normal */}
          <div className="bg-white rounded-lg border-2 border-emerald-300 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900">
<<<<<<< HEAD
                  3. Check Out &amp; Complete Repair (Equipment Operational)
                </h2>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                Total Repair Cost: {formatRupiahAmount(calculatedTotalCost)}
=======
                  3. Scan Pulang &amp; Penyelesaian Perbaikan (Alat Normal)
                </h2>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                Total Biaya Perbaikan: ${calculatedTotalCost.toFixed(2)}
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
<<<<<<< HEAD
                Resolution Notes &amp; Operational Safety Verification *
              </label>
              <textarea
                rows={2}
                placeholder="Confirm that the equipment has been tested, oil pressure is stable, and the machine operates normally and safely..."
=======
                Catatan Hasil Resolusi &amp; Verifikasi Kelaikan Operasi *
              </label>
              <textarea
                rows={2}
                placeholder="Tuliskan konfirmasi bahwa alat telah dites, tekanan oli stabil, mesin bekerja normal dan aman..."
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-300 rounded focus:border-emerald-600 outline-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-500">
<<<<<<< HEAD
                <span className="font-semibold text-slate-700">System Automation:</span> Completing this ticket sets the equipment to <strong className="text-emerald-700">AVAILABLE</strong> in Asset Management and deducts used spare parts from inventory.
=======
                <span className="font-semibold text-slate-700">Otomasi Sistem:</span> Menyelesaikan tiket ini akan mengembalikan status alat ke <strong className="text-emerald-700">AVAILABLE</strong> di Asset Management dan mengurangi stok suku cadang.
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
              </div>

              <button
                type="button"
                onClick={handleCompleteRepair}
                disabled={loadingAction || !activeWo}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {loadingAction ? <RefreshCw className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
<<<<<<< HEAD
                Check Out: Mark Equipment Operational &amp; Complete
=======
                Scan Pulang: Nyatakan Alat Normal &amp; Selesai
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HISTORY ALAT SEDANG DIKERJAKAN & ALAT SELESAI */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-6">
          {/* Section: Sedang Dikerjakan */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
<<<<<<< HEAD
                Equipment Under Repair
=======
                Alat Sedang Dikerjakan (In-Progress Repairs)
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
              </h3>
              <span className="text-xs font-mono text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded">
                {inProgressList.length} Unit
              </span>
            </div>

            <div className="space-y-2.5">
              {inProgressList.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-400 italic">
<<<<<<< HEAD
                  No equipment is currently undergoing an active repair.
=======
                  Tidak ada alat yang sedang dalam pengerjaan aktif saat ini.
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                </div>
              ) : (
                inProgressList.map((wo) => (
                  <div key={wo.id} className="p-3 border border-amber-200 rounded bg-amber-50/40 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-amber-300">
                          {wo.assetTag}
                        </span>
                        <span className="font-bold text-slate-800">{wo.title}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                        IN PROGRESS
                      </span>
                    </div>

                    <div className="text-slate-600">{wo.description}</div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-amber-200">
<<<<<<< HEAD
                      <div>Technician: <strong className="text-slate-700">{wo.assignedTechnician}</strong></div>
                      <div>Started: <strong className="text-slate-700">{wo.startedDate ? new Date(wo.startedDate).toLocaleString('en-US') : 'Today'}</strong></div>
=======
                      <div>Teknisi: <strong className="text-slate-700">{wo.assignedTechnician}</strong></div>
                      <div>Mulai: <strong className="text-slate-700">{wo.startedDate ? new Date(wo.startedDate).toLocaleString('id-ID') : 'Hari ini'}</strong></div>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenEdit(wo)}
                          className="px-2 py-1 text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded font-semibold cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab('SCAN_WORKFLOW');
                            handleBarcodeSearch(wo.assetTag);
                          }}
                          className="px-2.5 py-1 text-white bg-emerald-600 hover:bg-emerald-700 rounded font-bold cursor-pointer"
                        >
<<<<<<< HEAD
                          Check Out
=======
                          Scan Pulang
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section: History Alat Selesai & Normal */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
<<<<<<< HEAD
                Completed Repairs &amp; Returned-to-Service History
              </h3>
              <span className="text-xs font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                {completedList.length} completed
=======
                Riwayat Alat Selesai &amp; Kembali Normal (Completed Repairs)
              </h3>
              <span className="text-xs font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                {completedList.length} Riwayat Selesai
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded">
                <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[10px]">
                  <tr>
<<<<<<< HEAD
                    <th className="p-2.5">Work Order No.</th>
                    <th className="p-2.5">Equipment / Barcode</th>
                    <th className="p-2.5">Work &amp; Resolution</th>
                    <th className="p-2.5">Technician</th>
                    <th className="p-2.5 text-right">Parts Cost</th>
                    <th className="p-2.5 text-right">Labor Cost</th>
                    <th className="p-2.5 text-right">Total Cost</th>
                    <th className="p-2.5 text-center">Compliance Certificate</th>
=======
                    <th className="p-2.5">No. Work Order</th>
                    <th className="p-2.5">Alat / Barcode</th>
                    <th className="p-2.5">Pekerjaan &amp; Resolusi</th>
                    <th className="p-2.5">Teknisi</th>
                    <th className="p-2.5 text-right">Parts Cost</th>
                    <th className="p-2.5 text-right">Labor Cost</th>
                    <th className="p-2.5 text-right">Total Biaya</th>
                    <th className="p-2.5 text-center">Dokumen Kelaikan</th>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {completedList.map((wo) => (
                    <tr key={wo.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-bold text-slate-800">{wo.workOrderNumber}</td>
                      <td className="p-2.5">
                        <span className="font-mono font-semibold bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">
                          {wo.assetTag}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-0.5">{wo.assetName}</div>
                      </td>
                      <td className="p-2.5 max-w-xs">
                        <div className="font-medium text-slate-900">{wo.title}</div>
<<<<<<< HEAD
                        <div className="text-[11px] text-slate-500 italic truncate">{wo.resolutionNotes || 'Repair completed'}</div>
                      </td>
                      <td className="p-2.5 text-slate-700">{wo.assignedTechnician}</td>
                      <td className="p-2.5 text-right font-mono">{formatRupiahAmount(wo.partsCost || 0)}</td>
                      <td className="p-2.5 text-right font-mono">{formatRupiahAmount(wo.laborCost || 0)}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                        {formatRupiahAmount(wo.totalCost || 0)}
=======
                        <div className="text-[11px] text-slate-500 italic truncate">{wo.resolutionNotes || 'Perbaikan tuntas'}</div>
                      </td>
                      <td className="p-2.5 text-slate-700">{wo.assignedTechnician}</td>
                      <td className="p-2.5 text-right font-mono">${(wo.partsCost || 0).toFixed(2)}</td>
                      <td className="p-2.5 text-right font-mono">${(wo.laborCost || 0).toFixed(2)}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                        ${(wo.totalCost || 0).toFixed(2)}
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          onClick={() => setPrintWo(wo)}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded flex items-center gap-1 mx-auto cursor-pointer"
                        >
                          <Printer className="w-3 h-3" />
<<<<<<< HEAD
                          Print Certificate
=======
                          Cetak Sertifikat
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Work Order */}
      {editingWo && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-600" />
<<<<<<< HEAD
                Edit Repair Ticket: {editingWo.workOrderNumber} ({editingWo.assetTag})
=======
                Edit Tiket Perbaikan: {editingWo.workOrderNumber} ({editingWo.assetTag})
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
              </h3>
              <button onClick={() => setEditingWo(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
<<<<<<< HEAD
                <label className="block text-slate-700 font-semibold mb-1">Damage / Repair Description:</label>
=======
                <label className="block text-slate-700 font-semibold mb-1">Deskripsi Kerusakan / Perbaikan:</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded outline-none"
                />
              </div>

              <div>
<<<<<<< HEAD
                <label className="block text-slate-700 font-semibold mb-1">Final Resolution Notes:</label>
=======
                <label className="block text-slate-700 font-semibold mb-1">Catatan Resolusi Akhir:</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
<<<<<<< HEAD
                  <label className="block text-slate-700 font-semibold mb-1">Parts Cost (IDR):</label>
=======
                  <label className="block text-slate-700 font-semibold mb-1">Biaya Parts ($):</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  <input
                    type="number"
                    value={editParts}
                    onChange={(e) => setEditParts(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-mono outline-none"
                  />
                </div>
                <div>
<<<<<<< HEAD
                  <label className="block text-slate-700 font-semibold mb-1">Labor Cost (IDR):</label>
=======
                  <label className="block text-slate-700 font-semibold mb-1">Biaya Labor ($):</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  <input
                    type="number"
                    value={editLabor}
                    onChange={(e) => setEditLabor(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-mono outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingWo(null)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded font-semibold cursor-pointer"
                >
<<<<<<< HEAD
                  Cancel
=======
                  Batal
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold cursor-pointer"
                >
<<<<<<< HEAD
                  Save Changes
=======
                  Simpan Perubahan
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

<<<<<<< HEAD
      {/* Printable equipment serviceability certificate */}
=======
      {/* Modal Cetak Sertifikat Kelaikan Servis */}
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
      {printWo && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-6 text-slate-900 space-y-4">
            <div className="flex justify-between items-start pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
<<<<<<< HEAD
                  Heavy Equipment Operational Fitness Certificate
=======
                  Sertifikat Kelaikan Operasi Alat Berat
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                </h2>
                <p className="text-xs text-slate-500">PT Apex Commercial Assets Indonesia · Technical Service Dept.</p>
              </div>
              <button onClick={() => setPrintWo(null)} className="text-slate-400 hover:text-slate-700 no-print">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded border border-slate-200 font-mono">
                <div>
<<<<<<< HEAD
                  <span className="text-slate-400 block text-[10px]">Work Order Number:</span>
                  <span className="font-bold text-slate-900">{printWo.workOrderNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Asset Tag:</span>
                  <span className="font-bold text-slate-900">{printWo.assetTag}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Equipment Name:</span>
                  <span className="font-bold text-slate-900">{printWo.assetName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Inspection Result:</span>
                  <span className="font-bold text-emerald-700">FIT FOR OPERATION / READY</span>
=======
                  <span className="text-slate-400 block text-[10px]">Nomor Tiket Servis:</span>
                  <span className="font-bold text-slate-900">{printWo.workOrderNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Barcode Unit:</span>
                  <span className="font-bold text-slate-900">{printWo.assetTag}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Nama Alat:</span>
                  <span className="font-bold text-slate-900">{printWo.assetName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Status Hasil Uji:</span>
                  <span className="font-bold text-emerald-700">LAIK OPERASI / READY</span>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                </div>
              </div>

              <div>
<<<<<<< HEAD
                <span className="font-bold text-slate-800">Repair Performed:</span>
=======
                <span className="font-bold text-slate-800">Tindakan Perbaikan:</span>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                <p className="text-slate-600 mt-0.5">{printWo.description}</p>
              </div>

              <div>
<<<<<<< HEAD
                <span className="font-bold text-slate-800">Technician Notes:</span>
=======
                <span className="font-bold text-slate-800">Catatan Teknisi:</span>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                <p className="text-slate-600 mt-0.5">{printWo.resolutionNotes}</p>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 text-center">
                <div>
<<<<<<< HEAD
                  <div className="text-[11px] text-slate-500">Assigned Technician:</div>
=======
                  <div className="text-[11px] text-slate-500">Teknisi Pelaksana:</div>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  <div className="font-bold text-slate-800 mt-6 pt-1 border-t border-slate-300">
                    {printWo.assignedTechnician}
                  </div>
                </div>
                <div>
<<<<<<< HEAD
                  <div className="text-[11px] text-slate-500">Workshop Manager:</div>
=======
                  <div className="text-[11px] text-slate-500">Kepala Mekanik / Workshop:</div>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  <div className="font-bold text-slate-800 mt-6 pt-1 border-t border-slate-300">
                    Hendra Setiawan, S.T.
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 no-print">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded flex items-center gap-1.5 hover:bg-slate-800 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
<<<<<<< HEAD
                Print / Save as PDF
=======
                Cetak ke Kertas / PDF
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
