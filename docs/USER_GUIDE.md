# Panduan Pengguna Apex EAMS

Panduan ini merangkum alur penggunaan yang tersedia di UI saat ini. Menu yang terlihat bergantung pada role dan izin akun. Untuk instalasi, konfigurasi server, database, dan backup, lihat [Panduan Lengkap](PANDUAN_LENGKAP.md).

## 1. Login

1. Buka URL aplikasi yang diberikan administrator.
2. Masuk dengan email dan password akun.
3. Pada login awal production, ganti password sementara jika aplikasi memintanya.
4. Gunakan **Ingat saya** hanya pada perangkat pribadi. Pilih logout setelah selesai, terutama pada perangkat bersama.

Di development dengan `DEMO_MODE` aktif, akun seed yang belum pernah memiliki password menggunakan `Demo@2026` (atau nilai `SEED_PASSWORD` yang diatur sebelum akun diinisialisasi). Ini hanya untuk demo lokal. Production tidak boleh memakai password demo.

Akun contoh yang dibuat oleh database seed:

| Role | Email seed |
|---|---|
| Executive | `marcus@apex-industrial.com` |
| Admin IT | `hendra.it@apex-industrial.com` |
| Sales & Marketing | `elena@apex-industrial.com` |
| Asset Control | `bambang.asset@apex-industrial.com` |
| Management Operation | `joko.ops@apex-industrial.com` |
| Procurement | `dewi.proc@apex-industrial.com` |
| Finance, Accounting & Tax | `sarah@apex-industrial.com` |
| AR Management | `reza.ar@apex-industrial.com` |
| Field Operator | `agus.operator@apex-industrial.com` |
| Technical Service | `dani.tech@apex-industrial.com` |

Role `MANAGER` tersedia untuk akun yang dibuat administrator, tetapi bukan akun seed.

## 2. Navigasi dan Modul

| Modul | Kegunaan utama |
|---|---|
| Operations Dashboard | Ringkasan operasional yang tersedia untuk role pengguna. |
| Customers & Project CRM | Mengelola data customer dan melihat informasi customer. |
| Sales Quotations | Menyusun dan meninjau penawaran. |
| Sales Orders | Mengelola pesanan penjualan dan status terkait. |
| Rental Contracts | Mengelola kontrak dan pemakaian aset sewa. |
| Deliveries & Handover | Mencatat pengiriman dan serah terima. |
| Heavy Equipment & Compliance | Mengelola registry aset, dokumen, dan identitas unit. |
| Product & Spare Parts Catalog | Mengelola produk, katalog, dan item suku cadang. |
| Operator Licenses & Maintenance | Data operator dan pekerjaan maintenance. |
| Technical Service & Scanner | Alur kerja teknis dan pencarian/scan aset. |
| Field Equipment Scan & Attendance | Operator lapangan mengirim status/kehadiran sesuai akses. |
| Invoices & Billing | Mengelola invoice dan penagihan. |
| Payments & Settlement | Mencatat pembayaran dan alokasi terkait. |
| Procurement & Vendor POs | Mengelola vendor dan pengadaan. |
| Approvals & Contracts | Meninjau item yang menunggu persetujuan bagi role Manager. |
| Reports & Official Documents | Melihat atau mengekspor laporan yang diizinkan. |
| User Management (IT) | Administrasi akun dan izin pengguna. |
| REST API & Swagger | Membuka spesifikasi API yang diizinkan. |
| Automated Test Suite | Menjalankan test suite aplikasi. |
| Settings & Audit Log | Pengaturan, audit, backup, dan pemulihan yang diizinkan. |

Nama dan ketersediaan menu mengikuti versi aplikasi dan hak akses server. Jika menu tidak tampak, minta admin memeriksa role/permission; jangan mencoba mengubah role dari browser.

## Customer Database — edit dan delete

1. Buka **Customers & Project CRM** dan cari customer menggunakan nama, kode, atau Tax ID.
2. Klik **Edit** untuk mengubah data customer, contact, alamat, atau credit limit; klik **Update Customer Account** dan pastikan notifikasi berhasil muncul.
3. Klik **Delete** hanya jika record memang tidak lagi diperlukan. Sistem menolak penghapusan bila masih ada quotation, Sales Order, rental contract, invoice, atau payment yang terhubung. Untuk customer historis, gunakan proses inaktivasi/status, bukan menghapus riwayat.

## Procurement — vendor dan PO

1. Daftarkan vendor di **Procurement & Vendor POs → Vendor Directory → Register New Vendor**.
2. Buka **Create Purchase Order (PO)** dan pilih vendor pada dropdown **Select Vendor**. Jika daftar kosong, tutup form dan daftarkan vendor terlebih dahulu.
3. Pastikan setiap baris item mempunyai nama, quantity lebih besar dari nol, dan unit cost tidak negatif sebelum submit.
4. Periksa toast notifikasi setelah submit. Jika terjadi error, baca pesannya dan periksa kembali vendor, item, serta status koneksi/API.

