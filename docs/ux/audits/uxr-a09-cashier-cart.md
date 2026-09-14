# UXR-A09 — Cashier search and cart

Status: `EVIDENCE_COMPLETE`  
Execution: read-only repository audit plus live UX audit with one recorded disposable cash-session setup/cleanup mutation  
Audit window: 2026-09-13–14  
Environment: local Bloom frontend (`http://localhost:5173`) and local backend (`http://localhost:8080`), using the documented local `admin` fixture account  
Browser: Codex in-app browser (Chromium-based; exact version unavailable)  
Viewports: 1280×720 wide and 760×768 narrow-desktop override

## Scope and method

This audit covered the implemented cashier item-search and client-side cart workflow only: verified session gating, idle/manual search, active/inactive/unknown lookup outcomes, search-result freshness, add, duplicate add, remove, whole/fractional quantity editing, UOM and advisory STORE availability, announcements, keyboard focus/order, rapid Enter use, and wide/narrow layouts. It did not submit checkout, enter payment, create a sale, print, change inventory administration, or claim physical scanner behavior not observed during this run.

Before live work, the audit read `AGENTS.md`, `docs/architecture/release-1-frontend-contract.md`, `docs/plans/release-1-frontend-roadmap.md`, `docs/plans/release-1-ux-rework-roadmap.md`, the `/cashier` route, `Cashier.jsx`, `CashierCart.jsx`, `BloomQuantityField.jsx`, the keyboard-wedge adapter, current cashier tests, item API/store behavior, and the relevant backend item search/detail and cash-session contracts. Repository inspection was read-only. No application, backend, dependency, configuration, route, or test file was changed.

The governing contract remains:

- item search reads the backend active-item model and does not infer inventory state;
- SKU/name result rows show server price, base UOM, and STORE availability;
- STORE availability is advisory in the cart; the backend rechecks stock during checkout;
- duplicate add increments the existing line by exactly one base unit;
- fractional items accept decimal strings up to four places; whole-unit items reject fractions;
- the cart never calculates or presents an authoritative total;
- manual search remains available without a scanner;
- checkout submission and printing are separate later scopes and were not invoked;
- FE-19's adapter and prior VR-PC evidence exist, but physical store-laptop verification remains outstanding.

The live run used disposable cash session `#12`, opened with `Rp 0`, and closed with server-preview/actual `Rp 0` after the cart was cleared. No sale or other drawer movement occurred. Representative catalog states were:

- active, positive STORE: `Triplek` (`BB-00001`, `50 pcs`) and `Batu Bata` (`BB-00002`, `399 pcs`);
- active, zero STORE, whole-unit: `Tes Scanner E81W` (`8998824554842`, `0 pcs`, fractional quantities disabled);
- active, positive STORE, fractional: `QA FE10 Live 82138041` (`QA-FE10-82138041`, `0,25 meter`, fractional quantities enabled);
- inactive: disposable `UXRA04-WHOLE`, deactivated during UXR-A04 and therefore absent from active cashier search;
- unknown: `UXRA09-NOTFOUND`.

All 22 raw browser-native JPEGs are under [`docs/ux/evidence/uxr-a09`](../evidence/uxr-a09/). Search responses were fast enough that screenshot capture settled on results; this report does not relabel those frames as literal loading evidence.

## Scenario evidence

### A09-01 — Verified open session and idle cart

- **Purpose:** confirm that item entry is enabled only after a server-verified open session and establish the empty search/cart baseline.
- **Route and start:** `/cashier`; initially no open session.
- **Steps:** verify the no-session gate; open disposable session `#12` with opening cash `0`; wait for the open-session read model.
- **Evidence:** [`01` verified open-session baseline](../evidence/uxr-a09/01-cashier-open-session-wide.jpg).
- **Observed fact:** the screen showed `Terbuka`, `Modal awal Rp 0`, actor `admin`, and `13 September 2026, 22:29`. Search became enabled. Results said `Masukkan kata pencarian untuk mulai.` and the cart said `Cari barang lalu tambahkan ke keranjang`.
- **Observed fact:** focus remained on the session-success status `Sesi kas #12 berhasil dibuka.` rather than moving to the newly enabled search input.
- **Expected:** session state gates item entry, the idle state is distinct from a no-result search, and the operator can proceed directly to search.
- **Assessment:** gating and state comprehension match. The post-open focus destination adds a small keyboard detour (`CART-04`).
- **Priority:** `P2` (`CART-04`).

