# EAMS Project Map — Read This First

> **Instruction for the next AI/code-review session:** read this file first, then read `REVISION_2026-10-24_LOCAL_REVIEW.md`, `SECURITY_AND_ACCESS.md`, `API_WORKFLOW_REVISION.md`, `USER_GUIDE.md`, and `INSTALLATION.md` before proposing or changing code. Do not assume the architecture specification is already implemented; verify the live source.

## 1. Project facts

- Repository: `https://github.com/Alifakbr/EAMS`
- Branch/source baseline: public repository `main`; this ZIP is intended for local review and does not create or push a branch.
- Stack: React 19 + TypeScript + Vite frontend; Express + TypeScript API; Tailwind CSS; Leaflet / React Leaflet for GPS maps.
- Package scripts: `npm run dev`, `npm run build`, `npm run lint`, `npm run test:api`.
- Data persistence currently uses the application's JSON-backed database (`data/eams_db.json` at runtime), not PostgreSQL. Do not claim PostgreSQL support without implementing and testing a database adapter.
- Authentication and authorization are role/module based. `src/shared/access.ts` is shared by the frontend and backend; `server/auth.ts` and route middleware enforce access. Hiding a menu is not sufficient security.
- The ZIP excludes `.env`, runtime business data, `.git`, `node_modules`, and generated build output. Make a separate backup before using any real business data.

## 2. Source map

| Area | Primary files | Responsibilities |
|---|---|---|
| App shell / navigation | `src/App.tsx`, `src/components/Header.tsx`, `src/components/Sidebar.tsx` | Session boot, module filtering, active view, mobile navigation, global alerts |
| Access control | `src/shared/access.ts`, `server/auth.ts`, `server/routes.ts`, `src/components/UserManagementView.tsx` | Role-to-module matrix, user-specific overrides, server authorization |
| API client | `src/services/api.ts`, `src/services/session.ts` | Typed API requests, session token handling |
| Data / domain models | `server/db.ts`, `src/types/index.ts` | JSON persistence, seeds, domain entities and types |
| API endpoints | `server/routes.ts`, `server/openapi.ts` | CRUD endpoints, workflows, OpenAPI metadata |
| Procurement / vendor PO | `src/components/ProcurementView.tsx`; `server/routes.ts` under `/procurement/vendors` and `/procurement/purchase-orders` | Vendor directory, purchase order create/approval/receive, vendor bills |
| Customer CRM | `src/components/CustomersView.tsx`; `server/routes.ts` under `/customers`; `src/services/api.ts` | Customer list, create/edit/delete, statement |
| Manager approvals / contracts | `src/components/ManagerApprovalsView.tsx`; `server/routes.ts` under `/manager/approvals` | Approval queue and readable record details for sales/rental records |
| GPS fleet map | `src/components/FleetGpsMap.tsx`, `src/index.css` | Leaflet layers, asset pins, map filters, export, print styles |
| Global notifications | `src/components/Toaster.tsx`, `src/App.tsx` | Non-blocking success/error/info notifications and form-validation messages |
| Quotations / rental rate | `src/components/QuotationsView.tsx`, `src/components/RentalRateCalculator.tsx` | Quotation creation and rate calculator |
| Other business views | `src/components/AssetsView.tsx`, `SalesOrdersView.tsx`, `RentalsView.tsx`, `DeliveriesView.tsx`, `InvoicesView.tsx`, `PaymentsView.tsx`, `MaintenanceView.tsx`, `TechnicalServiceView.tsx`, `ReportsView.tsx` | Core EAMS modules |

## 3. Request lifecycle

1. A React view calls a typed method in `src/services/api.ts`.
2. The API client sends the request to the Express API (normally `/api/...`; confirm `server.ts` and `api.ts` before changing the base path).
3. `server/routes.ts` validates the request, applies authorization middleware, calls `server/db.ts`, and returns JSON.
4. `server/db.ts` persists the application's domain data to JSON and writes audit events where implemented.
5. Views refresh data through `onRefresh` or a view-specific fetch.

When fixing a defect, inspect the frontend control, API method, route, authorization, data mutation, and refresh path together. A UI-only patch may hide a backend defect.

## 4. Department access principle

- `ADMIN_IT` is the only role intended to have all department modules.
- Each operational role should have the minimum modules required for its function.
- Executive/manager oversight should use reporting and approval views rather than unrestricted operational CRUD across every department.
- Always test both the visible navigation and direct API requests for unauthorized roles.
- Do not add a client-only role check while leaving the API endpoint open.

## 5. Change workflow for future AI prompts

1. Read this map and the latest revision log first.
2. Inspect exact files and API routes before coding; do not replace whole modules from assumptions.
3. Preserve existing business workflows, data schema compatibility, and user credentials.
4. Make changes only in the local workspace unless explicitly asked to update GitHub. For local-review requests, do not create branches, commits, or pull requests.
5. Add/update tests for the affected route or component. Include permission-denied, invalid-input, and success cases.
6. Update `docs/REVISION_2026-10-24_LOCAL_REVIEW.md`, the relevant user/API/security docs, and this map if paths or behavior change.
7. Run `npm ci`, `npm run lint`, `npm run build`, and `npm run test:api` where the environment permits. Report each command's actual result; never claim a test passed if it was not run.
8. Produce a ZIP without `.env`, credentials, `.git`, `node_modules`, or production runtime data. Verify ZIP integrity and include a short test report.

## 6. Suggested prompt for the next session

> Read `docs/00_PROJECT_MAP_AND_NEXT_PROMPT.md` first, then read `docs/REVISION_2026-10-24_LOCAL_REVIEW.md` and the relevant API/security docs. Map the current source before coding. Continue from the local-review revision without creating a GitHub branch or pushing changes. Preserve the JSON-backed persistence unless a database migration is explicitly requested. Verify role restrictions in both UI and API, add regression tests, update the docs and revision log, and deliver a clean local ZIP. Clearly separate completed fixes from items not verified by build/runtime tests.


## Revisi lokal 2026-10-24 (GPS print, kontrak SO, Procurement → Finance)
Baca juga `docs/REVISION_2026-10-24_GPS_CONTRACT_FINANCE.md` sebelum mengubah modul terkait.
- GPS print: `src/components/FleetGpsMap.tsx` menunggu tile OpenStreetMap, memicu resize/prepare sebelum `window.print`; `src/index.css` memiliki print isolation dan ukuran map A4 landscape. Browser print preview tetap perlu diuji karena kebijakan browser/jaringan dapat memblokir tile eksternal.
- SO contract attachment: `SalesOrder` memiliki `contractReferenceNumber`, `contractAttachmentName`, `contractAttachmentDataUrl`, `contractAttachmentUploadedAt`. UI berada di `src/components/SalesOrdersView.tsx`; API `POST /sales-orders/:id/contract-attachment`. PDF dibatasi 10 MB, nomor referensi wajib. File saat ini disimpan sebagai data URL di record JSON; untuk produksi dengan banyak dokumen, pindahkan binary ke object/file storage dan simpan metadata saja.
- Procurement → Finance: pembuatan PO membuat VendorBill/AP record terkait via `purchaseOrderId` dan `vendorBillId`, yang dibaca endpoint Finance `/procurement/vendor-bills`. Persetujuan PO menggunakan kembali bill yang sama agar tidak menggandakan tagihan. Ini adalah record AP workflow, bukan verifikasi faktur pajak/invoice vendor.
- Database proyek saat ini JSON-backed; jangan mendokumentasikannya sebagai PostgreSQL sampai migrasi benar-benar dilakukan.
