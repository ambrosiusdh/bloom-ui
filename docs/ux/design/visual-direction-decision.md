# UXR-D00 — Visual direction decision

Status: `APPROVED`  
Decision date: 2026-09-20  
Owner selection: explicitly defined mode-aware hybrid

## Selected direction

Bloom will use the mode-aware hybrid direction refined during owner review, with these selected
traits:

- Operational Blue is the single brand and primary-action accent. The earlier maroon/plum accent is
  not carried forward.
- Light appearance is the default candidate for the store. A semantically equivalent optional dark
  appearance remains planned under UXR-D16; it must not change features or business meaning.
- Cashier uses a focused split workspace: item finding and selection on the left, with the current
  cart, totals, discounts, payment, transaction status, and recovery context kept together on the
  right. Product imagery is not required; compact, legible item rows use existing item facts.
- Back-office screens use a calm, readable shell with a deep-blue navigation surface, grouped
  destination labels, a clearly visible active route, and Operational Blue actions.
- Wide navigation is expanded by default and may be collapsed. Narrow navigation becomes a modal
  drawer. The navigation list owns vertical scrolling while Kasir and account actions remain pinned
  and reachable.
- Primary text and controls are sized for older operators: clear labels, restrained density,
  approximately 16 px primary text, at least 44 px interaction targets, visible keyboard focus, and
  status meaning that does not rely on color alone.
- Existing MUI and useful Bloom components remain the implementation baseline. This decision does
  not approve replacing the component library or creating a new global design system.

The sidebar brand shows only `Bloom`; the redundant `Back office` subtitle is intentionally omitted.

## Rationale

The owner preferred the Operational Blue palette for consistent actions and rejected the competing
maroon/plum accent. During cashier review, the split operational layout reduced scanning and kept
transaction facts persistent without removing existing functions. During navigation review, the
grouped labelled sidebar, pinned Kasir/account actions, independent navigation scroll, and
wide/narrow behavior were accepted. Together these choices balance fast daily operation with lower
cognitive load and better legibility for the intended older users, while keeping reuse cost lower
than a component-library replacement.

## Guardrails for later domain designs

- Preserve backend authority for totals, stock, cash reconciliation, debt, statuses, and recovery.
- Preserve every supported route, feature, keyboard/focus behavior, and meaningful async state.
- Prefer progressive disclosure and clearer hierarchy over deleting information.
- Keep domain-specific deviations evidence-based and record them in that domain's design decision.
- Treat dark mode and appearance persistence as UXR-D16 work; do not invent a backend preference
  endpoint.

## Approval scope

This approval closes only UXR-D00's visual-direction decision. Each domain design still requires its
own audit evidence, state coverage, owner review, and explicit approval before implementation.