### A09-02 — Manual name/SKU search and result content

- **Purpose:** verify keyboard submission, active result identity, price/UOM, and STORE availability.
- **Route and start:** open session, empty cart.
- **Steps:** enter `Triplek` and press Enter; later search exact SKUs `8998824554842` and `QA-FE10-82138041`.
- **Evidence:** consecutive settled result frames [`02`](../evidence/uxr-a09/02-cashier-search-submit-result-wide.jpg) and [`03`](../evidence/uxr-a09/03-cashier-search-positive-result-wide.jpg), plus the fractional result in [`06`](../evidence/uxr-a09/06-cashier-cart-mixed-uom-advisories-wide.jpg).
- **Observed fact:** results showed item name, stable SKU, formatted base UOM, Indonesian Rupiah price, STORE value, and a labelled `Tambah [item] ke keranjang` action. The QA result preserved four price decimals as `Rp 12.345,6789`, used `meter`, and showed `0,25 meter` STORE.
- **Observed fact:** the search action exposed an implemented polite `Mencari barang...` status in code, but the local backend returned before a raw loading frame could be preserved. Frames `02` and `03` are both settled results.
- **Expected:** manual Enter and button submission converge, and search results carry enough server context to select the right item.
- **Assessment:** matches. No live loading image is claimed.
- **Priority:** no finding.

### A09-03 — Add, duplicate increment, advisory availability, and announcements

- **Purpose:** verify cart insertion, the documented duplicate rule, visible/live feedback, focus return, UOM, and non-authoritative availability.
- **Route and start:** active result rows with open session.
- **Steps:** add Triplek; add Batu Bata and zero-STORE Tes Scanner; add QA; add QA again from the same result.
- **Evidence:** [`04` first add](../evidence/uxr-a09/04-cashier-cart-add-positive-wide.jpg), [`05` zero-STORE whole-unit advisory](../evidence/uxr-a09/05-cashier-cart-whole-zero-advisory-wide.jpg), [`06` mixed cart](../evidence/uxr-a09/06-cashier-cart-mixed-uom-advisories-wide.jpg), and [`07` duplicate announcement](../evidence/uxr-a09/07-cashier-cart-duplicate-announcement-wide.jpg).
- **Observed fact:** a new line started at `1` base unit and announced `[item] ditambahkan ke keranjang.` in a polite status. Duplicate QA add kept one line, changed its quantity from `1` to `2`, and announced `sudah ada; jumlah ditambah 1 meter.`. Focus returned to the search field after every add.
- **Observed fact:** each cart line showed SKU, localized unit price per UOM, explicit quantity UOM, and `Tersedia di STORE`. A cart quantity above the displayed STORE value produced the amber advisory `jumlah keranjang melebihi informasi stok saat ini` followed by `server memeriksa kembali saat checkout.` Zero STORE did not block cart composition.
- **Expected:** duplicate add is deterministic; availability is advisory rather than a browser-owned stock decision; add feedback is visible and announced.
- **Assessment:** authority, focus return, and duplicate behavior match.
- **Priority:** no finding.

### A09-04 — Stale results, inactive item, unknown item, and rapid search Enter

