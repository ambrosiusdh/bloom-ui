# UXR-A05 evidence index — Stock movement history

Audit date: 2026-09-23  
Environment: local Bloom frontend (`http://localhost:5173`) and backend (`http://localhost:8080`)  
Browser: Codex in-app browser (Chromium-based; exact version unavailable)  
Mutation policy: read-only; no movement, sale, receipt, adjustment, transfer, item, or other record was created or changed

## Evidence policy

The live screenshots were inspected inline in the computer-use session. They are not checked into this directory because the UX roadmap says raw binary captures remain working artifacts unless the owner explicitly decides to retain them in Git. This index records the routes, state, visible facts, and DOM measurements needed to understand the audit without those binaries.

The full assessment and priorities are in [`docs/ux/audits/uxr-a05-stock-movements.md`](../../audits/uxr-a05-stock-movements.md).

## Live evidence sequence

| ID | Route / state | Viewport | Recorded evidence |
| --- | --- | --- | --- |
| A05-E01 | `/stock-movements` settled list | 1610×1270 | Ten rows on page 1 of 2. Wide table showed time, item/name/SKU/UOM, direction and source, location, signed quantity, before/after balance, reference, and actor. `document.body.clientWidth` and `scrollWidth` were both 1610; the 1307-pixel table region did not create page overflow. |
| A05-E02 | `/stock-movements?page=2` | 1610×1270 | Pagination reached page 2 and showed the remaining opening movement. Previous/next and numbered controls matched the two-page backend result. |
| A05-E03 | `/stock-movements?itemSku=UXRA04-FRAC` | 1610×1270 | Exact item filter returned STORE `+1,25 meter` and WAREHOUSE `+2,5001 meter` opening movements with zero-to-after balances, reference, actor, and time. Historical movement rows remained queryable after the item had been deactivated in UXR-A04. |
| A05-E04 | `/stock-movements?movementType=IN&location=WAREHOUSE` | 1610×1270 | Combined `Masuk` + `Gudang` filters returned only matching opening and goods-receipt movements; controls reflected the URL state. |
| A05-E05 | `/stock-movements?itemSku=UXRA05-NO-MATCH` | 1610×1270 | Settled filtered empty state said `Tidak ada pergerakan stok` and advised changing or removing filters. Pagination was disabled. |
| A05-E06 | SKU filter and `Hapus filter` | 760×768 | Tab order was SKU → direction → location → clear. Activating clear with Enter restored the unfiltered URL and data, but `document.activeElement` became `BODY` instead of remaining on a purposeful control. |
| A05-E07 | `/stock-movements?page=1` card presentation | 760×768 | Ten semantic movement cards rendered with no body-level horizontal overflow (`bodyClientWidth=745`, `bodyScrollWidth=745`). Cards retained item, SKU, direction, quantity/UOM, location, reference, actor, before/after, and time, but no source label such as `Penjualan`, `Penerimaan barang`, or `Stok awal` appeared. |
| A05-E08 | `/stock-movements?page=1` breakpoint boundary | 768×768 | The UI switched from cards to the 1160-pixel table. Measurements were `bodyClientWidth=753`, `bodyScrollWidth=1287`, table width `1160`, and zero visible cards. A page-level horizontal scrollbar appeared; the table container itself expanded to 1160 instead of containing the overflow. |
| A05-E09 | Data Barang → `Riwayat stok QA FE10 Live 82138041` | default wide | The item-row link navigated to `/stock-movements?itemSku=QA-FE10-82138041` and returned four movements. Reference cells contained `GR/IX-2026/0001`, `SALE/VIII-2026/0001`, and opening references, but the movement table contained zero links. |

## Representative read-only data observed

- Sale: `Batu Bata`, `OUT`, STORE, `−1 pcs`, `399 → 398 pcs`, `SALE/IX-2026/0003`, actor `admin`.
- Goods receipt: `QA FE10 Live 82138041`, `IN`, WAREHOUSE, `+0,5 meter`, `2,0001 → 2,5001 meter`, `GR/IX-2026/0001`, actor `admin`.
- Fractional opening stock: `UXRA04-FRAC`, STORE `+1,25 meter` and WAREHOUSE `+2,5001 meter`, both from zero.
- The 11-row local ledger contained sale, goods-receipt, and opening-balance sources. No adjustment, transfer, receipt-cancellation/reversal, or stock-opname row was present, so those source presentations were not claimed as live evidence.

## Repository and automated evidence

- `src/pages/stock-movement/StockMovementList.jsx` implements loading, error/retry, empty, filters, paging, wide table, and narrow cards from the backend response.
- `src/api/stock-movement.js` performs one paged `GET /api/stock-movements`; the page does not enrich each row with extra requests.
- `src/test/pages/stock-movement/StockMovementList.test.jsx` covers direct backend-read-model rendering, actionable error/retry, URL-filter paging reset, and filtered empty.
- `src/test/api/stock-movement.test.js` covers the paged/filter/abort request boundary.
- Focused command on 2026-09-23: `node node_modules/vitest/vitest.mjs run src/test/pages/stock-movement/StockMovementList.test.jsx src/test/api/stock-movement.test.js --reporter=verbose` — 2 files and 4 tests passed.
- Backend inspection confirmed a read-only controller and server-side filtering/sorting. The request contract supports item ID/SKU, source type, direction, adjustment action, location, date range, and reference; the response provides source identity, exact decimal quantities, location, before/after balances, reference, actor, and timestamp.

## Limitations

- The local data did not contain adjustment, transfer, goods-receipt cancellation/reversal, or stock-opname movements. No mutation was performed to manufacture them.
- A live API outage was not forced because stopping or intercepting the user's running services would affect the shared environment. Error/retry evidence is automated and repository-based.
- The API was too fast to retain a useful live loading frame; loading behavior is repository and automated evidence.
- Keyboard checks used browser automation, not the physical store keyboard or deployed store laptop.
- Raw screenshot binaries are not committed; the evidence measurements and visible-state records above are the durable audit artifacts.
