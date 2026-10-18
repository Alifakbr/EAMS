import {
  Customer,
  Product,
  Asset,
  Quotation,
  SalesOrder,
  RentalContract,
  Delivery,
  Invoice,
  Payment,
  Vendor,
  PurchaseOrder,
  VendorBill,
  WorkOrder,
  AuditLog,
  SystemSettings,
  User,
} from '../types/index.ts';
import { session, SESSION_EVENTS } from './session.ts';
import type { ModuleId } from '../shared/access.ts';

const BASE = '/api/v1';

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const authHeaders = (): Record<string, string> => {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function handleError(res: Response, isLogin: boolean): Promise<never> {
  const body = await res.json().catch(() => ({ error: res.statusText }));
  if (res.status === 401 && !isLogin) {
    session.clear();
    window.dispatchEvent(new Event(SESSION_EVENTS.expired));
  }
  if (res.status === 403 && body.code === 'PASSWORD_CHANGE_REQUIRED') {
    window.dispatchEvent(new Event(SESSION_EVENTS.passwordRequired));
  }
  throw new ApiError(body.error || `HTTP ${res.status}: ${res.statusText}`, res.status, body.code);
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) return handleError(res, path === '/auth/login');
  return res.json();
}

/** Unduh file dari endpoint API yang butuh login (tag <a href> tidak bisa mengirim token). */
export async function fetchBlob(path: string): Promise<{ blob: Blob; filename?: string }> {
  const res = await fetch(`${BASE}${path}`, { headers: authHeaders() });
  if (!res.ok) return handleError(res, false);
  const cd = res.headers.get('Content-Disposition') || '';
  const m = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(cd);
  return { blob: await res.blob(), filename: m ? decodeURIComponent(m[1]) : undefined };
}

export interface SessionInfo {
  user: User;
  modules: ModuleId[];
}

export interface ManagerApprovalItem {
  type: 'quotation' | 'sales' | 'rental' | 'invoice' | 'procurement' | 'delivery' | 'maintenance';
  id: string;
  reference: string;
  customer: string;
  status: string;
  amount: number;
  submittedAt: string;
  data: Record<string, unknown>;
}