- **Purpose:** ensure an operator cannot add an obsolete result and that inactive/unknown searches settle safely without changing the cart.
- **Route and start:** populated cart; last submitted query `QA-FE10-82138041`.
- **Steps:** edit the search draft to `QA-FE10-82138041 changed` without submitting; search inactive `UXRA04-WHOLE`; search unknown `UXRA09-NOTFOUND`; press Enter twice rapidly for the unknown query.
- **Evidence:** [`08` stale-result protection](../evidence/uxr-a09/08-cashier-search-stale-result-wide.jpg), [`09`](../evidence/uxr-a09/09-cashier-search-inactive-submit-result-wide.jpg) and [`10`](../evidence/uxr-a09/10-cashier-search-inactive-not-found-wide.jpg) for the inactive query, and [`11`](../evidence/uxr-a09/11-cashier-search-rapid-enter-result-wide.jpg) plus [`12`](../evidence/uxr-a09/12-cashier-search-unknown-not-found-wide.jpg) for the rapid unknown query.
- **Observed fact:** editing a settled query immediately disabled `Tambah` and announced that the displayed result belonged to the old query. Searching the known inactive SKU and the unknown SKU both returned `Tidak ada barang aktif untuk “[query]”.`; neither changed the cart.
- **Observed fact:** rapid double Enter produced a safe settled no-result state; request replacement/abort logic prevented stale data from appearing. The UI does not distinguish inactive from unknown in manual active-only search, but its wording accurately avoids saying the inactive SKU does not exist.
- **Expected:** only results for the submitted current query may be added; active-only search does not expose inactive inventory records; repeated search activation cannot surface superseded data.
- **Assessment:** matches. The preceding cart notice persisted above unrelated search outcomes, assessed separately as `CART-01`.
- **Priority:** no additional finding.

### A09-05 — Remove, decimal editing, whole-unit validation, and keyboard recovery

- **Purpose:** verify cart removal, fractional comma input, normalization, whole-unit rejection, checkout safety gating, Escape recovery, and focus behavior.
- **Route and start:** mixed cart with active items.
- **Steps:** remove Batu Bata; enter QA quantity `0,1250` and press Enter; enter Tes Scanner quantity `1,5` and press Enter; press Escape to restore its previous valid quantity.
- **Evidence:** [`13` remove announcement](../evidence/uxr-a09/13-cashier-cart-remove-announcement-wide.jpg), [`14` fractional editing draft](../evidence/uxr-a09/14-cashier-cart-fractional-draft-wide.jpg), [`15` committed decimal](../evidence/uxr-a09/15-cashier-cart-fractional-committed-wide.jpg), and [`16` whole-unit rejection](../evidence/uxr-a09/16-cashier-cart-whole-decimal-validation-wide.jpg).
- **Observed fact:** remove deleted only the selected client-side line, announced `[item] dihapus dari keranjang.`, and returned focus to search. Fractional comma input remained `0,1250` while editing, normalized to `0.125` on Enter, rendered `0,125 meter` in the cart intent, and returned focus to search.
- **Observed fact:** the whole-unit `1,5` draft produced `Barang ini hanya dapat dijual dalam jumlah utuh.`, retained focus on the invalid field, and disabled the checkout controls. Escape restored `1`, cleared the error, and returned focus to search. No checkout action was activated.
- **Expected:** editing strings are preserved while typing, valid quantities normalize only at commit, invalid whole-unit values are not accepted, and the next safe focus target is predictable.
- **Assessment:** matches and is a strong keyboard/error-recovery sequence.
- **Priority:** no finding.

### A09-06 — Focus order and rapid keyboard add

- **Purpose:** verify traversal order and prevent a fast repeated activation from adding more than the operator can perceive.
- **Route and start:** open session; search result visible; three cart lines.
- **Steps:** Tab from search through result/cart controls; focus the QA result's add action; press Enter twice rapidly.
- **Evidence:** [`20` rapid keyboard result](../evidence/uxr-a09/20-cashier-rapid-keyboard-add-result-narrow-760x768.jpg); the focus trace is recorded below.
- **Observed fact:** the measured order was search → `Cari` → first row remove → first enabled quantity input → increment → next row remove → quantity → increment, with disabled decrement buttons skipped. Every control had a meaningful accessible label or associated field label.
- **Observed fact:** the first Enter on the QA add action incremented `0.125` to `1.125` exactly once and immediately returned focus to search. The second Enter therefore reran search rather than incrementing again. The cart announced one `jumlah ditambah 1 meter` result and did not submit checkout.
- **Expected:** Tab order follows visual/workflow order, disabled controls are skipped, feedback is announced, and fast item-entry activation cannot spill into checkout.
- **Assessment:** matches.
- **Priority:** no finding.

