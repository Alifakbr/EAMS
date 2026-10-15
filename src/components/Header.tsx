import React, { useState } from 'react';
import { User, UserRole } from '../types/index.ts';
import { ShieldCheck, RefreshCw, LogOut, Printer, FileSpreadsheet, Menu, X } from 'lucide-react';

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
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded border border-slate-200 cursor-pointer"
            title="Toggle Menu Navigasi"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
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
    </header>
  );
};
