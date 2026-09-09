# FE-26 interaction/request plan

2026-09-09 — creation gate verified against the current backend source. FE-25's
calendar-filter timezone approval remains blocked; this form captures a date/time
and an explicitly selected UTC offset, never an assumed store timezone.

- Select an active supplier by immutable `code`; search items by `skuOrName` and
  retain SKU, UOM and fractional policy. Add/remove stable-keyed line cards which
  stack on narrow screens. The backend allows repeated SKU/location lines,
  retains their purchase prices, and aggregates stock movements by item/location;
  the UI preserves separate lines and makes repetitions visible in review.
- Enter positive decimal quantity and purchase price (at most four decimals,
  NUMERIC(19,4)), explicit STORE/WAREHOUSE per line, received time/offset, and
  optional description. Review every line before irreversible posting. No total
  preview is needed. No supplier creation or payment form is included.
- One confirmed `POST /api/goods-receipts`, with `Idempotency-Key`, contains only
  `supplierCode`, `receivedDate` (Instant), `description`, and `items` with
  `itemSku`, decimal-string `quantity`/`purchasePrice`, and `stockLocation`.
  `initialPayment` is optional and omitted. No client total or stock request.
- The controller validates nested lines; `InventoryQuantityValidator` checks
  positive quantity, input scale and fractional policy; `CashMoneyUtil` checks
  positive price/NUMERIC(19,4). `GoodsReceiptServiceImpl.createGoodsReceipt` is
  transactional: locks the key/supplier/items, validates, calculates rounded line
  and document totals, saves, posts movements, and maps the full debt result.
  Optional initial payment joins this transaction (CASH requires an open session;
  overpayment rejects); creation without it requires no session.
- Freeze and retain the request/key before sending. Pending blocks repeated
  calls and editing. Network/5xx/malformed-success uncertainty permits explicit
  same-key replay only. Idempotency conflict stays frozen; known rejection
  preserves the draft for correction and a new review. Preserve recovery across
  route changes/reload in this tab. Success focuses the server reference and
  renders returned total/paid/outstanding/receipt/payment statuses and lines.
- Quantity checkpoint: FE-18 and FE-26 match on raw editing strings, comma/dot,
  UOM labelling and exact ±1 stepping. Extract only those mechanics into
  `BloomQuantityField`; cashier keeps commit/Escape/availability and receipt keeps
  positivity/price/location/request/errors. FE-13's target CORRECTION allows zero
  and owns direction/target semantics, so no adjustment migration is included.
- Keyboard: labelled inputs/errors, focus first invalid input, focus new/adjacent
  line after add/remove, trapped confirmation with cancel first and focus return,
  announced pending/errors/result. Tests cover request boundaries, precision,
  duplicates, uncertain replay, conflicts, preserved drafts, focus, lookup races,
  and responsive line layout; then suite/build/touched lint and browser QA.

Expected files: receipt page, receipt-local lookup/line editor/validation, creation
state, receipt API/error mapping/list entry, shared quantity field and cashier
adapter, focused tests, contract/roadmap. This transaction plus reuse checkpoint
is larger than the roadmap's normal review cap. Review in two logical slices:
quantity/line mechanics and tests first, then atomic posting/recovery and tests;
the working result must keep creation completely wired and safe. No commit/push.

## Verification completed

- Backend checkout inspected at `4396c71` with a clean backend working tree.
- `node node_modules/vitest/vitest.mjs run --maxWorkers=4`: 50 files, 256 tests
  passed. The longer multi-selection interaction has a local 10-second timeout;
  the initial heavily parallel run exceeded the default 5-second limit on that
  test. No global timeout or production behavior was relaxed.
- Targeted ESLint and `git diff --check` passed. Production Vite build passed;
  existing large-chunk and stale Browserslist-data warnings remain.
- Live localhost test used existing QA item `QA-FE10-82138041` and created labelled
  supplier fixture `QA-FE26-20260909` because the local database had no active
  suppliers. One receipt, `GR/IX-2026/0001`, was posted: `0.5` METER to WAREHOUSE,
  purchase price `2.5`, received `2026-09-09T08:00:00Z` (15:00 WIB). Server result:
  total `1.25`, paid `0`, outstanding `1.25`, `POSTED` / `UNPAID`. The fixtures are
  retained for inspection. No supplier-payment request was made.
- Live browser verification covered stable lookup identities, draft recovery on
  same-tab navigation/reload, five-decimal rejection and invalid-field focus,
  exact `0.5 → 1.5 → 0.5` stepping, explicit destination/timezone, confirmation
  focus trapping, disabled posting actions while pending, focused success, and
  matching fresh history/detail reads. Completed-result reload did not recreate
  a receipt. Native date/time keyboard entry was used because the browser tool's
  bulk fill did not populate the segmented native input.
- Layout inspected at 1366×900 and 390×844. Line controls stack at narrow width;
  the 311px line card reported no internal horizontal overflow. Uncertain replay,
  idempotency conflicts, known rejections, storage failure and duplicate calls
  are exercised by automated tests rather than by disrupting the live backend.
