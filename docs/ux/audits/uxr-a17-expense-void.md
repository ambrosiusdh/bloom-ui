# UXR-A17 — Expense void/reversal

Status: `EVIDENCE_COMPLETE` — live eligibility, reason validation, confirmation, reversal, retained audit, session context, keyboard, and responsive evidence captured  
Execution: repository/backend contract review plus one owner-confirmed disposable reversal  
Audit date: 2026-09-26  
Environment: local Bloom frontend (`http://localhost:5173`) and backend (`http://localhost:8080`), using the documented local `admin` fixture  
Browser: Codex in-app browser (Chromium-based; exact version unavailable)  
Viewports: default wide desktop, `1024×768`, and `760×768`

## Scope and disposition

This audit covered backend eligibility and block reasons, the fresh-detail gate,
required reversal reason, confirmation, the backend-confirmed reversal, retained
original/audit facts, original-session context, keyboard/focus, and responsive
behavior. Genuine long pending, stale-eligibility races, session-close conflicts,
ambiguous transport results, storage failure, and account-change recovery were
reviewed in implementation and focused tests because forcing them against the live
financial fixture would create misleading or unsafe evidence.

Before live work, the audit read `AGENTS.md`, the frontend contract and roadmaps,
FE-30 evidence, UXR-A16, the expense history/record/dialog/store/API/tests, and the
matching backend domain contract, controller, request/response DTOs, service, mapper,
locking, eligibility, and movement rules. The backend remains authoritative for
eligibility, the first stored reason/actor/time, original-session cash effects, and
resource-level replay.

After explicit action-time confirmation, the audit reversed disposable expense `#2`
for `Rp 12.345,6789` with reason
`Audit UXR-A17 pembatalan pengeluaran uji`. The backend returned it as voided by
`admin` at 2026-09-26 01:14 local display time, and refreshed history removed its
action while retaining all original and reversal facts. Expense `#1` remains active
but blocked because session `#6` is closed. These fixtures now cover eligible-before,
already-voided-after, and closed-session-ineligible states. UXR-A17 is therefore
`EVIDENCE_COMPLETE`.

The complete evidence index and 13 persistent screenshots are in
[`docs/ux/evidence/uxr-a17/README.md`](../evidence/uxr-a17/README.md).

## Scenario evidence

### A17-01 — Eligibility and block reasons

- **Steps:** open `/expenses`; compare expense `#2` in open session `#15` with expense `#1` in closed session `#6`.
- **Evidence:** A17-E00, A17-E05, A17-E06.
- **Observed:** `#2` showed “Dapat dibatalkan menurut server” and the only reversal action. `#1` showed “Sesi kas sudah ditutup. Pembatalan setelah tutup kas tidak tersedia” with no action.
- **Observed:** history rendered list-provided eligibility without per-row detail requests. Missing or unknown eligibility fails closed in implementation/tests.
- **Assessment:** the irreversible action is unavailable before confirmation for known blocked states, and the reason is explicit rather than color-only.

### A17-02 — Fresh detail and reason validation

- **Steps:** open reversal for `#2`; wait for the fresh-detail read; submit an empty reason; enter the final audit reason.
- **Evidence:** A17-E01, A17-E02, A17-E07.
- **Observed:** the dialog repeated exact original amount, category, operational classification, description, actor/time, and session. Confirmation was enabled only after the fresh detail remained eligible.
- **Observed:** blank submission focused the reason field and exposed “Alasan pembatalan wajib diisi.” The UI communicated the 255-character limit and permanent audit consequence.
- **Assessment:** the mutation intent is understandable and the reason requirement is accessible.

### A17-03 — Confirmation and backend-owned correction

- **Steps:** after owner confirmation, post the exact reason once and wait for the server result.
- **Evidence:** A17-E07 and A17-E08.
- **Observed:** the backend returned expense `#2` as “Dibatalkan” with the first stored reason, timestamp, and actor. The dialog kept original facts separate from the reversal audit and reported session `#15` plus server-reported expected cash `Rp 98`.
- **Observed:** no delete/edit, browser cash arithmetic, idempotency key, or version precondition appeared. Source/tests confirm the backend creates one `EXPENSE_REVERSAL` movement and resource-level replay returns the first audit without replacing it.
- **Assessment:** financial authority and immutable correction history are preserved.

