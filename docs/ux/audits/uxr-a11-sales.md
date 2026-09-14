# UXR-A11 — Sales history, detail, and reprint audit

Audit status: `EVIDENCE_COMPLETE`  
Audit date: 2026-09-15  
Environment: local Bloom frontend (`http://localhost:5173`) and backend (`http://localhost:8080`), using the documented disposable `admin` fixture  
Browser: Codex in-app browser (Chromium-based; exact version unavailable)  
Viewports: 1280×768 wide and 760×768 narrow-desktop override

## Scope and method

This audit covered only the implemented sales read workflow: `/sales`, sale detail, the supported code/creator/date filters, available paging controls, server-returned statuses and monetary values, CASH/QRIS records, detail hierarchy, persisted line UOM/location, cash-session/reference context, receipt reprint, keyboard order, focus feedback, and wide/narrow behavior. It did not submit checkout, create or correct a sale, export/report, change inventory, infer a financial status, redesign, implement, or change dependencies.

Before live work, the audit read `AGENTS.md`, `docs/architecture/release-1-frontend-contract.md`, both Release 1 roadmaps, the completed UXR-A10 report, the sales pages/components/store/API and focused tests, plus the backend `SaleController`, `FilterSaleRequest`, `SaleResponse`, `SaleServiceImpl`, `PrintController`, and `PrintServiceImpl`. Repository and backend inspection was read-only.

Evidence labels used below:

- **LIVE-UI:** directly observed on the running localhost application.
- **SERVER-RECORD:** a persisted sale read again through the live detail endpoint/UI; monetary and status facts are rendered, not recomputed here.
- **LIVE-MEASUREMENT:** browser viewport, overflow, or focus state read from the rendered page.
- **REPOSITORY:** behavior established by current source without claiming it was observed live.
- **AUTOMATED-STATE:** an existing focused test used for a state that settled too quickly or was unsafe to force against the shared local service/printer.
- **INFERENCE:** a UX implication based on cited evidence, kept separate from observed facts.

## Authoritative contract inspected

- FE-22 requires the list/detail to render backend-confirmed decimal lines, totals, payment/lifecycle/correction statuses, tender/change, cash session, reference, and only the supported filters. The frontend must not infer paid state.
- `FilterSaleRequest` exposes exactly `code`, `createdBy`, `startDate`, and `endDate`; the service applies stable descending `createdAt`, then `id`, paging.
- `SaleResponse` supplies `saleStatus`, `paymentStatus`, `correctionStatus`, subtotal, discount, total, paid/change amounts, payment type, timestamps, actor, session ID, and persisted lines.
- Reprint is a separate `POST /api/print` containing only `saleCode`. The sale store guards a same-reference pending operation; it does not call sale creation.

## Representative persisted records

| Sale | Purpose in this audit | Server-rendered facts |
| --- | --- | --- |
| `SALE/IX-2026/0003` | QRIS and live reprint | Session `#13`; `Selesai`; `Lunas`; QRIS; Batu Bata `1 pcs`, `Toko`; total/paid `Rp 1.000`; change `Rp 0` |
| `SALE/IX-2026/0002` | Whole-unit CASH | Session `#13`; `Selesai`; `Lunas`; Tunai; Triplek `1 pcs`, `Toko`; total `Rp 100.000`; received `Rp 150.000`; change `Rp 50.000` |
| `SALE/IX-2026/0001` | Additional UOM coverage | Session `#6`; Tunai; Palu Thor `2 kg`, `Toko`; total `Rp 1.999.998` |
| `SALE/VIII-2026/0001` | Mixed lines, decimal money, and narrow cards | Session `#5`; Tunai; `2 pcs`, `1 meter`, and `1 pcs`, all `Toko`; total `Rp 13.745,6789`; received `Rp 111.111`; change `Rp 97.365,3211` |

The four available sales cover CASH, QRIS, PIECE, KILOGRAM, and METER display. None contains a fractional persisted quantity: the METER line is exactly `1 meter`. The focused existing test verifies rendering `1.2500` as `1,25 meter`, but that is **AUTOMATED-STATE**, not a live server record. No new sale was created because checkout was explicitly out of scope.

