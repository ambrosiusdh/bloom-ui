# UXR-A04 — Item domain

Status: `EVIDENCE_COMPLETE`  
Execution: read-only repository audit plus live UX audit with recorded disposable-data mutations  
Audit date: 2026-09-13  
Environment: local Bloom frontend (`http://localhost:5173`) and local backend (`http://localhost:8080`), using the documented local `admin` fixture account  
Browser: Codex in-app browser (Chromium-based; exact version unavailable)  
Viewports: default wide browser surface (nominally 1280×720) and a 760×768 narrow-desktop override. Raw JPEG payloads are 1253×705, 1265×712, or 1280×720 in the wide run and 745×753 or 760×768 in the narrow run, depending on scrollbar and modal capture surfaces.

## Scope and method

This audit covered the implemented active-item list, loading and safely filtered-empty states, item detail, STORE/WAREHOUSE balances, UOM and fractional-quantity comprehension, create with and without opening stock, validation, duplicate conflict, pending/success behavior, edit before and after movement lock, barcode/detail/stock-audit entry points, Indonesian money/date rendering, keyboard/focus behavior, and wide/narrow layouts. It did not audit item-category maintenance, stock-movement operations beyond the item-scoped read-only entry point, sales, receiving, adjustment, transfer, or any other domain.

Before live work, the audit read `AGENTS.md`, `docs/architecture/release-1-frontend-contract.md`, `docs/plans/release-1-frontend-roadmap.md`, `docs/plans/release-1-ux-rework-roadmap.md`, the item routes/API/store/constants/pages/modals/tests, and the matching backend controller, create/update/filter request DTOs and validation, response DTO, mapper, specification, domain model, quantity validator, service interface/implementation, and seed migrations. Repository inspection was read-only. No application, backend, dependency, configuration, route, or test file was changed.

The backend Release 1 contract is authoritative here:

- the list returns active items and exposes separate STORE and WAREHOUSE balances;
- item create can atomically persist the item plus positive opening balances as `OPENING_BALANCE` movements;
- quantities accept up to four decimal places, and non-fractional items reject fractional quantities;
- an item is movement-locked after its first stock movement; UOM and fractional policy then cannot change;
- item update does not accept or change stock balances;
- `PATCH /api/items/{sku}` deactivates rather than deletes;
- the current list is active-only, so deactivated audit records disappear from item results;
- the current frontend's audit entry point is the item-filtered stock-movement route. `ItemAuditLogModal.jsx` exists but is not wired into the current item UI and calls an endpoint not provided by the inspected backend.

Two disposable items were used:

- `UXRA04-WHOLE`: created as a whole-unit item with no opening stock, edited while unlocked from `PIECE` to `LITER`, then deactivated;
- `UXRA04-FRAC`: created as `METER`, fractional, with auditor-entered STORE `1,25` and WAREHOUSE `2.5001` opening values; the resulting movements locked its quantity rules; metadata was then edited and the item deactivated.

All live screenshots are raw browser-native JPEGs under [`docs/ux/evidence/uxr-a04`](../evidence/uxr-a04/). The evidence directory contains the complete 37-frame sequence, including transient loading and pending frames rather than only polished settled states.

## Scenario evidence

### A04-01 — Active list, loading, search, and safe empty state

- **Purpose:** establish the current active-item list and distinguish in-flight from no-match results without touching seeded items.
- **Route and start:** `/items`; seeded whole and fractional examples were already present.
- **Steps:** load the list; search for `UXR_A04_NO_MATCH`; observe the request transition and settled result; clear the filter.
- **Evidence:** [`01` populated list](../evidence/uxr-a04/01-item-list-wide.jpg), [`02` search transition](../evidence/uxr-a04/02-item-list-search-transition-wide.jpg), and [`03` filtered empty](../evidence/uxr-a04/03-item-list-filtered-empty-wide.jpg).
- **Observed fact:** the in-flight row said `Memuat barang...` and pagination was disabled. The no-match row said `Barang tidak ditemukan` and `Ubah atau hapus filter untuk mencoba lagi.`, with an inline `Hapus filter` action. The populated table exposed name, category, SKU, UOM, price, STORE balance, WAREHOUSE balance, status, and row actions.
- **Expected:** loading must not be mistaken for an empty database, and an empty filtered result must explain how to recover.
- **Assessment:** state copy matches the implemented list. A globally empty active-item database was not created because that would require deactivating seeded records.
- **Priority:** no finding for state distinction; layout is assessed in A04-07.

