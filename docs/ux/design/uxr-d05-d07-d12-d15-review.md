# Previously designed back-office domains — formal design review record

Status: `APPROVED` for UXR-D05, UXR-D07, UXR-D12, UXR-D13, UXR-D14, and UXR-D15  
Evidence: the matching UXR-A05, UXR-A07, and UXR-A12 through UXR-A17 audit reports

This record formalizes directions already created and reviewed informally. It does not mark them
owner-approved or authorize implementation.

## UXR-D05 — Stock movements

Review artifact: `bloom-design-review-suite.html`, design item **D05 Riwayat stok**

- Ledger rows retain exact quantity, UOM, location, direction, before/after balance, reference,
  actor, and time returned by the backend.
- Filters remain URL-backed and narrow desktop uses grouped labelled rows instead of page-level
  horizontal overflow.
- Empty, loading, error, reference, and unavailable-movement-type limitations remain explicit.

### Owner-feedback refinement — 2026-09-27

The owner correctly identified four regressions in the first review frame. The revised direction now
retains the existing `Arah pergerakan` filter (`Semua arah`, `Masuk`, `Keluar`), restores an explicit
`Reset filter` action, and uses visible wide-table column headers so every row value has an immediate
label. Reset returns focus to the item/SKU field and announces the updated result count.

Movement inspection is now an in-context modal rather than a separate page. Each row ends with a
44-pixel eye-icon action with an accessible movement-specific label; the item name remains plain
identity text so it is not confused with navigation to item master. The modal preserves direction,
source, location, exact quantity/UOM, before/after balance, reference, actor, and time, and may route
to an already-supported source detail without inventing a movement-detail endpoint. Narrow desktop
uses labelled stacked rows while retaining the same facts and avoids page-level horizontal overflow.

The final list-column order requested by the owner is `Barang` (item name, item code, and UOM),
`Pergerakan` (direction and signed quantity, with source underneath), `Lokasi`, `Saldo`, and
`Dibuat oleh & pada`, followed by the accessible detail action. Location and actor/timestamp remain
visible scan-level facts. The source reference and separately labelled movement facts stay available
in the detail modal rather than competing in the scan-oriented list.

### Owner decision — 2026-09-27

The owner approved UXR-D05 after the missing primary row values were made explicit and visually
verified. The binding direction is recorded in `uxr-d05-stock-movements-decision.md`. Approval applies
only to UXR-D05 and does not change the review status of the other domains in this combined record.

## UXR-D07 — Stock transfer

Review artifact: `bloom-design-review-suite.html`, design item **D07 Transfer stok**

- Direction, source/destination, searchable item selection, whole/fractional quantity, confirmation,
  insufficient-stock conflict, success detail, and movement trace are preserved.
- The resolved exact-request/idempotency recovery behavior is represented without inventing a
  status endpoint or stock calculation.
- Narrow layouts stack the form and summary while retaining source/destination meaning.

### Combined navigation direction — 2026-09-27

The owner chose one `Pergerakan stok` sidebar destination for UXR-D05 and UXR-D07. The destination
opens stock history by default and presents `Buat transfer stok` as the primary action. Transfer is
still a distinct stateful workflow and route because it creates one server-authorized transfer that
produces paired location movements; it is not a generic create-movement action. Stock adjustment
remains separate because its intent and confirmation semantics differ.

## UXR-D12 — Suppliers

Review artifact: `bloom-design-review-suite.html`, design item **D12 Pemasok**

- List/detail, active/inactive discovery, create/edit, immutable code, normalized duplicate conflict,
  deactivation, outstanding balance, actor, and timestamps remain visible.
- The 768 px action-overflow finding is resolved with the shared grouped-row narrow pattern.

### Review refinement — 2026-09-27

The focused supplier review now uses the approved shell and reusable back-office table/detail pattern.
The wide list exposes labelled columns for supplier identity, contact, lifecycle status, server-owned
outstanding balance, updater/time, and the accessible detail action. Search scope and lifecycle filter
remain explicit, reset is available when filters change, and pagination shows page size, visible range,
current page, and previous/next controls.

The create form explains normalization before the permanent code is committed. Duplicate conflict
retains every input, marks the code field, and explains that inactive suppliers also reserve their
identity. Edit keeps the code disabled and outside keyboard order while allowing name, phone, and
address changes. Detail retains server-returned balance and audit fields without browser aggregation.
Deactivation uses a cancel-first confirmation, supports Escape with focus restoration, removes only
new-transaction eligibility, and keeps identity and history visible.

At narrow desktop the list becomes labelled grouped rows before the shell/table combination can
overflow. The sole row action remains visible without page-level horizontal panning.

### Owner decision — 2026-09-28

The owner approved the focused supplier direction. The binding decision is recorded in
`uxr-d12-suppliers-decision.md`. UXR-D12 is now `APPROVED` for design direction; application
implementation remains separately gated.

## UXR-D13 — Goods receipts

Review artifact: `bloom-design-review-suite.html`, design item **D13 Penerimaan**