## Scenario results

### A11-01 — Initial list, loading boundary, status, money, and order

- **Steps:** enter `/sales` through the protected route; inspect all visible rows; reload and revisit the route.
- **Evidence:** [wide list](../evidence/uxr-a11/01-sales-list-wide.jpg); [route-level session verification](../evidence/uxr-a11/13-sales-list-navigation-immediate-narrow.jpg); [automated state transcript](../evidence/uxr-a11/automated-safety-tests.txt).
- **LIVE-UI fact:** four rows appeared newest-first. Each row exposed reference, creator, sale status, payment status/method, server total, localized timestamp, and a detail action. Both `Tunai` and `QRIS` were immediately distinguishable.
- **LIVE-UI fact:** the first raw navigation frame showed the upstream protected-route `Memeriksa sesi...` state. The subsequent sales request settled too quickly for a raw `Memuat penjualan...` frame.
- **AUTOMATED-STATE fact:** the existing list test passed for `Memuat penjualan...`, then the empty state, and for error plus same-filter retry.
- **Assessment:** server authority, list ordering, and row comprehension are strong. Literal sales-loader imagery remains an evidence limitation rather than being substituted with the session loader.

### A11-02 — Code, creator, date, and empty filtering

- **Steps:** submit an impossible code with Enter; clear; select `Dibuat oleh` and submit uppercase `ADMIN`; apply 2026-09-14 as both date bounds; try a start date later than the end date.
- **Evidence:** [empty code result](../evidence/uxr-a11/05-code-filter-empty-wide.jpg), [blocked invalid range](../evidence/uxr-a11/06-invalid-date-range-native-block-wide.jpg), [same-day result](../evidence/uxr-a11/07-date-filter-results-wide.jpg), and [creator result](../evidence/uxr-a11/08-created-by-filter-case-insensitive-wide.jpg).
- **LIVE-UI fact:** the impossible code produced `Tidak ada penjualan` and filter-specific recovery copy. Uppercase `ADMIN` returned all four lowercase-creator records. The same-day filter returned only the two 14 September sales.
- **LIVE-UI fact:** start-after-end was blocked before the React submit handler ran. Chromium focused the segmented date field and displayed `Value must be 09/14/2026 or earlier.`; the authored Indonesian warning did not appear.
- **REPOSITORY fact:** the form supplies dynamic native `min`/`max` constraints and separately defines `Tanggal mulai tidak boleh setelah tanggal akhir.` in `applyFilters`. Native constraint validation prevents that submit path in this browser.
- **Assessment:** the supported filter contract works, but the invalid-range recovery is inconsistent with the application's language and date convention (`SALES-02`).

### A11-03 — Paging and result-count boundary

- **Steps:** change `Data per halaman` from 10 to the minimum option 5 and inspect page controls.
- **Evidence:** [page-size five](../evidence/uxr-a11/09-page-size-five-single-page-wide.jpg).
- **LIVE-UI fact:** the URL and control updated to `size=5`; all four rows remained on page 1. Previous and next were disabled because the fixture set does not exceed one page.
- **REPOSITORY fact:** supported sizes are 5, 10, 25, and 50; page changes are server-paged and URL-backed.
- **Assessment:** page-size and single-page boundaries were exercised. Multi-page previous/next behavior could not be observed without creating more sales, so it remains repository/test evidence only.

### A11-04 — CASH/QRIS detail hierarchy and server values

- **Steps:** open the QRIS sale, whole-unit CASH sale, and mixed-line CASH sale from the history/read routes; compare reference, statuses, session, payment method, tender/change, and lines.
- **Evidence:** [QRIS before reprint](../evidence/uxr-a11/03-qris-detail-wide-before-reprint.jpg), [whole-unit CASH](../evidence/uxr-a11/16-whole-unit-cash-detail-wide.jpg), and [mixed CASH](../evidence/uxr-a11/02-fractional-capable-cash-detail-wide.jpg).
- **SERVER-RECORD fact:** all values in the representative-record table were present after direct route loads. QRIS uses `Nominal QRIS`; CASH uses `Uang diterima`. Every record showed `Selesai`, `Lunas`, and `Tanpa pembatalan/retur` as separate server status values.
- **LIVE-UI fact:** the visible hierarchy separates identity/status, transaction/session context, totals/tender/change, then persisted line detail. No total, payment status, or change was calculated during the audit.
- **Accessibility fact:** the list has an `h2`/`h3` structure, but detail's two visible section titles are both semantic heading level 6 and the page has no higher content heading (`SALES-03`).
- **Assessment:** visual and financial hierarchy is strong; semantic heading hierarchy is not equivalent to it.

