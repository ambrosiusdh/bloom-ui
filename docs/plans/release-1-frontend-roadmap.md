# Bloom Release 1 Frontend Roadmap

Last updated: 2026-08-27

## 1. How to use this roadmap

This roadmap converts the Release 1 frontend contract into small, reviewable PRs. It assumes the current JavaScript React/Vite/Axios/Zustand application remains the Release 1 baseline.

Before starting any PR:

1. Read `AGENTS.md`.
2. Read `docs/architecture/release-1-frontend-contract.md`.
3. Inspect Git status and preserve existing work.
4. Inspect the current frontend implementation for the named domain.
5. When an API is involved, inspect the backend controller, request DTO, response DTO, validation, service, and Release 1 backend domain contract.
6. Stop if the listed backend gate is not satisfied; do not invent endpoints, fields, or business rules.

Every implementation PR must:

- cover one frontend business domain;
- target roughly 250–500 logical changed lines and stay below 600 unless the reviewer approves a split exception;
- normally touch no more than about 12 production files;
- avoid unrelated formatting, dependency, router, store, API, design-system, TypeScript, accessibility, or responsive migrations;
- use backend-confirmed values for stock and financial outcomes;
- include focused tests and validation proportional to transaction risk.

“Logical changed lines” excludes lockfile churn and generated output. No PR in this roadmap authorizes a commit or push by an agent.

## 2. Status and execution classes

### Status

- `MERGED`: present in the repository history.
- `PLANNED`: not started; it may depend on earlier planned work but has no known external blocker.
- `IN_PROGRESS`: implementation is present on the active branch and not yet ready for review.
- `REVIEW`: implementation is awaiting or undergoing review.
- `BLOCKED`: a named decision, hardware fact, or backend contract is missing.
- `DEFERRED`: intentionally outside Release 1.

### Execution class

- `DIRECT_IMPLEMENTATION`: scope and contract are narrow enough to implement after repository inspection without a separate planning chat.
- `PLAN_RECOMMENDED`: use one short read-only planning pass because the workflow has meaningful interaction or transaction choices. The approved plan is followed by one implementation pass; this is not three prompts per PR.
- `BLOCKED`: do not plan implementation details or write code until the stated gate clears. After it clears, reclassify the PR as direct or plan-recommended.

The contract explains stable product and architecture rules. A planning pass is only useful when a particular PR still has multiple valid implementation shapes, risky state transitions, or uncertain file boundaries. It must not repeat decisions already fixed by the contract.

## 3. Verified baseline and re-baseline decisions

- Git history shows the original documentation baseline and Vitest/React Testing Library harness were merged together through the first frontend PR. They are recorded separately below as `FE-00` and `FE-01` for roadmap traceability.
- The current source is JavaScript/JSX. TypeScript work is deferred beyond Release 1.
- Existing Axios, Zustand, React Router, Material UI, and shared components are preserved.
- Vitest, React Testing Library, jsdom, and the shared render helper are available.
- Current frontend implementations still contain legacy `stockQuantity`, integer-only quantity handling, local sale-total/payment assumptions, and incomplete async/error behavior.
- Current backend code does not yet expose all Release 1 cash-session, supplier, payable/payment, expense, sale-idempotency, and dashboard contracts.
- A backend print controller exists, so reprinting an already-created sale can proceed independently after its current contract is verified. Automatic post-checkout printing remains gated by the target checkout flow.

## 4. Delivery overview

| PR | Domain | Status | Execution | Depends on | Recommended model |
| --- | --- | --- | --- | --- | --- |
| FE-00 | Frontend contract and roadmap baseline | MERGED | DIRECT_IMPLEMENTATION | — | `gpt-5.6-terra`, high |
| FE-01 | Frontend test foundation | MERGED | DIRECT_IMPLEMENTATION | FE-00 | `gpt-5.6-terra`, high |
| FE-02 | Shared API error normalization | PLANNED | DIRECT_IMPLEMENTATION | FE-01 | `gpt-5.6-terra`, high |
| FE-03 | Authentication reliability | PLANNED | DIRECT_IMPLEMENTATION | FE-02 | `gpt-5.6-terra`, high |
| FE-04 | Cashier-focused layout | IMPLEMENTED | DIRECT_IMPLEMENTATION | FE-01 | `gpt-5.6-terra`, high |
| FE-05 | Back-office navigation accessibility | IMPLEMENTED | DIRECT_IMPLEMENTATION | FE-04 | `gpt-5.6-terra`, high |
| FE-06 | Item-category reliability | IMPLEMENTED | DIRECT_IMPLEMENTATION | FE-02 | `gpt-5.6-terra`, high |
| FE-07 | Backend receipt reprint | IMPLEMENTED | DIRECT_IMPLEMENTATION | FE-02 | `gpt-5.6-terra`, high |
| FE-08 | Current dashboard reliability | IMPLEMENTED | DIRECT_IMPLEMENTATION | FE-02 | `gpt-5.6-terra`, high |
| FE-09 | Item inventory read model | IMPLEMENTED | DIRECT_IMPLEMENTATION | FE-02 | `gpt-5.6-terra`, high |
| FE-10 | Item creation and opening balance | IMPLEMENTED | DIRECT_IMPLEMENTATION | FE-09 | `gpt-5.6-sol`, high |
| FE-11 | Item editing and movement locks | IMPLEMENTED | DIRECT_IMPLEMENTATION | FE-09 | `gpt-5.6-sol`, high |
| FE-12 | Stock movement history | IMPLEMENTED | DIRECT_IMPLEMENTATION | FE-09 | `gpt-5.6-terra`, high |
| FE-13 | Stock adjustment | BLOCKED | BLOCKED | FE-12 | `gpt-5.6-sol`, high |
| FE-14 | Stock transfer | IMPLEMENTED | PLAN_RECOMMENDED | FE-12 | `gpt-5.6-sol`, high |
| FE-15 | Current/open cash session | IMPLEMENTED | PLAN_RECOMMENDED | FE-03 | `gpt-5.6-sol`, high |
| FE-16 | Cash-session close and reconciliation | IMPLEMENTED | PLAN_RECOMMENDED | FE-15 | `gpt-5.6-sol`, high |
| FE-17 | Cash-session history and detail | IMPLEMENTED | DIRECT_IMPLEMENTATION | FE-16 | `gpt-5.6-terra`, high |
| FE-18 | Cashier search and cart | IMPLEMENTED | PLAN_RECOMMENDED | FE-09, FE-15 | `gpt-5.6-sol`, high |
| FE-19 | Physical scanner integration | BLOCKED | BLOCKED | FE-18 | `gpt-5.6-sol`, high |
| FE-20 | Sale checkout submission | BLOCKED | BLOCKED | FE-18 | `gpt-5.6-sol`, xhigh |
| FE-21 | Post-checkout print and recovery | BLOCKED | BLOCKED | FE-20, FE-07 | `gpt-5.6-sol`, high |
| FE-22 | Sales history target alignment | BLOCKED | BLOCKED | FE-20 | `gpt-5.6-terra`, high |
| FE-23 | Supplier list and detail | BLOCKED | BLOCKED | FE-02 | `gpt-5.6-terra`, high |
| FE-24 | Supplier create/edit/deactivate | BLOCKED | BLOCKED | FE-23 | `gpt-5.6-terra`, high |
| FE-25 | Goods-receipt list and detail | BLOCKED | BLOCKED | FE-09, FE-23 | `gpt-5.6-sol`, high |
| FE-26 | Goods-receipt creation | BLOCKED | BLOCKED | FE-25 | `gpt-5.6-sol`, xhigh |
| FE-27 | Supplier payable views | BLOCKED | BLOCKED | FE-25 | `gpt-5.6-sol`, high |
| FE-28 | Single-receipt supplier payment | BLOCKED | BLOCKED | FE-15, FE-27 | `gpt-5.6-sol`, xhigh |
| FE-29 | Unexpected expense list/create | BLOCKED | BLOCKED | FE-15 | `gpt-5.6-sol`, high |
| FE-30 | Unexpected expense void/reversal | BLOCKED | BLOCKED | FE-29 | `gpt-5.6-sol`, high |
| FE-31 | Release 1 dashboard read models | BLOCKED | BLOCKED | FE-17, FE-22, FE-27, FE-29 | `gpt-5.6-sol`, high |

