# UXR-A14 evidence index — goods-receipt creation

Audit date: 2026-09-24 to 2026-09-25  
Environment: local Bloom frontend (`http://localhost:5173`) and backend (`http://localhost:8080`)  
Browser: Codex in-app browser (Chromium-based; exact version unavailable)  
Viewports: wide desktop, `1024×768`, and `760×768`  
Mutation policy: one explicitly identified disposable receipt was posted after action-time owner confirmation; no supplier, item, payment, or application code was changed

The audit created `GR/IX-2026/0003` for supplier `QA-FE26-20260909` with
three independently persisted lines. The same fractional item was intentionally
repeated with different price/location intent. The receipt remains as local test
evidence and as an unpaid fixture for later receipt/payment audits.

The assessment and priorities are in
[`docs/ux/audits/uxr-a14-goods-receipt-create.md`](../../audits/uxr-a14-goods-receipt-create.md).

## Persistent screenshots

| Evidence | File | Material state captured |
| --- | --- | --- |
| A14-E01 | [`00-create-initial.png`](00-create-initial.png) | Empty creation form, transaction framing, lookups, time/offset inputs, empty-line state, and history exit. |
| A14-E02 | [`01-create-required-validation.png`](01-create-required-validation.png) | Required validation and first-invalid focus. |
| A14-E03 | [`02-supplier-lookup.png`](02-supplier-lookup.png) | Active supplier lookup with stable code/name identity. |
| A14-E04 | [`03-whole-item-added.png`](03-whole-item-added.png) | Whole-only item line after selection. |
| A14-E05 | [`04-whole-quantity-validation.png`](04-whole-quantity-validation.png) | Fraction rejected for a whole-only item without submitting. |
| A14-E06 | [`05-item-lookup.png`](05-item-lookup.png) | Active item lookup and SKU/name/UOM context. |
| A14-E07 | [`06-three-lines-filled.png`](06-three-lines-filled.png) | Whole and fractional quantities, four-decimal prices, repeated SKU, and independent STORE/WAREHOUSE locations. |
| A14-E08 | [`07-draft-restored-after-navigation.png`](07-draft-restored-after-navigation.png) | Exact draft restored after leaving and returning to the route. |
| A14-E09 | [`08-confirmation-review.png`](08-confirmation-review.png) | Frozen wide confirmation with every line and backend-authority statement. |
| A14-E10 | [`09-confirmation-cancel-focus.png`](09-confirmation-cancel-focus.png) | Escape dismissal and focus returned to the review trigger. |
| A14-E11 | [`10-create-narrow-1024.png`](10-create-narrow-1024.png) | Form at `1024×768`; no page-level horizontal overflow. |
| A14-E12 | [`11-create-narrow-760.png`](11-create-narrow-760.png) | Stacked repeated-line editor at `760×768`; no horizontal overflow. |
| A14-E13 | [`12-confirmation-narrow-760.png`](12-confirmation-narrow-760.png) | Narrow confirmation with wrapped lines and visible actions. |
| A14-E14 | [`13-pending-narrow-760.png`](13-pending-narrow-760.png) | Genuine locked pending state and same-request duplicate protection. |
| A14-E15 | [`14-success-narrow-760.png`](14-success-narrow-760.png) | Focused success plus server-confirmed receipt/status/amounts and narrow line cards. |
| A14-E16 | [`15-success-wide.png`](15-success-wide.png) | Wide server-confirmed result and persisted line totals. |
| A14-E17 | [`16-created-receipt-list.png`](16-created-receipt-list.png) | Created receipt discoverable in history as posted and unpaid. |
| A14-E18 | [`17-created-receipt-detail.png`](17-created-receipt-detail.png) | Persisted receipt detail with both locations; existing supplier-payment recovery lock remains visible for the older receipt. |
| A14-E19 | [`18-next-receipt-reset.png`](18-next-receipt-reset.png) | Explicit next-receipt action returns to a clean draft. |

## Live fixture ledger

| Record | Mutation | Server-confirmed result |
| --- | --- | --- |
| `GR/IX-2026/0003` | Posted after explicit final-step confirmation | `POSTED` / `UNPAID`; total and outstanding `Rp 28.250,2188`; paid `Rp 0`. |
| `PRT-00001` | Existing item used, not edited | `2 kg` to STORE at `Rp 1.500`; line total `Rp 3.000`. |
| `QA-FE10-82138041` line 1 | Existing item used, not edited | `0,75 meter` to WAREHOUSE at `Rp 25.000,125`; line total `Rp 18.750,0938`. |
| `QA-FE10-82138041` line 2 | Same item repeated independently | `0,25 meter` to STORE at `Rp 26.000,5`; line total `Rp 6.500,125`. |

No receipt payment was posted. The created unpaid receipt is intentionally retained
because posted receipts are audit history and because it supplies a disposable fixture
for UXR-A13/UXR-A15. It should not be mistaken for production data.

## Interaction and measurement notes

- Body width at `1024×768`: `clientWidth=1009`, `scrollWidth=1009`.
- Body width at `760×768`: `clientWidth=760`, `scrollWidth=760`.
- Blank submission focused the supplier lookup. The whole-only decimal rejection
  focused the quantity field and retained the entered value.
- Selecting or adding a line moved focus to that line's quantity. Removing lines
  and lookup error/stale-result behavior are covered by focused tests.
- The review dialog initially focused `Kembali`; Escape closed it and restored
  focus to `Tinjau penerimaan`.
- The genuine pending state disabled editing, dismissal, and repeat submission.
- The success alert received focus and only backend-returned totals/statuses were
  presented as final.

## Repository, backend, and automated evidence

Inspected frontend sources included the create page, create store, receipt lookup,
line editor, request validation/normalization, result cards/tables, API wrapper, and
their focused tests. Backend inspection covered the receipt controller, create
request/line DTOs, response DTOs, validation, and service implementation. The backend
remains authoritative for supplier/item validity, item quantity policy, duplicate-key
semantics, receipt numbering, stock movement, totals, payment status, and debt.

Focused verification command:

```text
.\node_modules\.bin\vitest.cmd run src/test/pages/goods-receipt/GoodsReceiptCreate.test.jsx src/test/api/goods-receipt.test.js
```

Result on 2026-09-25:

```text
Test Files  2 passed (2)
Tests       28 passed (28)
Duration    78.27s
```

Coverage includes exact decimal strings, whole/fraction policy, required location and
offset, repeated lines, durable idempotency state, storage failure, known rejections,
field-error focus, frozen uncertain replay, key conflict, incomplete response handling,
duplicate-submit prevention, lookup loading/error/retry/empty/stale protection, add/remove
focus, server-truth success, and exact API request forwarding.

