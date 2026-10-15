export type UserRole =
  | 'EXECUTIVE'
  | 'ADMIN_IT'
  | 'SALES_MARKETING'
  | 'ASSET_CONTROL'
  | 'MANAGEMENT_OPERATION'
  | 'PROCUREMENT'
  | 'FINANCE_ACCOUNTING_TAX'
  | 'AR_MANAGEMENT'
  | 'OPERATOR_USER'
  | 'TECHNICAL_SERVICE';

export interface UserPermissionMatrix {
  canViewDashboard: boolean;
  canManageAssets: boolean;
  canUploadLegalDocs: boolean; // STNK, BPKB, SIA
  canManageOperators: boolean; // SIO & Assignment
  canScanAndSubmitStatus: boolean; // Field scan & submit status
  canManageMaintenance: boolean; // Barcode repair & work orders
  canAccessTechnicalService: boolean; // Technical Service role
  canManageQuotations: boolean;
  canManageSalesRentals: boolean;
  canManageInvoices: boolean;
  canManagePayments: boolean;
  canManageProcurement: boolean;
  canManageUsers: boolean; // IT role
  canAccessApiAndAudit: boolean; // IT role
  canExportReports: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatar?: string;
  phone?: string;
  employeeBadge?: string;
  assignedBranch?: string; // e.g. 'Jakarta HQ', 'Balikpapan Branch', 'Morowali Site'
  status?: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  permissions?: Partial<UserPermissionMatrix>;
  lastLogin?: string;
}

export type AssetStatus = 'AVAILABLE' | 'RENTED' | 'SOLD' | 'IN_MAINTENANCE' | 'RESERVED' | 'DISPOSED';
export type AssetCondition = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'NEEDS_REPAIR' | 'DAMAGED';

export interface HeavyEquipmentDocs {
  stnkNumber?: string;
  stnkExpiry?: string;
  stnkFileUrl?: string; // Data URL or storage link
  stnkFileName?: string;
  bpkbNumber?: string;
  bpkbFileUrl?: string;
  bpkbFileName?: string;
  bpkbIssuer?: string;
  siaNumber?: string; // Surat Ijin Alat (Kemenaker / Disnaker)
  siaExpiry?: string;
  siaFileUrl?: string;
  siaFileName?: string;
  siaIssuer?: string;
  chassisNumber?: string; // Nomor Rangka
  engineNumber?: string; // Nomor Mesin
  plateNumber?: string; // Nomor Polisi Plat Kuning/Hitam
  hourMeter?: number; // Current HM / Hours
  lastInspectionDate?: string;
  nextInspectionDue?: string;
  documentStatus?: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED';
}

export interface HeavyEquipmentOperator {
  id: string;
  name: string;
  badgeNumber: string;
  phone: string;
  email?: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'ASSIGNED' | 'STANDBY';
  sioNumber: string; // Surat Ijin Operator
  sioClass: 'KELAS_1' | 'KELAS_2' | 'KELAS_3';
  sioExpiry: string;
  sioIssuer?: string;
  sioFileUrl?: string;
  sioFileName?: string;
  equipmentSpecialization: string; // e.g. Excavator 20-30T, Mobile Crane 50T, Forklift 5T
  assignedAssetId?: string | null;
  assignedAssetTag?: string | null;
  assignedAssetName?: string | null;
  assignedCustomerId?: string | null;
  assignedCustomerName?: string | null;
  assignedProjectName?: string | null;
  currentProjectLocation?: string;
  hireDate: string;
  notes?: string;
}

export interface OperatorAttendanceLog {
  id: string;
  date: string; // YYYY-MM-DD
  operatorId: string;
  operatorName: string;
  operatorBadge: string;
  assetId: string;
  assetTag: string;
  assetName: string;
  customerId?: string;
  customerName?: string;
  projectName?: string;
  checkInTime: string; // HH:mm or ISO
  checkInHourMeter: number;
  checkOutTime?: string;
  checkOutHourMeter?: number;
  workingHours?: number; // calculated hours
  status: 'CHECKED_IN' | 'CHECKED_OUT' | 'BREAKDOWN_REPORTED';
  breakdownReportId?: string;
  notes?: string;
  verifiedForBilling?: boolean;
}

