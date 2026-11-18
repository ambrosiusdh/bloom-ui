# Receipt creation extension

Status: **IMPLEMENTED in source**, 2026-11-19. Live integration against the updated backend is pending authorized rollout. No commit, push, application service restart, or current database mutation was performed for this extension.

## Contract evidence

Inspected the Bloom backend controller, create/initial-payment request and response DTOs, validation, goods-receipt service, supplier-payment service, and security configuration. The agreed supplement is `E:/Project/Bloom App/bloom-app/docs/operations/round4-receipt-creation-contract.md`.

- `POST /api/goods-receipts` accepts optional `code` and `initialPayment` in one transaction with stock and payable effects. A rejected payment rolls everything back. The frontend issues no separate initial-payment POST.
- Omitted code generates an automatic reference. Supplied code is limited to 100 UTF-16 code units before stripping Java outer whitespace. Case remains significant; embedded whitespace/control characters are rejected. Cancelled receipts retain their code reservation.
- Omitted payment creates an unpaid receipt. CASH, BANK_TRANSFER, and QRIS amounts use exact decimal strings with at most four fractional digits. Server total, paid, outstanding, and payment status remain authoritative. The displayed input estimates are advisory.
- CASH requires an open session and payment time at or after opening. Review reads that session; submission rechecks that the reviewed session remains open. The backend has no expected-session request field for receipt creation and remains authoritative under concurrent session changes. Noncash has no drawer effect.
- Create/submission results expand `initialPayment` with persisted ID, stable `paymentReference`, method, amount, actor, time, external reference, and cash-session ID where applicable. Detail reads the existing payment-history endpoint, which also exposes `paymentReference`.
- `GET /api/goods-receipts/submission` uses the original `Idempotency-Key` and never mutates. Missing-result 404 is unresolved, including a request still in transit. The frontend keeps the exact body/key/paidAt and permits further status reads or manual reconciliation, never POST replay or separate payment.
- Receipt history and payable discovery accept `exactCode`. API query values use the existing query builder; frontend route segments use `encodeURIComponent` once. The saved canonical code drives every result link.

## Implemented interaction

The existing receipt form retains automatic generation and **Tanpa pembayaran** as defaults. Optional payment inputs reuse the shared money control and supplier-payment method vocabulary. The cancel-first review shows the receipt reference or automatic-generation label, exact lines, payment amount/method/time, advisory resulting unpaid balance, and cash-session/drawer requirements. It explains atomic rollback on payment rejection.

Pending disables repeat submission and editing. Definite validation, duplicate-code, overpayment, cash-session, authorization, and authentication rejections retain the draft with actionable Indonesian feedback. Unknown or incomplete responses retain immutable recovery state across navigation/reload. Status lookup preserves the original key and payment timestamp, including after a missing-result response. Confirmed results render server financial facts and saved payment identity; later cancelled/voided audit facts remain recognizable.

New drafts, attempts, and results are bound to authenticated `accountId`. Other-account or ownerless unresolved legacy attempts are quarantined without display, mutation, reset, or recovery requests. An unsent/completed draft can be explicitly replaced for the current account; an unresolved attempt cannot. A late response remains owned by its submitting account.

## Verification

- Full single-worker suite passed **560 tests across 75 files** before the final three additional extension regression cases.
- Final extension run passed **21 tests**, additionally covering server overpayment rejection with retained input, current cancelled/voided lookup facts, and late response/account isolation.
- API tests verify the required header, timeout/auth handling, read-only submission lookup, and structured code errors. History/payable tests verify exact-code filters and encoded links. Payment-history tests verify stable payment references.
- Production build, targeted ESLint, and diff whitespace checks are recorded in ignored `output/receipt-creation-final-*.log` artifacts.

### Isolated browser records

Browser verification used the actual frontend in a dedicated Vite instance on port 5174 and an in-memory contract fixture on port 8091. These records are **fixtures, not records in the running Bloom database**. Existing application services and database were left intact. Fixture requests are recorded in ignored `output/receipt-creation-browser-events.json`.

Supplier **UIQA-R4-SUP**, item **UIQA-R4-F** (fractional METER), quantity 1.25 at price 10 in STORE:

| Reference | Result |
| --- | --- |
| `UIQA/R4/+%?#` | Raw outer spaces retained in request; canonical saved code reopened through exact history, payable detail, receipt detail, payment history, and movement-origin links. BANK_TRANSFER 4.1234, total 12.5, paid 4.1234, outstanding 8.3766, PARTIALLY_PAID. Stable payment `SUPPLIER-PAYMENT-981`. No cancellation action on this paid receipt. |
| `UIQA/R4/UNKNOWN` | QRIS 4.1234 committed before simulated response loss. Reload retained the locked attempt. First GET returned missing, second GET returned the saved receipt/payment `SUPPLIER-PAYMENT-982`. Event log proves exactly one POST and two GETs with the same key, with the original paidAt retained. |
| Duplicate `UIQA/R4/+%?#` | Confirmed 409 showed the Indonesian duplicate-code constraint and retained code, amount, and lines. |
| `UIQA/AUTO/0001` | Blank code and Tanpa pembayaran omitted both optional fields. Result UNPAID, total/outstanding 12.5, paid 0. |
| CASH review, session 903 | Review displayed the session and drawer outflow. Switching back to Tanpa pembayaran remained available. CASH posting and rollover protection are covered by automated tests. |

Keyboard activation and cancel-first focus were exercised. The payment review at 390 CSS pixels fit the viewport with document width equal to viewport width. Screenshots are saved in the Codex visualizations directory as `UIQA-R4-payment-review.jpg`, `UIQA-R4-payment-review-mobile.jpg`, `UIQA-R4-payment-result.jpg`, `UIQA-R4-unknown-status.jpg`, and `UIQA-R4-unpaid-auto-result.jpg`.

### Remaining rollout verification

The user required preservation of running services and the current database. Therefore this extension does not claim live integration with the newly agreed backend contract. After an authorized backend/frontend rollout, repeat dedicated-record checks against that backend for atomic rollback, drawer effects, exact-code navigation, and lost-response lookup. Do not use or modify the protected Round 6 receipt **GR/XI-2026/0001**.

Supplier reactivation and unpaid cancellation were verified earlier with dedicated real records, including both location balances, movements, supplier payable, and shortage rejection. Their references and results remain in [the cancellation QA record](supplier-reactivation-receipt-cancellation.md). This creation extension did not repeat those mutations or alter the protected receipt.
