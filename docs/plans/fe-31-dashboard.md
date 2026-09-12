# FE-31 operational dashboard plan

## Verified gate

- The backend exposes authenticated `GET /api/dashboard/operational-overview` as one read-only
  `ApiResponse<OperationalDashboardResponse>`.
- Its three approved groups are sales today, current cash-session operations, and supplier payables.
- `asOf`, `freshUntil`, `businessDate`, and `storeZoneId` define display time and staleness.
- Semantic drill-down destinations cover only routes already implemented by FE-17, FE-22, FE-27,
  and FE-29.
- Backend aggregate queries and `CashReconciliationCalculator` own every displayed business value.

## Widget and responsive layout

Use one responsive grid without changing the application shell:

- one column on narrow screens;
- two columns from the medium breakpoint;
- three columns on wide desktop screens.

The sales widget shows the backend sales amount, transaction count, and business date. The cash
session widget shows an explicit `NONE` state or the server's open-session reconciliation and active
drawer-expense values. The payables widget shows backend outstanding amount and open receipt count.
Zero activity is explanatory text plus numeric zero; no open session keeps its contractually null
money values out of the UI.

## Request and state transitions

The Zustand dashboard store performs one operational-overview request. Initial loading replaces the
widget area. Refresh loading preserves the last successful response. Initial failure offers retry;
refresh failure keeps the confirmed response and focuses the alert. A successful retry replaces all
three groups together. The screen labels retained data stale only after the response's `freshUntil`.

## Accessibility and drill-downs

Each widget is a labelled section with descriptive labels for money and counts. Loading, refresh,
error, success, and stale messages use live status or alert semantics. Refresh and retry are ordinary
keyboard-operable buttons. Semantic drill-downs are allow-listed and mapped as follows:

- `SALES_HISTORY` to `/sales` with the backend dates;
- `CASH_SESSION_HISTORY` to `/cash-sessions`;
- `CASH_SESSION_DETAIL` to a validated numeric session reference;
- `EXPENSE_HISTORY` to `/expenses`;
- `PAYABLES` to `/payables`.

Unknown destinations and malformed references do not produce links.

## Focused verification

Tests cover the exact API path and single request, store race/error preservation, initial loading,
zero versus no-session states, populated Indonesian rendering, approved links, malformed link
rejection, refresh/retry focus behavior, and stale data. Targeted lint and the production build cover
the touched implementation. No profitability, reporting, chart, global-shell, or design-system work
is included.
