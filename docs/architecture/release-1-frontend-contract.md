# Bloom Release 1 Frontend Contract

Status: Active Release 1 working contract  
Last updated: 2026-07-30  
Audience: Repository owner, frontend engineers, backend engineers, reviewers, and AI coding agents

## Purpose

This document defines the intended Release 1 behavior and architectural boundaries
of the Bloom React application.

It exists to:

- Preserve product and UX decisions across pull requests and new conversations.
- Prevent current implementation details from being mistaken for final behavior.
- Define which calculations and validations belong to the backend.
- Establish consistent behavior across cashier and back-office workflows.
- Guide small, domain-focused frontend pull requests.

This document describes target Release 1 behavior. A feature described here must
not be assumed to be implemented until its roadmap PR is marked `MERGED`.

## Sources of truth

Source-of-truth precedence is:

1. Confirmed product decisions from the repository owner.
2. The backend Release 1 domain contract for business invariants and authoritative calculations.
3. This document for frontend architecture, UX, interaction, and presentation behavior.
4. The frontend roadmap for implementation order and PR status.
5. Current source code for currently implemented behavior.

When current code conflicts with an approved Release 1 contract, the conflict must
be reported. The frontend must not silently preserve incorrect legacy behavior.

The frontend must inspect actual backend controllers, request DTOs, response DTOs,
validation, services, and error responses before integrating an endpoint.

A planned backend contract must not be treated as implemented until the relevant
backend code is available.

## Product scope

Bloom is a small-family-store point-of-sale and inventory-management application.

Release 1 targets the existing React web application.

Release 1 does not include React Native implementation. Backend-owned business
rules and stable API contracts should make a future React Native client possible
without moving authoritative calculations into a client.

## Release 1 working modes

Bloom has two working modes.

### Cashier workspace

The cashier workspace is optimized for:

- One laptop.
- One active cashier at a time.
- Fast product search.
- Physical barcode scanning.
- Keyboard-oriented operation.
- Fractional quantity entry where allowed.
- CASH and QRIS checkout.
- Backend-calculated totals and cash change.
- Backend-controlled receipt printing.
- Minimal navigation and distraction.

### Back-office workspace

The back-office workspace is optimized for:

- Item and category management.
- STORE and WAREHOUSE inventory.
- Opening balances.
- Goods receipts.
- Stock adjustments.
- Stock transfers.
- Stock movement history.
- Supplier management.
- Supplier accounts payable and payments.
- Cash-session management.
- Unexpected expenses.
- Sales history and reporting.

The information architecture must follow user tasks, not expose backend/JPA entity
structure directly.

## Confirmed and working decisions

| Area | Release 1 decision | Status |
|---|---|---|
| Stock locations | Only `STORE` and `WAREHOUSE` | Confirmed |
| Quantity precision | Decimal quantity with normalized scale no greater than four | Confirmed |
| Negative stock | Not allowed | Confirmed |
| Stock authority | Stock movements are authoritative; item location balances are derived | Confirmed |
| Opening inventory | Creates `OPENING_BALANCE` movements | Confirmed |
| UOM conversion | No package or alternate-UOM conversion | Confirmed |
| Base UOM | One base UOM per item | Confirmed |
| UOM vocabulary | `PIECE`, `METER`, `KILOGRAM`, `LITER` | Working decision |
| UOM mutability | Locked after the first stock movement | Confirmed/working |
| Fractional policy | `fractionalQuantityAllowed` is defined per item | Confirmed |
| Fractional-policy mutability | Locked after the first stock movement | Working decision |
| Sale payment methods | `CASH` and `QRIS` | Confirmed |
| Supplier payment methods | `CASH`, `BANK_TRANSFER`, and `QRIS` | Confirmed |
| Supplier payment allocation | One payment applies to one goods receipt | Working decision |
| Partial supplier payment | Allowed | Confirmed |
| Supplier overpayment | Rejected | Working decision |
| Supplier credit/prepayment | Not supported in Release 1 | Working decision |
| Cash sessions | Zero or one globally open session | Confirmed |
| Expense correction | Void/reverse with audit trail; never delete | Confirmed |
| Receipt printing | Backend-controlled printer endpoint | Confirmed |
| Barcode input | Physical barcode scanner | Confirmed |
| Scanner transport | Depends on confirmed device model and connection | Unresolved technical detail |

