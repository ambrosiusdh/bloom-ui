# UXR-D12 — Suppliers design decision

Status: `APPROVED`  
Decision date: 2026-09-28  
Owner decision: approve the focused supplier list, detail, create/edit, conflict, deactivation, and
responsive direction.

## Approved direction

- Use the shared back-office shell and table/detail pattern with labelled columns for supplier
  identity, contact, lifecycle status, server-owned outstanding balance, updater/time, and detail.
- Keep search scope, active/inactive filter, reset, page size, visible range, current page, and
  previous/next actions explicit and URL-backed during implementation.
- Explain supplier-code normalization before committing the permanent identity. Duplicate conflict
  preserves every entered value and explains that inactive records continue to reserve their codes.
- Edit keeps the code immutable and outside keyboard order while allowing supported name, phone, and
  address changes.
- Detail preserves lifecycle text, contact/address, created/updated actor and time, and the
  backend-returned outstanding summary without browser aggregation.
- Deactivation is not deletion. Confirmation focuses `Batal`, supports Escape with focus restoration,
  removes only eligibility for new transactions, and retains identity and history.
- At narrow desktop, switch to labelled grouped rows before the shell/table combination can cause
  page-level overflow. The detail action remains visible.

## Scope boundary

This approval authorizes the design direction only. It does not authorize implementation, hard
deletion, supplier-code mutation or reuse, client-calculated debt, reactivation UI, or backend changes.
