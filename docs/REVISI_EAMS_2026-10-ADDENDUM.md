# EAMS Revision Addendum — 2026-10

## GPS Fleet Map print
The global print stylesheet now requests A4 landscape, preserves Leaflet tile/overlay/marker layers, and fixes the print map height. Browser printing of remote map tiles still depends on the browser having loaded those tiles before printing and on the tile provider allowing tile requests. For best output, open the map, wait until all tiles have loaded, then use Print / Save as PDF with background graphics enabled. For a deterministic archival map image, a server-side/static map export service would be needed.

## Compliance document expiry
The existing data model supports multiple SIA records (`legalDocs.siaDocuments`) and retains compatibility with legacy single-SIA fields. SIA reminder processing currently runs when the notifications endpoint is read. Confirm that each SIA record has an expiry date and a stable identifier. A scheduled background job and generalized reminder logic for every document category are still recommended before production; a page-open notification check alone is not a guaranteed daily reminder delivery mechanism.

## IT data transition
Use Settings → Download Backup to export the complete current JSON database state, and Settings → Restore Backup to import it. The restore endpoint preserves existing user accounts/credentials rather than importing them from the backup. Back up the current environment before restore. The current backend stores data in a JSON database file (`data/eams_db.json`), not relational database tables; this backup exports collections, not SQL tables. Per-collection selection is not currently exposed as a verified UI feature.

## IT demo reset
The existing demo reset route resets business/demo data while retaining the current user accounts. It may be disabled in production unless `ALLOW_DEMO_RESET=true`; do not enable this in production. Download a backup first. Validate reset behavior in a test environment before allowing team-wide access.

## GRC Access Control
Use the existing IT User Management / access-management functionality to review user roles and module permissions. A separate next-tab GRC Access Control screen is not confirmed as implemented in this source revision; do not treat it as available until the UI and server authorization checks are tested.

## API and verification status
See `API_WORKFLOW_REVISION.md` and the OpenAPI endpoint list. This source package has not been verified by a fresh frontend production build or full API end-to-end suite in this environment. Treat this as a local-review build, not a production release.
