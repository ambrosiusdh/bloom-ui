# UXR-A06 — Stock adjustment

Status: `EVIDENCE_COMPLETE`  
Execution: repository review plus live transactional UX audit on disposable local data  
Audit date: 2026-09-23  
Persistent visual recapture: 2026-09-24  
Environment: local Bloom frontend (`http://localhost:5173`) and backend (`http://localhost:8080`), using the existing local `admin` session  
Browser: Codex in-app browser (Chromium-based; exact version unavailable)  
Viewports: default wide browser surface (`1610×1270` observed), `760×768` narrow desktop, and the `768×768` responsive boundary

## Scope and method

This audit covered the implemented stock-adjustment list, detail, and create workflow: active-item discovery, STORE/WAREHOUSE location meaning, ADD/REMOVE positive deltas, CORRECTION absolute target including zero, whole/fractional quantity validation, reason capture, confirmation, pending, backend-confirmed results, list filtering/paging, keyboard/focus, recovery implementation, movement traceability, and responsive behavior. It did not audit transfers or CSV import, calculate resulting stock in the browser, force an ambiguous network outcome, alter application code, or redesign the workflow.

Before live work, the audit read `AGENTS.md`, `docs/architecture/release-1-frontend-contract.md`, `docs/plans/release-1-frontend-roadmap.md`, `docs/plans/release-1-ux-rework-roadmap.md`, the completed UXR-A04 and UXR-A05 evidence relevant to item identity and stock history, the current adjustment routes/components/store/API/tests, and the matching backend controller, request/response DTOs, validation, exception handling, specification, and service. Backend Release 1 stock calculations and stored results remain authoritative.

Two disposable items were created through the implemented item workflow:

- `UXRA06-WHOLE` — whole-unit `pcs`, opening stock STORE `10`, WAREHOUSE `5`;
- `UXRA06-FRAC` — fractional `meter`, opening stock STORE `2,5`, WAREHOUSE `4,75`.

The audit posted exactly two stock adjustments:

- `SA/IX-2026/0001`: ADD `2 pcs` to STORE for `UXRA06-WHOLE`, and REMOVE `0,25 meter` from WAREHOUSE for `UXRA06-FRAC`;
- `SA/IX-2026/0002`: CORRECTION of `UXRA06-FRAC` STORE stock from `2,5 meter` to the absolute target `0 meter`.

Both original disposable items were deactivated after the audit. A later owner-requested visual recapture created `UXRA06-SHOT` with opening stock STORE `6 pcs` and WAREHOUSE `4 pcs`, then posted `SA/IX-2026/0003` as STORE ADD `1 pcs`; the server confirmed `6 → 7 pcs`. That fixture was also deactivated. All three adjustment records and their movement history intentionally remain in the local audit trail. The earlier attempted no-op CORRECTION was rejected and created no transaction.

The complete evidence index and 21-file persistent screenshot set are in [`docs/ux/evidence/uxr-a06/README.md`](../evidence/uxr-a06/README.md).

## Scenario evidence

### A06-01 — Empty list, list contract, and paging recovery

- **Purpose:** establish the starting state and whether the read workflow preserves backend facts and URL-addressable paging.
- **Route and start:** `/stock-adjustments`; no existing adjustment records.
- **Steps:** inspect the initial empty page; after the test transactions, revisit the list, filter by reference, open detail and return, then request an out-of-range page.
- **Evidence:** A06-E01, A06-E09, and A06-E11 in the [evidence index](../evidence/uxr-a06/README.md).
- **Observed fact:** the initial page showed a genuine unfiltered empty state. After posting, the list showed reference, reason, actor, time, and a detail action for both server records. Filtering `0002` produced only `SA/IX-2026/0002`, and returning from detail preserved `/stock-adjustments?q=0002&page=1`.
- **Observed fact:** `/stock-adjustments?page=8&size=5` canonicalized to page 1 and then rendered both records. The current ordering was oldest first (`0001`, then `0002`) and the UI exposes no sort control (`ADJUST-04`).
- **Expected:** server records remain attributable, list state survives detail navigation, and invalid paging recovers safely.
- **Assessment:** URL/paging recovery and detail return are strong. Oldest-first history makes the newest operational result progressively harder to find.
- **Priority:** `P2` (`ADJUST-04`).

### A06-02 — Item discovery and quantity policy

