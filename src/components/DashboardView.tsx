import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { AuditLog, UserRole } from '../types/index.ts';
import { Sparkline, SparklinePoint } from './Sparkline.tsx';

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
            <td class="num highlight">$${displayedNetInvoiced.toLocaleString()}</td>
            <td class="num positive">+${momRevenueGrowthPercent.toFixed(1)}%</td>
            <td>Operational commercial billings issued</td>
          </tr>
          <tr>
            <td><strong>Collected Cash Payments</strong></td>
            <td class="num highlight">$${displayedCollected.toLocaleString()}</td>
            <td class="num positive">+${momPaymentGrowthPercent.toFixed(1)}%</td>
            <td>Verified bank and wire settlements</td>
          </tr>
          <tr>
            <td><strong>Outstanding AR Balance</strong></td>
            <td class="num">$${displayedOutstandingAR.toLocaleString()}</td>
            <td class="num">-8.5%</td>
            <td>Overdue Aging: $${displayedOverdue.toLocaleString()}</td>
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
            <th class="num">Net Invoiced Revenue ($)</th>
            <th class="num">Commercial Sales ($)</th>
            <th class="num">Equipment Leases ($)</th>
          </tr>
          ${activeData
            .map(
              (row) => `
            <tr>
              <td><strong>${row.label}</strong></td>
              <td>${row.date}</td>
              <td class="num highlight">$${row.invoicedRevenue.toLocaleString()}</td>
              <td class="num">$${row.salesRevenue.toLocaleString()}</td>
              <td class="num">$${row.rentalRevenue.toLocaleString()}</td>
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
            <th class="num">Collected Payments ($)</th>
            <th>Settlement Velocity</th>
          </tr>
          ${activeData
            .map(
              (row) => `
            <tr>
              <td><strong>${row.label}</strong></td>
              <td>${row.date}</td>
              <td class="num highlight">$${row.collectedPayments.toLocaleString()}</td>
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
            <th class="num">Outstanding Balance ($)</th>
            <th class="num">Overdue Balance ($)</th>
          </tr>
          ${activeData
            .map(
              (row) => `
            <tr>
              <td><strong>${row.label}</strong></td>
              <td>${row.date}</td>
              <td class="num highlight">$${row.outstandingAR.toLocaleString()}</td>
              <td class="num" style="color: #b91c1c;">$${row.overdueAmount.toLocaleString()}</td>
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

    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeDate = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `Apex_Commercial_Analytics_Charts_${safeDate}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportNotice('File Excel berhasil diunduh! Seluruh 4 dataset chart telah tersimpan.');
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
      title: '1. Pusat Kendali Eksekutif (Direktur Utama)',
      description: 'Akses seluruh fitur operasional & komersial. Laporan eksekutif laba kotor, arus kas, utilisasi armada, dan revenue MoM (Export PDF & Excel).',
      quickActions: [
        { id: 'reports', label: 'Executive Report & Laba', icon: TrendingUp, action: () => onNavigate('reports') },
        { id: 'excelExport', label: 'Unduh Excel (All Charts)', icon: FileSpreadsheet, action: () => handleExportAllChartsToExcel() },
        { id: 'printView', label: 'Print Laporan PDF', icon: Printer, action: () => window.print() },
        { id: 'invoices', label: 'Invoicing & Saldo AR', icon: DollarSign, action: () => onNavigate('invoices') },
        { id: 'assets', label: 'Status Armada Aset', icon: Boxes, action: () => onNavigate('assets') },
        { id: 'rentals', label: 'Kontrak Sewa Aktif', icon: Calendar, action: () => onNavigate('rentals') },
      ],
    },
    ADMIN_IT: {
      title: '2. Administrator Admin (IT & System DevOps)',
      description: 'Akses penuh ke semua fitur, Manajemen Pengguna & Hak Akses, REST API Explorer, Swagger schema, automated test suite runner, dan log audit.',
      quickActions: [
        { id: 'userManagement', label: 'Manajemen Pengguna (IT)', icon: Users, action: () => onNavigate('user-management') },
        { id: 'apiExplorer', label: 'REST API & Swagger', icon: Terminal, action: () => onNavigate('api-explorer') },
        { id: 'testRunner', label: 'Automated Test Suite', icon: AlertTriangle, action: () => onNavigate('test-runner') },
        { id: 'settings', label: 'Audit Trail & Settings', icon: ShieldCheck, action: () => onNavigate('settings') },
        { id: 'assetRegistry', label: 'Asset Tag Master', icon: Boxes, action: () => onNavigate('assets') },
      ],
    },
    SALES_MARKETING: {
      title: '3. Ruang Kerja Sales & Marketing Support',
      description: 'Mengolah seluruh data customer, data project atau client, penawaran harga (sales quotation), sales order, dan alokasi unit.',
      quickActions: [
        { id: 'quotation', label: 'Buat Penawaran (Quotation)', icon: FileText, action: () => onOpenQuickNew('quotation') },
        { id: 'salesOrder', label: 'Direct Sales Order', icon: ArrowUpRight, action: () => onOpenQuickNew('salesOrder') },
        { id: 'customers', label: 'Database Customer CRM', icon: Users, action: () => onNavigate('customers') },
        { id: 'products', label: 'Katalog Produk & Aset', icon: Boxes, action: () => onNavigate('products') },
        { id: 'salesView', label: 'Daftar Pesanan Sales', icon: Briefcase, action: () => onNavigate('sales') },
      ],
    },
    ASSET_CONTROL: {
      title: '4. Ruang Kerja Asset Control (Asset Management)',
      description: 'Mengurus registrasi aset, delivery, penomoran unit, dan kelengkapan dokumen legalitas alat berat: STNK, BPKB, SIA kelaikan Disnaker.',
      quickActions: [
        { id: 'assets', label: 'Registrasi & Tagging Aset', icon: Boxes, action: () => onNavigate('assets') },
        { id: 'legalDocs', label: 'Dokumen Legal (STNK/SIA)', icon: FileText, action: () => onNavigate('assets') },
        { id: 'deliveries', label: 'Surat Jalan Delivery (DO)', icon: Truck, action: () => onNavigate('deliveries') },
        { id: 'maintenance', label: 'Perawatan & Kalibrasi', icon: Wrench, action: () => onNavigate('maintenance') },
      ],
    },
    MANAGEMENT_OPERATION: {
      title: '5. Ruang Kerja Management Operation (Field Operation)',
      description: 'Mengatur penugasan operator alat berat di lapangan dan mengelola masa berlaku dokumen kualifikasi operator (SIO Kemenaker).',
      quickActions: [
        { id: 'operatorMgt', label: 'Operator & Dokumen SIO', icon: Wrench, action: () => onNavigate('maintenance') },
        { id: 'assetAssign', label: 'Armada & Penugasan Unit', icon: Boxes, action: () => onNavigate('assets') },
        { id: 'fieldOrders', label: 'Perintah Kerja Lapangan', icon: Clock, action: () => onNavigate('maintenance') },
        { id: 'fieldDelivery', label: 'Serah Terima Fisik (DO)', icon: Truck, action: () => onNavigate('deliveries') },
      ],
    },
    PROCUREMENT: {
      title: '6. Ruang Kerja Procurement (Pengadaan & Pembelian)',
      description: 'Melakukan pembelanjaan aset baru, sparepart pengganti, pelumas mesin, PO vendor supplier, dan keperluan operasional kantor.',
      quickActions: [
        { id: 'poCreate', label: 'Purchase Order (PO) Baru', icon: PackageSearch, action: () => onNavigate('procurement') },
        { id: 'vendorList', label: 'Daftar Vendor Supplier', icon: Users, action: () => onNavigate('procurement') },
        { id: 'goodsReceive', label: 'Penerimaan Sparepart', icon: Boxes, action: () => onNavigate('procurement') },
        { id: 'spareCatalog', label: 'Katalog Suku Cadang', icon: Briefcase, action: () => onNavigate('products') },
      ],
    },
    FINANCE_ACCOUNTING_TAX: {
      title: '7. Ruang Kerja Accounting Finance & Tax (FAT)',
      description: 'Recording seluruh transaksi keuangan, jurnal data akun, perhitungan pajak komersial (PPN 11%, PPh 23), dan penerbitan faktur tagihan.',
      quickActions: [
        { id: 'invoiceNew', label: 'Terbitkan Faktur Tagihan', icon: CreditCard, action: () => onOpenQuickNew('invoice') },
        { id: 'paymentNew', label: 'Catat Pembayaran Masuk', icon: Banknote, action: () => onOpenQuickNew('payment') },
        { id: 'taxReport', label: 'Perhitungan Pajak (FAT)', icon: DollarSign, action: () => onNavigate('reports') },
        { id: 'invoiceList', label: 'Daftar Faktur & Jurnal', icon: FileText, action: () => onNavigate('invoices') },
      ],
    },
    AR_MANAGEMENT: {
      title: '8. Ruang Kerja AR Management (Accounts Receivable)',
      description: 'Tracing tagihan piutang, monitoring invoice outstanding, penagihan aging buckets (0-30, 31-60, 61-90, >90 hari), dan rekonsiliasi.',
      quickActions: [
        { id: 'arTrace', label: 'Tracing Tagihan Piutang', icon: Clock, action: () => onNavigate('invoices') },
        { id: 'arAging', label: 'Laporan Aging Piutang', icon: TrendingUp, action: () => onNavigate('reports') },
        { id: 'pmtCollect', label: 'Catat Pelunasan Tagihan', icon: Banknote, action: () => onOpenQuickNew('payment') },
        { id: 'custAccount', label: 'Statement of Account', icon: Users, action: () => onNavigate('customers') },
      ],
    },
    OPERATOR_USER: {
      title: '9. Ruang Kerja Operator Lapangan (Status Alat)',
      description: 'Pindai tag barcode pada unit alat berat fisik dan kirimkan status kesiapan kerja (Bekerja Normal vs Rusak / Breakdown).',
      quickActions: [
        { id: 'scanStatus', label: 'Scan & Cek Status Alat', icon: QrCode, action: () => onNavigate('operator-status') },
      ],
    },
    TECHNICAL_SERVICE: {
      title: '10. Ruang Kerja Technical Service & Bengkel Mekanik',
      description: 'Pengerjaan tiket perbaikan dari laporan operator, scan barcode mulai/selesai servis, dan penggantian sparepart/jasa procurement.',
      quickActions: [
        { id: 'techDashboard', label: 'Dashboard & Scan Servis', icon: Wrench, action: () => onNavigate('technical-service') },
        { id: 'workOrders', label: 'Riwayat Work Orders', icon: ShieldCheck, action: () => onNavigate('maintenance') },
        { id: 'assetList', label: 'Kondisi Armada Alat', icon: Boxes, action: () => onNavigate('assets') },
      ],
    },
  };

  const currentRoleWorkspace = (userRole && roleWorkspaces[userRole as UserRole]) ? roleWorkspaces[userRole as UserRole] : roleWorkspaces.EXECUTIVE;

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
            Disesuaikan dengan Hak Akses Peran
          </span>
        </div>
      </div>

      {/* DATE RANGE FILTER & EXCEL EXPORT CONTROL BAR */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-amber-50 border border-amber-200 text-amber-800">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>Filter Periode Tanggal &amp; Tren Metrik</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Pilih rentang waktu untuk memfilter seluruh metrik keuangan dan grafik sparkline di bawah.
              </p>
            </div>
          </div>

          {/* Excel Export Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportAllChartsToExcel}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded shadow-xs transition-colors cursor-pointer"
              title="Unduh seluruh data grafik dan metrik ke spreadsheet Excel (.xls)"
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
            <span className="text-slate-500 font-medium text-[11px] mr-1">Preset Rentang:</span>
            {(['30D', '3M', '6M', 'YTD', 'ALL', 'CUSTOM'] as DateRangePreset[]).map((p) => {
              const labels: Record<DateRangePreset, string> = {
                '30D': '30 Hari Terakhir',
                '3M': '3 Bulan',
                '6M': '6 Bulan (Default)',
                'YTD': 'Tahun Berjalan (YTD)',
                'ALL': 'Semua Waktu',
                'CUSTOM': 'Kustom Tanggal...',
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
              Aktif: <strong>{activeData[0]?.label || startDate}</strong> s/d <strong>{activeData[activeData.length - 1]?.label || endDate}</strong> ({activeData.length} bulan)
            </span>
          </div>
        </div>

        {/* Interactive Custom Date Range Inputs if CUSTOM preset selected */}
        {showCustomInputs && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs bg-slate-50/70 p-3 rounded">
            <span className="font-semibold text-slate-700">Tentukan Rentang Kustom:</span>
            <div className="flex items-center gap-2">
              <label className="text-slate-500">Mulai:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 font-mono outline-none focus:border-slate-800"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-slate-500">Selesai:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 font-mono outline-none focus:border-slate-800"
              />
            </div>

            <span className="text-[11px] text-slate-400">
              Grafik sparkline dan metrik MoM akan langsung diperbarui secara otomatis.
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
              Tutup
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
                ${displayedNetInvoiced.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div
                className={`flex items-center gap-1 font-mono-numbers text-xs font-bold px-2 py-0.5 rounded border ${
                  momRevenueGrowthPercent >= 0
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : 'text-rose-700 bg-rose-50 border-rose-200'
                }`}
                title={`Bulan Sebelumnya: $${priorRev.toLocaleString()} → Bulan Berjalan: $${currRev.toLocaleString()}`}
              >
                <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                <span>{momRevenueGrowthPercent >= 0 ? '+' : ''}{momRevenueGrowthPercent.toFixed(1)}%</span>
                <span className="text-[10px] font-medium font-sans opacity-80">MoM</span>
              </div>
            </div>

            {/* Invoiced Revenue Breakdown */}
            <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Sales: ${displayedSalesRevenue.toLocaleString()}</span>
              <span>Leases: ${displayedRentalRevenue.toLocaleString()}</span>
            </div>

            {/* Dedicated Month-over-Month Revenue Growth Metric Box */}
            <div className="mt-2.5 p-2 bg-slate-50/80 rounded border border-slate-100 flex items-center justify-between font-mono-numbers text-[11px]">
              <div className="flex items-center gap-1.5 font-sans text-slate-600">
                <span className="font-medium text-slate-700">Month-over-Month Revenue Growth:</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-emerald-700">
                <span>{momRevenueGrowthPercent >= 0 ? '+' : ''}{momRevenueGrowthPercent.toFixed(1)}%</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  ({momRevenueDiff >= 0 ? '+$' : '-$'}{Math.abs(momRevenueDiff).toLocaleString()})
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
                ${displayedCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                +{momPaymentGrowthPercent.toFixed(1)}% (+${momPaymentDiff.toLocaleString()})
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
              ${displayedOutstandingAR.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-1 text-[11px] text-amber-700 font-medium">
              Overdue: ${displayedOverdue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
            Aksi Kerja Cepat Sesuai Peran ({currentRoleWorkspace.title})
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">
            {currentRoleWorkspace.quickActions.length} Menu Akses
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

      {/* Main Grid: Role-filtered Workflow Pillars & Live Audit Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Commercial Workflow Status */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Alur Kerja Operasional &amp; Status Dokumen
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Menampilkan modul yang relevan dengan tugas dan wewenang akun Anda.
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
                    ${displayedSalesRevenue.toLocaleString()} booked
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
                    ${displayedCollected.toLocaleString()} collected
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
                    <span>Legalitas Alat Berat &amp; Dokumen Kelaikan</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <p className="mt-1 text-xs text-amber-800">
                    Tracking STNK, BPKB, Surat Ijin Alat (SIA), nomor rangka/mesin, dan masa berlaku uji berkala K3.
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
                    <span>Kualifikasi Operator &amp; Sertifikat SIO</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <p className="mt-1 text-xs text-indigo-800">
                    Manajemen personil operator alat berat, validasi SIO Kelas 1/2/3 Kemenaker, dan penugasan proyek.
                  </p>
                  <div className="mt-2 text-xs font-mono font-medium text-indigo-950">
                    Operator bersertifikat &amp; siap mobilisasi lapangan
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
                    <span>Pengadaan Aset &amp; Pembelanjaan Sparepart</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <p className="mt-1 text-xs text-emerald-800">
                    Purchase Order (PO) vendor, pelumas hidrolik, filter maintenance kit, dan penerimaan barang gudang.
                  </p>
                  <div className="mt-2 text-xs font-mono font-medium text-emerald-950">
                    Alur pengadaan kantor &amp; operasional depot terintegrasi
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
                    <span>Tracing Tagihan &amp; AR Aging Buckets</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-sky-600" />
                  </div>
                  <p className="mt-1 text-xs text-sky-800">
                    Monitoring jatuh tempo piutang 0-30, 31-60, 61-90, dan &gt;90 hari serta penerbitan statement of account.
                  </p>
                  <div className="mt-2 text-xs font-mono font-medium text-sky-950">
                    Overdue terpantau: ${displayedOverdue.toLocaleString()}
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
    </div>
  );
};
