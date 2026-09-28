# UXR-A07 evidence index — Stock transfer

Audit date: 2026-09-24  
Environment: local Bloom frontend (`http://localhost:5173`) and backend (`http://localhost:8080`)  
Browser: Codex in-app browser (Chromium-based; exact version unavailable)  
Viewports: default wide browser surface (`1610×1270`), `760×768`, and the `768×768` responsive boundary  
Mutation policy: two disposable items and two stock transfers were created through the implemented UI; after explicit owner confirmation, both disposable items were deactivated through Bloom's `Hapus` action while transfer and movement history was retained

## Evidence policy

The owner requested a persistent screenshot for every materially distinct audit step. Thirty-three PNGs are retained in this directory as working-tree evidence. The report also records routes, state, actions, focus, measurements, and backend/repository facts so conclusions do not depend on images alone.

The assessment and priorities are in [`docs/ux/audits/uxr-a07-stock-transfer.md`](../../audits/uxr-a07-stock-transfer.md).

## Persistent screenshot set

| File | Material state captured |
| --- | --- |
| [`00-whole-fixture-ready-wide.png`](00-whole-fixture-ready-wide.png) | Whole-unit disposable item ready for creation. |
| [`01-whole-fixture-created-wide.png`](01-whole-fixture-created-wide.png) | Backend-confirmed whole-unit fixture. |
| [`02-fractional-fixture-ready-wide.png`](02-fractional-fixture-ready-wide.png) | Fractional meter fixture ready for creation. |
| [`03-fixtures-created-wide.png`](03-fixtures-created-wide.png) | Both active fixtures in Data Barang. |
| [`04-transfer-empty-wide.png`](04-transfer-empty-wide.png) | Empty transfer form and default WAREHOUSE→STORE direction. |
| [`05-required-validation-wide.png`](05-required-validation-wide.png) | Required item and quantity validation. |
| [`06-item-picker-open-wide.png`](06-item-picker-open-wide.png) | Full unsearchable active-item picker. |
| [`07-whole-item-selected-wide.png`](07-whole-item-selected-wide.png) | Whole-unit policy and advisory stock after item selection. |
| [`08-direction-swapped-wide.png`](08-direction-swapped-wide.png) | Explicit swap to STORE→WAREHOUSE. |
| [`09-location-auto-opposite-wide.png`](09-location-auto-opposite-wide.png) | Destination change automatically restoring opposite locations. |
| [`10-whole-unit-validation-wide.png`](10-whole-unit-validation-wide.png) | Fraction rejected for a whole-unit item. |
| [`11-whole-transfer-ready-wide.png`](11-whole-transfer-ready-wide.png) | Valid whole-unit transfer ready for review. |
| [`12-whole-confirmation-wide.png`](12-whole-confirmation-wide.png) | Whole-unit confirmation and safe initial focus. |
| [`13-confirmation-escape-return-wide.png`](13-confirmation-escape-return-wide.png) | Form restored after Escape with focus on the review trigger. |
| [`14-whole-transfer-immediate-result-wide.png`](14-whole-transfer-immediate-result-wide.png) | Immediate result after the POST settled before pending capture. |
| [`15-whole-transfer-success-wide.png`](15-whole-transfer-success-wide.png) | Stable success for `ST/IX-2026/0001` and refreshed stock. |
| [`16-insufficient-confirmation-wide.png`](16-insufficient-confirmation-wide.png) | Frozen request exceeding visible source stock. |
| [`17-insufficient-rejection-wide.png`](17-insufficient-rejection-wide.png) | Focused backend rejection with refreshed source stock. |
| [`18-fractional-precision-validation-wide.png`](18-fractional-precision-validation-wide.png) | Five-decimal input rejected for the fractional item. |
| [`19-fractional-transfer-ready-wide.png`](19-fractional-transfer-ready-wide.png) | Valid fractional STORE→WAREHOUSE transfer. |
| [`20-fractional-confirmation-wide.png`](20-fractional-confirmation-wide.png) | Fractional confirmation. |
| [`21-fractional-transfer-immediate-result-wide.png`](21-fractional-transfer-immediate-result-wide.png) | Immediate second result after the POST settled. |
| [`22-fractional-transfer-success-wide.png`](22-fractional-transfer-success-wide.png) | Stable success for `ST/IX-2026/0002` and refreshed stock. |
| [`23-whole-movement-trace-wide.png`](23-whole-movement-trace-wide.png) | Paired transfer movements for the whole-unit item. |
| [`24-fractional-movement-trace-wide.png`](24-fractional-movement-trace-wide.png) | Paired transfer movements for the fractional item. |
| [`25-transfer-form-760x768.png`](25-transfer-form-760x768.png) | Stacked transfer form at `760×768`. |
| [`26-confirmation-760x768.png`](26-confirmation-760x768.png) | Fitting narrow confirmation dialog. |
| [`27-transfer-form-768x768.png`](27-transfer-form-768x768.png) | Transfer form at the `768×768` boundary. |
| [`28-cleanup-before-wide.png`](28-cleanup-before-wide.png) | Final backend-refreshed fixture balances before cleanup. |
| [`29-cleanup-confirmation-wide.png`](29-cleanup-confirmation-wide.png) | Bloom's permanent-deletion warning; the destructive action was not confirmed. |
| [`30-first-fixture-deactivated-wide.png`](30-first-fixture-deactivated-wide.png) | Whole-unit fixture removed from the active catalog; fractional fixture remained. |
| [`31-cleanup-complete-wide.png`](31-cleanup-complete-wide.png) | No active items matched `UXRA07` after both fixtures were deactivated. |
| [`32-history-retained-after-cleanup-wide.png`](32-history-retained-after-cleanup-wide.png) | Fractional transfer and opening movements remained readable after item deactivation. |

