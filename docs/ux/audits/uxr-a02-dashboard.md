# UXR-A02 — Operational dashboard

Status: `EVIDENCE_COMPLETE` — live dashboard, freshness, refresh, drill-down, keyboard, and responsive evidence captured  
Execution: read-only repository/backend contract review plus live audit; no domain mutation  
Audit date: 2026-09-26  
Environment: local Bloom frontend (`http://localhost:5173`) and backend (`http://localhost:8080`), using the documented local `admin` fixture  
Browser: Codex in-app browser (Chromium-based; exact version unavailable)  
Viewports: default wide desktop, `1440×900`, `1024×768`, and `760×768`

## Scope and disposition

This audit covered `/dashboard` information hierarchy, backend-owned metric meaning,
zero-sales behavior, freshness and stale messaging, refresh feedback, all four live
drill-downs, keyboard order/focus visibility, and wide/narrow layout. The current
fixture had an open cash session and outstanding supplier payables, so no-open-session,
zero-payables, initial failure, and retained-data refresh failure were verified in the
current implementation and focused tests rather than created by changing financial data.

Before live work, the audit read `AGENTS.md`, the frontend contract and roadmaps,
UXR-A01 and the completed destination audits, UXR-D02, the dashboard page/widgets/store/
API/tests, and the matching backend contract, controller, response DTOs, service, and
freshness rules. `GET /api/dashboard/operational-overview` remains the sole authority for
the displayed amounts, counts, cash-session state, business date, drill-down descriptors,
and freshness deadline. No browser aggregation or dashboard metric calculation was found.

The live fixture showed zero sales today, open cash session `#15`, and two unpaid goods
receipts. A naturally expired `freshUntil` deadline produced the warning without changing
the data; refresh replaced it with a newer server timestamp and success status. UXR-A02 is
therefore `EVIDENCE_COMPLETE`.

The complete evidence index and 13 persistent screenshots are in
[`docs/ux/evidence/uxr-a02/README.md`](../evidence/uxr-a02/README.md).

## Scenario evidence

### A02-01 — Backend-owned normal and zero values

- **Steps:** open `/dashboard` and inspect all operational regions against the response contract.
- **Evidence:** A02-E00 and A02-E09.
- **Observed:** sales showed `Rp 0`, `0` transactions, and explicit no-sales copy rather than an absent value. Cash session `#15` showed server values including opening/expected cash `Rp 98`, cash in/out `Rp 12.345,6789`, and zero active expenses. Payables showed `Rp 6.917.138,2188` across two receipts.
- **Observed:** exact fractional values were retained and Indonesian number formatting was applied. Voided UXR-A17 expense `#2` was excluded from active expense totals.
- **Assessment:** values remain backend-authoritative and zero sales is understandable. The cash card is materially denser than the other two cards.

### A02-02 — Refresh pending, success, and retained data

- **Steps:** activate `Perbarui data`, observe the request state, and wait for success.
- **Evidence:** A02-E01, A02-E04, and A02-E12.
- **Observed:** refresh disabled the button as `Memuat...`, announced that previous data remained visible, and did not blank the metric cards. Success announced `Data dashboard berhasil diperbarui.` and advanced `Data per` from 01.27 to 01.32.
- **Observed:** repeated activation was disabled while pending. Browser warning/error logs were empty.
- **Assessment:** the refresh model is resilient and does not turn an auxiliary read into an ambiguous financial result.

### A02-03 — Server expiry and stale recovery

- **Steps:** leave the dashboard untouched until the server-provided five-minute freshness deadline passes, then refresh.
- **Evidence:** A02-E11 and A02-E12.
- **Observed:** without a reload, the page announced `Data dashboard sudah kedaluwarsa menurut batas waktu dari server` while retaining all values. Refresh cleared the warning and used a newer `asOf` value.
- **Assessment:** stale meaning is explicit, non-color-only, and driven by `freshUntil`. The compact `Data per` label does not itself expose the store zone, although formatting uses the returned zone.

### A02-04 — Approved drill-downs

- **Steps:** follow each server-recognized dashboard link and verify the destination workflow.
- **Evidence:** A02-E02, A02-E03, A02-E05, and A02-E06.
- **Observed:** sales opened `/sales?startDate=2026-09-26&endDate=2026-09-26`; session opened `/cash-sessions/15`; expenses opened `/expenses?page=1&size=10`; payables opened `/payables`. Each destination rendered its completed workflow.
- **Observed:** returning from payables left the breadcrumb `Utang Pemasok` on Dashboard until a direct reload (`DASHBOARD-01`). This repeats the shared stale-breadcrumb pattern recorded as UXR-A01 `NAV-02` and in later cross-domain audits.
- **Assessment:** drill-down discoverability and routing are useful; the global location context is not reliably cleared.

### A02-05 — Keyboard order and focus

- **Steps:** start at the document root, advance with Tab, and inspect the first dashboard action.
- **Evidence:** A02-E10 and live accessibility state.
- **Observed:** `Perbarui data` had a strong visible focus indicator. It was the 16th focus stop: 15 sidebar/shell controls came before the first dashboard control. Dashboard links followed in logical sales, session, expense, and payables order.
- **Observed:** no skip-to-content link was available.
- **Assessment:** controls are operable and focus-visible, but reaching the dashboard task is inefficient for keyboard users.

### A02-06 — Responsive hierarchy

