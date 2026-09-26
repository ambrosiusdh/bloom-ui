# Bloom Release 1 UX Evidence Synthesis

Work item: `UXR-A18`  
Status: `EVIDENCE_COMPLETE`  
Completed: 2026-09-26  
Scope: synthesis of UXR-A01 through UXR-A17; no application operation, Figma work, or code change

## 1. Executive conclusion

Bloom's Release 1 workflows are functionally broad and usually preserve the most important domain
properties: backend authority, exact stock and money meaning, durable transaction identity, explicit
confirmation, and retained audit history. The strongest opportunity is not a new component library or
a whole-application rewrite. It is a coordinated correction of repeated interaction problems around
narrow-desktop layout, shell state, focus recovery, localization, and cross-domain traceability.

The 17 domain reports contain **77 recorded findings**:

- **two resolved P0s:** stock-transfer ambiguous-outcome recovery (`TRANSFER-01`) and
  supplier-payment receipt-code transport (`PAYMENT-01`), both corrected and reverified on
  2026-09-26;
- **42 P1 findings**; and
- **33 P2 findings**.

The transfer P0 was closed after this synthesis was first written. The frontend now durably retains
the authenticated account, exact request, and idempotency key before posting, locks uncertain state
across navigation/reload, and reconciles by replaying the existing backend idempotent POST. No new
endpoint or stock rule was introduced. Later UXR-D07 design must preserve that recovery behavior.

The repeated P1 evidence supports a small set of shared directions:

1. repair shell navigation state and keyboard bypass before reproducing the shell across more
   designs;
2. use the already approved grouped-row/narrow-stack baseline instead of page-level horizontal
   panning;
3. establish one result, error, dialog, and focus-recovery contract across mutations;
4. make Indonesian date, time, and money entry consistent with their read-only presentation while
   preserving exact backend values; and
5. connect operational records to their source and result screens without inventing new business
   behavior.

These are cross-domain patterns, not approval for a global design system. Each domain still needs its
own design review, and each approved design still needs a separate implementation re-baseline.

## 2. Method and evidence boundary

This synthesis read the frontend contract, frontend roadmap, UX roadmap, the approved visual-direction
record, and every UXR-A01 through UXR-A17 report. It did not operate the application because the
source reports already distinguish live evidence, repository/test evidence, inference, and
limitations.

A pattern is called **repeated evidence** below only when at least two reports independently support
it. A proposed ordering or shared treatment is labelled **synthesis inference**. Domain-specific facts
remain authoritative in their source reports.

## 3. Preserved strengths

| Preserved strength | Evidence | What later design must retain |
| --- | --- | --- |
| Backend-owned operational facts | Exact server stock and movement results in [A04](uxr-a04-items.md), [A05](uxr-a05-stock-movements.md), [A06](uxr-a06-stock-adjustment.md), and [A07](uxr-a07-stock-transfer.md); server sale, cash, receipt, debt, and expense facts in [A08](uxr-a08-cash-sessions.md), [A10](uxr-a10-checkout-print.md), [A13](uxr-a13-goods-receipt-history.md), [A15](uxr-a15-payables-payment.md), [A16](uxr-a16-expense-create.md), and [A17](uxr-a17-expense-void.md) | Never replace server-confirmed totals, balances, statuses, stock, change, variance, debt, or eligibility with browser calculations. |
| Exact quantity, UOM, and location meaning | Whole/fractional policy and separate STORE/WAREHOUSE facts in [A04](uxr-a04-items.md), [A05](uxr-a05-stock-movements.md), [A06](uxr-a06-stock-adjustment.md), [A07](uxr-a07-stock-transfer.md), [A09](uxr-a09-cashier-cart.md), and [A14](uxr-a14-goods-receipt-create.md) | Preserve decimal precision, base UOM, and explicit location; never merge location stock into an authoritative client total. |
| Safe transaction staging | Frozen confirmation/pending and server-confirmed results in [A06](uxr-a06-stock-adjustment.md), [A10](uxr-a10-checkout-print.md), [A14](uxr-a14-goods-receipt-create.md), [A15](uxr-a15-payables-payment.md), [A16](uxr-a16-expense-create.md), and [A17](uxr-a17-expense-void.md) | Keep the last reversible boundary, duplicate guards, retained input on safe rejection, and explicit pending state. |
| Durable recovery is already strong in most critical mutations | Checkout, receipt creation, supplier payment, expense creation, and expense reversal retain transaction identity and fail closed in [A10](uxr-a10-checkout-print.md), [A14](uxr-a14-goods-receipt-create.md), [A15](uxr-a15-payables-payment.md), [A16](uxr-a16-expense-create.md), and [A17](uxr-a17-expense-void.md) | Treat transfer as the exception to fix, not a reason to simplify recovery elsewhere. |
| Non-destructive lifecycle and history | Category and supplier deactivation preserve referenced history in [A03](uxr-a03-item-categories.md) and [A12](uxr-a12-suppliers.md); reversal retains original and correction in [A17](uxr-a17-expense-void.md) | Use deactivate/reversal language and keep original records inspectable. Correct the contradictory item-delete wording from `ITEM-06`. |
| Useful responsive patterns already exist | Narrow card/stack treatments avoid page overflow in [A03](uxr-a03-item-categories.md), [A08](uxr-a08-cash-sessions.md), [A09](uxr-a09-cashier-cart.md), [A12](uxr-a12-suppliers.md), and [A16](uxr-a16-expense-create.md) | Reuse the approved grouped-row and labelled-stack direction selectively; do not remove domain facts to make a layout fit. |
| Status meaning usually does not rely on color alone | Text status, alerts, confirmation, and audit facts recur across the cashier, stock, receipt, payment, and expense reports | Preserve explicit labels, icons/text where useful, live announcements, and visible focus in both light and future dark appearance. |

