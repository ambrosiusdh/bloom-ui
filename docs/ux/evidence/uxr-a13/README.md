# UXR-A13 evidence index — goods-receipt history and detail

Audit date: 2026-09-24; completion recapture: 2026-09-26  
Environment: local Bloom frontend (`http://localhost:5173`) and backend (`http://localhost:8080`)  
Mutation policy: initial audit was read only; completion uses separately authorized UXR-A14 receipt creation and UXR-A15 payment fixtures

At the initial pass, the live database contained one goods receipt: `GR/IX-2026/0001`, a posted,
unpaid receipt for `QA-FE26-20260909` with one `0,5 meter` WAREHOUSE line.
It did not contain the partial, paid, or STORE-line examples required by the
UXR-A13 environment gate. UXR-A14 and the corrected UXR-A15 flow subsequently
created authorized disposable fixtures. The completion capture now shows all
required payment states plus both stock locations.

## Persistent screenshots

| Evidence | File | Route/state | What it establishes |
| --- | --- | --- | --- |
| A13-E01 | `00-list-wide.png` | `/goods-receipts`, 1440×900 | Baseline list, filter density, supplier/reference/status/financial hierarchy, page-size controls. |
| A13-E02 | `01-list-empty-filter.png` | no-match reference filter | Settled filtered-empty copy and recovery action availability. |
| A13-E03 | `02-list-supplier-filter.png` | supplier-name filter | Supported supplier-name search and URL-backed state. |
| A13-E04 | `03-list-same-day-filter.png` | `2026-09-09` through `2026-09-09` | Calendar-date input is retained unchanged and returns the receipt occurring on that store date. |
| A13-E05 | `05-list-invalid-url-canonicalized.png` | inverted date range supplied in URL | Invalid date parameters are removed and page is canonicalized to page 1 rather than sent to the backend. |
| A13-E06 | `06-detail-wide-unpaid.png` | unpaid receipt detail, top | Receipt identity, supplier, statuses, timestamps, server financial truth, and the payment form's position in the read journey. |
| A13-E07 | `07-detail-invalid-reference.png` | reference over 100 characters | Client-side invalid-reference error and safe return link without a backend read. |
| A13-E08 | `08-detail-not-found-error.png` | valid-shaped missing reference | Backend error, retry, and return affordances. |
| A13-E09 | `09-detail-retry-error.png` | retry of missing reference | Retry remains on the same reference and returns to the same recoverable error state. |
| A13-E10 | `10-list-keyboard-focus.png` | list keyboard traversal | Focus is visible, but the operator passes 15 shell controls before the first page action and native date inputs add multiple segment stops. |
| A13-E11 | `11-list-narrow-1024.png` | list at 1024×768 | Desktop table plus expanded shell produces page-level overflow. |
| A13-E12 | `12-list-narrow-760.png` | list at 760×768 | Collapsed shell still leaves the 1080-pixel table wider than the viewport; the right side is clipped until horizontal page panning. |
| A13-E13 | `13-detail-narrow-1024.png` | detail at 1024×768 | Detail content also exceeds the viewport before the intended item table can be reviewed. |
| A13-E14 | `14-detail-narrow-760.png` | detail at 760×768 | Information and payment sections remain readable, but the page is still wider than the viewport. |
| A13-E15 | `15-detail-items-wide.png` | detail, lower wide viewport | Persisted SKU, `Gudang`, `0,5 meter`, purchase price, and server line subtotal. |
| A13-E16 | `16-filter-return-preserved.png` | supplier filter → detail → Kembali | Detail navigation returns to the exact supplier filter, page, and page-size URL. |
| A13-E17 | [`17-all-payment-states-after-fix.jpg`](17-all-payment-states-after-fix.jpg) | completion recapture, goods-receipt list | Server-refreshed unpaid, partially paid, and paid receipt states are visible together after the payment transport fix. |

## Measurements and interaction notes

- List at 1024×768: document `clientWidth=1024`, `scrollWidth=1368`; the
  table container itself measured 1080 pixels.
- List at 760×768: document `clientWidth=745`, `scrollWidth=1127`; the table
  container still measured 1080 pixels.
- Detail at 1024×768: document `clientWidth=1024`, `scrollWidth=1108`.
- Detail at 760×768: document `clientWidth=745`, `scrollWidth=867`.
- Keyboard traversal from the document start reached Dashboard, every sidebar
  destination, Kasir, Keluar, and the navigation toggle before `Buat
  penerimaan`; 15 shell stops precede the first page action.
- The date filter sent `2026-09-09` unchanged. Backend inspection confirms the
  service interprets it in `bloom.store-zone-id` as start-inclusive and the
  next day's start-exclusive.

## Repository and automated evidence

Inspected frontend sources:

- `src/pages/goods-receipt/GoodsReceiptList.jsx`
- `src/pages/goods-receipt/GoodsReceiptDetail.jsx`
- `src/components/goods-receipt/GoodsReceiptInfoCard.jsx`
- `src/components/goods-receipt/GoodsReceiptItemsTable.jsx`
- `src/stores/modules/goods-receipt.js`
- `src/api/goods-receipt.js`
- `src/utils/goods-receipt-utils.js`

Inspected backend sources:

- `GoodsReceiptController`
- `FilterGoodsReceiptRequest`
- `GoodsReceiptResponse` and `GoodsReceiptItemResponse`
- `GoodsReceiptSpecification`
- `GoodsReceiptService` and `GoodsReceiptServiceImpl`

Focused verification command:

```text
.\node_modules\.bin\vitest.cmd run src/test/pages/goods-receipt/GoodsReceiptList.test.jsx src/test/pages/goods-receipt/GoodsReceiptDetail.test.jsx src/test/stores/goods-receipt.test.js src/test/api/goods-receipt.test.js
```

Result:

```text
Test Files  4 passed (4)
Tests       19 passed (19)
Duration    50.44s
```

The tests cover loading, error/retry, filtered empty, invalid URL
canonicalization, out-of-range paging, exact calendar-date forwarding,
partial/paid rendering, stale-response protection, direct detail lookup, and
the absence of list-row enrichment. Partial and paid are now also live evidence;
their mutation ledger and success screenshots are indexed in UXR-A15.
