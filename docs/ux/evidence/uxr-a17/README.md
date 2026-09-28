# UXR-A17 evidence index — expense void/reversal

Audit date: 2026-09-26  
Environment: local Bloom frontend (`http://localhost:5173`) and backend (`http://localhost:8080`)  
Browser: Codex in-app browser (Chromium-based; exact version unavailable)  
Viewports: default wide desktop, `1024×768`, and `760×768`  
Mutation policy: final reversal required explicit action-time confirmation

The audit reversed expense `#2` for `Rp 12.345,6789` with reason
`Audit UXR-A17 pembatalan pengeluaran uji`. The backend-confirmed record remains
voided with immutable original and reversal audit facts. Expense `#1` remains active
and blocked because session `#6` is closed.

The assessment and priorities are in
[`docs/ux/audits/uxr-a17-expense-void.md`](../../audits/uxr-a17-expense-void.md).

## Persistent screenshots

| Evidence | File | Material state captured |
| --- | --- | --- |
| A17-E00 | [`00-expense-eligibility-history.jpg`](00-expense-eligibility-history.jpg) | Baseline: eligible `#2` and closed-session-ineligible `#1`. |
| A17-E01 | [`01-expense-void-dialog-eligible.jpg`](01-expense-void-dialog-eligible.jpg) | Fresh-detail dialog with original immutable facts and reason field. |
| A17-E02 | [`02-expense-void-reason-required.jpg`](02-expense-void-reason-required.jpg) | Required reason validation and associated field focus. |
| A17-E03 | [`03-expense-void-keyboard-focus.jpg`](03-expense-void-keyboard-focus.jpg) | First Tab focus on the embedded session link rather than the safe action. |
| A17-E04 | [`04-expense-void-dialog-760x768.jpg`](04-expense-void-dialog-760x768.jpg) | Active reversal dialog at `760×768`, including internal scroll and wrapped actions. |
| A17-E05 | [`05-expense-eligibility-history-760x768.jpg`](05-expense-eligibility-history-760x768.jpg) | Eligibility/block-reason cards at `760×768` without horizontal overflow. |
| A17-E06 | [`06-expense-eligibility-history-1024x768.jpg`](06-expense-eligibility-history-1024x768.jpg) | Eligibility history at the temporary `1024×768` baseline. |
| A17-E07 | [`07-expense-void-ready-to-confirm.jpg`](07-expense-void-ready-to-confirm.jpg) | Exact disposable reason immediately before owner-confirmed posting. |
| A17-E08 | [`08-expense-void-confirmed-refresh-warning.jpg`](08-expense-void-confirmed-refresh-warning.jpg) | Backend-confirmed void, immutable audit, session value, and persistent auxiliary refresh warning. |
| A17-E09 | [`09-expense-history-after-void.jpg`](09-expense-history-after-void.jpg) | Refreshed history with already-voided `#2` and closed-session `#1`; neither exposes a reversal action. |
| A17-E10 | [`10-original-session-after-void.jpg`](10-original-session-after-void.jpg) | Original session `#15` remains open and shows server session facts. |
| A17-E11 | [`11-expense-history-stale-breadcrumb-default.jpg`](11-expense-history-stale-breadcrumb-default.jpg) | Expense history incorrectly retaining the session-detail breadcrumb after browser Back. |
| A17-E12 | [`12-current-session-open-after-void.jpg`](12-current-session-open-after-void.jpg) | Independent cashier verification that current session `#15` still loads as open. |

## Mutation ledger

| Record | Exact submitted facts | Server-confirmed outcome | Retention |
| --- | --- | --- | --- |
| Expense `#2` | Reason `Audit UXR-A17 pembatalan pengeluaran uji` | `Rp 12.345,6789`; original session `#15`; voided by `admin`; display time 2026-09-26 01:14; first audit retained | Kept as immutable already-voided evidence |

No expense was deleted or edited. No second reversal was submitted. No cash session
was opened or closed.

## Measurements and interaction notes

- History at `1024×768`: `clientWidth=1009`, `scrollWidth=1009`.
- History and active dialog at `760×768`: `clientWidth=760`, `scrollWidth=760`.
- History rendered list eligibility without per-row reads; selecting `#2` performed one fresh detail verification.
- Blank confirmation focused the reason field.
- Live dialog entry was reported on the dialog container; the first Tab focused session `#15`.
- Cancelling returned live focus to the document root; successful dismissal focused the history heading after its removed trigger.
- Confirmed result survived a persistent auxiliary refresh warning and explicit retry.
- Browser warning/error log inspection returned no entries.
- Returning from session detail left a stale cash-session breadcrumb on expense history.
- The temporary viewport override was reset after capture.

## Repository, backend, and automated evidence

Frontend inspection covered:

- `src/pages/expense/ExpenseHistory.jsx`
- `src/components/expense/ExpenseRecord.jsx`
- `src/components/expense/ExpenseVoidDialog.jsx`
- `src/stores/modules/expense-void.js`
- `src/api/expense.js`
- `src/api/cash-session.js`
- expense void/history/API and cash-session API tests

Backend inspection covered the expense domain contract, `ExpenseController`,
`VoidExpenseRequest`, `ExpenseResponse`, `ExpenseServiceImpl`, `ExpenseMapper`,
eligibility rules, session locking, resource-level replay, and reversal movement
semantics.

Focused verification command:

```text
.\node_modules\.bin\vitest.cmd run src/test/pages/expense/ExpenseVoid.test.jsx src/test/pages/expense/ExpenseHistory.test.jsx src/test/api/expense.test.js src/test/api/cash-session.test.js
```

Result:

```text
Test Files  4 passed (4)
Tests       41 passed (41)
Duration    8.44s
```

The tests cover eligibility, fresh detail, reason bounds, keyboard cancellation,
pending lock, duplicate prevention, stale eligibility, session conflict, exact
replay, ambiguous recovery, retained success, refresh retry, immutable account
ownership, legacy quarantine, and response validation. States not forced live remain
explicitly labelled as source/test evidence in the report.
