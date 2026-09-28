# UXR-D13 — Goods receipts design decision

Status: `APPROVED`  
Decision date: 2026-09-28  
Owner decision: approve the focused goods-receipt history, detail, creation, confirmation, recovery,
result, and responsive direction.

## Approved direction

- Use the shared back-office shell with a paged, labelled history table and URL-backed receipt,
  supplier, and received-date filters. Keep `BELUM DIBAYAR`, `DIBAYAR SEBAGIAN`, and `LUNAS`
  visible as backend-returned payment states alongside exact total, paid, and outstanding values.
- Make the receipt record the primary detail task. Present identity and financial state first, then
  the received item lines with item, SKU, location, exact UOM quantity, purchase price, and line
  subtotal. Supplier payment remains a clearly secondary action after those lines.
- Keep receipt creation separate from history/detail. Preserve supplier lookup, supplier reference,
  Indonesian `DD-MM-YYYY` guidance, 24-hour time, explicit WIB/WITA/WIT selection, note, and one
  independently editable location, quantity, UOM, and purchase price per line.
- Allow repeated lines for the same SKU because location and purchase-price facts are line-specific.
  Preserve stable item identity and exact decimal strings throughout the draft.
- Label the input total as an advisory estimate for comparing the supplier note. The backend remains
  authoritative for posted stock, receipt total, paid amount, outstanding amount, and payment status.
- Confirmation repeats localized receipt and line facts, starts focus on `Kembali`, and does not add
  an initial supplier payment. Escape returns to the review trigger without losing the draft.
- During submission, lock the exact request. Ambiguous outcomes retain the same request and
  idempotency key for safe recovery; the success state renders the backend-confirmed receipt and
  financial result.
- At narrow desktop, use labelled grouped history rows and a compact two-column line editor, then
  stack to one column at smaller widths. Essential facts and actions must not require whole-page
  horizontal panning or hover.

## Scope boundary

This approval authorizes the design direction only. It does not authorize implementation, frontend
stock or financial calculation, initial payment during receipt creation, merging receipt posting with
supplier payment, changing backend transaction rules, or adding endpoints or fields.
