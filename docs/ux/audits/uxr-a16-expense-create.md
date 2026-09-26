# UXR-A16 — Expense history and creation

Status: `EVIDENCE_COMPLETE` — live history, validation, confirmation, posting, backend result, session context, keyboard, and responsive evidence captured  
Execution: repository/backend contract review plus live UX audit with one explicitly confirmed disposable expense  
Audit date: 2026-09-26  
Environment: local Bloom frontend (`http://localhost:5173`) and backend (`http://localhost:8080`), using the documented local `admin` fixture  
Browser: Codex in-app browser (Chromium-based; exact version unavailable)  
Viewports: default wide desktop, `1024×768`, and `760×768`

## Scope and disposition

This audit covered paged expense history, record hierarchy, closed/open-session
context, category and “Alasan / catatan” comprehension, decimal amount entry,
validation, safe confirmation, backend-confirmed success, refreshed history,
keyboard/focus, and narrow-desktop behavior. Loading, service error, empty history,
session changes, pending, conflict, storage failure, and exact recovery were reviewed
in source and focused tests where forcing them live would risk misleading transaction
evidence. Expense void/reversal remains UXR-A17 scope.

Before live work, the audit read `AGENTS.md`, the frontend contract and roadmaps,
FE-29 evidence, expense pages/components/store/API/tests, and the matching backend
controller, request/response DTOs, enum, service, validation, idempotency, and cash
movement rules. The backend remains authoritative for session eligibility, stored
amount/category/classification, drawer effects, audit identity, and returned result.

After explicit action-time confirmation, the audit posted expense `#2` for
`Rp 12.345,6789`, category `OTHER` / “Lainnya”, description
`Audit UXR-A16 pengeluaran uji desimal`, against verified open cash session `#15`.
The result and history rendered the exact backend-returned amount and session. The
record remains intentionally eligible for UXR-A17; existing expense `#1` supplies a
closed-session example. UXR-A16 is therefore `EVIDENCE_COMPLETE`.

The complete evidence index and 13 persistent screenshots are in
[`docs/ux/evidence/uxr-a16/README.md`](../evidence/uxr-a16/README.md).

## Scenario evidence

### A16-01 — History and backend-owned audit facts

- **Steps:** open `/expenses`; inspect the existing closed-session record; refresh after posting the new record; change page size and load an out-of-range URL page.
- **Evidence:** A16-E00, A16-E06, and focused history tests.
- **Observed:** records expose ID, backend amount, category, active/void status, operational classification, description, actor/time, original cash-session link, and backend void eligibility without per-record enrichment.
- **Observed:** newest-first order places `#2` before `#1`. Page size is URL-backed (`page=1&size=25`), and `page=999` canonicalizes to page 1 when only one page exists.
- **Observed:** no category, session, status, date, or text filter exists because the backend list contract exposes paging only.
- **Assessment:** authority and audit identity are preserved. Multi-record scanning and later retrieval need design attention without inventing unsupported filters (`EXPENSE-02`, `EXPENSE-03`).

### A16-02 — Session gating, fields, and validation

- **Steps:** open `/expenses/new`; inspect verified session context; submit blank amount; enter `12.345,6789`, choose `Lainnya`, submit without a description, then add the audit description.
- **Evidence:** A16-E01 through A16-E03.
- **Observed:** the form names open session `#15` and states that the expense reduces drawer money. It provides an explicit session recheck.
- **Observed:** blank amount focuses the associated amount field. `OTHER` visibly makes “Alasan / catatan” required and focuses that field when omitted.
- **Observed:** Indonesian grouped input preserves four decimal digits. The UI sends a decimal string rather than calculating a drawer balance.
- **Assessment:** field language, conditional validation, focus, and cash-session meaning are strong.

### A16-03 — Confirmation and safe transaction intent

- **Steps:** review the valid draft before posting.
- **Evidence:** A16-E04.
- **Observed:** confirmation freezes amount, category, description, and expected session `#15`; it warns that the server posts only if that exact session remains open.
- **Observed:** initial dialog focus is on `Kembali`, and fields/actions behind the dialog are disabled.
- **Source/test evidence:** before first POST the store refreshes the current session and rejects a changed/closed session without substituting another ID. The exact request/key/account owner is persisted before sending; pending, uncertain, and replay states remain locked.
- **Assessment:** the transaction boundary is explicit and conservative. No frontend drawer calculation or silent retargeting was observed.

### A16-04 — Backend-confirmed success and refreshed history

- **Steps:** after explicit confirmation, submit the disposable expense; inspect the result; return to history.
- **Evidence:** A16-E05 and A16-E06.
- **Observed:** the server returned expense `#2`, session `#15`, exact amount `Rp 12.345,6789`, category “Lainnya”, operational classification, description, actor, and timestamp. A focused success announcement is retained until explicitly starting another expense.
- **Observed:** history reload shows the same facts and server eligibility alongside closed-session expense `#1`.
- **Assessment:** success is backend-confirmed, durable, and clearly separated from the editable draft.

### A16-05 — Cash-session relationship

- **Steps:** follow the result/history link for session `#15`.
- **Evidence:** A16-E11.
- **Observed:** the cash-session detail confirms `#15` is open and exposes server audit/reconciliation facts. The expense UI never computes a new drawer total.
- **Assessment:** cross-domain identity is preserved, though the session detail does not summarize its expense records on this page.

### A16-06 — Keyboard and semantic behavior

