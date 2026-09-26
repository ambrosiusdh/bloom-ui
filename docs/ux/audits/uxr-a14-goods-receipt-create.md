# UXR-A14 — Goods-receipt creation

Status: `EVIDENCE_COMPLETE` — live posting audit, persistent screenshots, repository/backend review, and focused tests complete  
Execution: repository review plus live UX audit on disposable local data  
Audit date: 2026-09-24 to 2026-09-25  
Environment: local Bloom frontend (`http://localhost:5173`) and backend (`http://localhost:8080`), using the existing local `admin` session  
Browser: Codex in-app browser (Chromium-based; exact version unavailable)  
Viewports: wide desktop, `1024×768`, and `760×768`

## Scope and method

This audit covered supplier and item lookup, repeated item lines, whole/fraction
quantity policy, precise purchase-price entry, independent per-line location,
received date/time and offset, draft persistence, required/domain validation,
confirmation, cancellation/focus restoration, genuine pending, duplicate-submit
locking, server-confirmed success, list/detail persistence, responsive behavior,
and explicit next-receipt reset. Initial payment, supplier/item maintenance,
forced ambiguous network failure, redesign, and application-code changes were out
of scope.

Before the live pass, the audit read `AGENTS.md`, the frontend contract and
roadmaps, the create page/store/API/components/tests, and the corresponding backend
controller, create request/line DTOs, response DTOs, validations, and service. Backend
receipt, stock, total, debt, payment-status, and idempotency results remain authoritative.

Although UXR-A13 is still blocked on representative partial/paid fixtures, the owner
explicitly directed this independently runnable A14 audit. The created receipt now adds
an unpaid example containing both STORE and WAREHOUSE lines; it does not fabricate or
complete A13's still-missing partial and paid states.

The complete evidence index and 19 screenshots are in
[`docs/ux/evidence/uxr-a14/README.md`](../evidence/uxr-a14/README.md).

## Scenario evidence

### A14-01 — Empty form, lookup, and required validation

- **Purpose:** verify that creation begins from registered identities and blocks an incomplete request.
- **Steps:** open `/goods-receipts/new`; submit empty; search and select supplier `QA-FE26-20260909` and the two existing item identities.
- **Evidence:** A14-E01–A14-E03 and A14-E06.
- **Observed fact:** blank review focused the supplier lookup and created no request. Supplier and item options combined stable code/SKU with the human name; only active options are retained by the component.
- **Observed fact:** lookup loading, error/retry, no-result, stale-response rejection, and the 20-result search contract are repository/test evidence because the healthy local lookups settled normally.
- **Expected:** creation uses registered stable identities, exposes recoverable lookup states, and focuses the first invalid control.
- **Assessment:** the identity and validation boundary is strong. The selected supplier is repeated immediately below the field even though the autocomplete already retains it (`RECEIPT-CREATE-04`).
- **Priority:** `P2`.

### A14-02 — Whole/fraction rules and independent repeated lines

- **Purpose:** verify that item policy, precision, and line identity remain explicit before posting.
- **Steps:** add `PRT-00001`; enter invalid `0,5`, then valid `2`; add `QA-FE10-82138041` twice; enter `0,75` and `0,25`, distinct four-decimal-capable prices, and WAREHOUSE/STORE destinations.
- **Evidence:** A14-E04–A14-E08.
- **Observed fact:** the whole-only decimal was rejected with `Barang ini harus diterima dalam jumlah utuh.`, focused the quantity control, retained the draft, and sent no request.
- **Observed fact:** repeated SKUs remained separate lines with independent quantity, price, and location. Leaving the route and returning restored all exact comma-decimal strings and selected identities.
- **Expected:** the UI must preserve exact intent without rounding, merging repeated lines, or deriving stock.
- **Assessment:** correctness and recovery are excellent. At `760×768`, however, every line becomes a tall card with three full-width fields and repeated helper text. Three lines require extensive vertical scanning between the single item lookup and the final review action (`RECEIPT-CREATE-02`).
- **Priority:** `P1`.

### A14-03 — Received time and offset

- **Purpose:** verify explicit time-zone intent and valid request conversion.
- **Steps:** enter `2026-09-24T21:35`, select WIB (`UTC+07`), leave/re-enter the route, and review the frozen confirmation.
- **Evidence:** A14-E01, A14-E05, A14-E08, and A14-E09.
- **Observed fact:** offset selection is explicit and the confirmation showed `2026-09-24 21:35 · WIB (UTC+07)`. Repository tests verify the request converts that exact local intent to the corresponding ISO instant.
- **Observed fact:** the native input displays `mm/dd/yyyy` and a 12-hour clock in the browser, while confirmation and saved receipt use an Indonesian day-first/24-hour presentation (`RECEIPT-CREATE-03`).
- **Expected:** an older operator should not have to translate between date conventions while recording when stock arrived.
- **Assessment:** the offset boundary is correct, but mixed date/time notation creates preventable interpretation risk.
- **Priority:** `P1`.