### A09-07 — Wide and narrow layout

- **Purpose:** verify that search/results and cart remain usable at the wide cashier workspace and the 760-pixel stacked breakpoint.
- **Route and start:** mixed cart and active QA result.
- **Steps:** inspect the two-pane 1280×720 view; apply 760×768; inspect top/search, result, cart editing, and cleared-cart states; measure overflow; restore the default viewport.
- **Evidence:** wide frames [`04`](../evidence/uxr-a09/04-cashier-cart-add-positive-wide.jpg), [`06`](../evidence/uxr-a09/06-cashier-cart-mixed-uom-advisories-wide.jpg), and [`16`](../evidence/uxr-a09/16-cashier-cart-whole-decimal-validation-wide.jpg); narrow frames [`17`](../evidence/uxr-a09/17-cashier-mixed-cart-narrow-top-760x768.jpg)–[`21`](../evidence/uxr-a09/21-cashier-cart-cleared-narrow-760x768.jpg).
- **Observed fact:** wide layout kept search/results and cart side by side. The cart itself used a vertical scroll area once four lines exceeded its height. The focused two-pane hierarchy remained readable and had no page-level horizontal overflow.
- **Observed fact:** at 760×768 the workspace stacked vertically with `document.body.scrollWidth=760`. The narrow result table fit its container (`681` client and scroll width). Search, price, UOM, STORE, and add action remained visible without horizontal panning.
- **Observed fact:** the main content became a 720-pixel-high scroll region with `1669` pixels of content. Inside it, the populated cart added another 422-pixel-high scroll region containing 590 pixels of lines. Reaching and reviewing a lower cart item therefore required scrolling the outer cashier content and then the inner cart. Keyboard focus did reveal targeted fields automatically.
- **Expected:** supported narrow desktop preserves the frequent search-to-cart loop without hidden horizontal content or confusing nested navigation.
- **Assessment:** horizontal responsiveness is strong; two nested vertical scroll regions increase narrow cashier effort (`CART-03`).
- **Priority:** `P1` (`CART-03`).

### A09-08 — Scanner boundary

- **Purpose:** limit scanner findings to hardware actually available in this audit environment.
- **Live result:** no physical E81W input was presented to the browser during this run. A read-only Windows device query was denied, so it could not establish a current scanner identity. No synthetic keyboard-wedge event stream, clipboard paste, camera scan, or guessed timing was used as a substitute.
- **Repository fact:** the adapter listens for an Enter-terminated sequence with a 30 ms maximum inter-key delay and queues lookups. Automated tests cover active, inactive, unknown, duplicate, rapid-distinct, draft-preservation, and ordering cases using the previously documented VR-PC measurements. Those tests are not live hardware evidence for this audit or the store laptop.
- **Observed UI fact:** whenever a session is open, the page says `Pemindai barcode E81W siap saat sesi kas terbuka.`. The component derives that sentence from session state only; it performs no scanner-presence/readiness check.
- **Expected:** manual search remains usable when scanner availability is unknown, and the interface must not overstate a physical device state it has not verified.
- **Assessment:** manual fallback remained fully usable. The readiness wording overclaims current hardware state (`CART-02`). FE-19 remains `IN_PROGRESS`.
- **Priority:** `P1` (`CART-02`).

### A09-09 — Cart/session cleanup

