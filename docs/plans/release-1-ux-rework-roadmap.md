# Bloom Release 1 UX Rework Roadmap

Last updated: 2026-09-28

## 1. Purpose

This roadmap turns the implemented Release 1 application into evidence-based UX improvements without starting a whole-application redesign.

The work proceeds one domain at a time:

1. Exercise the current application in a live browser.
2. Capture the complete workflow and important states.
3. Produce an evidence-backed UX audit.
4. Design the approved improvement in a reviewable artifact. For Bloom Release 1, the canonical
   domain designs are the interactive HTML artifacts, exported screenshots, and decision records.
5. Validate the proposed design against Bloom's business and accessibility contracts.
6. Create small implementation PR scopes only after the design is approved.

The existing frontend contract and implementation remain authoritative until an approved UX design
is implemented. A screenshot, audit observation, HTML prototype, or external design concept does not
change a backend business rule or API contract.

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
- Design one domain at a time in the approved review medium.
- Do not create a global redesign before validating the highest-frequency cashier workflows.
- Reuse current components and tokens where they remain suitable.
- Create or change shared patterns only after repeated domain evidence supports them.
- Preserve current URLs unless an approved domain design demonstrates a concrete routing problem.
- Do not combine approved UX implementation with TypeScript, state-management, API-client, router, styling-library, or dependency migration.

### 3.4 Owner approval

The repository owner remains the primary UX decision-maker. AI-generated findings and design
artifacts are proposals. Family usability feedback should be collected against a usable prototype or
Release 1 candidate, not treated as a substitute for product ownership.

## 4. Evidence format

Each live-audit task should produce one Markdown report under:

`docs/ux/audits/<work-item>-<domain>.md`

Screenshots and recordings are working artifacts. The owner decided on 2026-09-24 that live audits should retain a concise screenshot set under the domain-specific evidence directory for every materially distinct workflow step and state. Avoid redundant click-by-click frames, fabricated states, and sensitive data. Do not stage or commit large binary collections without explicit owner approval. The audit report must remain understandable even if raw recordings are stored outside Git.

The default working location is `docs/ux/evidence/<work-item>/`. Keep the concise
PNG set in that directory as working-tree evidence; leave binaries untracked unless
the owner explicitly approves staging/committing or moving them to an approved external
evidence store. “Read-only live audit” means no application,
dependency, configuration, or backend source changes; the task may write its audit
report/evidence and may create explicitly recorded transactions only in the
approved disposable local database.

**Standing local test-data authorization (recorded 2026-09-25):** The owner confirms
that the current localhost database is a disposable testing environment and authorizes
UX audits to create, edit, deactivate, and otherwise exercise clearly named dummy data
within the exact work-item scope without asking again for routine fixture mutations.
Every mutation and retained/cleanup state must still be recorded. This is not production
authorization, does not expand a work item's scope, and does not waive an explicit
final-action confirmation when an operation posts financial, stock, debt, or other
transactional effects.

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
- `DESIGN_REVIEW`: a design proposal is ready for owner review.
- `APPROVED`: the owner approved the design direction.
- `IMPLEMENTED`: approved UX was delivered and verified in application code.
- `BLOCKED`: the required environment, data, hardware, decision, or contract is unavailable.
- `DEFERRED`: intentionally outside this Release 1 UX pass.

### Execution class

- `LIVE_AUDIT`: operate the existing app, capture evidence, and write findings; do not change application code.
- `DESIGN_ARTIFACT`: create an evidence-backed, reviewable design for one audited domain; do not
  change application code. Use interactive HTML, exported screenshots, and a decision record for
  the Bloom Release 1 work.
- `ROADMAP_BASELINE`: create or update UX governance documentation; do not operate or change the application.
- `IMPLEMENTATION_REBASELINE`: convert approved design artifacts and decision records into small
  frontend PR entries; do not implement them in the same task.

## 6. Recommended execution order

| Order | Work item | Domain | Status | Execution | Recommended model |
| --- | --- | --- | --- | --- | --- |
| 0 | UXR-00 | UX evidence protocol and roadmap | DOCUMENTED | ROADMAP_BASELINE | `gpt-5.6-sol`, high |
| 1 | UXR-A01 | Authentication and application navigation | EVIDENCE_COMPLETE | LIVE_AUDIT | `gpt-5.6-sol`, high |
| 2 | UXR-A08 | Cash-session operation | EVIDENCE_COMPLETE | LIVE_AUDIT | `gpt-5.6-sol`, high |
| 3 | UXR-A09 | Cashier search, cart, and scanner behavior | EVIDENCE_COMPLETE | LIVE_AUDIT | `gpt-5.6-sol`, high |
| 4 | UXR-A10 | Checkout and post-checkout printing | EVIDENCE_COMPLETE | LIVE_AUDIT | `gpt-5.6-sol`, high |
| 5 | UXR-A11 | Sales history, detail, and reprint | EVIDENCE_COMPLETE | LIVE_AUDIT | `gpt-5.6-sol`, high |
| 6 | UXR-D00 | Visual direction comparison and owner selection | APPROVED | DESIGN_ARTIFACT | `gpt-5.6-sol`, high |
| 7 | UXR-A03 | Item categories | EVIDENCE_COMPLETE | LIVE_AUDIT | `gpt-5.6-sol`, high |
| 8 | UXR-A04 | Item master and location inventory | EVIDENCE_COMPLETE | LIVE_AUDIT | `gpt-5.6-sol`, high |
| 9 | UXR-A05 | Stock movement history | EVIDENCE_COMPLETE | LIVE_AUDIT | `gpt-5.6-sol`, high |
| 10 | UXR-A06 | Stock adjustment | EVIDENCE_COMPLETE | LIVE_AUDIT | `gpt-5.6-sol`, high |
| 11 | UXR-A07 | Stock transfer | EVIDENCE_COMPLETE | LIVE_AUDIT | `gpt-5.6-sol`, high |
| 12 | UXR-A12 | Supplier master data | EVIDENCE_COMPLETE | LIVE_AUDIT | `gpt-5.6-sol`, high |
| 13 | UXR-A13 | Goods-receipt history and detail | EVIDENCE_COMPLETE | LIVE_AUDIT | `gpt-5.6-sol`, high |
| 14 | UXR-A14 | Goods-receipt creation | EVIDENCE_COMPLETE | LIVE_AUDIT | `gpt-5.6-sol`, high |
| 15 | UXR-A15 | Supplier payables and payment | EVIDENCE_COMPLETE | LIVE_AUDIT | `gpt-5.6-sol`, high |
| 16 | UXR-A16 | Expense history and creation | EVIDENCE_COMPLETE | LIVE_AUDIT | `gpt-5.6-sol`, high |
| 17 | UXR-A17 | Expense void/reversal | EVIDENCE_COMPLETE | LIVE_AUDIT | `gpt-5.6-sol`, high |
| 18 | UXR-A02 | Operational dashboard | EVIDENCE_COMPLETE | LIVE_AUDIT | `gpt-5.6-sol`, high |
| 19 | UXR-A18 | Cross-domain evidence synthesis | EVIDENCE_COMPLETE | LIVE_AUDIT | `gpt-5.6-sol`, high |
| 20 | UXR-D16 | Light and dark appearance modes | APPROVED | DESIGN_ARTIFACT | `gpt-5.6-sol`, high |

Cashier work comes first because it is the highest-frequency, most time-sensitive working mode. UXR-D00 then compares visual directions using evidence from the shell, cashier, checkout, and sales-history workflows before broader domain design begins. Back-office audits follow the operational sequence from item setup through stock, purchasing, debt, and expense handling. Dashboard audit comes after its drill-down destinations so its navigation value can be judged in context.

**Status audit (updated 2026-09-27):** UXR-A01 through UXR-A18 now have complete evidence and reports. UXR-A02 verified the server-owned dashboard summaries, all four drill-downs, natural stale warning and refresh recovery, keyboard order, and one/two/three-column responsive behavior; it also repeated the shared stale-breadcrumb defect. UXR-A18 consolidated 77 findings into two now-resolved P0s, 42 P1 findings, and 33 P2 findings, with cross-domain priorities, journey handoffs, an owner-decision register, and a recommended design order. `TRANSFER-01` was resolved after synthesis by persisting the account-bound exact request and idempotency key before posting and reconciling uncertain outcomes through the backend's existing same-key idempotent POST; no endpoint or stock rule changed. The owner approved UXR-D00's explicitly defined mode-aware hybrid after iterative cashier and navigation review; the decision is recorded in `docs/ux/design/visual-direction-decision.md`. UXR-A14 posted disposable receipt `GR/IX-2026/0003`, adding an unpaid fixture with both STORE and WAREHOUSE lines. UXR-A15 found P0 `PAYMENT-01`, the encoded path-variable route for slash-containing receipt references; the frontend/backend transport was corrected to a query parameter and verified by live partial QRIS and full BANK_TRANSFER payments. UXR-A16 posted disposable expense `#2` against open cash session `#15`; UXR-A17 then reversed it with an owner-confirmed reason and retained the immutable original/reversal audit. Closed-session expense `#1` remains the ineligible fixture. All domain audit dependencies are complete. UXR-D00, UXR-D02, UXR-D03, UXR-D04, UXR-D05, and UXR-D06 are owner-approved. Every other UXR-D01 through UXR-D16 domain now has a reviewable design and is recorded as `DESIGN_REVIEW` in `docs/ux/design/design-review-register.md`. UXR-D02's seven-day chart and STORE-stock attention remain implementation-gated on the requested backend read models. FE-19's store-laptop physical scanner gate remains outstanding and was not cleared by UXR-A09, UXR-A10, or UXR-A11.

**Design status update (2026-09-28):** UXR-D00 through UXR-D16 are now owner-approved. The design
review queue is complete; the next phase is documentation-only `IMPLEMENTATION_REBASELINE` work,
followed by separately authorized one-domain frontend changes. No design approval by itself
authorizes application implementation.

**Design approval status correction (2026-09-28):** The current authoritative register supersedes the
earlier status sentence above. UXR-D01 through UXR-D16 are owner-approved.

