# UXR-D09 and UXR-D10 — Cashier workspace decision

Status: `APPROVED`  
Decision date: 2026-09-27  
Owner decision: approve the previously reviewed whole-cashier workspace and retire the separate
cart and checkout page candidates.

## Approved direction

- UXR-D09 and UXR-D10 remain separate evidence and implementation boundaries, but share one visual
  workspace and one continuous cashier flow.
- Item discovery remains on the left at wide desktop. The current transaction remains on the right
  with compact cart rows, quantity editing, the customer-facing estimate, discount and explanation,
  CASH/QRIS selection, and tender entry.
- `Tinjau pembayaran` changes only the right transaction panel. It is a compact final safety step,
  not a new route or a repeated full checkout screen.
- Known stock, payment, or session rejection preserves the cart in the same workspace. An ambiguous
  result uses the exact saved request and idempotency key; it never proposes a replacement sale.
- Official totals, payment validation, cash change, sale creation, stock effects, and the persisted
  result remain backend-authoritative. The pre-checkout figure remains labelled `Perkiraan bayar`.
- Printing starts only after server-confirmed sale success. Print acknowledgement does not claim
  that paper physically left the printer.
- Narrow desktop stacks discovery and transaction into one document flow without a nested cart
  scroll. Keyboard order, focus restoration, session gating, fractional UOM behavior, and
  scanner-capability wording remain required.

## Superseded directions

- A standalone D09 cart page.
- A separate D10 checkout route or full-screen confirmation page.
- A client-authoritative sale total or locally calculated official change.

## Scope boundary

This approval authorizes the design direction only. It does not authorize frontend implementation,
change backend contracts, add a preview endpoint, or clear the outstanding physical-scanner gate.