- **Purpose:** leave no draft cart or open disposable drawer session.
- **Steps:** remove Triplek, Tes Scanner E81W, and QA; verify empty-cart copy; close session `#12` with the server preview and actual value both `0`; reauthenticate after the long run and verify no current session.
- **Evidence:** [`21` cleared cart](../evidence/uxr-a09/21-cashier-cart-cleared-narrow-760x768.jpg) and [`22` verified no-session cleanup](../evidence/uxr-a09/22-cashier-session-cleanup-verified.jpg).
- **Observed fact:** the final cart contained no lines and no checkout UI. The final server read showed `Belum ada sesi kas yang terbuka. Masukkan modal awal untuk mulai.` and disabled search/cart entry.
- **Assessment:** cleanup complete. No inventory or sale mutation occurred.
- **Priority:** no finding.

## Findings

| ID | Priority | Classification | Finding |
| --- | --- | --- | --- |
| CART-01 | P1 | Live evidence + inference | The latest cart success notice persists while the operator performs unrelated searches. For example, `Batu Bata dihapus dari keranjang.` remained as a green status above inactive/unknown no-result states and a later QA result. In a rapid cashier loop, stale success feedback can be mistaken for the current search outcome. |
| CART-02 | P1 | UI/repository evidence + inference | The page says the E81W scanner is `siap` whenever the session is open, but readiness is derived only from session state and no connected-device signal. This audit had no verified scanner hardware, so the copy overstates a physical condition and FE-19 cannot be cleared. |
| CART-03 | P1 | Live measurement + inference | At 760×768, search/results and cart stack without horizontal overflow, but the 1669-pixel cashier content scroll contains a second 422/590-pixel cart scroll region. Moving between search and lower cart lines requires two vertical scroll contexts in a high-frequency workflow. |
| CART-04 | P2 | Live focus evidence + inference | After opening the disposable session, focus remained on the session-success status rather than moving to the newly enabled search field. The success is announced, but keyboard item entry needs an additional navigation step. |

No `P0` finding was observed. Duplicate/rapid activation did not submit checkout, invalid quantities disabled checkout, stale search results could not be added, and the cart remained a client-side draft throughout.

## Preserved strengths

- Search is explicitly gated by a verified open session, with distinct idle and no-session explanations.
- Manual name and SKU search use one labelled field and support Enter without requiring a mouse.
- Result rows show stable identity, localized price, base UOM, STORE value, and a labelled add action.
- Editing a submitted query immediately marks old results stale and disables their add actions.
- Active-only no-result wording does not falsely claim that an inactive SKU never existed.
- Add, duplicate, and remove messages are polite live statuses; add/remove and valid commit return focus to search.
- Duplicate add and plus/minus controls change exactly one base unit and disclose that rule before interaction.
- Fractional editing preserves comma/dot drafts up to four places and normalizes only on commit.
- Whole-unit validation is specific, retains focus, and blocks the later checkout action until corrected.
- UOM appears in results, cart price context, quantity fields, step-button labels, availability, and cart intent.
- Zero or exceeded STORE stock is presented as advisory, with explicit server recheck language.
- Rapid Enter on add cannot cascade into checkout because focus returns to search immediately.
- Both wide and narrow layouts avoid horizontal page scrolling; the narrow result table retains all four columns/actions.

## Recommendations for design work

These are audit recommendations, not approved requirements or implementation work:

1. Clear, replace, or time-bound cart notices when a new search starts so the visible status always corresponds to the current operator action.
2. Replace unconditional scanner-ready wording with connection-agnostic guidance unless the product gains a real device readiness signal. Preserve manual search as the guaranteed fallback.
3. Reconsider the narrow cart's nested scrolling while preserving every line's UOM, STORE advisory, quantity validation, and remove action.
4. Decide whether post-session-open focus should remain on the success status for acknowledgement or move to search after the status is announced; document one predictable rule.

## Owner decisions needed

1. Approve the lifetime and replacement rule for cart notices during subsequent searches.
2. Approve scanner copy that distinguishes configured capability from currently verified hardware. Do not mark FE-19 complete without the store-laptop physical run.
3. Confirm the real store-laptop viewport and whether the 760×768 nested-scroll cost is representative of deployed cashier hardware.
4. Choose the canonical focus destination after opening a session for the cashier workflow.