### A14-04 — Confirmation, keyboard behavior, and pending lock

- **Purpose:** verify one atomic posting boundary and safe keyboard behavior.
- **Steps:** open review; inspect all intent; press Escape; verify focus return; reopen; after owner confirmation, submit once and capture pending.
- **Evidence:** A14-E09–A14-E10 and A14-E13–A14-E14.
- **Observed fact:** confirmation included supplier, received time/offset, description, all three lines, locations, and explicit copy that stock is added while totals/outstanding are server-determined and no initial payment is recorded.
- **Observed fact:** initial focus was the safe `Kembali` action. Escape restored focus to `Tinjau penerimaan`. During posting, dialog dismissal and both actions were disabled, the page announced pending, and only one request was issued.
- **Observed fact:** confirmation prices are shown as raw input strings (`Rp 1500`, `Rp 25000,125`, `Rp 26000,5`) and locations as backend tokens (`STORE`, `WAREHOUSE`), unlike the localized/grouped controls and final result. The modal also gives no per-line input subtotal, so invoice comparison requires mental calculation (`RECEIPT-CREATE-01`).
- **Expected:** the last reversible review must make exact financial/location intent easy to verify without implying a browser-authoritative total.
- **Assessment:** the transaction boundary and duplicate protection are strong; review readability is materially weaker than the form and result.
- **Priority:** `P1`.

### A14-05 — Server-confirmed success and persisted result

- **Purpose:** verify that completion is unambiguous and only server truth becomes final.
- **Steps:** wait for completion; inspect focused result; open history and detail; return and choose `Buat penerimaan berikutnya`.
- **Evidence:** A14-E15–A14-E19.
- **Observed fact:** the focused status announced `GR/IX-2026/0003`. The result rendered `Dibukukan`, `Belum dibayar`, total/outstanding `Rp 28.250,2188`, paid `Rp 0`, and exact server line totals. History and detail preserved the same identity and values.
- **Observed fact:** the detail displayed an older-receipt recovery banner because a prior supplier-payment state remains deliberately locked to `GR/IX-2026/0001`. Source/tests confirm this is cross-navigation financial recovery protection, not stale data for the new receipt. Its resolution belongs to UXR-A15.
- **Observed fact:** the explicit next-receipt action cleared result and draft. The reused result sections are visually prominent but exposed as heading level 6 beneath the page-level heading 2 (`RECEIPT-CREATE-05`).
- **Expected:** receipt completion, authoritative values, and the next safe action remain clear; financial recovery must not silently switch receipt identity.
- **Assessment:** completion and persistence are unambiguous. The payment lock is correctly conservative. Result heading semantics need correction without changing the visual hierarchy.
- **Priority:** `P1` for heading semantics; no finding for the recovery lock.

### A14-06 — Responsive behavior

- **Purpose:** verify that creation and confirmation remain operable on narrow desktop surfaces.
- **Steps:** inspect the populated form and review at `1024×768` and `760×768`; measure document width; complete posting and inspect narrow success.
- **Evidence:** A14-E11–A14-E15.
- **Observed fact:** document client and scroll widths matched at both measured sizes (`1009/1009` and `760/760`), so no page-level horizontal panning was required.
- **Observed fact:** line controls stack, dialog text wraps, actions remain reachable, and the result swaps the desktop item table for compact line cards below the medium breakpoint.
- **Expected:** all transaction intent/actions remain available without horizontal clipping.
- **Assessment:** responsive containment is strong. The remaining narrow issue is vertical task cost, not missing controls or horizontal overflow.
- **Priority:** no additional finding.

## Findings

| ID | Priority | Classification | Finding |
| --- | --- | --- | --- |
| RECEIPT-CREATE-01 | P1 | Live visual/transaction-review evidence | The final confirmation shows ungrouped raw money strings and backend location tokens, and offers no line subtotal. Exact intent is present, but older operators must translate and mentally calculate at the last reversible boundary. Any future input estimate must be explicitly advisory; final totals remain server-owned. |
| RECEIPT-CREATE-02 | P1 | Live narrow-layout evidence | At `760×768`, each receipt line becomes a tall three-field card with repeated helper copy. Several lines create a long scroll between the single add-item lookup and review action, increasing comparison and correction cost even though nothing is clipped. |
| RECEIPT-CREATE-03 | P1 | Live browser-format evidence | The received-time control presents US `mm/dd/yyyy`/12-hour notation while confirmation and saved facts use Indonesian day-first/24-hour notation. This translation burden can cause a consequential receiving-time error. |
| RECEIPT-CREATE-04 | P2 | Live hierarchy/copy evidence | The selected supplier is immediately repeated below an autocomplete that already shows the same code and name, adding vertical noise without new information. |
| RECEIPT-CREATE-05 | P1 | Repository + accessibility-tree evidence | After success, visually major receipt information and item sections reuse `h6` semantics directly beneath the page `h2`, skipping heading levels and weakening screen-reader navigation. |