`PLANNED` means the PR can be scheduled in dependency order after the required fresh inspection. It does not mean the existing screen is complete or that an unfinished dependency can be skipped.

## 5. Copy-ready PR scopes

### FE-00 — Frontend contract and roadmap baseline

- **Domain:** Documentation governance.
- **Status:** `MERGED` (Git history; historically bundled with FE-01).
- **Execution class:** `DIRECT_IMPLEMENTATION`.
- **Dependencies:** None.
- **Backend gate:** Backend Release 1 domain plan available for reference.
- **User-visible change:** None.
- **Exact scope:** Add `AGENTS.md`, the frontend Release 1 contract, and the frontend roadmap; record backend authority and incremental PR rules.
- **Out of scope:** Product implementation, dependency changes, application code, Git publication.
- **Recommended model:** `gpt-5.6-terra`, high reasoning.
- **Expected output:** Documentation that makes future tasks self-orienting and distinguishes current behavior from planned Release 1 behavior.
- **Validation:** Re-read all documents; verify links/paths and Git diff; confirm no production files changed.
- **Block condition:** Missing confirmed Release 1 product direction.
- **Split trigger:** If documentation work also changes tooling or application code, split those changes into another PR.

**Copy-ready implementation prompt**

> Re-baseline Bloom UI documentation only. Read `AGENTS.md`, inspect the frontend and backend Release 1 contracts, and update only the explicitly authorized documentation files. Preserve the current JavaScript stack, make backend authority explicit, separate evidence from planned behavior, and provide a small one-domain-per-PR roadmap. Do not modify application code, dependencies, Git state, or generated files. Re-read the documents and validate the final diff.

### FE-01 — Frontend test foundation

- **Domain:** Frontend testing infrastructure.
- **Status:** `MERGED` (Git history; historically bundled with FE-00).
- **Execution class:** `DIRECT_IMPLEMENTATION`.
- **Dependencies:** FE-00.
- **Backend gate:** None.
- **User-visible change:** None.
- **Exact scope:** Configure Vitest/jsdom, add React Testing Library dependencies and setup, provide a shared render wrapper for current providers, and add one representative smoke test.
- **Out of scope:** Broad screen test coverage, application refactors, TypeScript, alternate test runners, CI redesign.
- **Recommended model:** `gpt-5.6-terra`, high reasoning.
- **Expected output:** A passing minimal test harness reusable by later domain PRs.
- **Validation:** Run the test suite and production build; confirm the helper renders routing/theme/snackbar context.
- **Block condition:** Existing dependency versions cannot support the selected compatible test setup.
- **Split trigger:** If application components require refactoring merely to make the harness work, keep that refactor out of this PR.

**Copy-ready implementation prompt**

> Add a minimal JavaScript test foundation to Bloom UI. Preserve the current Vite/React architecture. Configure Vitest with jsdom, React Testing Library setup, a shared render helper for existing providers, and one smoke test proving the helper works. Do not convert files to TypeScript, refactor product screens, change routing/state architecture, or add broad test coverage. Run tests and the production build, and report unrelated existing failures separately.

### FE-02 — Shared API error normalization

- **Domain:** HTTP/API boundary.
- **Status:** `PLANNED`.
- **Execution class:** `DIRECT_IMPLEMENTATION`.
- **Dependencies:** FE-01.
- **Backend gate:** Current backend error responses and authentication status codes must be inspected; no new endpoint is required.
- **User-visible change:** Screens can show more consistent validation, conflict, session, and unexpected-error messages as later PRs adopt the normalized shape.
- **Exact scope:** Add a small normalized error shape at the existing Axios boundary, preserve current auth redirect/loader behavior, and add focused tests for representative status/network cases.
- **Out of scope:** New API client, TanStack Query, cancellation framework, global store migration, screen-by-screen error UI conversion, backend changes.
- **Recommended model:** `gpt-5.6-terra`, high reasoning.
- **Expected output:** Existing API calls reject with a documented stable shape containing status/category/message and safe validation details where available.
- **Validation:** Focused API tests, full test suite, production build, targeted lint for touched files.
- **Block condition:** Backend error payloads are too inconsistent to normalize without an agreed minimum contract; document examples and stop.
- **Split trigger:** If more than the API wrapper, its tests, and one immediate compatibility consumer require meaningful changes, defer consumer migrations.

**Copy-ready implementation prompt**

> Implement FE-02 in Bloom UI. First read `AGENTS.md`, the frontend contract, and this roadmap; inspect Git status and the existing Axios wrapper. Inspect representative backend error handling. Introduce the smallest JavaScript error normalization needed to distinguish validation, authentication, authorization, not-found, conflict, network, and unexpected failures while preserving existing behavior. Add focused tests. Do not add dependencies, TypeScript, TanStack Query, a new API layer, or broad screen migrations. Run tests, build, and targeted lint; report the exact changed files and any contract uncertainty.

### FE-03 — Authentication reliability

- **Domain:** Authentication/session entry.
- **Status:** `PLANNED`.
- **Execution class:** `DIRECT_IMPLEMENTATION`.
- **Dependencies:** FE-02.
- **Backend gate:** Existing login and current-user/session behavior verified against auth controller/DTO/service.
- **User-visible change:** Protected content no longer flashes before auth resolution; login has clear pending and error behavior and resists repeated submission.
- **Exact scope:** Correct initial auth gating, login pending/disabled behavior, normalized error display, focus after failure, and safe redirect behavior; add interaction tests.
- **Out of scope:** Roles/permissions redesign, token-strategy replacement, new auth endpoint, navigation redesign, unrelated forms.
- **Recommended model:** `gpt-5.6-terra`, high reasoning.
- **Expected output:** Deterministic logged-out, resolving, authenticated, login-failure, and session-expired states.
- **Validation:** Auth component/store tests, keyboard/focus check, full test suite, build, targeted lint.
- **Block condition:** Frontend cannot determine authenticated state from the implemented backend behavior without a new contract.
- **Split trigger:** If role-based authorization is required, create a separate future authorization PR.

**Copy-ready implementation prompt**

> Implement FE-03 authentication reliability only. Read the required docs, inspect Git status, and verify the backend auth controller/DTO/service. Fix protected-route initial gating and the login request lifecycle using the existing JavaScript, Axios, Zustand, and router patterns. Cover pending, duplicate click, normalized failure, session expiry, focus, and redirect behavior with focused tests. Do not redesign permissions, replace token storage, restructure routes, or touch unrelated screens. Validate tests, build, and targeted lint.

### FE-04 — Cashier-focused layout

- **Domain:** Cashier workspace shell.
- **Status:** `IMPLEMENTED`.
- **Execution class:** `DIRECT_IMPLEMENTATION`.
- **Dependencies:** FE-01.
- **Backend gate:** None; this PR uses current routes and placeholder-safe UI only.
- **User-visible change:** `/cashier` presents a focused working area with reduced back-office distraction and a clear route back.
- **Exact scope:** Adapt existing layout composition for the cashier route, preserve its URL, provide accessible navigation escape and responsive desktop layout, and test route/layout behavior.
- **Out of scope:** Cash session, cart behavior, scanning, checkout, global shell rewrite, route migration, visual redesign of back-office screens.
- **Recommended model:** `gpt-5.6-terra`, high reasoning.
- **Expected output:** A reusable route-level cashier layout boundary that does not imply unimplemented cashier features work.
- **Validation:** Routing/render tests; keyboard/focus and wide/narrow desktop checks; full tests and build.
- **Block condition:** Current layout cannot be composed per route without a broad router rewrite; propose a smaller boundary and stop.
- **Split trigger:** If shared layout changes alter back-office navigation behavior, leave that work for FE-05.

**Copy-ready implementation prompt**

> Implement FE-04 only: a focused layout for the existing `/cashier` route. Preserve current JavaScript, React Router, URLs, theme, and reusable layout components. Reduce unrelated navigation in cashier mode, keep an accessible way back to back office, and make the touched layout usable at wide and narrow desktop widths. Add focused route/layout tests. Do not implement cart, scanner, session, checkout, global navigation redesign, or route migration. Run tests and build and report visual/keyboard checks.

### FE-05 — Back-office navigation accessibility

