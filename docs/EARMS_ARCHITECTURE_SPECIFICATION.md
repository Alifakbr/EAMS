# Enterprise Asset Rental Management System (EARMS)
## Master Architecture, Business Requirements & Technical Specification Document

**Version:** 3.0.0 Enterprise  
**Author:** Lead Enterprise Software Architect, Database Architect & Security Engineer  
**Document Status:** Approved Architecture Blueprint & Phase 1 Specification  
**Target Environment:** Multi-Branch Heavy Equipment Asset Management & Commercial Rental Operations

---

## 1. Business Requirements Document (BRD)

### 1.1 Executive Summary
The **Enterprise Asset Rental Management System (EARMS)** is a high-availability, multi-tenant/multi-branch operational and commercial platform engineered for heavy equipment rental enterprises (excavators, mobile/tower cranes, forklifts, bulldozers, wheel loaders, generator sets, and specialized tooling). 

EARMS centralizes equipment lifecycle tracking, barcoding/QR scanning verification, quotation-to-cash leasing workflows, third-party operator timesheet integration, field safety inspections (K3), maintenance & calibration, multi-tier procurement, and revenue/AR aging management across Head Office and geographically dispersed Branches/Job Sites.

### 1.2 Enterprise Strategic Objectives
1. **Zero Double-Allocation:** Prevent overlapping rental commitments through real-time asset reservation locks.
2. **End-to-End Equipment Lifecycle:** Trace every physical asset from capital acquisition, barcoding/tagging, pre-dispatch inspection, site mobilization, daily operational utilization, return condition audit, to salvage/decommissioning.
3. **Multi-Branch Governance:** Enforce strict data isolation and organizational hierarchy between Head Office, Regional Branches, and Client Job Sites.
4. **Legal & K3 Safety Compliance:** Maintain mandatory tracking of machine documentation (**STNK, BPKB, SIA Kemenaker**) and operator qualification licenses (**SIO Kemenaker Kelas 1, 2, 3**). No equipment may be dispatched with an active safety hold or expired safety certificate.
5. **Separation of Duties (SoD):** Absolute RBAC enforcement where requesters cannot self-approve purchase orders, quotations, or credit notes.
6. **Financial Precision:** Currency and tax math executed with strict 64-bit integer cents/precision rules (no floating-point rounding drifts).

### 1.3 Key Stakeholders & Personas
- **Executive Board (Direktur Utama / C-Suite):** High-level KPI visibility, fleet utilization rates, EBITDA simulation, and one-click PDF/Excel exportable commercial statements.
- **IT & Security Administrator:** System configuration, role-permission matrices, OpenAPI/Swagger management, audit trails, and automated test suite verification.
- **Commercial & Sales Support:** Client CRM, credit limits, rate cards, quotations, and conversion to legal Sales/Rental Orders.
- **Asset Control & Equipment Manager:** Asset tagging, physical barcodes, serial numbering (Chassis/Engine), legal certificates (SIA, STNK, BPKB), and delivery handovers (BAST/Surat Jalan).
- **Field Operations & K3 HSE Officers:** Operator certifications (SIO), pre-start inspection checklists, site acceptance, and incident defect logging.
- **Technical Service & Workshop Mechanics:** Preventive/corrective maintenance work orders, spare part consumption, downtime tracking, and return-to-service sign-offs.
- **Procurement & Inventory Officers:** Supplier master, Purchase Requisitions (PR), Quotation comparisons, Purchase Orders (PO), and Goods Receipt verification.
- **Finance, Accounting & Tax (FAT):** Commercial invoicing, tax calculation (PPN 11%, PPh 23), revenue recognition, and payment allocations.
- **Accounts Receivable (AR) Officers:** Aging bucket analysis (0-30, 31-60, 61-90, >90 days), collection promises, and statement of accounts (SOA).

---

## 2. Software Requirements Specification (SRS)

