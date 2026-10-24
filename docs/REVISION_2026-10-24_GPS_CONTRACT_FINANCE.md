# EAMS Revision — GPS Print, SO Contract PDF, Procurement to Finance

## 1. GPS Fleet Map print
- Print button switches the map into a dedicated print state, triggers resize, and waits up to 20 seconds for Leaflet tile images to complete.
- Map viewport is explicitly sized for A4 landscape and Leaflet panes/tile imagery are retained in print CSS.
- If tiles cannot load, UI warns the operator. OpenStreetMap requires a working network connection; browser print settings can still affect background graphics. Test in Chrome/Edge print preview and Save as PDF.
- Manual test: open Dashboard and Assets GPS map; wait for all map tiles; click Print Map (PDF); confirm the entire map, markers, legend/header, and map extent appear—not only the upper-left tile. Repeat with slow/offline network and confirm warning behavior.

## 2. Quotation / Sales Order contract compliance
- Converted quotation keeps its generated SO number and quotation reference.
- Sales Orders table now shows contract completeness status and offers `Upload Kontrak PDF`.
- Operator enters a contract reference number and selects a PDF (maximum 10 MB). API validates SO existence, reference number, PDF MIME/data URL and size; audit log records upload.
- Fields: `contractReferenceNumber`, `contractAttachmentName`, `contractAttachmentDataUrl`, `contractAttachmentUploadedAt` on SalesOrder.
- Endpoint: `POST /api/sales-orders/:id/contract-attachment` (the API router is mounted under the app's API prefix). Body fields: `contractReferenceNumber`, `fileName`, `dataUrl`.
- Important limitation: this revision records and surfaces compliance status but does not yet hard-block dispatch/invoicing when the PDF is missing. If policy requires hard enforcement, add server-side validation in the delivery/dispatch endpoint as a separate control after confirming whether all order types require contracts.
- Data storage currently embeds PDF as base64 data URL in JSON DB; suitable only for limited local review. For production, use controlled file storage and keep metadata in DB.

## 3. Procurement to Finance & Accounting
- On PO creation, an AP/Vendor Bill workflow record is created with `purchaseOrderId`, `vendorId`, amount, due date, unpaid status and is accessible from the existing `/procurement/vendor-bills` endpoint.
- The PO stores `vendorBillId`. Approval reuses the same vendor bill by PO relationship to avoid duplicates.
- Audit event `FINANCE_AP_BILL_CREATED` records the integration.
- This is an AP accrual/workflow entry; it does not imply that the supplier's formal invoice or tax invoice has been received/validated. Finance should verify invoice number, invoice PDF, tax details and receipt/GRN before payment.

## 4. Local review checklist
1. Install dependencies using `npm ci` on the target Windows host.
2. Run `npm run lint`, `npm run build`, then `npm run dev`.
3. Create PO with vendor/items and confirm Finance vendor bills list shows one linked AP entry.
4. Approve PO and confirm there is still only one bill with same PO reference.
5. Convert approved/accepted quotation to SO; upload a valid PDF and reference; refresh and confirm metadata persists.
6. Test rejected upload: missing reference, non-PDF, >10 MB, and unknown SO ID.
7. Print GPS map to PDF in Chrome/Edge and verify full tile coverage.

## 5. Source map
- GPS UI: `src/components/FleetGpsMap.tsx`; print rules: `src/index.css`.
- SO contract UI: `src/components/SalesOrdersView.tsx`; data model: `src/types/index.ts`; API client: `src/services/api.ts`; server endpoint: `server/routes.ts`.
- Procurement/Finance AP bridge: `server/routes.ts`; model `PurchaseOrder` and `VendorBill` in `src/types/index.ts`; finance bill read endpoint `/procurement/vendor-bills`.
- Project is currently JSON-backed. Do not assume PostgreSQL.
