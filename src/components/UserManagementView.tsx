import { exportCsv } from '../utils/download.ts';
import React, { useState, useEffect } from 'react';
import { User, UserRole, UserPermissionMatrix } from '../types/index.ts';
import { api } from '../services/api.ts';
import { ALL_ROLES, permissionsFromRole, validatePasswordStrength, PASSWORD_POLICY_TEXT } from '../shared/access.ts';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Key,
  Lock,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Download,
  Printer,
  X,
  RefreshCw,
  Building2,
  BadgeCheck,
  Settings,
  Sliders,
  AlertTriangle,
  QrCode,
  Copy,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';

interface UserManagementViewProps {
  currentUser: User;
  onRefresh?: () => void;
}

// Diturunkan dari modul ACL bersama (src/shared/access.ts) agar UI & server selalu konsisten.
const DEFAULT_ROLE_PERMISSIONS = Object.fromEntries(
  ALL_ROLES.map((r) => [r, permissionsFromRole(r)])
) as Record<UserRole, UserPermissionMatrix>;

const ROLE_OPTIONS: { role: UserRole; label: string; department: string }[] = [
  { role: 'EXECUTIVE', label: '1. Executive Director', department: 'Executive Leadership' },
  { role: 'ADMIN_IT', label: '2. IT Administrator', department: 'IT & Infrastructure Division' },
  { role: 'SALES_MARKETING', label: '3. Sales & Marketing Support', department: 'Sales & Client CRM' },
  { role: 'ASSET_CONTROL', label: '4. Asset Control (Asset Management)', department: 'Asset Management & Legal Docs' },
  { role: 'MANAGEMENT_OPERATION', label: '5. Management Operation (Field Operation)', department: 'Field Operations & SIO' },
  { role: 'PROCUREMENT', label: '6. Procurement', department: 'Procurement Department' },
  { role: 'FINANCE_ACCOUNTING_TAX', label: '7. Accounting Finance & Tax (FAT)', department: 'Finance, Accounting & Tax' },
  { role: 'AR_MANAGEMENT', label: '8. AR Management (Accounts Receivable)', department: 'AR & Collection Unit' },
  { role: 'OPERATOR_USER', label: '9. Operator / Field Equipment User', department: 'Heavy Equipment & Field Operations' },
  { role: 'TECHNICAL_SERVICE', label: '10. Technical Service & Workshop Mechanics', department: 'Technical Service & Field Repair' },
  { role: 'MANAGER', label: '11. Manager (Approvals & Contracts)', department: 'Management' },
];

const BRANCH_OPTIONS = [
  'Jakarta Head Office',
  'Balikpapan Depot & Workshop',
  'Site Project Morowali',
  'Site IKN Nusantara',
  'Surabaya & Gresik Branch',
  'Site Weda Bay Halmahera',
];

