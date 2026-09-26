# UXR-D02 — Dashboard direction record

Owner direction recorded: 2026-09-23  
Formal UXR-D02 status: `PLANNED` pending post-audit design review and the weekly-series backend gate  
Implementation status: not approved

## Owner-accepted direction

The owner accepted the dashboard composition developed from the approved UXR-D00 visual direction:

- retain the Operational Blue back-office shell and navigation behavior;
- lead with three backend-owned operational summaries: sales today, current cash session, and supplier
  payables;
- add one secondary seven-day sales bar chart for owner-level trend awareness;
- keep the current cash-session detail prominent because it determines whether cashier work can proceed;
- provide labelled quick routes to Cashier, Goods Receipt, Stock Adjustment, and Expense Recording;
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
- implementation approval before UXR-A02 and the backend chart contract gate are complete.

## UXR-A02 reconciliation

UXR-A02 completed on 2026-09-26 and supports the three-summary operational hierarchy,
prominent cash-session state, explicit freshness, retained-data refresh behavior, and recognized
drill-downs. The audit adds four constraints to the direction:

- clear stale cross-domain breadcrumbs when returning to Dashboard;
- provide a keyboard bypass for the 15 shell controls before the first dashboard action;
- reduce empty equal-card space while keeping the cash-session facts prominent; and
- replace internal `Release 1` wording with task-oriented Indonesian and strengthen freshness context.

The evidence is recorded in
[`docs/ux/audits/uxr-a02-dashboard.md`](../audits/uxr-a02-dashboard.md). UXR-D02 remains formally
`PLANNED` until those constraints are reviewed in the design artifact and an approved backend
aggregate exists for the seven-day series, or the owner explicitly removes that chart. Neither the
audit nor this reconciliation authorizes frontend aggregation or application implementation.
