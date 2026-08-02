# Bloom Release 1 Frontend Roadmap

Status: Active planning  
Last updated: 2026-07-30

## Purpose

This document tracks the planned frontend pull requests for Bloom Release 1.

It defines:

- Implementation order.
- One-domain-per-PR boundaries.
- Backend readiness gates.
- Recommended model and reasoning effort.
- Task prompt content.
- Expected output.
- Status and dependencies.

The frontend behavior contract is defined in:

`docs/architecture/release-1-frontend-contract.md`

The backend Release 1 domain contract remains authoritative for business rules
and calculations.

## Status values

| Status | Meaning |
|---|---|
| `PLANNED` | Scope is defined but work has not started |
| `BLOCKED` | Required product decision or backend contract is unavailable |
| `IN_PROGRESS` | Implementation is actively being developed |
| `REVIEW` | Implementation is ready for owner review |
| `MERGED` | PR has been reviewed and merged |
| `DEFERRED` | Explicitly moved outside the current Release 1 sequence |

Do not infer status from local uncommitted files. The repository owner or merged
PR should update status explicitly.

## Review-size limits

Each PR should normally:

- Change one frontend domain.
- Cover one route family or one coherent interaction.
- Stay near 250–500 logical production lines.
- Stay below approximately 600 logical production lines.
- Change no more than approximately 12 production files.
- Include focused tests in the same PR.
- Avoid unrelated renames, formatting, and JavaScript-to-TypeScript conversion.

If a task exceeds these limits, stop and propose a split before implementation.

Generated lockfile changes and test fixtures do not count as production files,
but their purpose must be explained.

## Model selection

Use:

- `gpt-5.6-sol` with high reasoning for:
    - Financial mutations.
    - Stock mutations.
    - Idempotency.
    - Scanner integration.
    - API architecture.
    - Cash-session behavior.
    - Complex contract migrations.

- `gpt-5.6-terra` with high reasoning for:
    - Read-only lists and details.
    - Straightforward CRUD.
    - Navigation/layout.
    - Dashboard presentation.
    - Test harness and UI-state work.

If a financial or stock mutation encounters an unclear contract, the agent must
stop and report the blocker rather than compensate with frontend logic.

## Base implementation prompt

Use this prompt before the PR-specific prompt:

```text
Act as a Lead Frontend Architect and Senior UX Engineer specializing in React,
TypeScript, POS applications, accessibility, responsive desktop interfaces, and
frontend/backend contract design.

Frontend repository:
Bloom UI repository root.

Backend repository:
Bloom backend repository root, for read-only API reference unless the task
explicitly authorizes backend changes.

Before editing:
1. Read AGENTS.md.
2. Read docs/architecture/release-1-frontend-contract.md.
3. Read docs/plans/release-1-frontend-roadmap.md.
4. Inspect Git status and preserve all existing work.
5. Inspect the relevant frontend routes, pages, stores, API modules, utilities,
   and shared components.
6. Inspect the exact backend controller, request DTO, response DTO, validation,
   service behavior, and error contract.

Implement only the PR domain and scope described below.

Constraints:
- Do not invent missing endpoints or DTO fields.
- Do not modify backend files.
- Do not perform unrelated refactoring, formatting, or dependency upgrades.
- Do not authoritatively calculate stock, sale totals, goods-receipt totals,
  supplier debt, payment status, cash change, or cash reconciliation.
- Keep the diff within the roadmap review-size limits.
- Preserve useful existing components.
- Use incremental TypeScript for new modules where practical, but do not
  mechanically convert unrelated files.
- Include accessible semantics, keyboard behavior, asynchronous states, and
  responsive laptop behavior for the touched workflow.
- Add focused tests.
- Do not commit, push, or open a PR unless explicitly requested.

If the required backend contract is missing or conflicts with the approved
Release 1 contract, stop before implementation and report:
- The missing or conflicting contract.
- The affected UX behavior.
- The minimum backend decision or endpoint needed.

At completion report:
- Outcome and user-visible behavior.
- Changed files and why.
- Backend contracts consumed.
- Tests and validation run.
- Screenshots for changed screens.
- Assumptions and blockers.
- Intentionally deferred work.
```

