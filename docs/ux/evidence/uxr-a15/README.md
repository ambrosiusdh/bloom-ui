# UXR-A15 evidence index — supplier payables and payment

Audit date: 2026-09-25; completion recapture: 2026-09-26  
Environment: local Bloom frontend (`http://localhost:5173`) and backend (`http://localhost:8080`)  
Browser: Codex in-app browser (Chromium-based; exact version unavailable)  
Viewports: wide desktop, `1024×768`, and `760×768`  
Mutation policy: final financial actions required explicit action-time confirmation; two pre-fix attempts created nothing, then two post-fix non-cash payments completed and were retained as disposable audit history

The initial full CASH and partial QRIS submissions entered the frontend's
ambiguous-outcome state and created no payment. Direct verification showed that
Tomcat rejected the encoded slash-containing receipt reference before Spring MVC.
After the endpoint was corrected to carry the exact receipt reference in the
`code` query parameter and the app was restarted, an explicitly confirmed partial
QRIS payment and full BANK_TRANSFER payment completed. The server-refreshed list
now contains unpaid, partially paid, and paid representative receipts.

The assessment and priorities are in
[`docs/ux/audits/uxr-a15-payables-payment.md`](../../audits/uxr-a15-payables-payment.md).

## Persistent screenshots

| Evidence | File | Material state captured |
| --- | --- | --- |
| A15-E00 | [`00-a13-receipt-list-before-payments.jpg`](00-a13-receipt-list-before-payments.jpg) | Three posted/unpaid disposable receipts available before payment attempts. |
| A15-E01 | [`01-a15-payables-unpaid-wide.jpg`](01-a15-payables-unpaid-wide.jpg) | Wide payable list with backend total/paid/outstanding values and payment statuses. |
| A15-E02 | [`02-a15-cash-open-session-form.jpg`](02-a15-cash-open-session-form.jpg) | Full CASH form with the then-verified open cash-session context. |
| A15-E03 | [`03-a15-cash-full-confirmation.jpg`](03-a15-cash-full-confirmation.jpg) | Frozen full-payment confirmation for `Rp 1,25`, including receipt, supplier, method, reference, note, and drawer effect. |
| A15-E04 | [`04-a15-qris-partial-confirmation.jpg`](04-a15-qris-partial-confirmation.jpg) | Frozen partial QRIS confirmation for `Rp 2.000.000`, showing the expected remaining balance and no drawer effect. |
| A15-E05 | [`05-a15-cash-uncertain-locked.jpg`](05-a15-cash-uncertain-locked.jpg) | CASH attempt classified as uncertain, fields locked, and same-key recovery exposed. |
| A15-E06 | [`06-a15-cash-recovery-session-closed.jpg`](06-a15-cash-recovery-session-closed.jpg) | Exact CASH recovery still unresolved after the current-session read reported no open session. |
| A15-E07 | [`07-a15-qris-uncertain-locked.jpg`](07-a15-qris-uncertain-locked.jpg) | QRIS attempt classified as uncertain and locked under its exact idempotency key. |
| A15-E08 | [`08-a15-backend-encoded-reference-400.jpg`](08-a15-backend-encoded-reference-400.jpg) | Direct GET to the encoded receipt payment URL returns container-level `HTTP Status 400 – Bad Request`. |
| A15-E09 | [`09-a15-payables-filtered-empty.jpg`](09-a15-payables-filtered-empty.jpg) | Filtered-empty payable result and clear-filter recovery. |
| A15-E10 | [`10-a15-payables-supplier-filter.jpg`](10-a15-payables-supplier-filter.jpg) | Supplier-name filtering with the matching unpaid receipts. |
| A15-E11 | [`11-a15-payables-1024x768-overflow.jpg`](11-a15-payables-1024x768-overflow.jpg) | Payables table at `1024×768`, with page-level horizontal overflow. |
| A15-E12 | [`12-a15-payables-760x768-overflow.jpg`](12-a15-payables-760x768-overflow.jpg) | Payables table at `760×768`; status, amount, and action content require page panning. |
| A15-E13 | [`13-a15-payment-detail-760x768.jpg`](13-a15-payment-detail-760x768.jpg) | Receipt detail/payment page at `760×768`, with the financial card and form wider than the viewport. |
| A15-E14 | [`14-a15-qris-partial-success.jpg`](14-a15-qris-partial-success.jpg) | Corrected-route QRIS payment success and server-refreshed partially paid receipt state. |
| A15-E15 | [`15-a15-bank-full-success.jpg`](15-a15-bank-full-success.jpg) | Corrected-route BANK_TRANSFER payment success and server-refreshed paid/zero-outstanding state. |
| A15-E16 | [`16-a15-payables-all-states-after-fix.jpg`](16-a15-payables-all-states-after-fix.jpg) | Payables list showing paid, partially paid, and unpaid receipt rows together after the fix. |
| A15-E17 | [`17-a15-goods-receipts-all-states-after-fix.jpg`](17-a15-goods-receipts-all-states-after-fix.jpg) | Goods-receipt history showing unpaid, partially paid, and paid states together. |

