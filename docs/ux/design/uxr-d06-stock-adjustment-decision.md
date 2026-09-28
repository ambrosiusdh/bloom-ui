# UXR-D06 — Stock adjustment design decision

Owner direction recorded: 2026-09-27  
UXR-D06 status: `APPROVED`  
Implementation status: not started

## Owner-approved direction

The owner approved the Stock Adjustment direction developed from UXR-A06, the approved UXR-D00
mode-aware hybrid, and the reusable back-office layout established by UXR-D04. Small
implementation-stage refinements remain allowed when they preserve this hierarchy, workflow
meaning, and backend contract.

- Keep the complete Operational Blue back-office shell and light default appearance.
- Replace the current all-items select with a keyboard-first searchable combobox. Search uses
  existing active-item name and SKU facts; each result keeps name, SKU, category, base UOM, and
  whole/fractional policy visible. Arrow-key navigation, Enter selection, Escape dismissal, visible
  focus, and a clear no-result state are required.
- After selection, show the chosen item as a concise identity summary with an explicit **Ganti
  barang** action. Do not make the operator scan the complete catalog again merely to verify the
  selection.
- Keep one readable adjustment card per item. Location uses the existing **Toko / STORE** and
  **Gudang / WAREHOUSE** values; action keeps **Tambah**, **Kurangi**, and **Koreksi stok** visibly
  distinct. Raw enums may remain secondary support hints but are not the primary labels.
- Preserve the exact quantity contract: ADD and REMOVE accept positive deltas, while CORRECTION is
  an absolute target and allows zero. Whole-unit items remain whole-only and fractional items allow
  up to four decimal places.
- Show loaded location stock only as an advisory. The frontend must not calculate or promise the
  resulting balance; previous stock, new stock, and booked movements remain server-owned results.
- Keep the required reason, frozen confirmation payload, safe cancel-first dialog focus, Escape
  restoration, pending lock, duplicate-submit prevention, complete server-response gate, and
  durable ambiguous-outcome quarantine.
- A definitive rejection keeps the filled form, provides a persistent focusable explanation near
  the affected line, and permits correction. A no-op CORRECTION must not appear as an inert primary
  action.
- Keep reference search immediately visible on history. Put the backend-supported date range under
  **Filter lainnya** so the default list remains calm. Distinguish a filtered no-result state from
  an empty ledger and make filter recovery the primary action.
- Keep list/detail return state and accessible row-action names containing the adjustment reference.
- Present detail and confirmed results as complete grouped rows. Keep previous and new stock next
  to each other, localize movement direction as **Masuk** or **Keluar**, and reflow to labelled
  stacked rows on narrow desktop without page-level horizontal scrolling.
- Retain explicit next actions after success: create another adjustment, open the saved detail, or
  return to history.

## Approved state coverage

The interactive review covers normal history, filtered empty, create, frozen confirmation,
definitive server rejection, server-confirmed success, persisted detail, ambiguous/recovery lock,
and wide/narrow-desktop presentation. Loading, item-load error, empty active-item catalog, pending,
conflict refresh, storage failure, and malformed/incomplete success remain required implementation
states even where the review uses the existing tested behavior rather than a separate visual frame.

## Contract and implementation boundary

The direction retains the current MUI foundation, Stock Adjustment routes, stores, API calls,
pagination, alerts, breadcrumbs, reusable quantity field, confirmation dialog, session-storage
quarantine, and backend endpoints. It does not add a stock-calculation endpoint, client-side stock
authority, inactive-item selection, a new inventory location, approval workflow, bulk-import
redesign, route restructuring, component-library replacement, or a global design system.

The interactive reference is:

`C:/Users/Ambrosius David H/.codex/visualizations/2026/09/14/01a0a24b-49aa-7771-b460-386677499a61/bloom-stock-adjustment-review.html`

It is a design reference rather than application code. Implementation must verify every supported
async, keyboard, focus, responsive, validation, conflict, success, and recovery behavior against the
live backend.

## Decision rationale

The approved direction makes item discovery scalable and makes delta-versus-absolute adjustment
meaning visible before confirmation, while retaining the conservative transaction safeguards already
present in Bloom. Grouped result rows solve the audited narrow-detail overflow without hiding the
server-confirmed before/after balances needed for stock investigation.

