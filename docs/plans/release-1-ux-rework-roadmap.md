# Bloom Release 1 UX Rework Roadmap

Last updated: 2026-09-13

## 1. Purpose

This roadmap turns the implemented Release 1 application into evidence-based UX improvements without starting a whole-application redesign.

The work proceeds one domain at a time:

1. Exercise the current application in a live browser.
2. Capture the complete workflow and important states.
3. Produce an evidence-backed UX audit.
4. Design the approved improvement in Figma.
5. Validate the proposed design against Bloom's business and accessibility contracts.
6. Create small implementation PR scopes only after the design is approved.

The existing frontend contract and implementation remain authoritative until an approved UX design is implemented. A screenshot, audit observation, or Figma concept does not change a backend business rule or API contract.

## 2. Current baseline

- All software-completable FE-02 through FE-31 scopes are implemented in the current repository history.
- FE-19 code and workstation evidence exist; physical verification with the actual E81W scanner on the store laptop remains outstanding.
- Current routes cover authentication, dashboard, cashier, catalog, inventory operations, cash sessions, sales, suppliers, goods receipts, payables/payments, and expenses.
- The application already contains deliberate async, conflict, recovery, accessibility, keyboard, and responsive behavior that a visual redesign must preserve.
- Vitest and React Testing Library cover application behavior. No browser E2E framework is currently installed.

This roadmap does not add Cypress merely to capture screenshots. Live exploratory testing comes first. A later, separately reviewed E2E proposal may automate a small set of approved critical journeys after the UX stabilizes.

## 3. Governing principles

### 3.1 Evidence before redesign

- Capture journeys and state transitions, not one attractive screenshot per route.
- Record what the user is trying to accomplish, not only what the page contains.
- Separate observed behavior from reviewer interpretation and proposed improvement.
- Include normal, empty, loading, validation, pending, conflict, success, recovery, keyboard, and responsive states where they genuinely apply.
- Do not manufacture a production transaction or failure merely to obtain an image.
- Use a disposable local development environment and test data for transactional scenarios.

### 3.2 Preserve business correctness

- Backend-confirmed stock, totals, change, debt, reconciliation, eligibility, and statuses remain authoritative.
- UX proposals may improve sequencing, language, hierarchy, focus, and discoverability, but may not redefine backend invariants.
- Sale creation and receipt printing remain separate outcomes.
- Unknown or ambiguous transaction outcomes must remain recoverable and must not be visually simplified into failure.
- Existing durable recovery and account/session isolation must not be weakened for visual simplicity.

### 3.3 Avoid another big bang

- Audit one coherent domain or route family per task.
- Design one domain at a time in Figma.
- Do not create a global redesign before validating the highest-frequency cashier workflows.
- Reuse current components and tokens where they remain suitable.
- Create or change shared patterns only after repeated domain evidence supports them.
- Preserve current URLs unless an approved domain design demonstrates a concrete routing problem.
- Do not combine approved UX implementation with TypeScript, state-management, API-client, router, styling-library, or dependency migration.

### 3.4 Owner approval

The repository owner remains the primary UX decision-maker. AI-generated findings and Figma screens are proposals. Family usability feedback should be collected against a usable prototype or Release 1 candidate, not treated as a substitute for product ownership.

## 4. Evidence format

Each live-audit task should produce one Markdown report under:

`docs/ux/audits/<work-item>-<domain>.md`

Screenshots and recordings are working artifacts. Keep them under a domain-specific evidence directory while the audit is active, but do not stage or commit large binary collections without explicit owner approval. The audit report must remain understandable even if raw recordings are stored outside Git.

The default working location is `docs/ux/evidence/<work-item>/`. Keep raw binary
artifacts untracked until the owner decides whether they belong in Git or should
move to Figma/external storage. “Read-only live audit” means no application,
dependency, configuration, or backend source changes; the task may write its audit
report/evidence and may create explicitly recorded transactions only in the
approved disposable local database.

Suggested artifact naming:

`<sequence>-<route-or-action>-<state>-<viewport>.png`

Example:

`04-cashier-checkout-print-failure-1440x900.png`

Every captured scenario records:

- scenario ID and business purpose;
- route and starting data/session state;
- browser, viewport, date, and environment;
- exact user steps;
- screenshot or recording references;
- observed result;
- expected result from the frontend contract;
- usability, accessibility, keyboard, responsive, and copy observations;
- severity: `P0`, `P1`, or `P2`;
- whether the observation is evidence, inference, or an owner decision needed;
- any test data created and the cleanup/reseed performed.

Use these finding priorities:

- `P0`: incorrect or ambiguous transaction outcome, loss of recovery, unsafe duplicate action, or inaccessible critical operation.
- `P1`: major task friction, unclear information hierarchy, preventable user error, or important responsive/keyboard problem.
- `P2`: consistency, comprehension, efficiency, or visual-polish opportunity.

## 5. Status and execution classes

### Status

- `DOCUMENTED`: this roadmap item is complete as documentation.
- `PLANNED`: ready to start in dependency order.
- `IN_PROGRESS`: evidence or design work is underway.
- `EVIDENCE_COMPLETE`: live audit and report are complete; no design is implied.
- `DESIGN_REVIEW`: a Figma proposal is ready for owner review.
- `APPROVED`: the owner approved the design direction.
- `IMPLEMENTED`: approved UX was delivered and verified in application code.
- `BLOCKED`: the required environment, data, hardware, decision, or contract is unavailable.
- `DEFERRED`: intentionally outside this Release 1 UX pass.

### Execution class

- `LIVE_AUDIT`: operate the existing app, capture evidence, and write findings; do not change application code.
- `FIGMA_DESIGN`: create an evidence-backed design for one audited domain; do not change application code.
- `ROADMAP_BASELINE`: create or update UX governance documentation; do not operate or change the application.
- `IMPLEMENTATION_REBASELINE`: convert approved Figma work into small frontend PR entries; do not implement them in the same task.

## 6. Recommended execution order

