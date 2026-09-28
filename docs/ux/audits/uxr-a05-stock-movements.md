# UXR-A05 — Stock movement history

Status: `EVIDENCE_COMPLETE`  
Execution: read-only repository audit plus live UX audit; no data mutations  
Audit date: 2026-09-23  
Environment: local Bloom frontend (`http://localhost:5173`) and backend (`http://localhost:8080`), using the existing local `admin` session  
Browser: Codex in-app browser (Chromium-based; exact version unavailable)  
Viewports: default wide browser surface (`1610×1270` observed), `760×768` narrow desktop, and the `768×768` responsive boundary

## Scope and method

This audit covered the implemented `/stock-movements` ledger, item-scoped entry from Data Barang, exact SKU/direction/location filters, URL state, paging, filtered empty state, loading/error implementation, source/reference comprehension, exact decimal quantity and UOM, location/direction, before/after balance, actor/time, keyboard traversal, and responsive table/card behavior. It did not post movements, audit the source-domain workflows themselves, reconstruct stock history, change code, or redesign the page.

Before live work, the audit read `AGENTS.md`, `docs/architecture/release-1-frontend-contract.md`, `docs/plans/release-1-frontend-roadmap.md`, `docs/plans/release-1-ux-rework-roadmap.md`, the completed UXR-A04 evidence relevant to the item-scoped entry, the movement route/page/API/tests, and the matching backend controller, filter request, response DTO, specification, enums, and query service. The backend Release 1 read model remains authoritative.

The contract establishes that movement history is backend-derived and must expose item/UOM, exact decimal quantity, direction, location, source/reference, before/after balance, actor, timestamp, and server paging/filter semantics. The inspected backend supports item ID/SKU, source type, direction, adjustment action, location, start/end time, and reference filters with stable default ordering. The frontend currently exposes SKU, direction, and location filters only and issues one list request rather than per-row enrichment requests.

The complete evidence index is [`docs/ux/evidence/uxr-a05/README.md`](../evidence/uxr-a05/README.md). No test data was created or changed.

## Scenario evidence

### A05-01 — Default ledger, paging, and audit facts

- **Purpose:** establish whether an operator can understand confirmed stock changes without frontend reconstruction or row enrichment.
- **Route and start:** `/stock-movements`; existing 11-row local ledger.
- **Steps:** load page 1; inspect representative sale, receipt, and opening rows; move to page 2 and back.
- **Evidence:** A05-E01 and A05-E02 in the [evidence index](../evidence/uxr-a05/README.md).
- **Observed fact:** the wide table exposed time, item name/SKU/UOM, direction and source, location, signed quantity, before/after balance, reference, and actor. Page 1 contained ten rows and page 2 one row. A single paged list request supplied each row.
- **Observed fact:** `IN`/`OUT` were translated to `Masuk`/`Keluar`; `STORE`/`WAREHOUSE` to `Toko`/`Gudang`; quantities used signs and UOM, so direction did not depend on color alone. Decimal data remained exact in read-only presentation, including `+0,5 meter`, `+1,25 meter`, and `+2,5001 meter`.
- **Expected:** confirmed server facts remain attributable and pageable without client stock calculations or N+1 enrichment.
- **Assessment:** the wide presentation meets the core read-model requirement. Source navigation and responsive behavior are assessed separately.
- **Priority:** no finding.

### A05-02 — Item-scoped entry and exact SKU history

- **Purpose:** verify the current item-to-audit path and whether historical movements remain readable with stable item identity.
- **Route and start:** Data Barang filtered to `QA-FE10-82138041`, then the row action `Riwayat stok QA FE10 Live 82138041`.
- **Steps:** activate the stock-history link; verify the resulting URL, filter value, and four returned rows. Separately query the inactive UXR-A04 item by exact SKU.
- **Evidence:** A05-E03 and A05-E09.
- **Observed fact:** the row action opened `/stock-movements?itemSku=QA-FE10-82138041`; the page echoed `Barang: QA-FE10-82138041` and returned only that item's rows. The previously deactivated `UXRA04-FRAC` remained queryable and retained both opening movements, which is appropriate for an audit trail.
- **Expected:** an item-scoped entry carries stable identity to the server-filtered ledger and does not lose history when an item leaves the active list.
- **Assessment:** entry and historical retention are understandable. Returning to the originating filtered item list is a broader navigation pattern already covered by shell/domain design, not a movement-ledger finding.
- **Priority:** no finding.

