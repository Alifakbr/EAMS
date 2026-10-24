import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db, calculateAssetBookValue, calculateLineTotals, toCents, fromCents } from './db.ts';
import { openApiSpec } from './openapi.ts';
import { runEamsTestSuite } from './tests.ts';
import { formatRupiahAmount } from '../src/shared/currency-format.ts';
import {
  authenticateAndAuthorize, actorName, actorUser, hashPassword, verifyPassword, generatePassword,
  publicUser, signToken, loginLockRemainingMs, recordLoginFailure, recordLoginSuccess,
  IS_PROD,
} from './auth.ts';
import { getEffectiveModules, ALL_ROLES, PERMISSION_MODULES, validatePasswordStrength } from '../src/shared/access.ts';
import {
  Customer,
  Product,
  Asset,
  Quotation,
  QuotationItem,
  SalesOrder,
  RentalContract,
  RentalItem,
  Delivery,
  Invoice,
  Payment,
  PaymentAllocation,
  WorkOrder,
  PurchaseOrder,
  AssetDailyStatusLog,
  OperatorAttendanceLog,
  HeavyEquipmentOperator,
  Vendor,
  VendorBill,
  UserRole,
} from '../src/types/index.ts';

export const apiRouter = express.Router();

// Semua endpoint melewati autentikasi + ACL (deny-by-default). Lihat server/auth.ts.
apiRouter.use(authenticateAndAuthorize);

apiRouter.get('/drafts/:key', (req: Request, res: Response) => {
  const user = actorUser(req);
  const formKey = req.params.key;
  if (!user || formKey.length > 200) return res.status(400).json({ error: 'Invalid draft key.' });
  const draft = db.getFormDraft(user.id, formKey);
  res.json({ data: draft?.data ?? null, updatedAt: draft?.updatedAt ?? null });
});

apiRouter.put('/drafts/:key', (req: Request, res: Response) => {
  const user = actorUser(req);
  const formKey = req.params.key;
  const data = req.body?.data;
  if (!user || formKey.length > 200 || !data || typeof data !== 'object' || Array.isArray(data)) {
    return res.status(400).json({ error: 'Invalid draft data.' });
  }
  if (JSON.stringify(data).length > 1_000_000) {
    return res.status(413).json({ error: 'Draft is too large to save.' });
  }
  const draft = db.saveFormDraft(user.id, formKey, data as Record<string, unknown>);
  res.json({ updatedAt: draft.updatedAt });
});

apiRouter.delete('/drafts/:key', (req: Request, res: Response) => {
  const user = actorUser(req);
  const formKey = req.params.key;
  if (!user || formKey.length > 200) return res.status(400).json({ error: 'Invalid draft key.' });
  db.deleteFormDraft(user.id, formKey);
  res.json({ message: 'Draft deleted successfully.' });
});

type ApprovalType = 'quotation' | 'sales' | 'rental' | 'invoice' | 'procurement' | 'delivery';
const APPROVAL_LABELS: Record<ApprovalType, string> = {
  quotation: 'Quotation',
  sales: 'Sales Order',
  rental: 'Rental Contract',
  invoice: 'Invoice',
  procurement: 'Purchase Order',
  delivery: 'Delivery',
};

apiRouter.get('/manager/approvals', (_req: Request, res: Response) => {
  const records = [
    ...db.getQuotations().filter((item) => item.status === 'PENDING_APPROVAL').map((item) => ({
      type: 'quotation' as const, id: item.id, reference: item.quotationNumber, customer: item.customerName,
      status: item.status, amount: item.grandTotal, submittedAt: item.date, data: item,
    })),
    ...db.getSalesOrders().filter((item) => item.status === 'PENDING').map((item) => ({
      type: 'sales' as const, id: item.id, reference: item.orderNumber, customer: item.customerName,
      status: item.status, amount: item.grandTotal, submittedAt: item.orderDate, data: item,
    })),
    ...db.getRentals().filter((item) => item.status === 'PENDING_APPROVAL').map((item) => ({
      type: 'rental' as const, id: item.id, reference: item.contractNumber, customer: item.customerName,
      status: item.status, amount: item.grandTotal, submittedAt: item.startDate, data: item,
    })),
    ...db.getInvoices().filter((item) => item.status === 'PENDING_APPROVAL').map((item) => ({
      type: 'invoice' as const, id: item.id, reference: item.invoiceNumber, customer: item.customerName,
      status: item.status, amount: item.grandTotal, submittedAt: item.issueDate, data: item,
    })),
    ...db.getPurchaseOrders().filter((item) => item.status === 'PENDING_APPROVAL').map((item) => ({
      type: 'procurement' as const, id: item.id, reference: item.poNumber, customer: item.vendorName,
      status: item.status, amount: item.grandTotal, submittedAt: item.orderDate, data: item,
    })),
    ...db.getDeliveries().filter((item) => item.status === 'PENDING_APPROVAL').map((item) => ({
      type: 'delivery' as const, id: item.id, reference: item.deliveryNumber, customer: item.customerName,
      status: item.status, amount: 0, submittedAt: item.dispatchDate, data: item,
    })),
  ].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  res.json({ data: records, total: records.length });
});

apiRouter.post('/manager/approvals/:type/:id/:decision', (req: Request, res: Response) => {
  const { type, id, decision } = req.params as { type: ApprovalType; id: string; decision: 'approve' | 'reject' };
  if (decision !== 'approve' && decision !== 'reject') {
    return res.status(400).json({ error: 'Invalid approval decision.' });
  }
  const approved = decision === 'approve';
  const label = APPROVAL_LABELS[type];

  try {
    const record = db.transaction(() => {
      let currentStatus = '';
      if (type === 'quotation') {
        const item = db.getQuotations().find((row) => row.id === id);
        if (!item) throw new Error('Quotation not found.');
        currentStatus = item.status;
        if (currentStatus !== 'PENDING_APPROVAL') throw new Error('Quotation is no longer awaiting approval.');
        item.status = approved ? 'APPROVED' : 'REJECTED';
        if (approved) { item.approvedBy = actorName(req); item.approvalDate = new Date().toISOString(); }
        return item;
      }
      if (type === 'sales') {
        const item = db.getSalesOrders().find((row) => row.id === id);
        if (!item) throw new Error('Sales order not found.');
        currentStatus = item.status;
        if (currentStatus !== 'PENDING') throw new Error('Sales order is no longer awaiting approval.');
        item.status = approved ? 'CONFIRMED' : 'CANCELLED';
        if (!approved) item.items.forEach((line) => {
          const asset = line.allocatedAssetTag
            ? db.getAssets().find((row) => row.assetTag === line.allocatedAssetTag)
            : undefined;
          if (asset?.status === 'RESERVED') {
            asset.status = 'AVAILABLE';
            asset.currentCustomerId = null;
            asset.currentCustomerName = null;
          }
        });
        if (!approved && item.quotationId) {
          const quotation = db.getQuotations().find((row) => row.id === item.quotationId);
          if (quotation) quotation.status = 'CANCELLED';
        }
        return item;
      }
      if (type === 'rental') {
        const item = db.getRentals().find((row) => row.id === id);
        if (!item) throw new Error('Rental contract not found.');
        currentStatus = item.status;
        if (currentStatus !== 'PENDING_APPROVAL') throw new Error('Rental contract is no longer awaiting approval.');
        item.status = approved ? 'RESERVED' : 'CANCELLED';
        item.items.forEach((line) => {
          const asset = db.getAssets().find((row) => row.id === line.assetId);
          if (!asset) return;
          if (approved && asset.status !== 'RESERVED') throw new Error(`Asset ${asset.assetTag} is no longer reserved for this contract.`);
          if (!approved && asset.activeRentalContractId === item.id) {
            asset.status = 'AVAILABLE';
            asset.currentCustomerId = null;
            asset.currentCustomerName = null;
            asset.activeRentalContractId = null;
          }
        });
        return item;
      }
      if (type === 'invoice') {
        const item = db.getInvoices().find((row) => row.id === id);
        if (!item) throw new Error('Invoice not found.');
        currentStatus = item.status;
        if (currentStatus !== 'PENDING_APPROVAL') throw new Error('Invoice is no longer awaiting approval.');
        item.status = approved ? 'ISSUED' : 'CANCELLED';
        if (approved) {
          const customer = db.getCustomers().find((row) => row.id === item.customerId);
          if (customer) customer.outstandingBalance = fromCents(toCents(customer.outstandingBalance) + toCents(item.grandTotal));
        }
        return item;
      }
      if (type === 'procurement') {
        const item = db.getPurchaseOrders().find((row) => row.id === id);
        if (!item) throw new Error('Purchase order not found.');
        currentStatus = item.status;
        if (currentStatus !== 'PENDING_APPROVAL') throw new Error('Purchase order is no longer awaiting approval.');
        item.status = approved ? 'APPROVED' : 'CANCELLED';
        if (approved) {
          const vendor = db.getVendors().find((row) => row.id === item.vendorId);
          // Reuse the Finance AP record created when the PO was submitted; never duplicate it.
          let vendorBill = db.getVendorBills().find((bill) => bill.purchaseOrderId === item.id);
          if (!vendorBill) {
            const billNumber = `VBILL-${item.poNumber.slice(-4)}-${Date.now().toString().slice(-4)}`;
            vendorBill = {
              id: billNumber, billNumber, purchaseOrderId: item.id, vendorId: item.vendorId,
              vendorName: item.vendorName, billDate: new Date().toISOString().split('T')[0],
              dueDate: new Date(Date.now() + (vendor?.paymentTerms || 30) * 86400000).toISOString().split('T')[0],
              amount: item.grandTotal, paidAmount: 0, status: 'UNPAID',
            };
            db.getVendorBills().unshift(vendorBill);
          }
          item.vendorBillId = vendorBill.id;
        }
        return item;
      }
      if (type === 'delivery') {
        const item = db.getDeliveries().find((row) => row.id === id);
        if (!item) throw new Error('Delivery not found.');
        currentStatus = item.status;
        if (currentStatus !== 'PENDING_APPROVAL') throw new Error('Delivery is no longer awaiting approval.');
        item.status = approved ? 'IN_TRANSIT' : 'CANCELLED';
        return item;
      }
      throw new Error('Unknown submission type.');
    });
    db.logAudit(actorName(req), `APPROVAL_${decision.toUpperCase()}`, type.toUpperCase(), id,
      `${label} ${id} ${approved ? 'approved' : 'rejected'} by ${actorName(req)}.`);
    db.save();
    res.json({ data: record, message: `${label} ${approved ? 'approved' : 'rejected'}.` });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process approval.';
    const status = /tidak ditemukan/i.test(message) ? 404 : 409;
    res.status(status).json({ error: message });
  }
});

// Additional role guard for special handler logic; the primary ACL is in auth.ts.
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = actorUser(req)?.role;
    if (role && (role === 'ADMIN_IT' || allowedRoles.includes(role))) return next();
    return res.status(403).json({ error: `Access denied: role "${role}" is not authorized to perform this operation.`, code: 'FORBIDDEN' });
  };
};

// Test suite endpoint
apiRouter.get('/system/run-tests', (_req: Request, res: Response) => {
  const summary = runEamsTestSuite();
  res.json(summary);
});

// ==========================================
// AUTHENTICATION & SESSION
// ==========================================
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USER_STATUSES = ['ACTIVE', 'SUSPENDED', 'INACTIVE'] as const;
const PERMISSION_KEYS = Object.keys(PERMISSION_MODULES);

const sessionPayload = (user: any) => ({
  user: publicUser(user),
  modules: getEffectiveModules(user),
});

const sanitizePermissions = (input: any): Record<string, boolean> => {
  const out: Record<string, boolean> = {};
  if (input && typeof input === 'object') {
    for (const k of PERMISSION_KEYS) if (typeof input[k] === 'boolean') out[k] = input[k];
  }
  return out;
};

const activeAdminCount = (excludeId?: string) =>
  db.getUsers().filter((u) => u.role === 'ADMIN_IT' && u.status === 'ACTIVE' && u.id !== excludeId).length;

const newUserId = () => `USR-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  const cleanEmail = email.trim().toLowerCase();

  const lockMs = loginLockRemainingMs(req, cleanEmail);
  if (lockMs > 0) {
    return res.status(429).json({
      error: `Too many failed attempts. Please try again in ${Math.ceil(lockMs / 60000)} minutes.`,
      code: 'LOCKED',
    });
  }

  const user = db.getUsers().find((u) => u.email.toLowerCase() === cleanEmail);
  const ok = await verifyPassword(password, user?.passwordHash);
  if (!user || !ok) {
    recordLoginFailure(req, cleanEmail);
    db.logAudit('Anonymous', 'LOGIN_FAILED', 'USER', cleanEmail, `Failed login attempt for ${cleanEmail}`);
    db.save();
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }
  if (user.status !== 'ACTIVE') {
    return res.status(403).json({ error: 'Your account is inactive. Contact the IT Administrator.' });
  }

  recordLoginSuccess(req, cleanEmail);
  user.lastLogin = new Date().toISOString();
  db.logAudit(user.name, 'USER_LOGIN', 'USER', user.id, `User ${user.name} (${user.email}) logged in as ${user.role}`);
  db.save();

  res.json({ message: 'Login successful', token: signToken(user), ...sessionPayload(user) });
});

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  res.json(sessionPayload(actorUser(req)));
});

apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  const user = actorUser(req)!;
  db.logAudit(user.name, 'USER_LOGOUT', 'USER', user.id, `User ${user.name} logged out`);
  db.save();
  res.json({ message: 'Logged out successfully' });
});

apiRouter.post('/auth/change-password', async (req: Request, res: Response) => {
  const user = actorUser(req)!;
  const { currentPassword, newPassword } = req.body || {};
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
    return res.status(400).json({ error: 'Current and new passwords are required.' });
  }
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    return res.status(400).json({ error: 'Incorrect current password.' });
  }
  const weak = validatePasswordStrength(newPassword);
  if (weak) return res.status(400).json({ error: weak });
  if (newPassword === currentPassword) {
    return res.status(400).json({ error: 'The new password must be different from the current password.' });
  }
  user.passwordHash = await hashPassword(newPassword);
  user.tokenVersion = (user.tokenVersion || 1) + 1; // invalidate sessions on other devices
  user.mustChangePassword = false;
  db.logAudit(user.name, 'PASSWORD_CHANGED', 'USER', user.id, `User ${user.name} changed their password`);
  db.save();
  res.json({ message: 'Password changed successfully.', token: signToken(user), ...sessionPayload(user) });
});

// ==========================================
// IT USER MANAGEMENT (user-management module only)
// ==========================================
apiRouter.get('/auth/users', (_req: Request, res: Response) => {
  const list = db.getUsers().map(publicUser);
  res.json({ data: list, total: list.length });
});

apiRouter.post('/auth/users', async (req: Request, res: Response) => {
  const { name, email, role, department, employeeBadge, assignedBranch, phone, permissions, customPassword } = req.body || {};
  if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' || !role) {
    return res.status(400).json({ error: 'Name, email, and role are required.' });
  }
  if (!EMAIL_RE.test(email.trim())) return res.status(400).json({ error: 'Invalid email format.' });
  if (!ALL_ROLES.includes(role)) return res.status(400).json({ error: 'Unknown role.' });

  const cleanEmail = email.trim().toLowerCase();
  if (db.getUsers().some((u) => u.email.toLowerCase() === cleanEmail)) {
    return res.status(400).json({ error: `A user with email ${cleanEmail} is already registered.` });
  }

  let tempPassword = generatePassword();
  if (typeof customPassword === 'string' && customPassword.trim()) {
    const weak = validatePasswordStrength(customPassword.trim());
    if (weak) return res.status(400).json({ error: weak });
    tempPassword = customPassword.trim();
  }

  const newUser: any = {
    id: newUserId(),
    name: name.trim(),
    email: cleanEmail,
    role,
    department: department || 'Company Operations',
    employeeBadge: employeeBadge || `EMP-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
    assignedBranch: assignedBranch || 'Jakarta Head Office',
    phone: phone || '',
    status: 'ACTIVE' as const,
    permissions: sanitizePermissions(permissions),
    passwordHash: await hashPassword(tempPassword),
    tokenVersion: 1,
    mustChangePassword: true,
  };

  db.getUsers().push(newUser);
  db.logAudit(actorName(req), 'USER_CREATED', 'USER', newUser.id, `Created account for ${newUser.name} with role ${newUser.role}`);
  db.save();

  res.status(201).json({ ...publicUser(newUser), temporaryPassword: tempPassword });
});

apiRouter.put('/auth/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const target = db.getUsers().find((u) => u.id === id);
  if (!target) return res.status(404).json({ error: 'User not found.' });
  const actor = actorUser(req)!;
  const body = req.body || {};
  const isSelf = actor.id === target.id;

  const sensitiveChange =
    (body.role !== undefined && body.role !== target.role) ||
    (body.status !== undefined && body.status !== target.status) ||
    body.permissions !== undefined;
  if (isSelf && sensitiveChange) {
    return res.status(400).json({ error: 'You cannot change your own role, status, or permissions (to prevent lockout or privilege escalation).' });
  }
  if (body.role !== undefined && !ALL_ROLES.includes(body.role)) {
    return res.status(400).json({ error: 'Unknown role.' });
  }
  if (body.status !== undefined && !(USER_STATUSES as readonly string[]).includes(body.status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }

  const nextRole = body.role ?? target.role;
  const nextStatus = body.status ?? target.status;
  const staysActiveAdmin = nextRole === 'ADMIN_IT' && nextStatus === 'ACTIVE';
  if (target.role === 'ADMIN_IT' && !staysActiveAdmin && activeAdminCount(target.id) === 0) {
    return res.status(400).json({ error: 'At least one active IT Administrator must always remain.' });
  }

  // Whitelist field — passwordHash, id, email, tokenVersion tidak bisa diubah dari sini.
  for (const f of ['name', 'department', 'assignedBranch', 'employeeBadge', 'phone'] as const) {
    if (typeof body[f] === 'string') (target as any)[f] = body[f].trim();
  }
  if (!target.name) return res.status(400).json({ error: 'Name cannot be empty.' });
  target.role = nextRole;
  target.status = nextStatus;
  if (body.permissions !== undefined) target.permissions = sanitizePermissions(body.permissions);
  if (nextStatus !== 'ACTIVE') target.tokenVersion = (target.tokenVersion || 1) + 1;

  db.logAudit(actor.name, 'USER_UPDATED', 'USER', id, `Updated account ${target.name} (${target.role}, ${target.status})`);
  db.save();
  res.json(publicUser(target));
});

apiRouter.post('/auth/users/:id/reset-password', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { customPassword, forcePasswordChange } = req.body || {};
  const user = db.getUsers().find((u) => u.id === id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  let temporaryPassword = generatePassword();
  if (typeof customPassword === 'string' && customPassword.trim()) {
    const weak = validatePasswordStrength(customPassword.trim());
    if (weak) return res.status(400).json({ error: weak });
    temporaryPassword = customPassword.trim();
  }

  user.passwordHash = await hashPassword(temporaryPassword); // BENAR-BENAR disimpan (sebelumnya tidak)
  user.tokenVersion = (user.tokenVersion || 1) + 1;           // sesi lama gugur
  user.mustChangePassword = forcePasswordChange !== false;
  const operatorName = actorName(req);
  db.logAudit(operatorName, 'PASSWORD_RESET', 'USER', id, `Admin reset the password for ${user.name} (${user.email}).`);

  db.addNotification({
    id: `NTF-${Date.now().toString().slice(-6)}`,
    timestamp: new Date().toISOString(),
    sourceDepartment: 'IT & System Security',
    sourceUserName: operatorName,
    title: `Credentials Reset: ${user.name}`,
    message: `The password for ${user.name} (${user.email}) was reset by the IT Administrator.`,
    category: 'SYSTEM',
    severity: 'INFO',
    relatedEntity: 'USER',
    relatedEntityId: user.id,
    targetTab: 'user-management',
    targetRoles: ['ADMIN_IT'],
    isRead: false,
  });
  db.save();

  res.json({
    message: `Password for ${user.name} reset successfully.`,
    temporaryPassword,
    forcePasswordChange: !!user.mustChangePassword,
    userEmail: user.email,
    userName: user.name,
    resetAt: new Date().toISOString(),
  });
});

// Notifications Endpoints
const visibleNotifications = (req: Request) => {
  const role = actorUser(req)?.role;
  return db.getNotifications().filter((n) => !n.targetRoles || n.targetRoles.length === 0 || (role && (role === 'ADMIN_IT' || n.targetRoles.includes(role))));
};

