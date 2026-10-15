# Panduan Pengguna & Operasional Sistem — Apex EAMS Enterprise & Heavy Equipment Fleet

Selamat datang di platform **Enterprise Asset Rental Management System (EARMS)** Apex Industrial Solutions. Platform terintegrasi ini mengelola seluruh daur hidup armada alat berat (*Heavy Equipment Fleet Lifecycle*), mulai dari registrasi aset terpusat, pengunggahan dokumen legalitas (STNK, BPKB, SIA), pengelolaan operator & lisensi SIO, perbaikan alat berat berbasis scan barcode, pelaporan status harian lapangan (Bekerja vs Rusak), hingga manajemen pengguna & hak akses kustom di tangan Divisi IT.

---

## 1. Matriks 9 Peran Pengguna (User Roles) & Hak Akses Terpusat

Sistem menerapkan kontrol akses berbasis peran (RBAC) yang secara otomatis menyaring bilah navigasi atas (Navbar), bilah samping (Sidebar), dan menu kerja dasbor:

| No | Peran (Role Code) | Jabatan / Fungsi | Cakupan Kerja & Tanggung Jawab Utama | Akses Fitur & Menu Navigasi |
|---|---|---|---|---|
| **1** | **Executive** (`EXECUTIVE`) | Direktur Utama / Direksi | Memantau seluruh kinerja komersial & operasional korporasi. Diutamakan mengakses Laporan Eksekutif dengan fitur hitungan laba-rugi & proyeksi yang dapat di-generate ke PDF dan Excel. | Seluruh modul komersial, operasional, rental, billing, FAT, dan laporan eksekutif. **Kecuali instrumen teknis IT Admin** (`user-management`, `api-explorer`, `test-runner`, `settings`). |
| **2** | **Administrator Admin (IT)** (`ADMIN_IT`) | Divisi IT & DevOps | Mengelola seluruh pengguna (*User Management*), kustomisasi matriks hak akses per akun/role, infrastruktur, audit log, REST API Swagger, dan automated test suite. | **Semua fitur tanpa batas** (100% seluruh modul komersial, operasional, manajemen pengguna IT, dan developer tools). |
| **3** | **Sales & Marketing** (`SALES_MARKETING`) | Komersial & Client Support | Mengolah seluruh data pelanggan (customer CRM), data proyek/klien, penawaran harga (sales quotations), dan konversi ke sales orders. | Dashboard Sales, Customers & CRM, Quotations, Sales Orders, Katalog Produk & Aset, Deliveries Handover, Laporan Penjualan. |
| **4** | **Asset Control** (`ASSET_CONTROL`) | Asset Management & Legalitas | Mengurus registrasi seluruh aset alat berat, penomoran fisik (chassis, engine, plat nomor), pengiriman/handover, dan dokumen legalitas (STNK, BPKB, SIA Kemenaker kelaikan alat). | Dashboard Aset, Registrasi Alat Berat & Legalitas Dokumen (STNK/BPKB/SIA), Deliveries & Handover, Perawatan & Kelaikan Alat, Suku Cadang, Cetak Label Barcode. |
| **5** | **Management Operation** (`MANAGEMENT_OPERATION`) | Field Operations & K3 | Mengatur seluruh user operator alat berat di lapangan, memantau masa berlaku sertifikasi Surat Ijin Operator (SIO Kelas 1, 2, 3), dan penugasan armada proyek. | Dashboard Operasi Lapangan, Operator SIO & Perawatan, Penugasan Armada Alat Berat, Serah Terima Lapangan (DO), Laporan Utilisasi Lapangan. |
| **6** | **Procurement** (`PROCUREMENT`) | Pengadaan & Pembelanjaan | Melakukan pembelanjaan aset alat berat baru, pengadaan suku cadang/sparepart pemeliharaan, PO vendor supplier, dan kebutuhan kantor. | Dashboard Pengadaan, Vendor & Purchase Orders (PO), Pembelanjaan Aset Baru, Sparepart & Kebutuhan Kantor, Laporan Belanja & Biaya. |
| **7** | **Accounting Finance & Tax** (`FINANCE_ACCOUNTING_TAX`) | FAT (Finance, Akuntansi & Pajak) | Melakukan recording seluruh transaksi keuangan, pembukuan akun, penagihan/invoicing, dan perhitungan pajak komersial (PPN 11% Keluaran dan PPh Pasal 23 Sewa Alat 2%). | Dashboard FAT, Invoices & Billing, Pembayaran & Kas Bank, Laporan Perhitungan Pajak (FAT), Akun Pelanggan & Jurnal. |
| **8** | **AR Management** (`AR_MANAGEMENT`) | Accounts Receivable (Piutang) | Melakukan tracing tagihan piutang belum lunas, monitoring umur piutang (Aging Buckets: 0-30, 31-60, 61-90, >90 hari), penagihan overdue, dan rekonsiliasi pembayaran. | Dashboard AR, Tracing Tagihan Piutang, Laporan Aging Receivables, Konfirmasi Pelunasan AR, Customer Statement of Account (SOA). |
| **9** | **Operator Lapangan** (`OPERATOR_USER`) | Pengguna Alat Berat Lapangan | Khusus melakukan pemindaian barcode alat berat di lokasi kerja/site dan mengirimkan status kesiapan unit: Bekerja Normal vs Rusak / Breakdown. | **Hanya Menu Pemindaian**: "Status & Cek Alat Lapangan (Scan Barcode & Submit Status)". |

