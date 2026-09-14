# UXR-A03 — Item-category workflow

Status: `EVIDENCE_COMPLETE`  
Execution: read-only repository audit plus live UX audit with recorded disposable-data mutations  
Audit date: 2026-09-13  
Environment: local Bloom frontend (`http://localhost:5173`) and local backend (`http://localhost:8080`), using the documented local `admin` fixture account  
Browser: Codex in-app browser (Chromium-based; exact version unavailable)  
Viewports: nominal 1280×720 wide setup and 760×768 narrow override. Raw captures 01–16 are 1265×712 because the browser capture surface excluded its chrome/scrollbar area; capture 17 is 1280×720 and captures 18–27 are 760×768.

## Scope and method

This audit covered the implemented active-category list, list and route loading, a safely filtered empty result, create, required-field validation, duplicate-code conflict, edit, immutable code, deactivate confirmation for categories with and without linked active items, success, pending/duplicate prevention, keyboard focus, Indonesian date presentation, and the 760-pixel narrow-desktop layout. It did not enter or audit item master data.

Before the live work, the audit read `AGENTS.md`, the Release 1 frontend contract, frontend roadmap, UX rework roadmap, the item-category API/store/constants/pages/tests, and the matching backend controller, filter/create/update request DTOs and validation, response DTO, mapper, domain model, service interface/implementation, specification, and seed migrations. Repository inspection was read-only. No application, backend, dependency, configuration, route, or test file was changed.

The backend Release 1 contract is authoritative here:

- the list requests active categories only and supports code/name filtering plus paging;
- create accepts `code`, `name`, and `description`, with non-blank code/name and a unique code;
- update accepts only `name` and `description`; the category code is immutable;
- `PATCH /api/item-categories/{code}` deactivates rather than deletes;
- deactivating a category also deactivates its linked items, so the UI requests the active linked-item count before confirmation;
- there is no category-reactivation workflow in the current application.

The live audit used one uniquely named disposable category, `UXRA03`. The category was created, updated, conflict-tested, and finally deactivated. A referenced seed category (`BB`, `Bahan Bangunan`) was inspected only through its confirmation and then canceled; its two linked active items were not changed. All live screenshots are raw browser-native JPEGs under [`docs/ux/evidence/uxr-a03`](../evidence/uxr-a03/).

## Scenario evidence

### A03-01 — Active list, loading, search, and safe empty result

- **Purpose:** verify the implemented list and distinguish unresolved, populated, and no-match states without deactivating seed data.
- **Route and start:** `/item-categories`; active seed categories `BB`, `PRT`, and `LNN` present.
- **Steps:** load the list; enter the unmatched code search `UXR_A03_NO_MATCH`; observe the request transition and settled result; clear the filter.
- **Evidence:** [`01` populated list](../evidence/uxr-a03/01-item-category-list-wide-1265x712.jpg), [`02` loading](../evidence/uxr-a03/02-item-category-search-loading-wide-1265x712.jpg), and [`03` filtered empty](../evidence/uxr-a03/03-item-category-search-empty-wide-1265x712.jpg).
- **Observed fact:** the in-flight table showed `Memuat kategori...` and disabled pagination. The settled no-match state said `Kategori tidak ditemukan` and `Ubah atau hapus filter untuk mencoba lagi.`, with an inline `Hapus filter` action. The populated list exposed code, name, update provenance, edit, and deactivate columns/actions.
- **Expected:** loading must not look empty, and an empty filtered result must explain how to recover without implying that all category data is absent.
- **Assessment:** matches the implemented contract. A true globally empty active-category database was not created because doing so would have required deactivating referenced seed categories and their items.
- **Priority:** no finding.

### A03-02 — Create form, validation, keyboard flow, and success

