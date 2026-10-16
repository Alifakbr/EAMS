import express, { Request, Response, NextFunction } from 'express';
import { db, calculateLineTotals, toCents, fromCents } from './db.ts';
import { openApiSpec } from './openapi.ts';
import { runEamsTestSuite } from './tests.ts';
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

// Strict Role-Based Access Control Middleware
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req.headers['x-user-role'] as UserRole) || 'EXECUTIVE';
    // Admin IT has superuser access across all modules
    if (userRole === 'ADMIN_IT' || allowedRoles.includes(userRole)) {
      return next();
    }
    return res.status(403).json({
      error: `Akses Ditolak (403 Forbidden): Peran "${userRole}" tidak memiliki hak otorisasi untuk operasi atau modul ini.`,
    });
  };
};

// Test suite endpoint
apiRouter.get('/system/run-tests', (_req: Request, res: Response) => {
  const summary = runEamsTestSuite();
  res.json(summary);
});

// ==========================================
// AUTHENTICATION & USERS
// ==========================================
apiRouter.get('/auth/users', (_req: Request, res: Response) => {
  res.json({ data: db.getUsers(), total: db.getUsers().length });
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password, role } = req.body;
  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Email address is required / Alamat email diperlukan.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  let user = db.getUsers().find((u) => u.email.toLowerCase() === cleanEmail);

  if (user) {
    // If role is explicitly chosen, verify or switch to that role
    if (role && user.role !== role) {
      // User can switch or login into requested authorized role
      user.role = role;
    }
  } else {
    // If user is a new employee or client registering
    const nameFromEmail = cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
    const roleDepartments: Record<string, string> = {
      EXECUTIVE: 'Executive Leadership (Direktur Utama)',
      ADMIN_IT: 'IT Systems & Infrastructure (Admin IT)',
      SALES_MARKETING: 'Commercial Sales & Marketing Support',
      ASSET_CONTROL: 'Asset Control & Heavy Equipment Legal Docs',
      MANAGEMENT_OPERATION: 'Field Operation & Operator/SIO Management',
      PROCUREMENT: 'Procurement & Purchasing',
      FINANCE_ACCOUNTING_TAX: 'Accounting, Finance & Tax (FAT)',
      AR_MANAGEMENT: 'Accounts Receivable (AR) Management',
    };
    const resolvedRole = role || 'SALES_MARKETING';
    user = {
      id: `USR-${Date.now().toString().slice(-4)}`,
      name: nameFromEmail || 'Enterprise User',
      email: cleanEmail,
      role: resolvedRole,
      department: roleDepartments[resolvedRole] || 'Commercial Operations',
    };
    db.getUsers().push(user);
  }

  db.logAudit(user.name, 'USER_LOGIN', 'USER', user.id, `User ${user.name} (${user.email}) logged in with role ${user.role}`);

  const token = `token-${user.id}-${Date.now()}`;
  res.json({
    message: 'Login successful / Login berhasil',
    user,
    token,
  });
});

apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  const userName = (req.headers['x-user-name'] as string) || 'User';
  db.logAudit(userName, 'USER_LOGOUT', 'USER', 'SESSION', `User ${userName} logged out`);
  res.json({ message: 'Logged out successfully' });
});

// IT User Management Routes
apiRouter.post('/auth/users', (req: Request, res: Response) => {
  const { name, email, role, department, employeeBadge, assignedBranch, phone, permissions } = req.body;
  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Nama, email, dan peran (role) wajib diisi' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const existing = db.getUsers().find((u) => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    return res.status(400).json({ error: `Pengguna dengan email ${cleanEmail} sudah terdaftar` });
  }

  const newUser = {
    id: `USR-${Date.now().toString().slice(-4)}`,
    name,
    email: cleanEmail,
    role,
    department: department || 'Operasional Perusahaan',
    employeeBadge: employeeBadge || `EMP-${Date.now().toString().slice(-3)}`,
    assignedBranch: assignedBranch || 'Kantor Pusat Jakarta',
    phone: phone || '',
    status: 'ACTIVE' as const,
    permissions: permissions || {},
  };

  db.getUsers().push(newUser);
  const operatorName = (req.headers['x-user-name'] as string) || 'IT Admin';
  db.logAudit(operatorName, 'USER_CREATED', 'USER', newUser.id, `Created user ${newUser.name} with role ${newUser.role} by IT Admin`);
  db.save();

  res.status(201).json(newUser);
});

apiRouter.put('/auth/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = db.getUsers().findIndex((u) => u.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
  }

  const updatedUser = {
    ...db.getUsers()[index],
    ...req.body,
  };

  db.getUsers()[index] = updatedUser;
  const operatorName = (req.headers['x-user-name'] as string) || 'IT Admin';
  db.logAudit(operatorName, 'USER_UPDATED', 'USER', id, `Updated user ${updatedUser.name} (${updatedUser.role}) permissions & profile`);
  db.save();

  res.json(updatedUser);
});

apiRouter.post('/auth/users/:id/reset-password', (req: Request, res: Response) => {
  const { id } = req.params;
  const { customPassword, forcePasswordChange } = req.body || {};
  const user = db.getUsers().find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
  }

  const temporaryPassword = customPassword && customPassword.trim().length >= 6
    ? customPassword.trim()
    : `ApexPass#${Math.floor(1000 + Math.random() * 9000)}`;

  const operatorName = (req.headers['x-user-name'] as string) || 'IT Admin';
  db.logAudit(operatorName, 'PASSWORD_RESET', 'USER', id, `Password reset issued for user ${user.name} (${user.email}). Temporary password generated.`);

  db.addNotification({
    id: `NTF-${Date.now().toString().slice(-6)}`,
    timestamp: new Date().toISOString(),
    sourceDepartment: 'Divisi IT & Keamanan Sistem',
    sourceUserName: operatorName,
    title: `Reset Kredensial: ${user.name}`,
    message: `Password akun untuk ${user.name} (${user.email} · ${user.department}) berhasil di-reset oleh Administrator IT. Kredensial baru telah diterbitkan.`,
    category: 'SYSTEM',
    severity: 'INFO',
    relatedEntity: 'USER',
    relatedEntityId: user.id,
    targetTab: 'user-management',
    isRead: false,
  });

  db.save();

  res.json({
    message: `Password untuk ${user.name} berhasil di-reset oleh Divisi IT.`,
    temporaryPassword,
    forcePasswordChange: !!forcePasswordChange,
    userEmail: user.email,
    userName: user.name,
    resetAt: new Date().toISOString(),
  });
});