Working decisions should be treated as the implementation direction unless the
repository owner changes them before the affected PR begins.

## Numeric and decimal UX contract

### Exact input representation

Editable monetary and quantity values should be retained as decimal strings while
the user is typing.

The frontend must not use floating-point arithmetic to determine authoritative:

- Sale totals.
- Sale change.
- Goods-receipt totals.
- Supplier outstanding balances.
- Payment status.
- Stock balances.
- Expected closing cash.
- Cash-session variance.

### Quantity validation

Quantity input must follow the backend contract:

1. Required quantities must be present.
2. Movement quantities must be positive.
3. After insignificant trailing zeroes are removed, scale must be no greater than four.
4. If `fractionalQuantityAllowed` is `false`, normalized quantity must be whole.
5. If `fractionalQuantityAllowed` is `true`, fractional input is allowed.
6. Values must never be silently rounded to fit.

Examples:

| Input | Fractional allowed | Frontend result |
|---|---:|---|
| `2` | false | Accept |
| `2.0000` | false | Accept |
| `2.5000` | false | Reject |
| `2.5000` | true | Accept |
| `2.50000` | true | Accept after insignificant-zero normalization |
| `2.50001` | true | Reject |
| `0` for a new movement | either | Reject |
| Negative input | either | Reject |

Frontend validation exists for immediate feedback. The backend remains
authoritative and must validate again.

### Display behavior

- Quantities display with the item UOM.
- Do not force four visible decimal places when they are unnecessary.
- Preserve meaningful fractional precision.
- Indonesian money uses one shared `Intl.NumberFormat("id-ID", ...)` formatter.
- Raw strings such as `Rp. 10000` must not be used.
- Dates and times use an explicit Indonesian locale.
- Backend instants are displayed in the intended store timezone.
- The HTML document language must be Indonesian (`lang="id"`).

## UOM behavior

Allowed Release 1 UOM values:

| Backend value | Indonesian label | Examples |
|---|---|---|
| `PIECE` | pcs | Bottles, batteries, packaged items |
| `METER` | meter | Cable, rope, fabric |
| `KILOGRAM` | kg | Rice, sugar, flour |
| `LITER` | liter | Bulk oil and other liquids |

Release 1 does not perform unit conversion.

Examples:

- 250 grams is recorded as `0.2500 KILOGRAM`.
- 500 milliliters is recorded as `0.5000 LITER`.
- 50 centimeters is recorded as `0.5000 METER`.
- A 100-meter cable roll received for a meter-based SKU is recorded as `100 METER`.
- A packaged bottle sold as one item uses `PIECE`, not `LITER`.
- A box sold as an independent SKU may use `PIECE`.

`baseUnitOfMeasure` and `fractionalQuantityAllowed` may be edited before the
first stock movement. After the first movement they are read-only.

The frontend should use an explicit backend capability such as `hasMovements` or
field-level editability rather than infer immutability from current stock being
zero.

## Stock and item UX contract

### Item list and detail

Item views must show:

- Name and SKU.
- Category.
- Selling price.
- Base UOM.
- Fractional-quantity policy.
- STORE balance.
- WAREHOUSE balance.
- Active/inactive state.
- Movement-history entry point.

The frontend must not use legacy `stockQuantity`.

A combined total may be displayed as supplementary information only if returned
or explicitly approved, but it must not obscure location-specific availability.

### Item creation

Item creation may accept optional opening quantities for STORE and WAREHOUSE.

The backend must create the item and corresponding `OPENING_BALANCE` movements
atomically.

The frontend must not:

- Create an item and then issue separate independent stock mutations.
- Directly set derived stock balances through ordinary item-master updates.
- Present opening inventory as ordinary editable item metadata after creation.

### Item editing

Ordinary item editing may update backend-approved master data.

Existing stock must not be edited from the item form.

When UOM or fractional policy is immutable, the UI must:

- Display the value.
- Disable or replace the control with read-only content.
- Explain that the field is locked because stock movements already exist.

### Stock adjustments

A stock adjustment must include:

- Item.
- Stock location.
- Action type.
- Positive decimal input or approved correction value.
- UOM context.
- Reason.
- Confirmation.

The backend determines before and after balances.

### Stock transfers

A transfer:

- Moves stock between STORE and WAREHOUSE.
- Is one atomic backend operation.
- Produces an OUT movement at the source and an IN movement at the destination.
- Must not be implemented as two independent frontend requests.
- Must not allow the same source and destination.
- Must handle backend insufficient-stock and concurrency errors.

### Stock movement history

Movement history should show:

- Item and SKU.
- Location.
- Direction.
- Source type.
- Source reference.
- Quantity and UOM.
- Before balance.
- After balance.
- Actor.
- Timestamp.

Movement history is immutable and read-only.

## Cash-session UX contract

There may be zero or one globally open cash session.

### No open session

When no session is open:

- Cashier checkout is unavailable.
- This applies to CASH and QRIS sales.
- Unexpected expenses are unavailable.
- CASH supplier payments are unavailable.
- The UI provides an authorized open-session action.

### Open session

The persistent current-session surface should display:

- Status.
- Cashier.
- Opening cash.
- Opened time.

The backend is authoritative when another session is already open.

### Closing a session

The user enters actual counted closing cash.

The backend returns:

- Opening cash.
- CASH sales.
- CASH supplier payments.
- Active expenses.
- Expected closing cash.
- Actual closing cash.
- Variance.

The frontend must not calculate expected closing cash or variance.

After successful close:

- The session is visibly immutable.
- Drawer-affecting actions are disabled or rejected.
- Repeated close submission is prevented.
- The user can inspect the backend reconciliation result.

## Cashier UX contract

### Product discovery

Cashier product discovery supports:

- Exact barcode lookup.
- Name/SKU search.
- Category filtering where useful.
- STORE availability.
- Clear loading, empty, not-found, and error states.

### Physical barcode scanner

The primary workflow uses a physical scanner.

Before scanner integration, confirm:

- Scanner model.
- Connection type.
- Whether it exposes USB HID, serial/COM, WebHID, WebSerial, or another interface.
- Barcode suffix/terminator.
- Browser and operating-system behavior.

A physical USB HID scanner may technically emit keyboard events. That does not
make manual copy/paste the intended workflow.

The cashier UI should provide:

- Scanner-ready state.
- Successful scan feedback.
- Not-found feedback.
- Duplicate-scan behavior.
- Reliable focus recovery.
- Protection against a scan also triggering a stale search request.

### Cart

Cart rows show:

- Product name and SKU.
- Quantity and UOM.
- Unit price snapshot or current displayed price.
- Location context where relevant.
- Availability feedback.
- Remove action.

Cart quantity follows the item fractional policy.

Cart calculations may be displayed as non-authoritative estimates while editing.
Final confirmation must use backend values.

### Checkout

Every sale requires the globally open cash session.

Supported payment methods:

- `CASH`
- `QRIS`

For CASH:

- User enters cash tender where required by the final backend contract.
- Backend calculates final total and change.
- Frontend displays the backend result.

For QRIS:

- QRIS does not affect physical drawer cash.
- The exact QRIS confirmation mechanism must follow the available backend/product contract.

Checkout must:

- Use a stable idempotency key per checkout attempt.
- Reuse that key for safe retry.
- Disable repeated submission.
- Handle an already-completed duplicate response.
- Handle insufficient stock.
- Handle changed price.
- Handle a session that was closed.
- Preserve the cart when the outcome is retryable.
- Clear the cart only after confirmed sale success.

## Receipt-printing contract

Receipt printing is controlled through the backend printer endpoint.

Sale creation and printing are separate operations:

1. Backend creates and commits the sale.
2. Frontend receives a stable sale code.
3. Frontend requests printing using that sale code.
4. Backend retrieves authoritative sale data and prints it.

If printing fails:

- The sale remains successful.
- The frontend must not resubmit the sale.
- The UI reports “transaction successful, printing failed.”
- The user can retry printing.
- Reprint uses the existing sale code.

Sale history/detail should provide an explicit reprint action. It should be clear
that the result is a copy.

`window.print()` is not the primary Release 1 receipt path.

PDF generation is not a required fallback unless separately approved.

## Supplier and purchasing UX contract

### Supplier master data

Supplier management covers backend-approved fields such as:

- Code.
- Name.
- Contact number.
- Address.
- Active state.
- Audit information.

Supplier debt is accounts payable only. It is not customer credit.

### Goods receipts

A goods receipt includes:

