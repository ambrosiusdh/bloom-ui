# UXR-A12 evidence index — Supplier master data

Audit date: 2026-09-24  
Environment: local Bloom frontend (`http://localhost:5173`) and backend (`http://localhost:8080`)  
Browser: Codex in-app browser (Chromium-based; exact version unavailable)  
Viewports: default wide browser surface (`1610×1270`), `760×768`, and the `768×768` responsive boundary  
Mutation policy: one disposable supplier was created, edited, and deactivated through the implemented UI; an existing referenced supplier was read only; no hard delete, receipt, payable, payment, or reactivation occurred

## Evidence policy

The owner requested a persistent screenshot for every materially distinct audit step and state. Twenty-one PNGs are retained in this directory as working-tree evidence. The report also records routes, focus, measurements, data mutations, backend/repository facts, and focused tests so conclusions do not depend on images alone.

The assessment and priorities are in [`docs/ux/audits/uxr-a12-suppliers.md`](../../audits/uxr-a12-suppliers.md).

## Persistent screenshot set

| File | Material state captured |
| --- | --- |
| [`00-active-list-wide.png`](00-active-list-wide.png) | Baseline active supplier list, search, status filter, table, and paging controls. |
| [`01-referenced-detail-wide.png`](01-referenced-detail-wide.png) | Existing referenced supplier with stable identity, audit metadata, and server-owned outstanding summary. |
| [`02-create-empty-wide.png`](02-create-empty-wide.png) | Empty supplier creation form and initial name focus. |
| [`03-create-required-validation-wide.png`](03-create-required-validation-wide.png) | Required name/code validation with first-invalid focus. |
| [`04-create-ready-wide.png`](04-create-ready-wide.png) | Complete disposable supplier request before submission. |
| [`05-create-success-wide.png`](05-create-success-wide.png) | Backend-confirmed supplier creation and detail. |
| [`06-duplicate-code-conflict-wide.png`](06-duplicate-code-conflict-wide.png) | Lowercase normalized duplicate conflict with preserved fields and code focus. |
| [`07-search-active-wide.png`](07-search-active-wide.png) | URL-backed active search finding the fixture. |
| [`08-filtered-empty-wide.png`](08-filtered-empty-wide.png) | Search-specific empty state. |
| [`09-edit-immutable-code-wide.png`](09-edit-immutable-code-wide.png) | Edit form with disabled stable code and history helper text. |
| [`10-edit-success-wide.png`](10-edit-success-wide.png) | Backend-confirmed mutable-field edit and updated audit metadata. |
| [`11-deactivation-confirmation-wide.png`](11-deactivation-confirmation-wide.png) | Deactivation confirmation, safe cancel focus, and retained-history language. |
| [`12-confirmation-escape-return-wide.png`](12-confirmation-escape-return-wide.png) | Detail restored after Escape with focus returned to the deactivation trigger. |
| [`13-deactivation-success-wide.png`](13-deactivation-success-wide.png) | Focused success, inactive status, and retained identity/detail. |
| [`14-active-filter-after-deactivation-wide.png`](14-active-filter-after-deactivation-wide.png) | The inactive fixture absent from the same active search. |
| [`15-inactive-filter-wide.png`](15-inactive-filter-wide.png) | The deactivated fixture discoverable under the inactive filter. |
| [`16-inactive-code-reserved-wide.png`](16-inactive-code-reserved-wide.png) | Duplicate conflict proving the inactive supplier code remains reserved. |
| [`17-inactive-list-760x768.png`](17-inactive-list-760x768.png) | Clean card-based inactive list at `760×768`. |
| [`18-inactive-detail-760x768.png`](18-inactive-detail-760x768.png) | Stacked inactive supplier detail at `760×768`. |
| [`19-edit-760x768.png`](19-edit-760x768.png) | Stacked edit form with immutable code at `760×768`. |
| [`20-inactive-list-768x768.png`](20-inactive-list-768x768.png) | Expanded sidebar/table collision and horizontal overflow at the `768×768` boundary. |

Local create/update/deactivation requests completed before genuine pending screenshots could be retained. Pending/duplicate locking therefore remains focused automated-test and repository evidence; no artificial latency was introduced.

