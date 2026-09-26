# UXR-A07 — Stock transfer

Status: `EVIDENCE_COMPLETE` — live audit, report, screenshots, tests, and disposable-fixture cleanup complete  
Execution: repository review plus live transactional UX audit on disposable local data  
Audit date: 2026-09-24  
Environment: local Bloom frontend (`http://localhost:5173`) and backend (`http://localhost:8080`), using the existing local `admin` session  
Browser: Codex in-app browser (Chromium-based; exact version unavailable)  
Viewports: default wide browser surface (`1610×1270`), `760×768`, and the `768×768` responsive boundary

## Scope and method

This audit covered the implemented single-item stock-transfer workflow: item discovery, source/destination meaning and swap, identical-location prevention, advisory source stock, whole/fractional quantity policy, validation, confirmation, pending implementation, backend rejection, server-confirmed success reference, keyboard/focus, movement traceability, and responsive layout. It did not introduce multi-item/approval concepts, calculate stock in the browser, audit adjustments, force an ambiguous network result, alter application code, or change dependencies.

Before live work, the audit read `AGENTS.md`, the frontend contract and roadmaps, UXR-A05/UXR-A06 evidence relevant to movement history and stock mutation, the transfer page/store/API/tests, and the backend controller, create/filter/line request DTOs, response DTOs, service, and validation behavior. Backend stock availability, atomic movement booking, idempotency, and stored results remain authoritative.

Two disposable items were created through the implemented item workflow:

- `UXRA07-WHOLE` — whole-unit `pcs`, opening stock STORE `8`, WAREHOUSE `12`;
- `UXRA07-FRAC` — fractional `meter`, opening stock STORE `5,5`, WAREHOUSE `3,25`.

Two transfers were posted:

- `ST/IX-2026/0001`: `UXRA07-WHOLE`, WAREHOUSE→STORE, `2 pcs`;
- `ST/IX-2026/0002`: `UXRA07-FRAC`, STORE→WAREHOUSE, `0,75 meter`.

The server-refreshed final balances and paired movement records matched both requests. A deterministic `999 pcs` insufficient-stock attempt was rejected and created no record. After explicit owner confirmation, both disposable items were deactivated through Bloom's `Hapus` action; their transfer and movement audit records remained readable.

The complete evidence index and 33 persistent PNGs are in [`docs/ux/evidence/uxr-a07/README.md`](../evidence/uxr-a07/README.md).

## Scenario evidence

### A07-01 — Empty form, discovery, and required focus

- **Purpose:** determine whether the operator can start a transfer and find an active material efficiently.
- **Route and start:** `/stock-transfers/new`; nine active items including both fixtures.
- **Steps:** inspect the empty form, submit without item/quantity, inspect focus, then open the item picker.
- **Evidence:** A07-E02 and A07-E03.
- **Observed fact:** the default direction is WAREHOUSE→STORE. Blank review exposed item and quantity errors and focused the item combobox.
- **Observed fact:** item discovery is a single SKU/name select containing one backend page requested with `size: 2000`. It has no search, recent items, category context, incremental results, or all-page traversal (`TRANSFER-04`).
- **Expected:** required input is focused and active items remain discoverable as the material catalog grows.
- **Assessment:** validation focus is good. The picker and hidden 2,000-item ceiling are unsuitable as the catalog grows.
- **Priority:** `P1` (`TRANSFER-04`).

### A07-02 — Direction, swap, and identical-location prevention

- **Purpose:** verify that source and destination cannot become ambiguous or equal.
- **Route and start:** selected `UXRA07-WHOLE`; WAREHOUSE→STORE.
- **Steps:** inspect advisory balances, invoke `Tukar`, then change the destination explicitly.
- **Evidence:** A07-E04.
- **Observed fact:** swap exchanged both locations. Selecting either location automatically set the other side to its opposite, so normal UI interaction could not produce STORE→STORE or WAREHOUSE→WAREHOUSE.
- **Observed fact:** source helper copy updated to the selected source balance. The visible arrow icon, `Tukar` label, and explicit `Lokasi asal`/`Lokasi tujuan` labels kept direction understandable without color.
- **Expected:** source/destination remain distinct and unambiguous throughout form and confirmation.
- **Assessment:** this interaction is strong and should be preserved.
- **Priority:** no finding.

### A07-03 — Whole and fractional quantity policy