## 4. Repeated evidence-backed problems

### 4.1 P0 — transaction outcome and recovery

| Pattern | Evidence | Required boundary |
| --- | --- | --- |
| Stock-transfer ambiguous recovery was memory-only | `TRANSFER-01` in [A07](uxr-a07-stock-transfer.md) originally showed that navigation/reload could lose the request key while the editable form could generate another request. The 2026-09-26 follow-up persists the account-bound exact request/key before posting and reconciles by same-key POST replay. | Resolved. Preserve locked uncertain state, cross-account quarantine, storage-before-send, exact replay, and response validation in UXR-D07. |
| A real transport defect was found and resolved through live audit | `PAYMENT-01` in [A15](uxr-a15-payables-payment.md) found that slash-containing receipt codes could not traverse the former path-variable route. The query-parameter correction was verified with partial QRIS and full bank-transfer payments. | Retain a regression case for exact generated references. This is resolved evidence, not an open P0. |

### 4.2 P1 — responsive information access

**Repeated evidence.** Page-level horizontal panning hides operational facts or row actions in
`ITEM-03`, `MOVEMENT-01`, `ADJUST-01`, `SALES-01`, `SUPPLIER-01`, `RECEIPT-01`, and `PAYMENT-02`
across [A04](uxr-a04-items.md), [A05](uxr-a05-stock-movements.md),
[A06](uxr-a06-stock-adjustment.md), [A11](uxr-a11-sales.md),
[A12](uxr-a12-suppliers.md), [A13](uxr-a13-goods-receipt-history.md), and
[A15](uxr-a15-payables-payment.md). The breakpoint itself is part of the problem at 768 px in
`MOVEMENT-01` and `SUPPLIER-01`.

Related vertical-cost evidence appears in cashier nested scrolling (`CART-03`) and tall repeated
receipt-line cards (`RECEIPT-CREATE-02`) in [A09](uxr-a09-cashier-cart.md) and
[A14](uxr-a14-goods-receipt-create.md).

**Synthesis inference.** Apply the approved UXR-D04 baseline—group semantic fields, keep backend facts
labelled, use compact accessible row actions, and transform rows into labelled narrow stacks—but let
each domain choose its own grouping and density. Avoid a one-size-fits-all table component.

### 4.3 P1 — shell state and keyboard cost