## Approvals & Contracts

Pilih tab **Pending approvals** untuk memproses item yang menunggu persetujuan. Gunakan **View details** untuk melihat field record yang sudah diformat. Field kompleks seperti item/contacts dapat dibuka melalui tautan **Open details** atau **View item(s)**. Tab **Data & contracts** menampilkan daftar order dan kontrak yang dapat dibuka.

## 3. Alur Kerja Umum

### Customer, produk, dan aset

Buka modul terkait, cari record bila tersedia, lalu gunakan kontrol tambah/edit yang disediakan. Pastikan identitas customer, tag aset, harga, dan status diperiksa sebelum menyimpan. Perubahan dicatat sesuai aturan akses aplikasi.

### Penjualan dan rental

Buat quotation untuk penawaran, tinjau status serta total, kemudian lanjutkan ke proses order atau rental yang tersedia. Sebagian tindakan dapat menahan/mengalokasikan aset atau membutuhkan approval. Periksa status record setelah setiap tindakan.

### Pengiriman, maintenance, dan status lapangan

Gunakan modul delivery/handover untuk pencatatan pengiriman. Gunakan Maintenance atau Technical Service untuk work order. Operator lapangan dapat memakai scanner atau input manual sesuai perangkat dan izin akun. Kamera browser memerlukan HTTPS atau `localhost`.

### Invoice dan pembayaran

Gunakan modul invoice untuk penagihan dan Payments untuk pencatatan/penyelesaian. Pastikan customer, referensi, jumlah, dan status cocok sebelum menyimpan.

### Persetujuan

Role Manager melihat item pending melalui **Approvals & Contracts**. Keputusan approval/reject hanya tersedia jika server memberi akses dan record masih menunggu keputusan.

### Pengadaan alat berat dan pelabelan aset

1. Di **Procurement & Vendor POs**, buat PO dengan tipe item **HEAVY EQUIPMENT**, jumlah unit bilangan bulat, dan harga beli per unit.
2. Setelah PO disetujui Manager dan barang diterima, sistem membuat satu record aset provisional untuk setiap unit. Unit belum dapat dialokasikan sampai dilabeli.
3. Di **Heavy Equipment & Compliance**, filter status **Pending Label**, pilih aksi tag, lalu isi asset tag, serial number pabrikan, nama, merek/model, lokasi, depresiasi tahunan, dan tipe rental.
4. Simpan untuk mengaktifkan aset dan mencetak barcode/QR. Lengkapi dokumen STNK/BPKB/SIA sesuai proses Asset Control.

**Wet rental** dan **Dry rental** adalah klasifikasi pada data aset. Wet biasanya berarti operator disertakan, dry berarti tanpa operator; klasifikasi ini tidak otomatis mengubah harga kontrak atau menambahkan biaya operator.

### Depresiasi, penjualan, dan disposal

- Pada aksi keuangan aset yang **AVAILABLE**, atur persentase depresiasi tahunan dan tipe rental. Nilai buku dihitung straight-line dari harga beli, diprorata sejak tanggal pembelian, dan dibatasi minimum nol.
- Untuk penjualan, pilih customer, isi harga sebelum pajak dan tarif pajak. Aset berubah menjadi **SOLD** dan sistem membuat draft invoice yang perlu ditinjau/diproses Finance melalui **Invoices & Billing**. Laporan menampilkan proceeds serta gain/loss terhadap nilai buku saat penjualan.
- Untuk disposal tanpa pemasukan, pilih **DISPOSAL**. Aset berubah menjadi **DISPOSED**, tidak ada invoice atau revenue, dan nilai buku saat disposal dicatat sebagai write-off.
- Hanya aset berstatus **AVAILABLE** yang dapat dijual atau didispose. Pastikan aset tidak sedang disewa, reserved, atau dalam maintenance sebelum memprosesnya.
- Angka pada dashboard merupakan ringkasan operasional, bukan pengganti jurnal atau laporan keuangan statutory. Konfirmasikan perlakuan akuntansi/pajak dengan Finance.

## 4. Mengelola Akun

Admin dengan akses User Management dapat membuat atau mengubah akun sesuai kebijakan organisasi. Berikan hak minimum yang dibutuhkan. Password sementara harus disampaikan lewat kanal aman dan diganti pada login pertama di production. Admin tidak dapat menonaktifkan dirinya sendiri atau menghapus administrator aktif terakhir.

## 5. Backup, Logout, dan Bantuan

- Admin yang berhak dapat mengunduh backup melalui **Settings & Audit Log**. Backup adalah data sensitif; simpan di lokasi terbatas.
- Restore tidak mengganti akun/password. Pastikan backup benar sebelum melakukan pemulihan.
- Logout menghapus token dari browser. Token yang kedaluwarsa mengharuskan login ulang.
- Untuk error teknis, sertakan waktu kejadian, URL halaman, tindakan terakhir, dan pesan error kepada administrator. Jangan mengirim password, token, `.env`, atau file database melalui tiket umum.