## PR overview

| PR | Frontend domain | Status | Depends on | Recommended model |
|---|---|---|---|---|
| FE-00 | Documentation baseline | `IN_PROGRESS` | None | `gpt-5.6-terra`, high |
| FE-01 | Test foundation | `PLANNED` | FE-00 | `gpt-5.6-terra`, high |
| FE-02 | Typed API/server-state foundation | `PLANNED` | FE-01 | `gpt-5.6-sol`, high |
| FE-03 | Transaction UI primitives | `PLANNED` | FE-01, FE-02 | `gpt-5.6-sol`, high |
| FE-04 | Authentication | `PLANNED` | FE-01, FE-02 | `gpt-5.6-sol`, high |
| FE-05 | Workspace shell/navigation | `PLANNED` | FE-04 | `gpt-5.6-terra`, high |
| FE-06 | Item read model | `PLANNED` | FE-02, FE-03 | `gpt-5.6-terra`, high |
| FE-07 | Item create/edit | `PLANNED` | FE-06 | `gpt-5.6-sol`, high |
| FE-08 | Stock movement history | `PLANNED` | FE-03, FE-06 | `gpt-5.6-terra`, high |
| FE-09 | Stock adjustment | `PLANNED` | FE-03, FE-08 | `gpt-5.6-sol`, high |
| FE-10 | Stock transfer | `PLANNED` | FE-03, FE-08 | `gpt-5.6-sol`, high |
| FE-11 | Current/open cash session | `PLANNED` | FE-02, FE-04, FE-05 | `gpt-5.6-sol`, high |
| FE-12 | Cash-session close/history | `PLANNED` | FE-11 | `gpt-5.6-sol`, high |
| FE-13 | Cashier scanner/cart | `BLOCKED` | FE-03, FE-05, FE-06, FE-11 | `gpt-5.6-sol`, high |
| FE-14 | Cashier checkout | `PLANNED` | FE-11, FE-13 | `gpt-5.6-sol`, high |
| FE-15 | Receipt printing | `PLANNED` | FE-14 | `gpt-5.6-terra`, high |
| FE-16 | Supplier master data | `PLANNED` | FE-02, FE-04, FE-05 | `gpt-5.6-terra`, high |
| FE-17 | Goods receipt | `PLANNED` | FE-03, FE-06, FE-16 | `gpt-5.6-sol`, high |
| FE-18 | Supplier payable views | `PLANNED` | FE-16, FE-17 | `gpt-5.6-terra`, high |
| FE-19 | Supplier payment | `PLANNED` | FE-11, FE-18 | `gpt-5.6-sol`, high |
| FE-20 | Expense list/create | `PLANNED` | FE-11 | `gpt-5.6-sol`, high |
| FE-21 | Expense void | `BLOCKED` | FE-20 | `gpt-5.6-sol`, high |
| FE-22 | Dashboard alignment | `PLANNED` | Core Release 1 domains | `gpt-5.6-terra`, high |

FE-13 remains blocked until scanner transport is known.

FE-21 may implement ordinary open-session void behavior once the backend contract
exists, but post-close correction must remain blocked until its policy is decided.

## FE-00 — Documentation baseline

Domain: Repository documentation  
Status: `IN_PROGRESS`

### Scope

- Add root `AGENTS.md`.
- Add the frontend Release 1 contract.
- Add this roadmap.
- Replace or extend the Vite-template README with project-specific navigation.
- Link the backend domain contract without duplicating it.

### Prompt

```text
Create the Bloom UI Release 1 documentation baseline only.

Add or update:
- AGENTS.md
- docs/architecture/release-1-frontend-contract.md
- docs/plans/release-1-frontend-roadmap.md
- README.md links to the relevant documentation

Do not change application code, dependencies, tests, build configuration, or
Git state beyond the documentation files. Preserve all existing implementation
work.
```

### Expected output

- Version-controlled documentation.
- Future tasks have clear required reading.
- No application behavior changes.

## FE-01 — Test foundation

Domain: Frontend quality platform  
Status: `PLANNED`

### Scope

- Vitest.
- jsdom.
- React Testing Library.
- user-event.
- Shared render helper.
- Test scripts.
- One smoke test.