**Repeated evidence.** The shell can preserve stale breadcrumbs after cashier, dashboard, or session
transitions (`NAV-02`, `DASHBOARD-01`, `REVERSAL-03`), and expense pages expose inconsistent or empty
breadcrumb treatment (`EXPENSE-04`). The long navigation can hide critical destinations at short
heights (`NAV-01`). Fifteen shell controls precede the first page action with no skip route on
dashboard, goods receipts, and expenses (`DASHBOARD-02`, `RECEIPT-03`, `EXPENSE-01`). Sources:
[A01](uxr-a01-auth-navigation.md), [A02](uxr-a02-dashboard.md),
[A13](uxr-a13-goods-receipt-history.md), [A16](uxr-a16-expense-create.md), and
[A17](uxr-a17-expense-void.md).

**Synthesis inference.** UXR-D01 should define route-derived breadcrumbs, an independently scrollable
navigation region with pinned critical actions, and a visible-on-focus skip-to-content target. This
is a bounded shell behavior correction, not a router or global-shell rewrite.

### 4.4 P1 — focus and result recovery

**Repeated evidence.** Equivalent failures and completions send focus to different places or leave
the relevant result offscreen: item validation/success (`ITEM-01`), missing adjustment rejection
feedback (`ADJUST-03`), checkout rejection (`CHECKOUT-02`), and reversal dialog entry/cancel
(`REVERSAL-01`). Lower-severity variants occur in category maintenance (`CAT-01`), movement filter
reset (`MOVEMENT-05`), post-session cashier entry (`CART-04`), and post-login orientation
(`AUTH-01`). Sources: [A01](uxr-a01-auth-navigation.md), [A03](uxr-a03-item-categories.md),
[A04](uxr-a04-items.md), [A05](uxr-a05-stock-movements.md),
[A06](uxr-a06-stock-adjustment.md), [A09](uxr-a09-cashier-cart.md),
[A10](uxr-a10-checkout-print.md), and [A17](uxr-a17-expense-void.md).

**Synthesis inference.** Domain designs should share an interaction contract: validation focuses the
first actionable invalid field; a server rejection focuses its specific alert or corrective control;
success focuses the result/page heading; dialog cancel restores the trigger or a documented safe
fallback; and controls that disappear after activation move focus to the updated landmark.

### 4.5 P1 — Indonesian input and exact-value presentation

**Repeated evidence.** Cash entry switches from US-style input to Indonesian read-only currency
(`CASH-01`); native date/time controls expose US notation or English browser validation in sales and
receipt workflows (`SALES-02`, `RECEIPT-05`, `RECEIPT-CREATE-03`); exact stored item prices are rounded
on read-only surfaces (`ITEM-05`). Sources: [A04](uxr-a04-items.md),
[A08](uxr-a08-cash-sessions.md), [A11](uxr-a11-sales.md),
[A13](uxr-a13-goods-receipt-history.md), and [A14](uxr-a14-goods-receipt-create.md).

**Synthesis inference.** Establish a documented Indonesian editing/display convention per data type,
while preserving the backend's decimal precision and calendar/time semantics. Do not solve browser
locale mismatches by silently changing values or client-authoring totals.

### 4.6 P1 — discovery and scale

**Repeated evidence.** Stock adjustment and transfer use unsearchable all-item selects
(`ADJUST-02`, `TRANSFER-04`), with transfer also depending on one `size: 2000` request. Sources:
[A06](uxr-a06-stock-adjustment.md) and [A07](uxr-a07-stock-transfer.md).

**Synthesis inference.** Reuse a searchable item-identity treatment that shows name, SKU, category,
UOM, and relevant location availability without claiming that availability is final. A safe scalable
implementation may require backend-supported query semantics; the design must not invent them.

### 4.7 P1 — task hierarchy and semantic hierarchy

**Repeated evidence.** Receipt detail places the supplier-payment mutation before received lines
(`RECEIPT-02`, `PAYMENT-03`), making an audit task pass through a different workflow. Receipt,
payment, sale, and receipt-create results also expose weak heading structure (`RECEIPT-04`,
`PAYMENT-04`, `SALES-03`, `RECEIPT-CREATE-05`). Sources: [A11](uxr-a11-sales.md),
[A13](uxr-a13-goods-receipt-history.md), [A14](uxr-a14-goods-receipt-create.md), and
[A15](uxr-a15-payables-payment.md).