### A04-02 — Whole-unit create without opening stock

- **Purpose:** verify create, no-opening-stock semantics, required-field validation, keyboard traversal, pending protection, and success.
- **Route and start:** `/items/new`.
- **Steps:** enter through the create route; submit the blank form; prepare manual SKU `UXRA04-WHOLE`, name `Audit A04 Utuh Tanpa Stok`, category `LNN`, price `12500`, UOM `PIECE`, fractional off, both opening fields blank, and description `Item audit utuh tanpa stok awal.`; Tab to `Buat barang`; activate it once.
- **Evidence:** [`04` route entry](../evidence/uxr-a04/04-item-create-route-entry-wide.jpg), [`05` validation](../evidence/uxr-a04/05-item-create-validation-wide.jpg), [`06` valid form](../evidence/uxr-a04/06-item-create-whole-no-opening-ready-wide.jpg), [`07` keyboard focus](../evidence/uxr-a04/07-item-create-whole-keyboard-focus-wide.jpg), [`08` literal pending](../evidence/uxr-a04/08-item-create-whole-submit-result-wide.jpg), and [`09` success return](../evidence/uxr-a04/09-item-create-whole-success-wide.jpg).
- **Observed fact:** the form explained that blank opening values mean zero and any entered values become `OPENING_BALANCE` movements in the same transaction. Blank submit produced `Nama barang wajib diisi.`. The raw validation frame remained scrolled to the submit area with focus on `Buat barang`, leaving the invalid name and its message above the visible viewport. Keyboard traversal reached the submit button. During the request, controls were disabled and the action read `Menyimpan...`.
- **Observed fact:** the backend created one active `UXRA04-WHOLE` item with `0` STORE, `0` WAREHOUSE, and no movement lock. The success notice existed in the returned accessibility tree, but the browser retained the form's lower-page scroll position and focused the document root; the notice and new row were both offscreen in the raw result frame.
- **Expected:** validation identifies and focuses the first invalid field; pending prevents duplicate create; success makes the server result and next state perceivable.
- **Assessment:** business and pending behavior match. Validation/success orientation does not (`ITEM-01`).
- **Priority:** `P1` (`ITEM-01`).

### A04-03 — Whole-item detail, barcode, audit entry, and unlocked edit

- **Purpose:** verify detail comprehension and all current item-level entry points before any movement exists, then verify allowed UOM editing without exposing direct stock editing.
- **Route and start:** list filtered to `UXRA04-WHOLE`.
- **Steps:** wait through the filtered route transition; open the row detail with Enter; close it; open the barcode modal and close it without invoking print; follow the item-scoped stock-history link; open edit; change name to `Audit A04 Utuh Diperbarui` and UOM from `PIECE` to `LITER`; save.
- **Evidence:** [`10` filter-route loading](../evidence/uxr-a04/10-item-whole-filter-route-loading-wide.jpg), [`11` filtered row](../evidence/uxr-a04/11-item-whole-filtered-wide.jpg), [`12` detail](../evidence/uxr-a04/12-item-whole-detail-wide.jpg), [`13` barcode entry](../evidence/uxr-a04/13-item-barcode-entry-wide.jpg), [`14` audit-route entry](../evidence/uxr-a04/14-item-audit-entry-wide.jpg), [`15` scoped empty audit](../evidence/uxr-a04/15-item-audit-empty-no-opening-wide.jpg), [`16` edit-route loading](../evidence/uxr-a04/16-item-whole-edit-route-loading-wide.jpg), [`17` unlocked edit](../evidence/uxr-a04/17-item-whole-edit-unlocked-wide.jpg), [`18` changed UOM ready](../evidence/uxr-a04/18-item-whole-edit-uom-ready-wide.jpg), and [`19` edit success return](../evidence/uxr-a04/19-item-whole-edit-submit-wide.jpg).
- **Observed fact:** the detail separated STORE and WAREHOUSE, appended the active UOM to each quantity, said `Unit utuh saja`, `Belum ada` movement, and `Dapat diubah sebelum ada pergerakan stok`. The item-scoped history route preserved `itemSku=UXRA04-WHOLE` and settled on `Tidak ada pergerakan stok`, confirming that blank opening fields created no movement.
- **Observed fact:** the edit page explicitly said `Stok STORE dan WAREHOUSE tidak dapat diedit di sini.`; it contained no stock inputs. UOM and fractional policy were enabled before a movement. Changing UOM to `LITER` succeeded without changing either zero balance. The post-edit return reproduced the retained-scroll/root-focus issue from create.
- **Observed fact:** the barcode modal rendered a browser-generated barcode and SKU and exposed `Cetak`, but its visible close icon had no accessible name. Escape and the visible icon still closed the modal; focus returned to the originating `Cetak barcode ...` button. Printing was not invoked.
- **Expected:** a movement-free item can change quantity rules; detail and audit entry accurately expose movement state; stock is never edited through metadata edit; every modal control has a usable accessible name.
- **Assessment:** item/UOM/stock authority behavior matches. Barcode close naming does not (`ITEM-04`).
- **Priority:** `P2` (`ITEM-04`).