### 2.1 Scope of the System
EARMS encompasses 13 core subsystems:
1. **Multi-Branch Organizational Management & Scoping**
2. **Centralized Asset Registry & Component Hierarchy**
3. **Barcode/QR Tagging & Mobile Camera Scanning**
4. **Rental Contract Lifecycle & Dispatch/Demobilization**
5. **Third-Party Operator Timesheet Integration Adapter**
6. **K3 HSE Safety Inspection & Safety Hold Enforcement**
7. **Technical Service, Breakdown & Maintenance Work Orders**
8. **Multi-Tier Procurement & Supplier Management**
9. **Commercial Revenue Recognition & Profitability Analysis**
10. **Fleet Utilization Metrics (Working Calendar Driven)**
11. **Billing, Invoicing, Taxes & Accounts Receivable Aging**
12. **Audit Logging & Server-Side PDF/Excel Document Generation**
13. **RESTful API v1 with OpenAPI/Swagger & Webhook Engine**

---

## 3. Functional and Non-Functional Requirements

### 3.1 Functional Requirements Matrix (FRM)
- **FR-01 (Multi-Branch Hierarchy):** Scopes asset availability, work orders, contracts, and revenue by Branch, Cost Center, and Project Site.
- **FR-02 (Asset Tagging):** Generates Code-128 and QR-2D vector labels with asset tag, serial number, and verification URL.
- **FR-03 (Mobile Scanning Workflow):** Camera-based scan resolves asset tag, verifies operational status, and prompts the field operator for status transitions with photo upload.
- **FR-04 (Rental State Machine):** `QUOTATION_DRAFT` → `QUOTATION_APPROVED` → `CONTRACT_CONFIRMED` → `ASSET_RESERVED` → `DISPATCHED` → `ON_HIRE` → `OFF_HIRE_REQUESTED` → `RETURNED_INSPECTED` → `INVOICED` → `CLOSED`.
- **FR-05 (Collision Avoidance):** Database check constraints and transaction row-locking prevent concurrent booking of serialized assets.
- **FR-06 (Timesheet Sync):** REST Webhook + Polling adapter with idempotent deduplication hashing (`SHA256(external_id + operator_id + date)`).
- **FR-07 (Safety Hold):** Any failed item on a mandatory K3 pre-start checklist automatically flags asset status as `SAFETY_HOLD`, blocking dispatch.
- **FR-08 (Maintenance Work Orders):** Automatically triggers preventive work orders when engine hour meters exceed configured thresholds (e.g., 250h, 500h, 1000h).
- **FR-09 (Procurement Segregation):** Purchase Orders > $5,000 require Branch Manager approval; > $25,000 require Executive Director sign-off. Requester cannot approve.
- **FR-10 (AR Aging Calculation):** Daily automated cron evaluates open invoices against `due_date`, partitioning into `Current`, `1-30`, `31-60`, `61-90`, and `>90` day buckets.
- **FR-11 (Tax Engine):** Computes Indonesian PPN 11% (VAT) and PPh Pasal 23 (2% equipment rental withholding) with precision formatting.

### 3.2 Non-Functional Requirements (NFR)
- **Security:** OWASP Top 10 compliance, Argon2id/Bcrypt password hashing, AES-256 encrypted sensitive credentials, parameterized queries, CSRF token validation, RBAC with branch data scoping.
- **Performance:** Sub-100ms API response time for p95 transactional read operations; sub-300ms for complex filtered queries.
- **Scalability:** Stateless application servers supporting vertical and horizontal containerized scale; database connection pooling.
- **Data Integrity:** ACID-compliant PostgreSQL database transactions; immutable append-only audit trail (`audit_logs`) tracking actor, entity, old values, new values, IP address, and user agent.
- **Auditability:** Zero silent edits; issued invoices require signed Credit Notes for alterations; work orders record exact mechanic timestamps.
- **Disaster Recovery:** RPO < 15 minutes via automated WAL archiving; RTO < 2 hours via containerized orchestration.

---

## 4. User Roles and Permission Matrix

