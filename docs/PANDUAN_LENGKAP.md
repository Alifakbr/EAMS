# Panduan Lengkap Apex EAMS

Panduan ini menjelaskan implementasi yang tersedia di repository saat ini. Aplikasi terdiri dari frontend React/Vite, API Express, dan database berbasis file JSON. Sistem belum menggunakan PostgreSQL, Redis, worker terpisah, atau layanan backup terjadwal. Untuk perbedaan antara implementasi dan rancangan, lihat catatan di [spesifikasi arsitektur](EARMS_ARCHITECTURE_SPECIFICATION.md).

## Daftar Isi

1. [Persyaratan](#1-persyaratan)
2. [Instalasi Lokal](#2-instalasi-lokal)
3. [Konfigurasi Lingkungan](#3-konfigurasi-lingkungan)
4. [Menjalankan di Server](#4-menjalankan-di-server)
5. [Database dan Data Seed](#5-database-dan-data-seed)
6. [Fitur dan Peran](#6-fitur-dan-peran)
7. [API](#7-api)
8. [Backup dan Restore](#8-backup-dan-restore)
9. [Keamanan Operasional](#9-keamanan-operasional)
10. [Build, Lint, dan Pengujian](#10-build-lint-dan-pengujian)
11. [Troubleshooting](#11-troubleshooting)

## 1. Persyaratan

- Node.js 22 LTS direkomendasikan; Docker image menggunakan Node 22.
- npm 10 atau lebih baru.
- Untuk deployment container: Docker Engine dan Docker Compose v2 (`docker compose`).
- Ruang disk dan backup harus disesuaikan dengan pertumbuhan file database di `data/`.
- Untuk akses kamera barcode dari perangkat lain, gunakan HTTPS. Browser umumnya hanya mengizinkan kamera pada HTTPS atau `localhost`.

## 2. Instalasi Lokal

### Windows PowerShell

```powershell
git clone <URL-REPOSITORY>
Set-Location EAMS-main
npm install
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Buka `.env` dan atur konfigurasi lokal bila diperlukan. Untuk membuat secret acak:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Salin hasilnya ke `SESSION_SECRET` di `.env`. Untuk penggunaan lokal, aplikasi dapat berjalan tanpa nilai ini karena secret sesi disimpan di `data/.session_secret`.

Jalankan server:

```powershell
npm run dev
```

Buka `http://localhost:3000`. Health check: `http://localhost:3000/api/health`.

Jika port 3000 sudah dipakai, ubah port untuk sesi terminal saat ini:

```powershell
$env:PORT = '3111'
npm run dev
```

### macOS / Linux

```bash
git clone <URL-REPOSITORY>
cd EAMS-main
npm install
[ -f .env ] || cp .env.example .env
npm run dev
```

Jangan menimpa `.env` yang sudah berisi konfigurasi lokal. File `.env` diabaikan oleh Git; jangan masukkan secret ke `.env.example`.

## 3. Konfigurasi Lingkungan

Server memuat `.env` melalui `dotenv`. Variabel yang dipakai saat ini:

| Variabel | Default | Keterangan |
|---|---|---|
| `NODE_ENV` | mode development jika tidak `production` | `production` membuat server menyajikan `dist/` dan menonaktifkan demo secara default. |
| `PORT` | `3000` | Port HTTP server. |
| `SESSION_SECRET` | secret acak di `data/.session_secret` | Secret HMAC sesi. Jika disetel, panjang minimal 16 karakter; gunakan nilai acak yang panjang dan stabil. Mengubah secret membatalkan token sesi lama. |
| `SESSION_HOURS` | `12` | Masa berlaku token sesi dalam jam. |
| `SEED_PASSWORD` | kosong | Password awal akun seed yang belum memiliki hash. Jika kosong, development memakai password demo; production membuat password acak dan mencetaknya sekali ke log. Tidak mereset password akun yang sudah ada. |
| `DEMO_MODE` | `true` di development, `false` di production | Mengaktifkan pengalaman/akun demo. Jangan aktifkan di production. |
| `ALLOW_DEMO_RESET` | `false` di production | Harus bernilai `true` agar endpoint reset demo diizinkan di production. Tidak disarankan. |
| `TRUST_PROXY` | `false` | Atur hanya jika berada di belakang reverse proxy yang dipercaya. Konfigurasi ini memengaruhi IP request yang dilihat Express. |
| `DISABLE_HMR` | `false` | Khusus Vite; `true` menonaktifkan HMR dan file watching. |

`GEMINI_API_KEY` dan `APP_URL` tercantum sebagai placeholder platform di `.env.example`, tetapi tidak dibaca oleh kode server saat ini. Keduanya tidak diperlukan untuk menyalakan fitur inti aplikasi.

### Mode demo dan password awal

Di development, mode demo aktif secara default. Pada database seed yang belum memiliki password, password demo adalah `Demo@2026`, kecuali `SEED_PASSWORD` diisi sebelum akun pertama kali dibuat. Password tersimpan sebagai hash; mengubah `.env` kemudian tidak mengganti password akun yang sudah memiliki hash.

Di production, set `DEMO_MODE=false`, gunakan `SESSION_SECRET` acak, dan atur `SEED_PASSWORD` sementara sebelum inisialisasi pertama atau ambil password acak dari log startup. Ganti password awal melalui aplikasi. Jangan membagikan log production karena dapat memuat password awal yang dibuat otomatis.

## 4. Menjalankan di Server

### Production dengan Docker Compose (direkomendasikan)

1. Buat `.env` di root project dari `.env.example` bila belum ada.
2. Isi sekurangnya `SESSION_SECRET` dengan secret acak minimal 16 karakter. Untuk production, isi juga `SEED_PASSWORD` dengan password sementara yang kuat dan pastikan `DEMO_MODE=false`.
3. Jalankan:

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f apex-eams
```

Compose memublikasikan port `3000`, menjalankan health check ke `/api/health`, dan menyimpan data pada named volume `eams_data` yang dipasang ke `/app/data`.

Perintah pengelolaan:

```bash
docker compose stop
docker compose start
docker compose down
```

`docker compose down` mempertahankan named volume. **Jangan gunakan `docker compose down -v` kecuali memang ingin menghapus database production.** Aplikasi saat ini menyimpan data pada satu file; jalankan satu instance penulis saja dan jangan scale service ke beberapa replika yang berbagi file tersebut.

Pasang reverse proxy HTTPS (misalnya Nginx, Caddy, atau Traefik) untuk akses publik. Jangan mengekspos login melalui HTTP publik. Set `TRUST_PROXY` sesuai topologi proxy, bukan secara membabi buta.

### Production tanpa Docker

Di server dengan Node.js 22:

```bash
npm ci
npm run build
NODE_ENV=production npm start
```

Atur `PORT`, `SESSION_SECRET`, dan variabel production melalui environment manager atau service manager. Pastikan proses dijalankan dari direktori project yang benar karena lokasi database dihitung relatif ke working directory. Persistensikan direktori `data/` dan lindungi akses filesystem-nya.

Di PowerShell, environment variable untuk satu sesi dapat disetel seperti ini:

```powershell
$env:NODE_ENV = 'production'
$env:SESSION_SECRET = '<SECRET-ACAK-MINIMAL-16-KARAKTER>'
npm run build
npm start
```

Jalankan proses dengan process manager atau Windows Service yang sesuai untuk server Anda. Pastikan service memakai working directory project yang benar.

## 5. Database dan Data Seed

Database saat ini adalah file JSON, bukan server database relasional:

- File utama: `data/eams_db.json` relatif terhadap working directory.
- Secret sesi fallback: `data/.session_secret`.
- Implementasi: `server/db.ts`.
- Seed awal memuat data contoh, pengaturan awal, aset, customer, produk, dan akun pengguna.

Pada startup pertama, aplikasi membuat state seed dan menyimpannya saat ada perubahan. Database yang sudah ada dipertahankan; aplikasi menambahkan beberapa data seed yang belum ada dan tidak mengganti akun yang sudah tersimpan. Jika JSON tidak valid atau koleksi inti tidak lengkap, server menolak startup agar tidak menimpa data dengan seed baru. Pulihkan file dari backup; jangan menghapus `data/` sebagai langkah troubleshooting biasa.

File JSON diserialisasi sebagai satu state. Ini cocok untuk demo dan deployment satu instance, tetapi bukan pengganti PostgreSQL untuk beban tinggi, konkurensi banyak instance, pemulihan point-in-time, atau kebutuhan HA. Buat backup rutin, batasi izin filesystem, dan uji proses restore.

## 6. Fitur dan Peran

Modul yang tersedia mencakup dashboard, customer/CRM, katalog produk, aset, quotation, sales order, rental, delivery/handover, invoice, pembayaran, procurement/vendor, maintenance, layanan teknis, scan status operator, approval manager, reports, user management, API explorer, test runner, dan settings/audit log.

Akses menu ditentukan oleh role dan permission pada server. Menu yang tersembunyi di UI bukan pengganti otorisasi API.

| Role | Fokus akses bawaan |
|---|---|
| `EXECUTIVE` | Dashboard, laporan, dan modul bisnis sesuai konfigurasi role. |
| `ADMIN_IT` | Semua modul termasuk pengguna, settings, API, dan test runner. |
| `SALES_MARKETING` | Customer, quotation, sales, delivery, produk/aset, laporan. |
| `ASSET_CONTROL` | Aset, delivery, produk, maintenance, laporan. |
| `MANAGEMENT_OPERATION` | Maintenance, aset, delivery, rental, laporan. |
| `PROCUREMENT` | Procurement, produk, laporan. |
| `FINANCE_ACCOUNTING_TAX` | Invoice, pembayaran, customer, laporan. |
| `AR_MANAGEMENT` | Invoice, laporan, pembayaran, customer. |
| `OPERATOR_USER` | Status dan scan peralatan lapangan. |
| `TECHNICAL_SERVICE` | Layanan teknis, maintenance, aset, produk, laporan. |
| `MANAGER` | Approval manager; role ini tersedia, tetapi bukan salah satu akun seed default. |

Akun seed default berjumlah 10: `marcus@apex-industrial.com`, `hendra.it@apex-industrial.com`, `elena@apex-industrial.com`, `bambang.asset@apex-industrial.com`, `joko.ops@apex-industrial.com`, `dewi.proc@apex-industrial.com`, `sarah@apex-industrial.com`, `reza.ar@apex-industrial.com`, `agus.operator@apex-industrial.com`, dan `dani.tech@apex-industrial.com`. Di mode demo lokal, password default bagi akun seed yang belum memiliki password adalah `Demo@2026`. Jangan gunakan akun/password seed untuk deployment production.

## 7. API

Base API: `http://localhost:3000/api/v1`. Semua endpoint di bawah `/api/v1` memerlukan token kecuali login; otorisasi mengikuti ACL server.

Endpoint umum:

| Endpoint | Fungsi |
|---|---|
| `GET /api/health` | Health check anonim. |
| `GET /api/public-config` | Konfigurasi publik untuk UI login. |
| `POST /api/v1/auth/login` | Login; body JSON `{ "email": "...", "password": "..." }`. |
| `GET /api/v1/auth/me` | Profil dan modul efektif pengguna. |
| `POST /api/v1/auth/logout` | Logout sesi klien. |
| `POST /api/v1/auth/change-password` | Ganti password. |
| `GET /api/v1/openapi.json` | Dokumen OpenAPI; perlu akses API Explorer. |
| `GET /api/v1/system/backup` | Unduh backup; perlu akses Settings. |
| `POST /api/v1/system/restore` | Restore data; perlu akses Settings. |
| `POST /api/v1/system/reset-demo` | Reset data demo; dibatasi di production. |
| `GET /api/v1/system/run-tests` | Test suite aplikasi; perlu akses Test Runner. |

Setelah login, kirim token sebagai `Authorization: Bearer <TOKEN>`. Contoh:

```bash
curl -H "Authorization: Bearer <TOKEN>" http://localhost:3000/api/v1/auth/me
```

API memakai deny-by-default ACL. Endpoint baru harus didaftarkan di `server/auth.ts`. Body JSON server dibatasi 10 MB. Endpoint `openapi.json` adalah file spesifikasi JSON; aksesnya tetap dibatasi ACL.

## 8. Backup dan Restore

### Membuat backup

Cara termudah adalah menu **Settings & Audit Log** lalu unduh backup. Endpoint API juga tersedia, tetapi memerlukan token pengguna yang memiliki akses Settings:

```bash
curl -f -H "Authorization: Bearer <TOKEN>" -OJ http://localhost:3000/api/v1/system/backup
```

Backup mencakup data bisnis dan informasi publik akun, tetapi tidak menyertakan password hash atau token version. Perlakukan file backup sebagai data sensitif.

Untuk mengambil file database dari container yang sedang berjalan:

```bash
mkdir -p backups
docker cp apex_eams_platform:/app/data/eams_db.json ./backups/eams_db_$(date +%F).json
```

### Restore

Restore mengganti state bisnis dari JSON backup dan **tidak mengganti akun pengguna/password**. Pastikan file berasal dari sumber tepercaya dan buat backup kondisi saat ini terlebih dahulu. Endpoint menerima JSON hingga batas body 10 MB:

```bash
curl -f -X POST http://localhost:3000/api/v1/system/restore \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  --data-binary @./backups/apex_eams_backup.json
```

Untuk pemulihan file Docker: `docker compose stop`, salin file ke `/app/data/eams_db.json` pada container `apex_eams_platform` dengan `docker cp`, lalu `docker compose start`. Validasi `/api/health` dan data di UI setelah restore.

Reset demo mengembalikan data bisnis ke seed. Gunakan hanya pada lingkungan uji setelah backup; di production endpoint ditolak kecuali `ALLOW_DEMO_RESET=true`.

## 9. Keamanan Operasional

- Password di-hash dengan `scrypt` dan salt acak.
- Token sesi ditandatangani HMAC dan berlaku default 12 jam.
- Lima kegagalan login berturut-turut mengunci kombinasi IP/email selama 15 menit.
- ACL API deny-by-default; role dan permission diperiksa server-side.
- Password baru minimal 8 karakter, mengandung huruf dan angka, maksimal 128 karakter.
- Gunakan HTTPS, secret acak stabil, password awal unik, dan akun dengan least privilege.
- Batasi akses ke `.env`, `data/`, backup, dan log; jangan commit `.env` atau membagikan log yang memuat password awal.
- Perubahan password, user, backup, restore, dan aktivitas penting dicatat di audit log.
- Uji backup dan restore berkala di lingkungan non-production.

Rincian lebih lanjut ada di [Keamanan dan Hak Akses](SECURITY_AND_ACCESS.md).

## 10. Build, Lint, dan Pengujian

```bash
npm run lint
npm run build
```

Test suite aplikasi tersedia di menu **Automated Test Suite** atau `GET /api/v1/system/run-tests` bagi pengguna berhak.

Uji keamanan API ada di `scripts/api_security_test.py` dan membutuhkan Python serta paket `requests`. Script menambahkan akun uji, audit log, dan menguji lockout. Jalankan hanya dari salinan project dengan database disposable, bukan database project utama atau production. Jika perlu database seed baru, hapus atau pindahkan file data hanya di salinan uji tersebut. Script menargetkan port 3111 secara default. Di Windows, mulai server uji pada terminal pertama dari salinan uji:

```powershell
$env:PORT = '3111'
$env:DEMO_MODE = 'true'
$env:SEED_PASSWORD = 'Demo@2026'
npm run dev
```

Di terminal kedua, dari root project:

```powershell
$env:EAMS_URL = 'http://localhost:3111'
py -m pip install requests
py scripts/api_security_test.py
```

Pada macOS/Linux, gunakan `python3 -m pip install requests` dan `python3 scripts/api_security_test.py`. Jangan menghapus database project untuk menjalankan tes; siapkan salinan project/database yang disposable.

## 11. Troubleshooting

| Gejala | Pemeriksaan / tindakan |
|---|---|
| `EADDRINUSE` atau port tidak dapat dipakai | Gunakan port lain melalui `PORT`, lalu buka URL dengan port tersebut. |
| `SESSION_SECRET` wajib di Docker | Isi `.env` di root project dan jalankan ulang `docker compose up -d`. |
| Login demo ditolak | Mode demo tidak aktif, database sudah memiliki password berbeda, atau akun sudah mengubah password. `SEED_PASSWORD` hanya berlaku ketika hash belum ada. |
| Server menolak JSON database | Hentikan server, simpan salinan file rusak, lalu pulihkan backup valid. Aplikasi sengaja tidak mengganti data dengan seed secara otomatis. |
| Sesi logout setelah restart | Pastikan `data/.session_secret` persisten atau atur `SESSION_SECRET` yang sama di setiap restart/container. |
| API mengembalikan 401 | Pastikan token Bearer valid dan belum kedaluwarsa. Login ulang. |
| API mengembalikan 403 | Pengguna tidak memiliki modul/aksi yang diperlukan; minta admin memberi akses sesuai tugas. |
| Kamera barcode tidak terbuka di IP server | Gunakan HTTPS; browser membatasi akses kamera pada koneksi non-secure selain localhost. |
| Restore gagal | Pastikan JSON valid, struktur memiliki `assets`, `customers`, `products` berupa array, token berhak, dan ukuran request tidak melebihi 10 MB. |

## Dokumen Terkait

- [Instalasi](INSTALLATION.md)
- [Panduan Pengguna](USER_GUIDE.md)
- [Keamanan dan Hak Akses](SECURITY_AND_ACCESS.md)
- [Backup dan Restore](BACKUP_RESTORE.md)

## Pembaruan Oktober 2026

Untuk detail revisi alur penjualan, rental, notifikasi SIA, branding, kategori jabatan, import backup, dan perbaikan responsivitas, lihat [Revisi EAMS Oktober 2026](REVISI_EAMS_2026-10.md). Pengingat penting: database versi ini disimpan dalam JSON di `data/eams_db.json`; jangan menganggapnya PostgreSQL. Simpan file `.env` dan data runtime sebagai konfigurasi/volume terpisah, bukan bagian source code yang dibagikan.