### A11-05 — Line UOM, fractional boundary, and location

- **Steps:** inspect all four sale details, including PIECE, KILOGRAM, and METER lines; inspect desktop table and narrow cards.
- **Evidence:** [mixed detail wide](../evidence/uxr-a11/02-fractional-capable-cash-detail-wide.jpg) and [mixed detail narrow](../evidence/uxr-a11/11-fractional-capable-cash-detail-narrow.jpg).
- **SERVER-RECORD fact:** lines show item name/SKU, `Toko` for backend `STORE`, quantity plus localized UOM (`pcs`, `kg`, `meter`), unit price, and stored line subtotal.
- **AUTOMATED-STATE fact:** the focused test passed for `1.2500 METER` → `1,25 meter` and `STORE` → `Toko`.
- **Assessment:** UOM/location comprehension is explicit. A fractional-enabled item with integral quantity does not prove live fractional-quantity display; that missing fixture is reported, not generalized.

### A11-06 — Reprint pending, success, safe failure, and retry

- **Steps:** trigger `Cetak ulang struk` once for QRIS sale `SALE/IX-2026/0003`; inspect sale-scoped feedback and focus. Do not disconnect or reconfigure the shared printer.
- **Evidence:** [before reprint](../evidence/uxr-a11/03-qris-detail-wide-before-reprint.jpg), [live success](../evidence/uxr-a11/04-qris-reprint-immediate-wide.jpg), [focused reprint control](../evidence/uxr-a11/12b-reprint-focus-narrow.jpg), and [automated state transcript](../evidence/uxr-a11/automated-safety-tests.txt).
- **LIVE-UI fact:** the backend call returned application success and the page rendered/focused `Penjualan SALE/IX-2026/0003. Struk berhasil dicetak.`. Reference, statuses, payment values, and detail remained unchanged. No checkout or sale-create UI appeared.
- **LIVE-UI fact:** localhost printing settled before a raw pending screenshot could be retained. Physical paper/queue output was not independently inspected; “success” here means the application/backend acknowledgment.
- **AUTOMATED-STATE fact:** existing tests passed for pending label/disabled duplicate click, one print request, focused success, printer-not-found failure, uncertain network outcome, false acknowledgment, same-sale retry, and `createSale` never being called.
- **REPOSITORY fact:** detail passes only `saleReference` to the print store; a pending same-reference request returns early; the store's print path calls only `/api/print`.
- **Assessment:** reprint is a separate, sale-scoped operation and cannot resubmit a sale. The settled success does not identify the latest attempt beyond the retained reference (`SALES-04`).

### A11-07 — Safe error and retry surfaces

- **Steps:** navigate to the non-existent read-only reference `UXR-A11-TIDAK-ADA`; inspect error and retry affordances. Do not stop/intercept the shared backend.
- **Evidence:** [detail not-found](../evidence/uxr-a11/18-sale-detail-not-found-error-wide.jpg) and [automated state transcript](../evidence/uxr-a11/automated-safety-tests.txt).
- **LIVE-UI fact:** detail showed `Data yang diminta tidak ditemukan.`, `Coba lagi`, and `Kembali ke daftar`; no reprint action was exposed for the missing record.
- **AUTOMATED-STATE fact:** list error preserves the active code filter on retry; detail route changes clear stale errors.
- **Assessment:** the safe 404 recovery is clear. A genuine list transport/server error was not forced against the shared local services.

### A11-08 — Keyboard order and focus