// Notifications Endpoints
apiRouter.get('/notifications', (req: Request, res: Response) => {
  const all = db.getNotifications();
  const unreadCount = all.filter((n) => !n.isRead).length;
  res.json({
    data: all,
    total: all.length,
    unreadCount,
  });
});

apiRouter.put('/notifications/:id/read', (req: Request, res: Response) => {
  const { id } = req.params;
  const list = db.getNotifications();
  const item = list.find((n) => n.id === id);
  if (item) {
    item.isRead = true;
    db.save();
    return res.json(item);
  }
  res.status(404).json({ error: 'Notification not found' });
});

apiRouter.post('/notifications/mark-all-read', (_req: Request, res: Response) => {
  const list = db.getNotifications();
  list.forEach((n) => { n.isRead = true; });
  db.save();
  res.json({ message: 'Semua notifikasi ditandai telah dibaca.' });
});

apiRouter.delete('/auth/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = db.getUsers().findIndex((u) => u.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
  }

  const user = db.getUsers()[index];
  user.status = 'INACTIVE';
  const operatorName = (req.headers['x-user-name'] as string) || 'IT Admin';
  db.logAudit(operatorName, 'USER_DEACTIVATED', 'USER', id, `Deactivated user ${user.name}`);
  db.save();

  res.json({ message: `Pengguna ${user.name} berhasil dinonaktifkan` });
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
    return res.status(400).json({ error: 'Nama operator dan nomor SIO wajib diisi' });
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
        currency: 'USD',
        status: 'ACTIVE',
        notes: notes || '',
        createdAt: new Date().toISOString(),
      };
      db.getCustomers().push(customer);
      db.logAudit(req.headers['x-user-name'] as string || 'Admin', 'CUSTOMER_CREATED', 'CUSTOMER', customer.id, `Created customer ${customer.name}`);
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
    db.logAudit(req.headers['x-user-name'] as string || 'Admin', 'CUSTOMER_UPDATED', 'CUSTOMER', customer.id, `Updated customer ${customer.name}`);
  });

  res.json(customer);
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
      db.logAudit(req.headers['x-user-name'] as string || 'Admin', 'PRODUCT_CREATED', 'PRODUCT', product.id, `Created product SKU ${product.sku}`);
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
    db.logAudit(req.headers['x-user-name'] as string || 'Admin', 'PRODUCT_UPDATED', 'PRODUCT', prod.id, `Updated product SKU ${prod.sku}`);
  });

  res.json(prod);
});