### A04-04 — Duplicate SKU conflict

- **Purpose:** verify server conflict handling without creating a second item or losing the correction context.
- **Route and start:** `/items/new`; `UXRA04-WHOLE` already existed.
- **Steps:** enter name `Duplikat A04`, manual SKU `UXRA04-WHOLE`, category `LNN`, price `9999`, whole `PIECE`, and no opening stock; submit once.
- **Evidence:** [`20` duplicate response](../evidence/uxr-a04/20-item-create-duplicate-conflict-wide.jpg).
- **Observed fact:** the request did not create a second item. All entered values remained present and the error alert received focus. The visible message was the generic `Terjadi kesalahan. Silakan coba lagi.` rather than identifying the duplicate SKU or a conflict-specific recovery.
- **Expected:** duplicate identity is distinct from validation and generic infrastructure failure, and correction does not require re-entering unrelated values.
- **Assessment:** mutation safety and value preservation are strong; conflict comprehension is weak (`ITEM-02`).
- **Priority:** `P2` (`ITEM-02`).

### A04-05 — Fractional create with STORE and WAREHOUSE opening balances

- **Purpose:** verify whole-unit rejection, fractional/UOM comprehension, Indonesian decimal entry acceptance, atomic opening-stock creation, pending, and server-visible balances.
- **Route and start:** `/items/new`.
- **Steps:** prepare manual SKU `UXRA04-FRAC`, name `Audit A04 Pecahan Terkunci`, category `PRT`, price `23456.75`, opening STORE `1,25`, opening WAREHOUSE `2.5001`, and description `Item audit pecahan dengan stok awal.` while the item was still whole-unit; submit; then select `METER`, enable fractional quantities, and activate `Buat barang` with the keyboard.
- **Evidence:** [`21` whole-unit rejection](../evidence/uxr-a04/21-item-create-whole-opening-validation-wide.jpg), [`22` fractional form](../evidence/uxr-a04/22-item-create-fractional-opening-ready-wide.jpg), [`23` literal pending](../evidence/uxr-a04/23-item-create-fractional-submit-wide.jpg), [`24` success return](../evidence/uxr-a04/24-item-create-fractional-success-wide.jpg), and [`25` filtered server row](../evidence/uxr-a04/25-item-fractional-filtered-wide.jpg).
- **Observed fact:** with fractional policy off, each non-whole opening field showed `Barang satuan utuh hanya menerima jumlah tanpa pecahan.`. Choosing Meter alone did not remove the errors; enabling `Izinkan jumlah pecahan` did. The pending frame disabled the form and changed the action to `Menyimpan...`.
- **Observed fact:** one item was created. The returned row showed `1,25 meter` in STORE and `2,5001 meter` in WAREHOUSE. No stock was entered or altered through any other workflow. The post-create success return again retained the lower form scroll and document-root focus.
- **Expected:** fractional policy gates decimal quantities, one create transaction produces the item and opening movements, and displayed balances come from the server result.
- **Assessment:** quantity policy, localization of quantities, authority, and pending behavior match. Result orientation is covered by `ITEM-01`.
- **Priority:** no additional finding.

### A04-06 — Movement lock, server audit trail, allowed metadata edit, and formatting

