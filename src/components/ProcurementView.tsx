import React, { useState } from 'react';
import { Vendor, PurchaseOrder, VendorBill, Product, ProcurementItemType } from '../types/index.ts';
import { api } from '../services/api.ts';
<<<<<<< HEAD
import { formatRupiahAmount } from '../shared/currency.tsx';
=======
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
import {
  PackageSearch,
  Plus,
  Truck,
  CheckCircle2,
  Boxes,
  Building,
  DollarSign,
  X,
  Trash2,
  Building2,
  FileText,
  CreditCard,
  Printer,
  Calendar,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface ProcurementViewProps {
  vendors: Vendor[];
  purchaseOrders: PurchaseOrder[];
  vendorBills: VendorBill[];
  products: Product[];
  onRefresh: () => void;
}

interface NewPoItemRow {
  productId: string;
  productName: string;
  itemType: ProcurementItemType;
  quantity: number;
  unitCost: number;
  taxRatePercent: number;
}

export const ProcurementView: React.FC<ProcurementViewProps> = ({
  vendors,
  purchaseOrders,
  vendorBills,
  products,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'PURCHASE_ORDERS' | 'VENDORS' | 'VENDOR_BILLS'>('PURCHASE_ORDERS');

  // Purchase Order State
  const [showPoModal, setShowPoModal] = useState(false);
  const [vendorId, setVendorId] = useState(vendors[0]?.id || '');
<<<<<<< HEAD
  const [poNotes, setPoNotes] = useState('Procurement of spare parts and operational services');
=======
  const [poNotes, setPoNotes] = useState('Pengadaan komponen suku cadang dan jasa operasional');
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
  const [paymentTerms, setPaymentTerms] = useState('Net 30 Hari');
  const [expectedDate, setExpectedDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );

  // Dynamic PO Items (menambahkan dan menghapus apa yang mau dibeli dan berapa banyak include pajak)
  const [poItems, setPoItems] = useState<NewPoItemRow[]>([
    {
      productId: products[0]?.id || 'PRD-NEW-1',
      productName: products[0]?.name || 'Hydraulic Main Seal Kit',
      itemType: 'GOODS',
      quantity: 5,
      unitCost: products[0]?.purchaseCost || 120,
      taxRatePercent: 11, // PPN 11%
    },
  ]);

  // Vendor Registration State (mendaftarkan nama vendor dan menghapusnya)
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [vName, setVName] = useState('');
  const [vContact, setVContact] = useState('');
  const [vEmail, setVEmail] = useState('');
  const [vPhone, setVPhone] = useState('');
  const [vTaxId, setVTaxId] = useState('');
  const [vCategory, setVCategory] = useState('Heavy Equipment Spare Parts & Logistics');
  const [vTerms, setVTerms] = useState('30');
<<<<<<< HEAD
  const [vStreet, setVStreet] = useState('Industrial Warehouse Street, Block C No. 12');
=======
  const [vStreet, setVStreet] = useState('Jl. Industri Pergudangan Blok C No. 12');
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
  const [vCity, setVCity] = useState('Jakarta Timur');

  const [loadingAction, setLoadingAction] = useState(false);
  const [selectedPoPreview, setSelectedPoPreview] = useState<PurchaseOrder | null>(null);

  // Add Item Row to PO
  const handleAddItemRow = () => {
    const firstProd = products[0];
    setPoItems([
      ...poItems,
      {
        productId: firstProd?.id || `PRD-CUSTOM-${Date.now().toString().slice(-4)}`,
<<<<<<< HEAD
        productName: firstProd?.name || 'New Procurement Item',
=======
        productName: firstProd?.name || 'Item Pengadaan Baru',
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
        itemType: 'GOODS',
        quantity: 1,
        unitCost: firstProd?.purchaseCost || 100,
        taxRatePercent: 11,
      },
    ]);
  };

  // Remove Item Row from PO
  const handleRemoveItemRow = (index: number) => {
    if (poItems.length > 1) {
      setPoItems(poItems.filter((_, idx) => idx !== index));
    }
  };

  // Update item field
  const handleItemFieldChange = (index: number, field: keyof NewPoItemRow, value: any) => {
    const updated = [...poItems];
    (updated[index] as any)[field] = value;

    // If product selection changed
    if (field === 'productId') {
      const prod = products.find((p) => p.id === value);
      if (prod) {
        updated[index].productName = prod.name;
        updated[index].unitCost = prod.purchaseCost || 100;
        updated[index].itemType = prod.productType === 'SERVICE' ? 'SERVICE' : 'GOODS';
      }
    }

    setPoItems(updated);
  };

  // Calculate PO subtotal, tax and total
  const calculatedSubtotal = poItems.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
  const calculatedTax = poItems.reduce((sum, item) => sum + item.quantity * item.unitCost * (item.taxRatePercent / 100), 0);
  const calculatedGrandTotal = calculatedSubtotal + calculatedTax;

  // Submit PO
  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId) {
<<<<<<< HEAD
      alert('Please select a vendor first.');
=======
      alert('Pilih vendor supplier terlebih dahulu.');
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
      return;
    }

    setLoadingAction(true);
    try {
      await api.createPurchaseOrder({
        vendorId,
        paymentTerms,
        expectedDate,
        notes: poNotes,
        items: poItems,
      });

<<<<<<< HEAD
      alert('Purchase Order (PO) submitted and awaiting Manager approval. The vendor bill will be created after approval.');
      setShowPoModal(false);
      onRefresh();
    } catch (err: any) {
      alert(`Failed to create PO: ${err.message}`);
=======
      alert(
        'Purchase Order (PO) berhasil dibuat! Tagihan Vendor (Accounts Payable) langsung terintegrasi secara otomatis ke Tim Finance.'
      );
      setShowPoModal(false);
      onRefresh();
    } catch (err: any) {
      alert(`Gagal membuat PO: ${err.message}`);
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
    } finally {
      setLoadingAction(false);
    }
  };

  // Delete / Cancel PO
  const handleDeletePo = async (poId: string) => {
<<<<<<< HEAD
    if (!confirm('Are you sure you want to cancel and delete this Purchase Order?')) return;
    try {
      await api.deletePurchaseOrder(poId);
      alert('Purchase Order cancelled and deleted successfully.');
      onRefresh();
    } catch (err: any) {
      alert(`Failed to delete PO: ${err.message}`);
=======
    if (!confirm('Apakah Anda yakin ingin membatalkan dan menghapus Purchase Order ini?')) return;
    try {
      await api.deletePurchaseOrder(poId);
      alert('Purchase Order berhasil dibatalkan dan dihapus.');
      onRefresh();
    } catch (err: any) {
      alert(`Gagal menghapus PO: ${err.message}`);
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
    }
  };

  // Receive Goods & Services
  const handleReceiveGoods = async (po: PurchaseOrder) => {
    try {
      await api.receivePurchaseOrder(po.id);
<<<<<<< HEAD
      alert(`Items/services from PO ${po.poNumber} received successfully! Warehouse stock has been updated and the bill is ready for Finance.`);
      onRefresh();
    } catch (err: any) {
      alert(`Failed to receive delivery: ${err.message}`);
=======
      alert(`Barang/Jasa dari PO ${po.poNumber} berhasil diterima! Stok gudang telah bertambah dan tagihan siap diproses Finance.`);
      onRefresh();
    } catch (err: any) {
      alert(`Gagal menerima pengiriman: ${err.message}`);
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
    }
  };

  // Register New Vendor
  const handleRegisterVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vName.trim()) {
<<<<<<< HEAD
      alert('Vendor name is required.');
=======
      alert('Nama vendor wajib diisi.');
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
      return;
    }

    setLoadingAction(true);
    try {
      await api.createVendor({
        name: vName.trim(),
        contactName: vContact || 'Sales Representative',
        email: vEmail || `${vName.toLowerCase().replace(/[^a-z0-9]/g, '')}@supplier.com`,
        phone: vPhone || '+62 21-555-8899',
        taxId: vTaxId || '01.888.777.6-012.000',
        category: vCategory,
        paymentTerms: parseInt(vTerms, 10) || 30,
        address: {
          street: vStreet,
          city: vCity,
          state: 'DKI Jakarta',
          postalCode: '13920',
          country: 'Indonesia',
        },
      });

<<<<<<< HEAD
      alert(`Vendor "${vName}" registered successfully!`);
=======
      alert(`Vendor "${vName}" berhasil didaftarkan ke sistem rekanan!`);
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
      setShowAddVendorModal(false);
      setVName('');
      setVContact('');
      setVEmail('');
      setVPhone('');
      onRefresh();
    } catch (err: any) {
<<<<<<< HEAD
      alert(`Failed to register vendor: ${err.message}`);
=======
      alert(`Gagal mendaftarkan vendor: ${err.message}`);
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
    } finally {
      setLoadingAction(false);
    }
  };

  // Delete Vendor
  const handleDeleteVendor = async (id: string, name: string) => {
<<<<<<< HEAD
    if (!confirm(`Are you sure you want to remove vendor "${name}" from the vendor directory?`)) return;
    try {
      await api.deleteVendor(id);
      alert(`Vendor "${name}" deleted successfully.`);
      onRefresh();
    } catch (err: any) {
      alert(`Failed to delete vendor: ${err.message}`);
=======
    if (!confirm(`Apakah Anda yakin ingin menghapus vendor "${name}" dari daftar rekanan?`)) return;
    try {
      await api.deleteVendor(id);
      alert(`Vendor "${name}" berhasil dihapus.`);
      onRefresh();
    } catch (err: any) {
      alert(`Gagal menghapus vendor: ${err.message}`);
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
    }
  };

  // Settle / Pay Vendor Bill (Finance Integration)
  const handlePayBill = async (billId: string) => {
<<<<<<< HEAD
    if (!confirm('Process this vendor bill payment through the Finance bank/cash account?')) return;
    try {
      await api.payVendorBill(billId);
      alert('Vendor bill paid and settled by the Finance team!');
      onRefresh();
    } catch (err: any) {
      alert(`Failed to process payment: ${err.message}`);
=======
    if (!confirm('Proses pembayaran tagihan vendor ini melalui akun Bank/Kas Finance?')) return;
    try {
      await api.payVendorBill(billId);
      alert('Tagihan vendor berhasil dibayarkan dan diselesaikan oleh Tim Finance!');
      onRefresh();
    } catch (err: any) {
      alert(`Gagal memproses pembayaran: ${err.message}`);
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 border border-slate-200 rounded-md">
        <div className="flex items-center gap-2">
          <PackageSearch className="w-5 h-5 text-slate-700" />
          <h2 className="text-base font-bold text-slate-900">
<<<<<<< HEAD
            Procurement, Vendor Purchasing &amp; Finance Billing Integration
=======
            Procurement, Pengadaan Vendor &amp; Integrasi Tagihan Finance
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
          </h2>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowAddVendorModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded transition-colors cursor-pointer"
          >
            <Building2 className="w-4 h-4 text-slate-600" />
<<<<<<< HEAD
            + Register New Vendor
=======
            + Daftarkan Vendor Baru
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
          </button>

          <button
            onClick={() => setShowPoModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
<<<<<<< HEAD
            Create Purchase Order (PO)
=======
            Buat Purchase Order (PO)
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 pt-2 rounded-t-lg shadow-2xs gap-3">
        <button
          onClick={() => setActiveTab('PURCHASE_ORDERS')}
          className={`pb-3 px-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'PURCHASE_ORDERS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 text-indigo-600" />
          Purchase Orders ({purchaseOrders.length})
        </button>

        <button
          onClick={() => setActiveTab('VENDORS')}
          className={`pb-3 px-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'VENDORS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-4 h-4 text-emerald-600" />
<<<<<<< HEAD
          Vendor Directory ({vendors.length})
=======
          Daftar Rekanan Vendor ({vendors.length})
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
        </button>

        <button
          onClick={() => setActiveTab('VENDOR_BILLS')}
          className={`pb-3 px-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'VENDOR_BILLS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4 text-amber-600" />
<<<<<<< HEAD
          Finance Bills ({vendorBills.length})
=======
          Tagihan Terintegrasi Tim Finance ({vendorBills.length})
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
        </button>
      </div>

      {/* TAB 1: PURCHASE ORDERS */}
      {activeTab === 'PURCHASE_ORDERS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {purchaseOrders.map((po) => (
              <div
                key={po.id}
                className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setSelectedPoPreview(po)}
                      className="font-mono font-bold text-xs bg-slate-900 text-amber-400 hover:bg-slate-800 hover:text-amber-300 px-2 py-0.5 rounded cursor-pointer transition-colors"
<<<<<<< HEAD
                      title="Open the official purchase order"
=======
                      title="Klik untuk membuka view data dokumen Purchase Order resmi"
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                    >
                      {po.poNumber}
                    </button>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        po.status === 'GOODS_RECEIVED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-blue-100 text-blue-800 border border-blue-300'
                      }`}
                    >
<<<<<<< HEAD
                      {po.status === 'GOODS_RECEIVED' ? 'RECEIVED (STOCK UPDATED)' : 'APPROVED / PENDING'}
=======
                      {po.status === 'GOODS_RECEIVED' ? 'DITERIMA (STOK BERTAMBAH)' : 'DISETUJUI / MENUNGGU'}
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{po.vendorName}</h3>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>Term: <strong>{po.paymentTerms || 'Net 30'}</strong></span>
                      <span>·</span>
                      <span>Order: {po.orderDate}</span>
                    </div>
                  </div>

                  {/* PO Items Summary */}
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs space-y-1">
<<<<<<< HEAD
                    <div className="text-[10px] uppercase font-bold text-slate-400">Items &amp; Services:</div>
                    {po.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-slate-700 text-[11px]">
                        <span>
                          {item.quantity}x [{item.itemType || 'GOODS'}] {item.productName}
                        </span>
                        <span className="font-mono font-semibold">{formatRupiahAmount(item.totalCost)}</span>
                      </div>
                    ))}
                    <div className="pt-1.5 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-xs">
                      <span>Grand Total (Including Tax):</span>
                      <span className="font-mono text-emerald-700">{formatRupiahAmount(po.grandTotal)}</span>
=======
                    <div className="text-[10px] uppercase font-bold text-slate-400">Rincian Barang &amp; Jasa:</div>
                    {po.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-slate-700 text-[11px]">
                        <span>
                          {item.quantity}x [{item.itemType || 'BARANG'}] {item.productName}
                        </span>
                        <span className="font-mono font-semibold">${item.totalCost.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="pt-1.5 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-xs">
                      <span>Grand Total (Inc. Pajak):</span>
                      <span className="font-mono text-emerald-700">${po.grandTotal.toFixed(2)}</span>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setSelectedPoPreview(po)}
                      className="px-2 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3 h-3" />
<<<<<<< HEAD
                      Print PO
=======
                      Cetak PO
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                    </button>

                    {po.status !== 'GOODS_RECEIVED' && (
                      <button
                        onClick={() => handleDeletePo(po.id)}
                        className="px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
<<<<<<< HEAD
                        Delete
=======
                        Hapus
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                      </button>
                    )}
                  </div>

                  {po.status !== 'GOODS_RECEIVED' && (
                    <button
                      onClick={() => handleReceiveGoods(po)}
                      className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
<<<<<<< HEAD
                      Receive Items &amp; Services
=======
                      Terima Barang &amp; Jasa
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: VENDOR DIRECTORY & REGISTRATION */}
      {activeTab === 'VENDORS' && (
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
<<<<<<< HEAD
              <h3 className="text-sm font-bold text-slate-900">Vendor &amp; Supplier Directory</h3>
              <p className="text-xs text-slate-500">
                Central directory of vendors for spare parts, heavy equipment, lubricants, and technical services.
=======
              <h3 className="text-sm font-bold text-slate-900">Daftar Rekanan Vendor &amp; Supplier</h3>
              <p className="text-xs text-slate-500">
                Pusat data mitra supplier suku cadang, armada alat berat, pelumas, dan penyedia jasa teknis.
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
              </p>
            </div>
            <button
              onClick={() => setShowAddVendorModal(true)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
<<<<<<< HEAD
              Register New Vendor
=======
              Daftarkan Vendor Baru
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[10px]">
                <tr>
<<<<<<< HEAD
                  <th className="p-2.5">Vendor Code &amp; Name</th>
                  <th className="p-2.5">Vendor Category</th>
                  <th className="p-2.5">Contact Person &amp; Phone</th>
                  <th className="p-2.5">Business Email</th>
                  <th className="p-2.5">Company Tax ID</th>
                  <th className="p-2.5">Payment Term</th>
                  <th className="p-2.5 text-center">Actions</th>
=======
                  <th className="p-2.5">Kode &amp; Nama Vendor</th>
                  <th className="p-2.5">Kategori Rekanan</th>
                  <th className="p-2.5">Kontak Person &amp; Telp</th>
                  <th className="p-2.5">Email Resmi</th>
                  <th className="p-2.5">NPWP Perusahaan</th>
                  <th className="p-2.5">Payment Term</th>
                  <th className="p-2.5 text-center">Aksi</th>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendors.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="p-2.5">
                      <div className="font-bold text-slate-900">{v.name}</div>
                      <span className="font-mono text-[10px] text-slate-500">{v.vendorCode}</span>
                    </td>
                    <td className="p-2.5 text-slate-700">{v.category}</td>
                    <td className="p-2.5">
                      <div className="font-semibold text-slate-800">{v.contactName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{v.phone}</div>
                    </td>
                    <td className="p-2.5 text-slate-600 font-mono text-[11px]">{v.email}</td>
                    <td className="p-2.5 font-mono text-slate-700 text-[11px]">{v.taxId}</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-semibold bg-slate-100 text-slate-700">
                        Net {v.paymentTerms} Hari
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      <button
                        onClick={() => handleDeleteVendor(v.id, v.name)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
<<<<<<< HEAD
                        title="Delete Vendor"
=======
                        title="Hapus Vendor"
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TAGIHAN VENDOR TERINTEGRASI TIM FINANCE */}
      {activeTab === 'VENDOR_BILLS' && (
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
<<<<<<< HEAD
                Vendor Bills (Accounts Payable) for Finance
              </h3>
              <p className="text-xs text-slate-500">
                Each purchase order automatically sends a vendor bill to Finance &amp; Tax for verification and payment according to the agreed terms.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
              {vendorBills.length} Bills
=======
                Integrasi Tagihan Vendor (Accounts Payable) ke Tim Finance
              </h3>
              <p className="text-xs text-slate-500">
                Setiap Purchase Order otomatis mengirimkan voucher tagihan ke Tim Finance &amp; Tax untuk diverifikasi dan dibayarkan sesuai payment term.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
              {vendorBills.length} Tagihan Terdaftar
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[10px]">
                <tr>
<<<<<<< HEAD
                  <th className="p-2.5">Bill Number</th>
                  <th className="p-2.5">PO Reference</th>
                  <th className="p-2.5">Vendor Name</th>
                  <th className="p-2.5">Bill Date</th>
                  <th className="p-2.5">Due Date</th>
                  <th className="p-2.5 text-right">Bill Amount</th>
                  <th className="p-2.5 text-center">Payment Status</th>
                  <th className="p-2.5 text-center">Finance Actions</th>
=======
                  <th className="p-2.5">Nomor Tagihan Bill</th>
                  <th className="p-2.5">Rujukan PO</th>
                  <th className="p-2.5">Nama Vendor</th>
                  <th className="p-2.5">Tgl Tagihan</th>
                  <th className="p-2.5">Jatuh Tempo</th>
                  <th className="p-2.5 text-right">Nominal Tagihan</th>
                  <th className="p-2.5 text-center">Status Pembayaran</th>
                  <th className="p-2.5 text-center">Aksi Finance</th>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendorBills.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-bold text-slate-900">{b.billNumber}</td>
                    <td className="p-2.5 font-mono text-slate-600">{b.purchaseOrderId || '—'}</td>
                    <td className="p-2.5 font-medium text-slate-800">{b.vendorName}</td>
                    <td className="p-2.5 font-mono text-slate-600">{b.billDate}</td>
                    <td className="p-2.5 font-mono text-slate-600">{b.dueDate}</td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-900">
<<<<<<< HEAD
                      {formatRupiahAmount(b.amount)}
=======
                      ${b.amount.toFixed(2)}
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                    </td>
                    <td className="p-2.5 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          b.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
<<<<<<< HEAD
                        {b.status === 'PAID' ? 'PAID' : 'UNPAID'}
=======
                        {b.status === 'PAID' ? 'LUNAS (PAID)' : 'BELUM DIBAYAR (UNPAID)'}
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      {b.status !== 'PAID' ? (
                        <button
                          onClick={() => handlePayBill(b.id)}
                          className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded cursor-pointer"
                        >
<<<<<<< HEAD
                          Pay Bill
                        </button>
                      ) : (
                        <span className="text-emerald-700 font-semibold text-[11px] flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Complete
=======
                          Bayar Tagihan
                        </button>
                      ) : (
                        <span className="text-emerald-700 font-semibold text-[11px] flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: CREATE PURCHASE ORDER (PO DENGAN TAMBAH & HAPUS ITEM, BARANG/JASA, PAJAK, PAYMENT TERM) */}
      {showPoModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-3xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
<<<<<<< HEAD
                <h3 className="font-bold text-slate-900 text-base">Create Purchase Order (PO)</h3>
                <p className="text-xs text-slate-500">
                  Add goods or services, calculate tax automatically, and integrate directly with Finance.
=======
                <h3 className="font-bold text-slate-900 text-base">Buat Purchase Order (PO) Baru</h3>
                <p className="text-xs text-slate-500">
                  Tambahkan barang/jasa yang akan dibeli, kalkulasi pajak otomatis, dan integrasikan langsung ke tim Finance.
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                </p>
              </div>
              <button onClick={() => setShowPoModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePo} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
<<<<<<< HEAD
                  <label className="block text-slate-700 font-semibold mb-1">Select Vendor *</label>
=======
                  <label className="block text-slate-700 font-semibold mb-1">Pilih Vendor Rekanan *</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  <select
                    value={vendorId}
                    onChange={(e) => setVendorId(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded outline-none"
                  >
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
<<<<<<< HEAD
                  <label className="block text-slate-700 font-semibold mb-1">Payment Terms *</label>
=======
                  <label className="block text-slate-700 font-semibold mb-1">Syarat Pembayaran (Payment Term) *</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded outline-none"
                  >
                    <option value="Net 15 Hari">Net 15 Hari</option>
                    <option value="Net 30 Hari">Net 30 Hari</option>
                    <option value="Net 60 Hari">Net 60 Hari</option>
                    <option value="Cash On Delivery (COD)">Cash On Delivery (COD)</option>
                    <option value="Down Payment 50% &amp; Pelunasan">Down Payment 50% &amp; Pelunasan</option>
                  </select>
                </div>

                <div>
<<<<<<< HEAD
                  <label className="block text-slate-700 font-semibold mb-1">Target Delivery Date</label>
=======
                  <label className="block text-slate-700 font-semibold mb-1">Target Tanggal Pengiriman</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded outline-none font-mono"
                  />
                </div>
              </div>

              {/* Dynamic PO Item Builder (Menambahkan & Menghapus Item Belanja) */}
              <div className="border border-slate-200 rounded-md p-3 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 uppercase text-[11px]">
<<<<<<< HEAD
                    Items &amp; Services to Purchase
=======
                    Daftar Barang &amp; Jasa Yang Akan Dibeli
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="px-2.5 py-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 border border-indigo-200 rounded flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
<<<<<<< HEAD
                    + Add Purchase Item
=======
                    + Tambah Baris Pembelian
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  </button>
                </div>

                <div className="space-y-2">
                  {poItems.map((item, idx) => (
                    <div key={idx} className="bg-white p-2.5 rounded border border-slate-200 grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-2">
<<<<<<< HEAD
                        <label className="block text-[10px] text-slate-400 font-semibold">Type</label>
=======
                        <label className="block text-[10px] text-slate-400 font-semibold">Tipe</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                        <select
                          value={item.itemType}
                          onChange={(e) => handleItemFieldChange(idx, 'itemType', e.target.value)}
                          className="w-full p-1.5 border border-slate-300 rounded text-xs outline-none font-semibold text-slate-800"
                        >
<<<<<<< HEAD
                          <option value="GOODS">GOODS</option>
                          <option value="SERVICE">SERVICE</option>
=======
                          <option value="GOODS">BARANG</option>
                          <option value="SERVICE">JASA</option>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                        </select>
                      </div>

                      <div className="col-span-4">
<<<<<<< HEAD
                        <label className="block text-[10px] text-slate-400 font-semibold">Item / Spare Part Name</label>
=======
                        <label className="block text-[10px] text-slate-400 font-semibold">Nama Item / Suku Cadang</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                        <input
                          type="text"
                          value={item.productName}
                          onChange={(e) => handleItemFieldChange(idx, 'productName', e.target.value)}
                          className="w-full p-1.5 border border-slate-300 rounded text-xs outline-none"
                        />
                      </div>

                      <div className="col-span-2">
<<<<<<< HEAD
                        <label className="block text-[10px] text-slate-400 font-semibold">Quantity</label>
=======
                        <label className="block text-[10px] text-slate-400 font-semibold">Banyaknya / Qty</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemFieldChange(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                          className="w-full p-1.5 border border-slate-300 rounded text-xs font-mono outline-none"
                        />
                      </div>

                      <div className="col-span-2">
<<<<<<< HEAD
                        <label className="block text-[10px] text-slate-400 font-semibold">Unit Price (IDR)</label>
=======
                        <label className="block text-[10px] text-slate-400 font-semibold">Harga Satuan ($)</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                        <input
                          type="number"
                          value={item.unitCost}
                          onChange={(e) => handleItemFieldChange(idx, 'unitCost', parseFloat(e.target.value) || 0)}
                          className="w-full p-1.5 border border-slate-300 rounded text-xs font-mono outline-none"
                        />
                      </div>

                      <div className="col-span-1">
<<<<<<< HEAD
                        <label className="block text-[10px] text-slate-400 font-semibold">Tax %</label>
=======
                        <label className="block text-[10px] text-slate-400 font-semibold">Pajak %</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                        <input
                          type="number"
                          value={item.taxRatePercent}
                          onChange={(e) => handleItemFieldChange(idx, 'taxRatePercent', parseFloat(e.target.value) || 0)}
                          className="w-full p-1.5 border border-slate-300 rounded text-xs font-mono outline-none"
                        />
                      </div>

                      <div className="col-span-1 text-center pb-1">
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
<<<<<<< HEAD
                          title="Delete item row"
=======
                          title="Hapus baris item"
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Calculation summary */}
                <div className="flex justify-end pt-2">
                  <div className="w-64 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-600">
<<<<<<< HEAD
                      <span>Purchase Subtotal:</span>
                      <span className="font-mono">{formatRupiahAmount(calculatedSubtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Tax Included:</span>
                      <span className="font-mono">{formatRupiahAmount(calculatedTax)}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-300 font-bold text-slate-900 text-sm">
                      <span>Grand Total (Including Tax):</span>
                      <span className="font-mono text-emerald-700">{formatRupiahAmount(calculatedGrandTotal)}</span>
=======
                      <span>Subtotal Belanja:</span>
                      <span className="font-mono">${calculatedSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>PPN Termasuk:</span>
                      <span className="font-mono">${calculatedTax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-300 font-bold text-slate-900 text-sm">
                      <span>Grand Total (Inc. Pajak):</span>
                      <span className="font-mono text-emerald-700">${calculatedGrandTotal.toFixed(2)}</span>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                    </div>
                  </div>
                </div>
              </div>

              <div>
<<<<<<< HEAD
                <label className="block text-slate-700 font-semibold mb-1">Additional PO Notes</label>
=======
                <label className="block text-slate-700 font-semibold mb-1">Catatan Tambahan PO</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                <textarea
                  rows={2}
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-xs outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowPoModal(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded font-semibold cursor-pointer"
                >
<<<<<<< HEAD
                  Cancel
=======
                  Batal
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {loadingAction ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-amber-400" />}
<<<<<<< HEAD
                  Issue Purchase Order &amp; Send to Finance
=======
                  Terbitkan Purchase Order &amp; Kirim ke Finance
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DAFTARKAN VENDOR BARU */}
      {showAddVendorModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
<<<<<<< HEAD
                Register New Vendor / Supplier
=======
                Daftarkan Nama Vendor / Supplier Baru
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
              </h3>
              <button onClick={() => setShowAddVendorModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterVendor} className="space-y-3 text-xs">
              <div>
<<<<<<< HEAD
                <label className="block text-slate-700 font-semibold mb-1">Vendor Company Name *</label>
                <input
                  type="text"
                  placeholder="e.g., PT Trakindo Utama Parts, PT Komatsu Mitra Sejahtera"
=======
                <label className="block text-slate-700 font-semibold mb-1">Nama Perusahaan Vendor *</label>
                <input
                  type="text"
                  placeholder="cth: PT Trakindo Utama Parts, PT Komatsu Mitra Sejahtera"
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  value={vName}
                  onChange={(e) => setVName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
<<<<<<< HEAD
                  <label className="block text-slate-700 font-semibold mb-1">Vendor Category</label>
=======
                  <label className="block text-slate-700 font-semibold mb-1">Kategori Rekanan</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  <select
                    value={vCategory}
                    onChange={(e) => setVCategory(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded outline-none"
                  >
<<<<<<< HEAD
                    <option value="Heavy Equipment Spare Parts">Heavy Equipment Spare Parts</option>
                    <option value="Heavy Machinery Supplier">Heavy Equipment Supplier</option>
                    <option value="Technical Services & Calibration">Service &amp; Calibration</option>
                    <option value="Lubricants & Consumables">Oils, Lubricants &amp; Fuel</option>
                    <option value="Office & General Supplies">Office &amp; General Supplies</option>
=======
                    <option value="Heavy Equipment Spare Parts">Suku Cadang Alat Berat</option>
                    <option value="Heavy Machinery Supplier">Penyedia Unit Alat Berat</option>
                    <option value="Technical Services & Calibration">Jasa Servis &amp; Kalibrasi</option>
                    <option value="Lubricants & Consumables">Oli, Pelumas &amp; Bahan Bakar</option>
                    <option value="Office & General Supplies">Pengadaan Umum / Kantor</option>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  </select>
                </div>

                <div>
<<<<<<< HEAD
                  <label className="block text-slate-700 font-semibold mb-1">Payment Terms (Days)</label>
=======
                  <label className="block text-slate-700 font-semibold mb-1">Payment Term (Hari)</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  <input
                    type="number"
                    value={vTerms}
                    onChange={(e) => setVTerms(e.target.value)}
                    placeholder="30"
                    className="w-full p-2 border border-slate-300 rounded font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
<<<<<<< HEAD
                  <label className="block text-slate-700 font-semibold mb-1">Contact Person</label>
=======
                  <label className="block text-slate-700 font-semibold mb-1">Kontak Person (PIC)</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  <input
                    type="text"
                    value={vContact}
                    onChange={(e) => setVContact(e.target.value)}
                    placeholder="Budi Santoso"
                    className="w-full p-2 border border-slate-300 rounded outline-none"
                  />
                </div>

                <div>
<<<<<<< HEAD
                  <label className="block text-slate-700 font-semibold mb-1">Phone Number</label>
=======
                  <label className="block text-slate-700 font-semibold mb-1">Nomor Telepon</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  <input
                    type="text"
                    value={vPhone}
                    onChange={(e) => setVPhone(e.target.value)}
                    placeholder="+62 21-555-8899"
                    className="w-full p-2 border border-slate-300 rounded font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
<<<<<<< HEAD
                  <label className="block text-slate-700 font-semibold mb-1">Company Email</label>
=======
                  <label className="block text-slate-700 font-semibold mb-1">Email Perusahaan</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  <input
                    type="email"
                    value={vEmail}
                    onChange={(e) => setVEmail(e.target.value)}
                    placeholder="sales@supplier.com"
                    className="w-full p-2 border border-slate-300 rounded outline-none"
                  />
                </div>

                <div>
<<<<<<< HEAD
                  <label className="block text-slate-700 font-semibold mb-1">Company Tax ID (NPWP)</label>
=======
                  <label className="block text-slate-700 font-semibold mb-1">NPWP / Tax ID</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  <input
                    type="text"
                    value={vTaxId}
                    onChange={(e) => setVTaxId(e.target.value)}
                    placeholder="01.888.777.6-012.000"
                    className="w-full p-2 border border-slate-300 rounded font-mono outline-none"
                  />
                </div>
              </div>

              <div>
<<<<<<< HEAD
                <label className="block text-slate-700 font-semibold mb-1">Office / Warehouse Address</label>
=======
                <label className="block text-slate-700 font-semibold mb-1">Alamat Kantor / Pergudangan</label>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                <input
                  type="text"
                  value={vStreet}
                  onChange={(e) => setVStreet(e.target.value)}
<<<<<<< HEAD
                  placeholder="Pulogadung Industrial Estate, Block C"
=======
                  placeholder="Kawasan Industri Pulogadung Blok C"
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  className="w-full p-2 border border-slate-300 rounded outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddVendorModal(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded font-semibold cursor-pointer"
                >
<<<<<<< HEAD
                  Cancel
=======
                  Batal
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold cursor-pointer disabled:opacity-50"
                >
<<<<<<< HEAD
                  Save Vendor
=======
                  Simpan Vendor
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CETAK PO PREVIEW */}
      {selectedPoPreview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-6 text-slate-900 space-y-4">
            <div className="flex justify-between items-start pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
                  Official Purchase Order (PO)
                </h2>
                <p className="text-xs text-slate-500">PT Apex Commercial Assets Indonesia · Procurement Dept.</p>
              </div>
              <button onClick={() => setSelectedPoPreview(null)} className="text-slate-400 hover:text-slate-700 no-print">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded border border-slate-200 font-mono">
                <div>
<<<<<<< HEAD
                  <span className="text-slate-400 block text-[10px]">PO Number:</span>
                  <span className="font-bold text-slate-900">{selectedPoPreview.poNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Order Date:</span>
                  <span className="font-bold text-slate-900">{selectedPoPreview.orderDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Vendor / Supplier:</span>
                  <span className="font-bold text-slate-900">{selectedPoPreview.vendorName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Payment Terms:</span>
=======
                  <span className="text-slate-400 block text-[10px]">Nomor PO:</span>
                  <span className="font-bold text-slate-900">{selectedPoPreview.poNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Tanggal Pemesanan:</span>
                  <span className="font-bold text-slate-900">{selectedPoPreview.orderDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Vendor Supplier:</span>
                  <span className="font-bold text-slate-900">{selectedPoPreview.vendorName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Syarat Pembayaran:</span>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  <span className="font-bold text-slate-900">{selectedPoPreview.paymentTerms || 'Net 30'}</span>
                </div>
              </div>

              <table className="w-full text-left text-xs border border-slate-200 rounded">
                <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[10px]">
                  <tr>
<<<<<<< HEAD
                    <th className="p-2">Item Description</th>
                    <th className="p-2">Type</th>
                    <th className="p-2 text-right">Qty</th>
                    <th className="p-2 text-right">Unit Price</th>
=======
                    <th className="p-2">Item Deskripsi</th>
                    <th className="p-2">Tipe</th>
                    <th className="p-2 text-right">Qty</th>
                    <th className="p-2 text-right">Harga Satuan</th>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedPoPreview.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-medium">{it.productName}</td>
<<<<<<< HEAD
                      <td className="p-2 text-[10px]">{it.itemType || 'GOODS'}</td>
                      <td className="p-2 text-right font-mono">{it.quantity}</td>
                      <td className="p-2 text-right font-mono">{formatRupiahAmount(it.unitCost)}</td>
                      <td className="p-2 text-right font-mono font-bold">{formatRupiahAmount(it.totalCost)}</td>
=======
                      <td className="p-2 text-[10px]">{it.itemType || 'BARANG'}</td>
                      <td className="p-2 text-right font-mono">{it.quantity}</td>
                      <td className="p-2 text-right font-mono">${it.unitCost.toFixed(2)}</td>
                      <td className="p-2 text-right font-mono font-bold">${it.totalCost.toFixed(2)}</td>
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end pt-2">
                <div className="text-right space-y-1 font-mono">
<<<<<<< HEAD
                  <div className="text-slate-600">Subtotal: {formatRupiahAmount(selectedPoPreview.subtotal)}</div>
                  <div className="text-slate-600">VAT (11%): {formatRupiahAmount(selectedPoPreview.taxAmount)}</div>
                  <div className="text-base font-bold text-slate-900 pt-1 border-t border-slate-300">
                    Grand Total: {formatRupiahAmount(selectedPoPreview.grandTotal)}
=======
                  <div className="text-slate-600">Subtotal: ${selectedPoPreview.subtotal.toFixed(2)}</div>
                  <div className="text-slate-600">PPN (11%): ${selectedPoPreview.taxAmount.toFixed(2)}</div>
                  <div className="text-base font-bold text-slate-900 pt-1 border-t border-slate-300">
                    Grand Total: ${selectedPoPreview.grandTotal.toFixed(2)}
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 no-print">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded flex items-center gap-1.5 hover:bg-slate-800 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Cetak ke Kertas / PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
