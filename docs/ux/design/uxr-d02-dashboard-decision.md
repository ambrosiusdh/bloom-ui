# UXR-D02 — Dashboard design decision

Status: `APPROVED`  
Owner approval recorded: 2026-09-27  
Evidence: `docs/ux/audits/uxr-a02-dashboard.md`  
Review source: `uxr-d02-dashboard-review.md`

## Approved direction

The owner approved the refined Operational Blue dashboard direction shown in the design-review
suite. The approved composition:

- opens with the plain-language heading “Ringkasan toko hari ini” and an explicit last-updated time;
- uses four compact, backend-owned summaries for sales today, the current cash session,
  active-session expenses, and supplier payables;
- keeps the cash-session opening time and actor visible and distinguishes no open session from a
  zero monetary value;
- preserves exact scale-four monetary values returned by the backend;
- uses one action-oriented “Perlu perhatian” panel for supplier debt and STORE-specific stock
  attention; and
- includes one secondary seven-day sales bar chart with keyboard-reachable days, visible selected-day
  detail, and an equivalent narrow-desktop hierarchy.

Loading, zero, no-session, stale, retained-data refresh failure, refresh success, keyboard bypass,
focus visibility, light/dark semantic parity, and all recognized drill-down states remain part of the
approved direction.

## Required backend gates

Design approval does not authorize the frontend to manufacture the missing read models. The
seven-day chart remains gated on an authoritative daily sales series, and the stock-attention row
remains gated on a STORE-specific stock-attention summary with server-defined states and thresholds.
The copy-ready request is recorded in `uxr-d02-dashboard-backend-request.md`.

Until those contracts are implemented and verified, the corresponding example values in the review
artifact are layout evidence only. The frontend must not aggregate paged sales, combine location
stock, calculate authoritative totals, or infer stock severity.

## Deliberately excluded

- recent cross-domain activity without an ordered audit-feed contract;
- supplier-payment due dates without a backend field or rule;
- inferred cash-session health beyond the contracted `OPEN` or `NONE` state;
- a permanent shortcut grid that duplicates the reviewed navigation shell; and
- extra profit, category, product, or inventory charts.

## Implementation status

Application implementation has not begun. UXR-D02 is approved for implementation planning, subject
to the two backend gates above and the normal one-domain-per-PR rule.