- **Purpose:** verify that opening movements lock UOM/fraction rules while leaving allowed metadata editable, and verify item/audit timestamps and read-only money/quantity formatting.
- **Route and start:** `UXRA04-FRAC` detail, item-scoped movement history, and `/items/UXRA04-FRAC/edit`.
- **Steps:** open detail with Enter; follow the stock-history link; inspect the two opening movements only; open edit; verify disabled UOM/fraction controls and absent stock fields; change name to `Audit A04 Pecahan Terkunci Diperbarui` and price to `24000.5`; submit with Enter.
- **Evidence:** [`26` locked detail](../evidence/uxr-a04/26-item-fractional-locked-detail-wide.jpg), [`27` opening audit trail](../evidence/uxr-a04/27-item-fractional-opening-audit-wide.jpg), [`28` locked edit](../evidence/uxr-a04/28-item-fractional-locked-edit-wide.jpg), [`29` allowed metadata ready](../evidence/uxr-a04/29-item-fractional-locked-metadata-ready-wide.jpg), [`30` return loading](../evidence/uxr-a04/30-item-fractional-edit-return-loading-wide.jpg), and [`31` update success](../evidence/uxr-a04/31-item-fractional-edit-success-wide.jpg).
- **Observed fact:** detail said fractional quantities were `Diizinkan`, movement was `Sudah ada`, and rules were `Terkunci karena sudah ada pergerakan stok`. The audit route showed exactly two `Masuk / Stok awal` rows: `Gudang +2,5001 meter` and `Toko +1,25 meter`, each from zero to the displayed after-balance and attributed to `admin`. No unrelated movement was created or opened.
- **Observed fact:** edit retained the original decimal price value, disabled `METER` and the checked fractional switch, and explained that changing historical quantity meaning would be ambiguous. Name and price remained editable; saving them did not change either balance.
- **Observed fact:** quantities used Indonesian decimal commas in read-only surfaces. Detail/audit dates used Indonesian weekday plus numeric day-month-year and time, for example `Minggu, 13-09-2026 20:34`. Money used `Rp` and Indonesian thousands punctuation, but the read-only list/detail rounded stored decimal prices: `23456.75` appeared as `Rp 23.457`, and after saving `24000.5` it appeared as `Rp 24.001`; re-entering edit still exposed the stored decimal value.
- **Expected:** stock history locks only authority-bearing rules, ordinary metadata remains editable, and read-only formatting communicates the stored value without silently changing visible precision.
- **Assessment:** movement lock and quantity/date presentation match. Money presentation hides submitted precision (`ITEM-05`).
- **Priority:** `P1` (`ITEM-05`).

### A04-07 — Narrow desktop layout

- **Purpose:** verify the implemented drawer breakpoint and whether identity, UOM, both locations, and row actions remain reachable together at 760×768.
- **Route and start:** list filtered by SKU `UXRA04`, fractional detail, and locked edit at the narrow override.
- **Steps:** apply 760×768; wait for the responsive shell; inspect both audit rows; open detail with Enter; open locked edit; measure the rendered page; restore the default viewport afterward.
- **Evidence:** [`32` narrow list](../evidence/uxr-a04/32-item-list-narrow-760x768.jpg), [`33` narrow detail](../evidence/uxr-a04/33-item-detail-narrow-760x768.jpg), and [`34` narrow locked edit](../evidence/uxr-a04/34-item-locked-edit-narrow-760x768.jpg).
- **Observed fact:** the back-office navigation collapsed behind the labelled `Buka navigasi back office` button. The detail modal and edit page fit the 760-pixel viewport and retained their content hierarchy.
- **Observed fact:** the list did not contain its wide table in a local, labelled scroller. A read-only DOM measurement at `window.innerWidth=760` found `document.body.scrollWidth=1195`; the raw frame shows a page-level horizontal scrollbar. At the initial left position, STORE is cut off and WAREHOUSE, status, and all four row actions are outside the viewport. The operator must pan the entire page to relate item identity to both location balances and actions.
- **Observed fact:** the same wide list also showed page-level horizontal scrolling in the nominal wide captures because the fixed navigation plus minimum-width table exceeded the available content width; result frames cut the action column offscreen.
- **Expected:** critical item identity, UOM, balances, and actions remain understandable and operable at the supported narrow-desktop layout without page-level two-dimensional panning.
- **Assessment:** detail/edit respond acceptably; list does not (`ITEM-03`).
- **Priority:** `P1` (`ITEM-03`).

