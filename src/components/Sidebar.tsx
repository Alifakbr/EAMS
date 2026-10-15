import React from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  ShoppingBag,
  CalendarDays,
  Truck,
  CreditCard,
  Banknote,
  Boxes,
  Cpu,
  PackageSearch,
  Wrench,
  BarChart3,
  Terminal,
  CheckCircle2,
  Settings,
  ShieldCheck,
  QrCode,
} from 'lucide-react';

import { UserRole } from '../types/index.ts';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  userRole?: UserRole;
  counts?: {
    openOrders?: number;
    activeRentals?: number;
    openInvoices?: number;
    pendingWorkOrders?: number;
  };
  isOpenOnMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  userRole = 'EXECUTIVE',
  counts,
  isOpenOnMobile = false,
  onCloseMobile,
}) => {
  // Define permitted tabs for each of the 8 enterprise roles
  const rolePermissions: Record<UserRole, string[]> = {
    // 1. Executive: Semua fitur komersial & operasional, utamakan laporan eksekutif, KECUALI fitur admin IT
    EXECUTIVE: [
      'reports',
      'dashboard',
      'customers',
      'quotations',
      'sales',
      'rentals',
      'deliveries',
      'invoices',
      'payments',
      'assets',
      'products',
      'procurement',
      'maintenance',
    ],
    // 2. Administrator Admin (IT): Semua fitur role tanpa terkecuali
    ADMIN_IT: [
      'user-management',
      'dashboard',
      'customers',
      'quotations',
      'sales',
      'deliveries',
      'rentals',
      'invoices',
      'payments',
      'reports',
      'assets',
      'products',
      'procurement',
      'maintenance',
      'operator-status',
      'technical-service',
      'api-explorer',
      'test-runner',
      'settings',
    ],
    // 3. Sales & Marketing: Mengolah data customer project, client CRM, quotation, sales order
    SALES_MARKETING: [
      'quotations',
      'sales',
      'customers',
      'deliveries',
      'products',
      'assets',
      'reports',
    ],
    // 4. Asset Control: Delivery, registrasi aset, penomoran & dokumen legalitas alat berat (STNK, BPKB, SIA)
    ASSET_CONTROL: [
      'assets',
      'deliveries',
      'products',
      'maintenance',
      'reports',
    ],
    // 5. Management Operation: Mengatur operator & dokumen kualifikasi (SIO) alat berat dari data aset
    MANAGEMENT_OPERATION: [
      'maintenance',
      'assets',
      'deliveries',
      'rentals',
      'reports',
    ],
    // 6. Procurement: Pembelanjaan aset, sparepart, dan lainnya keperluan kantor (Menu PO tersendiri & tidak bercampur)
    PROCUREMENT: [
      'procurement',
      'products',
      'reports',
    ],
    // 7. Accounting Finance & Tax (FAT): Recording transaksi, data akun, perhitungan pajak, dan invoicing
    FINANCE_ACCOUNTING_TAX: [
      'invoices',
      'payments',
      'customers',
      'reports',
    ],
    // 8. AR Management: Tracing tagihan piutang dan aging monitoring
    AR_MANAGEMENT: [
      'invoices',
      'reports',
      'payments',
      'customers',
    ],
    // 9. Operator / Pengguna Alat Lapangan: Hanya fitur scan barcode dan submit status alat kerja/rusak
    OPERATOR_USER: [
      'operator-status',
    ],
    // 10. Technical Service: Dashboard repair request lapangan, pengerjaan servis (scan start/complete), penggantian sparepart/jasa
    TECHNICAL_SERVICE: [
      'technical-service',
      'maintenance',
      'assets',
      'products',
      'reports',
    ],
  };

  const allowedTabs = rolePermissions[userRole] || rolePermissions.EXECUTIVE;

  const allSections = [
    {
      label: 'STATUS OPERATOR LAPANGAN',
      items: [
        { id: 'operator-status', label: 'Scan & Absen Alat Lapangan', icon: QrCode },
      ],
    },
    {
      label: 'TECHNICAL SERVICE & BENGKEL',
      items: [
        { id: 'technical-service', label: 'Dashboard & Scan Servis', icon: Wrench, badge: counts?.pendingWorkOrders },
      ],
    },
    {
      label: 'EXECUTIVE & REPORTING',
      items: [
        { id: 'reports', label: 'Laporan & Dokumen Resmi', icon: BarChart3 },
        { id: 'dashboard', label: 'Dashboard Operasional', icon: LayoutDashboard },
      ],
    },
    {
      label: 'SALES & CLIENT CRM',
      items: [
        { id: 'customers', label: 'Customers & Project CRM', icon: Users },
        { id: 'quotations', label: 'Sales Quotations', icon: FileText },
        { id: 'sales', label: 'Sales Orders', icon: ShoppingBag, badge: counts?.openOrders },
        { id: 'deliveries', label: 'Deliveries & Handover', icon: Truck },
      ],
    },
    {
      label: 'RENTAL & ARMADA SEWA',
      items: [
        { id: 'rentals', label: 'Rental Contracts', icon: CalendarDays, badge: counts?.activeRentals },
      ],
    },
    {
      label: 'FINANCE, FAT & AR',
      items: [
        { id: 'invoices', label: 'Invoices & Billing', icon: CreditCard, badge: counts?.openInvoices },
        { id: 'payments', label: 'Payments & Settlement', icon: Banknote },
      ],
    },
    {
      label: 'ASSET CONTROL & OPERATIONS',
      items: [
        { id: 'assets', label: 'Alat Berat & Legalitas (SIA)', icon: Cpu },
        { id: 'products', label: 'Katalog Produk & Sparepart', icon: Boxes },
        { id: 'maintenance', label: 'Operator SIO & Perawatan', icon: Wrench, badge: counts?.pendingWorkOrders },
        { id: 'procurement', label: 'Pengadaan & PO Vendor', icon: PackageSearch },
      ],
    },
    {
      label: 'ADMIN IT & INFRASTRUCTURE',
      items: [
        { id: 'user-management', label: 'Manajemen Pengguna (IT)', icon: Users },
        { id: 'api-explorer', label: 'REST API & Swagger', icon: Terminal },
        { id: 'test-runner', label: 'Automated Test Suite', icon: CheckCircle2 },
        { id: 'settings', label: 'Settings & Audit Log', icon: Settings },
      ],
    },
  ];

  // Filter sections so that only allowed items for the role are displayed
  const sections = allSections
    .map((sec) => ({
      ...sec,
      items: sec.items.filter((item) => allowedTabs.includes(item.id)),
    }))
    .filter((sec) => sec.items.length > 0);

  const roleBadgeLabels: Record<UserRole, string> = {
    EXECUTIVE: 'Executive Direktur',
    ADMIN_IT: 'Admin IT (Full)',
    SALES_MARKETING: 'Sales & CRM',
    ASSET_CONTROL: 'Asset Control',
    MANAGEMENT_OPERATION: 'Field Ops (SIO)',
    PROCUREMENT: 'Procurement',
    FINANCE_ACCOUNTING_TAX: 'FAT & Tax',
    AR_MANAGEMENT: 'AR Tracing',
    OPERATOR_USER: 'Operator Lapangan',
    TECHNICAL_SERVICE: 'Technical Service',
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpenOnMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden cursor-pointer"
        />
      )}

      <aside
        className={`bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-53px)] border-r border-slate-800 no-print select-none transition-all duration-200 ${
          isOpenOnMobile
            ? 'fixed inset-y-0 left-0 z-50 w-72 shadow-2xl flex'
            : 'hidden lg:flex lg:w-64'
        }`}
      >
        {/* Role Indicator Banner */}
        <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">
              {roleBadgeLabels[userRole] || userRole}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded">
              Active
            </span>
            {isOpenOnMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="lg:hidden p-1 text-slate-400 hover:text-white rounded ml-1 cursor-pointer"
                title="Tutup Menu"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="p-3 flex-1 overflow-y-auto space-y-5">
          {sections.map((section) => (
            <div key={section.label} className="space-y-1">
              <h4 className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {section.label}
              </h4>
              <div className="mt-1 space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        if (onCloseMobile) onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded transition-colors whitespace-nowrap text-left cursor-pointer ${
                        isActive
                          ? 'bg-slate-800 text-white font-semibold shadow-xs'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 bg-slate-700 text-slate-200 rounded">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span className="font-semibold text-slate-300">Apex Commercial</span>
          <span className="font-mono text-slate-500">v2.4 Enterprise</span>
        </div>
      </aside>
    </>
  );
};