- **Steps:** reload list/detail; traverse only with Tab/Shift+Tab; submit filters with Enter; return from detail with Enter; inspect focus after print success and when a row action is reached on narrow layout.
- **Evidence:** [narrow reprint focus](../evidence/uxr-a11/12b-reprint-focus-narrow.jpg) and [narrow row-action focus/pan](../evidence/uxr-a11/17b-sales-list-first-detail-focus-narrow.jpg).
- **LIVE-MEASUREMENT fact:** narrow detail order was navigation toggle → breadcrumb sales link → `Kembali` → `Cetak ulang struk`; Enter on `Kembali` returned to the list. Reprint success moved focus to the sale-scoped status.
- **LIVE-MEASUREMENT fact:** narrow list order was navigation toggle → filter type → query → native date segments → apply → page size → page 1 → row detail actions. The two native date controls contributed eight indistinguishable date-input stops in this Chromium accessibility trace.
- **LIVE-MEASUREMENT fact:** reaching the first `Detail` link caused automatic horizontal panning to `scrollX=222`, revealing the action while moving the left context offscreen.
- **Assessment:** controls are keyboard operable and focus feedback after print is deliberate. Date-field traversal/localization and page-level horizontal panning add avoidable keyboard cost (`SALES-01`, `SALES-02`).

### A11-09 — Wide and narrow responsive behavior

- **Steps:** inspect list and detail at 1280×768; apply 760×768; measure document/table width; inspect both initial and keyboard-panned narrow states; restore the viewport override.
- **Evidence:** [wide list](../evidence/uxr-a11/01-sales-list-wide.jpg), [narrow full extent](../evidence/uxr-a11/10-sales-list-narrow.jpg), [narrow initial viewport](../evidence/uxr-a11/10b-sales-list-narrow-viewport.jpg), [narrow detail](../evidence/uxr-a11/11-fractional-capable-cash-detail-narrow.jpg), and [keyboard-panned list](../evidence/uxr-a11/17b-sales-list-first-detail-focus-narrow.jpg).
- **LIVE-MEASUREMENT fact:** at 760 pixels, the list document measured 952 pixels wide and the 920-pixel table expanded its container. The initial viewport clipped part of `Dibuat` and all row `Detail` actions; the whole page, not a clearly bounded table region, had to pan.
- **LIVE-MEASUREMENT fact:** at the same viewport, detail measured exactly 760 pixels wide, hid the desktop table, and rendered three line cards. Reference, status, session, totals, UOM, location, and reprint remained available without horizontal panning.
- **Assessment:** detail responsiveness is effective; list responsiveness is a material narrow-desktop failure (`SALES-01`).

### A11-10 — Final state and cleanup

- **LIVE-UI fact:** the audit finished at unfiltered `/sales` with the temporary viewport override reset. No cash session, cart, sale, stock, correction, report, or dependency state was created or changed.
- **State-changing fact:** one backend reprint request was submitted for existing QRIS sale `SALE/IX-2026/0003`. A print job cannot be meaningfully undone; no repeat was sent for cleanup. The sale record remained unchanged.
- **Assessment:** business-data cleanup is complete because no business record was created. The print attempt is retained in the ledger below.

## Findings

No `P0` finding was observed.

| ID | Priority | Evidence type | Finding |
| --- | --- | --- | --- |
| SALES-01 | P1 | LIVE-UI + LIVE-MEASUREMENT + INFERENCE | The sales table creates page-level horizontal overflow (952-pixel document at a 760-pixel viewport). `Dibuat` is clipped and every `Detail` action starts offscreen; keyboard focus pans the entire page to `scrollX=222`, removing left-side context. |
| SALES-02 | P1 | LIVE-UI + REPOSITORY + INFERENCE | Native date fields display `mm/dd/yyyy` and block an inverted range with the English message `Value must be 09/14/2026 or earlier.`. The implemented Indonesian warning is not reached in this browser, creating a language/date-convention mismatch at the exact recovery point. |
| SALES-03 | P2 | LIVE-UI + REPOSITORY | Detail has clear visible sections but no page-level content heading; `Informasi Penjualan` and `Daftar Barang` are both semantic `h6` headings. Assistive-technology hierarchy is materially weaker than the visual hierarchy. |
| SALES-04 | P2 | LIVE-UI + INFERENCE | A successful reprint leaves the same persistent `Struk berhasil dicetak` state used by earlier successful print outcomes, with no attempt timestamp or transient “latest reprint” distinction. The sale reference remains safe, but a fast later reprint is hard to distinguish from retained success. |

