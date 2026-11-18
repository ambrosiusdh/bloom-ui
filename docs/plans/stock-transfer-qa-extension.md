# Stock-transfer QA extension

Status: IMPLEMENTED, 2026-11-09. Domain: stock transfer only.

The original FE-14/UXI-15 form exposed one line despite the atomic backend request already
accepting an array. This authorized follow-up adds multiple lines, persisted history/detail,
and navigation from transfer movements to their parent without changing existing fixtures.

## Verified backend contract

Coordinated with the backend agent in chat `01a1c10f-c730-75e2-9f2a-fff7f14e3a4b` and inspected
the controller, request/response DTOs, quantity validation, transfer service, and the backend
`docs/architecture/release-1-domain-contract.md`, Stock transfer API contract.

- `POST /api/stock-transfers`: required `Idempotency-Key`; shared `sourceLocation`,
  `destinationLocation`, optional `description` (255 characters), and distinct
  `lines: [{itemSku, quantity, unitOfMeasure}]`. Decimal editing strings normalize at the API
  boundary. The backend validates every line and commits the parent and movements atomically.
- `GET /api/stock-transfers`: one-based `page`, `size`, supported optional reference `code` filter;
  `data` is a server page of summaries with code, locations, description, line count, creator, time.
- `GET /api/stock-transfers/details?code=...`: persisted parent, immutable item-line snapshots,
  shared facts, creator/time, and additive `movements` using existing `StockMovementResponse`.
- `StockTransferValidationException` returns HTTP 400 and `errors: [{field,lineIndex,itemSku,code,message}]`;
  `field` uses zero-based paths such as `lines[1].quantity`. Legacy Bean Validation keeps
  `message: [{field,message}]`. The shared API boundary normalizes both to field/message pairs.
- A canonical request hash, same-key transaction lock, and persisted unique key support explicit
  exact-request replay. A changed same-key request conflicts. No automatic replay is introduced.

## Implemented behavior

The form starts with one straightforward line. Add/remove actions preserve other input and move
keyboard focus to a useful line. Shared location controls keep the pair opposite automatically.
Each line displays UOM, fractional policy and advisory source stock; it validates missing/duplicate
items, nonpositive amounts, fractions, four-place precision and numeric range without stock math.
An item that disappears from the refreshed active list remains visible as retained, stale intent
and must be replaced or removed before review.

Cancel-first review freezes every item, exact quantity, location and note. One pending POST locks
duplicates. Confirmed rejection preserves raw editing strings and binds returned errors to the
correct line/field. A 15-second timeout, network failure or incomplete/mismatched success remains
unknown; the account-owned exact payload/key persists in tab storage. Recovery requires an explicit
operator action and uses only the same request/key. It never automatically resubmits.

Success requires a persisted reference and an exact match for every submitted line, independent of
backend ordering. All returned lines and audit facts appear in the result. `/stock-transfers`
offers server-paged history with reference search; encoded `/stock-transfers/:code` opens persisted
detail, immutable line snapshots and associated OUT/IN movements with backend before/after balances.
Transfer movement references now link to that parent. Missing movement data is explicit, preserving
older-server and historical single-item readability. No balances are calculated in the browser.

## Verification

Automated coverage uses the existing Vitest/React Testing Library tooling and API mocks. It covers
multi-line success with reordered response lines, one invalid second line causing confirmed
rejection, retained exact inputs and field errors, duplicate/missing lines, nonpositive/fractional/
precision checks, pending duplicate protection, unknown/incomplete response quarantine, existing
single-item recovery, history/detail paging and navigation, stale reads, historical single-item
facts, associated movements, and movement-to-parent links.

Browser checks against the existing running services confirmed a two-line whole/fractional review,
the complete note/location summary and cancel-first focus at 768 × 768, preserved opposite locations
on swap, existing history, historical single-item detail, and movement → persisted parent navigation.
No live transfer was posted. Existing QA fixture balances and financial history were not changed.

The running backend has not been restarted and still omits the new movement/error fields. The
backend agent reports 44 passing focused tests including PostgreSQL transaction/rollback and
historical compatibility cases. Live end-to-end posting/error/movement-array verification against
that updated backend remains pending an authorized service reload. Frontend mocks verify the final
agreed response shapes. The focused regression run passed 73 tests across 7 files; two final
rejection cases were rerun and passed after the last change. Production build, touched-file ESLint,
and Git whitespace checks passed. Existing Browserslist-data and large-bundle build warnings remain.

The full single-worker frontend suite passed 519 tests across 73 files. Final focused checks cover
the later retained-item and rejection-copy changes; no unrelated domain behavior was changed.
