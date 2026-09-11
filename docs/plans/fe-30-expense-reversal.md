# FE-30 expense void/reversal

Status: `REVIEW`. Backend gate cleared after source reinspection on 2026-09-11. JavaScript frontend implementation; no backend changes in this task.

## TL;DR and change intention

An eligible expense can now be cancelled from history with a required reason. Its original record and audit remain visible, and the server decides eligibility and drawer impact. A closed session prevents a new cancellation.

Change intention: let users correct an expense safely without deleting or silently editing its posted facts. The existing API, Zustand, MUI, and JavaScript structure is retained. An earlier inspection found eligibility missing; the backend now provides that contract, so the interaction and focused tests are implemented.

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
- Only `{ reason }` is posted to `/api/expenses/{expenseId}/void`. Repeat requests retain the original ID/reason. A changed server audit is rendered as stored state, without attributing the reversal to the current caller. No idempotency header or version precondition is added.
- After a conflict, timeout, incomplete/mismatched response, or other uncertain result, GET checks the stored expense. A confirmed void resolves recovery. Otherwise uncertain attempts remain locked to the same request, including after a failed replay. Definitive first-request validation/auth/not-found/session rejection preserves reason input and requires a fresh read before another confirmation.
- Success refreshes expense detail and history, the original `/api/cash-sessions/{cashSessionId}` for its `expectedClosingCash`, and the shared current-session store separately. This prevents a historical session from replacing the current drawer. Requests are bounded to 15 seconds. Failed refreshes cannot erase a confirmed void or trigger another POST; explicit read retry remains available.
- Existing loading/error/retry/empty/paging behavior is preserved. Dialog content wraps and scrolls, with wrapping actions for narrow viewports. No sale, supplier-payment, delete/edit, or post-close correction workflow is included.

## Validation

- Full frontend suite passed: 57 files / 341 tests, including 14 focused reversal interaction/store tests and the added API request contract test.
- Production build and touched-file ESLint passed. Existing Browserslist-data and large-chunk warnings remain.
- Desktop confirmation was visually checked with isolated fixture data. Keyboard cancellation/focus, pending lock, and result focus are covered by automated interaction tests. Live backend/browser verification and narrow viewport visual checks remain incomplete: login initially failed from port 5173, and browser automation stalled after moving to the user-requested port 5172. No real expense was posted or reversed.
- Development preview uses `http://localhost:5172` at the user's request to match the backend CORS guard; no global port/config migration is included.
