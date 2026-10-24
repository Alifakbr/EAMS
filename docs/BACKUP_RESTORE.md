# Backup dan Restore

Database aktual disimpan sebagai file JSON di `data/eams_db.json`; pada Docker, direktori tersebut berada di volume `eams_data`. Aplikasi tidak membuat backup terjadwal secara otomatis. Buat backup manual dan uji pemulihan secara berkala.

## Membuat Backup

1. Di aplikasi, buka **Settings & Audit Log** dan gunakan fungsi unduh backup.
2. Atau gunakan API dengan token pengguna yang memiliki akses Settings:

```bash
curl -f -H "Authorization: Bearer <TOKEN>" -OJ http://localhost:3000/api/v1/system/backup
```

3. Untuk menyalin file langsung dari container:

```bash
mkdir -p backups
docker cp apex_eams_platform:/app/data/eams_db.json ./backups/eams_db_$(date +%F).json
```

Simpan backup di lokasi akses terbatas dan di luar volume/container yang sama. Backup berisi data bisnis dan informasi akun publik; password hash tidak disertakan.

## Restore melalui API

Buat backup kondisi saat ini terlebih dahulu. Pastikan file JSON valid dan token memiliki akses Settings.

```bash
curl -f -X POST http://localhost:3000/api/v1/system/restore \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  --data-binary @./backups/apex_eams_backup.json
```

Restore memperbarui data bisnis, tetapi tidak menimpa akun/password. Struktur backup harus memiliki koleksi `assets`, `customers`, dan `products` berupa array. Ukuran body JSON API dibatasi 10 MB.

## Restore File Database Docker

Hentikan service sebelum mengganti file agar tidak ada proses yang menulis bersamaan:

```bash
docker compose stop
docker cp ./backups/eams_db.json apex_eams_platform:/app/data/eams_db.json
docker compose start
docker compose logs --tail=100 apex-eams
```

Sesudahnya periksa `http://localhost:3000/api/health` dan validasi data dari UI. `docker compose down` tidak menghapus volume; jangan gunakan `docker compose down -v` kecuali memang bermaksud menghapus data.

## Reset Data Demo

Endpoint reset hanya untuk lingkungan uji dan tetap memerlukan akses Settings. Di production endpoint ditolak kecuali `ALLOW_DEMO_RESET=true`; jangan aktifkan untuk penggunaan normal. Reset mengganti data bisnis dengan seed tetapi mempertahankan akun pengguna. Detail konfigurasi ada di [Panduan Lengkap](PANDUAN_LENGKAP.md#8-backup-dan-restore).

## Import dari UI Settings

Versi revisi menyediakan tombol **Import Backup (.json)** di menu Settings. Pilih file backup EAMS, tinjau konfirmasi, lalu jalankan restore. Backend mempertahankan user/password saat ini dan memulihkan koleksi bisnis dari backup. UI membatasi file import sampai 8 MB; batas payload API tetap mengikuti konfigurasi Express (`10mb`), sehingga file besar dapat ditolak oleh server dan harus dipulihkan melalui prosedur file database/volume pada instance uji.

**Catatan:** jangan menggunakan backup dari versi skema yang tidak kompatibel pada produksi tanpa menguji restore pada salinan database terlebih dahulu.


## Selective table export/import

The IT-only endpoints `GET /system/data-tables`, `GET /system/export-tables?tables=assets,customers`, and `POST /system/import-tables` support migration of selected collections. Export format: `{ "format": "EAMS_TABLE_EXPORT", "version": 1, "tables": { "assets": [] } }`. Only keys returned by `/system/data-tables` are accepted. The `users` export contains public metadata and never exports password hashes; importing user metadata only updates existing accounts and preserves their stored credentials. Import replaces each selected non-user collection, so create a full backup before importing.

`POST /system/clear-business-data` clears operational records but preserves users and system settings. It is restricted to IT Administrator and blocked in production unless `ALLOW_DEMO_RESET=true`. This safeguard exists for isolated test environments only.
