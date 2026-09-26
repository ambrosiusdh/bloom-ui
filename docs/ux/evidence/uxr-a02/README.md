# UXR-A02 evidence index — operational dashboard

Audit date: 2026-09-26  
Environment: local Bloom frontend (`http://localhost:5173`) and backend (`http://localhost:8080`)  
Browser: Codex in-app browser (Chromium-based; exact version unavailable)  
Viewports: default wide desktop, `1440×900`, `1024×768`, and `760×768`  
Mutation policy: read-only; no domain state changed

The assessment and priorities are in
[`docs/ux/audits/uxr-a02-dashboard.md`](../../audits/uxr-a02-dashboard.md).

## Persistent screenshots

| Evidence | File | Material state captured |
| --- | --- | --- |
| A02-E00 | [`00-dashboard-normal-wide.jpg`](00-dashboard-normal-wide.jpg) | Initial wide dashboard with zero sales, open session `#15`, and two payable receipts. |
| A02-E01 | [`01-dashboard-refresh-success.jpg`](01-dashboard-refresh-success.jpg) | Successful refresh status with retained server-owned values. |
| A02-E02 | [`02-dashboard-drilldown-sales.jpg`](02-dashboard-drilldown-sales.jpg) | Sales-history drill-down restricted to the server business date. |
| A02-E03 | [`03-dashboard-drilldown-session.jpg`](03-dashboard-drilldown-session.jpg) | Current cash-session detail destination. |
| A02-E04 | [`04-dashboard-refresh-pending-retained.jpg`](04-dashboard-refresh-pending-retained.jpg) | Refresh pending announcement, disabled action, and previous data retained. |
| A02-E05 | [`05-dashboard-drilldown-expenses.jpg`](05-dashboard-drilldown-expenses.jpg) | Expense-history drill-down. |
| A02-E06 | [`06-dashboard-drilldown-payables.jpg`](06-dashboard-drilldown-payables.jpg) | Supplier-payables drill-down. |
| A02-E07 | [`07-dashboard-1024x768-stale-breadcrumb.jpg`](07-dashboard-1024x768-stale-breadcrumb.jpg) | Two-column layout and incorrect retained `Utang Pemasok` breadcrumb after Back. |
| A02-E08 | [`08-dashboard-760x768.jpg`](08-dashboard-760x768.jpg) | One-column narrow layout without page-level horizontal overflow. |
| A02-E09 | [`09-dashboard-1440x900.jpg`](09-dashboard-1440x900.jpg) | Three-column wide hierarchy and unequal information density. |
| A02-E10 | [`10-dashboard-keyboard-refresh-focus.jpg`](10-dashboard-keyboard-refresh-focus.jpg) | Strong visible focus on refresh after traversing the shell controls. |
| A02-E11 | [`11-dashboard-stale-warning.jpg`](11-dashboard-stale-warning.jpg) | Natural server-deadline expiry warning with prior values retained. |
| A02-E12 | [`12-dashboard-stale-refresh-cleared.jpg`](12-dashboard-stale-refresh-cleared.jpg) | Refresh success after stale warning and newer `Data per` timestamp. |

## Measurements and interaction notes

- `1440×900`: `clientWidth=1440`, `scrollWidth=1440`; three summary columns.
- `1024×768`: `clientWidth=1009`, `scrollWidth=1009`; two columns and payables below the initial fold.
- `760×768`: `clientWidth=760`, `scrollWidth=760`; one column.
- Refresh retained the last confirmed values, disabled duplicate activation, and announced pending/success.
- Natural stale state appeared after the backend-provided `freshUntil`; refreshing cleared it.
- Keyboard traversal reached `Perbarui data` after 15 shell controls; its focus indicator was visible.
- All four recognized drill-downs reached useful completed workflows.
- Browser warning/error log inspection returned no entries.
- The temporary viewport override was reset after capture.

## Repository, backend, and automated evidence

Frontend inspection covered:

- `src/pages/dashboard/Dashboard.jsx`
- `src/components/dashboard/OperationalDashboardWidgets.jsx`
- `src/stores/modules/dashboard.js`
- `src/api/dashboard.js`
- dashboard page, store, and API tests

Backend inspection covered the dashboard domain contract, `DashboardController`, dashboard response
DTOs, `DashboardServiceImpl`, store-zone business-date selection, freshness, cash-session aggregation,
supplier-payables aggregation, and recognized drill-down descriptors.

Focused verification command:

```text
.\node_modules\.bin\vitest.cmd run src/test/pages/dashboard/Dashboard.test.jsx src/test/stores/dashboard.test.js src/test/api/dashboard.test.js
```

Result:

```text
Test Files  3 passed (3)
Tests       12 passed (12)
Duration    2.45s
```

No-open-session, zero-payables, initial error, and retained-data refresh failure were not forced
against live financial fixtures. They remain clearly labelled source/test evidence in the report.

