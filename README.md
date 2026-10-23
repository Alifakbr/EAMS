# Apex EAMS

Aplikasi operasional EAMS dengan antarmuka React/Vite, API Express, autentikasi berbasis peran, dan penyimpanan data JSON lokal.

## Mulai Cepat

Persyaratan: Node.js 22 LTS dan npm 10 atau lebih baru.

```powershell
npm install
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm run dev
```

Buka `http://localhost:3000`. Health check: `http://localhost:3000/api/health`.

Di development, `DEMO_MODE` aktif secara default. Akun seed yang belum memiliki password menggunakan password demo `Demo@2026`. Jangan gunakan mode atau password demo di production.

## Dokumentasi

- [Panduan Lengkap: instalasi, server, database, keamanan, API, backup, dan troubleshooting](docs/PANDUAN_LENGKAP.md)
- [Instalasi](docs/INSTALLATION.md)
- [Panduan Pengguna](docs/USER_GUIDE.md)
- [Keamanan dan Hak Akses](docs/SECURITY_AND_ACCESS.md)
- [Backup dan Restore](docs/BACKUP_RESTORE.md)
- [API dan aturan workflow revisi Oktober 2026](docs/API_WORKFLOW_REVISION.md)
- [Ringkasan revisi EAMS Oktober 2026](docs/REVISI_EAMS_2026-10.md)
- [Spesifikasi Arsitektur](docs/EARMS_ARCHITECTURE_SPECIFICATION.md) - dokumen blueprint; lihat panduan lengkap untuk kondisi implementasi aktual.

## Perintah Utama

```bash
npm run dev      # server lokal + Vite
npm run build    # build frontend production
npm start        # server production (NODE_ENV=production dan dist/ harus tersedia)
npm run lint     # pemeriksaan TypeScript
npm run test:api # uji keamanan API; gunakan database uji terpisah
```

Jangan commit `.env` atau data database. File `.env` diabaikan Git; gunakan `.env.example` sebagai template tanpa rahasia.


## Latest IT / Compliance updates

- GPS Fleet Map has a dedicated print style for A4 landscape. Enable browser background graphics and wait for OpenStreetMap tiles before printing.
- Compliance reminders cover SIA records (multiple attachments), STNK, BPKB when an expiry date is configured, equipment inspection due dates and operator SIO. The monitor triggers at 30 days, with critical escalation at 7 days or after expiry.
- IT Settings provides full backup plus selective export/import of supported JSON-backed collections and a test-only operational-data clearing button that preserves user credentials and settings.
- User Management contains a GRC Access Control review tab.
- The database remains JSON-backed (`data/eams_db.json`), not a SQL table store. See `docs/USER_GUIDE.md`, `docs/BACKUP_RESTORE.md`, and `docs/API_WORKFLOW_REVISION.md`.


## Equipment Rental Rate Calculator

- Akses melalui **Quotations → Rate Calculator**.
- Menghitung standard/reference monthly, daily, hourly, lumpsum, serta reference hourly Sabtu/Minggu.
- Kalender kontrak mendukung tanggal mulai/akhir, opsi hari kerja Sabtu/Minggu, dan daftar tanggal libur.
- Hasil dapat diterapkan ke item pertama quotation yang sedang dibuat. Rate basis hourly/daily/monthly harus tetap dijelaskan dalam terms/remarks karena model quotation saat ini belum menyimpan unit rate yang lebih granular.
- Multiplier belum disimpan secara persisten dan belum ada endpoint calculator khusus.
