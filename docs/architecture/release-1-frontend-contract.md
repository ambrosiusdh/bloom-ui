# Bloom Release 1 Frontend Contract

Last updated: 2026-09-11

## 1. Purpose

This document defines the Release 1 frontend behavior and frontend/backend boundaries for Bloom UI. It is a guardrail for small, reviewable React PRs; it is not a replacement for the backend domain contract.

When sources disagree, use this order:

1. Confirmed product decisions in this document.
2. The backend Release 1 domain contract for business invariants and authoritative calculations.
3. Implemented backend controller, request DTO, response DTO, validation, and service behavior.
4. Current frontend behavior.

A confirmed product decision is not automatically an implemented API contract. Any mismatch between this document and backend code remains a backend gate for the affected frontend PR.

## 2. Current implementation versus Release 1 target

### 2.1 Verified current baseline

Bloom UI is currently a JavaScript React application:

- React 19 and Vite 6.
- JavaScript and JSX source files; no TypeScript application baseline.
- React Router for client-side routing.
- Axios through the existing shared API wrapper.
- Zustand feature stores for shared client and server-derived state.
- Material UI, Sass, and existing utility styles.
- Vitest, React Testing Library, and jsdom for frontend tests.
- PropTypes and existing ESLint rules for current runtime/static checks.
- FE-04 cashier-focused layout is implemented: `/cashier` uses a focused shell with a clear back-office escape while preserving the route and shared theme.
- FE-05 back-office navigation accessibility is implemented: current destinations are semantically grouped, route-active, keyboard accessible, and usable as a responsive drawer without adding or changing routes.
- FE-06 item-category reliability is implemented: active-category list/create/edit/deactivate flows match the current backend contract and cover explicit async, validation, conflict, pending, success, confirmation, and focus behavior.
- FE-07 backend receipt reprint is implemented: sale detail calls the backend print endpoint for the existing sale reference with pending, duplicate-click prevention, success, failure, and same-reference retry behavior.
- FE-08 current dashboard reliability is implemented: the existing backend overview metrics have explicit accessible loading, error/retry, zero/empty, refresh, and last-successful-data behavior without frontend aggregation.
- FE-10 item creation is implemented: `/items/new` sends item metadata, the Release 1 UOM/fractional policy, and optional decimal STORE/WAREHOUSE openings through the backend's single atomic create operation, with explicit category, validation, pending, conflict, failure-recovery, success, and focus behavior.
- FE-11 item editing is implemented: `/items/:sku/edit` separates editable metadata from backend-reported UOM/fraction locks, excludes stock mutation, and covers explicit loading, validation, pending, conflict-refresh, success, duplicate-submit, focus, and responsive behavior.
- FE-12 stock movement history is implemented: `/stock-movements` renders the paged backend ledger directly, supports item/direction/location filters, and has an item-scoped entry point without posting or reconstructing stock movements.
- FE-14 stock transfer is implemented: `/stock-transfers/new` posts one single-item decimal transfer through the backend's atomic idempotent operation, renders its confirmed reference, and refreshes the affected item data without frontend stock calculations.
- FE-15 current/open cash session is implemented: the cashier workspace consumes a successful `data: null` response as the verified no-session state, keeps HTTP failures separate, and opens one session with backend-confirmed opening cash, identity, timestamp, status, and conflict refresh behavior.
- FE-16 cash-session close and reconciliation is implemented: the current-session surface previews server-calculated expected cash, posts only actual counted cash, renders the final server reconciliation, recovers already-closed conflicts, and locks shared drawer actions until session state is verified.
- FE-17 cash-session history and detail is implemented: back-office users can page and filter the backend session read model, open one session, and review backend-stored reconciliation and audit fields without ledger aggregation or mutation.
- FE-18 cashier search and cart is implemented: the focused cashier workspace gates interaction on a verified open session, searches the active backend item read model, handles stale results, and supports duplicate-add, remove, UOM/fraction-aware decimal quantity editing, advisory STORE availability, and deliberate keyboard focus without local totals.
- FE-19's E81W keyboard-wedge adapter and device-informed automated coverage are implemented, but FE-19 remains in progress until the same physical input, focus, feedback, and rapid-scan checks pass on the store laptop.
- FE-20 sale checkout is implemented: the cashier submits only STORE cart-line intent, CASH/QRIS input, and one stable `Idempotency-Key`; it blocks duplicate actions, preserves the exact request/key across safe replay, resolves ambiguous outcomes through the backend status lookup, and clears the cart only after a backend-confirmed sale while rendering backend totals/change.
- FE-21 post-checkout printing is implemented: the cashier first renders and focuses the backend-confirmed sale/reference, then separately calls backend-controlled printing with that reference. A sale-reference-scoped coordinator preserves the completed sale and the same pending print operation across checkout, sale-detail navigation, success, failure, retry, and reprint.
- FE-22 sales history alignment is implemented: list/detail render backend-confirmed decimal lines, totals, payment/lifecycle/correction statuses, tender/change, session/reference, and supported filters without inferring paid state; FE-07 reprint remains separate and available.
- FE-23 supplier list and detail are implemented: back-office users can search and page the backend supplier read model, switch between its supported active/inactive filters, and inspect one supplier by stable immutable code with explicit async, empty, retry, and stale-response behavior.
- FE-24 supplier maintenance is implemented: back-office users can create and edit supplier master data while the stable code remains immutable, handle validation and duplicate-code conflicts without losing input, and deactivate suppliers through a separate accessible confirmation that preserves the record and its history.
- FE-25 goods-receipt history and detail implementation is present: back-office users can filter and page the backend receipt read model, inspect supplier identity and persisted decimal UOM/location lines, and review server-returned total, paid, outstanding, receipt status, payment status, references, and timestamps without enrichment or frontend financial calculations. Its date filters remain blocked from final approval until the business/store timezone contract is explicit.

