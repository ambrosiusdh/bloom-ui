# UXR-D01 — Authentication and navigation design decision

Status: `APPROVED`  
Decision date: 2026-09-28  
Owner decision: approve the shared navigation shell and the focused authentication, session,
protected-return, and not-found direction.

## Approved direction

- Use the Operational Blue shell with grouped icon-and-label navigation, no redundant “Back office”
  label, fixed lower-left current-user information, an explicit appearance action, wide-screen
  collapse/expand, and a narrow overlay drawer.
- Keep the narrow drawer independently scrollable, close it with Escape, and restore focus to the
  menu trigger. Derive the breadcrumb and selected menu item from the active route.
- Combine `Riwayat stok` and `Transfer stok` under `Pergerakan stok`: history remains the default
  destination and `Buat transfer stok` opens the distinct transfer workflow.
- Use fully Indonesian authentication copy and the existing username/password contract only. Do not
  add an authentication method, request field, or endpoint.
- Preserve a safe internal protected destination across login. After successful authentication,
  return to that destination and move focus to its page heading.
- On empty submission, identify both required fields and focus the first invalid field. On rejected
  credentials, retain the entered values, show one generic Indonesian error, and focus the alert
  without revealing which credential was wrong.
- During login, permit one submission, make the fields read-only, and disable the submit action until
  the request resolves. During initial session checking, do not reveal protected content.
- On session expiry, explain that no transaction is resubmitted and retain the safe return target.
  Keep the authenticated not-found state inside the shell, focus its heading, avoid falsely selecting
  a menu item, and provide a Dashboard recovery action.
- At the reviewed 760-pixel viewport, use the one-column login, omit the decorative brand panel, and
  keep every field and action visible without whole-page horizontal overflow.

## Scope boundary

This approval authorizes the design direction only. It does not authorize application implementation,
new authentication fields or endpoints, changed redirect-safety rules, automatic transaction
resubmission, backend-session changes, or unrelated navigation and business-workflow changes.
