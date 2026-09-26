# UXR-A13 — Goods-receipt history and detail

Status: `EVIDENCE_COMPLETE` — read-only workflow evidence plus representative unpaid/partial/paid and STORE/WAREHOUSE recapture completed  
Execution: repository/backend review, read-only live UX audit, and authorized representative-state recapture  
Audit date: 2026-09-24; completion recapture: 2026-09-26  
Environment: local Bloom frontend (`http://localhost:5173`) and backend (`http://localhost:8080`), using the existing local `admin` session  
Browser: Codex in-app browser (Chromium-based; exact version unavailable)  
Viewports: `1440×900`, `1024×768`, and `760×768`

## Scope and method

This audit covered the implemented goods-receipt list and detail routes,
supported reference/supplier/date filters, URL and return state, settled empty
and safe error/retry behavior, receipt/supplier/status comprehension, persisted
decimal UOM/location lines, server-returned total/paid/outstanding values,
keyboard traversal, and responsive behavior. It did not create a receipt, post
a supplier payment, calculate a financial value in the browser, redesign the
workflow, or modify application code.

Before live work, the audit read `AGENTS.md`, the frontend contract and
roadmaps, the receipt pages/components/store/API/tests, and the matching backend
controller, filter DTO, response DTOs, specification, service, and date-zone
behavior. The backend remains authoritative for receipt status, payment status,
total, paid amount, outstanding amount, persisted quantities/UOM/locations,
references, and timestamps.

At the initial read-only pass, the live database contained only `GR/IX-2026/0001`: a posted, unpaid receipt
with one `0,5 meter` WAREHOUSE line. It had no partially paid or paid receipt and
no STORE line. Because the roadmap explicitly names unavailable representative
receipts as UXR-A13's block condition, the audit was initially blocked. UXR-A14
later created an authorized disposable receipt with STORE and WAREHOUSE lines, and
the corrected UXR-A15 payment flow created authorized partial and paid states. The
completion recapture now satisfies the environment gate without browser-owned
financial calculation.

The complete evidence index and 17 persistent screenshots are in
[`docs/ux/evidence/uxr-a13/README.md`](../evidence/uxr-a13/README.md).

## Scenario evidence

### A13-01 — Baseline list and backend-owned facts

- **Purpose:** determine whether an operator can identify a receipt and its debt state without browser-side enrichment or calculation.
- **Steps:** open `/goods-receipts`; inspect the single row and page controls.
- **Evidence:** A13-E01.
- **Observed fact:** the row exposes receipt reference and creator, supplier name/ID/code, localized receipt and payment statuses, server total/paid/outstanding, received/created times, and a detail link. Status uses words and outlined chips, not color alone.
- **Observed fact:** one paged response supplies the row; neither the page nor store requests per-row detail or recalculates receipt balances.
- **Expected:** backend-confirmed receipt, payment, and financial facts remain attributable and scannable.
- **Assessment:** authority and identity are preserved. The row is information-dense but understandable at the wide viewport.
- **Priority:** no finding.

### A13-02 — Reference/supplier filters, empty recovery, and paging state

- **Purpose:** verify supported discovery without hidden query changes.
- **Steps:** filter by a missing receipt reference; filter by supplier name `QA FE26`; clear/navigate; inspect paging controls and URL state.
- **Evidence:** A13-E02, A13-E03, and A13-E16.
- **Observed fact:** reference and supplier-name filters are explicit, URL-backed, and reset to page 1. The no-match result says no receipt exists and advises changing or removing filters.
- **Observed fact:** opening detail from a filtered list and activating `Kembali` restores the exact `key`, `q`, `page`, and `size` URL.
- **Observed fact:** the database had only one result, so a second live page could not be exercised. Automated coverage verifies page/size forwarding and out-of-range correction.
- **Expected:** users can refine, recover, and return without losing search context.
- **Assessment:** the implemented navigation behavior is strong; multi-page behavior remains test evidence.
- **Priority:** no finding.

### A13-03 — Calendar-date behavior

