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
  Key,
} from 'lucide-react';

interface HeaderProps {
  currentUser?: User | null;
  activeRole: UserRole;
  allowedModules: string[];
  defaultTab: string;
  onChangePassword: () => void;
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
  allowedModules,
  defaultTab,
  onChangePassword,
  activeTab,
  onTabChange,
  onOpenQuickNew,
  onLogout,
  isRefreshing,
  onRefresh,
  onToggleMobileSidebar,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
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
    // 1. Executive: all commercial and operational features, prioritizing executive reports, excluding IT administration
    EXECUTIVE: [
      { id: 'reports', label: '📊 Executive Reports (PDF/Excel)', highlight: true },
      { id: 'dashboard', label: 'Executive Summary' },
      { id: 'invoices', label: 'FAT & Invoicing' },
      { id: 'rentals', label: 'Rental Contracts' },
      { id: 'sales', label: 'Sales & Customers' },
      { id: 'assets', label: 'Fleet & Compliance' },
      { id: 'procurement', label: 'Procurement' },
    ],
    // 2. IT Administrator: all role features without exception
    ADMIN_IT: [
      { id: 'user-management', label: '👥 User Management (IT)', highlight: true },
      { id: 'dashboard', label: 'System Overview' },
      { id: 'api-explorer', label: 'REST API & Swagger' },
      { id: 'test-runner', label: 'Automated Tests' },
      { id: 'settings', label: 'Settings & Audit Log' },
      { id: 'assets', label: 'Asset Registry' },
      { id: 'reports', label: 'All Reports & Data' },
    ],
    // 3. Sales & Marketing: manage customer and client project data
    SALES_MARKETING: [
      { id: 'quotations', label: 'Quotations', highlight: true },
      { id: 'sales', label: 'Sales Orders' },
      { id: 'customers', label: 'Customer CRM' },
      { id: 'deliveries', label: 'Customer Deliveries' },
      { id: 'products', label: 'Product & Asset Catalog' },
      { id: 'reports', label: 'Sales Reports' },
    ],
    // 4. Asset Control: asset registration, delivery, numbering, and equipment legal documents
    ASSET_CONTROL: [
      { id: 'assets', label: 'Equipment Registration & Documents (STNK/BPKB/SIA)', highlight: true },
      { id: 'deliveries', label: 'Equipment Delivery & Handover' },
      { id: 'maintenance', label: 'Maintenance & Compliance' },
      { id: 'products', label: 'Spare Parts & Inventory' },
      { id: 'reports', label: 'Asset Compliance Reports' },
    ],
    // 5. Management Operations: manage operators and equipment qualification documents
    MANAGEMENT_OPERATION: [
      { id: 'maintenance', label: 'Operators & SIO Documents', highlight: true },
      { id: 'assets', label: 'Equipment Assignments' },
      { id: 'deliveries', label: 'Field Handover' },
      { id: 'rentals', label: 'Rental Operations' },
      { id: 'reports', label: 'Field Utilization Reports' },
    ],
    // 6. Procurement: asset, spare parts, and office purchases (separate PO menu)
    PROCUREMENT: [
      { id: 'procurement', label: 'Vendor & Purchase Orders (PO)', highlight: true },
      { id: 'products', label: 'Spare Parts & Office Supplies' },
      { id: 'reports', label: 'Purchasing & Expense Reports' },
    ],
    // 7. Finance, Accounting & Tax (FAT): transaction records, accounts, tax calculations, and invoicing
    FINANCE_ACCOUNTING_TAX: [
      { id: 'invoices', label: 'Invoices & Billing', highlight: true },
      { id: 'payments', label: 'Cash & Bank Transactions' },
      { id: 'customers', label: 'Customer Accounts & Receivables' },
      { id: 'reports', label: 'Tax Reports (FAT)' },
    ],
    // 8. AR Management: receivables tracking and aging monitoring
    AR_MANAGEMENT: [
      { id: 'invoices', label: 'Receivables Tracking', highlight: true },
      { id: 'payments', label: 'Confirm AR Payments' },
      { id: 'customers', label: 'Statement of Account (SOA)' },
      { id: 'reports', label: 'Aging Receivables' },
    ],
    // 9. Operator / Field Equipment User: scan equipment and report its operating condition
    OPERATOR_USER: [
      { id: 'operator-status', label: '📱 Equipment Check-in & Status (Mobile)', highlight: true },
    ],
    // 10. Technical Service: repair requests, check-in/out, and parts/service replacement
    TECHNICAL_SERVICE: [
      { id: 'technical-service', label: '🔧 Service Dashboard & Scanning', highlight: true },
      { id: 'maintenance', label: 'Work Orders' },
      { id: 'assets', label: 'Heavy Equipment' },
      { id: 'reports', label: 'Service Reports' },
    ],
    MANAGER: [
      { id: 'manager-approvals', label: 'Approvals & Contracts', highlight: true },
    ],
  };

  const navLinks = (roleNavItems[activeRole] || []).filter((i) => allowedModules.includes(i.id));

  const roleTitles: Record<UserRole, string> = {
    EXECUTIVE: '1. Executive',
    ADMIN_IT: '2. Admin (IT)',
    SALES_MARKETING: '3. Sales & Marketing',
    ASSET_CONTROL: '4. Asset Control',
    MANAGEMENT_OPERATION: '5. Field Operations (SIO Operators)',
    PROCUREMENT: '6. Procurement',
    FINANCE_ACCOUNTING_TAX: '7. Finance & Tax (FAT)',
    AR_MANAGEMENT: '8. AR Management',
    OPERATOR_USER: '9. Operator / Field User',
    TECHNICAL_SERVICE: '10. Technical Service (Mechanics & Repairs)',
    MANAGER: 'Manager',
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 no-print">
      <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-2.5">
        {/* Zone 1: Wordmark & Mobile Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              onToggleMobileSidebar?.();
            }}
            className={`${allowedModules.length > 1 ? 'lg:hidden' : 'hidden'} min-h-10 min-w-10 flex items-center justify-center text-slate-600 hover:text-slate-900 rounded border border-slate-200 cursor-pointer`}
            title="Open Navigation Menu"
            aria-label="Open navigation menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onTabChange(defaultTab);
            }}
            className="flex items-center gap-2 group"
          >
            <div className="w-8 h-8 rounded bg-slate-900 text-amber-400 font-black text-sm flex items-center justify-center font-mono shadow-xs">
              APX
            </div>
            <div className="leading-tight max-[420px]:hidden">
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
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Notification Bell Button */}
          <button
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              loadNotifications();
            }}
            title="Cross-Role Activity Notifications"
            className="relative min-h-10 min-w-10 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded border border-slate-200 transition-colors cursor-pointer"
            aria-label="Open notifications"
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
            title="Print this page or report, or save it as a PDF"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 rounded border border-slate-200 transition-colors cursor-pointer shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-700" />
            <span className="hidden sm:inline">Print Report</span>
          </button>

          {onRefresh && activeRole !== 'MANAGER' && (
            <button
              onClick={onRefresh}
              title="Refresh System Data"
              className="min-h-10 min-w-10 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded border border-slate-200 transition-colors cursor-pointer"
              aria-label="Refresh data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          )}

          {/* User Profile Pill & Logout Dropdown */}
          {currentUser && (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="min-h-10 flex items-center gap-2 p-1 pl-2 border border-slate-200 rounded hover:bg-slate-50 transition-colors text-left cursor-pointer"
                aria-label="Account menu"
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

                  <div className="pt-2 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        onChangePassword();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 text-slate-700 hover:bg-slate-50 rounded transition-colors font-medium text-left cursor-pointer"
                    >
                      <Key className="w-4 h-4 text-amber-600" />
                      <span>Change My Password</span>
                    </button>

                    {allowedModules.includes('user-management') && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileMenu(false);
                          onTabChange('user-management');
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 text-slate-700 hover:bg-slate-50 rounded transition-colors font-medium text-left cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4 text-slate-600" />
                        <span>User Management &amp; Permissions</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        if (onLogout) onLogout();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 text-rose-600 hover:bg-rose-50 rounded transition-colors font-medium text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cross-role notifications modal */}
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
                    Cross-Role Notifications &amp; Updates
                    {unreadNotifCount > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                        {unreadNotifCount} New
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Cross-department activity: Field Operations, Workshop Service, Sales, Procurement, FAT &amp; IT.
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
                    Mark All as Read
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
                { id: 'ALL', label: 'All' },
                { id: 'UNREAD', label: `Unread (${unreadNotifCount})` },
                { id: 'OPERATIONAL', label: 'Field Operations' },
                { id: 'MAINTENANCE', label: 'Workshop Service' },
                { id: 'COMMERCIAL', label: 'Sales & Contracts' },
                { id: 'FINANCIAL', label: 'Finance & FAT' },
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
                  if (notifFilter === 'OPERATIONAL') return n.category === 'OPERATIONAL' || n.sourceDepartment.toLowerCase().includes('field');
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
                            From: {notif.sourceDepartment}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            · By: <strong className="text-slate-700">{notif.sourceUserName}</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {new Date(notif.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="Unread" />
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
                            Open Related Module ({notif.targetTab}) <ArrowRight className="w-3 h-3" />
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
