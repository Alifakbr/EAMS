# EAMS Local Source Revision — October 2026

This package is a local source-code revision of the uploaded EAMS project. No GitHub push or remote repository changes were performed.

## Implemented in this revision

- SIA compliance supports multiple attached certificates/files per asset, including per-document certificate number and expiry date.
- SIA reminders are generated when the remaining validity is 30 days or less; expired certificates are escalated to critical. Notifications update as expiry approaches and are synchronized through asset/notification reads.
- Rental allocation conflicts for equipment already marked `RENTED` are blocked, logged, and notified to Asset Control, Sales, Operations, and Manager.
- Settings UI supports logo/favicon customization, JSON backup import, and management of job-position/department categories.
- User Management suggests the configured job-position categories while retaining free-text compatibility.
- Fleet map z-index and Operator Attendance barcode lookup layout were adjusted for navbar layering and small-screen responsiveness.
- OpenAPI metadata and documentation were updated for revised endpoints and business rules.
- Fixed a pre-existing TypeScript narrowing error in `src/utils/xlsx.ts` so `npm run lint` passes.

## Existing workflow controls verified in source

- Sale quotations use available equipment, carry remarks into the Sales Order, and include transport/mobilization price fields.
- Sales Order cancellation cancels its linked quotation and releases safe reservations; invoice/rental constraints remain enforced.
- Equipment sales are marked `SOLD` only after the related invoice reaches `PAID`; mobilization checks this condition.
- Rental contracts follow approval, mobilization, active rental, return inspection, and settlement paths already present in the application.

## Validation performed

- `npm run lint`: **passed** (TypeScript check).
- `npm run build`: **not completed in this environment** because the uploaded `node_modules` originated from Windows and the Linux sandbox lacks the matching native Vite/Rolldown binding. This ZIP intentionally excludes `node_modules`; run `npm install` on the target Windows/Linux host before building.
- API runtime/security test suite: **not executed** in this sandbox because the included dependency tree is platform-specific. Run `npm run test:api` against a fresh test instance after installing dependencies; never run the API security script against production.

## Local testing steps

1. Extract this ZIP to a new folder.
2. Install Node.js 22 LTS and npm 10+.
3. Run `npm install`.
4. Copy `.env.example` to `.env`. Set a unique random `SESSION_SECRET` (minimum 16 characters); set `DEMO_MODE=true` only for local testing.
5. Run `npm run lint`, then `npm run build`, then `npm run dev`.
6. Open `http://localhost:3000` and check `http://localhost:3000/api/health`.
7. Runtime data will be created in `data/eams_db.json`; this package does not include the uploaded instance database, session secret, `.env`, `.git`, `node_modules`, or built `dist` folder.

## Important architecture note

The uploaded project currently uses a JSON-file database at `data/eams_db.json`; it is not a PostgreSQL deployment. This revision preserves that architecture rather than attempting an unrequested database migration.


## Completed implementation pass

1. Fleet map print: A4 landscape named page, fixed map height, Leaflet invalidate/redraw before print, waits for tile images up to 3.5 seconds, preserves print colors. Browser background graphics and network tile availability remain environmental requirements.
2. Compliance: multiple SIA records/attachments and expiry sync for SIA, STNK, configured BPKB expiry, inspection due date, and operator SIO. Reminders start within 30 days; critical within 7 days or expired.
3. IT data migration: table list/count, selectable JSON export, selective JSON import, sanitized user metadata support while preserving existing passwords. Full backup/restore remains available.
4. Data reset: explicit destructive clear-business-data action, IT Administrator only, keeps user accounts/credentials and system settings, production-blocked unless explicitly enabled for controlled testing.
5. GRC Access Control: new tab inside User Management with role-permission matrix and least-privilege review checklist.
6. Documentation/API: updated OpenAPI descriptions and user/backup/workflow guides.

Verification: `npm run lint` passed after code changes. `npm run build` could not be verified in this environment because the uploaded `node_modules` contains Windows-only native binaries (Rolldown/esbuild); the source package excludes `node_modules` and must run `npm ci` on the target platform. API end-to-end tests were not run because the bundled native esbuild runtime is platform-incompatible here.