- **Purpose:** verify that a store calendar date is not silently converted by the browser.
- **Steps:** apply `2026-09-09` as both start and end; load an inverted range through the URL and observe canonicalization.
- **Evidence:** A13-E04 and A13-E05.
- **Observed fact:** the same-day filter is retained as literal `YYYY-MM-DD` query values and returns the receipt displayed as `Rabu, 09-09-2026 15:00`.
- **Observed fact:** an inverted URL range is removed before fetching and page is corrected to 1. The form also constrains start/end values and contains explicit warning copy for a submitted inverted range.
- **Backend evidence:** `GoodsReceiptSpecification` interprets from at the store-zone day start and to as the next day start, exclusive.
- **Observed fact:** the native date inputs display `mm/dd/yyyy` placeholders in this browser while result dates use Indonesian `dd-MM-yyyy`, creating mixed date notation (`RECEIPT-05`).
- **Expected:** date semantics are safe and the visible notation is predictable for Indonesian operators.
- **Assessment:** request semantics are correct; visible input notation is inconsistent.
- **Priority:** `P2` (`RECEIPT-05`).

### A13-04 — Detail hierarchy and persisted line facts

- **Purpose:** verify that receipt identity, supplier, financial truth, and stored line facts remain understandable together.
- **Steps:** open `GR/IX-2026/0001`; review the information card, statuses, server amounts, and lower line-item section.
- **Evidence:** A13-E06 and A13-E15.
- **Observed fact:** the information card clearly groups receipt/supplier identity, received/created times, actor, description, two status chips, and server total/paid/outstanding.
- **Observed fact:** the line table renders the persisted item name/SKU, `Gudang`, `0,5 meter`, purchase price `Rp 2,5`, and line subtotal `Rp 1,25`. No quantity or financial derivation is presented as browser authority.
- **Observed fact:** the read-only line section sits below the full supplier-payment form. At 900 pixels high, the initial detail viewport ends around the payment action; users investigating what was received must scroll past a different mutation task (`RECEIPT-02`).
- **Expected:** core receipt evidence should precede or remain directly reachable around optional downstream actions.
- **Assessment:** the facts are complete, but the page hierarchy prioritizes payment entry over received-item inspection.
- **Priority:** `P1` (`RECEIPT-02`).

### A13-05 — Invalid and missing references

- **Purpose:** verify safe read failure and recovery without mutation.
- **Steps:** open a reference longer than 100 characters; open `UXRA13-MISSING`; activate retry.
- **Evidence:** A13-E07 through A13-E09.
- **Observed fact:** an obviously invalid reference is rejected locally with `Nomor penerimaan barang tidak valid.` and does not call detail.
- **Observed fact:** a valid-shaped missing reference displays the backend error with `Coba lagi` and `Kembali ke daftar`. Retry repeats the same reference and remains recoverable.
- **Expected:** invalid/missing reads do not expose stale receipt data and always offer a safe exit.
- **Assessment:** behavior is clear and preserves the requested reference.
- **Priority:** no finding.

### A13-06 — Keyboard and semantic structure

- **Purpose:** assess keyboard efficiency, focus visibility, and screen-reader page structure.
- **Steps:** start at the list document, traverse 24 Tab stops, inspect the accessibility tree, and capture the current focus.
- **Evidence:** A13-E10 plus the recorded focus trail in the evidence index.
- **Observed fact:** focus is visible and controls are reachable. However, 15 shell destinations/actions precede `Buat penerimaan`; there is no skip-to-content route in the observed traversal (`RECEIPT-03`).
- **Observed fact:** native date fields add multiple segment/picker focus stops, increasing the effort of reaching `Terapkan filter`.
- **Observed fact:** receipt detail has no page-level heading in the accessibility outline. Its visually primary `Informasi Penerimaan Barang`, payment, and item-list headings are all exposed as level 6 (`RECEIPT-04`).
- **Expected:** frequent page tasks should be quickly reachable, and headings should describe one coherent outline.
- **Assessment:** basic operation is accessible, but keyboard efficiency and semantic hierarchy are weak.
- **Priority:** `P1` (`RECEIPT-03`, `RECEIPT-04`).

### A13-07 — Narrow-desktop behavior

- **Purpose:** verify whether receipt facts and actions remain reachable without page-level two-dimensional navigation.
- **Steps:** inspect list/detail at 1024×768 and 760×768; measure document and table widths.
- **Evidence:** A13-E11 through A13-E14.
- **Observed fact:** at 1024 pixels, the list document expands to 1368 pixels while the table container measures 1080 pixels. At 760 pixels, the document expands to 1127 pixels inside a 745-pixel client area. The collapsed navigation does not resolve the table overflow (`RECEIPT-01`).
- **Observed fact:** detail expands to 1108 pixels at 1024 and 867 pixels inside a 745-pixel client area at 760. The item component contains a mobile-card rendering, but the overall page still overflows horizontally (`RECEIPT-01`).
- **Expected:** the roadmap's 1024×768 narrow desktop should not require horizontal page panning; all identity, status, financial, and line facts must remain reachable.
- **Assessment:** both list and detail fail the narrow-desktop baseline.
- **Priority:** `P1` (`RECEIPT-01`).