- **Purpose:** verify that operators can choose active inventory and understand whole/fractional rules before posting.
- **Route and start:** `/stock-adjustments/new`; nine active local items, including the two disposable fixtures.
- **Steps:** open the item selector; inspect available discovery controls; select `UXRA06-WHOLE`; enter `1,5`; review the form.
- **Evidence:** A06-E02 and A06-E03.
- **Observed fact:** all nine active items appeared as `[SKU] Name` options in one MUI select. There was no search field, incremental result list, category context, or separate SKU/name lookup. Repository evidence confirms that the page loads every active-item page into this one select rather than imposing a hidden item ceiling (`ADJUST-02`).
- **Observed fact:** `1,5` for the whole-unit item produced `Barang ini hanya dapat disesuaikan dalam jumlah utuh.` and focus moved to the quantity field. Fractional input accepted comma decimals and preserved exact values to four decimals.
- **Expected:** active items remain discoverable as the catalog grows, and the UI prevents requests that violate the backend UOM policy.
- **Assessment:** validation and focus are good, but the main lookup interaction will become slow and error-prone for a material catalog—especially for an older keyboard user.
- **Priority:** `P1` (`ADJUST-02`).

### A06-03 — ADD/REMOVE confirmation, pending, and authoritative result

- **Purpose:** confirm that delta actions remain distinct, the exact request is frozen, duplicate submission is blocked, and only server results are presented as fact.
- **Route and start:** `/stock-adjustments/new`; `UXRA06-WHOLE` STORE `10 pcs`, `UXRA06-FRAC` WAREHOUSE `4,75 meter`.
- **Steps:** enter the audit reason; add the whole item as STORE/ADD `2`; add the fractional item as WAREHOUSE/REMOVE `0,25`; open confirmation; press Escape; reopen; submit.
- **Evidence:** A06-E04 through A06-E06.
- **Observed fact:** form helper text described ADD/REMOVE as positive deltas. Confirmation froze the reason, SKU/name, location, action, and quantity, and said that the server would determine previous/new stock and booked movements.
- **Observed fact:** initial dialog focus was `Batal`; Escape closed it and returned focus to `Tinjau penyesuaian`. During the live request, form controls and dialog actions were disabled and the primary action changed to `Menyimpan...`.
- **Observed fact:** the result was `SA/IX-2026/0001`; it displayed server-returned `10 → 12 pcs` and `4,75 → 4,5 meter`, plus matching movement references. No client-computed resulting stock was presented before submission.
- **Observed fact:** movement summary cards use raw `IN` and `OUT` while the rest of the workflow uses `Tambah`, `Kurangi`, `Masuk`, and `Keluar` (`ADJUST-06`).
- **Expected:** exact payload meaning survives confirmation/pending, duplicate POST is unavailable, and success is based on a complete backend response.
- **Assessment:** transaction authority, confirmation, pending, and focus behavior satisfy the safety contract. The raw movement enums are a localized-comprehension inconsistency.
- **Priority:** `P2` (`ADJUST-06`).

### A06-04 — CORRECTION absolute zero

- **Purpose:** verify the important distinction between a delta and an absolute target, including a valid zero target.
- **Route and start:** `/stock-adjustments/new`; `UXRA06-FRAC` STORE `2,5 meter`.
- **Steps:** select CORRECTION, enter `0`, inspect helper copy and confirmation, then submit.
- **Evidence:** A06-E07.
- **Observed fact:** changing the action updated the helper to `Nilai adalah target stok absolut; nol diperbolehkan.` and the quantity helper to `Target stok absolut`. Confirmation repeated `Tetapkan stok absolut (CORRECTION) · 0 meter`.
- **Observed fact:** the server created `SA/IX-2026/0002` and returned previous `2,5 meter`, new `0 meter`, and an outbound movement of `2,5 meter`. The linked movement history later showed the same reference and balances.
- **Expected:** zero is accepted only as an absolute CORRECTION target, and the UI never interprets it as a zero delta.
- **Assessment:** the current interaction preserves the backend meaning correctly.
- **Priority:** no finding.

### A06-05 — Safe server rejection for a no-op correction

