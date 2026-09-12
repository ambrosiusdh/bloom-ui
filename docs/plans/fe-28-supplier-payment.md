# FE-28 — One-receipt payment transaction

Status: `BLOCKED` for production approval on immutable recovery account identity. Transaction implementation, review corrections, and merge are present.

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
receipt/supplier/amount/method/reference/note. Freeze the entire confirmation request and persist the
exact request/key before POST. Lock duplicate submits and edits while pending or
ambiguous, including navigation/reload. Recover only with identical POST replay.
Definite first-request rejection preserves input and refreshes receipt/session;
ambiguous replay rejection never authorizes a new key. Success focuses the returned
payment and refreshes the receipt without local subtraction. Failed reads allow
read-only retry and keep new payment disabled. The confirmed result remains locked
across receipt navigation until refreshed and explicitly acknowledged using
“Catat pembayaran berikutnya” or “Selesai” for a fully paid/cancelled receipt.
Non-cash never needs a session.

Each POST, receipt refresh, and payment-triggered current-session read uses a
15-second Axios timeout. The API normalizer converts transport failure to an
ApiError without a response status, so timeout follows the existing uncertain
branch and preserves the exact key/request; it is not treated as rollback.

Recovery ownership currently uses the backend `/api/auth/current` username (the
current response exposes no user ID). The same verified username may resume after login.
Another account cannot render/edit/replay/acknowledge the retained workflow;
late responses retain the original owner and cannot update another account's receipt view.
An unsubmitted draft may be reset on account change. Unresolved attempts are never
deleted for logout or a different login. Legacy ownerless attempts/results remain
quarantined for manual backend verification rather than guessed ownership. This
is a UI recovery boundary, not a replacement for backend authorization or browser
profile isolation. Separate tabs can still intentionally submit separate keys;
tab-scoped storage does not deduplicate independent partial payments.

The username comparison does not protect against deletion and later recreation of
the same username. Production approval requires a stable, non-recycled account
identifier in `/api/auth/current`, then an FE-28-only migration that binds new
recovery to it and leaves username-only/ownerless recovery quarantined.

## Review disposition

- Valid and corrected: result loss through navigation (review items 1/3/4/12),
  account-bound recovery (2), uninitialized recovery message/link (5/13), frozen
  intent (6), clock-rejection guidance (7), normalized optional-text validation
  (10), documentation contradictions (11), and unbounded request waits.
- The result-loss bug is a workflow/recovery defect; a P0 financial-corruption
  claim was not established because the backend record remains committed.
- CASH loading already synchronously clears `drawerActionsEnabled` in the shared
  store. The payment UI/store now also require `currentStatus: ready`, with a
  regression test for a stale enabled session during recheck (8).
- Clearing an unknown attempt on account change was rejected: it would lose the
  safe replay key. Ownership guards hide/block it and preserve recovery instead.
- Moving shared money helpers (9) and centralizing all receipt reads are deferred
  maintenance proposals. The existing pure helpers and targeted return-to-detail
  refresh remain; neither warrants expanding this payment correction into a
  cross-domain refactor.

Expected size: six production files, about 250–350 logical production lines plus
focused tests/docs; review the transaction state and receipt interaction separately
if the final diff exceeds the roadmap cap. No merge/split exception is implied.
Tests cover methods, partial/full, confirmation/focus, validation, pending/duplicate,
overpay/session conflict, durable ambiguous recovery, voided replay, and read failure.

## Validation

- After review corrections, the full suite passes 296 tests; the focused
  payment/receipt/current-session API run passes 44 tests. Added regressions cover
  navigation during successful POST, refresh failure, explicit full-payment
  completion, frozen confirmation, account changes/late responses, ownerless
  recovery, stale session verification, timeout replay, clock errors, and startup.
- Production build and lint on all touched JavaScript/JSX pass. Existing build
  warnings concern old Browserslist data and large chunks; no dependency change.
- Browser fixture inspected at 1366×900, 768×1024, and 390×844: form/confirmation
  fit, Indonesian grouped amounts display correctly, and CASH with no session
  disables confirmation. Automated tests verify focus trap, Escape/return focus,
  result/error focus, exact replay, and read-only refresh retry.
- Review follow-up browser checks at 1366×900 and 390×844 verify wrapped long
  confirmation notes, full-payment completion, and hidden/blocked retained
  payment details when switching from the original account to another account.
- No live backend payment was posted and no backend code was modified. Temporary
  fixture/report files are removed after verification. Transaction review is
  complete; production approval remains blocked on immutable recovery identity,
  and backend historical contract wording remains explicitly documented above.