Release 1 work must preserve this baseline unless a narrowly scoped PR proves that a dependency change is necessary for its immediate domain. TypeScript migration, TanStack Query adoption, global store replacement, router restructuring, and a global design-system rewrite are not Release 1 prerequisites.

- FE-26 goods-receipt creation is implemented for review: stable supplier code/item SKU, decimal-string UOM-aware quantities and purchase prices, explicit per-line location and received time/UTC offset, one confirmed idempotent atomic POST, tab-persisted draft/recovery, and server-confirmed receipt/payment results. Optional initial payment is omitted. Shared `BloomQuantityField` mechanics are used by receipt entry and the FE-18 cashier wrapper; workflow validation and FE-13 direction/zero rules remain local.
- FE-27 supplier payable views are implemented for review: `/payables` pages the backend goods-receipt read model and renders its receipt/payment statuses and financial values directly; supplier detail reads exactly one backend aggregate for that supplier. The workflow links supplier and receipt detail without per-row enrichment or browser-side debt aggregation. It intentionally omits a payment-status filter because the backend does not expose one, and omits calendar date filtering so it does not expand FE-25's unresolved store-timezone boundary.
- FE-28 single-receipt supplier payment is implemented for review: receipt detail accepts partial/full CASH, BANK_TRANSFER, or QRIS payments with confirmation, durable same-request/key recovery, duplicate prevention, conflict handling, and focused success. Only CASH requires the verified current session. Receipt amounts/status are refreshed from the backend after posting; failed refreshes cannot trigger another payment. See [transaction plan and gate evidence](../plans/fe-28-supplier-payment.md).
- FE-28 review corrections retain the confirmed payment across navigation until a successful receipt refresh and explicit completion, bind recovery to the verified backend username, freeze all confirmed request fields, and bound each payment-related request to 15 seconds. Uncertain attempts survive timeouts and account changes; another account cannot display or replay them. Legacy recovery without an owner remains locked for manual verification. FE-28 remains `REVIEW`.
- FE-29 expense history and creation are implemented for review: `/expenses` renders paged backend audit records across all sessions; `/expenses/new` accepts decimal amount, one of six backend categories, and the supported description field labelled “Alasan / catatan”. New posting requires a verified open session, confirmation, and a fresh session check. The confirmed `expectedCashSessionId` is sent and persisted with the exact request/key; retries never retarget another session, and old uncertain attempts without a verified session remain locked for manual reconciliation. Account isolation, duplicate prevention, preserved conflict input, matching-session returned-record success, and session refresh are implemented. No edit/delete/void or drawer calculation is included. Status: `REVIEW`; see the [contract evidence and history/create review split](../plans/fe-29-expenses.md).

### 2.2 Current implemented routes

The current application includes routes for login, dashboard, cashier, items, item categories, sales, goods receipts, and stock adjustments. These screens contain useful components and partial workflows, but several still depend on legacy fields or client-side assumptions that do not match the Release 1 target.

### 2.3 Release 1 target

