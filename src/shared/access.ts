/**
 * Access Control List (ACL) — SATU sumber kebenaran untuk server & klien.
 *
 * - Server memakai ini untuk MEMAKSA (enforce) akses di setiap endpoint.
 * - Klien memakai ini hanya untuk menampilkan menu & halaman yang relevan (UX).
 *   Menyembunyikan menu BUKAN keamanan; keamanan ada di server.
 */
import type { UserRole, UserPermissionMatrix, User } from '../types/index.ts';

export type ModuleId =
  | 'reports' | 'dashboard' | 'customers' | 'quotations' | 'sales' | 'rentals'
  | 'deliveries' | 'invoices' | 'payments' | 'assets' | 'products' | 'procurement'
  | 'maintenance' | 'operator-status' | 'technical-service'
  | 'user-management' | 'api-explorer' | 'test-runner' | 'settings' | 'manager-approvals';

export const ALL_MODULES: ModuleId[] = [
  'reports', 'dashboard', 'customers', 'quotations', 'sales', 'rentals', 'deliveries',
  'invoices', 'payments', 'assets', 'products', 'procurement', 'maintenance',
  'operator-status', 'technical-service', 'user-management', 'api-explorer', 'test-runner', 'settings', 'manager-approvals',
];

/** Modul bawaan tiap peran (baseline). */
export const ROLE_MODULES: Record<UserRole, ModuleId[]> = {
  EXECUTIVE: ['reports', 'dashboard', 'manager-approvals'],
  ADMIN_IT: [...ALL_MODULES],
  SALES_MARKETING: ['quotations', 'sales', 'customers', 'deliveries', 'products', 'assets', 'reports'],
  ASSET_CONTROL: ['assets', 'deliveries', 'rentals', 'products', 'maintenance', 'reports'],
  MANAGEMENT_OPERATION: ['maintenance', 'assets', 'deliveries', 'rentals', 'reports'],
  PROCUREMENT: ['procurement', 'products', 'reports'],
  FINANCE_ACCOUNTING_TAX: ['invoices', 'payments', 'customers', 'reports'],
  AR_MANAGEMENT: ['invoices', 'reports', 'payments', 'customers'],
  OPERATOR_USER: ['operator-status'],
  TECHNICAL_SERVICE: ['technical-service', 'maintenance', 'assets', 'products', 'reports'],
  MANAGER: ['manager-approvals'],
};

export const DEFAULT_TAB: Record<UserRole, ModuleId> = {
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
  MANAGER: 'manager-approvals',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  EXECUTIVE: 'Executive Director',
  ADMIN_IT: 'IT Administrator',
  SALES_MARKETING: 'Sales & Marketing',
  ASSET_CONTROL: 'Asset Control',
  MANAGEMENT_OPERATION: 'Management Operation',
  PROCUREMENT: 'Procurement',
  FINANCE_ACCOUNTING_TAX: 'Finance, Accounting & Tax',
  AR_MANAGEMENT: 'AR Management',
  OPERATOR_USER: 'Field Operator',
  TECHNICAL_SERVICE: 'Technical Service',
  MANAGER: 'Manager',
};

export const ALL_ROLES = Object.keys(ROLE_MODULES) as UserRole[];

/**
 * Tiap kunci pada matriks izin per-pengguna memetakan ke modul tertentu.
 * `canUploadLegalDocs` adalah izin tindakan (bukan modul) → dicek di endpoint dokumen legal.
 */
export const PERMISSION_MODULES: Record<keyof UserPermissionMatrix, ModuleId[]> = {
  canViewDashboard: ['dashboard'],
  canManageCustomers: ['customers'],
  canManageProducts: ['products'],
  canManageDeliveries: ['deliveries'],
  canManageAssets: ['assets'],
  canUploadLegalDocs: [],
  canManageOperators: ['maintenance'],
  canManageMaintenance: ['maintenance'],
  canScanAndSubmitStatus: ['operator-status'],
  canAccessTechnicalService: ['technical-service'],
  canManageQuotations: ['quotations'],
  canManageSalesRentals: ['sales', 'rentals'],
  canManageInvoices: ['invoices'],
  canManagePayments: ['payments'],
  canManageProcurement: ['procurement'],
  canManageUsers: ['user-management'],
  canAccessApiAndAudit: ['api-explorer', 'test-runner', 'settings'],
  canExportReports: ['reports'],
};

const PERMISSION_KEYS = Object.keys(PERMISSION_MODULES) as (keyof UserPermissionMatrix)[];

/** Matriks izin bawaan sebuah peran (diturunkan dari baseline, bukan ditulis manual → tidak bisa menyimpang). */
export function permissionsFromRole(role: UserRole): UserPermissionMatrix {
  const base = new Set(ROLE_MODULES[role] || []);
  const out = {} as UserPermissionMatrix;
  for (const key of PERMISSION_KEYS) {
    const mods = PERMISSION_MODULES[key];
    out[key] = mods.length === 0 ? base.has('assets') : mods.some((m) => base.has(m));
  }
  return out;
}

type AclUser = Pick<User, 'role'> & { permissions?: Partial<UserPermissionMatrix>; status?: User['status'] };

/**
 * Modul efektif = baseline peran, dimodifikasi HANYA oleh kunci izin yang nilainya
 * berbeda dari bawaan peran (delta). Dengan begitu matriks penuh dari UI tidak
 * mengubah apa pun kecuali admin memang mengubahnya.
 */
export function getEffectiveModules(user: AclUser | null | undefined): ModuleId[] {
  if (!user || (user.status && user.status !== 'ACTIVE')) return [];
  const baseline = new Set<ModuleId>(ROLE_MODULES[user.role] || []);
  const preset = permissionsFromRole(user.role);
  const overrides = user.permissions || {};

  const result = new Set<ModuleId>(baseline);
  for (const mod of ALL_MODULES) {
    const keys = PERMISSION_KEYS.filter((k) => PERMISSION_MODULES[k].includes(mod));
    if (keys.length === 0) continue;
    const hasDelta = keys.some((k) => typeof overrides[k] === 'boolean' && overrides[k] !== preset[k]);
    if (!hasDelta) continue;
    const granted = keys.some((k) => (typeof overrides[k] === 'boolean' ? overrides[k] : preset[k]));
    if (granted) result.add(mod); else result.delete(mod);
  }
  return [...result];
}

export function canAccessModule(user: AclUser | null | undefined, mod: ModuleId): boolean {
  return getEffectiveModules(user).includes(mod);
}

/** Izin tindakan (non-modul). */
export function hasActionPermission(user: AclUser, key: keyof UserPermissionMatrix): boolean {
  const v = user.permissions?.[key];
  if (typeof v === 'boolean') return v;
  return permissionsFromRole(user.role)[key];
}

export function defaultTabFor(user: AclUser | null | undefined): ModuleId {
  const mods = getEffectiveModules(user);
  if (!user) return 'reports';
  const preferred = DEFAULT_TAB[user.role];
  return mods.includes(preferred) ? preferred : (mods[0] || preferred);
}

export const PASSWORD_POLICY_TEXT = 'At least 8 characters, including letters and numbers.';
export function validatePasswordStrength(pw: string): string | null {
  if (typeof pw !== 'string' || pw.length < 8) return 'Password must be at least 8 characters.';
  if (pw.length > 128) return 'Password must be no more than 128 characters.';
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Password must contain letters and numbers.';
  return null;
}
