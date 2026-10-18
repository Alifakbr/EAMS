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
