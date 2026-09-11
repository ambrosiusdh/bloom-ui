# FE-30 expense void/reversal

Status: `BLOCKED` for merge on recovery account identity. Reversal/eligibility backend gate cleared on 2026-09-11; frontend implementation and review fixes are present. No backend changes in this task.

## TL;DR and change intention

An eligible expense can now be cancelled from history with a required reason. Its original record and audit remain visible, and the server decides eligibility and drawer impact. A closed session prevents a new cancellation.

Change intention: let users correct an expense safely without deleting or silently editing its posted facts. The existing API, Zustand, MUI, and JavaScript structure is retained. The review follow-up reduces redundant history loads, validates immutable facts during recovery, and expands code/test formatting. Production approval still requires the account-identity contract described below.

## Verified backend evidence

Source paths below are relative to `E:/Project/Bloom App/bloom-app`:

| Requirement | Current implementation and evidence |
| --- | --- |
| Mutation | `bloom-app-web/src/main/java/com/bloom/app/web/controller/ExpenseController.java`: `POST /api/expenses/{expenseId}/void` accepts `VoidExpenseRequest` and returns `ApiResponse<ExpenseResponse>`. |
| Reason | `bloom-app-api/src/main/java/com/bloom/app/api/dto/request/expense/VoidExpenseRequest.java`: nonblank `reason`, maximum 255 characters. `ExpenseServiceImpl` also trims and validates it. |
| Audit result | `bloom-app-api/src/main/java/com/bloom/app/api/dto/response/expense/ExpenseResponse.java` and `bloom-app-service/src/main/java/com/bloom/app/service/mapper/ExpenseMapper.java`: original record fields, `voided`, `voidedReason`, `voidedAt`, `voidedBy`, and `version` are returned. |
| Duplicate/replay behavior | `bloom-app-service/src/main/java/com/bloom/app/service/impl/ExpenseServiceImpl.java` and `bloom-app-persistence/src/main/java/com/bloom/app/persistence/repository/ExpenseRepository.java`: the transaction locks the expense. An already-voided record returns unchanged before the session check, including after close. This is resource-level idempotency; the void endpoint has no `Idempotency-Key` contract. A different retry reason also returns the original audit result without replacing it. |
| Drawer effect | `ExpenseServiceImpl` posts one `EXPENSE_REVERSAL` movement for the original amount/session with reference `EXPENSE-{id}-VOID` and then records void metadata in the same transaction. `bloom-app-service/src/main/java/com/bloom/app/service/impl/CashMovementServiceImpl.java` locks the session and rejects new movements after close. The browser must refresh backend session values, never add the expense amount locally. |
| Post-close policy | `docs/architecture/release-1-domain-contract.md`, Expenses section: a first void on a closed session is prohibited; a future post-close correction workflow is outside Release 1. `ExpenseServiceImpl` enforces this with `CashSessionConflictException`. Historical unresolved wording elsewhere in the domain document does not introduce permission for a post-close correction. |
| Eligibility read — implemented | `ExpenseResponse` now contains `canVoid` and `ExpenseVoidBlockReason voidBlockReason`. `ExpenseMapper` returns true/null for an active expense in its open session, false/`CASH_SESSION_CLOSED` for an active closed-session expense, and false/`ALREADY_VOIDED` for a voided expense regardless of session status. List, detail, create, and void use this mapper. No separate endpoint is needed. |

Inspected expense service/controller tests, `ExpenseMapperTest`, and `CashSessionPostgreSqlIntegrationTest` coverage for eligibility reads, stale eligibility, and both close/void lock orders. Backend tests were not executed in this frontend task; gate verification is based on the implemented source and contract.

## Interaction and recovery

