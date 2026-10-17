import { exportExcelFromHtml } from '../utils/download.ts';
import React from 'react';
import {
  Printer,
  Download,
  X,
  Building2,
  Calendar,
  FileText,
  DollarSign,
  CheckCircle2,
  Clock,
  Truck,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  Receipt,
  FileCheck,
} from 'lucide-react';

export type SupportedDocType =
  | 'QUOTATION'
  | 'SALES_ORDER'
  | 'RENTAL'
  | 'INVOICE'
  | 'DELIVERY'
  | 'PURCHASE_ORDER'
  | 'CLIENT_PO'
  | 'WORK_ORDER'
  | 'PAYMENT'
  | 'ASSET'
  | 'OPERATOR';

interface DocumentPreviewModalProps {
  docType: SupportedDocType;
  data: any;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  docType,
  data,
  onClose,
}) => {
  if (!data) return null;

  // Title configuration based on document type
  const docMeta: Record<
    SupportedDocType,
    { title: string; subtitle: string; codePrefix: string; primaryId: string }
  > = {
    QUOTATION: {
      title: 'SURAT PENAWARAN HARGA RESMI (COMMERCIAL QUOTATION)',
      subtitle: 'Proposal Penawaran Sewa & Penjualan Armada Alat Berat',
      codePrefix: 'QT',
      primaryId: data.quotationNumber || data.id,
    },
    SALES_ORDER: {
      title: 'SURAT PESANAN KOMERSIAL RESMI (SALES ORDER)',
      subtitle: 'Konfirmasi Pemesanan Armada & Suku Cadang Alat Berat',
      codePrefix: 'SO',
      primaryId: data.orderNumber || data.id,
    },
    RENTAL: {
      title: 'PERJANJIAN KONTRAK SEWA ALAT BERAT (RENTAL AGREEMENT)',
      subtitle: 'Perjanjian Resmi Sewa Armada Alat Berat & Ketentuan Operasi',
      codePrefix: 'RC',
      primaryId: data.contractNumber || data.id,
    },
    INVOICE: {
      title: 'FAKTUR TAGIHAN RESMI (COMMERCIAL INVOICE)',
      subtitle: 'Faktur Tagihan Resmi Penjualan, Rental & Perpajakan Terpadu',
      codePrefix: 'INV',
      primaryId: data.invoiceNumber || data.id,
    },
    DELIVERY: {
      title: 'SURAT JALAN & PENGANTAR BARANG (DELIVERY ORDER)',
      subtitle: 'Bukti Serah Terima Fisik Armada & Mobilisasi Lapangan',
      codePrefix: 'DO',
      primaryId: data.deliveryNumber || data.id,
    },
    PURCHASE_ORDER: {
      title: 'SURAT PESANAN PEMBELIAN PENGADAAN (VENDOR PURCHASE ORDER)',
      subtitle: 'Pengadaan Resmi Internal Aset, Sparepart & Keperluan Kantor oleh Tim Procurement',
      codePrefix: 'PO-VND',
      primaryId: data.poNumber || data.id,
    },
    CLIENT_PO: {
      title: 'PURCHASE ORDER DARI CLIENT (CUSTOMER PURCHASE ORDER)',
      subtitle: 'Surat Pesanan Resmi Masuk dari Pelanggan Mitra Proyek (Client PO)',
      codePrefix: 'PO-CLT',
      primaryId: data.customerPoReference || data.customerPoNumber || data.poNumber || data.id,
    },
    WORK_ORDER: {
      title: 'TIKET PERBAIKAN & WORK ORDER (MAINTENANCE)',
      subtitle: 'Surat Tugas Servis Mekanik & Penggantian Suku Cadang',
      codePrefix: 'WO',
      primaryId: data.workOrderNumber || data.id,
    },
    PAYMENT: {
      title: 'BUKTI PENERIMAAN PEMBAYARAN (OFFICIAL PAYMENT RECEIPT)',
      subtitle: 'Kuitansi Resmi Settlement Kas & Bank Pelunasan Piutang',
      codePrefix: 'PMT',
      primaryId: data.receiptNumber || data.paymentNumber || data.id,
    },
    ASSET: {
      title: 'DOKUMEN KELAIKAN & REGISTER ASET ALAT BERAT',
      subtitle: 'Sertifikasi Legalitas STNK, BPKB, dan SIA Kemenaker',
      codePrefix: 'AST',
      primaryId: data.assetTag || data.id,
    },
    OPERATOR: {
      title: 'PROFIL OPERATOR & LISENSI K3 (SURAT IJIN OPERATOR)',
      subtitle: 'Data Lisensi SIO Kemenaker RI & Penugasan Armada',
      codePrefix: 'OPR',
      primaryId: data.badgeNumber || data.id,
    },
  };

  const meta = docMeta[docType] || docMeta.QUOTATION;

  // Print Document function
  const handlePrint = () => {
    window.print();
  };

  // Export Document to formatted Excel
  const handleExportExcel = () => {
    const filename = `${meta.codePrefix}_${meta.primaryId}_${new Date().toISOString().slice(0, 10)}.xls`;
    const html = `
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
        <h2>${meta.title}</h2>
        <p>Apex Industrial Solutions &amp; Equipment Corp. | No: ${meta.primaryId} | Tanggal: ${new Date().toLocaleDateString('id-ID')}</p>
        <p>Customer/Partner: ${data.customerName || data.vendorName || data.name || '-'}</p>
        <table border="1">
          <tr><th>Parameter</th><th>Nilai</th></tr>
          <tr><td>Nomor Dokumen</td><td>${meta.primaryId}</td></tr>
          <tr><td>Status</td><td>${data.status || 'ACTIVE'}</td></tr>
          <tr><td>Tanggal Terbit</td><td>${data.date || data.orderDate || data.issueDate || data.dispatchDate || '-'}</td></tr>
          <tr><td>Jatuh Tempo / Valid Until</td><td>${data.validUntil || data.dueDate || data.expectedReturnDate || '-'}</td></tr>
          <tr><td>Nilai Total ($)</td><td>$${(data.grandTotal || data.amount || data.subtotal || 0).toLocaleString()}</td></tr>
        </table>
      </body>
      </html>
    `;
    exportExcelFromHtml(html, filename);};

  const items = data.items || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 max-w-4xl w-full max-h-[92vh] flex flex-col text-slate-900 overflow-hidden my-auto">
        {/* Modal Top Action Bar */}
        <div className="p-3 sm:p-4 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0 no-print">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-amber-400 text-slate-900 font-bold font-mono text-xs">
              {meta.codePrefix}
            </span>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Detail Data: {meta.primaryId}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                  {data.status || 'CONFIRMED'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Pusat Dokumen Resmi &amp; Audit Trail Perusahaan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-white text-slate-900 hover:bg-slate-100 cursor-pointer shadow-xs"
              title="Cetak Dokumen Resmi ke PDF / Printer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-700" />
              <span>Print to PDF</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer shadow-xs"
              title="Unduh Data Dokumen Ini ke Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download Excel</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded cursor-pointer ml-1"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Document Container */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 bg-white text-xs text-slate-800 leading-relaxed">
          {/* Corporate Letterhead */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded bg-slate-900 text-amber-400 font-black text-lg flex items-center justify-center font-mono shadow-xs shrink-0">
                APX
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase">
                  Apex Industrial Solutions &amp; Equipment Corp.
                </h1>
                <p className="text-[11px] text-slate-600 font-medium">
                  Enterprise Heavy Equipment Rental, Asset Sales, Engineering &amp; Mining Logistics
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  NPWP: 01.883.920.1-019.000 · Gedung Apex Tower Lt. 18, Jl. Rasuna Said Kav. 8, Jakarta
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right font-mono text-[11px] text-slate-600 shrink-0">
              <div className="font-bold text-slate-900 text-xs">{meta.codePrefix} REGISTERED</div>
              <div>Tanggal Cetak: {new Date().toLocaleDateString('id-ID')}</div>
              <div className="text-[10px] text-slate-400">Status Valid: ISO 9001:2015 Terverifikasi</div>
            </div>
          </div>

          {/* Document Banner Title */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                {meta.subtitle}
              </span>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                {meta.title}
              </h2>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Nomor Referensi Resmi</span>
              <span className="text-sm font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 inline-block mt-0.5">
                {meta.primaryId}
              </span>
            </div>
          </div>

          {/* Document Info Grid: Two Columns (Party Info & Metadata) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Left: Client / Vendor Info */}
            <div className="p-4 bg-slate-50/80 rounded border border-slate-200 space-y-2">
              <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wide border-b border-slate-200 pb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                Pihak Terkait / Customer / Partner
              </h4>
              <div className="text-sm font-bold text-slate-900">
                {data.customerName || data.vendorName || data.name || 'PT Pelanggan Korporasi Terdaftar'}
              </div>
              <div className="text-[11px] text-slate-600 space-y-0.5">
                {data.customerCode && <div>Kode Klien: <span className="font-mono font-semibold">{data.customerCode}</span></div>}
                {data.customerPoReference && <div>PO Referensi Klien: <span className="font-mono font-semibold">{data.customerPoReference}</span></div>}
                {data.quotationReference && <div>Rujukan Penawaran: <span className="font-mono font-semibold">{data.quotationReference}</span></div>}
                {data.customerTaxId && <div>NPWP: <span className="font-mono">{data.customerTaxId}</span></div>}
                {data.deliveryAddress && (
                  <div>
                    Alamat Lapangan: {data.deliveryAddress.street}, {data.deliveryAddress.city}, {data.deliveryAddress.state}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Dates & Financial Parameters */}
            <div className="p-4 bg-slate-50/80 rounded border border-slate-200 space-y-2">
              <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wide border-b border-slate-200 pb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Parameter Dokumen &amp; Termin
              </h4>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Tanggal Penerbitan:</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {data.date || data.orderDate || data.issueDate || data.dispatchDate || data.scheduledDate || '2026-10-15'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px]">Masa Berlaku / Due Date:</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {data.validUntil || data.dueDate || data.expectedReturnDate || data.targetDeliveryDate || '30 Hari Kalender'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px]">Status Dokumen:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px] inline-block">
                    {data.status || 'ACTIVE'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px]">Mata Uang &amp; Termin:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {data.currency || 'USD'} · Net 30 Hari
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Itemized Table Breakdown */}
          {items.length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Rincian Barang, Armada Alat Berat &amp; Biaya Operasional:
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">Deskripsi / Tipe Unit</th>
                      <th className="py-2.5 px-3 font-mono">Tag / No. Alat</th>
                      <th className="py-2.5 px-3 text-right">Tarif / Harga ($)</th>
                      <th className="py-2.5 px-3 text-center">Qty / Durasi</th>
                      <th className="py-2.5 px-3 text-right">Mob / Demob ($)</th>
                      <th className="py-2.5 px-3 text-right">Total Garis ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {items.map((item: any, idx: number) => {
                      const mob = (item.mobilizationFee || 0) + (item.demobilizationFee || 0);
                      const unitRate = item.rentalRate || item.unitPrice || item.unitCost || 0;
                      const lineTotal = item.total || item.lineSubtotal || (item.quantity * unitRate + mob);

                      return (
                        <tr key={item.id || idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                          <td className="py-2 px-3 font-sans font-semibold text-slate-900">
                            <div>{item.productName || item.description || item.assetName || 'Alat Berat Industri'}</div>
                            {item.equipmentType && <div className="text-[10px] text-slate-400 font-normal">{item.equipmentType}</div>}
                          </td>
                          <td className="py-2 px-3 text-slate-700">
                            {item.equipmentNumber || item.allocatedAssetTag || item.assetTag || '-'}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-800">
                            ${unitRate.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-3 text-center font-sans">
                            {item.quantity || 1} {item.durationUnits ? `(${item.durationUnits} Hari)` : 'Unit'}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-600">
                            {mob > 0 ? `$${mob.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">
                            ${lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* If no items array (e.g. Asset or Payment document) */
            <div className="p-4 bg-slate-50 rounded border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-800 text-xs">Rincian Catatan / Spesifikasi:</h4>
              <p className="text-slate-600">
                {data.notes || data.description || data.resolutionNotes || 'Dokumen resmi tercatat dalam sistem EARMS.'}
              </p>
              {data.legalDocs && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 font-mono text-[11px]">
                  <div>STNK: <strong>{data.legalDocs.stnkNumber || '-'}</strong></div>
                  <div>BPKB: <strong>{data.legalDocs.bpkbNumber || '-'}</strong></div>
                  <div>SIA: <strong>{data.legalDocs.siaNumber || '-'}</strong></div>
                  <div>HM: <strong>{data.legalDocs.hourMeter || 0} HM</strong></div>
                </div>
              )}
            </div>
          )}

          {/* Financial Totals Summary Block */}
          <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div className="max-w-md space-y-1 text-slate-500 text-[11px]">
              <span className="font-semibold text-slate-700 block">Ketentuan &amp; Syarat Resmi:</span>
              <p>
                {data.termsAndConditions ||
                  data.terms ||
                  '1. Pembayaran ditransfer ke rekening resmi PT Apex Industrial Solutions. 2. Faktur pajak e-Faktur terbit sesuai tanggal invoice. 3. Klaim dan dispute diajukan maksimal 7 hari kerja.'}
              </p>
            </div>

            <div className="w-full sm:w-72 bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2 font-mono text-[11px]">
              {data.subtotal !== undefined && (
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Dasar:</span>
                  <span>${Number(data.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {data.mobilizationTotal !== undefined && data.mobilizationTotal > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Mobilisasi Lapangan:</span>
                  <span>${Number(data.mobilizationTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {data.demobilizationTotal !== undefined && data.demobilizationTotal > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Demobilisasi Unit:</span>
                  <span>${Number(data.demobilizationTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {data.taxTotal !== undefined && (
                <div className="flex justify-between text-emerald-800">
                  <span>PPN 11% (Pajak):</span>
                  <span>+${Number(data.taxTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="border-t border-slate-300 pt-2 flex justify-between font-bold text-sm text-slate-900">
                <span>TOTAL AKHIR ($):</span>
                <span>${Number(data.grandTotal || data.amount || data.subtotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              {data.paidAmount !== undefined && (
                <div className="flex justify-between text-emerald-700 text-[10px]">
                  <span>Sudah Dibayar:</span>
                  <span>${Number(data.paidAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {data.outstandingBalance !== undefined && data.outstandingBalance > 0 && (
                <div className="flex justify-between text-rose-700 font-bold text-[10px]">
                  <span>Sisa Piutang (AR):</span>
                  <span>${Number(data.outstandingBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>
          </div>

          {/* Official Sign-off Approval Block */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-4 text-center text-[11px] text-slate-700">
            <div>
              <p className="font-semibold text-slate-500">Dibuat Oleh:</p>
              <div className="h-14 flex items-center justify-center font-serif italic text-slate-400">
                [Tanda Tangan Digital]
              </div>
              <p className="font-bold text-slate-900 underline">
                {data.salespersonName || data.recordedBy || 'Elena Rostova'}
              </p>
              <p className="text-[10px] text-slate-500">Commercial Operations Lead</p>
            </div>

            <div>
              <p className="font-semibold text-slate-500">Diperiksa (Verifikasi):</p>
              <div className="h-14 flex items-center justify-center font-serif italic text-slate-400">
                [Tanda Tangan Digital]
              </div>
              <p className="font-bold text-slate-900 underline">
                Sarah Jenkins
              </p>
              <p className="text-[10px] text-slate-500">Finance &amp; Legal Compliance</p>
            </div>

            <div>
              <p className="font-semibold text-slate-500">Disetujui Oleh:</p>
              <div className="h-14 flex items-center justify-center font-serif italic text-emerald-700 font-bold">
                [APPROVED DIRECT]
              </div>
              <p className="font-bold text-slate-900 underline">
                {data.approvedBy || 'Marcus Sterling'}
              </p>
              <p className="text-[10px] text-slate-500">Direktur Utama (Executive Director)</p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Close Action Bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs shrink-0 no-print">
          <span className="text-[11px] text-slate-500">
            Dokumen resmi ini sah dan dicatat dalam audit trail sistem EARMS.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded cursor-pointer transition-colors"
          >
            Tutup Preview
          </button>
        </div>
      </div>
    </div>
  );
};