// ==========================================
// 3. ASSET REGISTRY (COMPANY & COMMERCIAL)
// ==========================================
apiRouter.get('/assets', (req: Request, res: Response) => {
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

  res.json({ data: assets, total: assets.length });
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
      warehouseLocation,
      specs,
      legalDocs,
    } = req.body;
    if (!assetTag || !serialNumber || !name) {
      return res.status(400).json({ error: 'Asset tag, serial number, and name are required' });
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
        warehouseLocation: warehouseLocation || 'Jakarta Central Depot',
        purchaseCost: Number(purchaseCost) || 0,
        currentBookValue: Number(purchaseCost) || 0,
        depreciationRateAnnual: 10,
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
      db.logAudit(req.headers['x-user-name'] as string || 'Admin', 'ASSET_CREATED', 'ASSET', asset.id, `Created asset ${asset.assetTag} (${asset.name}) with centralized legal docs`);
      return asset;
    });

    res.status(201).json(newAsset);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.patch('/assets/:id', (req: Request, res: Response) => {
  const asset = db.getAssets().find((a) => a.id === req.params.id);
  if (!asset) return res.status(404).json({ error: 'Asset not found' });

  db.transaction(() => {
    Object.assign(asset, req.body);
    db.logAudit(req.headers['x-user-name'] as string || 'Admin', 'ASSET_UPDATED', 'ASSET', asset.id, `Updated asset ${asset.assetTag}`);
  });

  res.json(asset);
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
    return res.status(404).json({ error: `Alat berat dengan barcode/tag ${req.params.barcode} tidak ditemukan` });
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
  if (!asset) return res.status(404).json({ error: 'Asset tidak ditemukan' });

  db.transaction(() => {
    asset.legalDocs = {
      ...(asset.legalDocs || {}),
      ...req.body,
    };
    const operatorName = (req.headers['x-user-name'] as string) || 'Asset Control';
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
    return res.status(400).json({ error: 'Asset tag dan status alat wajib diisi' });
  }

  const asset = db.getAssets().find((a) => a.assetTag.toLowerCase() === assetTag.trim().toLowerCase());
  if (!asset) {
    return res.status(404).json({ error: `Alat berat ${assetTag} tidak terdaftar di sistem` });
  }

  const result = db.transaction(() => {
    const submitter = operatorName || (req.headers['x-user-name'] as string) || 'Operator Lapangan';
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
        title: `Laporan Kerusakan Lapangan: ${asset.name} (${damageCategory || 'General Issue'})`,
        description: `Dilaporkan oleh operator ${submitter} di ${location || 'Lokasi Proyek'}: ${damageDescription || 'Kerusakan terdeteksi saat inspeksi harian'}. HM: ${hourMeter || 'N/A'}.`,
        priority: resolvedPriority,
        type: 'CORRECTIVE',
        assignedTechnician: 'Field Mechanic on Duty',
        scheduledDate: new Date().toISOString().split('T')[0],
        partsCost: 0,
        laborCost: 350,
        totalCost: 350,
        downtimeHours: damageSeverity === 'CRITICAL_SHUTDOWN' ? 48 : 12,
        status: 'SCHEDULED',
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
    const { customerId, items, validUntil, termsAndConditions, notes, salespersonName } = req.body;
    const customer = db.getCustomers().find((c) => c.id === customerId);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    if (!items || !items.length) return res.status(400).json({ error: 'Quotation must have at least one line item' });

    const newQuotation = db.transaction(() => {
      let subtotalCents = 0;
      let taxTotalCents = 0;
      let discountTotalCents = 0;
      let mobTotalCents = 0;
      let demobTotalCents = 0;

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
        status: 'PENDING_APPROVAL',
        items: quotationItems,
        subtotal: fromCents(subtotalCents),
        discountTotal: fromCents(discountTotalCents),
        taxTotal: fromCents(taxTotalCents),
        mobilizationTotal: fromCents(mobTotalCents),
        demobilizationTotal: fromCents(demobTotalCents),
        grandTotal: fromCents(grandTotalCents),
        notes: notes || '',
        termsAndConditions: termsAndConditions || 'Standard commercial terms Net 30 days. Valid for 30 calendar days.',
      };

      db.getQuotations().unshift(quotation);
      db.logAudit(req.headers['x-user-name'] as string || 'Admin', 'QUOTATION_CREATED', 'QUOTATION', quotation.id, `Created quotation ${quotation.quotationNumber} for ${customer.name}`);

      db.addNotification({
        id: `NTF-QUO-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        sourceDepartment: 'Divisi Sales & Marketing',
        sourceUserName: (req.headers['x-user-name'] as string) || 'Sales Lead',
        title: `Penawaran Dibuat: ${quotation.quotationNumber}`,
        message: `Proposal penawaran harga resmi ${quotation.quotationNumber} untuk ${customer.name} senilai $${quotation.grandTotal.toLocaleString()} telah dibuat dan menunggu persetujuan (Status: ${quotation.status}).`,
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
    quote.approvedBy = (req.headers['x-user-name'] as string) || 'Executive Sales Director';
    quote.approvalDate = new Date().toISOString();
    db.logAudit(quote.approvedBy, 'QUOTATION_APPROVED', 'QUOTATION', quote.id, `Approved quotation ${quote.quotationNumber}`);

    db.addNotification({
      id: `NTF-QUO-APP-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      sourceDepartment: 'Direksi Eksekutif & Sales Lead',
      sourceUserName: quote.approvedBy,
      title: `Penawaran Disetujui: ${quote.quotationNumber}`,
      message: `Penawaran resmi ${quote.quotationNumber} untuk ${quote.customerName} telah disetujui oleh ${quote.approvedBy}. Menunggu penerimaan / konversi pesanan dari klien.`,
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
    db.logAudit((req.headers['x-user-name'] as string) || 'Admin', 'QUOTATION_ACCEPTED', 'QUOTATION', quote.id, `Customer accepted quotation ${quote.quotationNumber}`);
  });

  res.json(quote);
});

apiRouter.post('/quotations/:id/convert-to-order', (req: Request, res: Response) => {
  const quote = db.getQuotations().find((q) => q.id === req.params.id);
  if (!quote) return res.status(404).json({ error: 'Quotation not found' });

  try {
    const order = db.transaction(() => {
      // Validate customer
      const customer = db.getCustomers().find((c) => c.id === quote.customerId);
      if (!customer) throw new Error('Customer does not exist');

      // Check credit limit
      if (customer.outstandingBalance + quote.grandTotal > customer.creditLimit * 1.2) {
        throw new Error(`Customer credit limit of $${customer.creditLimit.toLocaleString()} exceeded. Please obtain credit override.`);
      }

      // Check serialized assets availability
      quote.items.forEach((item) => {
        if (item.assignedAssetId) {
          const asset = db.getAssets().find((a) => a.id === item.assignedAssetId);
          if (asset && asset.status !== 'AVAILABLE' && asset.status !== 'RESERVED') {
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
        customerId: customer.id,
        customerName: customer.name,
        customerPoReference: req.body.customerPoReference || `PO-${customer.customerCode}-${Date.now().toString().slice(-4)}`,
        orderDate: new Date().toISOString().split('T')[0],
        targetDeliveryDate: req.body.targetDeliveryDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        deliveryAddress: customer.deliveryAddress,
        status: 'CONFIRMED',
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
      };

      quote.status = 'CONVERTED';
      quote.convertedSalesOrderId = salesOrder.id;
      quote.linkedSalesOrderNumber = salesOrder.orderNumber;

      db.getSalesOrders().unshift(salesOrder);
      db.logAudit((req.headers['x-user-name'] as string) || 'Admin', 'SALES_ORDER_CONVERTED', 'SALES_ORDER', salesOrder.id, `Converted Quote ${quote.quotationNumber} to Sales Order ${salesOrder.orderNumber}`);

      db.addNotification({
        id: `NTF-SO-CONV-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        sourceDepartment: 'Divisi Sales & Marketing',
        sourceUserName: (req.headers['x-user-name'] as string) || 'Sales Lead',
        title: `Quotation Dikonversi: ${salesOrder.orderNumber}`,
        message: `Penawaran ${quote.quotationNumber} untuk ${customer.name} berhasil disetujui & dikonversi menjadi Sales Order ${salesOrder.orderNumber} senilai $${salesOrder.grandTotal.toLocaleString()}. Tim Gudang & Asset Control dipersiapkan untuk mobilisasi unit.`,
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
apiRouter.get('/sales-orders', (req: Request, res: Response) => {
  const orders = db.getSalesOrders();
  res.json({ data: orders, total: orders.length });
});

apiRouter.post('/sales-orders', (req: Request, res: Response) => {
  try {
    const { customerId, items, customerPoReference, targetDeliveryDate, shippingFee } = req.body;
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
        orderDate: new Date().toISOString().split('T')[0],
        targetDeliveryDate: targetDeliveryDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        deliveryAddress: customer.deliveryAddress,
        status: 'CONFIRMED',
        items: orderItems,
        subtotal: fromCents(subtotalCents),
        discountTotal: fromCents(discountTotalCents),
        taxTotal: fromCents(taxTotalCents),
        shippingFee: shipFee,
        grandTotal: fromCents(grandTotalCents),
        invoicedAmount: 0,
        paidAmount: 0,
      };

      db.getSalesOrders().unshift(order);
      db.logAudit((req.headers['x-user-name'] as string) || 'Admin', 'SALES_ORDER_CREATED', 'SALES_ORDER', order.id, `Created Direct Sales Order ${order.orderNumber}`);
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
      db.logAudit((req.headers['x-user-name'] as string) || 'Admin', 'SALES_ORDER_CANCELLED', 'SALES_ORDER', order.id, `Cancelled ${order.orderNumber}. Reason: ${reason}`);
    });

    res.json(order);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

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

        // Check if asset already rented or reserved for overlapping period
        if (asset.status === 'RENTED' || asset.status === 'SOLD' || asset.status === 'IN_MAINTENANCE') {
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
        asset.status = 'RENTED';
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
        status: 'ACTIVE',
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
      db.logAudit((req.headers['x-user-name'] as string) || 'Admin', 'RENTAL_CONTRACT_CREATED', 'RENTAL_CONTRACT', contract.id, `Created rental agreement ${contract.contractNumber} with ${rentalItems.length} assets`);
      return contract;
    });

    res.status(201).json(newContract);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/rentals/:id/extend', (req: Request, res: Response) => {
  const { newReturnDate, additionalAmount } = req.body;
  if (!newReturnDate) return res.status(400).json({ error: 'New return date is required' });

  const contract = db.getRentals().find((r) => r.id === req.params.id);
  if (!contract) return res.status(404).json({ error: 'Rental contract not found' });

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

      db.logAudit((req.headers['x-user-name'] as string) || 'Admin', 'RENTAL_EXTENDED', 'RENTAL_CONTRACT', contract.id, `Extended contract ${contract.contractNumber} to ${newReturnDate}`);
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

  try {
    db.transaction(() => {
      const today = new Date().toISOString().split('T')[0];
      contract.actualReturnDate = today;

      // Calculate late fees if overdue
      const expDate = new Date(contract.expectedReturnDate);
      const actDate = new Date(today);
      if (actDate > expDate) {
        const diffDays = Math.ceil((actDate.getTime() - expDate.getTime()) / (1000 * 3600 * 24));
        contract.lateReturnFee = diffDays * 150; // $150 per day late fee
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
                status: 'SCHEDULED',
              });
            } else {
              asset.status = 'AVAILABLE';
              asset.condition = returnCondition || 'GOOD';
            }
          }
        }
      });

      contract.status = 'SETTLED';
      db.logAudit((req.headers['x-user-name'] as string) || 'Admin', 'RENTAL_RETURN_SETTLED', 'RENTAL_CONTRACT', contract.id, `Settled return for ${contract.contractNumber}. Damage fee: $${damage}, Late fee: $${contract.lateReturnFee}`);
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
      status: 'IN_TRANSIT',
      driverName: driverName || 'Apex Fleet Logistics',
      trackingNumber: trackingNumber || `TRK-${Date.now().toString().slice(-6)}`,
      items,
      conditionNotes: conditionNotes || 'Asset dispatched in verified operating condition with QA checklist.',
    };

    db.getDeliveries().unshift(newDelivery);
    db.logAudit((req.headers['x-user-name'] as string) || 'Admin', 'DELIVERY_DISPATCHED', 'DELIVERY', newDelivery.id, `Dispatched delivery ${newDelivery.deliveryNumber} for ${customerName}`);
    res.status(201).json(newDelivery);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/deliveries/:id/confirm', (req: Request, res: Response) => {
  const { digitalSignature, acceptedBy, conditionNotes } = req.body;
  const delivery = db.getDeliveries().find((d) => d.id === req.params.id);
  if (!delivery) return res.status(404).json({ error: 'Delivery order not found' });

  try {
    db.transaction(() => {
      delivery.status = 'CUSTOMER_ACCEPTED';
      delivery.actualDeliveryDate = new Date().toISOString();
      delivery.digitalSignature = digitalSignature || 'Digital Acceptance on File';
      delivery.acceptedBy = acceptedBy || delivery.recipientName;
      if (conditionNotes) delivery.conditionNotes = conditionNotes;

      // If this was a sales order delivery, transition serialized assets to SOLD
      if (delivery.sourceType === 'SALES_ORDER') {
        const order = db.getSalesOrders().find((o) => o.id === delivery.sourceReferenceId);
        if (order) {
          order.status = 'DELIVERED';
          delivery.items.forEach((item) => {
            if (item.assetTag) {
              const asset = db.getAssets().find((a) => a.assetTag === item.assetTag || a.id === item.assetTag);
              if (asset) {
                asset.status = 'SOLD';
                asset.currentBookValue = 0;
                asset.currentCustomerId = delivery.customerId;
                asset.currentCustomerName = delivery.customerName;
                asset.notes = `Sold and ownership transferred via Delivery ${delivery.deliveryNumber} on ${new Date().toISOString().split('T')[0]}`;
              }
            }
          });
        }
      }

      db.logAudit((req.headers['x-user-name'] as string) || 'Admin', 'DELIVERY_CONFIRMED', 'DELIVERY', delivery.id, `Confirmed handover for ${delivery.deliveryNumber} signed by ${delivery.acceptedBy}`);
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
        currency: 'USD',
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
      db.logAudit((req.headers['x-user-name'] as string) || 'Admin', 'INVOICE_CREATED', 'INVOICE', invoice.id, `Created draft invoice ${invoice.invoiceNumber} for ${customer.name}`);
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
  if (invoice.status !== 'DRAFT' && invoice.status !== 'PENDING_APPROVAL') {
    return res.status(400).json({ error: `Invoice cannot be issued in status ${invoice.status}` });
  }

  try {
    db.transaction(() => {
      invoice.status = 'ISSUED';
      const customer = db.getCustomers().find((c) => c.id === invoice.customerId);
      if (customer) {
        // Increase customer outstanding balance decimal-safely
        customer.outstandingBalance = fromCents(toCents(customer.outstandingBalance) + toCents(invoice.grandTotal));
      }
      db.logAudit((req.headers['x-user-name'] as string) || 'Admin', 'INVOICE_ISSUED', 'INVOICE', invoice.id, `Issued invoice ${invoice.invoiceNumber}. Balance updated.`);
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
        throw new Error(`Credit amount must be between $0.01 and current balance ($${invoice.outstandingBalance})`);
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
        currency: 'USD',
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
      db.logAudit((req.headers['x-user-name'] as string) || 'Admin', 'CREDIT_NOTE_CREATED', 'INVOICE', cn.id, `Created credit note ${cn.invoiceNumber} for $${amount}. Reason: ${reason}`);
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
        currency: 'USD',
        method: method || 'BANK_TRANSFER',
        referenceNumber: referenceNumber || `REF-${Date.now().toString().slice(-6)}`,
        status: 'CONFIRMED',
        allocations: validAllocations,
        unallocatedAmount: fromCents(Math.max(0, unallocatedCents)),
        notes: notes || '',
        recordedBy: (req.headers['x-user-name'] as string) || 'Finance Officer',
        receiptNumber: rcptNumber,
      };

      db.getPayments().unshift(payment);
      db.logAudit((req.headers['x-user-name'] as string) || 'Admin', 'PAYMENT_CONFIRMED', 'PAYMENT', payment.id, `Recorded confirmed payment ${payment.paymentNumber} of $${totalAmount.toFixed(2)} for ${customer.name}`);
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
      db.logAudit((req.headers['x-user-name'] as string) || 'Admin', 'PAYMENT_ALLOCATED', 'PAYMENT', payment.id, `Allocated payment funds to invoices. Remaining unallocated: $${payment.unallocatedAmount}`);
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

apiRouter.post('/procurement/vendors', requireRole(['EXECUTIVE', 'PROCUREMENT']), (req: Request, res: Response) => {
  try {
    const { name, contactName, email, phone, taxId, category, paymentTerms, address } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Nama vendor wajib diisi' });

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
        currency: 'USD',
        category: category || 'Heavy Equipment Spare Parts & Logistics',
      };

      db.getVendors().unshift(vendor);
      db.logAudit((req.headers['x-user-name'] as string) || 'Procurement', 'VENDOR_CREATED', 'VENDOR', vendor.id, `Registered new vendor ${vendor.name} (${vendor.vendorCode})`);
      return vendor;
    });

    res.status(201).json(newVendor);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/procurement/vendors/:id', requireRole(['EXECUTIVE', 'PROCUREMENT']), (req: Request, res: Response) => {
  const index = db.getVendors().findIndex((v) => v.id === req.params.id || v.vendorCode === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Vendor tidak ditemukan' });

  db.transaction(() => {
    const removed = db.getVendors().splice(index, 1)[0];
    db.logAudit((req.headers['x-user-name'] as string) || 'Procurement', 'VENDOR_DELETED', 'VENDOR', removed.id, `Deleted vendor ${removed.name}`);
  });

  res.json({ message: 'Vendor berhasil dihapus' });
});

apiRouter.get('/procurement/purchase-orders', (_req: Request, res: Response) => {
  res.json({ data: db.getPurchaseOrders(), total: db.getPurchaseOrders().length });
});

apiRouter.post('/procurement/purchase-orders', requireRole(['EXECUTIVE', 'PROCUREMENT']), (req: Request, res: Response) => {
  try {
    const { vendorId, items, expectedDate, notes, paymentTerms } = req.body;
    const vendor = db.getVendors().find((v) => v.id === vendorId);
    if (!vendor) return res.status(404).json({ error: 'Vendor tidak ditemukan' });
    if (!items || !items.length) return res.status(400).json({ error: 'PO harus memiliki minimal 1 item barang atau jasa' });

    const newPO = db.transaction(() => {
      let subtotalCents = 0;
      let taxTotalCents = 0;

      const poItems = items.map((raw: any) => {
        const prod = db.getProducts().find((p) => p.id === raw.productId);
        const qty = Number(raw.quantity) || 1;
        const cost = Number(raw.unitCost) || (prod ? prod.purchaseCost : 100);
        const lineSubtotal = qty * cost;
        const taxRate = Number(raw.taxRatePercent ?? 11); // 11% PPN standar
        const lineTax = Math.round(lineSubtotal * (taxRate / 100));

        subtotalCents += toCents(lineSubtotal);
        taxTotalCents += toCents(lineTax);

        return {
          productId: raw.productId || `PRD-${Date.now().toString().slice(-4)}`,
          productName: raw.productName || (prod ? prod.name : 'Procured Component'),
          itemType: raw.itemType || (prod?.productType === 'SERVICE' ? 'SERVICE' : 'GOODS'),
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

      // Auto-generate linked Vendor Bill in Accounts Payable (integrated with Finance/FAT)
      const billNumber = `VBILL-${poNum.slice(-4)}-${Date.now().toString().slice(-4)}`;
      const vendorBill: VendorBill = {
        id: billNumber,
        billNumber,
        purchaseOrderId: poNum,
        vendorId: vendor.id,
        vendorName: vendor.name,
        billDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + (vendor.paymentTerms || 30) * 86400000).toISOString().split('T')[0],
        amount: grandTotal,
        paidAmount: 0,
        status: 'UNPAID',
      };
      db.getVendorBills().unshift(vendorBill);

      const po: PurchaseOrder = {
        id: poNum,
        poNumber: poNum,
        vendorId: vendor.id,
        vendorName: vendor.name,
        vendorTaxId: vendor.taxId,
        orderDate: new Date().toISOString().split('T')[0],
        expectedDate: expectedDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        paymentTerms: terms,
        status: 'APPROVED',
        items: poItems,
        subtotal,
        taxAmount,
        grandTotal,
        notes: notes || '',
        vendorBillId: billNumber,
      };

      db.getPurchaseOrders().unshift(po);
      db.logAudit(
        (req.headers['x-user-name'] as string) || 'Procurement',
        'PO_CREATED',
        'PURCHASE_ORDER',
        po.id,
        `Created Purchase Order ${po.poNumber} for vendor ${vendor.name}. Total: $${grandTotal.toFixed(2)} (Tax Included). Vendor Bill ${billNumber} created in Accounts Payable.`
      );
      return po;
    });

    res.status(201).json(newPO);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/procurement/purchase-orders/:id', requireRole(['EXECUTIVE', 'PROCUREMENT']), (req: Request, res: Response) => {
  const index = db.getPurchaseOrders().findIndex((p) => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Purchase Order tidak ditemukan' });

  db.transaction(() => {
    const po = db.getPurchaseOrders()[index];
    if (po.status === 'GOODS_RECEIVED') {
      throw new Error('PO yang barangnya sudah diterima tidak dapat dihapus');
    }
    po.status = 'CANCELLED';
    if (po.vendorBillId) {
      const bIndex = db.getVendorBills().findIndex((b) => b.id === po.vendorBillId);
      if (bIndex !== -1) db.getVendorBills().splice(bIndex, 1);
    }
    db.getPurchaseOrders().splice(index, 1);
    db.logAudit((req.headers['x-user-name'] as string) || 'Procurement', 'PO_CANCELLED', 'PURCHASE_ORDER', po.id, `Cancelled and deleted PO ${po.poNumber}`);
  });

  res.json({ message: 'Purchase Order berhasil dibatalkan dan dihapus' });
});

apiRouter.post('/procurement/purchase-orders/:id/receive', requireRole(['EXECUTIVE', 'PROCUREMENT']), (req: Request, res: Response) => {
  const po = db.getPurchaseOrders().find((p) => p.id === req.params.id);
  if (!po) return res.status(404).json({ error: 'Purchase Order tidak ditemukan' });

  try {
    db.transaction(() => {
      po.status = 'GOODS_RECEIVED';
      po.items.forEach((item) => {
        item.receivedQuantity = item.quantity;
        // Increment inventory stock if it's GOODS
        const prod = db.getProducts().find((p) => p.id === item.productId);
        if (prod && item.itemType !== 'SERVICE') {
          prod.stockQuantity += item.quantity;
        }
      });

      db.logAudit((req.headers['x-user-name'] as string) || 'Admin', 'GOODS_RECEIVED', 'PURCHASE_ORDER', po.id, `Received items for ${po.poNumber}. Stock levels incremented.`);
    });

    res.json(po);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/procurement/vendor-bills', (_req: Request, res: Response) => {
  res.json({ data: db.getVendorBills(), total: db.getVendorBills().length });
});

apiRouter.post('/procurement/vendor-bills/:id/pay', requireRole(['EXECUTIVE', 'FINANCE_ACCOUNTING_TAX']), (req: Request, res: Response) => {
  const bill = db.getVendorBills().find((b) => b.id === req.params.id);
  if (!bill) return res.status(404).json({ error: 'Vendor bill tidak ditemukan' });

  db.transaction(() => {
    bill.status = 'PAID';
    bill.paidAmount = bill.amount;
    db.logAudit((req.headers['x-user-name'] as string) || 'Finance', 'VENDOR_BILL_PAID', 'VENDOR_BILL', bill.id, `Settled vendor bill ${bill.billNumber} ($${bill.amount.toFixed(2)}) for ${bill.vendorName}`);
  });

  res.json(bill);
});

// ==========================================
// 11. OPERATOR MANAGEMENT (SIO & ASSIGNMENT)
// ==========================================
apiRouter.get('/operators', (_req: Request, res: Response) => {
  res.json({ data: db.getOperators(), total: db.getOperators().length });
});

apiRouter.post('/operators', requireRole(['EXECUTIVE', 'MANAGEMENT_OPERATION']), (req: Request, res: Response) => {
  try {
    const { name, badgeNumber, phone, email, sioNumber, sioClass, sioExpiry, sioIssuer, equipmentSpecialization, assignedAssetId, assignedCustomerId, assignedCustomerName, assignedProjectName } = req.body;
    if (!name || !badgeNumber || !sioNumber) {
      return res.status(400).json({ error: 'Nama, Nomor Badge, dan Nomor SIO operator wajib diisi' });
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
      db.logAudit((req.headers['x-user-name'] as string) || 'Management Operation', 'OPERATOR_REGISTERED', 'OPERATOR', operator.id, `Registered operator ${operator.name} (SIO: ${operator.sioNumber})`);
      return operator;
    });

    res.status(201).json(newOp);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/operators/:id', requireRole(['EXECUTIVE', 'MANAGEMENT_OPERATION']), (req: Request, res: Response) => {
  const operator = db.getOperators().find((o) => o.id === req.params.id);
  if (!operator) return res.status(404).json({ error: 'Operator tidak ditemukan' });

  db.transaction(() => {
    Object.assign(operator, req.body);
    db.logAudit((req.headers['x-user-name'] as string) || 'Management Operation', 'OPERATOR_UPDATED', 'OPERATOR', operator.id, `Updated operator ${operator.name}`);
  });

  res.json(operator);
});

apiRouter.post('/operators/:id/assign', requireRole(['EXECUTIVE', 'MANAGEMENT_OPERATION']), (req: Request, res: Response) => {
  const operator = db.getOperators().find((o) => o.id === req.params.id);
  if (!operator) return res.status(404).json({ error: 'Operator tidak ditemukan' });

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
      (req.headers['x-user-name'] as string) || 'Management Operation',
      'OPERATOR_ASSIGNED',
      'OPERATOR',
      operator.id,
      `Assigned operator ${operator.name} to Client: ${customerName || 'None'}, Project: ${projectName || 'None'}, Equipment: ${assetTag || 'None'}`
    );
  });

  res.json(operator);
});

apiRouter.delete('/operators/:id', requireRole(['EXECUTIVE', 'MANAGEMENT_OPERATION']), (req: Request, res: Response) => {
  const index = db.getOperators().findIndex((o) => o.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Operator tidak ditemukan' });

  db.transaction(() => {
    const removed = db.getOperators().splice(index, 1)[0];
    db.logAudit((req.headers['x-user-name'] as string) || 'Management Operation', 'OPERATOR_DELETED', 'OPERATOR', removed.id, `Deleted operator ${removed.name}`);
  });

  res.json({ message: 'Operator berhasil dihapus' });
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
    return res.status(404).json({ error: `Alat berat dengan barcode "${barcode}" tidak terdaftar` });
  }

  const opName = operatorName || (req.headers['x-user-name'] as string) || 'Agus Santoso';
  const op = db.getOperators().find((o) => o.name.toLowerCase() === opName.toLowerCase() || o.id === operatorId);

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
      notes: notes || 'Absen datang normal di lokasi proyek',
      verifiedForBilling: false,
    };

    db.getAttendanceLogs().unshift(att);
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
    return res.status(404).json({ error: `Alat berat dengan barcode "${barcode}" tidak terdaftar` });
  }

  const opName = operatorName || (req.headers['x-user-name'] as string) || 'Agus Santoso';
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
      existing.notes = (existing.notes ? `${existing.notes} | ` : '') + (notes || 'Absen pulang selesai shift');
      existing.verifiedForBilling = true;

      if (asset.legalDocs) {
        asset.legalDocs.hourMeter = endHm;
      }
      db.logAudit(opName, 'ATTENDANCE_CHECK_OUT', 'ATTENDANCE', existing.id, `Operator ${opName} checked out on ${asset.assetTag}. Working hours: ${existing.workingHours} HM`);

      db.addNotification({
        id: `NTF-TS-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        sourceDepartment: 'Operasional Lapangan & Operator',
        sourceUserName: opName,
        title: `Timesheet Shift Selesai: Unit ${asset.assetTag}`,
        message: `Operator ${opName} telah menyelesaikan shift kerja pada unit ${asset.name} (${asset.assetTag}) di ${existing.projectName || asset.warehouseLocation}. Total jam operasi aktif: ${existing.workingHours} Jam (HM ${existing.checkInHourMeter} ke ${existing.checkOutHourMeter}). Data telah diverifikasi siap untuk lampiran billing bulanan klien.`,
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
        notes: notes || 'Absen pulang tercatat langsung',
        verifiedForBilling: true,
      };
      db.getAttendanceLogs().unshift(att);

      db.addNotification({
        id: `NTF-TS-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        sourceDepartment: 'Operasional Lapangan & Operator',
        sourceUserName: opName,
        title: `Timesheet Shift Selesai: Unit ${asset.assetTag}`,
        message: `Operator ${opName} mencatat absen pulang pada unit ${asset.assetTag}. Total jam operasi 8.0 Jam tercatat resmi untuk lampiran tagihan.`,
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
  if (!log) return res.status(404).json({ error: 'Timesheet log tidak ditemukan' });

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

    const user = (req.headers['x-user-name'] as string) || 'Admin Lapangan';
    db.logAudit(user, 'TIMESHEET_ADJUSTED', 'ATTENDANCE', log.id, `Adjusted timesheet summary for ${log.operatorName} on ${log.assetTag} (Date: ${log.date}, In: ${log.checkInTime}, Out: ${log.checkOutTime}, Hours: ${log.workingHours})`);

    db.addNotification({
      id: `NTF-ADJ-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      sourceDepartment: 'Operasional Lapangan (Timesheet)',
      sourceUserName: user,
      title: `Penyesuaian Timesheet: ${log.assetTag}`,
      message: `Data timesheet untuk operator ${log.operatorName} pada unit ${log.assetTag} (${log.date}) telah diadjust/disesuaikan oleh ${user}. Jam Datang: ${log.checkInTime}, Jam Pulang: ${log.checkOutTime || '-'}, Total Jam Aktif: ${log.workingHours} HM. Data sinkron dengan FAT.`,
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
    return res.status(404).json({ error: `Alat berat dengan barcode "${barcode}" tidak terdaftar` });
  }

  const opName = operatorName || (req.headers['x-user-name'] as string) || 'Agus Santoso';

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
      title: `Kerusakan Lapangan: ${asset.name} (${damageCategory || 'General Issue'})`,
      description: damageDescription || 'Laporan breakdown alat tidak dapat ditangani operator lapangan. Membutuhkan intervensi Technical Service.',
      priority: 'HIGH',
      type: 'FIELD_BREAKDOWN',
      assignedTechnician: 'Technical Service Team',
      scheduledDate: today,
      partsCost: 0,
      laborCost: 250,
      totalCost: 250,
      downtimeHours: 8,
      status: 'REPORTED',
      reportedByOperator: opName,
      damageCategory: damageCategory || 'GENERAL',
      photoUrl,
    };

    db.getWorkOrders().unshift(wo);

    // Transition Asset Status
    asset.status = 'IN_MAINTENANCE';
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
      notes: `Laporan alat rusak: ${damageDescription || 'Kerusakan teknis'} (Tiket: ${woNum})`,
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

  const pendingRequests = workOrders.filter((w) => w.status === 'REPORTED' || w.status === 'SCHEDULED');
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

apiRouter.post('/technical-service/scan-start', requireRole(['EXECUTIVE', 'TECHNICAL_SERVICE', 'ASSET_CONTROL']), (req: Request, res: Response) => {
  const { barcode, workOrderId, technicianName } = req.body;
  const wo = db.getWorkOrders().find((w) =>
    (workOrderId && w.id === workOrderId) ||
    (barcode && (w.assetTag.toLowerCase() === barcode.trim().toLowerCase() && w.status !== 'COMPLETED'))
  );

  if (!wo) {
    return res.status(404).json({ error: `Tiket perbaikan untuk barcode ${barcode || workOrderId} tidak ditemukan` });
  }

  const tech = technicianName || (req.headers['x-user-name'] as string) || 'Dani Prasetyo';

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

apiRouter.put('/technical-service/work-orders/:id', requireRole(['EXECUTIVE', 'TECHNICAL_SERVICE', 'ASSET_CONTROL']), (req: Request, res: Response) => {
  const wo = db.getWorkOrders().find((w) => w.id === req.params.id);
  if (!wo) return res.status(404).json({ error: 'Work order tidak ditemukan' });

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

    const tech = (req.headers['x-user-name'] as string) || 'Technical Service';
    db.logAudit(tech, 'WORK_ORDER_EDITED', 'WORK_ORDER', wo.id, `Updated technical work order ${wo.workOrderNumber}: Parts $${wo.partsCost}, Labor $${wo.laborCost}`);
  });

  res.json(wo);
});

apiRouter.post('/technical-service/scan-complete', requireRole(['EXECUTIVE', 'TECHNICAL_SERVICE', 'ASSET_CONTROL']), (req: Request, res: Response) => {
  const { barcode, workOrderId, resolutionNotes, partsCost, laborCost, sparePartsUsed, technicianName } = req.body;
  const wo = db.getWorkOrders().find((w) =>
    (workOrderId && w.id === workOrderId) ||
    (barcode && (w.assetTag.toLowerCase() === barcode.trim().toLowerCase() && w.status === 'IN_PROGRESS'))
  );

  if (!wo) {
    return res.status(404).json({ error: `Tiket perbaikan berjalan untuk barcode ${barcode || workOrderId} tidak ditemukan` });
  }

  const tech = technicianName || (req.headers['x-user-name'] as string) || 'Dani Prasetyo';

  db.transaction(() => {
    wo.status = 'COMPLETED';
    wo.completedDate = new Date().toISOString();
    wo.resolutionNotes = resolutionNotes || 'Perbaikan tuntas, uji coba operasional normal dan kelaikan alat diverifikasi.';
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

    db.logAudit(tech, 'TECH_SCAN_COMPLETE', 'WORK_ORDER', wo.id, `Technician ${tech} finished repair on ${wo.assetTag}. Asset returned to AVAILABLE status. Total cost: $${wo.totalCost.toFixed(2)}`);
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

      asset.status = 'IN_MAINTENANCE';
      db.getWorkOrders().unshift(wo);
      db.logAudit((req.headers['x-user-name'] as string) || 'Admin', 'WORK_ORDER_CREATED', 'WORK_ORDER', wo.id, `Created Work Order ${wo.workOrderNumber} for asset ${asset.assetTag}`);
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

      db.logAudit((req.headers['x-user-name'] as string) || 'Admin', 'WORK_ORDER_COMPLETED', 'WORK_ORDER', wo.id, `Completed work order ${wo.workOrderNumber}. Asset returned to AVAILABLE status.`);
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
  const totalAssetsCount = assets.length;
  const rentedAssetsCount = assets.filter((a) => a.status === 'RENTED').length;
  const utilizationRate = totalAssetsCount > 0 ? (rentedAssetsCount / totalAssetsCount) * 100 : 0;

  // Breakdown by revenue stream
  const salesRevenue = salesOrders.reduce((acc, so) => acc + (so.status !== 'CANCELLED' ? so.grandTotal : 0), 0);
  const rentalRevenue = rentals.reduce((acc, r) => acc + r.grandTotal, 0);

  res.json({
    metrics: {
      netInvoicedRevenue: Number(netInvoicedRevenue.toFixed(2)),
      totalCollectedPayments: Number(totalCollectedPayments.toFixed(2)),
      totalOutstandingAR: Number(totalOutstandingAR.toFixed(2)),
      overdueAmount: Number(overdueAmount.toFixed(2)),
      salesRevenue: Number(salesRevenue.toFixed(2)),
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
    Object.assign(db.getSettings(), req.body);
    db.logAudit((req.headers['x-user-name'] as string) || 'Admin', 'SETTINGS_UPDATED', 'SYSTEM_SETTINGS', 'GLOBAL', 'Updated enterprise system settings');
  });
  res.json(db.getSettings());
});

// ==========================================
// 14. DATA RECOVERY, BACKUP & DEMO RESET
// ==========================================
apiRouter.post('/system/reset-demo', (_req: Request, res: Response) => {
  const resetState = db.resetToDefault();
  res.json({ message: 'Database reset to clean factory demo state', state: resetState });
});

apiRouter.get('/system/backup', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=apex_eams_backup_${new Date().toISOString().split('T')[0]}.json`);
  res.send(JSON.stringify(db.getState(), null, 2));
});

apiRouter.post('/system/restore', (req: Request, res: Response) => {
  try {
    const backupState = req.body;
    if (!backupState.assets || !backupState.customers || !backupState.products) {
      return res.status(400).json({ error: 'Invalid backup file structure' });
    }
    db.transaction(() => {
      Object.assign(db.getState(), backupState);
      db.logAudit('Admin', 'DATABASE_RESTORED', 'SYSTEM', 'RESTORE', 'Database restored from backup archive');
    });
    res.json({ message: 'Database successfully restored from backup' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});
