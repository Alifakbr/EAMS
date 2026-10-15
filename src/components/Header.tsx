import React, { useState, useEffect } from 'react';
import { User, UserRole, AppNotification } from '../types/index.ts';
import { api } from '../services/api.ts';
import {
  ShieldCheck,
  RefreshCw,
  LogOut,
  Printer,
  FileSpreadsheet,
  Menu,
  X,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldAlert,
  ArrowRight,
  Check,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface HeaderProps {
  currentUser?: User | null;
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenQuickNew: () => void;
  onLogout?: () => void;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onToggleMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeRole,
  onRoleChange,
  activeTab,
  onTabChange,
  onOpenQuickNew,
  onLogout,
  isRefreshing,
  onRefresh,
  onToggleMobileSidebar,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [notifFilter, setNotifFilter] = useState<'ALL' | 'UNREAD' | 'OPERATIONAL' | 'MAINTENANCE' | 'COMMERCIAL' | 'FINANCIAL'>('ALL');

  const loadNotifications = async () => {
    try {
      const res = await api.getNotifications();
      setNotifications(res.data);
      setUnreadNotifCount(res.unreadCount);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadNotifCount(0);
    } catch {
      // ignore
    }
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.isRead) {
      try {
        await api.markNotificationRead(notif.id);
        setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)));
        setUnreadNotifCount((prev) => Math.max(0, prev - 1));
      } catch {
        // ignore
      }
    }
    if (notif.targetTab) {
      onTabChange(notif.targetTab);
      setShowNotifications(false);
    }
  };

  // Role-specific top navbar links exactly mapped to user requirements
  const roleNavItems: Record<UserRole, { id: string; label: string; highlight?: boolean }[]> = {
    // 1. Executive (Direktur): Akses semua fitur komersial/operasional, utamakan laporan eksekutif (PDF/Excel), KECUALI fitur admin IT
    EXECUTIVE: [
      { id: 'reports', label: '📊 Laporan Eksekutif (PDF/Excel)', highlight: true },
      { id: 'dashboard', label: 'Ringkasan Eksekutif' },
      { id: 'invoices', label: 'FAT & Invoicing' },
      { id: 'rentals', label: 'Kontrak Sewa' },
      { id: 'sales', label: 'Sales & Klien' },
      { id: 'assets', label: 'Armada & Legalitas' },
      { id: 'procurement', label: 'Pengadaan' },
    ],
    // 2. Administrator Admin (IT): Semua fitur role tanpa terkecuali
    ADMIN_IT: [
      { id: 'user-management', label: '👥 Manajemen Pengguna (IT)', highlight: true },
      { id: 'dashboard', label: 'Overview Sistem' },
      { id: 'api-explorer', label: 'REST API & Swagger' },
      { id: 'test-runner', label: 'Automated Tests' },
      { id: 'settings', label: 'Settings & Audit Log' },
      { id: 'assets', label: 'Asset Registry' },
      { id: 'reports', label: 'All Reports & Data' },
    ],
    // 3. Sales & Marketing: Mengolah semua data customer project atau client
    SALES_MARKETING: [
      { id: 'quotations', label: 'Penawaran (Quotation)', highlight: true },
      { id: 'sales', label: 'Sales Orders' },
      { id: 'customers', label: 'Customer CRM & Client' },
      { id: 'deliveries', label: 'Delivery ke Klien' },
      { id: 'products', label: 'Katalog Produk & Aset' },
      { id: 'reports', label: 'Laporan Sales' },
    ],
    // 4. Asset Control: Registrasi aset, delivery, penomoran & dokumen legalitas alat berat (STNK, BPKB, SIA)
    ASSET_CONTROL: [
      { id: 'assets', label: 'Registrasi & Dokumen Alat (STNK/BPKB/SIA)', highlight: true },
      { id: 'deliveries', label: 'Delivery & Handover Alat' },
      { id: 'maintenance', label: 'Perawatan & Kelaikan' },
      { id: 'products', label: 'Suku Cadang & Stok' },
      { id: 'reports', label: 'Laporan Legalitas Aset' },
    ],
    // 5. Management Operation: Mengatur operator & dokumen kualifikasi (SIO) alat berat dari data aset
    MANAGEMENT_OPERATION: [
      { id: 'maintenance', label: 'Operator & Dokumen SIO Alat', highlight: true },
      { id: 'assets', label: 'Penugasan Alat Berat' },
      { id: 'deliveries', label: 'Serah Terima Lapangan' },
      { id: 'rentals', label: 'Operasional Sewa' },
      { id: 'reports', label: 'Laporan Utilisasi Lapangan' },
    ],
    // 6. Procurement: Pembelanjaan aset, sparepart, dan keperluan kantor (Menu PO tersendiri & tidak bercampur)
    PROCUREMENT: [
      { id: 'procurement', label: 'Vendor & Purchase Orders (PO)', highlight: true },
      { id: 'products', label: 'Sparepart & Keperluan Kantor' },
      { id: 'reports', label: 'Laporan Belanja & Biaya' },
    ],
    // 7. Accounting Finance & Tax (FAT): Recording transaksi, data akun, perhitungan pajak dan invoicing
    FINANCE_ACCOUNTING_TAX: [
      { id: 'invoices', label: 'Invoices & Billing', highlight: true },
      { id: 'payments', label: 'Recording Kas & Bank' },
      { id: 'customers', label: 'Akun & Piutang Klien' },
      { id: 'reports', label: 'Perhitungan Pajak (FAT)' },
    ],
    // 8. AR Management: Tracing tagihan piutang dan aging monitoring
    AR_MANAGEMENT: [
      { id: 'invoices', label: 'Tracing Tagihan Piutang', highlight: true },
      { id: 'payments', label: 'Konfirmasi Pelunasan AR' },
      { id: 'customers', label: 'Statement of Account (SOA)' },
      { id: 'reports', label: 'Aging Receivables' },
    ],
    // 9. Operator / Pengguna Alat Lapangan: Hanya fitur scan dan submit status alat kerja atau tidak, rusak atau tidak
    OPERATOR_USER: [
      { id: 'operator-status', label: '📱 Scan & Absen Alat (Mobile)', highlight: true },
    ],
    // 10. Technical Service: Dashboard repair request, scan datang & pulang perbaikan, penggantian sparepart/jasa
    TECHNICAL_SERVICE: [
      { id: 'technical-service', label: '🔧 Dashboard & Scan Servis', highlight: true },
      { id: 'maintenance', label: 'Work Orders' },
      { id: 'assets', label: 'Alat Berat' },
      { id: 'reports', label: 'Laporan Servis' },
    ],
  };

  const navLinks = roleNavItems[activeRole] || roleNavItems.EXECUTIVE;

  const roleTitles: Record<UserRole, string> = {
    EXECUTIVE: '1. Executive (Direktur)',
    ADMIN_IT: '2. Admin (IT)',
    SALES_MARKETING: '3. Sales & Marketing',
    ASSET_CONTROL: '4. Asset Control (Legalitas Alat)',
    MANAGEMENT_OPERATION: '5. Field Ops (Operator SIO)',
    PROCUREMENT: '6. Procurement',
    FINANCE_ACCOUNTING_TAX: '7. Finance & Tax (FAT)',
    AR_MANAGEMENT: '8. AR Management',
    OPERATOR_USER: '9. Operator / Pengguna Lapangan',
    TECHNICAL_SERVICE: '10. Technical Service (Mekanik & Servis)',
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 no-print">
      <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-2.5">
        {/* Zone 1: Wordmark & Mobile Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (onToggleMobileSidebar) {
                onToggleMobileSidebar();
              } else {
                setMobileMenuOpen(!mobileMenuOpen);
              }
            }}
            className="lg:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded border border-slate-200 cursor-pointer"
            title="Buka Menu Navigasi"
          >
            <Menu className="w-4 h-4" />
          </button>

          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              const defaultTabs: Record<UserRole, string> = {
                EXECUTIVE: 'reports',
                ADMIN_IT: 'dashboard',
                SALES_MARKETING: 'quotations',
                ASSET_CONTROL: 'assets',
                MANAGEMENT_OPERATION: 'maintenance',
                PROCUREMENT: 'procurement',
                FINANCE_ACCOUNTING_TAX: 'invoices',
                AR_MANAGEMENT: 'invoices',
                OPERATOR_USER: 'operator-status',
                TECHNICAL_SERVICE: 'technical-service',
              };
              onTabChange(defaultTabs[activeRole] || 'reports');
            }}
            className="flex items-center gap-2 group"
          >
            <div className="w-8 h-8 rounded bg-slate-900 text-amber-400 font-black text-sm flex items-center justify-center font-mono shadow-xs">
              APX
            </div>
            <div className="leading-tight">
              <span className="text-sm font-bold tracking-tight text-slate-900 block group-hover:text-amber-700 transition-colors">
                Apex EAMS Commercial
              </span>
              <span className="text-[10px] text-slate-400 font-medium block">
                Enterprise Heavy Equipment Lifecycle
              </span>
            </div>
          </a>
        </div>

        {/* Zone 2: Role-based Top Navbar Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1.5 text-xs font-medium text-slate-600 overflow-x-auto py-1">
          {navLinks.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`px-2.5 py-1.5 rounded transition-all whitespace-nowrap cursor-pointer text-xs font-medium flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-slate-900 text-white font-bold shadow-xs'
                    : item.highlight
                    ? 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Global Print, Role Switcher, Quick Action, Profile */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Notification Bell Button */}
          <button
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              loadNotifications();
            }}
            title="Pusat Notifikasi Aktivitas Lintas Peran"
            className="relative p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded border border-slate-200 transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4 text-slate-700" />
            {unreadNotifCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
              </span>
            )}
          </button>

          {/* Global Print Report Button */}
          <button
            onClick={() => window.print()}
            title="Cetak Halaman / Laporan Resmi ke Printer atau PDF"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 rounded border border-slate-200 transition-colors cursor-pointer shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-700" />
            <span className="hidden sm:inline">Print Report</span>
          </button>

          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Perbarui Data Sistem"
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded border border-slate-200 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          )}

          {/* Role Switcher */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-700 shrink-0" />
            <span className="hidden xl:inline font-medium text-slate-500">Peran:</span>
            <select
              value={activeRole}
              onChange={(e) => onRoleChange(e.target.value as UserRole)}
              className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer max-w-[135px] sm:max-w-none truncate text-xs"
            >
              <option value="EXECUTIVE">1. Executive (Direktur)</option>
              <option value="ADMIN_IT">2. Administrator Admin (IT)</option>
              <option value="SALES_MARKETING">3. Sales &amp; Marketing</option>
              <option value="ASSET_CONTROL">4. Asset Control (Legalitas Alat)</option>
              <option value="MANAGEMENT_OPERATION">5. Field Ops (Operator SIO)</option>
              <option value="PROCUREMENT">6. Procurement</option>
              <option value="FINANCE_ACCOUNTING_TAX">7. Finance &amp; Tax (FAT)</option>
              <option value="AR_MANAGEMENT">8. AR Management</option>
              <option value="OPERATOR_USER">9. Operator Lapangan (Scan Alat)</option>
              <option value="TECHNICAL_SERVICE">10. Technical Service (Servis &amp; Barcode)</option>
            </select>
          </div>

          {/* User Profile Pill & Logout Dropdown */}
          {currentUser && (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 p-1 pl-2 border border-slate-200 rounded hover:bg-slate-50 transition-colors text-left cursor-pointer"
              >
                <div className="text-right hidden md:block">
                  <div className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[120px]">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono leading-tight truncate max-w-[120px]">
                    {currentUser.email}
                  </div>
                </div>
                <div className="w-7 h-7 rounded bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                  {currentUser.name.charAt(0)}
                </div>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-lg shadow-xl p-3 z-50 text-xs">
                  <div className="pb-2.5 border-b border-slate-100">
                    <div className="font-bold text-slate-900">{currentUser.name}</div>
                    <div className="text-slate-500 text-[11px] font-mono">{currentUser.email}</div>
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                        {roleTitles[activeRole]}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                      {currentUser.department}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        if (onLogout) onLogout();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 text-rose-600 hover:bg-rose-50 rounded transition-colors font-medium text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Keluar dari Akun (Logout)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Role Navigation Dropdown Bar */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-slate-50 px-4 py-2.5 space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Navigasi Peran: {roleTitles[activeRole]}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {navLinks.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-2.5 py-1.5 rounded text-left text-xs font-medium cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white font-bold'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* PUSAT NOTIFIKASI & AKTIVITAS LINTAS PERAN MODAL */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col text-slate-900 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Bell className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    Pusat Notifikasi &amp; Pembaruan Lintas Peran
                    {unreadNotifCount > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                        {unreadNotifCount} Baru
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Transparansi aktivitas antar divisi: Lapangan, Bengkel Servis, Sales, Pengadaan, FAT &amp; IT.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {unreadNotifCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 hover:bg-white rounded border border-slate-200 cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Tandai Semua Dibaca
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="px-4 py-2 border-b border-slate-100 bg-white flex items-center gap-1.5 overflow-x-auto shrink-0 text-xs font-medium">
              {[
                { id: 'ALL', label: 'Semua' },
                { id: 'UNREAD', label: `Belum Dibaca (${unreadNotifCount})` },
                { id: 'OPERATIONAL', label: 'Operasional Lapangan' },
                { id: 'MAINTENANCE', label: 'Servis Bengkel' },
                { id: 'COMMERCIAL', label: 'Sales & Kontrak' },
                { id: 'FINANCIAL', label: 'Keuangan & FAT' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setNotifFilter(f.id as any)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium whitespace-nowrap cursor-pointer transition-colors ${
                    notifFilter === f.id
                      ? 'bg-slate-900 text-white font-bold'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50/50">
              {notifications
                .filter((n) => {
                  if (notifFilter === 'UNREAD') return !n.isRead;
                  if (notifFilter === 'OPERATIONAL') return n.category === 'OPERATIONAL' || n.sourceDepartment.toLowerCase().includes('lapangan');
                  if (notifFilter === 'MAINTENANCE') return n.category === 'MAINTENANCE' || n.sourceDepartment.toLowerCase().includes('technical');
                  if (notifFilter === 'COMMERCIAL') return n.category === 'COMMERCIAL' || n.sourceDepartment.toLowerCase().includes('sales');
                  if (notifFilter === 'FINANCIAL') return n.category === 'FINANCIAL' || n.sourceDepartment.toLowerCase().includes('fat') || n.sourceDepartment.toLowerCase().includes('procurement');
                  return true;
                })
                .map((notif) => {
                  const getSeverityIcon = () => {
                    switch (notif.severity) {
                      case 'CRITICAL':
                        return <ShieldAlert className="w-4 h-4 text-rose-600" />;
                      case 'WARNING':
                        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
                      case 'SUCCESS':
                        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
                      default:
                        return <Info className="w-4 h-4 text-indigo-600" />;
                    }
                  };

                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3.5 rounded-lg border transition-all cursor-pointer space-y-1.5 ${
                        !notif.isRead
                          ? 'bg-white border-amber-300 shadow-xs ring-1 ring-amber-100'
                          : 'bg-white/80 border-slate-200 hover:bg-white text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200 font-mono">
                            Dari: {notif.sourceDepartment}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            · Oleh: <strong className="text-slate-700">{notif.sourceUserName}</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {new Date(notif.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="Belum dibaca" />
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 shrink-0">{getSeverityIcon()}</div>
                        <div className="flex-1 space-y-0.5">
                          <div className="text-xs font-bold text-slate-900">{notif.title}</div>
                          <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                        </div>
                      </div>

                      {notif.targetTab && (
                        <div className="pt-1 flex items-center justify-between border-t border-slate-100/80 text-[11px]">
                          <span className="text-slate-400">
                            Entitas: <strong className="text-slate-700 font-mono">{notif.relatedEntityId || notif.relatedEntity || '-'}</strong>
                          </span>
                          <span className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1">
                            Buka Modul Terkait ({notif.targetTab}) <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-200 bg-white flex items-center justify-between text-xs shrink-0 text-slate-500">
              <span className="text-[11px]">Sistem notifikasi real-time aktif EARMS Enterprise</span>
              <button
                type="button"
                onClick={() => setShowNotifications(false)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-medium text-xs cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