Live audits may continue alongside eligible domain design work. Domain design work begins only after
its own evidence is complete and UXR-D00 has an owner-approved direction; it does not need to wait
for every audit. Application implementation must wait for owner approval of that domain's design.

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

The owner may approve one candidate or an explicitly documented hybrid of named traits. The model must not choose or mark a direction approved on the owner's behalf. Record the final choice and rationale in `docs/ux/design/visual-direction-decision.md`. UXR-D01 through UXR-D16 must follow that decision unless later domain evidence justifies and records a specific deviation.

## 7. Live-audit work items

### UXR-00 — UX evidence protocol and roadmap

- **Domain:** UX program governance.
- **Status:** `DOCUMENTED`.
- **Execution class:** `ROADMAP_BASELINE`.
- **Dependencies:** Implemented Release 1 frontend and its contract.
- **Environment gate:** Repository inspection proves the working route/domain inventory.
- **Exact scope:** Establish live-first capture rules, artifact format, audit order, design gate, and later implementation-rebaseline rule.
- **Out of scope:** Live app operation, screenshots, design-artifact creation, application changes, Cypress installation.
- **Recommended model:** `gpt-5.6-sol`, high reasoning.
- **Expected output:** This roadmap.
- **Validation:** Re-read the contract, frontend roadmap, current routes, and this document; verify documentation-only diff.
- **Block condition:** None.
- **Split trigger:** Any application or dependency change must be separated from this documentation item.

### UXR-A01 — Authentication and application navigation

- **Domain:** Authentication, shell, and navigation entry.
- **Status:** `EVIDENCE_COMPLETE`.
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
- **Status:** `EVIDENCE_COMPLETE`.
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

**Evidence-complete note (2026-09-26):** Live evidence covered zero sales with an open cash
session and outstanding payables, all recognized drill-downs, retained-data refresh, success,
natural server-deadline expiry, keyboard order/focus, and `1440×900`, `1024×768`, and `760×768`
layouts without page-level overflow. No-open-session, zero-payables, initial error, and retained-data
refresh failure remain explicitly labelled source/test evidence because the audit did not alter the
financial fixture or force an outage. Findings are recorded in
[`uxr-a02-dashboard.md`](../ux/audits/uxr-a02-dashboard.md). UXR-A18 is now dependency-complete.

### UXR-A03 — Item categories

- **Domain:** Item categories.
- **Status:** `EVIDENCE_COMPLETE`.
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
- **Status:** `EVIDENCE_COMPLETE`.
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
- **Status:** `EVIDENCE_COMPLETE`.
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

**Evidence note (2026-09-23):** The completed read-only report and evidence index are in `docs/ux/audits/uxr-a05-stock-movements.md` and `docs/ux/evidence/uxr-a05/`. Live evidence covered the two-page ledger, item-scoped entry, exact SKU/direction/location filters, filtered empty recovery, representative opening/receipt/sale references, exact decimal UOM quantities, before/after balances, actor/time, keyboard order, and 760×768/768×768 responsive behavior. No movement was posted. The local ledger did not contain adjustment, transfer, receipt-cancellation/reversal, or stock-opname rows, and the shared services were not interrupted to manufacture error evidence; both limitations are explicit. UXR-D05 may now proceed to design review work without implying implementation approval.

### UXR-A06 — Stock adjustment

- **Domain:** Stock adjustment.
- **Status:** `EVIDENCE_COMPLETE`.
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

**Evidence note (2026-09-24):** The completed report and evidence index are in `docs/ux/audits/uxr-a06-stock-adjustment.md` and `docs/ux/evidence/uxr-a06/`. Live evidence used two disposable whole/fractional items and recorded `SA/IX-2026/0001` for STORE ADD plus WAREHOUSE REMOVE and `SA/IX-2026/0002` for a STORE CORRECTION from `2,5 meter` to absolute zero. An owner-requested visual recapture added a third disposable fixture and `SA/IX-2026/0003` (STORE ADD `1 pcs`, server-confirmed `6 → 7 pcs`) plus 21 persistent PNGs covering setup, validation, selection, confirmation, result/detail, filtering, responsive overflow, movement trace, and cleanup. The genuine pending frame could not be retained because the local request settled too quickly; original live DOM and test evidence remain cited rather than fabricating latency. All disposable items were deactivated while audit history was preserved. Concurrent conflict and dangerous ambiguous/storage/malformed-response states remain explicitly labelled repository/test evidence. UXR-D06 may now proceed to design review work without implying implementation approval.

### UXR-A07 — Stock transfer

- **Domain:** Stock transfer.
- **Status:** `EVIDENCE_COMPLETE`.
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

**Evidence note (2026-09-24):** Live workflow evidence, 33 persistent screenshots, backend/repository review, and focused tests are recorded in `docs/ux/audits/uxr-a07-stock-transfer.md` and `docs/ux/evidence/uxr-a07/`. The audit created `ST/IX-2026/0001` for WAREHOUSE→STORE `2 pcs` and `ST/IX-2026/0002` for STORE→WAREHOUSE `0,75 meter`, verified their paired movements, exercised deterministic insufficient-stock rejection, and covered keyboard/focus plus `760×768`/`768×768` responsive behavior. It identified a P0 repository-evidenced ambiguous-outcome recovery gap: the transfer request/key is memory-only and the backend has no request-key status lookup. After explicit owner confirmation, both disposable items were deactivated through Bloom's UI; active Data Barang returned no `UXRA07` items, while transfer and movement audit history remained readable. UXR-D07 may now proceed to design review work without implying implementation approval.

### UXR-A08 — Cash-session operation

- **Domain:** Cash sessions.
- **Status:** `EVIDENCE_COMPLETE`.
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
- **Status:** `EVIDENCE_COMPLETE`.
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
- **Status:** `EVIDENCE_COMPLETE`.
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
- **Status:** `EVIDENCE_COMPLETE`.
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

**Evidence note (2026-09-15):** The completed report and raw evidence are in `docs/ux/audits/uxr-a11-sales.md` and `docs/ux/evidence/uxr-a11/`. Four persisted records covered CASH, QRIS, whole-unit lines, PIECE/KILOGRAM/METER UOM, STORE location, decimal money, filters, single-page paging, detail, live reprint success, keyboard, and 760×768 responsive behavior. No persisted line had a fractional numeric quantity; the existing focused test verified `1.2500 METER` rendering and the report labels that limitation instead of creating a forbidden checkout. Live requests/printing settled too quickly for raw domain-pending frames, so list loading/error and print pending/failure/retry are clearly labelled automated evidence. UXR-D00's audit prerequisites are now complete.

**Copy-ready prompt**

> Perform UXR-A11 as a live UX audit of sales history/detail/reprint only. Use representative disposable CASH/QRIS and whole/fractional sales. Exercise list loading/error/empty, supported filters/paging, statuses and money, detail hierarchy, line UOM/location, session/reference, reprint pending/success/failure where safe, keyboard, and responsive behavior. Write `docs/ux/audits/uxr-a11-sales.md` with evidence-backed findings. Do not submit checkout, add corrections/reporting, infer financial statuses, redesign, implement, or change dependencies.

### UXR-A12 — Supplier master data

- **Domain:** Suppliers.
- **Status:** `EVIDENCE_COMPLETE`.
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

**Evidence note (2026-09-24):** The completed live report and 21 persistent screenshots are in `docs/ux/audits/uxr-a12-suppliers.md` and `docs/ux/evidence/uxr-a12/`. The audit read an existing referenced supplier with a server-owned outstanding balance, created and edited `UXRA12-SUP`, exercised required validation plus normalized duplicate conflicts while active and inactive, confirmed immutable-code behavior, deactivated the fixture with explicit retained-history language, and verified active/inactive discovery plus keyboard focus. Five focused test files passed 26 tests. A live P1 responsive defect occurs at the `768×768` boundary: the expanded sidebar and desktop supplier table activate together, producing `870 px` body scroll width inside a `753 px` client width and moving the row action off-screen; `760×768` correctly uses cards without overflow. UXR-D12 may now proceed to design review work without implying implementation approval. UXR-A13 is the next unfinished audit.

### UXR-A13 — Goods-receipt history and detail

- **Domain:** Goods-receipt read workflow.
- **Status:** `EVIDENCE_COMPLETE`.
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

**Partial-evidence note (2026-09-24):** The read-only live pass, 16 persistent screenshots,
backend/repository review, and 19 passing focused tests are recorded in
`docs/ux/audits/uxr-a13-goods-receipt-history.md` and `docs/ux/evidence/uxr-a13/`.
At the time of that pass, the only live receipt was posted/unpaid with one decimal
WAREHOUSE line; the database contained no partially paid receipt, paid receipt, or
STORE-line receipt. UXR-A14 later added an unpaid receipt with both locations, but
partial and paid live examples remain absent. Because
representative receipts are this item's explicit block condition and creating receipts or
posting payments was out of A13 scope, the audit remained `BLOCKED` rather than claiming
`EVIDENCE_COMPLETE`. The captured pass identifies page-level narrow overflow, payment-form
interruption of the detail read hierarchy, long keyboard traversal, invalid heading levels,
mixed date notation, and repeated implementation-facing server copy. A short recapture may
complete A13 after disposable representative data is seeded through an authorized workflow.

**Historical follow-up block note (2026-09-25):** The owner authorized creation of the missing
paid/partial fixtures during UXR-A15. Full CASH and partial QRIS attempts both failed
before controller handling because the current payment endpoint cannot transport the
generated slash-containing receipt reference. No payment was recorded. A13 was
blocked at that point on P0 `PAYMENT-01`, not on test-data authorization; see the A15 report.

**Evidence-complete follow-up (2026-09-26):** `PAYMENT-01` was corrected by moving
the exact receipt code from a path variable to the `code` query parameter. The live
recapture recorded `GR/IX-2026/0002` as partially paid and `GR/IX-2026/0001` as
paid, while `GR/IX-2026/0003` remains unpaid with STORE and WAREHOUSE lines. The
17-shot A13 evidence set and linked A15 success evidence satisfy the representative
data gate. UXR-D13 may proceed to design review work.