## State-changing actions and cleanup

| Time (Asia/Jakarta) | Action | Input | Server/UI result | Cleanup/disposition |
| --- | --- | --- | --- | --- |
| 2026-09-13 22:29 | Opened disposable cash session | Opening cash `0` | Session `#12` opened; server UI showed `Rp 0`, `admin`, `Terbuka` | Used only to enable search/cart; no sale or drawer movement |
| 2026-09-13 22:30–22:36 | Added, duplicated, edited, and removed cart lines | Triplek, Batu Bata, Tes Scanner E81W, QA FE10; quantities including `0,1250` and invalid whole `1,5` | Client-side draft only; no checkout request | Every cart line removed before session close |
| 2026-09-13; verified 2026-09-14 | Closed disposable cash session, then re-verified after reauthentication | Server expected `Rp 0`; actual `0` | Close request succeeded; later server read returned verified no-session | Session `#12` closed; no open disposable session remains |

Cart operations did not persist to the backend. No item was created, edited, activated, deactivated, sold, received, adjusted, transferred, or otherwise changed. No checkout or print action was invoked.

## Limitations

- No physical scanner input was available to the browser. Scanner behavior is not claimed, simulated, or generalized from automated tests.
- Current Windows scanner identity could not be enumerated because the read-only device query was denied. This does not prove hardware absence; it limits this audit to “not verified.”
- Search responses from the local backend settled before browser screenshot capture could preserve a literal `Mencari barang...` frame. Loading exists in the inspected component and was exercised, but the raw frames are settled outcomes.
- A live search API failure was not forced because stopping/intercepting the shared local services could affect other work. The focused error/retry state remains repository/test evidence only.
- Manual active-only search intentionally gives the same safe no-result copy for an inactive exact SKU and an unknown SKU. Direct scanner-detail differentiation was not exercised without hardware.
- Keyboard checks used browser automation rather than a physical store keyboard.
- Browser version, Windows display scaling, and actual store-laptop viewport were unavailable.
- Checkout fields were visible after adding a line because they share the current page, but they were not populated, submitted, or audited.

## Evidence index

- Session gate and idle baseline: [`01`](../evidence/uxr-a09/01-cashier-open-session-wide.jpg).
- Manual search and first add: [`02`](../evidence/uxr-a09/02-cashier-search-submit-result-wide.jpg)–[`04`](../evidence/uxr-a09/04-cashier-cart-add-positive-wide.jpg).
- Mixed cart, duplicate, and advisory availability: [`05`](../evidence/uxr-a09/05-cashier-cart-whole-zero-advisory-wide.jpg)–[`07`](../evidence/uxr-a09/07-cashier-cart-duplicate-announcement-wide.jpg).
- Stale, inactive, unknown, and rapid search: [`08`](../evidence/uxr-a09/08-cashier-search-stale-result-wide.jpg)–[`12`](../evidence/uxr-a09/12-cashier-search-unknown-not-found-wide.jpg).
- Remove and quantity editing: [`13`](../evidence/uxr-a09/13-cashier-cart-remove-announcement-wide.jpg)–[`16`](../evidence/uxr-a09/16-cashier-cart-whole-decimal-validation-wide.jpg).
- Narrow layout and rapid keyboard add: [`17`](../evidence/uxr-a09/17-cashier-mixed-cart-narrow-top-760x768.jpg)–[`20`](../evidence/uxr-a09/20-cashier-rapid-keyboard-add-result-narrow-760x768.jpg).
- Cart/session cleanup: [`21`](../evidence/uxr-a09/21-cashier-cart-cleared-narrow-760x768.jpg)–[`22`](../evidence/uxr-a09/22-cashier-session-cleanup-verified.jpg).

The raw sequence intentionally keeps settled duplicate frames from fast local searches. It does not manufacture loading or scanner evidence that the environment could not provide.
