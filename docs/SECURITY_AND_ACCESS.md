# Keamanan & Hak Akses (ACL)

## Cara kerja login
- Login memakai **email + password**. Password disimpan sebagai hash `scrypt` + salt (tidak pernah terbaca).
- Server menerbitkan token sesi bertanda tangan (HMAC) berlaku `SESSION_HOURS` jam (default 12).
- Klien **hanya menyimpan token**. Peran dan menu selalu diambil dari server (`GET /api/v1/auth/me`) — mengubah isi
  localStorage tidak bisa menaikkan hak akses.
- 5 kali gagal berturut-turut → akun/IP dikunci 15 menit.
- Password diganti → semua sesi lama otomatis gugur. Akun dinonaktifkan → sesi gugur seketika.
- Akun baru / hasil reset admin **wajib ganti password** pada login pertama.

## Modul & peran
Definisi tunggal ada di `src/shared/access.ts` (dipakai server dan UI):
- `ROLE_MODULES` — modul (menu) bawaan tiap peran.
- `PERMISSION_MODULES` — pemetaan kunci "Hak Akses Kustom" di Manajemen Pengguna ke modul.
- Hak akses kustom hanya berlaku bila **berbeda** dari bawaan peran (delta), jadi menyimpan matriks tanpa perubahan tidak mengubah apa pun.

## Penegakan di server (deny-by-default)
Setiap request ke `/api/v1/*` melewati `authenticateAndAuthorize` (`server/auth.ts`). Tabel `ACL` memetakan
`metode + path` → modul yang dibutuhkan. **Endpoint yang tidak terdaftar ditolak (403).** Saat menambah endpoint baru,
daftarkan juga di tabel `ACL`.

## Aturan khusus manajemen akun
- Hanya modul `user-management` (Administrator IT secara bawaan).
- Tidak bisa mengubah peran/status/hak akses akun sendiri; tidak bisa menonaktifkan diri sendiri.
- Selalu harus ada minimal 1 Administrator IT aktif.
- Field yang bisa diubah dibatasi (whitelist); hash password tidak pernah dikirim ke klien.
- Backup tidak memuat hash password; restore tidak menimpa akun.

## Variabel lingkungan
Lihat `.env.example` (`SESSION_SECRET`, `SEED_PASSWORD`, `DEMO_MODE`, `TRUST_PROXY`, ...).

## Menjalankan uji keamanan
```bash
rm -rf data && npm run dev          # terminal 1 (port 3000 → set PORT=3111 atau EAMS_URL)
EAMS_URL=http://localhost:3000 npm run test:api   # terminal 2
```

## Kamera / scanner
Browser hanya mengizinkan kamera pada **HTTPS** atau `localhost`. Bila aplikasi dibuka lewat `http://IP-server`,
kamera live tidak akan aktif; gunakan HTTPS (mis. reverse proxy dengan sertifikat) atau tombol "Foto Barcode" /
input manual sebagai cadangan.