| Order | Work item | Domain | Status | Execution | Recommended model |
| --- | --- | --- | --- | --- | --- |
| 0 | UXR-00 | UX evidence protocol and roadmap | DOCUMENTED | ROADMAP_BASELINE | `gpt-5.6-sol`, high |
| 1 | UXR-A01 | Authentication and application navigation | PLANNED | LIVE_AUDIT | `gpt-5.6-sol`, high |
| 2 | UXR-A08 | Cash-session operation | PLANNED | LIVE_AUDIT | `gpt-5.6-sol`, high |
| 3 | UXR-A09 | Cashier search, cart, and scanner behavior | PLANNED | LIVE_AUDIT | `gpt-5.6-sol`, high |
| 4 | UXR-A10 | Checkout and post-checkout printing | PLANNED | LIVE_AUDIT | `gpt-5.6-sol`, high |
| 5 | UXR-A11 | Sales history, detail, and reprint | PLANNED | LIVE_AUDIT | `gpt-5.6-sol`, high |
| 6 | UXR-D00 | Visual direction comparison and owner selection | PLANNED | FIGMA_DESIGN | `gpt-5.6-sol`, high |
| 7 | UXR-A03 | Item categories | PLANNED | LIVE_AUDIT | `gpt-5.6-sol`, high |
| 8 | UXR-A04 | Item master and location inventory | PLANNED | LIVE_AUDIT | `gpt-5.6-sol`, high |
| 9 | UXR-A05 | Stock movement history | PLANNED | LIVE_AUDIT | `gpt-5.6-sol`, high |
| 10 | UXR-A06 | Stock adjustment | PLANNED | LIVE_AUDIT | `gpt-5.6-sol`, high |
| 11 | UXR-A07 | Stock transfer | PLANNED | LIVE_AUDIT | `gpt-5.6-sol`, high |
| 12 | UXR-A12 | Supplier master data | PLANNED | LIVE_AUDIT | `gpt-5.6-sol`, high |
| 13 | UXR-A13 | Goods-receipt history and detail | PLANNED | LIVE_AUDIT | `gpt-5.6-sol`, high |
| 14 | UXR-A14 | Goods-receipt creation | PLANNED | LIVE_AUDIT | `gpt-5.6-sol`, high |
| 15 | UXR-A15 | Supplier payables and payment | PLANNED | LIVE_AUDIT | `gpt-5.6-sol`, high |
| 16 | UXR-A16 | Expense history and creation | PLANNED | LIVE_AUDIT | `gpt-5.6-sol`, high |
| 17 | UXR-A17 | Expense void/reversal | PLANNED | LIVE_AUDIT | `gpt-5.6-sol`, high |
| 18 | UXR-A02 | Operational dashboard | PLANNED | LIVE_AUDIT | `gpt-5.6-sol`, high |
| 19 | UXR-A18 | Cross-domain evidence synthesis | PLANNED | LIVE_AUDIT | `gpt-5.6-sol`, high |

Cashier work comes first because it is the highest-frequency, most time-sensitive working mode. UXR-D00 then compares visual directions using evidence from the shell, cashier, checkout, and sales-history workflows before broader domain design begins. Back-office audits follow the operational sequence from item setup through stock, purchasing, debt, and expense handling. Dashboard audit comes after its drill-down destinations so its navigation value can be judged in context.

Live audits may continue while UXR-D00 is under review. Domain Figma work begins only after its own evidence is complete and UXR-D00 has an owner-approved direction; it does not need to wait for every audit. Application implementation must wait for owner approval of that domain's design.

### 6.1 Early visual-direction checkpoint

UXR-D00 is a comparison and selection task, not a whole-application redesign. It must present exactly three realistic visual directions using the same representative content, state, and viewport so the owner can compare the design language rather than different features.

The three candidates should explore these distinct hypotheses:

1. **Compact operational:** denser information, stronger table efficiency, and shorter action paths.
2. **Calm guided:** more spacing, stronger progressive disclosure, and clearer step-by-step emphasis.
3. **Mode-aware hybrid:** a compact cashier workspace and calmer back-office surfaces using one coherent token and component language.

Each candidate must include:

- one representative cashier/cart or checkout frame;
- one representative back-office list/detail frame;
- one narrow-desktop responsive frame;
- the same Bahasa Indonesia copy, data, transaction state, and viewport as the other candidates;
- annotations for density, typography, color/surface hierarchy, navigation, form/table treatment, status communication, focus, and accessibility;
- exported screenshots or a comparison board that can be reviewed without opening each frame separately.

The owner may approve one candidate or an explicitly documented hybrid of named traits. The model must not choose or mark a direction approved on the owner's behalf. Record the final choice and rationale in `docs/ux/design/visual-direction-decision.md`. UXR-D01 through UXR-D15 must follow that decision unless later domain evidence justifies and records a specific deviation.

## 7. Live-audit work items

### UXR-00 — UX evidence protocol and roadmap

- **Domain:** UX program governance.
- **Status:** `DOCUMENTED`.
- **Execution class:** `ROADMAP_BASELINE`.
- **Dependencies:** Implemented Release 1 frontend and its contract.
- **Environment gate:** Repository inspection proves the working route/domain inventory.
- **Exact scope:** Establish live-first capture rules, artifact format, audit order, Figma gate, and later implementation-rebaseline rule.
- **Out of scope:** Live app operation, screenshots, Figma creation, application changes, Cypress installation.
- **Recommended model:** `gpt-5.6-sol`, high reasoning.
- **Expected output:** This roadmap.
- **Validation:** Re-read the contract, frontend roadmap, current routes, and this document; verify documentation-only diff.
- **Block condition:** None.
- **Split trigger:** Any application or dependency change must be separated from this documentation item.

### UXR-A01 — Authentication and application navigation

- **Domain:** Authentication, shell, and navigation entry.
- **Status:** `PLANNED`.
- **Execution class:** `LIVE_AUDIT`.
- **Dependencies:** UXR-00.
- **Environment gate:** Frontend/backend running with a disposable valid account and a way to exercise invalid/expired authentication.
- **Exact scope:** `/login`, protected-route gating, session expiration, back-office sidebar/header, active route indication, cashier/back-office transition, not-found handling, wide/narrow navigation, and keyboard focus.
- **Out of scope:** Permission redesign, route restructuring, visual implementation, other domain page content.
- **Recommended model:** `gpt-5.6-sol`, high reasoning.
- **Expected output:** `docs/ux/audits/uxr-a01-auth-navigation.md` plus referenced evidence.
- **Validation:** Every implemented top-level destination is reachable and correctly identified; protected content does not flash; keyboard and narrow-width navigation are recorded.
- **Block condition:** Authentication cannot be exercised safely in the local environment.
- **Split trigger:** If authentication findings and navigation findings each exceed ten material scenarios, finish authentication and create a separate navigation audit item.

**Copy-ready prompt**

> Perform UXR-A01 as a read-only live UX audit. Read `AGENTS.md`, the frontend contract, the frontend roadmap, and the UX rework roadmap; inspect Git status and current routes. Start or use the local development frontend/backend without changing repository files. With disposable local data, exercise login success/failure/pending, protected-route gating, session expiry where safely reproducible, back-office sidebar/header, active-route indication, cashier/back-office transition, not-found behavior, keyboard focus, and wide/narrow desktop navigation. Capture the scenario evidence defined by the roadmap and write only `docs/ux/audits/uxr-a01-auth-navigation.md` plus explicitly approved evidence artifacts. Separate observed facts, inference, and owner decisions. Do not redesign or implement anything, add Cypress/dependencies, change routes, or use production data. If a state cannot be reproduced safely, document the limitation rather than simulating an unsafe result.