### A04-08 — Deactivate semantics and cleanup

- **Purpose:** remove the two disposable items from active results while preserving the backend's deactivate behavior and verify final state.
- **Route and start:** narrow list filtered by SKU `UXRA04`.
- **Steps:** open the implemented item action for `UXRA04-WHOLE`; inspect and capture its confirmation; confirm; repeat for `UXRA04-FRAC`; wait for the filtered empty state.
- **Evidence:** [`35` confirmation](../evidence/uxr-a04/35-item-deactivate-misleading-confirmation-narrow-760x768.jpg), [`36` first result](../evidence/uxr-a04/36-item-first-deactivate-success-narrow-760x768.jpg), and [`37` cleanup verified](../evidence/uxr-a04/37-item-cleanup-filtered-empty-narrow-760x768.jpg).
- **Observed fact:** repository inspection establishes that the action sends `PATCH /api/items/{sku}` and the service marks the item inactive; it does not delete the item or its movement history. The active-only list then omits it.
- **Observed fact:** the frontend labels this action `Hapus`, asks `Hapus [item]?`, says `Jika dihapus, data barang tidak bisa dikembalikan lagi.`, and reports `[item] berhasil dihapus`. This is inconsistent with the backend's deactivate semantics and with the category workflow's explicit non-delete language.
- **Observed fact:** after confirming both audit items, the `UXRA04` filter settled on `Barang tidak ditemukan`. Seeded item rows were not changed. The inactive audit records and the two opening movements remain in the disposable database until its normal reseed.
- **Expected:** item cleanup reflects the actual state transition and does not claim irreversible deletion when the server deactivates.
- **Assessment:** cleanup succeeded and backend semantics were preserved; user-facing semantics are materially misleading (`ITEM-06`).
- **Priority:** `P1` (`ITEM-06`).

### A04-09 — Error-state implementation evidence and live limitation

- **Purpose:** separate live evidence from behavior established only by repository inspection.
- **Repository evidence:** the list, detail, create, and edit implementations include loading/error handling and retry or recovery paths. Focused tests cover several fetch/mutation failures. The unused `ItemAuditLogModal.jsx` should not be counted as an available live audit-log feature because it is not mounted by current item routes/components and targets an endpoint absent from the inspected backend.
- **Live result:** no item API outage was forced. Stopping the shared backend or intercepting requests would alter the working environment beyond the normal item workflow and could affect the user's other local work.
- **Assessment:** loading was captured live; generic create conflict was captured live; global list/detail/edit failure recovery remains repository evidence rather than a live claim.
- **Priority:** no product finding from the unforced paths; limitation remains explicit.

## Findings

| ID | Priority | Classification | Finding |
| --- | --- | --- | --- |
| ITEM-01 | P1 | Evidence + inference | Blank create validation leaves focus on the submit button while the invalid name is above the retained scroll position. Create and edit success return to a list whose notice and changed row are offscreen and whose focus is the document root. Keyboard and low-vision users can receive no visible confirmation that the action failed or succeeded. |
| ITEM-02 | P2 | Evidence + inference | A duplicate SKU is safely rejected and input is preserved, but the focused alert only says `Terjadi kesalahan. Silakan coba lagi.`. It does not identify the duplicate identifier or distinguish conflict from a retryable system failure. |
| ITEM-03 | P1 | Evidence + measurement | The item table creates page-level horizontal overflow (1195-pixel body at a 760-pixel viewport). STORE is already clipped at the initial position; WAREHOUSE, status, and actions are offscreen, and the entire page must be panned. Wide frames also clip actions because the navigation plus table exceeds available width. |
| ITEM-04 | P2 | Accessibility evidence | The barcode dialog's close icon has no accessible name, unlike the correctly labelled item-detail close button. The dialog still supports Escape, but assistive technology cannot identify the visible close control. |
| ITEM-05 | P1 | Evidence + inference | Create/edit accepts and retains up to four decimal places for price, but list/detail money formatting rounds the stored values (`23456.75` → `Rp 23.457`; `24000.5` → `Rp 24.001`). Operators cannot verify the exact saved price from read-only surfaces. |
| ITEM-06 | P1 | Contract evidence + live evidence | The item action and confirmation claim irreversible deletion (`Hapus`, `tidak bisa dikembalikan lagi`, `berhasil dihapus`) while the backend performs deactivation. This misstates data retention and the actual lifecycle transition. |