Both local POSTs completed before a genuine pending screenshot could be retained. Pending/duplicate blocking therefore remains automated-test and repository evidence; no artificial delay was introduced.

## Live evidence sequence

| ID | Route / state | Viewport | Recorded evidence |
| --- | --- | --- | --- |
| A07-E01 | `/items/new` fixture setup | 1610×1270 | Created `UXRA07-WHOLE` as non-fractional `pcs`, STORE `8`, WAREHOUSE `12`, and `UXRA07-FRAC` as fractional `meter`, STORE `5,5`, WAREHOUSE `3,25`. |
| A07-E02 | `/stock-transfers/new`, empty and required validation | 1610×1270 | Default direction was WAREHOUSE→STORE. Review without an item/quantity exposed both errors and focused the item combobox. |
| A07-E03 | Item picker open | 1610×1270 | All nine active items appeared in one SKU/name list without search, category context, or incremental results. |
| A07-E04 | Direction selection and swap | 1610×1270 | Swap exchanged source/destination. Changing either location automatically forced the other to the opposite location, making identical locations unavailable through normal UI interaction. |
| A07-E05 | Whole/fractional input policy | 1610×1270 | `1,5` was rejected for `UXRA07-WHOLE` and focused quantity. `0,12345` was rejected for `UXRA07-FRAC`; `0,75` was accepted. |
| A07-E06 | Whole transfer confirmation and success | 1610×1270 | Confirmation showed `2 pcs`, WAREHOUSE→STORE, safe initial focus on `Batal`, and server atomicity copy. Escape restored focus to `Tinjau transfer`. The server created `ST/IX-2026/0001`; refreshed stock became STORE `10`, WAREHOUSE `10`. |
| A07-E07 | Deterministic insufficient-stock rejection | 1610×1270 | WAREHOUSE→STORE `999 pcs` was submitted against visible `10 pcs`. The backend created no transfer, the form remained intact, stock refreshed, and the rejection alert received focus. |
| A07-E08 | Fractional transfer confirmation and success | 1610×1270 | STORE→WAREHOUSE `0,75 meter` created `ST/IX-2026/0002`; refreshed stock became STORE `4,75`, WAREHOUSE `4`. |
| A07-E09 | Movement trace | 1610×1270 | Each transfer created one source OUT and one destination IN row with the same reference, exact quantity/UOM, before/after balances, actor, and time. |
| A07-E10 | Keyboard sequence | 768×768 | From item selection, Tab order was source, swap, destination, quantity, description, review, and refresh. Validation, confirmation cancel, Escape return, and rejection focus were also exercised live. |
| A07-E11 | Responsive form and confirmation | 760×768 and 768×768 | No horizontal page overflow occurred. At 760 the locations and swap stacked, the confirmation fit within the viewport, and the primary action required vertical scrolling. At 768, `bodyClientWidth` and `bodyScrollWidth` were both `753`; body height was `819`. |
| A07-E12 | Cleanup and retained-history verification | 1610×1270 | After explicit owner confirmation, both fixtures were deactivated through Bloom's `Hapus` action. Active Data Barang returned no `UXRA07` items, while movement history still showed the paired `ST/IX-2026/0002` transfer rows and opening movements. |