No `P0` issue was observed. No frontend-derived stock, receipt total, debt,
payment status, or reconciliation value was presented as authoritative.

## Preserved strengths

- Supplier/item selection uses stable backend identities and active records.
- Exact decimal input strings survive draft persistence and known rejections.
- Whole/fraction policy, four-decimal limit, positive value, location, time, and offset are validated before review.
- Repeated SKUs remain independent; the browser neither merges lines nor updates stock locally.
- Adding/removing lines and validation direct focus to the relevant control.
- The final review freezes every field, defaults to a safe action, traps focus, supports Escape before posting, and restores trigger focus.
- Durable per-tab idempotency intent is written before the request; uncertain recovery replays the identical key/payload and prevents a new receipt.
- Pending blocks edits, dialog dismissal, and duplicate submission.
- Success focuses an announcement and renders only backend-returned statuses, totals, outstanding amount, receipt identity, and line totals.
- `1024×768` and `760×768` avoid page-level horizontal overflow; narrow success uses item cards.
- Existing unresolved supplier-payment intent remains locked to its original receipt rather than silently following navigation.

## Recommendations for UXR-D13 design

These are audit recommendations, not implementation approval:

1. Preserve the exact stable identities, repeated-line semantics, whole/fraction policy, independent location, explicit offset, durable recovery, safe confirmation focus, genuine pending lock, and backend-confirmed result.
2. Make the review use localized location labels and grouped money formatting while retaining exact decimal precision. Add per-line comparison support; if any pre-post subtotal/total is shown, label it as an input estimate awaiting server confirmation and never use it as final authority.
3. Reduce repeated-line vertical cost with a compact row/editor pattern on desktop and a concise grouped card on narrow screens. Keep all fields and validation, but centralize repeated guidance where comprehension is not lost.
4. Use one unambiguous Indonesian date/time presentation around the native control, while preserving explicit WIB/WITA/WIT selection and the exact backend instant.
5. Remove the redundant selected-supplier echo or repurpose that space for genuinely new supplier context; do not hide the stable supplier code.
6. Give the success result a sequential semantic heading hierarchy without changing backend authority or useful existing result components.
7. Preserve the payment store's original-receipt lock and explicit recovery link; design its placement with UXR-A15 rather than clearing or silently retargeting it.

## Owner decisions needed for design

1. Whether the repeated-line editor should use a compact table-like row at wide widths and cards at narrow widths, or a consistently stacked editor with a sticky add/review action area.
2. Whether the review should show only localized/grouped entered unit prices or also a clearly non-authoritative input estimate for each line and the receipt.
3. Whether received time should remain a native date-time control with explicit Indonesian format guidance or use separate date and 24-hour time controls.

## State-changing actions and retained data

- Posted one disposable receipt, `GR/IX-2026/0003`, after explicit owner confirmation at the final action boundary.
- Supplier: existing `QA-FE26-20260909`; not changed.
- Lines: `PRT-00001` (`2 kg`, STORE, `1500`) and two separate `QA-FE10-82138041` lines (`0,75 meter`, WAREHOUSE, `25000,125`; `0,25 meter`, STORE, `26000,5`).
- Server result: posted/unpaid; total and outstanding `Rp 28.250,2188`; paid `Rp 0`.
- No initial/supplier payment was created. No supplier/item was created, edited, deactivated, or deleted.
- The receipt is intentionally retained as immutable local transaction history and a disposable fixture for later audits; no destructive cleanup was attempted.
- No application, backend, dependency, or configuration source was modified.

## Focused automated verification

Command:

```text
.\node_modules\.bin\vitest.cmd run src/test/pages/goods-receipt/GoodsReceiptCreate.test.jsx src/test/api/goods-receipt.test.js
```

Result on 2026-09-25:

```text
Test Files  2 passed (2)
Tests       28 passed (28)
Duration    78.27s
```

## Limitations

- A safe conflict/uncertain network result was not forced against the running services. Known conflict, storage failure, frozen uncertain state, exact replay, key conflict, incomplete success, and simultaneous-submit protection remain repository/test evidence.
- Healthy lookup calls settled normally; loading/error/retry/empty/stale behavior remains focused automated evidence.
- The local database still lacks partially paid and fully paid receipts required to complete UXR-A13 and begin the full UXR-A15 payment-state matrix.
- The audit did not compare stock/debt before and after through database tooling; it verified the backend-confirmed receipt/list/detail and inspected the service's atomic posting contract.
- Exact browser version, Windows display scaling, and deployed store hardware were unavailable.

## Evidence index

- Empty/validation/lookups: A14-E01–A14-E06.
- Repeated lines and persisted draft: A14-E07–A14-E08.
- Confirmation, cancel/focus, and responsive review: A14-E09–A14-E13.
- Pending and server-confirmed success: A14-E14–A14-E16.
- List/detail persistence and reset: A14-E17–A14-E19.
- Repository/backend/test evidence: [UXR-A14 evidence index](../evidence/uxr-a14/README.md#repository-backend-and-automated-evidence).

