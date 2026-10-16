import React, { useState, useEffect } from 'react';
import { User, UserRole, UserPermissionMatrix } from '../types/index.ts';
import { api } from '../services/api.ts';
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

const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, UserPermissionMatrix> = {
  EXECUTIVE: {
    canViewDashboard: true,
    canManageAssets: true,
    canUploadLegalDocs: true,
    canManageOperators: true,
    canScanAndSubmitStatus: true,
    canManageMaintenance: true,
    canAccessTechnicalService: true,
    canManageQuotations: true,
    canManageSalesRentals: true,
    canManageInvoices: true,
    canManagePayments: true,
    canManageProcurement: true,
    canManageUsers: false,
    canAccessApiAndAudit: false,
    canExportReports: true,
  },
  ADMIN_IT: {
    canViewDashboard: true,
    canManageAssets: true,
    canUploadLegalDocs: true,
    canManageOperators: true,
    canScanAndSubmitStatus: true,
    canManageMaintenance: true,
    canAccessTechnicalService: true,
    canManageQuotations: true,
    canManageSalesRentals: true,
    canManageInvoices: true,
    canManagePayments: true,
    canManageProcurement: true,
    canManageUsers: true,
    canAccessApiAndAudit: true,
    canExportReports: true,
  },
  SALES_MARKETING: {
    canViewDashboard: false,
    canManageAssets: false,
    canUploadLegalDocs: false,
    canManageOperators: false,
    canScanAndSubmitStatus: false,
    canManageMaintenance: false,
    canAccessTechnicalService: false,
    canManageQuotations: true,
    canManageSalesRentals: true,
    canManageInvoices: false,
    canManagePayments: false,
    canManageProcurement: false,
    canManageUsers: false,
    canAccessApiAndAudit: false,
    canExportReports: true,
  },
  ASSET_CONTROL: {
    canViewDashboard: false,
    canManageAssets: true,
    canUploadLegalDocs: true,
    canManageOperators: false,
    canScanAndSubmitStatus: true,
    canManageMaintenance: true,
    canAccessTechnicalService: false,
    canManageQuotations: false,
    canManageSalesRentals: false,
    canManageInvoices: false,
    canManagePayments: false,
    canManageProcurement: false,
    canManageUsers: false,
    canAccessApiAndAudit: false,
    canExportReports: true,
  },
  MANAGEMENT_OPERATION: {
    canViewDashboard: false,
    canManageAssets: true,
    canUploadLegalDocs: false,
    canManageOperators: true,
    canScanAndSubmitStatus: true,
    canManageMaintenance: true,
    canAccessTechnicalService: false,
    canManageQuotations: false,
    canManageSalesRentals: false,
    canManageInvoices: false,
    canManagePayments: false,
    canManageProcurement: false,
    canManageUsers: false,
    canAccessApiAndAudit: false,
    canExportReports: true,
  },
  PROCUREMENT: {
    canViewDashboard: false,
    canManageAssets: false,
    canUploadLegalDocs: false,
    canManageOperators: false,
    canScanAndSubmitStatus: false,
    canManageMaintenance: false,
    canAccessTechnicalService: false,
    canManageQuotations: false,
    canManageSalesRentals: false,
    canManageInvoices: false,
    canManagePayments: false,
    canManageProcurement: true,
    canManageUsers: false,
    canAccessApiAndAudit: false,
    canExportReports: true,
  },
  FINANCE_ACCOUNTING_TAX: {
    canViewDashboard: false,
    canManageAssets: false,
    canUploadLegalDocs: false,
    canManageOperators: false,
    canScanAndSubmitStatus: false,
    canManageMaintenance: false,
    canAccessTechnicalService: false,
    canManageQuotations: false,
    canManageSalesRentals: false,
    canManageInvoices: true,
    canManagePayments: true,
    canManageProcurement: false,
    canManageUsers: false,
    canAccessApiAndAudit: false,
    canExportReports: true,
  },
  AR_MANAGEMENT: {
    canViewDashboard: false,
    canManageAssets: false,
    canUploadLegalDocs: false,
    canManageOperators: false,
    canScanAndSubmitStatus: false,
    canManageMaintenance: false,
    canAccessTechnicalService: false,
    canManageQuotations: false,
    canManageSalesRentals: false,
    canManageInvoices: true,
    canManagePayments: true,
    canManageProcurement: false,
    canManageUsers: false,
    canAccessApiAndAudit: false,
    canExportReports: true,
  },
  OPERATOR_USER: {
    canViewDashboard: false,
    canManageAssets: false,
    canUploadLegalDocs: false,
    canManageOperators: false,
    canScanAndSubmitStatus: true,
    canManageMaintenance: false,
    canAccessTechnicalService: false,
    canManageQuotations: false,
    canManageSalesRentals: false,
    canManageInvoices: false,
    canManagePayments: false,
    canManageProcurement: false,
    canManageUsers: false,
    canAccessApiAndAudit: false,
    canExportReports: false,
  },
  TECHNICAL_SERVICE: {
    canViewDashboard: false,
    canManageAssets: true,
    canUploadLegalDocs: false,
    canManageOperators: false,
    canScanAndSubmitStatus: true,
    canManageMaintenance: true,
    canAccessTechnicalService: true,
    canManageQuotations: false,
    canManageSalesRentals: false,
    canManageInvoices: false,
    canManagePayments: false,
    canManageProcurement: false,
    canManageUsers: false,
    canAccessApiAndAudit: false,
    canExportReports: true,
  },
};

