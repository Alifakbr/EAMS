import { exportExcelFromHtml } from '../utils/download.ts';
import React, { useState, useMemo, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  FileText,
  Boxes,
  Truck,
  ShieldAlert,
  Calendar,
  FileSpreadsheet,
  Download,
  Filter,
  Check,
  Briefcase,
  Users,
  Wrench,
  CreditCard,
  Banknote,
  Sparkles,
  PackageCheck,
  CheckCircle2,
  Printer,
  Terminal,
  ShieldCheck,
  PackageSearch,
  QrCode,
  MapPin,
  Compass,
  Eye,
  Search,
  FileCheck,
  Receipt,
  Building2,
} from 'lucide-react';
import { AuditLog, UserRole, Asset } from '../types/index.ts';
import { Sparkline, SparklinePoint } from './Sparkline.tsx';
import { FleetGpsMap } from './FleetGpsMap.tsx';
import { DocumentPreviewModal, SupportedDocType } from './DocumentPreviewModal.tsx';
import { api } from '../services/api.ts';
import { formatRupiahAmount } from '../shared/currency.tsx';

interface DashboardViewProps {
  metrics: {
    netInvoicedRevenue: number;
    totalCollectedPayments: number;
    totalOutstandingAR: number;
    overdueAmount: number;
    salesRevenue: number;
    rentalRevenue: number;
    utilizationRate: number;
    activeRentalsCount: number;
    availableAssetsCount: number;
  };
  auditLogs: AuditLog[];
  userRole?: UserRole;
  onNavigate: (tab: string) => void;
  onOpenQuickNew: (type?: string) => void;
}

export interface MonthlyRecord {
  monthKey: string;
  date: string;
  label: string;
  invoicedRevenue: number;
  collectedPayments: number;
  outstandingAR: number;
  utilizationRate: number;
  salesRevenue: number;
  rentalRevenue: number;
  overdueAmount: number;
}

// Master monthly historical datasets for all commercial charts
const MASTER_MONTHLY_DATA: MonthlyRecord[] = [
  {
    monthKey: '2025-11',
    date: '2025-11-01',
    label: 'Nov 25',
    invoicedRevenue: 48500,
    collectedPayments: 39000,
    outstandingAR: 42000,
    utilizationRate: 55.0,
    salesRevenue: 28000,
    rentalRevenue: 20500,
    overdueAmount: 12400,
  },
  {
    monthKey: '2025-12',
    date: '2025-12-01',
    label: 'Dec 25',
    invoicedRevenue: 64200,
    collectedPayments: 52400,
    outstandingAR: 38500,
    utilizationRate: 62.0,
    salesRevenue: 38200,
    rentalRevenue: 26000,
    overdueAmount: 10200,
  },
  {
    monthKey: '2026-01',
    date: '2026-01-01',
    label: 'Jan 26',
    invoicedRevenue: 83260,
    collectedPayments: 74200,
    outstandingAR: 46200,
    utilizationRate: 71.0,
    salesRevenue: 51260,
    rentalRevenue: 32000,
    overdueAmount: 14100,
  },
  {
    monthKey: '2026-02',
    date: '2026-02-01',
    label: 'Feb 26',
    invoicedRevenue: 104100,
    collectedPayments: 88260,
    outstandingAR: 41800,
    utilizationRate: 76.0,
    salesRevenue: 64100,
    rentalRevenue: 40000,
    overdueAmount: 11500,
  },
  {
    monthKey: '2026-03',
    date: '2026-03-01',
    label: 'Mar 26',
    invoicedRevenue: 118400,
    collectedPayments: 92800,
    outstandingAR: 35900,
    utilizationRate: 80.0,
    salesRevenue: 72400,
    rentalRevenue: 46000,
    overdueAmount: 9800,
  },
  {
    monthKey: '2026-04',
    date: '2026-04-01',
    label: 'Apr 26',
    invoicedRevenue: 133675,
    collectedPayments: 98500,
    outstandingAR: 32475,
    utilizationRate: 83.3,
    salesRevenue: 81675,
    rentalRevenue: 52000,
    overdueAmount: 8400,
  },
];