export interface AssetDailyStatusLog {
  id: string;
  assetId: string;
  assetTag: string;
  assetName: string;
  submittedAt: string;
  submittedBy: string;
  submittedByUserId?: string;
  status: 'WORKING' | 'DAMAGED' | 'STANDBY';
  hourMeter: number;
  location: string;
  damageCategory?: 'ENGINE' | 'HYDRAULIC' | 'ELECTRICAL' | 'CHASSIS_TRACK' | 'STRUCTURE_BOOM' | 'BRAKES_STEERING' | 'OTHER' | 'NONE';
  damageSeverity?: 'MINOR' | 'MEDIUM' | 'MAJOR' | 'CRITICAL_SHUTDOWN';
  damageDescription?: string;
  photoEvidenceUrl?: string;
  workOrderIdCreated?: string;
}

export interface Asset {
  id: string;
  assetTag: string; // e.g. AST-10024
  serialNumber: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  status: AssetStatus;
  condition: AssetCondition;
  warehouseLocation: string;
  purchaseCost: number; // in USD
  currentBookValue: number;
  depreciationRateAnnual: number; // percentage
  purchaseDate: string;
  warrantyExpiry: string;
  currentCustomerId?: string | null;
  currentCustomerName?: string | null;
  activeRentalContractId?: string | null;
  activeSalesOrderId?: string | null;
  dailyRentalRate: number;
  weeklyRentalRate: number;
  monthlyRentalRate: number;
  sellPrice?: number;
  imageUrl?: string;
  specs: Record<string, string>;
  notes?: string;
  legalDocs?: HeavyEquipmentDocs;
  gpsLocation?: {
    latitude: number;
    longitude: number;
    siteName: string;
    cityName: string;
    provinceName: string;
    lastGpsPing?: string;
    speedKmh?: number;
    ignitionOn?: boolean;
  };
}

export type ProductType = 'SERIALIZED' | 'QUANTITY_BASED' | 'SERVICE';

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  model: string;
  productType: ProductType;
  unitOfMeasure: string;
  salesPrice: number;
  purchaseCost: number;
  taxRatePercent: number;
  stockQuantity: number;
  reservedQuantity: number;
  reorderLevel: number;
  warehouse: string;
  isActive: boolean;
  imageUrl?: string;
  documents?: string[];
  associatedAssetIds?: string[];
}

export interface CustomerContact {
  name: string;
  title: string;
  email: string;
  phone: string;
  isPrimary: boolean;
}

export interface CustomerAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Customer {
  id: string;
  customerCode: string; // e.g. CUST-001
  type: 'COMPANY' | 'INDIVIDUAL';
  name: string;
  taxId: string;
  contacts: CustomerContact[];
  billingAddress: CustomerAddress;
  deliveryAddress: CustomerAddress;
  creditLimit: number;
  outstandingBalance: number;
  paymentTermsDays: number;
  currency: string;
  status: 'ACTIVE' | 'ON_HOLD' | 'INACTIVE';
  notes?: string;
  createdAt: string;
}

export type QuotationStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED';
export type RentalRateModel = 'REGULAR' | 'LUMPSUM';

export interface QuotationItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  productType: ProductType;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxRatePercent: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  assignedAssetId?: string;
  // Dynamic Equipment & Rate Configuration
  equipmentNumber?: string; // Nomor unit/alat berat (e.g. AST-10024)
  equipmentType?: string; // Jenis alat (e.g. Excavator 20-Ton, Crane 50-Ton)
  rateModel?: RentalRateModel; // REGULAR (Jam/Hari/Bulan) vs LUMPSUM
  rentalRate?: number; // Nilai sewa alat
  mobilizationFee?: number; // Biaya mobilisasi ke lokasi proyek
  demobilizationFee?: number; // Biaya demobilisasi pengembalian
  mobilizationDate?: string;
  demobilizationDate?: string;
}

export interface Quotation {
  id: string;
  quotationNumber: string; // e.g. QT-2026-0042
  revision: number;
  customerId: string;
  customerName: string;
  date: string;
  validUntil: string;
  salespersonName: string;
  status: QuotationStatus;
  items: QuotationItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  mobilizationTotal?: number;
  demobilizationTotal?: number;
  grandTotal: number;
  notes?: string;
  termsAndConditions: string;
  approvedBy?: string;
  approvalDate?: string;
  convertedSalesOrderId?: string;
  linkedSalesOrderNumber?: string;
}

