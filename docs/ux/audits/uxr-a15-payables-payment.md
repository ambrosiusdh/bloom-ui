# UXR-A15 — Supplier payables and payment

Status: `EVIDENCE_COMPLETE` — live discovery, failure, corrected transport, partial/full success, refresh, and representative debt states captured  
Execution: repository/backend review plus live UX audit with pre-fix failure evidence and two owner-confirmed successful disposable payments  
Audit date: 2026-09-25; completion recapture: 2026-09-26  
Environment: local Bloom frontend (`http://localhost:5173`) and backend (`http://localhost:8080`), using the documented local `admin` fixture  
Browser: Codex in-app browser (Chromium-based; exact version unavailable)  
Viewports: wide desktop, `1024×768`, and `760×768`

## Scope and disposition

This audit covered payable discovery, URL-backed receipt/supplier/status context,
backend-owned total/paid/outstanding values, CASH/BANK_TRANSFER/QRIS treatment,
amount validation, full/partial confirmation, session messaging, pending and exact
recovery behavior, keyboard/focus, and narrow-desktop behavior. It did not add
multi-receipt allocation, credit/prepayment, reversal, frontend debt calculation,
redesign, implementation, or dependencies.

The initial owner-confirmed CASH and QRIS attempts created no payment and exposed
`PAYMENT-01`: the slash-containing receipt code could not traverse the encoded
path-variable route. The endpoint transport was then corrected, without changing
payment DTOs or business rules, to use the receipt code as a query parameter.
After the owner restarted the app and explicitly confirmed the final actions, the
recapture recorded a partial QRIS payment and a full BANK_TRANSFER payment, both
followed by backend-authoritative receipt refresh. The original failure evidence is
retained as historical pre-fix evidence; the audit is now `EVIDENCE_COMPLETE`.

The complete evidence index and 18 persistent screenshots are in
[`docs/ux/evidence/uxr-a15/README.md`](../evidence/uxr-a15/README.md).

## Scenario evidence

### A15-01 — Payable discovery and authority

- **Steps:** open `/payables`; inspect all unpaid receipts; filter by a missing reference and by supplier name `QA FE26`.
- **Evidence:** A15-E00, A15-E01, A15-E09, and A15-E10.
- **Observed:** rows combine receipt reference, supplier identity, receipt/payment statuses, total, paid, outstanding, date, and detail action. Amounts and statuses are returned by the backend; the page does not aggregate supplier debt or calculate receipt balance.
- **Observed:** filters are URL-backed, and the filtered-empty state explains how to recover.
- **Assessment:** discovery preserves backend authority and stable receipt identity. The all-status explanatory banner is accurate but verbose and competes with the table (`PAYMENT-05`).

### A15-02 — Method differences and amount entry

- **Steps:** inspect CASH with an open session; inspect BANK_TRANSFER and QRIS; enter full and partial amounts; review source/test coverage for zero, excessive, and decimal validation.
- **Evidence:** A15-E02 through A15-E04 plus focused tests.
- **Observed:** CASH names its session/drawer effect; BANK_TRANSFER and QRIS explicitly say they do not require a cash session and do not alter drawer cash.
- **Observed:** the full-balance affordance uses the backend outstanding amount. Decimal entry is accepted as a string and is not converted into a browser-owned financial result.
- **Observed:** tests cover positive amount, four-decimal precision, overpayment, disabled/settled receipts, and fresh CASH-session verification.
- **Assessment:** method semantics and backend authority are strong. Genuine backend overpayment/conflict presentation could not be reached because the route fails first.

### A15-03 — Full CASH confirmation

- **Steps:** prepare a full `Rp 1,25` CASH payment for `GR/IX-2026/0001`, reference `UXR-A15-CASH-FULL`, and the audit note; open confirmation; submit after owner confirmation.
- **Evidence:** A15-E02, A15-E03, A15-E05, and A15-E06.
- **Observed:** confirmation freezes receipt, supplier, amount, method, reference, note, resulting balance, and drawer/session meaning. Initial focus is on `Kembali`.
- **Observed:** submission immediately becomes uncertain; inputs remain locked and only exact same-request recovery is permitted. Recovery returns to the same state. A later current-session read showed no open session, so the frozen CASH attempt could not be safely retargeted.
- **Backend result:** receipt remained unpaid at `Rp 0` paid and `Rp 1,25` outstanding; no payment record exists.
- **Assessment:** confirmation and fail-closed recovery intent are sound, but the integration failure makes recovery a dead end.

### A15-04 — Partial QRIS confirmation

- **Steps:** prepare a `Rp 2.000.000` QRIS payment for `GR/IX-2026/0002`, reference `UXR-A15-QRIS-PARTIAL`, and the audit note; open confirmation; submit after owner confirmation.
- **Evidence:** A15-E04 and A15-E07.
- **Observed:** confirmation clearly distinguishes a partial payment, the intended remaining amount, and no drawer/session effect.
- **Observed:** submission enters the same uncertain, locked exact-recovery state even though QRIS has no cash-session prerequisite.
- **Backend result:** receipt remained unpaid at `Rp 0` paid and `Rp 8.888.888` outstanding; no payment record exists.
- **Assessment:** the identical failure across CASH and QRIS isolates the blocker from cash-session eligibility.