- **Purpose:** create one disposable category while checking route loading, required fields, focus, keyboard order, pending, and the returned list row.
- **Route and start:** `/item-categories/new`.
- **Steps:** enter by the `Buat baru` link; submit the empty form; fill code `UXRA03`, name `Audit kategori A03`, and description `Data audit sementara; aman dinonaktifkan.`; Tab to the submit action and activate it.
- **Evidence:** [`04` route loading](../evidence/uxr-a03/04-item-category-create-route-loading-wide-1265x712.jpg), [`05` empty form](../evidence/uxr-a03/05-item-category-create-empty-wide-1265x712.jpg), [`06` validation/focus](../evidence/uxr-a03/06-item-category-create-validation-focus-wide-1265x712.jpg), [`07` keyboard-ready](../evidence/uxr-a03/07-item-category-create-ready-keyboard-wide-1265x712.jpg), and consecutive settled result frames [`08`](../evidence/uxr-a03/08-item-category-create-submit-result-wide-1265x712.jpg) and [`09`](../evidence/uxr-a03/09-item-category-create-success-wide-1265x712.jpg).
- **Observed fact:** the blank form rendered `Kode kategori wajib diisi.` and `Nama kategori wajib diisi.` and moved focus to `Nama kategori`. The filled form could be submitted using Tab and Enter. During the live request, the fields/action became disabled and the action announced `Menyimpan...`; the local response settled before that transient state could be preserved in a raw JPEG. Success returned to the active list, showed `Kategori [UXRA03] berhasil dibuat.`, and rendered the server row with actor `admin` and `Minggu, 13-09-2026 18:55`.
- **Expected:** validation identifies required fields, keyboard submission is complete, one request is allowed while pending, and success displays the server result.
- **Assessment:** validation, pending protection, mutation, Indonesian day/date formatting, and visible success matched the current implementation. After navigation, programmatic focus was at the document root rather than the success notice, page heading, or created row.
- **Priority:** `P2` for focus continuity (`CAT-01`).
- **Classification:** focus location and rendered states are observed facts; the orientation impact is reviewer inference.

### A03-03 — Duplicate-code conflict and preserved input

- **Purpose:** verify a server conflict without creating a second category or losing operator input.
- **Route and start:** `/item-categories/new`; `UXRA03` already existed.
- **Steps:** enter code `UXRA03`, name `Duplikat kategori A03`, and description `Nilai ini harus dipertahankan setelah konflik.`; rapidly activate create twice.
- **Evidence:** [`10` prepared duplicate](../evidence/uxr-a03/10-item-category-duplicate-ready-wide-1265x712.jpg) and [`11` conflict](../evidence/uxr-a03/11-item-category-duplicate-submit-state-wide-1265x712.jpg).
- **Observed fact:** the server conflict was normalized to `Kode kategori [UXRA03] sudah digunakan. Gunakan kode lain.`. The error alert received focus, all three entered values remained available, and no second active row was created.
- **Expected:** conflict is distinct from validation and generic failure, duplicate activation cannot create duplicate data, and correction does not require retyping unrelated values.
- **Assessment:** matches the current contract and is a strong recovery state.
- **Priority:** no finding.

### A03-04 — Edit, immutable code, validation, keyboard flow, and success

- **Purpose:** verify that edit respects the backend identifier contract and updates only mutable fields.
- **Route and start:** `/item-categories/UXRA03/edit`.
- **Steps:** load the edit form; clear the name and submit; restore a valid name; change the name to `Audit kategori A03 diperbarui` and description to `Diperbarui selama audit; kategori tetap disposable.`; Tab to and activate `Simpan perubahan`.
- **Evidence:** [`13` loaded edit](../evidence/uxr-a03/13-item-category-edit-wide-1265x712.jpg), [`14` validation and immutable code](../evidence/uxr-a03/14-item-category-edit-validation-code-immutable-wide-1265x712.jpg), [`15` keyboard-ready](../evidence/uxr-a03/15-item-category-edit-ready-keyboard-wide-1265x712.jpg), and [`16` success](../evidence/uxr-a03/16-item-category-edit-success-wide-1265x712.jpg).
- **Observed fact:** `Kode kategori: UXRA03` was rendered as text, not an editable field. An empty name showed `Nama kategori wajib diisi.`. In this edit run the submit button retained keyboard focus after the invalid submit, unlike create validation, which focused the invalid name. The valid update succeeded, retained code `UXRA03`, returned to the list, and showed `Kategori [UXRA03] berhasil diperbarui.` with `Minggu, 13-09-2026 19:33`.
- **Observed fact:** an earlier automation attempt to clear the controlled name with a programmatic fill did not change the field; submitting that unchanged form produced a successful no-op update at 18:55. It is recorded as a state-changing request below rather than silently omitted.
- **Expected:** code stays immutable, invalid input identifies and focuses the field, pending prevents a second update, and success reflects the server response.
- **Assessment:** identifier and update semantics match the backend. The edit validation and post-success focus behavior are inconsistent with the otherwise stronger create/conflict/deactivate focus handling.
- **Priority:** `P2` (`CAT-01`).
- **Classification:** the focus states and immutable code are observed facts; the usability impact is reviewer inference.

