# EAMS Local Release — Rental Rate Calculator + Responsive UI

This package is based on the previous EAMS Final Release source and adds:
- Equipment Rental Rate Calculator in Quotations.
- Standard/reference Monthly, Daily, Hourly and Lumpsum calculations.
- Saturday/Sunday hourly multipliers and inclusive contract calendar with configurable weekend work and holiday dates.
- Apply selected rate to the first item in a quotation form.
- Responsive calculator layout and global mobile/tablet refinements for forms, buttons and wide tables.
- Updated local setup notes and user guide.

## Local setup (Windows)
1. Extract ZIP to a writable folder.
2. Open PowerShell in that folder.
3. Run `npm ci`.
4. Copy `.env.example` to `.env`, then configure required environment variables and a strong `SESSION_SECRET`.
5. Run `npm run lint`.
6. Run `npm run build`.
7. Run `npm run dev` and open the local address shown in terminal.

The source package uses the current JSON-backed store; PostgreSQL is not wired into this build. ZIP intentionally excludes `.env`, runtime data, credentials, `node_modules`, and `dist`.

## Known limitations / validation
- Multiplier values are per calculator session and are not saved as persistent settings.
- The quotation data model still stores only `REGULAR` or `LUMPSUM`, not a separate hourly/daily/monthly unit field. Record the selected basis in terms/remarks.
- TypeScript/build validation could not complete in this Linux sandbox because the archived `node_modules` package contains Windows-specific TypeScript native binaries and network access to reinstall dependencies was unavailable. Run `npm ci`, `npm run lint`, and `npm run build` on the target Windows environment before production use.
