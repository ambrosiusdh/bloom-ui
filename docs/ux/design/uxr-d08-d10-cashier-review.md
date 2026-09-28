# UXR-D08–D10 — Cash session, cashier, checkout, and printing design review

Status: `APPROVED` for UXR-D08, UXR-D09, and UXR-D10  
Evidence: UXR-A08, UXR-A09, and UXR-A10 audit reports  
Interactive review: `bloom-design-review-suite.html`, design items **D08**, **D09**, and **D10**

## Shared workspace direction

- Keep item discovery on the left and the current transaction on the right at wide widths; stack into
  one document flow on narrow desktop to avoid nested scrolling.
- Use one consistent Operational Blue action color and large, readable labels for older users.
- Show category names with item names and keep SKU only where it supports search or disambiguation.
- Keep cart rows compact: item name, unit price, small quantity control, line amount, and remove action.
- Preserve session gating, whole/fractional UOM behavior, active-item rules, advisory STORE stock, stale
  result protection, keyboard entry, and focus return after add/remove.

## UXR-D08 cash sessions

- Use Indonesian monetary entry and display formatting.
- Send only actual closing cash; expected cash and variance remain server-owned.
- After close, retain the reconciliation and provide a safe status check before offering a new session.
- Cover no-session, open, close review, pending, closed, already-closed conflict, history, and detail.

### Review refinement — 2026-09-27

The D08 review now presents one dedicated `Sesi kas` destination with the currently open session and
server history in the same operational view. This does not merge their API meanings: current-session
verification and paged history remain separate reads, and no client aggregation is introduced.

- The open-session summary shows only durable identity, opening cash, actor, and time. Expected cash
  is requested and shown only when the operator starts closing the session.
- The history table preserves status, opener/time, opening cash, server-final expected and actual
  cash, variance, pagination context, and a labelled detail action. Narrow desktop converts those
  columns into labelled stacked rows without losing financial facts.
- Closing uses Indonesian numeric entry, repeats the server preview, and never displays a locally
  predicted variance. The confirmation states that final expected cash and variance are determined
  by the server.
- The post-close result retains the final reconciliation, then requires an explicit current-status
  check before `Buka sesi kas` is offered. This resolves CASH-02 without hiding the prior result.
- Opening cash uses the same Indonesian editing convention as closing cash. Current, history, and
  detail use the same `d MMM yyyy, HH.mm WIB` reading pattern.
- Critical actions use short non-wrapping labels and remain comfortably operable at the audited
  narrow desktop width.

### Owner decision — 2026-09-27

The owner approved UXR-D08 after requesting explicit pagination controls. The binding direction is
recorded in `uxr-d08-cash-sessions-decision.md`. The history header must include a page-size control,
visible item range and total, current page, and labelled previous/next actions; a passive
`N items · N per page` label alone is not sufficient.

## UXR-D09 cashier cart

- Describe scanner-compatible input without claiming physical scanner connectivity.
- Move focus from successful session opening to the newly enabled search field.
- Scope success messages to the action that produced them so cart feedback does not linger through
  unrelated searches.
- Use a single page scroll on narrow desktop.

### Consolidated review direction — 2026-09-27

The owner rejected separate D09 and D10 page compositions in favor of the previously reviewed whole
cashier workspace. D09 remains a roadmap/evidence boundary, but it no longer owns an independent
visual page. Its item discovery, cart editing, keyboard behavior, advisory STORE stock, and session
gate are presented in the same cashier surface as payment and checkout.

At wide desktop, finding and selecting items stays on the left while `Transaksi saat ini` remains on
the right. The right panel keeps compact cart rows, quantity controls, the customer-facing numeric
estimate, CASH/QRIS controls, tender, discount, discount explanation, and the primary checkout action
together. At narrow desktop, these sections stack into one page flow without a nested cart scroll.
The scanner helper remains capability-qualified and does not claim physical hardware readiness.

## UXR-D10 checkout and printing

- Keep stock, prices, sale total, payment validation, change, sale creation, and recovery authoritative
  on the backend.
- Show item-line arithmetic as a clearly labelled item subtotal, not as the official sale total.
  The official total remains unavailable until the current backend checkout succeeds; an
  authoritative pre-checkout total would require an approved backend preview contract.
- Preserve confirmation with safe initial focus, one idempotent sale request, exact-key recovery for
  ambiguous outcomes, and sale-first printing.
- Treat print success as service acknowledgement, not proof that paper left the printer.

### Consolidated review direction — 2026-09-27

D10 is an interaction-state set inside the same cashier workspace, not a separate route or full
payment screen. Selecting a payment method, entering tender, adding a discount, and reviewing the
customer-facing estimate happen in the right transaction panel while item discovery remains visible.
This preserves the fast working rhythm of the accepted cashier design.

The final confirmation remains because checkout creates stock, sale, payment, cash, and print-adjacent
effects that must not be triggered accidentally. It is deliberately lightweight: `Tinjau pembayaran`
replaces only the right panel with a compact summary, leaves the cashier context in place, focuses the
safe return action first, and supports keyboard confirmation. It does not navigate to another page or
repeat the complete workflow. Pending/checking keeps that panel frozen behind the same request and
idempotency key.

- The numeric amount before checkout is labelled `Perkiraan bayar` and derived only from prices
  already visible in the cart. Short helper text states that the server establishes the final total;
  no preview endpoint or client-authoritative sale total is introduced.
- The existing `discountAmount` and `description` request fields support the owner-requested discount
  and explanation without inventing a dedicated reason API.
- Known payment, stock, or session rejection replaces only the right panel and preserves the cart.
  Ambiguous outcome recovery remains visually distinct and permits status lookup or exact same-request
  replay only; it never suggests a new payment.
- After server-confirmed success, the right panel shows the official sale values and only then the
  separate print pending/acknowledged/error state. Reprint uses the returned sale code and cannot
  recreate the sale. Service acknowledgement does not claim that paper physically exited a printer.

### Owner decision — 2026-09-27

The owner approved this single combined cashier-flow direction and rejected the separate D09 cart
and D10 checkout page candidates. The binding direction is recorded in
`uxr-d09-d10-cashier-decision.md`. UXR-D09 and UXR-D10 are now `APPROVED` for design direction;
application implementation remains separately gated.

## Owner decisions requested

No cashier design decision remains open. Implementation must preserve the approved in-place safety
step, labelled estimate, exact-request recovery, backend authority, and sale-first print ordering.
