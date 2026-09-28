# Bloom Release 1 — Design review register

Last updated: 2026-09-28  
Scope: UXR-D00 through UXR-D16  

All UXR-D00 through UXR-D16 design directions are owner-approved as of 2026-09-28. The design-review
queue is complete; implementation remains separately gated by the roadmap's one-domain rebaseline
process.

This register distinguishes an owner-approved design direction from a design that is complete enough
for owner review. `DESIGN_REVIEW` does not authorize frontend implementation. Application work may
begin only after the owner approves the relevant domain and the roadmap is rebaselined for that
domain.

| Item | Domain | Status | Review record or visual |
| --- | --- | --- | --- |
| UXR-D00 | Visual direction | `APPROVED` | `visual-direction-decision.md` |
| UXR-D01 | Authentication and navigation | `APPROVED` | Owner-approved 2026-09-28; `uxr-d01-auth-navigation-decision.md` |
| UXR-D02 | Dashboard | `APPROVED` | Owner-approved 2026-09-27; `uxr-d02-dashboard-decision.md`; backend read-model gates remain |
| UXR-D03 | Item categories | `APPROVED` | `uxr-d03-item-categories-decision.md` |
| UXR-D04 | Item master and inventory location | `APPROVED` | `uxr-d04-item-master-decision.md` |
| UXR-D05 | Stock movements | `APPROVED` | Owner-approved 2026-09-27; `uxr-d05-stock-movements-decision.md` |
| UXR-D06 | Stock adjustment | `APPROVED` | `uxr-d06-stock-adjustment-decision.md` |
| UXR-D07 | Stock transfer | `APPROVED` | Owner-approved 2026-09-27; `uxr-d07-stock-transfer-decision.md` |
| UXR-D08 | Cash sessions | `APPROVED` | Owner-approved 2026-09-27; `uxr-d08-cash-sessions-decision.md` |
| UXR-D09 | Cashier cart | `APPROVED` | Owner-approved 2026-09-27 as one whole-cashier workspace; `uxr-d09-d10-cashier-decision.md` |
| UXR-D10 | Checkout and printing | `APPROVED` | Owner-approved 2026-09-27; compact confirmation remains an in-place transaction-panel state |
| UXR-D11 | Sales history | `APPROVED` | Owner-approved 2026-09-28; `uxr-d11-sales-history-decision.md` |
| UXR-D12 | Suppliers | `APPROVED` | Owner-approved 2026-09-28; `uxr-d12-suppliers-decision.md` |
| UXR-D13 | Goods receipts | `APPROVED` | Owner-approved 2026-09-28; `uxr-d13-goods-receipts-decision.md` |
| UXR-D14 | Payables and supplier payments | `APPROVED` | Owner-approved 2026-09-28; `uxr-d14-payables-payment-decision.md` |
| UXR-D15 | Expenses and voids | `APPROVED` | Owner-approved 2026-09-28; `uxr-d15-expenses-voids-decision.md` |
| UXR-D16 | Appearance modes | `APPROVED` | Owner-approved 2026-09-28; `uxr-d16-appearance-modes-decision.md` |

## Review artifact location

`bloom-design-review-suite.html` is the authoritative local review artifact for the waiting
back-office and shell items. UXR-D09 and UXR-D10 intentionally use
`bloom-cashier-workspace-rework.html` together because the owner selected the previously reviewed
focused cashier flow over separate cart and checkout pages. Both artifacts apply Operational Blue,
the approved appearance treatment, readable type, focus treatment, and narrow-desktop behavior. They
are design references, not application code or implementation assets. Each domain remains bound to
its completed audit report and the backend Release 1 contract.

For review in an ordinary browser or upload to another reviewer, use
`bloom-design-review-suite-standalone.html`. The standalone export includes the icon runtime; opening
the source fragment directly with a `file://` URL does not.

For the combined D09/D10 cashier review in an ordinary browser, use
`bloom-cashier-ux-review.html`.

## Owner review rule

For every `DESIGN_REVIEW` row, the owner may approve the presented direction, request changes, or
approve explicitly named traits from it. Only then should the status become `APPROVED` and a domain
decision record replace or extend the review record.

## Review progress

- **UXR-D01 authentication and navigation — owner-approved 2026-09-28.** The owner accepted the
  shared sidebar and header direction: grouped icon-and-label
  navigation, Operational Blue treatment, no redundant “Back office” label, fixed lower-left
  current-user area, explicit appearance action, wide-screen collapse/expand, and a narrow-screen
  overlay drawer. The approved authentication direction covers Indonesian normal, validation,
  rejected, pending, session-checking, session-expiry, protected-return, and authenticated not-found
  states. It preserves the safe destination and moves focus to the destination page heading after
  login; headless interaction and 760-pixel no-overflow QA passed. The binding direction is recorded
  in `uxr-d01-auth-navigation-decision.md`; implementation remains separately gated.
- **UXR-D02 Dashboard — owner-approved 2026-09-27.** The owner accepted the refined four-summary
  operational hierarchy, action-oriented attention panel, and seven-day sales-chart placement.
  Implementation remains gated on the requested backend daily-sales and STORE-stock read models;
  approval does not authorize frontend aggregation or inferred stock rules.