- History displays backend eligibility without per-row requests. Missing, inconsistent, or unknown eligibility fails closed. Selecting an eligible record reads its current detail before enabling confirmation.
- The MUI dialog shows original facts, session identity, policy, and a required reason of at most 255 characters. Validation focuses the reason field. Pending locks submission, reason editing, dismissal, and Escape. On completion feedback receives focus; dismissal returns focus to the original trigger or history heading if refresh replaced the trigger.
- A dedicated expense-void Zustand store owns pending state, reason, attempt, returned record, and refreshes. Before POST, it persists the exact expense/reason and verified username in session storage; storage failure blocks sending. Uncertain attempts and confirmed results survive navigation/reload, and another account cannot display or replay them.
- The current username comparison only distinguishes different username strings; it does not protect against username recycling. One unresolved reversal or unacknowledged result occupies the whole browser tab, including after account changes. Other reversals in that tab remain disabled, with explanatory copy; no discard control is added.
- Only `{ reason }` is posted to `/api/expenses/{expenseId}/void`. Repeat requests retain the original ID/reason. A changed server audit is rendered as stored state, without attributing the reversal to the current caller. No idempotency header or version precondition is added.
- After a conflict, timeout, incomplete/mismatched response, or other uncertain result, GET checks the stored expense. A confirmed void resolves recovery. Otherwise uncertain attempts remain locked to the same request, including after a failed replay. Definitive first-request validation/auth/not-found/session rejection preserves reason input and requires a fresh read before another confirmation.
- Success refreshes expense detail and history, the original `/api/cash-sessions/{cashSessionId}` for its `expectedClosingCash`, and the shared current-session store separately. This prevents a historical session from replacing the current drawer. Requests are bounded to 15 seconds. Failed refreshes cannot erase a confirmed void or trigger another POST; explicit read retry remains available.
- Existing loading/error/retry/empty/paging behavior is preserved. Dialog content wraps and scrolls, with wrapping actions for narrow viewports. No sale, supplier-payment, delete/edit, or post-close correction workflow is included.
- `historyRevision` advances on a confirmed POST or a read that discovers changed void/eligibility state. Ordinary unchanged reads do not reload history; a successful POST followed by the same GET result invalidates once. Cancellation therefore normally restores focus to the unchanged trigger.
- Response acceptance compares amount by exact decimal-string normalization, plus category, description, operational classification, creation timestamp/actor, expense ID, and session ID. Confirmed void audit cannot be replaced and a stale active GET cannot undo a confirmed void.

## Review disposition and remaining backend prerequisite

The external review identified a real identity gap. Inspection of backend `AuthController`, `UserSessionData`, `UserController`, `UserServiceImpl`, and `User` shows:

- `/api/auth/current` returns the session's username, name, and role. It exposes no immutable account ID or tenant identity.
- `User` has a generated primary key, but that entity field is not an authentication API contract.
- User deletion is implemented, and creation checks only whether the username currently exists. A deleted username can therefore represent a different account later. The frontend must not describe username as an immutable principal.

Before merge, the backend must expose a stable, non-recycled account identifier in its authenticated current-user contract and define behavior for existing sessions. Then FE-30 must bind persisted recovery to that verified identifier and test account recreation/rehydration. Existing username-only recovery must remain locked for manual reconciliation; never migrate it to a new identity by matching username alone. No speculative `currentUser.id` field is consumed in this patch. The current implementation remains present for review, not approved for production.

Use the [copyable backend handoff](fe-30-recovery-identity-backend-handoff.md) to resolve this prerequisite.

Other review findings:

- Fixed unnecessary history invalidation, strengthened original-fact validation, added stale-GET and recovery/invalidation regressions, and expanded the touched tests/objects/control flow for readability.
- Kept historical-session display separate from the shared current-session store. Session-detail HTTP timeout/signal now stay separate from loader options, preserving legacy `useLoader` callers and supporting explicit third-argument options.
- The shared normalizer already maps HTTP 409 `CashSessionConflictException` to `cash_session_conflict`; its existing parameterized test covers this mapping regardless of endpoint. Unknown conflicts retain conservative recovery.
- An extra async request token is deferred: current public operations serialize with `pending`, and no supported path replaces the selected transaction while a request is active. Add a guard if concurrent selection/refresh is introduced.
- Rejected the supplied history replacement: it invents unsupported `q` search and drops canonical paging/out-of-range/accessibility safeguards. The original history behavior is preserved.
- Review formatting separately from the behavioral/test additions when preparing PRs; the expanded physical diff exceeds the usual single-PR target. No split-size exception, commit, or push is implied.

## Validation

- Review follow-up focused checks passed: 5 files / 58 tests, including 25 reversal interaction/store tests, expense history/API tests, cash-session API compatibility, and the shared error normalizer.
- Full-suite verification is not green: the final standard run completed with 338 passed / 15 failed across 57 files (14 timeouts and one stock-transfer UI assertion). All FE-30 tests passed in that run. The earlier run alongside the build had 318 passed / 35 failed; bounded fork/thread reruns stalled and were stopped. Test timeouts and application code in other domains were not changed to make the suite pass.
- Rerunning all nine failed files together passed: 9 files / 127 tests. This supports a concurrency-related timing problem, but does not turn the recorded full-suite failure into a passing full-suite run. Every file passed either in the final full run or this targeted rerun.
- Production build and touched-file ESLint passed. Existing Browserslist-data and large-chunk warnings remain.
- Desktop confirmation was visually checked with isolated fixture data. Keyboard cancellation/focus, pending lock, and result focus are covered by automated interaction tests. Live backend/browser verification and narrow viewport visual checks remain incomplete: login initially failed from port 5173, and browser automation stalled after moving to the user-requested port 5172. No real expense was posted or reversed.
- Development preview uses `http://localhost:5172` at the user's request to match the backend CORS guard; no global port/config migration is included.
