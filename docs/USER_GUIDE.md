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

## 4. Mengelola Akun

Admin dengan akses User Management dapat membuat atau mengubah akun sesuai kebijakan organisasi. Berikan hak minimum yang dibutuhkan. Password sementara harus disampaikan lewat kanal aman dan diganti pada login pertama di production. Admin tidak dapat menonaktifkan dirinya sendiri atau menghapus administrator aktif terakhir.

## 5. Backup, Logout, dan Bantuan

- Admin yang berhak dapat mengunduh backup melalui **Settings & Audit Log**. Backup adalah data sensitif; simpan di lokasi terbatas.
- Restore tidak mengganti akun/password. Pastikan backup benar sebelum melakukan pemulihan.
- Logout menghapus token dari browser. Token yang kedaluwarsa mengharuskan login ulang.
- Untuk error teknis, sertakan waktu kejadian, URL halaman, tindakan terakhir, dan pesan error kepada administrator. Jangan mengirim password, token, `.env`, atau file database melalui tiket umum.

Lihat [Keamanan dan Hak Akses](SECURITY_AND_ACCESS.md) dan [Backup dan Restore](BACKUP_RESTORE.md) untuk prosedur admin.
