# UXR-D08 — Cash sessions design decision

Status: `APPROVED`  
Decision date: 2026-09-27  
Evidence: `docs/ux/audits/uxr-a08-cash-sessions.md`  
Review record: `docs/ux/design/uxr-d08-d10-cashier-review.md`  
Review visual: `bloom-design-review-suite.html`, item **D08 Sesi kas**

## Approved direction

The owner approved one dedicated `Sesi kas` page that places the verified current session above the
paged history while preserving their separate backend reads and meanings.

- The current-session summary shows status, session identity, opening cash, opener, opening time,
  and the applicable open/close action.
- The history list preserves status, opener and time, opening cash, final expected cash, actual cash,
  variance label and signed amount, and a labelled detail action.
- History pagination shows the page-size selector, visible item range and total, current page, and
  labelled previous/next controls with correct disabled states. A passive item count is not enough.
- Narrow desktop turns table columns into labelled stacked rows without hiding any reconciliation
  value or introducing page-level horizontal overflow.
- Opening and actual-closing cash use one Indonesian editing convention. Read-only currency and
  timestamps use consistent Indonesian presentation.
- Expected cash is fetched only for the close workflow. The frontend sends only actual closing cash
  and does not calculate the final expected cash or variance.
- Close review repeats the server preview and operator-entered actual cash, then clearly warns that
  the mutation is irreversible.
- The success state retains the server-final reconciliation. Before another session can be opened,
  the UI explicitly verifies that no session is currently open.

## Required states

The implementation must cover current loading/error/no-session/open states, open validation and
pending, close-preview loading/error, actual-cash validation, close confirmation and pending,
server-confirmed balanced/over/short results, already-closed conflict replacement, post-close current
status verification, paged history loading/error/empty/filter states, detail loading/error, keyboard
focus, and wide/narrow layouts.

## Binding constraints

- `GET /current`, expected-cash preview, open, close, history, and detail retain their existing
  backend contracts; the design introduces no aggregate or preference endpoint.
- Opening sends only `openingCash`; closing sends only `actualClosingCash`.
- Final expected cash, actual cash, difference, status, actors, and timestamps come from server
  responses or read models.
- Pending disables duplicate drawer mutations and other drawer-affecting cashier actions.
- An already-closed response replaces stale local input with the latest server detail and does not
  encourage a second close.
- Focus reaches validation errors and transaction outcomes, and critical action labels do not wrap
  into ambiguous multi-line controls at the audited narrow width.

## Implementation gate

This approval records design direction only. Frontend implementation requires a UXR-D08
implementation re-baseline with exact component, API-state, accessibility, responsive, and test
acceptance criteria.