### A17-04 — Confirmed-result refresh warning

- **Steps:** inspect the confirmed result; use `Periksa hasil`; independently open the original session and current cashier session.
- **Evidence:** A17-E08, A17-E10, A17-E12.
- **Observed:** the confirmed void and `Rp 98` session value remained visible, but “Sebagian data terbaru gagal dimuat” persisted after explicit retry (`REVERSAL-02`). Browser console warning/error inspection returned no entry.
- **Observed:** session-detail and cashier surfaces independently loaded session `#15` as open with opening cash `Rp 98`. This establishes that the reversal itself and both visible session reads were available; it does not prove which auxiliary refresh branch produced the warning.
- **Assessment:** the fail-closed result retention is correct, but an unexplained persistent warning immediately after a successful financial correction creates avoidable doubt. Root cause remains unproven and belongs to implementation diagnosis, not this audit.

### A17-05 — Retained audit and replay eligibility

- **Steps:** finish the result dialog; inspect refreshed history.
- **Evidence:** A17-E09.
- **Observed:** `#2` retained original amount/category/classification/description/creator/time/session plus reversal reason/time/actor. It showed “Sudah dibatalkan. Catatan audit tetap tersimpan” and exposed no second reversal action.
- **Observed:** `#1` remained unchanged and blocked by its closed session.
- **Assessment:** the first correction remains auditable and neither record can be destructively edited or deleted from this workflow.

### A17-06 — Original-session context and navigation

- **Steps:** follow session `#15` from the voided expense, then return with browser Back.
- **Evidence:** A17-E10 and A17-E11.
- **Observed:** the session detail confirmed the original session remains open and preserved its server facts.
- **Observed:** after returning, expense history displayed the stale cash-session breadcrumb “Riwayat Sesi Kas / Sesi #15” (`REVERSAL-03`). A fresh direct history entry has an empty breadcrumb region, as recorded in UXR-A16.
- **Assessment:** the cross-domain link is useful, but stale global location context is misleading.

### A17-07 — Keyboard and focus

- **Steps:** inspect dialog entry, press Tab, trigger blank validation, cancel, and finish the successful result.
- **Evidence:** A17-E02, A17-E03, A17-E08, and live accessibility state.
- **Observed:** blank validation correctly focused the reason field. After success removed the original action, dismissal focused the history heading.
- **Observed:** on live dialog entry, focus was reported on the dialog container and the first Tab moved to the embedded session link rather than the safe `Kembali` action. Cancelling returned focus to the document root instead of the original trigger (`REVERSAL-01`). Focused unit coverage expects trigger restoration, so the live/browser discrepancy requires implementation verification.
- **Assessment:** validation and success fallback are strong; entry/cancellation focus is not reliably demonstrated in the live target.

### A17-08 — Responsive behavior

- **Steps:** inspect history and active reversal at `1024×768` and `760×768`; measure document widths.
- **Evidence:** A17-E04 through A17-E06.
- **Observed:** history at `1024×768` measured `clientWidth=1009`, `scrollWidth=1009`. History and active dialog at `760×768` measured `clientWidth=760`, `scrollWidth=760`.
- **Observed:** the navigation collapses, cards remain readable, dialog content scrolls internally, and actions wrap/remain available without page-level horizontal overflow.
- **Assessment:** current responsive behavior meets the temporary narrow-desktop baseline, though the dialog remains information-dense.

### A17-09 — Pending, stale, conflict, and recovery coverage

- **Live limitation:** local reads and the POST settled too quickly for a genuine pending screenshot. The audit did not close session `#15`, interrupt transport, corrupt storage, or switch accounts around an unresolved operation.
- **Source/test evidence:** focused tests cover pending lock, duplicate prevention, Escape blocking while pending, stale list eligibility, session-close conflict, 409/503/timeout recovery, exact same-reason replay, prior reversal discovery, storage failure, malformed/changed results, stale active GET rejection, refresh retry without another POST, immutable account ownership, and legacy recovery quarantine.
- **Automated result:** four focused files passed 41 tests.
- **Assessment:** these paths are not represented as live screenshots and are not claimed as such.

## Findings

