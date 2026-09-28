# UXR-D03 — Item categories design decision

Owner direction recorded: 2026-09-23  
UXR-D03 status: `APPROVED`  
Implementation status: not started

## Owner-approved direction

The owner approved the item-category maintenance design developed from the UXR-A03 evidence and the
approved UXR-D00 mode-aware hybrid:

- use the Operational Blue back-office shell with light as the default appearance and an equivalent
  optional dark appearance;
- keep the active-category list, create, edit, validation, conflict, pending, success, and
  deactivation states within the existing category workflow and routes;
- combine the category name, code, and short description into a readable identity column rather
  than spreading related information across many narrow columns;
- show **Diperbarui oleh** and **Diperbarui pada** as separate fields with explicit fallbacks when no
  update metadata exists;
- use icon-only row actions so larger action sets remain compact, while preserving 44-pixel targets,
  visible focus, tooltips, and accessible names;
- make the **Kategori Barang** segment of create/edit breadcrumbs an operable link back to the list;
- keep form labels and validation messages explicit, preserve entered values after a server conflict,
  and move focus to the first actionable error;
- describe the backend operation as **Nonaktifkan**, not delete, and explain the affected active-item
  count without implying that records are destroyed; and
- adapt the same information to a stacked narrow-desktop layout without page-level horizontal
  scrolling or removing actions.

## Reuse and implementation boundary

The direction retains the current MUI foundation, list and form routes, category store/API calls,
confirmation pattern, pagination, alerts, and breadcrumb infrastructure. It does not introduce a
category-detail route, a replacement component library, new endpoints, new category business rules,
or a global design system.

The comparison artifact used during review was an interactive in-conversation HTML mockup because
the available Figma MCP quota was exhausted. The artifact is a design reference, not production
code. Application implementation remains a separate frontend task and must revalidate the approved
states against the live backend contract.

## Decision rationale

This arrangement preserves every supported operation while reducing scanning effort for the intended
older users. Related identity data stays together, audit metadata remains explicit, and consistent
icon actions prevent the action column from expanding when another domain has three or four row
actions. The linked breadcrumb restores a predictable escape route from create and edit without
adding navigation or domain behavior.

