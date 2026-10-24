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

- **[Project Map — wajib dibaca sebelum prompt/koding berikutnya](docs/00_PROJECT_MAP_AND_NEXT_PROMPT.md)**
- [Catatan revisi local review 24 Oktober 2026](docs/REVISION_2026-10-24_LOCAL_REVIEW.md)

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
- Customer CRM supports editing and safe deletion; deletion is blocked when business transactions still reference the customer.
- PO vendor selection reconciles asynchronously loaded vendors and validates PO line items before submission.
- Approvals & Contracts displays structured, readable record fields.
- Form validation and API failures are shown through non-blocking notifications.
- GPS map print waits for tile images and warns when map tiles are still missing.
- The database remains JSON-backed (`data/eams_db.json`), not a SQL table store. See `docs/USER_GUIDE.md`, `docs/BACKUP_RESTORE.md`, and `docs/API_WORKFLOW_REVISION.md`.


## Equipment Rental Rate Calculator (latest local package)

Open **Quotations → Rate Calculator** to calculate Standard and Reference rates for Monthly, Daily, Hourly, and Lumpsum. The calculator includes separate Saturday/Sunday hourly multipliers, contract calendar, optional weekend work, holidays, and an action to apply the selected value to the first quotation item.

### Mobile / tablet UI
Responsive refinements have been added for narrow screens: calculator forms stack to one column, input and action controls stay within viewport width, action buttons use consistent touch heights, and wide tables scroll horizontally instead of stretching the page.

### Run locally on Windows
Requirements: Node.js LTS (includes npm). The current source package uses the application's JSON-backed data store; PostgreSQL is not wired into this build.

1. Extract this ZIP to a writable folder, e.g. `C:\EAMS`.
2. Open PowerShell in that folder.
3. Run `npm ci`.
4. Copy `.env.example` to `.env` and fill in the required environment values (especially `SESSION_SECRET` and database/runtime settings documented in `.env.example`).
5. Run `npm run lint` to check TypeScript.
6. Run `npm run build` to build the frontend.
7. Run `npm run dev` to start the application. Open the local URL printed in the terminal.

This source ZIP intentionally excludes `.env`, user credentials, runtime database contents, `node_modules`, and build output. Keep a backup before importing any production data.

### Current calculator limitations
- Multiplier values are currently entered per calculator session and are not saved as persistent database settings.
- The current quotation model persists `REGULAR` or `LUMPSUM`; Hourly/Daily/Monthly basis is not a separate persisted field yet. Record the chosen basis in quotation terms/remarks.
- The calendar is an estimating aid; it does not automatically change invoicing behavior or contractual billing type.

## Latest local review updates (2026-10-24)
See `docs/00_PROJECT_MAP_AND_NEXT_PROMPT.md` first for the source map, then `docs/REVISION_2026-10-24_GPS_CONTRACT_FINANCE.md` for GPS print, Sales Order contract PDF, and Procurement-to-Finance details and manual test checklist.


## Latest local review revision (24 Oct 2026)

Read `docs/00_PROJECT_MAP_AND_NEXT_PROMPT.md` first, then `docs/REVISION_2026-10-24_APPROVAL_FINANCE_DISPATCH.md` and the earlier revision history documents listed there. This revision removes Work Orders from Manager Approvals, removes the Sales Order `ALLOCATED` state (legacy values normalize to `CONFIRMED`), adds Finance date/category/source/status filters and Excel-compatible CSV export with clearly labeled tax simulation, blocks SO dispatch without contract reference + PDF, and records the first successful operator scan as the system-stamped equipment mobilization start. Limitations and mandatory local tests are documented in the revision log.


## Latest local review revision
For the latest sidebar and multiple-SIA changes, read `docs/00_PROJECT_MAP_AND_NEXT_PROMPT.md` first, then `docs/REVISION_2026-10-24_SIDEBAR_SIA.md`. No GitHub branch or commit was created for this local review package.