### A05-03 — Supported filters, URL state, and empty recovery

- **Purpose:** verify safe refinement and recovery without changing ledger data.
- **Route and start:** `/stock-movements`.
- **Steps:** apply exact SKU; combine `Masuk` and `Gudang`; enter `UXRA05-NO-MATCH`; clear filters.
- **Evidence:** A05-E03 through A05-E06.
- **Observed fact:** each filter reset paging to 1 and persisted in the URL. The combined direction/location query returned only matching rows. The settled no-match result explicitly said `Tidak ada pergerakan stok` and told the operator to change or remove filters; pagination was disabled.
- **Observed fact:** the backend already accepts source type, adjustment action, date range, and reference filters, but the UI exposes none of them. A known sale or receipt reference cannot be searched directly from this ledger (`MOVEMENT-04`).
- **Expected:** supported filters are understandable, distinguish loading from empty, and let an operator recover without data mutation.
- **Assessment:** the three exposed filters work and the empty recovery is clear. The available refinement set is weak for a growing audit ledger.
- **Priority:** `P2` (`MOVEMENT-04`).

### A05-04 — Source and reference comprehension

- **Purpose:** determine whether representative rows can be traced to their source documents without extra manual search steps.
- **Route and start:** item-filtered wide ledger for `QA-FE10-82138041`.
- **Steps:** compare opening, sale, and goods-receipt rows; inspect the reference cells and available row controls.
- **Evidence:** A05-E09.
- **Observed fact:** wide rows pair direction with a localized source label, for example `Masuk / Penerimaan barang`, `Keluar / Penjualan`, and `Masuk / Stok awal`. References such as `GR/IX-2026/0001` and `SALE/VIII-2026/0001` are visible.
- **Observed fact:** all references are plain text and the movement table contains zero links or actions. The operator must remember or copy a reference, navigate to another domain, and search again even when Bloom already has a detail route for the source (`MOVEMENT-03`).
- **Observed fact:** the source label map has no `GOODS_RECEIPT_CANCELLATION` entry even though the backend enum can return it; the current fallback would display the raw enum. No cancellation row existed in live data, so this is repository evidence only (`MOVEMENT-06`).
- **Expected:** source type and reference are understandable, and representative sources can be traced without N+1-style enrichment or repetitive manual lookup.
- **Assessment:** text comprehension is good on wide screens, but direct traceability is incomplete.
- **Priority:** `P1` (`MOVEMENT-03`) and `P2` (`MOVEMENT-06`).

### A05-05 — Keyboard traversal and focus after clearing

- **Purpose:** verify that the filter task is operable and retains orientation without a pointer.
- **Route and start:** item-filtered ledger at `760×768`.
- **Steps:** focus SKU; press Tab through direction, location, and `Hapus filter`; activate clear with Enter; inspect focus and URL after the result settles.
- **Evidence:** A05-E06.
- **Observed fact:** focus order was logical and every filter/control was keyboard reachable. Enter cleared the query and restored page 1.
- **Observed fact:** after clearing, focus moved to the document `BODY`. The initiating button becomes disabled, but no replacement target or result heading receives focus, so a keyboard or screen-reader user loses task position (`MOVEMENT-05`).
- **Expected:** clearing filters updates results and leaves focus on a meaningful nearby control or announces the changed result.
- **Assessment:** operation is available, but post-action orientation is weak.
- **Priority:** `P2` (`MOVEMENT-05`).

### A05-06 — Narrow cards and the 768-pixel boundary

