# Supplier reactivation and unpaid receipt cancellation

Implemented and verified on 2026-11-18 in the existing local Bloom QA environment.

## Agreed backend contract

The implementation consumes the backend Release 1 domain contract and
`docs/operations/supplier-reactivation-and-receipt-cancellation.md` in the Bloom backend checkout.
Controller, request/response DTO, validation, security configuration, supplier service, receipt
service, debt calculator, payment locking, and stock movement filters were inspected.

| Operation | Contract |
| --- | --- |
| Supplier reactivation | Authenticated `PATCH /api/suppliers/{code}/activation`, body `{"active":true}`, saved supplier in `data` |
| Cancellation eligibility | Server `canCancel` is true for POSTED with no payment records, including voided payments |
| Receipt cancellation | Authenticated `POST /api/goods-receipts/cancel?code={reference}`, body `{"reason":"..."}`, required trimmed reason |
| Cancellation success | Saved original receipt with CANCELLED, canCancel false, reason/actor/time, original lines and total, zero outstanding |
| Payment history rejection | HTTP 409 and `goods_receipt_has_payments` |
| Original-location shortage | HTTP 409 and `goods_receipt_insufficient_stock`, complete rollback |
| Missing record | HTTP 404 and `goods_receipt_not_found` or `supplier_not_found` |
| Replay | Resource-level idempotency returns the original cancellation audit without additional reversals |
| Reversal discovery | Existing stock movement GET with `sourceType=GOODS_RECEIPT_CANCELLATION` and `reference` |

The UI uses Axios query serialization for receipt codes containing `/`. Cancellation sends no
idempotency header. Deploy the agreed backend and Flyway V23 before the frontend. V23 expands the
payment-history guard to voided payment records and requires no backfill.

## Implemented behavior

Supplier detail reuses its lifecycle confirmation for activation and deactivation. Reactivation is
available to authenticated users under the existing backend access policy. It locks duplicate
submission, updates from the saved response, invalidates supplier list reads, preserves the code,
and displays Indonesian authorization, missing-record, conflict, and uncertain-status guidance.

Receipt and payable detail use the same cancellation action, gated by server eligibility. The
cancel-first dialog repeats the receipt reference, stock and payable effects, and requires a reason.
Pending submission locks the confirmation and reason. A confirmed 4xx rejection retains the reason
and provides a detail-refresh action. Network, timeout, 5xx, mismatched receipt/status, and incomplete
audit responses display an unknown outcome. The operator must refresh and inspect recorded status
before another cancellation attempt. Refresh performs a GET and never automatically repeats POST.

Saved cancellation renders the original receipt lines and totals together with reason, actor,
timestamp, and the server outstanding amount. Payment and cancellation actions disappear.
The reversal link filters the existing ledger by source and receipt reference. Its movement detail
links back to the encoded receipt route. The legacy item audit modal also recognizes cancellation.

The review slices are supplier maintenance and receipt correction. Existing uncommitted stock
transfer work was preserved. Optional initial-payment and custom-code product expansion was
excluded from these slices.

The later [receipt creation extension](receipt-initial-payment-custom-code.md) implements those
optional controls against the subsequent backend contract. Its isolated verification and live
rollout boundary are documented separately.

## Dedicated browser QA

All fixture creation, receipt posting, supplier lifecycle changes, stock transfer setup, and receipt
cancellation used normal UI entry points. The backend package was started against the existing local
`bloom-app-db` QA database and applied V23. Automatic backups were disabled for this temporary QA
process. Existing cash session 18 remained open.

| Fixture | Reference |
| --- | --- |
| Supplier | `QA1118-RC-SUP`, backend supplier ID 6 |
| Fractional item | `QA1118-RC-F`, METER with fractional quantities, initially STORE 0 / WAREHOUSE 0 |
| Eligible receipt | `GR/XI-2026/0002`, total Rp 3.580,1, zero payments |
| Shortage receipt | `GR/XI-2026/0003`, total/outstanding Rp 4.000, zero payments |
| Shortage setup transfer | `ST/XI-2026/0008`, STORE to WAREHOUSE, 1.5 meter |