| Module / Resource | Executive (Direktur) | Admin (IT) | Sales & Marketing | Asset Control | Field Ops (K3) | Procurement | FAT (Finance & Tax) | AR Management |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Executive Reports & Calculator** | **View / Calc / Export** | View / Export | - | - | - | - | View | View |
| **System Settings & Audit Logs** | View Audit | **Full Admin** | - | - | - | - | View Audit | - |
| **REST API Explorer & Tests** | - | **Full Admin** | - | - | - | - | - | - |
| **Customer & Client CRM** | View / Approve | View / Edit | **Create / Edit** | View | View | View | View / Edit | View / SOA |
| **Quotations & Sales Orders** | Approve (>limit) | View / Admin | **Create / Edit** | View | View | - | View | View |
| **Asset Registry & Legal Docs** | View | View / Admin | View | **Create / Edit / SIA** | View / Status | View | View (Valuation) | View |
| **Asset Tags & Barcode Gen** | View | View / Admin | View | **Generate / Print** | Scan / Verify | View | - | - |
| **Rental Contracts & Handover** | View / Approve | View / Admin | Create / Edit | Allocate / DO | Inspect / Handover | - | View | View |
| **Operator SIO Management** | View | View / Admin | - | View | **Assign / SIO Doc** | - | - | - |
| **K3 Safety & Inspections** | View | View / Admin | - | View | **Execute / Hold** | - | - | - |
| **Maintenance Work Orders** | View | View / Admin | - | Schedule | Assign / Execute | Spareparts | View Costs | - |
| **Purchase Orders & Vendors** | Approve (>limit) | View / Admin | - | PR Asset | PR Tooling | **Create / PO Send** | Verify Bill | - |
| **Billing & Invoices** | View | View / Admin | View | - | - | - | **Issue / Credit Note** | View / Trace |
| **Payments & Settlements** | View | View / Admin | View | - | - | - | **Record / Reconcile**| **Allocate / Trace** |
| **AR Aging & Overdue Tracing**| View / Export | View / Export | View | - | - | - | View / Balance | **Follow-up / Trace** |

---

## 5. End-to-End Business Process Flows

```
[COMMERCIAL PHASE]
Customer Request -> Quotation Drafted -> Credit Limit Check -> Internal Approval -> Customer Acceptance
       │
       ▼
[ALLOCATION & RESERVATION]
Sales/Rental Order Created -> Serialized Asset Reserved -> Safety Certificate (SIA) & SIO Validated
       │
       ▼
[DISPATCH & MOBILIZATION]
Pre-Delivery Inspection (K3) -> Surat Jalan (DO) Issued -> Mobilization to Job Site -> Digital BAST Handover Sign-off
       │
       ▼
[OPERATIONAL RUN-TIME]
Daily Timesheet Ingestion (External API/Webhook) -> Machine Hour Meter Logging -> Scheduled PM Service
       │
       ▼
[DEMOBILIZATION & RETURN]
Off-Hire Notification -> Return Inspection (Checklist) -> Condition Graded (Excellent/Good/Damaged)
       ├── If Damaged: Maintenance Work Order Dispatched -> Security Deposit Applied
       └── If Good: Return to AVAILABLE Fleet -> Security Deposit Released
       │
       ▼
[BILLING & CASH SETTLEMENT]
Invoice Generated (DPP + PPN 11% - PPh 23) -> Issued to Client -> AR Aging Traced -> Payment Allocation & Receipt
```

---

## 6. System Architecture Diagram

```
+--------------------------------------------------------------------------------------------------+
|                                     CLIENT PRESENTATION TIER                                     |
|  - Responsive Desktop Web & Mobile Field PWA (Tailwind CSS, Mobile-First Camera QR Scanner)       |
|  - Role-Scoped Workspaces & Instant PDF / Excel Printable Engine                                  |
+--------------------------------------------------------------------------------------------------+
                                                 │
                                                 │ HTTPS / JSON / JWT / Session Cookies
                                                 ▼
+--------------------------------------------------------------------------------------------------+
|                                      API & APPLICATION TIER                                      |
|  +-------------------------------------+  +---------------------------------------------------+  |
|  |       API Gateway & Middleware      |  |             Core Enterprise Controllers           |  |
|  | - Rate Limiter & Security Headers   |  | - Asset Controller & QR Engine                    |  |
|  | - RBAC & Multi-Branch Scoping       |  | - Rental Lifecycle State Machine                  |  |
|  | - Audit Logging Interceptor         |  | - Timesheet Ingestion & Reconciliation Adapter    |  |
|  | - Decimal-Safe Math Engine          |  | - Maintenance, K3 & Work Order Engine             |  |
|  +-------------------------------------+  | - Procurement & PO Workflow Controller            |  |
|                                           | - Billing, Tax (PPN/PPh) & AR Aging Controller    |  |
|                                           +---------------------------------------------------+  |
+--------------------------------------------------------------------------------------------------+
        │                                        │                                       │
        │ Redis Queue / Cache                    │ Database Connection Pool              │ Webhook / API
        ▼                                        ▼                                       ▼
+-----------------------+        +-----------------------------------+       +---------------------+
| BACKGROUND WORKERS    |        |        POSTGRESQL DATABASE        |       | THIRD-PARTY ENGINES |
| - Nightly AR Aging    |        | - Normalized Relational Schema    |       | - Operator Timesheet|
| - Preventive Alert PM |        | - Multi-Branch Partitioning/Keys  |       | - ERP / Accounting  |
| - PDF Report Spooler  |        | - Immutable Audit Tables          |       | - Telematics/GPS    |
| - Webhook Dispatcher  |        | - Row-Level Locking (Concurrency) |       | - Email/WhatsApp    |
+-----------------------+        +-----------------------------------+       +---------------------+
```