Release 1 adds or aligns these domains:

- STORE and WAREHOUSE inventory with decimal quantities.
- Item UOM and fractional-quantity rules.
- Stock receipts, adjustments, transfers, and movement history.
- Cashier sale, cash session, QRIS/CASH checkout, and backend receipt printing.
- Unexpected drawer expenses and void/reversal behavior.
- Suppliers, goods receipts, supplier debt, and partial supplier payments.

The target must be delivered incrementally. Existing routes and reusable components remain in place unless a domain PR has a concrete reason to change them.

### 2.4 Local integration verification

For the seeded local development environment only:

- Frontend origin: `http://localhost:5173`.
- Backend API: `http://localhost:8080`.
- Username: `admin`.
- Password: `admin`.

These credentials are test fixtures for local development and browser verification. They must not be reused as production credentials or copied into frontend runtime code.

## 3. Confirmed product direction

| Decision | Release 1 direction | Contract status |
| --- | --- | --- |
| Primary client | React web application | Confirmed |
| Future mobile client | React Native may later cover cashier/session/expense workflows | Deferred; not Release 1 scope |
| Working modes | Focused cashier workspace and back-office workspace | Confirmed; validate details through usable flows |
| Inventory locations | `STORE` and `WAREHOUSE` | Confirmed |
| Negative stock | Prohibited | Confirmed; backend-enforced |
| Quantity precision | Decimal quantities with up to four fractional digits | Confirmed |
| Base UOM vocabulary | `PIECE`, `METER`, `KILOGRAM`, `LITER` | Product-confirmed; backend contract/code alignment required |
| Fractional behavior | Each item has `fractionalQuantityAllowed` | Confirmed |
| Item rule mutability | Base UOM and fractional policy become immutable after the first stock movement | Product-confirmed; backend enforcement required |
| Opening inventory | Creating opening stock creates `OPENING_BALANCE` movements | Confirmed; requires an atomic backend contract |
| Sale payments | `CASH` and `QRIS` | Confirmed |
| Sale calculations | Totals and cash change are returned by the server | Confirmed |
| Duplicate sale protection | `Idempotency-Key` on sale create and checkout-status lookup | Confirmed and implemented |
| Receipt output | Backend-controlled printer flow | Confirmed |
| Scanner | A physical barcode scanner is intended | Confirmed; device transport/terminator behavior still requires verification |
| Cash session | At most one globally open session | Confirmed |
| Expense correction | Posted expenses are voided/reversed, not deleted | Confirmed |
| Supplier payment allocation | One payment applies to one goods receipt; partial payment allowed; overpayment rejected | Confirmed; verified against current payment service and database enforcement for FE-28 |
| Supplier credit/prepayment | Not supported | Confirmed |
| Multi-receipt allocation | Not supported | Confirmed; deferred beyond Release 1 |
| Customer credit | Not supported | Confirmed |

The UOM vocabulary is intentionally small. It means the permitted base measurement choices shown to the user: piece/count, meter/length, kilogram/weight, and liter/volume. Release 1 does not include conversions such as box-to-piece or kilogram-to-gram.

A stock movement means any posted event that changes or records item stock, including opening balance, goods receipt, adjustment, transfer, sale, return, or reversal. Once the first such event exists, changing the item's base UOM or whether it allows fractions would make historical quantities ambiguous; the frontend must therefore display those fields as locked when the backend reports that state, and the backend must reject invalid changes.

## 4. Authority boundary

### 4.1 Backend-owned decisions and calculations

The frontend must not be authoritative for:

- stock on hand or stock availability;
- whether a stock movement may be posted;
- sale subtotal, total, amount due, or cash change;
- goods-receipt total, paid amount, outstanding amount, or payment status;
- supplier debt balances or payment allocation;
- expected drawer cash or closing variance;
- whether a cash session is open or closed;
- whether an expense or payment affects drawer cash;
- idempotency and duplicate-transaction detection;
- document status transitions, reversals, or void eligibility.

The frontend may calculate transient presentation hints, such as a non-authoritative line preview, only when clearly labelled and replaced by the server response before confirmation. It must never persist or present a local preview as the posted result.

### 4.2 Frontend-owned responsibilities

The frontend owns:

- input collection and accessible interaction;
- client-side checks that improve usability without weakening backend validation;
- request lifecycle, retry affordances, and duplicate-click prevention;
- rendering backend-confirmed values and statuses;
- locale-aware display formatting;
- navigation, focus management, and responsive layout;
- preserving enough request context to explain conflicts and recover safely.