### UXR-A02 — Operational dashboard

- **Domain:** Dashboard.
- **Status:** `PLANNED`.
- **Execution class:** `LIVE_AUDIT`.
- **Dependencies:** UXR-A01 and completed audits for its drill-down destinations.
- **Environment gate:** Backend operational-overview data supports normal, zero/no-session, and refresh observations in disposable data.
- **Exact scope:** `/dashboard` information hierarchy, metric comprehension, zero versus no-session meaning, freshness/stale messaging, refresh failure, responsive layout, and drill-down discoverability.
- **Out of scope:** New metrics, frontend aggregation, profitability claims, chart redesign, implementation.
- **Recommended model:** `gpt-5.6-sol`, high reasoning.
- **Expected output:** `docs/ux/audits/uxr-a02-dashboard.md` plus referenced evidence.
- **Validation:** Each displayed metric maps to its backend meaning and each recognized drill-down reaches a useful completed workflow.
- **Block condition:** Required seeded dashboard states cannot be distinguished without corrupting transaction data.
- **Split trigger:** New metric requests become product discovery items, not extensions of this audit.

**Copy-ready prompt**

> Perform UXR-A02 as a read-only live UX audit of `/dashboard`. Read the required Bloom docs and prior domain audit reports, inspect Git status, and use the existing local app with disposable data. Capture normal, zero, no-open-session, backend-stale, refresh-success, and safely reproducible refresh-failure behavior; inspect information hierarchy, Indonesian labels/formatting, responsive layout, keyboard access, status announcements, and every approved drill-down. Write `docs/ux/audits/uxr-a02-dashboard.md` with evidence, findings, priorities, and limitations. Do not add metrics, aggregate values in the browser, redesign charts, change application code, install dependencies, or use production data.

### UXR-A03 — Item categories

- **Domain:** Item categories.
- **Status:** `PLANNED`.
- **Execution class:** `LIVE_AUDIT`.
- **Dependencies:** UXR-A01.
- **Environment gate:** Disposable active and referenced category data exists.
- **Exact scope:** Category list, search/paging if present, empty/error/loading, create, edit, validation, duplicate/conflict, deactivate confirmation, success, focus return, and narrow layout.
- **Out of scope:** Item creation, hierarchy, backend policy changes, implementation.
- **Recommended model:** `gpt-5.6-sol`, high reasoning.
- **Expected output:** `docs/ux/audits/uxr-a03-item-categories.md` plus referenced evidence.
- **Validation:** The audit distinguishes safe deactivation from destructive deletion and records input preservation after failure.
- **Block condition:** Referenced test data cannot be safely created or restored.
- **Split trigger:** List and maintenance may be separated if the report becomes too large to review coherently.

**Copy-ready prompt**

> Perform UXR-A03 as a read-only repository/live UX audit of the item-category workflow. Exercise the implemented list, empty/loading/error where safely reproducible, create, edit, validation, duplicate/conflict, deactivate confirmation, success, keyboard/focus, and narrow desktop behavior with disposable local data. Capture evidence and write `docs/ux/audits/uxr-a03-item-categories.md`. Preserve the backend's deactivate semantics and distinguish facts from recommendations. Do not audit item master data, redesign or implement components, install Cypress, or change application/backend files.

### UXR-A04 — Item master and location inventory

- **Domain:** Items.
- **Status:** `PLANNED`.
- **Execution class:** `LIVE_AUDIT`.
- **Dependencies:** UXR-A03.
- **Environment gate:** Disposable whole-unit and fractional items exist, including editable and movement-locked examples.
- **Exact scope:** Item list/detail, category context, STORE/WAREHOUSE quantities, UOM/fraction comprehension, create with/without opening stock, validation/conflict/success, edit before/after lock, barcode/detail/audit entry points, keyboard, and responsive behavior.
- **Out of scope:** Posting adjustment/transfer/receipt, UOM conversion, backend vocabulary changes, implementation.
- **Recommended model:** `gpt-5.6-sol`, high reasoning.
- **Expected output:** `docs/ux/audits/uxr-a04-items.md` plus referenced evidence.
- **Validation:** Whole/fractional and locked/unlocked differences are visible and understandable without suggesting direct stock editing.
- **Block condition:** Required item states cannot be created safely in disposable data.
- **Split trigger:** Split list/detail from create/edit if one report would obscure separate journeys.

**Copy-ready prompt**

> Perform UXR-A04 as a live UX audit of the item domain only. Read the governing docs and inspect current routes/components without modifying them. Using disposable local whole-unit, fractional, unlocked, and movement-locked items, exercise list/detail, STORE/WAREHOUSE display, UOM/fraction comprehension, create with and without opening stock, validation/conflict/success, edit before/after lock, barcode/detail/audit entry points, keyboard/focus, and wide/narrow layouts. Capture evidence and write `docs/ux/audits/uxr-a04-items.md`. Never alter stock except through the implemented disposable create flow, propose direct stock editing, change UOM rules, redesign, or install dependencies.

### UXR-A05 — Stock movement history

- **Domain:** Stock movements.
- **Status:** `PLANNED`.
- **Execution class:** `LIVE_AUDIT`.
- **Dependencies:** UXR-A04.
- **Environment gate:** Disposable data contains representative opening, receipt, adjustment, transfer, sale, and reversal movements where implemented.
- **Exact scope:** `/stock-movements`, item-scoped entry, filters, paging, empty/error/loading, reference comprehension, UOM/location/direction/actor/time display, keyboard, and responsive table behavior.
- **Out of scope:** Posting movements, rebuilding history client-side, reporting, implementation.
- **Recommended model:** `gpt-5.6-sol`, high reasoning.
- **Expected output:** `docs/ux/audits/uxr-a05-stock-movements.md` plus referenced evidence.
- **Validation:** A reviewer can trace representative movements to their source without additional N+1-style UI steps.
- **Block condition:** Seed data lacks enough movement types for meaningful comparison.
- **Split trigger:** Reference drill-downs requiring another domain are recorded for that domain, not audited here.

**Copy-ready prompt**

