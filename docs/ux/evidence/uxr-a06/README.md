# UXR-A06 evidence index — Stock adjustment

Audit date: 2026-09-23  
Persistent visual recapture: 2026-09-24  
Environment: local Bloom frontend (`http://localhost:5173`) and backend (`http://localhost:8080`)  
Browser: Codex in-app browser (Chromium-based; exact version unavailable)  
Mutation policy: three explicitly recorded disposable items and three stock adjustments were created across the audit and visual recapture; the items were deactivated after use, while adjustment/movement audit history was intentionally retained

## Evidence policy

The owner explicitly requested persistent screenshots before UXR-A07. The concise PNG set is retained in this evidence directory as working-tree evidence for design review. The report still records routes, starting state, visible facts, actions, and DOM measurements so conclusions do not depend on image interpretation alone.

The full assessment and priorities are in [`docs/ux/audits/uxr-a06-stock-adjustment.md`](../../audits/uxr-a06-stock-adjustment.md).

## Persistent screenshot set

| File | Material state captured |
| --- | --- |
| [`00-fixture-create-form-wide.png`](00-fixture-create-form-wide.png) | Completed disposable-item form before creation. |
| [`00-fixture-created-wide.png`](00-fixture-created-wide.png) | Backend-confirmed item creation and active fixture row. |
| [`01-adjustment-list-wide.png`](01-adjustment-list-wide.png) | Wide adjustment list before the visual-recapture transaction. |
| [`02-create-empty-wide.png`](02-create-empty-wide.png) | Empty adjustment form. |
| [`03-create-required-validation-wide.png`](03-create-required-validation-wide.png) | Required-field validation after review. |
| [`04-item-picker-open-wide.png`](04-item-picker-open-wide.png) | Full active-item picker with no search inside the control. |
| [`05-whole-unit-validation-wide.png`](05-whole-unit-validation-wide.png) | Whole-unit quantity validation. |
| [`06-create-filled-ready-wide.png`](06-create-filled-ready-wide.png) | Complete ADD request ready for review. |
| [`07-confirmation-wide.png`](07-confirmation-wide.png) | Frozen confirmation with server-authority explanation. |
| [`07-correction-zero-detail-wide.png`](07-correction-zero-detail-wide.png) | Existing absolute-zero CORRECTION result. |
| [`09-backend-confirmed-success-wide.png`](09-backend-confirmed-success-wide.png) | Backend-confirmed `SA/IX-2026/0003` result. |
| [`10-adjustment-detail-wide.png`](10-adjustment-detail-wide.png) | Persisted detail for `SA/IX-2026/0003`. |
| [`11-filtered-empty-wide.png`](11-filtered-empty-wide.png) | Filtered no-result state and recovery action. |
| [`12-adjustment-list-760x768.png`](12-adjustment-list-760x768.png) | List at the narrow-desktop viewport. |
| [`13-create-form-760x768.png`](13-create-form-760x768.png) | Create form stacked at the narrow-desktop viewport. |
| [`14-detail-overflow-760x768.png`](14-detail-overflow-760x768.png) | Detail-table overflow at `760×768`. |
| [`15-detail-overflow-768x768.png`](15-detail-overflow-768x768.png) | Navigation-plus-detail overflow at the `768×768` boundary. |
| [`16-movement-trace-wide.png`](16-movement-trace-wide.png) | Opening and adjustment movements for the recapture fixture. |
| [`17-cleanup-before-wide.png`](17-cleanup-before-wide.png) | Fixture immediately before deactivation. |
| [`18-cleanup-confirmation-wide.png`](18-cleanup-confirmation-wide.png) | Destructive-action confirmation for fixture cleanup. |
| [`19-cleanup-complete-wide.png`](19-cleanup-complete-wide.png) | Successful deactivation and filtered active-list absence. |

The live POST completed too quickly to retain a genuine pending frame during the recapture. Pending behavior therefore remains supported by the original live DOM observation and focused automated tests; no artificial delay or fabricated state was introduced for a screenshot.

## Live evidence sequence

