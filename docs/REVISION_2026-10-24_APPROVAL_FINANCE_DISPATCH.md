# EAMS Revision — Approval Deduplication, Finance Transaction Overview, Payment Terms & Dispatch Compliance

Date: 2026-10-24  
Package target: local review ZIP; no GitHub branch/commit.

## 1. Read the history first
Future AI sessions must read, in order:
1. `docs/00_PROJECT_MAP_AND_NEXT_PROMPT.md`
2. `docs/REVISION_2026-10-24_APPROVAL_FINANCE_DISPATCH.md` (this file)
3. `docs/REVISION_2026-10-24_CONTRACT_MANAGEMENT_FINANCE_OVERVIEW.md`
4. `docs/REVISION_2026-10-24_GPS_CONTRACT_FINANCE.md`
5. `docs/REVISION_2026-10-24_LOCAL_REVIEW.md`
6. `docs/API_WORKFLOW_REVISION.md`, `docs/USER_GUIDE.md`, `docs/SECURITY_AND_ACCESS.md`, and `README.md`

## 2. Architecture / source mapping
- Frontend: React + TypeScript + Vite (`src/`); Express API (`server/routes.ts`); JSON-backed persistence. This is not the PostgreSQL/Laravel target architecture.
- Approval API: `server/routes.ts` — `GET /manager/approvals`, `POST /manager/approvals/:type/:id/:decision`.
- Work order API: `server/routes.ts` — `/maintenance/work-orders` and `/technical-service/scan-start`.
- Finance dashboard: `src/components/FinanceOverviewView.tsx`, mounted by `src/App.tsx` with invoice/payment/PO/vendor-bill data.
- Sales Order status and action UI: `src/types/index.ts`, `src/components/SalesOrdersView.tsx`.
- Dispatch creation and enforcement: `server/routes.ts`, `POST /deliveries`.
- Operator scan and first-start timestamp: `server/routes.ts`, `POST /operators/attendance/check-in`.
- Customer payment terms: `src/components/CustomersView.tsx`, `Customer.paymentTermsDays`.
- Invoice terms: `src/types/index.ts` `Invoice.paymentTermsDays`, `src/components/InvoicesView.tsx`.
- Vendor and PO terms: `Vendor.paymentTerms`, `PurchaseOrder.paymentTerms`, `src/components/ProcurementView.tsx`.
- Quotation terms: `src/components/QuotationsView.tsx` terms text.

## 3. Approval deduplication / Asset-targeted Work Orders
- Removed maintenance Work Orders from the Manager Approvals aggregate, so creating a WO no longer creates a second approval queue item.
- New Work Orders are created as `SCHEDULED` rather than `PENDING_APPROVAL`; technician scan-start rejects only cancelled WOs, not a stale approval state.
- Sales Order status type no longer includes `ALLOCATED`; the old transition from rental booking / equipment assignment is normalized to `CONFIRMED`. The UI no longer labels `ALLOCATED` as a normal status.
- Payment invoice allocation concepts (`allocatedAmount`, `unallocatedAmount`) are separate accounting terminology and intentionally remain; do not remove these when removing the Sales Order status.

## 4. Finance FAT & AR Transaction Overview
- Filters: free-text query, cash-flow direction (income/expense), category, transaction source/type, status, start date and end date.
- Download: CSV with UTF-8 BOM and Excel-compatible headers, including transaction date/number, category, source, party, status, payment term/due date, gross amount, recorded tax metadata, optional simulated tax and evidence metadata.
- Optional custom tax rate is an analysis/export simulation only. It does **not** mutate saved invoices, PO records, tax journals or tax invoices. This is deliberate to avoid silently changing accounting values. Actual tax must be set and persisted on the source transaction and verified against tax policy.
- Sources currently included: invoice/AR, payment receipt, purchase order and vendor bill/AP. PO and vendor bill may be two stages of the same procurement, so totals are record summaries, not audited cash flow, P&L, or net bank movement.
- Evidence is shown if metadata is present. Universal upload/download of evidence for all transaction types is not implemented by this change; don't describe it as complete.

## 5. Payment term customization
- Existing source forms already expose terms in different units: customer `paymentTermsDays`, vendor `paymentTerms`, PO free-text `paymentTerms`, invoice `paymentTermsDays`, and quotation's terms paragraph.
- Finance Overview now displays the saved terms/due-date metadata to help users review them.
- There is no central master list of payment term templates in this schema yet. Future work should introduce one shared `PaymentTerm` model and API with role ACL, then store immutable snapshots on quotation/SO/invoice/PO/vendor bill so a template edit cannot rewrite historical transactions. Do not infer that a central global term catalog is already available.

## 6. Dispatch and operator start-date rules
- `POST /deliveries` now blocks Sales Order dispatch unless `contractReferenceNumber` and `contractAttachmentDataUrl` exist. Upload the contract PDF through Contract Management first.
- `POST /operators/attendance/check-in` checks whether the scanned asset is linked to a non-cancelled/non-completed Sales Order. If so, a missing contract reference/PDF returns HTTP 409 and the scan is rejected.
- On the first successful operator scan linked to an SO, the server sets that SO item's `mobilizationDate` to the server timestamp if it is not already set, and logs an audit event. This is an initial operational-start marker; it is not a sensor/ignition integration. The system can only know that the operator has scanned/check-in occurred, not that the engine literally turned on.
- Dispatch action UI still originates from the Sales Orders view in this revision. The requested relocation of the actual dispatch UI into Asset Registration & Heavy Equipment Compliance is not yet complete. Future implementation must move the action/selection UI to `AssetsView.tsx`, supply SO/contract data there, and remove the old action from `SalesOrdersView.tsx` without weakening server-side validation.
- The contract check in this change applies to the operator attendance scan endpoint. Review all other scan endpoints (including Technical Service) before claiming that every scan path enforces contract compliance.

## 7. Tests / release status
- ZIP integrity should be checked after packaging.
- Must run on the review host: `npm ci`, `npm run lint`, `npm run build`, `npm run test:api`.
- Manual scenarios: (a) WO creation yields `SCHEDULED` and does not appear in Manager Approvals; (b) old persisted `ALLOCATED` records are not automatically migrated in JSON data, so normalize legacy data if any exist; (c) Finance filters combine correctly and exported CSV opens in Excel; (d) tax simulation does not mutate source records; (e) SO dispatch is blocked without contract reference/PDF and allowed after upload; (f) operator check-in for SO-linked equipment is blocked until contract is complete; (g) first scan stamps mobilization date once; (h) test Technical Service QR and all other scan flows independently.
- No build, API E2E, browser, or hardware QR test is claimed as passed unless performed on the local review server.