> Perform UXR-A05 as a read-only live UX audit of stock movement history. With disposable representative movement data, exercise `/stock-movements`, item-scoped navigation, supported filters, paging, empty/loading/error states, source references, decimal quantity/UOM, location/direction, actor/time, keyboard, and narrow-table behavior. Produce `docs/ux/audits/uxr-a05-stock-movements.md` with evidence-backed P0/P1/P2 findings. Do not post movements, reconstruct data in the frontend, redesign, implement, or change repository/dependency state.

### UXR-A06 — Stock adjustment

- **Domain:** Stock adjustment.
- **Status:** `PLANNED`.
- **Execution class:** `LIVE_AUDIT`.
- **Dependencies:** UXR-A04 and UXR-A05.
- **Environment gate:** Disposable items support safe ADD, REMOVE, and CORRECTION scenarios; database can be reseeded.
- **Exact scope:** List/detail/create, item discovery, location/action comprehension, decimal and whole-unit input, CORRECTION zero, validation, confirmation, pending, backend conflict, confirmed result, durable ambiguous-outcome messaging as safely observable, keyboard, and responsive behavior.
- **Out of scope:** Transfer, bulk CSV, frontend resulting-stock calculation, forced network corruption, implementation.
- **Recommended model:** `gpt-5.6-sol`, high reasoning.
- **Expected output:** `docs/ux/audits/uxr-a06-stock-adjustment.md` plus referenced evidence.
- **Validation:** Audit confirms that the interface distinguishes delta actions from absolute correction and never presents browser-calculated resulting stock as fact.
- **Block condition:** Test transactions cannot be isolated/reseeded or an uncertain request could affect non-disposable data.
- **Split trigger:** Separate read history from create interaction if scenario volume exceeds a focused report.

**Copy-ready prompt**

> Perform UXR-A06 as a live UX audit of stock adjustment only. Use a disposable/reseedable local dataset and record all created transactions. Exercise list/detail/create, item selection, STORE/WAREHOUSE, ADD/REMOVE positive deltas, CORRECTION absolute target including zero, whole/fractional quantity validation, confirmation, pending, safe conflicts, backend-confirmed results, keyboard/focus, and responsive behavior. Inspect existing automated tests for dangerous states that cannot be reproduced safely; label those as test evidence rather than live evidence. Write `docs/ux/audits/uxr-a06-stock-adjustment.md`. Do not force ambiguous production-like failures, calculate stock locally, audit transfer, redesign, implement, or install dependencies.

### UXR-A07 — Stock transfer

- **Domain:** Stock transfer.
- **Status:** `PLANNED`.
- **Execution class:** `LIVE_AUDIT`.
- **Dependencies:** UXR-A04 and UXR-A05.
- **Environment gate:** Disposable STORE/WAREHOUSE stock permits safe transfer and validation scenarios.
- **Exact scope:** Transfer item selection, source/destination choice and swap, same-location prevention, decimal/whole quantity, advisory availability, confirmation, pending/conflict/success reference, focus, and responsive layout.
- **Out of scope:** Multi-item transfer, reporting, adjustment, frontend stock calculation, implementation.
- **Recommended model:** `gpt-5.6-sol`, high reasoning.
- **Expected output:** `docs/ux/audits/uxr-a07-stock-transfer.md` plus referenced evidence.
- **Validation:** Source and destination remain unambiguous throughout confirmation and result.
- **Block condition:** Safe source stock or reseed capability is unavailable.
- **Split trigger:** Multi-item or approval concepts are separate product discovery, not this audit.

**Copy-ready prompt**

> Perform UXR-A07 as a live UX audit of the single-item stock-transfer workflow using disposable local stock. Exercise item lookup, source/destination selection and swap, identical-location prevention, whole/fractional quantity, advisory availability, validation, confirmation, pending, safe backend conflict, success reference, focus, keyboard, and responsive layout. Record created transfers and cleanup/reseed, then write `docs/ux/audits/uxr-a07-stock-transfer.md`. Do not audit adjustment, introduce multi-item concepts, calculate stock in the browser, redesign, implement, or change dependencies.

### UXR-A08 — Cash-session operation

- **Domain:** Cash sessions.
- **Status:** `PLANNED`.
- **Execution class:** `LIVE_AUDIT`.
- **Dependencies:** UXR-A01.
- **Environment gate:** Disposable database can start with no open session and can create/close test sessions safely.
- **Exact scope:** Verified no-session state, opening cash, open-session visibility in cashier, expected-cash preview, actual-cash entry, close confirmation, server variance, already-closed conflict where safe, history/detail, money/date formatting, keyboard, and responsive behavior.
- **Out of scope:** Calculating drawer cash, post-close correction policy, sale/payment/expense interaction beyond session visibility, implementation.
- **Recommended model:** `gpt-5.6-sol`, high reasoning.
- **Expected output:** `docs/ux/audits/uxr-a08-cash-sessions.md` plus referenced evidence.
- **Validation:** No-session, open, closing, and closed states are clearly distinguishable; expected and variance are visibly server-confirmed.
- **Block condition:** An existing non-disposable open session prevents controlled scenarios.
- **Split trigger:** Split active-session operations from history/detail if the audit exceeds a coherent journey.

**Copy-ready prompt**

> Perform UXR-A08 as a live UX audit of cash sessions in a disposable/reseedable local environment. Exercise verified no-session, opening cash, current-session visibility, expected-cash preview, actual-cash entry, confirmation, pending, safe already-closed/conflict behavior, server-confirmed variance, history/detail, Indonesian money/date formatting, keyboard/focus, and responsive layout. Record all state-changing test actions and cleanup. Write `docs/ux/audits/uxr-a08-cash-sessions.md`. Do not calculate expected cash/variance, test unrelated cashier transactions, redesign, implement, or change application/dependencies.

### UXR-A09 — Cashier search, cart, and scanner behavior

- **Domain:** Cashier item entry and cart.
- **Status:** `PLANNED`.
- **Execution class:** `LIVE_AUDIT`.
- **Dependencies:** UXR-A04 and UXR-A08.
- **Environment gate:** A verified open session and disposable active/inactive, whole/fractional, zero/positive STORE-stock items exist. Physical scanner findings remain limited to hardware actually available.
- **Exact scope:** Cashier entry, session gating, manual search, loading/empty/not-found, add/duplicate/remove, decimal quantity editing, UOM and advisory availability, focus order, rapid keyboard interaction, current scanner behavior, announcements, and wide/narrow layout.
- **Out of scope:** Checkout submission, receipt printing, scanner hardware claims not observed on the test machine, inventory administration, implementation.
- **Recommended model:** `gpt-5.6-sol`, high reasoning.
- **Expected output:** `docs/ux/audits/uxr-a09-cashier-cart.md` plus referenced evidence.
- **Validation:** Manual entry remains usable, duplicate behavior is understood, focus is predictable, and no item-entry action can submit checkout.
- **Block condition:** Cashier cannot obtain a controlled open session or representative catalog data.
- **Split trigger:** Store-laptop E81W verification remains FE-19 evidence and must not be replaced by this general UX audit.