No `P0` finding was observed. Opening stock was created only through the disposable item create flow; stock values were never edited directly or changed through any unrelated workflow.

## Preserved strengths

- STORE and WAREHOUSE are named separately in list, detail, create, audit, and edit guidance.
- Every displayed quantity carries its UOM; Indonesian decimal commas are used on read-only quantities.
- The create form clearly states that blank opening values mean zero and positive values create `OPENING_BALANCE` movements in one transaction.
- Whole-unit validation is specific and shown separately for each location.
- Both create runs exposed a literal disabled `Menyimpan...` pending state.
- A no-opening-stock item remained movement-free and editable; the opening-stock item immediately became movement-locked.
- The locked edit explanation gives the historical-meaning rationale, and no direct stock control appears in item edit.
- The item-scoped audit entry preserves the SKU filter and showed the two server movements with locations, before/after balances, actor, and Indonesian timestamps.
- Row detail is keyboard-openable with Enter and returns focus to the row; the detail modal's close button is labelled.
- Duplicate conflict preserved every entered value and did not create a second record.
- Narrow detail and edit layouts fit without body-level horizontal overflow.

## Recommendations for design work

These are audit recommendations, not approved requirements or implementation work:

1. Define a consistent invalid-submit and post-success focus/scroll contract: focus the first invalid field; after success, expose the alert and changed row without preserving an unrelated lower-form scroll position.
2. Map the server's duplicate-SKU conflict to specific Indonesian copy that names the SKU and correction, while preserving the current input-retention behavior.
3. Contain the item table inside an intentional, labelled horizontal region or approve a narrow information/action presentation that keeps both stock locations and actions discoverable. Do not remove location or UOM context merely to reduce width.
4. Give the barcode modal close button the same accessible naming treatment as the detail modal.
5. Decide and document whether item prices are whole Rupiah or decimal-capable. If decimals remain valid in the backend/form, read-only money formatting must expose the stored precision rather than silently round it.
6. Align item lifecycle copy with the actual backend transition: deactivate/inactive, retained data, and any real reactivation limitation. Do not change the backend semantics under a UI-only recommendation.

## Owner decisions needed

1. Choose the canonical focus target after create/edit success and whether the list should automatically reveal the changed row.
2. Confirm the supported store-laptop viewport and display scaling; 760×768 is the audited application breakpoint, not a claim about deployed hardware.
3. Confirm the product contract for decimal item prices. The present backend/form accepts them while read-only Rupiah output rounds them.
4. Confirm item reactivation policy. The current server deactivates records, but no reactivation workflow was found; the audit does not invent one.
5. Decide whether the existing unused `ItemAuditLogModal.jsx` should be removed or brought into a future backend-approved audit feature. It is not a current live entry point.

## State-changing test actions and cleanup

| Time (Asia/Jakarta) | Action | Input | Server/UI result | Stock effect and cleanup |
| --- | --- | --- | --- | --- |
| 20:28 | Created disposable whole-unit item | `sku=UXRA04-WHOLE`; `name=Audit A04 Utuh Tanpa Stok`; `category=LNN`; `price=12500`; `UOM=PIECE`; fractional off; STORE/Warehouse blank | One active item created; success returned | Both balances `0`; no movement created; retained temporarily |
| 20:30 | Updated unlocked whole-unit item metadata/rules | Name → `Audit A04 Utuh Diperbarui`; UOM `PIECE` → `LITER`; fractional remained off | Update succeeded; item remained movement-free/unlocked | No balance change and no movement |
| 20:32 | Submitted duplicate create | Existing `sku=UXRA04-WHOLE`; `name=Duplikat A04`; category `LNN`; price `9999`; no opening stock | Generic error alert; input preserved; no second item | No stock effect; no cleanup required |
| 20:34 | Submitted invalid whole-unit opening candidate | `UXRA04-FRAC` candidate with STORE `1,25`, WAREHOUSE `2.5001`, fractional off | Client validation rejected both opening fields; no request-created item | No stock effect; values corrected in-place |
| 20:34 | Created disposable fractional item with opening stock | `sku=UXRA04-FRAC`; `name=Audit A04 Pecahan Terkunci`; `category=PRT`; `price=23456.75`; `UOM=METER`; fractional on; STORE `1,25`; WAREHOUSE `2.5001` | One active item created atomically; two server opening movements; rules locked | Authorized create-flow stock only: STORE `1,25 meter`; WAREHOUSE `2,5001 meter` |
| 20:35 | Updated movement-locked item metadata | Name → `Audit A04 Pecahan Terkunci Diperbarui`; price → `24000.5`; UOM/fraction controls remained disabled | Update succeeded | No balance or movement change |
| 20:37 | Deactivated disposable whole-unit item | `UXRA04-WHOLE` through implemented list action | Removed from active list; UI called it deleted | Final cleanup for whole item; inactive record remains; no stock effect |
| 20:37 | Deactivated disposable fractional item | `UXRA04-FRAC` through implemented list action | Removed from active list; filtered result became empty | Final cleanup for fractional item; inactive record and its two opening movements remain until reseed |