- **Purpose:** exercise a deterministic, non-mutating server rejection without manufacturing a race or network failure.
- **Route and start:** `/stock-adjustments/new`; `UXRA06-WHOLE` STORE remained `12 pcs` after `0001`.
- **Steps:** select CORRECTION with target `12`, confirm the frozen request, and submit; inspect the returned form and list.
- **Evidence:** A06-E08.
- **Observed fact:** the backend invariant rejects a CORRECTION whose target equals current stock. The dialog closed and the form returned with its values intact, but no visible server-rejection message appeared during the observation. Focus returned to `Tinjau penyesuaian`. At that point the list still contained only `0001` and `0002`, proving that the rejected attempt created no adjustment (`ADJUST-03`).
- **Repository comparison:** the frontend intends to show a generic validation warning—`Server menolak data penyesuaian...`—when the normalized error category is validation. The observed local path did not expose that warning, so the live/runtime behavior and intended branch need implementation investigation before design assumes the state is covered.
- **Expected:** a definitive rejection remains safely retryable and clearly explains what the operator must correct.
- **Assessment:** stock safety held, but the absence of visible feedback makes a critical primary action appear unresponsive and invites repeated attempts.
- **Priority:** `P1` (`ADJUST-03`).

### A06-06 — Filtered empty, reference search, and available backend filters

- **Purpose:** determine whether an operator can find and recover adjustment history as the ledger grows.
- **Route and start:** `/stock-adjustments?q=0002&page=1`, then a no-match query.
- **Steps:** search by partial reference; inspect the result; enter `UXRA06-NO-MATCH`; apply twice after the first click only committed the field blur; inspect empty copy.
- **Evidence:** A06-E09 and A06-E10.
- **Observed fact:** partial-reference search works and persists in the URL. The settled no-match state says `Belum ada penyesuaian stok` and `Buat penyesuaian saat stok fisik perlu dicatat ulang`, the same message used when no adjustment exists at all. A visible `Hapus filter` action is available, but the copy incorrectly suggests creating a new transaction instead of changing/clearing the filter (`ADJUST-05`).
- **Observed fact:** backend filters already include a date range, while the UI exposes only reference text. Operators investigating a period cannot use the supported date constraints (`ADJUST-07`).
- **Observed fact:** both row links have the same accessible name, `Detail`, instead of including the adjustment reference (`ADJUST-08`).
- **Expected:** a filtered empty result is distinguishable from an empty ledger, supported audit refinements are usable, and repeated row actions remain identifiable to assistive technology.
- **Assessment:** reference search works, but recovery copy, date refinement, and link naming need improvement.
- **Priority:** `P2` (`ADJUST-05`, `ADJUST-07`, `ADJUST-08`).

### A06-07 — Detail and movement trace

- **Purpose:** verify that a created adjustment can be understood later without reconstructing stock client-side.
- **Route and start:** detail routes for `SA/IX-2026/0001` and `0002`; item-scoped movement history for both disposable SKUs.
- **Steps:** open each detail; compare action/location/request/previous/new; open stock movement history by exact SKU after item cleanup.
- **Evidence:** A06-E06, A06-E07, and A06-E14.
- **Observed fact:** detail presented reference, actor, time, confirmed reason, item identity/UOM, location, localized action, requested value, previous stock, and new stock. The movement ledger matched both adjustment references and balances exactly.
- **Observed fact:** after both items were deactivated, adjustment detail and movement history remained readable. This preserves audit history instead of tying it to the active-item list.
- **Expected:** every posted result remains attributable to backend facts and traceable into immutable movement history.
- **Assessment:** the wide read path meets the authority and traceability contract.
- **Priority:** no finding.

### A06-08 — Narrow-desktop behavior

- **Purpose:** verify whether list, form, and detail remain usable at the roadmap's narrow-desktop boundary.
- **Route and start:** list, create, and detail at `760×768`, then detail at `768×768`.
- **Steps:** inspect each page; measure viewport, body, and table widths; compare the breakpoint behavior.
- **Evidence:** A06-E12 and A06-E13.
- **Observed fact:** at 760 pixels, the list fit within the page (`bodyScrollWidth=760`) and the create form stacked its fields without horizontal overflow.
- **Observed fact:** the detail table did not fit. At 760 pixels, the body measured `745` client pixels but `852` scroll pixels; the 820-pixel table caused page-level horizontal panning and hid the rightmost `Stok baru` fact. At 768 pixels, the persistent navigation rail and table expanded the page to `1108` scroll pixels against `753` client pixels. The overflow becomes substantially worse across an eight-pixel breakpoint (`ADJUST-01`).
- **Expected:** the complete before/after result remains visible or intentionally reachable without page-level two-dimensional navigation.
- **Assessment:** list and create are usable at 760 pixels, but detail loses the most important outcome column and creates a severe responsive cliff.
- **Priority:** `P1` (`ADJUST-01`).