### A13-08 — Loading/error and unavailable live states

- **Repository/test evidence:** the list and detail announce loading, provide error alerts with same-request retry, distinguish filtered and unfiltered empty copy, abort superseded reads, ignore stale responses, canonicalize malformed query values, and keep server response values unchanged. Detail tests render a partially paid fixture and verify a completed-payment refresh to `PAID`/zero outstanding.
- **Automated result:** four focused files passed 19 tests.
- **Live limitation:** local reads settled too quickly for a genuine loading frame; service interruption was not forced. The initial pass lacked partial/paid and STORE-line receipts.
- **Assessment:** loading/outage paths remain source/test evidence. The representative receipt-state gap was closed in the authorized completion recapture.
- **Priority:** no additional product finding; audit-completeness blocker.

### A13-09 — Representative-state completion recapture

- **Steps:** after UXR-A14 and the corrected UXR-A15 flow created disposable fixtures, reopen the goods-receipt list and verify the combined state set.
- **Evidence:** A13-E17, with payment-success detail evidence A15-E14 and A15-E15.
- **Observed fact:** `GR/IX-2026/0001` is `PAID` with paid `Rp 1,25` and outstanding `Rp 0`; `GR/IX-2026/0002` is `PARTIALLY_PAID` with paid `Rp 2.000.000` and outstanding `Rp 6.888.888`; `GR/IX-2026/0003` remains `UNPAID` and includes the STORE/WAREHOUSE lines captured by A14.
- **Observed fact:** all financial states are server-refreshed values; no client aggregation or local balance mutation was introduced.
- **Assessment:** the named representative-data gate is satisfied and UXR-A13 is `EVIDENCE_COMPLETE`.

## Findings

| ID | Priority | Classification | Finding |
| --- | --- | --- | --- |
| RECEIPT-01 | P1 | Live screenshots + DOM measurement | The list and detail both cause whole-page horizontal overflow at the required 1024×768 viewport and remain wider than the viewport at 760×768. The list reaches 1368/1127 pixels and the detail 1108/867 pixels, separating receipt facts and actions through page-level panning. |
| RECEIPT-02 | P1 | Live evidence + workflow inference | The full supplier-payment form sits between receipt summary and received-item lines. A user auditing what arrived must pass through a different mutation workflow before reaching the line evidence. |
| RECEIPT-03 | P1 | Live keyboard evidence | Fifteen shell controls precede the first goods-receipt page action and there is no observed skip-to-content path, making repeated keyboard operation unnecessarily costly. |
| RECEIPT-04 | P1 | Live accessibility-tree evidence | Receipt detail lacks a page-level heading and exposes all three visually major sections as heading level 6, so the semantic outline does not express the page hierarchy. |
| RECEIPT-05 | P2 | Live visual evidence | Date inputs show `mm/dd/yyyy` placeholders while receipt timestamps use Indonesian `dd-MM-yyyy`; the mixed notation can slow or mislead date filtering even though backend calendar-date semantics are correct. |
| RECEIPT-06 | P2 | Live copy review | Backend-authority copy is repeated in implementation-facing language (`server`, `nilai server`, `disimpan server`) across list and detail. The assurance is valuable, but the repetition competes with task content for older operators. |

No `P0` issue was observed. No client-side financial calculation, per-row receipt
enrichment, stale-detail presentation, or receipt/payment mutation occurred during
the audit.

## Preserved strengths

- List/detail render backend receipt status, payment status, total, paid, and outstanding values directly.
- Reference plus supplier name/code/ID provide strong identity without row enrichment.
- Status always includes explicit Indonesian text and does not depend on color alone.
- Reference and supplier filters, paging, and date filters are URL-backed.
- Same-day dates are sent unchanged; backend store-zone inclusive/exclusive boundaries are correct.
- Filtered empty, invalid reference, missing detail, retry, and return paths are explicit.
- Filter-to-detail-to-return preserves the exact list URL.
- Decimal quantity retains UOM and stock location; line price and subtotal remain server values.
- Request cancellation and stale-response protection exist in the store.
- Error states clear stale list/detail content rather than leaving old data under a new reference.