export type SalesOrderStatus = 'PENDING' | 'CONFIRMED' | 'ALLOCATED' | 'DELIVERING' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';

export interface SalesOrderItem extends QuotationItem {
  allocatedAssetTag?: string;
  allocatedSerialNumber?: string;
  isDelivered?: boolean;
}

export interface SalesOrder {
  id: string;
  orderNumber: string; // e.g. SO-2026-0105
  quotationId?: string;
  quotationReference?: string; // Nomor Quotation rujukan e.g. QT-2026-0042
  customerId: string;
  customerName: string;
  customerPoReference: string;
  orderDate: string;
  targetDeliveryDate: string;
  deliveryAddress: CustomerAddress;
  status: SalesOrderStatus;
  items: SalesOrderItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingFee: number;
  mobilizationTotal?: number;
  demobilizationTotal?: number;
  grandTotal: number;
  invoicedAmount: number;
  paidAmount: number;
  cancellationReason?: string;
  deliveryOrderId?: string;
  invoiceId?: string;
}

export type RentalStatus = 'QUOTATION' | 'RESERVED' | 'ACTIVE' | 'OVERDUE' | 'RETURNED' | 'INSPECTED' | 'SETTLED' | 'CANCELLED';
export type RentalRateType = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface RentalItem {
  assetId: string;
  assetTag: string;
  assetName: string;
  serialNumber: string;
  rateType: RentalRateType;
  unitRate: number;
  durationUnits: number; // e.g. 14 days, 3 weeks
  startDate: string;
  expectedReturnDate: string;
  actualReturnDate?: string;
  lineSubtotal: number;
  returnCondition?: AssetCondition;
  damageCharge?: number;
  inspectionNotes?: string;
}

export interface RentalContract {
  id: string;
  contractNumber: string; // e.g. RC-2026-0019
  customerId: string;
  customerName: string;
  customerContact: string;
  status: RentalStatus;
  items: RentalItem[];
  startDate: string;
  expectedReturnDate: string;
  actualReturnDate?: string;
  securityDeposit: number;
  deliveryFee: number;
  pickupFee: number;
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  depositStatus: 'HELD' | 'REFUNDED' | 'APPLIED_TO_DAMAGES';
  lateReturnFee: number;
  damageTotal: number;
  signedDocumentUrl?: string;
  notes?: string;
  extensionHistory?: {
    previousReturnDate: string;
    newReturnDate: string;
    extendedAt: string;
    addedAmount: number;
  }[];
}

export type DeliveryStatus = 'DRAFT' | 'PICKED' | 'IN_TRANSIT' | 'DELIVERED' | 'CUSTOMER_ACCEPTED' | 'RETURN_DISPATCHED';

export interface DeliveryItem {
  productId: string;
  productName: string;
  assetTag?: string;
  serialNumber?: string;
  quantity: number;
  verified: boolean;
}

export interface Delivery {
  id: string;
  deliveryNumber: string; // e.g. DO-2026-0089
  sourceType: 'SALES_ORDER' | 'RENTAL_CONTRACT' | 'RETURN';
  sourceReferenceId: string;
  customerId: string;
  customerName: string;
  deliveryAddress: CustomerAddress;
  recipientName: string;
  recipientPhone: string;
  dispatchDate: string;
  actualDeliveryDate?: string;
  status: DeliveryStatus;
  driverName?: string;
  trackingNumber?: string;
  items: DeliveryItem[];
  conditionNotes?: string;
  digitalSignature?: string; // Base64 or name signer
  deliveredBy?: string;
  acceptedBy?: string;
}

