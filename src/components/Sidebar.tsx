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
  X,
  FileCheck,
  Wallet,
} from 'lucide-react';

import { UserRole } from '../types/index.ts';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  userRole?: UserRole;
  allowedModules: string[];
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
  allowedModules,
  counts,
  isOpenOnMobile = false,
  onCloseMobile,
}) => {
  // Menu yang tampil = modul efektif dari server (peran + hak akses khusus). Ini hanya UX; server tetap yang memaksa.
  const allowedTabs = allowedModules;

  const allSections = [
    {
      label: 'FIELD OPERATOR STATUS',
      items: [
        { id: 'operator-status', label: 'Field Equipment Scan & Attendance', icon: QrCode },
      ],
    },
    {
      label: 'MANAGEMENT',
      items: [
        { id: 'manager-approvals', label: 'Approvals & Contracts', icon: CheckCircle2 },
        { id: 'contract-management', label: 'Contract Management', icon: FileCheck },
        { id: 'contract-management', label: 'Contract Management', icon: FileCheck },
      ],
    },
    {
      label: 'TECHNICAL SERVICE & WORKSHOP',
      items: [
        { id: 'technical-service', label: 'Service Dashboard & Scanner', icon: Wrench, badge: counts?.pendingWorkOrders },
      ],
    },
    {
      label: 'EXECUTIVE & REPORTING',
      items: [
        { id: 'reports', label: 'Reports & Official Documents', icon: BarChart3 },
        { id: 'dashboard', label: 'Operations Dashboard', icon: LayoutDashboard },
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
      label: 'RENTALS & FLEET',
      items: [
        { id: 'rentals', label: 'Rental Contracts', icon: CalendarDays, badge: counts?.activeRentals },
      ],
    },
    {
      label: 'FINANCE, FAT & AR',
      items: [
        { id: 'invoices', label: 'Invoices & Billing', icon: CreditCard, badge: counts?.openInvoices },
        { id: 'payments', label: 'Payments & Settlement', icon: Banknote },
        { id: 'finance-overview', label: 'Finance Transaction Overview', icon: Wallet },
        { id: 'finance-overview', label: 'Finance Transaction Overview', icon: Wallet },
      ],
    },
    {
      label: 'ASSET CONTROL & OPERATIONS',
      items: [
        { id: 'assets', label: 'Heavy Equipment & Compliance (SIA)', icon: Cpu },
        { id: 'products', label: 'Product & Spare Parts Catalog', icon: Boxes },
        { id: 'maintenance', label: 'Operator Licenses & Maintenance', icon: Wrench, badge: counts?.pendingWorkOrders },
        { id: 'procurement', label: 'Procurement & Vendor POs', icon: PackageSearch },
      ],
    },
    {
      label: 'ADMIN IT & INFRASTRUCTURE',
      items: [
        { id: 'user-management', label: 'User Management (IT)', icon: Users },
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
    EXECUTIVE: 'Executive Director',
    ADMIN_IT: 'Admin IT (Full)',
    SALES_MARKETING: 'Sales & CRM',
    ASSET_CONTROL: 'Asset Control',
    MANAGEMENT_OPERATION: 'Field Ops (SIO)',
    PROCUREMENT: 'Procurement',
    FINANCE_ACCOUNTING_TAX: 'FAT & Tax',
    AR_MANAGEMENT: 'AR Tracing',
    OPERATOR_USER: 'Field Operator',
    TECHNICAL_SERVICE: 'Technical Service',
    MANAGER: 'Manager',
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
            ? 'fixed inset-y-0 left-0 z-50 w-[min(18rem,calc(100vw-2rem))] min-h-dvh shadow-2xl flex'
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
                      className={`w-full min-h-10 flex items-center justify-between px-3 py-2 text-xs font-medium rounded transition-colors text-left cursor-pointer ${
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
        </div>
      </aside>
    </>
  );
};