- **UXR-D05 Stock movements — owner-approved 2026-09-27.** The owner accepted the restored direction
  and location filters, reset behavior, simplified scan-level ledger, exact balance meaning, and
  in-context detail modal. The reference and complete audit facts remain available without inventing
  a movement-detail endpoint.
- **UXR-D07 Stock transfer — owner-approved 2026-09-27.** The owner accepted the familiar transfer
  form order with searchable item selection, explicit source and destination, labelled swap action,
  numeric quantity with UOM, optional description, stock refresh, and a self-contained review dialog.
  `Riwayat stok` and `Transfer stok` are combined under the single `Pergerakan stok` navigation
  destination: history is the default view and `Buat transfer stok` opens the distinct transfer
  workflow without weakening its server-authoritative validation or exact-request recovery.
- **UXR-D08 Cash sessions — owner-approved 2026-09-27.** The owner accepted the combined current
  session and paged history view, Indonesian money entry, self-contained close confirmation,
  server-final reconciliation, verified post-close transition, detail hierarchy, and narrow stacked
  rows. Pagination must show page size, visible range, current page, and previous/next controls rather
  than only a passive count.
- **UXR-D09 and UXR-D10 — owner-approved 2026-09-27.** The separate cart and checkout page
  candidates are superseded by one focused cashier workspace. Discovery stays on the left, while
  cart, estimate, discount, CASH/QRIS, tender, compact confirmation, recovery, backend-confirmed sale
  result, and separate print state occupy the right transaction panel. The confirmation remains a
  final in-place safety step rather than route navigation. The binding direction is recorded in
  `uxr-d09-d10-cashier-decision.md`; implementation remains separately gated.
- **UXR-D12 Suppliers — owner-approved 2026-09-28.** The accepted direction covers labelled list
  columns and pagination, server-owned balance, full detail/audit facts, create normalization copy,
  immutable-code edit, retained duplicate conflict, history-preserving deactivation with cancel-first
  focus and Escape restoration, inactive detail, and the no-overflow narrow grouped-row treatment.
  The binding direction is recorded in `uxr-d12-suppliers-decision.md`; implementation remains
  separately gated.
- **UXR-D13 Goods receipts — owner-approved 2026-09-28.** The accepted direction covers the three
  payment states in history, URL-backed filters and paging, receipt-first detail with item lines before
  the secondary payment action, compact per-location creation lines including repeated SKUs,
  Indonesian received date/time guidance, advisory input estimate, localized confirmation, pending
  lock, exact-request recovery, backend-confirmed result, and no-overflow narrow layouts. The binding
  direction is recorded in `uxr-d13-goods-receipts-decision.md`; implementation remains separately
  gated.
- **UXR-D14 Payables and supplier payments — owner-approved 2026-09-28.** The accepted direction
  now covers the supported URL-backed list search and paging, receipt-first detail with received lines
  and payment history before mutation, one-receipt amount/method/reference/note entry,
  CASH-versus-non-cash session meaning, cancel-first confirmation, pending lock, exact account-bound
  recovery, definitive rejection, backend-refreshed success, corrected query-parameter transport,
  and no-overflow narrow layouts. Existing receipt detail, payment history, payment mutation, and
  outstanding-balance APIs are sufficient for this flow. Optional stable `supplierCode` filtering is
  recorded as backend work in progress and does not block receipt-level implementation. The binding
  direction is recorded in `uxr-d14-payables-payment-decision.md`; implementation remains separately
  gated.
- **UXR-D15 Expenses and voids — owner-approved 2026-09-28.** The accepted direction covers a
  paging-only labelled history, active and closed-session eligibility, open-session-bound creation,
  exact decimal/category/note validation, cancel-first confirmation, pending lock, exact
  account-bound recovery, definitive rejection, backend-confirmed creation, audit-rich detail,
  reasoned void confirmation, void pending/recovery/result, retained original and reversal facts,
  explicit session impact, and no-overflow narrow layouts. The binding direction is recorded in
  `uxr-d15-expenses-voids-decision.md`; implementation remains separately gated.
- **UXR-D11 Sales history — owner-approved 2026-09-28.** The accepted direction uses the approved
  shell with the exact four backend filters, Indonesian date guidance and validation, stable server
  paging, a labelled wide list, grouped no-overflow narrow records, semantic detail hierarchy,
  backend-rendered lifecycle/payment/correction and monetary facts, persisted line UOM/location,
  and sale-safe reprint pending/success/failure states. Success describes the latest print-service
  acknowledgement without asserting physical paper output. The binding direction is recorded in
  `uxr-d11-sales-history-decision.md`; implementation remains separately gated.
- **UXR-D16 Appearance modes — owner-approved 2026-09-28.** The dedicated comparison
  uses the owner-approved shell and Operational Blue tokens for identical cashier and back-office
  content in light and dark modes. It exposes `Terang`, `Gelap`, and `Ikuti sistem`; local-device
  persistence; system-light/system-dark resolution; selected, focus, success, warning, error,
  server-rejected, pending, and disabled states; and wide/narrow previews. The binding direction is
  recorded in `uxr-d16-appearance-modes-decision.md`; implementation remains separately gated.
