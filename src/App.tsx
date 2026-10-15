import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, Customer, Product, Asset, Quotation, SalesOrder, RentalContract, Delivery, Invoice, Payment, Vendor, PurchaseOrder, VendorBill, WorkOrder, AuditLog, SystemSettings } from './types/index.ts';
import { api } from './services/api.ts';
import { Header } from './components/Header.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { LoginPage } from './components/LoginPage.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { CustomersView } from './components/CustomersView.tsx';
import { AssetsView } from './components/AssetsView.tsx';
import { ProductsView } from './components/ProductsView.tsx';
import { QuotationsView } from './components/QuotationsView.tsx';
import { SalesOrdersView } from './components/SalesOrdersView.tsx';
import { RentalsView } from './components/RentalsView.tsx';
import { DeliveriesView } from './components/DeliveriesView.tsx';
import { InvoicesView } from './components/InvoicesView.tsx';
import { PaymentsView } from './components/PaymentsView.tsx';
import { ProcurementView } from './components/ProcurementView.tsx';
import { MaintenanceView } from './components/MaintenanceView.tsx';
import { ReportsView } from './components/ReportsView.tsx';
import { ApiExplorerView } from './components/ApiExplorerView.tsx';
import { TestRunnerView } from './components/TestRunnerView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { OperatorScanStatusView } from './components/OperatorScanStatusView.tsx';
import { TechnicalServiceView } from './components/TechnicalServiceView.tsx';
import { UserManagementView } from './components/UserManagementView.tsx';
import { X, ShieldAlert } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('apex_auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [activeRole, setActiveRole] = useState<UserRole>(() => {
    const userRole = localStorage.getItem('apex_user_role') as UserRole;
    return userRole || 'EXECUTIVE';
  });

  const [activeTab, setActiveTab] = useState<string>(() => {
    const userRole = localStorage.getItem('apex_user_role') as UserRole;
    if (userRole === 'OPERATOR_USER') return 'operator-status';
    if (userRole === 'EXECUTIVE') return 'reports';
    return 'dashboard';
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showQuickNewModal, setShowQuickNewModal] = useState(false);

  // Entities
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [rentals, setRentals] = useState<RentalContract[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [vendorBills, setVendorBills] = useState<VendorBill[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [financeMetrics, setFinanceMetrics] = useState<any>({
    netInvoicedRevenue: 0,
    totalCollectedPayments: 0,
    totalOutstandingAR: 0,
    overdueAmount: 0,
    salesRevenue: 0,
    rentalRevenue: 0,
    utilizationRate: 0,
    activeRentalsCount: 0,
    availableAssetsCount: 0,
  });

  const [preselectedInvoiceIdForPayment, setPreselectedInvoiceIdForPayment] = useState<string | undefined>();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const loadAllData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [
        cRes,
        pRes,
        aRes,
        qRes,
        soRes,
        rRes,
        dRes,
        iRes,
        pmtRes,
        vRes,
        poRes,
        vbRes,
        woRes,
        logRes,
        setRes,
        finRes,
      ] = await Promise.all([
        api.getCustomers(),
        api.getProducts(),
        api.getAssets(),
        api.getQuotations(),
        api.getSalesOrders(),
        api.getRentals(),
        api.getDeliveries(),
        api.getInvoices(),
        api.getPayments(),
        api.getVendors(),
        api.getPurchaseOrders(),
        api.getVendorBills(),
        api.getWorkOrders(),
        api.getAuditLogs(),
        api.getSettings(),
        api.getFinanceDashboard(),
      ]);

      setCustomers(cRes.data);
      setProducts(pRes.data);
      setAssets(aRes.data);
      setQuotations(qRes.data);
      setSalesOrders(soRes.data);
      setRentals(rRes.data);
      setDeliveries(dRes.data);
      setInvoices(iRes.data);
      setPayments(pmtRes.data);
      setVendors(vRes.data);
      setPurchaseOrders(poRes.data);
      setVendorBills(vbRes.data);
      setWorkOrders(woRes.data);
      setAuditLogs(logRes.data);
      setSettings(setRes);
      if (finRes?.metrics) setFinanceMetrics(finRes.metrics);
    } catch (err) {
      console.error('Failed to load application data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadAllData();
    }
  }, [loadAllData, currentUser]);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setActiveRole(user.role);
    localStorage.setItem('apex_auth_user', JSON.stringify(user));
    localStorage.setItem('apex_user_role', user.role);
    const defaultTabs: Record<UserRole, string> = {
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
    };
    setActiveTab(defaultTabs[user.role] || 'reports');
    loadAllData();
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem('apex_auth_user');
    localStorage.removeItem('apex_user_role');
    localStorage.removeItem('apex_user_name');
    setCurrentUser(null);
  };

  const handleRoleChange = (role: UserRole) => {
    setActiveRole(role);
    localStorage.setItem('apex_user_role', role);
    if (currentUser) {
      const updatedUser = { ...currentUser, role };
      setCurrentUser(updatedUser);
      localStorage.setItem('apex_auth_user', JSON.stringify(updatedUser));
    }
    const defaultTabs: Record<UserRole, string> = {
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
    };
    // Strict Role Redirection
    if (activeTab === 'dashboard' && role !== 'EXECUTIVE' && role !== 'ADMIN_IT') {
      setActiveTab(defaultTabs[role] || 'reports');
    } else if (role === 'OPERATOR_USER') {
      setActiveTab('operator-status');
    } else if (role === 'TECHNICAL_SERVICE' && (activeTab === 'invoices' || activeTab === 'payments' || activeTab === 'procurement' || activeTab === 'sales' || activeTab === 'quotations')) {
      setActiveTab('technical-service');
    } else if (role === 'EXECUTIVE' && (activeTab === 'settings' || activeTab === 'api-explorer' || activeTab === 'test-runner' || activeTab === 'user-management')) {
      setActiveTab('reports');
    }
    let name = currentUser?.name || 'Admin User';
    localStorage.setItem('apex_user_name', name);
  };

  const handleNavigateToPayment = (invoiceId: string) => {
    setPreselectedInvoiceIdForPayment(invoiceId);
    setActiveTab('payments');
  };

  // If not logged in, display the dedicated Login Page
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const openOrdersCount = salesOrders.filter((s) => s.status !== 'COMPLETED' && s.status !== 'CANCELLED').length;
  const activeRentalsCount = rentals.filter((r) => r.status === 'ACTIVE').length;
  const openInvoicesCount = invoices.filter((i) => i.outstandingBalance > 0 && i.status !== 'CANCELLED').length;
  const pendingWorkOrdersCount = workOrders.filter((w) => w.status !== 'COMPLETED').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top Header Bar */}
      <Header
        currentUser={currentUser}
        activeRole={activeRole}
        onRoleChange={handleRoleChange}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenQuickNew={() => setShowQuickNewModal(true)}
        onLogout={handleLogout}
        isRefreshing={isRefreshing}
        onRefresh={loadAllData}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Responsive Sidebar filtered by role */}
        <Sidebar
          currentTab={activeTab}
          userRole={activeRole}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setPreselectedInvoiceIdForPayment(undefined);
          }}
          counts={{
            openOrders: openOrdersCount,
            activeRentals: activeRentalsCount,
            openInvoices: openInvoicesCount,
            pendingWorkOrders: pendingWorkOrdersCount,
          }}
          isOpenOnMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-3 sm:p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            activeRole !== 'EXECUTIVE' && activeRole !== 'ADMIN_IT' ? (
              <div className="bg-white border border-slate-200 rounded-md p-8 text-center space-y-3">
                <div className="text-amber-800 font-bold text-sm">Akses Terbatas: Dashboard Operasional Khusus Direktur (Executive) &amp; IT</div>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Sesuai kebijakan tata kelola sistem enterprise, dashboard operasional utama hanya ditampilkan untuk peran Direktur dan Administrator IT. Silakan gunakan ruang kerja operasional Anda.
                </p>
                <button
                  onClick={() => {
                    const defaultTabs: Record<string, string> = {
                      SALES_MARKETING: 'quotations',
                      ASSET_CONTROL: 'assets',
                      MANAGEMENT_OPERATION: 'maintenance',
                      PROCUREMENT: 'procurement',
                      FINANCE_ACCOUNTING_TAX: 'invoices',
                      AR_MANAGEMENT: 'invoices',
                      OPERATOR_USER: 'operator-status',
                    };
                    setActiveTab(defaultTabs[activeRole] || 'reports');
                  }}
                  className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 cursor-pointer"
                >
                  Buka Ruang Kerja Operasional
                </button>
              </div>
            ) : (
              <DashboardView
                metrics={financeMetrics}
                auditLogs={auditLogs}
                userRole={activeRole}
                onNavigate={setActiveTab}
                onOpenQuickNew={(type) => {
                  if (type === 'quotation') setActiveTab('quotations');
                  else if (type === 'salesOrder') setActiveTab('sales');
                  else if (type === 'rental') setActiveTab('rentals');
                  else if (type === 'invoice') setActiveTab('invoices');
                  else if (type === 'payment') setActiveTab('payments');
                  else setShowQuickNewModal(true);
                }}
              />
            )
          )}

          {activeTab === 'customers' && (
            <CustomersView customers={customers} onRefresh={loadAllData} />
          )}

          {activeTab === 'assets' && (
            <AssetsView assets={assets} onRefresh={loadAllData} />
          )}

          {activeTab === 'products' && (
            <ProductsView products={products} onRefresh={loadAllData} />
          )}

          {activeTab === 'quotations' && (
            <QuotationsView
              quotations={quotations}
              customers={customers}
              products={products}
              assets={assets}
              userRole={activeRole}
              onRefresh={loadAllData}
              onNavigateToOrder={() => setActiveTab('sales')}
            />
          )}

          {activeTab === 'sales' && (
            <SalesOrdersView
              salesOrders={salesOrders}
              customers={customers}
              products={products}
              assets={assets}
              onRefresh={loadAllData}
              onNavigateToDelivery={() => setActiveTab('deliveries')}
              onNavigateToInvoice={() => setActiveTab('invoices')}
            />
          )}

          {activeTab === 'rentals' && (
            <RentalsView
              rentals={rentals}
              customers={customers}
              assets={assets}
              onRefresh={loadAllData}
              onNavigateToInvoice={() => setActiveTab('invoices')}
            />
          )}

          {activeTab === 'deliveries' && (
            <DeliveriesView deliveries={deliveries} onRefresh={loadAllData} />
          )}

          {activeTab === 'invoices' && (
            (activeRole === 'EXECUTIVE' || activeRole === 'ADMIN_IT' || activeRole === 'FINANCE_ACCOUNTING_TAX' || activeRole === 'AR_MANAGEMENT') ? (
              <InvoicesView
                invoices={invoices}
                customers={customers}
                onRefresh={loadAllData}
                onNavigateToPayment={handleNavigateToPayment}
              />
            ) : (
              <div className="bg-white border border-rose-200 rounded-md p-8 text-center space-y-3">
                <div className="text-rose-700 font-bold text-sm flex items-center justify-center gap-2">
                  <ShieldAlert className="w-5 h-5" />
                  Akses Ditolak: Data Tagihan &amp; Piutang (AR) Terproteksi Ketat
                </div>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Sesuai kebijakan keamanan EARMS, peran <strong>{activeRole}</strong> tidak memiliki otorisasi untuk melihat, membuat, mengedit, atau menghapus data penagihan piutang (AR).
                </p>
              </div>
            )
          )}

          {activeTab === 'payments' && (
            (activeRole === 'EXECUTIVE' || activeRole === 'ADMIN_IT' || activeRole === 'FINANCE_ACCOUNTING_TAX' || activeRole === 'AR_MANAGEMENT') ? (
              <PaymentsView
                payments={payments}
                customers={customers}
                invoices={invoices}
                onRefresh={loadAllData}
                preselectedInvoiceId={preselectedInvoiceIdForPayment}
              />
            ) : (
              <div className="bg-white border border-rose-200 rounded-md p-8 text-center space-y-3">
                <div className="text-rose-700 font-bold text-sm flex items-center justify-center gap-2">
                  <ShieldAlert className="w-5 h-5" />
                  Akses Ditolak: Modul Penerimaan Pembayaran Terproteksi
                </div>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Peran <strong>{activeRole}</strong> tidak memiliki hak otorisasi untuk memproses pembayaran piutang pelanggan.
                </p>
              </div>
            )
          )}

          {activeTab === 'procurement' && (
            <ProcurementView
              vendors={vendors}
              purchaseOrders={purchaseOrders}
              vendorBills={vendorBills}
              products={products}
              onRefresh={loadAllData}
            />
          )}

          {activeTab === 'maintenance' && (
            <MaintenanceView
              workOrders={workOrders}
              assets={assets}
              customers={customers}
              onRefresh={loadAllData}
            />
          )}

          {activeTab === 'technical-service' && (
            <TechnicalServiceView
              workOrders={workOrders}
              assets={assets}
              products={products}
              currentUserName={currentUser?.name}
              onRefreshAll={loadAllData}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView userRole={activeRole} onNavigate={setActiveTab} />
          )}

          {activeTab === 'api-explorer' && (
            activeRole === 'EXECUTIVE' ? (
              <div className="bg-white border border-slate-200 rounded-md p-8 text-center space-y-3">
                <div className="text-amber-800 font-bold text-sm">Akses Khusus Administrator Admin (IT)</div>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Fitur REST API Explorer &amp; Swagger merupakan instrumen teknis IT. Peran Direktur diutamakan mengakses Laporan Eksekutif Keuangan &amp; Operasional.
                </p>
                <button
                  onClick={() => setActiveTab('reports')}
                  className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 cursor-pointer"
                >
                  Buka Laporan Eksekutif (PDF / Excel)
                </button>
              </div>
            ) : (
              <ApiExplorerView />
            )
          )}

          {activeTab === 'test-runner' && (
            activeRole === 'EXECUTIVE' ? (
              <div className="bg-white border border-slate-200 rounded-md p-8 text-center space-y-3">
                <div className="text-amber-800 font-bold text-sm">Akses Khusus Administrator Admin (IT)</div>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Fitur Automated Test Suite disediakan untuk pengujian sistem oleh Administrator IT.
                </p>
                <button
                  onClick={() => setActiveTab('reports')}
                  className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 cursor-pointer"
                >
                  Buka Laporan Eksekutif
                </button>
              </div>
            ) : (
              <TestRunnerView />
            )
          )}

          {activeTab === 'settings' && settings && (
            activeRole === 'EXECUTIVE' ? (
              <div className="bg-white border border-slate-200 rounded-md p-8 text-center space-y-3">
                <div className="text-amber-800 font-bold text-sm">Akses Khusus Administrator Admin (IT)</div>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Konfigurasi prefix sistem dan log audit tingkat rendah dikelola oleh Administrator IT.
                </p>
                <button
                  onClick={() => setActiveTab('reports')}
                  className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 cursor-pointer"
                >
                  Buka Laporan Eksekutif
                </button>
              </div>
            ) : (
              <SettingsView
                settings={settings}
                auditLogs={auditLogs}
                onRefresh={loadAllData}
              />
            )
          )}

          {activeTab === 'operator-status' && (
            <OperatorScanStatusView
              assets={assets}
              currentUserName={currentUser.name}
              onRefreshAll={loadAllData}
            />
          )}

          {activeTab === 'user-management' && (
            <UserManagementView
              currentUser={currentUser}
              onRefresh={loadAllData}
            />
          )}
        </main>
      </div>

      {/* Quick Action Modal */}
      {showQuickNewModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-sm w-full p-5 text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Select Commercial Action</h3>
              <button onClick={() => setShowQuickNewModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 pt-1">
              <button
                onClick={() => {
                  setShowQuickNewModal(false);
                  setActiveTab('quotations');
                }}
                className="w-full text-left p-2.5 rounded border border-slate-200 hover:bg-slate-50 font-medium text-slate-800"
              >
                Create Sales Quotation
              </button>
              <button
                onClick={() => {
                  setShowQuickNewModal(false);
                  setActiveTab('sales');
                }}
                className="w-full text-left p-2.5 rounded border border-slate-200 hover:bg-slate-50 font-medium text-slate-800"
              >
                Create Direct Sales Order
              </button>
              <button
                onClick={() => {
                  setShowQuickNewModal(false);
                  setActiveTab('rentals');
                }}
                className="w-full text-left p-2.5 rounded border border-slate-200 hover:bg-slate-50 font-medium text-slate-800"
              >
                Book Equipment Rental Contract
              </button>
              <button
                onClick={() => {
                  setShowQuickNewModal(false);
                  setActiveTab('invoices');
                }}
                className="w-full text-left p-2.5 rounded border border-slate-200 hover:bg-slate-50 font-medium text-slate-800"
              >
                Issue Commercial Invoice
              </button>
              <button
                onClick={() => {
                  setShowQuickNewModal(false);
                  setActiveTab('payments');
                }}
                className="w-full text-left p-2.5 rounded border border-slate-200 hover:bg-slate-50 font-medium text-slate-800"
              >
                Record Customer Payment
              </button>
              <button
                onClick={() => {
                  setShowQuickNewModal(false);
                  setActiveTab('assets');
                }}
                className="w-full text-left p-2.5 rounded border border-slate-200 hover:bg-slate-50 font-medium text-slate-800"
              >
                Register Fixed Asset Tag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