Supplier QA created, deactivated, found in inactive search, and reactivated the dedicated supplier.
It disappeared from the inactive search and appeared in active search. Edit kept its code disabled
and its address intact. New receipt creation found and selected it by code.

For the eligible receipt, the supplier payable started at Rp 0. Posting produced Rp 3.580,1 total and
outstanding, and two inbound stock movements. Cancellation was opened through supplier payable
navigation. A blank reason was rejected with field focus. The focused tests checked cancel-first
focus. Supplier confirmation also supported Escape in the browser.
The submitted reason was `QA1118-RC penerimaan uji dibatalkan setelah verifikasi dua lokasi`.

| Eligible receipt effect | Before receipt | After posting | After cancellation |
| --- | --- | --- | --- |
| Item STORE balance | 0 m | 1.2345 m | 0 m |
| Item WAREHOUSE balance | 0 m | 2.3456 m | 0 m |
| Supplier outstanding | Rp 0 | Rp 3.580,1 | Rp 0 |
| Receipt total | — | Rp 3.580,1 | Rp 3.580,1 |
| Receipt status | — | POSTED | CANCELLED |
| Receipt payment count | — | 0 | 0 |

The two reversal movements showed STORE 1.2345 to 0 and WAREHOUSE 2.3456 to 0, with the original
receipt reference. Movement detail reopened that receipt. The cancellation audit showed admin and
18 November 2026 at 18.50 WIB. Reload retained cancellation and exposed zero payment/cancellation
actions. The original received quantities, prices, and total remained visible.

The separate shortage receipt posted 1.5 m to STORE and 2.5 m to WAREHOUSE. Transfer
`ST/XI-2026/0008` then moved 1.5 m from STORE to WAREHOUSE to create a shortage at the original
STORE location. Before cancellation, balances were STORE 0 / WAREHOUSE 4, supplier payable Rp 4.000,
and the item ledger contained eight movements. Cancellation was rejected in Indonesian and kept
`QA1118-RC uji penolakan stok lokasi asal` in the reason field. Fresh reads afterward still showed
STORE 0 / WAREHOUSE 4, eight movements, POSTED status, and Rp 4.000 payable.

The dedicated supplier and item remain active. The shortage receipt remains POSTED and unpaid with
the balances above. Every live submission returned a confirmed outcome.

The supplier detail and cancelled receipt were checked at 390 × 844. The confirmation and result
were checked at 768 × 768. Document width matched viewport content width in those checks.
Screenshot review found and corrected the receipt table's MUI display override so mobile renders
only the labelled item cards. Reversal-ledger balances now wrap within their column to keep actor
and time readable.

## Protected Round 6 records

Read-only verification after QA confirmed `GR/XI-2026/0001` remained POSTED and UNPAID for
`QA1117-G4-BUY`, with total/outstanding Rp 11.851,7156, paid Rp 0, and zero payment records.
No mutation targeted that receipt, supplier, or items `QA1117-G4-W/F`.

## Automated verification and limits

- The full single-worker frontend suite passed 534 tests across 74 files.
- The final focused run passed 58 tests across six files after adding stricter incomplete-audit
  response handling. It includes cancellation, supplier detail, API normalization/transport,
  existing receipt detail/payment integration, and movement navigation.
- After the screenshot-driven layout corrections, all 18 tests across the three affected
  receipt/cancellation/movement files passed again.
- Production build, touched-file ESLint, and Git whitespace checks passed.
- Existing Browserslist age and large-bundle build warnings remain.
- Pending duplicates, structured payment-history rejection, incomplete responses, and unknown
  outcomes were exercised with API mocks. A live timeout was not forced.
- Paid/voided-history and repeated-command stock safety were verified by the backend's reported
  97-test contract suite. Browser QA verified a single successful cancellation and its saved reload.

Screenshots are stored in the task's visualization directory under
`C:/Users/Ambrosius David H/.codex/visualizations/2026/11/17/01a1e9e8-5573-7673-8287-3079c734685f/`.
The files are `QA1118-RC-confirmation.jpg`, `QA1118-RC-cancelled.jpg`,
`QA1118-RC-reversals.jpg`, `QA1118-RC-rejection.jpg`,
`QA1118-RC-supplier-mobile.jpg`, and `QA1118-RC-cancelled-mobile.jpg`.