- **Domain:** Back-office navigation.
- **Status:** `IMPLEMENTED`.
- **Execution class:** `DIRECT_IMPLEMENTATION`.
- **Dependencies:** FE-04.
- **Backend gate:** None; only implemented routes may be active destinations.
- **User-visible change:** Existing back-office destinations are grouped and easier to navigate by mouse and keyboard without exposing future placeholders as completed features.
- **Exact scope:** Improve labels/grouping/active state/focus for existing navigation, preserve URLs, and make responsive open/close behavior accessible.
- **Out of scope:** Adding future domain screens, router restructuring, permissions, cashier internals, global design-system work.
- **Recommended model:** `gpt-5.6-terra`, high reasoning.
- **Expected output:** Clear navigation for current dashboard, inventory-related, sales, receipt, and adjustment routes.
- **Validation:** Navigation tests, keyboard/focus checks, current-route active-state checks, responsive desktop checks, tests/build/lint.
- **Block condition:** A destination's current status cannot be represented honestly without product clarification; omit it rather than inventing behavior.
- **Split trigger:** If a new destination requires its own screen or API, move it to that domain PR.

**Copy-ready implementation prompt**

> Implement FE-05 back-office navigation accessibility only. Read the contract/roadmap, inspect current routes and reusable shell components, and preserve every existing URL. Group and label only implemented destinations, fix active-state and keyboard/focus behavior, and verify responsive open/close behavior. Do not add placeholder routes, restructure the router, implement domain screens, or start a design-system sweep. Add focused tests and run tests, build, and targeted lint.

### FE-06 — Item-category reliability

- **Domain:** Item categories.
- **Status:** `IMPLEMENTED`.
- **Execution class:** `DIRECT_IMPLEMENTATION`.
- **Dependencies:** FE-02.
- **Backend gate:** Existing category list/create/update/delete-or-deactivate semantics verified against controller/DTO/service.
- **User-visible change:** Category list and forms have explicit loading, empty, validation, conflict, pending, success, and confirmation behavior.
- **Exact scope:** Stabilize current category routes/forms/table, normalize request/error handling, prevent duplicate submission, preserve form input on failure, and add focused tests.
- **Out of scope:** Item fields, inventory quantities, category hierarchy, API redesign, shared form-system rewrite.
- **Recommended model:** `gpt-5.6-terra`, high reasoning.
- **Expected output:** Reliable current category CRUD behavior matching implemented backend semantics.
- **Validation:** Store/component tests for list and mutations, keyboard/dialog focus, tests/build/lint.
- **Block condition:** Current delete semantics conflict with referential integrity and no backend-supported alternative is defined.
- **Split trigger:** If delete/deactivate requires a new backend policy, ship list/create/edit first only after renaming/splitting the PR.

**Copy-ready implementation prompt**

> Implement FE-06 for item categories only. Inspect the current category screens/store and the backend category controller, DTOs, validation, and service. Using the existing JavaScript/Axios/Zustand/components, cover loading, empty, field validation, conflict, pending, duplicate-submit prevention, success, and destructive confirmation according to the real backend behavior. Preserve input on failure and add focused tests. Do not touch item inventory, introduce a form framework, or redesign shared tables globally. Validate tests, build, lint, keyboard, and dialog focus.

### FE-07 — Backend receipt reprint

- **Domain:** Receipt printing for existing sales.
- **Status:** `IMPLEMENTED`.
- **Execution class:** `DIRECT_IMPLEMENTATION`.
- **Dependencies:** FE-02.
- **Backend gate:** Verify the implemented `POST /api/print` request/response and printer error mapping in controller/DTO/service.
- **User-visible change:** A user can request backend-controlled reprint from an existing sale and see pending, success, and printer-failure feedback.
- **Exact scope:** Replace or complement browser-oriented print behavior on sale detail with the backend print call; prevent duplicate clicks; preserve the sale reference; add retry and tests.
- **Out of scope:** Sale creation, automatic post-checkout printing, browser/PDF fallback, printer configuration UI, sales-history redesign.
- **Recommended model:** `gpt-5.6-terra`, high reasoning.
- **Expected output:** Reprint is a separate recoverable operation that never recreates or changes a sale.
- **Validation:** API/component tests for success/failure/retry/double click, keyboard check, tests/build/lint; document that physical printer verification is environmental.
- **Block condition:** Print success/error semantics cannot distinguish accepted print from failure in the target environment.
- **Split trigger:** If printer configuration or job-status polling is required, defer it to a separate contract/PR.

**Copy-ready implementation prompt**

> Implement FE-07 receipt reprint only. Inspect the existing sale detail and print behavior plus the backend print controller, request DTO, service, and error handling. Use the existing API layer to call backend-controlled printing for an already-created sale. Provide pending, duplicate-click prevention, success, failure, and retry states while preserving the sale reference. Add focused tests. Do not change sale creation, implement automatic post-checkout printing, add browser/PDF fallback, or add dependencies. Run tests/build/lint and state whether physical printer verification was possible.

### FE-08 — Current dashboard reliability

- **Domain:** Current dashboard.
- **Status:** `IMPLEMENTED`.
- **Execution class:** `DIRECT_IMPLEMENTATION`.
- **Dependencies:** FE-02.
- **Backend gate:** Existing dashboard endpoint and response verified; no target Release 1 metric may be invented.
- **User-visible change:** Current dashboard data has clear loading, error, retry, empty/zero, and refreshed states.
- **Exact scope:** Stabilize the existing dashboard request/render lifecycle and current cards only; add focused tests and accessible state messaging.
- **Out of scope:** New inventory, debt, cash-session, expense, or profitability metrics; frontend aggregation; dashboard redesign.
- **Recommended model:** `gpt-5.6-terra`, high reasoning.
- **Expected output:** Reliable rendering of only the data the current backend already returns.
- **Validation:** Component/store tests for async states and zero values, tests/build/lint, responsive and screen-reader status checks.
- **Block condition:** Existing endpoint values cannot be interpreted without undocumented backend calculations.
- **Split trigger:** Any new metric or cross-domain widget moves to FE-31 or a later single-widget PR.

**Copy-ready implementation prompt**

> Implement FE-08 current dashboard reliability only. Verify the existing dashboard controller/response/service and inspect the current screen/store. Preserve the current metrics and make their loading, error, retry, zero/empty, and refresh behavior explicit and accessible. Use backend-returned values without frontend aggregation. Add focused tests. Do not add Release 1 metrics, redesign the dashboard, or touch other domains. Run tests, build, targeted lint, and responsive checks.

### FE-09 — Item inventory read model

- **Domain:** Item list/detail inventory display.
- **Status:** `IMPLEMENTED`.
- **Execution class:** `DIRECT_IMPLEMENTATION`.
- **Dependencies:** FE-02.
- **Backend gate:** Item response exposes decimal `stockStore`/`stockWarehouse`, `baseUom`, `fractionalQuantityAllowed`, active state, lock/movement state, and removes or explicitly deprecates aggregate `stockQuantity`.
- **User-visible change:** Item list/detail show correct location-specific quantities, UOM, fractional policy, and state.
- **Exact scope:** Align item API/store/list/detail to the verified response; add formatters and async/empty/error tests local to items.
- **Out of scope:** Item creation/editing, stock mutation, movement history, global table/API rewrite.
- **Recommended model:** `gpt-5.6-terra`, high reasoning.
- **Expected output:** No item read screen depends on legacy aggregate stock or integer assumptions.
- **Validation:** API/store/component tests with whole and four-decimal quantities, locale display, tests/build/lint/responsive checks.
- **Block condition:** Any required field or decimal/location semantic remains absent or ambiguous.
- **Split trigger:** If list and detail together exceed the size limit, deliver list first and detail second under separate IDs.

**Copy-ready implementation prompt**

> Implement FE-09 only after its backend gate is satisfied. Re-inspect item controller/response DTO/service and confirm decimal location stock, UOM, fractional, active, and lock fields. Align the JavaScript item API/store/list/detail to that exact contract, remove UI reliance on legacy `stockQuantity`, and cover loading/error/empty and Indonesian quantity display. Add focused tests. Do not add mutations, movement history, TypeScript, or global table/API abstractions. Stop and report the mismatch if any required backend field is missing.

### FE-10 — Item creation and opening balance

