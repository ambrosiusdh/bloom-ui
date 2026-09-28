# UXR-D02 — Dashboard direction record

Owner direction recorded: 2026-09-23  
Formal UXR-D02 status: `APPROVED`; the weekly-series and STORE-stock backend gates remain open
Implementation status: approved for planning, not started

## Owner-accepted direction

The owner accepted the dashboard composition developed from the approved UXR-D00 visual direction:

- retain the Operational Blue back-office shell and navigation behavior;
- lead with four compact backend-owned operational summaries: sales today, current cash session,
  active-session expenses, and supplier payables;
- add one secondary seven-day sales bar chart for owner-level trend awareness;
- keep the current cash-session detail prominent because it determines whether cashier work can proceed;
- provide task routes from each summary and attention item without duplicating the reviewed
  navigation as a permanent shortcut grid;
- retain explicit freshness, refresh, loading, stale, refresh-failure, zero-sales, and no-open-session
  behavior;
- support the same hierarchy in wide and narrow desktop layouts, with light as the default appearance
  candidate and a semantically equivalent dark appearance.

The weekly chart stays below the operational summaries. It uses one bar per calendar day, directly
labels the daily amount, exposes the exact amount and transaction count when a day is selected, and
shows the seven-day total. It is intentionally the only chart in this direction.

## Product rationale

The three existing operational groups answer what needs attention now, but they do not answer the
owner's recurring question of whether sales are improving or declining across the week. One simple
seven-day comparison adds that context without turning the operational dashboard into a reporting
suite or displacing the cash-session state.

A bar chart is preferred over a line chart because discrete daily totals are easier to compare and
zero-sales days remain explicit. The design avoids multiple charts, dense legends, hidden-only
tooltips, profitability claims, and decorative analytics that would increase cognitive load for the
intended older users.

## Backend contract gate for the weekly chart

The implemented `GET /api/dashboard/operational-overview` contract does not currently provide the
accepted seven-day series. The visual uses illustrative values only to review hierarchy and
interaction; those values are not product data and must not be copied into application fixtures as
business truth.

Before implementation, an approved backend read model must authoritatively provide at least:

- the store-zone calendar date and sales amount for each of the seven days, including explicit zero
  days;
- the transaction count for each day;
- the seven-day period bounds and authoritative period totals, if those totals remain visible;
- freshness metadata consistent with the dashboard's existing stale-data behavior; and
- a supported sales-history drill-down reference or query semantics.

The frontend must not build the series by downloading, paging, or combining sales-history records,
must not calculate an authoritative weekly total, and must not infer comparison or profitability.
No endpoint name or response field is approved by this design record.

## State and accessibility coverage to preserve

- Normal data, all-zero seven-day data, zero sales today, and no open cash session remain distinct.
- Initial loading and retained-data refresh failure do not expose incomplete chart values as final.
- Stale status applies clearly to the weekly values as well as the operational summaries.
- Every day is keyboard reachable and has an accessible full date, amount, and transaction count.
- Exact selected-day details are visible without relying on hover or color.
- The chart reflows without removing totals, day labels, or the sales-history path on narrow desktop.
- Light and dark appearances preserve semantic status, focus visibility, and readable contrast.

## Deliberately excluded

- additional revenue, profit, category, product, inventory, or stock-alert charts;
- recent-transaction duplication on the dashboard;
- client-side sales aggregation or comparison calculations;
- new business rules, accounting interpretation, or a general reporting workspace; and
- client-side stand-ins for the chart or stock-attention read models while their backend gates remain
  open.

## UXR-A02 reconciliation

UXR-A02 completed on 2026-09-26 and supports the three-summary operational hierarchy,
prominent cash-session state, explicit freshness, retained-data refresh behavior, and recognized
drill-downs. The audit adds four constraints to the direction:

- clear stale cross-domain breadcrumbs when returning to Dashboard;
- provide a keyboard bypass for the 15 shell controls before the first dashboard action;
- reduce empty equal-card space while keeping the cash-session facts prominent; and
- replace internal `Release 1` wording with task-oriented Indonesian and strengthen freshness context.

The evidence is recorded in
[`docs/ux/audits/uxr-a02-dashboard.md`](../audits/uxr-a02-dashboard.md) and is incorporated into
[`uxr-d02-dashboard-review.md`](uxr-d02-dashboard-review.md). An approved backend aggregate is still
required for the seven-day series unless the owner explicitly removes that chart. Neither the audit
nor this reconciliation authorizes frontend aggregation.

## Review refinement — 2026-09-27

An external senior-UX review correctly identified opportunities to make the accepted operational
direction more actionable for older users. The review candidate now uses simpler freshness copy,
surfaces the already-contracted cash-session opener/time, compacts active-session expenses, and tests
a single “Perlu perhatian” panel beside the seven-day chart. It keeps exact scale-four monetary
display and does not introduce uncontracted payable due dates, inferred health status, or a recent
cross-domain activity feed.

The stock portion of “Perlu perhatian” is not owner-approved product data. It requires a new
STORE-specific backend read model because the legacy total-stock Dashboard query conflicts with
Release 1 location independence. The seven-day chart still requires its approved daily aggregate.
Both requested backend additions and exclusions are specified in
[`uxr-d02-dashboard-backend-request.md`](uxr-d02-dashboard-backend-request.md).

## Final owner approval — 2026-09-27

The owner accepted the refined Dashboard after sending the backend request to the backend agent.
UXR-D02 is now `APPROVED` for implementation planning. The four-summary hierarchy, attention panel,
seven-day chart placement, exact monetary display, state coverage, and exclusions are binding as
recorded in [`uxr-d02-dashboard-decision.md`](uxr-d02-dashboard-decision.md). This approval does not
clear the daily-sales or STORE-stock data gates, and application implementation has not begun.