## Pre-fix attempt ledger

| Receipt | Intended test | Exact request facts | Observed result |
| --- | --- | --- | --- |
| `GR/IX-2026/0001` | Full CASH payment | `Rp 1,25`; reference `UXR-A15-CASH-FULL`; note `Audit UXR-A15 — pelunasan penuh tunai` | Frontend uncertain/recovery lock; receipt remained `UNPAID`, paid `Rp 0`, outstanding `Rp 1,25`; no payment row created. |
| `GR/IX-2026/0002` | Partial QRIS payment | `Rp 2.000.000`; reference `UXR-A15-QRIS-PARTIAL`; note `Audit UXR-A15 — pembayaran sebagian QRIS` | Frontend uncertain/recovery lock; receipt remained `UNPAID`, paid `Rp 0`, outstanding `Rp 8.888.888`; no payment row created. |

No pre-fix financial mutation completed. The failed/uncertain attempts were kept
only as recovery evidence and were not retargeted.

## Post-fix mutation ledger

| Receipt | Completed test | Exact request facts | Server-confirmed result |
| --- | --- | --- | --- |
| `GR/IX-2026/0002` | Partial QRIS payment | `Rp 2.000.000`; reference `UXR-A15-QRIS-PARTIAL-FIX`; note `Audit UXR-A15 setelah perbaikan endpoint` | Payment `#1`; `PARTIALLY_PAID`; paid `Rp 2.000.000`; outstanding `Rp 6.888.888`; no cash-session/drawer effect. |
| `GR/IX-2026/0001` | Full BANK_TRANSFER payment | `Rp 1,25`; reference `UXR-A15-BANK-FULL-FIX`; note `Audit UXR-A15 pelunasan setelah perbaikan endpoint` | Payment `#2`; `PAID`; paid `Rp 1,25`; outstanding `Rp 0`; no cash-session/drawer effect. |

Both actions were explicitly confirmed immediately before submission. They remain
as authorized disposable audit history; no payment was voided or reversed.

## Interaction and measurement notes

- The payable list is URL-backed and distinguishes unfiltered guidance from a
  filtered-empty result.
- Supplier-name filtering returned `GR/IX-2026/0001` and
  `GR/IX-2026/0003` without client-side debt calculation.
- The payment confirmation initially focused `Kembali`, so Enter could not
  accidentally post immediately after opening the dialog.
- CASH copy named the cash-session/drawer effect. BANK_TRANSFER and QRIS copy
  explicitly said they do not require a cash session and do not affect drawer cash.
- At `1024×768`, the payable page measured `clientWidth=1009` and
  `scrollWidth=1338`.
- At `760×768`, the payable page measured `clientWidth=745` and
  `scrollWidth=1097`.
- After detail content loaded at `760×768`, it measured `clientWidth=745` and
  `scrollWidth=867`.
- The temporary viewport override was reset after capture.

## Repository, backend, and automated evidence

Frontend inspection covered the payable list, receipt detail, payment component,
payment store/recovery logic, request utility, API wrapper, route construction, and
focused tests. Backend inspection covered `SupplierPaymentController`, request and
response DTOs, validation, `SupplierPaymentServiceImpl`, cash-session checks,
overpayment/idempotency rules, and exception handling.

The pre-fix frontend constructed
`/api/goods-receipts/${encodeURIComponent(code)}/payments`; the backend mapped the
same path-variable shape. Real generated receipt references contain slashes. A
direct GET to
`/api/goods-receipts/GR%2FIX-2026%2F0002/payments?page=0&size=10` returned an HTML
HTTP 400 response from Tomcat before controller handling. Consequently, the client
reported a network-like ambiguous outcome rather than a domain/API error.

The corrected controller and client use
`/api/goods-receipts/payments?code={receiptCode}`. Live payment creation and receipt
refresh succeeded with the exact slash-containing codes. The change did not alter
the request DTO, response DTO, idempotency key, financial rules, method/session
semantics, or recovery ownership.

Focused verification command:

```text
.\node_modules\.bin\vitest.cmd run src/test/pages/payable/SupplierPayableList.test.jsx src/test/pages/goods-receipt/SupplierPayment.test.jsx src/test/pages/goods-receipt/GoodsReceiptDetail.test.jsx src/test/stores/goods-receipt.test.js src/test/api/supplier-payment.test.js src/test/api/goods-receipt.test.js
```

Result on 2026-09-25:

```text
Test Files  6 passed (6)
Tests       48 passed (48)
Duration    84.57s
```

The passing mocked/API-unit coverage verifies server-value rendering, filtering,
method/session copy, amount validation, overpayment handling, confirmation focus,
pending locks, exact idempotent replay, account isolation, refresh behavior, and
responsive component branches. Post-fix verification additionally passed 35/35
focused frontend tests, targeted lint, production build, 3/3 backend controller
tests, and 79/79 backend web-module tests. A full frontend run passed 393 tests;
two unrelated stock-adjustment tests timed out only in that parallel run and passed
8/8 immediately in isolation.