- Structured supplier selection.
- Received date.
- Description/reference.
- One or more item lines.
- Quantity and UOM.
- Purchase-price input/snapshot.
- STORE or WAREHOUSE destination.

The backend calculates:

- Line subtotals.
- Receipt total.
- Amount paid.
- Outstanding payable.
- Settlement state, if exposed.

The frontend must not submit an authoritative receipt total.

A successful goods receipt atomically creates:

- Receipt and lines.
- Stock movements.
- Supplier payable impact.

### Supplier payable

Supplier payable views show backend-returned:

- Receipt total.
- Total paid.
- Outstanding amount.
- Payment history.
- Derived settlement condition.

The frontend must not maintain an editable supplier-debt balance.

### Supplier payments

Release 1 uses a simple allocation rule:

- One payment applies to one goods receipt.
- Partial payments are allowed.
- Payment greater than outstanding is rejected.
- No multi-receipt allocation.
- No supplier credit.
- No overpayment balance.
- No prepayment.
- No automatic redistribution.

Payment methods:

- `CASH`
- `BANK_TRANSFER`
- `QRIS`

Only CASH:

- Requires an open cash session.
- Reduces drawer cash.

Payment submission requires idempotency protection.

Supplier-payment reversal remains deferred until its backend policy is approved.

## Unexpected-expense UX contract

An unexpected expense:

- Uses store drawer cash.
- Requires the globally open cash session.
- Includes amount, approved category, description, actor, and timestamp.
- Reduces expected drawer cash through backend reconciliation.

Expense categories must come from the backend-approved enum. Users cannot create
free-form categories in Release 1.

A posted expense:

- Is never deleted.
- Is never edited to simulate a correction.
- May be fully voided/reversed with a mandatory reason.
- Remains visible in history.
- Has zero drawer effect after a successful void.

Partial expense void is not supported.

Post-close expense correction remains unresolved. The frontend must present the
backend decision and must not mutate a closed session locally.

## Sales history

Sales history/detail should display backend-returned:

- Sale code.
- Session reference.
- Cashier.
- Timestamp.
- Payment method.
- Lines, quantities, UOM, unit-price snapshots, and line subtotals.
- Subtotal.
- Discount.
- Total.
- Tender/change where contractually defined.
- Print/reprint state where useful.

The frontend must not derive a financial status such as “paid/unpaid” unless that
meaning is explicitly part of the backend contract.

Sale void/refund/return is not part of the approved Release 1 frontend contract
until its backend lifecycle is decided.

## Target route and information architecture

Suggested route families:

```text
/login

/cashier
/cashier/success/:saleCode

/back-office/dashboard

/back-office/items
/back-office/items/new
/back-office/items/:sku
/back-office/items/:sku/edit

/back-office/item-categories

/back-office/stock-movements
/back-office/stock-adjustments
/back-office/stock-transfers

/back-office/suppliers
/back-office/suppliers/:code
/back-office/goods-receipts
/back-office/goods-receipts/:code
/back-office/payables

/back-office/cash-sessions
/back-office/cash-sessions/:id
/back-office/expenses

/back-office/sales
/back-office/sales/:code
```

Exact route migration may occur incrementally. Existing URLs should not be broken
without redirects or an explicitly reviewed migration.

## Frontend state ownership

Target ownership:

- Backend: authoritative domain state and calculations.
- Query/server-state layer: remote lists, details, mutations, invalidation, and request cancellation.
- Local React state: transient form and interaction state.
- Zustand or equivalent UI state: application-shell concerns that are genuinely global.
- URL: shareable filters, pagination, sorting, and selected reporting periods where practical.

Do not copy server entities into long-lived mutable client stores without a clear
invalidation strategy.

Every domain defines query keys and invalidation behavior.

Search requests should support cancellation or response sequencing so an older
response cannot overwrite a newer query.

## API and error contract

The frontend should consume stable, purpose-built request and response DTOs.

List responses should not expose large nested entity graphs when a lightweight
summary DTO is sufficient.

Expected machine-readable error categories include:

- Validation failure.
- Resource not found.
- Insufficient stock.
- Fractional quantity not allowed.
- Invalid quantity scale.
- Stock conflict/concurrent update.
- Cash session required.
- Cash session already open.
- Cash session closed.
- Payment greater than outstanding.
- Duplicate/idempotent request.
- Price changed.
- Printer failure.
- Authentication required.
- Authorization denied.

