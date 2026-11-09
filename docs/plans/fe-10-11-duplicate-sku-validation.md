# Item duplicate-SKU validation follow-up

Date: 2026-11-06. Scope: item master creation/editing only (FE-10/FE-11, UXI-12).
Status: `IMPLEMENTED` and verified against the updated local backend.

## Observed and agreed API contract

Before the fix, an actual local `POST /api/items` with existing `QA1106-K7-A`,
valid category, and valid opening quantities returned HTTP 500:

```json
{"code":500,"success":false,"errorType":"InternalServerError","message":"An unexpected error occurred"}
```

The backend agent for `Fix duplicate-SKU error handling` confirmed the replacement
contract for both `POST /api/items` and `PUT /api/items/{sku}`:

```json
{
  "success": false,
  "code": "item_sku_already_exists",
  "errorType": "ItemSkuAlreadyExistsException",
  "message": "Item SKU already exists: QA1106-K7-A",
  "field": "sku",
  "rejectedValue": "QA1106-K7-A"
}
```

Status is HTTP 409. The stable discriminator is the status plus `code`, never
the English message, exception name alone, or an arbitrary conflict. The backend
owns uniqueness prechecks, unique-constraint races, and atomic rollback. An
unchanged own SKU remains valid. See the backend Release 1 domain contract.

## Implemented frontend behavior

The shared error boundary preserves the specific domain code. Both forms render
`SKU [QA1106-K7-A] sudah digunakan. Gunakan SKU lain.` as MUI SKU helper text;
explicit control IDs associate it with `aria-describedby` and `aria-invalid`.
Existing deferred field focus runs after pending submission ends. The rejection
does not reset fields, navigate, show success, refresh edit data, or retry.

Creation retains original comma/dot decimal editing strings and all other values.
Editing leaves metadata available for correction without activating the generic
conflict refresh lock. Editing the SKU clears its error; an explicit subsequent
submission follows the existing success flow. Unrecognized errors retain generic
fallbacks and unrelated edit conflicts retain the existing refresh requirement.
An automatic-generation collision gives an explicit instruction to choose a
manual SKU, since that mode has no visible SKU input.

## Verification

- Focused shared-boundary/create/edit coverage: 41 tests passed, including
  identifier-specific feedback, accessibility, deferred focus, pending duplicate
  prevention, retained opening strings, keyboard correction, explicit resubmit,
  unrelated conflicts, malformed codes, and the original generic HTTP 500.
- Full-project ESLint and production build passed. Existing Browserslist age and
  bundle-size warnings remain.
- Full single-worker frontend suite: 498 tests passed across 71 files.
- Backend agent reports 43 focused tests passed, including five real PostgreSQL
  endpoint tests for prechecks, unchanged own SKU, and uniqueness-race rollback.
- Actual updated local POST and PUT responses both returned HTTP 409 with the
  exact agreed structured code, field, and rejected value.
- Browser create: duplicate A rejected inline with focused, enabled SKU;
  `aria-invalid=true` and `aria-describedby=item-create-sku-helper-text` resolve
  to the Indonesian helper. Name, category, price `12345,5000`, description,
  METER/fraction policy, and opening strings `1,2500` / `2.0001` remained intact.
  Explicit keyboard resubmission with duplicate B updated the identifier in the
  helper, stayed on the form, and left submission enabled.
- Browser edit: an isolated zero-stock item rejected duplicate A while retaining
  edited name, price `9999,5000`, description, and measurement rules. The SKU
  retained focus and accessible error association; submit remained enabled and no
  refresh action or success appeared. Correction back to its own SKU followed by
  Enter succeeded and navigated to the server-confirmed success result.
- The exact reported locked-item scenario, QA1106-K7-B changed to QA1106-K7-A,
  also rejected with the same focused inline SKU helper and editable metadata.
  The server-returned 10 / 20 stock facts and locked measurement rules remained.
- Both rejection layouts were visually checked at the default 1280-pixel width
  and at 760 pixels; narrow document width was 745 pixels, with no horizontal
  overflow. The temporary viewport override was reset.

## Test data and runtime

The existing backend and frontend were running packaged snapshots. The backend
agent restarted its tested JAR using the existing QA database configuration. The
frontend static server on port 5173 was restarted with this workspace's verified
`dist` directory. Temporary Vite servers were stopped after verification.

Only the disposable item `QA1106-DUPSKU-EDIT` was successfully created/updated,
with zero opening quantities. It was deactivated after verification and the final
API read confirms zero balances and `hasStockMovements=false`. Duplicate create
attempts with positive opening quantities were rejected; no stock operation or
financial transaction was posted.

Final API reads confirm reusable records were preserved:

| SKU | Active | STORE | WAREHOUSE | Unchanged updatedAt |
| --- | --- | --- | --- | --- |
| QA1106-K7-A | true | 10 | 20 | 2026-11-06T14:40:28.145842Z |
| QA1106-K7-B | true | 10 | 20 | 2026-11-06T14:41:11.563136Z |

The initial Git worktree already contained cashier/theme changes and a contract
update; those changes were preserved. No commit or push is part of this work.