- **Domain:** Item creation.
- **Status:** `IMPLEMENTED`.
- **Execution class:** `DIRECT_IMPLEMENTATION`.
- **Dependencies:** FE-09.
- **Backend gate:** Atomic create-item contract accepts UOM/fraction policy and optional decimal STORE/WAREHOUSE opening quantities and creates `OPENING_BALANCE` movements; validation/error response is stable.
- **User-visible change:** A user can create an item and optional opening inventory without unsafe multi-request stock setup.
- **Exact scope:** Item-create form and request mapping, UOM/fraction-aware quantity inputs, location-specific opening fields, pending/conflict/success behavior, and tests.
- **Out of scope:** Item edit, later stock changes, UOM conversion, category management, multi-step frontend transaction orchestration.
- **Recommended model:** `gpt-5.6-sol`, high reasoning.
- **Expected output:** One submission produces the backend-confirmed item and opening movements or a recoverable failure with entered data preserved.
- **Validation:** Form/request tests for whole/fractional precision and duplicate submit, keyboard/focus/responsive checks, tests/build/lint.
- **Block condition:** Item and opening balance require separate non-atomic frontend requests, or DTO precision/validation is unresolved.
- **Split trigger:** If create form plus opening inventory exceeds the limit, first extract only narrowly reusable item-field inputs without shipping an incomplete transaction.

**Copy-ready implementation prompt**

> After FE-10's backend gate is confirmed, implement item creation only. First produce a short plan if form/request state boundaries remain non-obvious. Inspect the exact backend create DTO, response, validation, service transaction, and opening-balance movement behavior. Build the JavaScript form using existing components, with UOM, fractional policy, and optional STORE/WAREHOUSE decimal openings submitted atomically. Cover validation, pending, duplicate click, conflict, success, focus, and preserved input on failure. Do not implement edit or simulate opening stock with separate calls. Stop if atomicity or precision is missing.

### FE-11 — Item editing and movement locks

- **Domain:** Item editing.
- **Status:** `IMPLEMENTED`.
- **Execution class:** `DIRECT_IMPLEMENTATION`.
- **Dependencies:** FE-09.
- **Backend gate:** Update response/request identifies or enforces UOM/fraction immutability after first movement and excludes direct stock editing.
- **User-visible change:** Editable metadata is clear; UOM/fraction fields become visibly locked with an explanation after movement history exists.
- **Exact scope:** Align edit form/request, lock semantics, conflict refresh, pending/success behavior, and tests.
- **Out of scope:** Item create, stock adjustments, movement list, changing stock through item edit, generic form framework.
- **Recommended model:** `gpt-5.6-sol`, high reasoning.
- **Expected output:** The UI cannot offer a stock edit or an invalid semantic change that the backend forbids.
- **Validation:** Tests before/after lock, conflict response, duplicate submit, keyboard/focus, tests/build/lint.
- **Block condition:** Frontend must guess whether movements exist or backend accepts forbidden changes.
- **Split trigger:** If lock explanation/detail requires movement history UI, link to FE-12 without embedding it here.

**Copy-ready implementation prompt**

> Implement FE-11 after verifying the item update DTO/response/service and backend enforcement of UOM/fraction locks after the first movement. Align only the item edit workflow. Separate editable metadata from locked semantic fields, explain the lock accessibly, exclude all direct stock editing, and handle pending, validation, conflict/refresh, success, and duplicate submit. Add focused tests. Do not implement create, movement history, or stock operations. Stop if the frontend would need to infer lock state.

### FE-12 — Stock movement history

- **Domain:** Stock movement read model.
- **Status:** `IMPLEMENTED`.
- **Execution class:** `DIRECT_IMPLEMENTATION`.
- **Dependencies:** FE-09.
- **Backend gate:** Movement list/detail endpoint exposes decimal quantity, item, type, source/destination or location, reference, actor, timestamp, paging/filter semantics.
- **User-visible change:** Users can trace item stock changes and their source documents.
- **Exact scope:** Movement list and optional item-scoped filtering using the verified read model; loading/error/empty/paging behavior and tests.
- **Out of scope:** Posting movements, reconstructing history from receipts/sales, reports, global table abstraction.
- **Recommended model:** `gpt-5.6-terra`, high reasoning.
- **Expected output:** Auditable backend-derived movement history without N+1 item/document requests.
- **Validation:** API/component tests for movement types, decimal/location display and filters, tests/build/lint/responsive checks.
- **Block condition:** Endpoint is absent, requires N+1 joins from the client, or lacks traceability fields.
- **Split trigger:** If full detail exceeds size, ship list with navigable references and defer detail.

**Copy-ready implementation prompt**

> Implement FE-12 only when the backend stock-movement read model is available. Inspect its controller/DTO/service/paging/filter contract. Add a JavaScript movement-history screen or item-scoped entry point using that response directly, with loading, error, retry, empty, paging/filter, decimal UOM/location, reference, actor, and time display. Add tests and avoid N+1 requests. Do not post stock changes or reconstruct movements from other APIs. Stop if traceability fields are missing.

### FE-13 — Stock adjustment

- **Domain:** Stock adjustment.
- **Status:** `BLOCKED`.
- **Execution class:** `BLOCKED`; after the gate clears, `PLAN_RECOMMENDED`.
- **Dependencies:** FE-12.
- **Current implementation note:** A legacy stock-adjustment route/screen exists, but it is not the FE-13 target: it uses integer/JavaScript-number quantity handling, reads deprecated aggregate `stockQuantity`, and does not send the backend-required `stockLocation` per line.
- **Backend gate:** Adjustment request/response uses decimal quantity, explicit location/direction semantics, reason, posted movement result, validation, and conflict handling.
- **User-visible change:** Authorized users can post a reasoned STORE or WAREHOUSE adjustment and see the confirmed movement.
- **Exact scope:** Align current adjustment list/create/detail to the target contract, with confirmation, pending, conflicts, success, and tests.
- **Out of scope:** Transfer, item edit, stock calculation, bulk adjustment, generic transaction framework.
- **Recommended model:** `gpt-5.6-sol`, high reasoning.
- **Expected output:** A single safe adjustment submission that refreshes backend-derived item/movement views.
- **Validation:** Tests for precision, whole-item policy, direction/location, duplicate submit and conflict; keyboard/dialog/responsive; tests/build/lint.
- **Block condition:** Integer quantities remain, sign/direction is ambiguous, or response does not identify the posted movement.
- **Split trigger:** If read screens and create flow exceed the limit, align list/detail first, then create in a renamed follow-up PR.

**Copy-ready implementation prompt**

> After FE-13's backend gate clears, implement only stock adjustment. Inspect the exact adjustment controller/DTO/validation/service and movement response. Align the current JavaScript list/create/detail with decimal quantity, explicit location and direction, reason, confirmation, pending, duplicate protection, conflict recovery, and backend-confirmed success. Refresh affected read data without calculating stock locally. Add focused tests. Do not add transfer or item editing. Split read alignment from create if the change exceeds the roadmap limit.

### FE-14 — Stock transfer

- **Domain:** Stock transfer.
- **Status:** `IMPLEMENTED`.
- **Execution class:** `PLAN_RECOMMENDED`.
- **Dependencies:** FE-12.
- **Backend gate:** Atomic transfer endpoint supports decimal quantity, source/destination, item policy, reference/result movements, validation, and stock conflicts.
- **User-visible change:** Users can move stock between STORE and WAREHOUSE with one confirmed operation.
- **Exact scope:** Transfer form, confirmation, request lifecycle, result, affected-read refresh, and focused tests.
- **Out of scope:** Adjustment, multi-item transfer, frontend two-step decrement/increment, transfer reporting.
- **Recommended model:** `gpt-5.6-sol`, high reasoning.
- **Expected output:** One atomic backend request; identical locations and invalid quantity are prevented/explained, while backend remains authoritative for availability.
- **Validation:** Tests for direction swap, same-location rejection, precision, pending/conflict/success; keyboard/focus; tests/build/lint.
- **Block condition:** Transfer requires separate decrement/increment calls or lacks a stable result/reference.
- **Split trigger:** Multi-item or approval behavior is requested; defer it beyond this single-item Release 1 PR.

**Copy-ready implementation prompt**

