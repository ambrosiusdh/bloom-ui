# FE-28 — One-receipt payment transaction

2026-09-10. Scope: payment entry on receipt detail; no allocation, prepayment,
credit, reversal UI, or browser balance arithmetic.

## Verified gate

Inspected the backend SupplierPaymentController, CreateSupplierPaymentRequest,
VoidSupplierPaymentRequest, SupplierPaymentResponse, SupplierPaymentServiceImpl,
SupplierPaymentMapper, CashMoneyUtil, SupplierDebtCalculator, GoodsReceipt read
DTO/service, GlobalExceptionHandler, CashMovementServiceImpl, and payment
PostgreSQL integration test cases. Backend working tree was clean.

The main backend domain document still contains historical unresolved-payment
text. The confirmed frontend one-receipt/no-overpay policy matches implemented
service/DB enforcement; the newer `docs/operations/v18-supplier-payment-ledger-migration.md`
explicitly defines the Release 1 CASH correction boundary. This inspection uses
those implemented rules and that supplement; it does not claim the historical
domain document has been updated or backend tests were rerun here.

- POST `/api/goods-receipts/{code}/payments`: required `Idempotency-Key`;
  positive decimal `amount` (15 integer/4 fractional digits), `paymentMethod`,
  past/present Instant `paidAt`, optional 255-character `reference`/`note`.
- One POSTED receipt, partial/full permitted, overpay rejected under receipt lock.
  CASH uses the globally open locked session and cannot predate its opening;
  there is no client-supplied session ID. Only CASH posts a drawer movement.
- Same key and exact payload replay the existing payment, even after a void;
  changed payload conflicts. There is no payment-status lookup endpoint.
- Payment response contains payment/audit/session identity, not receipt balances.
  Refresh the existing receipt detail GET for paid/outstanding/payment status.
- Void retains the record; repeated void is read-only. CASH reversal requires
  the original session still open and adds a compensating movement exactly once.
  BANK_TRANSFER/QRIS have no drawer effect. No reversal UI is included.

## Short interaction plan

Use the existing detail page, money input, session store, and API wrapper.
Collect amount/method/reference/note; show a keyboard-trapped confirmation with
receipt/supplier/amount/method. Freeze the confirmation timestamp and persist the
exact request/key before POST. Lock duplicate submits and edits while pending or
ambiguous, including navigation/reload. Recover only with identical POST replay.
Definite first-request rejection preserves input and refreshes receipt/session;
ambiguous replay rejection never authorizes a new key. Success focuses the returned
payment and refreshes the receipt without local subtraction. Failed reads allow
read-only retry and keep new payment disabled. Non-cash never needs a session.

Expected size: five production files, about 250–350 logical production lines plus
focused tests/docs; review the transaction state and receipt interaction separately
if the final diff exceeds the roadmap cap. No merge/split exception is implied.
Tests cover methods, partial/full, confirmation/focus, validation, pending/duplicate,
overpay/session conflict, durable ambiguous recovery, voided replay, and read failure.

## Validation

- Full existing suite plus FE-28 tests: 282 passed. An additional return-to-detail
  race regression was then added; the focused payment/receipt/API run passes 25 tests.
- Production build and lint on all touched JavaScript/JSX pass. Existing build
  warnings concern old Browserslist data and large chunks; no dependency change.
- Browser fixture inspected at 1366×900, 768×1024, and 390×844: form/confirmation
  fit, Indonesian grouped amounts display correctly, and CASH with no session
  disables confirmation. Automated tests verify focus trap, Escape/return focus,
  result/error focus, exact replay, and read-only refresh retry.
- No live backend payment was posted and no backend code was modified. Temporary
  fixture/report files are removed after verification. FE-28 is ready for review;
  backend historical contract wording remains explicitly documented above.
