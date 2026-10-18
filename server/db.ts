import fs from 'fs';
import path from 'path';
import {
  Asset,
  Customer,
  Product,
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
  HeavyEquipmentOperator,
  AssetDailyStatusLog,
  OperatorAttendanceLog,
  AppNotification,
} from '../src/types/index.ts';

// Decimal-safe helper functions
export function toCents(amount: number): number {
  return Math.round(Number(amount) * 100);
}

export function fromCents(cents: number): number {
  return Number((cents / 100).toFixed(2));
}

export function calculateAssetBookValue(
  asset: Pick<Asset, 'purchaseCost' | 'purchaseDate' | 'depreciationRateAnnual'>,
  asOf = new Date(),
): number {
  const costCents = Math.max(0, toCents(Number(asset.purchaseCost) || 0));
  const rate = Math.min(100, Math.max(0, Number(asset.depreciationRateAnnual) || 0));
  const purchasedAt = Date.parse(asset.purchaseDate);
  if (!Number.isFinite(purchasedAt) || asOf.getTime() <= purchasedAt) return fromCents(costCents);

  const elapsedYears = (asOf.getTime() - purchasedAt) / (365.25 * 24 * 60 * 60 * 1000);
  const accumulatedCents = Math.round(costCents * (rate / 100) * elapsedYears);
  return fromCents(Math.max(0, costCents - accumulatedCents));
}

export function calculateLineTotals(quantity: number, unitPrice: number, discountPercent: number, taxRatePercent: number) {
  const qty = Number(quantity) || 0;
  const priceInCents = toCents(unitPrice);
  const grossInCents = qty * priceInCents;
  
  const discountInCents = Math.round(grossInCents * ((Number(discountPercent) || 0) / 100));
  const subtotalInCents = grossInCents - discountInCents;
  const taxInCents = Math.round(subtotalInCents * ((Number(taxRatePercent) || 0) / 100));
  const totalInCents = subtotalInCents + taxInCents;

  return {
    subtotal: fromCents(subtotalInCents),
    taxAmount: fromCents(taxInCents),
    total: fromCents(totalInCents),
    discountAmount: fromCents(discountInCents),
  };
}

export interface DatabaseState {
  users: User[];
  assets: Asset[];
  products: Product[];
  customers: Customer[];
  quotations: Quotation[];
  salesOrders: SalesOrder[];
  rentals: RentalContract[];
  deliveries: Delivery[];
  invoices: Invoice[];
  payments: Payment[];
  vendors: Vendor[];
  purchaseOrders: PurchaseOrder[];
  vendorBills: VendorBill[];
  workOrders: WorkOrder[];
  auditLogs: AuditLog[];
  settings: SystemSettings;
  operators: HeavyEquipmentOperator[];
  statusLogs: AssetDailyStatusLog[];
  attendanceLogs: OperatorAttendanceLog[];
  notifications: AppNotification[];
  drafts: UserFormDraft[];
}

export interface UserFormDraft {
  id: string;
  userId: string;
  formKey: string;
  data: Record<string, unknown>;
  updatedAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'eams_db.json');
export class EamsDatabase {
  private state: DatabaseState;
  private isTransactionActive = false;
  private transactionSnapshot: string | null = null;

  constructor() {
    this.state = this.loadInitialState();
  }

