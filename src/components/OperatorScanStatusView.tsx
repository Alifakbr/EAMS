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
} from 'lucide-react';

interface OperatorScanStatusViewProps {
  assets: Asset[];
  currentUserName?: string;
  onRefreshAll?: () => void;
}

export const OperatorScanStatusView: React.FC<OperatorScanStatusViewProps> = ({
  assets,
  currentUserName = 'Agus Santoso (Operator Lapangan)',
  onRefreshAll,
}) => {
  const [selectedBarcode, setSelectedBarcode] = useState<string>('AST-10024');
  const [manualInput, setManualInput] = useState<string>('');
  const [activeAsset, setActiveAsset] = useState<Asset | null>(null);
  const [loadingAsset, setLoadingAsset] = useState(false);
  const [attendanceLogs, setAttendanceLogs] = useState<OperatorAttendanceLog[]>([]);
  const [isScanningActive, setIsScanningActive] = useState(false);

  // Mode: ATTENDANCE (Absen Datang/Pulang) or BREAKDOWN (Lapor Rusak)
  const [activeActionTab, setActiveActionTab] = useState<'ATTENDANCE' | 'REPORT_BREAKDOWN' | 'HISTORY_TIMESHEET'>('ATTENDANCE');

  // Attendance Form State
  const [hourMeterInput, setHourMeterInput] = useState<string>('2450.5');
  const [attendanceNotes, setAttendanceNotes] = useState<string>('Absen rutin operasi lapangan shift pagi');

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
        alert(`Alat berat dengan barcode/tag "${code}" tidak ditemukan dalam sistem.`);
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

  // Handle Check-In (Datang Absen)
  const handleCheckIn = async () => {
    if (!activeAsset) {
      alert('Pilih atau scan barcode alat berat terlebih dahulu.');
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
        text: `ABSEN DATANG BERHASIL! Operator ${currentUserName} tercatat masuk pada unit ${res.assetTag} pada jam ${res.checkInTime} (HM Masuk: ${res.checkInHourMeter}). Alat teridentifikasi aktif bekerja.`,
      });

      await loadAttendance();
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      setSubmitMessage({ type: 'error', text: `Gagal absen datang: ${err.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Check-Out (Pulang Absen)
  const handleCheckOut = async () => {
    if (!activeAsset) {
      alert('Pilih atau scan barcode alat berat terlebih dahulu.');
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
        text: `ABSEN PULANG BERHASIL! Shift selesai pada jam ${res.checkOutTime} (HM Keluar: ${res.checkOutHourMeter}). Total jam operasi aktif: ${res.workingHours} Jam. Tercatat resmi untuk lampiran tagihan pelanggan.`,
      });

      await loadAttendance();
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      setSubmitMessage({ type: 'error', text: `Gagal absen pulang: ${err.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Breakdown Report to Technical Service
  const handleReportBreakdown = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAsset) {
      alert('Pilih atau scan barcode alat berat terlebih dahulu.');
      return;
    }

    if (!damageDescription.trim()) {
      alert('Deskripsi kerusakan atau kendala wajib diisi agar tim Technical Service dapat menganalisis.');
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
        text: `LAPORAN KERUSAKAN TERKIRIM KE TECHNICAL SERVICE! Tiket perbaikan [${res.workOrder.workOrderNumber}] telah dibuat secara otomatis. Unit ${activeAsset.assetTag} saat ini dikunci dalam status IN_MAINTENANCE hingga diperbaiki.`,
      });

      setDamageDescription('');
      await loadAttendance();
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      setSubmitMessage({ type: 'error', text: `Gagal mengirim laporan kerusakan: ${err.message}` });
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
              Scan Barcode Absensi Operator &amp; Laporan Kerusakan
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Scan barcode alat saat datang (absen masuk) dan pulang (absen keluar). Jika terjadi kerusakan yang tidak dapat ditangani, kirim laporan langsung ke Technical Service.
            </p>
          </div>

          <div className="text-right text-xs bg-slate-800/80 px-4 py-2.5 rounded-md border border-slate-700">
            <span className="text-slate-400 block text-[10px]">Operator Lapangan:</span>
            <span className="font-semibold text-amber-300">{currentUserName}</span>
          </div>
        </div>

        {/* 4 Utilization & Timesheet Indicator Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800 text-xs">
          <div className="bg-slate-950/60 p-3 rounded border border-slate-800">
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
          Absensi Datang &amp; Pulang Alat
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
          Lapor Alat Rusak ke Technical Service
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
          Riwayat Timesheet &amp; Lampiran Tagihan ({attendanceLogs.length})
        </button>
      </div>

      {/* Barcode Scanner Box (Always available on top) */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Pemindaian Barcode Alat Berat di Lokasi Proyek</h2>
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
            {isScanningActive ? 'Tutup Kamera' : 'Buka Scanner Kamera'}
          </button>
        </div>

        {/* Viewfinder simulation */}
        {isScanningActive && (
          <div className="bg-slate-950 rounded-lg p-6 text-center text-white space-y-3 border-2 border-dashed border-indigo-500 relative">
            <div className="max-w-xs mx-auto aspect-square border-2 border-emerald-400 rounded-lg relative flex flex-col items-center justify-center bg-slate-900/60">
              <div className="absolute inset-x-0 h-0.5 bg-emerald-400 animate-pulse top-1/2"></div>
              <QrCode className="w-16 h-16 text-slate-500" />
              <span className="text-[11px] text-emerald-400 font-mono mt-3">Arahkan kamera ke Barcode / QR Mesin</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
              {assets.slice(0, 5).map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    lookupAsset(a.assetTag);
                    setIsScanningActive(false);
                  }}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-indigo-600 text-[11px] font-mono text-slate-200 cursor-pointer"
                >
                  Scan [{a.assetTag}] {a.name.slice(0, 15)}...
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Barcode Manual & Dropdown */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-8">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ketik Barcode / Nomor Seri / Plat Alat Berat:
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Ketik Tag Barcode (cth: AST-10024, AST-10088)..."
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
              Cari Unit
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
                  <span className="text-slate-400 block text-[10px]">Lokasi Proyek:</span>
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
              <h2 className="text-sm font-bold text-slate-900">Form Absensi Kehadiran &amp; Jam Keluar/Masuk Alat</h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Tanggal: {new Date().toLocaleDateString('id-ID')} · Waktu Real-Time: {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Hour Meter (HM) Fisik Mesin *
              </label>
              <input
                type="number"
                step="0.1"
                value={hourMeterInput}
                onChange={(e) => setHourMeterInput(e.target.value)}
                placeholder="cth: 2450.5"
                className="w-full p-2.5 border border-slate-300 rounded font-mono text-sm focus:border-indigo-600 outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Masukkan pembacaan Hour Meter mesin terkini pada saat absen.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Keterangan Aktivitas / Lokasi Kerja
              </label>
              <input
                type="text"
                value={attendanceNotes}
                onChange={(e) => setAttendanceNotes(e.target.value)}
                placeholder="cth: Galian tanah pondasi Blok B, cuaca cerah..."
                className="w-full p-2.5 border border-slate-300 rounded text-xs focus:border-indigo-600 outline-none"
              />
            </div>
          </div>

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
              </p>
              <button
                type="button"
                onClick={handleCheckIn}
                disabled={submitting}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
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
              </p>
              <button
                type="button"
                onClick={handleCheckOut}
                disabled={submitting}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Pulang Absen: Selesaikan Shift &amp; Hitung Jam
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
                Laporan Kerusakan / Breakdown Alat (Diteruskan ke Technical Service)
              </h2>
            </div>
            <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              Tiket Otomatis
            </span>
          </div>

          <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-900">
            <strong>Pemberitahuan:</strong> Jika alat mogok atau terdapat kendala teknis yang tidak dapat ditangani sendiri oleh operator, kirimkan laporan ini. Sistem akan mengunci unit ke status <strong>IN_MAINTENANCE</strong> dan meneruskannya ke dashboard <strong>Technical Service</strong> untuk diperbaiki oleh teknisi mekanik.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kategori Bagian yang Mengalami Kerusakan *
              </label>
              <select
                value={damageCategory}
                onChange={(e: any) => setDamageCategory(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded text-xs bg-white outline-none"
              >
                <option value="ENGINE">Mesin Utama / Engine (Overheat, Suara Kasar, Oli Bocor)</option>
                <option value="HYDRAULIC">Sistem Hidrolik (Selang Pecah, Tekanan Lemah, Sil Silinder)</option>
                <option value="ELECTRICAL">Kelistrikan (Aki Drop, Sensor Eror, Starter Tidak Merespons)</option>
                <option value="CHASSIS_TRACK">Track Shoe &amp; Roda Bawah (Rantai Lepas, Roller Rusak)</option>
                <option value="STRUCTURE_BOOM">Struktur Boom / Arm / Bucket (Retak, Pin Aus)</option>
                <option value="BRAKES_STEERING">Rem &amp; Kemudi (Rem Blong, Kemudi Macet)</option>
                <option value="OTHER">Kerusakan Teknis Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hour Meter (HM) Saat Breakdown Terjadi
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
              Deskripsi Lengkap Gejala &amp; Kronologi Kerusakan *
            </label>
            <textarea
              rows={3}
              placeholder="Jelaskan detail apa yang terjadi (misal: saat mengangkat beban bucket, terdengar dentuman keras dan oli hidrolik menyembur dari selang utama boom kiri)..."
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
              Kirim Tiket Kerusakan ke Technical Service
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: RIWAYAT TIMESHEET & LAMPIRAN TAGIHAN BULANAN */}
      {activeActionTab === 'HISTORY_TIMESHEET' && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-600" />
                Riwayat Timesheet Absensi Alat &amp; Operator Lapangan
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Riwayat scan ini menjadi lampiran sah dan resmi untuk penagihan bulanan (Monthly Timesheet Attachment) ke customer.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowPrintTimesheetModal(true)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              Cetak Lampiran Tagihan Bulanan Customer
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-2.5">Tanggal</th>
                  <th className="p-2.5">Operator</th>
                  <th className="p-2.5">Alat Berat / Barcode</th>
                  <th className="p-2.5">Jam Datang &amp; HM</th>
                  <th className="p-2.5">Jam Pulang &amp; HM</th>
                  <th className="p-2.5 text-right">Jam Aktif (HM)</th>
                  <th className="p-2.5 text-center">Status</th>
                  <th className="p-2.5">Lampiran Billing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendanceLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono text-slate-800">{log.date}</td>
                    <td className="p-2.5 font-medium text-slate-900">{log.operatorName}</td>
                    <td className="p-2.5">
                      <span className="font-mono font-semibold bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">
                        {log.assetTag}
                      </span>
                      <div className="text-[11px] text-slate-500 mt-0.5">{log.assetName}</div>
                    </td>
                    <td className="p-2.5 font-mono text-[11px] text-slate-600">
                      {log.checkInTime} ({log.checkInHourMeter} HM)
                    </td>
                    <td className="p-2.5 font-mono text-[11px] text-slate-600">
                      {log.checkOutTime ? `${log.checkOutTime} (${log.checkOutHourMeter} HM)` : '—'}
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                      {log.workingHours ? `${log.workingHours} Jam` : 'Sedang Kerja'}
                    </td>
                    <td className="p-2.5 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          log.status === 'CHECKED_OUT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.status === 'BREAKDOWN_REPORTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {log.status === 'CHECKED_OUT' ? 'TERVERIFIKASI' : log.status === 'BREAKDOWN_REPORTED' ? 'RUSAK / TIKET' : 'BEKERJA'}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-500 text-[11px]">
                      {log.status === 'CHECKED_OUT' ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Siap Ditagihkan
                        </span>
                      ) : (
                        <span className="text-slate-400">Belum Selesai</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Cetak Lampiran Tagihan Bulanan (Timesheet Attachment for Billing) */}
      {showPrintTimesheetModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full p-6 text-slate-900 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
                  Lampiran Resmi Absensi &amp; Timesheet Operasi Alat Berat
                </h2>
                <p className="text-xs text-slate-500">
                  Dokumen Pendukung Tagihan Bulanan Pelanggan (Monthly Billing Attachment)
                </p>
              </div>
              <button onClick={() => setShowPrintTimesheetModal(false)} className="text-slate-400 hover:text-slate-700 no-print">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Periode Penagihan</span>
                <span className="font-bold text-slate-900">Bulan Oktober 2026 (1 - 31 Oktober)</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Proyek / Client</span>
                <span className="font-bold text-slate-900">PT Morowali Mining Energy · Site Blok B</span>
              </div>
            </div>

            {/* Timesheet Summary Table */}
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="p-2">Tanggal</th>
                    <th className="p-2">Alat (Barcode)</th>
                    <th className="p-2">Operator (SIO)</th>
                    <th className="p-2 text-right">HM Awal</th>
                    <th className="p-2 text-right">HM Akhir</th>
                    <th className="p-2 text-right">Jam Aktif</th>
                    <th className="p-2 text-center">Paraf Lapangan</th>
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
                      Total Jam Operasi Yang Ditagihkan:
                    </td>
                    <td className="p-2 text-right font-mono text-emerald-700">
                      {totalOperatingHours.toFixed(1)} Jam
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 text-center text-xs">
              <div>
                <div className="text-[11px] text-slate-500">Disetujui Pengawas Proyek Customer:</div>
                <div className="font-bold text-slate-800 mt-8 pt-1 border-t border-slate-300">
                  ( Site Manager / PIC Customer )
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500">Penanggung Jawab Operasional EARMS:</div>
                <div className="font-bold text-slate-800 mt-8 pt-1 border-t border-slate-300">
                  ( Kepala Operasi &amp; Fleet Manager )
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 no-print">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded flex items-center gap-1.5 hover:bg-slate-800 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Cetak ke PDF / Printer Fisik
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