export const UserManagementView: React.FC<UserManagementViewProps> = ({ currentUser, onRefresh }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [customizingPermissionsUser, setCustomizingPermissionsUser] = useState<User | null>(null);
  const [activePermissions, setActivePermissions] = useState<UserPermissionMatrix>(DEFAULT_ROLE_PERMISSIONS.OPERATOR_USER);
  const [printingBadgeUser, setPrintingBadgeUser] = useState<User | null>(null);
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [customPasswordInput, setCustomPasswordInput] = useState('');
  const [forcePasswordChange, setForcePasswordChange] = useState(true);
  const [resetSuccessData, setResetSuccessData] = useState<{
    temporaryPassword: string;
    userEmail: string;
    userName: string;
    resetAt?: string;
  } | null>(null);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [showPasswordText, setShowPasswordText] = useState(true);

  // New User Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('SALES_MARKETING');
  const [formDepartment, setFormDepartment] = useState('Sales & Client CRM');
  const [formBadge, setFormBadge] = useState('');
  const [formBranch, setFormBranch] = useState('Jakarta Head Office');
  const [formPhone, setFormPhone] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getAuthUsers();
      setUsers(res.data);
    } catch (err: any) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.employeeBadge && u.employeeBadge.toLowerCase().includes(q)) ||
      (u.department && u.department.toLowerCase().includes(q));
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesBranch = branchFilter === 'ALL' || (u.assignedBranch && u.assignedBranch === branchFilter);
    return matchesSearch && matchesRole && matchesBranch;
  });

  // Handle Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail) {
      alert('Name and email are required.');
      return;
    }

    try {
      const created = await api.createUser({
        name: formName,
        email: formEmail,
        role: formRole,
        department: formDepartment,
        employeeBadge: formBadge || `EMP-${Date.now().toString().slice(-4)}`,
        assignedBranch: formBranch,
        phone: formPhone,
        status: 'ACTIVE',
        permissions: DEFAULT_ROLE_PERMISSIONS[formRole],
      });

      setShowCreateModal(false);
      // Tampilkan password sementara SEKALI (server tidak menyimpannya dalam bentuk terbaca).
      if (created.temporaryPassword) {
        setResettingUser(created as User);
        setResetSuccessData({
          temporaryPassword: created.temporaryPassword,
          userEmail: created.email,
          userName: created.name,
          resetAt: new Date().toLocaleTimeString('en-US'),
        });
        setPasswordCopied(false);
      }
      setFormName('');
      setFormEmail('');
      setFormBadge('');
      setFormPhone('');
      await loadUsers();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(`Failed to create user: ${err.message}`);
    }
  };

  // Handle Open Reset Password Modal
  const handleOpenResetModal = (user: User) => {
    setResettingUser(user);
    setCustomPasswordInput('');
    setForcePasswordChange(true);
    setResetSuccessData(null);
    setPasswordCopied(false);
  };

  // Execute Password Reset
  const handleExecuteResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;
    if (customPasswordInput.trim()) {
      const weak = validatePasswordStrength(customPasswordInput.trim());
      if (weak) { alert(weak); return; }
    }
    try {
      const res = await api.resetUserPassword(resettingUser.id, {
        customPassword: customPasswordInput.trim() || undefined,
        forcePasswordChange,
      });
      setResetSuccessData({
        temporaryPassword: res.temporaryPassword,
        userEmail: resettingUser.email,
        userName: resettingUser.name,
        resetAt: new Date().toLocaleTimeString('en-US'),
      });
      await loadUsers();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(`Failed to reset password: ${err.message}`);
    }
  };

  const handleCopyCredentials = () => {
    if (!resetSuccessData) return;
    const text = `EARMS LOGIN CREDENTIALS\nName: ${resetSuccessData.userName}\nEmail: ${resetSuccessData.userEmail}\nNew Password: ${resetSuccessData.temporaryPassword}\nStatus: Active\nNote: Please change your password immediately after logging in.`;
    navigator.clipboard?.writeText(text).catch(() => alert('Automatic copying failed. Please copy the credentials from the screen.'));
    setPasswordCopied(true);
    setTimeout(() => setPasswordCopied(false), 3000);
  };

  // Handle Toggle Status (Active / Suspended)
  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await api.updateUser(user.id, { status: newStatus });
      await loadUsers();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  // Open Permission Matrix Customizer
  const handleOpenPermissionCustomizer = (user: User) => {
    setCustomizingPermissionsUser(user);
    const userPerms = {
      ...DEFAULT_ROLE_PERMISSIONS[user.role],
      ...(user.permissions || {}),
    };
    setActivePermissions(userPerms);
  };

  // Save Custom Permissions
  const handleSavePermissions = async () => {
    if (!customizingPermissionsUser) return;
    try {
      await api.updateUser(customizingPermissionsUser.id, {
        permissions: activePermissions,
      });
      alert(`Custom permissions for ${customizingPermissionsUser.name} were saved successfully!`);
      setCustomizingPermissionsUser(null);
      await loadUsers();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(`Failed to save permissions: ${err.message}`);
    }
  };

  // Export to Excel / CSV
  const handleExportUsers = () => {
    const headers = ['ID', 'Name', 'Email', 'Role', 'Department', 'Branch/Site', 'Badge ID', 'Status', 'Phone Number'];
    const rows = filteredUsers.map((u) => [
      u.id,
      `${u.name}`,
      u.email,
      u.role,
      `${u.department}`,
      `${u.assignedBranch || 'Jakarta HQ'}`,
      u.employeeBadge || '',
      u.status || 'ACTIVE',
      u.phone || '',
    ]);

    exportCsv(`EARMS_Enterprise_Users_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  const permissionLabels: { key: keyof UserPermissionMatrix; label: string; desc: string; category: string }[] = [
    { key: 'canViewDashboard', label: 'View Dashboard & Financial Metrics', desc: 'Access performance summaries and charts', category: 'Dashboard' },
    { key: 'canManageCustomers', label: 'Manage Customer Data (CRM)', desc: 'Add and update customer and project data', category: 'Commercial' },
    { key: 'canManageProducts', label: 'Manage Product & Spare Parts Catalog', desc: 'Add and update products, prices, and stock', category: 'Assets' },
    { key: 'canManageDeliveries', label: 'Delivery & Equipment Handover', desc: 'Create delivery notes and confirm handovers', category: 'Operations' },
    { key: 'canManageAssets', label: 'Register & Manage Heavy Equipment', desc: 'Register equipment and print asset barcodes', category: 'Assets' },
    { key: 'canUploadLegalDocs', label: 'Upload Legal Documents (STNK, BPKB, SIA)', desc: 'Upload permits and track expiration dates', category: 'Assets & Legal' },
    { key: 'canManageOperators', label: 'Manage Operators & SIO Documents', desc: 'Register operators, upload SIO documents, and assign equipment', category: 'Operations' },
    { key: 'canScanAndSubmitStatus', label: 'Scan Barcodes & Report Equipment Status (Field Users)', desc: 'Submit daily equipment status (Working / Damaged)', category: 'Operations' },
    { key: 'canManageMaintenance', label: 'Record Repairs & Barcode Work Orders', desc: 'Create equipment repair tickets and complete service', category: 'Maintenance' },
    { key: 'canAccessTechnicalService', label: 'Technical Service & Workshop Scanning', desc: 'Mechanics scan repairs, replace parts/services, and release equipment', category: 'Maintenance' },
    { key: 'canManageQuotations', label: 'Manage Sales Quotations', desc: 'Issue and approve quotation proposals', category: 'Commercial' },
    { key: 'canManageSalesRentals', label: 'Manage Sales Orders & Rental Contracts', desc: 'Book rental equipment and create sales orders', category: 'Commercial' },
    { key: 'canManageInvoices', label: 'Issue Invoices & Tax Invoices', desc: 'Generate commercial invoices and credit notes', category: 'Finance' },
    { key: 'canManagePayments', label: 'Record Payments & Settlements', desc: 'Record payments and reconcile bank transactions', category: 'Finance' },
    { key: 'canManageProcurement', label: 'Procurement, Vendor POs & Spare Parts', desc: 'Purchase assets, components, and supplier bills', category: 'Procurement' },
    { key: 'canManageUsers', label: 'User Management & IT Settings', desc: 'Manage user accounts, reset passwords, and configure settings', category: 'IT & Systems' },
    { key: 'canAccessApiAndAudit', label: 'REST API & System Audit Log Access', desc: 'Access detailed audit trails and the API explorer', category: 'IT & Systems' },
    { key: 'canExportReports', label: 'Export Reports to Excel & PDF', desc: 'Print and download official reports', category: 'Reports' },
  ];

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h1 className="text-base font-bold text-slate-900">
              User Management &amp; Access Control (IT)
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
              IT Controlled Matrix
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Full control over user configuration, role assignments, operating branches, and access permissions.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportUsers}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded border border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export Excel (CSV)
          </button>

          <button
            type="button"
            onClick={() => {
              const target = users[0] || currentUser;
              setResettingUser(target);
              setCustomPasswordInput('');
              setForcePasswordChange(true);
              setResetSuccessData(null);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 cursor-pointer shadow-xs"
            title="Open User Password Reset"
          >
            <Key className="w-3.5 h-3.5 text-amber-700" />
            <span>Reset User Password</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-slate-900 hover:bg-slate-800 text-white cursor-pointer shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5 text-amber-400" />
            Add New User
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-md border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs">
        <div className="sm:col-span-5 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search name, email, badge ID, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded outline-none focus:border-slate-800"
          />
        </div>

        <div className="sm:col-span-4 flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full py-2 px-2.5 border border-slate-300 rounded bg-slate-50 font-medium text-slate-700 outline-none cursor-pointer"
          >
            <option value="ALL">All Roles</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r.role} value={r.role}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-3 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="w-full py-2 px-2.5 border border-slate-300 rounded bg-slate-50 font-medium text-slate-700 outline-none cursor-pointer"
          >
            <option value="ALL">All Branches / Sites</option>
            {BRANCH_OPTIONS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-4">Employee / Identity</th>
                <th className="py-2.5 px-4">System Role</th>
                <th className="py-2.5 px-4">Department &amp; Branch</th>
                <th className="py-2.5 px-4 text-center">Account Status</th>
                <th className="py-2.5 px-4 text-center">Custom Permissions</th>
                <th className="py-2.5 px-4 text-right">IT Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredUsers.map((user) => {
                const isSuspended = user.status === 'SUSPENDED' || user.status === 'INACTIVE';
                const hasCustomPerms = user.permissions && Object.keys(user.permissions).length > 0;

                return (
                  <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* User Identity */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center text-xs shrink-0">
                          {user.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{user.name}</span>
                            {user.employeeBadge && (
                              <span className="font-mono text-[10px] font-normal px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                {user.employeeBadge}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono truncate">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-[11px] text-slate-800 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 whitespace-nowrap">
                        {user.role}
                      </span>
                    </td>

                    {/* Department & Branch */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{user.department}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{user.assignedBranch || 'Jakarta Head Office'}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(user)}
                        title="Click to change account status"
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors ${
                          isSuspended
                            ? 'bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                        }`}
                      >
                        {isSuspended ? (
                          <>
                            <XCircle className="w-3 h-3" />
                            <span>SUSPENDED</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>ACTIVE</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Permissions Customizer Trigger */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleOpenPermissionCustomizer(user)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 cursor-pointer"
                      >
                        <Sliders className="w-3 h-3 text-indigo-600" />
                        <span>{hasCustomPerms ? 'Custom (Active)' : 'Configure Permissions'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenResetModal(user)}
                          title="Open User Password Reset"
                          className="px-2.5 py-1 rounded bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 font-bold cursor-pointer flex items-center gap-1 text-[11px] shadow-2xs transition-colors"
                        >
                          <Key className="w-3.5 h-3.5 text-amber-800" />
                          <span>Reset Password</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPrintingBadgeUser(user)}
                          title="Print the ID card / access badge"
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-indigo-700 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingUser(user)}
                          title="Edit User Profile"
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
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

      {/* MODAL 1: Create New User */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full p-6 text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">New User Registration (IT)</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Employee Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Alex Morgan"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded font-medium focus:border-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Business Email *</label>
                <input
                  type="email"
                  required
                  placeholder="rahmat@apex-industrial.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded font-mono focus:border-slate-800 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">System Role *</label>
                  <select
                    value={formRole}
                    onChange={(e: any) => {
                      const selected = e.target.value as UserRole;
                      setFormRole(selected);
                      const opt = ROLE_OPTIONS.find((r) => r.role === selected);
                      if (opt) setFormDepartment(opt.department);
                    }}
                    className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 font-medium outline-none"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.role} value={r.role}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Badge / Employee ID</label>
                  <input
                    type="text"
                    placeholder="e.g., EMP-8821"
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-mono focus:border-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Branch / Site Assignment</label>
                  <select
                    value={formBranch}
                    onChange={(e) => setFormBranch(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 outline-none"
                  >
                    {BRANCH_OPTIONS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone / WhatsApp Number</label>
                  <input
                    type="text"
                    placeholder="0812-xxxx-xxxx"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-mono focus:border-slate-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  value={formDepartment}
                  onChange={(e) => setFormDepartment(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:border-slate-800 outline-none"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded border border-amber-200 text-amber-800 text-[11px]">
                <span className="font-semibold block mb-0.5">IT Security:</span>
                A random temporary password will be generated automatically and sent to the registered user's email address.
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
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Granular Permission Matrix Customizer */}
      {customizingPermissionsUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-2xl w-full p-6 text-xs space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Customize Access Permissions: {customizingPermissionsUser.name}
                </h3>
              </div>
              <button onClick={() => setCustomizingPermissionsUser(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-200 flex items-center justify-between shrink-0">
              <div>
                <span className="font-bold text-slate-900">{customizingPermissionsUser.name}</span>
                <span className="text-slate-500 text-[11px] block">
                  Base Role: <span className="font-mono font-semibold text-indigo-700">{customizingPermissionsUser.role}</span> · {customizingPermissionsUser.department}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActivePermissions(DEFAULT_ROLE_PERMISSIONS[customizingPermissionsUser.role])}
                className="px-2.5 py-1 rounded bg-white border border-slate-300 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Reset to Default Role
              </button>
            </div>

            {/* Permission Toggles List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {permissionLabels.map((item) => {
                const isChecked = activePermissions[item.key] || false;
                return (
                  <div
                    key={item.key}
                    onClick={() => {
                      setActivePermissions({
                        ...activePermissions,
                        [item.key]: !isChecked,
                      });
                    }}
                    className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                      isChecked
                        ? 'bg-indigo-50/50 border-indigo-200 text-slate-900'
                        : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-0.5 max-w-md">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {item.category}
                        </span>
                        <span className="font-bold text-xs">{item.label}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">{item.desc}</p>
                    </div>

                    <div className="shrink-0 pl-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by parent div
                        className="w-4 h-4 accent-indigo-600 cursor-pointer"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500">
                Changes take effect the next time the user logs in.
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCustomizingPermissionsUser(null)}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded cursor-pointer"
                >
                  Apply Permissions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Print User Access ID Card / Badge */}
      {printingBadgeUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-300 max-w-sm w-full p-6 text-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Official Employee Access Badge
              </h3>
              <button onClick={() => setPrintingBadgeUser(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable ID Card Container */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-xl p-5 shadow-lg border border-slate-700 relative overflow-hidden text-center space-y-3">
              <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
                <div className="flex items-center gap-1.5 text-left">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-xs tracking-tight">Apex Industrial</span>
                </div>
                <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/30">
                  {printingBadgeUser.assignedBranch || 'Jakarta HQ'}
                </span>
              </div>

              <div className="w-16 h-16 rounded-full bg-slate-700 border-2 border-amber-400 mx-auto flex items-center justify-center text-lg font-bold text-amber-300 shadow-md">
                {printingBadgeUser.name.slice(0, 2).toUpperCase()}
              </div>

              <div>
                <h4 className="font-bold text-sm text-white">{printingBadgeUser.name}</h4>
                <div className="text-[11px] text-amber-300 font-mono font-semibold">
                  {printingBadgeUser.employeeBadge || 'EMP-001'}
                </div>
                <div className="text-[10px] text-slate-300 mt-0.5">{printingBadgeUser.department}</div>
              </div>

              <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between px-2">
                <div className="text-left font-mono text-[9px] text-slate-400">
                  <div>ROLE: {printingBadgeUser.role}</div>
                  <div>STATUS: ACTIVE</div>
                </div>
                <div className="bg-white p-1 rounded">
                  <QrCode className="w-9 h-9 text-slate-900" />
                </div>
              </div>
            </div>

            <div className="no-print pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPrintingBadgeUser(null)}
                className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print ID Badge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Edit User Profile */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-6 text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Edit Profil &amp; Penugasan Pegawai</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await api.updateUser(editingUser.id, {
                    name: editingUser.name,
                    role: editingUser.role,
                    department: editingUser.department,
                    assignedBranch: editingUser.assignedBranch,
                    employeeBadge: editingUser.employeeBadge,
                    phone: editingUser.phone,
                  });
                  alert('Profile changes saved successfully!');
                  setEditingUser(null);
                  await loadUsers();
                  if (onRefresh) onRefresh();
                } catch (err: any) {
                  alert(`Failed to save: ${err.message}`);
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded font-medium focus:border-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e: any) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 font-medium outline-none"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.role} value={r.role}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Branch / Site</label>
                  <select
                    value={editingUser.assignedBranch || 'Jakarta Head Office'}
                    onChange={(e) => setEditingUser({ ...editingUser, assignedBranch: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 outline-none"
                  >
                    {BRANCH_OPTIONS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Badge ID</label>
                  <input
                    type="text"
                    value={editingUser.employeeBadge || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, employeeBadge: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded font-mono focus:border-slate-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  value={editingUser.department}
                  onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded focus:border-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={editingUser.phone || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded font-mono focus:border-slate-800 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Dedicated Reset Password Modal (Menu IT Administrator) */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-200 max-w-md w-full p-6 text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Key className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    User Password Reset
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    IT Security &amp; Account Management
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setResettingUser(null);
                  setResetSuccessData(null);
                }}
                className="text-slate-400 hover:text-slate-700 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User Target Selector Dropdown */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Select Employee Account to Reset *
              </label>
              <select
                value={resettingUser.id}
                onChange={(e) => {
                  const found = users.find((u) => u.id === e.target.value);
                  if (found) {
                    setResettingUser(found);
                    setResetSuccessData(null);
                  }
                }}
                className="w-full p-2 border border-slate-300 rounded font-medium text-xs bg-white outline-none"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email}) · {u.role} · {u.department}
                  </option>
                ))}
              </select>
            </div>

            {/* Target User Info Card */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 font-mono text-[11px]">
              <div className="text-slate-900 font-bold font-sans text-xs">{resettingUser.name}</div>
              <div className="text-slate-600">Email: <span className="font-semibold text-slate-800">{resettingUser.email}</span></div>
              <div className="text-slate-600">Badge ID: <span className="font-semibold text-slate-800">{resettingUser.employeeBadge || '-'}</span> · Role: <span className="font-semibold text-indigo-700">{resettingUser.role}</span></div>
              <div className="text-slate-500 text-[10px]">Branch / Site: {resettingUser.assignedBranch || 'Jakarta Head Office'}</div>
            </div>

            {/* If reset has succeeded: show credential card */}
            {resetSuccessData ? (
              <div className="space-y-3">
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg space-y-2 text-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="font-bold text-sm text-emerald-900">
                    Password Reset Successfully!
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    New credentials were generated by the system and recorded in the IT audit log.
                  </p>

                  {/* Password Display Box */}
                  <div className="bg-white border-2 border-emerald-400 rounded-md p-3 flex items-center justify-between gap-2 shadow-2xs mt-2">
                    <div className="text-left font-mono font-bold text-sm text-slate-900 tracking-wider">
                      {showPasswordText ? resetSuccessData.temporaryPassword : '••••••••••••'}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowPasswordText(!showPasswordText)}
                        className="p-1 text-slate-500 hover:text-slate-800 rounded"
                        title={showPasswordText ? 'Hide' : 'Show'}
                      >
                        {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyCredentials}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-[11px] flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        {passwordCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {passwordCopied ? 'Copied!' : 'Copy Credentials'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 space-y-1 bg-amber-50/70 p-2.5 rounded border border-amber-200 text-amber-900">
                  <div className="font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700" /> Instructions:
                  </div>
                  <p>
                    Copy the credentials above and share them with the employee through an official company channel (WhatsApp or corporate email).
                  </p>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setResettingUser(null);
                      setResetSuccessData(null);
                    }}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded cursor-pointer text-xs"
                  >
                    Done &amp; Close
                  </button>
                </div>
              </div>
            ) : (
              /* Reset Form */
              <form onSubmit={handleExecuteResetPassword} className="space-y-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Custom New Password (Optional)
                  </label>
                  <input
                    type="text"
                    value={customPasswordInput}
                    onChange={(e) => setCustomPasswordInput(e.target.value)}
                    placeholder="Leave blank to generate a password automatically"
                    className="w-full p-2 border border-slate-300 rounded font-mono text-xs focus:border-slate-800 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {PASSWORD_POLICY_TEXT} Atau biarkan kosong agar sistem membuat password acak yang aman.
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                    <input
                      type="checkbox"
                      checked={forcePasswordChange}
                      onChange={(e) => setForcePasswordChange(e.target.checked)}
                      className="w-4 h-4 accent-amber-600 rounded"
                    />
                    <span>Require password change at first login</span>
                  </label>
                  <p className="text-[10px] text-slate-400 pl-6">
                    Sistem akan meminta pengguna menetapkan password pribadi saat sesi login berikutnya.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setResettingUser(null)}
                    className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Key className="w-4 h-4" />
                    Reset Password Now
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