apiRouter.get('/notifications', (req: Request, res: Response) => {
  syncComplianceExpiryNotifications();
  const all = visibleNotifications(req);
  const unreadCount = all.filter((n) => !n.isRead).length;
  res.json({
    data: all,
    total: all.length,
    unreadCount,
  });
});

apiRouter.put('/notifications/:id/read', (req: Request, res: Response) => {
  const { id } = req.params;
  const list = visibleNotifications(req);
  const item = list.find((n) => n.id === id);
  if (item) {
    item.isRead = true;
    db.save();
    return res.json(item);
  }
  res.status(404).json({ error: 'Notification not found' });
});

apiRouter.post('/notifications/mark-all-read', (req: Request, res: Response) => {
  const list = visibleNotifications(req);
  list.forEach((n) => { n.isRead = true; });
  db.save();
  res.json({ message: 'All notifications marked as read.' });
});

apiRouter.delete('/auth/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const user = db.getUsers().find((u) => u.id === id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  const actor = actorUser(req)!;
  if (actor.id === user.id) return res.status(400).json({ error: 'You cannot deactivate your own account.' });
  if (user.role === 'ADMIN_IT' && user.status === 'ACTIVE' && activeAdminCount(user.id) === 0) {
    return res.status(400).json({ error: 'At least one active IT Administrator must always remain.' });
  }
  user.status = 'INACTIVE';
  user.tokenVersion = (user.tokenVersion || 1) + 1;
  db.logAudit(actor.name, 'USER_DEACTIVATED', 'USER', id, `Deactivated account ${user.name}`);
  db.save();
  res.json({ message: `User ${user.name} deactivated successfully.` });
});

// ==========================================
// OPERATORS & SIO MANAGEMENT
// ==========================================
apiRouter.get('/operators', (_req: Request, res: Response) => {
  res.json({ data: db.getOperators(), total: db.getOperators().length });
});

apiRouter.post('/operators', (req: Request, res: Response) => {
  const opData = req.body;
  if (!opData.name || !opData.sioNumber) {
    return res.status(400).json({ error: 'Operator name and SIO number are required.' });
  }
  const newOp = {
    id: `OPR-${Date.now().toString().slice(-4)}`,
    name: opData.name,
    badgeNumber: opData.badgeNumber || `OPR-B-${Date.now().toString().slice(-3)}`,
    phone: opData.phone || '',
    email: opData.email,
    status: opData.status || 'STANDBY',
    sioNumber: opData.sioNumber,
    sioClass: opData.sioClass || 'KELAS_1',
    sioExpiry: opData.sioExpiry || '2028-12-31',
    equipmentSpecialization: opData.equipmentSpecialization || 'Heavy Equipment',
    assignedAssetId: opData.assignedAssetId || null,
    assignedAssetName: opData.assignedAssetName || null,
    currentProjectLocation: opData.currentProjectLocation || 'Depot',
    hireDate: opData.hireDate || new Date().toISOString().slice(0, 10),
    notes: opData.notes,
  };
  db.getOperators().push(newOp);
  db.logAudit('Field Ops', 'OPERATOR_REGISTERED', 'OPERATOR', newOp.id, `Operator ${newOp.name} registered with SIO ${newOp.sioNumber}`);
  db.save();
  res.status(201).json(newOp);
});

apiRouter.put('/operators/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = db.getOperators().findIndex((o) => o.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Operator not found' });
  }
  const updated = { ...db.getOperators()[index], ...req.body };
  db.getOperators()[index] = updated;
  db.logAudit('Field Ops', 'OPERATOR_UPDATED', 'OPERATOR', id, `Updated operator ${updated.name} (SIO: ${updated.sioNumber})`);
  db.save();
  res.json(updated);
});

// OpenAPI Spec endpoint
apiRouter.get('/openapi.json', (_req: Request, res: Response) => {
  res.json(openApiSpec);
});

// ==========================================
// 1. CUSTOMERS & CRM
// ==========================================
apiRouter.get('/customers', (req: Request, res: Response) => {
  const { search, status } = req.query;
  let customers = db.getCustomers();

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    customers = customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.customerCode.toLowerCase().includes(q) ||
        c.taxId.toLowerCase().includes(q)
    );
  }

  if (status && typeof status === 'string') {
    customers = customers.filter((c) => c.status === status);
  }

  res.json({
    data: customers,
    total: customers.length,
  });
});

