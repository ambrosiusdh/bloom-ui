# UXR-D14 — Payables and supplier payments design decision

Status: `APPROVED`  
Decision date: 2026-09-28  
Owner decision: approve the focused payable discovery, receipt detail, one-receipt payment,
confirmation, recovery, result, and responsive direction.

## Approved direction

- Use the shared back-office shell and a paged payable list backed by goods-receipt rows. Preserve the
  currently supported receipt-reference or supplier-name search, explicit reset, page size, visible
  range, current page, and previous/next actions. Do not fabricate debt filters the backend does not
  provide.
- Show supplier, exact receipt identity, payment status, total, paid, outstanding, and received time
  as backend-returned facts. `BELUM DIBAYAR`, `DIBAYAR SEBAGIAN`, and `LUNAS` remain text-labelled
  and understandable without relying on color.
- Make receipt detail the reading task. Present receipt identity and financial facts first, followed
  by received item lines and payment history. `Catat pembayaran` remains a secondary action after the
  auditable record rather than replacing it.
- Bind every payment to one receipt. Preserve exact amount, full-outstanding assistance,
  `BANK_TRANSFER`, `QRIS`, and `CASH`, optional reference and note, and confirmation-time `paidAt`.
  BANK_TRANSFER and QRIS do not affect the drawer; CASH requires a verified open session and remains
  subject to server validation.
- Confirmation repeats receipt, supplier, exact amount, method, last-known outstanding, reference,
  note, payment time, and method-specific drawer meaning. Initial focus is on `Kembali`; Escape
  restores focus to the review action without losing the draft.
- Pending locks the exact request. Ambiguous outcomes preserve the receipt code, payload,
  idempotency key, original cash-session intent where applicable, and immutable account owner for
  same-request recovery. A later cash session must never retarget a frozen CASH payment.
- Keep definitive rejection distinct from ambiguity. A rejected request states that no payment was
  confirmed, retains editable input, refreshes the latest receipt facts, and requires a new review.
  Success renders the returned payment record and separately refreshed backend paid, outstanding,
  and payment-status values.
- Keep the corrected transport contract:
  `POST /api/goods-receipts/payments?code={receiptCode}`. Slash-containing receipt references must
  not be placed back into one encoded path variable.
- At narrow desktop, use labelled grouped rows and a stacked payment form. Supplier, receipt,
  status, total, paid, outstanding, actions, and payment-method meaning remain visible without
  whole-page horizontal panning.

## Backend dependency note

The current design is implementable with the existing receipt detail, payment-history, one-receipt
payment, and supplier outstanding-balance contracts. The optional backend addition for stable
`supplierCode` filtering on the paged goods-receipt list is assumed to be in progress. It is a future
payable-discovery refinement, not a blocker for the approved receipt-level flow, and the frontend
must not infer supplier identity from a display name while waiting for it.

## Scope boundary

This approval authorizes the design direction only. It does not authorize implementation,
multi-receipt allocation, supplier prepayment or credit, automatic allocation, payment reversal UI,
browser-calculated debt, post-close CASH correction, or new business rules.
