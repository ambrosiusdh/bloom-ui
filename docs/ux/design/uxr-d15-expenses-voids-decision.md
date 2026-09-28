# UXR-D15 — Expenses and voids design decision

Status: `APPROVED`  
Decision date: 2026-09-28  
Owner decision: approve the focused expense history, creation, detail, void, recovery, result, and
responsive direction.

## Approved direction

- Use the shared back-office shell and a labelled paged history table rather than prose-heavy cards.
  Keep expense ID, localized category, operational classification, note, active/void state, backend
  void eligibility, exact amount, original cash session, creator, and timestamp visible. The current
  backend list supports paging only, so do not invent category, session, status, date, or text filters.
- Keep creation bound to one verified open cash session. Preserve Indonesian exact-decimal entry up
  to four fractional digits, all six backend categories, the conditionally required note for
  `Lainnya`, the 255-character limit, session recheck, and explicit drawer meaning.
- Freeze amount, category, note, and session ID at confirmation. Put initial focus on `Kembali` and
  restore the review trigger on Escape. The UI never substitutes a later cash session or calculates
  an authoritative drawer balance.
- Lock mutation while creation is pending. Ambiguous outcomes retain the exact request, idempotency
  key, expected session ID, and immutable account owner for same-request recovery. Definitive
  rejection retains the form and clearly states that no expense was confirmed. Success renders the
  complete backend-returned record.
- On detail, separate the primary amount/status, immutable original facts, session context, and
  backend-returned void eligibility. Remove the void action for a closed-session or already-voided
  expense and show the server block reason in text.
- Void confirmation repeats the original amount, category, session, actor/time, and required reason.
  It keeps `Kembali` first, restores its trigger on Escape, and explains that the original record is
  retained while the server creates a compensating cash movement.
- Lock the exact expense and first reason during pending and ambiguous void outcomes. The confirmed
  result separates `Pengeluaran asli`, `Pembatalan tersimpan`, and `Dampak sesi menurut server` so
  auxiliary refresh health cannot obscure the confirmed financial result.
- At narrow desktop, use labelled grouped rows, stacked forms/details, wrapped actions, visible focus,
  and approximately 44-pixel controls without whole-page horizontal panning.

## Scope boundary

This approval authorizes the design direction only. It does not authorize implementation, new
history filters, expense edit/delete, post-close correction, sale or supplier-payment correction,
frontend cash calculation, or a shared transaction-framework rewrite.