## Preserved strengths

- The list explicitly says payment values/statuses are server-confirmed and renders the DTO fields directly.
- CASH and QRIS labels, tender labels, and change remain distinct without locally inferred paid state.
- References, cash-session IDs, actors, dates, correction state, and line facts have a clear visible hierarchy.
- Decimal money is preserved with Indonesian grouping and comma precision (`Rp 13.745,6789`); timestamps use Indonesian weekday plus 24-hour time.
- PIECE, KILOGRAM, and METER quantities keep UOM beside the number; every live sale line keeps its `Toko` location.
- Code/creator/date filters are URL-backed; empty-filter recovery is explicit; page size is server-paged.
- Narrow detail replaces the wide table with readable cards and has no horizontal overflow.
- Reprint feedback is sale-scoped, focused, duplicate-guarded, and separate from sale creation.
- Missing detail does not expose reprint and provides retry/back recovery.

## Recommendations for design work

1. Contain the list table in an intentional, visibly scrollable region or introduce an approved narrow row/card presentation that keeps reference, status/payment, total/date, and `Detail` discoverable without page-level panning.
2. Provide application-owned Indonesian date-range validation and a consistent Indonesian input hint while preserving the exact backend date-filter contract and timezone boundary.
3. Give sale detail one semantic page heading and nest information/line headings below it without changing the visual hierarchy.
4. If operations needs proof of the latest reprint attempt, define server-supported acknowledgment time or clearly transient latest-attempt feedback. Do not imply physical-paper success the system cannot verify.
5. Preserve backend-rendered status/financial values and the sale-reference-only print coordinator in any future design.

## Owner decisions needed

1. Confirm whether 760×768 represents a supported back-office laptop viewport; it is the roadmap-consistent audit breakpoint, not a claim about deployed hardware.
2. Choose whether narrow sales history should use a bounded horizontal table or a compact record/card pattern while retaining all current server facts.
3. Approve an Indonesian date-input/display convention for native calendar controls and validation.
4. Decide whether backend print acknowledgment should continue to be labelled `berhasil dicetak` or use wording that does not claim physical output, and whether the latest reprint needs a timestamp.
5. Provide or approve a disposable persisted fractional-quantity sale fixture for a later regression run; this audit did not create one because checkout was out of scope.

## State-changing actions and cleanup ledger

| Time (Asia/Jakarta) | Action | Reference/payload | Result | Cleanup |
| --- | --- | --- | --- | --- |
| 00:20 | Local fixture sign-in | `admin` account to `localhost:5173` | Authenticated local browser session | No business-domain record changed; session left available in the local audit tab |
| 00:22 | Receipt reprint | `saleCode: SALE/IX-2026/0003` | Backend/application success; sale-scoped success focused | Print job cannot be reversed; no second cleanup print; sale data unchanged |

All filter submissions, paging, route reads, focus traversal, viewport changes, screenshots, and test runs were non-mutating with respect to backend business data. The viewport override was reset. No checkout, correction, export, report, inventory administration, dependency installation, or source-code change occurred.

## Limitations

- The four persisted sales contain no fractional numeric quantity. `1 meter` proves METER/UOM rendering, not `1,25 meter` live behavior; the latter is labelled automated evidence.
- The local sales list and detail requests settled too quickly for raw domain-loader screenshots. The captured `Memeriksa sesi...` frame is the upstream protected-route state, not relabelled as the sales loader.
- A live list error was not induced by stopping or intercepting shared services. List loading/error/retry are existing test evidence only; the safe live detail 404 was exercised.
- Paging controls were exercised with the minimum size, but only four records exist, so previous/next stayed disabled and a second page was not created.
- Printer disconnection/network ambiguity were not forced. Pending/failure/retry/duplicate safety is labelled automated evidence. Live success is an application/backend acknowledgment; physical paper and the operating-system queue were not independently verified.
- All live records had backend `STORE`, rendered as `Toko`; no sale with another line location exists because checkout is STORE-scoped.
- Browser version, Windows display scaling, and deployed store-laptop dimensions were unavailable.