### Prompt

```text
Establish a minimal frontend test foundation.

Add Vitest, jsdom, React Testing Library, user-event, and a reusable test render
helper compatible with the current MUI, Router, Zustand, and Vite setup.

Add test scripts and one representative smoke test. Do not change business
screens, repair the entire existing lint backlog, or rewrite existing components.

The harness must support asynchronous UI, keyboard interaction, dialogs, routing,
and mocked API requests.
```

### Expected output

- Passing smoke test.
- Reusable test helper.
- No business behavior changes.
- No mass lint or formatting changes.

## FE-02 — Typed API and server-state foundation

Domain: Frontend data platform  
Status: `PLANNED`

### Scope

- Incremental TypeScript support.
- TanStack Query.
- QueryClient provider.
- Normalized `ApiError`.
- Request cancellation.
- Query-key convention.
- Preserve existing JavaScript screens.

### Prompt

```text
Create the typed API and server-state foundation without migrating a business
domain.

Introduce incremental TypeScript support, TanStack Query, a normalized ApiError,
request cancellation, and a documented query-key convention.

Keep servlet-session cookies and the current authenticated API behavior.
Do not add domain DTOs whose backend contract is not final.
Do not migrate every Zustand store or screen.
Zustand should remain available for application and local UI state.

Ensure the existing JavaScript application still builds and runs.
```

### Expected output

- Domain-neutral typed API kernel.
- QueryClient wired into the application.
- Error-normalization and cancellation tests.
- No business-screen redesign.

## FE-03 — Transaction input/display primitives

Domain: Bloom design system  
Status: `PLANNED`

### Scope

- Decimal quantity input.
- Quantity display.
- Money display.
- UOM selector/label.
- Stock-location selector.
- Normalized decimal validation.

### Prompt

```text
Implement shared transaction input and display primitives only.

Create accessible components for:
- Decimal quantity input.
- Quantity display with UOM.
- Indonesian Rupiah display.
- UOM selection using PIECE, METER, KILOGRAM, and LITER.
- Stock-location selection using STORE and WAREHOUSE.

Retain editable decimal values as strings.
After removing insignificant trailing zeroes, reject normalized scale above four.
Never silently round.
When fractionalQuantityAllowed=false, reject non-whole normalized input.

Do not integrate the primitives into business screens in this PR.
Do not calculate document totals.
```

### Expected output

- Isolated reusable components.
- Unit, keyboard, and accessibility tests.
- No business-screen changes.

## FE-04 — Authentication

Domain: Identity/session authentication  
Status: `PLANNED`

### Scope

- Protected-route loading gate.
- Login error handling.
- Submit-pending protection.
- Deterministic logout.
- Responsive login.

### Prompt

```text
Stabilize authentication UX and protected routing.

Prevent protected route components from rendering or issuing domain requests
before the current-user request resolves.

Correct login error handling, add submission-pending protection, and make logout
navigation deterministic.

Use the existing backend servlet-session contract.
Do not add JWT support or invent role permissions.
Preserve the current login direction while making it responsive and accessible.
```

### Expected output

- Reliable login/logout/protected routes.
- Auth tests.
- No domain-screen changes.

## FE-05 — Workspace shell/navigation

Domain: Application shell  
Status: `PLANNED`

### Scope

- Focused cashier layout.
- Grouped back-office navigation.
- Workspace transition.
- Accessible collapsed navigation.
- Laptop responsiveness.

### Prompt

```text
Introduce separate cashier and back-office workspace layouts.

Cashier must have a focused layout with minimal navigation and an explicit path
to the back office.

Back office should group available routes under Overview, Inventory, Sales,
Suppliers, and Cash Management. Do not expose unfinished routes as completed
features.

Correct collapsed-navigation accessible names, semantic logout behavior, focus
handling, and laptop-width responsiveness.

Do not implement business features in this PR.
```

### Expected output

- Two route layouts.
- Preserved existing screens.
- Navigation/accessibility tests.
- Laptop-width screenshots.

## FE-06 — Item read model

Domain: Item catalogue/read model  
Status: `PLANNED`

### Backend gate

Item response provides:

- `stockStore`
- `stockWarehouse`
- `baseUnitOfMeasure`
- `fractionalQuantityAllowed`
- Movement/editability capability where needed

### Prompt

```text
Align item list and item detail with the Release 1 inventory read contract.

Remove reliance on legacy stockQuantity.
Display STORE and WAREHOUSE balances separately, base UOM, and fractional policy.

Migrate only item read/list server state to the typed query layer.
Preserve existing search, filters, pagination, detail, audit entry point, and
barcode action.

Do not change item create/edit behavior.
```

### Expected output

- Location-aware item list/detail.
- No legacy stock field in touched read paths.
- Query and accessibility tests.

## FE-07 — Item create/edit

Domain: Item catalogue/write model  
Status: `PLANNED`

### Backend gate

Backend supports:

- UOM.
- Fractional policy.
- STORE/WAREHOUSE opening quantities.
- Atomic opening-balance movements.
- Field editability after movements.

### Prompt

```text
Implement the Release 1 item create/edit workflow.

Add base UOM and fractionalQuantityAllowed.

Replace legacy stockQuantity with optional STORE and WAREHOUSE opening quantities
that the backend records as OPENING_BALANCE movements.

When movements exist, baseUnitOfMeasure and fractionalQuantityAllowed must be
read-only with a clear explanation.

Do not let ordinary item updates overwrite stock balances.
Preserve existing approved item-master behavior.
```

### Expected output

- Movement-backed item creation.
- No stock editing through ordinary update.
- Create/edit tests and screenshots.

## FE-08 — Stock movement history

Domain: Stock movement ledger  
Status: `PLANNED`

### Backend gate

Paginated movement endpoint exposes:

- Item.
- Location.
- Direction.
- Source.
- Quantity.
- Before/after balances.
- Actor.
- Timestamp.

### Prompt

```text
Implement a read-only stock movement history domain.

Add a back-office route and paginated table with filters for item, location,
source, direction, and date range.

Show quantity with UOM, before balance, after balance, source reference, actor,
and timestamp.

Add an item-scoped entry point from item detail while reusing the same query and
table components.

Do not add stock mutation controls.
```

### Expected output

- General and item-scoped movement views.
- Filter/query tests.
- Complete loading/error/empty states.

## FE-09 — Stock adjustment

Domain: Stock adjustment  
Status: `PLANNED`

### Backend gate

Manual and CSV contracts support decimal quantity and stock location.

### Prompt

```text
Align the existing stock-adjustment workflow with Release 1.

Add STORE/WAREHOUSE selection per line, decimal quantity input, UOM display,
backend validation errors, and reliable repeated-submission protection.

Update CSV parsing/template presentation only as required by the backend decimal
and location contract.

Preserve the existing manual/CSV tabs and correction confirmation.

Do not implement transfers or directly edit item balances.
```

### Expected output

- Location-aware adjustment flow.
- Preserved CSV workflow.
- Mutation and conflict tests.

## FE-10 — Stock transfer

Domain: Stock transfer  
Status: `PLANNED`

### Backend gate

One atomic transfer endpoint returns both movement references.

### Prompt

```text
Implement STORE-to-WAREHOUSE and WAREHOUSE-to-STORE stock transfer.

Provide item, source, destination, decimal quantity, source availability,
reason/reference, confirmation, pending state, and success result.

The frontend must not perform two independent stock requests.
Use one backend transfer request.

Handle insufficient stock and concurrency conflicts.
Do not modify the stock-adjustment domain.
```

### Expected output

- Atomic transfer workflow.
- Conflict handling.
- Transaction tests.

## FE-11 — Current/open cash session

Domain: Cash-session opening/current state  
Status: `PLANNED`

### Backend gate

Backend has current-session and open-session endpoints with global conflict errors.

### Prompt

```text
Implement current cash-session status and opening only.

Add persistent session status in the cashier workspace and Cash Management area.

When no session is open, provide an opening-cash dialog and open-session action.
When a session is open, display cashier, opening cash, and opened time.

Handle the backend global already-open conflict.

Do not implement closing or reconciliation.
```

### Expected output

- Current/open-session UI.
- Global conflict handling.
- No closing behavior.