  private loadInitialState(): DatabaseState {
    if (fs.existsSync(DATA_FILE)) {
      try {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed?.assets) || !Array.isArray(parsed?.customers) ||
          !Array.isArray(parsed?.products) || !parsed?.settings || typeof parsed.settings !== 'object') {
          throw new Error('The database file does not contain the required EAMS collections.');
        }
        const fresh = this.generateSeedData();
        delete parsed.currencyMigration;
        // Preserve existing accounts and merge newly introduced seed assets.
        if (!Array.isArray(parsed.users) || parsed.users.length === 0) {
          parsed.users = fresh.users;
        }
        if (!parsed.operators || parsed.operators.length === 0) {
          parsed.operators = fresh.operators;
        }
        if (!parsed.statusLogs) {
          parsed.statusLogs = fresh.statusLogs;
        }
        if (!parsed.attendanceLogs) {
          parsed.attendanceLogs = fresh.attendanceLogs;
        }
        if (!parsed.notifications || parsed.notifications.length === 0) {
          parsed.notifications = fresh.notifications;
        }
        if (!Array.isArray(parsed.drafts)) parsed.drafts = [];
        fresh.assets.forEach((fa) => {
          if (!parsed.assets.some((pa: Asset) => pa.id === fa.id || pa.assetTag === fa.assetTag)) {
            parsed.assets.unshift(fa);
          }
        });
        parsed.assets.forEach((a: Asset) => {
          const seedA = fresh.assets.find((sa) => sa.id === a.id);
          if (seedA?.legalDocs && !a.legalDocs) {
            a.legalDocs = seedA.legalDocs;
          }
          if (seedA?.gpsLocation) {
            a.gpsLocation = seedA.gpsLocation;
          }
        });
        return parsed;
      } catch (error) {
        throw new Error(`Unable to safely load ${DATA_FILE}; refusing to start with replacement seed data.`, { cause: error });
      }
    }
    return this.generateSeedData();
  }

  public save(): void {
    if (this.isTransactionActive) return; // wait until commit
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database state:', err);
    }
  }

  public resetToDefault(): DatabaseState {
    this.state = this.generateSeedData();
    this.save();
    return this.state;
  }

  // ACID Transaction Wrapper
  public transaction<T>(operation: () => T): T {
    if (this.isTransactionActive) {
      return operation();
    }
    this.isTransactionActive = true;
    this.transactionSnapshot = JSON.stringify(this.state);
    try {
      const result = operation();
      this.isTransactionActive = false;
      this.transactionSnapshot = null;
      this.save();
      return result;
    } catch (error) {
      if (this.transactionSnapshot) {
        this.state = JSON.parse(this.transactionSnapshot);
      }
      this.isTransactionActive = false;
      this.transactionSnapshot = null;
      throw error;
    }
  }

  public logAudit(user: string, action: string, entity: string, entityId: string, details: string) {
    const actor = this.state.users.find((u) => u.name === user);
    const log: AuditLog = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      userId: actor?.id || 'SYSTEM',
      userName: user || 'System Admin',
      action,
      entity,
      entityId,
      details,
    };
    this.state.auditLogs.unshift(log);
    if (this.state.auditLogs.length > 500) {
      this.state.auditLogs.pop();
    }
  }

  // State Getters
  public getState(): DatabaseState {
    return this.state;
  }

  public getUsers(): User[] { return this.state.users; }
  public getAssets(): Asset[] { return this.state.assets; }
  public getProducts(): Product[] { return this.state.products; }
  public getCustomers(): Customer[] { return this.state.customers; }
  public getQuotations(): Quotation[] { return this.state.quotations; }
  public getSalesOrders(): SalesOrder[] { return this.state.salesOrders; }
  public getRentals(): RentalContract[] { return this.state.rentals; }
  public getDeliveries(): Delivery[] { return this.state.deliveries; }
  public getInvoices(): Invoice[] { return this.state.invoices; }
  public getPayments(): Payment[] { return this.state.payments; }
  public getVendors(): Vendor[] { return this.state.vendors; }
  public getPurchaseOrders(): PurchaseOrder[] { return this.state.purchaseOrders; }
  public getVendorBills(): VendorBill[] { return this.state.vendorBills; }
  public getWorkOrders(): WorkOrder[] { return this.state.workOrders; }
  public getAuditLogs(): AuditLog[] { return this.state.auditLogs; }
  public getSettings(): SystemSettings { return this.state.settings; }
  public getOperators(): HeavyEquipmentOperator[] { return this.state.operators || []; }
  public getStatusLogs(): AssetDailyStatusLog[] { return this.state.statusLogs || []; }
  public getAttendanceLogs(): OperatorAttendanceLog[] { return this.state.attendanceLogs || []; }
  public getNotifications(): AppNotification[] { return this.state.notifications || []; }
  public getFormDraft(userId: string, formKey: string): UserFormDraft | undefined {
    return (this.state.drafts || []).find((draft) => draft.userId === userId && draft.formKey === formKey);
  }
  public saveFormDraft(userId: string, formKey: string, data: Record<string, unknown>): UserFormDraft {
    if (!this.state.drafts) this.state.drafts = [];
    let draft = this.getFormDraft(userId, formKey);
    if (!draft) {
      draft = { id: `${userId}:${formKey}`, userId, formKey, data, updatedAt: new Date().toISOString() };
      this.state.drafts.push(draft);
    } else {
      draft.data = data;
      draft.updatedAt = new Date().toISOString();
    }
    this.save();
    return draft;
  }
  public deleteFormDraft(userId: string, formKey: string): void {
    if (!this.state.drafts) this.state.drafts = [];
    this.state.drafts = this.state.drafts.filter((draft) => draft.userId !== userId || draft.formKey !== formKey);
    this.save();
  }
  public addNotification(notification: AppNotification): void {
    if (!this.state.notifications) {
      this.state.notifications = [];
    }
    this.state.notifications.unshift(notification);
    if (this.state.notifications.length > 200) {
      this.state.notifications.pop();
    }
  }

  // Seed Data Generation
  private generateSeedData(): DatabaseState {
    const settings: SystemSettings = {
      companyName: 'Apex Industrial Solutions & Equipment Corp.',
      companyAddress: '4250 Innovation Parkway, Suite 800, Dallas, TX 75201',
      companyPhone: '+1 (800) 555-APEX',
      companyEmail: 'operations@apex-industrial.com',
      taxRegistrationNumber: 'US-TX-883920194',
      defaultCurrency: 'IDR',
      defaultTaxRatePercent: 8.25,
      quotationPrefix: 'QT-2026-',
      salesOrderPrefix: 'SO-2026-',
      rentalPrefix: 'RC-2026-',
      invoicePrefix: 'INV-2026-',
      paymentPrefix: 'PMT-2026-',
      deliveryPrefix: 'DO-2026-',
      strictAssetLocking: true,
    };

    const users: User[] = [
      {
        id: 'USR-01',
        name: 'Marcus Sterling',
        email: 'marcus@apex-industrial.com',
        role: 'EXECUTIVE',
        department: 'Executive Leadership',
        employeeBadge: 'EXEC-001',
        assignedBranch: 'Jakarta Head Office',
        status: 'ACTIVE',
        phone: '0811-9876-001',
      },
      {
        id: 'USR-02',
        name: 'Hendra Wijaya',
        email: 'hendra.it@apex-industrial.com',
        role: 'ADMIN_IT',
        department: 'IT Systems & Infrastructure (Admin IT)',
        employeeBadge: 'IT-002',
        assignedBranch: 'Jakarta Head Office',
        status: 'ACTIVE',
        phone: '0812-3456-002',
      },
      {
        id: 'USR-03',
        name: 'Elena Rostova',
        email: 'elena@apex-industrial.com',
        role: 'SALES_MARKETING',
        department: 'Commercial Sales & Marketing Support',
        employeeBadge: 'SLS-003',
        assignedBranch: 'Jakarta Head Office',
        status: 'ACTIVE',
        phone: '0813-5566-003',
      },
      {
        id: 'USR-04',
        name: 'Bambang Pratama',
        email: 'bambang.asset@apex-industrial.com',
        role: 'ASSET_CONTROL',
        department: 'Asset Control & Heavy Equipment Legal Docs',
        employeeBadge: 'AST-004',
        assignedBranch: 'Balikpapan Depot & Workshop',
        status: 'ACTIVE',
        phone: '0814-7788-004',
      },
      {
        id: 'USR-05',
        name: 'Joko Susilo',
        email: 'joko.ops@apex-industrial.com',
        role: 'MANAGEMENT_OPERATION',
        department: 'Field Operation & Operator/SIO Management',
        employeeBadge: 'OPS-005',
        assignedBranch: 'Site Project Morowali',
        status: 'ACTIVE',
        phone: '0815-9900-005',
      },
      {
        id: 'USR-06',
        name: 'Dewi Lestari',
        email: 'dewi.proc@apex-industrial.com',
        role: 'PROCUREMENT',
        department: 'Procurement & Purchasing',
        employeeBadge: 'PRC-006',
        assignedBranch: 'Jakarta Head Office',
        status: 'ACTIVE',
        phone: '0816-1122-006',
      },
      {
        id: 'USR-07',
        name: 'Sarah Jenkins',
        email: 'sarah@apex-industrial.com',
        role: 'FINANCE_ACCOUNTING_TAX',
        department: 'Accounting, Finance & Tax (FAT)',
        employeeBadge: 'FAT-007',
        assignedBranch: 'Jakarta Head Office',
        status: 'ACTIVE',
        phone: '0817-3344-007',
      },
      {
        id: 'USR-08',
        name: 'Reza Ramadhan',
        email: 'reza.ar@apex-industrial.com',
        role: 'AR_MANAGEMENT',
        department: 'Accounts Receivable (AR) Management',
        employeeBadge: 'ARM-008',
        assignedBranch: 'Jakarta Head Office',
        status: 'ACTIVE',
        phone: '0818-5566-008',
      },
      {
        id: 'USR-09',
        name: 'Agus Santoso',
        email: 'agus.operator@apex-industrial.com',
        role: 'OPERATOR_USER',
        department: 'Heavy Equipment & Field Operations',
        employeeBadge: 'OPR-009',
        assignedBranch: 'Site Project Morowali',
        status: 'ACTIVE',
        phone: '0819-7788-009',
      },
      {
        id: 'USR-10',
        name: 'Dani Prasetyo',
        email: 'dani.tech@apex-industrial.com',
        role: 'TECHNICAL_SERVICE',
        department: 'Technical Service, Workshop & Maintenance',
        employeeBadge: 'TECH-010',
        assignedBranch: 'Balikpapan Depot & Workshop',
        status: 'ACTIVE',
        phone: '0819-7788-010',
      },
    ];

    const customers: Customer[] = [
      {
        id: 'CUST-001',
        customerCode: 'CUST-001',
        type: 'COMPANY',
        name: 'Horizon Infrastructure & Contracting',
        taxId: 'US-EIN-74-9821345',
        contacts: [
          { name: 'Arthur Vance', title: 'Procurement Director', email: 'avance@horizon-infra.com', phone: '+1 512 555 0192', isPrimary: true },
          { name: 'Clara Miller', title: 'Site Manager', email: 'cmiller@horizon-infra.com', phone: '+1 512 555 0194', isPrimary: false },
        ],
        billingAddress: { street: '1200 Industrial Blvd', city: 'Austin', state: 'TX', postalCode: '78704', country: 'United States' },
        deliveryAddress: { street: '450 Sector 9 Expansion Site', city: 'Round Rock', state: 'TX', postalCode: '78664', country: 'United States' },
        creditLimit: 250000,
        outstandingBalance: 32475,
        paymentTermsDays: 30,
        currency: 'IDR',
        status: 'ACTIVE',
        notes: 'Preferred commercial tier client with multi-year master service agreement.',
        createdAt: '2025-03-15T09:00:00Z',
      },
      {
        id: 'CUST-002',
        customerCode: 'CUST-002',
        type: 'COMPANY',
        name: 'Vertex Energy Systems Ltd',
        taxId: 'US-EIN-82-4419203',
        contacts: [
          { name: 'Dr. Gregory House', title: 'VP Facilities', email: 'ghouse@vertexenergy.com', phone: '+1 713 555 8310', isPrimary: true },
        ],
        billingAddress: { street: '8800 Energy Plaza, 14th Fl', city: 'Houston', state: 'TX', postalCode: '77002', country: 'United States' },
        deliveryAddress: { street: 'Bayport Terminal Facility Gate 4', city: 'Pasadena', state: 'TX', postalCode: '77507', country: 'United States' },
        creditLimit: 500000,
        outstandingBalance: 14600,
        paymentTermsDays: 45,
        currency: 'IDR',
        status: 'ACTIVE',
        notes: 'Strict HSE and safety verification required prior to any delivery.',
        createdAt: '2025-06-10T14:30:00Z',
      },
      {
        id: 'CUST-003',
        customerCode: 'CUST-003',
        type: 'COMPANY',
        name: 'Metro Logistics & Cold Chain Hub',
        taxId: 'US-EIN-36-7781299',
        contacts: [
          { name: 'Nadia Thorne', title: 'Fleet Superintendent', email: 'nadia@metrologistics.com', phone: '+1 214 555 6041', isPrimary: true },
        ],
        billingAddress: { street: '500 Logistics Way', city: 'Fort Worth', state: 'TX', postalCode: '76177', country: 'United States' },
        deliveryAddress: { street: '500 Logistics Way, Dock 18', city: 'Fort Worth', state: 'TX', postalCode: '76177', country: 'United States' },
        creditLimit: 150000,
        outstandingBalance: 0,
        paymentTermsDays: 30,
        currency: 'IDR',
        status: 'ACTIVE',
        notes: 'Continuous renter of heavy electric forklifts and pallet stackers.',
        createdAt: '2025-08-22T11:15:00Z',
      },
      {
        id: 'CUST-004',
        customerCode: 'CUST-004',
        type: 'INDIVIDUAL',
        name: 'Bradley Cooper (Highland Builders)',
        taxId: 'SSN-XXX-XX-4910',
        contacts: [
          { name: 'Bradley Cooper', title: 'Sole Proprietor', email: 'brad@highlandbuilders.net', phone: '+1 972 555 9218', isPrimary: true },
        ],
        billingAddress: { street: '414 Oak Ridge Dr', city: 'Plano', state: 'TX', postalCode: '75024', country: 'United States' },
        deliveryAddress: { street: 'Jobsite Lot 14, Legacy West', city: 'Plano', state: 'TX', postalCode: '75024', country: 'United States' },
        creditLimit: 50000,
        outstandingBalance: 4200,
        paymentTermsDays: 15,
        currency: 'IDR',
        status: 'ACTIVE',
        createdAt: '2026-01-10T10:00:00Z',
      },
    ];

    const assets: Asset[] = [
      {
        id: 'AST-10024',
        assetTag: 'AST-10024',
        serialNumber: 'CAT320D-SN-9921',
        name: 'Caterpillar 320D3 Hydraulic Excavator 20-Ton',
        category: 'Excavator & Earthmoving',
        brand: 'Caterpillar',
        model: '320D3',
        status: 'AVAILABLE',
        condition: 'EXCELLENT',
        warehouseLocation: 'Site Project Morowali',
        purchaseCost: 185000,
        currentBookValue: 166500,
        depreciationRateAnnual: 10,
        purchaseDate: '2024-03-15',
        warrantyExpiry: '2027-03-15',
        dailyRentalRate: 450,
        weeklyRentalRate: 2600,
        monthlyRentalRate: 9500,
        sellPrice: 215000,
        specs: { OperatingWeight: '20,500 kg', Engine: 'Cat C7.1 ACERT', Bucket: '1.2 m³' },
        legalDocs: {
          plateNumber: 'B 9821 TQ',
          chassisNumber: 'CAT320D-VIN-99021',
          engineNumber: 'C7.1-ENG-48921',
          hourMeter: 2450.5,
          stnkNumber: 'STNK/POL/2025/9981',
          stnkExpiry: '2027-08-20',
          stnkFileName: 'STNK_Original_Scanned.pdf',
          bpkbNumber: 'BPKB-A-8829104',
          bpkbFileName: 'BPKB_Arsip_Pusat.pdf',
          siaNumber: 'SIA/DISN/EXC/2025/0812',
          siaExpiry: '2028-02-15',
          siaIssuer: 'Kemenaker RI - Pengawas K3',
          siaFileName: 'SIA_Kelaikan_Kemenaker.pdf',
          documentStatus: 'VALID',
        },
        gpsLocation: {
          latitude: -2.545,
          longitude: 121.353,
          siteName: 'Site Tambang Nikel & Smelter Morowali',
          cityName: 'Morowali',
          provinceName: 'Central Sulawesi',
          lastGpsPing: '2026-10-15T08:15:00Z',
          speedKmh: 0,
          ignitionOn: true,
        },
      },
      {
        id: 'AST-10088',
        assetTag: 'AST-10088',
        serialNumber: 'KOBELCO-CKE-8812',
        name: 'Kobelco CKE2500-2 Lattice Boom Crawler Crane 250T',
        category: 'Mobile & Tower Crane',
        brand: 'Kobelco',
        model: 'CKE2500-2',
        status: 'AVAILABLE',
        condition: 'EXCELLENT',
        warehouseLocation: 'Site IKN Nusantara Dermaga 2',
        purchaseCost: 890000,
        currentBookValue: 801000,
        depreciationRateAnnual: 8,
        purchaseDate: '2023-11-01',
        warrantyExpiry: '2027-11-01',
        dailyRentalRate: 2800,
        weeklyRentalRate: 14500,
        monthlyRentalRate: 48000,
        sellPrice: 950000,
        specs: { LiftingCapacity: '250 Ton @ 4.6m', MaxBoomLength: '91.4 m', Engine: 'Hino P11C-VC' },
        legalDocs: {
          plateNumber: 'KT 8102 QA',
          chassisNumber: 'CKE2500-VIN-8812',
          engineNumber: 'HINO-P11-9921',
          hourMeter: 3120.0,
          stnkNumber: 'STNK/POL/2024/7710',
          stnkExpiry: '2027-11-15',
          stnkFileName: 'STNK_Crane_CKE2500.pdf',
          bpkbNumber: 'BPKB-B-1192847',
          bpkbFileName: 'BPKB_Arsip_Pusat.pdf',
          siaNumber: 'SIA/KEM/CRN/2025/1102',
          siaExpiry: '2028-11-01',
          siaIssuer: 'Kemenaker RI - Pengawas K3',
          siaFileName: 'SIA_Crane_250T.pdf',
          documentStatus: 'VALID',
        },
        gpsLocation: {
          latitude: -0.974,
          longitude: 116.702,
          siteName: 'Pulau Balang Bridge & Logistics Port Project',
          cityName: 'Sepaku, IKN Nusantara',
          provinceName: 'East Kalimantan',
          lastGpsPing: '2026-10-15T08:20:00Z',
          speedKmh: 0,
          ignitionOn: true,
        },
      },
      {
        id: 'AST-1001',
        assetTag: 'AST-1001',
        serialNumber: 'APG1250-98241B',
        name: 'Atlas Power APG-1250 kVA Industrial Generator',
        category: 'Power Generation',
        brand: 'Atlas Power',
        model: 'APG-1250',
        status: 'RENTED',
        condition: 'EXCELLENT',
        warehouseLocation: 'Dallas Central Bay 4',
        purchaseCost: 65000,
        currentBookValue: 58500,
        depreciationRateAnnual: 10,
        purchaseDate: '2024-04-12',
        warrantyExpiry: '2027-04-12',
        currentCustomerId: 'CUST-002',
        currentCustomerName: 'Vertex Energy Systems Ltd',
        activeRentalContractId: 'RC-2026-001',
        dailyRentalRate: 450,
        weeklyRentalRate: 2200,
        monthlyRentalRate: 7500,
        sellPrice: 78000,
        imageUrl: '/src/assets/images/industrial_generator_cat_1791998455250.jpg',
        specs: { Output: '1250 kVA / 1000 kW', Fuel: 'Diesel Heavy Fuel', SoundLevel: '68 dBA @ 7m' },
        notes: 'Under active 60-day lease contract with Vertex Energy Bayport Terminal.',
        gpsLocation: {
          latitude: -7.202,
          longitude: 112.731,
          siteName: 'Kawasan Industri Maspion & Dermaga Petrokimia',
          cityName: 'Gresik / Surabaya',
          provinceName: 'East Java',
          lastGpsPing: '2026-10-15T08:10:00Z',
          speedKmh: 0,
          ignitionOn: true,
        },
      },
      {
        id: 'AST-1002',
        assetTag: 'AST-1002',
        serialNumber: 'YALE-EL80-44910',
        name: 'Yale ERC-080 Heavy Electric Warehouse Forklift',
        category: 'Material Handling',
        brand: 'Yale',
        model: 'ERC-080-VG',
        status: 'AVAILABLE',
        condition: 'EXCELLENT',
        warehouseLocation: 'Central Equipment Yard & Workshop Cakung',
        purchaseCost: 42000,
        currentBookValue: 39900,
        depreciationRateAnnual: 10,
        purchaseDate: '2025-01-20',
        warrantyExpiry: '2028-01-20',
        dailyRentalRate: 280,
        weeklyRentalRate: 1350,
        monthlyRentalRate: 4600,
        sellPrice: 51000,
        imageUrl: '/src/assets/images/forklift_electric_warehouse_1791998455396.jpg',
        specs: { Capacity: '8,000 lbs (3,600 kg)', Mast: 'Triple 189 in', Battery: '80V 750Ah Lithium-Ion' },
        notes: 'Freshly calibrated and safety certified. Ready for immediate deployment or sale.',
        gpsLocation: {
          latitude: -6.175,
          longitude: 106.945,
          siteName: 'Central Equipment Yard Cakung & Head Office',
          cityName: 'East Jakarta',
          provinceName: 'DKI Jakarta',
          lastGpsPing: '2026-10-15T08:30:00Z',
          speedKmh: 12,
          ignitionOn: true,
        },
      },
      {
        id: 'AST-1003',
        assetTag: 'AST-1003',
        serialNumber: 'THERMO-I7-339182',
        name: 'Atlas Copco XAS 188 Portable Diesel Air Compressor',
        category: 'Air & Pneumatic',
        brand: 'Atlas Copco',
        model: 'XAS 188',
        status: 'IN_MAINTENANCE',
        condition: 'NEEDS_REPAIR',
        warehouseLocation: 'Balikpapan Depot & Workshop',
        purchaseCost: 38000,
        currentBookValue: 34200,
        depreciationRateAnnual: 10,
        purchaseDate: '2025-05-18',
        warrantyExpiry: '2028-05-18',
        dailyRentalRate: 180,
        weeklyRentalRate: 850,
        monthlyRentalRate: 2800,
        sellPrice: 42000,
        specs: { FreeAirDelivery: '11.1 m³/min', Pressure: '7-12 bar', Engine: 'Deutz 4-Cylinder' },
        notes: 'Undergoing technical service by the workshop mechanics.',
        gpsLocation: {
          latitude: -1.269,
          longitude: 116.831,
          siteName: 'Main Depot & Kariangau Workshop',
          cityName: 'Balikpapan',
          provinceName: 'East Kalimantan',
          lastGpsPing: '2026-10-15T08:05:00Z',
          speedKmh: 0,
          ignitionOn: false,
        },
      },
      {
        id: 'AST-1004',
        assetTag: 'AST-1004',
        serialNumber: 'KOMATSU-PC210-5881',
        name: 'Komatsu PC210LC-11 Hydraulic Crawler Excavator',
        category: 'Heavy Machinery',
        brand: 'Komatsu',
        model: 'PC210LC-11',
        status: 'RENTED',
        condition: 'GOOD',
        warehouseLocation: 'Site Project Weda Bay',
        purchaseCost: 185000,
        currentBookValue: 157250,
        depreciationRateAnnual: 12,
        purchaseDate: '2023-09-14',
        warrantyExpiry: '2026-09-14',
        activeSalesOrderId: 'SO-2026-002',
        currentCustomerId: 'CUST-001',
        currentCustomerName: 'Horizon Infrastructure & Contracting',
        dailyRentalRate: 950,
        weeklyRentalRate: 4200,
        monthlyRentalRate: 14500,
        sellPrice: 210000,
        specs: { OperatingWeight: '22,120 kg', EnginePower: '165 HP', BucketCapacity: '1.2 m³' },
        notes: 'Mining and land development operations in the Weda Bay area.',
        gpsLocation: {
          latitude: 0.472,
          longitude: 127.915,
          siteName: 'Industrial Park & Nickel Mine Site',
          cityName: 'Weda Bay, Central Halmahera',
          provinceName: 'North Maluku',
          lastGpsPing: '2026-10-15T08:25:00Z',
          speedKmh: 4,
          ignitionOn: true,
        },
      },
      {
        id: 'AST-1005',
        assetTag: 'AST-1005',
        serialNumber: 'CAT-C15-883190',
        name: 'Caterpillar C15 500kW Standby Power Unit',
        category: 'Power Generation',
        brand: 'Caterpillar',
        model: 'C15 ACERT',
        status: 'SOLD',
        condition: 'GOOD',
        warehouseLocation: 'Delivered / Customer Site',
        purchaseCost: 48000,
        currentBookValue: 0,
        depreciationRateAnnual: 15,
        purchaseDate: '2023-02-10',
        warrantyExpiry: '2026-02-10',
        currentCustomerId: 'CUST-001',
        currentCustomerName: 'Horizon Infrastructure & Contracting',
        dailyRentalRate: 350,
        weeklyRentalRate: 1700,
        monthlyRentalRate: 5800,
        sellPrice: 56000,
        specs: { Rating: '500 kW / 625 kVA', Frequency: '60 Hz 480V' },
        notes: 'Sold and ownership transferred to Horizon Infrastructure under invoice INV-2026-001.',
      },
      {
        id: 'AST-1006',
        assetTag: 'AST-1006',
        serialNumber: 'BOBCAT-S76-44019',
        name: 'Bobcat S76 Skid-Steer Loader with Hydraulic Grapple',
        category: 'Earth Moving',
        brand: 'Bobcat',
        model: 'S76 T4',
        status: 'IN_MAINTENANCE',
        condition: 'NEEDS_REPAIR',
        warehouseLocation: 'Dallas Central Service Bay 2',
        purchaseCost: 54000,
        currentBookValue: 46000,
        depreciationRateAnnual: 10,
        purchaseDate: '2024-08-01',
        warrantyExpiry: '2027-08-01',
        dailyRentalRate: 320,
        weeklyRentalRate: 1450,
        monthlyRentalRate: 4900,
        sellPrice: 62000,
        specs: { RatedOperatingCapacity: '2,900 lbs', Horsepower: '74 HP Turbo' },
        notes: 'Undergoing 500-hour hydraulic pump seal replacement work order WO-2026-001.',
      },
    ];

    const products: Product[] = [
      {
        id: 'PROD-001',
        sku: 'GEN-APG-1250',
        name: 'Atlas Power APG-1250 kVA Industrial Generator',
        description: 'Heavy continuous duty diesel generator for critical commercial standby and prime power.',
        category: 'Power Systems',
        brand: 'Atlas Power',
        model: 'APG-1250',
        productType: 'SERIALIZED',
        unitOfMeasure: 'Unit',
        salesPrice: 78000,
        purchaseCost: 65000,
        taxRatePercent: 8.25,
        stockQuantity: 2,
        reservedQuantity: 1,
        reorderLevel: 1,
        warehouse: 'Dallas Central Depot',
        isActive: true,
        imageUrl: '/src/assets/images/industrial_generator_cat_1791998455250.jpg',
        associatedAssetIds: ['AST-1001'],
      },
      {
        id: 'PROD-002',
        sku: 'MHE-YALE-EL80',
        name: 'Yale ERC-080 Electric Counterbalance Forklift',
        description: 'Zero emission 8,000 lb cushion tire electric forklift with fast lithium charging system.',
        category: 'Material Handling',
        brand: 'Yale',
        model: 'ERC-080-VG',
        productType: 'SERIALIZED',
        unitOfMeasure: 'Unit',
        salesPrice: 51000,
        purchaseCost: 42000,
        taxRatePercent: 8.25,
        stockQuantity: 3,
        reservedQuantity: 0,
        reorderLevel: 2,
        warehouse: 'Fort Worth Logistics Dock',
        isActive: true,
        imageUrl: '/src/assets/images/forklift_electric_warehouse_1791998455396.jpg',
        associatedAssetIds: ['AST-1002'],
      },
      {
        id: 'PROD-003',
        sku: 'DIAG-THERMO-I7',
        name: 'ThermoTech InspectPro i7 Thermal Inspection Camera',
        description: 'Precision radiometric thermal imaging scanner for industrial electrical and mechanical diagnostics.',
        category: 'Inspection & Test',
        brand: 'ThermoTech',
        model: 'InspectPro i7',
        productType: 'SERIALIZED',
        unitOfMeasure: 'Unit',
        salesPrice: 12500,
        purchaseCost: 9800,
        taxRatePercent: 8.25,
        stockQuantity: 4,
        reservedQuantity: 0,
        reorderLevel: 2,
        warehouse: 'Austin Tech Depot',
        isActive: true,
        imageUrl: '/src/assets/images/thermal_imager_scanner_1791998455824.jpg',
        associatedAssetIds: ['AST-1003'],
      },
      {
        id: 'PROD-004',
        sku: 'FLUID-HYD-ISO46',
        name: 'Apex Shield ISO VG 46 Premium Hydraulic Fluid (55 Gal Drum)',
        description: 'Anti-wear zinc-free hydraulic oil for high-pressure heavy construction and industrial machinery.',
        category: 'Consumables & Lubricants',
        brand: 'Apex Shield',
        model: 'ISO-46-HD',
        productType: 'QUANTITY_BASED',
        unitOfMeasure: 'Drum (55 Gal)',
        salesPrice: 385,
        purchaseCost: 245,
        taxRatePercent: 8.25,
        stockQuantity: 48,
        reservedQuantity: 6,
        reorderLevel: 15,
        warehouse: 'Dallas Central Depot',
        isActive: true,
      },
      {
        id: 'PROD-005',
        sku: 'FILTER-KIT-CAT15',
        name: 'Caterpillar Primary Service Filter Maintenance Kit',
        description: 'Complete maintenance bundle including fuel water separator, primary oil, and intake filters.',
        category: 'Spare Parts',
        brand: 'Caterpillar',
        model: 'FK-C15-GEN',
        productType: 'QUANTITY_BASED',
        unitOfMeasure: 'Kit',
        salesPrice: 260,
        purchaseCost: 165,
        taxRatePercent: 8.25,
        stockQuantity: 32,
        reservedQuantity: 4,
        reorderLevel: 10,
        warehouse: 'Dallas Central Depot',
        isActive: true,
      },
      {
        id: 'PROD-006',
        sku: 'SRV-COMMISSIONING-8H',
        name: 'Turnkey On-Site Equipment Commissioning & Training (Full Day)',
        description: 'Certified field engineer installation inspection, load bank testing, calibration, and operator handover.',
        category: 'Technical Services',
        brand: 'Apex Technical Services',
        model: 'FIELD-ENG-8H',
        productType: 'SERVICE',
        unitOfMeasure: 'Day',
        salesPrice: 1850,
        purchaseCost: 900,
        taxRatePercent: 0, // Services untaxed in this jurisdiction
        stockQuantity: 9999,
        reservedQuantity: 0,
        reorderLevel: 0,
        warehouse: 'On-Site Field Delivery',
        isActive: true,
      },
    ];

    const quotations: Quotation[] = [
      {
        id: 'QT-2026-001',
        quotationNumber: 'QT-2026-001',
        revision: 1,
        customerId: 'CUST-001',
        customerName: 'Horizon Infrastructure & Contracting',
        date: '2026-01-14',
        validUntil: '2026-02-14',
        salespersonName: 'Elena Rostova',
        status: 'CONVERTED',
        items: [
          {
            id: 'QTI-001',
            productId: 'PROD-001',
            productName: 'Atlas Power APG-1250 kVA Industrial Generator',
            sku: 'GEN-APG-1250',
            productType: 'SERIALIZED',
            quantity: 1,
            unitPrice: 78000,
            discountPercent: 5,
            taxRatePercent: 8.25,
            subtotal: 74100,
            taxAmount: 6113.25,
            total: 80213.25,
            assignedAssetId: 'AST-1005',
          },
          {
            id: 'QTI-002',
            productId: 'PROD-006',
            productName: 'Turnkey On-Site Equipment Commissioning & Training',
            sku: 'SRV-COMMISSIONING-8H',
            productType: 'SERVICE',
            quantity: 1,
            unitPrice: 1850,
            discountPercent: 0,
            taxRatePercent: 0,
            subtotal: 1850,
            taxAmount: 0,
            total: 1850,
          },
        ],
        subtotal: 75950,
        discountTotal: 3900,
        taxTotal: 6113.25,
        grandTotal: 82063.25,
        termsAndConditions: 'Net 30 days upon delivery. Warranty 36 months parts and labor. Freight included FOB destination.',
        notes: 'Special bundled contractor pricing approved by Executive Sales.',
        approvedBy: 'Marcus Sterling',
        approvalDate: '2026-01-15T10:00:00Z',
        convertedSalesOrderId: 'SO-2026-001',
      },
      {
        id: 'QT-2026-002',
        quotationNumber: 'QT-2026-002',
        revision: 1,
        customerId: 'CUST-003',
        customerName: 'Metro Logistics & Cold Chain Hub',
        date: '2026-02-05',
        validUntil: '2026-03-05',
        salespersonName: 'Elena Rostova',
        status: 'APPROVED',
        items: [
          {
            id: 'QTI-003',
            productId: 'PROD-002',
            productName: 'Yale ERC-080 Electric Counterbalance Forklift',
            sku: 'MHE-YALE-EL80',
            productType: 'SERIALIZED',
            quantity: 1,
            unitPrice: 51000,
            discountPercent: 3,
            taxRatePercent: 8.25,
            subtotal: 49470,
            taxAmount: 4081.28,
            total: 53551.28,
            assignedAssetId: 'AST-1002',
          },
          {
            id: 'QTI-004',
            productId: 'PROD-004',
            productName: 'Apex Shield ISO VG 46 Premium Hydraulic Fluid (55 Gal Drum)',
            sku: 'FLUID-HYD-ISO46',
            productType: 'QUANTITY_BASED',
            quantity: 2,
            unitPrice: 385,
            discountPercent: 0,
            taxRatePercent: 8.25,
            subtotal: 770,
            taxAmount: 63.53,
            total: 833.53,
          },
        ],
        subtotal: 50240,
        discountTotal: 1530,
        taxTotal: 4144.81,
        grandTotal: 54384.81,
        termsAndConditions: 'Net 30 days. Delivery within 5 business days of purchase order receipt.',
        approvedBy: 'Marcus Sterling',
        approvalDate: '2026-02-06T14:20:00Z',
      },
    ];

    const salesOrders: SalesOrder[] = [
      {
        id: 'SO-2026-001',
        orderNumber: 'SO-2026-001',
        quotationId: 'QT-2026-001',
        customerId: 'CUST-001',
        customerName: 'Horizon Infrastructure & Contracting',
        customerPoReference: 'PO-HORIZON-9941',
        orderDate: '2026-01-16',
        targetDeliveryDate: '2026-01-22',
        deliveryAddress: { street: '450 Sector 9 Expansion Site', city: 'Round Rock', state: 'TX', postalCode: '78664', country: 'United States' },
        status: 'COMPLETED',
        items: [
          {
            id: 'SOI-001',
            productId: 'PROD-001',
            productName: 'Atlas Power APG-1250 kVA Industrial Generator',
            sku: 'GEN-APG-1250',
            productType: 'SERIALIZED',
            quantity: 1,
            unitPrice: 78000,
            discountPercent: 5,
            taxRatePercent: 8.25,
            subtotal: 74100,
            taxAmount: 6113.25,
            total: 80213.25,
            allocatedAssetTag: 'AST-1005',
            allocatedSerialNumber: 'CAT-C15-883190',
            isDelivered: true,
          },
          {
            id: 'SOI-002',
            productId: 'PROD-006',
            productName: 'Turnkey On-Site Equipment Commissioning & Training',
            sku: 'SRV-COMMISSIONING-8H',
            productType: 'SERVICE',
            quantity: 1,
            unitPrice: 1850,
            discountPercent: 0,
            taxRatePercent: 0,
            subtotal: 1850,
            taxAmount: 0,
            total: 1850,
            isDelivered: true,
          },
        ],
        subtotal: 75950,
        discountTotal: 3900,
        taxTotal: 6113.25,
        shippingFee: 1200,
        grandTotal: 83263.25,
        invoicedAmount: 83263.25,
        paidAmount: 83263.25,
        deliveryOrderId: 'DO-2026-001',
        invoiceId: 'INV-2026-001',
      },
      {
        id: 'SO-2026-002',
        orderNumber: 'SO-2026-002',
        customerId: 'CUST-001',
        customerName: 'Horizon Infrastructure & Contracting',
        customerPoReference: 'PO-HORIZON-9988',
        orderDate: '2026-02-10',
        targetDeliveryDate: '2026-02-28',
        deliveryAddress: { street: '450 Sector 9 Expansion Site', city: 'Round Rock', state: 'TX', postalCode: '78664', country: 'United States' },
        status: 'ALLOCATED',
        items: [
          {
            id: 'SOI-003',
            productId: 'PROD-001',
            productName: 'Komatsu PC210LC-11 Hydraulic Crawler Excavator',
            sku: 'HEAVY-KOMATSU-210',
            productType: 'SERIALIZED',
            quantity: 1,
            unitPrice: 210000,
            discountPercent: 2,
            taxRatePercent: 8.25,
            subtotal: 205800,
            taxAmount: 16978.50,
            total: 222778.50,
            allocatedAssetTag: 'AST-1004',
            allocatedSerialNumber: 'KOMATSU-PC210-5881',
            isDelivered: false,
          },
        ],
        subtotal: 205800,
        discountTotal: 4200,
        taxTotal: 16978.50,
        shippingFee: 2500,
        grandTotal: 225278.50,
        invoicedAmount: 32475, // Down payment invoiced
        paidAmount: 0,
      },
    ];

    const rentals: RentalContract[] = [
      {
        id: 'RC-2026-001',
        contractNumber: 'RC-2026-001',
        customerId: 'CUST-002',
        customerName: 'Vertex Energy Systems Ltd',
        customerContact: 'Dr. Gregory House (+1 713 555 8310)',
        status: 'ACTIVE',
        items: [
          {
            assetId: 'AST-1001',
            assetTag: 'AST-1001',
            assetName: 'Atlas Power APG-1250 kVA Industrial Generator',
            serialNumber: 'APG1250-98241B',
            rateType: 'MONTHLY',
            unitRate: 7500,
            durationUnits: 2,
            startDate: '2026-01-10',
            expectedReturnDate: '2026-03-10',
            lineSubtotal: 15000,
          },
        ],
        startDate: '2026-01-10',
        expectedReturnDate: '2026-03-10',
        securityDeposit: 5000,
        deliveryFee: 850,
        pickupFee: 850,
        subtotal: 15000,
        taxAmount: 1237.50,
        grandTotal: 17937.50, // subtotal + tax + delivery + pickup
        depositStatus: 'HELD',
        lateReturnFee: 0,
        damageTotal: 0,
        notes: 'Turnaround maintenance shutdown rental at Pasadena Terminal. 24/7 technical on-call included.',
      },
    ];

    const deliveries: Delivery[] = [
      {
        id: 'DO-2026-001',
        deliveryNumber: 'DO-2026-001',
        sourceType: 'SALES_ORDER',
        sourceReferenceId: 'SO-2026-001',
        customerId: 'CUST-001',
        customerName: 'Horizon Infrastructure & Contracting',
        deliveryAddress: { street: '450 Sector 9 Expansion Site', city: 'Round Rock', state: 'TX', postalCode: '78664', country: 'United States' },
        recipientName: 'Clara Miller (Site Manager)',
        recipientPhone: '+1 512 555 0194',
        dispatchDate: '2026-01-20T08:00:00Z',
        actualDeliveryDate: '2026-01-20T14:45:00Z',
        status: 'CUSTOMER_ACCEPTED',
        driverName: 'Travis Vance (Apex Heavy Logistics)',
        trackingNumber: 'TRK-APX-88219',
        items: [
          {
            productId: 'PROD-001',
            productName: 'Atlas Power APG-1250 kVA Industrial Generator',
            assetTag: 'AST-1005',
            serialNumber: 'CAT-C15-883190',
            quantity: 1,
            verified: true,
          },
        ],
        conditionNotes: 'Delivered in pristine condition, initial run hours 0.0, oil and coolant verified full.',
        digitalSignature: 'Clara Miller (Digital E-Signed)',
        deliveredBy: 'Travis Vance',
        acceptedBy: 'Clara Miller',
      },
    ];

    const invoices: Invoice[] = [
      {
        id: 'INV-2026-001',
        invoiceNumber: 'INV-2026-001',
        type: 'SALES',
        relatedSourceId: 'SO-2026-001',
        relatedSourceType: 'SALES_ORDER',
        customerId: 'CUST-001',
        customerName: 'Horizon Infrastructure & Contracting',
        customerTaxId: 'US-EIN-74-9821345',
        issueDate: '2026-01-20',
        dueDate: '2026-02-19',
        paymentTermsDays: 30,
        currency: 'IDR',
        status: 'PAID',
        items: [
          {
            id: 'INI-001',
            description: 'Atlas Power APG-1250 kVA Industrial Generator (Asset Tag AST-1005 / SN CAT-C15-883190)',
            quantity: 1,
            unitPrice: 78000,
            discountPercent: 5,
            taxRatePercent: 8.25,
            subtotal: 74100,
            taxAmount: 6113.25,
            total: 80213.25,
            assetTag: 'AST-1005',
          },
          {
            id: 'INI-002',
            description: 'Turnkey On-Site Equipment Commissioning & Training (Full Day)',
            quantity: 1,
            unitPrice: 1850,
            discountPercent: 0,
            taxRatePercent: 0,
            subtotal: 1850,
            taxAmount: 0,
            total: 1850,
          },
        ],
        subtotal: 75950,
        discountTotal: 3900,
        taxTotal: 6113.25,
        additionalCharges: 1200, // Shipping fee
        grandTotal: 83263.25,
        paidAmount: 83263.25,
        outstandingBalance: 0,
        terms: 'Payment received in full via ACH wire transfer on Jan 26, 2026.',
      },
      {
        id: 'INV-2026-002',
        invoiceNumber: 'INV-2026-002',
        type: 'RENTAL',
        relatedSourceId: 'RC-2026-001',
        relatedSourceType: 'RENTAL_CONTRACT',
        customerId: 'CUST-002',
        customerName: 'Vertex Energy Systems Ltd',
        customerTaxId: 'US-EIN-82-4419203',
        issueDate: '2026-01-10',
        dueDate: '2026-02-24',
        paymentTermsDays: 45,
        currency: 'IDR',
        status: 'PARTIALLY_PAID',
        items: [
          {
            id: 'INI-003',
            description: 'Rental - Atlas Power APG-1250 kVA Generator (2 Months: Jan 10 to Mar 10, 2026)',
            quantity: 2,
            unitPrice: 7500,
            discountPercent: 0,
            taxRatePercent: 8.25,
            subtotal: 15000,
            taxAmount: 1237.50,
            total: 16237.50,
            assetTag: 'AST-1001',
          },
          {
            id: 'INI-004',
            description: 'Mobilization & Demobilization Logistics Flat Rate',
            quantity: 1,
            unitPrice: 1700,
            discountPercent: 0,
            taxRatePercent: 0,
            subtotal: 1700,
            taxAmount: 0,
            total: 1700,
          },
        ],
        subtotal: 16700,
        discountTotal: 0,
        taxTotal: 1237.50,
        additionalCharges: 0,
        grandTotal: 17937.50,
        paidAmount: 5000, // Security deposit allocated or initial payment
        outstandingBalance: 12937.50,
        terms: 'Net 45 terms per Vertex Energy master lease framework agreement.',
      },
      {
        id: 'INV-2026-003',
        invoiceNumber: 'INV-2026-003',
        type: 'DOWN_PAYMENT',
        relatedSourceId: 'SO-2026-002',
        relatedSourceType: 'SALES_ORDER',
        customerId: 'CUST-001',
        customerName: 'Horizon Infrastructure & Contracting',
        customerTaxId: 'US-EIN-74-9821345',
        issueDate: '2026-02-12',
        dueDate: '2026-03-14',
        paymentTermsDays: 30,
        currency: 'IDR',
        status: 'ISSUED',
        items: [
          {
            id: 'INI-005',
            description: '15% Advance Commitment Down Payment for Komatsu PC210LC-11 Excavator (SO-2026-002)',
            quantity: 1,
            unitPrice: 30000,
            discountPercent: 0,
            taxRatePercent: 8.25,
            subtotal: 30000,
            taxAmount: 2475,
            total: 32475,
            assetTag: 'AST-1004',
          },
        ],
        subtotal: 30000,
        discountTotal: 0,
        taxTotal: 2475,
        additionalCharges: 0,
        grandTotal: 32475,
        paidAmount: 0,
        outstandingBalance: 32475,
        terms: 'Required down payment to guarantee machine dispatch by Feb 28, 2026.',
      },
    ];

    const payments: Payment[] = [
      {
        id: 'PMT-2026-001',
        paymentNumber: 'PMT-2026-001',
        customerId: 'CUST-001',
        customerName: 'Horizon Infrastructure & Contracting',
        paymentDate: '2026-01-26',
        amount: 83263.25,
        currency: 'IDR',
        method: 'BANK_TRANSFER',
        referenceNumber: 'WIRE-CHASE-9921048',
        status: 'CONFIRMED',
        allocations: [
          {
            invoiceId: 'INV-2026-001',
            invoiceNumber: 'INV-2026-001',
            allocatedAmount: 83263.25,
          },
        ],
        unallocatedAmount: 0,
        notes: 'Full settlement for Invoice INV-2026-001 and generator equipment handover.',
        recordedBy: 'Sarah Jenkins',
        receiptNumber: 'RCPT-2026-001',
      },
      {
        id: 'PMT-2026-002',
        paymentNumber: 'PMT-2026-002',
        customerId: 'CUST-002',
        customerName: 'Vertex Energy Systems Ltd',
        paymentDate: '2026-01-12',
        amount: 5000,
        currency: 'IDR',
        method: 'BANK_TRANSFER',
        referenceNumber: 'ACH-WELLS-338210',
        status: 'CONFIRMED',
        allocations: [
          {
            invoiceId: 'INV-2026-002',
            invoiceNumber: 'INV-2026-002',
            allocatedAmount: 5000,
          },
        ],
        unallocatedAmount: 0,
        notes: 'Security deposit and advance booking confirmation for RC-2026-001.',
        recordedBy: 'Sarah Jenkins',
        receiptNumber: 'RCPT-2026-002',
      },
    ];

    const vendors: Vendor[] = [
      {
        id: 'VEND-001',
        vendorCode: 'VEND-001',
        name: 'Atlas Industrial Machinery OEM Ltd',
        contactName: 'Klaus Reinhardt',
        email: 'klaus@atlas-machinery.de',
        phone: '+49 89 2244 800',
        taxId: 'DE-VAT-8910248',
        address: { street: 'Industriestrasse 44', city: 'Munich', state: 'Bavaria', postalCode: '80331', country: 'Germany' },
        paymentTerms: 60,
        currency: 'IDR',
        category: 'OEM Equipment Manufacturer',
      },
      {
        id: 'VEND-002',
        vendorCode: 'VEND-002',
        name: 'Gulf Coast Industrial Fluids & Filters',
        contactName: 'Dale Walker',
        email: 'dwalker@gcfluids.com',
        phone: '+1 713 555 4902',
        taxId: 'US-EIN-76-229104',
        address: { street: '3100 Ship Channel Way', city: 'Houston', state: 'TX', postalCode: '77029', country: 'United States' },
        paymentTerms: 30,
        currency: 'IDR',
        category: 'Consumables & Parts',
      },
    ];

    const purchaseOrders: PurchaseOrder[] = [
      {
        id: 'PO-2026-001',
        poNumber: 'PO-2026-001',
        vendorId: 'VEND-002',
        vendorName: 'Gulf Coast Industrial Fluids & Filters',
        orderDate: '2026-01-08',
        expectedDate: '2026-01-15',
        status: 'GOODS_RECEIVED',
        items: [
          {
            productId: 'PROD-004',
            productName: 'Apex Shield ISO VG 46 Premium Hydraulic Fluid (55 Gal Drum)',
            quantity: 20,
            unitCost: 245,
            totalCost: 4900,
            receivedQuantity: 20,
          },
          {
            productId: 'PROD-005',
            productName: 'Caterpillar Primary Service Filter Maintenance Kit',
            quantity: 15,
            unitCost: 165,
            totalCost: 2475,
            receivedQuantity: 15,
          },
        ],
        subtotal: 7375,
        taxAmount: 608.44,
        grandTotal: 7983.44,
        notes: 'Replenishment for Dallas Central depot stock threshold.',
      },
    ];

    const vendorBills: VendorBill[] = [
      {
        id: 'VBILL-2026-001',
        billNumber: 'BILL-GC-88192',
        purchaseOrderId: 'PO-2026-001',
        vendorId: 'VEND-002',
        vendorName: 'Gulf Coast Industrial Fluids & Filters',
        billDate: '2026-01-16',
        dueDate: '2026-02-15',
        amount: 7983.44,
        paidAmount: 7983.44,
        status: 'PAID',
      },
    ];

    const workOrders: WorkOrder[] = [
      {
        id: 'WO-2026-001',
        workOrderNumber: 'WO-2026-001',
        assetId: 'AST-1003',
        assetTag: 'AST-1003',
        assetName: 'Atlas Copco XAS 188 Portable Diesel Air Compressor',
        title: 'Overheating & Oil Filter Clogged with Mining Dust',
        description: 'Reported by operator Agus Santoso from Morowali Site: Engine temperature reached 105C and the oil pressure indicator turned on.',
        priority: 'HIGH',
        type: 'FIELD_BREAKDOWN',
        assignedTechnician: 'Dani Prasetyo (Head of Technical Service)',
        scheduledDate: '2026-10-15',
        partsCost: 0,
        laborCost: 250,
        totalCost: 250,
        downtimeHours: 4,
        status: 'REPORTED',
        reportedByOperator: 'Agus Santoso',
        damageCategory: 'ENGINE',
      },
      {
        id: 'WO-2026-002',
        workOrderNumber: 'WO-2026-002',
        assetId: 'AST-1006',
        assetTag: 'AST-1006',
        assetName: 'Bobcat S76 Skid-Steer Loader with Hydraulic Grapple',
        title: 'Main Hydraulic Pump Seal Kit Replacement & Calibration',
        description: 'Hydraulic oil is leaking at the swivel joint connection. Disassembly and seal replacement are in progress.',
        priority: 'CRITICAL',
        type: 'CORRECTIVE',
        assignedTechnician: 'Dani Prasetyo',
        scheduledDate: '2026-10-15',
        startedDate: '2026-10-15T08:30:00Z',
        partsCost: 480,
        laborCost: 450,
        totalCost: 930,
        downtimeHours: 8,
        status: 'IN_PROGRESS',
        resolutionNotes: 'Old O-ring removed and OEM seal kit installed. Awaiting 3,000 PSI hydraulic pressure test.',
        sparePartsUsed: [
          {
            productId: 'PRD-004',
            productName: 'Hydraulic Seal Kit Heavy-Duty Series 7',
            itemType: 'GOODS',
            quantity: 2,
            unitCost: 140,
            totalCost: 280,
          },
          {
            productId: 'PRD-006',
            productName: 'Hydraulic Pump Calibration & Flushing Service',
            itemType: 'SERVICE',
            quantity: 1,
            unitCost: 200,
            totalCost: 200,
          },
        ],
      },
      {
        id: 'WO-2026-003',
        workOrderNumber: 'WO-2026-003',
        assetId: 'AST-10024',
        assetTag: 'AST-10024',
        assetName: 'Caterpillar 320D3 Hydraulic Excavator 20-Ton',
        title: '2,500-Hour Scheduled Maintenance & Diesel Filter Replacement',
        description: 'Routine preventive maintenance: replace the engine oil filter and fuel-water separator, and lubricate the swing bearing.',
        priority: 'MEDIUM',
        type: 'PREVENTIVE',
        assignedTechnician: 'Derrick Vance (Senior Mechanic)',
        scheduledDate: '2026-10-13',
        startedDate: '2026-10-13T09:00:00Z',
        completedDate: '2026-10-14T15:30:00Z',
        partsCost: 350,
        laborCost: 300,
        totalCost: 650,
        downtimeHours: 6.5,
        status: 'COMPLETED',
        resolutionNotes: 'All filters replaced. Operational test normal with smooth engine vibration and sound. Ready for operation.',
        sparePartsUsed: [
          {
            productId: 'PRD-005',
            productName: 'Diesel Fuel Filter & Water Separator Element',
            itemType: 'GOODS',
            quantity: 2,
            unitCost: 75,
            totalCost: 150,
          },
          {
            productId: 'PRD-002',
            productName: 'Engine Oil 15W-40 CI-4 Heavy Duty 20L',
            itemType: 'GOODS',
            quantity: 2,
            unitCost: 100,
            totalCost: 200,
          },
        ],
      },
    ];

    const auditLogs: AuditLog[] = [
      {
        id: 'LOG-001',
        timestamp: '2026-01-26T16:15:00Z',
        userId: 'USR-04',
        userName: 'Sarah Jenkins',
        action: 'PAYMENT_ALLOCATED',
        entity: 'INVOICE',
        entityId: 'INV-2026-001',
        details: 'Payment PMT-2026-001 ($83,263.25) fully allocated to Invoice INV-2026-001. Outstanding balance reduced to $0.00.',
      },
      {
        id: 'LOG-002',
        timestamp: '2026-01-20T15:00:00Z',
        userId: 'USR-05',
        userName: 'Carlos Mendez',
        action: 'DELIVERY_CONFIRMED',
        entity: 'ASSET',
        entityId: 'AST-1005',
        details: 'Asset Tag AST-1005 (CAT C15 500kW) marked as SOLD and delivered to Horizon Round Rock site.',
      },
      {
        id: 'LOG-003',
        timestamp: '2026-01-10T11:00:00Z',
        userId: 'USR-03',
        userName: 'David Chen',
        action: 'RENTAL_RESERVED',
        entity: 'RENTAL_CONTRACT',
        entityId: 'RC-2026-001',
        details: 'Asset AST-1001 locked for Vertex Energy 60-day lease. Asset status transitioned to RENTED.',
      },
    ];

    const operators: HeavyEquipmentOperator[] = [
      {
        id: 'OPR-01',
        name: 'Agus Setiawan',
        badgeNumber: 'OPR-B-101',
        phone: '0812-3456-7890',
        email: 'agus.setiawan@apex-field.com',
        status: 'ASSIGNED',
        sioNumber: 'SIO/KEM/EXC/2024/0912',
        sioClass: 'KELAS_1',
        sioExpiry: '2027-08-15',
        equipmentSpecialization: 'Hydraulic Excavator 20T-40T',
        assignedAssetId: 'AST-1004',
        assignedAssetName: 'Komatsu PC210LC-11 Hydraulic Crawler Excavator',
        currentProjectLocation: 'Cibitung-Cilincing Toll Road Project - KM 18',
        hireDate: '2022-03-01',
        notes: 'Active Kemenaker certification; passed the 2025 periodic K3 assessment.',
      },
      {
        id: 'OPR-02',
        name: 'Budi Santoso',
        badgeNumber: 'OPR-B-102',
        phone: '0813-9876-5432',
        email: 'budi.santoso@apex-field.com',
        status: 'STANDBY',
        sioNumber: 'SIO/KEM/CRN/2023/1184',
        sioClass: 'KELAS_1',
        sioExpiry: '2026-11-20',
        equipmentSpecialization: 'Mobile Crane & Rough Terrain Crane 50T',
        assignedAssetId: null,
        assignedAssetName: null,
        currentProjectLocation: 'Cakung Main Depot, East Jakarta',
        hireDate: '2021-06-15',
        notes: 'Ready for assignment to a new project or monthly rental mobilization.',
      },
      {
        id: 'OPR-03',
        name: 'Dedi Suryana',
        badgeNumber: 'OPR-B-103',
        phone: '0821-4455-6677',
        email: 'dedi.suryana@apex-field.com',
        status: 'ASSIGNED',
        sioNumber: 'SIO/DISN/FKL/2025/0319',
        sioClass: 'KELAS_2',
        sioExpiry: '2028-03-10',
        equipmentSpecialization: 'Electric & Diesel Warehouse Forklift 3T-10T',
        assignedAssetId: 'AST-1002',
        assignedAssetName: 'Yale ERC-080 Heavy Electric Warehouse Forklift',
        currentProjectLocation: 'Modern Logistics Warehouse, Fort Worth Dock C',
        hireDate: '2023-01-10',
        notes: 'Skilled in warehouse racking operations and lithium-ion battery handling.',
      },
      {
        id: 'OPR-04',
        name: 'Wahyu Hidayat',
        badgeNumber: 'OPR-B-104',
        phone: '0856-7788-9900',
        email: 'wahyu.h@apex-field.com',
        status: 'ON_LEAVE',
        sioNumber: 'SIO/KEM/BLD/2022/8821',
        sioClass: 'KELAS_1',
        sioExpiry: '2026-05-30',
        equipmentSpecialization: 'Crawler Bulldozer & Wheel Loader Heavy',
        assignedAssetId: null,
        assignedAssetName: null,
        currentProjectLocation: 'Surabaya Depot',
        hireDate: '2020-09-01',
        notes: 'On annual leave through October 25, 2026.',
      },
    ];

    const statusLogs: AssetDailyStatusLog[] = [
      {
        id: 'LOG-STAT-001',
        assetId: 'AST-10024',
        assetTag: 'AST-10024',
        assetName: 'Caterpillar 320D3 Hydraulic Excavator 20-Ton',
        submittedAt: '2026-10-14T07:30:00Z',
        submittedBy: 'Agus Santoso',
        submittedByUserId: 'USR-09',
        status: 'WORKING',
        hourMeter: 2450.5,
        location: 'Site Morowali Blok B-4',
        damageCategory: 'NONE',
        damageDescription: 'Unit operating normally; bucket pin lubrication and hydraulic fluid level are stable.',
      },
      {
        id: 'LOG-STAT-002',
        assetId: 'AST-10088',
        assetTag: 'AST-10088',
        assetName: 'Kobelco CKE2500-2 Lattice Boom Crawler Crane 250T',
        submittedAt: '2026-10-14T08:15:00Z',
        submittedBy: 'Budi Santoso',
        submittedByUserId: 'OPR-01',
        status: 'WORKING',
        hourMeter: 3120.0,
        location: 'IKN Nusantara Dermaga Logistik',
        damageCategory: 'NONE',
        damageDescription: 'Safety limit switch and SLI (Safe Load Indicator) are calibrated correctly.',
      },
      {
        id: 'LOG-STAT-003',
        assetId: 'AST-1003',
        assetTag: 'AST-1003',
        assetName: 'Atlas Copco XAS 188 Portable Diesel Air Compressor',
        submittedAt: '2026-10-15T06:45:00Z',
        submittedBy: 'Agus Santoso',
        submittedByUserId: 'USR-09',
        status: 'DAMAGED',
        hourMeter: 1890.2,
        location: 'Site Morowali Workshop',
        damageCategory: 'ENGINE',
        damageSeverity: 'MEDIUM',
        damageDescription: 'Overheating at 105C; the oil filter is clogged with mine dust.',
        workOrderIdCreated: 'WO-2026-004',
      },
    ];

    const attendanceLogs: OperatorAttendanceLog[] = [
      {
        id: 'ATT-2026-001',
        date: '2026-10-14',
        operatorId: 'OPR-01',
        operatorName: 'Agus Setiawan',
        operatorBadge: 'OPR-B-101',
        assetId: 'AST-10024',
        assetTag: 'AST-10024',
        assetName: 'Caterpillar 320D3 Hydraulic Excavator 20-Ton',
        customerId: 'CUST-001',
        customerName: 'Horizon Infrastructure & Contracting',
        projectName: 'Cibitung-Cilincing Toll Road Project - KM 18',
        checkInTime: '07:00:00',
        checkInHourMeter: 2442.0,
        checkOutTime: '16:30:00',
        checkOutHourMeter: 2450.5,
        workingHours: 8.5,
        status: 'CHECKED_OUT',
        notes: 'Normal drainage channel excavation operations in clear weather.',
        verifiedForBilling: true,
      },
      {
        id: 'ATT-2026-002',
        date: '2026-10-15',
        operatorId: 'OPR-01',
        operatorName: 'Agus Setiawan',
        operatorBadge: 'OPR-B-101',
        assetId: 'AST-10024',
        assetTag: 'AST-10024',
        assetName: 'Caterpillar 320D3 Hydraulic Excavator 20-Ton',
        customerId: 'CUST-001',
        customerName: 'Horizon Infrastructure & Contracting',
        projectName: 'Cibitung-Cilincing Toll Road Project - KM 18',
        checkInTime: '07:00:00',
        checkInHourMeter: 2450.5,
        status: 'CHECKED_IN',
        notes: 'Morning check-in; equipment ready for shift 1 operations.',
        verifiedForBilling: false,
      },
      {
        id: 'ATT-2026-003',
        date: '2026-10-14',
        operatorId: 'OPR-02',
        operatorName: 'Budi Santoso',
        operatorBadge: 'OPR-B-102',
        assetId: 'AST-10088',
        assetTag: 'AST-10088',
        assetName: 'Kobelco CKE2500-2 Lattice Boom Crawler Crane 250T',
        customerId: 'CUST-002',
        customerName: 'Apex Petrochemical & Energy Ltd',
        projectName: 'IKN Nusantara Dermaga Logistik',
        checkInTime: '07:30:00',
        checkInHourMeter: 3112.0,
        checkOutTime: '17:00:00',
        checkOutHourMeter: 3120.0,
        workingHours: 8.0,
        status: 'CHECKED_OUT',
        notes: 'Pier 4 girder beam erection; load test passed safely.',
        verifiedForBilling: true,
      },
      {
        id: 'ATT-2026-004',
        date: '2026-10-15',
        operatorId: 'USR-09',
        operatorName: 'Agus Santoso',
        operatorBadge: 'OPR-009',
        assetId: 'AST-1003',
        assetTag: 'AST-1003',
        assetName: 'Atlas Copco XAS 188 Portable Diesel Air Compressor',
        customerId: 'CUST-001',
        customerName: 'Horizon Infrastructure & Contracting',
        projectName: 'Site Morowali Workshop',
        checkInTime: '06:30:00',
        checkInHourMeter: 1888.0,
        checkOutTime: '08:00:00',
        checkOutHourMeter: 1890.2,
        workingHours: 2.2,
        status: 'BREAKDOWN_REPORTED',
        breakdownReportId: 'WO-2026-001',
        notes: 'Engine stopped unexpectedly after 2 hours of operation; referred to Technical Service.',
        verifiedForBilling: false,
      },
    ];

    const notifications: AppNotification[] = [
      {
        id: 'NTF-2026-001',
        timestamp: '2026-10-15T08:25:00Z',
        sourceDepartment: 'Field Operations',
        sourceUserName: 'Agus Santoso (Equipment Operator)',
        title: 'Field Equipment Breakdown Report',
        message: 'Atlas Copco Compressor [AST-1003] at Morowali Site was reported to have stopped unexpectedly after 2 hours of operation. Emergency repair ticket WO-2026-001 was created automatically and forwarded to Technical Service.',
        category: 'MAINTENANCE',
        severity: 'CRITICAL',
        targetRoles: ['TECHNICAL_SERVICE', 'EXECUTIVE', 'ADMIN_IT', 'MANAGEMENT_OPERATION', 'ASSET_CONTROL'],
        relatedEntity: 'ASSET',
        relatedEntityId: 'AST-1003',
        targetTab: 'technical-service',
        isRead: false,
      },
      {
        id: 'NTF-2026-002',
        timestamp: '2026-10-15T07:45:00Z',
        sourceDepartment: 'Technical Service (Workshop)',
        sourceUserName: 'Dani Prasetyo (Head Mechanic)',
        title: 'Service Started & Spare Parts Replacement',
        message: 'A mechanic scanned the CAT 320D Excavator [AST-10024] barcode and started replacing the hydraulic O-ring seal kit from procurement stock. Equipment status changed to In Service.',
        category: 'OPERATIONAL',
        severity: 'INFO',
        targetRoles: ['EXECUTIVE', 'ADMIN_IT', 'MANAGEMENT_OPERATION', 'ASSET_CONTROL'],
        relatedEntity: 'WORK_ORDER',
        relatedEntityId: 'WO-2026-002',
        targetTab: 'technical-service',
        isRead: false,
      },
      {
        id: 'NTF-2026-003',
        timestamp: '2026-10-15T07:15:00Z',
        sourceDepartment: 'Sales & Marketing',
        sourceUserName: 'Elena Rostova (Commercial Lead)',
        title: 'Quotation Approved & Sales Order Issued',
        message: 'Equipment rental quotation QT-2026-0042 for PT Freeport Indonesia was approved by the customer (Lump Sum + Mobilization/Demobilization Fee). Sales Order SO-2026-0089 was created automatically and is ready for mobilization.',
        category: 'COMMERCIAL',
        severity: 'SUCCESS',
        targetRoles: ['SALES_MARKETING', 'EXECUTIVE', 'ADMIN_IT', 'ASSET_CONTROL', 'FINANCE_ACCOUNTING_TAX', 'MANAGEMENT_OPERATION'],
        relatedEntity: 'QUOTATION',
        relatedEntityId: 'QT-2026-0042',
        targetTab: 'quotations',
        isRead: false,
      },
      {
        id: 'NTF-2026-004',
        timestamp: '2026-10-15T06:50:00Z',
        sourceDepartment: 'Procurement',
        sourceUserName: 'Dewi Lestari (Procurement Manager)',
        title: 'Purchase Order Approved & Bill Sent to Finance',
        message: 'Purchase Order PO-2026-0038 for hydraulic filters and engine oil valued at IDR 14,500 from PT United Tractors Tbk was approved. The vendor bill with NET 30 terms has been sent to Finance.',
        category: 'FINANCIAL',
        severity: 'INFO',
        targetRoles: ['PROCUREMENT', 'FINANCE_ACCOUNTING_TAX', 'EXECUTIVE', 'ADMIN_IT'],
        relatedEntity: 'PO',
        relatedEntityId: 'PO-2026-0038',
        targetTab: 'procurement',
        isRead: false,
      },
      {
        id: 'NTF-2026-005',
        timestamp: '2026-10-15T06:20:00Z',
        sourceDepartment: 'Field Operations',
        sourceUserName: 'Agus Santoso (Equipment Operator)',
        title: 'Shift Timesheet Complete: Ready for Billing',
        message: 'Operator check-out for CAT 320D Excavator [AST-10024] was recorded with 8.5 operating hours (HM 2450.5 to 2459.0). Data verified for PT Morowali Mining customer monthly billing attachment.',
        category: 'OPERATIONAL',
        severity: 'SUCCESS',
        targetRoles: ['MANAGEMENT_OPERATION', 'FINANCE_ACCOUNTING_TAX', 'AR_MANAGEMENT', 'EXECUTIVE'],
        relatedEntity: 'TIMESHEET',
        relatedEntityId: 'AST-10024',
        targetTab: 'operator-status',
        isRead: false,
      },
      {
        id: 'NTF-2026-006',
        timestamp: '2026-10-15T05:40:00Z',
        sourceDepartment: 'Accounting Finance & Tax (FAT)',
        sourceUserName: 'Sarah Jenkins (Finance Lead)',
        title: 'Invoice Payment Received & Cash Balance Increased',
        message: 'A payment of IDR 35,000 from PT Freeport Indonesia for Invoice INV-2026-0021 was verified via Bank Mandiri transfer. The company cash balance increased and customer receivables decreased.',
        category: 'FINANCIAL',
        severity: 'SUCCESS',
        targetRoles: ['FINANCE_ACCOUNTING_TAX', 'AR_MANAGEMENT', 'SALES_MARKETING', 'EXECUTIVE'],
        relatedEntity: 'PAYMENT',
        relatedEntityId: 'PMT-2026-0077',
        targetTab: 'payments',
        isRead: false,
      },
      {
        id: 'NTF-2026-007',
        timestamp: '2026-10-14T16:30:00Z',
        sourceDepartment: 'Asset Control (Equipment Compliance)',
        sourceUserName: 'Bambang Pratama (Asset Control)',
        title: 'Warning: Equipment Permit (SIA) Expiring Soon',
        message: 'The Kemenaker Equipment Permit (SIA) for Kobelco 250T Crane [AST-10088] expires in 14 days. Please schedule a K3 safety inspection with the local labor office.',
        category: 'LEGAL',
        severity: 'WARNING',
        targetRoles: ['ASSET_CONTROL', 'MANAGEMENT_OPERATION', 'EXECUTIVE', 'ADMIN_IT'],
        relatedEntity: 'ASSET',
        relatedEntityId: 'AST-10088',
        targetTab: 'assets',
        isRead: true,
      },
      {
        id: 'NTF-2026-008',
        timestamp: '2026-10-14T14:10:00Z',
        sourceDepartment: 'AR Management (Receivables)',
        sourceUserName: 'Reza Ramadhan (AR Specialist)',
        title: 'Overdue Receivable (45 Days Past Due)',
        message: 'Invoice INV-2026-0105 valued at IDR 85,000 for PT Vale Indonesia is 45 days past due. A first warning letter has been issued and new orders are temporarily on hold.',
        category: 'FINANCIAL',
        severity: 'WARNING',
        targetRoles: ['AR_MANAGEMENT', 'FINANCE_ACCOUNTING_TAX', 'EXECUTIVE', 'SALES_MARKETING'],
        relatedEntity: 'INVOICE',
        relatedEntityId: 'INV-2026-0105',
        targetTab: 'invoices',
        isRead: true,
      },
      {
        id: 'NTF-2026-009',
        timestamp: '2026-10-14T11:20:00Z',
        sourceDepartment: 'Logistik & Delivery',
        sourceUserName: 'Hadi Suryanto (Delivery Coordinator)',
        title: 'Heavy Equipment Handover Complete (DO Confirmed)',
        message: 'Delivery Order DO-2026-0089 for Hyster 5T Forklift was received and digitally signed by PT Nusa Halmahera at Weda Bay Site. The equipment is now officially RENTED.',
        category: 'OPERATIONAL',
        severity: 'SUCCESS',
        targetRoles: ['ASSET_CONTROL', 'SALES_MARKETING', 'MANAGEMENT_OPERATION', 'FINANCE_ACCOUNTING_TAX'],
        relatedEntity: 'DELIVERY',
        relatedEntityId: 'DO-2026-0089',
        targetTab: 'deliveries',
        isRead: true,
      },
      {
        id: 'NTF-2026-010',
        timestamp: '2026-10-14T09:00:00Z',
        sourceDepartment: 'Divisi IT & Infrastruktur',
        sourceUserName: 'Hendra Wijaya (IT Administrator)',
        title: 'User Account Password Reset Successfully',
        message: 'The password for technician Dani Prasetyo (dani.tech@apex-industrial.com) was reset by the IT Administrator. Temporary login credentials were securely updated.',
        category: 'SYSTEM',
        severity: 'INFO',
        targetRoles: ['ADMIN_IT', 'TECHNICAL_SERVICE', 'EXECUTIVE'],
        relatedEntity: 'USER',
        relatedEntityId: 'USR-10',
        targetTab: 'user-management',
        isRead: true,
      },
    ];

    return {
      users,
      assets,
      products,
      customers,
      quotations,
      salesOrders,
      rentals,
      deliveries,
      invoices,
      payments,
      vendors,
      purchaseOrders,
      vendorBills,
      workOrders,
      auditLogs,
      settings,
      operators,
      statusLogs,
      attendanceLogs,
      notifications,
      drafts: [],
    };
  }
}

export const db = new EamsDatabase();
