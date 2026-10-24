# EAMS Revision — Sidebar Deduplication, Multiple SIA, Icon Consistency

Date: 2026-10-24  
Delivery: local ZIP only; no branch or commit created.

## Read order for the next AI session
1. `docs/00_PROJECT_MAP_AND_NEXT_PROMPT.md`
2. This file: `docs/REVISION_2026-10-24_SIDEBAR_SIA.md`
3. `docs/REVISION_2026-10-24_APPROVAL_FINANCE_DISPATCH.md`
4. `docs/REVISION_2026-10-24_CONTRACT_MANAGEMENT_FINANCE_OVERVIEW.md`
5. `docs/REVISION_2026-10-24_GPS_CONTRACT_FINANCE.md`
6. `docs/REVISION_2026-10-24_QR_CUSTOMER_FINANCE_CONTRACTS.md`
7. `docs/REVISION_2026-10-24_LOCAL_REVIEW.md`
8. `docs/USER_GUIDE.md`, `docs/SECURITY_AND_ACCESS.md`, `docs/API_WORKFLOW_REVISION.md`, and `README.md`

## Changes

### Sidebar duplicate removal
- Source: `src/components/Sidebar.tsx`.
- Removed repeated `contract-management` and `finance-overview` entries found in Management and Finance sections.
- Added a global `seenModuleIds` filter. A module ID can render at most once, even if accidentally added to another section in a future edit.
- Role-based `allowedModules` filtering remains in place. This is UI navigation filtering only; API authorization continues to be enforced server-side.
- Sidebar menu icons now use fixed `!w-4 !h-4`, `shrink-0`, `flex-none`, and consistent stroke width to align size and prevent layout shifts.

### Multiple SIA certificates per asset
- Data model already supports `HeavyEquipmentDocs.siaDocuments: HeavyEquipmentComplianceDocument[]` in `src/types/index.ts`; the multi-file UI existed but the initialization path could overwrite the existing array with an empty list. This was corrected.
- Source: `src/components/AssetsView.tsx`.
- Opening Compliance Documents now preserves existing legal-document values and every saved SIA document. New assets without prior data get safe defaults.
- The existing multiple-file uploader accepts PDF/image files, validates each file to 2 MB and the aggregate additional SIA attachment payload to 4 MB, then stores document ID, number, expiry, issuer, filename, and data URL.
- Each additional SIA row supports editing certificate number, expiry date, issuing authority, opening its attachment, and removing the row before save.
- Save validation blocks the form if any additional SIA entry is missing its certificate number or expiry date.
- Save uses the existing `api.updateAssetDocuments` endpoint and persists the `legalDocs` payload through the existing asset-document API. No new endpoint was required.
- Legacy single-SIA fields (`siaNumber`, `siaExpiry`, `siaIssuer`, `siaFileUrl`) remain for backward compatibility; the additional array supplements them rather than replacing them.

## Test notes and limitations
- ZIP integrity check is performed after packaging.
- No browser-based duplicate sidebar test or physical PDF/image upload test is claimed unless performed on the review host.
- Run `npm ci`, `npm run lint`, `npm run build`, and `npm run test:api` in the local review environment.
- Manually test: each role sees only permitted modules; each module ID appears once; opening/saving an asset retains existing multiple SIA documents; upload multiple PDF/image files; edit issuer/number/expiry; remove a row; verify 2 MB per-file and 4 MB aggregate guards; reopen the modal and confirm data persists.
- Attachments are currently stored as data URLs in the JSON-backed data layer. This creates payload/storage growth limits; do not claim a dedicated document-storage service is configured.