**Synthesis inference.** Put record identity, status, and received/sold line evidence before optional
mutation controls. Use one page heading and a logical section outline. Payment can remain on the same
route, but its entry point should not dominate receipt inspection.

### 4.8 P1/P2 — cross-domain traceability and feedback freshness

**Repeated evidence.** Movement references are not links to existing source details (`MOVEMENT-03`),
and successful transfers cannot be reopened despite backend list/detail reads (`TRANSFER-03`). Print
success does not distinguish the latest attempt in checkout or sales (`CHECKOUT-03`, `SALES-04`).
Cashier notices and reversal refresh warnings can outlive the action they describe (`CART-01`,
`REVERSAL-02`). Sources: [A05](uxr-a05-stock-movements.md),
[A07](uxr-a07-stock-transfer.md), [A09](uxr-a09-cashier-cart.md),
[A10](uxr-a10-checkout-print.md), [A11](uxr-a11-sales.md), and
[A17](uxr-a17-expense-void.md).

**Synthesis inference.** Make existing record references operable where a completed destination
already exists, and scope notices to the current action/result. Do not create routes or imply printer
job evidence that the backend does not provide.

### 4.9 P2 — copy and metadata consistency

Repeated P2 evidence includes raw enums (`MOVEMENT-06`, `ADJUST-06`), mixed or internal-facing copy
(`AUTH-02`, `NAV-03`, `DASHBOARD-04`, `RECEIPT-06`, `PAYMENT-05`), ambiguous null provenance
(`CAT-02`), repeated or unlabeled metadata (`RECEIPT-CREATE-04`, `EXPENSE-02`), and inaccessible or
non-specific icon/action names (`ITEM-04`, `ADJUST-08`). These issues should be corrected inside the
relevant domain design after P0/P1 behavior is preserved; they do not justify a separate rewrite.

## 5. Journey handoffs

| Handoff | Evidence | UX requirement |
| --- | --- | --- |
| Login or global navigation → destination | `AUTH-01`, `NAV-01`, `NAV-02`, `DASHBOARD-01`, `EXPENSE-04`, `REVERSAL-03` | Announce and focus the destination, derive location state from the active route, and keep critical navigation reachable. |
| Cash session → cashier | `CASH-02`, `CART-04` in [A08](uxr-a08-cash-sessions.md) and [A09](uxr-a09-cashier-cart.md) | After opening/closing, expose the next valid action and move focus to it without hiding the confirmed session result. |
| Item discovery → stock mutation | `ADJUST-02`, `TRANSFER-02`, `TRANSFER-04` | Preserve complete item identity through selection and confirmation; keep stock advisory rather than authoritative. |
| Mutation → confirmed result → later audit | `TRANSFER-01`, `TRANSFER-03`, `ADJUST-04`, and the stronger retained-result patterns in A14–A17 | Retain/reopen the server-confirmed record and its exact recovery identity; newest or just-created work must be findable. |
| Ledger → source transaction | `MOVEMENT-02`, `MOVEMENT-03` | Keep source type visible at every width and link recognized existing destinations. |
| Cart → checkout → sale → print | `CHECKOUT-01` through `CHECKOUT-03`, `SALES-04` | Preserve sale-first/print-second meaning, add an authoritative amount-due path if the backend provides one, and distinguish the current print attempt without claiming unsupported printer state. |
| Receipt → lines → payment → refreshed balance | `RECEIPT-02`, `PAYMENT-03`, plus the successful A15 live payment evidence | Let read/audit come before mutation, then retain the confirmed payment result and refresh only backend-owned balances/status. |
| Dashboard → operational drill-down → return | `DASHBOARD-01`, `DASHBOARD-02` | Keep drill-down destinations useful and return with correct breadcrumb/focus context. |

## 6. Priority disposition

### P0

1. **Resolved and regression-protected:** `TRANSFER-01`. Keep tab-persisted, account-bound exact
   request/key recovery and same-key POST replay coverage.
2. **Resolved and regression-protected:** `PAYMENT-01`. Keep exact slash-containing receipt-reference
   transport coverage; no further UX design decision is required for the defect itself.

### P1 program priorities