- **Steps:** inspect and measure the page at `1440×900`, `1024×768`, and `760×768`.
- **Evidence:** A02-E07 through A02-E09.
- **Observed:** `1440×900` rendered three columns with `clientWidth=1440`, `scrollWidth=1440`. At `1024×768`, two columns fit with `clientWidth=1009`, `scrollWidth=1009`, and payables moved below the initial fold. At `760×768`, the cards stacked in one column with `clientWidth=760`, `scrollWidth=760`.
- **Observed:** no page-level horizontal overflow occurred. Equal-height cards on wide screens leave substantial empty space in sparse sales/payables cards because the open cash card contains many more facts.
- **Assessment:** responsive mechanics are sound, but the equal-card composition does not communicate operational priority efficiently.

### A02-07 — Source/test-only states

- **Live limitation:** the current financial fixture was not altered merely to close session `#15`, settle receipts, or force a service outage. Initial loading also settled too quickly for a reliable screenshot.
- **Source/test evidence:** the dashboard tests distinguish zero amounts from `state: NONE`, render no-session copy without zero cash values, expose zero payables, announce initial loading, retain prior data on refresh failure, focus a recoverable error, retry successfully, and hide malformed/unknown drill-downs.
- **Automated result:** three focused files passed 12 tests.
- **Assessment:** these states are not represented as live screenshots and are not claimed as live evidence.

## Findings

| ID | Priority | Classification | Finding |
| --- | --- | --- | --- |
| DASHBOARD-01 | P1 | Live navigation context | Returning from a dashboard drill-down can leave the destination breadcrumb on Dashboard. The URL/title say Dashboard while the breadcrumb says `Utang Pemasok`; this repeats the shared shell-state defect from UXR-A01. |
| DASHBOARD-02 | P1 | Live keyboard efficiency | Fifteen shell controls precede the first dashboard action and no skip link is available. Focus visibility is strong once the action is reached. |
| DASHBOARD-03 | P2 | Live hierarchy/responsiveness | Equal-height summary cards make sparse cards look unfinished while the cash card is dense; at 1024px, payables drops below the fold despite unused space inside the first row. |
| DASHBOARD-04 | P2 | Live copy/context | `Ringkasan operasional Release 1...` exposes internal release terminology. `Data per` is visually quiet and does not name the server/store zone, reducing confidence around time-sensitive data. |

No P0 issue, client-side business aggregation, broken recognized drill-down, hidden stale
state, page-level horizontal overflow, or browser warning/error was observed.

## Preserved strengths

- One backend read model owns the displayed values, business day, freshness, and destinations.
- Zero sales, no session, and zero payables have deliberately different semantics.
- Exact decimal amounts are retained instead of rounded into misleading financial values.
- Refresh retains last confirmed data, prevents duplicate requests, announces progress/success,
  and keeps a focused retry path for failure.
- Stale data stays visible but is explicitly warned against for operational decisions.
- Unknown or malformed drill-down descriptors fail closed instead of creating unsafe links.
- Regions/headings and value-specific accessible labels make the three groups understandable
  without relying on visual placement or color.
- The one/two/three-column layout avoids horizontal overflow at the audited viewports.

## Recommendations for UXR-D02

These are evidence-based design inputs, not implementation approval.

1. Preserve the three backend-owned operational groups, exact values, explicit zero/no-session
   distinction, freshness deadline, retained-data refresh behavior, and recognized drill-downs.
2. Make current cash-session state the primary operational signal, while compacting sparse/zero
   summaries so the wide layout does not manufacture empty space.
3. Replace internal `Release 1` wording with task-oriented Indonesian and give `Data per` and stale
   status clearer proximity/hierarchy; do not invent a different time source.
4. Add a skip-to-content path and keep the observed strong focus indicator and logical link order.
5. Fix breadcrumb ownership/cleanup as a shared shell behavior rather than a dashboard-only patch.
6. Retain the accepted quick routes only where they do not duplicate or obscure server-provided
   drill-downs.
7. Keep the accepted seven-day bar chart backend-gated. The current read model has no daily series;
   the frontend must not download and aggregate sales history or invent period totals.
8. Preserve the no-horizontal-overflow behavior and ensure the primary session/freshness state stays
   above the fold at narrow desktop sizes.

## UXR-D02 reconciliation

The completed audit supports the owner-accepted operational hierarchy in
[`docs/ux/design/uxr-d02-dashboard-direction.md`](../design/uxr-d02-dashboard-direction.md):
three operational summaries, prominent session state, explicit freshness, and useful routes. It
adds four concrete constraints: shared breadcrumb cleanup, keyboard bypass, less wasteful summary
geometry, and user-facing copy without release jargon.

The accepted seven-day sales chart still cannot be implemented from the current backend contract.
UXR-D02 remains formally `PLANNED` until the A02 evidence is incorporated into design review and an
approved backend aggregate exists (or the owner explicitly removes that chart). This audit does not
authorize frontend aggregation or application implementation.

## State-changing actions

None. The audit issued only dashboard and destination reads. It did not open/close a cash session,
create/void an expense, add a sale, pay a receipt, or change any record.

## Focused automated verification

Command:

```text
.\node_modules\.bin\vitest.cmd run src/test/pages/dashboard/Dashboard.test.jsx src/test/stores/dashboard.test.js src/test/api/dashboard.test.js
```

Result on 2026-09-26:

```text
Test Files  3 passed (3)
Tests       12 passed (12)
Duration    2.45s
```

## Limitations

- No-open-session, zero-payables, initial error, and retained-data refresh failure were not forced
  against the live financial fixture; current source/tests are cited instead.
- Initial loading was too brief for a reliable live capture without artificial network throttling.
- The live fixture had zero sales today, so a non-zero sales amount was verified from contract/tests,
  not a second live state.
- Keyboard checks used browser automation rather than the physical store keyboard.
- Exact browser version, Windows display scaling, and deployed store-device dimensions were unavailable.

