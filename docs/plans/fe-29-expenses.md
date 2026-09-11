# FE-29 expense history and creation

Status: `REVIEW`. Backend gate verified 2026-09-11. JavaScript implementation only; no backend changes.

## Verified contract

Inspected the Bloom backend's `ExpenseController`, `CreateExpenseRequest`, `ExpenseResponse`, `ExpenseCategory`, `ExpenseServiceImpl`, `ExpenseMapper`, `ExpenseRepository`, `CashMoneyUtil`, `PagingHelper`, `GlobalExceptionHandler`, `SecurityConfig`, cash-session current controller/response/service, V15 migration, expense service tests, and the expense decisions in `docs/architecture/release-1-domain-contract.md`.

- Authenticated `GET /api/expenses` returns `Page<ExpenseResponse>` across all sessions. It does **not** require an open session. Paging is one-based at the HTTP boundary; the service fixes ordering to `createdAt DESC, id DESC`. No category, status, session, date, or search filters are implemented.
- `POST /api/expenses` requires `Idempotency-Key` (nonblank, at most 100 characters). Request fields are required positive `expectedCashSessionId`, `amount`, `category`, and optional `description`. There are no separate create `reason` or `note` fields. The expected session is captured from the backend-confirmed current session, not entered manually.
- Amount is positive, minimum `0.0001`, at most 15 integer and 4 fractional digits. Decimal strings preserve input precision without browser money arithmetic.
- Categories: `STORE_OPERATIONAL`, `FOOD_AND_DRINK`, `CHARITY`, `EMERGENCY_PURCHASE`, `OWNER_WITHDRAWAL`, `OTHER`. Description is at most 255 characters; `OTHER` requires nonblank description. The form labels this single field “Alasan / catatan”.
- Service normalization trims text, locks the specified session and requires it to remain open, and atomically creates the expense and cash movement. V15 enforces positive amounts, valid categories, immutable expense facts, an open session for insertion, unique creation keys, and one expense posting movement. The service never substitutes a different open session.
- A transaction-scoped advisory key lock serializes duplicate attempts. Equal canonical amount/category/description and the same recorded session replay the stored record **before** checking session eligibility. Changed content/session produces HTTP 409 `ExpenseIdempotencyConflictException`; closed/missing expected session produces HTTP 409 `CashSessionConflictException`. Existing content hashes are unchanged; session identity is compared against the immutable stored session link, preserving historical committed-key compatibility without a migration.
- There is no expense lookup by idempotency key. Recovery replays the exact POST/key, including the original `expectedCashSessionId`. A committed expense replays after its session closes; an uncommitted request cannot post into a replacement session. A current-session preflight is advisory; the backend row lock enforces session binding atomically.
- Response contains ID, session ID, amount, category, backend `operationalExpense`, description, void state/audit, creation actor/time, and version. History and success display these returned facts; classification and drawer amounts are not calculated locally.
- Current session is HTTP 200 with a record or `data: null`. Errors are never interpreted as a confirmed absence. All routes require authentication. Expense corrections are retained voids; the domain contract rejects closed-session voids. FE-30 mutation UI remains excluded.

## Interaction and ownership