- History/detail and creation stay separate tasks.
- Supplier, receipt reference, STORE/WAREHOUSE lines, exact UOM quantities, payment state, totals,
  confirmation, server result, and retained history remain backend-authoritative.
- Searchable item selection and line editing preserve keyboard and narrow-desktop behavior.

### Focused review refinement — 2026-09-28

The focused direction now carries the complete UXR-A13 and UXR-A14 evidence into one reviewable
domain without merging the read and posting tasks:

- The history view has labelled columns, URL-backed reference, supplier, and received-date filters,
  reset, paging, and representative `BELUM DIBAYAR`, `DIBAYAR SEBAGIAN`, and `LUNAS` rows. Total,
  paid, and outstanding values remain server-returned facts.
- The detail hierarchy presents receipt identity and financial state first, then the received item
  lines. Supplier payment is a secondary action placed after those lines; it does not replace or
  obscure the receipt record.
- The creation view keeps supplier lookup, supplier reference, Indonesian `DD-MM-YYYY` guidance,
  24-hour time, explicit WIB/WITA/WIT selection, note, and a compact line editor. Every line retains
  its stable item identity, location, exact UOM quantity, and unit price, including repeated lines for
  the same SKU.
- The displayed input estimate is explicitly advisory. The confirmation repeats localized receipt
  and line facts but does not collect an initial supplier payment or claim an authoritative total.
- Pending submission locks mutation. Uncertain outcomes recover with the persisted exact request and
  idempotency key, and the success state renders the backend-confirmed reference, status, totals,
  outstanding amount, and item lines.
- Narrow layouts use labelled grouped history rows and a two-column compact line editor before
  stacking further at smaller widths; essential facts and actions do not depend on horizontal page
  scrolling or hover.
- Loading, empty, validation, duplicate/conflict, generic error, pending, recovery, success, keyboard,
  focus-restoration, and responsive states remain implementation requirements even when a single
  review frame represents the state family.

At the focused-review checkpoint, UXR-D13 remained `DESIGN_REVIEW` pending an explicit owner
decision. No application implementation was authorized by the refinement.

### Owner decision — 2026-09-28

The owner approved the focused goods-receipt direction. The binding decision is recorded in
`uxr-d13-goods-receipts-decision.md`. UXR-D13 is now `APPROVED` for design direction; application
implementation remains separately gated.

## UXR-D14 — Payables and supplier payments

Review artifact: `bloom-design-review-suite.html`, design item **D14 Utang & pembayaran**

- Debt discovery and one-receipt payment remain separate from receipt creation.
- Outstanding balance, payment status, allowed methods, exact amount, validation, pending, success,
  and conflict use backend-returned values.
- Slash-containing receipt references use the corrected query-parameter transport; the design does
  not reintroduce an encoded path-variable assumption.

### Focused review refinement — 2026-09-28

The focused direction now carries the complete UXR-A15 evidence and current payment contract into a
reviewable one-receipt flow:

- The list keeps only the supported URL-backed receipt-reference or supplier-name search, reset, page
  size, visible range, current page, and previous/next actions. Rows show supplier, exact receipt
  identity, payment status, total, paid, outstanding, received time, and a compact detail action.
- Unpaid, partially paid, and paid fixtures remain visible together without the earlier verbose
  authority banner. The values and statuses are rendered directly from the goods-receipt response.
- Detail has a real page heading and sequential sections. Receipt identity and financial facts are
  followed by received item lines and payment history before the secondary `Catat pembayaran`
  action, so audit reading no longer passes through the mutation form.
- The payment form stays bound to one receipt and preserves amount, full-outstanding assistance,
  `BANK_TRANSFER`, `QRIS`, and `CASH`, optional reference and note, and confirmation-time `paidAt`.
  BANK_TRANSFER and QRIS explicitly have no drawer effect; CASH verifies an open session and explains
  its drawer effect without allowing the browser to decide eligibility.
- Confirmation repeats receipt, supplier, amount, method, last-known outstanding, reference, note,
  payment time, and method-specific drawer meaning. Initial focus is on `Kembali`; Escape restores
  focus to the review action.
- Pending locks the exact request. Genuine ambiguity retains exact receipt code, payload,
  idempotency key, and immutable account owner for same-request recovery. A later cash session must
  never retarget a frozen CASH attempt.
- Definitive rejection is distinct from ambiguity: it states that no payment was stored, keeps the
  draft available, refreshes the latest receipt facts, and requires a new review. Success shows the
  returned payment record and separately refreshed backend paid, outstanding, and status values.
- The endpoint remains `POST /api/goods-receipts/payments?code={receiptCode}`. No encoded
  slash-containing path variable, multi-receipt allocation, prepayment, automatic allocation,
  payment reversal UI, or browser-calculated debt is introduced.
- Narrow layouts use labelled grouped rows and a stacked payment form. Supplier, receipt, status,
  total, paid, outstanding, actions, and method meaning remain visible without whole-page panning.

At the focused-review checkpoint, UXR-D14 remained `DESIGN_REVIEW`. The owner subsequently approved
the direction on 2026-09-28. Existing backend receipt detail, payment history, one-receipt payment,
and outstanding-balance APIs are sufficient; optional stable `supplierCode` list filtering is assumed
to be in progress and is not a blocker for the approved receipt-level flow.