### A03-05 — Referenced-category confirmation and safe cancel

- **Purpose:** inspect the backend-preserving deactivate semantics without changing seeded item data.
- **Route and start:** active list; seed category `BB` (`Bahan Bangunan`) with two active linked items.
- **Steps:** activate `Nonaktifkan kategori Bahan Bangunan`; wait for the item-count request; read the confirmation; press Enter on the initially focused `Batal` action.
- **Evidence:** [`17` referenced confirmation](../evidence/uxr-a03/17-item-category-deactivate-referenced-confirmation-wide-1280x720.jpg).
- **Observed fact:** the dialog stated that the category would stop appearing in the active list, that `2 barang aktif` in the category would also be deactivated, and that data would not be deleted. It also warned that reactivation is unavailable in the current application. Initial focus was on `Batal`; Enter closed the dialog and focus returned to the originating `Nonaktifkan kategori Bahan Bangunan` button.
- **Expected:** the confirmation must describe the consequential cascade, avoid delete language, favor cancellation, and return focus safely.
- **Assessment:** matches and clearly preserves the backend's deactivate semantics. No `BB` or item mutation occurred.
- **Priority:** no finding.

### A03-06 — Disposable deactivation, success, and cleanup verification

- **Purpose:** complete the implemented deactivate flow on unreferenced audit data and verify its durable absence from the active list.
- **Route and start:** list filtered by code `UXRA03`; active linked-item count was zero.
- **Steps:** open its confirmation at 760×768; Tab from `Batal` to `Nonaktifkan`; activate with Enter; inspect success and filtered empty state; reload; clear the filter and verify seed rows.
- **Evidence:** [`22` confirmation](../evidence/uxr-a03/22-item-category-deactivate-unreferenced-confirmation-narrow-760x768.jpg), [`23` destructive-action focus](../evidence/uxr-a03/23-item-category-deactivate-confirm-focus-narrow-760x768.jpg), [`24` success/empty result](../evidence/uxr-a03/24-item-category-deactivate-result-narrow-760x768.jpg), [`25` reload transition](../evidence/uxr-a03/25-item-category-cleanup-reload-loading-narrow-760x768.jpg), [`26` durable filtered empty](../evidence/uxr-a03/26-item-category-cleanup-verified-empty-narrow-760x768.jpg), and [`27` surviving seed list](../evidence/uxr-a03/27-item-category-cleanup-seed-list-narrow-760x768.jpg).
- **Observed fact:** with no linked active items, the dialog omitted the cascade-count sentence but retained the non-delete/no-reactivation warning. Keyboard traversal reached `Nonaktifkan`. The server success said `[Audit kategori A03 diperbarui] berhasil dinonaktifkan`; focus moved to the page heading, the filtered list showed `Kategori tidak ditemukan`, and the same empty result persisted after reload. Clearing the filter showed `BB`, `PRT`, and `LNN` still active.
- **Expected:** deactivation performs one recoverable-by-reseed mutation, removes only the target from active results, and leaves the operator in a clear, focused success state.
- **Assessment:** matches the current backend and frontend contract. Cleanup was deactivation, not deletion; the inactive audit record remains in the disposable database because no delete or reactivation UI exists.
- **Priority:** no finding.

### A03-07 — Error-state implementation evidence and live limitation

- **Purpose:** distinguish safe live evidence from behavior established only by repository inspection.
- **Repository evidence:** `ItemCategoryList.jsx` has a list-load error alert with `Coba lagi`, suppresses stale rows while failed, and has a separate item-count error alert with `Coba lagi hitung jumlah`. `ItemCategoryUpsert.jsx` has an edit-load error alert and `Coba lagi`. Focus calls and focused tests cover the alerts/retry paths.
- **Live result:** no category API failure was forced. Interrupting the shared backend or intercepting a request would change the local environment beyond a normal workflow and could affect other running work. A local authentication expiry occurred during the audit and was recovered by logging back in, but it is not counted as item-category error evidence.
- **Assessment:** error/retry UI is implemented and test-backed, but this audit does not claim a live error capture.
- **Priority:** no product finding; evidence limitation remains explicit.
- **Classification:** repository fact, not live evidence.

### A03-08 — Narrow desktop and update provenance

