# Keamanan dan Hak Akses

## Autentikasi

- Login menggunakan email dan password. Password disimpan dengan `scrypt` dan salt acak.
- Server menerbitkan token sesi HMAC dengan masa berlaku default 12 jam (`SESSION_HOURS`). Token dikirim ke API sebagai `Authorization: Bearer <TOKEN>`.
- Klien menyimpan token saja; profil dan modul efektif diminta dari server. Mengubah role di browser tidak memberi akses tambahan.
- Lima kegagalan login berturut-turut mengunci kombinasi IP/email selama 15 menit. Counter lockout berada di memori dan hilang ketika proses restart.
- Password minimal 8 karakter, harus memiliki huruf dan angka, maksimal 128 karakter. Akun baru production diminta mengganti password awal.

## Role dan ACL

Role serta modul bawaan didefinisikan di `src/shared/access.ts`. Server memeriksa akses setiap endpoint melalui ACL di `server/auth.ts`; endpoint yang tidak terdaftar ditolak. UI menyembunyikan menu yang tidak dimiliki pengguna, tetapi enforcement keamanan tetap dilakukan oleh API.

Role yang tersedia: `EXECUTIVE`, `ADMIN_IT`, `SALES_MARKETING`, `ASSET_CONTROL`, `MANAGEMENT_OPERATION`, `PROCUREMENT`, `FINANCE_ACCOUNTING_TAX`, `AR_MANAGEMENT`, `OPERATOR_USER`, `TECHNICAL_SERVICE`, dan `MANAGER`. Akun `MANAGER` tidak termasuk seed default.

## Pengelolaan Akun

- Manajemen pengguna tersedia bagi role yang memiliki modul `user-management` (bawaan: `ADMIN_IT`).
- API membatasi field yang dapat diubah; password hash dan token version tidak dikirim dalam respons pengguna.
- Admin tidak dapat menghapus/menonaktifkan dirinya sendiri atau menghilangkan administrator aktif terakhir.
- Password awal production dibuat dari `SEED_PASSWORD` atau dihasilkan acak saat startup pertama dan dicetak sekali di log. Batasi akses log dan segera ganti password tersebut.
- Backup tidak memuat password hash. Restore tidak mengganti akun maupun password yang tersimpan.

## Konfigurasi Production

- Set `NODE_ENV=production`, `DEMO_MODE=false`, dan `SESSION_SECRET` acak minimal 16 karakter (disarankan 32 byte acak atau lebih).
- Simpan secret di secret manager atau environment server; jangan commit `.env`, secret, database, atau backup.
- Pertahankan `SESSION_SECRET` yang sama ketika restart/deploy agar token tetap dapat diverifikasi. Mengubahnya membatalkan sesi lama.
- Publikasikan aplikasi lewat HTTPS. Jika memakai reverse proxy, set `TRUST_PROXY` hanya sesuai topologi proxy yang dipercaya.
- `ALLOW_DEMO_RESET=true` mengizinkan reset data demo di production; jangan aktifkan kecuali untuk prosedur pemulihan yang disetujui.
- Batasi izin filesystem ke `data/` dan arsip backup. Database JSON memerlukan deployment satu instance penulis; jangan berbagi file database antar-replika.

## Pengujian

`scripts/api_security_test.py` menambah user uji dan audit log serta memicu login lockout. Jalankan hanya di lingkungan disposable, jangan hapus `data/` project untuk menyiapkan test. Instruksi lengkap dan konfigurasi port ada di [Panduan Lengkap](PANDUAN_LENGKAP.md#10-build-lint-dan-pengujian).

## Scanner Kamera

Browser mengizinkan kamera pada HTTPS atau `localhost`. Untuk akses melalui IP/domain server gunakan HTTPS; pada HTTP non-localhost gunakan input manual atau alur unggah foto yang tersedia.


## Department boundary and customer deletion (local-review revision)

`ADMIN_IT` is the only role intended to have all department modules. Executive oversight defaults to dashboard, reports, and approvals rather than every operational module. Department roles should only receive the modules required by their job. Verify both navigation and direct API requests after changing access.

Customer deletion returns a conflict when business transactions reference that customer. This is intentional to protect transaction history; inactivate historical customer records instead of deleting them.