### 4.3 Contract inspection rule

Before implementing a backend-integrated PR, inspect the corresponding backend controller, request DTO, response DTO, validation, service behavior, and domain contract. Do not infer an endpoint or field from a JPA entity or from an old frontend shape.

If the API lacks a required field or invariant, mark the frontend PR blocked. Do not add a frontend workaround that becomes the source of truth.

## 5. Quantity, UOM, money, and localization behavior

### 5.1 Quantity input

- Quantities support up to four decimal places when the item allows fractions.
- Whole-unit items accept only integral quantities.
- Inputs should retain the user's editing string while focused so values such as `0,5` or `0.50` are not corrupted mid-entry.
- Normalize the accepted decimal separator at the API boundary according to the agreed DTO format.
- Never use binary floating-point arithmetic as the authoritative quantity calculation.
- Validation must identify the affected field and explain whether the problem is precision, range, availability, or the item's fractional policy.
- Stock location must be explicit wherever the operation affects a location.
- A shared quantity control may own editing-string preservation, comma/dot input, UOM display, accessible increment/decrement controls, and exact decimal stepping. The consuming workflow still owns domain rules such as whether zero is allowed, direction/action semantics, location, advisory availability, request mapping, and error copy.
- Do not reuse the legacy `BloomInputNumber` for a Release 1 decimal workflow unless it is first replaced or rewritten to avoid binary `Number` arithmetic, digit-only sanitization, and silent clamping.

### 5.2 Quantity display

- Display the item UOM beside quantities where the unit is otherwise ambiguous.
- Preserve meaningful fractional digits without forcing four trailing zeros in ordinary tables.
- Detail/audit views may show normalized precision when it helps reconciliation.
- Never merge STORE and WAREHOUSE into a single legacy `stockQuantity` value.

### 5.3 Money

- Display money using Indonesian Rupiah conventions.
- Send and receive monetary values using the backend's decimal representation; do not rely on floating-point totals.
- Render server-confirmed totals, change, debt, payments, expected cash, actual cash, and variance.

### 5.4 Dates, times, and language

- User-facing copy is Bahasa Indonesia unless a product decision says otherwise.
- Dates and times use Indonesian locale conventions and the agreed store timezone.
- API timestamps remain machine-readable; formatting happens at the display boundary.
- Status labels should be translated consistently while preserving the backend enum value internally.

## 6. Domain behavior

### 6.1 Items and inventory

Item list and detail experiences must expose, when the backend supports them:

- SKU/barcode and item name;
- category;
- base UOM;
- whether fractional quantities are allowed;
- STORE stock;
- WAREHOUSE stock;
- active/inactive state;
- whether UOM/fractional rules are locked.

Creating an item with opening inventory must use an atomic backend operation that creates the item and its `OPENING_BALANCE` movements. The frontend must not create an item and then simulate opening stock through unrelated requests.

Editing must distinguish editable item metadata from locked stock semantics. Stock is changed only through a stock operation, never by editing an item quantity field.

Movement history must be based on a backend read model and support the context required to understand quantity, location, movement type, reference, actor, and time.

### 6.2 Stock operations

- Receipt adds stock through a posted goods receipt.
- Adjustment requires location, signed or directionally explicit quantity semantics, reason, and server confirmation.
- Transfer requires source and destination, rejects identical locations, and is posted atomically by the backend.
- Negative stock is prohibited and must be rejected by the backend at posting time.
- Failed/conflicting stock operations must not optimistically alter displayed authoritative stock.
- After success, the frontend refreshes the affected backend-derived views.

### 6.3 Cash sessions

- The application must establish the globally open session state before enabling drawer transactions.
- Opening captures opening cash and renders the server-created session.
- Closing renders server-calculated expected cash, captures actual cash, and displays the returned variance.
- CASH sales, CASH supplier payments, and expenses affect drawer cash according to backend rules.
- QRIS sales and non-cash supplier payments do not affect physical cash.
- A closed or conflicting session response disables further drawer submission and guides the user to refresh the session state.

### 6.4 Cashier and checkout