---

## 2. Fitur Unggulan Sistem (Centralized & Barcode-Driven)

### A. Registrasi Aset Terpusat & Vault Dokumen Legalitas (STNK, BPKB, SIA)
1. **Pendaftaran Alat Berat**:
   - Pencatatan nomor identifikasi unik (*Asset Tag*), *Serial Number* pabrikan, merk, tipe, dan spesifikasi mesin.
   - Perekaman nomor fisik: Nomor Rangka (*Chassis VIN*), Nomor Mesin (*Engine Number*), Nomor Polisi (Plat Kuning/Hitam), dan *Hour Meter* (HM).
2. **Unggah Dokumen Legalitas (STNK, BPKB, SIA)**:
   - **STNK**: Nomor STNK, masa berlaku pajak, dan file lampiran STNK.
   - **BPKB**: Nomor registrasi BPKB, instansi penerbit (Polda), dan arsip kepemilikan.
   - **SIA (Surat Ijin Alat)**: Nomor sertifikat kelaikan K3 dari Kemenaker/Disnaker, pengawas K3, tanggal kadaluarsa, dan file scan sertifikat asli.
   - Sistem secara otomatis menampilkan status badge (*Valid*, *Expiring Soon*, *Expired*) dan memberi peringatan jatuh tempo inspeksi K3 berkala.
3. **Cetak Label Barcode & QR Fisik**:
   - Tombol **`Cetak Barcode & QR Label`** menghasilkan label sticker industri yang siap ditempelkan pada bodi excavator, crane, loader, atau forklift.
   - Dilengkapi QR Code resolusi tinggi, nama unit, plat nomor, nomor SIA, dan identitas kepemilikan korporasi.

---

### B. Perbaikan Alat Berat Berbasis Scan Barcode (Barcode Repair Workflow)
1. **Pencarian Cepat via Barcode**:
   - Di modul **Maintenance & Field Operations**, mekanik atau supervisor dapat mengetik atau memindai barcode mesin (cth: `AST-10024`).
   - Sistem secara instan memunculkan kartu identitas alat, status kelaikan, lokasi proyek, dan riwayat kerusakan sebelumnya.
2. **Penerbitan Tiket Perbaikan Cepat (Work Order)**:
   - Klik **`Buka Work Order Perbaikan Unit Ini`**.
   - Input judul perbaikan, kategori kendala (Mesin, Hidrolik, Kelistrikan, Track, Struktur), prioritas (*Critical, High, Medium, Low*), dan estimasi suku cadang.
   - Status unit otomatis beralih ke **`IN_MAINTENANCE`**, mencegah unit dialokasikan atau disewakan saat rusak.
3. **Penyelesaian Servis & Sertifikat Laik Operasi**:
   - Mekanik memasukkan catatan tindakan perbaikan (misal: penggantian oli hidrolik & seal silinder, uji tekanan 3,500 PSI).
   - Klik **`Selesaikan Servis`**: Status alat otomatis kembali ke **`AVAILABLE`** dan siap diterjunkan ke proyek.
   - Mekanik dapat langsung mencetak **Sertifikat Kelayakan Servis & Barcode** berstandar inspeksi K3.

---

### C. Pengelolaan Operator Lapangan & Dokumen SIO Kemenaker (Field Operations)
1. **Direktori Operator Alat Berat**:
   - Mencatat nama operator, nomor badge, spesialisasi (*Excavator 20-30T*, *Mobile Crane 50T*, *Forklift Heavy*, *Bulldozer*), dan nomor kontak.
2. **Pengawasan Lisensi SIO (Surat Ijin Operator)**:
   - Klasifikasi kelas lisensi: **Kelas 1** (kapasitas berat &gt; 100 Ton), **Kelas 2** (25 - 100 Ton), dan **Kelas 3** (&lt; 25 Ton).
   - Masa berlaku lisensi SIO beserta alert peringatan kadaluarsa (*Valid* vs *Segera Perpanjang*).
   - Unggah berkas SIO resmi yang terverifikasi Disnaker / Kemenaker.
3. **Penugasan Armada Proyek**:
   - Menghubungkan operator dengan unit alat berat spesifik yang sedang bertugas di lokasi proyek (Morowali, IKN Nusantara, Weda Bay, Balikpapan).

---