### UXR-A14 — Goods-receipt creation

- **Domain:** Goods receipt posting.
- **Status:** `EVIDENCE_COMPLETE`.
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

**Evidence-complete note (2026-09-25):** The live pass, 19 persistent screenshots,
backend/repository review, and 28 passing focused tests are recorded in
`docs/ux/audits/uxr-a14-goods-receipt-create.md` and `docs/ux/evidence/uxr-a14/`.
After explicit final-action confirmation, the audit posted `GR/IX-2026/0003` with
one whole STORE line and two fractional repeated-SKU lines across WAREHOUSE/STORE.
The server confirmed `POSTED` / `UNPAID`, `Rp 28.250,2188` total/outstanding, and
`Rp 0` paid. The fixture remains as local transaction history. Safe conflict and
ambiguous-network recovery were not forced live; exact frozen replay, duplicate
protection, field-error recovery, and idempotency conflict remain focused source/test
evidence. Findings cover review formatting/localization, narrow repeated-line height,
mixed date notation, redundant supplier echo, and result heading semantics.

### UXR-A15 — Supplier payables and payment

- **Domain:** Supplier debt and one-receipt payment.
- **Status:** `EVIDENCE_COMPLETE`.
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

**Historical blocked-evidence note (2026-09-25):** The live report, 14 screenshots, direct HTTP
evidence, frontend/backend source review, and 48 passing focused tests are recorded in
`docs/ux/audits/uxr-a15-payables-payment.md` and `docs/ux/evidence/uxr-a15/`.
Payable discovery, filtering, method/session copy, full/partial confirmation, focus,
exact recovery locking, and responsive behavior were exercised. A full CASH attempt
and partial QRIS attempt were submitted after explicit owner confirmation; neither
created a payment. P0 `PAYMENT-01` was the blocker: frontend and backend placed the
slash-containing receipt code in one path variable, and Tomcat rejects the encoded
slash with HTTP 400 before controller handling. The UI consequently reports an
ambiguous outcome and cannot complete exact replay. UXR-A15 and the missing A13
paid/partial recapture were blocked until the endpoint contract and real container
integration could be corrected. UXR-D14 was not eligible from mocked success states alone.

**Evidence-complete follow-up (2026-09-26):** The controller and frontend now use
`/api/goods-receipts/payments?code={receiptCode}`. After restart and explicit
action-time confirmation, live partial QRIS and full BANK_TRANSFER payments
completed; backend refresh returned `PARTIALLY_PAID`/`Rp 6.888.888` outstanding and
`PAID`/`Rp 0` outstanding. The report now indexes 18 screenshots, including both
success states and the combined payable/receipt lists. Focused frontend tests,
targeted lint/build, backend controller tests, and the backend web-module suite
passed. UXR-A15 is evidence complete and UXR-D14 may proceed to design review work.

### UXR-A16 — Expense history and creation

- **Domain:** Unexpected expense history and posting.
- **Status:** `EVIDENCE_COMPLETE`.
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

**Evidence-complete note (2026-09-26):** The live report, 13 persistent screenshots,
backend/repository review, and 31 passing focused tests are recorded in
`docs/ux/audits/uxr-a16-expense-create.md` and `docs/ux/evidence/uxr-a16/`.
After explicit final-action confirmation, the audit posted disposable expense `#2`
for `Rp 12.345,6789`, category `OTHER`, against verified open cash session `#15`.
The backend-confirmed result and refreshed history preserve the exact amount,
classification, description, actor, and session. The record remains active for A17;
existing expense `#1` supplies a closed-session example. Findings cover long shell
keyboard traversal, weak multi-record scan labels, backend-limited history retrieval,
and inconsistent empty breadcrumbs. History/create/result avoid horizontal overflow
at `1024×768` and `760×768`. UXR-A17 is the next dependency-ordered audit.

### UXR-A17 — Expense void/reversal

- **Domain:** Expense correction.
- **Status:** `EVIDENCE_COMPLETE`.
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

**Evidence-complete note (2026-09-26):** The live report and 13 persistent screenshots
cover backend eligibility, closed-session blocking, fresh detail, required reason,
owner-confirmed reversal, retained original/audit facts, original-session context,
keyboard/focus, and wide/narrow behavior. Expense `#2` was reversed once with reason
`Audit UXR-A17 pembatalan pengeluaran uji`; expense `#1` remains an active
closed-session example. Findings cover unreliable live dialog entry/cancellation
focus, a persistent auxiliary-refresh warning after confirmed success, stale
cross-domain breadcrumbs, and dense confirmation/result hierarchy. Pending,
stale/conflict, exact recovery, storage, and account-isolation states remain clearly
labelled source/test evidence. UXR-D15 is now dependency-complete. UXR-A02 has also completed, so
UXR-A18 was dependency-complete and has now produced the cross-domain synthesis.

### UXR-A18 — Cross-domain evidence synthesis

- **Domain:** UX evidence synthesis; no application domain implementation.
- **Status:** `EVIDENCE_COMPLETE`.
- **Execution class:** `LIVE_AUDIT`.
- **Dependencies:** All required UXR-A01 through UXR-A17 reports.
- **Environment gate:** Each included report separates evidence, inference, and owner decisions.
- **Exact scope:** Consolidate repeated interaction/copy/layout/accessibility problems, identify preserved strengths, map journey handoffs, rank P0/P1/P2 findings, and recommend domain design order.
- **Out of scope:** Design-artifact creation, a global design system, implementation backlog details, changing product/backend rules.
- **Recommended model:** `gpt-5.6-sol`, high reasoning.
- **Expected output:** `docs/ux/audits/release-1-ux-synthesis.md` with an evidence index and owner-decision register.
- **Validation:** Every synthesized finding links back to domain evidence; repeated patterns are not generalized from a single screen.
- **Block condition:** Critical domain reports or their evidence are missing.
- **Split trigger:** Domain-specific recommendations stay in their source reports; synthesis contains only cross-domain patterns and prioritization.

**Copy-ready prompt**

> Perform UXR-A18 as a read-only synthesis of completed Bloom UX audit reports. Read the frontend contract, frontend roadmap, UX roadmap, and every included `docs/ux/audits/uxr-a*.md` report. Do not operate the app unless a cited fact needs narrow verification. Produce `docs/ux/audits/release-1-ux-synthesis.md` containing preserved strengths, repeated evidence-backed problems, journey handoff issues, P0/P1/P2 prioritization, an evidence index, owner decisions needed, and recommended domain design order. Link every conclusion to source scenarios and distinguish evidence from inference. Do not create designs, propose a global rewrite, change business rules, generate detailed implementation PRs, or modify application/dependency state.

**Evidence-complete note (2026-09-26):** The synthesis in
[`release-1-ux-synthesis.md`](../ux/audits/release-1-ux-synthesis.md) consolidates all 17 domain
reports and 77 recorded findings. It distinguishes one unresolved transfer-recovery P0 from the
resolved supplier-payment transport P0, preserves backend-authority and transaction-safety strengths,
identifies repeated responsive/shell/focus/localization/traceability patterns, records journey
handoffs and owner decisions, and recommends a design order without approving designs or changing
application, dependency, product, or backend state.

## 8. Design queue

UXR-D00 begins after its representative audits are `EVIDENCE_COMPLETE`. Each domain design item,
UXR-D01 through UXR-D15, begins only after its required audit is `EVIDENCE_COMPLETE` and UXR-D00 is
`APPROVED`. The cross-cutting UXR-D16 appearance-mode task begins after UXR-D00 is `APPROVED` and
representative cashier and back-office domain frames exist. Use interactive HTML review artifacts,
exported screenshots, and decision records throughout. Every artifact must preserve the same
evidence, state, responsive, accessibility, and backend-authority requirements.

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
| UXR-D13 | Goods receipts | UXR-A13 and UXR-A14 | List/detail and creation as separate design flows |
| UXR-D14 | Payables/payment | UXR-A15 | Debt discovery, one-receipt payment, payment methods and states |
| UXR-D15 | Expenses | UXR-A16 and UXR-A17 | History/create and void as separate design flows |
| UXR-D16 | Appearance modes | UXR-D00 approval plus representative cashier and back-office frames | Approved palette mapped to light and dark modes, preference behavior, semantic-state parity, focus/contrast validation, and older-user legibility |

### Current design-review status

The authoritative status register is
[`docs/ux/design/design-review-register.md`](../ux/design/design-review-register.md). As of 2026-09-28,
UXR-D00 through UXR-D16 are `APPROVED`. Approval records the design direction; it does not authorize
implementation. The reviewed domains use one authoritative interactive review suite so the sidebar,
header, Operational Blue tokens, appearance toggle, focus treatment, and narrow navigation do not
drift between domains.

**Sales-history design note (2026-09-28):** UXR-D11 was prepared for focused owner review. The refined
direction retains only the exact backend-supported code, creator, start-date, and end-date filters;
stable server paging; all server-returned lifecycle/payment/correction and monetary facts; persisted
line UOM/location; and sale-reference-only reprinting. It replaces page-level narrow-table overflow
with labelled grouped records, uses Indonesian application-owned inverted-range recovery, restores
semantic detail headings, and distinguishes print-service acknowledgement from verified physical
paper output. This review state preceded the owner approval recorded below.

**Sales-history owner approval note (2026-09-28):** The owner approved the refined labelled list,
grouped no-overflow narrow records, Indonesian date recovery, backend-authoritative detail hierarchy,
and sale-safe latest print-service acknowledgement language. The binding direction is recorded in
`docs/ux/design/uxr-d11-sales-history-decision.md`; implementation remains separately gated.

**Item-category design note (2026-09-23):** The owner approved UXR-D03 after reviewing the refined
active-list, create/edit, validation/conflict, deactivation, and narrow-desktop treatment. The
decision retains Operational Blue, icon-only 44-pixel row actions with accessible names, separate
updated-by/updated-at fields, and a linked list breadcrumb from create/edit. The decision record is
[`uxr-d03-item-categories-decision.md`](../ux/design/uxr-d03-item-categories-decision.md). UXR-D03 is
`APPROVED` for design direction; application implementation has not begun.