---

## 7. Proposed PostgreSQL Relational Database Schema (ERD)

### 7.1 Core Organizational & Access Control Entities
- `organizations (id UUID PK, name, legal_entity, tax_id, created_at)`
- `branches (id UUID PK, org_id FK, branch_code UNIQUE, name, address, phone, is_head_office, created_at)`
- `departments (id UUID PK, branch_id FK, name, cost_center_code)`
- `users (id UUID PK, branch_id FK, email UNIQUE, password_hash, full_name, role VARCHAR(32), status, mfa_enabled, created_at)`
- `user_branch_access (user_id FK, branch_id FK, can_write BOOLEAN, PRIMARY KEY(user_id, branch_id))`

### 7.2 Asset & Equipment Registry
- `asset_categories (id UUID PK, name, code UNIQUE, default_depreciation_rate, maintenance_interval_hours)`
- `assets (id UUID PK, branch_id FK, asset_tag UNIQUE, serial_number UNIQUE, name, category_id FK, manufacturer, model, year_manufactured, engine_number, chassis_number, license_plate, acquisition_cost NUMERIC(15,2), book_value NUMERIC(15,2), current_hour_meter NUMERIC(10,2), operational_status VARCHAR(32), availability_status VARCHAR(32), location_address, created_at)`
- `asset_legal_documents (id UUID PK, asset_id FK, document_type VARCHAR(32), document_number, issue_date DATE, expiry_date DATE, issuing_authority, file_path, status VARCHAR(32))`
- `asset_components (id UUID PK, parent_asset_id FK, component_name, serial_number, barcode_tag, is_active)`
- `asset_movement_logs (id UUID PK, asset_id FK, from_branch_id FK, to_branch_id FK, dispatch_date, received_date, authorized_by FK, reason)`

### 7.3 Barcodes & Mobile Tag Registry
- `asset_tags (id UUID PK, asset_id FK, tag_type VARCHAR(16), tag_code UNIQUE, qr_payload, generated_at, print_count, is_active)`
- `tag_scan_events (id UUID PK, tag_code, user_id FK, scanned_at, latitude, longitude, device_info, action_taken)`

### 7.4 Commercial Rental & Sales Management
- `customers (id UUID PK, branch_id FK, customer_code UNIQUE, company_name, npwp_tax_id, credit_limit NUMERIC(15,2), outstanding_balance NUMERIC(15,2), payment_terms_days INT, status)`
- `quotations (id UUID PK, quotation_number UNIQUE, customer_id FK, branch_id FK, subtotal NUMERIC(15,2), discount NUMERIC(15,2), tax_amount NUMERIC(15,2), grand_total NUMERIC(15,2), status, created_by FK, approved_by FK)`
- `quotation_items (id UUID PK, quotation_id FK, product_id, assigned_asset_id FK, unit_price NUMERIC(15,2), duration_days INT, line_total NUMERIC(15,2))`
- `rental_contracts (id UUID PK, contract_number UNIQUE, quotation_id FK, customer_id FK, branch_id FK, start_date DATE, end_date DATE, rate_type VARCHAR(16), security_deposit NUMERIC(15,2), deposit_status VARCHAR(16), contract_status VARCHAR(32), signed_document_path)`
- `rental_contract_items (id UUID PK, contract_id FK, asset_id FK, start_hour_meter NUMERIC(10,2), return_hour_meter NUMERIC(10,2), rate_amount NUMERIC(15,2), line_total NUMERIC(15,2))`
- `dispatch_orders (id UUID PK, contract_id FK, do_number UNIQUE, dispatch_date DATE, driver_name, transport_vehicle_plate, status)`
- `return_inspections (id UUID PK, contract_id FK, asset_id FK, inspection_date DATE, return_condition VARCHAR(32), hour_meter NUMERIC(10,2), damage_charge NUMERIC(15,2), inspector_id FK, remarks)`