**Copy-ready prompt**

> Perform UXR-A09 as a live UX audit of cashier search/cart only. Use a verified disposable open session and representative active/inactive, whole/fractional, zero/positive STORE-stock items. Exercise manual search, loading/empty/not-found, add, duplicate, remove, decimal editing, UOM/advisory availability, announcements, focus order, rapid keyboard use, scanner behavior only on hardware actually present, and wide/narrow layout. Capture evidence and write `docs/ux/audits/uxr-a09-cashier-cart.md`. Do not submit checkout, print, generalize unobserved scanner behavior, modify inventory administration, redesign, implement, or install dependencies.

### UXR-A10 — Checkout and post-checkout printing

- **Domain:** Sale checkout and receipt outcome.
- **Status:** `PLANNED`.
- **Execution class:** `LIVE_AUDIT`.
- **Dependencies:** UXR-A08 and UXR-A09.
- **Environment gate:** Disposable open session/cart data exists; backend printer is either safely available or its absence can produce a genuine non-destructive print failure.
- **Exact scope:** CASH and QRIS selection, tender input, confirmation, frozen pending state, validation/conflict, backend-confirmed sale values, cart clearing, print sequencing, print failure/retry, navigation to sale detail, and recovery messaging. Use existing tests as evidence for unsafe-to-force ambiguous outcomes.
- **Out of scope:** Sale void/return, browser/PDF fallback, synthetic duplicate sale, forced ambiguous network failure against non-disposable data, implementation.
- **Recommended model:** `gpt-5.6-sol`, high reasoning.
- **Expected output:** `docs/ux/audits/uxr-a10-checkout-print.md` plus referenced evidence.
- **Validation:** Sale success is always established before print status; no print action can recreate a sale; CASH and QRIS remain distinguishable.
- **Block condition:** Test sales cannot be safely isolated or printer behavior cannot be exercised without affecting a real device unexpectedly.
- **Split trigger:** If physical printer testing requires the store environment, complete browser workflow evidence and create a separately blocked hardware-validation subsection.

**Copy-ready prompt**

> Perform UXR-A10 as a live UX audit of checkout and post-checkout printing using disposable local transactions. Exercise CASH and QRIS separately, tender/validation, confirmation, frozen pending state, safe backend conflicts, backend-confirmed sale code/total/paid/change, cart clearing, print sequencing, genuine print success or safe failure, retry/reprint, and navigation to sale detail. Use existing automated tests only for dangerous ambiguous/duplicate cases that should not be forced live, and label evidence sources. Write `docs/ux/audits/uxr-a10-checkout-print.md`. Confirm that sale success precedes print status and print cannot resubmit sale. Do not implement returns, browser/PDF fallback, redesign, application changes, or dependencies.

### UXR-A11 — Sales history, detail, and reprint

- **Domain:** Sales read workflow.
- **Status:** `PLANNED`.
- **Execution class:** `LIVE_AUDIT`.
- **Dependencies:** UXR-A10.
- **Environment gate:** Disposable sale records cover CASH/QRIS and whole/fractional lines.
- **Exact scope:** Sales list filters/paging, loading/error/empty, status and monetary comprehension, detail hierarchy, line/location display, session/reference context, reprint action and feedback, keyboard, and responsive behavior.
- **Out of scope:** Checkout, correction mutation, reporting/export, implementation.
- **Recommended model:** `gpt-5.6-sol`, high reasoning.
- **Expected output:** `docs/ux/audits/uxr-a11-sales.md` plus referenced evidence.
- **Validation:** All financial/status facts are clearly backend-confirmed and reprint remains separate from sale creation.
- **Block condition:** Representative sales cannot be created or restored safely.
- **Split trigger:** Split list from detail/reprint if evidence volume makes one report hard to review.

**Copy-ready prompt**

> Perform UXR-A11 as a live UX audit of sales history/detail/reprint only. Use representative disposable CASH/QRIS and whole/fractional sales. Exercise list loading/error/empty, supported filters/paging, statuses and money, detail hierarchy, line UOM/location, session/reference, reprint pending/success/failure where safe, keyboard, and responsive behavior. Write `docs/ux/audits/uxr-a11-sales.md` with evidence-backed findings. Do not submit checkout, add corrections/reporting, infer financial statuses, redesign, implement, or change dependencies.

### UXR-A12 — Supplier master data

- **Domain:** Suppliers.
- **Status:** `PLANNED`.
- **Execution class:** `LIVE_AUDIT`.
- **Dependencies:** UXR-A01.
- **Environment gate:** Disposable active/inactive and referenced suppliers exist.
- **Exact scope:** Supplier search/list/paging/filter, detail, create, edit with immutable code, validation/duplicate conflict, deactivate confirmation, history-preserving language, keyboard, and responsive behavior.
- **Out of scope:** Receipts, debt/payment, hard deletion, implementation.
- **Recommended model:** `gpt-5.6-sol`, high reasoning.
- **Expected output:** `docs/ux/audits/uxr-a12-suppliers.md` plus referenced evidence.
- **Validation:** Stable identity and deactivate semantics remain understandable throughout the workflow.
- **Block condition:** Supplier test data cannot be safely restored.
- **Split trigger:** Separate read from maintenance if report size harms review.

**Copy-ready prompt**

> Perform UXR-A12 as a live UX audit of suppliers only. With disposable active, inactive, and referenced supplier records, exercise search/list/paging/filter, detail, create, immutable-code edit, validation/duplicate conflict, deactivate confirmation, focus/keyboard, and narrow layouts. Capture evidence and write `docs/ux/audits/uxr-a12-suppliers.md`. Preserve stable supplier identity and deactivation/history semantics. Do not audit goods receipts or payments, hard-delete data, redesign, implement, or install dependencies.

### UXR-A13 — Goods-receipt history and detail

- **Domain:** Goods-receipt read workflow.
- **Status:** `PLANNED`.
- **Execution class:** `LIVE_AUDIT`.
- **Dependencies:** UXR-A04 and UXR-A12.
- **Environment gate:** Representative unpaid, partial, and paid receipts exist with decimal lines and both stock locations where valid.
- **Exact scope:** List filters/paging/date semantics, loading/error/empty, supplier/reference/status comprehension, detail hierarchy, UOM/location lines, total/paid/outstanding, keyboard, and responsive tables.
- **Out of scope:** Receipt creation, payment mutation, frontend financial calculation, implementation.
- **Recommended model:** `gpt-5.6-sol`, high reasoning.
- **Expected output:** `docs/ux/audits/uxr-a13-goods-receipt-history.md` plus referenced evidence.
- **Validation:** Receipt and payment status plus server financial values are understandable without client aggregation.
- **Block condition:** Representative receipts are unavailable.
- **Split trigger:** Detail becomes a separate report if line-table evidence dominates the list journey.