export const api = {
  getFormDraft: (key: string) =>
    request<{ data: Record<string, string> | null; updatedAt: string | null }>(`/drafts/${encodeURIComponent(key)}`),
  saveFormDraft: (key: string, data: Record<string, string>) =>
    request<{ updatedAt: string }>(`/drafts/${encodeURIComponent(key)}`, { method: 'PUT', body: JSON.stringify({ data }) }),
  deleteFormDraft: (key: string) =>
    request<{ message: string }>(`/drafts/${encodeURIComponent(key)}`, { method: 'DELETE' }),
  getManagerApprovals: () =>
    request<{ data: ManagerApprovalItem[]; total: number }>('/manager/approvals'),
  decideManagerApproval: (type: ManagerApprovalItem['type'], id: string, decision: 'approve' | 'reject') =>
    request<{ data: Record<string, unknown>; message: string }>(
      `/manager/approvals/${type}/${encodeURIComponent(id)}/${decision}`,
      { method: 'POST' }
    ),
  // Customers
  getCustomers: (search?: string, status?: string) => {
    const q = new URLSearchParams();
    if (search) q.set('search', search);
    if (status) q.set('status', status);
    return request<{ data: Customer[]; total: number }>(`/customers?${q.toString()}`);
  },
  getCustomer: (id: string) => request<Customer>(`/customers/${id}`),
  createCustomer: (data: Partial<Customer>) => request<Customer>('/customers', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id: string, data: Partial<Customer>) => request<Customer>(`/customers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getCustomerStatement: (id: string) => request<any>(`/customers/${id}/statement`),

  // Products
  getProducts: (search?: string, category?: string, type?: string) => {
    const q = new URLSearchParams();
    if (search) q.set('search', search);
    if (category) q.set('category', category);
    if (type) q.set('type', type);
    return request<{ data: Product[]; total: number }>(`/products?${q.toString()}`);
  },
  createProduct: (data: Partial<Product>) => request<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: Partial<Product>) => request<Product>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Assets
  getAssets: (search?: string, status?: string, category?: string) => {
    const q = new URLSearchParams();
    if (search) q.set('search', search);
    if (status) q.set('status', status);
    if (category) q.set('category', category);
    return request<{ data: Asset[]; total: number }>(`/assets?${q.toString()}`);
  },
  getAssetHistory: (id: string) => request<any>(`/assets/${id}/history`),
  createAsset: (data: Partial<Asset>) => request<Asset>('/assets', { method: 'POST', body: JSON.stringify(data) }),
  updateAsset: (id: string, data: Partial<Asset>) => request<Asset>(`/assets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Quotations
  getQuotations: () => request<{ data: Quotation[]; total: number }>('/quotations'),
  createQuotation: (data: any) => request<Quotation>('/quotations', { method: 'POST', body: JSON.stringify(data) }),
  approveQuotation: (id: string) => request<Quotation>(`/quotations/${id}/approve`, { method: 'POST' }),
  acceptQuotation: (id: string) => request<Quotation>(`/quotations/${id}/accept`, { method: 'POST' }),
  convertToOrder: (id: string, data: { customerPoReference?: string; shippingFee?: number; targetDeliveryDate?: string }) =>
    request<SalesOrder>(`/quotations/${id}/convert-to-order`, { method: 'POST', body: JSON.stringify(data) }),

  // Sales Orders
  getSalesOrders: () => request<{ data: SalesOrder[]; total: number }>('/sales-orders'),
  createSalesOrder: (data: any) => request<SalesOrder>('/sales-orders', { method: 'POST', body: JSON.stringify(data) }),
  cancelSalesOrder: (id: string, reason: string) => request<SalesOrder>(`/sales-orders/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),

  // Rentals
  getRentals: () => request<{ data: RentalContract[]; total: number }>('/rentals'),
  createRental: (data: any) => request<RentalContract>('/rentals', { method: 'POST', body: JSON.stringify(data) }),
  extendRental: (id: string, data: { newReturnDate: string; additionalAmount?: number }) =>
    request<RentalContract>(`/rentals/${id}/extend`, { method: 'POST', body: JSON.stringify(data) }),
  returnRental: (id: string, data: { returnCondition?: string; damageCharge?: number; inspectionNotes?: string; returnedAssetIds?: string[] }) =>
    request<RentalContract>(`/rentals/${id}/return`, { method: 'POST', body: JSON.stringify(data) }),

  // Deliveries
  getDeliveries: () => request<{ data: Delivery[]; total: number }>('/deliveries'),
  createDelivery: (data: any) => request<Delivery>('/deliveries', { method: 'POST', body: JSON.stringify(data) }),
  confirmDelivery: (id: string, data: { digitalSignature?: string; acceptedBy?: string; conditionNotes?: string }) =>
    request<Delivery>(`/deliveries/${id}/confirm`, { method: 'POST', body: JSON.stringify(data) }),

  // Invoices & Billing
  getInvoices: () => request<{ data: Invoice[]; total: number }>('/invoices'),
  getInvoice: (id: string) => request<Invoice>(`/invoices/${id}`),
  createInvoice: (data: any) => request<Invoice>('/invoices', { method: 'POST', body: JSON.stringify(data) }),
  issueInvoice: (id: string) => request<Invoice>(`/invoices/${id}/issue`, { method: 'POST' }),
  createCreditNote: (id: string, data: { reason: string; creditAmount?: number }) =>
    request<Invoice>(`/invoices/${id}/credit-notes`, { method: 'POST', body: JSON.stringify(data) }),

  // Payments
  getPayments: () => request<{ data: Payment[]; total: number }>('/payments'),
  createPayment: (data: any) => request<Payment>('/payments', { method: 'POST', body: JSON.stringify(data) }),
  allocatePayment: (id: string, data: { allocations: { invoiceId: string; allocatedAmount: number }[] }) =>
    request<Payment>(`/payments/${id}/allocate`, { method: 'POST', body: JSON.stringify(data) }),

  // Procurement & Vendors
  getVendors: () => request<{ data: Vendor[]; total: number }>('/procurement/vendors'),
  createVendor: (data: Partial<Vendor>) => request<Vendor>('/procurement/vendors', { method: 'POST', body: JSON.stringify(data) }),
  deleteVendor: (id: string) => request<{ message: string }>(`/procurement/vendors/${id}`, { method: 'DELETE' }),
  getPurchaseOrders: () => request<{ data: PurchaseOrder[]; total: number }>('/procurement/purchase-orders'),
  createPurchaseOrder: (data: any) => request<PurchaseOrder>('/procurement/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),
  deletePurchaseOrder: (id: string) => request<{ message: string }>(`/procurement/purchase-orders/${id}`, { method: 'DELETE' }),
  receivePurchaseOrder: (id: string) => request<PurchaseOrder>(`/procurement/purchase-orders/${id}/receive`, { method: 'POST' }),
  getVendorBills: () => request<{ data: VendorBill[]; total: number }>('/procurement/vendor-bills'),
  payVendorBill: (id: string) => request<VendorBill>(`/procurement/vendor-bills/${id}/pay`, { method: 'POST' }),

  // Maintenance & Field Operations
  getWorkOrders: () => request<{ data: WorkOrder[]; total: number }>('/maintenance/work-orders'),
  createWorkOrder: (data: any) => request<WorkOrder>('/maintenance/work-orders', { method: 'POST', body: JSON.stringify(data) }),
  completeWorkOrder: (id: string, resolutionNotes?: string) =>
    request<WorkOrder>(`/maintenance/work-orders/${id}/complete`, { method: 'POST', body: JSON.stringify({ resolutionNotes }) }),

  // Field Operators & SIO Management (Personil Operator Data & Assignment)
  getOperators: () => request<{ data: any[]; total: number }>('/operators'),
  createOperator: (data: any) => request<any>('/operators', { method: 'POST', body: JSON.stringify(data) }),
  updateOperator: (id: string, data: any) => request<any>(`/operators/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  assignOperator: (id: string, data: any) => request<any>(`/operators/${id}/assign`, { method: 'POST', body: JSON.stringify(data) }),
  deleteOperator: (id: string) => request<{ message: string }>(`/operators/${id}`, { method: 'DELETE' }),

  // Operator Attendance Scan & Breakdown Reporting
  getAttendanceLogs: () => request<{ data: any[]; total: number }>('/operators/attendance'),
  checkInAttendance: (data: any) => request<any>('/operators/attendance/check-in', { method: 'POST', body: JSON.stringify(data) }),
  checkOutAttendance: (data: any) => request<any>('/operators/attendance/check-out', { method: 'POST', body: JSON.stringify(data) }),
  updateAttendanceLog: (id: string, data: any) => request<any>(`/operators/attendance/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  reportBreakdown: (data: any) => request<any>('/operators/attendance/report-breakdown', { method: 'POST', body: JSON.stringify(data) }),

  // Technical Service (Dashboard, Repair Requests, In-Progress, Scan Start & Complete)
  getTechnicalServiceDashboard: () => request<any>('/technical-service/dashboard'),
  scanStartTechnicalService: (data: any) => request<any>('/technical-service/scan-start', { method: 'POST', body: JSON.stringify(data) }),
  updateTechnicalWorkOrder: (id: string, data: any) => request<any>(`/technical-service/work-orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  scanCompleteTechnicalService: (data: any) => request<any>('/technical-service/scan-complete', { method: 'POST', body: JSON.stringify(data) }),

  // Reports
  getFinanceDashboard: () => request<any>('/reports/finance-dashboard'),
  getSalesReport: () => request<any>('/reports/sales'),
  getRentalsReport: () => request<any>('/reports/rentals'),
  getAccountsReceivableReport: () => request<any>('/reports/accounts-receivable'),
  getAssetProfitabilityReport: () => request<any>('/reports/asset-profitability'),

  // System & Tools
  getAuditLogs: () => request<{ data: AuditLog[]; total: number }>('/audit-logs'),
  getSettings: () => request<SystemSettings>('/settings'),
  updateSettings: (data: Partial<SystemSettings>) => request<SystemSettings>('/settings', { method: 'PATCH', body: JSON.stringify(data) }),
  resetDemoData: () => request<{ message: string; state: any }>('/system/reset-demo', { method: 'POST' }),
  runTests: () => request<any>('/system/run-tests'),

  // Assets & Barcode / Legal Documents
  getAssetByBarcode: (barcode: string) => request<any>(`/assets/barcode/${encodeURIComponent(barcode)}`),
  updateAssetDocuments: (id: string, legalDocs: any) => request<Asset>(`/assets/${id}/documents`, { method: 'POST', body: JSON.stringify(legalDocs) }),
  getStatusLogs: () => request<{ data: any[]; total: number }>('/assets/status-logs'),
  submitStatusLog: (data: any) => request<any>('/assets/status-logs', { method: 'POST', body: JSON.stringify(data) }),

  // Auth & IT User Management
  getAuthUsers: () => request<{ data: any[]; total: number }>('/auth/users'),
  createUser: (data: Partial<User> & { customPassword?: string }) =>
    request<User & { temporaryPassword?: string }>('/auth/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: string, data: Partial<User>) => request<User>(`/auth/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  resetUserPassword: (id: string, body?: { customPassword?: string; forcePasswordChange?: boolean }) =>
    request<{ message: string; temporaryPassword: string; resetAt?: string; userEmail?: string }>(
      `/auth/users/${id}/reset-password`,
      { method: 'POST', body: JSON.stringify(body || {}) }
    ),
  deleteUser: (id: string) => request<{ message: string }>(`/auth/users/${id}`, { method: 'DELETE' }),
  login: (credentials: { email: string; password: string }) =>
    request<SessionInfo & { message: string; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  me: () => request<SessionInfo>('/auth/me'),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<SessionInfo & { message: string; token: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),
  downloadBackup: () => fetchBlob('/system/backup'),

  // Notifications
  getNotifications: () => request<{ data: any[]; total: number; unreadCount: number }>('/notifications'),
  markNotificationRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request<{ message: string }>('/notifications/mark-all-read', { method: 'POST' }),
};