1. Shell state, navigation reachability, and skip-to-content.
2. Narrow-desktop list/detail reflow without page-level horizontal panning.
3. Predictable focus and result/rejection recovery.
4. Transaction confirmation completeness and authoritative amount presentation.
5. Indonesian date/time/money entry aligned with exact read-only values.
6. Searchable, scalable item discovery for stock mutations.
7. Record-first receipt/payment hierarchy and correct semantic headings.
8. Cross-domain record traceability and scoped current-action feedback.

This ordering is a **synthesis inference** based on breadth, task frequency, safety, and dependency;
it does not replace the priority assigned in any source report.

### P2 program priorities

Address P2 items within the domain that already owns the surrounding P0/P1 work: localized enum and
empty-state copy, metadata fallbacks, action naming, date consistency, density, latest-attempt
feedback, and visual hierarchy. Do not create a standalone polish migration.

## 7. Owner and product decisions still needed

| Decision | Why it is needed | Evidence / boundary |
| --- | --- | --- |
| Authoritative checkout amount-due preview | CASH and especially exact QRIS entry lack a server-owned pre-submit amount due. | `CHECKOUT-01` in [A10](uxr-a10-checkout-print.md). Decide whether the backend will expose a non-posting authoritative preview or whether Release 1 accepts the documented limitation. |
| Dashboard seven-day chart gate | The accepted chart has no current authoritative aggregate. | [UXR-D02 direction](../design/uxr-d02-dashboard-direction.md) and [A02](uxr-a02-dashboard.md). Approve a backend read model or explicitly remove the chart; never aggregate paged sales in the browser. |
| Store-device evidence | Scanner readiness, suffix/timing behavior, actual viewport, and display scaling remain unverified on the store laptop. | `CART-02` in [A09](uxr-a09-cashier-cart.md), FE-19, and UX-roadmap remaining inputs. |
| Appearance preference behavior | Light default is the approved candidate, but system/manual selection and persistence are not settled. | [UXR-D00 decision](../design/visual-direction-decision.md) and UXR-D16. Do not assume a backend preference field. |
| Latest print-attempt acknowledgement | The UI can retain a prior success without proving that the latest reprint was acknowledged. | `CHECKOUT-03` and `SALES-04`. Decide whether transient attempt-local feedback is sufficient or authoritative job evidence is required. |

The grouped-row/narrow-stack list direction, Operational Blue palette, MUI reuse, older-user sizing,
and light-default candidate are already owner-approved in UXR-D00, UXR-D03, and UXR-D04. They should
not be reopened as unanswered decisions unless later domain evidence shows a concrete exception.

## 8. Recommended Figma domain order

The ordering below is a **synthesis recommendation**, not an approval state change.

| Order | Design work | Reason and gate |
| --- | --- | --- |
| 1 | UXR-D01 authentication and navigation | Shell state, navigation reachability, breadcrumb, and keyboard bypass affect nearly every later frame. Use the already approved D00 shell traits. |
| 2 | UXR-D08 → UXR-D09 → UXR-D10 → UXR-D11 cash-session/cashier/checkout/sales cluster | Highest-frequency operational journey. Preserve session gating, persistent cart/transaction context, sale-first printing, and durable recovery. UXR-D10 remains gated by the amount-preview decision for that specific improvement. |
| 3 | UXR-D05 → UXR-D06 → UXR-D07 inventory-operation cluster | Reuse approved D04 item identity/list treatment, then resolve ledger traceability, searchable selection, confirmation, and result presentation while preserving the now-implemented transfer recovery. |
| 4 | UXR-D12 → UXR-D13 → UXR-D14 supplier/receipt/payment cluster | Establish supplier identity, then record-first receipt hierarchy and one-receipt payment. Reuse one receipt/detail composition across read and payment states without mixing their priority. |
| 5 | UXR-D15 expense history/create/reversal | Current transaction semantics are strong; focus, hierarchy, feedback freshness, and shell consistency are the main design work. |
| 6 | UXR-D02 dashboard | Reconcile A02 shell/density/copy evidence after destination patterns are settled. The seven-day chart still needs its backend gate or removal decision. |
| 7 | UXR-D16 light/dark appearance | Apply semantic parity only after representative approved cashier and back-office frames exist; keep light as the default candidate for older users. |