| ID | Priority | Classification | Finding |
| --- | --- | --- | --- |
| REVERSAL-01 | P1 | Live keyboard/focus | Dialog entry was reported on the dialog container; the first Tab moved to the historical session link, and cancellation returned focus to the document root instead of the triggering reversal action. Blank-error focus and successful fallback-to-heading worked. Reconcile the live behavior with unit expectations and put the safe action first. |
| REVERSAL-02 | P1 | Live confirmed-result feedback | The backend-confirmed void remained correct, but the partial-refresh warning persisted after `Periksa hasil` even while session detail and the current-session UI independently loaded. The warning does not imply reversal failure, yet its unexplained persistence undermines confidence after an irreversible cash correction. |
| REVERSAL-03 | P1 | Live navigation context | Returning from original session `#15` left its breadcrumb on expense history. The page title and breadcrumb described different locations until a fresh navigation/reload. |
| REVERSAL-04 | P2 | Live visual hierarchy | The dialog repeats all original facts, policy, status, reason, session value, refresh warning, and actions in one scrollable surface. Completeness is valuable, but the hierarchy makes the irreversible decision and stored result slower to scan than necessary. |

No P0 issue, duplicate reversal, replacement audit, deletion/edit path, local cash
calculation, or horizontal responsive failure was observed.

## Preserved strengths

- History uses backend eligibility and explicitly labels both eligible and blocked states.
- A fresh detail read occurs before confirmation; unknown or changed eligibility fails closed.
- Reason is required, bounded, trimmed, and becomes immutable audit evidence.
- Original expense facts and reversal facts remain distinct and visible.
- Pending/recovery retains the exact expense, reason, and immutable account owner and blocks unrelated reversals in the tab.
- Confirmed results survive refresh failures and never permit another POST.
- The backend owns the compensating movement, eligibility, first reversal audit, and session value.
- Closed-session and already-voided states remove the action and remain understandable without color.
- Narrow layouts avoid page-level horizontal scrolling and retain all actions.

## Recommendations for UXR-D15

These are audit recommendations, not implementation approval.

1. Preserve backend eligibility, the fresh-detail gate, exact reason/recovery ownership, and immutable original/reversal facts.
2. Separate “Pengeluaran asli”, “Pembatalan tersimpan”, and “Dampak sesi menurut server” into labelled groups with the irreversible action visually isolated.
3. Put initial dialog focus on `Kembali`, keep the destructive confirmation later in focus order, and reliably restore the trigger or history heading.
4. Distinguish “pembatalan berhasil” from auxiliary refresh health so a refresh warning cannot visually compete with the confirmed financial result.
5. Reuse one consistent breadcrumb owner/cleanup pattern so returning from cash-session detail cannot leave stale context.
6. Keep explicit text for closed-session and already-voided states; do not introduce post-close correction controls without a backend/product decision.
7. Retain internal dialog scrolling, wrapped actions, and no page-level overflow at the temporary 760-pixel baseline.
8. Keep history/create and reversal as separate design flows while using the approved back-office row/detail language.

## State-changing action and cleanup

| Action | Confirmation | Backend-confirmed result | Cleanup |
| --- | --- | --- | --- |
| Reverse disposable expense `#2` | Owner explicitly confirmed immediately before submission | `Rp 12.345,6789`; reason `Audit UXR-A17 pembatalan pengeluaran uji`; voided by `admin`; local display time 2026-09-26 01:14; original session `#15` | Retained as immutable already-voided audit evidence; no delete/edit endpoint exists |

Expense `#1` remains active and blocked by closed session `#6`. No expense was
deleted or edited, no second reversal was attempted, and no cash session was opened
or closed during A17.

## Focused automated verification

Command:

```text
.\node_modules\.bin\vitest.cmd run src/test/pages/expense/ExpenseVoid.test.jsx src/test/pages/expense/ExpenseHistory.test.jsx src/test/api/expense.test.js src/test/api/cash-session.test.js
```

Result on 2026-09-26:

```text
Test Files  4 passed (4)
Tests       41 passed (41)
Duration    8.44s
```

## Limitations

- A genuine long pending request, service outage, session-close race, ambiguous network result, storage failure, and cross-account recovery were not forced live.
- The persistent auxiliary refresh warning was observed and retried, but its failing request/root cause was not proven in this UX audit.
- The already-voided result cannot be reopened from history; its detailed confirmation remains screenshot evidence from the successful transaction boundary.
- Exact browser version, Windows display scaling, and deployed store hardware were unavailable.

