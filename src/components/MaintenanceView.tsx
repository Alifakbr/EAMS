import React, { useState, useEffect } from 'react';
import { WorkOrder, Asset, HeavyEquipmentOperator, AssetDailyStatusLog, Customer } from '../types/index.ts';
import { api } from '../services/api.ts';
import { formatRupiahAmount } from '../shared/currency.tsx';
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
  const [resolutionNotes, setResolutionNotes] = useState('All hydraulic components and filters have been replaced. Pressure test stable at 3,500 PSI.');
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
  const [technician, setTechnician] = useState('Derrick Vance (Field Service Manager)');

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
    setAssignProjectName(op.assignedProjectName || op.currentProjectLocation || 'Project Site');
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
        `Assignment saved! Operator ${assigningOp.name} assigned to client: ${cust?.name || 'Internal'}, project: ${assignProjectName}, equipment: ${asset?.assetTag || 'Standby'}.`
      );
      setAssigningOp(null);
      await loadOperators();
    } catch (err: any) {
      alert(`Failed to save operator assignment: ${err.message}`);
    }
  };

  const handleDeleteOperator = async (opId: string, name: string) => {
    if (!confirm(`Delete operator ${name} from the system?`)) return;
    try {
      await api.deleteOperator(opId);
      alert(`Operator ${name} was deleted successfully.`);
      await loadOperators();
    } catch (err: any) {
      alert(`Failed to delete operator: ${err.message}`);
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
      setTitle(`Equipment Repair: ${found.name}`);
    } else {
      alert(`Equipment with barcode/tag "${code}" was not found.`);
    }
  };

  const handleCreateWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId || !title) {
      alert('Equipment and repair work order title are required.');
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

      alert('Repair ticket created and awaiting Manager approval.');
      setShowCreateModal(false);
      onRefresh();
    } catch (err: any) {
      alert(`Failed to create repair ticket: ${err.message}`);
    }
  };

  const handleCompleteWorkOrder = async () => {
    if (!completingWo) return;

    try {
      await api.completeWorkOrder(completingWo.id, resolutionNotes);
      alert(`Repair ticket ${completingWo.workOrderNumber} is complete. The equipment is AVAILABLE and safe to operate.`);
      setCompletingWo(null);
      onRefresh();
    } catch (err: any) {
      alert(`Failed to complete ticket: ${err.message}`);
    }
  };

  const handleCreateOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOpName || !newOpSioNumber) {
      alert('Operator name and SIO certificate number are required.');
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

      alert(`Operator ${newOpName} with SIO ${newOpSioNumber} was registered successfully.`);
      setShowAddOperatorModal(false);
      setNewOpName('');
      setNewOpBadge('');
      setNewOpPhone('');
      setNewOpSioNumber('');
      setSioFilePreview(null);
      await loadOperators();
    } catch (err: any) {
      alert(`Failed to register operator: ${err.message}`);
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
              Field Operations &amp; Barcode Repair
            </h1>
            <span className="text-xs text-slate-500 font-mono">({workOrders.length} active tickets)</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Heavy equipment repair center with barcode scanning and operator safety certificate (SIO) management.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'WORK_ORDERS' ? (
            <button
              onClick={() => {
                if (scannedAsset) {
                  setAssetId(scannedAsset.id);
                  setTitle(`Equipment Repair: ${scannedAsset.name}`);
                }
                setShowCreateModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              Create Repair Ticket by Barcode
            </button>
          ) : activeTab === 'OPERATORS_SIO' ? (
            <button
              onClick={() => setShowAddOperatorModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded shadow-xs cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-amber-400" />
              Add Operator &amp; SIO Certificate
            </button>
          ) : (
            <button
              onClick={loadStatusLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-300 hover:bg-slate-50 text-slate-700 rounded cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              Refresh Status Logs
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
          <span>Barcode Repairs &amp; Work Orders ({workOrders.length})</span>
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
          <span>Field Operators &amp; SIO Licenses ({operators.length})</span>
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
          <span>Daily Equipment Status Reports ({statusLogs.length})</span>
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
                <span>Heavy Equipment Barcode Scanner for Service / Repairs</span>
              </div>
              <span className="text-[11px] text-slate-400">Scan an equipment tag to create a repair log</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-8 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Enter equipment barcode (e.g., AST-10024, AST-10088)..."
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
                  Search
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
                    Plate: {scannedAsset.legalDocs?.plateNumber || 'B 9821 TQ'} · SIA: {scannedAsset.legalDocs?.siaNumber || 'SIA-2026'} · Location: {scannedAsset.warehouseLocation}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAssetId(scannedAsset.id);
                    setTitle(`Repair ${scannedAsset.name} (${scannedAsset.assetTag})`);
                    setShowCreateModal(true);
                  }}
                  className="px-3.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Wrench className="w-3.5 h-3.5 text-amber-400" />
                  Create Repair Work Order
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
                    <th className="py-2.5 px-4">WO # / Date</th>
                    <th className="py-2.5 px-4">Barcode Tag &amp; Equipment</th>
                    <th className="py-2.5 px-4">Repair Title &amp; Issue</th>
                    <th className="py-2.5 px-4">Technician / Mechanic</th>
                    <th className="py-2.5 px-4 text-center">Priority / Type</th>
                    <th className="py-2.5 px-4 text-right">Service Cost (IDR)</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                    <th className="py-2.5 px-4 text-right">Mechanic Actions</th>
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
                          {formatRupiahAmount(wo.totalCost)}
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
                                Complete Service
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setPrintingCertWo(wo)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                <Printer className="w-3 h-3" />
                                Service Certificate
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
                Heavy Equipment Operator Directory &amp; SIO Qualification Documents
              </h3>
              <p className="text-xs text-slate-500">
                Track K3 operator competency certificates (SIO Classes 1, 2, 3), license expiry, and assigned equipment.
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
                  <th className="py-2.5 px-3">Operator / Badge ID</th>
                  <th className="py-2.5 px-3">SIO &amp; Class</th>
                  <th className="py-2.5 px-3">Specialization</th>
                  <th className="py-2.5 px-3">Assigned Client &amp; Project</th>
                  <th className="py-2.5 px-3">Assigned Equipment</th>
                  <th className="py-2.5 px-3">SIO Expiry</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Assignment Actions</th>
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
                          <span className="text-slate-400 italic">No Client Assigned</span>
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
                            <AlertCircle className="w-3 h-3" /> Renew Soon
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1 mt-0.5">
                            <CheckCircle2 className="w-3 h-3" /> License Valid
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
                            title="Assign to Client, Project, and Equipment"
                          >
                            Assign
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteOperator(op.id, op.name)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                            title="Delete Operator"
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
                Equipment Status Reports Submitted by Users / Field Operators
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
              Refresh Data
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <th className="py-2.5 px-4">Submission Time</th>
                  <th className="py-2.5 px-4">Asset Tag / Equipment</th>
                  <th className="py-2.5 px-4">Reporting Operator</th>
                  <th className="py-2.5 px-4 text-center">Equipment Status</th>
                  <th className="py-2.5 px-4 text-right">Hour Meter (HM)</th>
                  <th className="py-2.5 px-4">Project Location</th>
                  <th className="py-2.5 px-4">Issue / Damage Notes</th>
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
                <h3 className="text-sm font-bold text-slate-900">Create Repair Ticket by Barcode</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWorkOrder} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Equipment *</label>
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
                <label className="block font-semibold text-slate-700 mb-1">Repair Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Replace boom hydraulic hose & perform 2,500-hour service"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded font-medium focus:border-slate-800 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800"
                  >
                    <option value="LOW">Low (Routine)</option>
                    <option value="MEDIUM">Medium (Standard Service)</option>
                    <option value="HIGH">High (Urgent)</option>
                    <option value="CRITICAL">Critical (Equipment Breakdown)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Service Type</label>
                  <select
                    value={type}
                    onChange={(e: any) => setType(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800"
                  >
                    <option value="CORRECTIVE">Corrective (Damage Repair)</option>
                    <option value="PREVENTIVE">Preventive (Scheduled Maintenance)</option>
                    <option value="RENTAL_RETURN_INSPECTION">Rental Return Inspection</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Technician / Lead Mechanic</label>
                <input
                  type="text"
                  value={technician}
                  onChange={(e) => setTechnician(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:border-slate-800 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estimated Spare Parts Cost (IDR)</label>
                  <input
                    type="number"
                    value={partsCost}
                    onChange={(e) => setPartsCost(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estimated Labor Cost (IDR)</label>
                  <input
                    type="number"
                    value={laborCost}
                    onChange={(e) => setLaborCost(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Damage Description &amp; Work Instructions</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Replacement parts, mechanic's analysis, and work notes..."
                  className="w-full p-2 border border-slate-300 rounded outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded cursor-pointer"
                >
                  Create Work Order
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
                Complete Work Order: {completingWo.workOrderNumber}
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
                  Completion Notes &amp; Operational Safety Test *
                </label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded font-medium focus:border-emerald-600 outline-none"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded border border-emerald-200 text-emerald-800 text-[11px]">
                The equipment will automatically return to <strong>AVAILABLE</strong> status and be ready for rental or project use.
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
                  Confirm Completion &amp; Activate Equipment
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
                  Register Operator &amp; SIO Certificate (K3)
                </h3>
              </div>
              <button onClick={() => setShowAddOperatorModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOperator} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Operator Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Alex Morgan"
                    value={newOpName}
                    onChange={(e) => setNewOpName(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-medium focus:border-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Operator Badge ID</label>
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
                  <label className="block font-semibold text-slate-700 mb-1">SIO Certificate Number *</label>
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
                  <label className="block font-semibold text-slate-700 mb-1">SIO License Class *</label>
                  <select
                    value={newOpSioClass}
                    onChange={(e: any) => setNewOpSioClass(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 font-semibold"
                  >
                    <option value="KELAS_1">Class I (Capacity &gt; 100 Tons / Heavy)</option>
                    <option value="KELAS_2">Class II (Capacity 25 - 100 Tons)</option>
                    <option value="KELAS_3">Class III (Capacity &lt; 25 Tons)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SIO Expiration Date *</label>
                  <input
                    type="date"
                    required
                    value={newOpSioExpiry}
                    onChange={(e) => setNewOpSioExpiry(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone / WhatsApp Number</label>
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
                <label className="block font-semibold text-slate-700 mb-1">Equipment Specialization</label>
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
                  <label className="block font-semibold text-slate-700 mb-1">Assign to Equipment</label>
                  <select
                    value={newOpAssignedAsset}
                    onChange={(e) => setNewOpAssignedAsset(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800"
                  >
                    <option value="">-- Standby / Unassigned --</option>
                    {assets.map((a) => (
                      <option key={a.id} value={a.id}>
                        [{a.assetTag}] {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Project / Site Location</label>
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
                  <span className="font-semibold block text-slate-700">Attach SIO Document (PDF / Image)</span>
                  <span className="text-[10px] text-slate-400">Digital K3 work safety certificate</span>
                </div>
                <label className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded font-semibold text-xs hover:bg-slate-100 cursor-pointer flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  Upload SIO
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
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded cursor-pointer"
                >
                  Save Operator &amp; SIO
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
                Maintenance Serviceability Certificate &amp; Barcode
              </h3>
              <button onClick={() => setPrintingCertWo(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-white border-2 border-emerald-600 rounded-lg p-4 text-center space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-xs text-emerald-800">MAINTENANCE CERTIFICATE</span>
                <span className="text-[10px] font-mono font-bold text-emerald-700">ROADWORTHY</span>
              </div>

              <QrCode className="w-20 h-20 text-slate-900 mx-auto" />
              <div className="font-mono text-sm font-bold text-slate-900">{printingCertWo.workOrderNumber}</div>

              <div className="text-left bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1 font-mono text-[10px]">
                <div>TAG: <strong>{printingCertWo.assetTag}</strong></div>
                <div>UNIT: {printingCertWo.assetName}</div>
                <div>TECHNICIAN: {printingCertWo.assignedTechnician}</div>
                <div>COMPLETION DATE: {printingCertWo.completedDate || '2026-10-15'}</div>
                <div>NOTES: {printingCertWo.resolutionNotes}</div>
              </div>

              <span className="text-[9px] text-slate-400 block italic">
                This unit has passed pressure testing and workplace safety inspection.
              </span>
            </div>

            <div className="no-print pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPrintingCertWo(null)}
                className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Service Tag
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
                  Assign Operator: {assigningOp.name}
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
                <label className="block font-semibold text-slate-700 mb-1">Select Client / Customer *</label>
                <select
                  value={assignCustomerId}
                  onChange={(e) => setAssignCustomerId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded bg-white font-medium"
                >
                  <option value="">-- Internal Project / Depot --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.customerCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Project / Work Site Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Morowali Smelter Project, Block B-4"
                  value={assignProjectName}
                  onChange={(e) => setAssignProjectName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Operated Equipment *</label>
                <select
                  value={assignAssetId}
                  onChange={(e) => setAssignAssetId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded bg-white font-medium"
                >
                  <option value="">-- Standby / No Equipment Assigned --</option>
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
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded cursor-pointer"
                >
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
