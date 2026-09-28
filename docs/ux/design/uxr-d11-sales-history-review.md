# UXR-D11 — Sales history design review

Status: `APPROVED`  
Evidence: `docs/ux/audits/uxr-a11-sales.md`  
Interactive review: `bloom-design-review-suite.html`, design item **D11 Riwayat penjualan**

## Proposed direction

- Preserve URL-backed code, creator, date, page, and page-size filters.
- Use explicit Indonesian date guidance and application-owned inverted-range validation.
- Keep a semantic page heading on both list and detail pages, with detail sections underneath it.
- Replace the narrow overflowing table with grouped transaction rows that keep the amount and detail
  action visible without horizontal page scroll.
- Display the backend-returned sale status, payment status, method, totals, tender, change, session,
  actor, timestamps, lines, UOMs, and locations without recalculation.
- Keep reprint separate from sale creation and identify feedback as the latest print-service attempt.

## State coverage

The review includes list, filters, invalid date range, empty/recovery direction, detail hierarchy,
print pending/success/failure direction, and wide/narrow behavior. It does not add sale mutation or
receipt-printer verification rules.

## Focused review refinement — 2026-09-28

- The list now uses the approved back-office shell and a labelled table on wide screens, then changes
  to grouped labelled records at 760 pixels. Sale reference/session, lifecycle and correction status,
  payment method/status, server total, actor/time, and the detail action remain visible without
  whole-page horizontal panning.
- The only filter inputs remain backend-supported `code`, `createdBy`, `startDate`, and `endDate`,
  together with server paging sizes 5, 10, 25, and 50. Date fields show `DD-MM-YYYY` guidance and the
  application-owned Indonesian inverted-range error before a request is sent.
- Detail has one semantic page heading, then separate transaction/status, server-value, persisted-line,
  and reprint sections. QRIS uses `Nominal QRIS`; CASH retains `Uang diterima`. Statuses, totals,
  tender/change, session, actor/time, item/SKU, UOM, location, unit price, and line subtotal are
  displayed as backend-returned facts.
- Reprint pending locks duplicate submission for the same reference. Success says the print service
  accepted the latest request and asks the user to check the printer, rather than claiming physical
  paper output. Failure leaves the sale visibly recorded and retries only printing.
- The representative record is audited sale `SALE/IX-2026/0003`; the list also retains the audited
  CASH, QRIS, PIECE, KILOGRAM, METER, and decimal-money fixtures from UXR-A11. No sale, correction,
  export/report action, or new backend contract is introduced.
- Headless visual QA passed for the wide list/detail, invalid range, empty, list-error recovery,
  reprint pending/success/failure, and 760-pixel list/detail states. The narrow product window measured
  760 pixels with 758-pixel content scroll width, and the row/detail actions remained visible.

## Owner decision — 2026-09-28

The owner approved the labelled list and grouped narrow-row layout, Indonesian date recovery, detail
hierarchy, and latest print-service acknowledgement language. The binding direction is recorded in
`uxr-d11-sales-history-decision.md`. Application implementation has not begun.