- `/expenses`: paged history, 10/25/50 page sizes, canonical query, stale-response guard, out-of-range recovery, loading/error/retry/empty states, read-only audit cards, and create/session-history links. It loads one page without per-row enrichment. Cards work at wide and narrow widths.
- `/expenses/new`: collect and validate input; review a snapshot including `expectedCashSessionId` in an accessible dialog; recheck the session before first posting without replacing that ID. A changed session cancels submission and requires another review. Backend conflicts preserve the draft. After a definitive first-attempt session rejection, posting to a new session requires fresh confirmation and a new key.
- Zustand owns one unresolved expense per browser tab. Confirmed request/key, expected session ID, and verified backend username are saved to session storage before POST. Storage failure blocks sending. Drafts, uncertain attempts, and confirmed results survive navigation/reload in that tab. A different account cannot display or replay the previous account's attempt/result. The original storage key is retained so pre-upgrade attempts are not accidentally discarded.
- Pre-upgrade uncertain attempts without a usable expected session ID stay locked for manual reconciliation against backend expense/audit records. The UI exposes the recovery key but no retry/new-submit control; store actions also enforce the lock. It never infers historical intent from today's current session. Previously confirmed results remain readable. All backend instances must support required session binding before enabling the aligned frontend; mixed-version deployment is unsupported.
- Pending prevents duplicate clicks and edits. Timeout, network/server failure, incomplete success, a returned record naming a different session, and unidentified conflicts retain the original attempt. Any failed replay remains unresolved, even if that replay returns a normally definitive validation/authentication/conflict status. Key conflicts lock recovery for administrator investigation.
- A definitive first-attempt rejection releases the attempt but preserves editable input. A successful response renders its returned record, refreshes current-session state, and remains visible until the user explicitly starts the next expense. History loads fresh on navigation; a failed history/session refresh never turns a confirmed expense into another POST.
- All expense and session-check requests are bounded to 15 seconds. No edit/delete/void endpoint, drawer total, date filter, or category administration is added.
- MUI dialog focus trapping/Escape/return, associated field errors, first-error focus, pending announcements, focused outcome, and focus on the next amount field provide keyboard and screen-reader interaction.

## Review split

The combined domain change exceeds the roadmap's usual single-PR line budget. Review/deliver as two dependent slices rather than treating this working tree as one size-approved PR:

1. **FE-29a history:** GET API, category labels/record renderer, history page, history navigation route/sidebar, API/history/navigation tests.
2. **FE-29b creation:** POST API, request validation/error mapping, durable creation store, create page/route, and transaction/accessibility tests. The create entry is exposed only with this fully wired slice.

The API/util files have small shared sections to separate when preparing the two diffs. No commits, pushes, PRs, or split-size exception are implied by implementation.

## Verification

Automated coverage includes paging/canonicalization/stale responses, audit fields, loading/error/retry/empty, exact payload/key, all supported categories, decimal boundaries, conditional description, open/closed/unknown sessions, preflight session changes, conflicts, input preservation, duplicate prevention, durable recovery, failed replay, account isolation, storage failure, incomplete success, keyboard confirmation/cancel, and focus.

Validation commands use the installed tools directly because this machine's `npm`/`npx` launchers point to missing files:

```text
node node_modules/vitest/vitest.mjs run
node node_modules/vite/bin/vite.js build
node node_modules/eslint/bin/eslint.js <touched JS/JSX files>
```

Initial verification results (2026-09-11, before session-binding alignment):

- Full suite: 56 files / 314 tests passed. After adding three more transaction regressions, the final focused expense/navigation run passed 4 files / 25 tests (21 expense tests and 4 navigation tests).
- Production build passed. Existing large-chunk and outdated Browserslist-data warnings remain; no dependency migration was included.
- ESLint passed for all touched JavaScript/JSX. `git diff --check` passed.
- Headless Chrome verified the routed application at 1366, 768, and 390 pixels: no horizontal overflow, readable history/create/confirmation layouts, keyboard Escape and focus restoration, a single POST with exact decimal-string payload/key, rendered returned record, and a fresh history GET after success. No page errors occurred. Browser checks used fixture API responses and did not post real drawer expenses.

Session-binding alignment (2026-09-11) follows backend commit `941db91` and its `docs/operations/fe29-expense-session-rollout.md`. Regression coverage includes exact session payload/persistence, replay after closure or rollover, fresh confirmation/key after definitive conflict, invalid session IDs, locked legacy recovery, and response-session mismatch. Backend service/controller recheck passed 21 tests; the PostgreSQL integration rerun could not initialize because Docker was unavailable.

Final alignment verification: 27 focused expense tests passed, followed by the full 56-file / 323-test frontend suite. Production build, touched-file ESLint, and `git diff --check` passed. Headless Chrome fixture checks passed again at 1366, 768, and 390 pixels, including the exact `expectedCashSessionId` POST payload, named-session confirmation, keyboard cancellation/focus, returned record, and refreshed history, with no horizontal overflow or page errors. No real expenses were posted. Existing build warnings remain unchanged. FE-29 remains `REVIEW`.