- **Steps:** traverse from the document start to the first expense-page action and inspect confirmation/result focus.
- **Evidence:** A16-E04, A16-E05, and A16-E10.
- **Observed:** 15 shell destinations/actions precede `Catat pengeluaran`; no skip-to-content control was observed (`EXPENSE-01`).
- **Observed:** visible focus, associated validation focus, safe confirmation focus, dialog trapping, and focused success feedback are present.
- **Assessment:** task-local focus is strong, but repeated shell traversal is costly for keyboard users.

### A16-07 — Responsive behavior

- **Steps:** inspect history at `1024×768` and `760×768`, and create/result at `760×768`; measure document widths.
- **Evidence:** A16-E07 through A16-E09 and A16-E12.
- **Observed:** at `1024×768`, `clientWidth=1009` and `scrollWidth=1009`. At `760×768`, both history and create measure `clientWidth=760` and `scrollWidth=760`.
- **Observed:** the navigation collapses at 760 pixels, cards/forms remain readable, form fields stack appropriately, and no page-level horizontal overflow appears.
- **Assessment:** the expense workflow meets the temporary narrow-desktop baseline. History cards remain vertically expensive but do not clip content.

### A16-08 — Loading, error, empty, conflict, and recovery coverage

- **Live limitation:** local reads and posting settled too quickly for genuine loading/pending frames; the service was not interrupted and session rollover/conflicts were not forced.
- **Source/test evidence:** focused tests cover loading, error/retry, empty history, canonical paging, stale responses, no/open/error session states, zero/precision/category/description validation, session change and conflict, duplicate prevention, storage failure, malformed success, pending, uncertain exact replay, immutable account ownership, and backend-confirmed success.
- **Automated result:** three focused files passed 31 tests.
- **Assessment:** these paths are not represented as live screenshots and are not claimed as such. Their fail-closed behavior is supported by implementation and tests.

## Findings

| ID | Priority | Classification | Finding |
| --- | --- | --- | --- |
| EXPENSE-01 | P1 | Live keyboard traversal | Fifteen shell controls precede the first expense-page action and no skip-to-content route was observed. Frequent keyboard users must repeatedly traverse global navigation before history/create work. |
| EXPENSE-02 | P2 | Live wide/narrow visual review | Each history record is a full-width stacked card whose category/status/classification/description/time rely on unlabeled prose lines. The amount and ID are prominent, but comparing several records is slower than a grouped, labelled row treatment. |
| EXPENSE-03 | P2 | Live workflow + implemented backend contract | History supports paging only. As records grow, there is no supported way to find a record by session, category, date, status, or text. A design must not fabricate these filters; any future retrieval control requires backend contract work. |
| EXPENSE-04 | P2 | Live navigation/semantic review | The shell breadcrumb region is empty on expense history/create, while create adds a separate inline history link. Location and return treatment are inconsistent with other back-office workflows. |

No P0 issue, duplicate posting, session retargeting, local financial authority, or
horizontal responsive failure was observed.

## Preserved strengths

- Expense creation is bound to one verified backend cash-session ID and never retargeted silently.
- Exact decimal strings, category, description, actor, session, classification, and audit status come from backend responses.
- Required and conditional validation focuses the associated control.
- Confirmation shows the complete frozen intent and initially focuses the safe back action.
- Pending/recovery design preserves the exact request, key, session, and immutable account owner.
- Success remains visible until explicit acknowledgement and history refreshes from the backend.
- Open/closed session eligibility is text-labelled and not communicated by color alone.
- The existing form and card layouts avoid horizontal overflow at 1024 and 760 pixels.

## Recommendations for UXR-D15

These are audit recommendations, not implementation approval.

1. Preserve the exact session banner, session recheck, frozen confirmation, fail-closed recovery, and backend-confirmed result.
2. Use the approved back-office grouped-row/card language to label category, status, classification, description, time/actor, and session without hiding any current fact.
3. Keep the primary record amount and active/void state quickly scannable for older users; do not rely on color or compact codes.
4. Establish one consistent breadcrumb/back-link pattern across history and create.
5. Add or preserve an application-level skip-to-content control.
6. Do not add history filters unless a matching backend query contract is approved. If retrieval becomes a real operational need, treat it as a backend-gated product decision.
7. Keep narrow layouts free of page-level horizontal scrolling and retain the current 44-pixel-or-larger action target direction.
8. Design A16 creation together with A17 eligibility/void states while keeping original and reversal facts visibly distinct.

## State-changing action and cleanup

| Action | Confirmation | Backend-confirmed result | Cleanup |
| --- | --- | --- | --- |
| Create one disposable expense | Owner confirmed immediately before posting | Expense `#2`; `Rp 12.345,6789`; `OTHER`; operational; session `#15`; created by `admin`; active/not voided | Retained intentionally as the eligible UXR-A17 fixture |

Existing expense `#1` remains active but belongs to closed session `#6`, providing
the A17 closed-session eligibility example. No expense was voided, edited, deleted,
or retargeted; no cash session was opened or closed during A16.

## Focused automated verification

Command:

```text
.\node_modules\.bin\vitest.cmd run src/test/pages/expense/ExpenseHistory.test.jsx src/test/pages/expense/ExpenseCreate.test.jsx src/test/api/expense.test.js
```

Result on 2026-09-26:

```text
Test Files  3 passed (3)
Tests       31 passed (31)
Duration    25.40s
```

## Limitations

- A genuine empty database, live service outage, long pending request, uncertain transport result, and session rollover were not forced.
- Only one results page existed, so a successful second-page transition remains test evidence.
- No-session create gating is source/test evidence because session `#15` must remain open for the eligible A17 fixture.
- Exact browser version, Windows display scaling, and deployed store hardware were unavailable.