## Live evidence sequence

| ID | Route / state | Viewport | Recorded evidence |
| --- | --- | --- | --- |
| A12-E01 | `/suppliers` and `/suppliers/QA-FE26-20260909` | 1610×1270 | Active list contained two records. Referenced supplier detail retained code/audit facts and displayed a server-owned `Rp 1,25` outstanding value without mutation. |
| A12-E02 | `/suppliers/maintenance/new`, empty/required | 1610×1270 | Initial focus was name. Blank submission showed name and code errors and kept focus on the first invalid field. |
| A12-E03 | Create ready/success | 1610×1270 | Created `UXRA12-SUP` with name/contact/address; backend-confirmed detail showed active status, saved fields, and audit metadata. |
| A12-E04 | Duplicate conflicts | 1610×1270 | Lowercase `uxra12-sup` conflicted with the active uppercase identity; `UXRA12-SUP` remained reserved after deactivation. Both attempts retained input and created no supplier. |
| A12-E05 | Search/filter/empty/return | 1610×1270 | URL query/state found the active fixture, showed a query-specific empty state, retained return context through detail, and later found the fixture only under `active=false`. |
| A12-E06 | Immutable-code edit | 1610×1270 | Code was disabled/skipped; name/contact/address updated; detail retained the code and refreshed server audit fields. |
| A12-E07 | Deactivation and retained history | 1610×1270 | Confirmation focused cancel, explained non-selection for new transactions and retained identity/history, Escape restored trigger focus, and success retained detail under inactive status. |
| A12-E08 | Keyboard order | 760×768 | Edit Tab order was name, contact, address, save, cancel; disabled code was skipped. Required/conflict and modal focus behavior was also exercised live. |
| A12-E09 | Responsive layouts | 760×768 and 768×768 | At 760, cards/detail/edit had no horizontal overflow (`760/760`). At a viewport set to 768, the rendered body client width was `753` and scroll width `870`; the expanded shell plus desktop table caused horizontal page panning and moved the action column off-screen. |
| A12-E10 | Focused automated verification | Local Vitest/jsdom | Five supplier test files passed 26 tests covering supported paging/filter contracts, stale reads, loading/error retry, server balance, validation, conflict preservation, pending locks, immutable update, deactivation, and no frontend hard-delete API. |

## Fixture ledger and cleanup

| Code | Lifecycle | Recorded result |
| --- | --- | --- |
| `QA-FE26-20260909` | Existing referenced supplier | Read only; server detail showed `Rp 1,25` posted/outstanding and retained identity/audit fields. |
| `UXRA12-SUP` | Created → edited → deactivated | Remains in the inactive filter as `Audit A12 Bahan Sejahtera Revisi`; stable code, contact/address, and audit fields retained. |
| Duplicate attempts | Rejected | Lowercase active collision and post-deactivation collision both produced no new record. |

## Repository and backend evidence

- The frontend list sends only supported `page`, `size`, `query`, and `active` values, protects against stale list/detail responses, and renders the backend page without enrichment.
- The backend defaults to active suppliers; `active=false` selects inactive suppliers. Search contains-matches code, name, contact, or address case-insensitively.
- Supplier code is normalized and uniquely reserved, including by inactive suppliers; the entity marks it non-updatable.
- Update accepts name/contact/address but not code. Response data contains lifecycle state plus created/updated actor/time.
- Detail reads exactly one backend outstanding aggregate and renders it directly; the browser does not aggregate receipts.
- The frontend exposes activation-to-false only and no hard-delete API. The backend guarded delete endpoint exists but rejects suppliers with financial history; hard deletion was outside this audit and was not invoked.

## Focused automated verification

```text
Test Files  5 passed (5)
Tests       26 passed (26)
Duration    66.71s
```

## Evidence limitations

- The live database did not contain enough suppliers for a second page.
- Loading, error/retry, pending duplicate locks, and stale-response races remain test/repository evidence because local requests settled quickly and shared services were not interrupted.
- Reactivation, goods receipts, payables, and payments were out of scope.
- Exact browser version, Windows display scaling, and deployed store hardware were unavailable.