**Item-master design note (2026-09-23):** The owner approved UXR-D04 as sufficiently resolved for
implementation planning, while allowing small implementation-stage refinements. The direction keeps
exact prices, UOM/fraction rules, item detail, barcode, item-scoped stock history, metadata editing,
deactivation, and separate STORE/WAREHOUSE quantities. It establishes a reusable list pattern that
groups identity fields, uses compact accessible icon actions, and stacks labelled row content at
narrow widths without treating the pattern as a global design system. The decision record is
[`uxr-d04-item-master-decision.md`](../ux/design/uxr-d04-item-master-decision.md). UXR-D04 is
`APPROVED` for design direction; application implementation has not begun.

**Stock-adjustment design note (2026-09-27):** The owner approved UXR-D06 after reviewing normal
history, filtered empty, searchable item selection, create, confirmation, definitive rejection,
server-confirmed success, persisted detail, ambiguous recovery, and narrow-desktop treatments. The
direction preserves backend-owned stock results, delta-versus-absolute action meaning, durable
recovery, keyboard/focus behavior, and the existing MUI baseline. The decision record is
[`uxr-d06-stock-adjustment-decision.md`](../ux/design/uxr-d06-stock-adjustment-decision.md). UXR-D06
is `APPROVED` for design direction; application implementation has not begun.

**Stock-movement design note (2026-09-27):** The owner approved UXR-D05 after refining the existing
item/SKU, direction, location, and reset filters; a scan-oriented ledger with explicit headers; and an
in-context detail modal. The accepted list keeps item/code/UOM, movement/source, location,
before-to-after balance, and actor/time visible while moving the source reference and expanded audit
facts into the modal. The decision record is
[`uxr-d05-stock-movements-decision.md`](../ux/design/uxr-d05-stock-movements-decision.md). UXR-D05 is
`APPROVED` for design direction; application implementation has not begun.

**Inventory-navigation refinement (2026-09-27):** The owner combined `Riwayat stok` and
`Transfer stok` into one `Pergerakan stok` sidebar destination. History is the default view and
`Buat transfer stok` is its primary action. UXR-D05 and UXR-D07 are approved; the transfer command
keeps its separate backend-authoritative transaction and recovery semantics.

**Stock-transfer design approval (2026-09-27):** The owner approved the familiar transfer form order,
searchable item combobox, explicit source/destination with labelled swap, numeric quantity plus UOM,
optional description, refresh action, and self-contained confirmation. The binding decision is in
`docs/ux/design/uxr-d07-stock-transfer-decision.md`. This design approval does not authorize frontend
implementation; implementation must first be re-baselined into one-domain PR work.

**Cash-session design approval (2026-09-27):** The owner approved one `Sesi kas` destination that
shows the verified current session and paged server history without merging their API meanings. The
accepted direction uses Indonesian money entry, requests expected cash only when closing, never
predicts variance in the browser, retains the server-final reconciliation, verifies the resulting
no-session state before offering a new session, and preserves full narrow-desktop facts. History
pagination explicitly shows page size, visible range and total, current page, and labelled
previous/next actions. The binding decision is in
`docs/ux/design/uxr-d08-cash-sessions-decision.md`; implementation remains separately gated.

**Cashier checkout design approval (2026-09-27):** The owner rejected separate D09 cart and D10
checkout page compositions in favor of the previously reviewed whole-cashier workspace. D09 and D10
remain separate evidence/implementation boundaries, but share one design: item discovery stays on the
left, while cart, estimate, editable discount and explanation, CASH/QRIS, tender, compact in-place
confirmation, known rejection, exact-key ambiguous recovery, backend-confirmed result, and sale-first
print states occupy the right transaction panel. Confirmation is retained as a deliberate final safety
step, not route navigation or a repeated screen. Both items are `APPROVED` for design direction; the
binding decision is recorded in `docs/ux/design/uxr-d09-d10-cashier-decision.md`. No application
implementation or new backend preview contract is authorized.

**Supplier design approval (2026-09-28):** The owner approved the focused UXR-D12 direction with
explicit list columns and pagination, backend-owned outstanding balance, audit-rich detail,
pre-commit normalization guidance, immutable-code edit, retained duplicate conflict,
history-preserving deactivation, cancel-first focus, and labelled narrow grouped rows. The binding
decision is recorded in `docs/ux/design/uxr-d12-suppliers-decision.md`; implementation remains a
separate one-domain change.

**Goods-receipt design approval (2026-09-28):** The owner approved the focused UXR-D13 direction
covering the three backend payment states in history, URL-backed filters and paging, receipt-first
detail with received lines before the secondary payment action, compact per-location creation lines
including repeated SKUs, Indonesian received date/time guidance, advisory input estimate, localized
confirmation, pending lock, exact-request recovery, backend-confirmed result, and no-overflow narrow
layouts. The binding decision is recorded in
`docs/ux/design/uxr-d13-goods-receipts-decision.md`; implementation remains a separate one-domain
change.

**Payables and supplier-payment design approval (2026-09-28):** The owner approved the focused
UXR-D14 direction covering supported receipt/supplier-name discovery, receipt-first detail, received
lines and payment history before mutation, one-receipt amount/method/reference/note entry, explicit
CASH and non-cash session meaning, cancel-first confirmation, pending lock, exact account-bound
recovery, definitive rejection, backend-refreshed success, corrected query-parameter transport, and
no-overflow narrow layouts. Existing backend APIs are sufficient for the approved receipt-level flow.
Optional stable `supplierCode` filtering is assumed to be in progress as a future discovery
refinement and is not an implementation blocker. The binding decision is recorded in
`docs/ux/design/uxr-d14-payables-payment-decision.md`; implementation remains a separate one-domain
change.

**Expense design approval (2026-09-28):** The owner approved the focused UXR-D15 direction covering
the paging-only labelled history, active and closed-session eligibility, exact open-session-bound
creation, cancel-first confirmation, pending lock, exact account-bound recovery, definitive
rejection, backend-confirmed creation, audit-rich detail, reasoned void confirmation, void
pending/recovery/result, retained original and reversal facts, explicit server-owned session impact,
and no-overflow narrow layouts. The binding decision is recorded in
`docs/ux/design/uxr-d15-expenses-voids-decision.md`; implementation remains a separate one-domain
change.

**Authentication/navigation review note (2026-09-27):** The owner accepted UXR-D01's shared
navigation and header shell, including grouped icon-and-label navigation, removal of the redundant
“Back office” label, the fixed lower-left current-user area, explicit appearance action,
wide-screen collapse/expand, and narrow-screen overlay navigation. UXR-D01 remains
`DESIGN_REVIEW` because its login, failure, pending, session-expiry, protected-return, and not-found
states still require an explicit owner decision. This partial review does not authorize application
implementation.

**Authentication owner approval (2026-09-28):** The owner approved UXR-D01's fully
Indonesian normal, required-field validation, rejected-credential, pending, protected-session
checking, session-expiry, protected-return, and authenticated not-found states. It uses only the
existing username/password contract, preserves a safe internal destination, and moves focus to the
destination page heading after successful login. Headless interaction checks passed,
and the 760-pixel login layout keeps all fields and actions visible without horizontal overflow.
The binding direction is recorded in `docs/ux/design/uxr-d01-auth-navigation-decision.md`;
implementation remains separately gated.

**Appearance-mode owner approval (2026-09-28):** The owner approved UXR-D16's light-default,
Operational Blue appearance direction with optional `Gelap` and `Ikuti sistem` modes, local-device
persistence, system-light/system-dark resolution, semantic-state parity, and wide/narrow behavior.
Automated token checks show at least 4.89:1 for the reviewed text/status/focus pairs in light mode and
6.79:1 in dark mode. The binding decision is recorded in
`docs/ux/design/uxr-d16-appearance-modes-decision.md`; implementation remains separately gated.

**Dashboard direction note (2026-09-23):** The owner accepted the operational dashboard hierarchy
and the addition of one secondary seven-day sales bar chart. The decision, exclusions, accessibility
coverage, and required backend aggregation gate are recorded in
[`uxr-d02-dashboard-direction.md`](../ux/design/uxr-d02-dashboard-direction.md). UXR-A02 is now
`EVIDENCE_COMPLETE` and supports the accepted operational hierarchy, while adding breadcrumb,
keyboard-bypass, summary-density, and copy constraints. That evidence is now incorporated in
[`uxr-d02-dashboard-review.md`](../ux/design/uxr-d02-dashboard-review.md). On 2026-09-27, the owner
approved the refined Dashboard direction after sending the backend request to the backend agent.
UXR-D02 is now `APPROVED`; the decision is recorded in
[`uxr-d02-dashboard-decision.md`](../ux/design/uxr-d02-dashboard-decision.md). The seven-day chart
and STORE-stock attention remain implementation-gated until the requested backend read models exist.
Approval does not authorize frontend aggregation, inferred stock rules, or implementation with
placeholder business data.

**Dashboard review refinement (2026-09-27):** An external UX review was reconciled against UXR-A02
and the implemented backend contract. The candidate now uses simpler copy, exposes the already
available cash-session opener/time, compacts active-session expenses, and tests one action-oriented
“Perlu perhatian” panel. Exact scale-four money remains visible. STORE stock attention and the
seven-day chart are both backend-gated; their required read models and exclusions are specified in
[`uxr-d02-dashboard-backend-request.md`](../ux/design/uxr-d02-dashboard-backend-request.md).
Recent cross-domain activity, payable due dates, inferred session health, and a permanent shortcut
grid remain excluded pending evidence or a separate contract.

### UXR-D00 — Visual direction comparison and owner selection