> Implement FE-14 only after an atomic backend transfer contract exists. Inspect controller/DTO/validation/service and use the exact decimal/source/destination/result fields. Build one JavaScript transfer workflow using existing components, with same-location prevention, UOM/fraction-aware input, confirmation, pending, duplicate-click prevention, conflict recovery, success reference, and affected-data refresh. Add focused tests. Never implement transfer as two frontend stock calls or calculate remaining stock locally.

### FE-15 — Current/open cash session

- **Domain:** Cash-session status and opening.
- **Status:** `IMPLEMENTED`.
- **Execution class:** `PLAN_RECOMMENDED`.
- **Dependencies:** FE-03.
- **Backend gate:** Current-session and open-session endpoints enforce one globally open session and expose opening cash, identity, timestamps, status, conflict/error semantics.
- **User-visible change:** The user sees whether the drawer is open and can open it once with confirmed opening cash.
- **Exact scope:** Shared current-session state, status surface, opening form/dialog, duplicate/conflict recovery, and tests.
- **Out of scope:** Closing, history, sales, expenses, supplier payments, client-calculated expected cash.
- **Recommended model:** `gpt-5.6-sol`, high reasoning.
- **Expected output:** Cash-dependent screens can consume one verified session state without assuming local ownership.
- **Validation:** Tests for none/open/conflicting/stale/session-expired states, money input, duplicate submit, focus; tests/build/lint.
- **Block condition:** Global uniqueness or current-session discovery is not server-enforced/exposed.
- **Split trigger:** If shared status integration touches multiple domain screens, keep this PR to the session surface and expose a small reusable hook/store interface for later consumers.

**Copy-ready implementation prompt**

> After verifying the backend current/open cash-session controller, DTOs, validation, service, and global uniqueness, implement FE-15 only. Add a JavaScript current-session state surface and opening interaction using existing API/store/component patterns. Cover no session, loading, error/retry, open, pending, duplicate submit, server conflict/refresh, success, currency input, focus, and accessibility. Do not implement closing, history, checkout, expenses, supplier payments, or expected-cash calculations.

### FE-16 — Cash-session close and reconciliation

- **Domain:** Cash-session closing.
- **Status:** `IMPLEMENTED`.
- **Execution class:** `PLAN_RECOMMENDED`.
- **Dependencies:** FE-15.
- **Backend gate:** Close preview or close response provides server-calculated expected cash and final actual/variance, with stale/closed conflict behavior and correction policy.
- **User-visible change:** A cashier can review expected cash, enter actual cash, confirm close, and see the server-confirmed variance.
- **Exact scope:** Current-session close/reconciliation interaction, confirmation, pending/conflict/success states, and tests.
- **Out of scope:** Session history, frontend drawer ledger, post-close corrections, reports.
- **Recommended model:** `gpt-5.6-sol`, high reasoning.
- **Expected output:** Closed session result is rendered from backend values and disables new current-session drawer actions.
- **Validation:** Tests for preview/close values, duplicate submit, conflict, negative/positive variance display, focus/confirmation; tests/build/lint.
- **Block condition:** Frontend would need to calculate expected cash/variance or post-close policy is undefined.
- **Split trigger:** If preview and commit are separate complex contracts, split preview/reconciliation from final close only if neither PR exposes an unsafe incomplete action.

**Copy-ready implementation prompt**

> Implement FE-16 after the backend close/reconciliation contract is final. Inspect controller/DTO/service calculations and conflict behavior. Build only the current-session close flow: render server expected cash, accept actual cash, confirm, prevent duplicate submission, handle stale/already-closed conflicts, and render server actual/variance/result. Disable further drawer actions through the shared session state. Add focused tests. Do not calculate reconciliation locally or add history/reporting.

### FE-17 — Cash-session history and detail

- **Domain:** Cash-session history.
- **Status:** `IMPLEMENTED`.
- **Execution class:** `DIRECT_IMPLEMENTATION`.
- **Dependencies:** FE-16.
- **Backend gate:** Session list/detail read models expose opening, expected, actual, variance, status, actor/timestamps, paging/filter semantics.
- **User-visible change:** Users can review prior sessions and reconciliation outcomes.
- **Exact scope:** History list/detail with backend fields, filters/paging where supported, async/empty/error states, and tests.
- **Out of scope:** Opening/closing mutations, recomputing cash ledgers, reports/export.
- **Recommended model:** `gpt-5.6-terra`, high reasoning.
- **Expected output:** Auditable session history without assembling totals from sales/payments/expenses client-side.
- **Validation:** API/component tests for open/closed and variance states, date/Rupiah formatting, tests/build/lint/responsive.
- **Block condition:** Detail omits reconciliation values or requires frontend aggregation/N+1 requests.
- **Split trigger:** Split detail from list if together they exceed the size limit.

**Copy-ready implementation prompt**

> Implement FE-17 only when cash-session list/detail read models exist. Inspect controller/response/service and use those backend-confirmed reconciliation fields directly. Add JavaScript history list/detail with loading, error/retry, empty, supported filters/paging, Indonesian dates/Rupiah, accessible status and responsive behavior. Add focused tests. Do not mutate sessions or derive expected cash from other endpoints. Split detail if the PR exceeds the review limit.

### FE-18 — Cashier search and cart

- **Domain:** Cashier cart interaction.
- **Status:** `IMPLEMENTED`.
- **Execution class:** `PLAN_RECOMMENDED`.
- **Dependencies:** FE-09, FE-15.
- **Backend gate:** Cashier item lookup/read model exposes barcode/SKU, name, price, UOM, fractional policy, STORE availability, active state; current session is discoverable.
- **User-visible change:** Cashier can search items, build a cart, and edit/remove whole or fractional quantities with clear advisory availability.
- **Exact scope:** Search result behavior, cart state, UOM-aware quantity editing, duplicate-add rule, empty/error/loading states, keyboard flow, and tests.
- **Out of scope:** Physical scanner timing, checkout submission, authoritative totals/change, printing, WAREHOUSE sale stock.
- **Recommended model:** `gpt-5.6-sol`, high reasoning.
- **Expected output:** A fast keyboard-friendly cart that sends raw line intent later and never presents local totals as posted facts.
- **Validation:** Interaction tests for search/add/duplicate/edit/remove/fraction policy and stale results; keyboard/focus/responsive checks; tests/build/lint.
- **Block condition:** Lookup lacks UOM/fraction/STORE availability or session gating cannot be established.
- **Split trigger:** If search and cart exceed the limit, ship search/add first with a minimal cart, then quantity editing as a follow-up before checkout.

**Copy-ready implementation prompt**

> Once FE-18's backend gates are met, make a short interaction plan and implement only cashier search/cart. Inspect the lookup response and current-session behavior. Preserve the focused cashier layout and existing stack. Support manual search, item add, a documented duplicate-add rule, remove, UOM/fraction-aware quantity editing, advisory STORE availability, loading/error/empty/stale-result states, and deliberate keyboard focus. Add tests. Do not implement scanner timing, checkout, local authoritative totals/change, or printing.

### FE-19 — Physical scanner integration

- **Domain:** Barcode scanner input.
- **Status:** `BLOCKED`.
- **Execution class:** `BLOCKED`; after hardware verification, `PLAN_RECOMMENDED`.
- **Dependencies:** FE-18.
- **Backend gate:** Item barcode lookup contract stable; actual scanner model/interface, character timing, prefix/suffix, terminator, and rapid-scan behavior verified on the store laptop.
- **User-visible change:** Physical scans add or focus matching items with immediate success/not-found feedback while manual search remains available.
- **Exact scope:** Scanner input adapter integrated with the existing cashier add path, focus-safe behavior, rapid/duplicate scan handling, device-informed tests.
- **Out of scope:** Camera scanning, scanner configuration UI, checkout shortcuts, synthetic copy/paste assumptions, inventory barcode administration.
- **Recommended model:** `gpt-5.6-sol`, high reasoning.
- **Expected output:** Device behavior is explicit and scanning cannot accidentally submit checkout or disrupt normal text editing.
- **Validation:** Actual-device test plus automated event-sequence tests, focus/typing/assistive behavior, tests/build/lint.
- **Block condition:** Hardware cannot be tested or its event framing remains unknown.
- **Split trigger:** If more than one scanner transport must be supported, implement only the Release 1 device and defer adapters.

**Copy-ready implementation prompt**