### 7.5 Operator Timesheet Integration
- `operator_masters (id UUID PK, employee_code UNIQUE, full_name, sio_number, sio_class VARCHAR(16), sio_expiry DATE, status)`
- `timesheet_sync_batches (id UUID PK, source_system, batch_timestamp, records_imported, status, log_message)`
- `operator_timesheets (id UUID PK, external_timesheet_id UNIQUE, sync_batch_id FK, operator_id FK, asset_id FK, customer_id FK, work_date DATE, start_time TIME, end_time TIME, total_hours NUMERIC(5,2), approval_status, is_reconciled BOOLEAN)`

### 7.6 Safety & Maintenance Subsystem
- `safety_inspection_checklists (id UUID PK, asset_id FK, inspector_id FK, inspection_date DATE, type VARCHAR(32), has_defect BOOLEAN, safety_hold_applied BOOLEAN, sign_off_name)`
- `safety_defects (id UUID PK, inspection_id FK, defect_description, severity VARCHAR(16), action_required, is_resolved BOOLEAN)`
- `maintenance_work_orders (id UUID PK, wo_number UNIQUE, asset_id FK, branch_id FK, wo_type VARCHAR(32), priority VARCHAR(16), scheduled_date DATE, completed_date DATE, technician_id FK, parts_cost NUMERIC(15,2), labor_cost NUMERIC(15,2), total_cost NUMERIC(15,2), downtime_hours NUMERIC(6,2), status VARCHAR(32))`

### 7.7 Procurement & Supplier Subsystem
- `suppliers (id UUID PK, supplier_code UNIQUE, company_name, tax_id, rating NUMERIC(3,2), payment_terms_days INT, status)`
- `purchase_orders (id UUID PK, po_number UNIQUE, supplier_id FK, branch_id FK, order_date DATE, expected_delivery_date DATE, subtotal NUMERIC(15,2), tax_amount NUMERIC(15,2), grand_total NUMERIC(15,2), status, requester_id FK, approver_id FK)`
- `purchase_order_items (id UUID PK, po_id FK, item_description, part_number, quantity INT, unit_cost NUMERIC(15,2), line_total NUMERIC(15,2))`
- `goods_receipts (id UUID PK, po_id FK, gr_number UNIQUE, received_date DATE, received_by FK, invoice_reference, status)`

### 7.8 Billing, Taxes & Accounts Receivable
- `invoices (id UUID PK, invoice_number UNIQUE, contract_id FK, customer_id FK, branch_id FK, issue_date DATE, due_date DATE, dpp_amount NUMERIC(15,2), ppn_amount NUMERIC(15,2), pph23_amount NUMERIC(15,2), grand_total NUMERIC(15,2), paid_amount NUMERIC(15,2), outstanding_balance NUMERIC(15,2), status VARCHAR(32))`
- `credit_notes (id UUID PK, credit_note_number UNIQUE, invoice_id FK, amount NUMERIC(15,2), reason, authorized_by FK, issue_date DATE)`
- `payments (id UUID PK, payment_number UNIQUE, customer_id FK, payment_date DATE, amount NUMERIC(15,2), payment_method VARCHAR(32), reference_number, unallocated_amount NUMERIC(15,2), status)`
- `payment_allocations (id UUID PK, payment_id FK, invoice_id FK, allocated_amount NUMERIC(15,2), allocated_at TIMESTAMP)`
- `ar_aging_snapshots (id UUID PK, snapshot_date DATE, customer_id FK, current_bucket NUMERIC(15,2), days_30 NUMERIC(15,2), days_60 NUMERIC(15,2), days_90 NUMERIC(15,2), days_over_90 NUMERIC(15,2), total_due NUMERIC(15,2))`

### 7.9 Auditing & Security Logs
- `audit_logs (id BIGSERIAL PK, actor_id UUID, actor_name VARCHAR(128), action VARCHAR(64), entity_type VARCHAR(64), entity_id VARCHAR(64), old_values JSONB, new_values JSONB, ip_address VARCHAR(45), user_agent TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`

