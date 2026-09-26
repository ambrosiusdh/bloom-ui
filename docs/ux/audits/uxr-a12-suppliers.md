# UXR-A12 — Supplier master data

Status: `EVIDENCE_COMPLETE` — live audit, screenshots, repository/backend review, focused tests, and disposable-fixture deactivation complete  
Execution: repository review plus live UX audit on disposable local data  
Audit date: 2026-09-24  
Environment: local Bloom frontend (`http://localhost:5173`) and backend (`http://localhost:8080`), using the existing local `admin` session  
Browser: Codex in-app browser (Chromium-based; exact version unavailable)  
Viewports: default wide browser surface (`1610×1270`), `760×768`, and the `768×768` responsive boundary

## Scope and method

This audit covered supplier search/list, active/inactive filtering, empty state, detail, server-owned outstanding summary, create, required validation, duplicate-code conflict, immutable-code edit, deactivation confirmation, retained identity/history language, focus/keyboard behavior, and narrow layouts. It did not audit goods-receipt or payment workflows, create financial history, hard-delete a supplier, reactivate a supplier, redesign the UI, or modify application code.

Before live work, the audit read `AGENTS.md`, the frontend contract and roadmaps, supplier page/store/API/tests, and the backend supplier controller, request/response DTOs, entity, filtering specification, service, and validation. The backend's stable normalized supplier code, lifecycle state, persisted audit fields, and server-calculated outstanding balance remain authoritative.

Live data used:

- existing referenced supplier `QA-FE26-20260909`, whose detail showed a server-confirmed `Rp 1,25` posted/outstanding balance; it was read only;
- disposable supplier `UXRA12-SUP`, created as `Audit A12 Bahan Sejahtera`, edited to `Audit A12 Bahan Sejahtera Revisi`, and finally deactivated through the implemented UI;
- two duplicate-code submissions, one while the fixture was active and one after deactivation; both were rejected and created no supplier.

The complete evidence index and 21 persistent PNGs are in [`docs/ux/evidence/uxr-a12/README.md`](../evidence/uxr-a12/README.md).

## Scenario evidence

### A12-01 — Active list, search, status, empty state, and paging controls

- **Purpose:** determine whether an operator can find supplier records and distinguish lifecycle state.
- **Steps:** inspect the active list, search `UXRA12`, search a nonexistent code, clear/replace the query, then switch to the inactive filter after deactivation.
- **Evidence:** A12-E01, A12-E05, and screenshots `00`, `07`, `08`, `14`, `15`.
- **Observed fact:** the search URL retained `query`, `active`, `page`, and `size`; search covered code, name, contact, or address. Active and inactive states were explicit text chips and did not rely on color alone.
- **Observed fact:** the filtered empty state explained that no supplier matched. The inactive filter later found the deactivated fixture, while the same active search returned no result.
- **Observed fact:** paging and page-size controls were present, but the live database did not contain enough suppliers to reach a second page. Repository/tests verified supported paging parameters and stale-response protection.
- **Expected:** lifecycle state and search scope remain understandable, URL-backed, and recoverable.
- **Assessment:** the read flow is clear and preserves filter context when opening and returning from detail. Multi-page navigation remains test/repository evidence rather than a live multi-page observation.
- **Priority:** no finding.

### A12-02 — Referenced supplier detail and backend authority

- **Purpose:** verify that a supplier with financial history retains stable identity and server-owned facts.
- **Route and start:** `/suppliers/QA-FE26-20260909`.
- **Steps:** open the existing supplier detail without following its payable link or changing the record.
- **Evidence:** A12-E01 and screenshot `01`.
- **Observed fact:** the page showed immutable code, active status, contact placeholders, audit actor/time, and one server-calculated outstanding summary (`Rp 1,25`).
- **Observed fact:** the UI made no local debt calculation and described the values as server-calculated.
- **Expected:** referenced supplier identity and history remain inspectable without implying deletability or browser-derived debt.
- **Assessment:** stable identity and backend authority are clear. The referenced record was not mutated.
- **Priority:** no finding.

### A12-03 — Create validation and successful creation

- **Purpose:** verify understandable validation, focus, stable-code framing, and preserved user input.
- **Route and start:** `/suppliers/maintenance/new`.
- **Steps:** inspect the empty form; submit blank; enter name, code, contact, and address; submit a valid fixture.
- **Evidence:** A12-E02–A12-E03 and screenshots `02`–`05`.
- **Observed fact:** the page initially focused `Nama pemasok`. Blank submission showed both required errors and kept focus on the first invalid field.
- **Observed fact:** copy said the code would become a permanent unique identity. Optional contact/address inputs exposed 255-character counters.
- **Observed fact:** successful creation navigated to `/suppliers/UXRA12-SUP`, retained the backend-returned code, showed a success alert, and rendered the saved fields plus audit metadata.
- **Expected:** validation prevents incomplete requests, preserves values, and only presents the backend-confirmed supplier as created.
- **Assessment:** creation is direct, accessible, and consistent with the contract.
- **Priority:** no finding.