const ROLE_OPTIONS: { role: UserRole; label: string; department: string }[] = [
  { role: 'EXECUTIVE', label: '1. Executive (Direktur Utama)', department: 'Direksi & Eksekutif' },
  { role: 'ADMIN_IT', label: '2. Administrator Admin (IT)', department: 'Divisi IT & Infrastruktur' },
  { role: 'SALES_MARKETING', label: '3. Sales & Marketing Support', department: 'Sales & Client CRM' },
  { role: 'ASSET_CONTROL', label: '4. Asset Control (Asset Management)', department: 'Asset Management & Legal Docs' },
  { role: 'MANAGEMENT_OPERATION', label: '5. Management Operation (Field Operation)', department: 'Field Operations & SIO' },
  { role: 'PROCUREMENT', label: '6. Procurement', department: 'Procurement Department' },
  { role: 'FINANCE_ACCOUNTING_TAX', label: '7. Accounting Finance & Tax (FAT)', department: 'Finance, Accounting & Tax' },
  { role: 'AR_MANAGEMENT', label: '8. AR Management (Accounts Receivable)', department: 'AR & Collection Unit' },
  { role: 'OPERATOR_USER', label: '9. Operator / Pengguna Alat Lapangan', department: 'Operator Alat Berat & Lapangan' },
  { role: 'TECHNICAL_SERVICE', label: '10. Technical Service & Workshop Mekanik', department: 'Technical Service & Field Repair' },
];