- **Domain:** Product visual direction; no business-domain implementation.
- **Status:** `APPROVED`.
- **Execution class:** `DESIGN_ARTIFACT`.
- **Dependencies:** UXR-A01, UXR-A09, UXR-A10, and UXR-A11 must be `EVIDENCE_COMPLETE`.
- **User-visible goal:** Let the owner compare realistic alternatives before later screens inherit a visual direction.
- **Exact scope:** Create exactly three candidates using identical representative content and states: compact operational, calm guided, and mode-aware hybrid. For each candidate, provide one cashier/cart or checkout frame, one back-office list/detail frame, and one narrow-desktop responsive frame.
- **Out of scope:** Full domain flows, new product behavior, business-rule or API changes, a production-ready global design system, application code, or selecting a winner without the owner.
- **Recommended model:** `gpt-5.6-sol`, high reasoning.
- **Expected output:** One interactive HTML comparison board, exported screenshots, concise
  trade-offs, reusable-pattern observations, and `docs/ux/design/visual-direction-decision.md` after
  the owner selects a direction.
- **Validation:** Candidates use the same copy, data, state, viewport, and interaction facts; contrast, focus visibility, table/form legibility, density, and wide/narrow behavior are compared consistently.
- **Block condition:** Representative audit evidence, a writable local review-artifact location, or
  owner availability for selection is missing.
- **Split trigger:** More than three candidates or full domain-state coverage is requested; keep those ideas for the relevant UXR-D01 through UXR-D15 item.

**Design-review note (updated 2026-09-20):** The owner reviewed exactly three comparable candidates
covering cashier/checkout, back-office list/detail, and 760×768 narrow-desktop frames with identical
Indonesian content and a backend-confirmed fixture. The deterministic comparison artifacts and later
domain HTML reviews refined the selected mode-aware hybrid into the accepted Operational Blue
cashier and navigation treatments. The selected traits and rationale are recorded in
`docs/ux/design/visual-direction-decision.md`.

**Copy-ready visual-direction prompt**

> Perform only UXR-D00, Bloom's visual-direction comparison. Read `AGENTS.md`, the frontend contract, the frontend and UX roadmaps, and the completed UXR-A01, UXR-A09, UXR-A10, and UXR-A11 reports with their referenced evidence. Inspect the current components and create one deterministic interactive HTML comparison board at `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-uxr-d00-comparison.html`. Create exactly three clearly differentiated candidates—compact operational, calm guided, and mode-aware hybrid—using identical Bahasa Indonesia copy, data, transaction state, and viewports. For each candidate, create one representative cashier/cart or checkout frame, one back-office list/detail frame, and one narrow-desktop responsive frame. Preserve backend authority, current transaction/recovery meaning, keyboard/focus behavior, and useful existing components. Provide the local artifact path, exported screenshots, and a concise matrix covering density, speed, comprehension, accessibility, responsiveness, reuse cost, and trade-offs. Stop at `DESIGN_REVIEW`; do not choose or approve a winner, create full workflows, modify application code, invent APIs/business rules, or build a global design system. After the owner responds, record the selected candidate or explicitly named hybrid traits and rationale in `docs/ux/design/visual-direction-decision.md` and mark UXR-D00 `APPROVED`.

### UXR-D16 — Light and dark appearance modes

- **Domain:** Cross-cutting application appearance; no business-domain behavior change.
- **Status:** `APPROVED`.
- **Execution class:** `DESIGN_ARTIFACT`.
- **Dependencies:** UXR-D00 is `APPROVED`, and at least one representative approved cashier frame and one representative approved back-office frame are available.
- **User-visible goal:** Provide a legible light default and an optional dark appearance without changing features, transaction meaning, or navigation.
- **Exact scope:** Map the owner-approved palette to light and dark semantic tokens; define the initial mode, an explicit appearance control, system-preference behavior, persistence, and no-flash loading behavior; compare the same cashier, back-office, narrow-desktop, focus, selected, disabled, success, warning, error, pending, and server-rejection states in both modes.
- **Older-user baseline:** Treat light mode as the default candidate for the store unless owner testing decides otherwise. In production-scale frames, target at least 16 px for primary body and control text, 14 px for secondary text, 16–17 px medium/semibold for item names, 16–18 px semibold for important prices and values, and 24 px for page headings; reserve 11–12 px text for genuinely nonessential content only. Use at least 44 × 44 px interactive targets and 48–52 px height for the primary payment action. Keep unmistakable focus, explicit metadata labels, and labels/icons in addition to color; verify at 200% browser zoom and do not use hue alone to communicate status or selection.
- **Out of scope:** Removing or changing features, theme-specific business behavior, inventing backend preferences, a global component-library replacement, unrelated visual redesign, or application implementation.
- **Recommended model:** `gpt-5.6-sol`, high reasoning.
- **Expected output:** Interactive HTML light/dark comparison states, exported screenshots, the final
  semantic color/token mapping, preference-behavior decision, contrast/focus checks, affected
  reusable-component inventory, and unresolved owner decisions.
- **Validation:** Light and dark modes preserve identical copy, data, actions, focus order, keyboard behavior, responsive behavior, and backend-authoritative states. Normal text targets at least 4.5:1 contrast; large text, focus indicators, and necessary control/state boundaries target at least 3:1. Status remains understandable without color.
- **Block condition:** UXR-D00 has no owner-approved direction, representative domain frames are unavailable, or the owner has not decided the default/system/manual preference behavior.
- **Split trigger:** Implement light mode first and defer dark mode if dark-theme work would delay a required domain workflow; do not partially theme transaction or recovery states.

**Historical review note (updated 2026-09-26):** Early exploration narrowed the palette to
Operational Blue and Warm Plum. The owner later approved Operational Blue in UXR-D00; Warm Plum is no
longer a candidate. Older-user feedback supports a larger, lower-density default, persistent cashier
context, and a simplified but still complete back-office list/detail composition; it does not justify
removing information required by the more complex back-office task. UXR-D16 records light/dark work
separately so appearance work does not silently expand UXR-D00 or imply implementation.

**Owner approval note (2026-09-28):** The owner approved the refined light-default direction,
`Terang`/`Gelap`/`Ikuti sistem` behavior, local browser/device persistence, system-preference
following, pre-paint preference resolution, Operational Blue semantic-token parity, older-user
legibility, and identical business content and behavior across appearances. The binding decision is
recorded in `docs/ux/design/uxr-d16-appearance-modes-decision.md`; implementation remains separately
gated.

**Copy-ready appearance-mode prompt**

> Design only UXR-D16 after UXR-D00 and the representative cashier/back-office frames are approved. Read `AGENTS.md`, the frontend contract, both frontend/UX roadmaps, `docs/ux/design/visual-direction-decision.md`, and the approved representative domain decisions. Extend the canonical interactive HTML review artifact with identical light and dark cashier, back-office, narrow-desktop, focus, selected, disabled, success, warning, error, pending, and server-rejection states. Define light-default/system/manual/persistence behavior as explicit owner decisions; do not assume a backend preference endpoint. Preserve every feature, route, transaction/recovery meaning, keyboard/focus order, and backend-authoritative value. Validate readable type, 200% zoom, non-color status cues, focus visibility, contrast targets, and absence of whole-page horizontal overflow. Return the local artifact path and reviewed states, exported screenshots, semantic token mapping, component impact, preference behavior, validation notes, and unresolved decisions. Do not implement code, replace the component library, create theme-specific business behavior, invent APIs, or redesign unrelated workflows.

For each design item:

- **Status:** `PLANNED` until its audit is complete.
- **Execution class:** `DESIGN_ARTIFACT`.
- **User-visible goal:** Resolve approved P0/P1 findings first; address P2 polish without obscuring the workflow.
- **Exact scope:** One domain, its relevant viewports, and all states needed to explain the proposed interaction.
- **Out of scope:** Application code, new backend fields, unsupported actions, unrelated screens, global component replacement.
- **Expected output:** Interactive HTML artifact path and reviewed states, exported screenshots, a short
  decision log, state coverage, reused/new component list, and unresolved owner decisions.
- **Validation:** Trace every proposed change to audit evidence; verify keyboard/focus order, Indonesian copy, responsive behavior, and backend authority.
- **Split trigger:** If a design item contains independently reviewable read and mutation workflows,
  present them as separate artifact sections or split the design item before approval.

The design queue is complete. Do not regenerate domain designs during implementation. Use the
approved decision record and the concrete prototype path named by the applicable execution step
below; when a visual detail is ambiguous, the decision record, audit evidence, frontend contract,
and backend contract take precedence over the prototype.

## 9. Implementation re-baseline

Do not write copy-ready implementation prompts for a UX design that has not been approved. Without
an approved decision record, canonical interactive HTML artifact, identified reviewed states, and
acceptance decisions, such prompts would encourage generic redesign and scope creep.

After one domain reaches `APPROVED`, run one documentation-only `IMPLEMENTATION_REBASELINE` task for that domain. It must create small UX implementation PR entries with:

- PR identifier and one domain/workflow;
- approved decision-record path, canonical HTML artifact path, and exact reviewed states;
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

The concrete queue below is the completed implementation rebaseline. It intentionally contains no
prompt placeholders. Execute one step at a time from the latest accepted base; do not start a
dependent step while its predecessor is still under review.

### 9.1 Shared execution rules

- UXR-D00 is a design reference, not a standalone implementation step. Its prototype is
  `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-uxr-d00-comparison.html`.
- Before each step, inspect `git status`, preserve existing work, and read `AGENTS.md`,
  `docs/architecture/release-1-frontend-contract.md`, both frontend and UX roadmaps, the named audit,
  the named decision record, the prototype, and the current implementation/tests.
- Treat the backend contract and approved decision record as authoritative when the HTML prototype is
  ambiguous. Never calculate authoritative stock, totals, debt, payment state, cash change, or
  reconciliation in the browser.
- Keep MUI and useful existing components. Do not combine unrelated cleanup, dependency migration,
  route restructuring, another domain, or a global design-system rewrite with a step.
- Include applicable loading, error, empty, validation, conflict, pending, ambiguous recovery,
  success, accessibility, keyboard, Indonesian localization, light/dark, and narrow-desktop behavior.
- Add or update focused Vitest/React Testing Library coverage. Run the focused tests, `npm test`,
  `npm run lint`, and `npm run build`; document any pre-existing failure separately.
- Update the frontend contract/roadmap status for the completed step. Do not commit or push unless the
  owner explicitly requests it.

### 9.2 Concrete execution order