### A06-09 — Dangerous recovery states and automated evidence

- **Purpose:** distinguish safely observed live states from failure paths that should not be forced against a shared local service.
- **Repository evidence:** the create store persists the exact attempt in `sessionStorage` before POST, blocks duplicate creates, accepts success only when adjustment and movement arrays completely match the request, quarantines network/unexpected/malformed-success outcomes as ambiguous, and unlocks only after a definitive rejection or explicit manual reconciliation. Conflict refresh and post-success refresh failure also lock stale input until current item data reloads.
- **Automated result:** the focused command passed 6 files and 30 tests. It covered request validation, list/detail reads, pending/duplicate blocking, exact frozen payload, complete backend results, every active-item page, conflict refresh, post-success refresh failure, durable ambiguous outcome, malformed success, definitive rejection unlock, paging, return state, and API forwarding.
- **Live result:** pending and a deterministic rejection were exercised. A genuine concurrent conflict, storage failure, malformed response, and ambiguous network result were not manufactured.
- **Expected:** unsafe outcomes never encourage blind resubmission or claim a definitive failure.
- **Assessment:** repository/test evidence is strong. No live claim is made for the appearance or timing of the unforced states.
- **Priority:** no additional product finding from test-only paths.

## Findings

| ID | Priority | Classification | Finding |
| --- | --- | --- | --- |
| ADJUST-01 | P1 | Live evidence + DOM measurement | Detail creates page-level horizontal overflow at both audited narrow widths. At `760×768`, the page grows from 745 to 852 pixels and hides `Stok baru`; at `768×768`, it grows from 753 to 1108 pixels as the navigation rail and 820-pixel table remain present. |
| ADJUST-02 | P1 | Live evidence + repository confirmation + scale inference | Item discovery is one unsearchable select containing every active item page. Nine options were manageable in the fixture, but a real material catalog requires scanning a long SKU/name list with no query or category aid. |
| ADJUST-03 | P1 | Live evidence + source comparison | A safe no-op CORRECTION was rejected and created no record, but the live form returned without visible rejection feedback. The frontend contains an intended generic validation warning, so runtime behavior needs investigation; the observed experience makes the primary action appear inert. |
| ADJUST-04 | P2 | Live evidence + inference | Adjustment history is oldest first and exposes no sort. With more records, the transaction an operator just created will move away from the first page. |
| ADJUST-05 | P2 | Live evidence | A filtered no-match result reuses the true-empty message and recommends creating an adjustment instead of explaining that the active filter matched nothing. |
| ADJUST-06 | P2 | Live evidence | Success movement cards expose raw `IN`/`OUT` enums while adjacent UI uses Indonesian action/direction labels. |
| ADJUST-07 | P2 | Backend/repository evidence + inference | The backend accepts start/end date filters, but the list exposes only reference text, limiting period-based audit lookup. |
| ADJUST-08 | P2 | Accessibility evidence | Every row action is named only `Detail`; repeated links do not include their adjustment reference in the accessible name. |

No `P0` finding was observed. The UI never calculated or claimed authoritative resulting stock, the two confirmed transactions each produced one complete server result, and the rejected request created no record.

## Preserved strengths

- ADD/REMOVE are consistently described as positive deltas; CORRECTION is explicitly an absolute target and permits zero.
- Whole-unit and fractional validation matches the backend quantity policy and directs focus to the invalid field.
- A reason is required and repeated in confirmation and the immutable result.
- Confirmation freezes item, location, action, quantity, and reason; initial focus is on the safe cancel action, and Escape returns focus to the review trigger.
- Pending disables mutation controls and exposes `Menyimpan...`, preventing accidental duplicate submission.
- Success requires a complete backend response and displays backend-returned previous/new stock rather than client arithmetic.
- Exact decimal quantities and UOM remain visible throughout form, confirmation, result, detail, and movement history.
- Detail preserves actor/time/reference and remains available after item deactivation.
- List URL state, paging canonicalization, and return-from-detail behavior are robust.
- The recovery store conservatively quarantines ambiguous outcomes and has focused automated coverage.
- The 760-pixel list and create form avoid page-level horizontal overflow.

## Recommendations for UXR-D06 design

These are audit recommendations, not approved implementation requirements:

