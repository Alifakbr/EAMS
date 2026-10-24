# EAMS Project Map — Read First

Read this file before any subsequent AI task. Then read `docs/REVISION_2026-10-24_QR_CUSTOMER_FINANCE_CONTRACTS.md`, `docs/USER_GUIDE.md`, `docs/SECURITY_AND_ACCESS.md`, `docs/API_WORKFLOW_REVISION.md`, and `README.md`.

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