const BRANCH_OPTIONS = [
  'Kantor Pusat Jakarta',
  'Depot & Workshop Balikpapan',
  'Site Project Morowali',
  'Site IKN Nusantara',
  'Cabang Surabaya & Gresik',
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
  const [formBranch, setFormBranch] = useState('Kantor Pusat Jakarta');
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
      alert('Nama dan Email wajib diisi.');
      return;
    }

    try {
      await api.createUser({
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

      alert(`Pengguna ${formName} berhasil didaftarkan oleh Administrator IT!`);
      setShowCreateModal(false);
      setFormName('');
      setFormEmail('');
      setFormBadge('');
      setFormPhone('');
      await loadUsers();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(`Gagal membuat pengguna: ${err.message}`);
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
    try {
      const res = await api.resetUserPassword(resettingUser.id, {
        customPassword: customPasswordInput.trim() || undefined,
        forcePasswordChange,
      });
      setResetSuccessData({
        temporaryPassword: res.temporaryPassword,
        userEmail: resettingUser.email,
        userName: resettingUser.name,
        resetAt: new Date().toLocaleTimeString('id-ID'),
      });
      await loadUsers();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(`Gagal reset password: ${err.message}`);
    }
  };

  const handleCopyCredentials = () => {
    if (!resetSuccessData) return;
    const text = `KREDENSIAL LOGIN EARMS\nNama: ${resetSuccessData.userName}\nEmail: ${resetSuccessData.userEmail}\nPassword Baru: ${resetSuccessData.temporaryPassword}\nStatus: Aktif\nCatatan: Harap segera mengganti password setelah berhasil masuk ke sistem.`;
    navigator.clipboard.writeText(text);
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
      alert(`Gagal mengubah status: ${err.message}`);
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
      alert(`Hak akses khusus untuk ${customizingPermissionsUser.name} berhasil disimpan!`);
      setCustomizingPermissionsUser(null);
      await loadUsers();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(`Gagal menyimpan hak akses: ${err.message}`);
    }
  };

  // Export to Excel / CSV
  const handleExportUsers = () => {
    const headers = ['ID', 'Nama', 'Email', 'Role', 'Departemen', 'Cabang/Site', 'No Badge', 'Status', 'No Telepon'];
    const rows = filteredUsers.map((u) => [
      u.id,
      `"${u.name}"`,
      u.email,
      u.role,
      `"${u.department}"`,
      `"${u.assignedBranch || 'Jakarta HQ'}"`,
      u.employeeBadge || '',
      u.status || 'ACTIVE',
      u.phone || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `EARMS_Enterprise_Users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const permissionLabels: { key: keyof UserPermissionMatrix; label: string; desc: string; category: string }[] = [
    { key: 'canViewDashboard', label: 'Lihat Dashboard & Metrik Finansial', desc: 'Akses ringkasan performa dan grafik', category: 'Dasbor' },
    { key: 'canManageAssets', label: 'Registrasi & Kelola Aset Alat Berat', desc: 'Input aset baru, cetak barcode aset', category: 'Aset' },
    { key: 'canUploadLegalDocs', label: 'Upload Dokumen Legalitas (STNK, BPKB, SIA)', desc: 'Unggah file izin dan lacak masa berlaku', category: 'Aset & Legal' },
    { key: 'canManageOperators', label: 'Kelola Operator & Dokumen SIO', desc: 'Registrasi operator, upload SIO, dan penugasan alat', category: 'Operasional' },
    { key: 'canScanAndSubmitStatus', label: 'Scan Barcode & Lapor Status Alat (User Lapangan)', desc: 'Submit status harian alat (Bekerja / Rusak)', category: 'Operasional' },
    { key: 'canManageMaintenance', label: 'Catat Perbaikan & Work Order Barcode', desc: 'Buat tiket perbaikan alat dan penyelesaian servis', category: 'Pemeliharaan' },
    { key: 'canAccessTechnicalService', label: 'Technical Service & Scan Servis Bengkel', desc: 'Mekanik scan perbaikan, ganti sparepart/jasa dan rilis alat', category: 'Pemeliharaan' },
    { key: 'canManageQuotations', label: 'Kelola Sales Quotations (Penawaran)', desc: 'Penerbitan dan persetujuan proposal penawaran', category: 'Komersial' },
    { key: 'canManageSalesRentals', label: 'Kelola Sales Order & Kontrak Rental', desc: 'Booking armada sewa dan order penjualan', category: 'Komersial' },
    { key: 'canManageInvoices', label: 'Penerbitan Invoice & Faktur Pajak', desc: 'Generate commercial invoice dan credit notes', category: 'Finance' },
    { key: 'canManagePayments', label: 'Recording Pembayaran & Settlement', desc: 'Pencatatan pelunasan dan rekonsiliasi bank', category: 'Finance' },
    { key: 'canManageProcurement', label: 'Pengadaan, PO Vendor & Sparepart', desc: 'Pembelian aset, komponen, dan tagihan supplier', category: 'Pengadaan' },
    { key: 'canManageUsers', label: 'Manajemen Pengguna & Pengaturan IT', desc: 'Kelola akun pengguna, reset password, konfigurasi', category: 'IT & Sistem' },
    { key: 'canAccessApiAndAudit', label: 'Akses REST API & Log Audit Sistem', desc: 'Audit trail tingkat rendah dan API explorer', category: 'IT & Sistem' },
    { key: 'canExportReports', label: 'Export Laporan ke Excel & PDF', desc: 'Mencetak dan mengunduh laporan resmi', category: 'Laporan' },
  ];

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h1 className="text-base font-bold text-slate-900">
              Manajemen Pengguna &amp; Hak Akses (Divisi IT)
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
              IT Controlled Matrix
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Otoritas penuh konfigurasi pengguna, penugasan peran kerja, cabang operasional, dan kustomisasi matriks hak akses.
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
            title="Buka Menu Reset Password Pengguna"
          >
            <Key className="w-3.5 h-3.5 text-amber-700" />
            <span>Reset Password Pengguna</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-slate-900 hover:bg-slate-800 text-white cursor-pointer shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5 text-amber-400" />
            Tambah Pengguna Baru
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-md border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs">
        <div className="sm:col-span-5 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nama, email, nomor badge, departemen..."
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
            <option value="ALL">Semua Peran (All Roles)</option>
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
            <option value="ALL">Semua Cabang / Site</option>
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
                <th className="py-2.5 px-4">Pegawai / Identitas</th>
                <th className="py-2.5 px-4">Role Sistem</th>
                <th className="py-2.5 px-4">Departemen &amp; Cabang</th>
                <th className="py-2.5 px-4 text-center">Status Akun</th>
                <th className="py-2.5 px-4 text-center">Hak Akses Kustom</th>
                <th className="py-2.5 px-4 text-right">Aksi IT</th>
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
                        <span>{user.assignedBranch || 'Kantor Pusat Jakarta'}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(user)}
                        title="Klik untuk mengubah status akun"
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
                            <span>AKTIF</span>
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
                        <span>{hasCustomPerms ? 'Kustom (Aktif)' : 'Atur Hak Akses'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenResetModal(user)}
                          title="Buka Menu Reset Password Pengguna"
                          className="px-2.5 py-1 rounded bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 font-bold cursor-pointer flex items-center gap-1 text-[11px] shadow-2xs transition-colors"
                        >
                          <Key className="w-3.5 h-3.5 text-amber-800" />
                          <span>Reset Password</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPrintingBadgeUser(user)}
                          title="Cetak ID Card / Badge Akses"
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-indigo-700 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingUser(user)}
                          title="Edit Profil Pengguna"
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
                <h3 className="text-sm font-bold text-slate-900">Pendaftaran Pengguna Baru (Divisi IT)</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Pegawai *</label>
                <input
                  type="text"
                  required
                  placeholder="cth: Rahmat Hidayat"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded font-medium focus:border-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Perusahaan *</label>
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
                  <label className="block font-semibold text-slate-700 mb-1">Peran Kerja (System Role) *</label>
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
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Badge / ID Pegawai</label>
                  <input
                    type="text"
                    placeholder="cth: EMP-8821"
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-mono focus:border-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Penempatan Cabang / Site</label>
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
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Telepon / WhatsApp</label>
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
                <label className="block font-semibold text-slate-700 mb-1">Departemen</label>
                <input
                  type="text"
                  value={formDepartment}
                  onChange={(e) => setFormDepartment(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:border-slate-800 outline-none"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded border border-amber-200 text-amber-800 text-[11px]">
                <span className="font-semibold block mb-0.5">Keamanan IT:</span>
                Password sementara acak akan dibuatkan secara otomatis dan dikirimkan ke alamat email pengguna yang didaftarkan.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded cursor-pointer"
                >
                  Simpan Pengguna
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
                  Kustomisasi Matriks Hak Akses: {customizingPermissionsUser.name}
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
                  Peran Dasar: <span className="font-mono font-semibold text-indigo-700">{customizingPermissionsUser.role}</span> · {customizingPermissionsUser.department}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActivePermissions(DEFAULT_ROLE_PERMISSIONS[customizingPermissionsUser.role])}
                className="px-2.5 py-1 rounded bg-white border border-slate-300 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Reset ke Default Role
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
                Perubahan langsung berlaku pada sesi login pengguna berikutnya.
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCustomizingPermissionsUser(null)}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded cursor-pointer"
                >
                  Terapkan Hak Akses
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
                Kartu Akses Pegawai Resmi (ID Badge)
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
                  <div>STATUS: AKTIF</div>
                </div>
                <div className="bg-white p-1 rounded">
                  <QrCode className="w-9 h-9 text-slate-900" />
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPrintingBadgeUser(null)}
                className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Kartu Badge
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
                  alert('Perubahan profil berhasil disimpan!');
                  setEditingUser(null);
                  await loadUsers();
                  if (onRefresh) onRefresh();
                } catch (err: any) {
                  alert(`Gagal menyimpan: ${err.message}`);
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded font-medium focus:border-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Peran Kerja (Role)</label>
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
                  <label className="block font-semibold text-slate-700 mb-1">Cabang / Site</label>
                  <select
                    value={editingUser.assignedBranch || 'Kantor Pusat Jakarta'}
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
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Badge</label>
                  <input
                    type="text"
                    value={editingUser.employeeBadge || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, employeeBadge: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded font-mono focus:border-slate-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Departemen</label>
                <input
                  type="text"
                  value={editingUser.department}
                  onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded focus:border-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Telepon</label>
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
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded cursor-pointer"
                >
                  Simpan Perubahan
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
                    Menu Reset Password Pengguna
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Otoritas Manajemen Keamanan &amp; Akun Divisi IT
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
                Pilih Akun Pegawai yang Ingin di-Reset *
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
              <div className="text-slate-600">Badge ID: <span className="font-semibold text-slate-800">{resettingUser.employeeBadge || '-'}</span> · Peran: <span className="font-semibold text-indigo-700">{resettingUser.role}</span></div>
              <div className="text-slate-500 text-[10px]">Cabang / Site: {resettingUser.assignedBranch || 'Kantor Pusat Jakarta'}</div>
            </div>

            {/* If reset has succeeded: show credential card */}
            {resetSuccessData ? (
              <div className="space-y-3">
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg space-y-2 text-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="font-bold text-sm text-emerald-900">
                    Password Berhasil Di-Reset!
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    Kredensial baru telah diterbitkan oleh sistem dan tercatat dalam Audit Log IT.
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
                        title={showPasswordText ? 'Sembunyikan' : 'Tampilkan'}
                      >
                        {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyCredentials}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-[11px] flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        {passwordCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {passwordCopied ? 'Tersalin!' : 'Salin Kredensial'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 space-y-1 bg-amber-50/70 p-2.5 rounded border border-amber-200 text-amber-900">
                  <div className="font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700" /> Instruksi Penggunaan:
                  </div>
                  <p>
                    Salin kredensial di atas dan sampaikan kepada pegawai yang bersangkutan melalui saluran resmi perusahaan (WhatsApp / Email korporat).
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
                    Selesai &amp; Tutup
                  </button>
                </div>
              </div>
            ) : (
              /* Reset Form */
              <form onSubmit={handleExecuteResetPassword} className="space-y-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Password Baru Kustom (Opsional)
                  </label>
                  <input
                    type="text"
                    value={customPasswordInput}
                    onChange={(e) => setCustomPasswordInput(e.target.value)}
                    placeholder="Kosongkan jika ingin sistem men-generate password otomatis"
                    className="w-full p-2 border border-slate-300 rounded font-mono text-xs focus:border-slate-800 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Minimal 6 karakter jika diisi, atau biarkan kosong untuk random string (cth: ApexPass#4819).
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
                    <span>Wajibkan ganti password saat login pertama</span>
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
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Key className="w-4 h-4" />
                    Reset Password Sekarang
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