### A12-04 — Duplicate normalized code conflict

- **Purpose:** verify uniqueness behavior without deleting or overwriting an existing supplier.
- **Steps:** submit `uxra12-sup` while `UXRA12-SUP` was active; after deactivation, submit `UXRA12-SUP` again.
- **Evidence:** A12-E04 and screenshots `06`, `16`.
- **Observed fact:** both attempts were rejected. The first retained every entered field and focused the code input. Field copy explicitly said the code might already belong to an inactive supplier.
- **Observed fact:** the lowercase attempt conflicted with the uppercase stored identity because the backend normalizes codes. The create screen says codes are permanent and unique but does not explain case normalization before submission (`SUPPLIER-02`).
- **Expected:** duplicate attempts preserve input and make normalization/uniqueness predictable before a permanent identifier is created.
- **Assessment:** conflict recovery is strong; normalization remains discoverable only after a conflict or successful redirect.
- **Priority:** `P2` (`SUPPLIER-02`).

### A12-05 — Edit with immutable code

- **Purpose:** verify that mutable master data can change without changing supplier identity.
- **Route and start:** `/suppliers/UXRA12-SUP/edit`.
- **Steps:** inspect the form, change name/contact/address, save, and review detail/audit metadata.
- **Evidence:** A12-E06 and screenshots `09`–`10`.
- **Observed fact:** the code field was disabled and labelled `Identitas tetap; riwayat tetap memakai kode ini.` It was skipped in keyboard order and excluded from the update contract.
- **Observed fact:** the saved detail kept `UXRA12-SUP`, showed the revised mutable fields, and updated server audit time/actor.
- **Expected:** stable identity is visibly immutable while ordinary contact corrections remain available.
- **Assessment:** the workflow makes the identity boundary unambiguous.
- **Priority:** no finding.

### A12-06 — Deactivation, focus, and retained record

- **Purpose:** verify that lifecycle removal is clearly non-destructive and keyboard safe.
- **Steps:** open deactivation; inspect initial focus and copy; press Escape; reopen; confirm; return to active and inactive searches.
- **Evidence:** A12-E07 and screenshots `11`–`16`.
- **Observed fact:** confirmation focused `Batal`. Its copy said the supplier could no longer be selected for new transactions while identity, notes, and all history using `UXRA12-SUP` would remain.
- **Observed fact:** Escape restored focus to `Nonaktifkan pemasok`. Success focused the result alert, changed status to `Tidak aktif`, removed the destructive action, and retained contact, audit, identity, and the detail route.
- **Observed fact:** the fixture disappeared from the active filter, remained discoverable under `Tidak aktif`, and its code stayed reserved against reuse.
- **Expected:** deactivation cannot be mistaken for deletion, preserves record/history, and provides safe focus behavior.
- **Assessment:** this is a strong lifecycle interaction and should be preserved.
- **Priority:** no finding.

### A12-07 — Keyboard order and narrow-desktop behavior

- **Purpose:** verify efficient keyboard use and responsive layouts.
- **Steps:** record edit-form Tab order, inspect inactive list/detail/edit at `760×768`, then inspect the list at the `768×768` breakpoint and measure overflow.
- **Evidence:** A12-E08–A12-E09 and screenshots `17`–`20`.
- **Observed fact:** edit order was name → contact → address → save → cancel; the disabled immutable code was correctly skipped. Required/conflict focus and confirmation/Escape focus were verified live.
- **Observed fact:** at `760×768`, navigation collapsed, the supplier list became a readable card, and body client/scroll width both measured `760`.
- **Observed fact:** at a viewport set to `768×768`, navigation and the desktop table activated together. The rendered body client width was `753`, body scroll width was `870`, a horizontal page scrollbar appeared, values wrapped almost word-by-word, and the action column moved beyond the initial viewport (`SUPPLIER-01`).
- **Expected:** the responsive boundary must not force horizontal page panning or hide the only row action.
- **Assessment:** 760-pixel behavior is good, but the exact desktop breakpoint is materially broken.
- **Priority:** `P1` (`SUPPLIER-01`).

## Findings

| ID | Priority | Classification | Finding |
| --- | --- | --- | --- |
| SUPPLIER-01 | P1 | Live responsive evidence + repository breakpoint evidence | At the `768×768` boundary Bloom activates both the expanded sidebar and desktop supplier table, producing `870 px` body scroll width within a `753 px` client width. The page horizontally scrolls and the only row action is off-screen, while `760×768` correctly uses cards without overflow. |
| SUPPLIER-02 | P2 | Live conflict + backend/repository evidence | Supplier codes are silently normalized (including case) before becoming permanent. The form explains uniqueness and immutability but not normalization, so the final stable identity or a case-insensitive collision can surprise the operator. |

