# UXR-D02 — Dashboard design review

Status: `APPROVED`  
Evidence: `docs/ux/audits/uxr-a02-dashboard.md`  
Interactive review: `bloom-design-review-suite.html`, design item **D02 Dashboard**
Decision: `uxr-d02-dashboard-decision.md`

## Proposed direction

- Keep the server-owned operational hierarchy: sales today, current cash session, supplier debt, and
  active expenses.
- Use the server-provided `asOf`, `freshUntil`, store zone, and drill-down descriptors; do not rebuild
  filters or values in the browser.
- Keep previous successful data visible during refresh and refresh failure.
- Make zero sales, no open cash session, stale data, refresh success, and refresh error explicit.
- Use content-sized cards so the one/two/three-column responsive layouts do not create unnecessary
  equal-height whitespace.
- Remove “Release 1” from user-facing copy and name the store time context on freshness warnings.

## External-review reconciliation — 2026-09-27

The external review's central principle is valid: the Dashboard should answer what is happening,
what requires attention, and where the user can act without becoming an analytics page. The revised
review frame therefore:

- uses “Ringkasan toko hari ini” and “Terakhir diperbarui” instead of technical server wording;
- shows the already-contracted cash-session opening time and opener;
- moves active-session expenses into a compact, correctly scoped summary rather than calling them a
  general daily expense total;
- makes the four immediate summaries consistent in density and increases important supporting text;
- adds one compact “Perlu perhatian” panel with supplier debt plus a contract-gated STORE stock
  summary; and
- shows the intended seven-day bar-chart composition with visibly labelled example data while
  preserving its backend gate.

The review does **not** adopt whole-Rupiah rounding: Bloom's backend and current frontend deliberately
preserve scale-four monetary values, including valid fractional results from material quantities.
It also does not add payable due dates, because no due-date field or rule exists; “cash session
normal” health language, because the current contract exposes only `OPEN`/`NONE`; recent cross-domain
activity, because no ordered audit-feed contract exists; or a permanent quick-action grid, because
the shell already keeps Cashier prominent and the value of more shortcuts has not been tested.

## Backend gates

The owner previously preferred a seven-day sales chart, but the current backend response does not
provide a daily series. The review shows the intended bar-chart hierarchy with an explicit
“data contoh” and “menunggu kontrak” treatment so the owner can judge the layout without mistaking
illustrative values for product facts. It does not aggregate sales in the frontend. Implementation of
the chart remains blocked until the backend exposes an approved aggregate, or the owner explicitly
removes the chart requirement.

The proposed stock-attention row is also backend-gated. The legacy Dashboard's total-stock query is
not authoritative because Release 1 requires independent STORE and WAREHOUSE quantities. The revised
design requires a server-owned STORE summary with explicit threshold/state definitions and bounded
preview rows. The detailed copy-ready backend request is in
`uxr-d02-dashboard-backend-request.md`.

## Owner decision — 2026-09-27

The owner approved the denser four-summary composition, “Perlu perhatian” panel, and seven-day chart
placement after sending the copy-ready contract request to the backend agent. The chart and stock
rows remain design examples until their backend contracts exist; approval does not clear either
implementation gate. The binding rationale and exclusions are recorded in
`uxr-d02-dashboard-decision.md`.
