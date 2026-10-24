# Instalasi Apex EAMS

Dokumen ini adalah ringkasan. Panduan utama tentang konfigurasi server, database JSON, Docker, autentikasi, backup/restore, dan troubleshooting ada di [Panduan Lengkap](PANDUAN_LENGKAP.md).

## Persyaratan

- Node.js 22 LTS dan npm 10 atau lebih baru.
- Docker Engine dan Docker Compose v2 untuk instalasi container.
- HTTPS dan reverse proxy untuk akses dari jaringan publik.

## Development Lokal

### Windows PowerShell

```powershell
npm install
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm run dev
```

### macOS / Linux

```bash
npm install
[ -f .env ] || cp .env.example .env
npm run dev
```

Buka `http://localhost:3000`. Periksa server di `http://localhost:3000/api/health`. Dalam development, mode demo aktif secara default; jangan gunakan kredensial demo di production.

## Production dengan Docker Compose

Isi `.env` di root project, set `SESSION_SECRET` yang kuat, lalu jalankan:

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f apex-eams
```

Data persisten ada pada volume Docker `eams_data`. `docker compose down` mempertahankan volume; `docker compose down -v` menghapusnya.

## Pemeriksaan

```bash
npm run lint
npm run build
```

Untuk pengujian API, gunakan database uji yang terpisah. Script keamanan API membuat akun dan audit log; jangan jalankan pada production. Detail ada di [Panduan Lengkap](PANDUAN_LENGKAP.md#10-build-lint-dan-pengujian).