- **Purpose:** verify item-specific UOM/fraction policy without client stock calculation.
- **Route and start:** each fixture selected in turn.
- **Steps:** enter `1,5` for the whole-unit item; enter `0,12345` and then `0,75` for the fractional item.
- **Evidence:** A07-E05.
- **Observed fact:** the whole-unit error said `Barang ini hanya dapat dipindahkan dalam jumlah utuh.` and focused quantity. Five fractional digits produced `Maksimal 4 angka di belakang tanda desimal.` Comma-decimal `0,75` was accepted and sent as an exact decimal string.
- **Expected:** invalid quantities are blocked before confirmation while the server remains authoritative for availability.
- **Assessment:** the quantity interaction matches the backend policy and is clear.
- **Priority:** no finding.

### A07-04 — Confirmation, pending contract, and whole-unit success

- **Purpose:** verify the exact transfer intent, keyboard safety, duplicate blocking, and backend-confirmed outcome.
- **Route and start:** `UXRA07-WHOLE`, WAREHOUSE `12`, STORE `8`.
- **Steps:** prepare `2 pcs`; open confirmation; inspect initial focus; press Escape; verify returned focus; reopen and submit.
- **Evidence:** A07-E06 plus screenshots `11`–`15`.
- **Observed fact:** confirmation clearly repeated quantity and WAREHOUSE→STORE, explained that the server would check stock and atomically record both movements, focused `Batal`, and restored focus to `Tinjau transfer` after Escape.
- **Observed fact:** confirmation did not state the selected item/SKU or optional description. Those facts remained dimly visible behind the modal but were not part of its frozen summary (`TRANSFER-02`).
- **Observed fact:** the local POST settled before a pending image could be retained. Source and tests disable form/modal actions and change the label to `Memindahkan...`, preventing duplicate local submission.
- **Observed fact:** the server created `ST/IX-2026/0001`; refreshed item data showed STORE `10` and WAREHOUSE `10`. The success alert repeated reference, quantity, item name, and direction.
- **Expected:** the complete exact request is reviewable, one POST is active, and success is based on the server record.
- **Assessment:** direction and keyboard safety are strong, but the modal is not a self-contained review of the item and description.
- **Priority:** `P1` (`TRANSFER-02`).

### A07-05 — Safe insufficient-stock rejection

- **Purpose:** exercise a deterministic backend rejection without racing another mutation or corrupting network state.
- **Route and start:** `UXRA07-WHOLE`, WAREHOUSE `10 pcs` after `0001`.
- **Steps:** submit WAREHOUSE→STORE `999 pcs`; inspect focus, preserved input, refreshed stock, and movement history.
- **Evidence:** A07-E07 and screenshots `16`–`17`.
- **Observed fact:** confirmation preserved the exact excessive request. The backend rejected it, no reference/movement appeared, the form values remained, item data refreshed, and the error alert received focus.
- **Observed fact:** copy is actionable but generic: `misalnya karena stok asal tidak cukup`. It does not leak raw backend errors or claim a client-calculated balance.
- **Expected:** deterministic rejection remains editable/retryable and never claims that stock moved.
- **Assessment:** the safe rejection experience meets the transaction boundary.
- **Priority:** no finding.

### A07-06 — Fractional success and movement trace

- **Purpose:** verify exact decimal transfer and atomic paired movements.
- **Route and start:** `UXRA07-FRAC`, STORE `5,5 meter`, WAREHOUSE `3,25 meter`.
- **Steps:** confirm STORE→WAREHOUSE `0,75 meter`; inspect success; filter movement history for both fixtures.
- **Evidence:** A07-E08 and A07-E09.
- **Observed fact:** the server created `ST/IX-2026/0002`; refreshed stock became STORE `4,75 meter`, WAREHOUSE `4 meter`.
- **Observed fact:** movement history showed paired OUT/IN rows with the same transfer reference, exact quantity/UOM, source/destination, before/after balances, actor, and time for each transfer.
- **Observed fact:** the reference is plain text. The frontend exposes only `/stock-transfers/new`; it has no transfer list/detail UI even though the backend supports both reads. Success is not linked and cannot be reopened after navigation (`TRANSFER-03`).
- **Expected:** a confirmed transfer remains attributable and reviewable after its transient success message disappears.
- **Assessment:** stock traceability exists through the generic movement ledger, but the transfer's description and complete record are not reachable in the UI.
- **Priority:** `P1` (`TRANSFER-03`).

### A07-07 — Ambiguous-outcome recovery boundary

