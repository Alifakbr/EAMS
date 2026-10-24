import React, { useMemo, useState } from 'react';
import type { Invoice, Payment, PurchaseOrder, VendorBill } from '../types/index.ts';
import { Download, Search, TrendingDown, TrendingUp, Wallet, SlidersHorizontal } from 'lucide-react';

type Props = { invoices: Invoice[]; payments: Payment[]; purchaseOrders: PurchaseOrder[]; vendorBills: VendorBill[] };
type Tx = { id: string; number: string; date: string; party: string; kind: 'INCOME' | 'EXPENSE'; status: string; amount: number; source: string; category: string; evidence?: string; tax?: number; paymentTerm?: string };
const money = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);
const isoToday = new Date().toISOString().slice(0, 10);
const csvCell = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;

export const FinanceOverviewView: React.FC<Props> = ({ invoices, payments, purchaseOrders, vendorBills }) => {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('ALL');
  const [category, setCategory] = useState('ALL');
  const [source, setSource] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [fromDate, setFromDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(isoToday);
  const [taxRate, setTaxRate] = useState('11');
  const [showTax, setShowTax] = useState(false);

  const tx: Tx[] = useMemo(() => [
    ...invoices.map(x => ({ id: x.id, number: x.invoiceNumber, date: x.issueDate, party: x.customerName, kind: 'INCOME' as const, status: x.status, amount: Number(x.grandTotal) || 0, source: 'Invoice / AR', category: 'Customer Receivable', evidence: (x as any).attachmentName, tax: Number((x as any).taxAmount) || 0, paymentTerm: `Net ${x.paymentTermsDays || 30} days` })),
    ...payments.map(x => ({ id: x.id, number: x.paymentNumber, date: x.paymentDate, party: x.customerName, kind: 'INCOME' as const, status: x.status, amount: Number(x.amount) || 0, source: 'Penerimaan pembayaran', category: 'Cash Receipt', evidence: (x as any).attachmentName || (x as any).proofFileName, tax: 0, paymentTerm: 'Actual receipt' })),
    ...purchaseOrders.map(x => ({ id: x.id, number: x.poNumber, date: x.orderDate, party: x.vendorName, kind: 'EXPENSE' as const, status: x.status, amount: Number(x.grandTotal) || 0, source: 'Purchase Order', category: 'Procurement', evidence: (x as any).attachmentName, tax: Number((x as any).taxAmount) || 0, paymentTerm: x.paymentTerms || 'Not set' })),
    ...vendorBills.map(x => ({ id: x.id, number: x.billNumber, date: x.billDate, party: x.vendorName, kind: 'EXPENSE' as const, status: x.status, amount: Number(x.amount) || 0, source: 'Vendor Bill / AP', category: 'Accounts Payable', evidence: (x as any).attachmentName || (x as any).proofFileName, tax: Number((x as any).taxAmount) || 0, paymentTerm: x.dueDate ? `Due ${x.dueDate}` : 'Not set' })),
  ].sort((a, b) => String(b.date).localeCompare(String(a.date))), [invoices, payments, purchaseOrders, vendorBills]);

  const filtered = tx.filter(x =>
    (kind === 'ALL' || x.kind === kind) && (category === 'ALL' || x.category === category) &&
    (source === 'ALL' || x.source === source) && (status === 'ALL' || x.status === status) &&
    (!fromDate || (x.date || '') >= fromDate) && (!toDate || (x.date || '') <= toDate) &&
    [x.number, x.party, x.source, x.category, x.status, x.paymentTerm || ''].some(v => v.toLowerCase().includes(query.toLowerCase()))
  );
  const income = filtered.filter(x => x.kind === 'INCOME').reduce((s, x) => s + x.amount, 0);
  const expense = filtered.filter(x => x.kind === 'EXPENSE').reduce((s, x) => s + x.amount, 0);
  const rate = Math.min(100, Math.max(0, Number(taxRate) || 0));
  const exportExcel = () => {
    const rows = [['Tanggal', 'Nomor Transaksi', 'Arus', 'Kategori', 'Sumber', 'Pihak', 'Status', 'Payment Term / Due', 'Nilai Bruto IDR', 'Pajak Record IDR', `Pajak Simulasi ${rate}% IDR`, 'Lampiran Bukti']];
    filtered.forEach(x => rows.push([x.date || '', x.number, x.kind, x.category, x.source, x.party, x.status, x.paymentTerm || '', String(x.amount), String(x.tax || 0), String(Math.round(x.amount * rate / 100)), x.evidence || 'Belum tersedia']));
    const csv = '\ufeff' + rows.map(r => r.map(csvCell).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = `EAMS-Finance-Transactions-${fromDate || 'all'}-${toDate || 'all'}.csv`; a.click(); URL.revokeObjectURL(url);
  };
  const categories = Array.from(new Set(tx.map(x => x.category)));
  const sources = Array.from(new Set(tx.map(x => x.source)));
  const statuses = Array.from(new Set(tx.map(x => x.status)));

  return <div className="space-y-5">
    <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-3"><div><h1 className="text-2xl font-bold">Finance FAT & AR — Transaction Overview</h1><p className="text-sm text-slate-500 mt-1">Pencarian transaksi, filter periode/kategori, tax analysis, payment terms, dan ekspor untuk rekonsiliasi Finance.</p></div><button onClick={exportExcel} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 text-white px-4 py-2 text-sm font-semibold"><Download size={16}/> Download Excel-compatible CSV</button></header>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><div className="bg-white border rounded-xl p-4"><div className="flex items-center gap-2 text-emerald-700"><TrendingUp size={18}/><span className="text-sm">Nilai record pemasukan</span></div><strong className="block text-xl mt-2">{money(income)}</strong><span className="text-xs text-slate-500">{filtered.filter(x => x.kind === 'INCOME').length} record sesuai filter</span></div><div className="bg-white border rounded-xl p-4"><div className="flex items-center gap-2 text-rose-700"><TrendingDown size={18}/><span className="text-sm">Nilai record pengeluaran</span></div><strong className="block text-xl mt-2">{money(expense)}</strong><span className="text-xs text-slate-500">{filtered.filter(x => x.kind === 'EXPENSE').length} record sesuai filter</span></div><div className="bg-white border rounded-xl p-4"><div className="flex items-center gap-2 text-blue-700"><Wallet size={18}/><span className="text-sm">Record terfilter</span></div><strong className="block text-xl mt-2">{filtered.length}</strong><span className="text-xs text-slate-500">Dari {tx.length} record gabungan</span></div></div>
    <section className="bg-white border rounded-xl p-4 space-y-3"><div className="flex items-center gap-2 font-semibold"><SlidersHorizontal size={17}/> Filter transaksi</div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari nomor, pihak, payment term…" className="border rounded-lg px-3 py-2"/><select value={kind} onChange={e => setKind(e.target.value)} className="border rounded-lg px-3 py-2"><option value="ALL">Semua arus</option><option value="INCOME">Pemasukan</option><option value="EXPENSE">Pengeluaran</option></select><select value={category} onChange={e => setCategory(e.target.value)} className="border rounded-lg px-3 py-2"><option value="ALL">Semua kategori</option>{categories.map(x => <option key={x}>{x}</option>)}</select><select value={source} onChange={e => setSource(e.target.value)} className="border rounded-lg px-3 py-2"><option value="ALL">Semua jenis transaksi</option>{sources.map(x => <option key={x}>{x}</option>)}</select><select value={status} onChange={e => setStatus(e.target.value)} className="border rounded-lg px-3 py-2"><option value="ALL">Semua status</option>{statuses.map(x => <option key={x}>{x}</option>)}</select><label className="text-sm text-slate-600">Dari tanggal<input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="block w-full border rounded-lg px-3 py-2 mt-1"/></label><label className="text-sm text-slate-600">Sampai tanggal<input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="block w-full border rounded-lg px-3 py-2 mt-1"/></label><div className="flex items-end"><button onClick={() => {setQuery('');setKind('ALL');setCategory('ALL');setSource('ALL');setStatus('ALL');setFromDate('');setToDate('');}} className="border rounded-lg px-3 py-2 w-full">Reset filter</button></div></div></section>
    <section className="bg-white border rounded-xl p-4 space-y-2"><label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={showTax} onChange={e => setShowTax(e.target.checked)}/> Aktifkan simulasi pajak custom untuk analisis / ekspor</label>{showTax && <div className="flex flex-col sm:flex-row sm:items-center gap-3"><label className="text-sm">Tarif pajak simulasi (%)<input type="number" min="0" max="100" step="0.01" value={taxRate} onChange={e => setTaxRate(e.target.value)} className="block border rounded-lg px-3 py-2 mt-1 w-40"/></label><p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">Simulasi ini tidak mengubah transaksi tersimpan, faktur pajak, jurnal, atau nilai tagihan. Tarif aktual harus diatur dan disimpan pada transaksi sumber sesuai kebijakan pajak.</p></div>}</section>
    <div className="bg-white border rounded-xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50"><tr>{['Tanggal','Nomor transaksi','Kategori / jenis','Pihak','Status','Payment term / jatuh tempo','Lampiran bukti','Nilai bruto','Pajak record',...(showTax ? [`Pajak simulasi ${rate}%`] : [])].map(h => <th key={h} className="text-left p-3 whitespace-nowrap">{h}</th>)}</tr></thead><tbody>{filtered.map(x => <tr key={`${x.source}-${x.id}`} className="border-t"><td className="p-3 whitespace-nowrap">{x.date || '—'}</td><td className="p-3 font-semibold">{x.number}</td><td className="p-3"><span className={x.kind === 'INCOME' ? 'text-emerald-700' : 'text-rose-700'}>{x.category}</span><div className="text-xs text-slate-500">{x.source}</div></td><td className="p-3">{x.party}</td><td className="p-3">{x.status}</td><td className="p-3">{x.paymentTerm || '—'}</td><td className="p-3">{x.evidence || 'Belum tersedia'}</td><td className="p-3 text-right whitespace-nowrap">{money(x.amount)}</td><td className="p-3 text-right whitespace-nowrap">{money(x.tax || 0)}</td>{showTax && <td className="p-3 text-right whitespace-nowrap">{money(Math.round(x.amount * rate / 100))}</td>}</tr>)}{!filtered.length && <tr><td colSpan={showTax ? 10 : 9} className="p-8 text-center text-slate-500">Tidak ada transaksi sesuai filter.</td></tr>}</tbody></table></div></div>
    <p className="text-xs text-slate-500">Penting: daftar menggabungkan dokumen bisnis yang bisa mewakili tahap berbeda pada transaksi yang sama (misalnya PO dan vendor bill). Jangan menjumlahkan seluruh record sebagai cashflow/laba-rugi final. Ekspor CSV dapat dibuka dengan Excel; lampiran hanya ditampilkan bila metadata tersedia di record sumber.</p>
  </div>;
};