| Order | Implementation item | Approved design | Dependency |
| --- | --- | --- | --- |
| 1 | UXI-01 Appearance foundation | UXR-D16 | Approved design documents present |
| 2 | UXI-02 Shared navigation shell | UXR-D01 | UXI-01 |
| 3 | UXI-03 Authentication and protected entry | UXR-D01 | UXI-02 |
| 4 | UXI-04 Item categories | UXR-D03 | UXI-02; first low-risk back-office pattern |
| 5 | UXI-05 Cash-session current state, history, and opening | UXR-D08 | UXI-01–UXI-02 |
| 6 | UXI-06 Cash-session close, reconciliation, and detail | UXR-D08 | UXI-05 |
| 7 | UXI-07 Cashier discovery and cart | UXR-D09 | UXI-05 |
| 8 | UXI-08 Checkout and durable recovery | UXR-D10 | UXI-07 |
| 9 | UXI-09 Sale result and printing | UXR-D10 | UXI-08 |
| 10 | UXI-10 Sales history, detail, and reprint | UXR-D11 | UXI-09 |
| 11 | UXI-11 Item list, detail, and location inventory | UXR-D04 | UXI-04 |
| 12 | UXI-12 Item creation, editing, and deactivation | UXR-D04 | UXI-11 |
| 13 | UXI-13 Stock-movement history and detail | UXR-D05 | UXI-11 |
| 14 | UXI-14 Stock adjustment | UXR-D06 | UXI-13 |
| 15 | UXI-15 Stock transfer | UXR-D07 | UXI-13–UXI-14 |
| 16 | UXI-16 Supplier list and detail | UXR-D12 | UXI-04 |
| 17 | UXI-17 Supplier creation, editing, and deactivation | UXR-D12 | UXI-16 |
| 18 | UXI-18 Goods-receipt history and detail | UXR-D13 | UXI-16 |
| 19 | UXI-19 Goods-receipt creation and recovery | UXR-D13 | UXI-17–UXI-18 |
| 20 | UXI-20 Payable discovery and receipt debt detail | UXR-D14 | UXI-18 |
| 21 | UXI-21 Supplier payment and recovery | UXR-D14 | UXI-20 |
| 22 | UXI-22 Expense history and creation | UXR-D15 | UXI-05–UXI-06 |
| 23 | UXI-23 Expense void and reversal | UXR-D15 | UXI-22 |
| 24 | UXI-24 Operational dashboard | UXR-D02 | Destination screens complete and backend read models available |
| 25 | UXI-25 Cross-domain verification | All approved designs | UXI-01–UXI-24 |

### 9.3 Copy-ready execution prompts

#### UXI-01 — Appearance foundation

Prototype: `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-appearance-modes-final-review.html`

Decision: `docs/ux/design/uxr-d16-appearance-modes-decision.md`

> Implement only UXI-01, Bloom's appearance foundation. Read `AGENTS.md`, the frontend contract, both roadmaps, `docs/ux/design/visual-direction-decision.md`, `docs/ux/design/uxr-d16-appearance-modes-decision.md`, and the prototype at `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-appearance-modes-final-review.html`. Inspect `src/themes/index.js`, `src/main.jsx`, `src/App.jsx`, `src/index.css`, and existing tests. Implement semantic Operational Blue tokens, light-first rendering, `Terang`/`Gelap`/`Ikuti sistem`, local-device persistence, system-preference updates, and pre-paint resolution without changing business behavior or page layouts. Cover cashier/back-office, wide/narrow, and normal/selected/focus/success/warning/error/rejected/pending/disabled parity. Keep MUI; do not add a backend preference. Add focused tests, then run `npm test`, `npm run lint`, and `npm run build`. Update the relevant plan status; do not commit or push.

#### UXI-02 — Shared navigation shell

Status: `IMPLEMENTED`

Prototype: `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-navigation-shell-review.html`

Decision/audit: `docs/ux/design/uxr-d01-auth-navigation-decision.md`; `docs/ux/audits/uxr-a01-auth-navigation.md`

> Implement only UXI-02, Bloom's shared navigation shell. Read `AGENTS.md`, the frontend contract, both roadmaps, `docs/ux/audits/uxr-a01-auth-navigation.md`, `docs/ux/design/uxr-d01-auth-navigation-decision.md`, and `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-navigation-shell-review.html`. Inspect `src/App.jsx`, `src/App.scss`, `src/components/app/Header.jsx`, `src/components/app/Sidebar.jsx`, `src/components/app/sidebar/SidebarItem.jsx`, `src/routes/index.jsx`, and navigation tests. Implement the approved grouped icon-and-label sidebar, fixed lower-left account area, no “Back office” label, route-derived selected state and breadcrumbs, wide collapse, narrow overlay drawer, Escape close, focus restoration, and combined `Pergerakan stok` navigation. Preserve every existing route and authorization rule. Add focused navigation and responsive tests, then run the full validation commands. Update plan status; do not commit or push.

#### UXI-03 — Authentication and protected entry

Status: `IMPLEMENTED`

Prototype: `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-design-review-suite.html`, select **D01 Akses & navigasi** and review **Masuk**, **Kolom kosong**, **Kredensial salah**, **Sedang masuk**, **Memeriksa sesi**, **Sesi berakhir**, **Kembali ke tujuan**, and **Halaman tidak ditemukan**.

Decision/audit: `docs/ux/design/uxr-d01-auth-navigation-decision.md`; `docs/ux/audits/uxr-a01-auth-navigation.md`

> Implement only UXI-03, Bloom authentication and protected entry. Read `AGENTS.md`, the frontend contract, both roadmaps, `docs/ux/audits/uxr-a01-auth-navigation.md`, `docs/ux/design/uxr-d01-auth-navigation-decision.md`, and the D01 states in `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-design-review-suite.html`. Inspect `src/pages/login/Login.jsx`, `src/pages/NotFound.jsx`, `src/routes/index.jsx`, `src/stores/modules/auth.js`, `src/api/auth.js`, and their tests. Implement fully Indonesian login, required-field focus, generic retained credential failure, one locked pending submission, protected-session checking without protected-content flash, safe path/query/hash return, destination-heading focus, session-expiry explanation without transaction resubmission, and authenticated not-found recovery. Do not add auth fields, methods, or endpoints. Add focused tests and run the full validation commands. Update plan status; do not commit or push.

#### UXI-04 — Item categories

Status: `IMPLEMENTED`

**Implementation note (2026-09-28):** UXI-04 now delivers the approved grouped identity list,
separate update provenance with explicit fallbacks, 44-pixel accessible icon actions, linked
create/edit breadcrumb, preserved validation/conflict input, cascade-aware deactivation, explicit
pagination context, and labelled narrow records without changing category endpoints or semantics.
Five focused files passed 31 tests; the full 66-file suite passed 416 tests with one worker, followed
by full lint and production build. The default parallel run hit the shared five-second timeout in 29
tests; every affected file passed in the serialized verification.

Prototype: `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-item-categories-review.html`

Decision/audit: `docs/ux/design/uxr-d03-item-categories-decision.md`; `docs/ux/audits/uxr-a03-item-categories.md`

> Implement only UXI-04, Bloom item categories. Read `AGENTS.md`, the frontend contract, both roadmaps, `docs/ux/audits/uxr-a03-item-categories.md`, `docs/ux/design/uxr-d03-item-categories-decision.md`, and `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-item-categories-review.html`. Inspect `ItemCategoryList.jsx`, `ItemCategoryUpsert.jsx`, the category store/API/constants, and category tests. Implement the approved labelled list, separate updated-by/updated-at facts, 44-pixel accessible icon actions, linked create/edit breadcrumb, validation/conflict retention, safe deactivation, pagination, and labelled narrow records. Preserve current endpoints and category semantics. Add focused tests and run the full validation commands. Update plan status; do not commit or push.

#### UXI-05 — Cash-session current state, history, and opening

Prototype: `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-design-review-suite.html`, select **D08 Sesi kas** and review no-session, open-session, opening, history, pagination, and narrow states.

Decision/audit: `docs/ux/design/uxr-d08-cash-sessions-decision.md`; `docs/ux/audits/uxr-a08-cash-sessions.md`

> Implement only UXI-05, Bloom cash-session current state, history, and opening. Read `AGENTS.md`, the governing contracts/roadmaps, `docs/ux/audits/uxr-a08-cash-sessions.md`, `docs/ux/design/uxr-d08-cash-sessions-decision.md`, and the D08 states in `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-design-review-suite.html`. Inspect `CashSessionHistory.jsx`, `CurrentCashSession.jsx`, the cash-session store/API/money helpers, and tests. Implement one destination with separately sourced current-session and server-paged history, Indonesian opening-money entry, correct no-session state, explicit page size/range/page/navigation, and complete narrow records. Do not predict reconciliation or merge API meanings. Add tests and run the full validation commands. Update plan status; do not commit or push.

#### UXI-06 — Cash-session close, reconciliation, and detail

Prototype: `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-design-review-suite.html`, select **D08 Sesi kas** and review close confirmation, pending, backend-confirmed reconciliation, post-close verification, detail, failure/recovery, and narrow states.

Decision/audit: `docs/ux/design/uxr-d08-cash-sessions-decision.md`; `docs/ux/audits/uxr-a08-cash-sessions.md`

> Implement only UXI-06, Bloom cash-session close, reconciliation, and detail. Read the governing documents, `docs/ux/audits/uxr-a08-cash-sessions.md`, `docs/ux/design/uxr-d08-cash-sessions-decision.md`, and D08 in `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-design-review-suite.html`. Inspect `CashSessionDetail.jsx`, `CloseCashSessionDialog.jsx`, `CurrentCashSession.jsx`, the cash-session store/API, and tests. Implement expected-cash entry only at close, cancel-first confirmation, one pending close, server-final reconciliation and variance, verified transition to no-session before offering a new session, error/retry behavior, and narrow detail hierarchy. Never calculate expected cash or variance authoritatively in the frontend. Add tests and run the full validation commands. Update plan status; do not commit or push.

#### UXI-07 — Cashier discovery and cart