- **Purpose:** assess dangerous uncertainty without deliberately interrupting the shared local POST.
- **Repository evidence:** the component creates an idempotency key for a payload signature and reuses it while the page remains mounted. The key/request live only in `useRef`; there is no session-persisted attempt, quarantine, or backend lookup by request key. A network/unexpected error says the transfer cannot be confirmed and invites same-request retry, but leaves the form editable. Reload/navigation loses the key; changing a field produces a new signature/key.
- **Backend evidence:** the same key and identical payload replay the stored result; changed payload conflicts. Backend reads can list transfers and fetch detail by transfer code, but no status-by-request-key endpoint exists.
- **Automated evidence:** conflict retry with the same in-memory key is covered; ambiguous network outcome across edit/navigation/reload is not.
- **Expected:** an uncertain stock mutation must not permit a new-key resubmission or silently lose its recovery identity.
- **Assessment at audit time:** if the POST committed but its response was lost, an operator could edit/reload and later post with a new key before resolving the original transfer. This was an unsafe duplicate-stock-movement risk (`TRANSFER-01`).
- **Resolution follow-up (2026-09-26):** the frontend now persists the exact request, idempotency key, and authenticated `accountId` in tab storage before sending. An uncertain request locks editing across navigation/reload and is reconciled only by replaying the same request/key through the backend's existing idempotent POST. Storage failure prevents sending, another account is quarantined from the retained facts/actions, key conflicts fail closed, and the confirmed response must match the retained request/key before becoming success. No request-key lookup endpoint was invented. Focused recovery/API tests (28), the full frontend suite (398), targeted lint, and production build passed.
- **Priority:** `P0 resolved 2026-09-26`; the original risk was repository evidence plus transaction-risk inference and was not reproduced against the live shared service.

### A07-08 — Keyboard and narrow-desktop behavior

- **Purpose:** verify the workflow for keyboard and narrow-desktop users.
- **Route and start:** populated transfer form at `760×768` and `768×768`.
- **Steps:** record Tab order; inspect stacked form and confirmation; measure body width/overflow.
- **Evidence:** A07-E10 and A07-E11.
- **Observed fact:** Tab order was item, source, swap, destination, quantity, description, review, refresh. Required and quantity errors focused their fields; confirmation focused cancel; Escape restored review focus; rejection focused the alert.
- **Observed fact:** no horizontal overflow occurred. At 760 the direction controls stacked and the dialog fit (`444 px` wide inside `760 px`). At 768, body client/scroll width both measured `753`; vertical content extended to `819`.
- **Observed fact:** the dense two-line stock-authority message and full form push the primary review action below the initial 760-pixel viewport (`TRANSFER-05`).
- **Expected:** all controls and confirmation remain reachable without horizontal panning and focus follows task order.
- **Assessment:** responsive mechanics and keyboard order are strong. Narrow efficiency can improve without removing authority or fields.
- **Priority:** `P2` (`TRANSFER-05`).

## Findings

| ID | Priority | Classification | Finding |
| --- | --- | --- | --- |
| TRANSFER-01 | P0 resolved 2026-09-26 | Repository/backend evidence + focused recovery tests | The former memory-only recovery could lose its request/key and permit a new-key transfer after navigation/reload. The frontend now persists the account-bound exact request/key before posting, locks unresolved state, and reconciles through the backend's existing same-key idempotent POST; unavailable storage blocks submission and cross-account state is quarantined. |
| TRANSFER-02 | P1 | Live evidence | Confirmation freezes quantity and direction but omits the selected item/SKU and description, so the decision surface is not a complete summary of the request. |
| TRANSFER-03 | P1 | Live + route/backend evidence | A successful transfer cannot be reopened in the frontend. The success code and movement references are not links, and backend-supported transfer list/detail reads have no UI. |
| TRANSFER-04 | P1 | Live + repository evidence + scale inference | Item discovery is one unsearchable select backed by a single `size: 2000` request, creating both high-friction lookup and a silent catalog ceiling. |
| TRANSFER-05 | P2 | Live responsive evidence | At 760 pixels the complete form is usable without horizontal overflow, but dense advisory copy helps push the primary review action below the initial viewport. |

No live incorrect balance or non-atomic transfer was observed. The P0 is a recovery-design risk proven by current frontend/backend code paths, not by manufacturing a network failure.

## Preserved strengths

