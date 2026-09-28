# UXR-D01 — Authentication and navigation design review

Status: `APPROVED`  
Evidence: `docs/ux/audits/uxr-a01-auth-navigation.md`  
Interactive review: `bloom-design-review-suite.html`, design item **D01 Akses & navigasi**

## Owner review progress — 2026-09-27

The owner accepted the shared navigation and header treatment: grouped menu icons and labels,
Operational Blue surfaces, removal of the redundant “Back office” label, current-user information
fixed at the lower-left of the sidebar, the appearance action, wide-screen sidebar collapse/expand,
and narrow-screen overlay navigation. This acceptance applies to the shared shell only.

The authentication states remained in `DESIGN_REVIEW` until the focused review below was approved on
2026-09-28. Application implementation remains separately gated.

## Focused authentication review — 2026-09-28

The interactive review now isolates the remaining authentication decisions without reopening the
approved navigation shell:

- The login form uses fully Indonesian copy and the existing username/password contract only. It
  adds no authentication method, request field, or endpoint.
- Protected entry retains the safe internal destination. A successful login returns to that page and
  moves focus to its page heading so keyboard and screen-reader users receive clear arrival context.
- Empty submission identifies both required fields and focuses the first invalid field. A rejected
  credential attempt keeps both entered values, uses one generic Indonesian error message, and moves
  focus to the alert without exposing which credential was wrong.
- Pending login permits one submission, makes the fields read-only, and disables the action until the
  current request resolves.
- Initial session checking shows a neutral progress state without briefly revealing protected
  content. Session expiry explains that no transaction is resubmitted and preserves the safe return
  destination for re-entry.
- The authenticated not-found state stays inside the approved shell, does not falsely select a menu
  item, focuses the not-found heading, and provides a clear return to Dashboard.
- The focused states retain the approved appearance control and light/dark treatment. At the reviewed
  760-pixel viewport the login becomes one column, removes the decorative brand panel, keeps every
  field and action visible, and produces no horizontal overflow.

Headless interaction and responsive QA passed for normal login, required-field validation,
credential rejection, pending login, protected-session checking, session expiry, protected return,
authenticated not-found recovery, and the 760-pixel login layout.

## Proposed direction

- Use the approved Operational Blue shell without the redundant “Back office” label.
- Use fully Indonesian login, failure, expiry, and not-found copy.
- Preserve protected-route path, query, and hash through login, then move focus to the destination
  page heading after successful authentication.
- Make the narrow navigation drawer independently scrollable, close it with Escape, and restore focus
  to the menu trigger.
- Derive breadcrumbs from the active route so returning from cashier does not retain a stale
  “Cashier” label.
- Provide an Indonesian not-found heading, concise explanation, and a clear Dashboard recovery action.

## State coverage

The review includes normal login, authentication failure with retained fields, pending login,
session-expiry re-entry, protected return, not-found recovery, wide shell, and narrow shell. It keeps
the current redirect safety rule and does not add authentication fields or endpoints.

## Owner decision — 2026-09-28

The owner approved the focused authentication composition and destination-page-heading focus after
successful login. Together with the previously accepted navigation shell, this completes UXR-D01.
The binding direction is recorded in `uxr-d01-auth-navigation-decision.md`; application
implementation has not begun.

## Inventory navigation refinement — 2026-09-27

The owner combined the separate `Transfer stok` and `Riwayat stok` sidebar entries into one
`Pergerakan stok` destination. It opens the stock ledger and exposes `Buat transfer stok` as the
primary action. The transfer route remains active under the same sidebar item, while its transaction,
confirmation, and recovery states remain distinct from the read-only ledger.
