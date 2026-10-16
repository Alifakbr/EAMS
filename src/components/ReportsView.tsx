import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api.ts';
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  Boxes,
  Printer,
  FileSpreadsheet,
  Download,
  Calendar,
  Clock,
  FileText,
  CheckCircle2,
  Receipt,
  Users,
  Truck,
  Building2,
  Wrench,
  PackageSearch,
  Calculator,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  Filter,
  FileCheck,
  Search,
  Eye,
  PackageCheck,
  CreditCard,
} from 'lucide-react';
import { UserRole } from '../types/index.ts';
import { DocumentPreviewModal, SupportedDocType } from './DocumentPreviewModal.tsx';

interface ReportsViewProps {
  userRole?: UserRole;
  onNavigate?: (tab: string) => void;
}

type ReportTabType = 'official_docs' | 'executive' | 'sales' | 'asset_control' | 'operations' | 'procurement' | 'fat' | 'ar';

export const ReportsView: React.FC<ReportsViewProps> = ({ userRole = 'EXECUTIVE', onNavigate }) => {
  const roleDisplayNames: Record<UserRole, { title: string; dept: string; desc: string }> = {
    EXECUTIVE: {
      title: 'Executive (Direktur Utama)',
      dept: 'Direksi & Manajemen Eksekutif',
      desc: 'Akses seluruh laporan komersial, operasional & finansial dengan kalkulator hitungan laba rugi serta ekspor PDF/Excel resmi.',
    },
    ADMIN_IT: {
      title: 'Administrator Admin (IT)',
      dept: 'Divisi Teknologi Informasi & Sistem',
      desc: 'Akses penuh audit seluruh modul laporan departemen perusahaan dan rekonsiliasi data.',
    },
    SALES_MARKETING: {
      title: 'Sales & Marketing',
      dept: 'Divisi Komersial & Client CRM',
      desc: 'Laporan portofolio klien, proyek pelanggan, status plafon kredit, dan realisasi kontrak penjualan/sewa.',
    },
    ASSET_CONTROL: {
      title: 'Asset Control (Asset Management)',
      dept: 'Divisi Pengendalian & Legalitas Aset',
      desc: 'Laporan registrasi aset, status kelaikan operasional, nomor polisi/rangka/mesin, dan dokumen STNK, BPKB, serta SIA Kemenaker.',
    },
    MANAGEMENT_OPERATION: {
      title: 'Management Operation (Field Operation)',
      dept: 'Divisi Operasional Lapangan & Operator',
      desc: 'Laporan kualifikasi lisensi K3 operator (SIO Kelas 1/2/3), penugasan alat berat terdaftar, dan log status harian lapangan.',
    },
    PROCUREMENT: {
      title: 'Procurement',
      dept: 'Divisi Pengadaan & Pembelanjaan',
      desc: 'Laporan rekapitulasi Purchase Orders (PO), pengadaan aset alat berat, suku cadang sparepart, dan belanja operasional kantor.',
    },
    FINANCE_ACCOUNTING_TAX: {
      title: 'Accounting Finance & Tax (FAT)',
      dept: 'Divisi Keuangan, Akuntansi & Perpajakan',
      desc: 'Laporan transaksi kas/bank, jurnal faktur invoicing, serta perhitungan pajak resmi PPN 11% Keluaran dan PPh 23 Sewa Alat.',
    },
    AR_MANAGEMENT: {
      title: 'AR Management (Accounts Receivable)',
      dept: 'Divisi Penagihan & Manajemen Piutang',
      desc: 'Laporan tracing penagihan tagihan pelanggan, analisis umur piutang (Aging Buckets), dan monitoring piutang jatuh tempo.',
    },
    OPERATOR_USER: {
      title: 'Operator / Pengguna Lapangan',
      dept: 'Operator Armada Alat Berat',
      desc: 'Laporan log absensi scan barcode dan rekaman pemeriksaan kondisi alat kerja di lapangan.',
    },
    TECHNICAL_SERVICE: {
      title: 'Technical Service & Workshop Mekanik',
      dept: 'Divisi Pemeliharaan & Bengkel Lapangan',
      desc: 'Laporan pengerjaan perbaikan, penggantian sparepart/jasa, downtime unit, dan sertifikasi laik jalan.',
    },
  };

  // Permitted report modules tailored to each role
  // Permitted report modules tailored strictly to each role's dashboard purview
  const roleAllowedReportTabs: Record<UserRole, { id: ReportTabType; label: string; icon: any; desc: string }[]> = {
    // 1. Executive (Direktur): Akses semua laporan eksekutif dan komersial perusahaan
    EXECUTIVE: [
      { id: 'official_docs', label: '1. Pusat Dokumen Resmi Komersial (Quotation & PO Client)', icon: FileCheck, desc: 'Pusat Arsip Dokumen Resmi: Quotation Penawaran, PO dari Client, Sales Order, Kontrak Sewa & Invoice' },
      { id: 'executive', label: '2. Eksekutif & Hitungan Laba', icon: TrendingUp, desc: 'Laba Rugi, EBIT/EBITDA, Arus Kas & Simulasi Finansial Direktur' },
      { id: 'sales', label: '3. Sales & CRM Klien', icon: Users, desc: 'Portofolio Klien, Plafon Kredit, Realisasi Penjualan & Kontrak Sewa' },
      { id: 'asset_control', label: '4. Legalitas Alat (STNK/SIA)', icon: Truck, desc: 'Masa Berlaku STNK, BPKB & Sertifikasi Kelaikan SIA Kemenaker' },
      { id: 'operations', label: '5. Operator & SIO Kemenaker', icon: Wrench, desc: 'Sertifikasi Operator K3, Penugasan Alat Berat & Utilisasi Lapangan' },
      { id: 'procurement', label: '6. Pengadaan & Belanja (PO Tim Procurement)', icon: PackageSearch, desc: 'Purchase Orders Vendor, Belanja Aset Baru, Sparepart & Kantor' },
      { id: 'fat', label: '7. FAT & Pajak (PPN/PPh)', icon: Receipt, desc: 'Perhitungan Pajak PPN 11%, PPh 23 Sewa Alat & Invoicing' },
      { id: 'ar', label: '8. Tracing AR & Aging Piutang', icon: BarChart3, desc: 'Analisis Umur Piutang (Aging Buckets) & Tracing Tagihan Terbuka' },
    ],
    // 2. Administrator Admin (IT): Semua laporan sistem untuk audit dan validasi data
    ADMIN_IT: [
      { id: 'official_docs', label: '1. Pusat Dokumen Resmi & Audit Komersial', icon: FileCheck, desc: 'Audit Seluruh Dokumen: Quotation, PO Client, Sales Order, Kontrak Sewa, Invoice, Delivery & PO Vendor' },
      { id: 'executive', label: '2. Eksekutif & Hitungan Laba', icon: TrendingUp, desc: 'Financial Overview & Executive Projections' },
      { id: 'sales', label: '3. Sales & CRM Klien', icon: Users, desc: 'Sales CRM & Commercial Contracts Data' },
      { id: 'asset_control', label: '4. Legalitas Alat (STNK/SIA)', icon: Truck, desc: 'Heavy Equipment Legal & Safety Documents' },
      { id: 'operations', label: '5. Operator & SIO Kemenaker', icon: Wrench, desc: 'Operator SIO Credentials & Deployment' },
      { id: 'procurement', label: '6. Pengadaan & Belanja', icon: PackageSearch, desc: 'Procurement PO & Vendor Outlays' },
      { id: 'fat', label: '7. FAT & Pajak (PPN/PPh)', icon: Receipt, desc: 'Tax Calculations, PPN 11% & PPh 23' },
      { id: 'ar', label: '8. Tracing AR & Aging Piutang', icon: BarChart3, desc: 'AR Tracing & Aging Receivables Records' },
    ],
    // 3. Sales & Marketing: Hanya Quotation, PO Client, Sales Order, CRM Klien
    SALES_MARKETING: [
      { id: 'official_docs', label: '1. Dokumen Resmi Sales, Quotation & PO Client', icon: FileCheck, desc: 'Surat Penawaran Harga (Quotation), PO Resmi dari Client (Customer PO), Sales Order & Kontrak Sewa' },
      { id: 'sales', label: '2. Laporan Sales, Project & CRM Klien', icon: Users, desc: 'Portofolio Customer Project, Plafon Kredit, Realisasi Penjualan & Pipeline Kontrak Sewa' },
    ],
    // 4. Asset Control: Dokumen Legalitas Aset, DO Delivery, PO Client & Quotation Unit
    ASSET_CONTROL: [
      { id: 'official_docs', label: '1. Dokumen Alat, Delivery & PO Client', icon: FileCheck, desc: 'Dokumen Legalitas & Register Alat, Surat Jalan Delivery (DO), PO dari Client & Quotation Unit' },
      { id: 'asset_control', label: '2. Laporan Legalitas & Dokumen Alat Berat (STNK/BPKB/SIA)', icon: Truck, desc: 'Register Aset Terpusat, Masa Berlaku STNK, BPKB, dan Sertifikasi Kelaikan SIA Kemenaker' },
    ],
    // 5. Management Operation: Dokumen Operasional Lapangan & SIO Operator
    MANAGEMENT_OPERATION: [
      { id: 'official_docs', label: '1. Dokumen Operasional & Delivery Lapangan', icon: FileCheck, desc: 'Surat Jalan Delivery Order, Kualifikasi Lisensi Operator SIO & Kelaikan Alat Lapangan' },
      { id: 'operations', label: '2. Laporan Operator & Kualifikasi Lisensi SIO', icon: Wrench, desc: 'Daftar Operator, Sertifikasi K3 SIO (Kelas 1/2/3), Masa Berlaku & Utilisasi Alat Berat' },
    ],
    // 6. Procurement: Pembelanjaan aset, sparepart, dan keperluan kantor (PO Tim Procurement - BUKAN PO Client)
    PROCUREMENT: [
      { id: 'official_docs', label: '1. Dokumen Pengadaan (PO Tim Procurement)', icon: FileCheck, desc: 'Purchase Order Tim Procurement ke Vendor Mitra (Bukan PO Client) & Tagihan Vendor' },
      { id: 'procurement', label: '2. Laporan Pengadaan, Belanja Aset & Vendor PO', icon: PackageSearch, desc: 'Rekapitulasi PO Tim Procurement, Belanja Aset Baru, Suku Cadang Sparepart & Belanja Kantor' },
    ],
    // 7. Finance Accounting & Tax (FAT): Invoicing, perhitungan pajak PPN/PPh, kas & bank
    FINANCE_ACCOUNTING_TAX: [
      { id: 'official_docs', label: '1. Dokumen Faktur Invoicing & Pajak (FAT)', icon: FileCheck, desc: 'Faktur Tagihan Invoicing Komersial, Faktur Pajak PPN 11%/PPh 23 & Kuitansi Pembayaran' },
      { id: 'fat', label: '2. Laporan Akuntansi, Invoicing & Perhitungan Pajak', icon: Receipt, desc: 'Rekapitulasi Faktur Invoicing, Pelunasan Kas & Perhitungan Resmi Pajak PPN 11% dan PPh 23' },
    ],
    // 8. AR Management: Tracing tagihan piutang, PO Client verifikasi, dan aging monitoring
    AR_MANAGEMENT: [
      { id: 'official_docs', label: '1. Dokumen Tagihan Piutang, PO Client & Quotation', icon: FileCheck, desc: 'Faktur Invoicing, PO dari Client (Dasar Tagihan), Quotation Acuan & Kuitansi Pembayaran AR' },
      { id: 'ar', label: '2. Laporan Tracing Tagihan Piutang & Aging Receivables', icon: BarChart3, desc: 'Tracing Status Tagihan, Aging Buckets (Current, 30, 60, 90+ Hari) & Overdue Monitoring' },
    ],
    // 9. Operator Lapangan: Log absensi & status pemeriksaan alat
    OPERATOR_USER: [
      { id: 'official_docs', label: '1. Dokumen Penugasan & Lisensi SIO', icon: FileCheck, desc: 'Sertifikasi Lisensi SIO Kemenaker & Register Alat Penugasan' },
      { id: 'operations', label: '2. Laporan Log Status & Pemeriksaan Harian Alat', icon: Wrench, desc: 'Catatan Absensi Scan Barcode & Hasil Pemeriksaan Fisik Alat Kerja di Lapangan' },
    ],
    // 10. Technical Service: Servis & pemeliharaan alat
    TECHNICAL_SERVICE: [
      { id: 'official_docs', label: '1. Dokumen Servis & Tiket Work Order', icon: FileCheck, desc: 'Tiket Work Orders Perbaikan Mekanik & Sertifikasi Laik Jalan Unit' },
      { id: 'operations', label: '2. Laporan Servis, Perbaikan & Penggantian Sparepart', icon: Wrench, desc: 'Rekap Tiket Work Orders, Penggunaan Suku Cadang, Downtime & Sertifikasi Laik Jalan' },
      { id: 'asset_control', label: '3. Kondisi Kelaikan Armada Alat Berat', icon: Truck, desc: 'Status Kondisi Terkini Unit & Masa Berlaku Surat Ijin Alat (SIA)' },
    ],
  };

  const availableTabs = roleAllowedReportTabs[userRole] || roleAllowedReportTabs.EXECUTIVE;

  const [activeReportTab, setActiveReportTab] = useState<ReportTabType>(() => {
    const tabs = roleAllowedReportTabs[userRole] || roleAllowedReportTabs.EXECUTIVE;
    return tabs[0]?.id || 'official_docs';
  });

  useEffect(() => {
    const tabs = roleAllowedReportTabs[userRole] || roleAllowedReportTabs.EXECUTIVE;
    if (!tabs.some((t) => t.id === activeReportTab)) {
      setActiveReportTab(tabs[0].id);
    }
  }, [userRole]);

  const [financeData, setFinanceData] = useState<any | null>(null);
  const [arData, setArData] = useState<any | null>(null);
  const [assetProfitData, setAssetProfitData] = useState<any[]>([]);
  const [salesReportData, setSalesReportData] = useState<any | null>(null);
  const [assetsList, setAssetsList] = useState<any[]>([]);
  const [operatorsList, setOperatorsList] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [invoicesList, setInvoicesList] = useState<any[]>([]);
  const [quotationsList, setQuotationsList] = useState<any[]>([]);
  const [salesOrdersList, setSalesOrdersList] = useState<any[]>([]);
  const [rentalsList, setRentalsList] = useState<any[]>([]);
  const [deliveriesList, setDeliveriesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Document Preview Modal State
  const [previewModalDoc, setPreviewModalDoc] = useState<{ type: SupportedDocType; data: any } | null>(null);
  const [docFilterCategory, setDocFilterCategory] = useState<string>('ALL');
  const [docSearchTerm, setDocSearchTerm] = useState<string>('');

  // =========================================================================
  // Executive Financial Calculator States (Interactive Calculation Tool for Direktur)
  // =========================================================================
  const [calcTargetGrowthPercent, setCalcTargetGrowthPercent] = useState<number>(15);
  const [calcOpexPercent, setCalcOpexPercent] = useState<number>(42);
  const [calcDepreciationPercent, setCalcDepreciationPercent] = useState<number>(10);
  const [calcTaxRatePercent, setCalcTaxRatePercent] = useState<number>(11);

  useEffect(() => {
    loadAllReportData();
  }, []);

  const loadAllReportData = async () => {
    setLoading(true);
    try {
      const [
        fin,
        ar,
        ap,
        sales,
        assetsRes,
        opsRes,
        poRes,
        custRes,
        invRes,
        quoRes,
        soRes,
        renRes,
        delRes,
      ] = await Promise.all([
        api.getFinanceDashboard(),
        api.getAccountsReceivableReport(),
        api.getAssetProfitabilityReport(),
        api.getSalesReport(),
        api.getAssets(),
        api.getOperators(),
        api.getPurchaseOrders(),
        api.getCustomers(),
        api.getInvoices(),
        api.getQuotations(),
        api.getSalesOrders(),
        api.getRentals(),
        api.getDeliveries(),
      ]);

      setFinanceData(fin);
      setArData(ar);
      setAssetProfitData(ap.assetProfitability || []);
      setSalesReportData(sales);
      setAssetsList(assetsRes.data || []);
      setOperatorsList(opsRes.data || []);
      setPurchaseOrders(poRes.data || []);
      setCustomersList(custRes.data || []);
      setInvoicesList(invRes.data || []);
      setQuotationsList(quoRes.data || []);
      setSalesOrdersList(soRes.data || []);
      setRentalsList(renRes.data || []);
      setDeliveriesList(delRes.data || []);
    } catch (err: any) {
      console.error('Error loading report datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  // Tax calculations (FAT)
  const taxCalculations = useMemo(() => {
    if (!financeData) {
      return {
        dppSales: 0,
        dppRentals: 0,
        dppTotal: 0,
        ppn11Keluaran: 0,
        pph23SewaAlat: 0,
        totalPajakBersih: 0,
      };
    }
    const { metrics } = financeData;
    const dppSales = metrics.salesRevenue;
    const dppRentals = metrics.rentalRevenue;
    const dppTotal = metrics.netInvoicedRevenue;
    const ppn11Keluaran = Math.round(dppTotal * 0.11 * 100) / 100;
    const pph23SewaAlat = Math.round(dppRentals * 0.02 * 100) / 100; // 2% witholding for heavy equipment rentals
    const totalPajakBersih = Math.round((ppn11Keluaran - pph23SewaAlat) * 100) / 100;

    return {
      dppSales,
      dppRentals,
      dppTotal,
      ppn11Keluaran,
      pph23SewaAlat,
      totalPajakBersih,
    };
  }, [financeData]);

  // Executive Calculator Live Projection Formula
  const executiveCalculations = useMemo(() => {
    if (!financeData) return null;
    const baseRevenue = financeData.metrics.netInvoicedRevenue;
    const projectedRevenue = Math.round(baseRevenue * (1 + calcTargetGrowthPercent / 100));
    const projectedOpex = Math.round(projectedRevenue * (calcOpexPercent / 100));
    const grossEbitda = projectedRevenue - projectedOpex;
    
    // Total fleet book value
    const totalFleetValue = assetsList.reduce((sum, a) => sum + (a.purchaseCost || 0), 0);
    const fleetDepreciation = Math.round(totalFleetValue * (calcDepreciationPercent / 100));
    const operationalEbit = grossEbitda - fleetDepreciation;
    const estimatedTax = Math.round(Math.max(0, operationalEbit) * (calcTaxRatePercent / 100));
    const netProfitAfterTax = operationalEbit - estimatedTax;
    const netProfitMarginPercent = projectedRevenue > 0 ? (netProfitAfterTax / projectedRevenue) * 100 : 0;
    const cashConversionRatio = projectedRevenue > 0 ? (financeData.metrics.totalCollectedPayments / baseRevenue) * 100 : 0;

    return {
      baseRevenue,
      projectedRevenue,
      projectedOpex,
      grossEbitda,
      totalFleetValue,
      fleetDepreciation,
      operationalEbit,
      estimatedTax,
      netProfitAfterTax,
      netProfitMarginPercent,
      cashConversionRatio,
    };
  }, [financeData, assetsList, calcTargetGrowthPercent, calcOpexPercent, calcDepreciationPercent, calcTaxRatePercent]);

  // Combined official documents dataset strictly scoped to the active role
  const allOfficialDocs = useMemo(() => {
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

    // Role eligibility check for Quotation & PO Client (Requirement 7)
    // Only Marketing sales, AR management, Asset Management, executive (and IT admin)
    const canSeeCommercialQuotesAndClientPo = [
      'SALES_MARKETING',
      'AR_MANAGEMENT',
      'ASSET_CONTROL',
      'EXECUTIVE',
      'ADMIN_IT',
    ].includes(userRole);

    // 1. Quotations (Surat Penawaran Harga) -> Only for eligible roles
    if (canSeeCommercialQuotesAndClientPo) {
      quotationsList.forEach((q) => {
        list.push({
          id: q.quotationNumber || q.id,
          type: 'QUOTATION',
          typeLabel: 'Surat Penawaran Harga (Quotation)',
          badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
          party: q.customerName || 'PT Client',
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
          typeLabel: 'PO dari Client (Customer Purchase Order)',
          badgeColor: 'bg-sky-100 text-sky-900 border-sky-300',
          party: so.customerName || 'PT Client Mitra Proyek',
          date: so.orderDate || so.createdAt?.slice(0, 10) || '2026-10-15',
          amount: so.grandTotal || so.totalAmount || 0,
          status: so.status === 'COMPLETED' ? 'TERPENUHI (FULFILLED)' : 'DITERIMA (CONFIRMED)',
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

      // Additional Client POs from approved quotations with client PO references
      quotationsList.forEach((q) => {
        if (q.status === 'ACCEPTED' || q.status === 'CONVERTED') {
          const clientPoId = `PO-${(q.customerName || 'CLT').replace(/[^a-zA-Z0-9]/g, '').slice(0, 7).toUpperCase()}-${q.quotationNumber?.slice(-4) || '9912'}`;
          if (!list.some((item) => item.id === clientPoId)) {
            list.push({
              id: clientPoId,
              type: 'CLIENT_PO',
              typeLabel: 'PO dari Client (Customer Purchase Order)',
              badgeColor: 'bg-sky-100 text-sky-900 border-sky-300',
              party: q.customerName || 'PT Client Mitra Proyek',
              date: q.approvalDate?.slice(0, 10) || q.date || '2026-10-10',
              amount: q.grandTotal || q.totalAmount || 0,
              status: 'DISETUJUI KLIEN',
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

    // 3. Sales Orders -> Sales Marketing & Executive / IT
    if (['SALES_MARKETING', 'EXECUTIVE', 'ADMIN_IT'].includes(userRole)) {
      salesOrdersList.forEach((so) => {
        list.push({
          id: so.orderNumber || so.id,
          type: 'SALES_ORDER',
          typeLabel: 'Surat Pesanan (Sales Order)',
          badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
          party: so.customerName || 'PT Client',
          date: so.orderDate || so.createdAt?.slice(0, 10) || '2026-10-15',
          amount: so.grandTotal || so.totalAmount || 0,
          status: so.status || 'CONFIRMED',
          raw: so,
        });
      });
    }

    // 4. Rental Contracts -> Sales, AR, Asset, Executive / IT
    if (['SALES_MARKETING', 'AR_MANAGEMENT', 'ASSET_CONTROL', 'EXECUTIVE', 'ADMIN_IT'].includes(userRole)) {
      rentalsList.forEach((rc) => {
        list.push({
          id: rc.contractNumber || rc.id,
          type: 'RENTAL',
          typeLabel: 'Perjanjian Kontrak Sewa (Rental)',
          badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
          party: rc.customerName || 'PT Client',
          date: rc.startDate || '2026-10-01',
          amount: rc.grandTotal || rc.totalAmount || 0,
          status: rc.status || 'ACTIVE',
          raw: rc,
        });
      });
    }

    // 5. Commercial Invoices -> AR, FAT, Executive / IT
    if (['AR_MANAGEMENT', 'FINANCE_ACCOUNTING_TAX', 'EXECUTIVE', 'ADMIN_IT'].includes(userRole)) {
      invoicesList.forEach((inv) => {
        list.push({
          id: inv.invoiceNumber || inv.id,
          type: 'INVOICE',
          typeLabel: 'Faktur Tagihan (Commercial Invoice)',
          badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          party: inv.customerName || 'PT Client',
          date: inv.issueDate || '2026-10-10',
          amount: inv.grandTotal || 0,
          status: inv.status || 'ISSUED',
          raw: inv,
        });
      });
    }

    // 6. PO dari Tim Procurement (Vendor PO) -> Hanya muncul di Procurement & IT audit (BUKAN PO Client)
    if (['PROCUREMENT', 'ADMIN_IT'].includes(userRole)) {
      purchaseOrders.forEach((po) => {
        list.push({
          id: po.poNumber || po.id,
          type: 'PURCHASE_ORDER',
          typeLabel: 'Surat Pesanan Pembelian (PO Tim Procurement)',
          badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300',
          party: po.vendorName || 'Supplier Mitra',
          date: po.orderDate || '2026-10-05',
          amount: po.grandTotal || po.subtotal || 0,
          status: po.status || 'ORDERED',
          raw: po,
        });
      });
    }

    // 7. Deliveries (Surat Jalan DO) -> Asset Control, Sales, Field Ops, Executive / IT
    if (['ASSET_CONTROL', 'SALES_MARKETING', 'MANAGEMENT_OPERATION', 'EXECUTIVE', 'ADMIN_IT'].includes(userRole)) {
      deliveriesList.forEach((del) => {
        list.push({
          id: del.deliveryNumber || del.id,
          type: 'DELIVERY',
          typeLabel: 'Surat Jalan (Delivery Order)',
          badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
          party: del.customerName || 'PT Client',
          date: del.deliveryDate || '2026-10-12',
          amount: 0,
          status: del.status || 'DELIVERED',
          raw: del,
        });
      });
    }

    // 8. Asset Register & Legalitas (STNK/BPKB/SIA) -> Asset Control, Field Ops, Operator, Service, Executive / IT
    if (['ASSET_CONTROL', 'MANAGEMENT_OPERATION', 'OPERATOR_USER', 'TECHNICAL_SERVICE', 'EXECUTIVE', 'ADMIN_IT'].includes(userRole)) {
      assetsList.forEach((ast) => {
        list.push({
          id: ast.assetTag || ast.id,
          type: 'ASSET',
          typeLabel: 'Register & Kelaikan Alat (SIA/STNK)',
          badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
          party: ast.name || 'Alat Berat',
          date: ast.legalDocs?.siaExpiry || '2027-01-01',
          amount: ast.purchasePrice || 0,
          status: ast.status || 'AVAILABLE',
          raw: ast,
        });
      });
    }

    // 9. Operator SIO Licenses -> Field Ops, Operator Lapangan, Executive / IT
    if (['MANAGEMENT_OPERATION', 'OPERATOR_USER', 'EXECUTIVE', 'ADMIN_IT'].includes(userRole)) {
      operatorsList.forEach((opr) => {
        list.push({
          id: opr.badgeNumber || opr.id,
          type: 'OPERATOR',
          typeLabel: 'Lisensi Operator K3 (SIO Kemenaker)',
          badgeColor: 'bg-cyan-100 text-cyan-900 border-cyan-300',
          party: opr.name || 'Operator Lapangan',
          date: opr.sioExpiry || '2027-06-30',
          amount: 0,
          status: opr.status || 'ACTIVE',
          raw: opr,
        });
      });
    }

    // 10. Work Orders Perbaikan -> Technical Service, Executive / IT
    if (['TECHNICAL_SERVICE', 'EXECUTIVE', 'ADMIN_IT'].includes(userRole)) {
      list.push(
        {
          id: 'WO-2026-0041',
          type: 'WORK_ORDER',
          typeLabel: 'Tiket Perbaikan & Work Order (WO)',
          badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
          party: 'Site Morowali - Hydraulic Service',
          date: '2026-10-14',
          amount: 3200,
          status: 'IN_PROGRESS',
          raw: {
            workOrderNumber: 'WO-2026-0041',
            assetTag: 'AST-1004',
            description: 'Penggantian seal hydraulic excavator Komatsu PC210 & oil filter flush',
            status: 'IN_PROGRESS',
            date: '2026-10-14',
            items: [
              { productName: 'Hydraulic Cylinder Seal Kit', quantity: 2, unitPrice: 850, total: 1700 },
              { productName: 'Jasa Mekanik Lapangan Senior (2 Hari)', quantity: 2, unitPrice: 750, total: 1500 },
            ],
            grandTotal: 3200,
          },
        },
        {
          id: 'WO-2026-0038',
          type: 'WORK_ORDER',
          typeLabel: 'Tiket Perbaikan & Work Order (WO)',
          badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
          party: 'Site Balikpapan - Engine Overhaul',
          date: '2026-10-09',
          amount: 5400,
          status: 'COMPLETED',
          raw: {
            workOrderNumber: 'WO-2026-0038',
            assetTag: 'AST-1002',
            description: 'Kalibrasi fuel injection pump & penggantian alternator genset CAT 1250 kVA',
            status: 'COMPLETED',
            date: '2026-10-09',
            items: [
              { productName: 'CAT Fuel Injector Set', quantity: 6, unitPrice: 650, total: 3900 },
              { productName: 'Jasa Kalibrasi Workshop Terakreditasi', quantity: 1, unitPrice: 1500, total: 1500 },
            ],
            grandTotal: 5400,
          },
        }
      );
    }

    // 11. Payments (Kuitansi Pelunasan Kas/Bank) -> AR, FAT, Executive / IT
    if (['AR_MANAGEMENT', 'FINANCE_ACCOUNTING_TAX', 'EXECUTIVE', 'ADMIN_IT'].includes(userRole)) {
      list.push(
        {
          id: 'PMT-2026-0012',
          type: 'PAYMENT',
          typeLabel: 'Kuitansi Pelunasan Piutang (Payment Receipt)',
          badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          party: 'Horizon Infrastructure & Contracting',
          date: '2026-10-14',
          amount: 83263.25,
          status: 'SETTLED',
          raw: {
            receiptNumber: 'PMT-2026-0012',
            customerName: 'Horizon Infrastructure & Contracting',
            date: '2026-10-14',
            grandTotal: 83263.25,
            method: 'BANK_TRANSFER',
            bankName: 'Mandiri Corporate Escrow',
            notes: 'Pelunasan faktur INV-2026-001 pembelian genset Atlas Power 1250 kVA',
            status: 'SETTLED',
          },
        },
        {
          id: 'PMT-2026-0015',
          type: 'PAYMENT',
          typeLabel: 'Kuitansi Pelunasan Piutang (Payment Receipt)',
          badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          party: 'PT Nusantara Mining Mandiri',
          date: '2026-10-12',
          amount: 45000,
          status: 'SETTLED',
          raw: {
            receiptNumber: 'PMT-2026-0015',
            customerName: 'PT Nusantara Mining Mandiri',
            date: '2026-10-12',
            grandTotal: 45000,
            method: 'BANK_TRANSFER',
            bankName: 'BCA Escrow',
            notes: 'Pembayaran termin sewa excavator site Morowali',
            status: 'SETTLED',
          },
        }
      );
    }

    return list;
  }, [userRole, quotationsList, salesOrdersList, rentalsList, invoicesList, purchaseOrders, deliveriesList, assetsList, operatorsList]);

  // Dynamic Excel Generator supporting all report modules
  const exportToExcel = (reportType: ReportTabType) => {
    const timestamp = new Date().toISOString().slice(0, 10);
    const tax = taxCalculations;

    let filename = `Apex_Report_${reportType}_${timestamp}.xls`;
    let tableHtml = '';

    if (reportType === 'official_docs') {
      filename = `Apex_Dokumen_Resmi_${userRole}_${timestamp}.xls`;
      tableHtml = `
        <h3>PUSAT LAPORAN DOKUMEN RESMI - ${roleDisplayNames[userRole]?.title.toUpperCase() || userRole}</h3>
        <p>Apex Industrial Solutions &amp; Equipment Corp. | Tanggal Ekspor: ${timestamp} | Otorisasi: ${roleDisplayNames[userRole]?.title} (${roleDisplayNames[userRole]?.dept})</p>
        <table border="1" cellpadding="6" cellspacing="0">
          <tr style="background-color: #0f172a; color: #ffffff;">
            <th>No. ID Dokumen</th><th>Jenis Dokumen</th><th>Customer / Vendor</th><th>Tanggal Terbit</th><th>Nilai ($)</th><th>Status</th>
          </tr>
          ${allOfficialDocs
            .map(
              (d) => `
            <tr>
              <td><strong>${d.id}</strong></td><td>${d.typeLabel}</td><td>${d.party}</td><td>${d.date}</td><td>$${(d.amount || 0).toLocaleString()}</td><td>${d.status}</td>
            </tr>`
            )
            .join('')}
        </table>
      `;
    } else if (reportType === 'executive') {
      if (!financeData || !arData) return;
      const { metrics } = financeData;
      filename = `Apex_Executive_Report_Direktur_${timestamp}.xls`;
      tableHtml = `
        <h3>LAPORAN EKSEKUTIF KEUANGAN, LABA RUGI &amp; PROYEKSI (DIREKTUR)</h3>
        <p>Apex Industrial Solutions &amp; Equipment Corp. | Tanggal Ekspor: ${timestamp} | Otorisasi: Direktur Utama</p>
        
        <h4>1. REALISASI KINERJA KEUANGAN BERJALAN</h4>
        <table border="1" cellpadding="6" cellspacing="0">
          <tr style="background-color: #0f172a; color: #ffffff;">
            <th>Indikator Keuangan</th><th>Realisasi ($)</th><th>Pertumbuhan MoM</th><th>Catatan Audit</th>
          </tr>
          <tr><td><strong>Net Invoiced Revenue</strong></td><td>$${metrics.netInvoicedRevenue.toLocaleString()}</td><td>+12.9%</td><td>Faktur Penjualan &amp; Sewa Alat</td></tr>
          <tr><td><strong>Total Arus Kas Masuk (Collected)</strong></td><td>$${metrics.totalCollectedPayments.toLocaleString()}</td><td>+11.6%</td><td>Pelunasan Kas &amp; Bank</td></tr>
          <tr><td><strong>Total Piutang Outstanding (AR)</strong></td><td>$${metrics.totalOutstandingAR.toLocaleString()}</td><td>-8.5%</td><td>Overdue: $${metrics.overdueAmount.toLocaleString()}</td></tr>
          <tr><td><strong>Utilisasi Armada Alat Berat</strong></td><td>${metrics.utilizationRate.toFixed(1)}%</td><td>+14.2%</td><td>Unit Beroperasi di Lokasi Klien</td></tr>
          <tr><td><strong>Pendapatan Penjualan Unit &amp; Parts</strong></td><td>$${metrics.salesRevenue.toLocaleString()}</td><td>+14.8%</td><td>Alat Berat &amp; Suku Cadang</td></tr>
          <tr><td><strong>Pendapatan Kontrak Rental Leasing</strong></td><td>$${metrics.rentalRevenue.toLocaleString()}</td><td>+10.5%</td><td>Sewa Armada Harian/Bulanan</td></tr>
        </table>

        <h4>2. HITUNGAN &amp; PROYEKSI LABA BERSIH EKSEKUTIF</h4>
        ${
          executiveCalculations
            ? `
        <table border="1" cellpadding="6" cellspacing="0">
          <tr style="background-color: #1e293b; color: #ffffff;">
            <th>Pos Proyeksi Eksekutif</th><th>Parameter / Nilai</th><th>Hitungan Finansial ($)</th>
          </tr>
          <tr><td>Target Pertumbuhan Pendapatan</td><td>+${calcTargetGrowthPercent}%</td><td><strong>$${executiveCalculations.projectedRevenue.toLocaleString()}</strong></td></tr>
          <tr><td>Estimasi Beban Operasional (OPEX)</td><td>${calcOpexPercent}% dari omset</td><td>-$${executiveCalculations.projectedOpex.toLocaleString()}</td></tr>
          <tr><td>Gross Operating Profit (EBITDA)</td><td>Margin ${((executiveCalculations.grossEbitda / executiveCalculations.projectedRevenue) * 100).toFixed(1)}%</td><td>$${executiveCalculations.grossEbitda.toLocaleString()}</td></tr>
          <tr><td>Penyusutan Armada Alat Berat (Depresiasi)</td><td>${calcDepreciationPercent}% per tahun</td><td>-$${executiveCalculations.fleetDepreciation.toLocaleString()}</td></tr>
          <tr><td>Laba Operasional Bersih (EBIT)</td><td>Sebelum Pajak</td><td>$${executiveCalculations.operationalEbit.toLocaleString()}</td></tr>
          <tr><td>Estimasi Pajak Bersih Terutang</td><td>Tarif efektif ${calcTaxRatePercent}%</td><td>-$${executiveCalculations.estimatedTax.toLocaleString()}</td></tr>
          <tr style="background-color: #f1f5f9;"><td><strong>ESTIMASI NET OPERATIONAL PROFIT</strong></td><td><strong>Margin: ${executiveCalculations.netProfitMarginPercent.toFixed(1)}%</strong></td><td><strong>$${executiveCalculations.netProfitAfterTax.toLocaleString()}</strong></td></tr>
        </table>
        `
            : ''
        }
      `;
    } else if (reportType === 'sales') {
      filename = `Apex_Laporan_Sales_CRM_Client_${timestamp}.xls`;
      tableHtml = `
        <h3>LAPORAN PENJUALAN KOMERSIAL &amp; CLIENT CRM</h3>
        <p>Apex Industrial Solutions | Tanggal Cetak: ${timestamp}</p>
        <table border="1" cellpadding="6" cellspacing="0">
          <tr style="background-color: #1e3a8a; color: #ffffff;">
            <th>Nama Customer / Klien</th><th>Kode Klien</th><th>Tipe Entitas</th><th>Plafon Kredit ($)</th><th>Total Tagihan ($)</th><th>Status Akun</th>
          </tr>
          ${customersList
            .map(
              (c) => `
            <tr>
              <td><strong>${c.name}</strong></td><td>${c.customerCode}</td><td>${c.type}</td>
              <td>$${c.creditLimit.toLocaleString()}</td><td>$${c.outstandingBalance.toLocaleString()}</td><td>${c.status}</td>
            </tr>`
            )
            .join('')}
        </table>
      `;
    } else if (reportType === 'asset_control') {
      filename = `Apex_Laporan_Asset_Control_Legalitas_${timestamp}.xls`;
      tableHtml = `
        <h3>LAPORAN REGISTRASI &amp; LEGALITAS DOKUMEN ALAT BERAT (ASSET CONTROL)</h3>
        <p>Apex Industrial Solutions | Monitoring STNK, BPKB, SIA Kemenaker &amp; Masa Berlaku | ${timestamp}</p>
        <table border="1" cellpadding="6" cellspacing="0">
          <tr style="background-color: #047857; color: #ffffff;">
            <th>Tag Aset</th><th>Nama Alat Berat</th><th>Kategori</th><th>Nomor STNK</th><th>Nomor BPKB</th><th>Nomor SIA (Kemenaker)</th><th>Masa Berlaku SIA</th><th>Status Dokumen</th>
          </tr>
          ${assetsList
            .map(
              (a) => `
            <tr>
              <td><strong>${a.assetTag}</strong></td><td>${a.name}</td><td>${a.category}</td>
              <td>${a.legalDocs?.stnkNumber || 'STNK-2026-REG'}</td>
              <td>${a.legalDocs?.bpkbNumber || 'BPKB-TX-4921'}</td>
              <td>${a.legalDocs?.siaNumber || 'SIA/DEP/2026/04'}</td>
              <td>${a.legalDocs?.siaExpiry || '2027-04-15'}</td>
              <td>${a.legalDocs?.documentStatus || 'VALID'}</td>
            </tr>`
            )
            .join('')}
        </table>
      `;
    } else if (reportType === 'operations') {
      filename = `Apex_Laporan_Field_Ops_Operator_SIO_${timestamp}.xls`;
      tableHtml = `
        <h3>LAPORAN OPERATOR ALAT BERAT &amp; SERTIFIKASI SIO (FIELD OPERATION)</h3>
        <p>Apex Industrial Solutions | Lisensi Kemenaker SIO Kelas 1-3 &amp; Penugasan Unit | ${timestamp}</p>
        <table border="1" cellpadding="6" cellspacing="0">
          <tr style="background-color: #0369a1; color: #ffffff;">
            <th>Nama Operator</th><th>No. Badge</th><th>Spesialisasi Alat Berat</th><th>No. Lisensi SIO</th><th>Kelas SIO</th><th>Masa Berlaku SIO</th><th>Alat Berat Ditugaskan</th><th>Status Lapangan</th>
          </tr>
          ${operatorsList
            .map(
              (op) => `
            <tr>
              <td><strong>${op.name}</strong></td><td>${op.badgeNumber}</td><td>${op.equipmentSpecialization}</td>
              <td>${op.sioNumber}</td><td>${op.sioClass}</td><td>${op.sioExpiry}</td>
              <td>${op.assignedAssetName || 'Standby Unit'}</td><td>${op.status}</td>
            </tr>`
            )
            .join('')}
        </table>
      `;
    } else if (reportType === 'procurement') {
      filename = `Apex_Laporan_Procurement_Pembelanjaan_${timestamp}.xls`;
      tableHtml = `
        <h3>LAPORAN PENGADAAN &amp; PEMBELANJAAN (PROCUREMENT)</h3>
        <p>Apex Industrial Solutions | Rekapitulasi Purchase Orders Vendor Supplier | ${timestamp}</p>
        <table border="1" cellpadding="6" cellspacing="0">
          <tr style="background-color: #6d28d9; color: #ffffff;">
            <th>No. Purchase Order</th><th>Vendor Supplier</th><th>Tanggal PO</th><th>Target Kirim</th><th>Subtotal ($)</th><th>Total Nilai PO ($)</th><th>Status Pengadaan</th>
          </tr>
          ${purchaseOrders
            .map(
              (po) => `
            <tr>
              <td><strong>${po.poNumber}</strong></td><td>${po.vendorName}</td><td>${po.orderDate}</td>
              <td>${po.expectedDeliveryDate}</td><td>$${po.subtotal.toLocaleString()}</td>
              <td><strong>$${po.grandTotal.toLocaleString()}</strong></td><td>${po.status}</td>
            </tr>`
            )
            .join('')}
        </table>
      `;
    } else if (reportType === 'fat') {
      filename = `Apex_Laporan_Perpajakan_FAT_${timestamp}.xls`;
      tableHtml = `
        <h3>LAPORAN PERHITUNGAN PAJAK &amp; RECORDING FAT</h3>
        <p>Apex Industrial Solutions | Tahun Fiskal 2026 | Dibuat: ${timestamp}</p>
        <table border="1" cellpadding="6" cellspacing="0">
          <tr style="background-color: #047857; color: #ffffff;">
            <th>Pos Perpajakan</th><th>Dasar Pengenaan Pajak (DPP)</th><th>Tarif Pajak</th><th>Jumlah Pajak ($)</th>
          </tr>
          <tr><td>PPN 11% Keluaran Penjualan Alat</td><td>$${tax.dppSales.toLocaleString()}</td><td>11.0%</td><td>$${(tax.dppSales * 0.11).toFixed(2)}</td></tr>
          <tr><td>PPN 11% Keluaran Sewa Alat Berat</td><td>$${tax.dppRentals.toLocaleString()}</td><td>11.0%</td><td>$${(tax.dppRentals * 0.11).toFixed(2)}</td></tr>
          <tr><td><strong>Total PPN 11% Keluaran</strong></td><td><strong>$${tax.dppTotal.toLocaleString()}</strong></td><td><strong>11.0%</strong></td><td><strong>$${tax.ppn11Keluaran.toLocaleString()}</strong></td></tr>
          <tr><td>PPh Pasal 23 Sewa Alat Berat (Kredit Pajak)</td><td>$${tax.dppRentals.toLocaleString()}</td><td>2.0%</td><td>-$${tax.pph23SewaAlat.toLocaleString()}</td></tr>
          <tr><td><strong>Total Setoran Pajak Bersih (PPN - PPh 23)</strong></td><td>-</td><td>-</td><td><strong>$${tax.totalPajakBersih.toLocaleString()}</strong></td></tr>
        </table>
      `;
    } else if (reportType === 'ar') {
      filename = `Apex_Laporan_Tracing_AR_Aging_${timestamp}.xls`;
      tableHtml = `
        <h3>LAPORAN TRACING PIUTANG (ACCOUNTS RECEIVABLE AGING)</h3>
        <p>Apex Industrial Solutions | Monitoring Kolektibilitas Tagihan | ${timestamp}</p>
        <table border="1" cellpadding="6" cellspacing="0">
          <tr style="background-color: #b45309; color: #ffffff;">
            <th>Kelompok Umur Piutang</th><th>Saldo Outstanding ($)</th><th>Persentase Tagihan</th><th>Tindakan Penagihan</th>
          </tr>
          <tr><td>Lancar (0 - 30 Hari)</td><td>$${agingBuckets.current.toLocaleString()}</td><td>64.2%</td><td>Invoice terkirim, sesuai jatuh tempo</td></tr>
          <tr><td>Jatuh Tempo (31 - 60 Hari)</td><td>$${agingBuckets.days31to60.toLocaleString()}</td><td>21.8%</td><td>Pengiriman reminder tagihan berkala</td></tr>
          <tr><td>Jatuh Tempo (61 - 90 Hari)</td><td>$${agingBuckets.days61to90.toLocaleString()}</td><td>8.5%</td><td>Surat Peringatan 1 (SP-1) &amp; kontak penagihan</td></tr>
          <tr><td>Macet (&gt; 90 Hari)</td><td>$${agingBuckets.over90.toLocaleString()}</td><td>5.5%</td><td>Eskalasi ke Manajemen Legal / Hold unit sewa</td></tr>
          <tr><td><strong>TOTAL PIUTANG OUTSTANDING</strong></td><td><strong>$${metrics.totalOutstandingAR.toLocaleString()}</strong></td><td><strong>100.0%</strong></td><td>Overdue: $${metrics.overdueAmount.toLocaleString()}</td></tr>
        </table>
      `;
    }

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <style>
          body { font-family: Calibri, sans-serif; font-size: 11pt; color: #0f172a; }
          table { border-collapse: collapse; width: 100%; margin-top: 12px; margin-bottom: 24px; }
          th { padding: 8px 12px; text-align: left; }
          td { padding: 6px 12px; border: 1px solid #cbd5e1; }
        </style>
      </head>
      <body>${tableHtml}</body>
      </html>
    `;

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportNotice(`Laporan Excel berhasil diunduh: ${filename}`);
    setTimeout(() => setExportNotice(null), 4000);
  };

  if (loading || !financeData || !arData) {
    return (
      <div className="bg-white border border-slate-200 rounded p-8 text-center text-slate-500 shadow-xs">
        Memuat data laporan komprehensif seluruh departemen...
      </div>
    );
  }

  const { metrics } = financeData;
  const { agingBuckets } = arData;
  const tax = taxCalculations;

  return (
    <div className="space-y-6">
      {/* Printable Corporate Letterhead Header (Appears only when printing or PDF export) */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
              Apex Industrial Solutions &amp; Equipment Corp.
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              Enterprise Asset Management, Heavy Equipment Rental &amp; Commercial Operations
            </p>
            <p className="text-[11px] text-slate-500">
              Innovation Parkway 4250, Suite 800 · NPWP: 01.883.920.1-019.000 · Telp: (021) 555-APEX
            </p>
          </div>
          <div className="text-right text-xs text-slate-700 font-mono">
            <div className="font-bold">DOKUMEN RESMI PERUSAHAAN</div>
            <div>Tanggal Cetak: {new Date().toLocaleString()}</div>
            <div>Otorisasi: {roleDisplayNames[userRole]?.title || userRole}</div>
            <div className="text-[10px] text-slate-500">
              Departemen: {roleDisplayNames[userRole]?.dept || 'EARMS Enterprise'}
            </div>
          </div>
        </div>
      </div>

      {/* Top Banner Notice with Role & Action Buttons */}
      <div className="bg-slate-900 text-white rounded-md p-4 border border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-amber-400 text-slate-900 uppercase">
              {roleDisplayNames[userRole]?.title || userRole}
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-300 font-medium">
              {roleDisplayNames[userRole]?.dept || 'Departemen EARMS'}
            </span>
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Pusat Laporan &amp; Dokumen Resmi Perusahaan
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            {roleDisplayNames[userRole]?.desc || 'Seluruh laporan dapat dicetak langsung (PDF resmi ber-kop surat) dan di-export ke format Excel (.xls).'}
          </p>
        </div>

        {/* Global Print & Excel Export Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded border border-slate-300 shadow-xs transition-colors cursor-pointer"
            title="Cetak Laporan ke Printer atau Simpan sebagai PDF"
          >
            <Printer className="w-3.5 h-3.5 text-slate-700" />
            <span>Print Report (PDF)</span>
          </button>

          <button
            onClick={() => exportToExcel(activeReportTab)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded shadow-xs transition-colors cursor-pointer"
            title="Unduh data laporan aktif ke spreadsheet Excel (.xls)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export to Excel</span>
            <Download className="w-3 h-3 text-emerald-200" />
          </button>
        </div>
      </div>

      {/* Export Toast Notification */}
      {exportNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center justify-between no-print shadow-xs">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{exportNotice}</span>
          </div>
          <button onClick={() => setExportNotice(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">
            Tutup
          </button>
        </div>
      )}

      {/* REPORT TABS NAVIGATION - Tailored specifically to the active role */}
      {availableTabs.length > 1 ? (
        <div className="flex items-center gap-1.5 border-b border-slate-200 no-print overflow-x-auto pb-1 text-xs font-medium">
          {availableTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeReportTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveReportTab(tab.id)}
                className={`py-2 px-3 rounded-t font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-white border-t-2 border-x border-slate-200 border-t-slate-900 text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
                title={tab.desc}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-500' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white border border-slate-200 rounded-md no-print text-xs shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 text-amber-400 rounded-md">
              {React.createElement(availableTabs[0].icon, { className: 'w-4 h-4' })}
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>{availableTabs[0].label}</span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Resmi Terverifikasi
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">{availableTabs[0].desc}</div>
            </div>
          </div>
          <div className="text-right text-[11px] text-slate-500 hidden md:block">
            Format: Cetak A4 / Letter Ber-Kop &amp; Export Spreadsheet Excel
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 0. PUSAT LAPORAN & DOKUMEN RESMI (OFFICIAL DOCUMENTS & QUOTATION HUB) */}
      {/* ========================================================================= */}
      {activeReportTab === 'official_docs' && (() => {
        const filteredDocs = allOfficialDocs.filter((d) => {
          if (docFilterCategory !== 'ALL' && d.type !== docFilterCategory) return false;
          if (!docSearchTerm) return true;
          const term = docSearchTerm.toLowerCase();
          return (
            d.id.toLowerCase().includes(term) ||
            d.party.toLowerCase().includes(term) ||
            d.typeLabel.toLowerCase().includes(term) ||
            d.status.toLowerCase().includes(term)
          );
        });

        // Role check for Quotation & PO Client (Requirement 7)
        const canSeeCommercialQuotesAndClientPo = [
          'SALES_MARKETING',
          'AR_MANAGEMENT',
          'ASSET_CONTROL',
          'EXECUTIVE',
          'ADMIN_IT',
        ].includes(userRole);

        const quotesInDocs = allOfficialDocs.filter((d) => d.type === 'QUOTATION');
        const totalQuotationValue = quotesInDocs.reduce((acc, q) => acc + (q.amount || 0), 0);

        const clientPosInDocs = allOfficialDocs.filter((d) => d.type === 'CLIENT_PO');
        const totalClientPoValue = clientPosInDocs.reduce((acc, d) => acc + (d.amount || 0), 0);

        const salesOrdersInDocs = allOfficialDocs.filter((d) => d.type === 'SALES_ORDER');
        const totalSalesOrderValue = salesOrdersInDocs.reduce((acc, so) => acc + (so.amount || 0), 0);

        const rentalsInDocs = allOfficialDocs.filter((d) => d.type === 'RENTAL');
        const totalRentalValue = rentalsInDocs.reduce((acc, r) => acc + (r.amount || 0), 0);

        const invoicesInDocs = allOfficialDocs.filter((d) => d.type === 'INVOICE');
        const totalInvoiceValue = invoicesInDocs.reduce((acc, inv) => acc + (inv.amount || 0), 0);

        const procurementPosInDocs = allOfficialDocs.filter((d) => d.type === 'PURCHASE_ORDER');
        const totalPOValue = procurementPosInDocs.reduce((acc, po) => acc + (po.amount || 0), 0);

        // Dynamic category filter pills scoped exclusively to documents relevant to this role
        const categoryPills: Array<{ id: string; label: string }> = [
          { id: 'ALL', label: `Semua (${allOfficialDocs.length})` },
        ];
        const counts: Record<string, number> = {};
        allOfficialDocs.forEach((d) => {
          counts[d.type] = (counts[d.type] || 0) + 1;
        });

        const labelMap: Record<string, string> = {
          QUOTATION: 'Quotation (Surat Penawaran)',
          CLIENT_PO: 'PO dari Client (Customer PO)',
          SALES_ORDER: 'Sales Orders',
          RENTAL: 'Kontrak Sewa',
          INVOICE: 'Faktur Tagihan (Invoice)',
          PURCHASE_ORDER: 'PO Tim Pengadaan (Vendor PO)',
          DELIVERY: 'Surat Jalan Delivery (DO)',
          WORK_ORDER: 'Work Orders Servis',
          PAYMENT: 'Kuitansi Pembayaran',
          ASSET: 'Register Alat (STNK/SIA)',
          OPERATOR: 'Lisensi Operator SIO',
        };

        Object.keys(counts).forEach((type) => {
          categoryPills.push({
            id: type,
            label: `${labelMap[type] || type} (${counts[type]})`,
          });
        });

        return (
          <div className="space-y-6">
            {/* Summary KPI Cards tailored to active role */}
            {canSeeCommercialQuotesAndClientPo ? (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Total Dokumen {roleDisplayNames[userRole]?.title || userRole}</span>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">{allOfficialDocs.length} Berkas</div>
                  <span className="text-[10px] text-emerald-600 font-medium">Sesuai hak akses peran</span>
                </div>

                {/* Quotations Highlight Card (Requirement 7) */}
                <div className="bg-amber-50/60 border border-amber-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-amber-800 font-bold uppercase block flex items-center gap-1">
                    <FileText className="w-3 h-3 text-amber-700" /> Quotation (Penawaran)
                  </span>
                  <div className="text-xl font-bold font-mono text-amber-950 mt-0.5">{quotesInDocs.length} Berkas</div>
                  <span className="text-[10px] text-amber-800 font-mono font-semibold">
                    ${totalQuotationValue.toLocaleString()} Nilai Proposal
                  </span>
                </div>

                {/* Client PO Card (Requirement 7: PO dari Client, BUKAN PO tim procurement) */}
                <div className="bg-sky-50/70 border border-sky-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-sky-800 font-bold uppercase block flex items-center gap-1">
                    <PackageCheck className="w-3 h-3 text-sky-700" /> PO dari Client (Customer PO)
                  </span>
                  <div className="text-xl font-bold font-mono text-sky-950 mt-0.5">{clientPosInDocs.length} Pesanan Masuk</div>
                  <span className="text-[10px] text-sky-800 font-mono font-semibold">
                    ${totalClientPoValue.toLocaleString()} Nilai Order Klien
                  </span>
                </div>

                <div className="bg-blue-50/60 border border-blue-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-blue-800 font-bold uppercase block flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-blue-700" /> Sales &amp; Kontrak Sewa
                  </span>
                  <div className="text-xl font-bold font-mono text-blue-950 mt-0.5">{salesOrdersInDocs.length + rentalsInDocs.length} Berkas</div>
                  <span className="text-[10px] text-blue-800 font-mono font-semibold">
                    ${(totalSalesOrderValue + totalRentalValue).toLocaleString()} Nilai Order
                  </span>
                </div>

                {userRole === 'ASSET_CONTROL' ? (
                  <div className="bg-teal-50/60 border border-teal-200 rounded-md p-3.5 shadow-2xs">
                    <span className="text-[10px] text-teal-800 font-bold uppercase block flex items-center gap-1">
                      <Truck className="w-3 h-3 text-teal-700" /> Register Alat &amp; DO
                    </span>
                    <div className="text-xl font-bold font-mono text-teal-950 mt-0.5">
                      {allOfficialDocs.filter((d) => d.type === 'ASSET' || d.type === 'DELIVERY').length} Unit/DO
                    </div>
                    <span className="text-[10px] text-teal-800 font-mono font-semibold">
                      Legalitas STNK/SIA Terbit
                    </span>
                  </div>
                ) : (
                  <div className="bg-emerald-50/60 border border-emerald-200 rounded-md p-3.5 shadow-2xs">
                    <span className="text-[10px] text-emerald-800 font-bold uppercase block flex items-center gap-1">
                      <Receipt className="w-3 h-3 text-emerald-700" /> Faktur Tagihan (Invoice)
                    </span>
                    <div className="text-xl font-bold font-mono text-emerald-950 mt-0.5">{invoicesInDocs.length} Faktur</div>
                    <span className="text-[10px] text-emerald-800 font-mono font-semibold">
                      ${totalInvoiceValue.toLocaleString()} Tagihan Terbit
                    </span>
                  </div>
                )}
              </div>
            ) : userRole === 'PROCUREMENT' ? (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Total Berkas Pengadaan</span>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">{allOfficialDocs.length} Berkas</div>
                  <span className="text-[10px] text-emerald-600 font-medium">Divisi Tim Procurement</span>
                </div>

                <div className="bg-indigo-50/70 border border-indigo-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-indigo-800 font-bold uppercase block flex items-center gap-1">
                    <PackageSearch className="w-3 h-3 text-indigo-700" /> PO Tim Procurement (Vendor PO)
                  </span>
                  <div className="text-xl font-bold font-mono text-indigo-950 mt-0.5">{procurementPosInDocs.length} PO Vendor</div>
                  <span className="text-[10px] text-indigo-800 font-mono font-semibold">
                    ${totalPOValue.toLocaleString()} Nilai Belanja
                  </span>
                </div>

                <div className="bg-blue-50/60 border border-blue-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-blue-800 font-bold uppercase block flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-blue-700" /> Vendor / Supplier Mitra
                  </span>
                  <div className="text-xl font-bold font-mono text-blue-950 mt-0.5">8 Rekanan</div>
                  <span className="text-[10px] text-blue-800 font-mono font-semibold">
                    Supplier Sparepart &amp; Unit
                  </span>
                </div>

                <div className="bg-amber-50/60 border border-amber-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-amber-800 font-bold uppercase block flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-700" /> Status Pengadaan
                  </span>
                  <div className="text-xl font-bold font-mono text-amber-950 mt-0.5">100% Aktif</div>
                  <span className="text-[10px] text-amber-800 font-mono font-semibold">
                    PO Vendor Terverifikasi
                  </span>
                </div>

                <div className="bg-emerald-50/60 border border-emerald-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase block flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Suku Cadang &amp; Kantor
                  </span>
                  <div className="text-xl font-bold font-mono text-emerald-950 mt-0.5">Pengadaan Terpadu</div>
                  <span className="text-[10px] text-emerald-800 font-mono font-semibold">
                    Tidak Tercampur Penjualan
                  </span>
                </div>
              </div>
            ) : userRole === 'FINANCE_ACCOUNTING_TAX' ? (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Total Dokumen FAT</span>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">{allOfficialDocs.length} Berkas</div>
                  <span className="text-[10px] text-emerald-600 font-medium">Keuangan &amp; Pajak</span>
                </div>
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase block flex items-center gap-1">
                    <Receipt className="w-3 h-3 text-emerald-700" /> Faktur Invoicing
                  </span>
                  <div className="text-xl font-bold font-mono text-emerald-950 mt-0.5">{invoicesInDocs.length} Faktur</div>
                  <span className="text-[10px] text-emerald-800 font-mono font-semibold">
                    ${totalInvoiceValue.toLocaleString()} Nilai Tagihan
                  </span>
                </div>
                <div className="bg-blue-50/60 border border-blue-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-blue-800 font-bold uppercase block flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-blue-700" /> Kuitansi Pembayaran
                  </span>
                  <div className="text-xl font-bold font-mono text-blue-950 mt-0.5">{allOfficialDocs.filter((d) => d.type === 'PAYMENT').length} Kuitansi</div>
                  <span className="text-[10px] text-blue-800 font-mono font-semibold">Kas &amp; Bank Masuk</span>
                </div>
                <div className="bg-amber-50/60 border border-amber-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-amber-800 font-bold uppercase block flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-amber-700" /> PPN 11% Keluaran
                  </span>
                  <div className="text-xl font-bold font-mono text-amber-950 mt-0.5">${(totalInvoiceValue * 0.11).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                  <span className="text-[10px] text-amber-800 font-mono font-semibold">Pajak Penjualan/Sewa</span>
                </div>
                <div className="bg-purple-50/60 border border-purple-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-purple-800 font-bold uppercase block flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-purple-700" /> Rekonsiliasi
                  </span>
                  <div className="text-xl font-bold font-mono text-purple-950 mt-0.5">100% Selesai</div>
                  <span className="text-[10px] text-purple-800 font-mono font-semibold">Audited Journal</span>
                </div>
              </div>
            ) : userRole === 'MANAGEMENT_OPERATION' ? (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Total Berkas Lapangan</span>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">{allOfficialDocs.length} Berkas</div>
                  <span className="text-[10px] text-emerald-600 font-medium">Operasional Lapangan</span>
                </div>
                <div className="bg-teal-50/60 border border-teal-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-teal-800 font-bold uppercase block flex items-center gap-1">
                    <Truck className="w-3 h-3 text-teal-700" /> Surat Jalan (DO)
                  </span>
                  <div className="text-xl font-bold font-mono text-teal-950 mt-0.5">{allOfficialDocs.filter((d) => d.type === 'DELIVERY').length} DO</div>
                  <span className="text-[10px] text-teal-800 font-mono font-semibold">Delivery &amp; Handover</span>
                </div>
                <div className="bg-cyan-50/60 border border-cyan-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-cyan-800 font-bold uppercase block flex items-center gap-1">
                    <Wrench className="w-3 h-3 text-cyan-700" /> Lisensi Operator SIO
                  </span>
                  <div className="text-xl font-bold font-mono text-cyan-950 mt-0.5">{operatorsList.length} Personel</div>
                  <span className="text-[10px] text-cyan-800 font-mono font-semibold">K3 Kemenaker Valid</span>
                </div>
                <div className="bg-amber-50/60 border border-amber-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-amber-800 font-bold uppercase block flex items-center gap-1">
                    <Boxes className="w-3 h-3 text-amber-700" /> Unit Beroperasi
                  </span>
                  <div className="text-xl font-bold font-mono text-amber-950 mt-0.5">{assetsList.length} Unit</div>
                  <span className="text-[10px] text-amber-800 font-mono font-semibold">Fleet Deployment</span>
                </div>
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase block flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Kelaikan Lapangan
                  </span>
                  <div className="text-xl font-bold font-mono text-emerald-950 mt-0.5">100% Laik</div>
                  <span className="text-[10px] text-emerald-800 font-mono font-semibold">SIA Disnaker Aktif</span>
                </div>
              </div>
            ) : userRole === 'TECHNICAL_SERVICE' ? (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Total Berkas Servis</span>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">{allOfficialDocs.length} Berkas</div>
                  <span className="text-[10px] text-emerald-600 font-medium">Technical Service</span>
                </div>
                <div className="bg-rose-50/60 border border-rose-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-rose-800 font-bold uppercase block flex items-center gap-1">
                    <Wrench className="w-3 h-3 text-rose-700" /> Work Orders (WO)
                  </span>
                  <div className="text-xl font-bold font-mono text-rose-950 mt-0.5">{allOfficialDocs.filter((d) => d.type === 'WORK_ORDER').length} Tiket</div>
                  <span className="text-[10px] text-rose-800 font-mono font-semibold">Perbaikan Mekanik</span>
                </div>
                <div className="bg-amber-50/60 border border-amber-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-amber-800 font-bold uppercase block flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-700" /> Armada Pemeliharaan
                  </span>
                  <div className="text-xl font-bold font-mono text-amber-950 mt-0.5">{assetsList.filter((a) => a.status === 'IN_MAINTENANCE').length} Unit</div>
                  <span className="text-[10px] text-amber-800 font-mono font-semibold">Sedang Dikerjakan</span>
                </div>
                <div className="bg-blue-50/60 border border-blue-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-blue-800 font-bold uppercase block flex items-center gap-1">
                    <Boxes className="w-3 h-3 text-blue-700" /> Suku Cadang Terpasang
                  </span>
                  <div className="text-xl font-bold font-mono text-blue-950 mt-0.5">OEM Parts</div>
                  <span className="text-[10px] text-blue-800 font-mono font-semibold">Komatsu &amp; CAT Genuine</span>
                </div>
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase block flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Sertifikasi Kelaikan
                  </span>
                  <div className="text-xl font-bold font-mono text-emerald-950 mt-0.5">Lulus Uji</div>
                  <span className="text-[10px] text-emerald-800 font-mono font-semibold">Kesiapan Operasi 100%</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Total Berkas Operator</span>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">{allOfficialDocs.length} Berkas</div>
                  <span className="text-[10px] text-emerald-600 font-medium">Operator Lapangan</span>
                </div>
                <div className="bg-cyan-50/60 border border-cyan-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-cyan-800 font-bold uppercase block flex items-center gap-1">
                    <Wrench className="w-3 h-3 text-cyan-700" /> Lisensi SIO
                  </span>
                  <div className="text-xl font-bold font-mono text-cyan-950 mt-0.5">{allOfficialDocs.filter((d) => d.type === 'OPERATOR').length} Lisensi</div>
                  <span className="text-[10px] text-cyan-800 font-mono font-semibold">SIO Kemenaker Valid</span>
                </div>
                <div className="bg-amber-50/60 border border-amber-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-amber-800 font-bold uppercase block flex items-center gap-1">
                    <Boxes className="w-3 h-3 text-amber-700" /> Unit Siap Kerja
                  </span>
                  <div className="text-xl font-bold font-mono text-amber-950 mt-0.5">{assetsList.length} Unit</div>
                  <span className="text-[10px] text-amber-800 font-mono font-semibold">Armada Penugasan</span>
                </div>
                <div className="bg-blue-50/60 border border-blue-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-blue-800 font-bold uppercase block flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-700" /> Jam Operasi
                  </span>
                  <div className="text-xl font-bold font-mono text-blue-950 mt-0.5">Shift Aktif</div>
                  <span className="text-[10px] text-blue-800 font-mono font-semibold">Timesheet Terverifikasi</span>
                </div>
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase block flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Standar K3
                  </span>
                  <div className="text-xl font-bold font-mono text-emerald-950 mt-0.5">Terpenuhi</div>
                  <span className="text-[10px] text-emerald-800 font-mono font-semibold">Safety Compliance</span>
                </div>
              </div>
            )}

            {/* Filter & Search Bar */}
            <div className="bg-white p-3.5 border border-slate-200 rounded-md space-y-3 shadow-2xs">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={docSearchTerm}
                    onChange={(e) => setDocSearchTerm(e.target.value)}
                    placeholder="Cari ID dokumen, nama customer, unit alat atau status..."
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded text-xs outline-none focus:border-slate-800 font-mono"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => exportToExcel('official_docs')}
                    className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Export seluruh dokumen resmi ini ke Excel"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Excel</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Cetak daftar dokumen ke PDF"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-400" />
                    <span>Print PDF</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-100 text-xs">
                <span className="text-[11px] font-semibold text-slate-500 shrink-0 mr-1 flex items-center gap-1">
                  <Filter className="w-3 h-3 text-slate-400" /> Filter Dokumen:
                </span>
                {categoryPills.map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setDocFilterCategory(pill.id)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                      docFilterCategory === pill.id
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Official Documents Table */}
            <div className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-2xs">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-700" />
                  <span>Daftar Dokumen Resmi {roleDisplayNames[userRole]?.title || userRole} ({filteredDocs.length} Arsip)</span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Wewenang: <strong>{roleDisplayNames[userRole]?.dept}</strong> · Klik nomor ID untuk membuka view data.
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-4">Nomor ID Dokumen (Klik ID)</th>
                      <th className="py-2.5 px-4">Tipe Dokumen Resmi</th>
                      <th className="py-2.5 px-4">Pelanggan / Vendor Mitra</th>
                      <th className="py-2.5 px-4">Tanggal Terbit</th>
                      <th className="py-2.5 px-4 text-right">Nilai Transaksi ($)</th>
                      <th className="py-2.5 px-4 text-center">Status Legal</th>
                      <th className="py-2.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredDocs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          Tidak ditemukan dokumen resmi sesuai kriteria pencarian "{docSearchTerm}".
                        </td>
                      </tr>
                    ) : (
                      filteredDocs.map((doc) => (
                        <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Clickable ID -> Requirement 6 */}
                          <td className="py-3 px-4 font-mono font-bold whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setPreviewModalDoc({ type: doc.type, data: doc.raw })}
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 hover:bg-indigo-50 text-indigo-700 hover:text-indigo-900 border border-slate-300 hover:border-indigo-300 transition-colors cursor-pointer"
                              title="Klik untuk membuka modal view data resmi dokumen ini"
                            >
                              <FileText className="w-3.5 h-3.5 text-indigo-600" />
                              <span className="underline">{doc.id}</span>
                            </button>
                          </td>

                          {/* Document Type Badge */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold border ${doc.badgeColor}`}>
                              {doc.typeLabel}
                            </span>
                          </td>

                          {/* Party */}
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate max-w-xs">{doc.party}</span>
                            </div>
                          </td>

                          {/* Date */}
                          <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                            {doc.date}
                          </td>

                          {/* Amount */}
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                            {doc.amount > 0 ? `$${doc.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                              {doc.status}
                            </span>
                          </td>

                          {/* Action Button */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setPreviewModalDoc({ type: doc.type, data: doc.raw })}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded shadow-2xs cursor-pointer transition-colors"
                              title="Buka View Data & Cetak Dokumen"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-600" />
                              <span>View Data</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* 1. LAPORAN EKSEKUTIF (UTAMAKAN UNTUK DIREKTUR DENGAN HITUNGAN KALKULASI) */}
      {/* ========================================================================= */}
      {activeReportTab === 'executive' && (
        <div className="space-y-6">
          {/* Executive Realized KPI Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Net Invoiced Revenue</span>
                <DollarSign className="w-4 h-4 text-slate-400" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono-numbers text-slate-900">
                ${metrics.netInvoicedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="mt-1 text-xs text-emerald-700 font-semibold font-mono-numbers">
                +12.9% MoM Revenue Growth
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Total Cash Collected</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono-numbers text-emerald-700">
                ${metrics.totalCollectedPayments.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                100% verified settlement rate
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Outstanding AR Balance</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono-numbers text-slate-900">
                ${metrics.totalOutstandingAR.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="mt-1 text-xs text-amber-700 font-medium">
                Overdue: ${metrics.overdueAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Fleet Asset Utilization</span>
                <Boxes className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono-numbers text-indigo-700">
                {metrics.utilizationRate.toFixed(1)}%
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {metrics.activeRentalsCount} unit beroperasi di klien
              </div>
            </div>
          </div>

          {/* Revenue Breakdown by Commercial Stream */}
          <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Komposisi Pendapatan Penjualan vs Sewa Alat Berat
                </h3>
                <p className="text-xs text-slate-500">
                  Perbandingan performa lini bisnis penjualan unit alat berat vs rental leasing kontrak
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
                YTD 2026 Audit
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-700 uppercase">1. Commercial Asset Sales</span>
                  <div className="text-xl font-bold font-mono-numbers text-slate-900 mt-1">
                    ${metrics.salesRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Penjualan unit alat berat, genset diesel, excavator, dan paket suku cadang pemeliharaan.
                  </p>
                </div>
                <div className="mt-3 text-xs font-medium text-emerald-700 font-mono-numbers">
                  Kontribusi: {((metrics.salesRevenue / metrics.netInvoicedRevenue) * 100).toFixed(1)}% dari total omset
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-700 uppercase">2. Equipment Rental &amp; Leasing</span>
                  <div className="text-xl font-bold font-mono-numbers text-slate-900 mt-1">
                    ${metrics.rentalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Kontrak sewa bulanan dan harian armada alat berat, excavator, crane, genset, dan forklift.
                  </p>
                </div>
                <div className="mt-3 text-xs font-medium text-emerald-700 font-mono-numbers">
                  Kontribusi: {((metrics.rentalRevenue / metrics.netInvoicedRevenue) * 100).toFixed(1)}% dari total omset
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* HITUNGAN KALKULATOR EKSEKUTIF (PROYEKSI LABA, OPEX, PENYUSUTAN, PAJAK) */}
          {/* ========================================================================= */}
          <div className="bg-white border-2 border-slate-900 rounded-md p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-slate-900 text-amber-400 rounded">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Kalkulator Eksekutif: Hitungan Laba, Biaya Operasional &amp; Proyeksi Finansial
                  </h3>
                  <p className="text-xs text-slate-500">
                    Fitur simulasi hitungan khusus Direktur untuk proyeksi laba bersih setelah beban operasional, penyusutan armada, dan pajak.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
                  Executive Suite
                </span>
              </div>
            </div>

            {/* Interactive Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded border border-slate-200 text-xs no-print">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Target Pertumbuhan Revenue (%):</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={calcTargetGrowthPercent}
                    onChange={(e) => setCalcTargetGrowthPercent(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold text-slate-900"
                  />
                  <span className="font-bold text-slate-500">%</span>
                </div>
                <span className="text-[10px] text-slate-400">Baseline MoM</span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Rasio Beban OPEX (%):</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={calcOpexPercent}
                    onChange={(e) => setCalcOpexPercent(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold text-slate-900"
                  />
                  <span className="font-bold text-slate-500">%</span>
                </div>
                <span className="text-[10px] text-slate-400">Gaji, BBM, Logistik</span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Penyusutan Armada (%/th):</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={calcDepreciationPercent}
                    onChange={(e) => setCalcDepreciationPercent(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold text-slate-900"
                  />
                  <span className="font-bold text-slate-500">%</span>
                </div>
                <span className="text-[10px] text-slate-400">Depresiasi nilai buku</span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Estimasi Tarif Pajak FAT (%):</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={calcTaxRatePercent}
                    onChange={(e) => setCalcTaxRatePercent(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold text-slate-900"
                  />
                  <span className="font-bold text-slate-500">%</span>
                </div>
                <span className="text-[10px] text-slate-400">PPN &amp; PPh Korporasi</span>
              </div>
            </div>

            {/* Calculations Breakdown Table */}
            {executiveCalculations && (
              <div className="border border-slate-200 rounded overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-4">Komponen Hitungan Eksekutif</th>
                      <th className="py-2.5 px-4">Formula / Rasio</th>
                      <th className="py-2.5 px-4 text-right">Nilai Kalkulasi ($)</th>
                      <th className="py-2.5 px-4">Analisis Manajerial</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">Proyeksi Gross Revenue</td>
                      <td className="py-2.5 px-4 font-mono">Base (${executiveCalculations.baseRevenue.toLocaleString()}) + {calcTargetGrowthPercent}%</td>
                      <td className="py-2.5 px-4 text-right font-mono-numbers font-bold text-slate-900 text-sm">
                        ${executiveCalculations.projectedRevenue.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">Target omset periode mendatang</td>
                    </tr>

                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">Beban Operasional Lapangan (OPEX)</td>
                      <td className="py-2.5 px-4 font-mono">{calcOpexPercent}% x Proyeksi Revenue</td>
                      <td className="py-2.5 px-4 text-right font-mono-numbers font-medium text-rose-600">
                        -${executiveCalculations.projectedOpex.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">Biaya suku cadang, gaji operator, mob/demob</td>
                    </tr>

                    <tr className="bg-slate-50 font-semibold">
                      <td className="py-2.5 px-4 text-slate-900">Gross Operating Profit (EBITDA)</td>
                      <td className="py-2.5 px-4 font-mono">Revenue - OPEX</td>
                      <td className="py-2.5 px-4 text-right font-mono-numbers font-bold text-emerald-800">
                        ${executiveCalculations.grossEbitda.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-emerald-700">Margin EBITDA: {((executiveCalculations.grossEbitda / executiveCalculations.projectedRevenue) * 100).toFixed(1)}%</td>
                    </tr>

                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">Beban Depresiasi Armada Alat Berat</td>
                      <td className="py-2.5 px-4 font-mono">{calcDepreciationPercent}% x Nilai Armada (${executiveCalculations.totalFleetValue.toLocaleString()})</td>
                      <td className="py-2.5 px-4 text-right font-mono-numbers text-slate-600">
                        -${executiveCalculations.fleetDepreciation.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">Alokasi amortisasi nilai buku alat berat</td>
                    </tr>

                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">Laba Operasional Sebelum Pajak (EBIT)</td>
                      <td className="py-2.5 px-4 font-mono">EBITDA - Depresiasi</td>
                      <td className="py-2.5 px-4 text-right font-mono-numbers font-bold text-slate-900">
                        ${executiveCalculations.operationalEbit.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">Basis pengenaan pajak korporasi</td>
                    </tr>

                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">Kewajiban Pajak Bersih (Tax Provision)</td>
                      <td className="py-2.5 px-4 font-mono">{calcTaxRatePercent}% x Laba Kena Pajak</td>
                      <td className="py-2.5 px-4 text-right font-mono-numbers text-rose-600 font-medium">
                        -${executiveCalculations.estimatedTax.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">Penyetoran kas negara (FAT)</td>
                    </tr>

                    <tr className="bg-emerald-50 border-t-2 border-emerald-600 font-bold">
                      <td className="py-3 px-4 text-emerald-950 text-sm">NET OPERATIONAL PROFIT (LABA BERSIH)</td>
                      <td className="py-3 px-4 font-mono text-emerald-900">EBIT - Pajak Bersih</td>
                      <td className="py-3 px-4 text-right font-mono-numbers text-emerald-900 text-base">
                        ${executiveCalculations.netProfitAfterTax.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-emerald-900">
                        Net Profit Margin: <strong>{executiveCalculations.netProfitMarginPercent.toFixed(1)}%</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Formal Sign-off Block for Printouts */}
          <div className="hidden print:grid grid-cols-3 gap-6 pt-8 text-center text-xs text-slate-800">
            <div>
              <p className="font-semibold">Dibuat Oleh:</p>
              <div className="h-16"></div>
              <p className="font-bold underline">Sarah Jenkins</p>
              <p className="text-[10px] text-slate-500">Finance &amp; Accounting Lead (FAT)</p>
            </div>
            <div>
              <p className="font-semibold">Diperiksa Oleh:</p>
              <div className="h-16"></div>
              <p className="font-bold underline">Bambang Pratama</p>
              <p className="text-[10px] text-slate-500">Asset Control &amp; Operations</p>
            </div>
            <div>
              <p className="font-semibold">Disetujui Oleh:</p>
              <div className="h-16"></div>
              <p className="font-bold underline">Marcus Sterling</p>
              <p className="text-[10px] text-slate-500">Direktur Utama (Executive Director)</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. LAPORAN PENJUALAN & CLIENT CRM (SALES & MARKETING) */}
      {/* ========================================================================= */}
      {activeReportTab === 'sales' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Rekapitulasi Penjualan Komersial &amp; Data Klien Project
                </h3>
                <p className="text-xs text-slate-500">
                  Data pelanggan korporasi, plafon kredit aktif, status pesanan penjualan, dan piutang per klien
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-blue-900 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                Total Klien: {customersList.length} Entitas
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase">
                    <th className="py-2.5 px-4">Nama Pelanggan / Perusahaan</th>
                    <th className="py-2.5 px-4">Kode &amp; NPWP/Tax ID</th>
                    <th className="py-2.5 px-4">Kontak Utama</th>
                    <th className="py-2.5 px-4 text-right">Plafon Kredit ($)</th>
                    <th className="py-2.5 px-4 text-right">Saldo Piutang ($)</th>
                    <th className="py-2.5 px-4 text-center">Status Hubungan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {customersList.map((cust) => (
                    <tr key={cust.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{cust.name}</div>
                        <div className="text-[11px] text-slate-500">{cust.type} · {cust.billingAddress?.city || 'Dallas'}, {cust.billingAddress?.state || 'TX'}</div>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <div>{cust.customerCode}</div>
                        <div className="text-[10px] text-slate-400">{cust.taxId}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div>{cust.contacts?.[0]?.name || '-'}</div>
                        <div className="text-[10px] text-slate-400">{cust.contacts?.[0]?.phone || '-'}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono-numbers">
                        ${cust.creditLimit.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-numbers font-bold text-slate-900">
                        ${cust.outstandingBalance.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          cust.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {cust.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. LAPORAN REGISTRASI & LEGALITAS ALAT BERAT (ASSET CONTROL) */}
      {/* ========================================================================= */}
      {activeReportTab === 'asset_control' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Registrasi &amp; Dokumen Kelaikan Alat Berat (STNK, BPKB, SIA)
                </h3>
                <p className="text-xs text-slate-500">
                  Pengawasan kelengkapan dokumen resmi kendaraan berat, nomor rangka/mesin, plat, dan Surat Ijin Alat (Kemenaker)
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-teal-900 bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
                {assetsList.length} Armada Terdaftar
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase">
                    <th className="py-2.5 px-4">Tag / Nama Alat Berat</th>
                    <th className="py-2.5 px-4">Kategori &amp; Lokasi</th>
                    <th className="py-2.5 px-4">Nomor STNK / BPKB</th>
                    <th className="py-2.5 px-4">Nomor SIA (Kemenaker)</th>
                    <th className="py-2.5 px-4">Masa Berlaku SIA</th>
                    <th className="py-2.5 px-4 text-center">Status Legalitas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {assetsList.map((asset) => {
                    const stnk = asset.legalDocs?.stnkNumber || 'STNK-2026-REG';
                    const bpkb = asset.legalDocs?.bpkbNumber || 'BPKB-TX-4921';
                    const sia = asset.legalDocs?.siaNumber || 'SIA/KEMENAKER/2026/04';
                    const expiry = asset.legalDocs?.siaExpiry || '2027-04-15';
                    const status = asset.legalDocs?.documentStatus || 'VALID';

                    return (
                      <tr key={asset.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => setPreviewModalDoc({ type: 'ASSET', data: asset })}
                            className="font-mono font-bold text-indigo-700 hover:text-indigo-900 underline text-left cursor-pointer flex items-center gap-1"
                            title="Klik untuk melihat dokumen kelaikan & register aset"
                          >
                            <Truck className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{asset.assetTag}</span>
                          </button>
                          <div className="text-[11px] text-slate-600 font-semibold">{asset.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">SN: {asset.serialNumber}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div>{asset.category}</div>
                          <div className="text-[10px] text-slate-400">{asset.warehouseLocation}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          <div>STNK: {stnk}</div>
                          <div className="text-slate-500">BPKB: {bpkb}</div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {sia}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">
                          {expiry}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            status === 'VALID'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}>
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. LAPORAN LAPANGAN & OPERATOR SIO (MANAGEMENT OPERATION) */}
      {/* ========================================================================= */}
      {activeReportTab === 'operations' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Operator Alat Berat &amp; Dokumen Kualifikasi SIO (Kemenaker)
                </h3>
                <p className="text-xs text-slate-500">
                  Data operator lapangan, masa berlaku Surat Ijin Operator (Kelas 1, 2, 3), dan penugasan armada proyek
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-sky-900 bg-sky-50 px-2.5 py-1 rounded border border-sky-200">
                {operatorsList.length} Operator Tersertifikasi
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase">
                    <th className="py-2.5 px-4">Nama Operator</th>
                    <th className="py-2.5 px-4">Badge / Kontak</th>
                    <th className="py-2.5 px-4">Spesialisasi Alat Berat</th>
                    <th className="py-2.5 px-4">Nomor SIO &amp; Kelas</th>
                    <th className="py-2.5 px-4">Masa Berlaku SIO</th>
                    <th className="py-2.5 px-4">Penugasan Alat Berat</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {operatorsList.map((op) => (
                    <tr key={op.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {op.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <button
                          type="button"
                          onClick={() => setPreviewModalDoc({ type: 'OPERATOR', data: op })}
                          className="font-bold text-indigo-700 hover:text-indigo-900 underline cursor-pointer text-left font-mono"
                          title="Klik untuk membuka lisensi & profil operator"
                        >
                          {op.badgeNumber}
                        </button>
                        <div className="text-slate-400 font-sans">{op.phone}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium">
                        {op.equipmentSpecialization}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900">{op.sioNumber}</div>
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-sky-50 text-sky-800 border border-sky-200">
                          {op.sioClass}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {op.sioExpiry}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{op.assignedAssetName || 'Standby Depot'}</div>
                        <div className="text-[10px] text-slate-400">{op.currentProjectLocation || 'HQ Depot'}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {op.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. LAPORAN PENGADAAN & BELANJA (PROCUREMENT) */}
      {/* ========================================================================= */}
      {activeReportTab === 'procurement' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Rekapitulasi Pembelanjaan Aset, Sparepart &amp; PO Vendor
                </h3>
                <p className="text-xs text-slate-500">
                  Daftar pembelanjaan armada baru, suku cadang pemeliharaan, serta tagihan vendor pengadaan
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-purple-900 bg-purple-50 px-2.5 py-1 rounded border border-purple-200">
                {purchaseOrders.length} PO Terbit
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase">
                    <th className="py-2.5 px-4">Nomor PO</th>
                    <th className="py-2.5 px-4">Vendor Supplier</th>
                    <th className="py-2.5 px-4">Tanggal Order</th>
                    <th className="py-2.5 px-4">Target Kirim</th>
                    <th className="py-2.5 px-4 text-right">Subtotal ($)</th>
                    <th className="py-2.5 px-4 text-right">Total PO ($)</th>
                    <th className="py-2.5 px-4 text-center">Status Pengadaan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {purchaseOrders.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <button
                          type="button"
                          onClick={() => setPreviewModalDoc({ type: 'PURCHASE_ORDER', data: po })}
                          className="inline-flex items-center gap-1 text-indigo-700 hover:text-indigo-900 underline font-mono cursor-pointer"
                          title="Klik untuk membuka rincian resmi Purchase Order vendor"
                        >
                          <FileText className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{po.poNumber}</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {po.vendorName}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {po.orderDate}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {po.expectedDeliveryDate}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-numbers">
                        ${po.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-numbers font-bold text-slate-900">
                        ${po.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          po.status === 'RECEIVED'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {po.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. LAPORAN PERPAJAKAN & FAT (PPN 11% & PPh 23) */}
      {/* ========================================================================= */}
      {activeReportTab === 'fat' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Perhitungan Perpajakan &amp; Rekapitulasi FAT
                </h3>
                <p className="text-xs text-slate-500">
                  Perhitungan Dasar Pengenaan Pajak (DPP), PPN 11% Keluaran Penjualan &amp; Sewa, serta Pemotongan PPh 23
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                Tarif PPN: 11% · PPh 23: 2%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded">
                <span className="text-xs text-slate-500 block">Total DPP (Sales &amp; Sewa)</span>
                <div className="text-xl font-bold font-mono-numbers text-slate-900 mt-1">
                  ${tax.dppTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">Dasar Pengenaan Pajak Bersih</span>
              </div>

              <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded">
                <span className="text-xs text-emerald-800 font-semibold block">PPN 11% Keluaran Terbit</span>
                <div className="text-xl font-bold font-mono-numbers text-emerald-900 mt-1">
                  ${tax.ppn11Keluaran.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[11px] text-emerald-700 mt-1 block">Faktur Pajak Standar Keluaran</span>
              </div>

              <div className="p-3.5 bg-amber-50/50 border border-amber-200 rounded">
                <span className="text-xs text-amber-800 font-semibold block">PPh 23 Sewa Alat Berat (2%)</span>
                <div className="text-xl font-bold font-mono-numbers text-amber-900 mt-1">
                  ${tax.pph23SewaAlat.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[11px] text-amber-700 mt-1 block">Bukti Potong PPh 23 Klien</span>
              </div>
            </div>

            <table className="w-full text-left text-xs border-collapse mt-4">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-4">Komponen Perpajakan (FAT)</th>
                  <th className="py-2.5 px-4 text-right">DPP ($)</th>
                  <th className="py-2.5 px-4 text-right">Tarif</th>
                  <th className="py-2.5 px-4 text-right">Pajak Terutang ($)</th>
                  <th className="py-2.5 px-4">Keterangan Administrasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-3 px-4 font-semibold">PPN Keluaran - Penjualan Unit &amp; Suku Cadang</td>
                  <td className="py-3 px-4 text-right font-mono-numbers">${tax.dppSales.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-mono-numbers">11%</td>
                  <td className="py-3 px-4 text-right font-mono-numbers font-bold text-emerald-800">
                    ${(tax.dppSales * 0.11).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-slate-500">e-Faktur Direktorat Jenderal Pajak</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold">PPN Keluaran - Sewa &amp; Leasing Alat Berat</td>
                  <td className="py-3 px-4 text-right font-mono-numbers">${tax.dppRentals.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-mono-numbers">11%</td>
                  <td className="py-3 px-4 text-right font-mono-numbers font-bold text-emerald-800">
                    ${(tax.dppRentals * 0.11).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-slate-500">Faktur Pajak Masa Sewa Berjalan</td>
                </tr>
                <tr className="bg-amber-50/30">
                  <td className="py-3 px-4 font-semibold">Potongan PPh Pasal 23 oleh Customer (Sewa Alat)</td>
                  <td className="py-3 px-4 text-right font-mono-numbers">${tax.dppRentals.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-mono-numbers">2%</td>
                  <td className="py-3 px-4 text-right font-mono-numbers font-bold text-amber-800">
                    -${tax.pph23SewaAlat.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-slate-500">Bukti Pemotongan (Bupot) Unik Klien</td>
                </tr>
                <tr className="bg-slate-50 font-bold">
                  <td className="py-3 px-4">Estimasi Kewajiban Bersih PPN yang Disetor ke Kas Negara</td>
                  <td className="py-3 px-4 text-right font-mono-numbers">-</td>
                  <td className="py-3 px-4 text-right font-mono-numbers">-</td>
                  <td className="py-3 px-4 text-right font-mono-numbers text-slate-900 text-sm">
                    ${tax.totalPajakBersih.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-slate-700">SPT Masa PPN 1111 Terpadu</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. LAPORAN TRACING PIUTANG (AR MANAGEMENT) */}
      {/* ========================================================================= */}
      {activeReportTab === 'ar' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Accounts Receivable Aging &amp; Tracing Tagihan Piutang
                </h3>
                <p className="text-xs text-slate-500">
                  Pemantauan umur piutang jatuh tempo dan status kolektibilitas penagihan invoice per bucket umur
                </p>
              </div>
              <span className="font-mono font-bold text-slate-900 text-sm">
                Total AR: ${metrics.totalOutstandingAR.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded text-xs">
                <span className="text-emerald-800 font-semibold block">Current (0–30 Hari)</span>
                <div className="text-lg font-bold font-mono-numbers text-emerald-900 mt-1">
                  ${agingBuckets.current.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[10px] text-emerald-700 mt-1 block">Lancar · Sesuai jatuh tempo</span>
              </div>

              <div className="p-3 bg-blue-50/50 border border-blue-200 rounded text-xs">
                <span className="text-blue-800 font-semibold block">31–60 Hari Past Due</span>
                <div className="text-lg font-bold font-mono-numbers text-blue-900 mt-1">
                  ${agingBuckets.days31to60.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[10px] text-blue-700 mt-1 block">Follow up reminder tagihan dikirim</span>
              </div>

              <div className="p-3 bg-amber-50/50 border border-amber-200 rounded text-xs">
                <span className="text-amber-800 font-semibold block">61–90 Hari Past Due</span>
                <div className="text-lg font-bold font-mono-numbers text-amber-900 mt-1">
                  ${agingBuckets.days61to90.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[10px] text-amber-700 mt-1 block">Surat Peringatan &amp; hold pesanan baru</span>
              </div>

              <div className="p-3 bg-rose-50/50 border border-rose-200 rounded text-xs">
                <span className="text-rose-800 font-semibold block">&gt;90 Hari Past Due</span>
                <div className="text-lg font-bold font-mono-numbers text-rose-900 mt-1">
                  ${agingBuckets.over90.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[10px] text-rose-700 mt-1 block">Eskalasi Direktur / Penagihan Khusus</span>
              </div>
            </div>

            {/* Invoices Tracing Table */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
                Daftar Faktur Tagihan Belum Lunas (Unpaid Invoices)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase">
                      <th className="py-2.5 px-4">No. Faktur</th>
                      <th className="py-2.5 px-4">Nama Pelanggan</th>
                      <th className="py-2.5 px-4">Tgl Terbit</th>
                      <th className="py-2.5 px-4">Jatuh Tempo</th>
                      <th className="py-2.5 px-4 text-right">Total Tagihan ($)</th>
                      <th className="py-2.5 px-4 text-right">Sisa Piutang ($)</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {invoicesList
                      .filter((inv) => inv.outstandingBalance > 0 && inv.status !== 'CANCELLED')
                      .map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                            <button
                              type="button"
                              onClick={() => setPreviewModalDoc({ type: 'INVOICE', data: inv })}
                              className="inline-flex items-center gap-1 text-indigo-700 hover:text-indigo-900 underline font-mono cursor-pointer"
                              title="Klik untuk membuka rincian faktur invoice resmi"
                            >
                              <FileText className="w-3.5 h-3.5 text-indigo-500" />
                              <span>{inv.invoiceNumber}</span>
                            </button>
                          </td>
                          <td className="py-2.5 px-4 font-medium text-slate-800">{inv.customerName}</td>
                          <td className="py-2.5 px-4 font-mono text-slate-500">{inv.issueDate}</td>
                          <td className="py-2.5 px-4 font-mono font-semibold text-rose-700">{inv.dueDate}</td>
                          <td className="py-2.5 px-4 text-right font-mono-numbers">
                            ${inv.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono-numbers font-bold text-slate-900">
                            ${inv.outstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Universal Document Preview Modal */}
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