- Source and destination are explicitly labelled, remain opposite, and can be swapped with a text-labelled control.
- Visible stock is correctly framed as advisory and refreshed after success/rejection; the server revalidates availability.
- Whole/fractional policy, comma decimals, four-decimal precision, and UOM labels match backend rules.
- The browser submits one atomic transfer request and never implements transfer as separate local decrement/increment calls.
- Confirmation explains atomic server recording, defaults focus to cancel, supports Escape, and prevents duplicate clicks while pending.
- Deterministic rejection preserves input, refreshes stock, focuses feedback, and creates no movement.
- Success uses the server reference and direction; affected item data is refreshed.
- Movement history proves paired OUT/IN entries with matching reference, quantity, UOM, balances, actor, and time.
- Keyboard order follows task order, and the 760/768 layouts avoid horizontal page overflow.

## Recommendations for UXR-D07 design

These are audit recommendations, not implementation approval:

1. Preserve the explicit source→destination structure, swap behavior, advisory-stock language, server validation, atomic confirmation, pending lock, and backend-confirmed reference.
2. Make confirmation self-contained: item name/SKU, quantity/UOM, source, destination, and optional description must be visible together.
3. Replace the all-items select with a keyboard-first searchable picker using existing SKU/name facts and remove the fixed single-page ceiling without inventing new taxonomy.
4. Preserve the implemented durable transfer-attempt quarantine: an uncertain POST is not failure, the form remains locked, and only exact same-request/key replay may reconcile it. Do not weaken account isolation, storage-before-send, or response validation for visual simplicity.
5. Provide a discoverable transfer history/detail path using the backend's existing list/code-detail reads, and link the success reference plus movement reference when route scope is approved.
6. At narrow widths, keep the stacked direction layout but shorten secondary authority copy and place the primary action predictably after required fields.

## Owner decisions needed for design

1. Whether UXR-D07 includes backend-supported transfer list/detail frames or records them as a separate read-flow section within the same domain design.
2. Whether item lookup prioritizes name, SKU/barcode, or a compact combination of existing facts.
3. Whether description is routinely important enough for confirmation prominence or remains secondary while still present.

The former recovery decision is closed by exact same-key POST replay; no request-key status endpoint
was added or required.

## State-changing actions and cleanup

- Created `UXRA07-WHOLE` with opening stock STORE `8 pcs`, WAREHOUSE `12 pcs`.
- Created `UXRA07-FRAC` with opening stock STORE `5,5 meter`, WAREHOUSE `3,25 meter`.
- Posted `ST/IX-2026/0001`: WAREHOUSE→STORE `2 pcs` for `UXRA07-WHOLE`.
- Submitted WAREHOUSE→STORE `999 pcs`; the backend rejected it and created no transfer.
- Posted `ST/IX-2026/0002`: STORE→WAREHOUSE `0,75 meter` for `UXRA07-FRAC`.
- Final balances were `UXRA07-WHOLE` STORE/WAREHOUSE `10/10 pcs` and `UXRA07-FRAC` STORE/WAREHOUSE `4,75/4 meter`.
- After explicit owner confirmation, both disposable items were deactivated through Bloom's `Hapus` action. Searching active Data Barang for `UXRA07` returned no items.
- `ST/IX-2026/0001`, `ST/IX-2026/0002`, their opening movements, and their linked transfer movements remain preserved; the fractional transfer trace was re-opened after cleanup.
- No backend/application/configuration/dependency file was modified, and no database reseed or direct data mutation was performed.

## Limitations

- Concurrent conflict, network ambiguity, failed post-success refresh, and malformed response were not forced against the running services.
- Both POSTs settled too quickly for a genuine pending screenshot; source and focused tests provide pending/duplicate evidence.
- The live catalog had nine active items; catalog-scale impact is inferred from the unsearchable interaction and one-page `size: 2000` implementation.
- The current frontend has no transfer list/detail route, so backend read behavior was inspected from source rather than exercised through UI.
- Exact browser version, Windows display scaling, physical store keyboard, and deployed store laptop were unavailable.

## Evidence index

- Fixture setup: A07-E01 and screenshots `00`–`03`.
- Empty/validation/discovery: A07-E02–A07-E03 and screenshots `04`–`07`.
- Direction and quantity rules: A07-E04–A07-E05 and screenshots `08`–`10`, `18`.
- Whole transfer, rejection, fractional transfer: A07-E06–A07-E08 and screenshots `11`–`22`.
- Movement trace: A07-E09 and screenshots `23`–`24`.
- Keyboard/responsive: A07-E10–A07-E11 and screenshots `25`–`27`.
- Cleanup and retained-history verification: A07-E12 and screenshots `28`–`32`.