**Copy-ready prompt**

> Perform UXR-A13 as a live UX audit of goods-receipt list/detail only. Use representative unpaid, partial, and paid disposable receipts with decimal UOM/location lines. Exercise list loading/error/empty, supported filters/paging and calendar-date behavior, supplier/reference/status comprehension, detail hierarchy, total/paid/outstanding, keyboard, and responsive tables. Write `docs/ux/audits/uxr-a13-goods-receipt-history.md`. Do not create receipts, post payments, calculate financial values, redesign, implement, or change dependencies.

### UXR-A14 — Goods-receipt creation

- **Domain:** Goods receipt posting.
- **Status:** `PLANNED`.
- **Execution class:** `LIVE_AUDIT`.
- **Dependencies:** UXR-A04, UXR-A12, and UXR-A13.
- **Environment gate:** Disposable supplier/items and reseedable stock/debt data exist.
- **Exact scope:** Supplier/item lookup, repeated lines, whole/fraction quantity and purchase-price entry, per-line location, received time/offset, draft persistence, validation, confirmation, pending/conflict, exact recovery, and server-confirmed result hierarchy.
- **Out of scope:** Initial payment, supplier creation, frontend total authority, forced uncertainty, implementation.
- **Recommended model:** `gpt-5.6-sol`, high reasoning.
- **Expected output:** `docs/ux/audits/uxr-a14-goods-receipt-create.md` plus referenced evidence.
- **Validation:** One atomic posting remains clear; input recovery does not obscure whether the receipt completed.
- **Block condition:** Test receipts cannot be isolated or reseeded.
- **Split trigger:** Line editing and transaction confirmation may be reported separately if either becomes too large.

**Copy-ready prompt**

> Perform UXR-A14 as a live UX audit of goods-receipt creation using disposable/reseedable data. Exercise supplier/item lookup, repeated lines, whole/fraction quantity, purchase price, per-line location, received time/offset, draft persistence, validation, confirmation, pending, safe conflict, exact recovery, and backend-confirmed total/paid/outstanding/status. Record created data and cleanup, then write `docs/ux/audits/uxr-a14-goods-receipt-create.md`. Do not add initial payment, create suppliers, force ambiguous failures, treat previews as authoritative, redesign, implement, or change dependencies.

### UXR-A15 — Supplier payables and payment

- **Domain:** Supplier debt and one-receipt payment.
- **Status:** `PLANNED`.
- **Execution class:** `LIVE_AUDIT`.
- **Dependencies:** UXR-A08, UXR-A13, and UXR-A14.
- **Environment gate:** Disposable unpaid/partial receipts and an open session for CASH scenarios exist.
- **Exact scope:** Payable discovery, supplier/receipt context, outstanding/status comprehension, partial/full payment, CASH/BANK_TRANSFER/QRIS differences, session gating, overpayment, confirmation, pending/conflict/recovery, refresh failure messaging, keyboard, and responsive behavior.
- **Out of scope:** Multi-receipt allocation, credit/prepayment, reversal UI, frontend debt calculation, implementation.
- **Recommended model:** `gpt-5.6-sol`, high reasoning.
- **Expected output:** `docs/ux/audits/uxr-a15-payables-payment.md` plus referenced evidence.
- **Validation:** One-payment-to-one-receipt and CASH-only drawer/session effects are unambiguous.
- **Block condition:** Test payments could affect non-disposable financial data.
- **Split trigger:** Split payable discovery from payment interaction if the combined report is too large.

**Copy-ready prompt**

> Perform UXR-A15 as a live UX audit of supplier payables and one-receipt payment using disposable data. Exercise payable discovery, supplier/receipt context, backend outstanding/status, partial/full payment, CASH/BANK_TRANSFER/QRIS differences, CASH session gating, overpayment rejection, confirmation, pending, safe conflicts, exact recovery, refresh failure messaging, keyboard, and responsive behavior. Record all financial test mutations and cleanup. Write `docs/ux/audits/uxr-a15-payables-payment.md`. Do not add multi-receipt allocation, credit/prepayment, reversal, local debt calculation, redesign, implementation, or dependencies.

### UXR-A16 — Expense history and creation

- **Domain:** Unexpected expense history and posting.
- **Status:** `PLANNED`.
- **Execution class:** `LIVE_AUDIT`.
- **Dependencies:** UXR-A08.
- **Environment gate:** Disposable open/closed session history and safe expense posting are available.
- **Exact scope:** Expense history/paging, empty/error/loading, record hierarchy, open-session gating, category/reason comprehension, amount entry, confirmation, pending/conflict/recovery, server result, keyboard, and responsive behavior.
- **Out of scope:** Void/reversal, category administration, frontend drawer calculation, implementation.
- **Recommended model:** `gpt-5.6-sol`, high reasoning.
- **Expected output:** `docs/ux/audits/uxr-a16-expense-create.md` plus referenced evidence.
- **Validation:** Posting is visibly bound to the verified session and uncertain recovery never silently retargets another session/account.
- **Block condition:** Disposable session/expense data cannot be isolated.
- **Split trigger:** Split history from create if state coverage exceeds a focused report.

**Copy-ready prompt**

> Perform UXR-A16 as a live UX audit of expense history/create using disposable sessions and data. Exercise history paging/loading/error/empty, record hierarchy, no/open-session gating, category and “Alasan / catatan”, decimal amount, validation, confirmation, pending, safe conflict, exact recovery, backend-confirmed result, keyboard, and responsive behavior. Record mutations and cleanup, then write `docs/ux/audits/uxr-a16-expense-create.md`. Do not void expenses, administer categories, calculate drawer cash, redesign, implement, or install dependencies.

### UXR-A17 — Expense void/reversal

- **Domain:** Expense correction.
- **Status:** `PLANNED`.
- **Execution class:** `LIVE_AUDIT`.
- **Dependencies:** UXR-A16.
- **Environment gate:** Disposable eligible, already-voided, and closed-session examples exist or can be safely created.
- **Exact scope:** Eligibility visibility, block reasons, fresh-detail behavior, reasoned confirmation, pending/conflict/recovery, audit result retention, original-session context, focus, keyboard, and responsive behavior.
- **Out of scope:** Delete/edit, post-close policy expansion, sale/supplier-payment correction, implementation.
- **Recommended model:** `gpt-5.6-sol`, high reasoning.
- **Expected output:** `docs/ux/audits/uxr-a17-expense-void.md` plus referenced evidence.
- **Validation:** Original and reversal facts remain distinct; ineligible operations are explained before destructive confirmation.
- **Block condition:** Safe eligible/ineligible fixtures cannot be established.
- **Split trigger:** Future post-close correction is separate product discovery.