No hard deletion, identity mutation, client-calculated outstanding balance, or loss of supplier history was observed.

## Preserved strengths

- Search scope, lifecycle filter, paging inputs, and return-to-list state are URL-backed.
- Active/inactive status uses explicit text, not color alone.
- Detail renders stable code, contact, audit actor/time, lifecycle state, and server-owned outstanding values.
- Create validation focuses the first invalid field and preserves input through duplicate conflict.
- Duplicate submission is blocked while pending in focused automated coverage.
- Edit disables and excludes the permanent code while allowing name/contact/address changes.
- Deactivation is a separate confirmation, defaults focus to cancel, supports Escape return, blocks duplicates while pending, and explains retained identity/history.
- Deactivation keeps the detail and audit facts readable, removes the supplier from active discovery, retains inactive discovery, and reserves its code.
- The 760-pixel card layout is readable and has no horizontal page overflow.
- Store/API tests cover stale responses, supported filters/paging, retry, direct server balance rendering, and absence of a frontend hard-delete API.

## Recommendations for UXR-D12 design

These are audit recommendations, not implementation approval:

1. Preserve stable code identity, explicit lifecycle text, URL-backed search/filter state, server-owned outstanding values, duplicate-conflict preservation, immutable-code edit, and history-preserving deactivation language.
2. Fix the responsive switch so the supplier card/list treatment and navigation width are coordinated. At 768 px, keep the compact card treatment or collapse/reflow the shell before enabling the desktop table; never require horizontal page panning for the row action.
3. Explain code normalization before submission or visibly normalize it before the operator commits the permanent identity. Do not change backend normalization semantics.
4. Keep cancellation as the initial confirmation focus and restore focus to the trigger after Escape.
5. Treat loading, error/retry, pending duplicate locks, and stale-response protection as required states even though local requests settled too quickly for genuine screenshots.

## Owner decisions needed for design

1. Whether the 768-pixel boundary should keep supplier cards or use a compact table with the sidebar collapsed; both must preserve the same facts and action.
2. Whether supplier-code normalization is explained as helper text, applied visibly on blur, or shown in the final pre-submit review.
3. Whether backend-provided updated-by/updated-at metadata should remain detail-only or appear in the reusable supplier list pattern for faster audit scanning.

## State-changing actions and cleanup

- Created `UXRA12-SUP` as `Audit A12 Bahan Sejahtera` with test contact/address data.
- Updated its mutable fields to `Audit A12 Bahan Sejahtera Revisi`, contact `081234009999`, and the revised test address.
- Submitted two duplicate-code attempts; both were rejected and created no record.
- Deactivated `UXRA12-SUP` through the implemented lifecycle action. It remains intentionally available under the inactive filter with its identity and audit history.
- The existing referenced supplier `QA-FE26-20260909` was read only.
- No supplier was hard-deleted or reactivated. No receipt, payable, or payment was created or changed.
- No application, backend, dependency, configuration, or database file was modified.

## Focused automated verification

Command:

```text
node node_modules/vitest/vitest.mjs run src/test/pages/supplier/SupplierList.test.jsx src/test/pages/supplier/SupplierDetail.test.jsx src/test/pages/supplier/SupplierUpsert.test.jsx src/test/stores/supplier.test.js src/test/api/supplier.test.js --reporter=verbose
```

Result on 2026-09-24:

```text
Test Files  5 passed (5)
Tests       26 passed (26)
Duration    66.71s
```

## Limitations

- The live database had too few suppliers to exercise a second results page. Paging request/state behavior is repository and automated-test evidence.
- Loading, list/detail error retry, balance-only retry, and pending duplicate locks settled too quickly or would require service interruption; they remain source/test evidence and were not fabricated.
- Reactivation is supported by the backend activation endpoint but is not exposed by the current frontend and was outside this audit's defined scope.
- Goods-receipt, payable, and payment workflows were not opened or mutated.
- Exact browser version, Windows display scaling, and deployed store hardware were unavailable.

## Evidence index

- Baseline and referenced detail: A12-E01 and screenshots `00`–`01`.
- Create and validation: A12-E02–A12-E03 and screenshots `02`–`05`.
- Duplicate conflicts: A12-E04 and screenshots `06`, `16`.
- Search/filter/empty/return state: A12-E05 and screenshots `07`–`08`, `14`–`15`.
- Immutable edit: A12-E06 and screenshots `09`–`10`.
- Deactivation and focus: A12-E07 and screenshots `11`–`15`.
- Keyboard and responsive behavior: A12-E08–A12-E09 and screenshots `17`–`20`.

