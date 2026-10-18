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