---

## 8. Module Dependency Map

```
       [01. Multi-Branch Org & RBAC Engine]
                        │
       ┌────────────────┴────────────────┐
       ▼                                 ▼
[02. Asset Registry & SIA Docs]    [03. Customer & Supplier CRM]
       │                                 │
       ├─────────────────────────────────┤
       ▼                                 ▼
[04. Barcode & QR Engine]         [05. Quotation & Rate Cards]
       │                                 │
       ▼                                 ▼
[06. Safety K3 & Operator SIO]    [07. Rental Contracts & Dispatch]
       │                                 │
       ▼                                 ▼
[08. Maintenance & Work Orders]   [09. Timesheet Ingestion Adapter]
       │                                 │
       └────────────────┬────────────────┘
                        ▼
       [10. Return Inspection & Damaged Assets]
                        │
                        ▼
       [11. Invoicing & Tax Calculation (FAT)]
                        │
                        ▼
       [12. Payment Allocation & AR Aging Engine]
                        │
                        ▼
       [13. Executive Decision Analytics & Reports]
```

---

## 9. API Integration Architecture

### 9.1 RESTful Endpoint Conventions
All endpoints follow semantic JSON REST conventions under `/api/v1/`:
- `GET    /api/v1/branches`
- `GET    /api/v1/assets?branch_id=...&status=...&category=...`
- `POST   /api/v1/assets`
- `GET    /api/v1/assets/{id}/qr-code`
- `POST   /api/v1/assets/{id}/scan-verify`
- `POST   /api/v1/quotations`
- `POST   /api/v1/quotations/{id}/approve`
- `POST   /api/v1/quotations/{id}/convert-contract`
- `POST   /api/v1/rentals/{id}/dispatch`
- `POST   /api/v1/rentals/{id}/return-inspect`
- `POST   /api/v1/integrations/timesheets/webhook`
- `POST   /api/v1/maintenance/work-orders`
- `POST   /api/v1/procurement/purchase-orders`
- `POST   /api/v1/invoices/{id}/issue`
- `POST   /api/v1/invoices/{id}/credit-notes`
- `POST   /api/v1/payments/{id}/allocate`
- `GET    /api/v1/reports/executive-dashboard`
- `GET    /api/v1/reports/ar-aging`

### 9.2 Third-Party Timesheet Adapter Specification
```json
{
  "source_system": "APEX_TIMESHEET_HUB_V2",
  "batch_id": "SYNC-2026-10-15-001",
  "records": [
    {
      "external_timesheet_id": "EXT-TS-98421",
      "operator_badge": "OPR-CAT-001",
      "equipment_tag": "AST-EXC-320D",
      "customer_code": "CUST-WIKA-01",
      "project_site": "LRT Phase 2B Station C",
      "work_date": "2026-10-15",
      "hours_operated": 8.0,
      "breakdown_hours": 0.0,
      "operator_signature": "SIG_DATA_HASH_7384"
    }
  ]
}
```

---

## 10. Security & Audit Design

1. **Authentication & Session:**
   - Password Hashing: Argon2id with salt.
   - Rate Limiting: 5 attempts per minute per IP for authentication routes.
   - Session Lifetime: 120 minutes of inactivity; `HttpOnly`, `SameSite=Strict`, `Secure` cookies.
2. **Authorization (Branch Isolation):**
   - Every read/write query executes with a server-side branch filter (`WHERE branch_id IN (permitted_branches)`).
   - Super Admin & Executive Director possess cross-branch aggregation clearance.
3. **Audit Trail (Immutable Ledger):**
   - Critical triggers (Credit Notes, Payment Allocations, Return Damage Assessments, Asset Deletion) write append-only records with before/after state diffing.
   - No direct update or delete operations permitted on `audit_logs`.

---

## 11. Incremental Development Phase Plan