- **Purpose:** verify whether the audit facts remain complete and reachable at the supported narrow-desktop range.
- **Route and start:** `/stock-movements?page=1` at `760×768`, then `768×768`.
- **Steps:** inspect the responsive cards and measure body/table widths; increase width by eight pixels to the `md` table breakpoint; measure again.
- **Evidence:** A05-E07 and A05-E08.
- **Observed fact:** at 760 pixels, cards fit without page-level horizontal overflow (`745` client and scroll width). They kept item/SKU, signed quantity/UOM, location, reference, actor, before/after balance, and time.
- **Observed fact:** the cards omit the source type entirely. A `Masuk` row therefore does not say whether it is `Stok awal`, `Penerimaan barang`, `Penyesuaian stok`, `Transfer`, or another server source (`MOVEMENT-02`).
- **Observed fact:** at 768 pixels the page switches to the 1160-pixel table while the fixed navigation rail is present. The table container expands instead of becoming a local scroller: `bodyClientWidth=753`, `bodyScrollWidth=1287`, table width `1160`. A page-level horizontal scrollbar appears and later columns require panning the entire page (`MOVEMENT-01`).
- **Expected:** the responsive presentation preserves source meaning and keeps all audit facts reachable without page-level two-dimensional navigation.
- **Assessment:** the 760-pixel card structure is materially better than the current item table, but it drops a required fact; the next breakpoint introduces a severe overflow cliff.
- **Priority:** `P1` (`MOVEMENT-01`, `MOVEMENT-02`).

### A05-07 — Loading/error implementation evidence and live limitation

- **Purpose:** distinguish live evidence from behavior established only by implementation and automated tests.
- **Repository evidence:** the page announces `Memuat pergerakan stok...`, shows an error alert with `Coba lagi`, replaces rows with a safe unavailable message while errored, and distinguishes filtered/unfiltered empty copy. Its request uses an `AbortController`. Focused tests verify one backend read-model request, error/retry with the same ledger query, filter/paging behavior, and empty state.
- **Automated result:** `node node_modules/vitest/vitest.mjs run src/test/pages/stock-movement/StockMovementList.test.jsx src/test/api/stock-movement.test.js --reporter=verbose` passed 2 files and 4 tests.
- **Live result:** filtered empty was captured. The local API settled too quickly for a useful raw loading frame, and a service failure was not forced because the backend/frontend were the user's shared running environment.
- **Assessment:** no live claim is made for outage recovery or the visible duration of loading.
- **Priority:** no product finding from the unforced paths; limitation remains explicit.

## Findings

| ID | Priority | Classification | Finding |
| --- | --- | --- | --- |
| MOVEMENT-01 | P1 | Live evidence + DOM measurement | At the `md` boundary (`768×768`), the UI replaces fitting cards with a 1160-pixel table whose container expands to its minimum width. The page grows from 753 to 1287 pixels and requires page-level horizontal panning, separating early identity/source columns from later quantity, balance, reference, and actor facts. |
| MOVEMENT-02 | P1 | Live evidence + repository confirmation | The 760-pixel cards omit `sourceType`. Operators can see only `Masuk`/`Keluar`, so receipts, opening balance, adjustments, transfers, and other causes become indistinguishable even though source is a required audit fact and appears in the wide table. |
| MOVEMENT-03 | P1 | Live evidence + inference | Sale and goods-receipt references are readable but not operable; the table has no links. Tracing a movement requires manual cross-domain navigation and a second search despite existing source-detail routes, so the roadmap validation goal is not met. |
| MOVEMENT-04 | P2 | Contract/repository evidence + inference | The backend supports source, action, date-range, and reference filters, while the UI exposes only exact SKU, direction, and location. A user holding a receipt/sale reference or investigating a period cannot refine the ledger directly. |
| MOVEMENT-05 | P2 | Keyboard evidence | Activating `Hapus filter` with Enter clears correctly but leaves focus on `BODY`. The operator loses position because the initiating button disables and no filter or result landmark receives focus. |
| MOVEMENT-06 | P2 | Repository evidence | The frontend source-label map omits the backend's `GOODS_RECEIPT_CANCELLATION` value, so a cancellation row would expose the raw enum instead of Indonesian copy. No matching live row was present. |