The frontend must not depend only on parsing human-readable error messages.

## Standard screen states

Every asynchronous screen or operation must deliberately handle applicable states.

### Read screens

- Initial loading.
- Background refresh.
- Successful data.
- Empty.
- Filtered empty.
- Error.
- Retry.

### Mutation screens

- Idle.
- Client validation failure.
- Confirmation.
- Submitting.
- Success.
- Backend validation failure.
- Domain conflict.
- Network-ambiguous outcome.
- Safe retry.
- Already-completed idempotent result.

Global blocking loaders should be reserved for operations that truly block the
whole workspace.

## Accessibility contract

Touched workflows should meet WCAG 2.1 AA-oriented behavior where practical.

Minimum requirements:

- Semantic links and buttons.
- No clickable `div` for actions.
- Every icon-only button has an accessible name.
- Visible focus indicators.
- Keyboard-accessible tables and row actions.
- Dialog focus containment and focus return.
- Error text associated with its field.
- Status updates exposed through appropriate live regions.
- Color is not the only status indicator.
- Minimum practical pointer target size.
- Correct Indonesian document language.
- Scanner behavior must not make ordinary keyboard navigation impossible.

MUI accessibility behavior should be preserved and supplemented where custom
interactions require it.

## Responsive desktop contract

Primary Release 1 target:

- Laptop/desktop browser.
- Cashier optimized for the store’s expected laptop resolution.
- Back-office usable at common laptop widths.

The frontend is not required to become a mobile POS application in Release 1.

However:

- Screens should not require a fixed large desktop width.
- Tables should use intentional overflow or responsive column behavior.
- Forms should not use fixed half/two-thirds widths without breakpoints.
- Cashier cart and product search must remain usable on the minimum supported laptop width.
- Browser zoom and text enlargement should not destroy primary actions.

The minimum supported viewport should be confirmed with the repository owner and
documented when known.

## Reusable implementation direction

Prefer preserving and improving:

- Existing MUI-based visual foundation.
- Existing Bloom color identity.
- Lazy route loading.
- Item detail, audit, and barcode components.
- List/filter/pagination patterns.
- Goods-receipt and stock-adjustment detail structures.
- Stock-adjustment CSV workflow.
- Snackbar notifications as secondary feedback.
- Confirmation-dialog foundation.
- Dashboard cards and charts where their data remains meaningful.

Do not preserve a component merely because it exists if it silently drops props,
prevents accessibility, or encodes an obsolete backend contract.

## Explicit Release 1 exclusions

Unless separately approved, Release 1 excludes:

- React Native implementation.
- Package or alternate-UOM conversion.
- ROLL-to-METER automatic conversion.
- UOM conversion ratios.
- Stock locations other than STORE and WAREHOUSE.
- Negative inventory and back-ordering.
- Customer credit or customer debt.
- Supplier payment allocation across multiple receipts.
- Supplier overpayment credit.
- Supplier prepayment.
- Sale refund/return/void workflow.
- Partial expense void.
- General cash-drawer adjustment without an approved audited source.
- Browser printing as the primary receipt mechanism.

## Remaining decisions

The following still require product or hardware decisions:

1. Exact scanner model, transport, and terminator behavior.
2. Supplier-payment reversal/void policy.
3. Sale void/refund/return lifecycle.
4. Goods-receipt cancellation/return lifecycle.
5. Post-close expense-correction behavior.
6. Cash-session reopen policy and authorization.
7. Exact CASH tender and `paidAmount` representation in the backend API.
8. QRIS confirmation behavior.
9. Minimum supported cashier viewport.
10. Whether receipt PDF export is needed as a fallback.

A PR must not invent one of these decisions.

## Definition of done for a domain PR

A frontend domain PR is complete only when:

- Its backend contract is available and verified.
- It changes one frontend domain.
- Planned behavior is distinguished from current behavior.
- Authoritative calculations remain on the backend.
- Loading, empty, error, conflict, pending, success, and retry states are addressed.
- Keyboard and accessibility behavior are tested.
- Minimum laptop-width behavior is inspected.
- Focused tests pass.
- Existing relevant tests pass.
- Build/type-check/lint validation for touched files is reported.
- No unrelated changes are included.
- Documentation is updated if the PR changes an approved contract or roadmap status.