### A15-05 — Root-cause verification

- **Steps:** inspect frontend URL construction and backend controller mapping; issue a read-only GET to the exact encoded payment-history URL used for a real receipt.
- **Evidence:** A15-E08 plus source inspection and terminal HTTP response.
- **Observed (pre-fix):** frontend route construction used `encodeURIComponent(code)` inside `/api/goods-receipts/{code}/payments`; backend controller expected the same value as one path segment.
- **Observed:** real generated codes contain `/`. Tomcat rejects `GR%2FIX-2026%2F0002` with HTML `HTTP Status 400 – Bad Request` before Spring MVC/controller handling.
- **Observed:** the response lacks the normal API/CORS contract, so Axios categorizes the failure as network-like and the payment store correctly—but misleadingly—treats it as an ambiguous outcome.
- **Assessment:** `PAYMENT-01` was a P0 integration defect. It was corrected by transporting the exact receipt reference as the `code` query parameter; no client-side aliasing or financial-rule change was introduced.

### A15-06 — Keyboard and semantic structure

- **Observed:** form controls, method selection, review action, confirmation cancellation, and recovery action are keyboard reachable. Confirmation defaults focus to `Kembali`, reducing accidental posting risk.
- **Observed:** receipt detail exposes its primary information, payment, and item sections as level-6 headings without a page-level heading (`PAYMENT-04`). The full payment form also sits between receipt summary and received-item evidence (`PAYMENT-03`).
- **Assessment:** local control behavior is deliberate, but page hierarchy and repeated shell traversal remain costly for keyboard and assistive-technology users.

### A15-07 — Narrow-desktop behavior

- **Steps:** inspect the payable list and receipt detail at `1024×768` and `760×768`; measure the loaded document.
- **Evidence:** A15-E11 through A15-E13.
- **Observed:** the payable list expands to 1338 pixels inside a 1009-pixel client at `1024×768`, and to 1097 pixels inside 745 pixels at `760×768`.
- **Observed:** loaded detail expands to 867 pixels inside a 745-pixel client at `760×768`. The right side of the financial summary and payment controls is clipped until the user pans horizontally.
- **Assessment:** `PAYMENT-02` fails the roadmap's narrow-desktop baseline and separates related amount/status/action information spatially.

### A15-08 — Corrected-route partial/full success and refresh

- **Steps:** after the corrected app restart and explicit action-time confirmation, post `Rp 2.000.000` by QRIS to `GR/IX-2026/0002`, then post the full `Rp 1,25` by BANK_TRANSFER to `GR/IX-2026/0001`; refresh receipt and list views.
- **Evidence:** A15-E14 through A15-E17.
- **Observed:** QRIS returned payment `#1`; the receipt refreshed to `Dibayar sebagian`, paid `Rp 2.000.000`, and outstanding `Rp 6.888.888` from the server.
- **Observed:** BANK_TRANSFER returned payment `#2`; the receipt refreshed to `Lunas`, paid `Rp 1,25`, and outstanding `Rp 0` from the server.
- **Observed:** the payable and goods-receipt lists now show unpaid, partially paid, and paid states together. Neither non-cash payment required a cash session or altered drawer cash.
- **Assessment:** the corrected transport reaches the same backend-authoritative one-receipt payment service and preserves the intended confirmation, idempotency, method, and refresh semantics.

## Findings

| ID | Priority | Classification | Finding |
| --- | --- | --- | --- |
| PAYMENT-01 | P0 resolved 2026-09-26 | Live submission, direct HTTP evidence, source correction, controller tests, and successful live payments | The former path-variable route could not transport generated slash-containing receipt references. The controller/client now use the exact code as a query parameter; partial QRIS and full BANK_TRANSFER payments plus receipt refresh succeeded live. |
| PAYMENT-02 | P1 | Live screenshots + DOM measurement | Payable list and receipt detail create whole-page horizontal overflow at required narrow-desktop widths, pushing financial/status/action content off-screen. |
| PAYMENT-03 | P1 | Live hierarchy review | The full supplier-payment form precedes received-item lines on receipt detail, so a read/audit task must pass through a financial mutation workflow. |
| PAYMENT-04 | P1 | Live accessibility-tree evidence | Receipt detail has no page-level heading; visually primary receipt, payment, and item sections are all heading level 6. |
| PAYMENT-05 | P2 | Live copy review | Accurate but repeated implementation-facing `server` explanations and the dense all-status banner compete with operational content, especially for older users. |