type DateRangePreset = '30D' | '3M' | '6M' | 'YTD' | 'ALL' | 'CUSTOM';

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  auditLogs,
  userRole = 'ADMIN',
  onNavigate,
  onOpenQuickNew,
}) => {
  // Date Range Picker State
  const [preset, setPreset] = useState<DateRangePreset>('6M');
  const [startDate, setStartDate] = useState('2025-11-01');
  const [endDate, setEndDate] = useState('2026-04-30');
  const [showCustomInputs, setShowCustomInputs] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Fleet Asset Telemetry State for Live Dashboard Map
  const [showDashboardMap, setShowDashboardMap] = useState(false);
  const [dashboardAssets, setDashboardAssets] = useState<Asset[]>([]);

  // Official documents state for role-specific dashboard report table (Requirements 6 & 7)
  const [quotationsList, setQuotationsList] = useState<any[]>([]);
  const [salesOrdersList, setSalesOrdersList] = useState<any[]>([]);
  const [rentalsList, setRentalsList] = useState<any[]>([]);
  const [invoicesList, setInvoicesList] = useState<any[]>([]);
  const [purchaseOrdersList, setPurchaseOrdersList] = useState<any[]>([]);
  const [deliveriesList, setDeliveriesList] = useState<any[]>([]);
  const [operatorsList, setOperatorsList] = useState<any[]>([]);
  const [previewModalDoc, setPreviewModalDoc] = useState<{ type: SupportedDocType; data: any } | null>(null);
  const [tableFilterCategory, setTableFilterCategory] = useState<string>('ALL');
  const [tableSearchTerm, setTableSearchTerm] = useState<string>('');

  useEffect(() => {
    api.getAssets().then((res) => setDashboardAssets(res.data)).catch((err) => {
      console.warn('Could not load assets for dashboard map:', err);
    });
    api.getQuotations().then((res) => setQuotationsList(res.data || [])).catch(() => {});
    api.getSalesOrders().then((res) => setSalesOrdersList(res.data || [])).catch(() => {});
    api.getRentals().then((res) => setRentalsList(res.data || [])).catch(() => {});
    api.getInvoices().then((res) => setInvoicesList(res.data || [])).catch(() => {});
    api.getPurchaseOrders().then((res) => setPurchaseOrdersList(res.data || [])).catch(() => {});
    api.getDeliveries().then((res) => setDeliveriesList(res.data || [])).catch(() => {});
    api.getOperators().then((res) => setOperatorsList(res.data || [])).catch(() => {});
  }, []);

  // Handle Preset Changes
  const handleSelectPreset = (p: DateRangePreset) => {
    setPreset(p);
    if (p === '30D') {
      setShowCustomInputs(false);
      setStartDate('2026-04-01');
      setEndDate('2026-04-30');
    } else if (p === '3M') {
      setShowCustomInputs(false);
      setStartDate('2026-02-01');
      setEndDate('2026-04-30');
    } else if (p === '6M') {
      setShowCustomInputs(false);
      setStartDate('2025-11-01');
      setEndDate('2026-04-30');
    } else if (p === 'YTD') {
      setShowCustomInputs(false);
      setStartDate('2026-01-01');
      setEndDate('2026-04-30');
    } else if (p === 'ALL') {
      setShowCustomInputs(false);
      setStartDate('2025-11-01');
      setEndDate('2026-12-31');
    } else if (p === 'CUSTOM') {
      setShowCustomInputs(true);
    }
  };

  // Filter Data Based on Date Range
  const filteredData = useMemo(() => {
    return MASTER_MONTHLY_DATA.filter((item) => {
      return item.date >= startDate && item.date <= endDate;
    });
  }, [startDate, endDate]);

  // Fallback to latest or entire dataset if filter returns empty
  const activeData = filteredData.length > 0 ? filteredData : MASTER_MONTHLY_DATA.slice(-1);

  // Compute Sparkline series dynamically based on filtered date range
  const invoicedRevenueTrend: SparklinePoint[] = useMemo(() => {
    return activeData.map((d) => ({ label: d.label, value: d.invoicedRevenue }));
  }, [activeData]);

  const collectedPaymentsTrend: SparklinePoint[] = useMemo(() => {
    return activeData.map((d) => ({ label: d.label, value: d.collectedPayments }));
  }, [activeData]);

  const outstandingArTrend: SparklinePoint[] = useMemo(() => {
    return activeData.map((d) => ({ label: d.label, value: d.outstandingAR }));
  }, [activeData]);

  const fleetUtilizationTrend: SparklinePoint[] = useMemo(() => {
    return activeData.map((d) => ({ label: d.label, value: d.utilizationRate }));
  }, [activeData]);

  // Dynamic MoM growth for the selected period
  const currRev = activeData[activeData.length - 1].invoicedRevenue;
  const priorRev = activeData.length > 1 ? activeData[activeData.length - 2].invoicedRevenue : currRev;
  const momRevenueGrowthPercent = priorRev > 0 ? ((currRev - priorRev) / priorRev) * 100 : 0;
  const momRevenueDiff = currRev - priorRev;

  // Dynamic MoM cash velocity
  const currPay = activeData[activeData.length - 1].collectedPayments;
  const priorPay = activeData.length > 1 ? activeData[activeData.length - 2].collectedPayments : currPay;
  const momPaymentGrowthPercent = priorPay > 0 ? ((currPay - priorPay) / priorPay) * 100 : 0;
  const momPaymentDiff = currPay - priorPay;

  // Active metrics adjusted for the selected filter range
  const latestPoint = activeData[activeData.length - 1];
  const displayedNetInvoiced = latestPoint.invoicedRevenue;
  const displayedCollected = latestPoint.collectedPayments;
  const displayedOutstandingAR = latestPoint.outstandingAR;
  const displayedOverdue = latestPoint.overdueAmount;
  const displayedUtilization = latestPoint.utilizationRate;
  const displayedSalesRevenue = latestPoint.salesRevenue;
  const displayedRentalRevenue = latestPoint.rentalRevenue;

  // ==========================================
  // EXCEL EXPORT HANDLER (FOR ALL CHARTS)
  // ==========================================
  const handleExportAllChartsToExcel = () => {
    const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    const periodLabel = `${activeData[0]?.label || startDate} s/d ${activeData[activeData.length - 1]?.label || endDate}`;

    // Construct valid HTML Excel Spreadsheet XML containing all 4 chart tables + executive KPIs
    const excelContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Commercial Analytics & Charts</x:Name>
                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <style>
          body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 11pt; color: #1e293b; }
          .title { font-size: 16pt; font-weight: bold; color: #0f172a; margin-bottom: 4px; }
          .subtitle { font-size: 10pt; color: #64748b; margin-bottom: 16px; }
          .table-header { background-color: #0f172a; color: #ffffff; font-weight: bold; text-align: left; padding: 6px 12px; }
          .section-header { background-color: #f1f5f9; color: #0f172a; font-weight: bold; padding: 8px 12px; font-size: 12pt; border-bottom: 2px solid #cbd5e1; }
          td { padding: 6px 12px; border: 1px solid #e2e8f0; }
          th { padding: 6px 12px; border: 1px solid #0f172a; }
          .num { text-align: right; font-family: 'Consolas', monospace; }
          .positive { color: #15803d; font-weight: bold; }
          .highlight { background-color: #fefce8; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="title">Apex Industrial Solutions - Commercial Analytics &amp; Chart Ledgers</div>
        <div class="subtitle">Generated: ${timestamp} | Filtered Period: ${periodLabel} | Active User Role: ${userRole}</div>

        <!-- 1. Executive Summary Table -->
        <table border="1" cellpadding="6" cellspacing="0" style="margin-bottom: 24px; border-collapse: collapse; width: 100%;">
          <tr class="section-header">
            <th colspan="4" style="background-color: #e2e8f0; color: #0f172a; text-align: left;">1. EXECUTIVE FINANCIAL SUMMARY (${periodLabel})</th>
          </tr>
          <tr class="table-header">
            <th>Financial KPI</th>
            <th class="num">Current Value</th>
            <th class="num">Period Growth (MoM)</th>
            <th>Operational Benchmark</th>
          </tr>
          <tr>
            <td><strong>Net Invoiced Revenue</strong></td>
            <td class="num highlight">${formatRupiahAmount(displayedNetInvoiced)}</td>
            <td class="num positive">+${momRevenueGrowthPercent.toFixed(1)}%</td>
            <td>Operational commercial billings issued</td>
          </tr>
          <tr>
            <td><strong>Collected Cash Payments</strong></td>
            <td class="num highlight">${formatRupiahAmount(displayedCollected)}</td>
            <td class="num positive">+${momPaymentGrowthPercent.toFixed(1)}%</td>
            <td>Verified bank and wire settlements</td>
          </tr>
          <tr>
            <td><strong>Outstanding AR Balance</strong></td>
            <td class="num">${formatRupiahAmount(displayedOutstandingAR)}</td>
            <td class="num">-8.5%</td>
            <td>Overdue Aging: ${formatRupiahAmount(displayedOverdue)}</td>
          </tr>
          <tr>
            <td><strong>Rental Fleet Utilization</strong></td>
            <td class="num">${displayedUtilization.toFixed(1)}%</td>
            <td class="num positive">+14.2%</td>
            <td>Active commercial equipment deployments</td>
          </tr>
        </table>

        <!-- 2. Chart 1: Invoiced Revenue Trend Table -->
        <table border="1" cellpadding="6" cellspacing="0" style="margin-bottom: 24px; border-collapse: collapse; width: 100%;">
          <tr class="section-header">
            <th colspan="5" style="background-color: #e0f2fe; color: #0369a1; text-align: left;">2. CHART DATASET: NET INVOICED REVENUE TREND</th>
          </tr>
          <tr class="table-header" style="background-color: #0369a1;">
            <th>Period Label</th>
            <th>Effective Date</th>
            <th class="num">Net Invoiced Revenue (IDR)</th>
            <th class="num">Commercial Sales (IDR)</th>
            <th class="num">Equipment Leases (IDR)</th>
          </tr>
          ${activeData
            .map(
              (row) => `
            <tr>
              <td><strong>${row.label}</strong></td>
              <td>${row.date}</td>
              <td class="num highlight">${formatRupiahAmount(row.invoicedRevenue)}</td>
              <td class="num">${formatRupiahAmount(row.salesRevenue)}</td>
              <td class="num">${formatRupiahAmount(row.rentalRevenue)}</td>
            </tr>`
            )
            .join('')}
        </table>

        <!-- 3. Chart 2: Collected Cash Payments Table -->
        <table border="1" cellpadding="6" cellspacing="0" style="margin-bottom: 24px; border-collapse: collapse; width: 100%;">
          <tr class="section-header">
            <th colspan="4" style="background-color: #dcfce7; color: #15803d; text-align: left;">3. CHART DATASET: COLLECTED CASH PAYMENTS &amp; SETTLEMENTS</th>
          </tr>
          <tr class="table-header" style="background-color: #15803d;">
            <th>Period Label</th>
            <th>Effective Date</th>
            <th class="num">Collected Payments (IDR)</th>
            <th>Settlement Velocity</th>
          </tr>
          ${activeData
            .map(
              (row) => `
            <tr>
              <td><strong>${row.label}</strong></td>
              <td>${row.date}</td>
              <td class="num highlight">${formatRupiahAmount(row.collectedPayments)}</td>
              <td>100% Confirmed Multi-Invoice Allocation</td>
            </tr>`
            )
            .join('')}
        </table>

        <!-- 4. Chart 3: Outstanding Accounts Receivable Aging Table -->
        <table border="1" cellpadding="6" cellspacing="0" style="margin-bottom: 24px; border-collapse: collapse; width: 100%;">
          <tr class="section-header">
            <th colspan="4" style="background-color: #fef3c7; color: #b45309; text-align: left;">4. CHART DATASET: OUTSTANDING ACCOUNTS RECEIVABLE (AR)</th>
          </tr>
          <tr class="table-header" style="background-color: #b45309;">
            <th>Period Label</th>
            <th>Effective Date</th>
            <th class="num">Outstanding Balance (IDR)</th>
            <th class="num">Overdue Balance (IDR)</th>
          </tr>
          ${activeData
            .map(
              (row) => `
            <tr>
              <td><strong>${row.label}</strong></td>
              <td>${row.date}</td>
              <td class="num highlight">${formatRupiahAmount(row.outstandingAR)}</td>
              <td class="num" style="color: #b91c1c;">${formatRupiahAmount(row.overdueAmount)}</td>
            </tr>`
            )
            .join('')}
        </table>

        <!-- 5. Chart 4: Fleet Utilization Rate Table -->
        <table border="1" cellpadding="6" cellspacing="0" style="margin-bottom: 24px; border-collapse: collapse; width: 100%;">
          <tr class="section-header">
            <th colspan="4" style="background-color: #ede9fe; color: #6d28d9; text-align: left;">5. CHART DATASET: RENTAL FLEET UTILIZATION RATE</th>
          </tr>
          <tr class="table-header" style="background-color: #6d28d9;">
            <th>Period Label</th>
            <th>Effective Date</th>
            <th class="num">Utilization Rate (%)</th>
            <th>Operational Fleet Status</th>
          </tr>
          ${activeData
            .map(
              (row) => `
            <tr>
              <td><strong>${row.label}</strong></td>
              <td>${row.date}</td>
              <td class="num highlight">${row.utilizationRate.toFixed(1)}%</td>
              <td>Active Leased Equipment vs Depot Availability</td>
            </tr>`
            )
            .join('')}
        </table>
      </body>
      </html>
    `;

    const safeDate = new Date().toISOString().slice(0, 10);
    exportExcelFromHtml(excelContent, `Apex_Commercial_Analytics_Charts_${safeDate}.xlsx`);

    setExportNotice('Excel file downloaded successfully! All 4 chart datasets have been saved.');
    setTimeout(() => setExportNotice(null), 4000);
  };

  // ==========================================
  // ROLE-SPECIFIC WORKSPACE CONFIGURATION
  // "setiap role hanya menampilkan menu kerja yang sesuai pada rolenya di dashboard"
  // ==========================================
  // ==========================================
  // ROLE-SPECIFIC WORKSPACE CONFIGURATION (8 ENTERPRISE ROLES)
  // "setiap role hanya menampilkan menu kerja yang sesuai pada rolenya di dashboard"
  // ==========================================
  const roleWorkspaces: Record<UserRole, {
    title: string;
    description: string;
    quickActions: { id: string; label: string; icon: any; action: () => void }[];
  }> = {
    EXECUTIVE: {
      title: '1. Executive Control Center (Chief Executive Officer)',
      description: 'Access all operational and commercial features, including gross profit, cash flow, fleet utilization, and month-over-month revenue reports.',
      quickActions: [
        { id: 'reports', label: 'Executive Report & Laba', icon: TrendingUp, action: () => onNavigate('reports') },
        { id: 'excelExport', label: 'Download Excel (All Charts)', icon: FileSpreadsheet, action: () => handleExportAllChartsToExcel() },
        { id: 'printView', label: 'Print PDF Report', icon: Printer, action: () => window.print() },
        { id: 'invoices', label: 'Invoicing & AR Balance', icon: DollarSign, action: () => onNavigate('invoices') },
        { id: 'assets', label: 'Asset Fleet Status', icon: Boxes, action: () => onNavigate('assets') },
        { id: 'rentals', label: 'Active Rental Contracts', icon: Calendar, action: () => onNavigate('rentals') },
      ],
    },
    ADMIN_IT: {
      title: '2. IT Administrator & Systems DevOps',
      description: 'Full access to all features, user and access management, REST API Explorer, Swagger schema, automated test runner, and audit logs.',
      quickActions: [
        { id: 'userManagement', label: 'User Management (IT)', icon: Users, action: () => onNavigate('user-management') },
        { id: 'apiExplorer', label: 'REST API & Swagger', icon: Terminal, action: () => onNavigate('api-explorer') },
        { id: 'testRunner', label: 'Automated Test Suite', icon: AlertTriangle, action: () => onNavigate('test-runner') },
        { id: 'settings', label: 'Audit Trail & Settings', icon: ShieldCheck, action: () => onNavigate('settings') },
        { id: 'assetRegistry', label: 'Asset Tag Master', icon: Boxes, action: () => onNavigate('assets') },
      ],
    },
    SALES_MARKETING: {
      title: '3. Sales & Marketing Workspace',
      description: 'Manage customer and project data, sales quotations, sales orders, and equipment allocations.',
      quickActions: [
        { id: 'quotation', label: 'Create Quotation', icon: FileText, action: () => onOpenQuickNew('quotation') },
        { id: 'salesOrder', label: 'Direct Sales Order', icon: ArrowUpRight, action: () => onOpenQuickNew('salesOrder') },
        { id: 'customers', label: 'Database Customer CRM', icon: Users, action: () => onNavigate('customers') },
        { id: 'products', label: 'Product & Asset Catalog', icon: Boxes, action: () => onNavigate('products') },
        { id: 'salesView', label: 'Sales Orders', icon: Briefcase, action: () => onNavigate('sales') },
      ],
    },
    ASSET_CONTROL: {
      title: '4. Asset Control Workspace',
      description: 'Manage asset registration, live GPS locations, deliveries, equipment identification, and registration, ownership, and operating license documents.',
      quickActions: [
        { id: 'gpsMap', label: 'Live Equipment GPS Map', icon: Truck, action: () => onNavigate('assets') },
        { id: 'assets', label: 'Asset Registration & Tagging', icon: Boxes, action: () => onNavigate('assets') },
        { id: 'legalDocs', label: 'Legal Documents (STNK/SIA)', icon: FileText, action: () => onNavigate('assets') },
        { id: 'deliveries', label: 'Delivery Order (DO)', icon: Truck, action: () => onNavigate('deliveries') },
        { id: 'maintenance', label: 'Perawatan & Kalibrasi', icon: Wrench, action: () => onNavigate('maintenance') },
      ],
    },
    MANAGEMENT_OPERATION: {
      title: '5. Operations Management Workspace (Field Operations)',
      description: 'Manage field equipment assignments and operator qualification license expiry.',
      quickActions: [
        { id: 'operatorMgt', label: 'Operators & SIO Documents', icon: Wrench, action: () => onNavigate('maintenance') },
        { id: 'assetAssign', label: 'Fleet & Equipment Assignments', icon: Boxes, action: () => onNavigate('assets') },
        { id: 'fieldOrders', label: 'Perintah Kerja Lapangan', icon: Clock, action: () => onNavigate('maintenance') },
        { id: 'fieldDelivery', label: 'Physical Delivery & Handover (DO)', icon: Truck, action: () => onNavigate('deliveries') },
      ],
    },
    PROCUREMENT: {
      title: '6. Procurement Workspace',
      description: 'Manage new asset purchases, replacement parts, lubricants, vendor purchase orders, and office operating supplies.',
      quickActions: [
        { id: 'poCreate', label: 'Purchase Order (PO) Baru', icon: PackageSearch, action: () => onNavigate('procurement') },
        { id: 'vendorList', label: 'Vendor Directory', icon: Users, action: () => onNavigate('procurement') },
        { id: 'goodsReceive', label: 'Receive Spare Parts', icon: Boxes, action: () => onNavigate('procurement') },
        { id: 'spareCatalog', label: 'Spare Parts Catalog', icon: Briefcase, action: () => onNavigate('products') },
      ],
    },
    FINANCE_ACCOUNTING_TAX: {
      title: '7. Finance, Accounting & Tax Workspace (FAT)',
      description: 'Record financial transactions and account journals, calculate commercial taxes, and issue customer invoices.',
      quickActions: [
        { id: 'invoiceNew', label: 'Issue Invoice', icon: CreditCard, action: () => onOpenQuickNew('invoice') },
        { id: 'paymentNew', label: 'Record Incoming Payment', icon: Banknote, action: () => onOpenQuickNew('payment') },
        { id: 'taxReport', label: 'Tax Calculation (FAT)', icon: DollarSign, action: () => onNavigate('reports') },
        { id: 'invoiceList', label: 'Invoices & Ledger', icon: FileText, action: () => onNavigate('invoices') },
      ],
    },
    AR_MANAGEMENT: {
      title: '8. Accounts Receivable Management Workspace',
      description: 'Track receivables, monitor outstanding invoices, review aging buckets, and reconcile accounts.',
      quickActions: [
        { id: 'arTrace', label: 'Receivables Tracking', icon: Clock, action: () => onNavigate('invoices') },
        { id: 'arAging', label: 'Receivables Aging Report', icon: TrendingUp, action: () => onNavigate('reports') },
        { id: 'pmtCollect', label: 'Record Invoice Payment', icon: Banknote, action: () => onOpenQuickNew('payment') },
        { id: 'custAccount', label: 'Statement of Account', icon: Users, action: () => onNavigate('customers') },
      ],
    },
    OPERATOR_USER: {
      title: '9. Field Operator Workspace (Equipment Status)',
      description: 'Scan equipment barcodes and report operational readiness or breakdowns.',
      quickActions: [
        { id: 'scanStatus', label: 'Scan & Check Equipment Status', icon: QrCode, action: () => onNavigate('operator-status') },
      ],
    },
    TECHNICAL_SERVICE: {
      title: '10. Technical Service & Mechanical Workshop',
      description: 'Process operator repair reports, scan barcodes to start or finish service, and manage spare parts and procurement services.',
      quickActions: [
        { id: 'techDashboard', label: 'Dashboard & Scan Servis', icon: Wrench, action: () => onNavigate('technical-service') },
        { id: 'workOrders', label: 'Riwayat Work Orders', icon: ShieldCheck, action: () => onNavigate('maintenance') },
        { id: 'assetList', label: 'Equipment Fleet Condition', icon: Boxes, action: () => onNavigate('assets') },
      ],
    },
    MANAGER: {
      title: 'Manager Workspace',
      description: 'Review submissions awaiting approval and view contracts.',
      quickActions: [
        { id: 'approvals', label: 'Approvals & Contracts', icon: CheckCircle2, action: () => onNavigate('manager-approvals') },
      ],
    },
  };

  const currentRoleWorkspace = (userRole && roleWorkspaces[userRole as UserRole]) ? roleWorkspaces[userRole as UserRole] : roleWorkspaces.EXECUTIVE;

  // Combined official documents dataset strictly scoped to the active role on this dashboard (Requirements 6 & 7)
  const roleDashboardDocs = useMemo(() => {
    const list: Array<{
      id: string;
      type: SupportedDocType;
      typeLabel: string;
      badgeColor: string;
      party: string;
      date: string;
      amount: number;
      status: string;
      raw: any;
    }> = [];

    // Requirement 7: Quotation & PO dari Client HANYA muncul di role:
    // 1. Marketing sales (SALES_MARKETING)
    // 2. AR management (AR_MANAGEMENT)
    // 3. Asset Management (ASSET_CONTROL)
    // 4. Executive (EXECUTIVE & ADMIN_IT)
    // Dan PO yang dimaksud di sini adalah PO DARI CLIENT, BUKAN PO dari tim procurement!
    const canSeeCommercialQuotesAndClientPo = [
      'SALES_MARKETING',
      'AR_MANAGEMENT',
      'ASSET_CONTROL',
      'EXECUTIVE',
      'ADMIN_IT',
    ].includes(userRole);

    // 1. Quotations (Surat Penawaran Harga) -> HANYA untuk Marketing sales, AR management, Asset Management, executive
    if (canSeeCommercialQuotesAndClientPo) {
      quotationsList.forEach((q) => {
        list.push({
          id: q.quotationNumber || q.id,
          type: 'QUOTATION',
          typeLabel: 'Quotation',
          badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
          party: q.customerName || 'PT Project Partner',
          date: q.date || q.issueDate || q.createdAt?.slice(0, 10) || '2026-10-15',
          amount: q.grandTotal || q.totalAmount || q.subtotal || 0,
          status: q.status || 'SENT',
          raw: q,
        });
      });
    }

    // 2. PO dari Client (Customer Purchase Order) -> Surat Pesanan resmi dari Pelanggan (BUKAN PO tim procurement)
    if (canSeeCommercialQuotesAndClientPo) {
      salesOrdersList.forEach((so) => {
        const clientPoId = so.customerPoReference || `PO-CLT-${so.orderNumber}`;
        list.push({
          id: clientPoId,
          type: 'CLIENT_PO',
          typeLabel: 'Customer Purchase Order',
          badgeColor: 'bg-sky-100 text-sky-900 border-sky-300',
          party: so.customerName || 'PT Project Partner',
          date: so.orderDate || so.createdAt?.slice(0, 10) || '2026-10-15',
          amount: so.grandTotal || so.totalAmount || 0,
          status: so.status === 'COMPLETED' ? 'FULFILLED' : 'CONFIRMED',
          raw: {
            ...so,
            id: clientPoId,
            poNumber: clientPoId,
            customerPoReference: clientPoId,
            customerPoNumber: clientPoId,
            clientName: so.customerName,
            type: 'CLIENT_PO',
          },
        });
      });

      // Approved quotations with client PO references
      quotationsList.forEach((q) => {
        if (q.status === 'ACCEPTED' || q.status === 'CONVERTED') {
          const clientPoId = `PO-${(q.customerName || 'CLT').replace(/[^a-zA-Z0-9]/g, '').slice(0, 7).toUpperCase()}-${q.quotationNumber?.slice(-4) || '9912'}`;
          if (!list.some((item) => item.id === clientPoId)) {
            list.push({
              id: clientPoId,
              type: 'CLIENT_PO',
              typeLabel: 'Customer Purchase Order',
              badgeColor: 'bg-sky-100 text-sky-900 border-sky-300',
              party: q.customerName || 'PT Project Partner',
              date: q.approvalDate?.slice(0, 10) || q.date || '2026-10-10',
              amount: q.grandTotal || q.totalAmount || 0,
              status: 'CUSTOMER APPROVED',
              raw: {
                ...q,
                id: clientPoId,
                poNumber: clientPoId,
                customerPoReference: clientPoId,
                customerPoNumber: clientPoId,
                type: 'CLIENT_PO',
              },
            });
          }
        }
      });
    }

    // 3. Sales Orders -> Sales Marketing, Executive, Admin IT
    if (['SALES_MARKETING', 'EXECUTIVE', 'ADMIN_IT'].includes(userRole)) {
      salesOrdersList.forEach((so) => {
        list.push({
          id: so.orderNumber || so.id,
          type: 'SALES_ORDER',
          typeLabel: 'Sales Order',
          badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
          party: so.customerName || 'PT Client',
          date: so.orderDate || so.createdAt?.slice(0, 10) || '2026-10-15',
          amount: so.grandTotal || so.totalAmount || 0,
          status: so.status || 'CONFIRMED',
          raw: so,
        });
      });
    }

    // 4. Rental Contracts -> Sales Marketing, AR Management, Asset Control, Executive, Admin IT
    if (['SALES_MARKETING', 'AR_MANAGEMENT', 'ASSET_CONTROL', 'EXECUTIVE', 'ADMIN_IT'].includes(userRole)) {
      rentalsList.forEach((rc) => {
        list.push({
          id: rc.contractNumber || rc.id,
          type: 'RENTAL',
          typeLabel: 'Rental Contract',
          badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
          party: rc.customerName || 'PT Client',
          date: rc.startDate || '2026-10-01',
          amount: rc.grandTotal || rc.totalAmount || 0,
          status: rc.status || 'ACTIVE',
          raw: rc,
        });
      });
    }

    // 5. Commercial Invoices -> AR Management, Finance FAT, Executive, Admin IT
    if (['AR_MANAGEMENT', 'FINANCE_ACCOUNTING_TAX', 'EXECUTIVE', 'ADMIN_IT'].includes(userRole)) {
      invoicesList.forEach((inv) => {
        list.push({
          id: inv.invoiceNumber || inv.id,
          type: 'INVOICE',
          typeLabel: 'Invoice',
          badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          party: inv.customerName || 'PT Client',
          date: inv.issueDate || '2026-10-10',
          amount: inv.grandTotal || 0,
          status: inv.status || 'ISSUED',
          raw: inv,
        });
      });
    }

    // 6. PO dari Tim Procurement (Internal/Vendor PO) -> HANYA untuk Tim Procurement dan IT Audit
    // BUKAN PO Client! Ini adalah PO pembelian internal ke vendor/supplier mitra
    if (['PROCUREMENT', 'ADMIN_IT'].includes(userRole)) {
      purchaseOrdersList.forEach((po) => {
        list.push({
          id: po.poNumber || po.id,
          type: 'PURCHASE_ORDER',
          typeLabel: 'Procurement Purchase Order (Vendor PO)',
          badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300',
          party: po.vendorName || 'Partner Supplier',
          date: po.orderDate || '2026-10-05',
          amount: po.grandTotal || po.subtotal || 0,
          status: po.status || 'ORDERED',
          raw: po,
        });
      });
    }

    // 7. Deliveries (Surat Jalan DO) -> Asset Control, Sales Marketing, Management Operation, Executive, Admin IT
    if (['ASSET_CONTROL', 'SALES_MARKETING', 'MANAGEMENT_OPERATION', 'EXECUTIVE', 'ADMIN_IT'].includes(userRole)) {
      deliveriesList.forEach((del) => {
        list.push({
          id: del.deliveryNumber || del.id,
          type: 'DELIVERY',
          typeLabel: 'Delivery Order',
          badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
          party: del.customerName || 'PT Client',
          date: del.deliveryDate || '2026-10-12',
          amount: 0,
          status: del.status || 'DELIVERED',
          raw: del,
        });
      });
    }

    // 8. Asset Register & Legalitas (STNK/BPKB/SIA) -> Asset Control, Management Operation, Operator, Service, Executive, Admin IT
    if (['ASSET_CONTROL', 'MANAGEMENT_OPERATION', 'OPERATOR_USER', 'TECHNICAL_SERVICE', 'EXECUTIVE', 'ADMIN_IT'].includes(userRole)) {
      dashboardAssets.forEach((ast) => {
        list.push({
          id: ast.assetTag || ast.id,
          type: 'ASSET',
          typeLabel: 'Equipment Registration & Compliance (SIA/STNK)',
          badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
          party: ast.name || 'Heavy Equipment',
          date: ast.legalDocs?.siaExpiry || '2027-01-01',
          amount: ast.purchaseCost || 0,
          status: ast.status || 'AVAILABLE',
          raw: ast,
        });
      });
    }

    // 9. Operator SIO Licenses -> Management Operation, Operator Lapangan, Executive, Admin IT
    if (['MANAGEMENT_OPERATION', 'OPERATOR_USER', 'EXECUTIVE', 'ADMIN_IT'].includes(userRole)) {
      operatorsList.forEach((opr) => {
        list.push({
          id: opr.badgeNumber || opr.id,
          type: 'OPERATOR',
          typeLabel: 'Operator K3 License (SIO)',
          badgeColor: 'bg-cyan-100 text-cyan-900 border-cyan-300',
          party: opr.name || 'Field Operator',
          date: opr.sioExpiry || '2027-06-30',
          amount: 0,
          status: opr.status || 'ACTIVE',
          raw: opr,
        });
      });
    }

    // 10. Work Orders Perbaikan -> Technical Service, Executive, Admin IT
    if (['TECHNICAL_SERVICE', 'EXECUTIVE', 'ADMIN_IT'].includes(userRole)) {
      list.push(
        {
          id: 'WO-2026-0041',
          type: 'WORK_ORDER',
          typeLabel: 'Tiket Work Order (WO)',
          badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
          party: 'Site Morowali - Hydraulic Service',
          date: '2026-10-14',
          amount: 3200,
          status: 'IN_PROGRESS',
          raw: {
            workOrderNumber: 'WO-2026-0041',
            type: 'PREVENTIVE',
            assetName: 'Komatsu PC200-8 Excavator',
            assetTag: 'EXC-001',
            serviceType: 'Pemeriksaan Rutin 500 Jam',
            technicianName: 'Budi Santoso',
            status: 'IN_PROGRESS',
            laborCost: 1200,
            partsCost: 2000,
            grandTotal: 3200,
          },
        },
        {
          id: 'WO-2026-0038',
          type: 'WORK_ORDER',
          typeLabel: 'Tiket Work Order (WO)',
          badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
          party: 'Balikpapan Workshop - Engine Overhaul',
          date: '2026-10-08',
          amount: 5400,
          status: 'COMPLETED',
          raw: {
            workOrderNumber: 'WO-2026-0038',
            type: 'CORRECTIVE',
            assetName: 'Caterpillar 320D Excavator',
            assetTag: 'EXC-002',
            serviceType: 'Penggantian Seal Silinder Boom',
            technicianName: 'Hendra Wijaya',
            status: 'COMPLETED',
            laborCost: 1800,
            partsCost: 3600,
            grandTotal: 5400,
          },
        }
      );
    }

    return list;
  }, [userRole, quotationsList, salesOrdersList, rentalsList, invoicesList, purchaseOrdersList, deliveriesList, dashboardAssets, operatorsList]);

  // Dynamic Category Pills for Table in Dashboard
  const dashboardCategoryPills = useMemo(() => {
    const pills: Array<{ id: string; label: string }> = [{ id: 'ALL', label: `All (${roleDashboardDocs.length})` }];
    const counts: Record<string, number> = {};
    roleDashboardDocs.forEach((d) => {
      counts[d.type] = (counts[d.type] || 0) + 1;
    });

    const labelMap: Record<string, string> = {
      QUOTATION: 'Quotation',
      CLIENT_PO: 'Customer Purchase Order',
      SALES_ORDER: 'Sales Order',
      RENTAL: 'Rental Contract',
      INVOICE: 'Invoice',
      PURCHASE_ORDER: 'PO Tim Procurement',
      DELIVERY: 'Delivery Order',
      ASSET: 'Asset Registration (STNK/SIA)',
      OPERATOR: 'Operator SIO License',
      WORK_ORDER: 'Work Orders Servis',
    };

    Object.keys(counts).forEach((type) => {
      pills.push({
        id: type,
        label: `${labelMap[type] || type} (${counts[type]})`,
      });
    });

    return pills;
  }, [roleDashboardDocs]);

  // Filtered rows for the role-specific dashboard table
  const filteredDashboardDocs = useMemo(() => {
    return roleDashboardDocs.filter((d) => {
      if (tableFilterCategory !== 'ALL' && d.type !== tableFilterCategory) return false;
      if (!tableSearchTerm) return true;
      const term = tableSearchTerm.toLowerCase();
      return (
        d.id.toLowerCase().includes(term) ||
        d.party.toLowerCase().includes(term) ||
        d.typeLabel.toLowerCase().includes(term) ||
        d.status.toLowerCase().includes(term)
      );
    });
  }, [roleDashboardDocs, tableFilterCategory, tableSearchTerm]);

  // Dedicated Excel export for role-specific dashboard table
  const handleExportDashboardTableToExcel = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Apex_Dashboard_Report_${userRole}_${timestamp}.xls`;

    let rowsHtml = filteredDashboardDocs
      .map(
        (doc, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td><strong>${doc.id}</strong></td>
          <td>${doc.typeLabel}</td>
          <td>${doc.party}</td>
          <td>${doc.date}</td>
          <td style="text-align: right;">${doc.amount > 0 ? formatRupiahAmount(doc.amount) : '-'}</td>
          <td>${doc.status}</td>
        </tr>
      `
      )
      .join('');

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <style>
          body { font-family: Calibri, sans-serif; font-size: 11pt; color: #0f172a; }
          table { border-collapse: collapse; width: 100%; margin-top: 12px; margin-bottom: 24px; }
          th { padding: 8px 12px; text-align: left; background-color: #0f172a; color: #ffffff; }
          td { padding: 6px 12px; border: 1px solid #cbd5e1; }
        </style>
      </head>
      <body>
        <h2>Apex Industrial Solutions - Dashboard Report Table (${userRole})</h2>
        <p>Dashboard Workspace: ${currentRoleWorkspace.title} | Downloaded: ${new Date().toLocaleString()}</p>
        <table border="1" cellpadding="6" cellspacing="0">
          <thead>
            <tr>
              <th>No</th>
              <th>Document ID</th>
              <th>Document Type</th>
              <th>Customer / Related Party</th>
              <th>Date</th>
              <th>Transaction Value (IDR)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
      </html>
    `;

    exportExcelFromHtml(excelHtml, filename);

    setExportNotice(`Dashboard report table exported successfully: ${filename}`);
    setTimeout(() => setExportNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Role Workspace Banner */}
      <div className="bg-slate-900 text-white rounded-md p-4 border border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold font-mono tracking-wider uppercase px-2 py-0.5 rounded bg-amber-400 text-slate-900">
              {userRole}
            </span>
            <h2 className="text-sm font-bold text-white tracking-tight">
              {currentRoleWorkspace.title}
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            {currentRoleWorkspace.description}
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <span className="text-[11px] text-slate-400 font-medium">
            Menu Kerja:
          </span>
          <span className="text-xs font-semibold text-amber-300 bg-slate-800 border border-slate-700 px-2 py-1 rounded">
            Tailored to your role permissions
          </span>
        </div>
      </div>

      {/* Fleet Asset GPS Location Actual Map Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-md p-4 border border-indigo-900/60 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded bg-amber-400 text-slate-900 flex items-center justify-center font-bold shrink-0 mt-0.5">
            <Truck className="w-5 h-5 text-slate-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                Live GPS Telematics
              </span>
              <h3 className="text-sm font-bold text-white">
                Live Heavy Equipment Fleet Map (Asset Management Dashboard)
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Monitor live GPS coordinates for excavators, dump trucks, bulldozers, and cranes in Morowali, Balikpapan, Nusantara, Weda Bay, Surabaya, Jakarta, and Timika.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowDashboardMap(!showDashboardMap)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-indigo-900/80 hover:bg-indigo-800 border border-indigo-500/40 rounded shadow-xs cursor-pointer transition-colors"
          >
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>{showDashboardMap ? 'Close Map' : 'Open Map'}</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('assets')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded shadow-xs cursor-pointer transition-colors shrink-0"
          >
            <Truck className="w-3.5 h-3.5 text-slate-900" />
            <span>Full Asset Dashboard</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-900" />
          </button>
        </div>
      </div>

      {/* Embedded Live Fleet GPS Map if toggled */}
      {showDashboardMap && (
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-600" />
              <h4 className="font-bold text-slate-900 text-xs">Live Project Fleet Coordinates &amp; Telemetry</h4>
            </div>
            <button
              onClick={() => setShowDashboardMap(false)}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
            >
              Close Map [✕]
            </button>
          </div>
          <FleetGpsMap assets={dashboardAssets} />
        </div>
      )}

      {/* DATE RANGE FILTER & EXCEL EXPORT CONTROL BAR */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-amber-50 border border-amber-200 text-amber-800">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>Date Range &amp; Metric Trends</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Select a date range to filter all financial metrics and sparklines below.
              </p>
            </div>
          </div>

          {/* Excel Export Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportAllChartsToExcel}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded shadow-xs transition-colors cursor-pointer"
              title="Download all chart and metric data to an Excel spreadsheet (.xls)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Convert to Excel (All Charts)</span>
              <Download className="w-3.5 h-3.5 text-emerald-600" />
            </button>
          </div>
        </div>

        {/* Preset Range Buttons & Custom Date Pickers */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500 font-medium text-[11px] mr-1">Date Range:</span>
            {(['30D', '3M', '6M', 'YTD', 'ALL', 'CUSTOM'] as DateRangePreset[]).map((p) => {
              const labels: Record<DateRangePreset, string> = {
                '30D': 'Last 30 Days',
                '3M': '3 Months',
                '6M': '6 Months (Default)',
                'YTD': 'Year to Date (YTD)',
                'ALL': 'All Time',
                'CUSTOM': 'Custom Dates...',
              };
              const isSelected = preset === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  {labels[p]}
                </button>
              );
            })}
          </div>

          {/* Active Filter Period Indicator */}
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded">
            <Filter className="w-3 h-3 text-slate-400" />
            <span>
              Active: <strong>{activeData[0]?.label || startDate}</strong> to <strong>{activeData[activeData.length - 1]?.label || endDate}</strong> ({activeData.length} months)
            </span>
          </div>
        </div>

        {/* Interactive Custom Date Range Inputs if CUSTOM preset selected */}
        {showCustomInputs && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs bg-slate-50/70 p-3 rounded">
            <span className="font-semibold text-slate-700">Set Custom Range:</span>
            <div className="flex items-center gap-2">
              <label className="text-slate-500">Start:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 font-mono outline-none focus:border-slate-800"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-slate-500">End:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 font-mono outline-none focus:border-slate-800"
              />
            </div>

            <span className="text-[11px] text-slate-400">
              Sparklines and MoM metrics will update automatically.
            </span>
          </div>
        )}

        {/* Export Notification Toast */}
        {exportNotice && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{exportNotice}</span>
            </div>
            <button
              onClick={() => setExportNotice(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
            >
              Close
            </button>
          </div>
        )}
      </div>

      {/* Primary KPI Grid with Dynamically Filtered Sparklines & MoM Growth */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Net Invoiced Revenue with Month-over-Month Growth */}
        <div className="bg-white border border-slate-200 rounded-md p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span className="font-semibold text-slate-700">Net Invoiced Revenue</span>
              <DollarSign className="w-4 h-4 text-slate-400" />
            </div>

            <div className="mt-2 flex items-baseline justify-between gap-2">
              <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono-numbers">
                {formatRupiahAmount(displayedNetInvoiced)}
              </div>
              <div
                className={`flex items-center gap-1 font-mono-numbers text-xs font-bold px-2 py-0.5 rounded border ${
                  momRevenueGrowthPercent >= 0
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : 'text-rose-700 bg-rose-50 border-rose-200'
                }`}
                title={`Previous Month: ${formatRupiahAmount(priorRev)} → Current Month: ${formatRupiahAmount(currRev)}`}
              >
                <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                <span>{momRevenueGrowthPercent >= 0 ? '+' : ''}{momRevenueGrowthPercent.toFixed(1)}%</span>
                <span className="text-[10px] font-medium font-sans opacity-80">MoM</span>
              </div>
            </div>

            {/* Invoiced Revenue Breakdown */}
            <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Sales: {formatRupiahAmount(displayedSalesRevenue)}</span>
              <span>Leases: {formatRupiahAmount(displayedRentalRevenue)}</span>
            </div>

            {/* Dedicated Month-over-Month Revenue Growth Metric Box */}
            <div className="mt-2.5 p-2 bg-slate-50/80 rounded border border-slate-100 flex items-center justify-between font-mono-numbers text-[11px]">
              <div className="flex items-center gap-1.5 font-sans text-slate-600">
                <span className="font-medium text-slate-700">Month-over-Month Revenue Growth:</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-emerald-700">
                <span>{momRevenueGrowthPercent >= 0 ? '+' : ''}{momRevenueGrowthPercent.toFixed(1)}%</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  ({momRevenueDiff >= 0 ? '+' : '-'}{formatRupiahAmount(Math.abs(momRevenueDiff))})
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-sans">
              <span>Filtered Revenue Trend ({activeData.length} pts)</span>
              <span className="font-mono text-slate-500">
                {activeData[0]?.label} - {activeData[activeData.length - 1]?.label}
              </span>
            </div>
            <Sparkline
              data={invoicedRevenueTrend}
              color="#0f172a"
              badgeTrend={`${momRevenueGrowthPercent >= 0 ? '+' : ''}${momRevenueGrowthPercent.toFixed(1)}%`}
              isPositive={momRevenueGrowthPercent >= 0}
            />
          </div>
        </div>

        {/* KPI 2: Collected Cash Payments with Month-over-Month Growth */}
        <div className="bg-white border border-slate-200 rounded-md p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span className="font-semibold text-slate-700">Collected Cash Payments</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>

            <div className="mt-2 flex items-baseline justify-between gap-2">
              <div className="text-2xl font-bold tracking-tight text-emerald-700 font-mono-numbers">
                {formatRupiahAmount(displayedCollected)}
              </div>
              <div className="flex items-center gap-1 font-mono-numbers text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                <span>+{momPaymentGrowthPercent.toFixed(1)}%</span>
                <span className="text-[10px] text-emerald-600 font-normal font-sans">MoM</span>
              </div>
            </div>

            <div className="mt-1.5 text-[11px] text-slate-500 flex items-center gap-1">
              <span>100% verified settlement rate</span>
            </div>

            <div className="mt-1.5 text-[11px] text-slate-600 flex items-center justify-between font-mono-numbers pt-1.5 border-t border-slate-100">
              <span className="text-slate-500 font-sans">MoM Cash Velocity:</span>
              <span className="font-semibold text-emerald-700">
                +{momPaymentGrowthPercent.toFixed(1)}% (+{formatRupiahAmount(momPaymentDiff)})
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-sans">
              <span>Filtered Cash Trend</span>
              <span className="font-mono text-slate-500">
                {activeData[0]?.label} - {activeData[activeData.length - 1]?.label}
              </span>
            </div>
            <Sparkline
              data={collectedPaymentsTrend}
              color="#16a34a"
              badgeTrend={`+${momPaymentGrowthPercent.toFixed(1)}%`}
              isPositive={momPaymentGrowthPercent >= 0}
            />
          </div>
        </div>

        {/* KPI 3: Outstanding AR Balance */}
        <div className="bg-white border border-slate-200 rounded-md p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span className="font-semibold text-slate-700">Outstanding AR Balance</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 font-mono-numbers">
              {formatRupiahAmount(displayedOutstandingAR)}
            </div>
            <div className="mt-1 text-[11px] text-amber-700 font-medium">
              Overdue: {formatRupiahAmount(displayedOverdue)}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-sans">
              <span>Aging Receivables Trend</span>
              <span className="font-mono text-slate-500">
                {activeData[0]?.label} - {activeData[activeData.length - 1]?.label}
              </span>
            </div>
            <Sparkline
              data={outstandingArTrend}
              color="#d97706"
              badgeTrend="-8.5%"
              isPositive={true}
            />
          </div>
        </div>

        {/* KPI 4: Rental Fleet Utilization */}
        <div className="bg-white border border-slate-200 rounded-md p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span className="font-semibold text-slate-700">Rental Fleet Utilization</span>
              <Boxes className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 font-mono-numbers">
              {displayedUtilization.toFixed(1)}%
            </div>
            <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
              <span>{metrics.activeRentalsCount} active leases</span>
              <span>{metrics.availableAssetsCount} available</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-sans">
              <span>Fleet Deployment Trend</span>
              <span className="font-mono text-slate-500">
                {activeData[0]?.label} - {activeData[activeData.length - 1]?.label}
              </span>
            </div>
            <Sparkline
              data={fleetUtilizationTrend}
              color="#4f46e5"
              formatValue={(v) => `${v}%`}
              badgeTrend="+14.2%"
              isPositive={true}
            />
          </div>
        </div>
      </div>

      {/* ROLE-FILTERED FAST ACTION LAUNCHPAD */}
      {/* "setiap role hanya menampilkan menu kerja yang sesuai pada rolenya di dashboard" */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Role-Based Quick Actions ({currentRoleWorkspace.title})
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">
            {currentRoleWorkspace.quickActions.length} Available Actions
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {currentRoleWorkspace.quickActions.map((item: any) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={item.action}
                className="flex flex-col items-center justify-center p-3 rounded border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-slate-700 transition-colors text-center cursor-pointer group"
              >
                <Icon className="w-5 h-5 text-slate-600 mb-1.5 group-hover:text-slate-900 transition-colors" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TABEL LAPORAN RESMI SESUAI ROLE MASING-MASING DI DASHBOARD (Requirements 6 & 7) */}
      {/* ========================================================================= */}
      <div data-print-area className="bg-white border border-slate-200 rounded-md p-4 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-indigo-50 border border-indigo-200 text-indigo-700">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Official Reports &amp; Documents ({currentRoleWorkspace.title})
                </h3>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
                  Role-Based Access
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Showing {filteredDashboardDocs.length} official records available to your dashboard role. Select a document ID to open the full record.
              </p>
            </div>
          </div>

          {/* Quick Actions for Table */}
          <div className="no-print flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportDashboardTableToExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded shadow-2xs transition-colors cursor-pointer"
              title="Export this role-based report table to Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Export Excel</span>
              <Download className="w-3 h-3 text-emerald-600" />
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded shadow-2xs transition-colors cursor-pointer"
              title="Print this report table or save it as a PDF"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print PDF</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('reports')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded shadow-2xs transition-colors cursor-pointer"
              title="Open the full Reports Center"
            >
              <span>Full Reports Center</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search & Dynamic Filter Category Pills */}
        <div className="no-print space-y-2.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={tableSearchTerm}
                onChange={(e) => setTableSearchTerm(e.target.value)}
                placeholder="Search by document ID, client, equipment, or status..."
                className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded text-xs outline-none focus:border-slate-800 font-mono"
              />
            </div>

            <div className="text-[11px] text-slate-500 font-mono bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded flex items-center gap-1.5 shrink-0">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Showing: <strong>{filteredDashboardDocs.length}</strong> of <strong>{roleDashboardDocs.length}</strong> records</span>
            </div>
          </div>

          {/* Dynamic Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 text-xs">
            <span className="text-[11px] font-semibold text-slate-500 shrink-0 mr-1">
              Filter by Type:
            </span>
            {dashboardCategoryPills.map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setTableFilterCategory(pill.id)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  tableFilterCategory === pill.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table Display */}
        <div className="border border-slate-200 rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                  <th className="py-2 px-3 text-center w-10">No</th>
                  <th className="py-2 px-3">Document ID</th>
                  <th className="py-2 px-3">Document Type</th>
                  <th className="py-2 px-3">Client / Related Party</th>
                  <th className="py-2 px-3">Issue Date</th>
                  <th className="py-2 px-3 text-right">Amount (IDR)</th>
                  <th className="py-2 px-3 text-center">Status</th>
                  <th className="py-2 px-3 text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredDashboardDocs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No official documents match the search filter "{tableSearchTerm}".
                    </td>
                  </tr>
                ) : (
                  filteredDashboardDocs.slice(0, 15).map((doc, idx) => (
                    <tr key={`${doc.type}-${doc.id}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3">
                        <button
                          type="button"
                          onClick={() => setPreviewModalDoc({ type: doc.type, data: doc.raw })}
                          className="font-mono font-bold text-indigo-700 hover:text-indigo-900 hover:underline flex items-center gap-1.5 cursor-pointer text-left"
                          title="Open the full official document preview"
                        >
                          <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>{doc.id}</span>
                        </button>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${doc.badgeColor}`}>
                          {doc.typeLabel}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {doc.party}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {doc.date}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-right text-slate-900">
                        {doc.amount > 0 ? formatRupiahAmount(doc.amount) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {doc.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => setPreviewModalDoc({ type: doc.type, data: doc.raw })}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded cursor-pointer transition-colors"
                          title="View document preview"
                        >
                          <Eye className="w-3 h-3 text-indigo-600" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filteredDashboardDocs.length > 15 && (
            <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <span>Showing 15 of {filteredDashboardDocs.length} records. Open the Reports Center for the full audit.</span>
              <button
                type="button"
                onClick={() => onNavigate('reports')}
                className="font-semibold text-indigo-700 hover:text-indigo-900 cursor-pointer"
              >
                View All {filteredDashboardDocs.length} Records &rarr;
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Role-filtered Workflow Pillars & Live Audit Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Commercial Workflow Status */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Operational Workflow &amp; Document Status
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Displays modules relevant to your account's responsibilities and permissions.
                </p>
              </div>
              <span className="text-xs text-slate-500 font-mono">Real-Time Sync</span>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Pillar: Sales Pipeline (Executive, Admin IT, Sales & Marketing) */}
              {(userRole === 'EXECUTIVE' || userRole === 'ADMIN_IT' || userRole === 'SALES_MARKETING') && (
                <div
                  onClick={() => onNavigate('sales')}
                  className="p-3 border border-slate-200 rounded hover:border-slate-300 cursor-pointer bg-slate-50/50 transition-colors"
                >
                  <div className="text-xs font-semibold text-slate-800 flex items-center justify-between">
                    <span>1. Sales Pipeline</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Quotations → Customer Acceptance → Order Allocation
                  </p>
                  <div className="mt-2 text-xs font-mono font-medium text-slate-900">
                    {formatRupiahAmount(displayedSalesRevenue)} booked
                  </div>
                </div>
              )}

              {/* Pillar: Rental Contracts (Executive, Admin IT, Asset Control, Management Operation) */}
              {(userRole === 'EXECUTIVE' || userRole === 'ADMIN_IT' || userRole === 'ASSET_CONTROL' || userRole === 'MANAGEMENT_OPERATION') && (
                <div
                  onClick={() => onNavigate('rentals')}
                  className="p-3 border border-slate-200 rounded hover:border-slate-300 cursor-pointer bg-slate-50/50 transition-colors"
                >
                  <div className="text-xs font-semibold text-slate-800 flex items-center justify-between">
                    <span>2. Rental Contracts</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Asset Reservation → Handover → Return &amp; Inspection
                  </p>
                  <div className="mt-2 text-xs font-mono font-medium text-slate-900">
                    {metrics.activeRentalsCount} fleet deployments
                  </div>
                </div>
              )}

              {/* Pillar: Invoicing & FAT (Executive, Admin IT, Finance & Tax, AR Management) */}
              {(userRole === 'EXECUTIVE' || userRole === 'ADMIN_IT' || userRole === 'FINANCE_ACCOUNTING_TAX' || userRole === 'AR_MANAGEMENT') && (
                <div
                  onClick={() => onNavigate('invoices')}
                  className="p-3 border border-slate-200 rounded hover:border-slate-300 cursor-pointer bg-slate-50/50 transition-colors"
                >
                  <div className="text-xs font-semibold text-slate-800 flex items-center justify-between">
                    <span>3. Invoicing &amp; Cash (FAT / AR)</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Billing → Multi-Invoice Allocation → AR Aging
                  </p>
                  <div className="mt-2 text-xs font-mono font-medium text-slate-900">
                    {formatRupiahAmount(displayedCollected)} collected
                  </div>
                </div>
              )}

              {/* Specific Pillar for Asset Control: Heavy Equipment Legal Docs */}
              {userRole === 'ASSET_CONTROL' && (
                <div
                  onClick={() => onNavigate('assets')}
                  className="p-3 border border-amber-200 rounded hover:border-amber-300 cursor-pointer bg-amber-50/40 transition-colors col-span-2"
                >
                  <div className="text-xs font-semibold text-amber-900 flex items-center justify-between">
                    <span>Heavy Equipment Legal &amp; Compliance Documents</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <p className="mt-1 text-xs text-amber-800">
                    Track STNK, BPKB, Equipment Permits (SIA), chassis/engine numbers, and K3 inspection expiry dates.
                  </p>
                  <div className="mt-2 text-xs font-mono font-medium text-amber-950">
                    Armada alat berat terverifikasi &amp; berdokumen legal
                  </div>
                </div>
              )}

              {/* Specific Pillar for Management Operation: Operator & SIO Tracking */}
              {userRole === 'MANAGEMENT_OPERATION' && (
                <div
                  onClick={() => onNavigate('maintenance')}
                  className="p-3 border border-indigo-200 rounded hover:border-indigo-300 cursor-pointer bg-indigo-50/40 transition-colors col-span-2"
                >
                  <div className="text-xs font-semibold text-indigo-900 flex items-center justify-between">
                    <span>Operator Qualifications &amp; SIO Certificates</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <p className="mt-1 text-xs text-indigo-800">
                    Manage heavy equipment operators, verify Kemenaker Class 1/2/3 SIO licenses, and assign projects.
                  </p>
                  <div className="mt-2 text-xs font-mono font-medium text-indigo-950">
                    Certified operators ready for field deployment
                  </div>
                </div>
              )}

              {/* Specific Pillar for Procurement */}
              {userRole === 'PROCUREMENT' && (
                <div
                  onClick={() => onNavigate('procurement')}
                  className="p-3 border border-emerald-200 rounded hover:border-emerald-300 cursor-pointer bg-emerald-50/40 transition-colors col-span-2"
                >
                  <div className="text-xs font-semibold text-emerald-900 flex items-center justify-between">
                    <span>Asset Procurement &amp; Spare Parts Purchasing</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <p className="mt-1 text-xs text-emerald-800">
                    Vendor purchase orders (POs), hydraulic lubricants, filter maintenance kits, and warehouse goods receipt.
                  </p>
                  <div className="mt-2 text-xs font-mono font-medium text-emerald-950">
                    Integrated office procurement and depot operations workflow
                  </div>
                </div>
              )}

              {/* Specific Pillar for AR Management: Tracing Tagihan */}
              {userRole === 'AR_MANAGEMENT' && (
                <div
                  onClick={() => onNavigate('reports')}
                  className="p-3 border border-sky-200 rounded hover:border-sky-300 cursor-pointer bg-sky-50/40 transition-colors col-span-2"
                >
                  <div className="text-xs font-semibold text-sky-900 flex items-center justify-between">
                    <span>Invoice Tracking &amp; AR Aging Buckets</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-sky-600" />
                  </div>
                  <p className="mt-1 text-xs text-sky-800">
                    Monitor receivables aged 0-30, 31-60, 61-90, and over 90 days, and issue account statements.
                  </p>
                  <div className="mt-2 text-xs font-mono font-medium text-sky-950">
                    Overdue monitored: {formatRupiahAmount(displayedOverdue)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Operational Integrity Controls */}
          <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Operational Integrity &amp; Compliance Safeguards
              </h3>
              <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                Enforced
              </span>
            </div>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <Truck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Anti-Double Allocation:</strong> Serialized assets cannot be simultaneously booked, rented, or sold to separate clients.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <DollarSign className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Decimal-Safe Finance:</strong> All invoice subtotals, tax adjustments, and partial payment allocations run through integer-cent rounding.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Audit Trail Invariants:</strong> Financial documents cannot be deleted silently. Corrections require controlled credit notes or amendments.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Audit Logs */}
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">System Audit Trail</h3>
            <button
              onClick={() => onNavigate('settings')}
              className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {auditLogs.slice(0, 8).map((log) => (
              <div key={log.id} className="py-2.5 text-xs">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span className="font-semibold text-slate-700">{log.userName}</span>
                  <span className="font-mono">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="mt-1 text-slate-800 leading-snug">{log.details}</p>
                <div className="mt-1 text-[10px] text-slate-400 font-mono">
                  {log.action} · {log.entityId}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Document Preview Modal triggered by clicking any document ID in the dashboard table */}
      {previewModalDoc && (
        <DocumentPreviewModal
          docType={previewModalDoc.type}
          data={previewModalDoc.data}
          onClose={() => setPreviewModalDoc(null)}
        />
      )}
    </div>
  );
};
