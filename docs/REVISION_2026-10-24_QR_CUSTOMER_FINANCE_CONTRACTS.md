# Local review notes — QR, Customer Actions, Finance and Contracts

## Included in this review ZIP

### Asset QR label
- Replaced the decorative Lucide QR icon on the printable asset label with an actual QR image generated from the unique `assetTag` value.
- The QR payload intentionally remains the asset tag because the operator and technical-service scan flows use the scanned value to locate an asset. The asset name remains printed beside it.
- QR image is fetched from QuickChart (`quickchart.io`), so printing requires internet access. This is a known limitation; production should generate QR PNG/SVG server-side or bundle a QR encoder to remove the external dependency.
- Verify each asset tag is unique in the asset creation API. Do not use the asset name alone as an identifier because duplicate names are possible.
- Test printed labels using both `OperatorScanStatusView.tsx` and `TechnicalServiceView.tsx` on actual phones. Browser simulation is not a substitute for physical scan testing.

### Customer Database duplicated actions
- Removed the duplicated Edit/Delete action group in `src/components/CustomersView.tsx`; each row should now show one Edit and one Delete action group, alongside Statement.

## Existing model references for the requested next phase
- `SalesOrder` already includes `contractReferenceNumber`, `contractAttachmentName`, `contractAttachmentDataUrl`, and `contractAttachmentUploadedAt` in `src/types/index.ts`.
- `ManagerApprovalsView.tsx` currently shows approvals and records; future Contract Management should reuse Sales Order data and explicitly filter contract attachment status.
- Finance pages are `InvoicesView.tsx` and `PaymentsView.tsx`; procurement AP integration is in `ProcurementView.tsx` plus vendor-bill endpoints in `server/routes.ts`.

## Important implementation gaps (do not treat as complete)
- A dedicated Contract Management menu with persistent PDF upload, reminders/notifications, and server-side permission checks is not completed by this revision.
- A consolidated general cash-in/cash-out ledger covering every transaction type and evidence attachment in Finance/FAT/AR is not completed by this revision. It requires a normalized transaction/evidence model and API endpoints; merely summing invoices and payments would not accurately represent all expenses.
- QR image generation currently depends on an external online endpoint. For offline/local server use, replace it with a bundled QR encoder and add scan tests.
- Do not claim the QR scan flow is confirmed until tested with real operator and technical-service devices.

## Validation
- Customer action JSX checked to remove the duplicate group.
- QR label now uses the asset tag as encoded value.
- Run `npm ci`, `npm run lint`, `npm run build`, and `npm run test:api` on the review server. Test both scanner workflows and print output physically.