Prototype: `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-cashier-workspace-rework.html`; review workspace empty/populated/search/scanner/stock-check/discount/cancel and narrow states.

Decision/audit: `docs/ux/design/uxr-d09-d10-cashier-decision.md`; `docs/ux/audits/uxr-a09-cashier-cart.md`

> Implement only UXI-07, Bloom cashier discovery and cart. Read the governing documents, `docs/ux/audits/uxr-a09-cashier-cart.md`, `docs/ux/design/uxr-d09-d10-cashier-decision.md`, and `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-cashier-workspace-rework.html`. Inspect `Cashier.jsx`, `CashierCart.jsx`, scanner/quantity utilities, constants, stores, and cashier tests. Implement the approved two-panel workspace: search/scanner and category filters on the left; simple item rows with name/category/SKU/UOM/stock/price; persistent cart on the right with compact quantity controls, line price, subtotal/estimated total, editable discount and conditional reason, CASH/QRIS/tender preparation, cancel confirmation, and narrow transaction access. Preserve fractional rules, focus recovery, stock/session gating, and advisory pre-checkout totals. Do not call checkout or add backend fields in this step. Add tests and run the full validation commands. Update plan status; do not commit or push.

#### UXI-08 — Checkout and durable recovery

Prototype: `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-cashier-workspace-rework.html`; review confirm/review, submitting, checking, known rejection, unknown outcome, and same-request recovery states.

Decision/audit: `docs/ux/design/uxr-d09-d10-cashier-decision.md`; `docs/ux/audits/uxr-a10-checkout-print.md`

> Implement only UXI-08, Bloom checkout and durable recovery. Read the governing documents, `docs/ux/audits/uxr-a10-checkout-print.md`, `docs/ux/design/uxr-d09-d10-cashier-decision.md`, and checkout/recovery states in `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-cashier-workspace-rework.html`. Inspect `CashierCheckout.jsx`, `CashierPurchaseConfirmationModal.jsx`, `sale-checkout.js`, `src/api/sale.js`, sale/cash-session stores, and checkout tests. Implement compact in-place confirmation, exact CASH/QRIS request meaning, duplicate-submit lock, account-bound exact request and idempotency persistence before posting, definitive rejection, and ambiguous same-key recovery without route navigation or cart mutation. The backend remains authoritative for totals, discount acceptance, tender, change, sale result, and stock. Add focused failure/recovery tests and run the full validation commands. Update plan status; do not commit or push.

#### UXI-09 — Sale result and printing

Prototype: `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-cashier-workspace-rework.html`; review result plus print-pending, print-success, and print-error states.

Decision/audit: `docs/ux/design/uxr-d09-d10-cashier-decision.md`; `docs/ux/audits/uxr-a10-checkout-print.md`

> Implement only UXI-09, Bloom sale result and printing. Read the governing documents, `docs/ux/audits/uxr-a10-checkout-print.md`, `docs/ux/design/uxr-d09-d10-cashier-decision.md`, and result/printing states in `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-cashier-workspace-rework.html`. Inspect cashier checkout/result code, `src/utils/receipt-print.js`, receipt-print constants, sale API/store, and tests. Implement sale-first success, server-returned official amounts, printing as a separate retryable operation, duplicate print lock, failure that never implies sale failure, and success wording that reports print-service acknowledgement without claiming physical paper output. Preserve sale detail access and new-sale reset. Add tests and run the full validation commands. Update plan status; do not commit or push.

#### UXI-10 — Sales history, detail, and reprint

Prototype: `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-design-review-suite.html`, select **D11 Riwayat penjualan** and review list, invalid range, empty/error, detail, reprint states, and narrow list/detail.

Decision/audit: `docs/ux/design/uxr-d11-sales-history-decision.md`; `docs/ux/audits/uxr-a11-sales.md`

> Implement only UXI-10, Bloom sales history, detail, and reprint. Read the governing documents, `docs/ux/audits/uxr-a11-sales.md`, `docs/ux/design/uxr-d11-sales-history-decision.md`, and D11 in `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-design-review-suite.html`. Inspect `SaleList.jsx`, `SaleDetail.jsx`, sale cards/tables, sale store/API, print utilities, date controls, and tests. Implement only supported code/creator/start/end filters, Indonesian inverted-range validation, stable server paging, labelled wide and grouped narrow records, semantic detail hierarchy, backend-rendered statuses/money, persisted line UOM/location, and sale-safe reprint pending/success/failure. Do not infer payment/correction state or recalculate amounts. Add tests and run the full validation commands. Update plan status; do not commit or push.

#### UXI-11 — Item list, detail, and location inventory

Prototype: `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-item-master-review.html`

Decision/audit: `docs/ux/design/uxr-d04-item-master-decision.md`; `docs/ux/audits/uxr-a04-items.md`

> Implement only UXI-11, Bloom item list, detail, and location inventory. Read the governing documents, `docs/ux/audits/uxr-a04-items.md`, `docs/ux/design/uxr-d04-item-master-decision.md`, and `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-item-master-review.html`. Inspect `ItemList.jsx`, item detail/barcode/audit modals, item store/API/constants, and tests. Implement grouped identity, exact server prices, UOM/fraction facts, separate STORE/WAREHOUSE quantities, compact accessible row actions, full detail/audit/barcode access, filters/paging, and labelled narrow records without horizontal page overflow. Do not aggregate stock or change item rules. Add tests and run the full validation commands. Update plan status; do not commit or push.

#### UXI-12 — Item creation, editing, and deactivation

Prototype: `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-item-master-review.html`; review create/opening, validation/conflict, edit/locks, deactivation, and narrow-form states.

Decision/audit: `docs/ux/design/uxr-d04-item-master-decision.md`; `docs/ux/audits/uxr-a04-items.md`

> Implement only UXI-12, Bloom item creation, editing, and deactivation. Read the governing documents, `docs/ux/audits/uxr-a04-items.md`, `docs/ux/design/uxr-d04-item-master-decision.md`, and the relevant states in `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-item-master-review.html`. Inspect `ItemCreate.jsx`, `ItemEdit.jsx`, item fields/utilities/store/API, and tests. Implement the approved field hierarchy, opening quantities by location, whole/fractional guidance, immutable/locked facts, retained server validation/conflict, and history-preserving deactivation confirmation/focus behavior. Preserve exact decimal inputs and backend authority. Add tests and run the full validation commands. Update plan status; do not commit or push.

#### UXI-13 — Stock-movement history and detail

Prototype: `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-design-review-suite.html`, select **D05 Riwayat stok** and review list, filters/reset, empty, detail modal, and narrow states.

Decision/audit: `docs/ux/design/uxr-d05-stock-movements-decision.md`; `docs/ux/audits/uxr-a05-stock-movements.md`

> Implement only UXI-13, Bloom stock-movement history and detail. Read the governing documents, `docs/ux/audits/uxr-a05-stock-movements.md`, `docs/ux/design/uxr-d05-stock-movements-decision.md`, and D05 in `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-design-review-suite.html`. Inspect `StockMovementList.jsx`, stock-movement API, routes/navigation, and tests. Implement item/SKU, direction, and location filters with reset; labelled item/movement/location/balance/actor-time columns; grouped narrow records; and an accessible in-context detail modal using already available row facts/reference data. Keep `Buat transfer stok` as the primary action under combined `Pergerakan stok`. Do not invent a detail endpoint. Add tests and run the full validation commands. Update plan status; do not commit or push.

#### UXI-14 — Stock adjustment

Prototype: `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-stock-adjustment-review.html`

Decision/audit: `docs/ux/design/uxr-d06-stock-adjustment-decision.md`; `docs/ux/audits/uxr-a06-stock-adjustment.md`

> Implement only UXI-14, Bloom stock adjustment. Read the governing documents, `docs/ux/audits/uxr-a06-stock-adjustment.md`, `docs/ux/design/uxr-d06-stock-adjustment-decision.md`, and `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-stock-adjustment-review.html`. Inspect stock-adjustment list/create/detail pages, components, store/API/utilities, and tests. Implement history, searchable item selection, ADD/REMOVE/CORRECTION meaning, UOM-aware quantity, confirmation, one pending request, definitive rejection, exact-request ambiguous recovery, backend-confirmed result/detail, and labelled narrow layouts. Never calculate final stock authoritatively. Add tests for each action and recovery path, then run the full validation commands. Update plan status; do not commit or push.

#### UXI-15 — Stock transfer

Prototype: `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-stock-transfer-review.html`

Decision/audit: `docs/ux/design/uxr-d07-stock-transfer-decision.md`; `docs/ux/audits/uxr-a07-stock-transfer.md`

> Implement only UXI-15, Bloom stock transfer. Read the governing documents, `docs/ux/audits/uxr-a07-stock-transfer.md`, `docs/ux/design/uxr-d07-stock-transfer-decision.md`, and `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-stock-transfer-review.html`. Inspect `StockTransferCreate.jsx`, stock-transfer store/API, routes, shared quantity controls, and tests. Implement searchable item selection, explicit source/destination, labelled swap, source availability display, UOM-aware numeric quantity, optional description, refresh, self-contained confirmation, pending lock, known rejection, exact account-bound recovery, backend-confirmed result, and wide/narrow behavior. Keep transfer under `Pergerakan stok`; do not invent stock calculations or endpoints. Add tests and run the full validation commands. Update plan status; do not commit or push.

#### UXI-16 — Supplier list and detail

Prototype: `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-design-review-suite.html`, select **D12 Pemasok** and review list, paging, active/inactive, detail, error/empty, and narrow states.

Decision/audit: `docs/ux/design/uxr-d12-suppliers-decision.md`; `docs/ux/audits/uxr-a12-suppliers.md`

> Implement only UXI-16, Bloom supplier list and detail. Read the governing documents, `docs/ux/audits/uxr-a12-suppliers.md`, `docs/ux/design/uxr-d12-suppliers-decision.md`, and D12 in `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-design-review-suite.html`. Inspect `SupplierList.jsx`, `SupplierDetail.jsx`, supplier store/API/utilities, and tests. Implement supported search/status/paging, labelled columns and grouped narrow records, backend-owned outstanding balance, complete contact/audit facts, clear inactive treatment, loading/error/empty recovery, and accessible compact actions. Do not infer debt. Add tests and run the full validation commands. Update plan status; do not commit or push.

