# UXR-D02 — Dashboard backend contract request

Status: `PROPOSED_BACKEND_WORK` — not implemented or approved by this frontend design review  
Consumer: UXR-D02 Dashboard  
Current authority: `GET /api/dashboard/operational-overview`

## Why backend work is required

The existing operational response authoritatively supplies sales today, the current cash session,
active expenses for that exact session, supplier payables, drill-down descriptors, and freshness.
It does not supply a seven-day daily sales series or STORE-specific stock attention. The frontend
must not reconstruct either result from paged sales, item, or movement endpoints.

The legacy `GET /api/dashboard/overview` is not a safe substitute. Its low-stock query adds STORE
and WAREHOUSE stock even though Release 1 treats those locations independently, and its chart is
assembled with repeated application-side reads using the machine-default zone.

## Copy-ready backend prompt

> Implement one backend-only extension of Bloom's Release 1 operational Dashboard read model. Work
> in the Bloom backend repository and preserve all existing behavior of
> `GET /api/dashboard/operational-overview`. Before editing, read the backend `AGENTS.md`, inspect Git
> status, and read `docs/architecture/release-1-domain-contract.md`, especially the inventory-location,
> sales, cash-session, supplier-payment, and FE-31 Dashboard sections. Inspect the current
> `DashboardController`, `OperationalDashboardResponse` and nested DTOs, `DashboardServiceImpl`,
> `SaleRepository`, `ItemRepository`, security tests, service tests, controller tests, and PostgreSQL
> integration tests. Do not modify the Bloom frontend in this task.
>
> Extend the existing authenticated, read-only operational response with exactly two optional but
> non-null sections in the successful response: `salesLast7Days` and `stockAttention`. Preserve the
> existing outer `asOf`, `freshUntil`, `businessDate`, and `storeZoneId` as the freshness and
> store-calendar authority for every section. Preserve existing fields and JSON meaning so current
> clients remain compatible. Do not use or change the legacy `/api/dashboard/overview` contract.
>
> For `salesLast7Days`, return exactly seven consecutive store-zone calendar dates ending at
> `businessDate`, ordered oldest to newest. Each day must contain `businessDate`, non-negative
> `BigDecimal salesAmount`, non-negative `transactionCount`, `periodStart`, and
> `periodEndExclusive`. Return explicit zero rows for dates without sales. Also return authoritative
> `periodStartDate`, `periodEndDate`, `totalSalesAmount`, `totalTransactionCount`, and one semantic
> `SALES_HISTORY` drill-down covering those inclusive calendar bounds. Calculate daily and period
> totals in bounded repository query/query-set form; do not load sale entities and aggregate them in
> Java, issue one query per day, use the machine-default zone, or ask the frontend to sum days.
>
> For `stockAttention`, model immediate cashier availability at `STORE` only. Do not add STORE and
> WAREHOUSE quantities, and do not let WAREHOUSE stock hide a STORE shortage. Include active items
> only. Use the existing configured low-stock threshold only after documenting it as the explicit
> Dashboard threshold. Define `OUT_OF_STOCK` as `stockStore <= 0` and `LOW_STOCK` as
> `stockStore > 0 && stockStore < threshold`; if current stock invariants make negative balances
> impossible, keep the defensive `<= 0` definition. Return non-negative `outOfStockCount`,
> `lowStockCount`, the exact `threshold`, `location: STORE`, and at most three preview rows sorted by
> severity (`OUT_OF_STOCK` first), then quantity ascending, then stable item identity. Each preview
> row must contain stable item identity/reference, SKU, name, base unit of measure, exact
> `stockStore`, and explicit state. Add a semantic item-list drill-down destination only if it maps
> to the already implemented item list; do not invent a raw frontend URL or an unsupported stock
> filter. Use a bounded aggregate plus bounded preview query and avoid N+1 reads.
>
> Update the backend Release 1 domain contract with exact field types, nullability, zero/empty
> semantics, date/zone rules, threshold boundary, sort order, authorization, drill-down combinations,
> examples, and query behavior. A successful response must always include both new sections with
> zero counts/zero totals and an empty preview when no matching data exists; do not use `null` to
> represent an ordinary empty state. A database failure must use the existing API error behavior and
> must not return a partially authoritative Dashboard.
>
> Preserve monetary and quantity precision as `BigDecimal`; do not round Rupiah values to whole
> numbers, convert them to `double`, return formatted currency strings, or calculate profit,
> profitability, margin, health scores, forecasts, reorder quantities, due dates, or recommendations.
> Do not add recent cross-domain activity, previous-session variance, quick actions, item-level
> reorder configuration, or payable due-date rules in this change. Do not mutate stock, sales,
> sessions, expenses, receipts, or payments.
>
> Add focused repository/service/controller/security/PostgreSQL integration coverage for: seven
> consecutive dates across month/year and daylight-offset boundaries in the configured store zone;
> explicit zero-sales days; authoritative period totals; fractional amounts; inactive-item exclusion;
> STORE/WAREHOUSE independence; zero and fractional STORE quantities; threshold boundary; severity
> and stable preview ordering; empty stock attention; preserved current response fields; authenticated
> access and HTTP 401 for anonymous access; fixed query shape without per-day or per-row reads; and
> failure using the normal API error path. Run the focused tests plus the affected Maven module tests.
> Report exact changed files, commands/results, response examples, compatibility notes, and any
> contract question that prevented the requested semantics. Do not commit or push unless explicitly
> requested.

## Explicitly not requested from backend

- Cash-session start time and opener: already returned as `openedAt` and `openedBy`.
- Exact active-session expenses: already returned as `activeExpenseAmount` and
  `activeExpenseCount` inside `currentCashSession`.
- Quick-action destinations: existing frontend routes are sufficient.
- Supplier due dates: Bloom has no approved due-date field or rule.
- Rounded whole-Rupiah summaries: Release 1 intentionally preserves exact scale-four values.
- Recent cross-domain activity: this would require a separate, ordered audit-feed contract and is
  deferred until owner research demonstrates that it is more useful than existing histories.