No seeded item was edited or deactivated. No sale, receipt, adjustment, transfer, manual stock edit, or direct backend data mutation was performed. Barcode printing was not invoked. The environment can be returned to a pristine baseline with its normal reseed process; no unsupported reactivation or delete operation was attempted.

## Limitations

- A globally empty active-item database was not created; the safe filtered-empty state was used instead.
- Live global list/detail/edit failures were not forced because interrupting or intercepting the shared local services could affect other work. Their existence is repository evidence only.
- The duplicate response is observed as a generic error; network status/body was not instrumented in the browser, so the report does not claim the exact live HTTP payload beyond repository-defined conflict behavior.
- The current item-scoped stock-movement page was inspected only far enough to verify the item's entry point and the two opening movements. The stock-movement domain itself was not audited.
- The barcode modal was opened and closed, but browser print preview, printer selection, paper output, and scanner readability were not tested.
- Browser version, Windows display scaling, physical keyboard characteristics, and real store hardware were unavailable.
- Keyboard checks used browser automation rather than a physical store keyboard.
- Deactivation cleanup leaves inactive records and their movement history in the disposable database by design; no direct deletion was performed.

## Evidence index

- List/loading/empty: [`01`](../evidence/uxr-a04/01-item-list-wide.jpg)–[`03`](../evidence/uxr-a04/03-item-list-filtered-empty-wide.jpg).
- Whole create, validation, keyboard, pending, and success: [`04`](../evidence/uxr-a04/04-item-create-route-entry-wide.jpg)–[`09`](../evidence/uxr-a04/09-item-create-whole-success-wide.jpg).
- Whole detail/barcode/audit/unlocked edit: [`10`](../evidence/uxr-a04/10-item-whole-filter-route-loading-wide.jpg)–[`19`](../evidence/uxr-a04/19-item-whole-edit-submit-wide.jpg).
- Duplicate conflict: [`20`](../evidence/uxr-a04/20-item-create-duplicate-conflict-wide.jpg).
- Fractional validation/create/pending/success: [`21`](../evidence/uxr-a04/21-item-create-whole-opening-validation-wide.jpg)–[`25`](../evidence/uxr-a04/25-item-fractional-filtered-wide.jpg).
- Locked detail, opening audit, and allowed metadata edit: [`26`](../evidence/uxr-a04/26-item-fractional-locked-detail-wide.jpg)–[`31`](../evidence/uxr-a04/31-item-fractional-edit-success-wide.jpg).
- Narrow list/detail/edit: [`32`](../evidence/uxr-a04/32-item-list-narrow-760x768.jpg)–[`34`](../evidence/uxr-a04/34-item-locked-edit-narrow-760x768.jpg).
- Deactivate semantics and cleanup: [`35`](../evidence/uxr-a04/35-item-deactivate-misleading-confirmation-narrow-760x768.jpg)–[`37`](../evidence/uxr-a04/37-item-cleanup-filtered-empty-narrow-760x768.jpg).

The raw sequence intentionally retains route-loading, request-pending, and offscreen-result frames. Those frames are part of the UX evidence: they show what the operator actually sees during transitions and where viewport/focus continuity fails.
