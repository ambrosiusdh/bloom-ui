# UXR-D11 — Sales history design decision

Status: `APPROVED`  
Decision date: 2026-09-28  
Owner decision: approve the refined sales-history list, detail, print, recovery, and responsive
direction.

## Approved direction

- Use the shared back-office shell with an always-visible filter area and a labelled wide list. Keep
  only backend-supported code, creator, start-date, and end-date filters, plus server paging sizes 5,
  10, 25, and 50.
- Use explicit `DD-MM-YYYY` guidance and application-owned Indonesian validation for an inverted date
  range before sending the backend request.
- Keep sale reference/session, sale and payment status, correction status, payment method, server
  total, creator, timestamp, and a discoverable detail action in each list record. At 760 pixels,
  transform the table into grouped labelled records without whole-page horizontal panning.
- Give detail one semantic page heading, then separate transaction/status, server-value,
  persisted-line, and reprint sections. Render all status and monetary values directly from the
  backend; do not infer paid/correction state or recalculate totals, tender, or change.
- Preserve each persisted line's item name/SKU, UOM-aware quantity, stock location, unit price, and
  line subtotal. Keep CASH and QRIS labels and tender meaning distinct.
- Keep reprint separate from sale creation. Pending blocks duplicate same-reference requests; failure
  leaves the sale visibly recorded and retries only printing; success describes the latest
  print-service acknowledgement and asks the operator to check the printer rather than claiming
  verified physical paper output.
- Preserve filters across list error/retry, provide clear empty recovery, and keep the detail/reprint
  actions visible and keyboard reachable in wide and narrow layouts.

## Scope boundary

This approval authorizes the design direction only. It does not authorize application implementation,
sale creation/correction/return, reporting or export UI, physical-printer verification rules, new
backend fields/endpoints, or frontend-authoritative financial calculations.
