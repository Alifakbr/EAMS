# Apex EAMS & Commercial Operations — Backup & Disaster Recovery Guide

## 1. Overview

Apex EAMS maintains an immutable transactional store containing:
- Asset Registry & Serial Numbers
- Commercial Customers, Billing & Delivery Addresses
- Product Catalog, Stock Levels, and Costing
- Sales Quotations, Sales Orders & Deliveries
- Rental Contracts, Extensions & Inspection Condition Logs
- Invoices, Credit Notes, Payments & Multi-Invoice Allocations
- Vendors, Purchase Orders & Inbound Bills
- Maintenance Work Orders
- Cryptographically timestamped Audit Logs

---

## 2. Automated & On-Demand Backup Procedures

### Method A: Web UI Backup
1. Navigate to **Settings & Audit Log** in the sidebar.
2. Click **Download Backup (.json)** in the top right.
3. A complete timestamped JSON snapshot (`apex_eams_backup_YYYY-MM-DD.json`) is downloaded directly to your machine.

### Method B: API Endpoint
```bash
curl -O -J http://localhost:3000/api/v1/system/backup
```

### Method C: Docker Volume Snapshot
The database file is persisted on disk inside the `data/` volume:
```bash
# Copy persisted database file directly from Docker container
docker cp apex_eams_platform:/app/data/eams_db.json ./backups/eams_db_$(date +%F).json
```

---

## 3. Restoration Procedures

### Method A: API Restore
```bash
curl -X POST http://localhost:3000/api/v1/system/restore \
  -H "Content-Type: application/json" \
  -d @./backups/eams_db_2026-10-14.json
```

### Method B: Docker Volume Replacement
1. Stop container:
   ```bash
   docker-compose stop
   ```
2. Replace data file:
   ```bash
   docker cp ./backups/eams_db_2026-10-14.json apex_eams_platform:/app/data/eams_db.json
   ```
3. Restart container:
   ```bash
   docker-compose start
   ```

---

## 4. Factory Demo Reset

To quickly clear experimental test data and return the system to pristine initial demonstration state:
- Click **Reset Demo Data** in the Settings panel, or:
```bash
curl -X POST http://localhost:3000/api/v1/system/reset-demo
```