## Recommendations for UXR-D13 design

These are audit recommendations, not implementation approval. UXR-D13 must wait
for both UXR-A13 and UXR-A14 evidence and must retain payment behavior for the
later payable/payment design rather than deleting it.

1. Replace the wide list table at narrow widths with the approved grouped-row/card pattern, or keep an intentional local scroller whose parent can shrink. Never widen the entire page.
2. Keep receipt identity, supplier, statuses, server amounts, received/created dates, actor, and detail action in every representation. Do not solve density by removing authoritative facts.
3. Make receipt lines part of the primary detail hierarchy. Preserve the supplier-payment feature, but separate it as a clearly secondary action/section, progressive panel, or payable-context route so it does not block line inspection.
4. Add a real page heading and sequential section heading structure before visual refinement.
5. Add or preserve an application-level skip-to-content mechanism so keyboard users can bypass the repeated navigation rail.
6. Present date input guidance in Indonesian and use one unambiguous day-month-year convention while still sending literal `YYYY-MM-DD` values.
7. Keep one concise statement of backend authority near financial values; replace repeated implementation terms with user-centered copy without implying local calculation.
8. Re-run the design against genuine unpaid, partial, paid, STORE, and WAREHOUSE examples before approval.

## Owner decisions needed for design

1. Whether payment on receipt detail should open as a secondary panel/dialog or remain an inline section after the received lines; the feature must not be removed.
2. Whether narrow receipt history should use stacked rows/cards or an intentional horizontally scrollable table. The selected pattern must preserve all current facts.
3. Confirm the actual store-laptop viewport/display scaling beyond the temporary 1024×768 baseline.

## State-changing actions

None. The audit was read only. It created no goods receipt, posted no supplier
payment, changed no supplier/item/stock record, and required no cleanup.

## Focused automated verification

Command:

```text
.\node_modules\.bin\vitest.cmd run src/test/pages/goods-receipt/GoodsReceiptList.test.jsx src/test/pages/goods-receipt/GoodsReceiptDetail.test.jsx src/test/stores/goods-receipt.test.js src/test/api/goods-receipt.test.js
```

Result on 2026-09-24:

```text
Test Files  4 passed (4)
Tests       19 passed (19)
Duration    50.44s
```

## Limitations

- A second live results page was unavailable; paging behavior is source/test evidence.
- Loading and list outage states were not forced; loading/error/retry behavior is source/test evidence except for the live missing-detail error.
- Payment mutation behavior remains owned by UXR-A15; A13 uses its authorized results only as read-workflow fixtures.
- Exact browser version, Windows display scaling, and deployed store hardware were unavailable.

### Follow-up attempt — 2026-09-25

UXR-A14 added `GR/IX-2026/0003`, an unpaid receipt with both STORE and WAREHOUSE
lines, so the original stock-location fixture gap is closed. During UXR-A15, the
owner explicitly authorized one full CASH payment and one partial QRIS payment to
create the missing paid/partial states. Neither payment reached the backend
controller: the frontend encodes a slash-containing receipt code into one path
segment, and Tomcat rejects that encoded slash with HTTP 400 before Spring MVC.

### Completion recapture — 2026-09-26

`PAYMENT-01` was corrected by carrying the exact receipt reference as a query
parameter. After app restart and explicit confirmation, UXR-A15 recorded a partial
QRIS payment on `GR/IX-2026/0002` and a full BANK_TRANSFER payment on
`GR/IX-2026/0001`. The goods-receipt list now shows unpaid, partially paid, and paid
states together, while A14's `GR/IX-2026/0003` supplies both stock locations. A13
is therefore `EVIDENCE_COMPLETE`; the original failed follow-up remains documented
as historical evidence rather than being erased.

## Evidence index

- Wide list, filters, empty, and return state: A13-E01–A13-E05 and A13-E16.
- Detail identity, financials, errors, and lines: A13-E06–A13-E09 and A13-E15.
- Keyboard and responsive behavior: A13-E10–A13-E14.
- Representative unpaid/partial/paid state set: A13-E17, supported by A15-E14–A15-E17.
- Repository/backend/test evidence: [UXR-A13 evidence index](../evidence/uxr-a13/README.md#repository-and-automated-evidence).