- The cashier workspace minimizes unrelated navigation and keeps search/scanning, cart, totals, and payment actions visible.
- Product search and scanner input converge on the same backend item lookup and cart-add behavior.
- Cart quantity editing respects the item's UOM and fractional policy.
- Availability shown before checkout is advisory; the server revalidates stock during submission.
- CASH and QRIS have distinct payment interactions.
- The frontend sends only contract-approved inputs and renders the server-created sale and server-calculated totals/change.
- Checkout has a pending state that prevents repeated local actions, but true duplicate resistance depends on the backend idempotency contract.
- On an ambiguous timeout, do not silently resubmit with a new idempotency key. Offer a safe status/retry path defined by the backend contract.
- FE-20 creates the key only for a confirmed attempt. `POST /api/sales` and `GET /api/sales/checkout-status` reuse that key; `UNKNOWN` keeps the frozen request/key recoverable and is never presented as proof that the sale failed.
- A known validation, stock, cash-session, or idempotency conflict preserves actionable input. A changed payload starts a new attempt; an unchanged safe replay keeps the existing key.
- Checkout success requires the backend sale record. The client then displays its sale code, total, paid amount, payment type, and change and clears the submitted cart; no print request is part of FE-20.

### 6.5 Receipt printing

- Printing calls the backend-controlled print endpoint; browser printing is not the primary path.
- Sale posting and printing are separate outcomes: a print failure must not imply that the sale failed.
- After a successful sale, show the confirmed sale reference before attempting or reporting print status.
- Support retry/reprint without recreating the sale.
- Render useful printer errors and preserve a path back to the completed sale.

### 6.6 Suppliers, goods receipts, and debt

- Supplier management uses a stable supplier identifier, not a free-text name as the relationship key.
- A goods receipt captures supplier, destination location per contract, and received item quantities/prices.
- The backend returns receipt total, paid/outstanding values, and payment status.
- Supplier debt views render backend-calculated receipt-level outstanding amounts.
- One Release 1 supplier payment applies to one receipt.
- Partial payment is allowed; overpayment is rejected.
- Payment methods are `CASH`, `BANK_TRANSFER`, and `QRIS`; only CASH affects drawer cash.
- No supplier credit balance, prepayment, or automatic multi-receipt allocation is represented in the UI.
- Posted receipt/payment corrections follow backend reversal rules; the frontend must not delete financial history.

### 6.7 Unexpected expenses

- Creating an expense requires an open cash session.
- Capture amount, category or reason according to the API, and optional explanatory text where supported.
- Render the server-posted expense and updated session-derived data.
- Posted expenses are corrected through void/reversal, not deletion or silent editing.
- Conflict responses caused by a closed session must preserve entered data while preventing unsafe resubmission.

### 6.8 Sales and dashboard

- Sale history and detail render backend-confirmed payment, totals, status, and print/reprint actions.
- The frontend must not infer payment status solely by comparing locally available totals.
- Dashboard figures are backend read models. Widgets may link to operational workflows, but must not recompute business balances from multiple frontend requests.

## 7. Information architecture and routing

Release 1 should present two recognizable working contexts:

- Cashier: focused sale, current cash-session status, and essential transaction recovery.
- Back office: dashboard, inventory, suppliers, goods receipts, debt/payments, expenses, sales history, cash-session history, and reporting/read models that actually exist.

This is a navigation grouping, not permission to replace the router or migrate all URLs. Existing paths should be preserved while each domain is aligned. A route change requires a domain-specific reason, explicit compatibility/redirect behavior, and a small reviewable scope.

Navigation must not expose placeholder destinations as working features. Actions that depend on an unavailable backend contract should be omitted or visibly unavailable with a useful explanation.

## 8. State and API architecture

### 8.1 Preserve the current architecture

Use the existing Axios wrapper, Zustand stores, component state, and React Router unless the touched domain demonstrates a concrete limitation. Release 1 does not require a new server-state library or a global state rewrite.

State ownership should remain explicit:

- component state for temporary interaction and form editing;
- feature stores for genuinely shared workflow state;
- backend responses as the source of truth for domain records and calculations;
- URL state for shareable filters or selected identifiers when useful.

Expense and supplier-payment consistency alignment (2026-09-11): both API modules
use the existing default API-object export and centralized endpoint definitions.
Expense reads accept `(params, config, options)`; creates accept the payload,
idempotency key, and loader options (plus receipt code for supplier payment).
Their 15-second timeouts remain enforced. Pure request mapping and validation live
in domain-specific `src/utils` files; Zustand stores own posting, recovery, and
server refresh, using shared API error-code constants. Expense history retains
page-local read state and URL paging because that state is not shared. Existing
storage keys, persisted payloads, session binding, and backend authority are
unchanged. FE-28 and FE-29 remain `REVIEW`; review these maintenance changes as
separate supplier-payment and expense slices when preparing PRs.

