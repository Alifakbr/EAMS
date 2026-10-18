import { exportExcelFromHtml } from '../utils/download.ts';
import { BarcodeScanner } from './BarcodeScanner.tsx';
import React, { useState, useEffect } from 'react';
import { Asset, OperatorAttendanceLog } from '../types/index.ts';
import { api } from '../services/api.ts';
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Camera,
  Search,
  Truck,
  Wrench,
  Printer,
  Calendar,
  FileCheck,
  ShieldAlert,
  Flame,
  Zap,
  MapPin,
  RefreshCw,
  Info,
  UserCheck,
  Activity,
  X,
  TrendingUp,
  Edit2,
  Download,
  Filter,
  FileSpreadsheet,
} from 'lucide-react';

interface OperatorScanStatusViewProps {
  assets: Asset[];
  currentUserName?: string;
  onRefreshAll?: () => void;
}

export const OperatorScanStatusView: React.FC<OperatorScanStatusViewProps> = ({
  assets,
<<<<<<< HEAD
  currentUserName = 'Agus Santoso (Field Operator)',
=======
  currentUserName = 'Agus Santoso (Operator Lapangan)',
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
  onRefreshAll,
}) => {
  const [selectedBarcode, setSelectedBarcode] = useState<string>('AST-10024');
  const [manualInput, setManualInput] = useState<string>('');
  const [activeAsset, setActiveAsset] = useState<Asset | null>(null);
  const [loadingAsset, setLoadingAsset] = useState(false);
  const [attendanceLogs, setAttendanceLogs] = useState<OperatorAttendanceLog[]>([]);
  const [isScanningActive, setIsScanningActive] = useState(false);

<<<<<<< HEAD
  // Mode: ATTENDANCE (check-in/check-out), BREAKDOWN (report damage), or TIMESHEET_SUMMARY
=======
  // Mode: ATTENDANCE (Absen Datang/Pulang) or BREAKDOWN (Lapor Rusak) or TIMESHEET_SUMMARY
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
  const [activeActionTab, setActiveActionTab] = useState<'ATTENDANCE' | 'REPORT_BREAKDOWN' | 'HISTORY_TIMESHEET'>('ATTENDANCE');

  // Timesheet Period Adjuster States
  const [periodPreset, setPeriodPreset] = useState<'ALL' | 'TODAY' | '7D' | 'MONTH' | 'LAST_MONTH'>('MONTH');
  const [timesheetStartDate, setTimesheetStartDate] = useState<string>('2026-10-01');
  const [timesheetEndDate, setTimesheetEndDate] = useState<string>('2026-10-31');

  // Timesheet Jam Datang & Pulang Adjuster Modal State
  const [editingTimesheetLog, setEditingTimesheetLog] = useState<OperatorAttendanceLog | null>(null);
  const [editDate, setEditDate] = useState<string>('');
  const [editCheckInTime, setEditCheckInTime] = useState<string>('');
  const [editCheckOutTime, setEditCheckOutTime] = useState<string>('');
  const [editCheckInHourMeter, setEditCheckInHourMeter] = useState<string>('');
  const [editCheckOutHourMeter, setEditCheckOutHourMeter] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editStatus, setEditStatus] = useState<'CHECKED_IN' | 'CHECKED_OUT' | 'BREAKDOWN_REPORTED'>('CHECKED_OUT');
  const [editVerifiedForBilling, setEditVerifiedForBilling] = useState<boolean>(true);
  const [savingTimesheetEdit, setSavingTimesheetEdit] = useState<boolean>(false);

  // Attendance Form State
  const [hourMeterInput, setHourMeterInput] = useState<string>('2450.5');
<<<<<<< HEAD
  const [attendanceNotes, setAttendanceNotes] = useState<string>('Routine morning field operations shift');