Lihat [Keamanan dan Hak Akses](SECURITY_AND_ACCESS.md) dan [Backup dan Restore](BACKUP_RESTORE.md) untuk prosedur admin.

## Revisi Oktober 2026 — Pengaturan IT dan Compliance

### Import database dari backup

1. Masuk sebagai user yang memiliki akses Settings.
2. Buka **Settings & Audit Log** dan klik **Download Backup (.json)** sebelum melakukan perubahan.
3. Pilih **Import Backup (.json)**, lalu pilih file backup EAMS yang valid.
4. Konfirmasi import. Data bisnis akan diganti dengan data dari backup; akun dan password yang ada tidak ditimpa.
5. Setelah halaman dimuat ulang, periksa aset, customer, quotation, Sales Order, rental, invoice, dan notifikasi.

### Logo dan favicon

Pada **Application Branding**, unggah gambar logo dan favicon (maksimum 1 MB per gambar), lalu pilih **Save Configuration**. Logo akan tampil di header aplikasi dan favicon pada tab browser. Hapus gambar untuk kembali ke logo/icon default.

### Kategori jabatan

Pada **Job-position / Department Categories**, tambahkan atau hapus kategori, kemudian simpan konfigurasi. Form user management menggunakan kategori ini sebagai saran; field tetap menerima teks bebas untuk jabatan khusus.

### Dokumen SIA lebih dari satu

Pada Equipment Registration & Documents, buka dokumen aset. Gunakan **Add multiple files** untuk melampirkan beberapa file SIA. Periksa nomor dan expiry date setiap file sebelum menyimpan. Notifikasi akan dibuat ketika tanggal kedaluwarsa berada dalam rentang 30 hari, atau ketika sertifikat sudah kedaluwarsa.

### Rental unit yang masih aktif

Jika unit berstatus `RENTED`, EAMS menolak booking baru dan mengirim notifikasi konflik. Lakukan demobilisasi, pengembalian fisik, dan return inspection pada kontrak aktif terlebih dahulu. Jangan mengubah status aset secara manual untuk melewati kontrol tersebut.


## IT: Selective Data Migration and Simulation Reset

1. Open **Settings / IT System Configuration** as an IT Administrator.
2. Use **IT Data Migration — Table Export / Import** to select one or more collections. Supported collections include users (public account metadata only), assets, customers, products, quotations, sales orders, rentals, deliveries, invoices, payments, vendors, purchase orders, vendor bills, work orders, operators, attendance/status logs, notifications, drafts and audit logs.
3. Export downloads an `EAMS_TABLE_EXPORT` JSON package. Import replaces only included non-user collections. For `users`, matching accounts are updated by ID/email while their existing password credentials are preserved; unmatched imported accounts are not created. Always back up first and test migrations on a non-production instance.
4. **Hapus seluruh data operasional** is a destructive test-only operation. It clears operational transactions, assets, compliance records, operators, notifications and drafts while preserving user accounts/password credentials and system settings. It is blocked in production unless `ALLOW_DEMO_RESET=true`; do not enable this on production.

## Compliance expiry reminders

The compliance monitor checks SIA (including multiple SIA records and attachments), STNK, BPKB where an expiry date is configured, equipment inspection due dates and operator SIO. Notifications are generated when the expiry date is within 30 days, escalated to critical when expired or within 7 days, and are synchronized when the Assets or Notifications API is read. Upload each SIA as its own record with its number, issuer, expiry date and attachment.

## GPS fleet map print

Use **Print Map (PDF)** from the GPS Fleet Map panel and choose A4 landscape. Enable **Background graphics** in the browser print dialog so OpenStreetMap tiles and marker colors are preserved. Wait until the base map tiles are loaded before printing; external tile availability depends on network access.

## GRC Access Control

Open **User Management (IT) → GRC Access Control** to review the role permission matrix and access-review checklist. This is a review/reporting tab; it does not itself change permissions. Apply role changes in User Management and validate endpoint enforcement after changes.


## Equipment Rental Rate Calculator

From **Quotations**, select **Rate Calculator**. Enter the monthly contract value, rate days/month, contract hours/month, working hours/day, contract duration, quantity, and multipliers. The calculator displays Standard and Reference rates for monthly, daily, hourly, and lumpsum, plus separate Saturday/Sunday reference hourly rates.

Calendar range is inclusive. Monday–Friday are counted as working days by default; Saturday and Sunday count only when enabled. Dates in the holiday list (`YYYY-MM-DD`, comma or newline separated) are excluded. Scheduled hours are billable days × working hours/day.

Select the rate basis and Standard or Reference, then choose **Apply rate to first quotation item**. The rate is copied to the first item in the quotation form. Hourly/daily/monthly basis is not yet stored as a separate quotation field, so note it in terms/remarks. Multipliers are not persisted as company settings yet.
