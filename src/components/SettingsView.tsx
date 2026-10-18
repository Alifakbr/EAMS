import React, { useState } from 'react';
import { SystemSettings, AuditLog } from '../types/index.ts';
import { api } from '../services/api.ts';
import { saveBlob } from '../utils/download.ts';
import {
  Settings,
  ShieldCheck,
  Download,
  Upload,
  RotateCcw,
  Save,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';

interface SettingsViewProps {
  settings: SystemSettings;
  auditLogs: AuditLog[];
  onRefresh: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  auditLogs,
  onRefresh,
}) => {
  const [formData, setFormData] = useState<SystemSettings>({ ...settings });
  const [saving, setSaving] = useState(false);
  const [logFilter, setLogFilter] = useState('');
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [newJobPosition, setNewJobPosition] = useState('');
  const [tableList, setTableList] = useState<{ key: string; count: number }[]>([]);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [tableBusy, setTableBusy] = useState(false);

  React.useEffect(() => { api.getDataTables().then((res) => { setTableList(res.data); setSelectedTables(res.data.map((item) => item.key)); }).catch((err) => console.error('Unable to load database tables', err)); }, []);

  const handleExportSelectedTables = async () => {
    if (!selectedTables.length) { alert('Pilih minimal satu tabel untuk diekspor.'); return; }
    setTableBusy(true);
    try { const { blob, filename } = await api.exportTables(selectedTables); saveBlob(blob, filename || `eams_tables_${new Date().toISOString().slice(0, 10)}.json`); }
    catch (err: any) { alert(`Export gagal: ${err.message}`); } finally { setTableBusy(false); }
  };

  const handleImportSelectedTables = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    try { const payload = JSON.parse(await file.text());
      if (!payload?.tables || typeof payload.tables !== 'object') throw new Error('File bukan format EAMS_TABLE_EXPORT.');
      const keys = Object.keys(payload.tables);
      if (!confirm(`Import ${keys.length} tabel (${keys.join(', ')})? Data pada tabel terpilih akan diganti. Credential dan pengaturan sistem tidak diubah.`)) return;
      setTableBusy(true); await api.importTables(payload); alert('Import tabel terpilih berhasil. Halaman akan dimuat ulang.'); window.location.reload();
    } catch (err: any) { alert(`Import tabel gagal: ${err.message}`); } finally { setTableBusy(false); event.target.value = ''; }
  };

  const handleClearBusinessData = async () => {
    const confirmation = prompt('Tindakan ini menghapus seluruh data operasional, transaksi, aset, operator, dokumen, notifikasi dan draft. Akun/credential akses serta pengaturan sistem dipertahankan. Ketik HAPUS DATA untuk melanjutkan:');
    if (confirmation !== 'HAPUS DATA') return;
    try { await api.clearBusinessData(); alert('Data operasional berhasil dihapus; akun dan pengaturan tetap dipertahankan.'); window.location.reload(); }
    catch (err: any) { alert(`Penghapusan gagal: ${err.message}`); }
  };

  const handleDownloadBackup = async () => {
    setBackingUp(true);
    try {
      const { blob, filename } = await api.downloadBackup();
      saveBlob(blob, filename || `apex_eams_backup_${new Date().toISOString().slice(0, 10)}.json`);
    } catch (err: any) {
      alert(`Failed to download backup: ${err.message}`);
    } finally {
      setBackingUp(false);
    }
  };

  const handleRestoreBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 45 * 1024 * 1024) {
      alert('Backup file exceeds the 45 MB import limit (the API request limit is 50 MB).');
      event.target.value = '';
      return;
    }
    if (!confirm(`Restore EAMS data from ${file.name}? Current business data will be replaced. User accounts/passwords are preserved. Download a backup first if needed.`)) {
      event.target.value = '';
      return;
    }
    setRestoring(true);
    try {
      const backup = JSON.parse(await file.text());
      await api.restoreBackup(backup);
      alert('Database import completed. The page will reload to refresh all data.');
      window.location.reload();
    } catch (err: any) {
      alert(`Import failed: ${err.message || 'Invalid backup file.'}`);
    } finally {
      setRestoring(false);
      event.target.value = '';
    }
  };

  const handleBrandAsset = (event: React.ChangeEvent<HTMLInputElement>, key: 'logoDataUrl' | 'faviconDataUrl') => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      event.target.value = '';
      return;
    }
    if (file.size > 1 * 1024 * 1024) {
      alert('Image must be 1 MB or smaller.');
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setFormData((current) => ({ ...current, [key]: String(reader.result || '') }));
    reader.onerror = () => alert(`Unable to read ${file.name}.`);
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateSettings(formData);
      alert('System configuration updated successfully.');
      onRefresh();
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleResetDemo = async () => {
    if (!confirm('Reset all databases, quotations, rentals, invoices, and assets to factory default demo state?')) {
      return;
    }
    try {
      await api.resetDemoData();
      alert('Database restored to factory demo state!');
      window.location.reload();
    } catch (err: any) {
      alert(`Reset error: ${err.message}`);
    }
  };

  const filteredLogs = auditLogs.filter(
    (l) =>
      !logFilter ||
      l.details.toLowerCase().includes(logFilter.toLowerCase()) ||
      l.action.toLowerCase().includes(logFilter.toLowerCase()) ||
      l.userName.toLowerCase().includes(logFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-3.5 border border-slate-200 rounded-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-slate-700" />
          <h2 className="text-base font-bold text-slate-900">
            Enterprise System Configuration &amp; Audit Logs
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadBackup}
            disabled={backingUp}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-300 text-slate-700 rounded hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            {backingUp ? 'Menyiapkan...' : 'Download Backup (.json)'}
          </button>
          <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-indigo-300 text-indigo-700 rounded hover:bg-indigo-50 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            {restoring ? 'Importing...' : 'Import Backup (.json)'}
            <input type="file" accept="application/json,.json" disabled={restoring} onChange={handleRestoreBackup} className="hidden" />
          </label>
          <button
            onClick={handleResetDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded hover:bg-rose-100"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Demo Data
          </button>
        </div>
      </div>

      <section className="bg-white border border-slate-200 rounded-md p-4 space-y-3">
        <div><h3 className="text-sm font-bold text-slate-900">IT Data Migration — Table Export / Import</h3><p className="text-xs text-slate-500 mt-1">Pilih koleksi database yang diperlukan untuk migrasi. Akun pengguna dan password tidak termasuk pada paket export tabel.</p></div>
        <div className="flex flex-wrap gap-2"><button type="button" onClick={() => setSelectedTables(tableList.map((item) => item.key))} className="rounded border px-3 py-1.5 text-xs">Pilih semua</button><button type="button" onClick={() => setSelectedTables([])} className="rounded border px-3 py-1.5 text-xs">Kosongkan pilihan</button><span className="self-center text-xs text-slate-500">{selectedTables.length} dari {tableList.length} tabel dipilih</span></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">{tableList.map((item) => <label key={item.key} className="flex items-center gap-2 rounded border border-slate-200 p-2 text-xs"><input type="checkbox" checked={selectedTables.includes(item.key)} onChange={(e) => setSelectedTables((current) => e.target.checked ? [...current, item.key] : current.filter((key) => key !== item.key))} /><span className="flex-1">{item.key}</span><span className="text-slate-500">{item.count}</span></label>)}</div>
        <div className="flex flex-wrap gap-2"><button type="button" disabled={tableBusy || !selectedTables.length} onClick={handleExportSelectedTables} className="rounded bg-indigo-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"><Download className="inline h-3.5 w-3.5 mr-1" />Export tabel terpilih</button><label className={`rounded border border-indigo-300 px-3 py-2 text-xs font-semibold text-indigo-700 cursor-pointer ${tableBusy ? 'opacity-50 pointer-events-none' : ''}`}><Upload className="inline h-3.5 w-3.5 mr-1" />Import tabel dari JSON<input type="file" accept="application/json,.json" onChange={handleImportSelectedTables} disabled={tableBusy} className="hidden" /></label></div>
        <div className="border-t border-rose-100 pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"><div><p className="text-xs font-bold text-rose-700">Reset data simulasi manual</p><p className="text-xs text-slate-500">Menghapus data operasional dan transaksi, tetapi mempertahankan user, credential, dan pengaturan sistem. Gunakan hanya pada lingkungan uji.</p></div><button type="button" onClick={handleClearBusinessData} className="rounded border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100">Hapus seluruh data operasional</button></div>
      </section>

      {/* Settings Form */}
      <div className="bg-white border border-slate-200 rounded-md p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">
          Organization Profile &amp; Financial Defaults
        </h3>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Company Legal Name</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Tax ID / Registration</label>
              <input
                type="text"
                value={formData.taxRegistrationNumber}
                onChange={(e) => setFormData({ ...formData, taxRegistrationNumber: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded font-mono outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Corporate Address</label>
              <input
                type="text"
                value={formData.companyAddress}
                onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Support Email</label>
              <input
                type="email"
                value={formData.companyEmail}
                onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">System Currency</label>
              <input
                type="text"
                value="IDR"
                readOnly
                className="w-full p-2 border border-slate-300 rounded font-mono outline-none bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Default Sales Tax Rate (%)</label>
              <input
                type="number"
                step="0.01"
                value={formData.defaultTaxRatePercent}
                onChange={(e) => setFormData({ ...formData, defaultTaxRatePercent: parseFloat(e.target.value) || 0 })}
                className="w-full p-2 border border-slate-300 rounded font-mono outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Invoice Numbering Prefix</label>
              <input
                type="text"
                value={formData.invoicePrefix}
                onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded font-mono outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-slate-900 text-white rounded font-semibold hover:bg-slate-800 flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>

      {/* Brand assets */}
      <div className="bg-white border border-slate-200 rounded-md p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Application Branding</h3>
          <p className="text-xs text-slate-500 mt-1">Upload company logo and favicon. Images are stored in system settings; maximum 1 MB each.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded border border-slate-200 p-3 flex flex-col gap-3">
            <label className="text-xs font-semibold text-slate-700">Web application logo</label>
            {formData.logoDataUrl ? <img src={formData.logoDataUrl} alt="Application logo preview" className="h-16 max-w-full object-contain object-left" /> : <div className="h-16 flex items-center text-xs text-slate-400">Default EAMS logo will be used.</div>}
            <div className="flex gap-2 flex-wrap">
              <label className="inline-flex items-center gap-2 rounded border border-slate-300 px-3 py-2 text-xs font-semibold cursor-pointer hover:bg-slate-50"><Upload className="h-3.5 w-3.5" /> Choose logo<input type="file" accept="image/*" onChange={(e) => handleBrandAsset(e, 'logoDataUrl')} className="hidden" /></label>
              {formData.logoDataUrl && <button type="button" onClick={() => setFormData({ ...formData, logoDataUrl: '' })} className="rounded border border-rose-200 px-3 py-2 text-xs text-rose-700">Remove logo</button>}
            </div>
          </div>
          <div className="rounded border border-slate-200 p-3 flex flex-col gap-3">
            <label className="text-xs font-semibold text-slate-700">Browser favicon</label>
            {formData.faviconDataUrl ? <img src={formData.faviconDataUrl} alt="Favicon preview" className="h-10 w-10 rounded border border-slate-200 object-contain" /> : <div className="h-10 flex items-center text-xs text-slate-400">Default browser icon will be used.</div>}
            <div className="flex gap-2 flex-wrap">
              <label className="inline-flex items-center gap-2 rounded border border-slate-300 px-3 py-2 text-xs font-semibold cursor-pointer hover:bg-slate-50"><Upload className="h-3.5 w-3.5" /> Choose favicon<input type="file" accept="image/*" onChange={(e) => handleBrandAsset(e, 'faviconDataUrl')} className="hidden" /></label>
              {formData.faviconDataUrl && <button type="button" onClick={() => setFormData({ ...formData, faviconDataUrl: '' })} className="rounded border border-rose-200 px-3 py-2 text-xs text-rose-700">Remove favicon</button>}
            </div>
          </div>
        </div>
      </div>

      {/* Job-position categories */}
      <div className="bg-white border border-slate-200 rounded-md p-5 space-y-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">IT · Job-position / Department Categories</h3>
          <p className="text-xs text-slate-500 mt-1">Maintain the available categories for user profiles. Save configuration to apply changes.</p>
        </div>
        <form className="flex flex-col sm:flex-row gap-2" onSubmit={(event) => { event.preventDefault(); const value = newJobPosition.trim(); if (!value) return; const current = formData.jobPositionCategories || []; if (!current.some((item) => item.toLowerCase() === value.toLowerCase())) setFormData({ ...formData, jobPositionCategories: [...current, value] }); setNewJobPosition(''); }}>
          <input value={newJobPosition} onChange={(event) => setNewJobPosition(event.target.value)} placeholder="Add job position / department category" className="flex-1 min-w-0 rounded border border-slate-300 p-2 text-xs" />
          <button type="submit" className="rounded bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700">Add category</button>
        </form>
        <div className="flex flex-wrap gap-2">
          {(formData.jobPositionCategories || []).map((category) => <span key={category} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700">{category}<button type="button" aria-label={`Remove ${category}`} onClick={() => setFormData({ ...formData, jobPositionCategories: (formData.jobPositionCategories || []).filter((item) => item !== category) })} className="font-bold text-rose-600 hover:text-rose-800">×</button></span>)}
          {(formData.jobPositionCategories || []).length === 0 && <p className="text-xs text-amber-700">No categories configured. Add at least one category before saving.</p>}
        </div>
      </div>

      {/* Audit Logs Explorer */}
      <div className="bg-white border border-slate-200 rounded-md p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Immutable Audit Trail</h3>
            <p className="text-xs text-slate-500">Chronological history of all commercial and inventory operations</p>
          </div>
          <input
            type="text"
            placeholder="Filter audit logs..."
            value={logFilter}
            onChange={(e) => setLogFilter(e.target.value)}
            className="p-1.5 text-xs border border-slate-300 rounded w-60"
          />
        </div>

        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto text-xs">
          {filteredLogs.map((log) => (
            <div key={log.id} className="py-2.5 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{log.userName}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded font-bold">
                    {log.action}
                  </span>
                  <span className="text-slate-400 text-[11px] font-mono">[{log.entity}: {log.entityId}]</span>
                </div>
                <p className="text-slate-700 mt-1">{log.details}</p>
              </div>
              <span className="text-slate-400 text-[11px] font-mono shrink-0">
                {new Date(log.timestamp).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
