# UXR-D05 — Stock movements design decision

Status: `APPROVED`  
Owner approval recorded: 2026-09-27  
Evidence: `docs/ux/audits/uxr-a05-stock-movements.md`  
Review source: `uxr-d05-d07-d12-d15-review.md`

## Approved direction

The owner approved the refined Operational Blue stock-movement ledger with these binding traits:

- retain the existing item/SKU, movement-direction, and location filters plus an explicit reset
  action;
- reset URL-backed filters to page 1, announce the new result count, and return keyboard focus to the
  item/SKU field;
- present a scan-oriented list ordered as `Barang`, `Pergerakan`, `Lokasi`, `Saldo`, and
  `Dibuat oleh & pada`, followed by one accessible detail action;
- group item name, item code, and UOM under `Barang`;
- group localized direction and signed exact quantity under `Pergerakan`, with the localized source
  immediately beneath it;
- keep location, before-to-after balance, actor, and timestamp directly visible in every row; and
- use a 44-pixel eye-icon action to open an in-context detail modal instead of navigating to a
  separate movement-detail page.

The detail modal preserves the server-returned reference, direction, source, location, exact
quantity/UOM, separately labelled before and after balances, actor, and timestamp. It may link to an
already-supported source-detail route, but it does not imply or require a new stock-movement detail
endpoint.

## State and accessibility coverage

- Wide desktop uses visible semantic column headers.
- Narrow desktop converts the same facts to labelled stacked rows without page-level horizontal
  overflow.
- Direction uses text, sign, and icon rather than color alone.
- Item names remain identity text; the consistently placed eye action is the only movement-detail
  trigger and has a movement-specific accessible label.
- Loading, error/retry, filtered empty, unfiltered empty, paging, and unavailable source-detail states
  remain distinct.
- Exact fractional quantities and UOM are never rounded or reconstructed by the frontend.

## Backend authority and exclusions

The ledger remains a read-only presentation of the backend movement read model. The frontend must not
calculate balances, infer movement source, combine locations, or invent movement facts. Unsupported
source-detail routes remain labelled and non-operable rather than fabricated.

## Implementation status

Application implementation has not begun. UXR-D05 is approved for implementation planning under the
normal one-domain-per-PR rule.

## Navigation refinement — 2026-09-27

The owner subsequently chose one combined `Pergerakan stok` sidebar destination. It opens the
approved history ledger by default and exposes `Buat transfer stok` as its primary action. Transfer
retains its own confirmation, pending, success, conflict, and recovery workflow; this navigation
decision does not turn the history endpoint into a mutation API or merge backend contracts.