> Implement FE-19 only after recording actual scanner model/interface, prefix/suffix/terminator, timing, and rapid-scan observations. Integrate that physical input with FE-18's existing item-add path using the smallest JavaScript adapter. Preserve manual search and normal text editing; scanning must never trigger checkout. Cover match, not found, inactive, duplicate/rapid scan, focus, and feedback with device-informed automated tests, then verify on the store laptop. Do not implement camera scanning or guess keyboard-wedge timing without evidence.

### FE-20 — Sale checkout submission

- **Domain:** Sale posting and payment.
- **Status:** `BLOCKED`.
- **Execution class:** `BLOCKED`; after the gate clears, `PLAN_RECOMMENDED`.
- **Dependencies:** FE-18.
- **Backend gate:** Sale create request/response supports decimal lines, CASH/QRIS, open-session enforcement, server totals/change, idempotency key and same-key replay/conflict semantics, and ambiguous-outcome recovery/status lookup.
- **User-visible change:** Cashier can confirm CASH or QRIS payment exactly once and see the server-created sale, totals, and cash change.
- **Exact scope:** Payment interaction, idempotency lifecycle, pending/duplicate protection, server validation/conflict/ambiguous failure recovery, success state, and tests.
- **Out of scope:** Printing, sale void/return, customer credit, local authoritative totals/change, cash-session close.
- **Recommended model:** `gpt-5.6-sol`, xhigh reasoning.
- **Expected output:** A transaction-safe submission flow that preserves one idempotency key across safe retries and never treats print as sale creation.
- **Validation:** Tests for CASH/QRIS, fractional lines, insufficient cash validation as defined, double click, same-key retry, timeout/unknown outcome, stock/session conflict, server totals/change; tests/build/lint/keyboard.
- **Block condition:** Any idempotency, recovery, decimal, session, or server-calculation contract is missing.
- **Split trigger:** If CASH and QRIS interaction together exceed the limit, extract shared submission state first, then deliver each payment method in separate PRs without shipping an unsafe partial checkout.

**Copy-ready implementation prompt**

> After all FE-20 backend gates are proven, make a short transaction-state plan and implement sale checkout only. Inspect sale controller/request/response/validation/service, cash-session enforcement, server totals/change, idempotency replay/conflict, and ambiguous-outcome lookup. Submit cart line intent and CASH/QRIS inputs using one stable idempotency key per attempted sale. Cover confirmation, pending, double click, same-key retry, timeout/unknown outcome, validation, stock/session conflict, and backend-confirmed success with focused tests. Do not print, implement returns, or calculate authoritative totals/change locally.

### FE-21 — Post-checkout print and recovery

- **Domain:** Receipt printing after checkout.
- **Status:** `BLOCKED`.
- **Execution class:** `BLOCKED`; after the gate clears, `DIRECT_IMPLEMENTATION`.
- **Dependencies:** FE-20, FE-07.
- **Backend gate:** Successful checkout returns the sale reference required by the verified print endpoint; printer failure does not roll back sale.
- **User-visible change:** After sale success, printing is attempted/retried separately and a printer failure cannot obscure the completed sale.
- **Exact scope:** Connect FE-20 success to FE-07 print action, sequence status/focus, retry/reprint, and tests.
- **Out of scope:** Checkout logic, browser/PDF fallback, printer setup, print-job queue dashboard.
- **Recommended model:** `gpt-5.6-sol`, high reasoning.
- **Expected output:** Clear two-stage success: sale confirmed first, print result second.
- **Validation:** Tests for sale success+print success/failure/retry/navigation, no sale recreation, keyboard/focus; tests/build/lint and physical-printer note.
- **Block condition:** Checkout lacks a stable printable reference or print failure can make sale outcome ambiguous.
- **Split trigger:** If asynchronous job polling is required, move job monitoring into a separate print-domain PR.

**Copy-ready implementation prompt**

> Implement FE-21 after FE-20 and FE-07 are complete. Connect the backend-confirmed sale success state to backend-controlled printing using the returned sale reference. Always show sale success/reference before print status; handle print pending, success, failure, retry/reprint, focus, and safe navigation without ever resubmitting the sale. Add focused tests. Do not change checkout, add browser/PDF fallback, or add printer configuration.

### FE-22 — Sales history target alignment

- **Domain:** Sales history/detail.
- **Status:** `BLOCKED`.
- **Execution class:** `BLOCKED`; after the gate clears, `DIRECT_IMPLEMENTATION`.
- **Dependencies:** FE-20.
- **Backend gate:** Sale list/detail read model exposes decimal quantities, server totals, payment method/status, tender/change where appropriate, session/reference/status, and defined void/return representation.
- **User-visible change:** Sale history accurately displays posted outcomes and links to reprint.
- **Exact scope:** Align list/detail/store/API fields, remove derived payment-status assumptions, add async/empty/error/filter behavior and tests.
- **Out of scope:** Checkout, printing implementation, void/return mutation, reports/export.
- **Recommended model:** `gpt-5.6-terra`, high reasoning.
- **Expected output:** Sales read screens render backend status and financial values without client inference.
- **Validation:** API/component tests for CASH/QRIS/fractional/change/status, date/Rupiah display, tests/build/lint/responsive.
- **Block condition:** Frontend must compare amounts to infer payment/status or return/void semantics are ambiguous.
- **Split trigger:** Split detail from list if the combined diff exceeds the size limit.

**Copy-ready implementation prompt**

> Implement FE-22 only when the target sale list/detail DTOs are stable. Inspect their controller/service and align the existing JavaScript API/store/list/detail to backend-confirmed decimal lines, totals, payment method/status, tender/change, session/reference, and void/return representation. Remove local paid-status inference. Cover loading/error/retry/empty and supported filters with tests and keep FE-07 reprint available. Do not add sale mutation or reporting.

### FE-23 — Supplier list and detail

- **Domain:** Supplier read workflow.
- **Status:** `BLOCKED`.
- **Execution class:** `BLOCKED`; after the gate clears, `DIRECT_IMPLEMENTATION`.
- **Dependencies:** FE-02.
- **Backend gate:** Supplier list/detail endpoints and stable identifier, contact, active-state, paging/search response are implemented.
- **User-visible change:** Users can search and inspect suppliers using stable records.
- **Exact scope:** Supplier API/store/list/detail, loading/error/empty/search/paging states, and tests.
- **Out of scope:** Create/edit, goods receipts, balances assembled client-side, payment, global table abstraction.
- **Recommended model:** `gpt-5.6-terra`, high reasoning.
- **Expected output:** Reusable supplier selection/read behavior without free-text relationship assumptions.
- **Validation:** API/component tests for search, empty/error/stale response, active state, tests/build/lint/responsive.
- **Block condition:** No supplier controller/read DTO exists or identity/search semantics are unstable.
- **Split trigger:** Split detail from list if required by the size cap.

**Copy-ready implementation prompt**

> Implement FE-23 only after supplier list/detail endpoints exist. Inspect controller/DTO/validation/service and use the stable supplier identifier. Add JavaScript API/store/list/detail with search/paging only as supported, loading, error/retry, empty, stale-response protection, active-state display, accessibility, and focused tests. Do not implement supplier mutations, goods receipts, debt, payment, or client-side balance aggregation.

### FE-24 — Supplier create/edit/deactivate

- **Domain:** Supplier maintenance.
- **Status:** `BLOCKED`.
- **Execution class:** `BLOCKED`; after the gate clears, `DIRECT_IMPLEMENTATION`.
- **Dependencies:** FE-23.
- **Backend gate:** Create/update/deactivate requests, validation, uniqueness/conflict, and referential behavior are implemented.
- **User-visible change:** Users can maintain supplier records and safely deactivate rather than destructively remove referenced suppliers.
- **Exact scope:** Create/edit forms, backend-supported deactivate action, validation/conflict/pending/success states, and tests.
- **Out of scope:** Goods receipts, debt/payments, hard delete unless explicitly supported, generic form framework.
- **Recommended model:** `gpt-5.6-terra`, high reasoning.
- **Expected output:** Supplier mutations preserve stable identity and existing financial/history references.
- **Validation:** Form/mutation tests for validation/uniqueness/duplicate submit/deactivation, focus/confirmation, tests/build/lint.
- **Block condition:** Backend exposes only unsafe deletion or lacks defined active-state behavior.
- **Split trigger:** If deactivate policy is not ready, split it out and deliver create/edit only after renaming scope.