1. Replace the all-items select with a keyboard-first searchable combobox using existing SKU and name facts. Keep exact active-item eligibility and do not add client-side stock authority.
2. Preserve the explicit delta-versus-absolute action model, but make the selected action the strongest local cue and keep raw backend enums secondary to clear Indonesian labels.
3. Keep confirmation, safe initial focus, frozen payload, pending lock, complete server-result gate, and ambiguous-outcome quarantine unchanged in meaning.
4. Give every definitive rejection a persistent, focusable explanation next to the affected action/line. Specifically explain a no-op CORRECTION without presenting browser stock as authoritative.
5. Replace the narrow detail table with complete stacked rows/cards, or contain it in an intentional labelled scroller whose layout chain can shrink. Previous and new stock must remain together.
6. Distinguish filtered empty from an empty ledger and make clearing/changing the filter the primary recovery action.
7. Present newest records first only if the backend/API ordering contract is made explicit; otherwise add an understandable server-backed sort control.
8. Add supported date-range refinement through progressive disclosure so the primary list stays calm for older operators.
9. Localize movement direction consistently and include the reference in each detail link's accessible name.

## Owner decisions needed for design

1. Confirm the narrow-desktop width and display scaling to optimize beyond the audited 760/768 boundary.
2. Decide whether material lookup should prioritize name, SKU/barcode, recent selections, or a small combination of those existing facts; no new inventory taxonomy is required.
3. Decide whether action choice is best as a segmented control, radio group, or select, while preserving ADD/REMOVE/CORRECTION meanings.
4. Decide which history filters remain always visible and whether date range belongs under `Filter lainnya`.
5. Confirm whether raw enum/code hints such as `ADD` and `STORE` should remain visible for support users or move to secondary detail.

## State-changing actions and cleanup

- Created `UXRA06-WHOLE` with opening stock STORE `10 pcs`, WAREHOUSE `5 pcs`.
- Created `UXRA06-FRAC` with opening stock STORE `2,5 meter`, WAREHOUSE `4,75 meter`.
- Posted `SA/IX-2026/0001`: STORE ADD `2 pcs` for `UXRA06-WHOLE`; WAREHOUSE REMOVE `0,25 meter` for `UXRA06-FRAC`.
- Posted `SA/IX-2026/0002`: STORE CORRECTION target `0 meter` for `UXRA06-FRAC`.
- Created visual-recapture fixture `UXRA06-SHOT` with opening stock STORE `6 pcs`, WAREHOUSE `4 pcs`.
- Posted visual-recapture transaction `SA/IX-2026/0003`: STORE ADD `1 pcs` for `UXRA06-SHOT`; the server confirmed `6 → 7 pcs`.
- Submitted one no-op CORRECTION target `12 pcs`; the server rejected it and created no adjustment.
- Deactivated all three disposable items through the implemented item workflow. Adjustment and movement audit records remain intentionally preserved and readable.
- No backend/application/configuration/dependency file was modified, and no database reseed or destructive cleanup was performed.

## Limitations

- The live active-item selector contained nine items. The scale problem is supported by repository behavior and interaction design, not a live hundred-item catalog.
- A concurrent stock conflict was not forced because it would require racing state changes; its refresh/lock behavior is automated-test evidence only.
- Network ambiguity, storage failure, malformed success, and failed post-success refresh were not forced against the user's running services.
- The no-op rejection was observed as silent, while source intends a generic validation alert. Exact runtime error categorization was not inspected through hidden browser state or network interception.
- The visual-recapture POST settled too quickly to retain a genuine pending screenshot, though the original live DOM captured disabled controls and `Menyimpan...`, and focused tests cover pending/duplicate blocking.
- The exact browser version, Windows display scaling, physical store keyboard, and deployed store laptop were unavailable.
- Twenty-one persistent PNGs now cover the material setup, workflow, responsive, traceability, and cleanup states. They supplement rather than replace the durable route, fact, and measurement record.

## Evidence index

- Start, validation, and item discovery: A06-E01–A06-E03.
- ADD/REMOVE confirmation, pending, success, and detail: A06-E04–A06-E06.
- CORRECTION zero and deterministic rejection: A06-E07–A06-E08.
- List/filter/paging/accessibility: A06-E09–A06-E11.
- Responsive list/create/detail: A06-E12–A06-E13.
- Movement trace and cleanup: A06-E14–A06-E15; repository and automated verification are recorded in the evidence index's dedicated section.