apiRouter.get('/customers/:id', (req: Request, res: Response) => {
  const customer = db.getCustomers().find((c) => c.id === req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  res.json(customer);
});

apiRouter.post('/customers', (req: Request, res: Response) => {
  try {
    const { name, type, taxId, contacts, billingAddress, deliveryAddress, creditLimit, paymentTermsDays, notes } = req.body;
    if (!name || !taxId) {
      return res.status(400).json({ error: 'Customer name and Tax ID are required' });
    }

    const newCustomer = db.transaction(() => {
      const code = `CUST-${String(db.getCustomers().length + 1).padStart(3, '0')}`;
      const customer: Customer = {
        id: code,
        customerCode: code,
        name,
        type: type || 'COMPANY',
        taxId,
        contacts: contacts || [],
        billingAddress: billingAddress || { street: '', city: '', state: '', postalCode: '', country: 'United States' },
        deliveryAddress: deliveryAddress || billingAddress || { street: '', city: '', state: '', postalCode: '', country: 'United States' },
        creditLimit: Number(creditLimit) || 100000,
        outstandingBalance: 0,
        paymentTermsDays: Number(paymentTermsDays) || 30,
        currency: 'IDR',
        status: 'ACTIVE',
        notes: notes || '',
        createdAt: new Date().toISOString(),
      };
      db.getCustomers().push(customer);
      db.logAudit(actorName(req), 'CUSTOMER_CREATED', 'CUSTOMER', customer.id, `Created customer ${customer.name}`);
      return customer;
    });

    res.status(201).json(newCustomer);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.patch('/customers/:id', (req: Request, res: Response) => {
  const customer = db.getCustomers().find((c) => c.id === req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  db.transaction(() => {
    Object.assign(customer, req.body);
    db.logAudit(actorName(req), 'CUSTOMER_UPDATED', 'CUSTOMER', customer.id, `Updated customer ${customer.name}`);
  });

  res.json(customer);
});

apiRouter.delete('/customers/:id', (req: Request, res: Response) => {
  const customer = db.getCustomers().find((c) => c.id === req.params.id || c.customerCode === req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found.' });
  const linkedRecords = [
    ...db.getQuotations().filter((item) => item.customerId === customer.id),
    ...db.getSalesOrders().filter((item) => item.customerId === customer.id),
    ...db.getRentals().filter((item) => item.customerId === customer.id),
    ...db.getInvoices().filter((item) => item.customerId === customer.id),
    ...db.getPayments().filter((item) => item.customerId === customer.id),
  ];
  if (linkedRecords.length) {
    return res.status(409).json({ error: `Customer cannot be deleted because ${linkedRecords.length} linked commercial record(s) exist. Set the customer to INACTIVE instead.` });
  }
  db.transaction(() => {
    const index = db.getCustomers().findIndex((item) => item.id === customer.id);
    if (index >= 0) db.getCustomers().splice(index, 1);
    db.logAudit(actorName(req), 'CUSTOMER_DELETED', 'CUSTOMER', customer.id, `Deleted customer ${customer.name}`);
  });
  res.json({ message: 'Customer deleted successfully.' });
});

apiRouter.get('/customers/:id/statement', (req: Request, res: Response) => {
  const customer = db.getCustomers().find((c) => c.id === req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const invoices = db.getInvoices().filter((inv) => inv.customerId === customer.id);
  const payments = db.getPayments().filter((p) => p.customerId === customer.id);
  const quotations = db.getQuotations().filter((q) => q.customerId === customer.id);
  const salesOrders = db.getSalesOrders().filter((s) => s.customerId === customer.id);
  const rentals = db.getRentals().filter((r) => r.customerId === customer.id);

  res.json({
    customer,
    invoices,
    payments,
    quotations,
    salesOrders,
    rentals,
    totalInvoiced: invoices.reduce((acc, inv) => acc + (inv.status !== 'CANCELLED' ? inv.grandTotal : 0), 0),
    totalPaid: payments.reduce((acc, p) => acc + (p.status === 'CONFIRMED' ? p.amount : 0), 0),
    outstandingBalance: customer.outstandingBalance,
  });
});

// ==========================================
// 2. PRODUCTS & SELLABLE ASSET CATALOG
// ==========================================
apiRouter.get('/products', (req: Request, res: Response) => {
  const { category, type, search } = req.query;
  let products = db.getProducts();

  if (category && typeof category === 'string') {
    products = products.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  }
  if (type && typeof type === 'string') {
    products = products.filter((p) => p.productType === type);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    products = products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }

  res.json({ data: products, total: products.length });
});

apiRouter.post('/products', (req: Request, res: Response) => {
  try {
    const { sku, name, description, category, brand, model, productType, unitOfMeasure, salesPrice, purchaseCost, taxRatePercent, stockQuantity, warehouse } = req.body;
    if (!sku || !name) {
      return res.status(400).json({ error: 'SKU and product name are required' });
    }

    const newProd = db.transaction(() => {
      const id = `PROD-${String(db.getProducts().length + 1).padStart(3, '0')}`;
      const product: Product = {
        id,
        sku,
        name,
        description: description || '',
        category: category || 'General Equipment',
        brand: brand || 'Apex Commercial',
        model: model || 'Standard',
        productType: productType || 'SERIALIZED',
        unitOfMeasure: unitOfMeasure || 'Unit',
        salesPrice: Number(salesPrice) || 0,
        purchaseCost: Number(purchaseCost) || 0,
        taxRatePercent: Number(taxRatePercent) || db.getSettings().defaultTaxRatePercent,
        stockQuantity: Number(stockQuantity) || 0,
        reservedQuantity: 0,
        reorderLevel: 2,
        warehouse: warehouse || 'Dallas Central Depot',
        isActive: true,
      };
      db.getProducts().push(product);
      db.logAudit(actorName(req), 'PRODUCT_CREATED', 'PRODUCT', product.id, `Created product SKU ${product.sku}`);
      return product;
    });

    res.status(201).json(newProd);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.patch('/products/:id', (req: Request, res: Response) => {
  const prod = db.getProducts().find((p) => p.id === req.params.id);
  if (!prod) return res.status(404).json({ error: 'Product not found' });

  db.transaction(() => {
    Object.assign(prod, req.body);
    db.logAudit(actorName(req), 'PRODUCT_UPDATED', 'PRODUCT', prod.id, `Updated product SKU ${prod.sku}`);
  });

  res.json(prod);
});

// ==========================================
// 3. ASSET REGISTRY (COMPANY & COMMERCIAL)
// ==========================================
const syncComplianceExpiryNotifications = (): void => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const notifications = db.getNotifications();
  let changed = false;
  const queue: Array<{id:string; label:string; number:string; expiryDate:string; assetId:string; assetTag:string; assetName:string; category:'LEGAL'|'OPERATOR'}> = [];
  for (const asset of db.getAssets()) {
    const docs = asset.legalDocs;
    if (!docs) continue;
    const add = (id: string, label: string, number: string | undefined, expiryDate: string | undefined) => {
      if (expiryDate) queue.push({ id, label, number: number || label, expiryDate, assetId: asset.id, assetTag: asset.assetTag, assetName: asset.name, category: 'LEGAL' });
    };
    add(`stnk-${asset.id}`, 'STNK', docs.stnkNumber, docs.stnkExpiry);
    add(`bpkb-${asset.id}`, 'BPKB', docs.bpkbNumber, (docs as any).bpkbExpiry);
    add(`inspection-${asset.id}`, 'K3 inspection', undefined, docs.nextInspectionDue);
    (docs.siaDocuments || []).forEach((doc) => add(`sia-${asset.id}-${doc.id}`, 'SIA', doc.number, doc.expiryDate));
    if (docs.siaExpiry && !(docs.siaDocuments || []).some((doc) => doc.expiryDate === docs.siaExpiry)) add(`sia-legacy-${asset.id}`, 'SIA', docs.siaNumber, docs.siaExpiry);
  }
  for (const operator of db.getOperators()) {
    if (operator.sioExpiry) queue.push({ id: `sio-${operator.id}`, label: 'SIO', number: operator.sioNumber, expiryDate: operator.sioExpiry, assetId: operator.id, assetTag: operator.badgeNumber, assetName: operator.name, category: 'OPERATOR' });
  }
  for (const doc of queue) {
    const expiry = new Date(`${doc.expiryDate}T00:00:00`);
    if (Number.isNaN(expiry.getTime())) continue;
    const days = Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
    if (days > 30) continue;
    const notificationId = `NTF-COMPLIANCE-EXPIRY-${doc.id}`.replace(/[^a-zA-Z0-9_-]/g, '-');
    const severity = days < 0 || days <= 7 ? 'CRITICAL' : 'WARNING';
    const title = days < 0 ? `${doc.label} expired: ${doc.assetTag}` : `${doc.label} expiry approaching: ${doc.assetTag}`;
    const message = days < 0
      ? `${doc.label} ${doc.number} for ${doc.assetName} expired ${Math.abs(days)} day(s) ago (${doc.expiryDate}). Renew before operation/dispatch.`
      : `${doc.label} ${doc.number} for ${doc.assetName} expires in ${days} day(s) on ${doc.expiryDate}. Start renewal now.`;
    const existing = notifications.find((item) => item.id === notificationId);
    if (existing) {
      if (existing.message !== message || existing.severity !== severity || existing.title !== title) {
        existing.title = title; existing.message = message; existing.severity = severity; existing.timestamp = new Date().toISOString();
        if (severity === 'CRITICAL') existing.isRead = false;
        changed = true;
      }
    } else {
      db.addNotification({ id: notificationId, timestamp: new Date().toISOString(), sourceDepartment: 'Compliance Monitor', sourceUserName: 'EAMS Compliance Monitor', title, message, category: 'LEGAL', severity, targetRoles: doc.category === 'OPERATOR' ? ['MANAGEMENT_OPERATION', 'MANAGER', 'EXECUTIVE'] : ['ASSET_CONTROL', 'MANAGER', 'EXECUTIVE'], relatedEntity: doc.category === 'OPERATOR' ? 'OPERATOR' : 'ASSET', relatedEntityId: doc.assetId, targetTab: doc.category === 'OPERATOR' ? 'maintenance' : 'assets', isRead: false });
      changed = true;
    }
  }
  if (changed) db.save();
};

apiRouter.get('/assets', (req: Request, res: Response) => {
  syncComplianceExpiryNotifications();
  const { status, category, search } = req.query;
  let assets = db.getAssets();

  if (status && typeof status === 'string') {
    assets = assets.filter((a) => a.status === status);
  }
  if (category && typeof category === 'string') {
    assets = assets.filter((a) => a.category.toLowerCase() === category.toLowerCase());
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    assets = assets.filter((a) => a.name.toLowerCase().includes(q) || a.assetTag.toLowerCase().includes(q) || a.serialNumber.toLowerCase().includes(q));
  }

  const data = assets.map((asset) => ({
    ...asset,
    currentBookValue: calculateAssetBookValue(asset),
  }));
  res.json({ data, total: data.length });
});

apiRouter.post('/assets', (req: Request, res: Response) => {
  try {
    const {
      assetTag,
      serialNumber,
      name,
      category,
      brand,
      model,
      purchaseCost,
      dailyRentalRate,
      weeklyRentalRate,
      monthlyRentalRate,
      sellPrice,
      depreciationRateAnnual,
      rentalMode,
      warehouseLocation,
      specs,
      legalDocs,
    } = req.body;
    if (!assetTag || !serialNumber || !name) {
      return res.status(400).json({ error: 'Asset tag, serial number, and name are required' });
    }
    const annualDepreciationRate = Number(depreciationRateAnnual ?? 10);
    if (!Number.isFinite(annualDepreciationRate) || annualDepreciationRate < 0 || annualDepreciationRate > 100) {
      return res.status(400).json({ error: 'Annual depreciation rate must be between 0 and 100 percent.' });
    }

    // Ensure serial number uniqueness
    const exists = db.getAssets().find((a) => a.assetTag.toLowerCase() === assetTag.toLowerCase() || a.serialNumber.toLowerCase() === serialNumber.toLowerCase());
    if (exists) {
      return res.status(400).json({ error: 'Asset with this tag or serial number already exists' });
    }

    const newAsset = db.transaction(() => {
      const asset: Asset = {
        id: assetTag,
        assetTag,
        serialNumber,
        name,
        category: category || 'Heavy Equipment',
        brand: brand || 'Apex Industrial',
        model: model || 'Standard',
        status: 'AVAILABLE',
        condition: 'EXCELLENT',
        rentalMode: rentalMode === 'WET' ? 'WET' : 'DRY',
        warehouseLocation: warehouseLocation || 'Jakarta Central Depot',
        purchaseCost: Number(purchaseCost) || 0,
        currentBookValue: Number(purchaseCost) || 0,
        depreciationRateAnnual: annualDepreciationRate,
        purchaseDate: new Date().toISOString().split('T')[0],
        warrantyExpiry: new Date(Date.now() + 3 * 365 * 86400000).toISOString().split('T')[0],
        dailyRentalRate: Number(dailyRentalRate) || 250,
        weeklyRentalRate: Number(weeklyRentalRate) || 1200,
        monthlyRentalRate: Number(monthlyRentalRate) || 4000,
        sellPrice: Number(sellPrice) || (Number(purchaseCost) ? Number(purchaseCost) * 1.3 : 0),
        specs: specs || {},
        legalDocs: legalDocs || {
          stnkNumber: 'STNK-PENDING',
          bpkbNumber: 'BPKB-PENDING',
          siaNumber: 'SIA-PENDING',
          documentStatus: 'VALID',
        },
      };
      db.getAssets().push(asset);
      db.logAudit(actorName(req), 'ASSET_CREATED', 'ASSET', asset.id, `Created asset ${asset.assetTag} (${asset.name}) with centralized legal docs`);
      return asset;
    });

    res.status(201).json(newAsset);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/assets/:id/label', (req: Request, res: Response) => {
  const asset = db.getAssets().find((item) => item.id === req.params.id);
  if (!asset) return res.status(404).json({ error: 'Asset not found.' });
  if (asset.status !== 'PENDING_LABEL') {
    return res.status(409).json({ error: 'Only assets awaiting a label can be registered here.' });
  }

  const assetTag = typeof req.body?.assetTag === 'string' ? req.body.assetTag.trim() : '';
  const serialNumber = typeof req.body?.serialNumber === 'string' ? req.body.serialNumber.trim() : '';
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  if (!assetTag || !serialNumber || !name) {
    return res.status(400).json({ error: 'Asset tag, serial number, and equipment name are required.' });
  }
  const duplicate = db.getAssets().find((item) => item.id !== asset.id && (
    item.assetTag.toLowerCase() === assetTag.toLowerCase() ||
    item.serialNumber.toLowerCase() === serialNumber.toLowerCase()
  ));
  if (duplicate) return res.status(409).json({ error: 'Asset tag or serial number is already in use.' });

  const rate = Number(req.body?.depreciationRateAnnual ?? asset.depreciationRateAnnual);
  if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
    return res.status(400).json({ error: 'Annual depreciation rate must be between 0 and 100 percent.' });
  }
  const rentalMode = req.body?.rentalMode;
  if (rentalMode !== 'WET' && rentalMode !== 'DRY') {
    return res.status(400).json({ error: 'Rental mode must be WET or DRY.' });
  }

  db.transaction(() => {
    asset.assetTag = assetTag;
    asset.serialNumber = serialNumber;
    asset.name = name;
    asset.category = typeof req.body.category === 'string' ? req.body.category.trim() || asset.category : asset.category;
    asset.brand = typeof req.body.brand === 'string' ? req.body.brand.trim() || asset.brand : asset.brand;
    asset.model = typeof req.body.model === 'string' ? req.body.model.trim() || asset.model : asset.model;
    asset.warehouseLocation = typeof req.body.warehouseLocation === 'string'
      ? req.body.warehouseLocation.trim() || asset.warehouseLocation
      : asset.warehouseLocation;
    asset.depreciationRateAnnual = rate;
    asset.rentalMode = rentalMode;
    asset.status = 'AVAILABLE';
    asset.currentBookValue = calculateAssetBookValue(asset);
    db.logAudit(actorName(req), 'ASSET_LABELED', 'ASSET', asset.id, `Registered tag ${asset.assetTag} for asset purchased through PO ${asset.purchaseOrderId || '-'}`);
  });

  res.json(asset);
});

apiRouter.patch('/assets/:id', (req: Request, res: Response) => {
  const asset = db.getAssets().find((a) => a.id === req.params.id);
  if (!asset) return res.status(404).json({ error: 'Asset not found' });

  if ('depreciationRateAnnual' in req.body) {
    const rate = Number(req.body.depreciationRateAnnual);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      return res.status(400).json({ error: 'Annual depreciation rate must be between 0 and 100 percent.' });
    }
  }
  if ('rentalMode' in req.body && req.body.rentalMode !== 'WET' && req.body.rentalMode !== 'DRY') {
    return res.status(400).json({ error: 'Rental mode must be WET or DRY.' });
  }

  db.transaction(() => {
    Object.assign(asset, req.body);
    asset.currentBookValue = calculateAssetBookValue(asset);
    db.logAudit(actorName(req), 'ASSET_UPDATED', 'ASSET', asset.id, `Updated asset ${asset.assetTag}`);
  });

  res.json(asset);
});

apiRouter.post('/assets/:id/disposition', (req: Request, res: Response) => {
  const asset = db.getAssets().find((item) => item.id === req.params.id);
  if (!asset) return res.status(404).json({ error: 'Asset not found.' });
  if (asset.status !== 'AVAILABLE') {
    return res.status(409).json({ error: 'Only available, labeled assets can be sold or disposed.' });
  }

  const type = req.body?.type;
  if (type !== 'SALE' && type !== 'DISPOSAL') {
    return res.status(400).json({ error: 'Disposition type must be SALE or DISPOSAL.' });
  }

  const customer = type === 'SALE'
    ? db.getCustomers().find((item) => item.id === req.body?.customerId)
    : undefined;
  if (type === 'SALE' && !customer) return res.status(404).json({ error: 'A valid customer is required for an asset sale.' });

  const proceeds = type === 'SALE' ? Number(req.body?.salePrice) : 0;
  if (type === 'SALE' && (!Number.isFinite(proceeds) || proceeds <= 0)) {
    return res.status(400).json({ error: 'Sale price must be greater than zero.' });
  }
  const taxRate = Number(req.body?.taxRatePercent ?? db.getSettings().defaultTaxRatePercent ?? 0);
  if (type === 'SALE' && (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100)) {
    return res.status(400).json({ error: 'Tax rate must be between 0 and 100 percent.' });
  }

  const bookValue = calculateAssetBookValue(asset);
  let invoice: Invoice | undefined;
  const disposition = db.transaction(() => {
    if (type === 'SALE' && customer) {
      const totals = calculateLineTotals(1, proceeds, 0, taxRate);
      const invoiceNumber = `${db.getSettings().invoicePrefix}${String(db.getInvoices().length + 1).padStart(3, '0')}`;
      const issueDate = new Date().toISOString().split('T')[0];
      invoice = {
        id: invoiceNumber,
        invoiceNumber,
        type: 'SALES',
        relatedSourceId: asset.id,
        relatedSourceType: 'ASSET_DISPOSITION',
        customerId: customer.id,
        customerName: customer.name,
        customerTaxId: customer.taxId,
        issueDate,
        dueDate: new Date(Date.now() + (customer.paymentTermsDays || 30) * 86400000).toISOString().split('T')[0],
        paymentTermsDays: customer.paymentTermsDays || 30,
        currency: 'IDR',
        status: 'DRAFT',
        items: [{
          id: `INI-${Date.now()}`,
          description: `Asset sale: ${asset.assetTag} - ${asset.name}`,
          quantity: 1,
          unitPrice: proceeds,
          discountPercent: 0,
          taxRatePercent: taxRate,
          subtotal: totals.subtotal,
          taxAmount: totals.taxAmount,
          total: totals.total,
          assetTag: asset.assetTag,
        }],
        subtotal: totals.subtotal,
        discountTotal: 0,
        taxTotal: totals.taxAmount,
        additionalCharges: 0,
        grandTotal: totals.total,
        paidAmount: 0,
        outstandingBalance: totals.total,
        notes: req.body?.notes || `Asset disposal transaction for PO ${asset.purchaseOrderId || 'manual asset'}.`,
        terms: `Payment terms Net ${customer.paymentTermsDays || 30} days.`,
      };
      db.getInvoices().unshift(invoice);
    }

    asset.disposition = {
      type,
      date: new Date().toISOString().split('T')[0],
      proceeds,
      bookValueAtDisposition: bookValue,
      gainLoss: type === 'SALE' ? fromCents(toCents(proceeds) - toCents(bookValue)) : -bookValue,
      customerId: customer?.id,
      customerName: customer?.name,
      invoiceId: invoice?.id,
      notes: typeof req.body?.notes === 'string' ? req.body.notes.trim() : undefined,
    };
    asset.status = type === 'SALE' ? 'SOLD' : 'DISPOSED';
    asset.currentBookValue = bookValue;
    db.logAudit(
      actorName(req),
      type === 'SALE' ? 'ASSET_SOLD' : 'ASSET_DISPOSED',
      'ASSET',
      asset.id,
      `${type} recorded for ${asset.assetTag}; proceeds ${formatRupiahAmount(proceeds)}, book value ${formatRupiahAmount(bookValue)}${invoice ? `, draft invoice ${invoice.invoiceNumber}` : ''}.`,
    );
    return asset.disposition;
  });

  res.status(201).json({ asset, disposition, invoice });
});

// Barcode Quick Lookup
apiRouter.get('/assets/barcode/:barcode', (req: Request, res: Response) => {
  const code = req.params.barcode.trim().toLowerCase();
  const asset = db.getAssets().find((a) =>
    a.assetTag.toLowerCase() === code ||
    a.serialNumber.toLowerCase() === code ||
    (a.legalDocs?.plateNumber && a.legalDocs.plateNumber.toLowerCase() === code) ||
    (a.legalDocs?.chassisNumber && a.legalDocs.chassisNumber.toLowerCase() === code)
  );

  if (!asset) {
    return res.status(404).json({ error: `Equipment with barcode/tag ${req.params.barcode} was not found.` });
  }

  const activeWorkOrders = db.getWorkOrders().filter((w) => (w.assetId === asset.id || w.assetTag === asset.assetTag) && w.status !== 'COMPLETED');
  const recentLogs = db.getStatusLogs().filter((l) => l.assetId === asset.id || l.assetTag === asset.assetTag).slice(0, 5);

  res.json({
    asset,
    activeWorkOrders,
    recentStatusLogs: recentLogs,
  });
});

// Upload / Update Centralized Legal Documents (STNK, BPKB, SIA)
apiRouter.post('/assets/:id/documents', (req: Request, res: Response) => {
  const asset = db.getAssets().find((a) => a.id === req.params.id);
  if (!asset) return res.status(404).json({ error: 'Asset not found.' });

  db.transaction(() => {
    asset.legalDocs = {
      ...(asset.legalDocs || {}),
      ...req.body,
    };
    const operatorName = actorName(req);
    db.logAudit(operatorName, 'ASSET_DOCUMENTS_UPDATED', 'ASSET', asset.id, `Updated legal documents (STNK, BPKB, SIA) for asset ${asset.assetTag}`);
  });

  res.json(asset);
});

// Daily Status Logs (Field Operators)
apiRouter.get('/assets/status-logs', (req: Request, res: Response) => {
  const logs = db.getStatusLogs();
  res.json({ data: logs, total: logs.length });
});

apiRouter.post('/assets/status-logs', (req: Request, res: Response) => {
  const { assetTag, status, hourMeter, location, damageCategory, damageSeverity, damageDescription, photoEvidenceUrl, operatorName } = req.body;
  if (!assetTag || !status) {
    return res.status(400).json({ error: 'Asset tag and equipment status are required.' });
  }

  const asset = db.getAssets().find((a) => a.assetTag.toLowerCase() === assetTag.trim().toLowerCase());
  if (!asset) {
    return res.status(404).json({ error: `Equipment ${assetTag} is not registered in the system.` });
  }

  const result = db.transaction(() => {
    const submitter = actorName(req);
    const logId = `LOG-STAT-${Date.now().toString().slice(-5)}`;
    let createdWoId: string | undefined = undefined;

    // If marked as DAMAGED / RUSAK, auto create Work Order for maintenance
    if (status === 'DAMAGED') {
      const woNum = `WO-2026-${String(db.getWorkOrders().length + 1).padStart(3, '0')}`;
      createdWoId = woNum;

      const priorityMap: Record<string, 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> = {
        MINOR: 'LOW',
        MEDIUM: 'MEDIUM',
        MAJOR: 'HIGH',
        CRITICAL_SHUTDOWN: 'CRITICAL',
      };
      const resolvedPriority = priorityMap[damageSeverity || 'MEDIUM'] || 'HIGH';

      const autoWo: WorkOrder = {
        id: woNum,
        workOrderNumber: woNum,
        assetId: asset.id,
        assetTag: asset.assetTag,
        assetName: asset.name,
        title: `Field Damage Report: ${asset.name} (${damageCategory || 'General Issue'})`,
        description: `Reported by operator ${submitter} at ${location || 'Project Site'}: ${damageDescription || 'Damage detected during daily inspection'}. HM: ${hourMeter || 'N/A'}.`,
        priority: resolvedPriority,
        type: 'CORRECTIVE',
        assignedTechnician: 'Field Mechanic on Duty',
        scheduledDate: new Date().toISOString().split('T')[0],
        partsCost: 0,
        laborCost: 350,
        totalCost: 350,
        downtimeHours: damageSeverity === 'CRITICAL_SHUTDOWN' ? 48 : 12,
        status: 'PENDING_APPROVAL',
      };

      db.getWorkOrders().unshift(autoWo);
      asset.status = 'IN_MAINTENANCE';
      asset.condition = damageSeverity === 'CRITICAL_SHUTDOWN' ? 'DAMAGED' : 'NEEDS_REPAIR';
    } else if (status === 'WORKING') {
      // If currently IN_MAINTENANCE and reported WORKING by operator or technician
      if (asset.condition === 'DAMAGED' || asset.condition === 'NEEDS_REPAIR') {
        asset.condition = 'GOOD';
      }
    }

    if (hourMeter && asset.legalDocs) {
      asset.legalDocs.hourMeter = Number(hourMeter);
    }

    const log: AssetDailyStatusLog = {
      id: logId,
      assetId: asset.id,
      assetTag: asset.assetTag,
      assetName: asset.name,
      submittedAt: new Date().toISOString(),
      submittedBy: submitter,
      status,
      hourMeter: Number(hourMeter) || 0,
      location: location || asset.warehouseLocation,
      damageCategory: damageCategory || 'NONE',
      damageSeverity,
      damageDescription,
      photoEvidenceUrl,
      workOrderIdCreated: createdWoId,
    };

    db.getStatusLogs().unshift(log);
    db.logAudit(
      submitter,
      'ASSET_DAILY_STATUS_SUBMITTED',
      'ASSET',
      asset.id,
      `Operator ${submitter} submitted daily status for ${asset.assetTag}: ${status}${createdWoId ? ` (Auto Work Order: ${createdWoId})` : ''}`
    );

    return { log, asset, workOrderCreated: createdWoId };
  });

  res.status(201).json(result);
});

apiRouter.get('/assets/:id/history', (req: Request, res: Response) => {
  const asset = db.getAssets().find((a) => a.id === req.params.id);
  if (!asset) return res.status(404).json({ error: 'Asset not found' });

  const rentals = db.getRentals().filter((r) => r.items.some((i) => i.assetId === asset.id || i.assetTag === asset.assetTag));
  const workOrders = db.getWorkOrders().filter((w) => w.assetId === asset.id || w.assetTag === asset.assetTag);
  const auditLogs = db.getAuditLogs().filter((l) => l.entityId === asset.id || l.details.includes(asset.assetTag));
  const statusLogs = db.getStatusLogs().filter((l) => l.assetId === asset.id || l.assetTag === asset.assetTag);

  res.json({
    asset,
    rentals,
    workOrders,
    auditLogs,
    statusLogs,
  });
});

// ==========================================
// 4. SALES QUOTATIONS
// ==========================================
apiRouter.get('/quotations', (req: Request, res: Response) => {
  const quotations = db.getQuotations();
  res.json({ data: quotations, total: quotations.length });
});

apiRouter.post('/quotations', (req: Request, res: Response) => {
  try {
    const { customerId, items, validUntil, termsAndConditions, notes, remarks, salespersonName } = req.body;
    const transactionType = req.body.transactionType === 'SALE' ? 'SALE' : 'RENTAL';
    const customer = db.getCustomers().find((c) => c.id === customerId);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    if (!items || !items.length) return res.status(400).json({ error: 'Quotation must have at least one line item' });

    const newQuotation = db.transaction(() => {
      let subtotalCents = 0;
      let taxTotalCents = 0;
      let discountTotalCents = 0;
      let mobTotalCents = 0;
      let demobTotalCents = 0;
      const reservedAssetIds = new Set<string>();

      const quotationItems: QuotationItem[] = items.map((rawItem: any, index: number) => {
        const prod = db.getProducts().find((p) => p.id === rawItem.productId);
        const qty = Number(rawItem.quantity) || 1;
        const unitPrice = Number(rawItem.rentalRate || rawItem.unitPrice) || (prod ? prod.salesPrice : 0);
        const discountPercent = Number(rawItem.discountPercent) || 0;
        const taxRate = Number(rawItem.taxRatePercent ?? (prod ? prod.taxRatePercent : 8.25));

        const calc = calculateLineTotals(qty, unitPrice, discountPercent, taxRate);
        subtotalCents += toCents(calc.subtotal);
        taxTotalCents += toCents(calc.taxAmount);
        discountTotalCents += toCents(calc.discountAmount);

        const mobFee = Number(rawItem.mobilizationFee) || 0;
        const demobFee = Number(rawItem.demobilizationFee) || 0;
        mobTotalCents += toCents(mobFee);
        demobTotalCents += toCents(demobFee);

        const asset = rawItem.assignedAssetId ? db.getAssets().find(a => a.id === rawItem.assignedAssetId) : undefined;
        if (rawItem.assignedAssetId && !asset) throw new Error('Selected asset was not found.');
        if (asset) {
          if (asset.status !== 'AVAILABLE') throw new Error(`Asset ${asset.assetTag} is not available for quotation.`);
          if (reservedAssetIds.has(asset.id)) throw new Error(`Asset ${asset.assetTag} is selected more than once.`);
          reservedAssetIds.add(asset.id);
        }
        if (transactionType === 'SALE' && (!asset || qty !== 1)) {
          throw new Error('Sale quotations require one available serialized asset per line.');
        }

        return {
          id: `QTI-${Date.now()}-${index}`,
          productId: rawItem.productId,
          productName: prod ? prod.name : rawItem.productName || 'Equipment Item',
          sku: prod ? prod.sku : rawItem.sku || 'SKU-CUSTOM',
          productType: prod ? prod.productType : 'SERIALIZED',
          quantity: qty,
          unitPrice,
          discountPercent,
          taxRatePercent: taxRate,
          subtotal: calc.subtotal,
          taxAmount: calc.taxAmount,
          total: calc.total,
          assignedAssetId: rawItem.assignedAssetId,
          equipmentNumber: rawItem.equipmentNumber || (asset ? asset.assetTag : undefined),
          equipmentType: rawItem.equipmentType || (asset ? `${asset.brand} ${asset.model}` : (prod ? prod.category : 'Heavy Equipment')),
          rateModel: rawItem.rateModel || 'REGULAR',
          rentalRate: unitPrice,
          mobilizationFee: mobFee,
          demobilizationFee: demobFee,
          mobilizationDate: rawItem.mobilizationDate,
          demobilizationDate: rawItem.demobilizationDate,
        };
      });

      const grandTotalCents = subtotalCents + taxTotalCents + mobTotalCents + demobTotalCents;
      const qNum = `${db.getSettings().quotationPrefix}${String(db.getQuotations().length + 1).padStart(3, '0')}`;

      const quotation: Quotation = {
        id: qNum,
        quotationNumber: qNum,
        revision: 1,
        customerId: customer.id,
        customerName: customer.name,
        date: new Date().toISOString().split('T')[0],
        validUntil: validUntil || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        salespersonName: salespersonName || 'Commercial Sales Rep',
        transactionType,
        status: 'PENDING_APPROVAL',
        items: quotationItems,
        subtotal: fromCents(subtotalCents),
        discountTotal: fromCents(discountTotalCents),
        taxTotal: fromCents(taxTotalCents),
        mobilizationTotal: fromCents(mobTotalCents),
        demobilizationTotal: fromCents(demobTotalCents),
        grandTotal: fromCents(grandTotalCents),
        notes: notes || '',
        remarks: typeof remarks === 'string' ? remarks : (notes || ''),
        termsAndConditions: termsAndConditions || 'Standard commercial terms Net 30 days. Valid for 30 calendar days.',
      };

      db.getQuotations().unshift(quotation);
      db.logAudit(actorName(req), 'QUOTATION_CREATED', 'QUOTATION', quotation.id, `Created quotation ${quotation.quotationNumber} for ${customer.name}`);

      db.addNotification({
        id: `NTF-QUO-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        sourceDepartment: 'Sales & Marketing',
        sourceUserName: actorName(req),
        title: `Quotation Created: ${quotation.quotationNumber}`,
        message: `Official quotation ${quotation.quotationNumber} for ${customer.name}, valued at ${formatRupiahAmount(quotation.grandTotal)}, was created and is awaiting approval (Status: ${quotation.status}).`,
        category: 'COMMERCIAL',
        severity: 'INFO',
        targetRoles: ['SALES_MARKETING', 'EXECUTIVE', 'ADMIN_IT'],
        relatedEntity: 'QUOTATION',
        relatedEntityId: quotation.quotationNumber,
        targetTab: 'quotations',
        isRead: false,
      });

      return quotation;
    });

    res.status(201).json(newQuotation);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/quotations/:id/approve', (req: Request, res: Response) => {
  const quote = db.getQuotations().find((q) => q.id === req.params.id);
  if (!quote) return res.status(404).json({ error: 'Quotation not found' });

  db.transaction(() => {
    quote.status = 'APPROVED';
    quote.approvedBy = actorName(req);
    quote.approvalDate = new Date().toISOString();
    db.logAudit(quote.approvedBy, 'QUOTATION_APPROVED', 'QUOTATION', quote.id, `Approved quotation ${quote.quotationNumber}`);

    db.addNotification({
      id: `NTF-QUO-APP-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      sourceDepartment: 'Executive Leadership & Sales Leads',
      sourceUserName: quote.approvedBy,
      title: `Quotation Approved: ${quote.quotationNumber}`,
      message: `Official quotation ${quote.quotationNumber} for ${quote.customerName} was approved by ${quote.approvedBy}. Awaiting customer acceptance / order conversion.`,
      category: 'COMMERCIAL',
      severity: 'SUCCESS',
      targetRoles: ['SALES_MARKETING', 'MANAGEMENT_OPERATION', 'ASSET_CONTROL', 'EXECUTIVE'],
      relatedEntity: 'QUOTATION',
      relatedEntityId: quote.quotationNumber,
      targetTab: 'quotations',
      isRead: false,
    });
  });

  res.json(quote);
});

apiRouter.post('/quotations/:id/accept', (req: Request, res: Response) => {
  const quote = db.getQuotations().find((q) => q.id === req.params.id);
  if (!quote) return res.status(404).json({ error: 'Quotation not found' });

  db.transaction(() => {
    quote.status = 'ACCEPTED';
    db.logAudit(actorName(req), 'QUOTATION_ACCEPTED', 'QUOTATION', quote.id, `Customer accepted quotation ${quote.quotationNumber}`);
  });

  res.json(quote);
});

apiRouter.post('/quotations/:id/convert-to-order', (req: Request, res: Response) => {
  const quote = db.getQuotations().find((q) => q.id === req.params.id);
  if (!quote) return res.status(404).json({ error: 'Quotation not found' });
  if (quote.status !== 'APPROVED' && quote.status !== 'ACCEPTED') {
    return res.status(409).json({ error: 'Quotation must be approved and accepted before conversion to a Sales Order.' });
  }

  try {
    const order = db.transaction(() => {
      // Validate customer
      const customer = db.getCustomers().find((c) => c.id === quote.customerId);
      if (!customer) throw new Error('Customer does not exist');

      // Check credit limit
      if (customer.outstandingBalance + quote.grandTotal > customer.creditLimit * 1.2) {
        throw new Error(`Customer credit limit of ${formatRupiahAmount(customer.creditLimit)} exceeded. Please obtain credit override.`);
      }

      // Check serialized assets availability
      quote.items.forEach((item) => {
        if (item.assignedAssetId) {
          const asset = db.getAssets().find((a) => a.id === item.assignedAssetId);
          if (asset && asset.status !== 'AVAILABLE') {
            throw new Error(`Asset ${asset.assetTag} (${asset.name}) is currently ${asset.status} and cannot be allocated.`);
          }
          if (asset) {
            asset.status = 'RESERVED';
            asset.currentCustomerId = customer.id;
            asset.currentCustomerName = customer.name;
          }
        }
      });

      const orderNumber = `${db.getSettings().salesOrderPrefix}${String(db.getSalesOrders().length + 1).padStart(3, '0')}`;
      const salesOrder: SalesOrder = {
        id: orderNumber,
        orderNumber,
        quotationId: quote.id,
        quotationReference: quote.quotationNumber, // Direct integration: Quotation number linked to Sales Order
        transactionType: quote.transactionType || 'RENTAL',
        customerId: customer.id,
        customerName: customer.name,
        customerPoReference: req.body.customerPoReference || `PO-${customer.customerCode}-${Date.now().toString().slice(-4)}`,
        orderDate: new Date().toISOString().split('T')[0],
        targetDeliveryDate: req.body.targetDeliveryDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        deliveryAddress: customer.deliveryAddress,
        status: 'PENDING',
        items: quote.items.map((i) => ({
          ...i,
          allocatedAssetTag: i.equipmentNumber || i.assignedAssetId,
          isDelivered: false,
        })),
        subtotal: quote.subtotal,
        discountTotal: quote.discountTotal,
        taxTotal: quote.taxTotal,
        shippingFee: Number(req.body.shippingFee) || 0,
        mobilizationTotal: quote.mobilizationTotal || 0,
        demobilizationTotal: quote.demobilizationTotal || 0,
        grandTotal: quote.grandTotal + (Number(req.body.shippingFee) || 0),
        invoicedAmount: 0,
        paidAmount: 0,
        remarks: quote.remarks || quote.notes || '',
      };

      quote.status = 'CONVERTED';
      quote.convertedSalesOrderId = salesOrder.id;
      quote.linkedSalesOrderNumber = salesOrder.orderNumber;

      db.getSalesOrders().unshift(salesOrder);
      db.logAudit(actorName(req), 'SALES_ORDER_CONVERTED', 'SALES_ORDER', salesOrder.id, `Converted Quote ${quote.quotationNumber} to Sales Order ${salesOrder.orderNumber}`);

      db.addNotification({
        id: `NTF-SO-CONV-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        sourceDepartment: 'Divisi Sales & Marketing',
        sourceUserName: actorName(req),
        title: `Quotation Dikonversi: ${salesOrder.orderNumber}`,
        message: `Quotation ${quote.quotationNumber} for ${customer.name} was approved and converted to Sales Order ${salesOrder.orderNumber}, valued at ${formatRupiahAmount(salesOrder.grandTotal)}. Warehouse and Asset Control teams are preparing equipment mobilization.`,
        category: 'COMMERCIAL',
        severity: 'SUCCESS',
        targetRoles: ['SALES_MARKETING', 'MANAGEMENT_OPERATION', 'ASSET_CONTROL', 'FINANCE_ACCOUNTING_TAX', 'EXECUTIVE'],
        relatedEntity: 'SALES_ORDER',
        relatedEntityId: salesOrder.orderNumber,
        targetTab: 'sales',
        isRead: false,
      });

      return salesOrder;
    });

    res.status(201).json(order);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 5. SALES ORDERS & ASSET ALLOCATION
// ==========================================
apiRouter.post('/sales-orders/:id/contract-attachment', (req: Request, res: Response) => {
  const order = db.getSalesOrders().find((item) => item.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Sales Order not found.' });
  const { contractReferenceNumber, fileName, dataUrl } = req.body || {};
  if (!String(contractReferenceNumber || '').trim()) return res.status(400).json({ error: 'Contract reference number is required.' });
  if (!String(fileName || '').toLowerCase().endsWith('.pdf') || !String(dataUrl || '').startsWith('data:application/pdf;base64,')) {
    return res.status(400).json({ error: 'Contract attachment must be a PDF file.' });
  }
  if (String(dataUrl).length > 14_000_000) return res.status(413).json({ error: 'PDF attachment exceeds the 10 MB limit.' });
  db.transaction(() => {
    order.contractReferenceNumber = String(contractReferenceNumber).trim();
    order.contractAttachmentName = String(fileName).slice(0, 255);
    order.contractAttachmentDataUrl = String(dataUrl);
    order.contractAttachmentUploadedAt = new Date().toISOString();
    db.logAudit(actorName(req), 'SO_CONTRACT_PDF_ATTACHED', 'SALES_ORDER', order.id, `Contract ${order.contractReferenceNumber} PDF attached to ${order.orderNumber}.`);
  });
  res.json({ message: 'Contract PDF attached successfully.', data: order });
});

apiRouter.get('/sales-orders', (_req: Request, res: Response) => {
  const orders = db.getSalesOrders();
  // Backward-compatible normalization for records saved before ALLOCATED was removed.
  let migrated = false;
  for (const order of orders) {
    if ((order.status as string) === 'ALLOCATED') { order.status = 'CONFIRMED'; migrated = true; }
  }
  if (migrated) db.save();
  res.json({ data: orders, total: orders.length });
});

apiRouter.post('/sales-orders', (req: Request, res: Response) => {
  try {
    const { customerId, items, customerPoReference, targetDeliveryDate, shippingFee, remarks } = req.body;
    const customer = db.getCustomers().find((c) => c.id === customerId);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    if (!items || !items.length) return res.status(400).json({ error: 'Order must contain items' });

    const newOrder = db.transaction(() => {
      let subtotalCents = 0;
      let taxTotalCents = 0;
      let discountTotalCents = 0;

      const orderItems = items.map((rawItem: any, index: number) => {
        const prod = db.getProducts().find((p) => p.id === rawItem.productId);
        const qty = Number(rawItem.quantity) || 1;
        const unitPrice = Number(rawItem.unitPrice) || (prod ? prod.salesPrice : 0);
        const discount = Number(rawItem.discountPercent) || 0;
        const taxRate = Number(rawItem.taxRatePercent ?? (prod ? prod.taxRatePercent : 8.25));

        const calc = calculateLineTotals(qty, unitPrice, discount, taxRate);
        subtotalCents += toCents(calc.subtotal);
        taxTotalCents += toCents(calc.taxAmount);
        discountTotalCents += toCents(calc.discountAmount);

        // If serialized asset passed, reserve it
        let allocatedTag = rawItem.allocatedAssetTag;
        let allocatedSerial = rawItem.allocatedSerialNumber;
        if (allocatedTag) {
          const asset = db.getAssets().find((a) => a.assetTag === allocatedTag || a.id === allocatedTag);
          if (asset) {
            if (asset.status !== 'AVAILABLE') {
              throw new Error(`Asset ${asset.assetTag} cannot be allocated (current status: ${asset.status})`);
            }
            asset.status = 'RESERVED';
            asset.currentCustomerId = customer.id;
            asset.currentCustomerName = customer.name;
            allocatedTag = asset.assetTag;
            allocatedSerial = asset.serialNumber;
          }
        }

        return {
          id: `SOI-${Date.now()}-${index}`,
          productId: rawItem.productId,
          productName: prod ? prod.name : rawItem.productName || 'Order Item',
          sku: prod ? prod.sku : rawItem.sku || 'SKU-CUSTOM',
          productType: prod ? prod.productType : 'SERIALIZED',
          quantity: qty,
          unitPrice,
          discountPercent: discount,
          taxRatePercent: taxRate,
          subtotal: calc.subtotal,
          taxAmount: calc.taxAmount,
          total: calc.total,
          allocatedAssetTag: allocatedTag,
          allocatedSerialNumber: allocatedSerial,
          isDelivered: false,
        };
      });

      const shipFee = Number(shippingFee) || 0;
      const grandTotalCents = subtotalCents + taxTotalCents + toCents(shipFee);
      const orderNumber = `${db.getSettings().salesOrderPrefix}${String(db.getSalesOrders().length + 1).padStart(3, '0')}`;

      const order: SalesOrder = {
        id: orderNumber,
        orderNumber,
        customerId: customer.id,
        customerName: customer.name,
        customerPoReference: customerPoReference || `PO-${Date.now().toString().slice(-5)}`,
        transactionType: 'SALE',
        orderDate: new Date().toISOString().split('T')[0],
        targetDeliveryDate: targetDeliveryDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        deliveryAddress: customer.deliveryAddress,
        status: 'PENDING',
        items: orderItems,
        subtotal: fromCents(subtotalCents),
        discountTotal: fromCents(discountTotalCents),
        taxTotal: fromCents(taxTotalCents),
        shippingFee: shipFee,
        grandTotal: fromCents(grandTotalCents),
        invoicedAmount: 0,
        paidAmount: 0,
        remarks: typeof remarks === 'string' ? remarks : '',
      };

      db.getSalesOrders().unshift(order);
      db.logAudit(actorName(req), 'SALES_ORDER_CREATED', 'SALES_ORDER', order.id, `Created Direct Sales Order ${order.orderNumber}`);
      return order;
    });

    res.status(201).json(newOrder);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/sales-orders/:id/cancel', (req: Request, res: Response) => {
  const { reason } = req.body;
  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: 'Cancellation reason is mandatory per corporate policy' });
  }

  const order = db.getSalesOrders().find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Sales Order not found' });
  if (order.status === 'COMPLETED' || order.status === 'DELIVERED') {
    return res.status(400).json({ error: 'Cannot cancel an already completed or delivered order' });
  }
  if (order.rentalContractId) {
    return res.status(409).json({ error: 'Cancel or settle the linked rental contract before cancelling this Sales Order.' });
  }
  const linkedInvoices = db.getInvoices().filter((invoice) => invoice.relatedSourceType === 'SALES_ORDER' && invoice.relatedSourceId === order.id);
  if (linkedInvoices.some((invoice) => invoice.paidAmount > 0 || ['ISSUED', 'PARTIALLY_PAID', 'PAID'].includes(invoice.status))) {
    return res.status(409).json({ error: 'A Sales Order with an issued or paid invoice cannot be cancelled. Resolve the invoice first.' });
  }

  try {
    db.transaction(() => {
      // Release any reserved serialized assets back to AVAILABLE
      order.items.forEach((item) => {
        if (item.allocatedAssetTag) {
          const asset = db.getAssets().find((a) => a.assetTag === item.allocatedAssetTag || a.id === item.allocatedAssetTag);
          if (asset && asset.status === 'RESERVED') {
            asset.status = 'AVAILABLE';
            asset.currentCustomerId = null;
            asset.currentCustomerName = null;
          }
        }
      });

      order.status = 'CANCELLED';
      order.cancellationReason = reason;
      if (order.quotationId) {
        const quotation = db.getQuotations().find((item) => item.id === order.quotationId);
        if (quotation) quotation.status = 'CANCELLED';
      }
      linkedInvoices.forEach((invoice) => { invoice.status = 'CANCELLED'; });
      db.logAudit(actorName(req), 'SALES_ORDER_CANCELLED', 'SALES_ORDER', order.id, `Cancelled ${order.orderNumber}. Reason: ${reason}`);
    });

    res.json(order);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/sales-orders/:id/book-rental', (req: Request, res: Response) => {
  const order = db.getSalesOrders().find((item) => item.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Sales Order not found.' });
  if (order.transactionType !== 'RENTAL') return res.status(409).json({ error: 'Only rental Sales Orders can be booked as rental contracts.' });
  if (order.status !== 'CONFIRMED') {
    return res.status(409).json({ error: 'Sales Order must be approved before Asset Control can book the rental.' });
  }
  if (order.rentalContractId) return res.status(409).json({ error: 'This Sales Order already has a rental contract.' });

  const customer = db.getCustomers().find((item) => item.id === order.customerId);
  if (!customer) return res.status(404).json({ error: 'Customer not found for Sales Order.' });
  const orderAssetLines = order.items.filter((item) => item.allocatedAssetTag);
  if (!orderAssetLines.length) return res.status(409).json({ error: 'The Sales Order has no assigned serialized equipment.' });

  try {
    const contract = db.transaction(() => {
      const contractNumber = `${db.getSettings().rentalPrefix}${String(db.getRentals().length + 1).padStart(3, '0')}`;
      const rateType = (req.body?.rateType || 'MONTHLY') as 'DAILY' | 'WEEKLY' | 'MONTHLY';
      const durationUnits = Math.max(1, Number(req.body?.durationUnits) || 1);
      const startDate = order.items.find((item) => item.mobilizationDate)?.mobilizationDate || order.targetDeliveryDate;
      const expectedReturnDate = order.items.find((item) => item.demobilizationDate)?.demobilizationDate || (() => {
        const date = new Date(startDate);
        if (rateType === 'DAILY') date.setDate(date.getDate() + durationUnits);
        else if (rateType === 'WEEKLY') date.setDate(date.getDate() + durationUnits * 7);
        else date.setMonth(date.getMonth() + durationUnits);
        return date.toISOString().split('T')[0];
      })();
      let subtotalCents = 0;
      const rentalItems: RentalItem[] = orderAssetLines.map((line) => {
        const asset = db.getAssets().find((item) => item.assetTag === line.allocatedAssetTag || item.id === line.allocatedAssetTag);
        if (!asset || asset.status !== 'RESERVED' || asset.currentCustomerId !== customer.id) {
          throw new Error(`Asset ${line.allocatedAssetTag} is no longer reserved for this customer.`);
        }
        const unitRate = Number(line.rentalRate || line.unitPrice) || 0;
        const lineSubtotalCents = toCents(unitRate) * durationUnits;
        subtotalCents += lineSubtotalCents;
        asset.activeRentalContractId = contractNumber;
        return {
          assetId: asset.id,
          assetTag: asset.assetTag,
          assetName: asset.name,
          serialNumber: asset.serialNumber,
          rateType,
          unitRate,
          durationUnits,
          startDate,
          expectedReturnDate,
          lineSubtotal: fromCents(lineSubtotalCents),
        };
      });
      const taxCents = Math.round(subtotalCents * (db.getSettings().defaultTaxRatePercent / 100));
      const deliveryFee = order.mobilizationTotal || order.shippingFee || 0;
      const pickupFee = order.demobilizationTotal || 0;
      const contract: RentalContract = {
        id: contractNumber,
        contractNumber,
        salesOrderId: order.id,
        customerId: customer.id,
        customerName: customer.name,
        customerContact: customer.contacts[0]?.phone || '',
        status: 'PENDING_APPROVAL',
        items: rentalItems,
        startDate,
        expectedReturnDate,
        securityDeposit: Number(req.body?.securityDeposit) || 0,
        deliveryFee,
        pickupFee,
        subtotal: fromCents(subtotalCents),
        taxAmount: fromCents(taxCents),
        grandTotal: fromCents(subtotalCents + taxCents + toCents(deliveryFee) + toCents(pickupFee)),
        depositStatus: 'HELD',
        lateReturnFee: 0,
        damageTotal: 0,
        notes: order.remarks || `Booked from Sales Order ${order.orderNumber}.`,
      };
      order.rentalContractId = contract.id;
      order.status = 'CONFIRMED';
      db.getRentals().unshift(contract);
      db.logAudit(actorName(req), 'RENTAL_BOOKED_FROM_SO', 'RENTAL_CONTRACT', contract.id, `Booked ${contract.contractNumber} from Sales Order ${order.orderNumber}.`);
      db.addNotification({
        id: `NTF-RENTAL-BOOK-${contract.id}`,
        timestamp: new Date().toISOString(),
        sourceDepartment: 'Asset Control',
        sourceUserName: actorName(req),
        title: `Rental booking awaiting approval: ${contract.contractNumber}`,
        message: `Rental contract ${contract.contractNumber} was booked from Sales Order ${order.orderNumber} and awaits Manager approval before mobilization.`,
        category: 'OPERATIONAL',
        severity: 'INFO',
        targetRoles: ['MANAGER', 'ASSET_CONTROL', 'MANAGEMENT_OPERATION'],
        relatedEntity: 'RENTAL_CONTRACT',
        relatedEntityId: contract.id,
        targetTab: 'manager-approvals',
        isRead: false,
      });
      return contract;
    });
    res.status(201).json(contract);
  } catch (err: any) {
    orderAssetLines.forEach((line) => {
      const conflict = db.getAssets().find((asset) => (asset.assetTag === line.allocatedAssetTag || asset.id === line.allocatedAssetTag) && asset.status === 'RENTED');
      if (conflict) notifyRentalAllocationConflict(conflict, actorName(req));
    });
    res.status(409).json({ error: err.message });
  }
});

const notifyRentalAllocationConflict = (asset: Asset, actor: string): void => {
  const dayKey = new Date().toISOString().slice(0, 10);
  const id = `NTF-RENTAL-CONFLICT-${asset.id}-${dayKey}`;
  if (db.getNotifications().some((item) => item.id === id)) return;
  db.addNotification({
    id,
    timestamp: new Date().toISOString(),
    sourceDepartment: 'Asset Control',
    sourceUserName: actor,
    title: `Rental booking blocked: ${asset.assetTag} is on rental`,
    message: `A new rental allocation was attempted for ${asset.assetTag} (${asset.name}), which is currently ${asset.status}. Complete demobilization, physical return, and return inspection for the active rental contract before reallocating this equipment.`,
    category: 'OPERATIONAL',
    severity: 'WARNING',
    targetRoles: ['ASSET_CONTROL', 'SALES_MARKETING', 'MANAGEMENT_OPERATION', 'MANAGER'],
    relatedEntity: 'ASSET',
    relatedEntityId: asset.id,
    targetTab: 'rentals',
    isRead: false,
  });
  db.logAudit(actor, 'RENTAL_ALLOCATION_BLOCKED', 'ASSET', asset.id, `Rental allocation blocked because ${asset.assetTag} is ${asset.status}; return/demobilization is required first.`);
  db.save();
};

// ==========================================
// 6. RENTAL & LEASING MANAGEMENT
// ==========================================
apiRouter.get('/rentals', (req: Request, res: Response) => {
  const rentals = db.getRentals();
  res.json({ data: rentals, total: rentals.length });
});

apiRouter.post('/rentals', (req: Request, res: Response) => {
  try {
    const { customerId, assetIds, rateType, durationUnits, startDate, securityDeposit, deliveryFee, pickupFee, notes } = req.body;
    const customer = db.getCustomers().find((c) => c.id === customerId);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    if (!assetIds || !assetIds.length) return res.status(400).json({ error: 'Must select at least one asset for rental' });

    const newContract = db.transaction(() => {
      const start = new Date(startDate || Date.now());
      const units = Number(durationUnits) || 1;
      const type = (rateType || 'MONTHLY') as 'DAILY' | 'WEEKLY' | 'MONTHLY';

      let end = new Date(start);
      if (type === 'DAILY') end.setDate(end.getDate() + units);
      else if (type === 'WEEKLY') end.setDate(end.getDate() + units * 7);
      else if (type === 'MONTHLY') end.setMonth(end.getMonth() + units);

      const startIso = start.toISOString().split('T')[0];
      const endIso = end.toISOString().split('T')[0];

      let subtotalCents = 0;
      const rentalItems: RentalItem[] = [];

      for (const assetId of assetIds) {
        const asset = db.getAssets().find((a) => a.id === assetId || a.assetTag === assetId);
        if (!asset) throw new Error(`Asset ${assetId} not found`);

        // Only active, labeled assets can enter a rental contract.
        if (asset.status !== 'AVAILABLE') {
          throw new Error(`Asset ${asset.assetTag} (${asset.name}) is currently ${asset.status} and cannot be rented.`);
        }

        let unitRate = asset.monthlyRentalRate;
        if (type === 'DAILY') unitRate = asset.dailyRentalRate;
        else if (type === 'WEEKLY') unitRate = asset.weeklyRentalRate;

        const lineCostCents = toCents(unitRate) * units;
        subtotalCents += lineCostCents;

        rentalItems.push({
          assetId: asset.id,
          assetTag: asset.assetTag,
          assetName: asset.name,
          serialNumber: asset.serialNumber,
          rateType: type,
          unitRate,
          durationUnits: units,
          startDate: startIso,
          expectedReturnDate: endIso,
          lineSubtotal: fromCents(lineCostCents),
        });

        // Reserve asset
        asset.status = 'RESERVED';
        asset.currentCustomerId = customer.id;
        asset.currentCustomerName = customer.name;
        asset.activeRentalContractId = `${db.getSettings().rentalPrefix}${String(db.getRentals().length + 1).padStart(3, '0')}`;
      }

      const taxCents = Math.round(subtotalCents * (db.getSettings().defaultTaxRatePercent / 100));
      const delFee = Number(deliveryFee) || 0;
      const picFee = Number(pickupFee) || 0;
      const secDeposit = Number(securityDeposit) || 2000;
      const grandTotalCents = subtotalCents + taxCents + toCents(delFee) + toCents(picFee);

      const contractNumber = `${db.getSettings().rentalPrefix}${String(db.getRentals().length + 1).padStart(3, '0')}`;
      const contract: RentalContract = {
        id: contractNumber,
        contractNumber,
        customerId: customer.id,
        customerName: customer.name,
        customerContact: customer.contacts[0]?.phone || '',
        status: 'PENDING_APPROVAL',
        items: rentalItems,
        startDate: startIso,
        expectedReturnDate: endIso,
        securityDeposit: secDeposit,
        deliveryFee: delFee,
        pickupFee: picFee,
        subtotal: fromCents(subtotalCents),
        taxAmount: fromCents(taxCents),
        grandTotal: fromCents(grandTotalCents),
        depositStatus: 'HELD',
        lateReturnFee: 0,
        damageTotal: 0,
        notes: notes || '',
        extensionHistory: [],
      };

      db.getRentals().unshift(contract);
      db.logAudit(actorName(req), 'RENTAL_CONTRACT_CREATED', 'RENTAL_CONTRACT', contract.id, `Created rental agreement ${contract.contractNumber} with ${rentalItems.length} assets`);
      return contract;
    });

    res.status(201).json(newContract);
  } catch (err: any) {
    const requested = Array.isArray(req.body?.assetIds) ? req.body.assetIds : [];
    requested.forEach((assetId: string) => {
      const conflict = db.getAssets().find((asset) => (asset.id === assetId || asset.assetTag === assetId) && asset.status === 'RENTED');
      if (conflict) notifyRentalAllocationConflict(conflict, actorName(req));
    });
    const message = err.message || 'Rental booking failed.';
    res.status(message.includes('currently RENTED') ? 409 : 400).json({ error: message });
  }
});

apiRouter.post('/rentals/:id/extend', (req: Request, res: Response) => {
  const { newReturnDate, additionalAmount } = req.body;
  if (!newReturnDate) return res.status(400).json({ error: 'New return date is required' });

  const contract = db.getRentals().find((r) => r.id === req.params.id);
  if (!contract) return res.status(404).json({ error: 'Rental contract not found' });
  if (contract.status !== 'ACTIVE') return res.status(409).json({ error: 'The rental contract must be approved by a Manager before it can be extended.' });

  try {
    db.transaction(() => {
      const prevDate = contract.expectedReturnDate;
      contract.expectedReturnDate = newReturnDate;
      const added = Number(additionalAmount) || 1500;
      contract.grandTotal += added;
      contract.subtotal += added;

      if (!contract.extensionHistory) contract.extensionHistory = [];
      contract.extensionHistory.push({
        previousReturnDate: prevDate,
        newReturnDate,
        extendedAt: new Date().toISOString(),
        addedAmount: added,
      });

      contract.items.forEach((item) => {
        item.expectedReturnDate = newReturnDate;
      });

      db.logAudit(actorName(req), 'RENTAL_EXTENDED', 'RENTAL_CONTRACT', contract.id, `Extended contract ${contract.contractNumber} to ${newReturnDate}`);
    });

    res.json(contract);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/rentals/:id/return', (req: Request, res: Response) => {
  const { returnCondition, damageCharge, inspectionNotes, returnedAssetIds } = req.body;
  const contract = db.getRentals().find((r) => r.id === req.params.id);
  if (!contract) return res.status(404).json({ error: 'Rental contract not found' });
  if (contract.status !== 'ACTIVE') return res.status(409).json({ error: 'The rental contract must be active before processing its return.' });

  try {
    db.transaction(() => {
      const today = new Date().toISOString().split('T')[0];
      contract.actualReturnDate = today;

      // Calculate late fees if overdue
      const expDate = new Date(contract.expectedReturnDate);
      const actDate = new Date(today);
      if (actDate > expDate) {
        const diffDays = Math.ceil((actDate.getTime() - expDate.getTime()) / (1000 * 3600 * 24));
        contract.lateReturnFee = fromCents(toCents(diffDays * 150));
      }

      const damage = Number(damageCharge) || 0;
      contract.damageTotal = damage;

      // Handle deposit settlement
      if (damage > 0) {
        contract.depositStatus = 'APPLIED_TO_DAMAGES';
      } else {
        contract.depositStatus = 'REFUNDED';
      }

      // Return assets to inventory
      contract.items.forEach((item) => {
        if (!returnedAssetIds || returnedAssetIds.includes(item.assetId)) {
          item.actualReturnDate = today;
          item.returnCondition = returnCondition || 'GOOD';
          item.damageCharge = damage;
          item.inspectionNotes = inspectionNotes || 'Standard return inspection completed';

          const asset = db.getAssets().find((a) => a.id === item.assetId || a.assetTag === item.assetTag);
          if (asset) {
            asset.currentCustomerId = null;
            asset.currentCustomerName = null;
            asset.activeRentalContractId = null;

            if (returnCondition === 'DAMAGED' || returnCondition === 'NEEDS_REPAIR') {
              asset.status = 'IN_MAINTENANCE';
              asset.condition = returnCondition;
              // Generate automated work order
              const woNum = `WO-${Date.now().toString().slice(-5)}`;
              db.getWorkOrders().unshift({
                id: woNum,
                workOrderNumber: woNum,
                assetId: asset.id,
                assetTag: asset.assetTag,
                assetName: asset.name,
                title: `Post-Rental Repair: ${asset.name}`,
                description: inspectionNotes || 'Damage reported upon return from rental contract ' + contract.contractNumber,
                priority: 'HIGH',
                type: 'RENTAL_RETURN_INSPECTION',
                assignedTechnician: 'Derrick Vance (Senior Fleet Mechanic)',
                scheduledDate: today,
                partsCost: damage * 0.4,
                laborCost: damage * 0.6,
                totalCost: damage,
                downtimeHours: 24,
                status: 'PENDING_APPROVAL',
              });
            } else {
              asset.status = 'AVAILABLE';
              asset.condition = returnCondition || 'GOOD';
            }
          }
        }
      });

      contract.status = 'SETTLED';
      db.logAudit(actorName(req), 'RENTAL_RETURN_SETTLED', 'RENTAL_CONTRACT', contract.id, `Settled return for ${contract.contractNumber}. Damage fee: ${formatRupiahAmount(damage)}, Late fee: ${formatRupiahAmount(contract.lateReturnFee)}`);
    });

    res.json(contract);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 7. DELIVERIES & HANDOVER
// ==========================================
apiRouter.get('/deliveries', (req: Request, res: Response) => {
  const deliveries = db.getDeliveries();
  res.json({ data: deliveries, total: deliveries.length });
});

apiRouter.post('/deliveries', (req: Request, res: Response) => {
  try {
    const { sourceType, sourceReferenceId, recipientName, recipientPhone, driverName, trackingNumber, conditionNotes } = req.body;
    let customerId = '';
    let customerName = '';
    let deliveryAddress = { street: '', city: '', state: '', postalCode: '', country: 'United States' };
    let items: any[] = [];

    if (sourceType === 'SALES_ORDER') {
      const order = db.getSalesOrders().find((o) => o.id === sourceReferenceId);
      if (!order) return res.status(404).json({ error: 'Source Sales Order not found' });
      if (order.status === 'PENDING' || order.status === 'CANCELLED') {
        return res.status(409).json({ error: 'The sales order must be approved by a Manager before creating a delivery.' });
      }
      if (!order.contractReferenceNumber?.trim() || !order.contractAttachmentDataUrl) {
        return res.status(409).json({ error: `Dispatch blocked: Sales Order ${order.orderNumber} must have a contract reference number and uploaded contract PDF in Contract Management before dispatch.` });
      }
      if (order.transactionType !== 'RENTAL') {
        const unpaidAsset = order.items.find((line) => {
          if (!line.allocatedAssetTag) return false;
          const asset = db.getAssets().find((row) => row.assetTag === line.allocatedAssetTag || row.id === line.allocatedAssetTag);
          return !asset || asset.status !== 'SOLD' || asset.disposition?.sourceSalesOrderId !== order.id;
        });
        if (unpaidAsset) return res.status(409).json({ error: 'Equipment can only be mobilized after its Sales Order invoice is fully paid.' });
      }
      customerId = order.customerId;
      customerName = order.customerName;
      deliveryAddress = order.deliveryAddress;
      items = order.items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        assetTag: i.allocatedAssetTag,
        serialNumber: i.allocatedSerialNumber,
        quantity: i.quantity,
        verified: true,
      }));
    } else if (sourceType === 'RENTAL_CONTRACT') {
      const rental = db.getRentals().find((r) => r.id === sourceReferenceId);
      if (!rental) return res.status(404).json({ error: 'Source Rental Contract not found' });
      if (rental.status !== 'RESERVED') {
        return res.status(409).json({ error: 'The rental contract must be booked and approved before creating a mobilization delivery.' });
      }
      customerId = rental.customerId;
      customerName = rental.customerName;
      const cust = db.getCustomers().find((c) => c.id === customerId);
      if (cust) deliveryAddress = cust.deliveryAddress;
      items = rental.items.map((i) => ({
        productId: i.assetId,
        productName: i.assetName,
        assetTag: i.assetTag,
        serialNumber: i.serialNumber,
        quantity: 1,
        verified: true,
      }));
    }

    const deliveryNumber = `${db.getSettings().deliveryPrefix}${String(db.getDeliveries().length + 1).padStart(3, '0')}`;
    const newDelivery: Delivery = {
      id: deliveryNumber,
      deliveryNumber,
      sourceType: sourceType || 'SALES_ORDER',
      sourceReferenceId,
      customerId,
      customerName,
      deliveryAddress,
      recipientName: recipientName || 'Site Contact',
      recipientPhone: recipientPhone || '+1 (555) 000-0000',
      dispatchDate: new Date().toISOString(),
      status: 'PENDING_APPROVAL',
      driverName: driverName || 'Apex Fleet Logistics',
      trackingNumber: trackingNumber || `TRK-${Date.now().toString().slice(-6)}`,
      items,
      conditionNotes: conditionNotes || 'Asset dispatched in verified operating condition with QA checklist.',
    };

    db.getDeliveries().unshift(newDelivery);
    if (sourceType === 'RENTAL_CONTRACT') {
      const rental = db.getRentals().find((item) => item.id === sourceReferenceId);
      if (rental) rental.deliveryId = newDelivery.id;
    }
    db.logAudit(actorName(req), 'DELIVERY_DISPATCHED', 'DELIVERY', newDelivery.id, `Dispatched delivery ${newDelivery.deliveryNumber} for ${customerName}`);
    res.status(201).json(newDelivery);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/deliveries/:id/confirm', (req: Request, res: Response) => {
  const { digitalSignature, acceptedBy, conditionNotes } = req.body;
  const delivery = db.getDeliveries().find((d) => d.id === req.params.id);
  if (!delivery) return res.status(404).json({ error: 'Delivery order not found' });
  if (delivery.status !== 'IN_TRANSIT' && delivery.status !== 'PICKED' && delivery.status !== 'DELIVERED') {
    return res.status(409).json({ error: 'Delivery must be approved and in transit before customer handover.' });
  }
  const rentalForDelivery = delivery.sourceType === 'RENTAL_CONTRACT'
    ? db.getRentals().find((rental) => rental.id === delivery.sourceReferenceId)
    : undefined;
  if (delivery.sourceType === 'RENTAL_CONTRACT' && rentalForDelivery?.status !== 'RESERVED') {
    return res.status(409).json({ error: 'Rental contract must be approved and reserved before handover.' });
  }

  try {
    db.transaction(() => {
      delivery.status = 'CUSTOMER_ACCEPTED';
      delivery.actualDeliveryDate = new Date().toISOString();
      delivery.digitalSignature = digitalSignature || 'Digital Acceptance on File';
      delivery.acceptedBy = acceptedBy || delivery.recipientName;
      if (conditionNotes) delivery.conditionNotes = conditionNotes;

      // Sales assets were marked SOLD after payment; delivery only records physical handover.
      if (delivery.sourceType === 'SALES_ORDER') {
        const order = db.getSalesOrders().find((o) => o.id === delivery.sourceReferenceId);
        if (order) {
          order.status = 'DELIVERED';
          delivery.items.forEach((item) => {
            if (item.assetTag) {
              const asset = db.getAssets().find((a) => a.assetTag === item.assetTag || a.id === item.assetTag);
              if (asset) {
                asset.currentCustomerId = delivery.customerId;
                asset.currentCustomerName = delivery.customerName;
                asset.notes = `${asset.notes || ''} Mobilized via Delivery ${delivery.deliveryNumber} on ${new Date().toISOString().split('T')[0]}.`.trim();
              }
            }
          });
        }
      } else if (rentalForDelivery) {
        rentalForDelivery.status = 'ACTIVE';
        rentalForDelivery.mobilizationDate = new Date().toISOString().split('T')[0];
        rentalForDelivery.items.forEach((rentalItem) => {
          const asset = db.getAssets().find((item) => item.id === rentalItem.assetId || item.assetTag === rentalItem.assetTag);
          if (asset) asset.status = 'RENTED';
        });
        if (rentalForDelivery.salesOrderId) {
          const order = db.getSalesOrders().find((item) => item.id === rentalForDelivery.salesOrderId);
          if (order) order.status = 'DELIVERED';
        }
      }

      db.logAudit(actorName(req), 'DELIVERY_CONFIRMED', 'DELIVERY', delivery.id, `Confirmed handover for ${delivery.deliveryNumber} signed by ${delivery.acceptedBy}`);
    });

    res.json(delivery);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 8. INVOICING & BILLING
// ==========================================
apiRouter.get('/invoices', (req: Request, res: Response) => {
  const invoices = db.getInvoices();
  res.json({ data: invoices, total: invoices.length });
});

apiRouter.get('/invoices/:id', (req: Request, res: Response) => {
  const invoice = db.getInvoices().find((i) => i.id === req.params.id);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  res.json(invoice);
});

apiRouter.post('/invoices', (req: Request, res: Response) => {
  try {
    const { customerId, type, relatedSourceId, relatedSourceType, items, additionalCharges, terms, notes } = req.body;
    const customer = db.getCustomers().find((c) => c.id === customerId);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    if (!items || !items.length) return res.status(400).json({ error: 'Invoice must have line items' });
    if (relatedSourceType === 'SALES_ORDER') {
      const order = db.getSalesOrders().find((row) => row.id === relatedSourceId);
      if (!order || order.status === 'PENDING' || order.status === 'CANCELLED') {
        return res.status(409).json({ error: 'The sales order must be approved by a Manager before creating an invoice.' });
      }
      if (order.invoiceId) return res.status(409).json({ error: 'An invoice is already linked to this Sales Order.' });
    }
    if (relatedSourceType === 'RENTAL_CONTRACT') {
      const rental = db.getRentals().find((row) => row.id === relatedSourceId);
      if (!rental || rental.status !== 'ACTIVE') {
        return res.status(409).json({ error: 'The rental contract must be approved by a Manager before creating an invoice.' });
      }
    }

    const newInvoice = db.transaction(() => {
      let subtotalCents = 0;
      let taxTotalCents = 0;
      let discountTotalCents = 0;

      const invoiceItems = items.map((raw: any, index: number) => {
        const qty = Number(raw.quantity) || 1;
        const price = Number(raw.unitPrice) || 0;
        const disc = Number(raw.discountPercent) || 0;
        const taxRate = Number(raw.taxRatePercent ?? 8.25);

        const calc = calculateLineTotals(qty, price, disc, taxRate);
        subtotalCents += toCents(calc.subtotal);
        taxTotalCents += toCents(calc.taxAmount);
        discountTotalCents += toCents(calc.discountAmount);

        return {
          id: `INI-${Date.now()}-${index}`,
          description: raw.description || 'Equipment & Services',
          quantity: qty,
          unitPrice: price,
          discountPercent: disc,
          taxRatePercent: taxRate,
          subtotal: calc.subtotal,
          taxAmount: calc.taxAmount,
          total: calc.total,
          assetTag: raw.assetTag,
        };
      });

      const addCharges = Number(additionalCharges) || 0;
      const grandTotalCents = subtotalCents + taxTotalCents + toCents(addCharges);
      const grandTotal = fromCents(grandTotalCents);

      const invNumber = `${db.getSettings().invoicePrefix}${String(db.getInvoices().length + 1).padStart(3, '0')}`;
      const issueDate = new Date().toISOString().split('T')[0];
      const dueDate = new Date(Date.now() + (customer.paymentTermsDays || 30) * 86400000).toISOString().split('T')[0];

      const invoice: Invoice = {
        id: invNumber,
        invoiceNumber: invNumber,
        type: type || 'SALES',
        relatedSourceId,
        relatedSourceType,
        customerId: customer.id,
        customerName: customer.name,
        customerTaxId: customer.taxId,
        issueDate,
        dueDate,
        paymentTermsDays: customer.paymentTermsDays || 30,
        currency: 'IDR',
        status: 'DRAFT',
        items: invoiceItems,
        subtotal: fromCents(subtotalCents),
        discountTotal: fromCents(discountTotalCents),
        taxTotal: fromCents(taxTotalCents),
        additionalCharges: addCharges,
        grandTotal,
        paidAmount: 0,
        outstandingBalance: grandTotal,
        notes: notes || '',
        terms: terms || `Payment terms Net ${customer.paymentTermsDays} days. Wire payments to Chase account ending 4892.`,
      };

      db.getInvoices().unshift(invoice);
      if (relatedSourceType === 'SALES_ORDER' && relatedSourceId) {
        const order = db.getSalesOrders().find((row) => row.id === relatedSourceId);
        if (order) {
          order.invoiceId = invoice.id;
          order.invoicedAmount = invoice.grandTotal;
        }
      }
      db.logAudit(actorName(req), 'INVOICE_CREATED', 'INVOICE', invoice.id, `Created draft invoice ${invoice.invoiceNumber} for ${customer.name}`);
      return invoice;
    });

    res.status(201).json(newInvoice);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/invoices/:id/issue', (req: Request, res: Response) => {
  const invoice = db.getInvoices().find((i) => i.id === req.params.id);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  if (invoice.status !== 'DRAFT') {
    return res.status(400).json({ error: `Invoice cannot be issued in status ${invoice.status}` });
  }

  try {
    db.transaction(() => {
      invoice.status = 'PENDING_APPROVAL';
      db.logAudit(actorName(req), 'INVOICE_SUBMITTED_FOR_APPROVAL', 'INVOICE', invoice.id, `Invoice ${invoice.invoiceNumber} submitted for approval.`);
    });

    res.json(invoice);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/invoices/:id/credit-notes', (req: Request, res: Response) => {
  const { reason, creditAmount } = req.body;
  if (!reason) return res.status(400).json({ error: 'Credit note reason is mandatory' });

  const invoice = db.getInvoices().find((i) => i.id === req.params.id);
  if (!invoice) return res.status(404).json({ error: 'Original invoice not found' });

  try {
    const creditNote = db.transaction(() => {
      const amount = Number(creditAmount) || invoice.outstandingBalance;
      if (amount <= 0 || amount > invoice.outstandingBalance) {
        throw new Error(`Credit amount must be positive and cannot exceed the current balance (${formatRupiahAmount(invoice.outstandingBalance)}).`);
      }

      const cnNumber = `CN-2026-${String(db.getInvoices().filter((i) => i.type === 'CREDIT_NOTE').length + 1).padStart(3, '0')}`;
      const cn: Invoice = {
        id: cnNumber,
        invoiceNumber: cnNumber,
        type: 'CREDIT_NOTE',
        originalInvoiceId: invoice.id,
        creditNoteReason: reason,
        customerId: invoice.customerId,
        customerName: invoice.customerName,
        customerTaxId: invoice.customerTaxId,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date().toISOString().split('T')[0],
        paymentTermsDays: 0,
        currency: 'IDR',
        status: 'PAID',
        items: [
          {
            id: `CNI-${Date.now()}`,
            description: `Credit adjustment against invoice ${invoice.invoiceNumber}: ${reason}`,
            quantity: 1,
            unitPrice: -amount,
            discountPercent: 0,
            taxRatePercent: 0,
            subtotal: -amount,
            taxAmount: 0,
            total: -amount,
          },
        ],
        subtotal: -amount,
        discountTotal: 0,
        taxTotal: 0,
        additionalCharges: 0,
        grandTotal: -amount,
        paidAmount: 0,
        outstandingBalance: 0,
        terms: 'Credit note applied to invoice balance.',
      };

      // Adjust original invoice
      invoice.outstandingBalance = fromCents(toCents(invoice.outstandingBalance) - toCents(amount));
      if (invoice.outstandingBalance <= 0) {
        invoice.status = 'CREDITED';
      }

      // Adjust customer balance
      const customer = db.getCustomers().find((c) => c.id === invoice.customerId);
      if (customer) {
        customer.outstandingBalance = fromCents(toCents(customer.outstandingBalance) - toCents(amount));
      }

      db.getInvoices().unshift(cn);
      db.logAudit(actorName(req), 'CREDIT_NOTE_CREATED', 'INVOICE', cn.id, `Created credit note ${cn.invoiceNumber} for ${formatRupiahAmount(amount)}. Reason: ${reason}`);
      return cn;
    });

    res.status(201).json(creditNote);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 9. PAYMENT MANAGEMENT & ALLOCATIONS
// ==========================================
const finalizePaidAssetSale = (invoice: Invoice, actor: string) => {
  if (invoice.status !== 'PAID' || invoice.relatedSourceType !== 'SALES_ORDER' || !invoice.relatedSourceId) return;
  const order = db.getSalesOrders().find((item) => item.id === invoice.relatedSourceId);
  if (!order || order.transactionType === 'RENTAL') return;

  let markedSold = 0;
  for (const line of order.items) {
    if (!line.allocatedAssetTag) continue;
    const asset = db.getAssets().find((item) => item.assetTag === line.allocatedAssetTag || item.id === line.allocatedAssetTag);
    if (!asset || asset.disposition?.sourceSalesOrderId === order.id) continue;
    if (asset.status !== 'RESERVED') continue;
    const invoiceItem = invoice.items.find((item) => item.assetTag === asset.assetTag);
    if (!invoiceItem) continue;

    const bookValue = calculateAssetBookValue(asset);
    const proceeds = invoiceItem.subtotal;
    asset.status = 'SOLD';
    asset.currentBookValue = bookValue;
    asset.disposition = {
      type: 'SALE',
      date: new Date().toISOString().split('T')[0],
      proceeds,
      bookValueAtDisposition: bookValue,
      gainLoss: fromCents(toCents(proceeds) - toCents(bookValue)),
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      invoiceId: invoice.id,
      sourceSalesOrderId: order.id,
      notes: `Sold through Sales Order ${order.orderNumber}.` ,
    };
    asset.currentCustomerId = invoice.customerId;
    asset.currentCustomerName = invoice.customerName;
    markedSold += 1;
    db.logAudit(actor, 'ASSET_SOLD_AFTER_PAYMENT', 'ASSET', asset.id, `Asset ${asset.assetTag} marked SOLD after invoice ${invoice.invoiceNumber} was fully paid.`);
  }

  if (markedSold > 0) {
    order.status = 'CONFIRMED';
    order.paidAmount = invoice.paidAmount;
    db.addNotification({
      id: `NTF-ASSET-PAID-${invoice.id}`,
      timestamp: new Date().toISOString(),
      sourceDepartment: 'Finance & FAT',
      sourceUserName: actor,
      title: `Paid equipment order ready to mobilize: ${order.orderNumber}`,
      message: `${markedSold} asset(s) were marked SOLD after invoice ${invoice.invoiceNumber} was paid. Asset Control can proceed with mobilization.`,
      category: 'FINANCIAL',
      severity: 'SUCCESS',
      targetRoles: ['ASSET_CONTROL', 'SALES_MARKETING', 'EXECUTIVE'],
      relatedEntity: 'SALES_ORDER',
      relatedEntityId: order.id,
      targetTab: 'deliveries',
      isRead: false,
    });
  }
};

apiRouter.get('/payments', (req: Request, res: Response) => {
  const payments = db.getPayments();
  res.json({ data: payments, total: payments.length });
});

apiRouter.post('/payments', (req: Request, res: Response) => {
  try {
    const { customerId, amount, method, referenceNumber, paymentDate, allocations, notes } = req.body;
    const customer = db.getCustomers().find((c) => c.id === customerId);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const totalAmount = Number(amount);
    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ error: 'Payment amount must be greater than zero' });
    }

    const newPayment = db.transaction(() => {
      let allocatedCentsTotal = 0;
      const validAllocations: PaymentAllocation[] = [];

      if (allocations && Array.isArray(allocations)) {
        for (const alloc of allocations) {
          const inv = db.getInvoices().find((i) => i.id === alloc.invoiceId);
          if (inv) {
            const allocAmt = Number(alloc.allocatedAmount) || 0;
            if (allocAmt > 0) {
              const allocCents = toCents(allocAmt);
              const invBalCents = toCents(inv.outstandingBalance);
              const appliedCents = Math.min(allocCents, invBalCents);

              // Update invoice
              inv.paidAmount = fromCents(toCents(inv.paidAmount) + appliedCents);
              inv.outstandingBalance = fromCents(invBalCents - appliedCents);
              if (inv.outstandingBalance <= 0) {
                inv.status = 'PAID';
              } else {
                inv.status = 'PARTIALLY_PAID';
              }
              finalizePaidAssetSale(inv, actorName(req));

              allocatedCentsTotal += appliedCents;
              validAllocations.push({
                invoiceId: inv.id,
                invoiceNumber: inv.invoiceNumber,
                allocatedAmount: fromCents(appliedCents),
              });
            }
          }
        }
      }

      const totalCents = toCents(totalAmount);
      const unallocatedCents = totalCents - allocatedCentsTotal;

      // Update customer balance decimal-safely
      customer.outstandingBalance = fromCents(Math.max(0, toCents(customer.outstandingBalance) - allocatedCentsTotal));

      const pmtNumber = `${db.getSettings().paymentPrefix}${String(db.getPayments().length + 1).padStart(3, '0')}`;
      const rcptNumber = `RCPT-${pmtNumber.slice(-8)}`;

      const payment: Payment = {
        id: pmtNumber,
        paymentNumber: pmtNumber,
        customerId: customer.id,
        customerName: customer.name,
        paymentDate: paymentDate || new Date().toISOString().split('T')[0],
        amount: totalAmount,
        currency: 'IDR',
        method: method || 'BANK_TRANSFER',
        referenceNumber: referenceNumber || `REF-${Date.now().toString().slice(-6)}`,
        status: 'CONFIRMED',
        allocations: validAllocations,
        unallocatedAmount: fromCents(Math.max(0, unallocatedCents)),
        notes: notes || '',
        recordedBy: actorName(req),
        receiptNumber: rcptNumber,
      };

      db.getPayments().unshift(payment);
      db.logAudit(actorName(req), 'PAYMENT_CONFIRMED', 'PAYMENT', payment.id, `Recorded confirmed payment ${payment.paymentNumber} of ${formatRupiahAmount(totalAmount)} for ${customer.name}`);
      return payment;
    });

    res.status(201).json(newPayment);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/payments/:id/allocate', (req: Request, res: Response) => {
  const { allocations } = req.body;
  const payment = db.getPayments().find((p) => p.id === req.params.id);
  if (!payment) return res.status(404).json({ error: 'Payment not found' });
  if (payment.unallocatedAmount <= 0) return res.status(400).json({ error: 'No unallocated funds available on this payment' });

  try {
    db.transaction(() => {
      let unallocCents = toCents(payment.unallocatedAmount);
      const customer = db.getCustomers().find((c) => c.id === payment.customerId);

      for (const alloc of allocations) {
        if (unallocCents <= 0) break;
        const inv = db.getInvoices().find((i) => i.id === alloc.invoiceId);
        if (inv && inv.outstandingBalance > 0) {
          const reqAllocCents = toCents(alloc.allocatedAmount);
          const applyCents = Math.min(unallocCents, reqAllocCents, toCents(inv.outstandingBalance));

          inv.paidAmount = fromCents(toCents(inv.paidAmount) + applyCents);
          inv.outstandingBalance = fromCents(toCents(inv.outstandingBalance) - applyCents);
          if (inv.outstandingBalance <= 0) inv.status = 'PAID';
          else inv.status = 'PARTIALLY_PAID';
          finalizePaidAssetSale(inv, actorName(req));

          unallocCents -= applyCents;
          payment.allocations.push({
            invoiceId: inv.id,
            invoiceNumber: inv.invoiceNumber,
            allocatedAmount: fromCents(applyCents),
          });

          if (customer) {
            customer.outstandingBalance = fromCents(Math.max(0, toCents(customer.outstandingBalance) - applyCents));
          }
        }
      }

      payment.unallocatedAmount = fromCents(unallocCents);
      db.logAudit(actorName(req), 'PAYMENT_ALLOCATED', 'PAYMENT', payment.id, `Allocated payment funds to invoices. Remaining unallocated: ${formatRupiahAmount(payment.unallocatedAmount)}`);
    });

    res.json(payment);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 10. PROCUREMENT, VENDORS & BILLS
// ==========================================
apiRouter.get('/procurement/vendors', (_req: Request, res: Response) => {
  res.json({ data: db.getVendors(), total: db.getVendors().length });
});

apiRouter.post('/procurement/vendors', (req: Request, res: Response) => {
  try {
    const { name, contactName, email, phone, taxId, category, paymentTerms, address } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Vendor name is required.' });

    const newVendor = db.transaction(() => {
      const vCode = `VEND-${String(db.getVendors().length + 1).padStart(3, '0')}`;
      const vendor: Vendor = {
        id: vCode,
        vendorCode: vCode,
        name: name.trim(),
        contactName: contactName || 'Contact Representative',
        email: email || `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@supplier.com`,
        phone: phone || '+62 21-555-0100',
        taxId: taxId || '01.999.888.7-011.000',
        address: address || { street: 'Kawasan Industri Pulogadung', city: 'Jakarta Timur', state: 'DKI Jakarta', postalCode: '13920', country: 'Indonesia' },
        paymentTerms: Number(paymentTerms) || 30,
        currency: 'IDR',
        category: category || 'Heavy Equipment Spare Parts & Logistics',
      };

      db.getVendors().unshift(vendor);
      db.logAudit(actorName(req), 'VENDOR_CREATED', 'VENDOR', vendor.id, `Registered new vendor ${vendor.name} (${vendor.vendorCode})`);
      return vendor;
    });

    res.status(201).json(newVendor);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/procurement/vendors/:id', (req: Request, res: Response) => {
  const index = db.getVendors().findIndex((v) => v.id === req.params.id || v.vendorCode === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Vendor not found.' });

  db.transaction(() => {
    const removed = db.getVendors().splice(index, 1)[0];
    db.logAudit(actorName(req), 'VENDOR_DELETED', 'VENDOR', removed.id, `Deleted vendor ${removed.name}`);
  });

  res.json({ message: 'Vendor deleted successfully.' });
});

apiRouter.get('/procurement/purchase-orders', (_req: Request, res: Response) => {
  res.json({ data: db.getPurchaseOrders(), total: db.getPurchaseOrders().length });
});

apiRouter.post('/procurement/purchase-orders', (req: Request, res: Response) => {
  try {
    const { vendorId, items, expectedDate, notes, paymentTerms } = req.body;
    const vendor = db.getVendors().find((v) => v.id === vendorId);
    if (!vendor) return res.status(404).json({ error: 'Vendor not found.' });
    if (!items || !items.length) return res.status(400).json({ error: 'The PO must contain at least one item or service.' });

    const newPO = db.transaction(() => {
      let subtotalCents = 0;
      let taxTotalCents = 0;

      const poItems = items.map((raw: any) => {
        const prod = db.getProducts().find((p) => p.id === raw.productId);
        const qty = Number(raw.quantity) || 1;
        const itemType = raw.itemType || (prod?.productType === 'SERVICE' ? 'SERVICE' : 'GOODS');
        if (itemType === 'HEAVY_EQUIPMENT' && (!Number.isInteger(qty) || qty < 1)) {
          throw new Error('Heavy equipment quantity must be a positive whole number.');
        }
        const cost = Number(raw.unitCost) || (prod ? prod.purchaseCost : 100);
        const lineSubtotal = qty * cost;
        const taxRate = Number(raw.taxRatePercent ?? 11); // 11% PPN standar
        const lineTax = Math.round(lineSubtotal * (taxRate / 100));

        subtotalCents += toCents(lineSubtotal);
        taxTotalCents += toCents(lineTax);

        return {
          productId: raw.productId || `PRD-${Date.now().toString().slice(-4)}`,
          productName: raw.productName || (prod ? prod.name : 'Procured Component'),
          itemType,
          quantity: qty,
          unitCost: cost,
          taxRatePercent: taxRate,
          taxAmount: lineTax,
          totalCost: lineSubtotal + lineTax,
          receivedQuantity: 0,
        };
      });

      const poNum = `PO-2026-${String(db.getPurchaseOrders().length + 1).padStart(3, '0')}`;
      const subtotal = fromCents(subtotalCents);
      const taxAmount = fromCents(taxTotalCents);
      const grandTotal = fromCents(subtotalCents + taxTotalCents);
      const terms = paymentTerms || `Net ${vendor.paymentTerms || 30} Days`;

      const po: PurchaseOrder = {
        id: poNum,
        poNumber: poNum,
        vendorId: vendor.id,
        vendorName: vendor.name,
        vendorTaxId: vendor.taxId,
        orderDate: new Date().toISOString().split('T')[0],
        expectedDate: expectedDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        paymentTerms: terms,
        status: 'PENDING_APPROVAL',
        items: poItems,
        subtotal,
        taxAmount,
        grandTotal,
        notes: notes || '',
      };

      db.getPurchaseOrders().unshift(po);
      // Finance & Accounting receives a linked AP/vendor-bill record immediately.
      // This is an accrual/workflow record, not proof that the vendor invoice was received.
      const billNumber = `VB-${new Date().getFullYear()}-${String(db.getVendorBills().length + 1).padStart(4, '0')}`;
      const vendorBill: VendorBill = {
        id: billNumber,
        billNumber,
        purchaseOrderId: po.id,
        vendorId: vendor.id,
        vendorName: vendor.name,
        billDate: po.orderDate,
        dueDate: new Date(new Date(po.orderDate).getTime() + (Number(vendor.paymentTerms) || 30) * 86400000).toISOString().slice(0, 10),
        amount: po.grandTotal,
        paidAmount: 0,
        status: 'UNPAID',
      };
      db.getVendorBills().unshift(vendorBill);
      po.vendorBillId = vendorBill.id;
      db.logAudit(actorName(req), 'FINANCE_AP_BILL_CREATED', 'VENDOR_BILL', vendorBill.id, `Finance AP record ${vendorBill.billNumber} linked to procurement PO ${po.poNumber}; pending invoice verification.`);
      db.logAudit(
        actorName(req),
        'PO_CREATED',
        'PURCHASE_ORDER',
        po.id,
        `Created Purchase Order ${po.poNumber} for vendor ${vendor.name}. Total: ${formatRupiahAmount(grandTotal)} (Tax Included). Waiting for Manager approval.`
      );
      return po;
    });

    res.status(201).json(newPO);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/procurement/purchase-orders/:id', (req: Request, res: Response) => {
  const index = db.getPurchaseOrders().findIndex((p) => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Purchase Order not found.' });

  db.transaction(() => {
    const po = db.getPurchaseOrders()[index];
    if (po.status === 'GOODS_RECEIVED') {
      throw new Error('A PO with received items cannot be deleted.');
    }
    po.status = 'CANCELLED';
    if (po.vendorBillId) {
      const bIndex = db.getVendorBills().findIndex((b) => b.id === po.vendorBillId);
      if (bIndex !== -1) db.getVendorBills().splice(bIndex, 1);
    }
    db.getPurchaseOrders().splice(index, 1);
    db.logAudit(actorName(req), 'PO_CANCELLED', 'PURCHASE_ORDER', po.id, `Cancelled and deleted PO ${po.poNumber}`);
  });

  res.json({ message: 'Purchase Order cancelled and deleted successfully.' });
});

apiRouter.post('/procurement/purchase-orders/:id/receive', (req: Request, res: Response) => {
  const po = db.getPurchaseOrders().find((p) => p.id === req.params.id);
  if (!po) return res.status(404).json({ error: 'Purchase Order not found.' });
  if (po.status !== 'APPROVED') return res.status(409).json({ error: 'The Purchase Order must be approved by a Manager before receiving items.' });

  try {
    db.transaction(() => {
      po.status = 'GOODS_RECEIVED';
      po.items.forEach((item, itemIndex) => {
        item.receivedQuantity = item.quantity;
        // Inventory goods update stock; serialized equipment becomes an asset record.
        const prod = db.getProducts().find((p) => p.id === item.productId);
        if (prod && (!item.itemType || item.itemType === 'GOODS')) {
          prod.stockQuantity += item.quantity;
        }
        if (item.itemType === 'HEAVY_EQUIPMENT') {
          const receivedDate = new Date().toISOString().split('T')[0];
          for (let unitIndex = 0; unitIndex < item.quantity; unitIndex += 1) {
            const provisionalTag = `PENDING-${po.poNumber}-${itemIndex + 1}-${unitIndex + 1}`;
            const asset: Asset = {
              id: provisionalTag,
              assetTag: provisionalTag,
              serialNumber: provisionalTag,
              name: item.productName,
              category: 'Heavy Equipment',
              brand: 'Pending identification',
              model: 'Pending identification',
              status: 'PENDING_LABEL',
              condition: 'GOOD',
              purchaseOrderId: po.id,
              rentalMode: 'DRY',
              warehouseLocation: 'Pending Asset Control labeling',
              purchaseCost: item.unitCost,
              currentBookValue: item.unitCost,
              depreciationRateAnnual: 10,
              purchaseDate: receivedDate,
              warrantyExpiry: '',
              dailyRentalRate: 0,
              weeklyRentalRate: 0,
              monthlyRentalRate: 0,
              sellPrice: 0,
              specs: {},
              notes: `Received from Purchase Order ${po.poNumber}; label and serial number required.`,
            };
            db.getAssets().push(asset);
          }
        }
      });

      const pendingAssets = db.getAssets().filter((asset) => asset.purchaseOrderId === po.id && asset.status === 'PENDING_LABEL').length;
      db.logAudit(actorName(req), 'GOODS_RECEIVED', 'PURCHASE_ORDER', po.id, `Received items for ${po.poNumber}; created ${pendingAssets} heavy-equipment asset record(s) awaiting labeling.`);
    });

    res.json(po);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/procurement/vendor-bills', (_req: Request, res: Response) => {
  res.json({ data: db.getVendorBills(), total: db.getVendorBills().length });
});

apiRouter.post('/procurement/vendor-bills/:id/pay', (req: Request, res: Response) => {
  const bill = db.getVendorBills().find((b) => b.id === req.params.id);
  if (!bill) return res.status(404).json({ error: 'Vendor bill not found.' });

  db.transaction(() => {
    bill.status = 'PAID';
    bill.paidAmount = bill.amount;
    db.logAudit(actorName(req), 'VENDOR_BILL_PAID', 'VENDOR_BILL', bill.id, `Settled vendor bill ${bill.billNumber} (${formatRupiahAmount(bill.amount)}) for ${bill.vendorName}`);
  });

  res.json(bill);
});

// ==========================================
// 11. OPERATOR MANAGEMENT (SIO & ASSIGNMENT)
// ==========================================
apiRouter.get('/operators', (_req: Request, res: Response) => {
  res.json({ data: db.getOperators(), total: db.getOperators().length });
});

apiRouter.post('/operators', (req: Request, res: Response) => {
  try {
    const { name, badgeNumber, phone, email, sioNumber, sioClass, sioExpiry, sioIssuer, equipmentSpecialization, assignedAssetId, assignedCustomerId, assignedCustomerName, assignedProjectName } = req.body;
    if (!name || !badgeNumber || !sioNumber) {
      return res.status(400).json({ error: 'Operator name, badge number, and SIO number are required.' });
    }

    const newOp = db.transaction(() => {
      const opId = `OPR-${String(db.getOperators().length + 1).padStart(2, '0')}`;
      let assetTag: string | undefined = undefined;
      let assetName: string | undefined = undefined;

      if (assignedAssetId) {
        const asset = db.getAssets().find((a) => a.id === assignedAssetId || a.assetTag === assignedAssetId);
        if (asset) {
          assetTag = asset.assetTag;
          assetName = asset.name;
        }
      }

      const operator: HeavyEquipmentOperator = {
        id: opId,
        name: name.trim(),
        badgeNumber: badgeNumber.trim(),
        phone: phone || '0812-3456-7890',
        email,
        status: assignedAssetId ? 'ASSIGNED' : 'STANDBY',
        sioNumber: sioNumber.trim(),
        sioClass: sioClass || 'KELAS_1',
        sioExpiry: sioExpiry || '2028-12-31',
        sioIssuer: sioIssuer || 'Kemenaker RI - Pengawas K3',
        equipmentSpecialization: equipmentSpecialization || 'Hydraulic Excavator & Earthmoving',
        assignedAssetId,
        assignedAssetTag: assetTag,
        assignedAssetName: assetName,
        assignedCustomerId,
        assignedCustomerName,
        assignedProjectName,
        currentProjectLocation: assignedProjectName || 'Depot Workshop',
        hireDate: new Date().toISOString().split('T')[0],
      };

      db.getOperators().unshift(operator);
      db.logAudit(actorName(req), 'OPERATOR_REGISTERED', 'OPERATOR', operator.id, `Registered operator ${operator.name} (SIO: ${operator.sioNumber})`);
      return operator;
    });

    res.status(201).json(newOp);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/operators/:id', (req: Request, res: Response) => {
  const operator = db.getOperators().find((o) => o.id === req.params.id);
  if (!operator) return res.status(404).json({ error: 'Operator not found.' });

  db.transaction(() => {
    Object.assign(operator, req.body);
    db.logAudit(actorName(req), 'OPERATOR_UPDATED', 'OPERATOR', operator.id, `Updated operator ${operator.name}`);
  });

  res.json(operator);
});

apiRouter.post('/operators/:id/assign', (req: Request, res: Response) => {
  const operator = db.getOperators().find((o) => o.id === req.params.id);
  if (!operator) return res.status(404).json({ error: 'Operator not found.' });

  const { customerId, customerName, projectName, assetId, assetTag, assetName } = req.body;

  db.transaction(() => {
    operator.assignedCustomerId = customerId || null;
    operator.assignedCustomerName = customerName || null;
    operator.assignedProjectName = projectName || null;
    operator.currentProjectLocation = projectName || operator.currentProjectLocation;
    operator.assignedAssetId = assetId || null;
    operator.assignedAssetTag = assetTag || null;
    operator.assignedAssetName = assetName || null;
    operator.status = assetId ? 'ASSIGNED' : 'STANDBY';

    db.logAudit(
      actorName(req),
      'OPERATOR_ASSIGNED',
      'OPERATOR',
      operator.id,
      `Assigned operator ${operator.name} to Client: ${customerName || 'None'}, Project: ${projectName || 'None'}, Equipment: ${assetTag || 'None'}`
    );
  });

  res.json(operator);
});

apiRouter.delete('/operators/:id', (req: Request, res: Response) => {
  const index = db.getOperators().findIndex((o) => o.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Operator not found.' });

  db.transaction(() => {
    const removed = db.getOperators().splice(index, 1)[0];
    db.logAudit(actorName(req), 'OPERATOR_DELETED', 'OPERATOR', removed.id, `Deleted operator ${removed.name}`);
  });

  res.json({ message: 'Operator deleted successfully.' });
});

// ==========================================
// 12. OPERATOR ATTENDANCE SCAN & BILLING TIMESHEET
// ==========================================
apiRouter.get('/operators/attendance', (_req: Request, res: Response) => {
  res.json({ data: db.getAttendanceLogs(), total: db.getAttendanceLogs().length });
});

apiRouter.post('/operators/attendance/check-in', (req: Request, res: Response) => {
  const { barcode, hourMeter, notes, operatorId, operatorName } = req.body;
  const asset = db.getAssets().find((a) =>
    a.assetTag.toLowerCase() === (barcode || '').trim().toLowerCase() ||
    a.serialNumber.toLowerCase() === (barcode || '').trim().toLowerCase()
  );

  if (!asset) {
    return res.status(404).json({ error: `Equipment with barcode "${barcode}" is not registered.` });
  }

  const opName = actorName(req);
  const op = db.getOperators().find((o) => o.name.toLowerCase() === opName.toLowerCase() || o.id === operatorId);
  const linkedOrder = db.getSalesOrders().find((order) => order.items.some((line) => line.allocatedAssetTag === asset.assetTag) && order.status !== 'CANCELLED' && order.status !== 'COMPLETED');
  if (linkedOrder && (!linkedOrder.contractReferenceNumber?.trim() || !linkedOrder.contractAttachmentDataUrl)) {
    return res.status(409).json({ error: `Scan blocked: equipment ${asset.assetTag} is linked to Sales Order ${linkedOrder.orderNumber} without a complete contract PDF/reference. Contact Asset Control.` });
  }

  const newLog = db.transaction(() => {
    const logId = `ATT-${Date.now().toString().slice(-6)}`;
    const nowTime = new Date().toTimeString().slice(0, 8);
    const today = new Date().toISOString().split('T')[0];

    const att: OperatorAttendanceLog = {
      id: logId,
      date: today,
      operatorId: op?.id || 'OPR-01',
      operatorName: opName,
      operatorBadge: op?.badgeNumber || 'OPR-B-101',
      assetId: asset.id,
      assetTag: asset.assetTag,
      assetName: asset.name,
      customerId: op?.assignedCustomerId || asset.currentCustomerId || undefined,
      customerName: op?.assignedCustomerName || asset.currentCustomerName || undefined,
      projectName: op?.assignedProjectName || op?.currentProjectLocation || asset.warehouseLocation,
      checkInTime: nowTime,
      checkInHourMeter: Number(hourMeter) || (asset.legalDocs?.hourMeter || 0),
      status: 'CHECKED_IN',
      notes: notes || 'Normal check-in at project site',
      verifiedForBilling: false,
    };

    db.getAttendanceLogs().unshift(att);
    // Operational start is system-stamped at the first successful operator scan, not manually planned.
    if (linkedOrder) {
      const line = linkedOrder.items.find((item) => item.allocatedAssetTag === asset.assetTag);
      if (line && !line.mobilizationDate) line.mobilizationDate = new Date().toISOString();
      db.logAudit(opName, 'EQUIPMENT_OPERATION_STARTED', 'SALES_ORDER', linkedOrder.id, `System recorded first operator scan for ${asset.assetTag} at ${new Date().toISOString()}.`);
    }
    if (hourMeter && asset.legalDocs) {
      asset.legalDocs.hourMeter = Number(hourMeter);
    }

    db.logAudit(opName, 'ATTENDANCE_CHECK_IN', 'ATTENDANCE', att.id, `Operator ${opName} checked in on ${asset.assetTag} at HM ${att.checkInHourMeter}`);
    return att;
  });

  res.status(201).json(newLog);
});

apiRouter.post('/operators/attendance/check-out', (req: Request, res: Response) => {
  const { barcode, hourMeter, notes, operatorName } = req.body;
  const asset = db.getAssets().find((a) =>
    a.assetTag.toLowerCase() === (barcode || '').trim().toLowerCase() ||
    a.serialNumber.toLowerCase() === (barcode || '').trim().toLowerCase()
  );

  if (!asset) {
    return res.status(404).json({ error: `Equipment with barcode "${barcode}" is not registered.` });
  }

  const opName = actorName(req);
  const today = new Date().toISOString().split('T')[0];

  // Find today's open check-in for this asset or operator
  const existing = db.getAttendanceLogs().find((a) =>
    (a.assetTag.toLowerCase() === asset.assetTag.toLowerCase() || a.operatorName.toLowerCase() === opName.toLowerCase()) &&
    a.status === 'CHECKED_IN' &&
    a.date === today
  );

  const updatedLog = db.transaction(() => {
    const nowTime = new Date().toTimeString().slice(0, 8);
    const endHm = Number(hourMeter) || (asset.legalDocs?.hourMeter || 0);

    if (existing) {
      existing.checkOutTime = nowTime;
      existing.checkOutHourMeter = endHm;
      existing.workingHours = Math.max(0, Number((endHm - existing.checkInHourMeter).toFixed(1)));
      existing.status = 'CHECKED_OUT';
      existing.notes = (existing.notes ? `${existing.notes} | ` : '') + (notes || 'Shift checkout completed');
      existing.verifiedForBilling = true;

      if (asset.legalDocs) {
        asset.legalDocs.hourMeter = endHm;
      }
      db.logAudit(opName, 'ATTENDANCE_CHECK_OUT', 'ATTENDANCE', existing.id, `Operator ${opName} checked out on ${asset.assetTag}. Working hours: ${existing.workingHours} HM`);

      db.addNotification({
        id: `NTF-TS-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        sourceDepartment: 'Field Operations & Operators',
        sourceUserName: opName,
        title: `Shift Timesheet Completed: Unit ${asset.assetTag}`,
        message: `Operator ${opName} completed a work shift on ${asset.name} (${asset.assetTag}) at ${existing.projectName || asset.warehouseLocation}. Total operating hours: ${existing.workingHours} hours (HM ${existing.checkInHourMeter} to ${existing.checkOutHourMeter}). Data has been verified for the client's monthly billing attachment.`,
        category: 'OPERATIONAL',
        severity: 'SUCCESS',
        targetRoles: ['MANAGEMENT_OPERATION', 'FINANCE_ACCOUNTING_TAX', 'AR_MANAGEMENT', 'EXECUTIVE'],
        relatedEntity: 'TIMESHEET',
        relatedEntityId: existing.id,
        targetTab: 'operator-status',
        isRead: false,
      });

      return existing;
    } else {
      // Single punch checkout
      const logId = `ATT-${Date.now().toString().slice(-6)}`;
      const att: OperatorAttendanceLog = {
        id: logId,
        date: today,
        operatorId: 'OPR-01',
        operatorName: opName,
        operatorBadge: 'OPR-B-101',
        assetId: asset.id,
        assetTag: asset.assetTag,
        assetName: asset.name,
        checkInTime: '07:00:00',
        checkInHourMeter: Math.max(0, endHm - 8),
        checkOutTime: nowTime,
        checkOutHourMeter: endHm,
        workingHours: 8.0,
        status: 'CHECKED_OUT',
        notes: notes || 'Direct shift checkout recorded',
        verifiedForBilling: true,
      };
      db.getAttendanceLogs().unshift(att);

      db.addNotification({
        id: `NTF-TS-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        sourceDepartment: 'Field Operations & Operators',
        sourceUserName: opName,
        title: `Shift Timesheet Completed: Unit ${asset.assetTag}`,
        message: `Operator ${opName} checked out of unit ${asset.assetTag}. A total of 8.0 operating hours was recorded for the billing attachment.`,
        category: 'OPERATIONAL',
        severity: 'SUCCESS',
        targetRoles: ['MANAGEMENT_OPERATION', 'FINANCE_ACCOUNTING_TAX', 'AR_MANAGEMENT', 'EXECUTIVE'],
        relatedEntity: 'TIMESHEET',
        relatedEntityId: att.id,
        targetTab: 'operator-status',
        isRead: false,
      });

      return att;
    }
  });

  res.json(updatedLog);
});

apiRouter.patch('/operators/attendance/:id', (req: Request, res: Response) => {
  const log = db.getAttendanceLogs().find((a) => a.id === req.params.id);
  if (!log) return res.status(404).json({ error: 'Timesheet log not found.' });

  const { date, checkInTime, checkOutTime, checkInHourMeter, checkOutHourMeter, workingHours, notes, status, verifiedForBilling } = req.body;

  db.transaction(() => {
    if (date !== undefined) log.date = date;
    if (checkInTime !== undefined) log.checkInTime = checkInTime;
    if (checkOutTime !== undefined) log.checkOutTime = checkOutTime;
    if (checkInHourMeter !== undefined) log.checkInHourMeter = Number(checkInHourMeter);
    if (checkOutHourMeter !== undefined) log.checkOutHourMeter = Number(checkOutHourMeter);
    if (workingHours !== undefined) {
      log.workingHours = Number(workingHours);
    } else if (log.checkOutHourMeter && log.checkInHourMeter) {
      log.workingHours = Math.max(0, Number((log.checkOutHourMeter - log.checkInHourMeter).toFixed(1)));
    }
    if (notes !== undefined) log.notes = notes;
    if (status !== undefined) log.status = status;
    if (verifiedForBilling !== undefined) log.verifiedForBilling = verifiedForBilling;

    const user = actorName(req);
    db.logAudit(user, 'TIMESHEET_ADJUSTED', 'ATTENDANCE', log.id, `Adjusted timesheet summary for ${log.operatorName} on ${log.assetTag} (Date: ${log.date}, In: ${log.checkInTime}, Out: ${log.checkOutTime}, Hours: ${log.workingHours})`);

    db.addNotification({
      id: `NTF-ADJ-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      sourceDepartment: 'Field Operations (Timesheet)',
      sourceUserName: user,
      title: `Timesheet Adjustment: ${log.assetTag}`,
      message: `The timesheet for operator ${log.operatorName} on unit ${log.assetTag} (${log.date}) was adjusted by ${user}. Check-in: ${log.checkInTime}, Check-out: ${log.checkOutTime || '-'}, Total operating hours: ${log.workingHours} HM. Data is synchronized with Finance & Accounting.`,
      category: 'OPERATIONAL',
      severity: 'INFO',
      targetRoles: ['MANAGEMENT_OPERATION', 'FINANCE_ACCOUNTING_TAX', 'EXECUTIVE'],
      relatedEntity: 'TIMESHEET',
      relatedEntityId: log.id,
      targetTab: 'operator-status',
      isRead: false,
    });
  });

  res.json(log);
});

apiRouter.post('/operators/attendance/report-breakdown', (req: Request, res: Response) => {
  const { barcode, hourMeter, damageCategory, damageDescription, photoUrl, operatorName } = req.body;
  const asset = db.getAssets().find((a) =>
    a.assetTag.toLowerCase() === (barcode || '').trim().toLowerCase() ||
    a.serialNumber.toLowerCase() === (barcode || '').trim().toLowerCase()
  );

  if (!asset) {
    return res.status(404).json({ error: `No heavy equipment is registered with barcode "${barcode}".` });
  }

  const opName = actorName(req);

  const result = db.transaction(() => {
    const woNum = `WO-2026-${String(db.getWorkOrders().length + 1).padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().slice(0, 8);

    // Create Work Order with REPORTED status for Technical Service dashboard
    const wo: WorkOrder = {
      id: woNum,
      workOrderNumber: woNum,
      assetId: asset.id,
      assetTag: asset.assetTag,
      assetName: asset.name,
      title: `Field Damage: ${asset.name} (${damageCategory || 'General Issue'})`,
      description: damageDescription || 'The equipment breakdown cannot be handled by the field operator and requires Technical Service intervention.',
      priority: 'HIGH',
      type: 'FIELD_BREAKDOWN',
      assignedTechnician: 'Technical Service Team',
      scheduledDate: today,
      partsCost: 0,
      laborCost: 250,
      totalCost: 250,
      downtimeHours: 8,
      status: 'PENDING_APPROVAL',
      reportedByOperator: opName,
      damageCategory: damageCategory || 'GENERAL',
      photoUrl,
    };

    db.getWorkOrders().unshift(wo);

    // Transition Asset Status
    asset.condition = 'NEEDS_REPAIR';
    if (hourMeter && asset.legalDocs) {
      asset.legalDocs.hourMeter = Number(hourMeter);
    }

    // Record attendance log marked as breakdown
    const logId = `ATT-${Date.now().toString().slice(-6)}`;
    const att: OperatorAttendanceLog = {
      id: logId,
      date: today,
      operatorId: 'OPR-01',
      operatorName: opName,
      operatorBadge: 'OPR-B-101',
      assetId: asset.id,
      assetTag: asset.assetTag,
      assetName: asset.name,
      checkInTime: nowTime,
      checkInHourMeter: Number(hourMeter) || (asset.legalDocs?.hourMeter || 0),
      checkOutTime: nowTime,
      checkOutHourMeter: Number(hourMeter) || (asset.legalDocs?.hourMeter || 0),
      workingHours: 0,
      status: 'BREAKDOWN_REPORTED',
      breakdownReportId: woNum,
      notes: `Equipment damage report: ${damageDescription || 'Technical issue'} (Ticket: ${woNum})`,
      verifiedForBilling: false,
    };
    db.getAttendanceLogs().unshift(att);

    db.logAudit(
      opName,
      'BREAKDOWN_REPORTED',
      'WORK_ORDER',
      wo.id,
      `Operator ${opName} reported breakdown on ${asset.assetTag}. Work Order ${wo.workOrderNumber} created for Technical Service.`
    );

    return { workOrder: wo, attendanceLog: att, asset };
  });

  res.status(201).json(result);
});

// ==========================================
// 13. TECHNICAL SERVICE WORKFLOW & DASHBOARD
// ==========================================
apiRouter.get('/technical-service/dashboard', (_req: Request, res: Response) => {
  const workOrders = db.getWorkOrders();
  const products = db.getProducts();

  const pendingRequests = workOrders.filter((w) => w.status === 'REPORTED' || w.status === 'PENDING_APPROVAL' || w.status === 'SCHEDULED');
  const inProgressRepairs = workOrders.filter((w) => w.status === 'IN_PROGRESS');
  const completedRepairs = workOrders.filter((w) => w.status === 'COMPLETED');
  const availableSpareParts = products.filter((p) => p.isActive);

  res.json({
    pendingRequests,
    inProgressRepairs,
    completedRepairs,
    availableSpareParts,
    counts: {
      pending: pendingRequests.length,
      inProgress: inProgressRepairs.length,
      completed: completedRepairs.length,
    },
  });
});

apiRouter.post('/technical-service/scan-start', (req: Request, res: Response) => {
  const { barcode, workOrderId, technicianName } = req.body;
  const wo = db.getWorkOrders().find((w) =>
    (workOrderId && w.id === workOrderId) ||
    (barcode && (w.assetTag.toLowerCase() === barcode.trim().toLowerCase() && w.status !== 'COMPLETED'))
  );

  if (!wo) {
    return res.status(404).json({ error: `Repair ticket for barcode ${barcode || workOrderId} was not found.` });
  }
  if (wo.status === 'CANCELLED') {
    return res.status(409).json({ error: 'Cancelled work orders cannot be started by scanning.' });
  }

  const tech = actorName(req);

  db.transaction(() => {
    wo.status = 'IN_PROGRESS';
    wo.assignedTechnician = tech;
    wo.startedDate = new Date().toISOString();

    const asset = db.getAssets().find((a) => a.id === wo.assetId || a.assetTag === wo.assetTag);
    if (asset) {
      asset.status = 'IN_MAINTENANCE';
      asset.condition = 'NEEDS_REPAIR';
    }

    db.logAudit(tech, 'TECH_SCAN_START', 'WORK_ORDER', wo.id, `Technician ${tech} scanned barcode ${wo.assetTag} and started repair ${wo.workOrderNumber}`);
  });

  res.json(wo);
});

apiRouter.put('/technical-service/work-orders/:id', (req: Request, res: Response) => {
  const wo = db.getWorkOrders().find((w) => w.id === req.params.id);
  if (!wo) return res.status(404).json({ error: 'Work order not found.' });

  const { description, resolutionNotes, partsCost, laborCost, downtimeHours, sparePartsUsed } = req.body;

  db.transaction(() => {
    if (description !== undefined) wo.description = description;
    if (resolutionNotes !== undefined) wo.resolutionNotes = resolutionNotes;
    if (partsCost !== undefined) wo.partsCost = Number(partsCost) || 0;
    if (laborCost !== undefined) wo.laborCost = Number(laborCost) || 0;
    if (downtimeHours !== undefined) wo.downtimeHours = Number(downtimeHours) || 0;
    if (sparePartsUsed) {
      wo.sparePartsUsed = sparePartsUsed;
      // Recalculate total parts cost
      const calcParts = sparePartsUsed.reduce((sum: number, p: any) => sum + (Number(p.totalCost) || 0), 0);
      wo.partsCost = calcParts;
    }
    wo.totalCost = wo.partsCost + wo.laborCost;

    const tech = actorName(req);
    db.logAudit(tech, 'WORK_ORDER_EDITED', 'WORK_ORDER', wo.id, `Updated technical work order ${wo.workOrderNumber}: Parts ${formatRupiahAmount(wo.partsCost)}, Labor ${formatRupiahAmount(wo.laborCost)}`);
  });

  res.json(wo);
});

apiRouter.post('/technical-service/scan-complete', (req: Request, res: Response) => {
  const { barcode, workOrderId, resolutionNotes, partsCost, laborCost, sparePartsUsed, technicianName } = req.body;
  const wo = db.getWorkOrders().find((w) =>
    (workOrderId && w.id === workOrderId) ||
    (barcode && (w.assetTag.toLowerCase() === barcode.trim().toLowerCase() && w.status === 'IN_PROGRESS'))
  );

  if (!wo) {
    return res.status(404).json({ error: `In-progress repair ticket for barcode ${barcode || workOrderId} was not found.` });
  }

  const tech = actorName(req);

  db.transaction(() => {
    wo.status = 'COMPLETED';
    wo.completedDate = new Date().toISOString();
    wo.resolutionNotes = resolutionNotes || 'Repair completed. Normal operation was tested and equipment safety verified.';
    if (partsCost !== undefined) wo.partsCost = Number(partsCost) || wo.partsCost;
    if (laborCost !== undefined) wo.laborCost = Number(laborCost) || wo.laborCost;
    if (sparePartsUsed) {
      wo.sparePartsUsed = sparePartsUsed;
      // Decrement inventory stock on products
      sparePartsUsed.forEach((p: any) => {
        const prod = db.getProducts().find((pr) => pr.id === p.productId);
        if (prod && p.itemType !== 'SERVICE') {
          prod.stockQuantity = Math.max(0, prod.stockQuantity - (Number(p.quantity) || 1));
        }
      });
      const calcParts = sparePartsUsed.reduce((sum: number, p: any) => sum + (Number(p.totalCost) || 0), 0);
      wo.partsCost = calcParts;
    }
    wo.totalCost = wo.partsCost + wo.laborCost;

    // Restore Asset Condition & Status back to operational / available
    const asset = db.getAssets().find((a) => a.id === wo.assetId || a.assetTag === wo.assetTag);
    if (asset) {
      asset.status = 'AVAILABLE';
      asset.condition = 'EXCELLENT';
    }

    db.logAudit(tech, 'TECH_SCAN_COMPLETE', 'WORK_ORDER', wo.id, `Technician ${tech} finished repair on ${wo.assetTag}. Asset returned to AVAILABLE status. Total cost: ${formatRupiahAmount(wo.totalCost)}`);
  });

  res.json(wo);
});

// Standard Maintenance Work Orders (Legacy & Admin view)
apiRouter.get('/maintenance/work-orders', (_req: Request, res: Response) => {
  res.json({ data: db.getWorkOrders(), total: db.getWorkOrders().length });
});

apiRouter.post('/maintenance/work-orders', (req: Request, res: Response) => {
  try {
    const { assetId, title, description, priority, type, scheduledDate, assignedTechnician, partsCost, laborCost } = req.body;
    const asset = db.getAssets().find((a) => a.id === assetId || a.assetTag === assetId);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });

    const newWO = db.transaction(() => {
      const parts = Number(partsCost) || 0;
      const labor = Number(laborCost) || 0;
      const woNum = `WO-2026-${String(db.getWorkOrders().length + 1).padStart(3, '0')}`;

      const wo: WorkOrder = {
        id: woNum,
        workOrderNumber: woNum,
        assetId: asset.id,
        assetTag: asset.assetTag,
        assetName: asset.name,
        title: title || `Maintenance inspection: ${asset.name}`,
        description: description || 'Scheduled inspection and maintenance.',
        priority: priority || 'MEDIUM',
        type: type || 'PREVENTIVE',
        assignedTechnician: assignedTechnician || 'Senior Fleet Mechanic',
        scheduledDate: scheduledDate || new Date().toISOString().split('T')[0],
        partsCost: parts,
        laborCost: labor,
        totalCost: parts + labor,
        downtimeHours: 8,
        status: 'SCHEDULED',
      };

      db.getWorkOrders().unshift(wo);
      db.logAudit(actorName(req), 'WORK_ORDER_CREATED', 'WORK_ORDER', wo.id, `Created Work Order ${wo.workOrderNumber} for asset ${asset.assetTag}`);
      return wo;
    });

    res.status(201).json(newWO);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/maintenance/work-orders/:id/complete', (req: Request, res: Response) => {
  const { resolutionNotes } = req.body;
  const wo = db.getWorkOrders().find((w) => w.id === req.params.id);
  if (!wo) return res.status(404).json({ error: 'Work order not found' });
  if (wo.status === 'CANCELLED') {
    return res.status(409).json({ error: 'The work order must be approved by a Manager before it can be completed.' });
  }

  try {
    db.transaction(() => {
      wo.status = 'COMPLETED';
      wo.completedDate = new Date().toISOString().split('T')[0];
      wo.resolutionNotes = resolutionNotes || 'All checklist items verified and calibrated to manufacturer specs.';

      const asset = db.getAssets().find((a) => a.id === wo.assetId || a.assetTag === wo.assetTag);
      if (asset && asset.status === 'IN_MAINTENANCE') {
        asset.status = 'AVAILABLE';
        asset.condition = 'EXCELLENT';
      }

      db.logAudit(actorName(req), 'WORK_ORDER_COMPLETED', 'WORK_ORDER', wo.id, `Completed work order ${wo.workOrderNumber}. Asset returned to AVAILABLE status.`);
    });

    res.json(wo);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 12. OPERATIONAL & COMMERCIAL FINANCE REPORTS
// ==========================================
apiRouter.get('/reports/finance-dashboard', (_req: Request, res: Response) => {
  const invoices = db.getInvoices();
  const payments = db.getPayments();
  const rentals = db.getRentals();
  const salesOrders = db.getSalesOrders();
  const customers = db.getCustomers();
  const assets = db.getAssets();

  // Commercial revenue totals
  const totalInvoicedRevenue = invoices.reduce((acc, inv) => acc + (inv.status !== 'CANCELLED' && inv.type !== 'CREDIT_NOTE' ? inv.grandTotal : 0), 0);
  const totalCreditNotes = invoices.reduce((acc, inv) => acc + (inv.type === 'CREDIT_NOTE' ? Math.abs(inv.grandTotal) : 0), 0);
  const netInvoicedRevenue = totalInvoicedRevenue - totalCreditNotes;
  const totalCollectedPayments = payments.reduce((acc, p) => acc + (p.status === 'CONFIRMED' ? p.amount : 0), 0);
  const totalOutstandingAR = customers.reduce((acc, c) => acc + c.outstandingBalance, 0);

  // Overdue calculations
  const today = new Date().toISOString().split('T')[0];
  const overdueInvoices = invoices.filter((i) => i.status === 'ISSUED' && i.dueDate < today);
  const overdueAmount = overdueInvoices.reduce((acc, i) => acc + i.outstandingBalance, 0);

  // Rental utilization rate
  const operatingAssets = assets.filter((a) => !['PENDING_LABEL', 'SOLD', 'DISPOSED'].includes(a.status));
  const totalAssetsCount = operatingAssets.length;
  const rentedAssetsCount = operatingAssets.filter((a) => a.status === 'RENTED').length;
  const utilizationRate = totalAssetsCount > 0 ? (rentedAssetsCount / totalAssetsCount) * 100 : 0;

  // Breakdown by revenue stream
  const assetSaleRevenue = assets.reduce((acc, asset) => acc + (asset.disposition?.type === 'SALE' ? asset.disposition.proceeds : 0), 0);
  const assetSaleGainLoss = assets.reduce((acc, asset) => acc + (asset.disposition?.type === 'SALE' ? asset.disposition.gainLoss : 0), 0);
  const assetDisposalLoss = assets.reduce((acc, asset) => acc + (asset.disposition?.type === 'DISPOSAL' ? Math.abs(asset.disposition.gainLoss) : 0), 0);
  const annualDepreciationExpense = assets
    .filter((asset) => asset.status !== 'SOLD' && asset.status !== 'DISPOSED')
    .reduce((acc, asset) => acc + (asset.purchaseCost * (asset.depreciationRateAnnual / 100)), 0);
  const salesRevenue = salesOrders.reduce((acc, so) => acc + (so.status !== 'CANCELLED' ? so.grandTotal : 0), 0) + assetSaleRevenue;
  const rentalRevenue = rentals.reduce((acc, r) => acc + r.grandTotal, 0);

  res.json({
    metrics: {
      netInvoicedRevenue: Number(netInvoicedRevenue.toFixed(2)),
      totalCollectedPayments: Number(totalCollectedPayments.toFixed(2)),
      totalOutstandingAR: Number(totalOutstandingAR.toFixed(2)),
      overdueAmount: Number(overdueAmount.toFixed(2)),
      salesRevenue: Number(salesRevenue.toFixed(2)),
      assetSaleRevenue: Number(assetSaleRevenue.toFixed(2)),
      assetSaleGainLoss: Number(assetSaleGainLoss.toFixed(2)),
      assetDisposalLoss: Number(assetDisposalLoss.toFixed(2)),
      annualDepreciationExpense: Number(annualDepreciationExpense.toFixed(2)),
      rentalRevenue: Number(rentalRevenue.toFixed(2)),
      utilizationRate: Number(utilizationRate.toFixed(1)),
      activeRentalsCount: rentals.filter((r) => r.status === 'ACTIVE').length,
      availableAssetsCount: assets.filter((a) => a.status === 'AVAILABLE').length,
    },
    reportingDisclaimer: 'Operational billing & commercial profitability estimates. Does not represent statutory audited general ledger financial statements.',
  });
});

apiRouter.get('/reports/sales', (_req: Request, res: Response) => {
  const salesOrders = db.getSalesOrders();
  const byCustomer: Record<string, number> = {};
  salesOrders.forEach((so) => {
    byCustomer[so.customerName] = (byCustomer[so.customerName] || 0) + so.grandTotal;
  });

  res.json({
    totalSales: salesOrders.reduce((acc, so) => acc + so.grandTotal, 0),
    orderCount: salesOrders.length,
    salesByCustomer: Object.entries(byCustomer).map(([customer, total]) => ({ customer, total })),
  });
});

apiRouter.get('/reports/rentals', (_req: Request, res: Response) => {
  const rentals = db.getRentals();
  const totalRentalVolume = rentals.reduce((acc, r) => acc + r.grandTotal, 0);
  const securityDepositsHeld = rentals.filter((r) => r.depositStatus === 'HELD').reduce((acc, r) => acc + r.securityDeposit, 0);

  res.json({
    totalContracts: rentals.length,
    totalRentalVolume,
    securityDepositsHeld,
  });
});

apiRouter.get('/reports/accounts-receivable', (_req: Request, res: Response) => {
  const customers = db.getCustomers();
  const invoices = db.getInvoices().filter((i) => i.outstandingBalance > 0 && i.status !== 'CANCELLED');

  const agingBuckets = {
    current: 0, // 0-30 days
    days31to60: 0,
    days61to90: 0,
    over90: 0,
  };

  const today = new Date().getTime();
  invoices.forEach((inv) => {
    const dueTime = new Date(inv.dueDate).getTime();
    const daysDiff = Math.floor((today - dueTime) / (1000 * 3600 * 24));
    if (daysDiff <= 0) agingBuckets.current += inv.outstandingBalance;
    else if (daysDiff <= 30) agingBuckets.days31to60 += inv.outstandingBalance;
    else if (daysDiff <= 60) agingBuckets.days61to90 += inv.outstandingBalance;
    else agingBuckets.over90 += inv.outstandingBalance;
  });

  res.json({
    totalOutstanding: customers.reduce((acc, c) => acc + c.outstandingBalance, 0),
    agingBuckets,
    openInvoicesCount: invoices.length,
  });
});

apiRouter.get('/reports/asset-profitability', (_req: Request, res: Response) => {
  const assets = db.getAssets();
  const rentals = db.getRentals();
  const workOrders = db.getWorkOrders();

  const assetProfitability = assets.map((asset) => {
    // Calculate total rental revenue generated by this asset
    let generatedRevenue = 0;
    rentals.forEach((r) => {
      const match = r.items.find((item) => item.assetId === asset.id || item.assetTag === asset.assetTag);
      if (match) generatedRevenue += match.lineSubtotal;
    });

    // Calculate maintenance costs
    let maintenanceCost = 0;
    workOrders.forEach((wo) => {
      if (wo.assetId === asset.id || wo.assetTag === asset.assetTag) {
        maintenanceCost += wo.totalCost;
      }
    });

    const netOperationalProfit = generatedRevenue - maintenanceCost;
    const roiPercent = asset.purchaseCost > 0 ? (netOperationalProfit / asset.purchaseCost) * 100 : 0;

    return {
      assetTag: asset.assetTag,
      name: asset.name,
      category: asset.category,
      purchaseCost: asset.purchaseCost,
      generatedRevenue: Number(generatedRevenue.toFixed(2)),
      maintenanceCost: Number(maintenanceCost.toFixed(2)),
      netOperationalProfit: Number(netOperationalProfit.toFixed(2)),
      roiPercent: Number(roiPercent.toFixed(1)),
      status: asset.status,
    };
  });

  res.json({ assetProfitability });
});

// ==========================================
// 13. AUDIT LOGS & SETTINGS
// ==========================================
apiRouter.get('/audit-logs', (_req: Request, res: Response) => {
  res.json({ data: db.getAuditLogs(), total: db.getAuditLogs().length });
});

apiRouter.get('/settings', (_req: Request, res: Response) => {
  res.json(db.getSettings());
});

apiRouter.patch('/settings', (req: Request, res: Response) => {
  db.transaction(() => {
    const current = db.getSettings() as Record<string, any>;
    const incoming = req.body || {};
    // Hanya kunci yang memang ada di pengaturan yang boleh diubah (cegah mass-assignment).
    for (const k of Object.keys(incoming)) {
      if (k in current && k !== 'defaultCurrency') current[k] = incoming[k];
    }
    current.defaultCurrency = 'IDR';
    db.logAudit(actorName(req), 'SETTINGS_UPDATED', 'SYSTEM_SETTINGS', 'GLOBAL', 'Updated enterprise system settings');
  });
  res.json(db.getSettings());
});

// ==========================================
// 14. DATA RECOVERY, BACKUP & DEMO RESET
// ==========================================
apiRouter.post('/system/reset-demo', (req: Request, res: Response) => {
  if (IS_PROD && process.env.ALLOW_DEMO_RESET !== 'true') {
    return res.status(403).json({ error: 'Demo data reset is disabled in production (set ALLOW_DEMO_RESET=true to enable it).' });
  }
  db.logAudit(actorName(req), 'DEMO_RESET', 'SYSTEM', 'RESET', 'Database reset to demo data');
  const keptUsers = db.getUsers(); // reset hanya untuk data bisnis; akun & password dipertahankan
  const resetState = db.resetToDefault();
  resetState.users = keptUsers;
  db.save();
  res.json({ message: 'Database reset to clean factory demo state', state: { ...resetState, users: resetState.users.map(publicUser) } });
});


const ADMIN_DATA_TABLES = [
  'users', 'assets', 'products', 'customers', 'quotations', 'salesOrders', 'rentals', 'deliveries',
  'invoices', 'payments', 'vendors', 'purchaseOrders', 'vendorBills', 'workOrders',
  'operators', 'statusLogs', 'attendanceLogs', 'notifications', 'drafts', 'auditLogs',
] as const;
type AdminDataTable = typeof ADMIN_DATA_TABLES[number];
const requireItAdmin = (req: Request, res: Response): boolean => {
  const user = actorUser(req);
  if (!user || user.role !== 'ADMIN_IT') {
    res.status(403).json({ error: 'This operation is restricted to IT Administrator.' });
    return false;
  }
  return true;
};

apiRouter.get('/system/data-tables', (req: Request, res: Response) => {
  if (!requireItAdmin(req, res)) return;
  const state = db.getState();
  res.json({ data: ADMIN_DATA_TABLES.map((key) => ({ key, count: Array.isArray(state[key]) ? state[key].length : 0 })) });
});

apiRouter.get('/system/export-tables', (req: Request, res: Response) => {
  if (!requireItAdmin(req, res)) return;
  const requested = String(req.query.tables || '').split(',').filter(Boolean);
  if (!requested.length || requested.some((key) => !ADMIN_DATA_TABLES.includes(key as AdminDataTable))) {
    return res.status(400).json({ error: 'Choose one or more valid table names to export.' });
  }
  const state = db.getState();
  const tables: Record<string, unknown[]> = {};
  requested.forEach((key) => { tables[key] = key === 'users' ? state.users.map(publicUser) : [...(state[key as AdminDataTable] as unknown[])]; });
  db.logAudit(actorName(req), 'SELECTIVE_DATA_EXPORT', 'SYSTEM', 'EXPORT', `Exported tables: ${requested.join(', ')}`);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="eams_tables_${new Date().toISOString().slice(0, 10)}.json"`);
  res.send(JSON.stringify({ format: 'EAMS_TABLE_EXPORT', version: 1, exportedAt: new Date().toISOString(), tables }, null, 2));
});

apiRouter.post('/system/import-tables', (req: Request, res: Response) => {
  if (!requireItAdmin(req, res)) return;
  const payload = req.body;
  const tables = payload?.tables && typeof payload.tables === 'object' ? payload.tables : null;
  if (!tables || Array.isArray(tables)) return res.status(400).json({ error: 'Expected an EAMS table export object with a tables property.' });
  const keys = Object.keys(tables);
  if (!keys.length || keys.some((key) => !ADMIN_DATA_TABLES.includes(key as AdminDataTable))) {
    return res.status(400).json({ error: 'Import contains an unknown or empty table selection.' });
  }
  if (keys.some((key) => !Array.isArray(tables[key]))) return res.status(400).json({ error: 'Every imported table must be a JSON array.' });
  try {
    db.transaction(() => {
      const state = db.getState();
      keys.forEach((key) => {
        if (key === 'users') {
          const importedUsers = tables.users as Array<Record<string, unknown>>;
          for (const incoming of importedUsers) {
            const existing = state.users.find((user) => user.id === incoming.id || user.email.toLowerCase() === String(incoming.email || '').toLowerCase());
            if (existing) {
              const passwordHash = (existing as any).passwordHash;
              const password = (existing as any).password;
              Object.assign(existing, incoming);
              if (passwordHash !== undefined) (existing as any).passwordHash = passwordHash;
              if (password !== undefined) (existing as any).password = password;
            }
          }
        } else { (state as any)[key] = tables[key]; }
      });
      db.logAudit(actorName(req), 'SELECTIVE_DATA_IMPORT', 'SYSTEM', 'IMPORT', `Imported tables: ${keys.join(', ')}`);
    });
    res.json({ message: 'Selected table data imported. User credentials and system settings were not changed.', importedTables: keys });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Import failed.' });
  }
});

apiRouter.post('/system/clear-business-data', (req: Request, res: Response) => {
  if (!requireItAdmin(req, res)) return;
  if (IS_PROD && process.env.ALLOW_DEMO_RESET !== 'true') {
    return res.status(403).json({ error: 'Data clearing is disabled in production. Set ALLOW_DEMO_RESET=true only for a controlled test environment.' });
  }
  const state = db.getState();
  const preserveUsers = state.users;
  const preserveSettings = state.settings;
  db.transaction(() => {
    state.assets = []; state.products = []; state.customers = []; state.quotations = []; state.salesOrders = [];
    state.rentals = []; state.deliveries = []; state.invoices = []; state.payments = []; state.vendors = [];
    state.purchaseOrders = []; state.vendorBills = []; state.workOrders = []; state.operators = [];
    state.statusLogs = []; state.attendanceLogs = []; state.notifications = []; state.drafts = [];
    state.users = preserveUsers; state.settings = preserveSettings;
    state.auditLogs = [];
    db.logAudit(actorName(req), 'BUSINESS_DATA_CLEARED', 'SYSTEM', 'CLEAR', 'Cleared operational data while preserving user credentials and system settings');
  });
  res.json({ message: 'Operational/business data cleared. User accounts, password credentials, and system settings were preserved.' });
});

apiRouter.get('/system/backup', (req: Request, res: Response) => {
  // Backup TIDAK memuat hash password / data kredensial.
  const state = db.getState();
  const safe = { ...state, users: state.users.map(publicUser) };
  db.logAudit(actorName(req), 'BACKUP_DOWNLOADED', 'SYSTEM', 'BACKUP', 'Downloaded database backup');
  db.save();
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="apex_eams_backup_${new Date().toISOString().split('T')[0]}.json"`);
  res.send(JSON.stringify(safe, null, 2));
});

apiRouter.post('/system/restore', (req: Request, res: Response) => {
  try {
    const backupState = req.body;
    const required = ['assets', 'customers', 'products'];
    if (!backupState || required.some((k) => !Array.isArray(backupState[k]))) {
      return res.status(400).json({ error: 'Invalid backup file structure.' });
    }
    db.transaction(() => {
      const { users: _ignored, ...rest } = backupState; // akun & password TIDAK ditimpa oleh restore
      Object.assign(db.getState(), rest);
      db.logAudit(actorName(req), 'DATABASE_RESTORED', 'SYSTEM', 'RESTORE', 'Database restored from backup archive');
    });
    res.json({ message: 'Database restored from backup successfully (user accounts were not changed).' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});
