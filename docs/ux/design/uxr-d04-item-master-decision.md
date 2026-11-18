# UXR-D04 — Item master and location inventory design decision

Owner direction recorded: 2026-09-23  
UXR-D04 status: `APPROVED`  
Implementation status: UXI-11 and UXI-12 implemented

## Owner-approved direction

The owner approved the item-master and location-inventory direction developed from UXR-A04 and the
approved UXR-D00 mode-aware hybrid. Small implementation-stage refinements remain allowed when they
preserve this information hierarchy and the backend contract.

- Use the complete Operational Blue back-office shell without removing or consolidating existing
  routes.
- Use one search field for the backend-supported name-or-SKU query, retain the category filter, and
  provide one unambiguous **Reset filter** action.
- Combine item name, SKU, category, base UOM, and whole/fractional policy into one readable identity
  cell.
- Keep **Toko / STORE** and **Gudang / WAREHOUSE** visibly separate in a single **Stok per lokasi**
  column. Never merge them or calculate a client-side total.
- Show the exact backend-returned selling price and meaningful decimal digits rather than rounding
  the value for display.
- Label the audit column **Data barang diperbarui** so its person/date metadata is not confused with
  the time of a stock movement.
- Keep item names operable for detail inspection and preserve shortcuts for item-scoped stock
  history, barcode printing, editing, and deactivation.
- Use compact icon-only row actions with 44-pixel targets, visible focus, accessible names, and
  tooltips. Slightly tighter back-office rows are acceptable, but touch targets and older-user
  legibility must not shrink.
- Use **Tambah barang**, **Ubah barang**, and **Nonaktifkan** in user-facing copy. Deactivation must
  not imply hard deletion.
- On create, keep optional STORE and WAREHOUSE opening quantities inside the backend's atomic item
  creation operation. On edit, never expose direct stock mutation.
- Show backend-reported UOM and fractional-policy locks after the first stock movement. Preserve
  whole-unit and up-to-four-decimal fractional behavior.
- Reflow the list into labelled stacked rows on narrow desktop without page-level horizontal
  scrolling, hidden quantities, missing prices, or removed actions.
- Keep light as the default appearance candidate and retain semantically equivalent dark-mode
  treatment for the later UXR-D16 appearance task.

## Reusable table-layout baseline

This design establishes a reusable direction for Bloom's later list-heavy back-office pages:

1. group related identity fields in the first column;
2. keep backend-owned operational values visibly labelled and directly scannable;
3. avoid one column per small metadata field when fields form one semantic unit;
4. use icon-only row shortcuts consistently when a row has several actions;
5. distinguish record metadata from transactional or ledger timestamps;
6. transform rows into labelled vertical groups at narrow widths instead of relying on page-level
   horizontal scrolling; and
7. preserve each domain's supported filters, statuses, actions, and recovery meaning rather than
   applying a visual template mechanically.

Later domains may vary column order, density, detail presentation, and confirmation behavior when
their audit evidence requires it. This is a layout pattern, not a new global design system.

## Contract and implementation boundary

The direction retains the current MUI foundation, item list/create/edit routes, detail and barcode
surfaces, stock-history entry point, stores, API calls, pagination, alerts, and breadcrumbs. It does
not add inactive-item browsing, a new location model, direct stock editing, client-side inventory
calculations, a combined transfer/history route, a component-library replacement, or new backend
fields and endpoints.

The interactive review mockup was used because the available Figma MCP quota was exhausted. It is a
design reference rather than application code. Implementation must still verify loading, empty,
error, validation, conflict, pending, success, focus restoration, keyboard operation, and responsive
behavior against the live backend.

## Decision rationale

The approved direction removes the current table's horizontal overload while keeping the numerical
facts an inventory administrator needs to scan: what the item is, the exact quantity at each
location, its selling price, and the available actions. It also makes the distinction between item
metadata and stock history explicit, which reduces the risk that users interpret one update
timestamp as the last inventory movement.