No `P0` finding was observed. The page did not calculate stock or mutate any movement, and no duplicate/ambiguous transaction path exists in this read-only workflow.

## Preserved strengths

- The ledger renders one backend read model and does not issue N+1 row-enrichment calls.
- Each wide row contains item identity, SKU, UOM, direction, source, location, signed quantity, before/after balance, reference, actor, and time.
- Decimal quantities remain exact and use Indonesian separators; every quantity carries its UOM.
- Direction is communicated by words and signs as well as color.
- Item-scoped navigation preserves exact SKU in the URL and historical rows remain queryable after item deactivation.
- Filter values and paging are URL-addressable; filter changes reset page 1.
- Loading, actionable error/retry, filtered empty, and unfiltered empty are distinct implemented states.
- At 760 pixels, cards have useful semantic grouping and no body-level horizontal overflow.
- Filter controls have accessible names and a logical keyboard order.
- Paging offers 10, 25, and 50 rows without changing ledger facts.

## Recommendations for UXR-D05 design

These are audit recommendations, not approved implementation requirements:

1. Remove the 768-pixel overflow cliff. Keep the card presentation until the content region can genuinely hold the table, or constrain a necessary wide table inside an intentional labelled scroller with a `min-width: 0` content chain.
2. Preserve source type in every representation. On cards, place localized source next to direction or reference rather than dropping it for compactness.
3. Make references operable for source types that already have backend-supported detail routes, while leaving unsupported sources as clearly labelled static references. Navigation must not require per-row enrichment calls.
4. Add reference/source/date refinement through a calm `Filter lainnya` or similarly progressive pattern so the primary view remains readable for older operators. Do not expose unsupported business rules or create client-side history logic.
5. After clear, return focus to SKU or move it to the updated ledger heading with an appropriate announcement; preserve the current logical tab order.
6. Provide an exhaustive Indonesian source-label mapping, including receipt cancellation, plus a safe human-readable unknown-source fallback.
7. Retain exact quantity/UOM, before/after, actor, time, and location even if the visual hierarchy changes.

## Owner decisions needed for design

1. Confirm the narrow-desktop width/display scaling to optimize beyond the audited 760/768 boundary.
2. Decide whether a source reference opens its detail in the same route, a side panel, or another page; preserve browser back and the current ledger query either way.
3. Decide which of reference, source, and date-range belongs in the always-visible filter row and which belongs under progressive disclosure.
4. Confirm how opening-balance and any source without an implemented detail route should communicate `Tidak ada detail sumber` without appearing broken.

## State-changing actions

None. This audit was read-only. It created no movement or source transaction, changed no item, and performed no cleanup/reseed action.

## Limitations

- The 11-row local ledger included opening balance, goods receipt, and sale movements only. Adjustment, transfer, goods-receipt cancellation/reversal, and stock-opname presentation were not live-tested.
- Live global loading and error states were not forced; their behavior is repository and passing automated-test evidence.
- Reference destinations were assessed only as absent from the ledger. Source-domain detail workflows are deliberately outside UXR-A05 and should be validated in their own audits/designs.
- The exact browser version, Windows display scaling, physical store keyboard, and deployed laptop were unavailable.
- Raw screenshots were inspected inline but are not committed; the durable evidence index records their routes, visible facts, and measurements.

## Evidence index

- Wide list and paging: A05-E01–A05-E02.
- Item-scoped history: A05-E03 and A05-E09.
- Filters and empty recovery: A05-E04–A05-E06.
- Narrow cards and breakpoint overflow: A05-E07–A05-E08.
- Repository and automated verification: [UXR-A05 evidence index](../evidence/uxr-a05/README.md#repository-and-automated-evidence).
