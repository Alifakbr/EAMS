import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, Customer, Product, Asset, Quotation, SalesOrder, RentalContract, Delivery, Invoice, Payment, Vendor, PurchaseOrder, VendorBill, WorkOrder, AuditLog, SystemSettings } from './types/index.ts';
import { api, SessionInfo } from './services/api.ts';
import { session, SESSION_EVENTS } from './services/session.ts';
import { defaultTabFor, type ModuleId } from './shared/access.ts';
import { LandingPage } from './components/LandingPage.tsx';
import { Toaster, installAlertToast } from './components/Toaster.tsx';
import { ChangePasswordModal } from './components/ChangePasswordModal.tsx';
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
import { ManagerApprovalsView } from './components/ManagerApprovalsView.tsx';
import { DraftPersistence } from './components/DraftPersistence.tsx';
import { X } from 'lucide-react';

type View = 'landing' | 'login' | 'app';

const readHash = () => window.location.hash.replace(/^#\/?/, '');

export default function App() {
  // Sesi SELALU divalidasi ke server (/auth/me). Peran & modul tidak pernah dipercaya dari localStorage.
  const [booting, setBooting] = useState<boolean>(() => !!session.getToken());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [modules, setModules] = useState<ModuleId[]>([]);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [guestView, setGuestView] = useState<'landing' | 'login'>(() => (readHash() === 'masuk' ? 'login' : 'landing'));

  const activeRole: UserRole = currentUser?.role || 'EXECUTIVE';
  const mustChangePassword = !!currentUser?.mustChangePassword;
  const defaultTab = currentUser ? defaultTabFor({ ...currentUser, status: 'ACTIVE' }) : 'reports';
  // defaultTabFor memakai modul hasil hitung klien; pakai modul dari server bila ada.
  const homeTab = modules.includes(defaultTab as ModuleId) ? defaultTab : (modules[0] || defaultTab);

  const [activeTab, setActiveTab] = useState<string>('reports');
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

  // Notifikasi non-blokir menggantikan alert()
  useEffect(() => { installAlertToast(); }, []);

  const applySession = useCallback((info: SessionInfo, goHome = false) => {
    setCurrentUser(info.user);
    setModules(info.modules);
    if (goHome) {
      const d = defaultTabFor({ ...info.user, status: 'ACTIVE' });
      setActiveTab(info.modules.includes(d) ? d : info.modules[0] || d);
    }
  }, []);

  const endSession = useCallback((notice?: string) => {
    session.clear();
    setCurrentUser(null);
    setModules([]);
    setShowChangePassword(false);
    setAuthNotice(notice || null);
    setGuestView('login');
    if (window.location.hash !== '#/masuk') window.location.hash = '/masuk';
  }, []);

  // Pulihkan sesi saat halaman dibuka
  useEffect(() => {
    if (!session.getToken()) { setBooting(false); return; }
    api.me()
      .then((info) => {
        applySession(info);
        const fromHash = readHash().replace(/^app\//, '');
        const start = info.modules.includes(fromHash as ModuleId) ? fromHash : (info.modules.includes(defaultTabFor({ ...info.user, status: 'ACTIVE' }) as ModuleId) ? defaultTabFor({ ...info.user, status: 'ACTIVE' }) : info.modules[0]);
        setActiveTab(start || 'reports');
      })
      .catch(() => session.clear())
      .finally(() => setBooting(false));
  }, [applySession]);

  // Sesi kedaluwarsa / dicabut dari server, atau wajib ganti password
  useEffect(() => {
    const onExpired = () => endSession('Your session has expired. Please sign in again.');
    const onPwd = () => setCurrentUser((u) => (u ? { ...u, mustChangePassword: true } : u));
    window.addEventListener(SESSION_EVENTS.expired, onExpired);
    window.addEventListener(SESSION_EVENTS.passwordRequired, onPwd);
    return () => {
      window.removeEventListener(SESSION_EVENTS.expired, onExpired);
      window.removeEventListener(SESSION_EVENTS.passwordRequired, onPwd);
    };
  }, [endSession]);

  // Navigasi landing <-> login lewat hash (tombol back browser berfungsi)
  useEffect(() => {
    const onHash = () => {
      const h = readHash();
      if (!currentUser) setGuestView(h === 'masuk' ? 'login' : 'landing');
      else if (h.startsWith('app/')) {
        const t = h.slice(4);
        if (modules.includes(t as ModuleId)) setActiveTab(t);
      }
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [currentUser, modules]);

  // Penjaga halaman: tab yang tidak diizinkan dialihkan ke beranda peran
  useEffect(() => {
    if (currentUser && modules.length && !modules.includes(activeTab as ModuleId)) {
      setActiveTab(homeTab);
    }
  }, [currentUser, modules, activeTab, homeTab]);

  // Sinkronkan tab ke URL (refresh tidak kembali ke awal)
  useEffect(() => {
    if (currentUser && modules.includes(activeTab as ModuleId)) {
      const target = `#/app/${activeTab}`;
      if (window.location.hash !== target) history.replaceState(null, '', target);
    }
  }, [currentUser, modules, activeTab]);

  const loadAllData = useCallback(async () => {
    setIsRefreshing(true);
    // allSettled: peran yang tidak berhak atas suatu data (403) tidak membuat seluruh aplikasi gagal.
    const val = (r: PromiseSettledResult<any>): any => (r.status === 'fulfilled' ? r.value : undefined);
    try {
      const r = await Promise.allSettled([
        api.getCustomers(), api.getProducts(), api.getAssets(), api.getQuotations(), api.getSalesOrders(),
        api.getRentals(), api.getDeliveries(), api.getInvoices(), api.getPayments(), api.getVendors(),
        api.getPurchaseOrders(), api.getVendorBills(), api.getWorkOrders(), api.getAuditLogs(),
        api.getSettings(), api.getFinanceDashboard(),
      ]);
      setCustomers(val(r[0])?.data ?? []);
      setProducts(val(r[1])?.data ?? []);
      setAssets(val(r[2])?.data ?? []);
      setQuotations(val(r[3])?.data ?? []);
      setSalesOrders(val(r[4])?.data ?? []);
      setRentals(val(r[5])?.data ?? []);
      setDeliveries(val(r[6])?.data ?? []);
      setInvoices(val(r[7])?.data ?? []);
      setPayments(val(r[8])?.data ?? []);
      setVendors(val(r[9])?.data ?? []);
      setPurchaseOrders(val(r[10])?.data ?? []);
      setVendorBills(val(r[11])?.data ?? []);
      setWorkOrders(val(r[12])?.data ?? []);
      setAuditLogs(val(r[13])?.data ?? []);
      const st = val(r[14]);
      if (st) setSettings(st as SystemSettings);
      const fin: any = val(r[15]);
      if (fin?.metrics) setFinanceMetrics(fin.metrics);
    } catch (err) {
      console.error('Failed to load application data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser && currentUser.role !== 'MANAGER' && !mustChangePassword) loadAllData();
  }, [loadAllData, currentUser, mustChangePassword]);

  const handleLoginSuccess = (info: SessionInfo) => {
    setAuthNotice(null);
    applySession(info, true);
    window.location.hash = '/app';
  };

  const handleLogout = async () => {
    try { await api.logout(); } catch { /* abaikan */ }
    endSession();
    window.location.hash = '/';
    setGuestView('landing');
  };

  const handleNavigateToPayment = (invoiceId: string) => {
    setPreselectedInvoiceIdForPayment(invoiceId);
    setActiveTab('payments');
  };

  if (booting) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">Memuat…</div>;
  }

  // Not signed in: render the landing page or login screen.
  if (!currentUser) {
    return (
      <>
        {guestView === 'login' ? (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onBack={() => { setAuthNotice(null); setGuestView('landing'); window.location.hash = '/'; }}
            notice={authNotice}
          />
        ) : (
          <LandingPage onLogin={() => { setGuestView('login'); window.location.hash = '/masuk'; }} />
        )}
        <Toaster />
      </>
    );
  }

  // Wajib ganti password sebelum memakai aplikasi
  if (mustChangePassword) {
    return (
      <>
        <div className="min-h-screen bg-slate-950" />
        <ChangePasswordModal forced onLogout={handleLogout} onChanged={(info) => applySession(info, true)} />
        <Toaster />
      </>
    );
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
        allowedModules={modules}
        defaultTab={homeTab}
        onChangePassword={() => setShowChangePassword(true)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenQuickNew={() => setShowQuickNewModal(true)}
        onLogout={handleLogout}
        isRefreshing={isRefreshing}
        onRefresh={loadAllData}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
      />

      <div className="flex-1 flex min-h-0 min-w-0 overflow-hidden">
        {/* Responsive Sidebar filtered by role */}
        {modules.length > 1 && <Sidebar
          currentTab={activeTab}
          userRole={activeRole}
          allowedModules={modules}
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
        />}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-2.5 sm:p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
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
            <InvoicesView
              invoices={invoices}
              customers={customers}
              onRefresh={loadAllData}
              onNavigateToPayment={handleNavigateToPayment}
            />
          )}
          {activeTab === 'payments' && (
            <PaymentsView
              payments={payments}
              customers={customers}
              invoices={invoices}
              onRefresh={loadAllData}
              preselectedInvoiceId={preselectedInvoiceIdForPayment}
            />
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

          {activeTab === 'api-explorer' && <ApiExplorerView />}
          {activeTab === 'test-runner' && <TestRunnerView />}
          {activeTab === 'settings' && settings && (
            <SettingsView settings={settings} auditLogs={auditLogs} onRefresh={loadAllData} />
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
          {activeTab === 'manager-approvals' && <ManagerApprovalsView />}
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
      {showChangePassword && (
        <ChangePasswordModal
          onClose={() => setShowChangePassword(false)}
          onChanged={(info) => { applySession(info); setShowChangePassword(false); alert('Password changed successfully.'); }}
        />
      )}
      <DraftPersistence userId={currentUser.id} />
      <Toaster />
    </div>
  );
}