**Copy-ready implementation prompt**

> Implement FE-24 after verifying supplier create/update/deactivate controller/DTO/validation/service semantics. Build only supplier maintenance with existing JavaScript components and stores. Cover field validation, uniqueness/conflict, pending, duplicate submit, success, preserved input, and accessible deactivation confirmation while retaining stable identifiers/history. Add focused tests. Do not implement receipts, debt, payments, hard delete, or a shared form-system rewrite.

### FE-25 — Goods-receipt list and detail

- **Domain:** Goods-receipt read workflow.
- **Status:** `BLOCKED`.
- **Execution class:** `BLOCKED`; after the gate clears, `DIRECT_IMPLEMENTATION`.
- **Dependencies:** FE-09, FE-23.
- **Backend gate:** Receipt list/detail responses use supplier identifier, decimal quantities, item UOM/location, server total, paid/outstanding, status, references, timestamps, paging/filter semantics.
- **User-visible change:** Users can review posted receipts, destination quantities, totals, payment state, and supplier.
- **Exact scope:** Align current receipt API/store/list/detail to target response and add async/empty/error/filter tests.
- **Out of scope:** Receipt creation, payment mutation, calculating totals/debt, supplier maintenance, N+1 enrichment.
- **Recommended model:** `gpt-5.6-sol`, high reasoning.
- **Expected output:** Posted receipt truth is displayed from one suitable backend read model.
- **Validation:** Tests for decimal/UOM/location, total/paid/outstanding/status, supplier, zero/partial values, tests/build/lint/responsive.
- **Block condition:** Response lacks financial fields or requires per-row supplier/item requests.
- **Split trigger:** Split detail from list if the combined diff exceeds the cap.

**Copy-ready implementation prompt**

> Implement FE-25 only after target goods-receipt list/detail contracts exist. Inspect controller/DTO/service and align current JavaScript API/store/list/detail to supplier ID/name, decimal item quantities, UOM, location, server total, paid/outstanding, status, reference, and time. Cover loading/error/retry/empty and supported filters/paging with focused tests. Do not create receipts, pay debt, calculate totals, or add N+1 enrichment calls. Split detail if needed for review size.

### FE-26 — Goods-receipt creation

- **Domain:** Goods receipt posting.
- **Status:** `BLOCKED`.
- **Execution class:** `BLOCKED`; after the gate clears, `PLAN_RECOMMENDED`.
- **Dependencies:** FE-25.
- **Backend gate:** Create request uses supplier identifier, decimal line quantity/purchase price and location; service calculates total, posts receipt movements atomically, defines optional initial payment semantics, and returns full posted result.
- **User-visible change:** Users can post received stock to the chosen location and see the server-confirmed receipt and debt result.
- **Exact scope:** Supplier/item selection, receipt lines, UOM-aware inputs, confirmation, pending/conflict/success, request mapping, and tests.
- **Out of scope:** Supplier creation, separate supplier payment UI, client-authoritative receipt totals, free-text supplier relationship, multi-location behavior beyond contract.
- **Recommended model:** `gpt-5.6-sol`, xhigh reasoning.
- **Expected output:** One atomic receipt submission creates stock movements and financial state or fails recoverably without partial frontend orchestration.
- **Validation:** Tests for supplier ID, decimal/UOM/location, duplicate line policy, duplicate submit, server totals/status, conflict/error preservation; keyboard/responsive; tests/build/lint.
- **Shared quantity-component checkpoint:** Compare the verified FE-26 line-input contract with FE-18 and the FE-13 target. If their editing mechanics match, extract a decimal-string-based `BloomQuantityField` for draft preservation, comma/dot input, UOM labelling, and accessible `+`/`−` stepping. Keep zero policy, direction, location, availability, request mapping, and domain errors outside the shared control; do not reuse legacy `BloomInputNumber` unchanged.
- **Block condition:** Backend still expects free-text supplier, integer quantity, client total, or non-atomic movement/payment calls.
- **Split trigger:** If line editor and submission exceed the limit, extract a receipt-local line editor first with tests, then post flow; do not ship an unsafe partially wired submit.

**Copy-ready implementation prompt**

> After FE-26's backend gate clears, create a short interaction/request plan and implement goods-receipt creation only. Inspect the exact request/response/validation/service transaction. Use stable supplier and item identities, decimal UOM-aware quantity/purchase-price inputs, explicit location, and one atomic submit. Treat this as the shared quantity-control checkpoint: compare the verified receipt input mechanics with FE-18 and the FE-13 target, extract a decimal-string-based `BloomQuantityField` only where mechanics genuinely match, and keep domain rules in each workflow. Treat any displayed preview as non-authoritative and render server total/paid/outstanding/status on success. Cover confirmation, pending, duplicate submission, conflicts, preserved input, focus, and responsive line editing with tests. Do not reuse legacy `BloomInputNumber` unchanged, invent supplier/payment contracts, or send a client-authoritative total.

### FE-27 — Supplier payable views

- **Domain:** Supplier debt/accounts payable read model.
- **Status:** `BLOCKED`.
- **Execution class:** `BLOCKED`; after the gate clears, `DIRECT_IMPLEMENTATION`.
- **Dependencies:** FE-25.
- **Backend gate:** Payable summary and receipt-level outstanding read endpoints expose server-calculated amounts, status, supplier/receipt references, dates, paging/filter semantics.
- **User-visible change:** Users can see which supplier receipts remain unpaid or partially paid and their backend-confirmed outstanding amounts.
- **Exact scope:** Payables list/summary/detail links, filters/paging as supported, loading/error/empty states, and tests.
- **Out of scope:** Payment mutation, client aggregation, aging/report export, customer credit.
- **Recommended model:** `gpt-5.6-sol`, high reasoning.
- **Expected output:** A clear one-receipt debt selection path for FE-28 without computing balances in the browser.
- **Validation:** Tests for unpaid/partial/paid status, Rupiah/date display, zero/empty/error, no N+1, tests/build/lint/responsive.
- **Block condition:** Backend lacks receipt-level outstanding or requires frontend aggregation across receipts/payments.
- **Split trigger:** If supplier summary and receipt detail exceed size, ship receipt-level list first and summary later.

**Copy-ready implementation prompt**

> Implement FE-27 only when backend payable read models exist. Inspect controller/DTO/service and render server-calculated supplier/receipt outstanding amounts and statuses directly. Add JavaScript payable list/summary/detail links with supported filters/paging, loading, error/retry, empty, Indonesian currency/date, accessible status, and focused tests. Avoid N+1 requests. Do not add payment, aging, export, or frontend debt aggregation.

### FE-28 — Single-receipt supplier payment

- **Domain:** Supplier payment.
- **Status:** `BLOCKED`.
- **Execution class:** `BLOCKED`; after the gate clears, `PLAN_RECOMMENDED`.
- **Dependencies:** FE-15, FE-27.
- **Backend gate:** Payment endpoint applies one payment to one receipt, supports partial payment and `CASH`/`BANK_TRANSFER`/`QRIS`, rejects overpayment, enforces open session for CASH, returns updated receipt/payment/drawer-relevant state, and defines reversal/error/idempotency behavior.
- **User-visible change:** User can record a partial or full payment for one selected receipt; only CASH requires and affects the open drawer.
- **Exact scope:** One-receipt payment form/confirmation, method-dependent session behavior, pending/idempotency/conflict/success, updated payable display, and tests.
- **Out of scope:** Multi-receipt allocation, supplier prepayment/credit, automatic allocation, payment reversal UI, frontend outstanding calculation.
- **Recommended model:** `gpt-5.6-sol`, xhigh reasoning.
- **Expected output:** A deliberately simple Release 1 payment flow with backend-enforced overpayment and drawer rules.
- **Validation:** Tests for each method, partial/full, overpay, CASH without/with session, duplicate/ambiguous submit, server-updated outstanding/status; keyboard/confirmation; tests/build/lint.
- **Block condition:** Allocation, overpayment, idempotency/recovery, reversal, or CASH session semantics are undefined/unimplemented.
- **Split trigger:** If payment-method interactions exceed the limit, extract shared one-receipt submission state and split CASH from non-cash UI without enabling unsupported allocation.