#### UXI-17 — Supplier creation, editing, and deactivation

Prototype: `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-design-review-suite.html`, select **D12 Pemasok** and review create, normalization guidance, immutable-code edit, duplicate conflict, deactivation confirmation, inactive result, and narrow form.

Decision/audit: `docs/ux/design/uxr-d12-suppliers-decision.md`; `docs/ux/audits/uxr-a12-suppliers.md`

> Implement only UXI-17, Bloom supplier creation, editing, and deactivation. Read the governing documents, `docs/ux/audits/uxr-a12-suppliers.md`, `docs/ux/design/uxr-d12-suppliers-decision.md`, and D12 mutation states in `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-design-review-suite.html`. Inspect `SupplierUpsert.jsx`, supplier detail/list actions, store/API/utilities, and tests. Implement pre-commit normalization guidance, immutable supplier code during edit, retained duplicate conflict, safe history-preserving deactivation with cancel-first focus and Escape restoration, and complete narrow forms. Preserve backend validation and debt history. Add tests and run the full validation commands. Update plan status; do not commit or push.

#### UXI-18 — Goods-receipt history and detail

Prototype: `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-design-review-suite.html`, select **D13 Penerimaan barang** and review list, payment-state filters, detail, error/empty, and narrow states.

Decision/audits: `docs/ux/design/uxr-d13-goods-receipts-decision.md`; `docs/ux/audits/uxr-a13-goods-receipt-history.md`; `docs/ux/audits/uxr-a14-goods-receipt-create.md`

> Implement only UXI-18, Bloom goods-receipt history and detail. Read the governing documents, both UXR-A13/A14 audits, `docs/ux/design/uxr-d13-goods-receipts-decision.md`, and D13 in `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-design-review-suite.html`. Inspect receipt list/detail pages, info/items components, receipt store/API, and tests. Implement URL-backed supported filters/paging, UNPAID/PARTIALLY_PAID/PAID states from the server, labelled/grouped narrow records, and receipt-first detail with audit/payment facts and received item/location lines before the secondary payment action. Do not infer payment status, debt, or totals. Add tests and run the full validation commands. Update plan status; do not commit or push.

#### UXI-19 — Goods-receipt creation and recovery

Prototype: `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-design-review-suite.html`, select **D13 Penerimaan barang** and review create, per-location lines, repeated SKU, validation, confirmation, pending, rejection, exact-request recovery, success, and narrow states.

Decision/audits: `docs/ux/design/uxr-d13-goods-receipts-decision.md`; UXR-A13/A14 reports above.

> Implement only UXI-19, Bloom goods-receipt creation and recovery. Read the governing documents, UXR-A13/A14 audits, `docs/ux/design/uxr-d13-goods-receipts-decision.md`, and D13 creation states in `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-design-review-suite.html`. Inspect `GoodsReceiptCreate.jsx`, receipt line/lookup components, create helpers/store/API, and tests. Implement compact item-location lines including repeated SKUs, Indonesian received date/time guidance, advisory input estimate, validation, localized cancel-first confirmation, one pending exact request, definitive rejection, durable same-request recovery, backend-confirmed receipt result, and no-overflow narrow layout. Do not calculate official totals/debt/payment state. Add tests and run the full validation commands. Update plan status; do not commit or push.

#### UXI-20 — Payable discovery and receipt debt detail

Prototype: `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-design-review-suite.html`, select **D14 Utang pemasok** and review list, search/paging, receipt detail, payment history, error/empty, and narrow states.

Decision/audit: `docs/ux/design/uxr-d14-payables-payment-decision.md`; `docs/ux/audits/uxr-a15-payables-payment.md`

> Implement only UXI-20, Bloom payable discovery and receipt debt detail. Read the governing documents, `docs/ux/audits/uxr-a15-payables-payment.md`, `docs/ux/design/uxr-d14-payables-payment-decision.md`, and D14 in `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-design-review-suite.html`. Inspect `SupplierPayableList.jsx`, receipt detail/payment components, supplier-payment API/store/utilities, and tests. Implement only supported receipt/supplier-name discovery and paging, receipt-first debt detail, received lines and payment history before mutation, exact backend balances/payment states, and grouped narrow records. Optional supplier-code filtering must remain gated until the backend contract exists. Add tests and run the full validation commands. Update plan status; do not commit or push.

#### UXI-21 — Supplier payment and recovery

Prototype: `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-design-review-suite.html`, select **D14 Utang pemasok** and review amount/method/reference/note form, CASH/non-cash meaning, confirmation, pending, rejection, exact recovery, refreshed success, and narrow states.

Decision/audit: `docs/ux/design/uxr-d14-payables-payment-decision.md`; `docs/ux/audits/uxr-a15-payables-payment.md`

> Implement only UXI-21, Bloom one-receipt supplier payment and recovery. Read the governing documents, UXR-A15 audit, D14 decision, and D14 payment states in `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-design-review-suite.html`. Inspect `SupplierPayment.jsx`, supplier-payment API/store/utilities, receipt detail integration, and tests. Implement exact amount/method/reference/note entry, explicit CASH versus non-cash session meaning, cancel-first confirmation, pending lock, corrected query-parameter transport, exact account-bound recovery, definitive rejection, and backend-refreshed success/history/balance. Do not calculate outstanding balance or payment status. Add tests and run the full validation commands. Update plan status; do not commit or push.

#### UXI-22 — Expense history and creation

Prototype: `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-design-review-suite.html`, select **D15 Pengeluaran** and review history, active/closed eligibility, create, validation, confirmation, pending, recovery, result, and narrow states.

Decision/audits: `docs/ux/design/uxr-d15-expenses-voids-decision.md`; `docs/ux/audits/uxr-a16-expense-create.md`; `docs/ux/audits/uxr-a17-expense-void.md`

> Implement only UXI-22, Bloom expense history and creation. Read the governing documents, UXR-A16/A17 audits, `docs/ux/design/uxr-d15-expenses-voids-decision.md`, and D15 in `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-design-review-suite.html`. Inspect `ExpenseHistory.jsx`, `ExpenseCreate.jsx`, expense record/helpers/store/API, and tests. Implement paged labelled history, active versus closed-session eligibility, exact open-session-bound creation, decimal/category/note validation, cancel-first confirmation, pending lock, account-bound exact recovery, definitive rejection, backend-confirmed result, and grouped narrow records. Do not infer cash-session impact or balances. Add tests and run the full validation commands. Update plan status; do not commit or push.

#### UXI-23 — Expense void and reversal

Prototype: `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-design-review-suite.html`, select **D15 Pengeluaran** and review detail, reasoned void confirmation, pending, uncertain recovery, rejection, void result, retained original/reversal facts, and narrow states.

Decision/audits: `docs/ux/design/uxr-d15-expenses-voids-decision.md`; UXR-A16/A17 reports above.

> Implement only UXI-23, Bloom expense void and reversal. Read the governing documents, UXR-A16/A17 audits, the D15 decision, and D15 void states in `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-design-review-suite.html`. Inspect `ExpenseVoidDialog.jsx`, `ExpenseRecord.jsx`, expense-void store/API/utilities, history integration, and tests. Implement audit-rich detail, required reason, cancel-first confirmation, pending lock, exact account-bound ambiguous recovery, definitive rejection, backend-confirmed void result, immutable original plus reversal facts, and explicit server-returned session impact. Never delete the original or calculate reversal/session totals. Add tests and run the full validation commands. Update plan status; do not commit or push.

#### UXI-24 — Operational dashboard

Prototype: `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-dashboard-rework.html`

Decision/audit/backend gate: `docs/ux/design/uxr-d02-dashboard-decision.md`; `docs/ux/audits/uxr-a02-dashboard.md`; `docs/ux/design/uxr-d02-dashboard-backend-request.md`

> Implement only UXI-24, Bloom's operational dashboard, after verifying the backend read models requested in `docs/ux/design/uxr-d02-dashboard-backend-request.md` exist. Read the governing documents, UXR-A02 audit, D02 decision/backend request, and `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61\bloom-dashboard-rework.html`. Inspect `Dashboard.jsx`, dashboard components/store/API, navigation destinations, and tests. Implement four server-owned summaries, action-oriented attention, one seven-day sales chart, exact drill-downs, loading/no-session/zero/stale/refresh-error states, keyboard bypass/focus, and one/two/three-column responsive layouts. Do not aggregate sales or stock in the frontend and do not ship placeholder business data. If either required backend read model is absent, stop and report the gate without implementing approximations. Add tests and run the full validation commands. Update plan status; do not commit or push.

#### UXI-25 — Cross-domain verification

Primary prototypes: `bloom-appearance-modes-final-review.html`, `bloom-navigation-shell-review.html`, `bloom-cashier-workspace-rework.html`, `bloom-design-review-suite.html`, and `bloom-dashboard-rework.html` in `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61`.

> Verify the completed Bloom UX rework without adding features or broad refactors. Read `AGENTS.md`, the frontend contract, both roadmaps, `docs/ux/design/design-review-register.md`, every approved decision record, and the five primary prototypes in `C:\Users\Ambrosius David H\.codex\visualizations\2026\09\14\01a0a24b-49aa-7771-b460-386677499a61`. Inspect the final diff and exercise authentication/protected return, cash-session open/close, cashier search/cart, CASH and QRIS checkout, ambiguous recovery, printing, sales reprint, item/stock operations, receipt creation, supplier payment, expense creation/void, dashboard drill-downs, light/dark/system modes, keyboard/focus order, 200% zoom, and 760-pixel narrow desktop. Run `npm test`, `npm run lint`, and `npm run build`. Record remaining hardware-only scanner/printer checks and any backend-gated dashboard work explicitly. Fix only regressions introduced by the rework; do not commit or push.

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
2. Whether the owner-approved local screenshot sets should later be committed or moved to an approved
   external evidence store; until then they remain untracked working-tree evidence.
3. Which disposable database reset/reseed procedure is approved for live transaction capture.
