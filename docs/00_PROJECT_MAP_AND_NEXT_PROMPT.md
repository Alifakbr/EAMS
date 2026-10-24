# EAMS Project Map — Read First

Read this file before any subsequent AI task. Then read the latest revision log `docs/REVISION_2026-10-24_SIDEBAR_SIA.md`, followed by `docs/REVISION_2026-10-24_APPROVAL_FINANCE_DISPATCH.md`, prior revision logs, `docs/USER_GUIDE.md`, `docs/SECURITY_AND_ACCESS.md`, `docs/API_WORKFLOW_REVISION.md`, and `README.md`.

## Architecture
- React + TypeScript frontend: `src/App.tsx`, `src/components/`
- API client: `src/services/api.ts`; API prefix `/api/v1`
- Express routes: `server/routes.ts`
- Domain models: `src/types/index.ts`
- Role/module access: `src/shared/access.ts`, sidebar: `src/components/Sidebar.tsx`
- Persistent data currently uses the project's JSON database layer. Do not assume PostgreSQL.
- Asset label UI: `src/components/AssetsView.tsx`; operator scanner: `src/components/OperatorScanStatusView.tsx`; technical scanner: `src/components/TechnicalServiceView.tsx`.
- Customer list and row actions: `src/components/CustomersView.tsx`.
- Finance pages: `src/components/InvoicesView.tsx`, `src/components/PaymentsView.tsx`; procurement-to-AP view: `src/components/ProcurementView.tsx`.
- Approvals: `src/components/ManagerApprovalsView.tsx`.

## Required workflow for future changes
1. Inspect relevant types, frontend component, API method, route, authorization and persistence model before coding.
2. Make end-to-end changes (UI + API + persistence + validation + access control), not visual-only placeholders.
3. Preserve existing workflows and role scoping; IT admin may have cross-module access.
4. Never report build, browser, scan, or API tests as passed unless actually run. Run `npm ci`, `npm run lint`, `npm run build`, and `npm run test:api` where environment supports them.
5. Provide a local ZIP only when requested; do not create a GitHub branch/commit unless explicitly requested.
6. Update this map and the revision log with exact files, data flow, tests performed, and known limitations.


## Latest local revision (2026-10-24)
Before any next change, read `REVISION_2026-10-24_CONTRACT_MANAGEMENT_FINANCE_OVERVIEW.md`. New module IDs: `contract-management` and `finance-overview`. Main implementation map: `src/shared/access.ts`, `src/components/Sidebar.tsx`, `src/App.tsx`, `src/components/ContractManagementView.tsx`, and `src/components/FinanceOverviewView.tsx`. Contract upload uses existing SO PDF endpoint. Reminder currently creates a `mailto:` draft, not an automated notification. Finance overview aggregates existing record types and does not yet persist universal evidence attachments; do not represent gross sums as audited cashflow.

## Latest revision log (2026-10-24 — approvals, finance filters, dispatch controls)
Read `docs/REVISION_2026-10-24_APPROVAL_FINANCE_DISPATCH.md` after this map. It records the latest request, code map, and limitations. Main changes: Work Orders no longer enter Manager Approvals; legacy `ALLOCATED` Sales Order status was removed from the TypeScript status union and normalized to `CONFIRMED`; Finance Overview now supports category/source/status/date filtering and Excel-compatible CSV export with optional tax simulation; dispatch API requires SO contract reference + PDF; operator attendance scan is blocked when the matched SO lacks contract compliance and first successful scan stamps equipment mobilization date. Build/API/manual hardware testing must still be run locally.


## Latest revision log (2026-10-24 — sidebar and multiple SIA)
Read `docs/REVISION_2026-10-24_SIDEBAR_SIA.md` first after this map. It documents global sidebar module-ID deduplication, consistent icon sizing, and preservation/validation of multiple SIA certificates in Compliance Documents. Main files: `src/components/Sidebar.tsx`, `src/components/AssetsView.tsx`, and `src/types/index.ts`.