UXR-D03 and UXR-D04 are already `APPROVED`; they should move to separate domain implementation
re-baseline tasks rather than re-entering the design queue. The ordering does not authorize combining
domains into one implementation PR.

## 9. Evidence index and finding inventory

| Audit | Domain | P0 / resolved P0 | P1 | P2 |
| --- | --- | --- | --- | --- |
| [UXR-A01](uxr-a01-auth-navigation.md) | Authentication/navigation | — | `NAV-01`, `NAV-02` | `AUTH-01`, `AUTH-02`, `NAV-03` |
| [UXR-A02](uxr-a02-dashboard.md) | Dashboard | — | `DASHBOARD-01`, `DASHBOARD-02` | `DASHBOARD-03`, `DASHBOARD-04` |
| [UXR-A03](uxr-a03-item-categories.md) | Categories | — | — | `CAT-01`, `CAT-02` |
| [UXR-A04](uxr-a04-items.md) | Items | — | `ITEM-01`, `ITEM-03`, `ITEM-05`, `ITEM-06` | `ITEM-02`, `ITEM-04` |
| [UXR-A05](uxr-a05-stock-movements.md) | Stock movements | — | `MOVEMENT-01`, `MOVEMENT-02`, `MOVEMENT-03` | `MOVEMENT-04`, `MOVEMENT-05`, `MOVEMENT-06` |
| [UXR-A06](uxr-a06-stock-adjustment.md) | Stock adjustment | — | `ADJUST-01`, `ADJUST-02`, `ADJUST-03` | `ADJUST-04` through `ADJUST-08` |
| [UXR-A07](uxr-a07-stock-transfer.md) | Stock transfer | `TRANSFER-01` resolved | `TRANSFER-02`, `TRANSFER-03`, `TRANSFER-04` | `TRANSFER-05` |
| [UXR-A08](uxr-a08-cash-sessions.md) | Cash sessions | — | `CASH-01`, `CASH-02` | `CASH-03`, `CASH-04` |
| [UXR-A09](uxr-a09-cashier-cart.md) | Cashier/cart | — | `CART-01`, `CART-02`, `CART-03` | `CART-04` |
| [UXR-A10](uxr-a10-checkout-print.md) | Checkout/printing | — | `CHECKOUT-01`, `CHECKOUT-02` | `CHECKOUT-03` |
| [UXR-A11](uxr-a11-sales.md) | Sales | — | `SALES-01`, `SALES-02` | `SALES-03`, `SALES-04` |
| [UXR-A12](uxr-a12-suppliers.md) | Suppliers | — | `SUPPLIER-01` | `SUPPLIER-02` |
| [UXR-A13](uxr-a13-goods-receipt-history.md) | Receipt history/detail | — | `RECEIPT-01` through `RECEIPT-04` | `RECEIPT-05`, `RECEIPT-06` |
| [UXR-A14](uxr-a14-goods-receipt-create.md) | Receipt creation | — | `RECEIPT-CREATE-01`, `RECEIPT-CREATE-02`, `RECEIPT-CREATE-03`, `RECEIPT-CREATE-05` | `RECEIPT-CREATE-04` |
| [UXR-A15](uxr-a15-payables-payment.md) | Payables/payment | `PAYMENT-01` resolved | `PAYMENT-02`, `PAYMENT-03`, `PAYMENT-04` | `PAYMENT-05` |
| [UXR-A16](uxr-a16-expense-create.md) | Expense history/create | — | `EXPENSE-01` | `EXPENSE-02`, `EXPENSE-03`, `EXPENSE-04` |
| [UXR-A17](uxr-a17-expense-void.md) | Expense reversal | — | `REVERSAL-01`, `REVERSAL-02`, `REVERSAL-03` | `REVERSAL-04` |

## 10. Limitations and non-decisions

- This report does not choose or approve any pending domain design.
- It does not change backend contracts, business rules, routes, or implementation scope.
- It does not claim physical E81W scanner verification or the actual store display dimensions.
- It does not convert source/test evidence into live evidence.
- It does not authorize a global design system, MUI replacement, cross-domain implementation PR, or
  frontend aggregation.
- Evidence screenshots remain governed by each source report and the UX roadmap's working-artifact
  policy.
