# EAMS Local Review Revision — 24 October 2026

## Scope requested

1. Fix vendor selection in **Create Purchase Order (PO)**.
2. Enable customer database edit and delete.
3. Replace script-like/raw JSON presentation in **Approvals & Contracts** with readable record fields.
4. Restrict cross-department navigation so only IT has all modules.
5. Show clear notifications for success, failure, API errors, and incomplete forms.
6. Improve print readiness for **Live Heavy Equipment GPS Fleet Map** so the map and markers are captured more reliably.
7. Update documentation to make future AI sessions read the project map before code changes.

## Code changes in this package

### Procurement / vendor selection
- `src/components/ProcurementView.tsx` now reconciles the selected vendor ID when vendor data loads asynchronously or the currently selected vendor disappears.
- Vendor selector includes a placeholder, is disabled when no vendors exist, and is marked required.
- PO submission validates that the selected vendor still exists and that line items have a name, positive quantity, and non-negative unit cost.
- If the directory is empty, users are instructed to register a vendor first.

### Customer database CRUD
- `src/components/CustomersView.tsx` provides an Edit action using the existing customer form and a Delete action with confirmation.
- `src/services/api.ts` adds `deleteCustomer`.
- `server/routes.ts` adds `DELETE /customers/:id`, audit logging, and a conflict response when quotations, sales orders, rental contracts, invoices, or payments still reference the customer. This avoids deleting a customer needed by transaction history; mark such a customer inactive instead.
- Customer updates use `PATCH /customers/:id`.

### Approvals & Contracts output
- `src/components/ManagerApprovalsView.tsx` renders record details as a responsive field grid, labels fields in readable form, and provides expandable sections for nested objects/arrays. This replaces the single raw JSON block as the primary output.

### Department navigation
- `src/shared/access.ts` is the shared role/module policy. `ADMIN_IT` retains all modules. The Executive baseline is narrowed to dashboard, reports, and manager approvals so it cannot navigate across all department modules by default. Other department baselines remain specialized.
- Because this file is shared, validate the server's computed modules and direct endpoint access for each role during review. Do not treat the sidebar alone as security.

### Alerts and incomplete submissions
- `src/components/Toaster.tsx` classifies required/missing/incomplete/failed messages as errors and converts native HTML form `invalid` events into visible error toasts.
- Existing `alert()` calls are routed to the app's non-blocking toast notification UI.
- Procurement and customer forms have explicit checks for core required values. Review other modules' form schemas during future work; this revision does not claim every field across every module has been audited.

### GPS Fleet Map print
- `src/components/FleetGpsMap.tsx` waits up to 12 seconds for map tile images to finish loading and verifies `naturalWidth`, then triggers print. If tile images remain unavailable, it shows a warning instead of silently implying a complete map.
- Print mode is cleared after the browser print dialog closes. The map uses the existing A4 landscape print CSS in `src/index.css`.
- OpenStreetMap tiles still require network access. Browser print settings should enable **Background graphics**. Cross-origin tile availability and the physical printer/PDF renderer must be verified on the review server.

### Documentation
- `docs/00_PROJECT_MAP_AND_NEXT_PROMPT.md` is the mandatory first-read map for future AI/code sessions.
- This file records changed files, behavior, known limitations, and the verification checklist.
- `README.md`, `docs/USER_GUIDE.md`, `docs/SECURITY_AND_ACCESS.md`, and `docs/API_WORKFLOW_REVISION.md` should be kept aligned with any later changes.

## Manual verification checklist

- [ ] Open Procurement with vendor data initially loading; open Create PO; confirm the correct vendor ID and visible vendor name are submitted.
- [ ] Test PO with no vendor, missing line item name, zero/negative quantity, and valid data. Confirm visible error/success notifications.
- [ ] Edit customer name, Tax ID, contact, address, and credit limit; refresh and confirm values persist.
- [ ] Delete a customer with no related transactions; confirm deletion and audit log.
- [ ] Attempt to delete a customer linked to a quotation, sales order, rental, invoice, or payment; confirm HTTP 409 and a readable error toast.
- [ ] Open Approvals & Contracts as a Manager; confirm approval cards and record-detail fields render rather than one raw JSON script block; expand nested values.
- [ ] Sign in with each role and verify only intended menu modules appear. Attempt a restricted API endpoint directly and confirm denial.
- [ ] Submit incomplete forms across major modules and record any forms that still lack field-level validation.
- [ ] Open GPS Fleet Map with a live network connection, wait for tiles, click Print Map (PDF), and verify A4 landscape output includes map tiles, markers, legend/data, and no unrelated page sections.
- [ ] Repeat GPS print with slow/no network and confirm the warning is visible when tiles do not load.
- [ ] Run `npm ci`, `npm run lint`, `npm run build`, and `npm run test:api` on the review machine.

## Verification status

This package is a code revision for local review. Do not treat the fixes as production-verified until the checklist above has been run against the local server. A successful ZIP integrity check only verifies that the archive can be read; it does not prove TypeScript compilation, API correctness, role security, or browser print fidelity.

## Known design constraints

- Persistence remains JSON-backed. Take a backup before tests that create or delete records.
- Deletion is intentionally blocked when customer transaction history exists; use customer status/inactivation for historical accounts.
- Map tiles are external resources and may not be available offline.
- Department access should be tested on both frontend and API because the shared access matrix influences navigation and backend authorization.