=======
  const [attendanceNotes, setAttendanceNotes] = useState<string>('Absen rutin operasi lapangan shift pagi');
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443

  // Breakdown Report State
  const [damageCategory, setDamageCategory] = useState<
    'ENGINE' | 'HYDRAULIC' | 'ELECTRICAL' | 'CHASSIS_TRACK' | 'STRUCTURE_BOOM' | 'BRAKES_STEERING' | 'OTHER'
  >('HYDRAULIC');
  const [damageDescription, setDamageDescription] = useState<string>('');

  // Submit Feedback State
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Timesheet Modal Print State
  const [showPrintTimesheetModal, setShowPrintTimesheetModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('2026-10');

  // Load Attendance Logs
  const loadAttendance = async () => {
    try {
      const res = await api.getAttendanceLogs();
      setAttendanceLogs(res.data);
    } catch (err) {
      console.error('Failed to load attendance logs:', err);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, []);

  // Lookup Asset by Barcode
  const lookupAsset = async (code: string) => {
    if (!code) return;
    setLoadingAsset(true);
    setSubmitMessage(null);
    try {
      const res = await api.getAssetByBarcode(code);
      if (res.asset) {
        setActiveAsset(res.asset);
        setSelectedBarcode(res.asset.assetTag);
        setHourMeterInput(res.asset.legalDocs?.hourMeter?.toString() || '2450.5');
      }
    } catch {
      const found = assets.find(
        (a) =>
          a.assetTag.toLowerCase() === code.toLowerCase() ||
          a.serialNumber.toLowerCase() === code.toLowerCase() ||
          a.legalDocs?.plateNumber?.toLowerCase() === code.toLowerCase()
      );
      if (found) {
        setActiveAsset(found);
        setSelectedBarcode(found.assetTag);
        setHourMeterInput(found.legalDocs?.hourMeter?.toString() || '2450.5');
      } else {
<<<<<<< HEAD
        alert(`Equipment with barcode/tag "${code}" was not found.`);
=======
        alert(`Alat berat dengan barcode/tag "${code}" tidak ditemukan dalam sistem.`);
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
      }
    } finally {
      setLoadingAsset(false);
    }
  };

  useEffect(() => {
    if (assets.length > 0 && !activeAsset) {
      const initial = assets.find((a) => a.assetTag === 'AST-10024') || assets[0];
      if (initial) {
        setActiveAsset(initial);
        setSelectedBarcode(initial.assetTag);
        setHourMeterInput(initial.legalDocs?.hourMeter?.toString() || '2450.5');
      }
    }
  }, [assets]);

<<<<<<< HEAD
  // Handle check-in
  const handleCheckIn = async () => {
    if (!activeAsset) {
      alert('Select or scan an equipment barcode first.');
=======
  // Handle Check-In (Datang Absen)
  const handleCheckIn = async () => {
    if (!activeAsset) {
      alert('Pilih atau scan barcode alat berat terlebih dahulu.');
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
      return;
    }

    setSubmitting(true);
    setSubmitMessage(null);
    try {
      const res = await api.checkInAttendance({
        barcode: activeAsset.assetTag,
        hourMeter: parseFloat(hourMeterInput) || 0,
        notes: attendanceNotes,
        operatorName: currentUserName,
      });

      setSubmitMessage({
        type: 'success',
<<<<<<< HEAD
        text: `CHECK-IN SUCCESSFUL! Operator ${currentUserName} checked in on unit ${res.assetTag} at ${res.checkInTime} (starting hour meter: ${res.checkInHourMeter}). The equipment is marked as active.`,
=======
        text: `ABSEN DATANG BERHASIL! Operator ${currentUserName} tercatat masuk pada unit ${res.assetTag} pada jam ${res.checkInTime} (HM Masuk: ${res.checkInHourMeter}). Alat teridentifikasi aktif bekerja.`,
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
      });

      await loadAttendance();
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
<<<<<<< HEAD
      setSubmitMessage({ type: 'error', text: `Check-in failed: ${err.message}` });
=======
      setSubmitMessage({ type: 'error', text: `Gagal absen datang: ${err.message}` });
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
    } finally {
      setSubmitting(false);
    }
  };

<<<<<<< HEAD
  // Handle check-out
  const handleCheckOut = async () => {
    if (!activeAsset) {
      alert('Select or scan an equipment barcode first.');
=======
  // Handle Check-Out (Pulang Absen)
  const handleCheckOut = async () => {
    if (!activeAsset) {
      alert('Pilih atau scan barcode alat berat terlebih dahulu.');
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
      return;
    }

    setSubmitting(true);
    setSubmitMessage(null);
    try {
      const res = await api.checkOutAttendance({
        barcode: activeAsset.assetTag,
        hourMeter: parseFloat(hourMeterInput) || 0,
        notes: attendanceNotes,
        operatorName: currentUserName,
      });

      setSubmitMessage({
        type: 'success',
<<<<<<< HEAD
        text: `CHECK-OUT SUCCESSFUL! Shift ended at ${res.checkOutTime} (ending hour meter: ${res.checkOutHourMeter}). Total operating time: ${res.workingHours} hours. Recorded for the customer invoice attachment.`,
=======
        text: `ABSEN PULANG BERHASIL! Shift selesai pada jam ${res.checkOutTime} (HM Keluar: ${res.checkOutHourMeter}). Total jam operasi aktif: ${res.workingHours} Jam. Tercatat resmi untuk lampiran tagihan pelanggan.`,
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
      });

      await loadAttendance();
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
<<<<<<< HEAD
      setSubmitMessage({ type: 'error', text: `Check-out failed: ${err.message}` });
=======
      setSubmitMessage({ type: 'error', text: `Gagal absen pulang: ${err.message}` });
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Breakdown Report to Technical Service
  const handleReportBreakdown = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAsset) {
<<<<<<< HEAD
      alert('Select or scan an equipment barcode first.');
=======
      alert('Pilih atau scan barcode alat berat terlebih dahulu.');
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
      return;
    }

    if (!damageDescription.trim()) {
<<<<<<< HEAD
      alert('A damage or issue description is required so Technical Service can investigate.');
=======
      alert('Deskripsi kerusakan atau kendala wajib diisi agar tim Technical Service dapat menganalisis.');
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
      return;
    }

    setSubmitting(true);
    setSubmitMessage(null);
    try {
      const res = await api.reportBreakdown({
        barcode: activeAsset.assetTag,
        hourMeter: parseFloat(hourMeterInput) || 0,
        damageCategory,
        damageDescription,
        operatorName: currentUserName,
      });

      setSubmitMessage({
        type: 'success',
<<<<<<< HEAD
        text: `DAMAGE REPORT SENT TO TECHNICAL SERVICE! Repair ticket [${res.workOrder.workOrderNumber}] was created. Unit ${activeAsset.assetTag} is now marked IN_MAINTENANCE until repaired.`,
=======
        text: `LAPORAN KERUSAKAN TERKIRIM KE TECHNICAL SERVICE! Tiket perbaikan [${res.workOrder.workOrderNumber}] telah dibuat secara otomatis. Unit ${activeAsset.assetTag} saat ini dikunci dalam status IN_MAINTENANCE hingga diperbaiki.`,
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
      });

      setDamageDescription('');
      await loadAttendance();
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
<<<<<<< HEAD
      setSubmitMessage({ type: 'error', text: `Failed to submit damage report: ${err.message}` });
=======
      setSubmitMessage({ type: 'error', text: `Gagal mengirim laporan kerusakan: ${err.message}` });
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics calculation
  const totalOperatingHours = attendanceLogs.reduce((acc, log) => acc + (log.workingHours || 0), 0);
  const totalVerifiedShifts = attendanceLogs.filter((log) => log.status === 'CHECKED_OUT').length;
  const breakdownCount = attendanceLogs.filter((log) => log.status === 'BREAKDOWN_REPORTED').length;
  const averageHoursPerShift = totalVerifiedShifts > 0 ? (totalOperatingHours / totalVerifiedShifts).toFixed(1) : '8.0';

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Top Banner Header */}
      <div className="bg-slate-900 text-white rounded-lg p-5 shadow-lg border border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono tracking-wider font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
              Field Operations · Barcode Attendance &amp; Timesheet
            </span>
            <h1 className="text-xl font-bold tracking-tight text-white mt-1 flex items-center gap-2">
              <QrCode className="w-6 h-6 text-amber-400" />
<<<<<<< HEAD
              Operator Attendance &amp; Equipment Issue Barcode Scanner
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Scan the equipment barcode at the start and end of each shift. Report issues that cannot be resolved in the field directly to Technical Service.
=======
              Scan Barcode Absensi Operator &amp; Laporan Kerusakan
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Scan barcode alat saat datang (absen masuk) dan pulang (absen keluar). Jika terjadi kerusakan yang tidak dapat ditangani, kirim laporan langsung ke Technical Service.
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
            </p>
          </div>

          <div className="text-right text-xs bg-slate-800/80 px-4 py-2.5 rounded-md border border-slate-700">
<<<<<<< HEAD
            <span className="text-slate-400 block text-[10px]">Field Operator:</span>
=======
            <span className="text-slate-400 block text-[10px]">Operator Lapangan:</span>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
            <span className="font-semibold text-amber-300">{currentUserName}</span>
          </div>
        </div>

        {/* 4 Utilization & Timesheet Indicator Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800 text-xs">
          <div className="bg-slate-950/60 p-3 rounded border border-slate-800">
<<<<<<< HEAD
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Operating Hours</span>
            <div className="text-xl font-bold text-emerald-400 mt-0.5 font-mono">{totalOperatingHours.toFixed(1)} hours</div>
            <span className="text-[10px] text-slate-500">Invoice billing basis</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Completed Shifts (Verified)</span>
            <div className="text-xl font-bold text-amber-400 mt-0.5 font-mono">{totalVerifiedShifts} Shift</div>
            <span className="text-[10px] text-slate-500">Average: {averageHoursPerShift} hours/shift</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Equipment Utilization</span>
            <div className="text-xl font-bold text-indigo-400 mt-0.5 font-mono">87.5%</div>
            <span className="text-[10px] text-emerald-400">High (Optimal)</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Breakdown Reports</span>
            <div className="text-xl font-bold text-rose-400 mt-0.5 font-mono">{breakdownCount} incidents</div>
            <span className="text-[10px] text-slate-500">Forwarded to Technical Service</span>
=======
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Jam Kerja Aktif</span>
            <div className="text-xl font-bold text-emerald-400 mt-0.5 font-mono">{totalOperatingHours.toFixed(1)} Jam</div>
            <span className="text-[10px] text-slate-500">Dasar invoice tagihan</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Shift Selesai (Verified)</span>
            <div className="text-xl font-bold text-amber-400 mt-0.5 font-mono">{totalVerifiedShifts} Shift</div>
            <span className="text-[10px] text-slate-500">Rata-rata: {averageHoursPerShift} Jam/shift</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Indikator Utilisasi Alat</span>
            <div className="text-xl font-bold text-indigo-400 mt-0.5 font-mono">87.5%</div>
            <span className="text-[10px] text-emerald-400">Tinggi (Optimal)</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Laporan Breakdown</span>
            <div className="text-xl font-bold text-rose-400 mt-0.5 font-mono">{breakdownCount} Insiden</div>
            <span className="text-[10px] text-slate-500">Diteruskan ke Technical Service</span>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 bg-white px-4 pt-2 rounded-t-lg shadow-2xs gap-3">
        <button
          onClick={() => setActiveActionTab('ATTENDANCE')}
          className={`pb-3 px-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeActionTab === 'ATTENDANCE'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4 text-emerald-600" />
<<<<<<< HEAD
          Equipment Check-In &amp; Check-Out
=======
          Absensi Datang &amp; Pulang Alat
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
        </button>

        <button
          onClick={() => setActiveActionTab('REPORT_BREAKDOWN')}
          className={`pb-3 px-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeActionTab === 'REPORT_BREAKDOWN'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-600" />
<<<<<<< HEAD
          Report Equipment Damage
=======
          Lapor Alat Rusak ke Technical Service
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
        </button>

        <button
          onClick={() => setActiveActionTab('HISTORY_TIMESHEET')}
          className={`pb-3 px-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeActionTab === 'HISTORY_TIMESHEET'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck className="w-4 h-4 text-indigo-600" />
<<<<<<< HEAD
          Timesheet Summary ({attendanceLogs.length})
=======
          Timesheet Summary (Ringkasan Jam Kerja &amp; Absensi) ({attendanceLogs.length})
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
        </button>
      </div>

      {/* Barcode Scanner Box (Always available on top) */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-600" />
<<<<<<< HEAD
            <h2 className="text-sm font-bold text-slate-900">Scan Equipment Barcode at Project Site</h2>
=======
            <h2 className="text-sm font-bold text-slate-900">Pemindaian Barcode Alat Berat di Lokasi Proyek</h2>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
          </div>
          <button
            type="button"
            onClick={() => setIsScanningActive(!isScanningActive)}
            className={`px-3 py-1 text-xs font-semibold rounded flex items-center gap-1.5 transition-colors cursor-pointer ${
              isScanningActive
                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
<<<<<<< HEAD
            {isScanningActive ? 'Close Camera' : 'Open Camera Scanner'}
=======
            {isScanningActive ? 'Tutup Kamera' : 'Buka Scanner Kamera'}
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
          </button>
        </div>

        {/* Scanner kamera asli (QR / Barcode) */}
        {isScanningActive && (
          <BarcodeScanner
            onClose={() => setIsScanningActive(false)}
            onDetected={(code) => {
              setManualInput(code);
              lookupAsset(code);
              setIsScanningActive(false);
            }}
          />
        )}

        {/* Input Barcode Manual & Dropdown */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-8">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
<<<<<<< HEAD
              Enter Equipment Barcode / Serial Number / License Plate:
=======
              Ketik Barcode / Nomor Seri / Plat Alat Berat:
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
<<<<<<< HEAD
                placeholder="Enter a barcode tag (e.g., AST-10024, AST-10088)..."
=======
                placeholder="Ketik Tag Barcode (cth: AST-10024, AST-10088)..."
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') lookupAsset(manualInput);
                }}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded font-mono focus:border-indigo-600 outline-none"
              />
            </div>
          </div>

          <div className="sm:col-span-4 flex gap-2">
            <button
              type="button"
              onClick={() => lookupAsset(manualInput || selectedBarcode)}
              disabled={loadingAsset}
              className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loadingAsset ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
<<<<<<< HEAD
              Find Equipment
=======
              Cari Unit
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
            </button>

            <select
              value={selectedBarcode}
              onChange={(e) => lookupAsset(e.target.value)}
              className="py-2 px-2.5 text-xs border border-slate-300 rounded bg-slate-50 font-medium text-slate-700 outline-none cursor-pointer"
            >
              {assets.map((a) => (
                <option key={a.id} value={a.assetTag}>
                  {a.assetTag} - {a.name.slice(0, 20)}...
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Asset Card Display */}
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
                      : activeAsset.status === 'RENTED'
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
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
                  <span className="text-slate-400 block text-[10px]">Hour Meter (HM):</span>
                  <span className="font-semibold text-slate-800">{activeAsset.legalDocs?.hourMeter || '2450.5'} HM</span>
                </div>
                <div>
<<<<<<< HEAD
                  <span className="text-slate-400 block text-[10px]">Project Site:</span>
=======
                  <span className="text-slate-400 block text-[10px]">Lokasi Proyek:</span>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  <span className="font-semibold text-slate-800">{activeAsset.warehouseLocation}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Customer Penyewa:</span>
                  <span className="font-semibold text-slate-800">{activeAsset.currentCustomerName || 'Internal Depot'}</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-4 flex flex-col items-center justify-center p-3 bg-white rounded border border-slate-200 text-center">
              <QrCode className="w-12 h-12 text-slate-800" />
              <span className="text-[10px] font-mono font-bold text-slate-700 mt-1">{activeAsset.assetTag}</span>
              <span className="text-[9px] text-emerald-600 font-semibold">Barcode Fisik Valid</span>
            </div>
          </div>
        )}
      </div>

      {/* Submit Message Feedback */}
      {submitMessage && (
        <div
          className={`p-3.5 rounded-lg text-xs flex items-start gap-2 shadow-2xs ${
            submitMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border border-rose-300 text-rose-900'
          }`}
        >
          {submitMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="font-medium">{submitMessage.text}</div>
        </div>
      )}

      {/* TAB 1: ABSENSI DATANG & PULANG ALAT BERAT */}
      {activeActionTab === 'ATTENDANCE' && activeAsset && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600" />
<<<<<<< HEAD
              <h2 className="text-sm font-bold text-slate-900">Equipment Check-In &amp; Check-Out Form</h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Date: {new Date().toLocaleDateString('en-US')} · Current Time: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
=======
              <h2 className="text-sm font-bold text-slate-900">Form Absensi Kehadiran &amp; Jam Keluar/Masuk Alat</h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Tanggal: {new Date().toLocaleDateString('id-ID')} · Waktu Real-Time: {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
<<<<<<< HEAD
              Physical Hour Meter Reading (HM) *
=======
                Catatan Hour Meter (HM) Fisik Mesin *
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
              </label>
              <input
                type="number"
                step="0.1"
                value={hourMeterInput}
                onChange={(e) => setHourMeterInput(e.target.value)}
<<<<<<< HEAD
                placeholder="e.g., 2450.5"
                className="w-full p-2.5 border border-slate-300 rounded font-mono text-sm focus:border-indigo-600 outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Enter the current machine hour meter reading when checking in or out.
=======
                placeholder="cth: 2450.5"
                className="w-full p-2.5 border border-slate-300 rounded font-mono text-sm focus:border-indigo-600 outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Masukkan pembacaan Hour Meter mesin terkini pada saat absen.
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
<<<<<<< HEAD
                Activity / Work Location
=======
                Keterangan Aktivitas / Lokasi Kerja
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
              </label>
              <input
                type="text"
                value={attendanceNotes}
                onChange={(e) => setAttendanceNotes(e.target.value)}
<<<<<<< HEAD
                placeholder="e.g., Block B foundation excavation, clear weather..."
=======
                placeholder="cth: Galian tanah pondasi Blok B, cuaca cerah..."
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                className="w-full p-2.5 border border-slate-300 rounded text-xs focus:border-indigo-600 outline-none"
              />
            </div>
          </div>

<<<<<<< HEAD
          {/* Check-in / check-out actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
            {/* Check-in */}
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <Clock className="w-4 h-4 text-emerald-600" />
                1. Check In (Start Shift)
              </div>
              <p className="text-xs text-slate-600">
                Check in when your shift starts. The equipment will be marked as active using the start time and initial hour meter reading.
=======
          {/* Action Buttons: Datang vs Pulang */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
            {/* Datang Absen */}
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <Clock className="w-4 h-4 text-emerald-600" />
                1. Datang Absen (Mulai Kerja)
              </div>
              <p className="text-xs text-slate-600">
                Klik saat mulai shift. Alat langsung teridentifikasi aktif bekerja sesuai jam keluar dan HM awal.
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
              </p>
              <button
                type="button"
                onClick={handleCheckIn}
                disabled={submitting}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
<<<<<<< HEAD
                Check In: Start Equipment Operation
              </button>
            </div>

            {/* Check-out */}
            <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                2. Check Out (End Shift)
              </div>
              <p className="text-xs text-slate-600">
                Check out at the end of your shift. Active operating hours are calculated and the timesheet is verified for monthly billing.
=======
                Datang Absen: Mulai Operasi Alat
              </button>
            </div>

            {/* Pulang Absen */}
            <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                2. Pulang Absen (Selesai Shift)
              </div>
              <p className="text-xs text-slate-600">
                Klik saat akhir shift. Menghitung total jam operasi aktif dan memverifikasi data timesheet untuk tagihan bulanan.
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
              </p>
              <button
                type="button"
                onClick={handleCheckOut}
                disabled={submitting}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
<<<<<<< HEAD
                Check Out: End Shift &amp; Calculate Hours
=======
                Pulang Absen: Selesaikan Shift &amp; Hitung Jam
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LAPOR ALAT RUSAK KE TECHNICAL SERVICE */}
      {activeActionTab === 'REPORT_BREAKDOWN' && activeAsset && (
        <form onSubmit={handleReportBreakdown} className="bg-white rounded-lg border-2 border-rose-300 p-5 shadow-xs space-y-4">
          <div className="pb-3 border-b border-rose-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <h2 className="text-sm font-bold text-slate-900">
<<<<<<< HEAD
                Equipment Damage / Breakdown Report (Sent to Technical Service)
              </h2>
            </div>
            <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              Automatic Ticket
=======
                Laporan Kerusakan / Breakdown Alat (Diteruskan ke Technical Service)
              </h2>
            </div>
            <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              Tiket Otomatis
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
            </span>
          </div>

          <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-900">
<<<<<<< HEAD
            <strong>Notice:</strong> If equipment breaks down or has a technical issue that cannot be resolved in the field, submit this report. The system will set the unit to <strong>IN_MAINTENANCE</strong> and forward it to the <strong>Technical Service</strong> dashboard for repair.
=======
            <strong>Pemberitahuan:</strong> Jika alat mogok atau terdapat kendala teknis yang tidak dapat ditangani sendiri oleh operator, kirimkan laporan ini. Sistem akan mengunci unit ke status <strong>IN_MAINTENANCE</strong> dan meneruskannya ke dashboard <strong>Technical Service</strong> untuk diperbaiki oleh teknisi mekanik.
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
<<<<<<< HEAD
                Damaged Component *
=======
                Kategori Bagian yang Mengalami Kerusakan *
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
              </label>
              <select
                value={damageCategory}
                onChange={(e: any) => setDamageCategory(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded text-xs bg-white outline-none"
              >
<<<<<<< HEAD
                <option value="ENGINE">Engine (Overheating, Unusual Noise, Oil Leak)</option>
                <option value="HYDRAULIC">Hydraulic System (Burst Hose, Low Pressure, Cylinder Seal)</option>
                <option value="ELECTRICAL">Electrical (Low Battery, Sensor Error, Starter Failure)</option>
                <option value="CHASSIS_TRACK">Track &amp; Undercarriage (Detached Track, Damaged Roller)</option>
                <option value="STRUCTURE_BOOM">Boom / Arm / Bucket (Crack, Worn Pin)</option>
                <option value="BRAKES_STEERING">Brakes &amp; Steering (Brake Failure, Jammed Steering)</option>
                <option value="OTHER">Other Technical Issue</option>
=======
                <option value="ENGINE">Mesin Utama / Engine (Overheat, Suara Kasar, Oli Bocor)</option>
                <option value="HYDRAULIC">Sistem Hidrolik (Selang Pecah, Tekanan Lemah, Sil Silinder)</option>
                <option value="ELECTRICAL">Kelistrikan (Aki Drop, Sensor Eror, Starter Tidak Merespons)</option>
                <option value="CHASSIS_TRACK">Track Shoe &amp; Roda Bawah (Rantai Lepas, Roller Rusak)</option>
                <option value="STRUCTURE_BOOM">Struktur Boom / Arm / Bucket (Retak, Pin Aus)</option>
                <option value="BRAKES_STEERING">Rem &amp; Kemudi (Rem Blong, Kemudi Macet)</option>
                <option value="OTHER">Kerusakan Teknis Lainnya</option>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
<<<<<<< HEAD
                Hour Meter (HM) at Breakdown
=======
                Hour Meter (HM) Saat Breakdown Terjadi
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
              </label>
              <input
                type="number"
                step="0.1"
                value={hourMeterInput}
                onChange={(e) => setHourMeterInput(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded font-mono text-xs outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
<<<<<<< HEAD
              Describe the Symptoms &amp; Sequence of Events *
            </label>
            <textarea
              rows={3}
              placeholder="Describe what happened (e.g., while lifting a bucket load, a loud bang was heard and hydraulic oil sprayed from the left boom's main hose)..."
=======
              Deskripsi Lengkap Gejala &amp; Kronologi Kerusakan *
            </label>
            <textarea
              rows={3}
              placeholder="Jelaskan detail apa yang terjadi (misal: saat mengangkat beban bucket, terdengar dentuman keras dan oli hidrolik menyembur dari selang utama boom kiri)..."
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
              value={damageDescription}
              onChange={(e) => setDamageDescription(e.target.value)}
              className="w-full p-2.5 text-xs border border-slate-300 rounded focus:border-rose-600 outline-none"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded text-xs flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
<<<<<<< HEAD
              Send Damage Ticket to Technical Service
=======
              Kirim Tiket Kerusakan ke Technical Service
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: TIMESHEET SUMMARY & PERIOD ADJUSTER */}
      {activeActionTab === 'HISTORY_TIMESHEET' && (() => {
        // Filter attendance logs by selected period
        const filteredLogs = attendanceLogs.filter((log) => {
          if (periodPreset === 'ALL') return true;
          if (!log.date) return true;
          return log.date >= timesheetStartDate && log.date <= timesheetEndDate;
        });

        const periodTotalHours = filteredLogs.reduce((acc, log) => acc + (log.workingHours || 0), 0);
        const periodVerifiedCount = filteredLogs.filter((l) => l.status === 'CHECKED_OUT').length;
        const periodActiveCount = filteredLogs.filter((l) => l.status === 'CHECKED_IN').length;

        const handleSetPreset = (preset: 'ALL' | 'TODAY' | '7D' | 'MONTH' | 'LAST_MONTH') => {
          setPeriodPreset(preset);
          const now = new Date();
          const toYmd = (d: Date) => d.toISOString().split('T')[0];

          if (preset === 'ALL') {
            setTimesheetStartDate('2026-01-01');
            setTimesheetEndDate('2026-12-31');
          } else if (preset === 'TODAY') {
            const todayStr = toYmd(now);
            setTimesheetStartDate(todayStr);
            setTimesheetEndDate(todayStr);
          } else if (preset === '7D') {
            const past7 = new Date();
            past7.setDate(past7.getDate() - 7);
            setTimesheetStartDate(toYmd(past7));
            setTimesheetEndDate(toYmd(now));
          } else if (preset === 'MONTH') {
            setTimesheetStartDate('2026-10-01');
            setTimesheetEndDate('2026-10-31');
          } else if (preset === 'LAST_MONTH') {
            setTimesheetStartDate('2026-09-01');
            setTimesheetEndDate('2026-09-30');
          }
        };

        const handleOpenAdjustModal = (log: OperatorAttendanceLog) => {
          setEditingTimesheetLog(log);
          setEditDate(log.date || '2026-10-16');
          setEditCheckInTime(log.checkInTime || '07:30');
          setEditCheckOutTime(log.checkOutTime || '17:00');
          setEditCheckInHourMeter(log.checkInHourMeter?.toString() || '2450.0');
          setEditCheckOutHourMeter(log.checkOutHourMeter?.toString() || '2458.5');
          setEditNotes(log.notes || '');
          setEditStatus(log.status);
          setEditVerifiedForBilling(log.status === 'CHECKED_OUT');
        };

        const handleSaveAdjustedTimesheet = async (e: React.FormEvent) => {
          e.preventDefault();
          if (!editingTimesheetLog) return;
          setSavingTimesheetEdit(true);
          try {
            const inHm = parseFloat(editCheckInHourMeter) || 0;
            const outHm = parseFloat(editCheckOutHourMeter) || inHm;
            const computedWorkingHours = outHm > inHm ? Math.round((outHm - inHm) * 10) / 10 : editingTimesheetLog.workingHours || 8.0;

            await api.updateAttendanceLog(editingTimesheetLog.id, {
              date: editDate,
              checkInTime: editCheckInTime,
              checkOutTime: editCheckOutTime,
              checkInHourMeter: inHm,
              checkOutHourMeter: outHm,
              workingHours: computedWorkingHours,
              notes: editNotes,
              status: editStatus,
            });

            await loadAttendance();
            if (onRefreshAll) onRefreshAll();
            setEditingTimesheetLog(null);
            setSubmitMessage({
              type: 'success',
<<<<<<< HEAD
              text: `Timesheet #${editingTimesheetLog.id} for unit ${editingTimesheetLog.assetTag} was updated: check-in ${editCheckInTime}, check-out ${editCheckOutTime}, operating hours: ${computedWorkingHours}.`,
            });
          } catch (err: any) {
            console.error('Failed to update timesheet:', err);
            alert('Failed to save timesheet changes. Please try again.');
=======
              text: `Timesheet #${editingTimesheetLog.id} unit ${editingTimesheetLog.assetTag} berhasil disesuaikan: Jam Datang ${editCheckInTime}, Jam Pulang ${editCheckOutTime}, HM Aktif: ${computedWorkingHours} Jam.`,
            });
          } catch (err: any) {
            console.error('Failed to update timesheet:', err);
            alert('Gagal menyimpan penyesuaian timesheet. Silakan coba kembali.');
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
          } finally {
            setSavingTimesheetEdit(false);
          }
        };

        const handleExportTimesheetExcel = () => {
<<<<<<< HEAD
          const filename = `Apex_Timesheet_Summary_${timesheetStartDate}_to_${timesheetEndDate}.xls`;
=======
          const filename = `Apex_Timesheet_Summary_${timesheetStartDate}_sd_${timesheetEndDate}.xls`;
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
          const rows = filteredLogs.map((l) => `
            <tr>
              <td>${l.date}</td>
              <td>${l.operatorName}</td>
              <td><strong>${l.assetTag}</strong></td>
              <td>${l.assetName}</td>
              <td>${l.checkInTime}</td>
              <td>${l.checkInHourMeter}</td>
              <td>${l.checkOutTime || '-'}</td>
              <td>${l.checkOutHourMeter || '-'}</td>
              <td><strong>${l.workingHours || 0} HM</strong></td>
              <td>${l.status}</td>
              <td>${l.notes || '-'}</td>
            </tr>
          `).join('');

          const content = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
              <head><meta charset="utf-8"/></head>
              <body>
<<<<<<< HEAD
                <h2>APEX EAMS - EQUIPMENT &amp; FIELD OPERATOR TIMESHEET SUMMARY</h2>
                <p>Period: ${timesheetStartDate} to ${timesheetEndDate} | Total Operating Hours: ${periodTotalHours.toFixed(1)} HM</p>
                <table border="1">
                  <tr style="background:#0f172a; color:#fff; font-weight:bold;">
                    <th>Date</th><th>Operator</th><th>Equipment Tag</th><th>Equipment Name</th>
                    <th>Check-In Time</th><th>Starting HM</th><th>Check-Out Time</th><th>Ending HM</th>
                    <th>Operating Hours (HM)</th><th>Status</th><th>Field Notes</th>
                  </tr>
                  ${rows}
                  <tr style="background:#f1f5f9; font-weight:bold;">
                    <td colspan="8" align="right">TOTAL VERIFIED OPERATING HOURS:</td>
=======
                <h2>APEX EAMS - TIMESHEET SUMMARY ALAT &amp; OPERATOR LAPANGAN</h2>
                <p>Periode: ${timesheetStartDate} s/d ${timesheetEndDate} | Total Jam Kerja: ${periodTotalHours.toFixed(1)} HM</p>
                <table border="1">
                  <tr style="background:#0f172a; color:#fff; font-weight:bold;">
                    <th>Tanggal</th><th>Operator</th><th>Tag Alat</th><th>Nama Unit</th>
                    <th>Jam Datang</th><th>HM Masuk</th><th>Jam Pulang</th><th>HM Keluar</th>
                    <th>Jam Kerja (HM)</th><th>Status</th><th>Catatan Lapangan</th>
                  </tr>
                  ${rows}
                  <tr style="background:#f1f5f9; font-weight:bold;">
                    <td colspan="8" align="right">TOTAL JAM KERJA TERVERIFIKASI:</td>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                    <td>${periodTotalHours.toFixed(1)} HM</td>
                    <td colspan="2"></td>
                  </tr>
                </table>
              </body>
            </html>
          `;
          exportExcelFromHtml(content, filename);
        };

        return (
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-5">
            {/* Header Timesheet Summary */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-900">
<<<<<<< HEAD
                    Field Equipment Timesheet Summary
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                    {filteredLogs.length} filtered logs
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Summary of check-in and check-out times, physical hour meter readings, and verified invoice attachments by work period.
=======
                    Timesheet Summary (Ringkasan Jam Kerja &amp; Absensi Alat Lapangan)
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                    {filteredLogs.length} Log Terfilter
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rekapitulasi jam datang, jam pulang, hour meter fisik, dan verifikasi lampiran tagihan resmi per periode kerja.
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                </p>
              </div>

              {/* Action Buttons: Export Excel & Cetak PDF */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleExportTimesheetExcel}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold rounded flex items-center gap-1.5 cursor-pointer shadow-2xs"
<<<<<<< HEAD
                  title="Export the filtered timesheet to Excel"
=======
                  title="Unduh data timesheet terfilter dalam format Excel"
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                >
                  <Download className="w-3.5 h-3.5 text-emerald-700" />
                  Download Excel
                </button>

                <button
                  type="button"
                  onClick={() => setShowPrintTimesheetModal(true)}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded flex items-center gap-1.5 shadow-2xs cursor-pointer"
<<<<<<< HEAD
                  title="Print the official customer invoice attachment"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  Print Invoice Attachment (PDF)
=======
                  title="Cetak lampiran tagihan resmi pelanggan"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  Cetak Lampiran Tagihan (PDF)
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                </button>
              </div>
            </div>

            {/* PERIOD ADJUSTER TOOLBAR */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Presets */}
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1 mr-1">
<<<<<<< HEAD
                    <Calendar className="w-3.5 h-3.5 text-slate-500" /> Adjust Period:
                  </span>
                  {[
                    { id: 'ALL', label: 'All Data' },
                    { id: 'TODAY', label: 'Today' },
                    { id: '7D', label: 'Last 7 Days' },
                    { id: 'MONTH', label: 'This Month (Oct 2026)' },
                    { id: 'LAST_MONTH', label: 'Last Month (Sep 2026)' },
=======
                    <Calendar className="w-3.5 h-3.5 text-slate-500" /> Adjust Periode:
                  </span>
                  {[
                    { id: 'ALL', label: 'Semua Data' },
                    { id: 'TODAY', label: 'Hari Ini' },
                    { id: '7D', label: '7 Hari Terakhir' },
                    { id: 'MONTH', label: 'Bulan Ini (Okt 2026)' },
                    { id: 'LAST_MONTH', label: 'Bulan Lalu (Sep 2026)' },
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSetPreset(p.id as any)}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                        periodPreset === p.id
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Custom Date Range Adjuster */}
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1">
<<<<<<< HEAD
                    <span className="text-slate-500 text-[11px]">From:</span>
=======
                    <span className="text-slate-500 text-[11px]">Dari:</span>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                    <input
                      type="date"
                      value={timesheetStartDate}
                      onChange={(e) => {
                        setTimesheetStartDate(e.target.value);
                        setPeriodPreset('ALL');
                      }}
                      className="px-2 py-1 text-xs border border-slate-300 rounded font-mono bg-white outline-none focus:border-slate-800"
                    />
                  </div>
                  <div className="flex items-center gap-1">
<<<<<<< HEAD
                    <span className="text-slate-500 text-[11px]">To:</span>
=======
                    <span className="text-slate-500 text-[11px]">Sampai:</span>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                    <input
                      type="date"
                      value={timesheetEndDate}
                      onChange={(e) => {
                        setTimesheetEndDate(e.target.value);
                        setPeriodPreset('ALL');
                      }}
                      className="px-2 py-1 text-xs border border-slate-300 rounded font-mono bg-white outline-none focus:border-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Period Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-200/80 text-xs">
                <div className="bg-white p-2.5 rounded border border-slate-200">
<<<<<<< HEAD
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Total Operating Hours</span>
                  <div className="text-lg font-bold font-mono text-emerald-700 mt-0.5">{periodTotalHours.toFixed(1)} HM</div>
                  <span className="text-[10px] text-slate-500">Selected period</span>
                </div>
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Completed Shifts (Check-Out)</span>
                  <div className="text-lg font-bold font-mono text-blue-700 mt-0.5">{periodVerifiedCount} Shift</div>
                  <span className="text-[10px] text-slate-500">Verified check-outs</span>
                </div>
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Currently Operating</span>
                  <div className="text-lg font-bold font-mono text-amber-700 mt-0.5">{periodActiveCount} Unit</div>
                  <span className="text-[10px] text-slate-500">Shift is still active</span>
                </div>
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Average Shift Duration</span>
                  <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                    {periodVerifiedCount > 0 ? (periodTotalHours / periodVerifiedCount).toFixed(1) : '8.0'} Jam
                  </div>
                  <span className="text-[10px] text-slate-500">Equipment hours efficiency</span>
=======
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Total Jam Kerja Aktif</span>
                  <div className="text-lg font-bold font-mono text-emerald-700 mt-0.5">{periodTotalHours.toFixed(1)} HM</div>
                  <span className="text-[10px] text-slate-500">Periode terfilter</span>
                </div>
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Shift Selesai (Pulang)</span>
                  <div className="text-lg font-bold font-mono text-blue-700 mt-0.5">{periodVerifiedCount} Shift</div>
                  <span className="text-[10px] text-slate-500">Terverifikasi check-out</span>
                </div>
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Sedang Beroperasi</span>
                  <div className="text-lg font-bold font-mono text-amber-700 mt-0.5">{periodActiveCount} Unit</div>
                  <span className="text-[10px] text-slate-500">Shift masih aktif</span>
                </div>
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Rata-rata Durasi Shift</span>
                  <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                    {periodVerifiedCount > 0 ? (periodTotalHours / periodVerifiedCount).toFixed(1) : '8.0'} Jam
                  </div>
                  <span className="text-[10px] text-slate-500">Efisiensi jam alat</span>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                </div>
              </div>
            </div>

            {/* Timesheet Summary Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-md">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[10px] border-b border-slate-200">
                  <tr>
<<<<<<< HEAD
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Field Operator</th>
                    <th className="py-2.5 px-3">Equipment / Barcode</th>
                    <th className="py-2.5 px-3">Check-In &amp; Starting HM</th>
                    <th className="py-2.5 px-3">Check-Out &amp; Ending HM</th>
                    <th className="py-2.5 px-3 text-right">Operating Hours (HM)</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3">Notes / Location</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
=======
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">Operator Lapangan</th>
                    <th className="py-2.5 px-3">Alat Berat / Barcode</th>
                    <th className="py-2.5 px-3">Jam Datang &amp; HM</th>
                    <th className="py-2.5 px-3">Jam Pulang &amp; HM</th>
                    <th className="py-2.5 px-3 text-right">Jam Aktif (HM)</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3">Catatan / Lokasi</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
<<<<<<< HEAD
                        No timesheet logs for {timesheetStartDate} to {timesheetEndDate}.
=======
                        Tidak ada log timesheet pada periode {timesheetStartDate} s/d {timesheetEndDate}.
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-900 whitespace-nowrap">
                          {log.date}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                          {log.operatorName}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-mono font-bold bg-slate-900 text-amber-300 px-1.5 py-0.5 rounded text-[11px]">
                            {log.assetTag}
                          </span>
                          <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[140px]">{log.assetName}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                          <div className="font-bold text-emerald-800 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-emerald-600" /> {log.checkInTime || '07:30'}
                          </div>
                          <span className="text-[10px] text-slate-500">{log.checkInHourMeter} HM</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                          {log.checkOutTime ? (
                            <>
                              <div className="font-bold text-blue-800 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-blue-600" /> {log.checkOutTime}
                              </div>
                              <span className="text-[10px] text-slate-500">{log.checkOutHourMeter} HM</span>
                            </>
                          ) : (
                            <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
<<<<<<< HEAD
                              Not Checked Out
=======
                              Belum Pulang
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
<<<<<<< HEAD
                          {log.workingHours ? `${log.workingHours} hours` : 'On Shift'}
=======
                          {log.workingHours ? `${log.workingHours} Jam` : 'Sedang Shift'}
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              log.status === 'CHECKED_OUT'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : log.status === 'BREAKDOWN_REPORTED'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
<<<<<<< HEAD
                            {log.status === 'CHECKED_OUT' ? 'VERIFIED' : log.status === 'BREAKDOWN_REPORTED' ? 'DAMAGED' : 'WORKING'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-slate-600 max-w-[180px] truncate" title={log.notes}>
                          {log.notes || 'Routine shift operation'}
=======
                            {log.status === 'CHECKED_OUT' ? 'TERVERIFIKASI' : log.status === 'BREAKDOWN_REPORTED' ? 'RUSAK' : 'BEKERJA'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-slate-600 max-w-[180px] truncate" title={log.notes}>
                          {log.notes || 'Operasi rutin shift'}
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenAdjustModal(log)}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded flex items-center gap-1 cursor-pointer transition-colors"
<<<<<<< HEAD
                            title="Adjust check-in, check-out, and machine hour meter"
                          >
                            <Edit2 className="w-3 h-3 text-indigo-600" />
                            <span>Adjust Hours &amp; Period</span>
=======
                            title="Adjust Jam Datang, Jam Pulang & HM Mesin"
                          >
                            <Edit2 className="w-3 h-3 text-indigo-600" />
                            <span>Adjust Jam &amp; Periode</span>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* MODAL ADJUST JAM DATANG & PULANG TIMESHEET */}
            {editingTimesheetLog && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-2xl border border-slate-200 max-w-lg w-full p-6 text-slate-900 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-indigo-600" />
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
<<<<<<< HEAD
                          Adjust Check-In, Check-Out &amp; Timesheet Period
                        </h3>
                        <p className="text-[11px] text-slate-500 font-mono">
                          ID: {editingTimesheetLog.id} · Equipment: {editingTimesheetLog.assetTag}
=======
                          Adjust Jam Datang, Jam Pulang &amp; Periode Timesheet
                        </h3>
                        <p className="text-[11px] text-slate-500 font-mono">
                          ID: {editingTimesheetLog.id} · Unit: {editingTimesheetLog.assetTag}
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingTimesheetLog(null)}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveAdjustedTimesheet} className="space-y-3.5 text-xs">
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
                      <div>
<<<<<<< HEAD
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Equipment &amp; Operator</span>
=======
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Alat Berat &amp; Operator</span>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                        <span className="font-bold text-slate-900">[{editingTimesheetLog.assetTag}] {editingTimesheetLog.assetName}</span>
                        <div className="text-[11px] text-slate-500">{editingTimesheetLog.operatorName}</div>
                      </div>
                    </div>

                    <div>
<<<<<<< HEAD
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Attendance / Operating Date</label>
=======
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Absensi / Operasi</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded font-mono focus:border-indigo-600 outline-none"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
<<<<<<< HEAD
                          Check-In Time (Shift Start)
=======
                          Jam Datang (Masuk Shift)
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                        </label>
                        <input
                          type="time"
                          value={editCheckInTime}
                          onChange={(e) => setEditCheckInTime(e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded font-mono focus:border-indigo-600 outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
<<<<<<< HEAD
                          Starting Hour Meter (HM)
=======
                          Hour Meter (HM) Masuk
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={editCheckInHourMeter}
                          onChange={(e) => setEditCheckInHourMeter(e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded font-mono focus:border-indigo-600 outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
<<<<<<< HEAD
                          Check-Out Time (Shift End)
=======
                          Jam Pulang (Selesai Shift)
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                        </label>
                        <input
                          type="time"
                          value={editCheckOutTime}
                          onChange={(e) => setEditCheckOutTime(e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded font-mono focus:border-indigo-600 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
<<<<<<< HEAD
                          Ending Hour Meter (HM)
=======
                          Hour Meter (HM) Pulang
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={editCheckOutHourMeter}
                          onChange={(e) => setEditCheckOutHourMeter(e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded font-mono focus:border-indigo-600 outline-none"
                        />
                      </div>
                    </div>

                    <div className="p-2.5 bg-indigo-50/70 border border-indigo-200 rounded flex items-center justify-between">
<<<<<<< HEAD
                      <span className="font-semibold text-indigo-900">Estimated Operating Hours (HM):</span>
                      <span className="font-mono font-bold text-sm text-indigo-950">
                        {Math.max(0, (parseFloat(editCheckOutHourMeter) || 0) - (parseFloat(editCheckInHourMeter) || 0)).toFixed(1)} hours
=======
                      <span className="font-semibold text-indigo-900">Estimasi Total Jam Aktif (HM):</span>
                      <span className="font-mono font-bold text-sm text-indigo-950">
                        {Math.max(0, (parseFloat(editCheckOutHourMeter) || 0) - (parseFloat(editCheckInHourMeter) || 0)).toFixed(1)} Jam
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                      </span>
                    </div>

                    <div>
<<<<<<< HEAD
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Shift Attendance Status</label>
=======
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Status Kehadiran Shift</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as any)}
                        className="w-full p-2 border border-slate-300 rounded bg-white outline-none cursor-pointer"
                      >
<<<<<<< HEAD
                        <option value="CHECKED_OUT">CHECKED_OUT (Completed &amp; Verified)</option>
                        <option value="CHECKED_IN">CHECKED_IN (Currently Operating)</option>
                        <option value="BREAKDOWN_REPORTED">BREAKDOWN_REPORTED (Equipment Issue Reported)</option>
=======
                        <option value="CHECKED_OUT">CHECKED_OUT (Shift Selesai &amp; Terverifikasi)</option>
                        <option value="CHECKED_IN">CHECKED_IN (Sedang Beroperasi)</option>
                        <option value="BREAKDOWN_REPORTED">BREAKDOWN_REPORTED (Alat Rusak / Diteruskan ke Mekanik)</option>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                      </select>
                    </div>

                    <div>
<<<<<<< HEAD
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Field Notes / Work Location</label>
=======
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan / Lokasi Kerja Lapangan</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                      <input
                        type="text"
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
<<<<<<< HEAD
                        placeholder="e.g., Block B excavation, favorable weather..."
=======
                        placeholder="cth: Galian Blok B, cuaca kondusif..."
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                        className="w-full p-2 border border-slate-300 rounded outline-none focus:border-indigo-600"
                      />
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingTimesheetLog(null)}
                        className="px-3.5 py-2 border border-slate-300 text-slate-700 font-semibold rounded hover:bg-slate-50 cursor-pointer"
                      >
<<<<<<< HEAD
                        Cancel
=======
                        Batal
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                      </button>
                      <button
                        type="submit"
                        disabled={savingTimesheetEdit}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {savingTimesheetEdit ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
<<<<<<< HEAD
                        Save Timesheet Changes
=======
                        Simpan Penyesuaian Timesheet
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );
      })()}

<<<<<<< HEAD
      {/* Monthly billing timesheet attachment */}
=======
      {/* Modal Cetak Lampiran Tagihan Bulanan (Timesheet Attachment for Billing) */}
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
      {showPrintTimesheetModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full p-6 text-slate-900 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
<<<<<<< HEAD
                  Official Heavy Equipment Attendance &amp; Operating Timesheet
                </h2>
                <p className="text-xs text-slate-500">
                  Customer Monthly Billing Attachment
=======
                  Lampiran Resmi Absensi &amp; Timesheet Operasi Alat Berat
                </h2>
                <p className="text-xs text-slate-500">
                  Dokumen Pendukung Tagihan Bulanan Pelanggan (Monthly Billing Attachment)
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                </p>
              </div>
              <button onClick={() => setShowPrintTimesheetModal(false)} className="text-slate-400 hover:text-slate-700 no-print">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded border border-slate-200 text-xs">
              <div>
<<<<<<< HEAD
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Billing Period</span>
                <span className="font-bold text-slate-900">October 2026 (October 1–31)</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Project / Client</span>
=======
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Periode Penagihan</span>
                <span className="font-bold text-slate-900">Bulan Oktober 2026 (1 - 31 Oktober)</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Proyek / Client</span>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                <span className="font-bold text-slate-900">PT Morowali Mining Energy · Site Blok B</span>
              </div>
            </div>

            {/* Timesheet Summary Table */}
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[10px]">
                  <tr>
<<<<<<< HEAD
                    <th className="p-2">Date</th>
                    <th className="p-2">Equipment (Barcode)</th>
                    <th className="p-2">Operator (License)</th>
                    <th className="p-2 text-right">Starting HM</th>
                    <th className="p-2 text-right">Ending HM</th>
                    <th className="p-2 text-right">Operating Hours</th>
                    <th className="p-2 text-center">Site Signature</th>
=======
                    <th className="p-2">Tanggal</th>
                    <th className="p-2">Alat (Barcode)</th>
                    <th className="p-2">Operator (SIO)</th>
                    <th className="p-2 text-right">HM Awal</th>
                    <th className="p-2 text-right">HM Akhir</th>
                    <th className="p-2 text-right">Jam Aktif</th>
                    <th className="p-2 text-center">Paraf Lapangan</th>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {attendanceLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="p-2 text-slate-800">{log.date}</td>
                      <td className="p-2 text-slate-900 font-bold">{log.assetTag}</td>
                      <td className="p-2 font-sans">{log.operatorName}</td>
                      <td className="p-2 text-right">{log.checkInHourMeter}</td>
                      <td className="p-2 text-right">{log.checkOutHourMeter || '—'}</td>
                      <td className="p-2 text-right font-bold text-slate-900">
                        {log.workingHours || 0} HM
                      </td>
                      <td className="p-2 text-center font-sans text-emerald-700 font-bold">
                        [VERIFIED]
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-bold text-xs border-t-2 border-slate-300">
                  <tr>
                    <td colSpan={5} className="p-2 text-right uppercase">
<<<<<<< HEAD
                      Total Billable Operating Hours:
                    </td>
                    <td className="p-2 text-right font-mono text-emerald-700">
                      {totalOperatingHours.toFixed(1)} Hours
=======
                      Total Jam Operasi Yang Ditagihkan:
                    </td>
                    <td className="p-2 text-right font-mono text-emerald-700">
                      {totalOperatingHours.toFixed(1)} Jam
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 text-center text-xs">
              <div>
<<<<<<< HEAD
                <div className="text-[11px] text-slate-500">Approved by Customer Site Supervisor:</div>
=======
                <div className="text-[11px] text-slate-500">Disetujui Pengawas Proyek Customer:</div>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                <div className="font-bold text-slate-800 mt-8 pt-1 border-t border-slate-300">
                  ( Site Manager / PIC Customer )
                </div>
              </div>
              <div>
<<<<<<< HEAD
                <div className="text-[11px] text-slate-500">EARMS Operations Manager:</div>
                <div className="font-bold text-slate-800 mt-8 pt-1 border-t border-slate-300">
                  ( Operations &amp; Fleet Manager )
=======
                <div className="text-[11px] text-slate-500">Penanggung Jawab Operasional EARMS:</div>
                <div className="font-bold text-slate-800 mt-8 pt-1 border-t border-slate-300">
                  ( Kepala Operasi &amp; Fleet Manager )
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
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
                Cetak ke PDF / Printer Fisik
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