### D. Menu Khusus Pengguna / Operator Lapangan (Scan Barcode & Submit Status)
- Bagi pengguna dengan peran **`OPERATOR_USER`**, antarmuka disederhanakan secara mobile-first, ramah layar sentuh, dan hanya memuat fungsi operasional harian:
  1. **Pemindai Barcode (Kamera / Input Cepat)**: Memindai tag alat berat yang akan dioperasikan hari ini.
  2. **Pilihan Status Kondisi Mesin**:
     - **Bekerja / Normal (Working)**: Mesin normal, oli dan hidrolik prima, siap kerja.
     - **Rusak / Breakdown (Damaged)**: Terjadi kendala teknis atau mogok.
     - **Standby / Idle**: Alat normal namun tidak ada jadwal pengerjaan / cuaca buruk.
  3. **Input Hour Meter (HM) Terkini**: Mencatat jam kerja mesin harian secara akurat.
  4. **Pencatatan Rincian Kerusakan (Bila Rusak)**:
     - Kategori kerusakan: Mesin, Hidrolik, Kelistrikan, Track/Ban, Boom/Arm, Rem/Kemudi.
     - Tingkat keparahan: *Minor, Medium, Major, Critical Shutdown (Mati Total)*.
     - Deskripsi kronologi kendala.
     - **Unggah Foto Bukti Kerusakan**: Dapat mengambil foto kerusakan langsung dari kamera ponsel.
  5. **Auto-Trigger Work Order**:
     - Saat operator men-submit status **Rusak**, sistem secara otomatis mengunci unit, mengubah kondisi menjadi `NEEDS_REPAIR` / `DAMAGED`, dan langsung menerbitkan **Tiket Perbaikan Darurat** ke tim Asset Control & Workshop Pusat!

---

### E. Manajemen Pengguna & Kustomisasi Hak Akses (Khusus Divisi IT)
- Modul **`user-management`** hanya dapat diakses oleh **Administrator Admin (IT)**:
  1. **Direktori Pengguna Terpusat**:
     - Pencarian berdasarkan nama, email, nomor badge pegawai, dan departemen.
     - Filter berdasarkan Peran Sistem (9 roles) dan Penempatan Cabang/Site.
  2. **Pendaftaran Pengguna Baru**:
     - Mengisi nama, email perusahaan, peran dasar, penugasan cabang (Jakarta HQ, Balikpapan Depot, Morowali, IKN, Surabaya), dan nomor badge.
  3. **Kustomisasi Matriks Hak Akses Granular (*Custom Permissions Matrix*)**:
     - Admin IT dapat meng-klik tombol **`Atur Hak Akses`** pada setiap pengguna untuk mengatur izin spesifik per fitur:
       * *Dapat Melihat Dashboard & Metrik*
       * *Dapat Registrasi Aset & Tagging Barcode*
       * *Dapat Upload Dokumen Legalitas (STNK, BPKB, SIA)*
       * *Dapat Kelola Operator & SIO*
       * *Dapat Scan & Submit Status Alat (User Lapangan)*
       * *Dapat Catat Perbaikan & Work Order*
       * *Dapat Kelola Penawaran (Quotation) & Kontrak Sewa*
       * *Dapat Menerbitkan Invoice & Mencatat Pembayaran*
       * *Dapat Mengakses Modul Pengadaan (Procurement)*
       * *Dapat Mengelola Pengguna & Hak Akses (IT)*
       * *Dapat Mengakses REST API Explorer & Test Suite*
       * *Dapat Mengekspor Laporan ke Excel & PDF*
  4. **Pengaturan Keamanan & Status Akun**:
     - *Toggle* status akun: **AKTIF** vs **SUSPENDED**.
     - Fitur **Reset Password** mandiri oleh IT dengan *generate temporary password* aman dan pencatatan riwayat di audit log.
  5. **Cetak ID Card / Kartu Badge Pegawai**:
     - Menghasilkan kartu tanda pengenal berstandar korporasi dengan foto inisial, nomor badge, departemen, dan QR Code terverifikasi.
  6. **Export Daftar Pengguna**: Mengunduh seluruh database pengguna ke format spreadsheet Excel (CSV).

---

## 3. Tata Cara Masuk ke Sistem (Clean Enterprise Login)

1. Buka halaman utama aplikasi.
2. Tampilan halaman login dirancang bersih (*clean corporate portal*) tanpa menampilkan tombol peran di muka umum demi menjaga privasi dan keamanan hierarki perusahaan.
3. Masukkan alamat email korporasi Anda dan kata sandi:
   - Direktur Utama: `marcus@apex-industrial.com`
   - Admin IT: `hendra.it@apex-industrial.com`
   - Sales & Marketing: `elena@apex-industrial.com`
   - Asset Control: `bambang.asset@apex-industrial.com`
   - Management Operation: `joko.ops@apex-industrial.com`
   - Procurement: `dewi.proc@apex-industrial.com`
   - FAT: `sarah@apex-industrial.com`
   - AR Management: `reza.ar@apex-industrial.com`
   - Operator Lapangan: `agus.operator@apex-industrial.com`
4. Tersedia menu dropdown lipat *(collapsible)* **"Opsi Akun Demo Pengujian"** untuk kemudahan evaluasi fitur.
5. Klik **Masuk ke Sistem**. Sistem secara otomatis mendeteksi profil akun dan membuka menu kerja yang berhak diakses.