- **Purpose:** verify that the list, edit form, and confirmation remain readable and keyboard-operable at the implemented drawer breakpoint.
- **Route and start:** list and edit at 760×768.
- **Steps:** apply the viewport override; allow the responsive shell transition to settle; inspect the list and edit form; exercise the confirmation sequence described above.
- **Evidence:** [`18` shell transition](../evidence/uxr-a03/18-item-category-list-narrow-transition-760x768.jpg), [`19` settled list](../evidence/uxr-a03/19-item-category-list-narrow-settled-760x768.jpg), [`20` edit route loading](../evidence/uxr-a03/20-item-category-edit-route-loading-narrow-760x768.jpg), and [`21` settled edit](../evidence/uxr-a03/21-item-category-edit-narrow-settled-760x768.jpg).
- **Observed fact:** the back-office sidebar collapsed behind the labelled navigation toggle. The filter, five-column table, edit/deactivate actions, form fields, and modal actions fit without horizontal scrolling; a DOM measurement found the table container and content both 728 pixels wide. The audit row displayed `admin` and `Minggu, 13-09-2026 19:33`. Seed rows left `Diperbarui oleh` and `Diperbarui pada` blank because their response fields were null.
- **Expected:** critical category identity/actions remain usable at narrow desktop, and unavailable provenance is not mistaken for hidden or failed data.
- **Assessment:** the layout remained usable and did not clip actions. Blank audit cells provide no visible explanation of whether a seed record has never been updated or the data failed to load.
- **Priority:** `P2` for ambiguous missing provenance (`CAT-02`).
- **Classification:** blank response/rendering is observed evidence; the ambiguity is reviewer inference.

## Findings

| ID | Priority | Classification | Finding |
| --- | --- | --- | --- |
| CAT-01 | P2 | Evidence + inference | Focus management is inconsistent across equivalent maintenance outcomes: create validation focuses the invalid name and conflict focuses its alert, while edit validation retained focus on submit; create/edit success returned focus to the document root, while deactivate success focused the list heading. This weakens keyboard orientation after a result. |
| CAT-02 | P2 | Evidence + inference | Seed categories render empty `Diperbarui oleh` and `Diperbarui pada` cells when backend fields are null. The layout is intact, but the empty cells do not distinguish “never updated / unavailable” from a rendering or loading problem. |

No `P0` or `P1` finding was observed. Duplicate creation did not create a second record, code remained immutable, the referenced-category warning exposed the two-item cascade before any mutation, cancellation restored focus, and only the disposable category was deactivated.

## Preserved strengths

- Loading, populated, filtered-empty, validation, conflict, success, and confirmation states use distinct copy.
- Required create fields have specific Indonesian messages; conflict preserves every entered value and focuses the alert.
- The category code is stable after creation and is not presented as editable.
- Deactivation is never described as deletion. The confirmation explicitly states active-list removal, linked-item consequences when non-zero, retained data, and the lack of current reactivation.
- `Batal` is the initial confirmation focus; cancel returns focus to the trigger, and keyboard users can reach and activate the destructive action deliberately.
- The active-item count is server-requested before confirmation rather than inferred from the visible category list.
- Indonesian update timestamps include an Indonesian weekday and unambiguous numeric date/time.
- At 760×768, the list, form, dialog copy, and actions remain available without horizontal scrolling.

## Inferences for design work

These are audit recommendations, not approved requirements or implementation work:

1. Make invalid-submit focus behavior consistent between create and edit, and choose a deliberate post-success destination such as the success notice, page heading, or changed row.
2. Render a short explicit fallback for null update provenance, such as an approved “Belum diperbarui” treatment, without inventing an actor or timestamp.
3. Preserve the existing deactivate copy hierarchy and server item-count check in any later visual change; do not turn this flow into delete or imply that reactivation already exists.

## Owner decisions needed

1. Choose the canonical focus target after create/edit success and confirm whether the changed row should be focused when the list is filtered.
2. Approve the wording for null update provenance and decide whether creation provenance should ever be shown instead; the current response does not justify inventing replacement values in the browser.
3. Confirm whether product policy should eventually support reactivation. That would require an explicit backend/product decision and is outside this audit; current UI copy correctly says it is unavailable.
4. Confirm the real store-laptop viewport and display scaling. The audited 760×768 size is the current drawer breakpoint, not a claim about production hardware.

## State-changing test actions and cleanup

