# UXR-A16 evidence index — expense history and creation

Audit date: 2026-09-26  
Environment: local Bloom frontend (`http://localhost:5173`) and backend (`http://localhost:8080`)  
Browser: Codex in-app browser (Chromium-based; exact version unavailable)  
Viewports: default wide desktop, `1024×768`, and `760×768`  
Mutation policy: final expense posting required explicit action-time confirmation; the disposable result is retained for UXR-A17

The audit created expense `#2` for `Rp 12.345,6789`, category `OTHER`, description
`Audit UXR-A16 pengeluaran uji desimal`, against verified open cash session `#15`.
The server-returned record remains active and eligible for the next void/reversal
audit. Existing expense `#1` belongs to closed session `#6`.

The assessment and priorities are in
[`docs/ux/audits/uxr-a16-expense-create.md`](../../audits/uxr-a16-expense-create.md).

## Persistent screenshots

| Evidence | File | Material state captured |
| --- | --- | --- |
| A16-E00 | [`00-expense-history-wide.jpg`](00-expense-history-wide.jpg) | Baseline history with existing closed-session expense `#1`. |
| A16-E01 | [`01-expense-create-open-session.jpg`](01-expense-create-open-session.jpg) | Create form with verified open session `#15` and drawer-effect explanation. |
| A16-E02 | [`02-expense-validation-required.jpg`](02-expense-validation-required.jpg) | Required amount validation with associated field focus. |
| A16-E03 | [`03-expense-validation-other-reason.jpg`](03-expense-validation-other-reason.jpg) | `Lainnya` conditional description requirement and exact four-decimal amount entry. |
| A16-E04 | [`04-expense-confirmation.jpg`](04-expense-confirmation.jpg) | Frozen amount/category/description/session confirmation with safe initial focus on `Kembali`. |
| A16-E05 | [`05-expense-success.jpg`](05-expense-success.jpg) | Backend-confirmed expense `#2` and focused success announcement. |
| A16-E06 | [`06-expense-history-after-create.jpg`](06-expense-history-after-create.jpg) | Fresh history showing open-session eligible `#2` and closed-session `#1`. |
| A16-E07 | [`07-expense-history-1024x768.jpg`](07-expense-history-1024x768.jpg) | History at the temporary `1024×768` narrow-desktop baseline. |
| A16-E08 | [`08-expense-history-760x768.jpg`](08-expense-history-760x768.jpg) | Collapsed-shell history at `760×768` without horizontal overflow. |
| A16-E09 | [`09-expense-success-760x768.jpg`](09-expense-success-760x768.jpg) | Confirmed result at `760×768`. |
| A16-E10 | [`10-expense-history-keyboard-focus.jpg`](10-expense-history-keyboard-focus.jpg) | Visible focus on the first page action after traversing 15 shell controls. |
| A16-E11 | [`11-expense-session-15-open.jpg`](11-expense-session-15-open.jpg) | Linked backend cash-session detail confirming session `#15` remains open. |
| A16-E12 | [`12-expense-create-760x768.jpg`](12-expense-create-760x768.jpg) | Fresh create form at `760×768`, including stacked fields and full-width primary action. |

## Mutation ledger

| Record | Exact submitted facts | Server-confirmed outcome | Retention |
| --- | --- | --- | --- |
| Expense `#2` | Session `#15`; `Rp 12.345,6789`; `OTHER`; `Audit UXR-A16 pengeluaran uji desimal` | Active/not voided; operational; created by `admin`; exact amount/session preserved | Retained as the eligible UXR-A17 fixture |

No expense was voided, edited, or deleted. No cash session was opened or closed.

## Measurements and interaction notes

- History at `1024×768`: `clientWidth=1009`, `scrollWidth=1009`.
- History and create at `760×768`: `clientWidth=760`, `scrollWidth=760`.
- `page=999&size=10` canonicalized to `page=1&size=10` when only one page existed.
- Changing page size to 25 produced `page=1&size=25` and one fresh backend request.
- Fifteen shell focus stops preceded `Catat pengeluaran`.
- Confirmation initially focused `Kembali`; success feedback received focus.
- Browser warning/error log inspection returned no entries.
- The temporary viewport override was reset after capture.

## Repository, backend, and automated evidence

Frontend inspection covered:

- `src/pages/expense/ExpenseHistory.jsx`
- `src/pages/expense/ExpenseCreate.jsx`
- `src/components/expense/ExpenseRecord.jsx`
- `src/stores/modules/expense.js`
- `src/api/expense.js`
- `src/utils/expense-utils.js`
- focused history/create/API tests

Backend inspection covered `ExpenseController`, `CreateExpenseRequest`,
`ExpenseResponse`, `ExpenseCategory`, `ExpenseServiceImpl`, mapper/repository behavior,
cash-session locking, cash movement posting, validation, and idempotency rules.

Focused verification command:

```text
.\node_modules\.bin\vitest.cmd run src/test/pages/expense/ExpenseHistory.test.jsx src/test/pages/expense/ExpenseCreate.test.jsx src/test/api/expense.test.js
```

Result:

```text
Test Files  3 passed (3)
Tests       31 passed (31)
Duration    25.40s
```

The tests cover loading, error/retry, empty history, paging/canonicalization,
stale-response handling, no/open/error session states, decimal/category/description
validation, confirmation/focus, pending/duplicate prevention, exact session/key
recovery, conflicts, storage failure, malformed success, account isolation, and
backend-confirmed result rendering. States not forced live remain explicitly labelled
as source/test evidence in the report.