## Evidence index

| Evidence | Source | State |
| --- | --- | --- |
| [01](../evidence/uxr-a11/01-sales-list-wide.jpg) | LIVE-UI | Unfiltered wide list, statuses, methods, money, timestamps, and paging |
| [02](../evidence/uxr-a11/02-fractional-capable-cash-detail-wide.jpg) | SERVER-RECORD | Mixed-line CASH detail with PIECE/METER and decimal money |
| [03](../evidence/uxr-a11/03-qris-detail-wide-before-reprint.jpg) | SERVER-RECORD | QRIS detail before reprint |
| [04](../evidence/uxr-a11/04-qris-reprint-immediate-wide.jpg) | LIVE-UI | Genuine backend/application reprint success |
| [05](../evidence/uxr-a11/05-code-filter-empty-wide.jpg) | LIVE-UI | Code-filter empty state |
| [06](../evidence/uxr-a11/06-invalid-date-range-native-block-wide.jpg) | LIVE-UI | English native date validation blocking inverted range |
| [07](../evidence/uxr-a11/07-date-filter-results-wide.jpg) | LIVE-UI | Supported same-day filter |
| [08](../evidence/uxr-a11/08-created-by-filter-case-insensitive-wide.jpg) | LIVE-UI | Creator filter submitted with Enter |
| [09](../evidence/uxr-a11/09-page-size-five-single-page-wide.jpg) | LIVE-UI | Minimum page size and single-page boundary |
| [10](../evidence/uxr-a11/10-sales-list-narrow.jpg) | LIVE-MEASUREMENT | Full narrow document extent showing 967-pixel captured overflow extent |
| [10b](../evidence/uxr-a11/10b-sales-list-narrow-viewport.jpg) | LIVE-UI | Initial 760-pixel list viewport with clipped columns/actions |
| [11](../evidence/uxr-a11/11-fractional-capable-cash-detail-narrow.jpg) | LIVE-UI | Narrow detail/card layout without horizontal overflow |
| [12](../evidence/uxr-a11/12-detail-keyboard-focus-narrow.jpg) | LIVE-UI | Narrow detail during keyboard traversal |
| [12b](../evidence/uxr-a11/12b-reprint-focus-narrow.jpg) | LIVE-UI | Visible keyboard focus on reprint |
| [13](../evidence/uxr-a11/13-sales-list-navigation-immediate-narrow.jpg) | LIVE-UI | Raw protected-route session verification frame |
| [14](../evidence/uxr-a11/14-sales-list-request-immediate-narrow.jpg) | LIVE-UI | Fast-settled list after page-size request |
| [15](../evidence/uxr-a11/15-detail-navigation-immediate-narrow.jpg) | LIVE-UI | Fast-settled narrow detail navigation |
| [16](../evidence/uxr-a11/16-whole-unit-cash-detail-wide.jpg) | SERVER-RECORD | Whole-unit CASH detail |
| [17](../evidence/uxr-a11/17-sales-list-keyboard-detail-focus-narrow.jpg) | LIVE-UI | Narrow list keyboard traversal sequence |
| [17b](../evidence/uxr-a11/17b-sales-list-first-detail-focus-narrow.jpg) | LIVE-MEASUREMENT | Page panned to `scrollX=222` when row action received focus |
| [18](../evidence/uxr-a11/18-sale-detail-not-found-error-wide.jpg) | LIVE-UI | Safe missing-detail error and recovery actions |
| [Automated state transcript](../evidence/uxr-a11/automated-safety-tests.txt) | AUTOMATED-STATE | Existing list/detail suites: 2 files, 13 tests passed |

The raw sequence intentionally retains fast-settled navigation attempts and the upstream session-verification frame. They document what localhost actually rendered; they are not relabelled as sales loading or print pending evidence.
