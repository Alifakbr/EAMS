import { exportExcelFromHtml } from '../utils/download.ts';
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
import { formatRupiahAmount } from '../shared/currency-format.ts';

interface ReportsViewProps {
  userRole?: UserRole;
  onNavigate?: (tab: string) => void;
}

type ReportTabType = 'official_docs' | 'executive' | 'sales' | 'asset_control' | 'operations' | 'procurement' | 'fat' | 'ar';

export const ReportsView: React.FC<ReportsViewProps> = ({ userRole = 'EXECUTIVE', onNavigate }) => {
  const formatRupiah = formatRupiahAmount;
  const roleDisplayNames: Record<UserRole, { title: string; dept: string; desc: string }> = {
    EXECUTIVE: {
      title: 'Executive (Chief Executive Officer)',
      dept: 'Board of Directors & Executive Management',
      desc: 'Access all commercial, operational, and financial reports, including profit and loss calculations and official PDF/Excel exports.',
    },
    ADMIN_IT: {
      title: 'IT Administrator',
      dept: 'Information Technology & Systems',
      desc: 'Full access to audit all company department report modules and reconcile data.',
    },
    SALES_MARKETING: {
      title: 'Sales & Marketing',
      dept: 'Commercial & Customer Relationship Management',
      desc: 'Reports on client portfolios, customer projects, credit limits, and sales and rental contract realization.',
    },
    ASSET_CONTROL: {
      title: 'Asset Control (Asset Management)',
      dept: 'Asset Control & Compliance',
      desc: 'Reports on asset registration, operational fitness, vehicle identification, and registration, ownership, and safety certificates.',
    },
    MANAGEMENT_OPERATION: {
      title: 'Operations Management (Field Operations)',
      dept: 'Field Operations & Operators',
      desc: 'Reports on operator safety license qualifications, registered heavy equipment assignments, and daily field status logs.',
    },
    PROCUREMENT: {
      title: 'Procurement',
      dept: 'Procurement & Purchasing',
      desc: 'Reports on purchase orders, heavy equipment procurement, spare parts, and office operating expenses.',
    },
    FINANCE_ACCOUNTING_TAX: {
      title: 'Finance, Accounting & Tax (FAT)',
      dept: 'Finance, Accounting & Tax',
      desc: 'Reports on cash and bank transactions, invoice journals, and official VAT and equipment rental withholding tax calculations.',
    },
    AR_MANAGEMENT: {
      title: 'AR Management (Accounts Receivable)',
      dept: 'Billing & Receivables Management',
      desc: 'Reports on customer billing, receivables aging analysis, and overdue receivables monitoring.',
    },
    OPERATOR_USER: {
      title: 'Operator / Field User',
      dept: 'Heavy Equipment Operators',
      desc: 'Reports on barcode attendance scans and field equipment condition inspections.',
    },
    TECHNICAL_SERVICE: {
      title: 'Technical Service & Mechanical Workshop',
      dept: 'Maintenance & Field Workshop',
      desc: 'Reports on repairs, parts and service replacements, equipment downtime, and roadworthiness certifications.',
    },
    MANAGER: {
      title: 'Manager',
      dept: 'Management',
      desc: 'Approve submissions and view data and contracts.',
    },
  };

  // Permitted report modules tailored to each role
  // Permitted report modules tailored strictly to each role's dashboard purview
  const roleAllowedReportTabs: Record<UserRole, { id: ReportTabType; label: string; icon: any; desc: string }[]> = {
    // 1. Executive: Access to all company executive and commercial reports
    EXECUTIVE: [
      { id: 'official_docs', label: '1. Official Commercial Documents (Quotations & Customer POs)', icon: FileCheck, desc: 'Official archive of quotations, customer POs, sales orders, rental contracts, and invoices' },
      { id: 'executive', label: '2. Executive & Profit Analysis', icon: TrendingUp, desc: 'Profit and loss, EBIT/EBITDA, cash flow, and executive financial projections' },
      { id: 'sales', label: '3. Sales & Customer CRM', icon: Users, desc: 'Customer portfolio, credit limits, realized sales, and rental contracts' },
      { id: 'asset_control', label: '4. Equipment Legal Documents (STNK/SIA)', icon: Truck, desc: 'STNK and BPKB expiry dates and SIA compliance certification' },
      { id: 'operations', label: '5. Operators & SIO Certifications', icon: Wrench, desc: 'K3 operator certifications, equipment assignments, and field utilization' },
      { id: 'procurement', label: '6. Procurement & Purchasing', icon: PackageSearch, desc: 'Vendor purchase orders, new equipment, spare parts, and office supplies' },
      { id: 'fat', label: '7. Finance, Accounting & Tax', icon: Receipt, desc: '11% VAT and 23% withholding tax on equipment rentals, plus invoicing' },
      { id: 'ar', label: '8. AR Tracking & Receivables Aging', icon: BarChart3, desc: 'Receivables aging analysis and open invoice tracking' },
    ],
    // 2. IT Administrator: All system reports for audit and data validation
    ADMIN_IT: [
      { id: 'official_docs', label: '1. Official Documents & Commercial Audit', icon: FileCheck, desc: 'Audit quotations, customer POs, sales orders, rental contracts, invoices, deliveries, and vendor POs' },
      { id: 'executive', label: '2. Executive & Profit Analysis', icon: TrendingUp, desc: 'Financial overview and executive projections' },
      { id: 'sales', label: '3. Sales & Customer CRM', icon: Users, desc: 'Sales CRM and commercial contract data' },
      { id: 'asset_control', label: '4. Equipment Legal Documents (STNK/SIA)', icon: Truck, desc: 'Heavy equipment legal and safety documents' },
      { id: 'operations', label: '5. Operators & SIO Certifications', icon: Wrench, desc: 'Operator SIO credentials and deployment' },
      { id: 'procurement', label: '6. Procurement & Purchasing', icon: PackageSearch, desc: 'Procurement POs and vendor spending' },
      { id: 'fat', label: '7. Finance, Accounting & Tax', icon: Receipt, desc: 'Tax calculations, 11% VAT, and 23% withholding tax' },
      { id: 'ar', label: '8. AR Tracking & Receivables Aging', icon: BarChart3, desc: 'AR tracking and receivables aging records' },
    ],
    // 3. Sales & Marketing: Hanya Quotation, PO Client, Sales Order, CRM Klien
    SALES_MARKETING: [
      { id: 'official_docs', label: '1. Official Sales Documents, Quotations & Customer POs', icon: FileCheck, desc: 'Quotations, customer purchase orders, sales orders, and rental contracts' },
      { id: 'sales', label: '2. Sales, Projects & Customer CRM', icon: Users, desc: 'Customer project portfolio, credit limits, realized sales, and rental contract pipeline' },
    ],
    // 4. Asset Control: asset legal documents, delivery orders, customer POs, and equipment quotations
    ASSET_CONTROL: [
      { id: 'official_docs', label: '1. Equipment, Delivery & Customer PO Documents', icon: FileCheck, desc: 'Equipment legal documents and register, delivery orders, customer POs, and equipment quotations' },
      { id: 'asset_control', label: '2. Equipment Legal Documents (STNK/BPKB/SIA)', icon: Truck, desc: 'Central asset register, STNK and BPKB expiry, and SIA certification' },
    ],
    // 5. Management Operations: field operations documents and operator SIO
    MANAGEMENT_OPERATION: [
      { id: 'official_docs', label: '1. Operations & Field Delivery Documents', icon: FileCheck, desc: 'Delivery orders, operator SIO qualifications, and field equipment compliance' },
      { id: 'operations', label: '2. Operator & SIO Qualification Reports', icon: Wrench, desc: 'Operator directory, K3 SIO certification (Classes 1/2/3), expiry dates, and equipment utilization' },
    ],
    // 6. Procurement: asset, spare parts, and office purchases (procurement POs, not customer POs)
    PROCUREMENT: [
      { id: 'official_docs', label: '1. Procurement Documents (Internal Vendor POs)', icon: FileCheck, desc: 'Procurement purchase orders to partner vendors (not customer POs) and vendor bills' },
      { id: 'procurement', label: '2. Procurement, Asset Purchasing & Vendor PO Reports', icon: PackageSearch, desc: 'Procurement POs, new equipment purchases, spare parts, and office supplies' },
    ],
    // 7. Finance Accounting & Tax (FAT): invoicing, PPN/PPh tax calculations, cash, and banking
    FINANCE_ACCOUNTING_TAX: [
      { id: 'official_docs', label: '1. Invoices & Tax Documents', icon: FileCheck, desc: 'Commercial invoices, 11% VAT / 23% withholding tax invoices, and payment receipts' },
      { id: 'fat', label: '2. Accounting, Invoicing & Tax Reports', icon: Receipt, desc: 'Invoice summaries, cash settlements, and official 11% VAT / 23% withholding tax calculations' },
    ],
    // 8. AR Management: receivables tracking, customer PO verification, and aging monitoring
    AR_MANAGEMENT: [
      { id: 'official_docs', label: '1. Receivables, Customer PO & Quotation Documents', icon: FileCheck, desc: 'Invoices, customer POs (billing references), supporting quotations, and AR payment receipts' },
      { id: 'ar', label: '2. Receivables Tracking & Aging Reports', icon: BarChart3, desc: 'Invoice status, aging buckets (Current, 30, 60, 90+ days), and overdue monitoring' },
    ],
    // 9. Field Operator: attendance logs and equipment inspection status
    OPERATOR_USER: [
      { id: 'official_docs', label: '1. Assignment & SIO License Documents', icon: FileCheck, desc: 'SIO certifications and assigned equipment register' },
      { id: 'operations', label: '2. Equipment Status & Daily Inspection Reports', icon: Wrench, desc: 'Barcode attendance logs and field equipment inspection results' },
    ],
    // 10. Technical Service: equipment service and maintenance
    TECHNICAL_SERVICE: [
      { id: 'official_docs', label: '1. Service Documents & Work Order Tickets', icon: FileCheck, desc: 'Mechanical repair work orders and equipment roadworthiness certificates' },
      { id: 'operations', label: '2. Service, Repair & Spare Parts Reports', icon: Wrench, desc: 'Work order summaries, spare parts usage, downtime, and roadworthiness certification' },
      { id: 'asset_control', label: '3. Heavy Equipment Fleet Compliance', icon: Truck, desc: 'Current equipment condition and Equipment Permit (SIA) expiry dates' },
    ],
    MANAGER: [],
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
      ] = (await Promise.allSettled([
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
      ])).map((r) => (r.status === 'fulfilled' ? (r.value as any) : null));
      // Treat data unavailable to this role (403) as empty rather than failing all reports.
      const empty = { data: [] as any[] };

      setFinanceData(fin);
      setArData(ar);
      setAssetProfitData(ap?.assetProfitability || []);
      setSalesReportData(sales);
      setAssetsList((assetsRes || empty).data || []);
      setOperatorsList((opsRes || empty).data || []);
      setPurchaseOrders((poRes || empty).data || []);
      setCustomersList((custRes || empty).data || []);
      setInvoicesList((invRes || empty).data || []);
      setQuotationsList((quoRes || empty).data || []);
      setSalesOrdersList((soRes || empty).data || []);
      setRentalsList((renRes || empty).data || []);
      setDeliveriesList((delRes || empty).data || []);
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

    // 1. Quotations -> Only for eligible roles
    if (canSeeCommercialQuotesAndClientPo) {
      quotationsList.forEach((q) => {
        list.push({
          id: q.quotationNumber || q.id,
          type: 'QUOTATION',
          typeLabel: 'Commercial Quotation',
          badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
          party: q.customerName || 'PT Client',
          date: q.date || q.issueDate || q.createdAt?.slice(0, 10) || '2026-10-15',
          amount: q.grandTotal || q.totalAmount || q.subtotal || 0,
          status: q.status || 'SENT',
          raw: q,
        });
      });
    }

    // 2. Customer Purchase Orders -> official customer orders, not procurement POs
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

      // Additional Client POs from approved quotations with client PO references
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

    // 3. Sales Orders -> Sales Marketing & Executive / IT
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

    // 4. Rental Contracts -> Sales, AR, Asset, Executive / IT
    if (['SALES_MARKETING', 'AR_MANAGEMENT', 'ASSET_CONTROL', 'EXECUTIVE', 'ADMIN_IT'].includes(userRole)) {
      rentalsList.forEach((rc) => {
        list.push({
          id: rc.contractNumber || rc.id,
          type: 'RENTAL',
          typeLabel: 'Rental Agreement',
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
          typeLabel: 'Commercial Invoice',
          badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          party: inv.customerName || 'PT Client',
          date: inv.issueDate || '2026-10-10',
          amount: inv.grandTotal || 0,
          status: inv.status || 'ISSUED',
          raw: inv,
        });
      });
    }

    // 6. Procurement POs (Vendor POs) -> Only for Procurement and IT audit, not customer POs
    if (['PROCUREMENT', 'ADMIN_IT'].includes(userRole)) {
      purchaseOrders.forEach((po) => {
        list.push({
          id: po.poNumber || po.id,
          type: 'PURCHASE_ORDER',
          typeLabel: 'Vendor Purchase Order',
          badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300',
          party: po.vendorName || 'Partner Supplier',
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

    // 8. Asset Register & Legalitas (STNK/BPKB/SIA) -> Asset Control, Field Ops, Operator, Service, Executive / IT
    if (['ASSET_CONTROL', 'MANAGEMENT_OPERATION', 'OPERATOR_USER', 'TECHNICAL_SERVICE', 'EXECUTIVE', 'ADMIN_IT'].includes(userRole)) {
      assetsList.forEach((ast) => {
        list.push({
          id: ast.assetTag || ast.id,
          type: 'ASSET',
          typeLabel: 'Equipment Register & Compliance',
          badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
          party: ast.name || 'Heavy Equipment',
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
          typeLabel: 'Operator Safety License',
          badgeColor: 'bg-cyan-100 text-cyan-900 border-cyan-300',
          party: opr.name || 'Field Operator',
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
          typeLabel: 'Maintenance Work Order',
          badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
          party: 'Site Morowali - Hydraulic Service',
          date: '2026-10-14',
          amount: 3200,
          status: 'IN_PROGRESS',
          raw: {
            workOrderNumber: 'WO-2026-0041',
            assetTag: 'AST-1004',
            description: 'Replace hydraulic excavator Komatsu PC210 seal and flush oil filter',
            status: 'IN_PROGRESS',
            date: '2026-10-14',
            items: [
              { productName: 'Hydraulic Cylinder Seal Kit', quantity: 2, unitPrice: 850, total: 1700 },
              { productName: 'Senior Field Mechanic Service (2 Days)', quantity: 2, unitPrice: 750, total: 1500 },
            ],
            grandTotal: 3200,
          },
        },
        {
          id: 'WO-2026-0038',
          type: 'WORK_ORDER',
          typeLabel: 'Maintenance Work Order',
          badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
          party: 'Site Balikpapan - Engine Overhaul',
          date: '2026-10-09',
          amount: 5400,
          status: 'COMPLETED',
          raw: {
            workOrderNumber: 'WO-2026-0038',
            assetTag: 'AST-1002',
            description: 'Calibrate fuel injection pump and replace CAT 1250 kVA generator alternator',
            status: 'COMPLETED',
            date: '2026-10-09',
            items: [
              { productName: 'CAT Fuel Injector Set', quantity: 6, unitPrice: 650, total: 3900 },
              { productName: 'Accredited Workshop Calibration Service', quantity: 1, unitPrice: 1500, total: 1500 },
            ],
            grandTotal: 5400,
          },
        }
      );
    }

    // 11. Payments (cash/bank settlement receipts) -> AR, FAT, Executive / IT
    if (['AR_MANAGEMENT', 'FINANCE_ACCOUNTING_TAX', 'EXECUTIVE', 'ADMIN_IT'].includes(userRole)) {
      list.push(
        {
          id: 'PMT-2026-0012',
          type: 'PAYMENT',
          typeLabel: 'Payment Receipt',
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
            notes: 'Settlement of invoice INV-2026-001 for Atlas Power 1250 kVA generator purchase',
            status: 'SETTLED',
          },
        },
        {
          id: 'PMT-2026-0015',
          type: 'PAYMENT',
          typeLabel: 'Payment Receipt',
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
            notes: 'Rental payment installment for excavator at Morowali site',
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
      filename = `Apex_Official_Documents_${userRole}_${timestamp}.xls`;
      tableHtml = `
        <h3>OFFICIAL DOCUMENTS REPORT - ${roleDisplayNames[userRole]?.title.toUpperCase() || userRole}</h3>
        <p>Apex Industrial Solutions &amp; Equipment Corp. | Export Date: ${timestamp} | Authorized Role: ${roleDisplayNames[userRole]?.title} (${roleDisplayNames[userRole]?.dept})</p>
        <table border="1" cellpadding="6" cellspacing="0">
          <tr style="background-color: #0f172a; color: #ffffff;">
            <th>Document ID</th><th>Document Type</th><th>Customer / Vendor</th><th>Issue Date</th><th>Amount (IDR)</th><th>Status</th>
          </tr>
          ${allOfficialDocs
            .map(
              (d) => `
            <tr>
              <td><strong>${d.id}</strong></td><td>${d.typeLabel}</td><td>${d.party}</td><td>${d.date}</td><td>${formatRupiah(d.amount || 0)}</td><td>${d.status}</td>
            </tr>`
            )
            .join('')}
        </table>
      `;
    } else if (reportType === 'executive') {
      if (!financeData || !arData) return;
      const { metrics } = financeData;
      filename = `Apex_Executive_Report_${timestamp}.xls`;
      tableHtml = `
        <h3>EXECUTIVE FINANCIAL, PROFIT &amp; LOSS, AND PROJECTION REPORT</h3>
        <p>Apex Industrial Solutions &amp; Equipment Corp. | Export Date: ${timestamp} | Authorized Role: Executive</p>
        
        <h4>1. CURRENT FINANCIAL PERFORMANCE</h4>
        <table border="1" cellpadding="6" cellspacing="0">
          <tr style="background-color: #0f172a; color: #ffffff;">
            <th>Financial Indicator</th><th>Actual (IDR)</th><th>MoM Growth</th><th>Audit Notes</th>
          </tr>
          <tr><td><strong>Net Invoiced Revenue</strong></td><td>${formatRupiah(metrics.netInvoicedRevenue)}</td><td>+12.9%</td><td>Sales and rental invoices</td></tr>
          <tr><td><strong>Total Cash Collected</strong></td><td>${formatRupiah(metrics.totalCollectedPayments)}</td><td>+11.6%</td><td>Cash and bank settlements</td></tr>
          <tr><td><strong>Total Outstanding Receivables (AR)</strong></td><td>${formatRupiah(metrics.totalOutstandingAR)}</td><td>-8.5%</td><td>Overdue: ${formatRupiah(metrics.overdueAmount)}</td></tr>
          <tr><td><strong>Heavy Equipment Fleet Utilization</strong></td><td>${metrics.utilizationRate.toFixed(1)}%</td><td>+14.2%</td><td>Units operating at customer sites</td></tr>
          <tr><td><strong>Equipment and Parts Sales Revenue</strong></td><td>${formatRupiah(metrics.salesRevenue)}</td><td>+14.8%</td><td>Heavy equipment and spare parts</td></tr>
          <tr><td><strong>Equipment Rental Revenue</strong></td><td>${formatRupiah(metrics.rentalRevenue)}</td><td>+10.5%</td><td>Daily and monthly fleet rentals</td></tr>
        </table>

        <h4>2. EXECUTIVE NET PROFIT ANALYSIS &amp; PROJECTION</h4>
        ${
          executiveCalculations
            ? `
        <table border="1" cellpadding="6" cellspacing="0">
          <tr style="background-color: #1e293b; color: #ffffff;">
            <th>Executive Projection</th><th>Parameter / Value</th><th>Financial Amount (IDR)</th>
          </tr>
          <tr><td>Target Revenue Growth</td><td>+${calcTargetGrowthPercent}%</td><td><strong>${formatRupiah(executiveCalculations.projectedRevenue)}</strong></td></tr>
          <tr><td>Estimated Operating Expenses (OPEX)</td><td>${calcOpexPercent}% of revenue</td><td>- ${formatRupiah(executiveCalculations.projectedOpex)}</td></tr>
          <tr><td>Gross Operating Profit (EBITDA)</td><td>Margin ${((executiveCalculations.grossEbitda / executiveCalculations.projectedRevenue) * 100).toFixed(1)}%</td><td>${formatRupiah(executiveCalculations.grossEbitda)}</td></tr>
          <tr><td>Fleet Depreciation</td><td>${calcDepreciationPercent}% per year</td><td>- ${formatRupiah(executiveCalculations.fleetDepreciation)}</td></tr>
          <tr><td>Net Operating Profit (EBIT)</td><td>Before tax</td><td>${formatRupiah(executiveCalculations.operationalEbit)}</td></tr>
          <tr><td>Estimated Net Tax Due</td><td>Effective rate ${calcTaxRatePercent}%</td><td>- ${formatRupiah(executiveCalculations.estimatedTax)}</td></tr>
          <tr style="background-color: #f1f5f9;"><td><strong>ESTIMATED NET OPERATING PROFIT</strong></td><td><strong>Margin: ${executiveCalculations.netProfitMarginPercent.toFixed(1)}%</strong></td><td><strong>${formatRupiah(executiveCalculations.netProfitAfterTax)}</strong></td></tr>
        </table>
        `
            : ''
        }
      `;
    } else if (reportType === 'sales') {
      filename = `Apex_Sales_Customer_CRM_Report_${timestamp}.xls`;
      tableHtml = `
        <h3>COMMERCIAL SALES &amp; CUSTOMER CRM REPORT</h3>
        <p>Apex Industrial Solutions | Print Date: ${timestamp}</p>
        <table border="1" cellpadding="6" cellspacing="0">
          <tr style="background-color: #1e3a8a; color: #ffffff;">
            <th>Customer Name</th><th>Customer Code</th><th>Entity Type</th><th>Credit Limit (IDR)</th><th>Outstanding Balance (IDR)</th><th>Account Status</th>
          </tr>
          ${customersList
            .map(
              (c) => `
            <tr>
              <td><strong>${c.name}</strong></td><td>${c.customerCode}</td><td>${c.type}</td>
              <td>${formatRupiah(c.creditLimit)}</td><td>${formatRupiah(c.outstandingBalance)}</td><td>${c.status}</td>
            </tr>`
            )
            .join('')}
        </table>
      `;
    } else if (reportType === 'asset_control') {
      filename = `Apex_Asset_Control_Legal_Compliance_${timestamp}.xls`;
      tableHtml = `
        <h3>HEAVY EQUIPMENT REGISTRATION &amp; LEGAL DOCUMENT REPORT (ASSET CONTROL)</h3>
        <p>Apex Industrial Solutions | STNK, BPKB, SIA and Expiry Monitoring | ${timestamp}</p>
        <table border="1" cellpadding="6" cellspacing="0">
          <tr style="background-color: #047857; color: #ffffff;">
            <th>Asset Tag</th><th>Equipment Name</th><th>Category</th><th>STNK Number</th><th>BPKB Number</th><th>SIA Number</th><th>SIA Expiry</th><th>Document Status</th>
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
      filename = `Apex_Field_Operations_Operator_SIO_Report_${timestamp}.xls`;
      tableHtml = `
        <h3>HEAVY EQUIPMENT OPERATORS &amp; SIO CERTIFICATION REPORT (FIELD OPERATIONS)</h3>
        <p>Apex Industrial Solutions | SIO Classes 1-3 &amp; Equipment Assignments | ${timestamp}</p>
        <table border="1" cellpadding="6" cellspacing="0">
          <tr style="background-color: #0369a1; color: #ffffff;">
            <th>Operator Name</th><th>Badge ID</th><th>Equipment Specialization</th><th>SIO License Number</th><th>SIO Class</th><th>SIO Expiry</th><th>Assigned Equipment</th><th>Field Status</th>
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
      filename = `Apex_Procurement_Purchasing_Report_${timestamp}.xls`;
      tableHtml = `
        <h3>PROCUREMENT &amp; PURCHASING REPORT</h3>
        <p>Apex Industrial Solutions | Vendor Purchase Order Summary | ${timestamp}</p>
        <table border="1" cellpadding="6" cellspacing="0">
          <tr style="background-color: #6d28d9; color: #ffffff;">
            <th>Purchase Order No.</th><th>Vendor</th><th>Order Date</th><th>Expected Delivery</th><th>Subtotal (IDR)</th><th>Total PO (IDR)</th><th>Procurement Status</th>
          </tr>
          ${purchaseOrders
            .map(
              (po) => `
            <tr>
              <td><strong>${po.poNumber}</strong></td><td>${po.vendorName}</td><td>${po.orderDate}</td>
              <td>${po.expectedDeliveryDate}</td><td>${formatRupiah(po.subtotal)}</td>
              <td><strong>${formatRupiah(po.grandTotal)}</strong></td><td>${po.status}</td>
            </tr>`
            )
            .join('')}
        </table>
      `;
    } else if (reportType === 'fat') {
      filename = `Apex_Finance_Accounting_Tax_Report_${timestamp}.xls`;
      tableHtml = `
        <h3>TAX CALCULATION &amp; FINANCIAL RECORDS REPORT</h3>
        <p>Apex Industrial Solutions | Fiscal Year 2026 | Generated: ${timestamp}</p>
        <table border="1" cellpadding="6" cellspacing="0">
          <tr style="background-color: #047857; color: #ffffff;">
            <th>Tax Component</th><th>Taxable Base (IDR)</th><th>Tax Rate</th><th>Tax Due (IDR)</th>
          </tr>
          <tr><td>Output VAT - Equipment Sales</td><td>${formatRupiah(tax.dppSales)}</td><td>11.0%</td><td>${formatRupiah(tax.dppSales * 0.11)}</td></tr>
          <tr><td>Output VAT - Equipment Rentals</td><td>${formatRupiah(tax.dppRentals)}</td><td>11.0%</td><td>${formatRupiah(tax.dppRentals * 0.11)}</td></tr>
          <tr><td><strong>Total Output VAT</strong></td><td><strong>${formatRupiah(tax.dppTotal)}</strong></td><td><strong>11.0%</strong></td><td><strong>${formatRupiah(tax.ppn11Keluaran)}</strong></td></tr>
          <tr><td>Equipment Rental Withholding Tax (2%)</td><td>${formatRupiah(tax.dppRentals)}</td><td>2.0%</td><td>- ${formatRupiah(tax.pph23SewaAlat)}</td></tr>
          <tr><td><strong>Total Net Tax Payment (VAT - Withholding)</strong></td><td>-</td><td>-</td><td><strong>${formatRupiah(tax.totalPajakBersih)}</strong></td></tr>
        </table>
      `;
    } else if (reportType === 'ar') {
      filename = `Apex_AR_Receivables_Aging_Report_${timestamp}.xls`;
      tableHtml = `
        <h3>ACCOUNTS RECEIVABLE AGING REPORT</h3>
        <p>Apex Industrial Solutions | Receivables Collection Monitoring | ${timestamp}</p>
        <table border="1" cellpadding="6" cellspacing="0">
          <tr style="background-color: #b45309; color: #ffffff;">
            <th>Receivable Aging</th><th>Outstanding Balance (IDR)</th><th>Invoice Share</th><th>Collection Action</th>
          </tr>
          <tr><td>Current (0 - 30 Days)</td><td>${formatRupiah(agingBuckets.current)}</td><td>64.2%</td><td>Invoices within payment terms</td></tr>
          <tr><td>Overdue (31 - 60 Days)</td><td>${formatRupiah(agingBuckets.days31to60)}</td><td>21.8%</td><td>Scheduled payment reminders</td></tr>
          <tr><td>Overdue (61 - 90 Days)</td><td>${formatRupiah(agingBuckets.days61to90)}</td><td>8.5%</td><td>Collection escalation and follow-up</td></tr>
          <tr><td>Over 90 Days</td><td>${formatRupiah(agingBuckets.over90)}</td><td>5.5%</td><td>Legal escalation / rental hold</td></tr>
          <tr><td><strong>TOTAL OUTSTANDING RECEIVABLES</strong></td><td><strong>${formatRupiah(metrics.totalOutstandingAR)}</strong></td><td><strong>100.0%</strong></td><td>Overdue: ${formatRupiah(metrics.overdueAmount)}</td></tr>
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

    exportExcelFromHtml(excelTemplate, filename);

    setExportNotice(`Excel report downloaded successfully: ${filename}`);
    setTimeout(() => setExportNotice(null), 4000);
  };

  if (loading || !financeData || !arData) {
    return (
      <div className="bg-white border border-slate-200 rounded p-8 text-center text-slate-500 shadow-xs">
        Loading comprehensive reports for all departments...
      </div>
    );
  }

  const { metrics } = financeData;
  const { agingBuckets } = arData;
  const tax = taxCalculations;

  return (
    <div data-print-area className="reports-print-area space-y-6">
      {/* Printable Corporate Letterhead Header (Appears only when printing or PDF export) */}
      <div className="reports-print-letterhead hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
              Apex Industrial Solutions &amp; Equipment Corp.
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              Enterprise Asset Management, Heavy Equipment Rental &amp; Commercial Operations
            </p>
            <p className="text-[11px] text-slate-500">
              Innovation Parkway 4250, Suite 800 · Tax ID: 01.883.920.1-019.000 · Phone: (021) 555-APEX
            </p>
          </div>
          <div className="text-right text-xs text-slate-700 font-mono">
            <div className="font-bold">OFFICIAL COMPANY DOCUMENT</div>
            <div>Printed: {new Date().toLocaleString('en-US')}</div>
            <div>Authorized Role: {roleDisplayNames[userRole]?.title || userRole}</div>
            <div className="text-[10px] text-slate-500">
              Department: {roleDisplayNames[userRole]?.dept || 'EARMS Enterprise'}
            </div>
          </div>
        </div>
      </div>
      <div className="report-print-title hidden print:block">
        <h2>{availableTabs.find((tab) => tab.id === activeReportTab)?.label || 'Company Reports'}</h2>
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
              {roleDisplayNames[userRole]?.dept || 'EAMS Department'}
            </span>
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Company Reports &amp; Official Documents
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            {roleDisplayNames[userRole]?.desc || 'All reports can be printed or exported to Excel (.xls).'}
          </p>
        </div>

        {/* Global Print & Excel Export Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded border border-slate-300 shadow-xs transition-colors cursor-pointer"
            title="Print this report or save it as a PDF"
          >
            <Printer className="w-3.5 h-3.5 text-slate-700" />
            <span>Print Report (PDF)</span>
          </button>

          <button
            onClick={() => exportToExcel(activeReportTab)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded shadow-xs transition-colors cursor-pointer"
            title="Export the active report to an Excel spreadsheet (.xls)"
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
            Close
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
                  Officially Verified
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">{availableTabs[0].desc}</div>
            </div>
          </div>
          <div className="text-right text-[11px] text-slate-500 hidden md:block">
            Format: A4 / Letter with Letterhead &amp; Excel Spreadsheet Export
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
          { id: 'ALL', label: `All (${allOfficialDocs.length})` },
        ];
        const counts: Record<string, number> = {};
        allOfficialDocs.forEach((d) => {
          counts[d.type] = (counts[d.type] || 0) + 1;
        });

        const labelMap: Record<string, string> = {
          QUOTATION: 'Quotation',
          CLIENT_PO: 'Customer Purchase Orders',
          SALES_ORDER: 'Sales Orders',
          RENTAL: 'Rental Contracts',
          INVOICE: 'Invoice',
          PURCHASE_ORDER: 'Procurement Purchase Order (Vendor PO)',
          DELIVERY: 'Delivery Order (DO)',
          WORK_ORDER: 'Service Work Orders',
          PAYMENT: 'Payment Receipts',
          ASSET: 'Equipment Register (STNK/SIA)',
          OPERATOR: 'Operator SIO License',
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
              <div className="official-documents-summary-grid grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Total Documents {roleDisplayNames[userRole]?.title || userRole}</span>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">{allOfficialDocs.length} Records</div>
                  <span className="text-[10px] text-emerald-600 font-medium">Based on role permissions</span>
                </div>

                {/* Quotations Highlight Card (Requirement 7) */}
                <div className="bg-amber-50/60 border border-amber-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-amber-800 font-bold uppercase block flex items-center gap-1">
                    <FileText className="w-3 h-3 text-amber-700" /> Quotation
                  </span>
                  <div className="text-xl font-bold font-mono text-amber-950 mt-0.5">{quotesInDocs.length} Records</div>
                  <span className="text-[10px] text-amber-800 font-mono font-semibold">
                    {formatRupiah(totalQuotationValue)} Proposal Value
                  </span>
                </div>

                {/* Client PO Card (Requirement 7: PO dari Client, BUKAN PO tim procurement) */}
                <div className="bg-sky-50/70 border border-sky-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-sky-800 font-bold uppercase block flex items-center gap-1">
                    <PackageCheck className="w-3 h-3 text-sky-700" /> Client PO (Customer PO)
                  </span>
                  <div className="text-xl font-bold font-mono text-sky-950 mt-0.5">{clientPosInDocs.length} Orders Received</div>
                  <span className="text-[10px] text-sky-800 font-mono font-semibold">
                    {formatRupiah(totalClientPoValue)} Customer Order Value
                  </span>
                </div>

                <div className="bg-blue-50/60 border border-blue-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-blue-800 font-bold uppercase block flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-blue-700" /> Sales &amp; Rental Contracts
                  </span>
                  <div className="text-xl font-bold font-mono text-blue-950 mt-0.5">{salesOrdersInDocs.length + rentalsInDocs.length} Records</div>
                  <span className="text-[10px] text-blue-800 font-mono font-semibold">
                    {formatRupiah(totalSalesOrderValue + totalRentalValue)} Order Value
                  </span>
                </div>

                {userRole === 'ASSET_CONTROL' ? (
                  <div className="bg-teal-50/60 border border-teal-200 rounded-md p-3.5 shadow-2xs">
                    <span className="text-[10px] text-teal-800 font-bold uppercase block flex items-center gap-1">
                      <Truck className="w-3 h-3 text-teal-700" /> Equipment Register &amp; DOs
                    </span>
                    <div className="text-xl font-bold font-mono text-teal-950 mt-0.5">
                      {allOfficialDocs.filter((d) => d.type === 'ASSET' || d.type === 'DELIVERY').length} Assets/DOs
                    </div>
                    <span className="text-[10px] text-teal-800 font-mono font-semibold">
                      Legalitas STNK/SIA Terbit
                    </span>
                  </div>
                ) : (
                  <div className="bg-emerald-50/60 border border-emerald-200 rounded-md p-3.5 shadow-2xs">
                    <span className="text-[10px] text-emerald-800 font-bold uppercase block flex items-center gap-1">
                      <Receipt className="w-3 h-3 text-emerald-700" /> Invoices
                    </span>
                    <div className="text-xl font-bold font-mono text-emerald-950 mt-0.5">{invoicesInDocs.length} Invoices</div>
                    <span className="text-[10px] text-emerald-800 font-mono font-semibold">
                      {formatRupiah(totalInvoiceValue)} Invoiced
                    </span>
                  </div>
                )}
              </div>
            ) : userRole === 'PROCUREMENT' ? (
              <div className="official-documents-summary-grid grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Total Procurement Records</span>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">{allOfficialDocs.length} Records</div>
                  <span className="text-[10px] text-emerald-600 font-medium">Procurement Division</span>
                </div>

                <div className="bg-indigo-50/70 border border-indigo-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-indigo-800 font-bold uppercase block flex items-center gap-1">
                    <PackageSearch className="w-3 h-3 text-indigo-700" /> Procurement Purchase Orders (Vendor POs)
                  </span>
                  <div className="text-xl font-bold font-mono text-indigo-950 mt-0.5">{procurementPosInDocs.length} Vendor POs</div>
                  <span className="text-[10px] text-indigo-800 font-mono font-semibold">
                    {formatRupiah(totalPOValue)} Procurement Value
                  </span>
                </div>

                <div className="bg-blue-50/60 border border-blue-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-blue-800 font-bold uppercase block flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-blue-700" /> Partner Vendors / Suppliers
                  </span>
                  <div className="text-xl font-bold font-mono text-blue-950 mt-0.5">8 Partners</div>
                  <span className="text-[10px] text-blue-800 font-mono font-semibold">
                    Equipment &amp; Spare Parts Suppliers
                  </span>
                </div>

                <div className="bg-amber-50/60 border border-amber-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-amber-800 font-bold uppercase block flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-700" /> Procurement Status
                  </span>
                  <div className="text-xl font-bold font-mono text-amber-950 mt-0.5">100% Active</div>
                  <span className="text-[10px] text-amber-800 font-mono font-semibold">
                    Verified Vendor POs
                  </span>
                </div>

                <div className="bg-emerald-50/60 border border-emerald-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase block flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Spare Parts &amp; Office
                  </span>
                  <div className="text-xl font-bold font-mono text-emerald-950 mt-0.5">Integrated Procurement</div>
                  <span className="text-[10px] text-emerald-800 font-mono font-semibold">
                    Separate from Sales
                  </span>
                </div>
              </div>
            ) : userRole === 'FINANCE_ACCOUNTING_TAX' ? (
              <div className="official-documents-summary-grid grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Total FAT Documents</span>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">{allOfficialDocs.length} Records</div>
                  <span className="text-[10px] text-emerald-600 font-medium">Finance &amp; Tax</span>
                </div>
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase block flex items-center gap-1">
                    <Receipt className="w-3 h-3 text-emerald-700" /> Invoices
                  </span>
                  <div className="text-xl font-bold font-mono text-emerald-950 mt-0.5">{invoicesInDocs.length} Invoices</div>
                  <span className="text-[10px] text-emerald-800 font-mono font-semibold">
                    {formatRupiah(totalInvoiceValue)} Invoiced
                  </span>
                </div>
                <div className="bg-blue-50/60 border border-blue-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-blue-800 font-bold uppercase block flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-blue-700" /> Payment Receipts
                  </span>
                  <div className="text-xl font-bold font-mono text-blue-950 mt-0.5">{allOfficialDocs.filter((d) => d.type === 'PAYMENT').length} Receipts</div>
                  <span className="text-[10px] text-blue-800 font-mono font-semibold">Cash &amp; Bank Receipts</span>
                </div>
                <div className="bg-amber-50/60 border border-amber-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-amber-800 font-bold uppercase block flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-amber-700" /> 11% Output VAT
                  </span>
                  <div className="text-xl font-bold font-mono text-amber-950 mt-0.5">{formatRupiah(totalInvoiceValue * 0.11)}</div>
                  <span className="text-[10px] text-amber-800 font-mono font-semibold">Sales / Rental Tax</span>
                </div>
                <div className="bg-purple-50/60 border border-purple-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-purple-800 font-bold uppercase block flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-purple-700" /> Reconciliation
                  </span>
                  <div className="text-xl font-bold font-mono text-purple-950 mt-0.5">100% Complete</div>
                  <span className="text-[10px] text-purple-800 font-mono font-semibold">Audited Journal</span>
                </div>
              </div>
            ) : userRole === 'MANAGEMENT_OPERATION' ? (
              <div className="official-documents-summary-grid grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Total Field Records</span>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">{allOfficialDocs.length} Records</div>
                  <span className="text-[10px] text-emerald-600 font-medium">Field Operations</span>
                </div>
                <div className="bg-teal-50/60 border border-teal-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-teal-800 font-bold uppercase block flex items-center gap-1">
                    <Truck className="w-3 h-3 text-teal-700" /> Delivery Orders (DO)
                  </span>
                  <div className="text-xl font-bold font-mono text-teal-950 mt-0.5">{allOfficialDocs.filter((d) => d.type === 'DELIVERY').length} DO</div>
                  <span className="text-[10px] text-teal-800 font-mono font-semibold">Delivery &amp; Handover</span>
                </div>
                <div className="bg-cyan-50/60 border border-cyan-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-cyan-800 font-bold uppercase block flex items-center gap-1">
                    <Wrench className="w-3 h-3 text-cyan-700" /> Operator SIO Licenses
                  </span>
                  <div className="text-xl font-bold font-mono text-cyan-950 mt-0.5">{operatorsList.length} Operators</div>
                  <span className="text-[10px] text-cyan-800 font-mono font-semibold">Valid K3 Certification</span>
                </div>
                <div className="bg-amber-50/60 border border-amber-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-amber-800 font-bold uppercase block flex items-center gap-1">
                    <Boxes className="w-3 h-3 text-amber-700" /> Operational Units
                  </span>
                  <div className="text-xl font-bold font-mono text-amber-950 mt-0.5">{assetsList.length} Units</div>
                  <span className="text-[10px] text-amber-800 font-mono font-semibold">Fleet Deployment</span>
                </div>
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase block flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Field Compliance
                  </span>
                  <div className="text-xl font-bold font-mono text-emerald-950 mt-0.5">100% Compliant</div>
                  <span className="text-[10px] text-emerald-800 font-mono font-semibold">Active SIA Certification</span>
                </div>
              </div>
            ) : userRole === 'TECHNICAL_SERVICE' ? (
              <div className="official-documents-summary-grid grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Total Service Records</span>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">{allOfficialDocs.length} Records</div>
                  <span className="text-[10px] text-emerald-600 font-medium">Technical Service</span>
                </div>
                <div className="bg-rose-50/60 border border-rose-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-rose-800 font-bold uppercase block flex items-center gap-1">
                    <Wrench className="w-3 h-3 text-rose-700" /> Work Orders (WO)
                  </span>
                  <div className="text-xl font-bold font-mono text-rose-950 mt-0.5">{allOfficialDocs.filter((d) => d.type === 'WORK_ORDER').length} Tickets</div>
                  <span className="text-[10px] text-rose-800 font-mono font-semibold">Mechanical Repairs</span>
                </div>
                <div className="bg-amber-50/60 border border-amber-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-amber-800 font-bold uppercase block flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-700" /> Equipment Under Maintenance
                  </span>
                  <div className="text-xl font-bold font-mono text-amber-950 mt-0.5">{assetsList.filter((a) => a.status === 'IN_MAINTENANCE').length} Units</div>
                  <span className="text-[10px] text-amber-800 font-mono font-semibold">In Progress</span>
                </div>
                <div className="bg-blue-50/60 border border-blue-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-blue-800 font-bold uppercase block flex items-center gap-1">
                    <Boxes className="w-3 h-3 text-blue-700" /> Spare Parts Installed
                  </span>
                  <div className="text-xl font-bold font-mono text-blue-950 mt-0.5">OEM Parts</div>
                  <span className="text-[10px] text-blue-800 font-mono font-semibold">Genuine Komatsu &amp; CAT</span>
                </div>
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase block flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Compliance Certification
                  </span>
                  <div className="text-xl font-bold font-mono text-emerald-950 mt-0.5">Passed</div>
                  <span className="text-[10px] text-emerald-800 font-mono font-semibold">Kesiapan Operasi 100%</span>
                </div>
              </div>
            ) : (
              <div className="official-documents-summary-grid grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Total Operator Records</span>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">{allOfficialDocs.length} Records</div>
                  <span className="text-[10px] text-emerald-600 font-medium">Field Operators</span>
                </div>
                <div className="bg-cyan-50/60 border border-cyan-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-cyan-800 font-bold uppercase block flex items-center gap-1">
                    <Wrench className="w-3 h-3 text-cyan-700" /> SIO Licenses
                  </span>
                  <div className="text-xl font-bold font-mono text-cyan-950 mt-0.5">{allOfficialDocs.filter((d) => d.type === 'OPERATOR').length} Licenses</div>
                  <span className="text-[10px] text-cyan-800 font-mono font-semibold">Valid SIO Certification</span>
                </div>
                <div className="bg-amber-50/60 border border-amber-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-amber-800 font-bold uppercase block flex items-center gap-1">
                    <Boxes className="w-3 h-3 text-amber-700" /> Operational Units
                  </span>
                  <div className="text-xl font-bold font-mono text-amber-950 mt-0.5">{assetsList.length} Units</div>
                  <span className="text-[10px] text-amber-800 font-mono font-semibold">Fleet Deployment</span>
                </div>
                <div className="bg-blue-50/60 border border-blue-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-blue-800 font-bold uppercase block flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-700" /> Operating Hours
                  </span>
                  <div className="text-xl font-bold font-mono text-blue-950 mt-0.5">Active Shift</div>
                  <span className="text-[10px] text-blue-800 font-mono font-semibold">Verified Timesheet</span>
                </div>
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-md p-3.5 shadow-2xs">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase block flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-700" /> K3 Standards
                  </span>
                  <div className="text-xl font-bold font-mono text-emerald-950 mt-0.5">Compliant</div>
                  <span className="text-[10px] text-emerald-800 font-mono font-semibold">Safety Compliance</span>
                </div>
              </div>
            )}

            {/* Filter & Search Bar */}
            <div className="bg-white p-3.5 border border-slate-200 rounded-md space-y-3 shadow-2xs no-print">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={docSearchTerm}
                    onChange={(e) => setDocSearchTerm(e.target.value)}
                    placeholder="Search by document ID, customer, equipment, or status..."
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded text-xs outline-none focus:border-slate-800 font-mono"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => exportToExcel('official_docs')}
                    className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Export all official documents to Excel"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Excel</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Print the document list or save it as a PDF"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-400" />
                    <span>Print PDF</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-100 text-xs">
                <span className="text-[11px] font-semibold text-slate-500 shrink-0 mr-1 flex items-center gap-1">
                  <Filter className="w-3 h-3 text-slate-400" /> Filter Documents:
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
                  <span>Official Documents — {roleDisplayNames[userRole]?.title || userRole} ({filteredDocs.length} records)</span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Department: <strong>{roleDisplayNames[userRole]?.dept}</strong> · Select a document ID to view its details.
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="official-documents-table w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-4">Document ID</th>
                      <th className="py-2.5 px-4">Document Type</th>
                      <th className="py-2.5 px-4">Customer / Vendor</th>
                      <th className="py-2.5 px-4">Issue Date</th>
                      <th className="py-2.5 px-4 text-right">Transaction Amount (IDR)</th>
                      <th className="py-2.5 px-4 text-center">Legal Status</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredDocs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          No official documents match the search criteria "{docSearchTerm}".
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
                              title="Open this official document record"
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
                            {doc.amount > 0 ? formatRupiah(doc.amount) : '—'}
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
                              title="View and print the document"
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
                {formatRupiah(metrics.netInvoicedRevenue)}
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
                {formatRupiah(metrics.totalCollectedPayments)}
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
                {formatRupiah(metrics.totalOutstandingAR)}
              </div>
              <div className="mt-1 text-xs text-amber-700 font-medium">
                Overdue: {formatRupiah(metrics.overdueAmount)}
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
                {metrics.activeRentalsCount} units operating at customer sites
              </div>
            </div>
          </div>

          {/* Revenue Breakdown by Commercial Stream */}
          <div className="bg-white border border-slate-200 rounded-md p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Revenue Breakdown: Equipment Sales vs. Rentals
                </h3>
                <p className="text-xs text-slate-500">
                  Performance comparison of heavy equipment sales and contract rentals
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
                    {formatRupiah(metrics.salesRevenue)}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Sales of heavy equipment, diesel generators, excavators, and maintenance spare parts.
                  </p>
                </div>
                <div className="mt-3 text-xs font-medium text-emerald-700 font-mono-numbers">
                  Contribution: {((metrics.salesRevenue / metrics.netInvoicedRevenue) * 100).toFixed(1)}% of total revenue
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-700 uppercase">2. Equipment Rental &amp; Leasing</span>
                  <div className="text-xl font-bold font-mono-numbers text-slate-900 mt-1">
                    {formatRupiah(metrics.rentalRevenue)}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Monthly and daily rental contracts for heavy equipment, excavators, cranes, generators, and forklifts.
                  </p>
                </div>
                <div className="mt-3 text-xs font-medium text-emerald-700 font-mono-numbers">
                  Contribution: {((metrics.rentalRevenue / metrics.netInvoicedRevenue) * 100).toFixed(1)}% of total revenue
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
                    Executive Calculator: Profit, Operating Costs &amp; Financial Projections
                  </h3>
                  <p className="text-xs text-slate-500">
                    Executive projections of net profit after operating expenses, fleet depreciation, and taxes.
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
                <label className="block text-slate-700 font-semibold mb-1">Target Revenue Growth (%):</label>
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
                <label className="block text-slate-700 font-semibold mb-1">Operating Expense Ratio (%):</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={calcOpexPercent}
                    onChange={(e) => setCalcOpexPercent(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold text-slate-900"
                  />
                  <span className="font-bold text-slate-500">%</span>
                </div>
                <span className="text-[10px] text-slate-400">Payroll, fuel, and logistics</span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Fleet Depreciation (%/year):</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={calcDepreciationPercent}
                    onChange={(e) => setCalcDepreciationPercent(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold text-slate-900"
                  />
                  <span className="font-bold text-slate-500">%</span>
                </div>
                <span className="text-[10px] text-slate-400">Book value depreciation</span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Estimated FAT Tax Rate (%):</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={calcTaxRatePercent}
                    onChange={(e) => setCalcTaxRatePercent(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold text-slate-900"
                  />
                  <span className="font-bold text-slate-500">%</span>
                </div>
                <span className="text-[10px] text-slate-400">Corporate VAT &amp; withholding tax</span>
              </div>
            </div>

            {/* Calculations Breakdown Table */}
            {executiveCalculations && (
              <div className="border border-slate-200 rounded overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-4">Executive Calculation Component</th>
                      <th className="py-2.5 px-4">Formula / Ratio</th>
                      <th className="py-2.5 px-4 text-right">Calculated Amount (IDR)</th>
                      <th className="py-2.5 px-4">Management Analysis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">Projected Gross Revenue</td>
                      <td className="py-2.5 px-4 font-mono">Base ({formatRupiah(executiveCalculations.baseRevenue)}) + {calcTargetGrowthPercent}%</td>
                      <td className="py-2.5 px-4 text-right font-mono-numbers font-bold text-slate-900 text-sm">
                        {formatRupiah(executiveCalculations.projectedRevenue)}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">Revenue target for the next period</td>
                    </tr>

                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">Field Operating Expenses (OPEX)</td>
                      <td className="py-2.5 px-4 font-mono">{calcOpexPercent}% x Projected Revenue</td>
                      <td className="py-2.5 px-4 text-right font-mono-numbers font-medium text-rose-600">
                        -{formatRupiah(executiveCalculations.projectedOpex)}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">Spare parts, operator payroll, mobilization / demobilization</td>
                    </tr>

                    <tr className="bg-slate-50 font-semibold">
                      <td className="py-2.5 px-4 text-slate-900">Gross Operating Profit (EBITDA)</td>
                      <td className="py-2.5 px-4 font-mono">Revenue - OPEX</td>
                      <td className="py-2.5 px-4 text-right font-mono-numbers font-bold text-emerald-800">
                        {formatRupiah(executiveCalculations.grossEbitda)}
                      </td>
                      <td className="py-2.5 px-4 text-emerald-700">EBITDA Margin: {((executiveCalculations.grossEbitda / executiveCalculations.projectedRevenue) * 100).toFixed(1)}%</td>
                    </tr>

                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">Heavy Equipment Fleet Depreciation Expense</td>
                      <td className="py-2.5 px-4 font-mono">{calcDepreciationPercent}% x Fleet Value ({formatRupiah(executiveCalculations.totalFleetValue)})</td>
                      <td className="py-2.5 px-4 text-right font-mono-numbers text-slate-600">
                        -{formatRupiah(executiveCalculations.fleetDepreciation)}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">Heavy equipment book value amortization</td>
                    </tr>

                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">Earnings Before Interest and Taxes (EBIT)</td>
                      <td className="py-2.5 px-4 font-mono">EBITDA - Depreciation</td>
                      <td className="py-2.5 px-4 text-right font-mono-numbers font-bold text-slate-900">
                        {formatRupiah(executiveCalculations.operationalEbit)}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">Corporate taxable income basis</td>
                    </tr>

                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">Net Tax Liability (Tax Provision)</td>
                      <td className="py-2.5 px-4 font-mono">{calcTaxRatePercent}% x Taxable Income</td>
                      <td className="py-2.5 px-4 text-right font-mono-numbers text-rose-600 font-medium">
                        -{formatRupiah(executiveCalculations.estimatedTax)}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">Tax remittance (FAT)</td>
                    </tr>

                    <tr className="bg-emerald-50 border-t-2 border-emerald-600 font-bold">
                      <td className="py-3 px-4 text-emerald-950 text-sm">NET OPERATING PROFIT</td>
                      <td className="py-3 px-4 font-mono text-emerald-900">EBIT - Net Tax</td>
                      <td className="py-3 px-4 text-right font-mono-numbers text-emerald-900 text-base">
                        {formatRupiah(executiveCalculations.netProfitAfterTax)}
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
              <p className="font-semibold">Prepared By:</p>
              <div className="h-16"></div>
              <p className="font-bold underline">Sarah Jenkins</p>
              <p className="text-[10px] text-slate-500">Finance &amp; Accounting Lead (FAT)</p>
            </div>
            <div>
              <p className="font-semibold">Reviewed By:</p>
              <div className="h-16"></div>
              <p className="font-bold underline">Bambang Pratama</p>
              <p className="text-[10px] text-slate-500">Asset Control &amp; Operations</p>
            </div>
            <div>
              <p className="font-semibold">Approved By:</p>
              <div className="h-16"></div>
              <p className="font-bold underline">Marcus Sterling</p>
              <p className="text-[10px] text-slate-500">Chief Executive Officer</p>
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
                  Commercial Sales &amp; Customer Project Summary
                </h3>
                <p className="text-xs text-slate-500">
                  Corporate customer data, active credit limits, sales order status, and receivables by customer
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-blue-900 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                Total Customers: {customersList.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase">
                    <th className="py-2.5 px-4">Customer / Company</th>
                    <th className="py-2.5 px-4">Code &amp; Tax ID</th>
                    <th className="py-2.5 px-4">Primary Contact</th>
                    <th className="py-2.5 px-4 text-right">Credit Limit (IDR)</th>
                    <th className="py-2.5 px-4 text-right">Outstanding Balance (IDR)</th>
                    <th className="py-2.5 px-4 text-center">Relationship Status</th>
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
                        {formatRupiah(cust.creditLimit)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-numbers font-bold text-slate-900">
                        {formatRupiah(cust.outstandingBalance)}
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
                  Heavy Equipment Registration &amp; Compliance Documents
                </h3>
                <p className="text-xs text-slate-500">
                  Monitor heavy vehicle compliance documents, chassis and engine numbers, license plates, and operating licenses.
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-teal-900 bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
                {assetsList.length} Registered Units
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase">
                    <th className="py-2.5 px-4">Tag / Equipment Name</th>
                    <th className="py-2.5 px-4">Category &amp; Location</th>
                    <th className="py-2.5 px-4">Registration / Ownership No.</th>
                    <th className="py-2.5 px-4">Operating License No.</th>
                    <th className="py-2.5 px-4">License Expiry</th>
                    <th className="py-2.5 px-4 text-center">Compliance Status</th>
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
                            title="View asset registration and compliance documents"
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
                          <div>Registration: {stnk}</div>
                          <div className="text-slate-500">Ownership: {bpkb}</div>
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
                  Heavy Equipment Operators &amp; Safety License Qualifications
                </h3>
                <p className="text-xs text-slate-500">
                  Field operator records, operator license expiry, and project equipment assignments
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-sky-900 bg-sky-50 px-2.5 py-1 rounded border border-sky-200">
                {operatorsList.length} Certified Operators
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase">
                    <th className="py-2.5 px-4">Operator Name</th>
                    <th className="py-2.5 px-4">Badge / Contact</th>
                    <th className="py-2.5 px-4">Equipment Specialization</th>
                    <th className="py-2.5 px-4">License No. &amp; Class</th>
                    <th className="py-2.5 px-4">License Expiry</th>
                    <th className="py-2.5 px-4">Equipment Assignment</th>
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
                          title="Open the operator license and profile"
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
                        <div className="font-semibold text-slate-900">{op.assignedAssetName || 'Depot Standby'}</div>
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
                  Asset, Spare Parts &amp; Vendor Purchase Order Summary
                </h3>
                <p className="text-xs text-slate-500">
                  New equipment purchases, maintenance spare parts, and procurement vendor invoices
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-purple-900 bg-purple-50 px-2.5 py-1 rounded border border-purple-200">
                {purchaseOrders.length} Issued Purchase Orders
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase">
                    <th className="py-2.5 px-4">Purchase Order No.</th>
                    <th className="py-2.5 px-4">Vendor</th>
                    <th className="py-2.5 px-4">Order Date</th>
                    <th className="py-2.5 px-4">Expected Delivery</th>
                    <th className="py-2.5 px-4 text-right">Subtotal (IDR)</th>
                    <th className="py-2.5 px-4 text-right">Total PO (IDR)</th>
                    <th className="py-2.5 px-4 text-center">Procurement Status</th>
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
                          title="Open the official vendor purchase order details"
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
                        {formatRupiah(po.subtotal)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-numbers font-bold text-slate-900">
                        {formatRupiah(po.grandTotal)}
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
                  Tax Calculations &amp; FAT Summary
                </h3>
                <p className="text-xs text-slate-500">
                  Taxable base, 11% output VAT on sales and rentals, and withholding tax calculations
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                VAT Rate: 11% · Withholding Tax: 2%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded">
                <span className="text-xs text-slate-500 block">Total Taxable Base (Sales &amp; Rentals)</span>
                <div className="text-xl font-bold font-mono-numbers text-slate-900 mt-1">
                  {formatRupiah(tax.dppTotal)}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">Net Taxable Base</span>
              </div>

              <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded">
                <span className="text-xs text-emerald-800 font-semibold block">Output VAT 11% Issued</span>
                <div className="text-xl font-bold font-mono-numbers text-emerald-900 mt-1">
                  {formatRupiah(tax.ppn11Keluaran)}
                </div>
                <span className="text-[11px] text-emerald-700 mt-1 block">Standard Output Tax Invoice</span>
              </div>

              <div className="p-3.5 bg-amber-50/50 border border-amber-200 rounded">
                <span className="text-xs text-amber-800 font-semibold block">Heavy Equipment Rental Withholding Tax (2%)</span>
                <div className="text-xl font-bold font-mono-numbers text-amber-900 mt-1">
                  {formatRupiah(tax.pph23SewaAlat)}
                </div>
                <span className="text-[11px] text-amber-700 mt-1 block">Customer Withholding Tax Certificate</span>
              </div>
            </div>

            <table className="w-full text-left text-xs border-collapse mt-4">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-4">Tax Component (FAT)</th>
                  <th className="py-2.5 px-4 text-right">Taxable Base (IDR)</th>
                  <th className="py-2.5 px-4 text-right">Rate</th>
                  <th className="py-2.5 px-4 text-right">Tax Due (IDR)</th>
                  <th className="py-2.5 px-4">Administrative Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-3 px-4 font-semibold">Output VAT - Equipment &amp; Spare Parts Sales</td>
                  <td className="py-3 px-4 text-right font-mono-numbers">{formatRupiah(tax.dppSales)}</td>
                  <td className="py-3 px-4 text-right font-mono-numbers">11%</td>
                  <td className="py-3 px-4 text-right font-mono-numbers font-bold text-emerald-800">
                    {formatRupiah(tax.dppSales * 0.11)}
                  </td>
                  <td className="py-3 px-4 text-slate-500">Directorate General of Taxes e-Invoice</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold">Output VAT - Heavy Equipment Rental &amp; Leasing</td>
                  <td className="py-3 px-4 text-right font-mono-numbers">{formatRupiah(tax.dppRentals)}</td>
                  <td className="py-3 px-4 text-right font-mono-numbers">11%</td>
                  <td className="py-3 px-4 text-right font-mono-numbers font-bold text-emerald-800">
                    {formatRupiah(tax.dppRentals * 0.11)}
                  </td>
                  <td className="py-3 px-4 text-slate-500">Current Rental Period Tax Invoice</td>
                </tr>
                <tr className="bg-amber-50/30">
                  <td className="py-3 px-4 font-semibold">Customer Withholding Tax (Equipment Rental)</td>
                  <td className="py-3 px-4 text-right font-mono-numbers">{formatRupiah(tax.dppRentals)}</td>
                  <td className="py-3 px-4 text-right font-mono-numbers">2%</td>
                  <td className="py-3 px-4 text-right font-mono-numbers font-bold text-amber-800">
                    -{formatRupiah(tax.pph23SewaAlat)}
                  </td>
                  <td className="py-3 px-4 text-slate-500">Customer-Specific Withholding Tax Certificate</td>
                </tr>
                <tr className="bg-slate-50 font-bold">
                  <td className="py-3 px-4">Estimated Net VAT Payable to the Treasury</td>
                  <td className="py-3 px-4 text-right font-mono-numbers">-</td>
                  <td className="py-3 px-4 text-right font-mono-numbers">-</td>
                  <td className="py-3 px-4 text-right font-mono-numbers text-slate-900 text-sm">
                    {formatRupiah(tax.totalPajakBersih)}
                  </td>
                  <td className="py-3 px-4 text-slate-700">Consolidated VAT Return 1111</td>
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
                  Accounts Receivable Aging &amp; Collection Tracking
                </h3>
                <p className="text-xs text-slate-500">
                  Monitor overdue receivables and invoice collection status by aging bucket.
                </p>
              </div>
              <span className="font-mono font-bold text-slate-900 text-sm">
                Total AR: {formatRupiah(metrics.totalOutstandingAR)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded text-xs">
                <span className="text-emerald-800 font-semibold block">Current (0–30 Days)</span>
                <div className="text-lg font-bold font-mono-numbers text-emerald-900 mt-1">
                  {formatRupiah(agingBuckets.current)}
                </div>
                <span className="text-[10px] text-emerald-700 mt-1 block">Current · Within terms</span>
              </div>

              <div className="p-3 bg-blue-50/50 border border-blue-200 rounded text-xs">
                <span className="text-blue-800 font-semibold block">31–60 Days Past Due</span>
                <div className="text-lg font-bold font-mono-numbers text-blue-900 mt-1">
                  {formatRupiah(agingBuckets.days31to60)}
                </div>
                <span className="text-[10px] text-blue-700 mt-1 block">Invoice follow-up reminder sent</span>
              </div>

              <div className="p-3 bg-amber-50/50 border border-amber-200 rounded text-xs">
                <span className="text-amber-800 font-semibold block">61–90 Days Past Due</span>
                <div className="text-lg font-bold font-mono-numbers text-amber-900 mt-1">
                  {formatRupiah(agingBuckets.days61to90)}
                </div>
                <span className="text-[10px] text-amber-700 mt-1 block">Warning notice issued; new orders on hold</span>
              </div>

              <div className="p-3 bg-rose-50/50 border border-rose-200 rounded text-xs">
                <span className="text-rose-800 font-semibold block">&gt;90 Days Past Due</span>
                <div className="text-lg font-bold font-mono-numbers text-rose-900 mt-1">
                  {formatRupiah(agingBuckets.over90)}
                </div>
                <span className="text-[10px] text-rose-700 mt-1 block">Escalated to executive / special collections</span>
              </div>
            </div>

            {/* Invoices Tracing Table */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
                Unpaid Invoices
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase">
                      <th className="py-2.5 px-4">Invoice No.</th>
                      <th className="py-2.5 px-4">Customer</th>
                      <th className="py-2.5 px-4">Issue Date</th>
                      <th className="py-2.5 px-4">Due Date</th>
                      <th className="py-2.5 px-4 text-right">Invoice Total (IDR)</th>
                      <th className="py-2.5 px-4 text-right">Outstanding Balance (IDR)</th>
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
                              title="Open the official invoice details"
                            >
                              <FileText className="w-3.5 h-3.5 text-indigo-500" />
                              <span>{inv.invoiceNumber}</span>
                            </button>
                          </td>
                          <td className="py-2.5 px-4 font-medium text-slate-800">{inv.customerName}</td>
                          <td className="py-2.5 px-4 font-mono text-slate-500">{inv.issueDate}</td>
                          <td className="py-2.5 px-4 font-mono font-semibold text-rose-700">{inv.dueDate}</td>
                          <td className="py-2.5 px-4 text-right font-mono-numbers">
                            {formatRupiah(inv.grandTotal)}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono-numbers font-bold text-slate-900">
                            {formatRupiah(inv.outstandingBalance)}
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