export type InvoiceType = 'SALES' | 'RENTAL' | 'RECURRING_RENTAL' | 'DOWN_PAYMENT' | 'MILESTONE' | 'CREDIT_NOTE' | 'DEBIT_NOTE';
export type InvoiceStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'CREDITED';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxRatePercent: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  assetTag?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. INV-2026-0033
  type: InvoiceType;
  relatedSourceId?: string;
  relatedSourceType?: 'SALES_ORDER' | 'RENTAL_CONTRACT' | 'INVOICE_AMENDMENT';
  customerId: string;
  customerName: string;
  customerTaxId: string;
  issueDate: string;
  dueDate: string;
  paymentTermsDays: number;
  currency: string;
  status: InvoiceStatus;
  items: InvoiceItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  additionalCharges: number;
  grandTotal: number;
  paidAmount: number;
  outstandingBalance: number;
  notes?: string;
  terms: string;
  originalInvoiceId?: string; // If this is a credit note
  creditNoteReason?: string;
}

export type PaymentMethod = 'BANK_TRANSFER' | 'CARD' | 'CASH' | 'CHECK';
export type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'FAILED' | 'REVERSED' | 'REFUNDED';

export interface PaymentAllocation {
  invoiceId: string;
  invoiceNumber: string;
  allocatedAmount: number;
}

export interface Payment {
  id: string;
  paymentNumber: string; // e.g. PMT-2026-0077
  customerId: string;
  customerName: string;
  paymentDate: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  referenceNumber: string; // bank reference, check no, transaction id
  status: PaymentStatus;
  allocations: PaymentAllocation[];
  unallocatedAmount: number;
  notes?: string;
  recordedBy: string;
  receiptNumber: string;
}

export interface Vendor {
  id: string;
  vendorCode: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  taxId: string;
  address: CustomerAddress;
  paymentTerms: number;
  currency: string;
  category: string;
}

export type PurchaseOrderStatus = 'DRAFT' | 'APPROVED' | 'GOODS_RECEIVED' | 'BILLED' | 'CANCELLED';
export type ProcurementItemType = 'GOODS' | 'SERVICE';

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  itemType?: ProcurementItemType; // BARANG atau JASA
  quantity: number;
  unitCost: number;
  taxRatePercent?: number; // e.g. 11% PPN
  taxAmount?: number;
  totalCost: number;
  receivedQuantity: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  vendorTaxId?: string;
  orderDate: string;
  expectedDate: string;
  paymentTerms?: string; // e.g. "Net 30", "Net 15", "Cash on Delivery"
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  notes?: string;
  vendorBillId?: string;
}

export interface VendorBill {
  id: string;
  billNumber: string;
  purchaseOrderId?: string;
  vendorId: string;
  vendorName: string;
  billDate: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
}

export interface WorkOrderSparePartUsed {
  productId: string;
  productName: string;
  itemType: 'GOODS' | 'SERVICE';
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface WorkOrder {
  id: string;
  workOrderNumber: string;
  assetId: string;
  assetTag: string;
  assetName: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type: 'PREVENTIVE' | 'CORRECTIVE' | 'RENTAL_RETURN_INSPECTION' | 'FIELD_BREAKDOWN';
  assignedTechnician: string;
  scheduledDate: string;
  startedDate?: string;
  completedDate?: string;
  partsCost: number;
  laborCost: number;
  totalCost: number;
  downtimeHours: number;
  status: 'REPORTED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  resolutionNotes?: string;
  sparePartsUsed?: WorkOrderSparePartUsed[];
  reportedByOperator?: string;
  damageCategory?: string;
  photoUrl?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
}

export interface SystemSettings {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  taxRegistrationNumber: string;
  defaultCurrency: string;
  defaultTaxRatePercent: number;
  quotationPrefix: string;
  salesOrderPrefix: string;
  rentalPrefix: string;
  invoicePrefix: string;
  paymentPrefix: string;
  deliveryPrefix: string;
  strictAssetLocking: boolean;
}

export interface AppNotification {
  id: string;
  timestamp: string;
  sourceDepartment: string; // e.g. 'Operasional Lapangan', 'Technical Service (Bengkel)', 'Sales & CRM', 'Procurement', 'Finance & FAT', 'Asset Control', 'Divisi IT'
  sourceUserName: string;
  title: string;
  message: string;
  category: 'OPERATIONAL' | 'FINANCIAL' | 'MAINTENANCE' | 'COMMERCIAL' | 'LEGAL' | 'SYSTEM';
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
  targetRoles?: UserRole[];
  relatedEntity?: string;
  relatedEntityId?: string;
  targetTab?: string;
  isRead: boolean;
}

