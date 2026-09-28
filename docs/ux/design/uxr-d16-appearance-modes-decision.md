# UXR-D16 — Light and dark appearance modes design decision

Status: `APPROVED`  
Decision date: 2026-09-28  
Owner decision: approve the refined light/dark appearance direction and preference behavior.

## Approved direction

- Keep **Terang** as the first-use default when the browser/device has no saved preference.
- Offer **Terang**, **Gelap**, and **Ikuti sistem**. Store an explicit choice locally on that
  browser/device; appearance is not an account setting and does not require a backend field or
  endpoint.
- When **Ikuti sistem** is active, resolve from the operating-system preference and follow later
  system appearance changes.
- Resolve the saved or system preference before the first meaningful application paint so the shell
  does not briefly display the wrong appearance.
- Preserve identical Bahasa Indonesia copy, data, controls, order, focus order, responsive behavior,
  and business state in light and dark modes. Appearance never changes backend authority,
  transaction meaning, recovery behavior, or action availability.
- Use Operational Blue as the single brand and high-emphasis action accent. Maintain semantic-token
  parity for normal, selected, focus, success, warning, error, server-rejected, pending, and disabled
  states in both appearances.
- Pair every status color with text, an icon, a boundary, or a native control state. Retain the
  older-user baseline of readable primary/supporting type, approximately 44-pixel action targets,
  and an unmistakable high-contrast focus indicator.
- Reuse the approved grouped sidebar, fixed lower-left user area, header, and narrow navigation in
  both modes. Light and dark are two appearances of the same product shell, not alternate layouts.
- Validate both appearances at wide and 760-pixel narrow desktop, including contrast, keyboard-only
  use, 200% zoom, semantic states, and absence of whole-page horizontal overflow.

## Scope boundary

This approval authorizes the design direction only. It does not authorize application implementation,
new backend preferences, account synchronization, theme-specific business behavior, feature removal,
an unrelated visual redesign, or replacement of MUI/global component infrastructure.