**Copy-ready implementation prompt**

> After FE-28's backend contract is final, make a short transaction plan and implement only one-receipt supplier payment. Inspect payment controller/request/response/validation/service, idempotency/recovery, overpayment, reversal, and drawer/session rules. From one selected receipt, accept a partial or full `CASH`, `BANK_TRANSFER`, or `QRIS` payment; require current session only for CASH; render backend-updated outstanding/status. Cover confirmation, pending, duplicate/ambiguous submit, overpay, closed-session conflict, success, focus, and tests. Do not add multi-receipt allocation, prepayment, credit, or frontend balance calculations.

### FE-29 — Unexpected expense list/create

- **Domain:** Unexpected expenses.
- **Status:** `BLOCKED`.
- **Execution class:** `BLOCKED`; after the gate clears, `PLAN_RECOMMENDED`.
- **Dependencies:** FE-15.
- **Backend gate:** Expense list/create endpoints require an open session, define amount/category/reason/note, return posted record, enforce validation/idempotency/conflict, and expose paging/filter semantics.
- **User-visible change:** User can review and post an unexpected drawer expense such as snacks, charity, urgent purchase, or owner withdrawal.
- **Exact scope:** Expense list and create interaction, session gating, confirmation, pending/conflict/success, input preservation, and tests.
- **Out of scope:** Void/reversal, edit/delete, category administration, reporting, frontend drawer calculation.
- **Recommended model:** `gpt-5.6-sol`, high reasoning.
- **Expected output:** A posted expense is linked to the server-confirmed open session and appears in history without local ledger mutation.
- **Validation:** Tests for open/closed session, validation, duplicate/ambiguous submit, success refresh, Rupiah/date, keyboard/focus/responsive; tests/build/lint.
- **Block condition:** Expense endpoint/session enforcement/idempotency is absent or correction policy would require editing/deleting posted data.
- **Split trigger:** If list and create exceed size, ship list first, then create; do not combine void behavior.

**Copy-ready implementation prompt**

> Implement FE-29 after verifying expense list/create controller/DTO/validation/service, session enforcement, and duplicate/ambiguous-submit behavior. Add JavaScript expense history and a create interaction for the supported amount/category/reason/note fields. Require the backend-confirmed open session, confirm posting, preserve input on conflict, prevent duplicate submit, and render the returned record. Cover loading/error/empty/pending/success and accessibility with tests. Do not edit/delete/void here or calculate drawer cash locally. Split list/create if necessary.

### FE-30 — Unexpected expense void/reversal

- **Domain:** Expense correction.
- **Status:** `BLOCKED`.
- **Execution class:** `BLOCKED`; after the gate clears, `PLAN_RECOMMENDED`.
- **Dependencies:** FE-29.
- **Backend gate:** Void/reversal endpoint, eligibility, reason, audit result, drawer/session and post-close correction policy, idempotency/conflict behavior are defined and implemented.
- **User-visible change:** Eligible posted expenses can be corrected through an auditable void/reversal, never deletion.
- **Exact scope:** Eligibility display, reasoned confirmation, pending/conflict/success result, list/detail refresh, and tests.
- **Out of scope:** Delete/edit, arbitrary ledger adjustments, supplier-payment reversal, sale returns/voids.
- **Recommended model:** `gpt-5.6-sol`, high reasoning.
- **Expected output:** Expense history preserves original and reversal state with backend-confirmed drawer consequences.
- **Validation:** Tests for eligible/ineligible/already-voided/post-close/conflict/duplicate submit, focus/confirmation, tests/build/lint.
- **Block condition:** Post-close correction or reversal/drawer semantics remain undecided.
- **Split trigger:** If post-close correction becomes a separate workflow, keep this PR to the exact supported policy and roadmap the extra domain behavior separately.

**Copy-ready implementation prompt**

> Implement FE-30 only after expense reversal eligibility, reason, audit result, idempotency, drawer impact, and post-close correction policy are implemented in the backend. Add only the JavaScript void/reversal interaction to the expense workflow: show eligibility, require a reasoned accessible confirmation, prevent duplicates, handle stale/already-voided/post-close conflicts, and render/refresh backend-confirmed results. Add focused tests. Never delete or silently edit a posted expense and do not touch sale or supplier-payment corrections.

### FE-31 — Release 1 dashboard read models

- **Domain:** Release 1 operational dashboard.
- **Status:** `BLOCKED`.
- **Execution class:** `BLOCKED`; after the gate clears, `PLAN_RECOMMENDED`.
- **Dependencies:** FE-17, FE-22, FE-27, FE-29.
- **Backend gate:** Explicit dashboard read model(s) return the approved operational metrics with definitions, freshness, authorization, and drill-down references.
- **User-visible change:** Back-office users see approved Release 1 operational summaries and can navigate to relevant domain records.
- **Exact scope:** Add only approved backend-returned widgets and links, with loading/error/empty/stale states and tests.
- **Out of scope:** Frontend aggregation across domain endpoints, profitability/accounting claims, reporting suite, chart/design-system rewrite.
- **Recommended model:** `gpt-5.6-sol`, high reasoning.
- **Expected output:** A concise operational dashboard whose figures match backend read models and whose links lead to completed workflows.
- **Validation:** Contract/component tests for zero/error/stale values and drill-down links, Indonesian formatting, accessibility/responsive checks, tests/build/lint.
- **Block condition:** Metric definitions or backend read models are missing, or required drill-down domains are incomplete.
- **Split trigger:** More than two or three independent widgets are approved at once; deliver each metric group as a separate dashboard-domain PR.

**Copy-ready implementation prompt**

> After FE-31's domain dependencies and backend dashboard read models are complete, make a short widget/layout plan and implement only the approved Release 1 dashboard metrics. Inspect exact response definitions and render them without cross-endpoint frontend aggregation. Include loading, error/retry, empty/zero/stale states, Indonesian formatting, accessible labels, responsive desktop layout, and drill-down links only to completed routes. Add focused tests. Do not infer profitability, add a reporting suite, or redesign the global shell/design system.

## 6. Optional prompt templates

These templates are optional. A `DIRECT_IMPLEMENTATION` PR needs only its copy-ready implementation prompt. A `PLAN_RECOMMENDED` PR normally uses one short planning pass followed by its implementation prompt.

### Short planning addendum

> Before editing, inspect the named frontend workflow and exact backend contract. Return a concise plan containing: files likely to change, request/state transitions, accessibility and keyboard behavior, focused tests, estimated logical changed lines/production files, and any reason to split. Do not repeat settled product rules or modify files. Stop if the roadmap's backend gate is not satisfied.

### Review addendum

> Review only the current PR diff against `AGENTS.md`, the frontend contract, its roadmap entry, and the verified backend contract. Prioritize incorrect transactions, duplicated submissions, stale state, backend-authority violations, accessibility regressions, and scope creep. Cite exact files/lines. Do not modify files unless explicitly requested.

## 7. Deferred work

The following are intentionally not hidden inside Release 1 PRs:

- TypeScript evaluation or migration.
- TanStack Query or another server-state migration.
- Zustand replacement.
- Router/URL restructuring.
- Whole-shell or global design-system rewrite.
- Global lint/format/accessibility/responsive sweeps.
- React Native implementation.
- UOM conversion/packaging.
- Customer credit.
- Supplier prepayment/credit or multi-receipt allocation.
- Sale void/return UI until policy and backend contract are approved.
- Supplier-payment reversal UI until its policy and backend contract are approved.
- Post-close correction workflows beyond explicitly approved backend behavior.

If any becomes necessary, add a new evidence-backed roadmap entry instead of expanding an unrelated domain PR.

## 8. Remaining product/backend decisions

These questions cannot be safely answered by the current frontend implementation:

1. What exact sale void/return policy and inventory/payment reversal behavior will Release 1 expose?
2. What exact supplier-payment reversal and post-close correction policy applies to CASH payments and expenses?
3. What are the actual scanner model/interface, suffix/terminator, and rapid-scan characteristics on the store laptop?

The UOM vocabulary, first-movement lock, and simple one-receipt supplier-payment allocation are product-confirmed for frontend planning, but their backend domain document and implementation must still be aligned before dependent PRs move from `BLOCKED`.