## Created transfer ledger

| Reference | Description | Request | Server-confirmed/trace result |
| --- | --- | --- | --- |
| `ST/IX-2026/0001` | `Audit A07 transfer utuh gudang ke toko` | `UXRA07-WHOLE`, WAREHOUSE→STORE, `2 pcs` | STORE `8 → 10 pcs`; WAREHOUSE `12 → 10 pcs`; paired IN/OUT movements. |
| `ST/IX-2026/0002` | `Audit A07 transfer pecahan toko ke gudang` | `UXRA07-FRAC`, STORE→WAREHOUSE, `0,75 meter` | STORE `5,5 → 4,75 meter`; WAREHOUSE `3,25 → 4 meter`; paired OUT/IN movements. |

The attempted `999 pcs` transfer created no reference or movement.

## Repository and backend evidence

- `StockTransferCreate.jsx` loads one active-item page with `size: 2000`, renders the result in one select, keeps opposite locations in local form state, and stores the attempt signature/idempotency key only in a component ref.
- A successful POST clears quantity/description, renders the server code and direction, and refreshes item detail/list data. The UI has no transfer list/detail route and does not link the success code or movement reference.
- Network/unexpected failure copy says the result is uncertain and invites same-request retry. The same key survives only while the component remains mounted; editing a field or reloading can begin a new key without resolving the earlier attempt.
- The backend POST is atomic and idempotent for the same key/payload, locks item rows, validates UOM/fraction/availability, and books paired OUT/IN movements.
- The backend exposes transfer list and code-detail reads, but no request-key status lookup. Those reads are not surfaced in the current frontend.
- Backend responses include code, direction, description, actor/time, and persisted lines; they do not include source/destination before/after balances. Those balances are available through the movement ledger.

## Focused automated verification

Command:

```text
node node_modules/vitest/vitest.mjs run src/test/pages/stock-transfer/StockTransferCreate.test.jsx src/test/api/stock-transfer.test.js --reporter=verbose
```

Result on 2026-09-24:

```text
Test Files  2 passed (2)
Tests       8 passed (8)
Duration    55.76s
```

Coverage included loading/error/retry, opposite-location behavior, swap, responsive spacing, validation focus, whole/four-decimal policy, exact decimal payload, duplicate blocking, success/reference, affected-data refresh, conflict refresh, and same-key conflict retry. It does not cover ambiguous network outcome across navigation/reload.

## Cleanup state

- Both disposable items were deactivated through the implemented UI after explicit owner confirmation; they no longer appear in the active Data Barang search.
- `ST/IX-2026/0001`, `ST/IX-2026/0002`, their opening movements, and their linked transfer movements are retained as local audit records.
- Bloom labels `Hapus` as irreversible; no UI restore was attempted or identified.
- No application, backend, dependency, configuration, or database file was changed.

## Evidence limitations

- Concurrent mutation conflict, network ambiguity, failed refresh, and malformed backend response were not forced against the running services.
- The live catalog contained nine active items, so large-catalog impact is a repository-backed scale inference rather than a measured thousand-item timing result.
- Pending settled too quickly for a genuine image.
- The frontend has no transfer list/detail UI, so backend transfer detail was verified from source rather than through the app.
- Exact browser version, Windows display scaling, physical store keyboard, and deployed store laptop were unavailable.
