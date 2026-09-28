# UXR-D16 — Light and dark appearance modes design review

Status: `APPROVED`  
Interactive review: `bloom-appearance-modes-final-review.html`; use the **Preferensi**,
**Contoh sistem**, **Layar contoh**, **Keadaan**, and **Viewport** controls

## Proposed direction

- Keep light mode as the default for the initial release and use Operational Blue as the sole brand
  and high-emphasis action accent in both modes.
- Preserve identical copy, data, controls, order, and business state between light and dark modes.
- Pair success, warning, error, pending, selected, disabled, and focus color with text, icon, border,
  or control state so meaning never depends on color alone.
- Retain at least 16 px primary interface text, 14 px supporting text, approximately 44 px action
  targets, and a clearly visible focus indicator for older users.
- Treat the preference as frontend presentation state only. Do not add a backend preference field or
  endpoint.
- Use the owner-approved grouped sidebar, fixed lower-left user area, header, and narrow navigation
  in both modes. Appearance must not create an alternate shell or move operational controls.

## Preference behavior proposed for approval

1. Default to light mode when no saved preference exists.
2. Offer **Terang**, **Gelap**, and **Ikuti sistem** in the eventual appearance control.
3. Persist the explicit local preference on the browser/device; this is not an account setting.
4. When **Ikuti sistem** is selected, follow the operating-system preference without changing any
   business behavior.

## Focused review refinement — 2026-09-28

- Light and dark now use the same cashier and back-office copy, data, layout, controls, order, and
  transaction state, with only semantic color tokens changing.
- The in-header appearance control previews all three preferences and explicitly states that the
  saved choice is local to the browser/device rather than an account or backend setting.
- `Ikuti sistem` resolves visibly to the sample operating-system appearance so the owner can review
  both system-light and system-dark behavior without treating them as separate saved modes.
- Normal, selected, focus, success, warning, error, server-rejected, pending, and disabled examples
  remain available in both representative surfaces. Status meaning always includes text and an icon;
  focus uses a dedicated high-contrast ring rather than the action color alone.
- Wide and 760-pixel narrow previews retain readable type, 44-pixel actions, full content, and the
  reviewed shell behavior without page-level horizontal panning.

## Validation required before implementation approval

- WCAG contrast checks for text, controls, status surfaces, and focus rings in both modes.
- Keyboard-only review for all representative states.
- 200% zoom and 760×768 narrow-desktop review without clipped actions or horizontal page overflow.
- Regression verification that loading, error, pending, conflict, success, and server-rejection copy
  is identical across modes.

## Owner decision — 2026-09-28

The owner approved the refined appearance direction, including the light first-use default,
local-device persistence, `Terang`/`Gelap`/`Ikuti sistem` behavior, and the representative light and
dark palettes. The binding decision is recorded in `uxr-d16-appearance-modes-decision.md`.
Application implementation has not begun.
