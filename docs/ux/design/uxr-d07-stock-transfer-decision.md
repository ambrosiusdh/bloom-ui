# UXR-D07 — Stock transfer design decision

Status: `APPROVED`  
Decision date: 2026-09-27  
Evidence: `docs/ux/audits/uxr-a07-stock-transfer.md`  
Review record: `docs/ux/design/uxr-d05-d07-d12-d15-review.md`  
Review visual: `bloom-design-review-suite.html`, item **D07 Transfer stok**

## Approved direction

The owner approved a refined version of the familiar single-item transfer layout:

- a full-width, keyboard-first item combobox searchable by item name or SKU;
- simultaneously visible `Lokasi asal` and `Lokasi tujuan` fields with a labelled `Tukar` action;
- advisory source stock beside the source location, without treating it as authoritative;
- a numeric `Jumlah transfer` entry with the selected item's UOM shown separately;
- an optional 255-character description with a visible counter;
- `Tinjau transfer` as the primary action and `Muat ulang stok` as the secondary action;
- a self-contained confirmation that repeats item name and SKU, direction, quantity and UOM, and
  description before submission;
- pending, conflict, success, ambiguous-outcome recovery, keyboard/focus, and narrow-desktop states
  that preserve the audited transaction behavior.

## Navigation decision

`Riwayat stok` and `Transfer stok` use one sidebar destination named `Pergerakan stok`. It opens stock
history by default, where `Buat transfer stok` is the primary action. The transfer command remains a
distinct route and workflow because it creates one server-authorized transfer and paired location
movements. Stock adjustment remains separate.

## Binding constraints

- The backend remains authoritative for availability validation, the accepted quantity, resulting
  balances, transfer reference, and paired movement records.
- Source and destination must be different; changing either location keeps the other valid, and the
  swap action exchanges them without losing the selected item or quantity.
- Whole and fractional UOM rules, including up to four decimal places where supported, remain bound
  to the selected item and backend validation.
- The item picker must not silently cap discovery to one fixed item page.
- Pending disables duplicate submission and other state-changing transfer actions.
- Ambiguous outcomes retain the exact request and idempotency key and permit only safe same-request
  reconciliation; the UI must not imply an unsupported status endpoint.
- Narrow layouts stack controls in the same reading and keyboard order without hiding either
  location or causing page-level horizontal overflow.

## Reuse direction

Reuse the existing transfer store/API boundary, money/quantity formatting rules, form controls,
confirmation pattern, transaction notices, and shared navigation shell. Implementation may refine
component composition, but must not invent multi-item transfer, editable server balances, new
locations, new endpoints, or client-authoritative stock calculations.

## Implementation gate

This approval records design direction only. Frontend implementation requires a UXR-D07
implementation re-baseline with exact component, state, test, responsive, and recovery acceptance
criteria.