```
PHASE 1: Foundation, Multi-Branch Organization, Asset Registry & QR Tagging (CURRENT PHASE)
  - Deliverable: Multi-branch hierarchy, equipment master, STNK/BPKB/SIA legal tracking, barcode/QR generator, mobile scanner verification, and role-scoped navigation.

PHASE 2: Rental Contracts, Dispatch Logistics & Collision-Free Reservation
  - Deliverable: Quotations, rate cards, asset reservation lock, Surat Jalan DO, mobile site handover BAST, contract variations.

PHASE 3: K3 Safety Checklists, SIO Operator Licensure & Third-Party Timesheets
  - Deliverable: Mandatory pre-start inspections, safety hold enforcement, SIO validation, REST webhook timesheet ingestion & reconciliation.

PHASE 4: Technical Services, Maintenance Work Orders & Procurement
  - Deliverable: Hour-meter driven preventive maintenance, corrective work orders, spare part tracking, purchase orders & vendor bills.

PHASE 5: Billing, Invoicing, Tax Compliance (PPN/PPh 23) & AR Aging
  - Deliverable: Invoice generation, credit notes, payment allocations, multi-bucket aging, collection tracking.

PHASE 6: Executive Analytics, Interactive Profitability Calculator & Document Automation
  - Deliverable: Executive financial modeling, multi-branch consolidated KPIs, print-ready PDF reports & formatted Excel exports.
```

---

## 12. Initial Backlog with Priorities

1. **[P0]** Multi-Branch DB Schema with foreign key cascading and integer-cent mathematical safety.
2. **[P0]** Asset Registry with Serial / Engine / Chassis / SIA Certificate tracking and status state machine.
3. **[P0]** Barcode & QR Code Engine with printable labels and camera-based verification flow.
4. **[P0]** Role-Based Access Control matrix supporting the 8 business personas.
5. **[P1]** Rental Contract Double-Booking prevention with transaction-level asset reservation.
6. **[P1]** Mandatory K3 Pre-Start Safety Checklist triggering instant Safety Holds.
7. **[P1]** Third-Party Timesheet Webhook Ingestion with duplicate prevention.
8. **[P1]** Maintenance Work Orders updating fleet availability and condition scores.
9. **[P1]** Invoice Issuance with PPN 11% & PPh 23 withholding and credit note auditing.
10. **[P2]** AR Aging Calculation Engine with customer statement generation.
11. **[P2]** Executive Decision Calculator with real-time EBITDA and margin projections.

---

## 13. Acceptance Criteria and Testing Strategy

### 13.1 Acceptance Criteria
- **AC-01:** An asset with an expired SIA certificate or failed safety checklist cannot be assigned to an active dispatch order.
- **AC-02:** Attempting to assign an asset with status `RENTED` or `IN_MAINTENANCE` to another contract returns HTTP 422 with a conflict error.
- **AC-03:** Mobile camera scanning of an asset QR tag retrieves the asset record and displays its current status within 500ms.
- **AC-04:** Issued invoices cannot have their numbers or monetary amounts updated without generating a linked credit note.
- **AC-05:** Executive financial calculator accurately computes Net Operational Profit:  
  `Net Profit = (Revenue - OPEX) - Fleet Depreciation - Estimated Tax`.

### 13.2 Automated Test Suite Structure
1. **Unit Tests:** Integer-safe monetary math, tax calculations, date interval validation, utilization percentage formulas.
2. **Feature Tests:** User authentication, RBAC permission gate checks, branch scoping isolation, QR tag generation.
3. **API Integration Tests:** Timesheet webhook deduplication, quotation approval flow, credit note creation, payment allocations.
4. **Stress & Concurrency Tests:** Concurrent contract booking attempts for the same asset to verify PostgreSQL row-level locks (`SELECT FOR UPDATE`).

---

## 14. Risks, Assumptions and Open Business Questions

### 14.1 Key Risks & Mitigation
- **Risk 1: Unreliable Cellular Connectivity at Remote Mining/Construction Sites:**
  - *Mitigation:* The mobile field scanning interface is architected with offline PWA caching; inspection results queue locally and synchronize upon connection restoration.
- **Risk 2: Out-of-Sequence Timesheet Ingestion:**
  - *Mitigation:* Timesheet adapter enforces idempotency keys and logs unmapped operator or equipment codes to an exception resolution table rather than discarding data.

### 14.2 Open Business Questions for Stakeholders
1. What is the approved policy for mobilization/demobilization freight charges: are they billed upfront as part of the initial invoice or deferred until demobilization?
2. For cross-branch equipment transfers, which cost center absorbs the inter-branch transit logistics cost?
3. Should security deposit refunds require multi-signature approval between Asset Control and Finance?