### Owner decision — 2026-09-28

The owner approved the focused payables and supplier-payment direction. The binding decision is
recorded in `uxr-d14-payables-payment-decision.md`. UXR-D14 is now `APPROVED` for design direction;
application implementation remains separately gated.

## UXR-D15 — Expenses and voids

Review artifact: `bloom-design-review-suite.html`, design item **D15 Pengeluaran**

- History/create and void remain separate, auditable actions.
- Open-session eligibility, amount, category, note, actor, timestamps, immutable original record,
  reversal reason, confirmation, and server result are preserved.
- Closed-session ineligibility and failure recovery remain explicit.

### Focused review refinement — 2026-09-28

The focused direction now carries the complete UXR-A16 and UXR-A17 evidence and current backend
contract into separate, auditable create and void flows:

- History uses a labelled paged table rather than prose-heavy cards. Each row keeps the expense ID,
  localized category, operational classification, note, active/void state, backend void eligibility,
  exact amount, original cash session, creator, and timestamp. The backend list currently supports
  paging only, so no unsupported category, session, status, date, or text filters are invented.
- Creation remains bound to one verified open cash session. The form preserves Indonesian exact
  decimal entry up to four fractional digits, all six backend categories, conditional required note
  for `Lainnya`, a visible 255-character limit, session recheck, and the explicit drawer meaning.
- Create confirmation freezes amount, category, note, and session ID; starts focus on `Kembali`; and
  supports Escape with trigger restoration. The server may accept only the same still-open session—
  the UI never substitutes a later session or computes a drawer balance.
- Create pending locks mutation. Ambiguous outcomes preserve the exact request, idempotency key,
  session ID, and immutable account owner for same-request recovery. Definitive rejection retains the
  form while clearly stating that no expense was confirmed. Success renders the full server record.
- Detail groups the primary amount/status, the immutable original facts, session context, and the
  backend-returned void eligibility. The reversal action is absent when the session is closed or the
  expense is already voided; the block reason remains explicit text.
- Void confirmation repeats the original amount, category, session, actor/time, and required reason.
  It places `Kembali` first, restores the trigger on Escape, and explains that the original record is
  retained while the server creates a compensating movement.
- Void pending and ambiguity lock the exact expense and first reason for the original account. The
  confirmed result separates `Pengeluaran asli`, `Pembatalan tersimpan`, and `Dampak sesi menurut
  server` so an auxiliary refresh warning cannot visually compete with a confirmed financial result.
- Wide and narrow layouts use the approved shell, 44-pixel actions, visible focus, labelled stacked
  rows, wrapped actions, and internal modal scrolling without whole-page horizontal overflow.

At the focused-review checkpoint, UXR-D15 remained `DESIGN_REVIEW`. The owner subsequently approved
the direction on 2026-09-28. The refinement does not authorize application implementation, new
filters, delete/edit behavior, post-close correction, frontend cash calculation, or a shared
transaction rewrite.

### Owner decision — 2026-09-28

The owner approved the focused expense history, creation, detail, void, recovery, result, and
responsive direction. The binding decision is recorded in `uxr-d15-expenses-voids-decision.md`.
UXR-D15 is now `APPROVED` for design direction; application implementation remains separately gated.

## Owner decision requested

Approve, revise, or name the accepted traits for each item independently. Approval of one row must
not be interpreted as approval of the others.
### Owner-layout refinement — 2026-09-27

The UXR-D07 transfer form now preserves the proven current workflow order: searchable item selection, explicit source and destination locations with a swap action, transfer quantity, optional description, review, and stock refresh. The visual hierarchy is simplified without changing the transaction meaning.

Refinements applied for implementation review:

- The item field is specified as a keyboard-first searchable combobox by item name or SKU; it must not silently depend on a single capped item page.
- Source and destination remain simultaneously visible, are always different, and can be exchanged with one labelled `Tukar` action.
- Advisory source stock is shown next to the source location, while copy makes clear that the server validates stock again when confirming.
- Quantity separates the numeric entry from its UOM, retains up to four decimal places, and does not calculate authoritative stock locally.
- The optional description keeps its 255-character limit and visible count.
- The confirmation dialog is self-contained: item name and SKU, direction, quantity and UOM, and description are all repeated before submission.
- Narrow layouts stack the direction fields in reading and keyboard order without hiding either location.
- Existing exact-request recovery, pending lock, conflict handling, focus restoration, and server-authoritative result behavior remain required.

### Owner decision — 2026-09-27

The owner approved UXR-D07 after reviewing the refined transfer form. The binding direction is
recorded in `uxr-d07-stock-transfer-decision.md`. Approval includes the combined navigation model:
`Riwayat stok` and the transfer entry point share one `Pergerakan stok` sidebar destination, history
is its default view, and `Buat transfer stok` opens the separate stateful transfer workflow. This
combination changes navigation and information architecture only; it does not merge transfer with a
generic stock-movement create action or weaken server validation, paired movement creation,
idempotency, pending lock, or exact-request recovery.