## FE-12 — Cash-session close/history

Domain: Cash-session closing/history  
Status: `PLANNED`

### Backend gate

Backend returns the authoritative reconciliation breakdown.

### Prompt

```text
Implement cash-session closing and history.

Display backend-calculated opening cash, CASH sales, CASH supplier payments,
active expenses, expected closing cash, actual closing cash, and variance.

The user enters only actual counted closing cash.
Do not calculate expected cash or variance in the frontend.

Add session history/detail using the same response model.
Closed sessions must be visibly immutable.
```

### Expected output

- Server-authoritative close workflow.
- History/detail.
- Closed-state and mutation tests.

## FE-13 — Cashier scanner/cart

Domain: Cashier cart  
Status: `BLOCKED`

### Blocker

Confirm scanner:

- Model.
- Connection.
- Transport.
- Suffix/terminator.
- Browser-visible behavior.

### Prompt

```text
Implement only cashier product discovery, physical scanner integration, and cart
editing.

Use the confirmed scanner protocol.
Provide scanner-ready, success, not-found, duplicate-scan, and focus-recovery
behavior.

Use STORE availability only.
Support decimal cart quantities according to item UOM and fractional policy.
Treat final availability validation as backend-owned.

Do not implement checkout or payment submission.
```

### Expected output

- Stable physical scanner-to-cart behavior.
- Fractional cart editing.
- Scanner adapter boundary and tests.
- No checkout.

## FE-14 — Cashier checkout

Domain: Cashier checkout  
Status: `PLANNED`

### Backend gate

Backend defines:

- Final totals.
- CASH/QRIS behavior.
- Tender/change.
- Open-session enforcement.
- Idempotency.
- Price/stock/session conflicts.

### Prompt

```text
Implement cashier checkout and sale creation only.

Add CASH and QRIS selection.

For CASH, display backend-calculated total and change.
For QRIS, ensure zero physical-drawer effect.

Generate one stable idempotency key per checkout attempt and reuse it for safe
retry.

Handle duplicate-completed, insufficient-stock, changed-price, and session-closed
responses.

Clear the cart only after confirmed sale success.

Do not implement receipt printing.
```

### Expected output

- Server-authoritative checkout.
- Duplicate protection.
- Conflict recovery.
- No printing.

## FE-15 — Receipt printing

Domain: Receipt printing  
Status: `PLANNED`

### Backend gate

Backend print endpoint accepts a stable sale reference and returns clear status.

### Prompt

```text
Integrate backend-controlled receipt printing.

After sale success, print using the existing sale code and backend print endpoint.
Printing must never create or resubmit a sale.

If printing fails, preserve the successful sale, show a clear failure state, and
provide Retry Print.

Add explicit reprint from sale history/detail.

Do not use window.print as the primary receipt path.
Do not add PDF generation unless separately approved.
```

### Expected output

- Safe initial print.
- Retry and reprint.
- Printer-failure tests.
- No duplicate sale risk.

## FE-16 — Supplier master data

Domain: Supplier catalogue  
Status: `PLANNED`

### Backend gate

Supplier CRUD/deactivation endpoints are available.

### Prompt

```text
Implement supplier master-data management only.

Add supplier list, search, detail, create, edit, and deactivate using the exact
backend DTO.

Include backend-supported name, code, contact, address, active state, and audit
information.

Do not show or calculate supplier debt in this PR.
```

### Expected output

- Supplier CRUD.
- Validation and query invalidation.
- No payable behavior.

## FE-17 — Goods receipt

Domain: Goods receipt  
Status: `PLANNED`

### Backend gate

Backend supports:

- Supplier code.
- Decimal quantity.
- Purchase-price snapshot.
- Stock location.
- Server-calculated totals.
- Payable outcome.

### Prompt

```text
Replace the current goods-receipt create/detail contract.

Use structured supplier selection.
Each line includes item, decimal quantity, purchase price, and stock location.
Display UOM and location balance for context.

The backend calculates line subtotals, receipt total, amount paid, and outstanding.

The frontend must not submit authoritative receipt totals.

On success show receipt code and backend financial result.

Do not implement supplier payment entry.
```

### Expected output

