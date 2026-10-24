# API & Workflow Notes — Revision October 2026

Prefix: `/api/v1`. All endpoints below require an authenticated session and the module permissions configured in `server/auth.ts`, except public health/config endpoints documented elsewhere.

| Method | Endpoint | Purpose / important rule |
|---|---|---|
| `GET` | `/assets` | Returns assets and synchronizes SIA expiry notifications (30-day window and expired documents). Supports `status`, `category`, and `search` filters. |
| `POST` | `/assets/:id/documents` | Updates legal document metadata, including `legalDocs.siaDocuments[]`. Each additional SIA item uses `id`, `number`, `expiryDate`, optional `issuer`, `fileName`, and `fileUrl`. |
| `GET` | `/assets/barcode/:barcode` | Looks up asset by tag, serial number, plate, or chassis number. |
| `GET` | `/quotations` | Lists quotations, including `transactionType`, delivery/mobilization fee lines, and `remarks`. |
| `POST` | `/quotations` | Creates a quotation; `transactionType: "SALE"` is for sale, other values default to rental. Pass `remarks` as a string. |
| `POST` | `/quotations/:id/convert-to-order` | Converts an accepted quotation into Sales Order and carries quotation remarks forward. |
| `POST` | `/sales-orders/:id/cancel` | Requires a cancellation reason; cancels linked quotation and releases still-reserved assets where safe. Refuses cancellation when an issued/paid invoice or rental contract needs resolution. |
| `POST` | `/sales-orders/:id/book-rental` | Asset Control booking path for rental Sales Orders. Unit must remain reserved for the correct customer; contract requires approval before mobilization. |
| `POST` | `/rentals` | Direct rental contract creation. Units must be `AVAILABLE`; attempts to allocate an already `RENTED` unit are rejected and logged/notified. |
| `POST` | `/rentals/:id/return` | Return/demobilization and inspection path for an active rental. Use this process before reallocation. |
| `GET` | `/notifications` | Returns role-filtered notifications and synchronizes SIA expiry warnings. |
| `GET` | `/settings` | Returns company settings, branding data URLs, and job-position categories. |
| `PATCH` | `/settings` | Updates recognized settings keys; default currency remains IDR. |
| `GET` | `/system/backup` | Downloads business data as JSON without password hashes. |
| `POST` | `/system/restore` | Restores business collections from JSON; current users/passwords are retained. Minimum required arrays: `assets`, `customers`, `products`. |

## Workflow rules

- Equipment sales become `SOLD` only after the related invoice is fully paid and payment allocation has finalized the invoice to `PAID`.
- A partial payment does not authorize mobilization for an equipment sale.
- A rental asset cannot be allocated to a second active rental. If an attempted direct rental booking identifies a `RENTED` asset, a warning notification is sent to Asset Control, Sales, Management Operation, and Manager.
- SIA reminders are idempotent by asset + document + expiry date. Reminder generation is request-triggered when the assets or notifications APIs are read; it is not a background scheduler. For guaranteed daily alerts independent of user traffic, configure an external scheduled health/check task in the server environment.

For the full flow diagrams and operator notes, see [REVISI_EAMS_2026-10.md](REVISI_EAMS_2026-10.md).


## IT data migration and compliance monitor endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/system/data-tables` | List allowed data collections and record counts (IT Administrator only). |
| GET | `/api/v1/system/export-tables?tables=assets,customers` | Export selected collections as `EAMS_TABLE_EXPORT` JSON. |
| POST | `/api/v1/system/import-tables` | Import selected collections from `{ "tables": { "assets": [...] } }`. |
| POST | `/api/v1/system/clear-business-data` | Clear business data while preserving user credentials and system settings; test environment only. |
| GET | `/api/v1/notifications` | Synchronizes and returns compliance reminders, including SIA, STNK, BPKB expiry when configured, inspection due dates and operator SIO. |

All routes inherit session authentication and ACL middleware; migration/reset routes additionally require the `ADMIN_IT` role. The app stores data in a JSON-backed database state, not relational SQL tables, so “table” in these endpoints means a top-level collection in `data/eams_db.json`.


## Customer CRUD additions — 2026-10-24 local review

- `PATCH /customers/:id`: update customer fields; body must contain the changed fields.
- `DELETE /customers/:id`: deletes only when no quotation, sales order, rental, invoice, or payment references the customer. Returns `404` if not found and `409` with a reason when linked records exist. Successful deletion writes a customer-deleted audit event.

## PO vendor selection validation

`POST /procurement/purchase-orders` requires a valid `vendorId` and at least one item. The client additionally validates selected vendor membership and item names, positive quantities, and non-negative unit costs. Server-side validation remains authoritative.