**Copy-ready prompt**

> Perform UXR-A17 as a live UX audit of expense void/reversal using disposable eligible, already-voided, and closed-session records. Exercise eligibility/block reason, fresh detail, reason entry, confirmation, pending, safe stale/conflict, exact recovery, retained audit result, original-session context, focus, keyboard, and responsive behavior. Record mutations/cleanup and write `docs/ux/audits/uxr-a17-expense-void.md`. Do not delete/edit expenses, invent post-close correction, audit sale/payment correction, redesign, implement, or change dependencies.

### UXR-A18 — Cross-domain evidence synthesis

- **Domain:** UX evidence synthesis; no application domain implementation.
- **Status:** `PLANNED`.
- **Execution class:** `LIVE_AUDIT`.
- **Dependencies:** All required UXR-A01 through UXR-A17 reports.
- **Environment gate:** Each included report separates evidence, inference, and owner decisions.
- **Exact scope:** Consolidate repeated interaction/copy/layout/accessibility problems, identify preserved strengths, map journey handoffs, rank P0/P1/P2 findings, and recommend domain design order.
- **Out of scope:** Figma creation, a global design system, implementation backlog details, changing product/backend rules.
- **Recommended model:** `gpt-5.6-sol`, high reasoning.
- **Expected output:** `docs/ux/audits/release-1-ux-synthesis.md` with an evidence index and owner-decision register.
- **Validation:** Every synthesized finding links back to domain evidence; repeated patterns are not generalized from a single screen.
- **Block condition:** Critical domain reports or their evidence are missing.
- **Split trigger:** Domain-specific recommendations stay in their source reports; synthesis contains only cross-domain patterns and prioritization.

**Copy-ready prompt**

> Perform UXR-A18 as a read-only synthesis of completed Bloom UX audit reports. Read the frontend contract, frontend roadmap, UX roadmap, and every included `docs/ux/audits/uxr-a*.md` report. Do not operate the app unless a cited fact needs narrow verification. Produce `docs/ux/audits/release-1-ux-synthesis.md` containing preserved strengths, repeated evidence-backed problems, journey handoff issues, P0/P1/P2 prioritization, an evidence index, owner decisions needed, and recommended Figma domain order. Link every conclusion to source scenarios and distinguish evidence from inference. Do not create designs, propose a global rewrite, change business rules, generate detailed implementation PRs, or modify application/dependency state.

## 8. Figma design queue

UXR-D00 begins after its representative audits are `EVIDENCE_COMPLETE`. Each domain design item, UXR-D01 through UXR-D15, begins only after its required audit is `EVIDENCE_COMPLETE` and UXR-D00 is `APPROVED`. Use `gpt-5.6-sol` with high reasoning for visual-direction comparison, the initial low-fidelity flow, and the refined Figma proposal. The Figma task must use the relevant Figma skills before calling Figma write tools.

| Design item | Domain | Audit dependency | Required design coverage |
| --- | --- | --- | --- |
| UXR-D00 | Visual direction comparison | UXR-A01, UXR-A09, UXR-A10, and UXR-A11 | Three comparable visual candidates, representative cashier/back-office/narrow frames, owner-selection record |
| UXR-D01 | Authentication and navigation | UXR-A01 | Login states, protected entry, back-office shell, cashier escape, narrow navigation |
| UXR-D02 | Dashboard | UXR-A02 | Operational hierarchy, zero/no-session/stale/error states, drill-downs |
| UXR-D03 | Item categories | UXR-A03 | List, create/edit, validation/conflict, deactivate |
| UXR-D04 | Items | UXR-A04 | List/detail, create/opening, edit/locks, whole/fractional/location display |
| UXR-D05 | Stock movements | UXR-A05 | Ledger, filters, references, narrow table |
| UXR-D06 | Stock adjustment | UXR-A06 | ADD/REMOVE/CORRECTION, confirmation, conflict, result/recovery |
| UXR-D07 | Stock transfer | UXR-A07 | Direction, swap, quantity, confirmation, conflict/result |
| UXR-D08 | Cash sessions | UXR-A08 | No/open/close/reconciliation/history/detail |
| UXR-D09 | Cashier cart | UXR-A09 | Search/scanner feedback, cart editing, focus, session gating |
| UXR-D10 | Checkout and printing | UXR-A10 | CASH/QRIS, pending/conflict/recovery, sale-first print states |
| UXR-D11 | Sales history | UXR-A11 | List/filter, detail hierarchy, status and reprint |
| UXR-D12 | Suppliers | UXR-A12 | List/detail, create/edit, deactivate |
| UXR-D13 | Goods receipts | UXR-A13 and UXR-A14 | List/detail and creation as separate Figma flows |
| UXR-D14 | Payables/payment | UXR-A15 | Debt discovery, one-receipt payment, payment methods and states |
| UXR-D15 | Expenses | UXR-A16 and UXR-A17 | History/create and void as separate Figma flows |

### UXR-D00 — Visual direction comparison and owner selection

- **Domain:** Product visual direction; no business-domain implementation.
- **Status:** `PLANNED`.
- **Execution class:** `FIGMA_DESIGN`.
- **Dependencies:** UXR-A01, UXR-A09, UXR-A10, and UXR-A11 must be `EVIDENCE_COMPLETE`.
- **User-visible goal:** Let the owner compare realistic alternatives before later screens inherit a visual direction.
- **Exact scope:** Create exactly three candidates using identical representative content and states: compact operational, calm guided, and mode-aware hybrid. For each candidate, provide one cashier/cart or checkout frame, one back-office list/detail frame, and one narrow-desktop responsive frame.
- **Out of scope:** Full domain flows, new product behavior, business-rule or API changes, a production-ready global design system, application code, or selecting a winner without the owner.
- **Recommended model:** `gpt-5.6-sol`, high reasoning.
- **Expected output:** Figma comparison frames, exported screenshots or one comparison board, concise trade-offs, reusable-pattern observations, and `docs/ux/design/visual-direction-decision.md` after the owner selects a direction.
- **Validation:** Candidates use the same copy, data, state, viewport, and interaction facts; contrast, focus visibility, table/form legibility, density, and wide/narrow behavior are compared consistently.
- **Block condition:** Representative audit evidence, the target Figma file/project, or owner availability for selection is missing.
- **Split trigger:** More than three candidates or full domain-state coverage is requested; keep those ideas for the relevant UXR-D01 through UXR-D15 item.