| ID | Route / state | Viewport | Recorded evidence |
| --- | --- | --- | --- |
| A06-E01 | `/stock-adjustments` initial state | 1610×1270 | The adjustment ledger was genuinely empty and showed `Belum ada penyesuaian stok`. Filters, page-size control, disabled pagination, and `Buat penyesuaian` were visible. |
| A06-E02 | `/stock-adjustments/new`, blank review and whole-unit validation | 1610×1270 | Blank review exposed required reason/item/quantity errors and focused the reason textarea. After selecting `UXRA06-WHOLE` and entering `1,5`, the form showed `Barang ini hanya dapat disesuaikan dalam jumlah utuh.` and focused quantity. |
| A06-E03 | Item selector open | 1610×1270 | One unsearchable listbox contained nine active `[SKU] Name` options, including both fixtures. No query, category, or alternate discovery control appeared inside the picker. |
| A06-E04 | ADD/REMOVE confirmation | 1610×1270 | Confirmation froze reason `Audit A06 tambah dan kurangi stok`, `UXRA06-WHOLE · STORE · ADD · 2 pcs`, and `UXRA06-FRAC · WAREHOUSE · REMOVE · 0,25 meter`. It stated that the server would determine previous/new stock and movements. `Batal` had initial focus; Escape closed the dialog and returned focus to `Tinjau penyesuaian`. |
| A06-E05 | First POST pending and success | 1610×1270 | During POST, form/dialog actions were disabled and the button read `Menyimpan...`. Success returned `SA/IX-2026/0001`, actor `admin`, time `21:51`, whole STORE `10 → 12 pcs`, fractional WAREHOUSE `4,75 → 4,5 meter`, and matching movement cards. Movement cards displayed raw `IN`/`OUT`. |
| A06-E06 | `/stock-adjustments/SA%2FIX-2026%2F0001` | 1610×1270 | Detail showed reference, actor, timestamp, confirmed reason, both lines, localized actions/locations, exact request quantities, previous stock, and new stock from the server. |
| A06-E07 | CORRECTION zero confirmation and success | 1610×1270 | Form helper and confirmation identified an absolute CORRECTION target and allowed zero. `SA/IX-2026/0002` returned `UXRA06-FRAC` STORE `2,5 → 0 meter`; booked movement was OUT `2,5 meter`. |
| A06-E08 | No-op CORRECTION target `12 pcs` against current `12 pcs` | 1610×1270 | The exact request appeared in confirmation. After submission the dialog closed, the filled form returned, focus was on `Tinjau penyesuaian`, and no visible rejection message appeared during observation. At that point the list still contained exactly `0001` and `0002`; the rejected attempt created no adjustment. |
| A06-E09 | `/stock-adjustments?q=0002&page=1` and detail return | 1610×1270 | Reference search returned only `SA/IX-2026/0002`. `Kembali ke daftar` restored the complete filtered URL and single result. With both records visible, the two row links shared the accessible name `Detail`. |
| A06-E10 | `/stock-adjustments?q=UXRA06-NO-MATCH&page=1` | 1610×1270 | The active no-match filter produced the unfiltered copy `Belum ada penyesuaian stok` / `Buat penyesuaian saat stok fisik perlu dicatat ulang`. `Hapus filter` remained available. |
| A06-E11 | `/stock-adjustments?page=8&size=5` | 1610×1270 | The route canonicalized to `/stock-adjustments?page=1&size=5` and rendered both rows. Visible order was `0001`, then `0002` (oldest first). |
| A06-E12 | List and create at `760×768` | 760×768 | List rendered a compact table with `bodyClientWidth=760` and `bodyScrollWidth=760`. Create stacked item, location, action, and quantity controls with the same body width and no horizontal overflow. |
| A06-E13 | Detail at `760×768` and `768×768` | 760×768 and 768×768 | At 760, `bodyClientWidth=745`, `bodyScrollWidth=852`, table width `820`; `Stok baru` was beyond the viewport. At 768, `bodyClientWidth=753`, `bodyScrollWidth=1108`; the persistent navigation rail and table created a much larger page-level overflow. |
| A06-E14 | `/stock-movements?itemSku=UXRA06-WHOLE` and `UXRA06-FRAC` | default wide | Movement history showed `SA/IX-2026/0001` as whole STORE `+2` and fractional WAREHOUSE `−0,25`, and `SA/IX-2026/0002` as fractional STORE `−2,5`, with matching before/after balances, actor, and UOM. |
| A06-E15 | Data Barang filtered to `UXRA06`, then adjustment detail after cleanup | default wide | Both disposable items were deactivated through the implemented action. The filtered active list then said `Barang tidak ditemukan`. Adjustment `0002` remained accessible with the original item identity and server balances. |

## Created transaction ledger

| Reference | Confirmed reason | Lines | Server result |
| --- | --- | --- | --- |
| `SA/IX-2026/0001` | `Audit A06 tambah dan kurangi stok` | `UXRA06-WHOLE`, STORE, ADD `2 pcs`; `UXRA06-FRAC`, WAREHOUSE, REMOVE `0,25 meter` | `10 → 12 pcs`; `4,75 → 4,5 meter` |
| `SA/IX-2026/0002` | `Audit A06 koreksi absolut ke nol` | `UXRA06-FRAC`, STORE, CORRECTION target `0 meter` | `2,5 → 0 meter` |
| `SA/IX-2026/0003` | `Audit A06 screenshot transaksi` | `UXRA06-SHOT`, STORE, ADD `1 pcs` | `6 → 7 pcs` |