| Time (Asia/Jakarta) | Action | Input | Server/UI result | Cleanup/disposition |
| --- | --- | --- | --- | --- |
| 18:55 | Created disposable category | `code=UXRA03`; `name=Audit kategori A03`; `description=Data audit sementara; aman dinonaktifkan.` | One active row created; actor `admin`; success shown | Retained temporarily for edit/conflict/deactivate scenarios |
| 18:55 | Submitted duplicate create twice rapidly | Existing code `UXRA03`; name `Duplikat kategori A03`; description `Nilai ini harus dipertahankan setelah konflik.` | Unique-code conflict; inputs preserved; no additional record | No cleanup required |
| 18:55 | Submitted an unchanged edit after a programmatic clear probe did not alter the controlled name field | Original name and description remained present | Successful no-op update request; same business values retained; audit timestamp may have advanced | Superseded by the deliberate edit below |
| 19:33 | Updated disposable category | `name=Audit kategori A03 diperbarui`; `description=Diperbarui selama audit; kategori tetap disposable.`; code remained `UXRA03` | One successful update; actor `admin`; server row displayed | Retained temporarily for deactivate scenario |
| 19:33 | Opened referenced `BB` deactivate confirmation and canceled with Enter | Server count displayed `2 barang aktif` | Dialog closed; focus returned to `BB` trigger; no mutation | `BB` and its linked items remained active |
| 19:36 | Deactivated disposable category | `UXRA03`, zero linked active items | Success shown; category absent from active filtered list | Final cleanup: record remains inactive in disposable DB; no delete/reactivation operation exists |
| 19:37 | Reloaded filtered list and cleared filter | Search `UXRA03`, then empty search | `UXRA03` remained absent; `BB`, `PRT`, and `LNN` remained active | Cleanup verified; no further mutation |

No item was opened, edited, created, sold, received, adjusted, transferred, or otherwise changed. No reseed was required; if a pristine database is desired later, use the environment's normal reseed process rather than attempting to reactivate through an unsupported UI.

## Limitations

- A globally empty active-category database was not created because it would require deactivating seed categories and could cascade to seeded items. The filtered-empty state was reproduced safely instead.
- Live list, edit-load, and item-count failures were not forced. Their current error/retry states are established by component and focused-test inspection only.
- Create/update/deactivate responses were fast. The create pending state was observed in the accessibility state (`Menyimpan...` with disabled controls), but the raw image call settled on success; a literal pending JPEG is therefore not claimed. Deactivate also settled before a pending frame could be preserved.
- The browser session expired once during the long audit and was reauthenticated with the same local fixture account. This is not treated as item-category error evidence.
- Browser version, Windows display scaling, physical keyboard characteristics, and the actual store-laptop viewport were unavailable.
- Keyboard checks used browser automation rather than a physical store keyboard.
- This audit did not inspect item master pages or test category behavior through item maintenance.

## Evidence index

- List, loading, and safe empty: [`01`](../evidence/uxr-a03/01-item-category-list-wide-1265x712.jpg), [`02`](../evidence/uxr-a03/02-item-category-search-loading-wide-1265x712.jpg), [`03`](../evidence/uxr-a03/03-item-category-search-empty-wide-1265x712.jpg).
- Create and validation: [`04`](../evidence/uxr-a03/04-item-category-create-route-loading-wide-1265x712.jpg) through [`09`](../evidence/uxr-a03/09-item-category-create-success-wide-1265x712.jpg).
- Duplicate conflict: [`10`](../evidence/uxr-a03/10-item-category-duplicate-ready-wide-1265x712.jpg), [`11`](../evidence/uxr-a03/11-item-category-duplicate-submit-state-wide-1265x712.jpg).
- Created row and edit: [`12`](../evidence/uxr-a03/12-item-category-filtered-created-wide-1265x712.jpg) through [`16`](../evidence/uxr-a03/16-item-category-edit-success-wide-1265x712.jpg).
- Referenced-category confirmation: [`17`](../evidence/uxr-a03/17-item-category-deactivate-referenced-confirmation-wide-1280x720.jpg).
- Narrow list/edit: [`18`](../evidence/uxr-a03/18-item-category-list-narrow-transition-760x768.jpg) through [`21`](../evidence/uxr-a03/21-item-category-edit-narrow-settled-760x768.jpg).
- Disposable deactivate and cleanup: [`22`](../evidence/uxr-a03/22-item-category-deactivate-unreferenced-confirmation-narrow-760x768.jpg) through [`27`](../evidence/uxr-a03/27-item-category-cleanup-seed-list-narrow-760x768.jpg).

The transition frames are retained instead of selecting only settled screenshots. This preserves the raw audit sequence and makes route/reload timing inspectable.