**Copy-ready visual-direction prompt**

> Perform only UXR-D00, Bloom's visual-direction comparison. Read `AGENTS.md`, the frontend contract, the frontend and UX roadmaps, and the completed UXR-A01, UXR-A09, UXR-A10, and UXR-A11 reports with their referenced evidence. Inspect the current components and use the required Figma skills in `[FIGMA_FILE_OR_NODE]`. Create exactly three clearly differentiated candidates—compact operational, calm guided, and mode-aware hybrid—using identical Bahasa Indonesia copy, data, transaction state, and viewports. For each candidate, create one representative cashier/cart or checkout frame, one back-office list/detail frame, and one narrow-desktop responsive frame. Preserve backend authority, current transaction/recovery meaning, keyboard/focus behavior, and useful existing components. Provide Figma links, exported screenshots or a single comparison board, and a concise matrix covering density, speed, comprehension, accessibility, responsiveness, reuse cost, and trade-offs. Stop at `DESIGN_REVIEW`; do not choose or approve a winner, create full workflows, modify application code, invent APIs/business rules, or build a global design system. After the owner responds, record the selected candidate or explicitly named hybrid traits and rationale in `docs/ux/design/visual-direction-decision.md` and mark UXR-D00 `APPROVED`.

For each Figma item:

- **Status:** `PLANNED` until its audit is complete.
- **Execution class:** `FIGMA_DESIGN`.
- **User-visible goal:** Resolve approved P0/P1 findings first; address P2 polish without obscuring the workflow.
- **Exact scope:** One domain, its relevant viewports, and all states needed to explain the proposed interaction.
- **Out of scope:** Application code, new backend fields, unsupported actions, unrelated screens, global component replacement.
- **Expected output:** Figma flow/frame links, a short decision log, state coverage, reused/new component list, and unresolved owner decisions.
- **Validation:** Trace every proposed change to audit evidence; verify keyboard/focus order, Indonesian copy, responsive behavior, and backend authority.
- **Split trigger:** If a design item contains independently reviewable read and mutation workflows, present them as separate page sections or split the Figma item before approval.

**Copy-ready domain Figma prompt template**

> Design only `[UXR-DXX — DOMAIN]` for Bloom after UXR-D00 is owner-approved. First read `AGENTS.md`, `docs/architecture/release-1-frontend-contract.md`, `docs/plans/release-1-frontend-roadmap.md`, `docs/plans/release-1-ux-rework-roadmap.md`, `docs/ux/design/visual-direction-decision.md`, and `[AUDIT_REPORT_PATH]`. Inspect the current domain components and referenced screenshots/recordings. Use the required Figma skills and work in `[FIGMA_FILE_OR_NODE]`. Begin with the task flow and low-fidelity state coverage, then create a refined desktop design for the documented wide and narrow viewports that follows the approved visual direction. Preserve backend-owned facts, transaction recovery, current URLs unless evidence requires a change, Indonesian language, keyboard/focus behavior, and useful existing components. Resolve approved P0/P1 findings and identify optional P2 improvements. Include loading, empty, validation, pending, conflict, ambiguous/recovery, success, confirmation, and hardware-related states only where the audit shows they apply. Return Figma links, a concise decision log, reused/new components, audit-scenario traceability, and owner decisions needed. Record any evidence-based deviation from the approved direction. Do not modify application code, invent APIs or business rules, create a whole-app design system, or redesign another domain.

## 9. Implementation re-baseline

Do not write copy-ready implementation prompts for a UX design that has not been approved. Without approved Figma frame/node links and acceptance decisions, such prompts would encourage generic redesign and scope creep.

After one domain reaches `APPROVED`, run one documentation-only `IMPLEMENTATION_REBASELINE` task for that domain. It must create small UX implementation PR entries with:

- PR identifier and one domain/workflow;
- approved Figma file and exact node links;
- audit scenarios and findings being resolved;
- current components to preserve;
- exact component/page/style/test scope;
- explicit out-of-scope behavior;
- backend contract and transaction-recovery constraints;
- accessibility, keyboard, responsive, async, and localization acceptance criteria;
- expected logical size and split trigger;
- recommended implementation model;
- copy-ready implementation prompt;
- visual and automated validation requirements.

Use `gpt-5.6-sol` high for narrow visual/read-flow implementation. Use `gpt-5.6-sol` xhigh for cashier, stock mutation, cash-session, receipt posting, supplier payment, expense posting/reversal, and other designs where visual changes touch transaction state or durable recovery.

**Copy-ready implementation-rebaseline prompt**

> Re-baseline implementation work for only `[DOMAIN]` after owner approval of `[FIGMA_FILE_AND_NODE_LINKS]`. Read all Bloom governing docs, the domain audit report, its approved Figma decision log, and the current implementation/tests. Do not implement code. Add or update only the UX roadmap's implementation section with the smallest reviewable frontend PR entries needed to deliver the approved design. Each PR must own one coherent workflow, preserve backend authority and durable recovery, name exact current components likely to change, include state/accessibility/keyboard/responsive/localization acceptance criteria, stay near the existing review-size limits, and contain one copy-ready implementation prompt. Do not include unrelated cleanup, global redesign, dependency migration, route restructuring, or unapproved Figma alternatives.

## 10. Optional E2E automation decision

Cypress or another browser E2E dependency is not part of the live-audit phase. Reconsider it after the first approved designs are implemented and the critical journeys are stable.

A later proposal must demonstrate an immediate regression-testing need and initially limit coverage to a small set such as:

- authentication and protected entry;
- cash-session opening;
- CASH and QRIS checkout with duplicate protection;
- goods-receipt posting;
- one-receipt supplier payment;
- expense posting/void;
- cash-session closing.

The E2E proposal must separately address deterministic seed/reset, transaction cleanup, printer/scanner boundaries, CI environment, screenshots/videos, and flake control. It must not replace Vitest/React Testing Library coverage or use visual pixel snapshots as the sole correctness test.

## 11. Remaining inputs

These inputs should be recorded during UXR-00 or the first relevant audit:

1. Actual store-laptop browser viewport and display scaling; use `1440x900` wide and `1024x768` narrow only as temporary audit viewports until the real device is recorded.
2. Whether raw screenshots/recordings may be committed, should remain local working artifacts, or should be uploaded directly to the selected Figma project.
3. Which disposable database reset/reseed procedure is approved for live transaction capture.
4. The Figma file/project that will hold domain designs and who besides the owner will review them.