The attempted reason `Audit A06 koreksi tanpa perubahan` used `UXRA06-WHOLE`, STORE, CORRECTION target `12 pcs` against current `12 pcs`; it produced no reference and no stored adjustment.

## Keyboard and accessibility evidence

- Blank review focused the first invalid reason field.
- Whole-unit validation focused quantity.
- Confirmation focused the safe `Batal` action first.
- Escape closed confirmation and restored focus to `Tinjau penyesuaian`.
- Pending disabled mutation controls and prevented a duplicate create.
- The success message used a status region; the complete result remained visible.
- The no-op rejection returned focus to the review button but exposed no visible rejection text during observation.
- List row actions were keyboard-operable links, but every link's accessible name was only `Detail`.

## Repository and automated evidence

### Frontend files inspected

- `src/pages/stock-adjustment/StockAdjustmentList.jsx`
- `src/pages/stock-adjustment/StockAdjustmentCreate.jsx`
- `src/pages/stock-adjustment/StockAdjustmentDetail.jsx`
- `src/components/stock-adjustment/StockAdjustmentInfoCard.jsx`
- `src/components/stock-adjustment/StockAdjustmentItemsTable.jsx`
- `src/stores/modules/stock-adjustment.js`
- `src/api/stock-adjustment.js`
- `src/utils/stock-adjustment-utils.js`
- focused list/detail/create/store/API/utility tests

Repository facts used in the report:

- the create page walks every active-item page at size 100 and places all results in one select;
- list UI sends the supported reference filter and paging only, although the backend request also supports dates;
- detail uses an 820-pixel minimum-width table;
- definitive validation intends a generic warning, conflict refreshes item data, and other uncertain outcomes remain quarantined;
- the store persists an attempt before POST, blocks duplicates, verifies a complete result, and requires explicit reconciliation for an ambiguous request.

### Backend files inspected

- `StockAdjustmentController`
- create/filter/item request DTOs and validation annotations
- stock-adjustment response DTOs
- `StockAdjustmentServiceImpl`
- `StockAdjustmentSpecification`
- inventory quantity validation and global exception handling

Backend facts used in the report:

- ADD/REMOVE are positive deltas; CORRECTION sets an absolute target and may be zero;
- resulting stock and movements are calculated/persisted transactionally by the backend;
- a CORRECTION target equal to current stock is rejected;
- list filters support reference and date range;
- detail/result expose previous/new stock and actor/time.

### Focused test run

Command:

```text
node node_modules/vitest/vitest.mjs run src/test/pages/stock-adjustment/StockAdjustmentCreate.test.jsx src/test/pages/stock-adjustment/StockAdjustmentList.test.jsx src/test/pages/stock-adjustment/StockAdjustmentDetail.test.jsx src/test/stores/stock-adjustment.test.js src/test/utils/stock-adjustment-utils.test.js src/test/api/stock-adjustment.test.js --reporter=verbose
```

Result on 2026-09-23:

```text
Test Files  6 passed (6)
Tests       30 passed (30)
Duration    19.42s
```

Coverage relevant to UXR-A06 included item loading/error/empty/retry, required and whole/fractional validation, duplicate SKU, exact frozen request, pending and duplicate blocking, complete server outcome, all active-item pages, conflict refresh and lock, post-success refresh failure, durable ambiguous recovery, malformed success, definitive rejection unlock, list/detail loading/error/retry, paging canonicalization, return state, and API request forwarding.

## Cleanup and retained data

- `UXRA06-WHOLE`, `UXRA06-FRAC`, and the visual-recapture fixture `UXRA06-SHOT` were deactivated after use.
- Their opening movements, `SA/IX-2026/0001`, `SA/IX-2026/0002`, `SA/IX-2026/0003`, and all linked movement history remain as local audit records.
- No app, backend, dependency, or configuration file was changed for the live scenarios.
- No transfer, CSV adjustment, forced network interruption, direct database mutation, or destructive reseed was performed.

## Evidence limitations

- The PNGs are a 2026-09-24 visual recapture of material states; the original 2026-09-23 route/DOM observations remain the primary behavioral record.
- A genuine pending PNG could not be retained because the local POST completed before capture; no artificial latency was introduced.
- Conflict/ambiguous/storage/malformed-response visuals are automated-test and repository evidence only.
- The live catalog had nine active choices, so large-catalog impact is an evidence-backed scale inference rather than a measured hundred-item timing result.
- Exact browser version, Windows display scaling, deployed laptop, and physical store input hardware were unavailable.