The historical pre-fix CASH attempt remains useful recovery evidence: its frozen
request must never be retargeted to a later session. The route correction does not
weaken that fail-closed rule or silently convert the old attempt into a new payment.

## Preserved strengths

- Backend responses remain authoritative for receipt/payment status and all money values.
- Each payment is explicitly bound to one receipt; no unsupported allocation or prepayment appears.
- CASH-only session/drawer effects are described separately from BANK_TRANSFER and QRIS.
- Full-balance assistance derives from server outstanding and does not replace validation.
- Confirmation presents identity, method, amount, reference, note, balance effect, and session meaning together.
- Confirmation initially focuses the cancel/back action.
- Pending and uncertain states prevent edits, duplicate submission, key rotation, or silent retargeting.
- Exact request, idempotency key, receipt, and immutable account owner are retained for legitimate same-owner recovery.
- URL-backed filters, explicit filtered-empty recovery, stale-response protection, and backend-value rendering have focused coverage.

## Recommendations for UXR-D14 and implementation sequencing

These are audit recommendations, not implementation approval.

1. Preserve the corrected query-parameter endpoint and add container-level regression coverage for real slash-containing receipt references; do not weaken receipt identity or invent a client alias.
2. Ensure container-level failures become a categorized, actionable API error rather than an indefinite ambiguous-payment state when the request provably never reached the controller.
3. Preserve exact idempotent recovery for genuinely ambiguous transport outcomes. Do not let a new cash session rewrite a frozen CASH payment.
4. Use the approved responsive grouped-row/card treatment for payables, keeping receipt, supplier, status, total, paid, outstanding, and action visible without whole-page panning.
5. Make received lines part of the primary receipt-detail reading order. Keep payment available as a clearly secondary section, panel, or payable-context action rather than deleting it.
6. Add one real page heading and sequential section levels; preserve visible focus and safe confirmation focus.
7. Replace repeated implementation-facing authority copy with one concise reassurance near server-owned financial facts.
8. Use the captured unpaid, partial, and paid fixtures when designing D13/D14; do not infer approval of a visual design from audit completion.

## State-changing actions and cleanup

| Intended action | Confirmation | Backend outcome | Cleanup |
| --- | --- | --- | --- |
| Pre-fix full CASH payment `Rp 1,25` on `GR/IX-2026/0001` | Owner explicitly confirmed | No payment recorded; receipt unchanged | No server cleanup required; frozen historical attempt was not retargeted |
| Pre-fix partial QRIS payment `Rp 2.000.000` on `GR/IX-2026/0002` | Owner explicitly confirmed | No payment recorded; receipt unchanged | No server cleanup required |
| Post-fix partial QRIS payment `Rp 2.000.000` on `GR/IX-2026/0002`, reference `UXR-A15-QRIS-PARTIAL-FIX` | Owner explicitly confirmed immediately before submission | Payment `#1`; receipt `PARTIALLY_PAID`; paid `Rp 2.000.000`; outstanding `Rp 6.888.888` | Retained as disposable audit history |
| Post-fix full BANK_TRANSFER payment `Rp 1,25` on `GR/IX-2026/0001`, reference `UXR-A15-BANK-FULL-FIX` | Owner explicitly confirmed immediately before submission | Payment `#2`; receipt `PAID`; paid `Rp 1,25`; outstanding `Rp 0` | Retained as disposable audit history |

No payment was voided or reversed, no cash session was opened/closed, and the two
successful non-cash payments had no drawer effect. The disposable records remain as
test history, as authorized by the owner.

## Focused automated verification

Command:

```text
.\node_modules\.bin\vitest.cmd run src/test/pages/payable/SupplierPayableList.test.jsx src/test/pages/goods-receipt/SupplierPayment.test.jsx src/test/pages/goods-receipt/GoodsReceiptDetail.test.jsx src/test/stores/goods-receipt.test.js src/test/api/supplier-payment.test.js src/test/api/goods-receipt.test.js
```

Original audit result on 2026-09-25:

```text
Test Files  6 passed (6)
Tests       48 passed (48)
Duration    84.57s
```

Post-fix verification on 2026-09-26:

- focused frontend payment/API tests: 2 files, 35/35 tests passed;
- targeted frontend lint and production build: passed;
- backend controller tests: 3/3 passed;
- backend web-module tests: 79/79 passed;
- full frontend suite: 393 tests passed; two unrelated stock-adjustment tests timed
  out only in the parallel full run and passed 8/8 on immediate isolated rerun.

## Limitations

- CASH success was not repeated after the fix because there was no open cash session; non-cash partial/full success and no-drawer semantics were captured instead.
- A live backend conflict/rejection was not forced after the fix; validation, overpayment, session conflict, exact replay, and refresh-error behavior remain source/test evidence.
- Loading and service-outage frames were not forced live; their behavior remains source/test evidence.
- Only one results page existed, so multi-page navigation remains focused test evidence.
- Exact browser version, Windows display scaling, and deployed store hardware were unavailable.