Alignment verification: 89 tests across 8 focused API/store/workflow test files
passed, including duplicate/recovery/session/account and keyboard/focus coverage.
Repository-wide ESLint and the production build passed; existing Browserslist-data
and large-bundle warnings remain. No live expense or supplier payment was posted.

### 8.2 Request lifecycle

Each touched workflow must define:

- initial/loading state;
- success state using the returned backend record;
- empty state where applicable;
- validation errors;
- authorization/session errors;
- conflict/stale-state errors;
- network or unexpected errors;
- pending submission behavior;
- safe retry behavior;
- refresh of affected server-derived views after mutation.

Protect screens from stale responses when filters or identifiers change quickly, using the smallest solution compatible with the existing stack. Do not add a global request abstraction without an immediate consumer and focused tests.

### 8.3 Error shape

The shared API boundary should normalize enough information for screens to distinguish validation, authentication, authorization, not-found, conflict, and unexpected failures. User-facing messages remain domain-specific; raw backend or Axios errors should not leak into the UI.

## 9. Interaction quality contract

### 9.1 Standard states

Every touched screen or major panel must deliberately cover:

- loading;
- error with a relevant recovery action;
- empty with a useful next action;
- pending submission;
- success confirmation;
- conflict/stale state;
- confirmation for irreversible posting, closing, voiding, or reversal actions.

### 9.2 Accessibility

- All actions are keyboard reachable and have visible focus.
- Forms have programmatically associated labels, descriptions, and errors.
- Dialog focus is trapped and returned to the invoking control.
- Status, error, and success updates are announced appropriately.
- Icon-only controls have accessible names.
- Color is not the only status indicator.
- Tables retain meaningful headers and provide a usable narrow-screen alternative when needed.
- Cashier shortcuts must not override normal text editing or assistive-technology behavior.

### 9.3 Keyboard and scanner behavior

- Search and primary cashier quantity/payment actions need deliberate focus order.
- Scanner handling must be tested with the actual device before timing, prefix, suffix, or terminator assumptions become contract requirements.
- A scan must not trigger checkout or another destructive action.
- Duplicate scans follow a documented cart rule and provide immediate feedback.
- Manual search remains available when the scanner is unavailable.

#### FE-19 observed Release 1 scanner profile

The physical Release 1 scanner was observed on 2026-08-27 before FE-19 implementation:

- Model/variant: E81W, 1D wireless, no stand, non-Bluetooth, using its USB dongle.
- Windows identity: `SI USB`, USB `VID_0483` / `PID_0115`; the receiver exposes a HID keyboard and a serial `COM4` interface. FE-19 uses only the keyboard-wedge input.
- Observed barcode: EAN-13 `8998824554842`; every capture delivered the complete 13 digits in order.
- Prefix/modifiers: none observed.
- Suffix/terminator: one `Enter` / carriage-return key after every scan; no Tab or additional suffix was observed.
- Six captured scan durations, including the terminator, ranged from 16.825 ms to 21.651 ms. The largest observed gap between characters within a scan was 13.223 ms.
- In the deliberate rapid-scan run, three scans remained separate and complete. The observed terminator-to-next-scan gaps were 443.197 ms and 435.157 ms.
- The measurements were captured on the `VR-PC` workstation. Store-laptop CPU/RAM specifications are not an FE-19 input, but the same physical-input, focus, browser, and rapid-scan checks must still pass on the store laptop before FE-19 is marked fully verified.
- A live `/cashier` check on `VR-PC` confirmed that the physical E81W sequence uses the exact item-detail lookup, renders normalized not-found feedback for unregistered `8998824554842`, preserves the focused manual-search field, leaves the cart unchanged, and exposes no checkout action.
- After registering active zero-stock test item `8998824554842` (`Tes Scanner E81W`), five consecutive physical scans on `VR-PC` produced one cart line at quantity `5`, announced the FE-18 duplicate increment rule, kept search focused and empty, rendered STORE zero only as advisory availability, and exposed no checkout action.
- Recognized scans are queued in physical order before the item-detail lookup and FE-18 add path, so a slow lookup for one distinct SKU cannot make later cart lines appear first.

The adapter may use a 30 ms maximum inter-key gap for this Release 1 device profile. This is a device-informed tolerance above the observed 13.223 ms maximum, not a value inferred from the seller's unrelated `100 scans/sec` decoding specification. Supporting a different transport or device profile requires new observations rather than widening this threshold speculatively.