- Working receipt creation/detail.
- Server totals.
- No current broken payload.
- Receipt contract tests.

## FE-18 — Supplier payable views

Domain: Supplier accounts payable/read model  
Status: `PLANNED`

### Backend gate

Backend exposes supplier and receipt payable summaries.

### Prompt

```text
Implement read-only supplier accounts-payable views.

Show backend-returned receipt total, total paid, outstanding, payment history, and
settlement condition.

Provide supplier/date/settlement filters where supported.

Do not derive outstanding values with frontend arithmetic.
Do not implement payment submission.
```

### Expected output

- Read-only payable summary/detail.
- Server-owned balances.
- Payment entry point only.

## FE-19 — Supplier payment

Domain: Supplier payment  
Status: `PLANNED`

### Backend gate

One-receipt payment endpoint supports idempotency and session rules.

### Prompt

```text
Implement one-receipt supplier payment.

Allow partial payment using CASH, BANK_TRANSFER, or QRIS.
Reject amount greater than backend-provided outstanding.

CASH requires the current open cash session and affects drawer cash.
BANK_TRANSFER and QRIS do not affect drawer cash.

Use one stable idempotency key per submission.
Refresh payable and session summaries after success.

Do not implement multi-receipt allocation, overpayment, supplier credit,
prepayment, redistribution, or payment reversal.
```

### Expected output

- Simple partial payment.
- Correct CASH/session behavior.
- Duplicate protection.
- No advanced allocation.

## FE-20 — Expense list/create

Domain: Unexpected expense  
Status: `PLANNED`

### Backend gate

Expense list/create endpoint and category enum are available.

### Prompt

```text
Implement unexpected expense listing and recording.

An expense requires the current open cash session.

Add amount, approved backend category, description, confirmation, pending
protection, success result, and session-summary refresh.

Do not offer free-form categories.
Do not calculate expected drawer cash in the frontend.
Do not implement voiding.
```

### Expected output

- Expense list/create.
- Open-session gate.
- No void behavior.

## FE-21 — Expense void

Domain: Expense correction  
Status: `BLOCKED`

### Backend gate

Backend defines ordinary void and post-close behavior.

### Prompt

```text
Implement full expense void only.

Never delete or edit the original expense.
Require a void reason.
Show the voided audit state after success.

Use the backend response for drawer effect and session summary.

Do not implement partial void.
Do not invent post-close correction behavior.
If the backend rejects correction for a closed session, present its actionable
error.
```

### Expected output

- Auditable full void.
- No delete.
- Closed-session behavior follows backend.

## FE-22 — Dashboard alignment

Domain: Dashboard/reporting  
Status: `PLANNED`

### Backend gate

Stable dashboard read model is available.

### Prompt

```text
Align the dashboard with implemented Release 1 workflows.

Use backend-provided summaries for sales, location-aware low stock, open cash
session, active expenses, supplier payable, and recent transactions.

Add explicit loading, error, retry, empty, and last-updated states.

Do not derive financial totals or reconciliation in the frontend.

Preserve useful existing cards and charts.
Hide widgets whose backend meaning is not stable.
```

### Expected output

- Release 1-relevant dashboard.
- Reliable screen states.
- Preserved reusable components.
- No client-owned financial calculation.

## Execution order

```text
Documentation:
FE-00

Foundation:
FE-01 → FE-02 → FE-03 → FE-04 → FE-05

Inventory:
FE-06 → FE-07 → FE-08 → FE-09 → FE-10

Cash sessions:
FE-11 → FE-12

Cashier:
FE-13 → FE-14 → FE-15

Suppliers and purchasing:
FE-16 → FE-17 → FE-18 → FE-19

Expenses:
FE-20 → FE-21

Release overview:
FE-22
```

A step must pause when its backend gate is unavailable. The result of a blocked
step should be a concise contract checklist, not mocked production behavior or a
guessed DTO.

## Deferred follow-up PRs

These should not be added to Release 1 until their policies are approved:

- Supplier-payment reversal.
- Sale void/refund/return.
- Goods-receipt cancellation/return.
- Post-close expense correction.
- Cash-session reopening.
- Alternate-UOM/package conversion.
- Receipt PDF fallback.
- React Native client.