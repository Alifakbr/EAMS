import React, { useState } from 'react';
import { SystemSettings, AuditLog } from '../types/index.ts';
import { api } from '../services/api.ts';
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
          <a
            href="/api/v1/system/backup"
            download
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-300 text-slate-700 rounded hover:bg-slate-50"
          >
            <Download className="w-3.5 h-3.5" />
            Download Backup (.json)
          </a>
          <button
            onClick={handleResetDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded hover:bg-rose-100"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Demo Data
          </button>
        </div>
      </div>

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
              <label className="block text-slate-600 font-semibold mb-1">Default Currency</label>
              <input
                type="text"
                value={formData.defaultCurrency}
                onChange={(e) => setFormData({ ...formData, defaultCurrency: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded font-mono outline-none"
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