### 9.4 Responsive desktop behavior

Release 1 prioritizes the store laptop while remaining usable at narrower desktop/tablet widths. Domain PRs must test their touched layout at representative wide and narrow widths. Avoid global responsive sweeps unrelated to the workflow.

## 10. Reuse guidance

Preserve and improve useful existing assets where their behavior fits the contract:

- shared Axios API wrapper;
- feature-oriented Zustand stores;
- route protection and layout building blocks;
- reusable dialogs, inputs, buttons, tables, alerts/snackbars, and loading indicators;
- current Indonesian formatters and theme tokens where correct;
- Vitest/React Testing Library render utilities.

Reuse is not mandatory when an existing component encodes a legacy contract, inaccessible interaction, or unsafe transaction behavior. Prefer local extraction after a repeated pattern is proven over creating a global abstraction in advance.

FE-26 completed the quantity-entry reuse checkpoint. `BloomQuantityField` preserves controlled editing strings, accepts comma/dot drafts, labels UOM, and performs exact decimal-string/BigInt ±1 stepping. Receipt and FE-18 use it with their own validation, minimum/zero policy, commit/focus behavior, and request mapping. FE-13 target CORRECTION permits zero and owns absolute-target/direction semantics; the adjustment workflow is not migrated by FE-26. The legacy `BloomInputNumber` is not used for receipt creation.

## 11. Explicit Release 1 exclusions

- TypeScript migration or mixed JavaScript/TypeScript conversion program.
- Zustand replacement or global state-management migration.
- Mandatory TanStack Query adoption or query-key architecture.
- Router or URL restructuring without a domain need.
- Whole-application shell rewrite.
- Global design-system, lint, formatting, accessibility, or responsive sweep.
- UOM conversion, packaging hierarchies, or configurable UOM vocabulary.
- Customer credit.
- Supplier prepayment/credit or multi-receipt payment allocation.
- React Native implementation.
- Frontend-owned financial or inventory calculations.

TypeScript and broader infrastructure changes may be evaluated after Release 1 based on measured maintenance value. They are not hidden prerequisites for feature delivery.

## 12. Known backend gates and unresolved decisions

The following must be verified or completed before their dependent frontend PRs proceed:

