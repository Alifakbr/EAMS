# Revision — Contract Management & Finance FAT/AR Overview

## Tujuan
Menambahkan menu khusus pemantauan kepatuhan kontrak untuk Sales Order (SO) dan dashboard ringkasan transaksi Finance FAT & AR.

## Menu Contract Management
- Sidebar module ID: `contract-management`.
- Source: `src/components/ContractManagementView.tsx`.
- Data: `GET /api/v1/sales-orders` dan `SalesOrder` (`contractReferenceNumber`, `contractAttachmentName`, `contractAttachmentDataUrl`, `contractAttachmentUploadedAt`).
- Menampilkan total SO, jumlah lampiran lengkap, jumlah SO aktif yang belum memiliki PDF, pencarian, filter status, upload/ganti PDF, dan pembukaan PDF.
- Validasi UI: hanya PDF dan maksimal 10 MB. Server memvalidasi referensi kontrak, MIME data URL, ekstensi dan batas ukuran.
- Endpoint upload yang sudah ada: `POST /api/v1/sales-orders/:id/contract-attachment`.
- Tombol pengingat membuat draft email melalui `mailto:` yang berisi daftar SO tanpa dokumen. Pengiriman otomatis/email server-side belum diterapkan; operator harus meninjau penerima dan menekan Send pada email client.
- Kontrak dinyatakan lengkap jika `contractAttachmentDataUrl` ada. SO `CANCELLED` tidak masuk hitungan tindak lanjut.

## Finance FAT & AR — Transaction Overview
- Sidebar module ID: `finance-overview`.
- Source: `src/components/FinanceOverviewView.tsx`.
- Sumber data: invoices (`invoiceNumber`), payments (`paymentNumber`), purchase orders (`poNumber`), vendor bills (`billNumber`).
- Kolom: tanggal, nomor transaksi, sumber, pihak, status, metadata bukti (bila ada), dan nilai.
- Filter pencarian dan filter pemasukan/pengeluaran.
- Pemasukan diringkas dari invoice + pembayaran; pengeluaran dari PO + vendor bill. Angka ini adalah total nilai bruto record, **bukan** laporan cashflow atau laba rugi resmi. PO dan vendor bill dapat merujuk pembelian yang sama sehingga tidak boleh dijumlahkan untuk laporan final.
- Skema saat ini tidak memiliki attachment evidence yang konsisten di semua tipe invoice/payment/PO/vendor bill. Dashboard tidak berpura-pura memiliki bukti yang belum ada; kolom menunjukkan belum tersedia bila metadata tidak ada. Pengembangan berikutnya perlu menambah field/entitas attachment dan endpoint upload/unduh dengan ACL, batas ukuran, validasi MIME, audit log, serta backup.

## Hak akses
- `contract-management` diberikan ke ADMIN_IT (semua modul), EXECUTIVE, dan MANAGER.
- `finance-overview` diberikan ke ADMIN_IT, EXECUTIVE, MANAGER, FINANCE_ACCOUNTING_TAX, dan AR_MANAGEMENT.
- Perubahan baseline ada di `src/shared/access.ts`. Server tetap harus menjadi otoritas ACL; menu yang tersembunyi bukan pengganti proteksi API.

## File mapping
- `src/shared/access.ts` — modul dan role baseline.
- `src/components/Sidebar.tsx` — menu navigasi.
- `src/App.tsx` — import dan routing tampilan serta data props.
- `src/components/ContractManagementView.tsx` — monitor kontrak dan upload PDF.
- `src/components/FinanceOverviewView.tsx` — daftar transaksi Finance FAT & AR.
- `src/services/api.ts` — kontrak API upload dan daftar SO.
- `server/routes.ts` — endpoint upload PDF kontrak.
- `src/types/index.ts` — struktur SalesOrder, Invoice, Payment, PurchaseOrder, VendorBill.

## Checklist verifikasi lokal
1. Login sebagai role Executive/Manager, pastikan menu Contract Management terlihat.
2. Login sebagai Finance Accounting Tax/AR Management, pastikan Finance Transaction Overview terlihat.
3. Upload PDF valid 1–10 MB dan pastikan nomor kontrak, nama file, dan tanggal upload tersimpan setelah refresh.
4. Coba file `.docx`, file terlalu besar, dan batal prompt nomor kontrak; harus ditolak atau tidak mengubah record.
5. Cari SO tertentu, filter uploaded/missing, dan uji draft pengingat.
6. Bandingkan daftar transaksi dengan endpoint invoice, payment, PO, vendor bill. Pastikan angka ditafsirkan sebagai nilai bruto, bukan cashflow final.
7. Jalankan `npm ci`, `npm run lint`, `npm run build`, `npm run test:api` di mesin review. Tes browser/API belum dianggap lulus hanya karena file dibuat.

## Instruksi prompt berikutnya
Baca `docs/00_PROJECT_MAP_AND_NEXT_PROMPT.md` terlebih dahulu, lalu dokumen ini. Setelah itu telusuri file mapping di atas, jalankan lint/build/API test, dan lanjutkan attachment evidence yang konsisten serta reminder otomatis yang terotorisasi. Jangan mengklaim email otomatis atau attachment bukti Finance telah lengkap sampai ada schema/API persistence, ACL, audit trail, dan pengujian end-to-end.