- Decimal quantity DTOs and services across item, sale, receipt, adjustment, transfer, and movement APIs.
- Removal or explicit deprecation plan for legacy aggregate `stockQuantity`.
- UOM vocabulary alignment: the current backend enum also exposes `GRAM`, `MILLILITER`, `CENTIMETER`, and `ROLL`, while the confirmed Release 1 frontend vocabulary remains `PIECE`, `METER`, `KILOGRAM`, and `LITER`.
- Atomic item opening-balance contract.
- Stock movement history endpoint/read model is available at `GET /api/stock-movements`; its response includes item/UOM, decimal quantity, location, movement/source type, reference, actor, timestamp, and paging/filter semantics.
- Stock transfer is available at `POST /api/stock-transfers`; it atomically records source/destination movements, enforces decimal UOM/fraction and availability rules, accepts `Idempotency-Key`, and returns a stable transfer code and line result.
- Cash-session current/open endpoints are available at `GET /api/cash-sessions/current` and `POST /api/cash-sessions/open`; the agreed current-session contract returns HTTP 200 with `data: null` when no session is open, while the backend enforces global single-open uniqueness with a transaction lock and partial unique index and maps concurrent opening to a conflict.
- Cash-session close is available at `GET /api/cash-sessions/{sessionId}/expected-cash` and `POST /api/cash-sessions/{sessionId}/close`; close recalculates expected cash under the session transition lock, returns final actual/variance/status, and maps an already-closed race to a conflict. Read-only history is available at `GET /api/cash-sessions` with one-based paging, optional exact `OPEN`/`CLOSED` status filtering, fixed newest-first ordering, and detail at `GET /api/cash-sessions/{sessionId}`.
- Sale checkout is available at `POST /api/sales` with decimal STORE lines, `CASH`/`QRIS`, and required `Idempotency-Key`; the backend enforces an open session, owns prices/totals/change, replays an identical request, and conflicts on a changed same-key payload. `GET /api/sales/checkout-status` uses the same key and returns `COMPLETED` with the sale or `UNKNOWN` without mutating sale state.
- Actual scanner model, interface, suffix/terminator, and behavior under rapid scans.
- Printer endpoint success/error semantics in the target environment.
- Goods-receipt creation is available at `POST /api/goods-receipts` with required `Idempotency-Key`, stable `supplierCode`, `receivedDate` Instant, and decimal item/price/location lines. The service computes totals and posts receipt/movements atomically, replays identical requests, and conflicts on changed same-key payloads. `initialPayment` is optional; FE-26 omits it and renders returned total/paid/outstanding/status. The form requires an explicitly selected UTC offset rather than assuming a fixed store timezone.
- Goods-receipt read fields are implemented, but the fixed business/store timezone for converting calendar-day filters to the endpoint's `Instant` boundaries remains undefined.
- Single-receipt payment is available at `POST /api/goods-receipts/{code}/payments` with required `Idempotency-Key`. It serializes identical replay, rejects changed payloads/overpayment, and links only CASH to the globally open session. Its response is the payment record; the existing receipt detail GET supplies updated paid/outstanding/status. CASH paidAt cannot predate session opening. The current payment service and newer V18 migration runbook define reasoned, audit-preserving voids and reject CASH void after the original session closes; reversal UI remains outside FE-28. Historical unresolved-payment text in the main backend domain document still needs editorial alignment with this implementation/supplement.
- Expense list/create contracts are verified: authenticated `GET /api/expenses` reads all sessions with one-based paging and fixed newest-first ordering, without filters; `POST /api/expenses` requires positive `expectedCashSessionId`, positive decimal `amount`, fixed `category`, optional `description` (required for OTHER), and `Idempotency-Key`. The service atomically records the expense and movement against that specified open session, replays identical requests before session eligibility checks, and conflicts on changed same-key content or session. No key-status lookup exists; FE-29 uses exact-request/key POST recovery with its original session ID and checks the returned session. Old uncertain recovery without the confirmed ID must be manually reconciled; deployment requires all serving backend instances to enforce this contract. Detail/void UI remains outside FE-29.
- FE-30 expense void/reversal implementation is present, but merge is `BLOCKED` on immutable recovery identity (see below). The expense eligibility gate cleared on 2026-09-11: expense responses now expose `canVoid` and `voidBlockReason` (`ALREADY_VOIDED` / `CASH_SESSION_CLOSED`). History displays those decisions, and a fresh detail read precedes an accessible reasoned confirmation. One expense/reason is retained for duplicate-safe recovery across navigation/reload, isolated to its originating account. Stored void audit and original-session cash values come from backend responses; refresh failures retain confirmed results. No deletion, posted-fact editing, local drawer calculation, sale correction, or supplier-payment correction is included. See [FE-30 contract and verification](../plans/fe-30-expense-reversal.md). The readability follow-up expands store objects and callbacks and records the multiline convention in `AGENTS.md`; the original behavior was unchanged by that formatting-only follow-up.
- Future post-close correction workflows remain outside Release 1; the implemented supplier-payment rule rejects voiding CASH payments from closed sessions.
- Dashboard read models required by Release 1.

Until these are resolved, the frontend roadmap must name the gate and avoid inventing the contract.

## 13. Definition of done for a frontend domain PR

FE-30 review follow-up: implementation is present, but status is now `BLOCKED` for merge on recovery identity. `/api/auth/current` exposes username/name/role only, while backend user deletion/recreation allows username reuse. A stable, non-recycled authenticated account identifier and safe legacy-recovery handling are required before production approval. The frontend fixes now invalidate history only for changed backend state, compare immutable expense facts without decimal rounding, retain confirmed voids against stale reads, and explain the one-unresolved-reversal-per-tab policy. See [evidence and review disposition](../plans/fe-30-expense-reversal.md#review-disposition-and-remaining-backend-prerequisite).

A Release 1 frontend PR is done when:

- it changes one business domain and stays within the agreed review size;
- current behavior and target behavior are not conflated;
- relevant backend contracts were inspected and match the implementation;
- no authoritative business calculation was moved into the frontend;
- loading, error, empty, conflict, pending, success, retry, and confirmation states are covered where relevant;
- keyboard, focus, accessibility, and touched responsive behavior are verified;
- Indonesian money, quantity, date, and status display is correct for the touched workflow;
- targeted tests cover critical interaction and request behavior;
- the existing test suite and production build pass;
- targeted lint checks pass for touched code, or existing unrelated failures are documented;
- no unrelated dependency, formatting, routing, state-management, or migration work is included.
