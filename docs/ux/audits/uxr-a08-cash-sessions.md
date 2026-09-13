# UXR-A08 — Cash-session operation

Status: `EVIDENCE_COMPLETE`  
Execution: live UX audit with recorded disposable-database mutations  
Audit date: 2026-09-13  
Environment: local Bloom frontend (`http://localhost:5173`) and local backend (`http://localhost:8080`), with the documented local `admin` fixture account  
Browser: Codex in-app browser (Chromium-based; exact version unavailable)  
Viewports: 1612×1272 wide, 1280×720 secondary view, and 760×768 responsive override

## Scope and method

This audit covered the verified no-session state, opening cash, current-session visibility in Cashier, the server expected-cash preview, actual-cash entry, close confirmation, close pending and duplicate prevention, an already-closed race, the server-confirmed variance, cash-session history/detail, Indonesian money/date presentation, keyboard/focus behavior, and wide/narrow layouts. It did not create a sale, supplier payment, expense, or any other cash movement.

Before the live work, the audit read `AGENTS.md`, the Release 1 frontend contract, frontend roadmap, UX rework roadmap, the current cash-session components/store/API/tests, and the matching backend controller, open/close request DTOs and validation annotations, response DTO, service interface, and service implementation. The backend contract confirms that:

- `GET /api/cash-sessions/current` returns HTTP 200 with `data: null` when no session is open;
- opening sends only `openingCash`;
- the close preview is read from `GET /api/cash-sessions/{id}/expected-cash`;
- closing sends only `actualClosingCash`;
- the service recalculates expected cash while holding the transition lock and returns the final `expectedClosingCash`, `actualClosingCash`, and `difference`;
- an already-closed session is a conflict, and history/detail are server read models.

No expected cash or variance was calculated in the browser or in this report. Amounts below are transcriptions of values entered by the auditor or returned by the server.

The live browser produced screenshot and accessibility captures for every scenario. After the owner explicitly requested raw evidence, equivalent live states were recaptured as 26 browser-native JPEG files under [`docs/ux/evidence/uxr-a08`](../evidence/uxr-a08/). The original `A08-Cxx` capture IDs below still identify the first audit run; the raw files are a follow-up run against the same disposable local environment and are indexed at the end of this report. The follow-up's actual captured viewports were 1280×720 and 760×768; the two wide history/detail captures include the available document height and are labeled with their actual pixel dimensions.

The raw follow-up used sessions #9 through #11 because the original #7/#8 browser captures had not been exported. Session #9 reproduced decimal cash entry, current-session visibility, expected-cash preview, server-confirmed non-zero variance, a stale already-closed request, wide/narrow layouts, history, and detail. Sessions #10 and #11 reproduced rapid repeated activation and close-transition sampling. No unrelated cashier transaction was created.

## Scenario evidence

### A08-01 — Existing open session and Cashier visibility

- **Purpose:** verify that an already-open drawer is immediately understandable in the focused Cashier workspace.
- **Route and start:** `/cashier`; seeded session #6 was open.
- **Steps:** authenticate, enter Cashier from the back-office shell, and inspect the current-session region without using item search or the cart.
- **Evidence:** `A08-C01` wide current-session capture.
- **Observed fact:** the region was headed `Sesi kas saat ini`, carried a green `Terbuka` status, and showed opening cash `Rp 999.999`, opener `admin`, and `12 September 2026, 08:48`. `Tutup sesi kas` was available and item search received focus.
- **Expected:** an open session must be visibly verified before drawer actions are enabled.
- **Assessment:** matches the contract. Open status, identity, time, amount, and close action were easy to distinguish from the cashier content.
- **Priority:** no finding.

### A08-02 — Expected-cash preview, validation, confirmation, and closing seeded session #6

- **Purpose:** establish a controlled no-session baseline while auditing the close interaction.
- **Route and start:** `/cashier`; session #6 open.
- **Steps:** activate `Tutup sesi kas`; wait for the preview; press Tab from the initially focused actual-cash field; press Tab and Enter on the confirmation action with the field empty; then enter the exact server-preview amount and submit once.
- **Evidence:** `A08-C02` close preview, `A08-C03` empty validation/focus, `A08-C04` server-confirmed closed result.
- **Observed fact:** the dialog explicitly labelled `Uang kas yang diharapkan (server)` as `Rp 2.876.874` and stated that the server calculates the variance. The actual-cash field received initial focus. Blurring an empty field produced `Uang aktual wajib diisi.`; keyboard activation of the invalid confirmation returned focus to the field.
- **Observed fact:** the auditor copied the displayed server preview into the actual field as `2876874`. The server closed session #6 with expected cash `Rp 2.876.874`, actual cash `Rp 2.876.874`, and `Selisih (seimbang) Rp 0` at `13 September 2026, 15:22`.
- **Expected:** preview and final reconciliation remain server-owned; validation identifies the field; confirmation prevents accidental dismissal while pending; final values come from the close response.
- **Assessment:** authority labelling, keyboard error recovery, and the final reconciliation matched the contract.
- **Priority:** no finding in the transaction result.

### A08-03 — Verified no-session and opening cash

- **Purpose:** distinguish a successful zero-or-one no-session response from an open or failed state, then open one controlled session.
- **Route and start:** reload `/cashier` after closing #6.
- **Steps:** wait for the current-session request to settle; inspect drawer gating; open the modal; type `123456.78`; Tab through `Batal` to `Buka sesi`; activate it with Enter.
- **Evidence:** `A08-C05` verified no-session, `A08-C06` opening dialog/value, `A08-C07` session #7 success.
- **Observed fact:** the settled card said `Belum ada sesi kas yang terbuka. Masukkan modal awal untuk mulai.` and exposed `Buka sesi kas`. Search and its action remained disabled, with a separate explanation that a session must be opened first.
- **Observed fact:** the opening field auto-focused and rendered the typed value as `123,456.78`. Its helper text said `Pemisah ribuan ditambahkan otomatis. Contoh: 500,000 atau 500,000.50.`. After submission, server-confirmed session #7 displayed `Rp 123.456,78`, `admin`, `Terbuka`, and `13 September 2026, 15:23`. Focus moved to the success status `Sesi kas #7 berhasil dibuka.`.
- **Expected:** a verified `data: null` state must be distinct from failure, opening sends one decimal value, success renders the backend session, and drawer actions remain gated until the session is verified.
- **Assessment:** state gating, keyboard order, success focus, and read-only Indonesian display matched the contract. The editing convention did not.
- **Priority:** `P1` for the money-entry locale mismatch (`CASH-01`).
- **Classification:** the separators and helper copy are observed evidence; the risk of misreading a counted-cash amount is reviewer inference.

### A08-04 — Server preview, non-zero variance, and already-closed conflict

- **Purpose:** verify final reconciliation and stale-close safety without creating unrelated drawer movements.
- **Route and start:** two authenticated `/cashier` views of open session #7.
- **Steps:** open the close dialog in both views and wait for both server previews; enter `123400.78` in the first closing request and `123399.78` in the stale request; submit the first request; then submit the stale request.
- **Evidence:** `A08-C08` preview in both views, `A08-C09` server close result, `A08-C10` already-closed recovery.
- **Observed fact:** both previews labelled the expected amount as server-owned and displayed `Rp 123.456,78`. The first request closed session #7 with server-returned actual cash `Rp 123.400,78` and `Selisih kurang -Rp 56` at `13 September 2026, 15:24`.
- **Observed fact:** the stale request did not replace that result with its `123399.78` field value. The dialog closed, focus moved to a warning, and the page said `Sesi sudah ditutup di tempat lain. Hasil server terbaru ditampilkan.` while rendering the same server-final expected, actual, variance, actor, and close time.
- **Expected:** an already-closed race must not mutate the reconciliation or encourage unsafe resubmission; the latest server detail must replace stale input.
- **Assessment:** matches the contract. This was a particularly strong transaction-recovery state: the outcome, source, and next safe state were explicit.
- **Priority:** no finding.

### A08-05 — Pending and duplicate prevention

- **Purpose:** verify that rapid repeated actions cannot open or close more than one session.
- **Route and start:** `/cashier`; verified no open session after #7.
- **Steps:** open the dialog, enter `50000`, double-activate `Buka sesi`; after session #8 is visible, open its close dialog, enter `50000`, and double-activate `Konfirmasi tutup sesi`.
- **Evidence:** `A08-C11` single open result, `A08-C12` close pending, `A08-C13` single closed result.
- **Observed fact:** the rapid opening action created only session #8; no second open session or second success appeared. The close pending state was captured with the actual field, `Batal`, current-session close action, and cashier search all disabled; the submit action changed to disabled `Menutup...`.
- **Observed fact:** the rapid closing action produced one closed result for #8: expected `Rp 50.000`, actual `Rp 50.000`, variance `Rp 0`, closed at `13 September 2026, 15:28`. History later contained #8 once and no extra audit-created session.
- **Expected:** pending must freeze drawer-affecting actions and duplicate UI activation must not create a second transition.
- **Assessment:** matches the contract. Opening completed too quickly to capture the literal `Membuka...` label, but the double activation and resulting history established a single mutation; close pending was directly visible.
- **Priority:** no finding.

### A08-06 — Post-close handoff to no-session

- **Purpose:** understand what the cashier can do immediately after reconciliation.
- **Route and start:** `/cashier`; immediately after closing #6 and again after closing #8.
- **Steps:** inspect the settled success state without reloading, then reload and wait for `GET /current`.
- **Evidence:** `A08-C04` and `A08-C13` closed result; `A08-C05` and `A08-C17` no-session after reload.
- **Observed fact:** immediately after close, the card retained the useful server reconciliation under `Sesi kas saat ini`, showed `Ditutup`, and displayed a banner telling the user to open a session before using cashier actions. However, the card exposed no `Buka sesi kas` or refresh action while the closed response remained in client state. Reloading replaced it with the verified no-session card and restored `Buka sesi kas`.
- **Expected:** closed and no-session states must be distinguishable, and the user must have a clear safe next action.
- **Assessment:** the retained reconciliation is valuable, but the instruction and available actions disagree until navigation/reload. This creates a hidden recovery step between two normal session transitions.
- **Priority:** `P1` (`CASH-02`).
- **Classification:** missing action and reload behavior are observed evidence; the operational-friction priority is reviewer inference.

### A08-07 — History and detail

- **Purpose:** confirm that an operator can find and review the immutable server result.
- **Route and start:** `/cash-sessions`, then `/cash-sessions/7`.
- **Steps:** wait for history loading to settle; inspect the newest rows; open session #7 detail.
- **Evidence:** `A08-C14` wide history, `A08-C15` wide detail.
- **Observed fact:** history was newest first and showed sessions #8, #7, and #6 once each. Session #7 included status `Ditutup`, opening time, opening/expected/actual amounts, `Kurang`, and `-Rp 56`. The detail separated `Pembukaan` from `Penutupan dan rekonsiliasi` and repeated the same server values, actors, and timestamps.
- **Observed fact:** read-only currency used Indonesian separators (`Rp 123.456,78`, `-Rp 56`). Current-session timestamps used a long-month form such as `13 September 2026, 15:23`, while history/detail used weekday plus numeric date such as `Minggu, 13-09-2026 15:23`.
- **Expected:** history/detail render backend fields without aggregation, preserve status and reconciliation meaning, and format money/date for Indonesian users.
- **Assessment:** server values and Indonesian formatting were accurate and easy to cross-check. Date style changes inside the same workflow add avoidable inconsistency.
- **Priority:** `P2` for date-style consistency (`CASH-03`).
- **Classification:** observed evidence.

### A08-08 — Responsive cash-session surfaces

- **Purpose:** ensure the active-session card, close dialog, history, and detail remain usable at the implemented narrow breakpoint.
- **Route and start:** `/cashier`, `/cash-sessions`, and `/cash-sessions/7`; 760×768.
- **Steps:** inspect open session #8 and its close dialog; inspect closed reconciliation; open history and detail under the responsive override.
- **Evidence:** `A08-C12` narrow close dialog, `A08-C13` narrow closed result, `A08-C16` narrow history, `A08-C17` narrow no-session, `A08-C18` narrow detail.
- **Observed fact:** Cashier changed from two columns to stacked search/results/cart sections. The close dialog fit the viewport without horizontal clipping; its expected amount, field, and both actions remained visible. History replaced the wide table with readable per-session cards and hid the back-office sidebar behind an accessible collapsed navigation toggle. Detail stacked the opening and reconciliation cards.
- **Observed fact:** in the 760-pixel open-session summary, `Tutup sesi kas` wrapped into three short lines inside a tall narrow button while the rest of the summary remained compact.
- **Expected:** the touched workflow remains readable and operable without clipped financial facts or actions.
- **Assessment:** the responsive structures worked and preserved all facts. The wrapped primary session action weakens scan speed and looks accidental.
- **Priority:** `P2` (`CASH-04`).
- **Classification:** the wrapping is observed evidence; the efficiency impact is reviewer inference.

## Findings

| ID | Priority | Classification | Finding |
| --- | --- | --- | --- |
| CASH-01 | P1 | Evidence + inference | Opening and actual-cash fields use US-style grouping/decimal separators and US examples (`123,456.78`, `500,000.50`) while every confirmed amount uses Indonesian formatting (`Rp 123.456,78`). The mid-transaction convention switch can cause a costly counted-cash entry error. |
| CASH-02 | P1 | Evidence + inference | The immediate post-close view says another session must be opened but retains the closed result without an open/refresh action. `Buka sesi kas` appears only after reload or navigation causes the verified `data: null` response. |
| CASH-03 | P2 | Evidence | Current-session timestamps use long Indonesian month names, while history/detail switch to weekday plus numeric `dd-MM-yyyy` formatting within the same workflow. |
| CASH-04 | P2 | Evidence + inference | At 760 pixels the active-session `Tutup sesi kas` button wraps across three lines, reducing the clarity and scan speed of the critical action. |

No `P0` finding was observed. The controlled close race did not overwrite the first reconciliation, duplicate activation created only one session and one close, pending disabled drawer actions, and the final values always came from a server response.

## Preserved strengths

- No-session, open, pending, closed, and conflict states use distinct language and status treatment.
- Cashier actions are disabled until a successful no/open-session check settles.
- The close preview explicitly labels expected cash as server-owned, and helper copy explicitly says the server calculates the variance.
- Actual cash is the only close input; final expected cash, actual cash, variance, actors, timestamps, and status are returned and rendered together.
- Empty actual cash produces a field-specific message and restores focus to the field.
- Success and conflict notices receive programmatic focus, making the transaction outcome available to keyboard and assistive-technology users.
- The already-closed path replaces stale input with the final server detail and gives a safe, specific explanation.
- Close pending uses `Menutup...`, `aria-busy`, and disabled controls, including other drawer-affecting cashier actions.
- Narrow history cards avoid a horizontally scrolling financial table, and narrow detail preserves the opening/reconciliation separation.
- Read-only Rupiah values, signs, status labels (`Kurang`, `Seimbang`, `Lebih`), actors, and Indonesian dates remain legible in history and detail.

## Inferences for design work

These are audit interpretations, not approved product decisions:

1. Use one Indonesian editing convention for cash entry, including examples and in-field grouping, while continuing to send the normalized decimal string required by the API.
2. Keep the valuable final reconciliation after close, but provide an explicit safe transition to a freshly verified no-session/open action rather than requiring an undocumented reload.
3. Standardize one date/time style for current, history, and detail while retaining the store timezone and enough precision for audit work.
4. Prevent the narrow active-session action from wrapping into three lines; preserve an obvious destructive-action label and comfortable target size.

## Owner decisions needed

1. Choose the preferred Indonesian cash-entry examples and whether fractional Rupiah should remain visibly supported up to the backend's four-decimal contract.
2. Decide whether the post-close result should offer `Buka sesi baru`, `Periksa status`, or another explicitly verified transition; the design must not hide the final reconciliation or assume the backend state.
3. Choose the date style for operational cash-session screens: long month name or compact weekday/numeric form.
4. Confirm the real store-laptop viewport and scaling; 760×768 is the implemented drawer breakpoint used here, not a claim about the production device.

## State-changing test actions and cleanup

| Time (Asia/Jakarta) | Action | Input | Server result | Cleanup/disposition |
| --- | --- | --- | --- | --- |
| 15:22 | Closed pre-existing seeded session #6 to establish no-session | `actualClosingCash=2876874`, copied verbatim from the displayed server preview | #6 `CLOSED`; expected `Rp 2.876.874`; actual `Rp 2.876.874`; variance `Rp 0` | Immutable closed history retained in disposable DB |
| 15:23 | Opened audit session #7 | `openingCash=123456.78` | #7 `OPEN`; displayed `Rp 123.456,78` | Closed at 15:24 |
| 15:24 | Closed #7 from the first of two prepared views | `actualClosingCash=123400.78` | #7 `CLOSED`; expected `Rp 123.456,78`; actual `Rp 123.400,78`; variance `-Rp 56` | Immutable closed history retained in disposable DB |
| 15:24 | Submitted stale close request for already-closed #7 | stale field held `123399.78` | Conflict; latest #7 detail displayed; no mutation | No cleanup required |
| 15:27 | Double-activated open for pending/duplicate probe | `openingCash=50000` | One session only: #8 `OPEN`; displayed `Rp 50.000` | Closed at 15:28 |
| 15:28 | Double-activated close for pending/duplicate probe | `actualClosingCash=50000` | One close only: #8 `CLOSED`; expected/actual `Rp 50.000`; variance `Rp 0` | Immutable closed history retained in disposable DB |
| 16:05 | Opened raw-evidence session #9 | `openingCash=123456.78` | #9 `OPEN`; displayed `Rp 123.456,78` | Closed at 16:07 |
| 16:07 | Submitted the wide close form for #9 during the empty-field/focus recapture | The field had previously held `actualClosingCash=123399.78`; the accepted request retained that value | #9 `CLOSED`; expected `Rp 123.456,78`; actual `Rp 123.399,78`; variance `-Rp 57` | Immutable closed history retained in disposable DB |
| 16:07 | Submitted the second view's stale close request for #9 | stale field held `123400.78` | Conflict; latest #9 detail displayed; no mutation | No cleanup required |
| 16:07 | Double-activated open for raw duplicate-submit evidence | `openingCash=50000` | One session only: #10 `OPEN`; displayed `Rp 50.000` | Closed at 16:08 |
| 16:08 | Double-activated close for raw duplicate-submit evidence | `actualClosingCash=50000` | One close only: #10 `CLOSED`; expected/actual `Rp 50.000`; variance `Rp 0` | Immutable closed history retained in disposable DB |
| 16:09 | Opened close-transition sampling session #11 | `openingCash=11000` | #11 `OPEN`; displayed `Rp 11.000` | Closed at 16:09 |
| 16:09 | Closed #11 while sampling consecutive raw frames | `actualClosingCash=11000` | #11 `CLOSED`; expected/actual `Rp 11.000`; variance `Rp 0` | Immutable closed history retained in disposable DB |

Final cleanup verification reloaded `/cashier` in both wide and narrow views and waited for the current-session request to settle. Both pages showed the verified no-session copy and `Buka sesi kas`; item search remained disabled. There was no open session at audit end. Closed sessions #7 through #11 were intentionally retained because the product exposes immutable history and no delete operation; a database reseed was not needed. The temporary 760×768 viewport override was reset. No sale, item/cart action, supplier payment, expense, dependency, application source, backend source, or configuration was changed.

## Limitations

- Network errors, preview failures, and ambiguous transport outcomes were not forced. Artificial request interception or backend shutdown would weaken the live evidence and was unnecessary for the safe already-closed scenario.
- Opening finished too quickly to capture the literal `Membuka...` label. The original live audit directly observed the disabled `Menutup...` close state, but the raw follow-up response settled between consecutive screenshot frames; the raw transition sequence therefore documents pre-submit, settled, and dialog-dismissal frames rather than a frozen literal `Menutup...` frame.
- The responsive audit reached the implemented 760×768 breakpoint. A later attempt to reduce the browser override further did not change the effective viewport, so no phone-width claim is made.
- Browser version, Windows display scaling, physical keyboard characteristics, and the actual store-laptop viewport were unavailable from the audit surface.
- Keyboard actions were browser automation, not physical store-device testing.

## Evidence index

- Verified no-session: [`01` wide](../evidence/uxr-a08/01-cashier-no-session-wide-1280x720.jpg), [`21` final wide](../evidence/uxr-a08/21-cleanup-no-session-wide-1280x720.jpg), and [`22` final narrow](../evidence/uxr-a08/22-cleanup-no-session-narrow-760x768.jpg).
- Opening cash, editing convention, and focus: [`02`](../evidence/uxr-a08/02-open-dialog-entry-wide-1280x720.jpg) and [`11`](../evidence/uxr-a08/11-open-dialog-keyboard-focus-wide-1280x720.jpg).
- Current-session visibility: [`03` wide](../evidence/uxr-a08/03-cashier-open-session-success-wide-1280x720.jpg) and [`06` narrow](../evidence/uxr-a08/06-cashier-open-session-narrow-760x768.jpg).
- Expected-cash preview and actual-cash entry: [`04` wide preview](../evidence/uxr-a08/04-close-preview-wide-1280x720.jpg), [`05` wide actual entry](../evidence/uxr-a08/05-close-actual-entry-wide-1280x720.jpg), [`07` narrow preview](../evidence/uxr-a08/07-close-preview-narrow-760x768.jpg), and [`08` narrow actual entry](../evidence/uxr-a08/08-close-actual-entry-narrow-760x768.jpg).
- Server-confirmed reconciliation and safe conflict: [`09` non-zero variance](../evidence/uxr-a08/09-close-success-variance-wide-1280x720.jpg) and [`10` already-closed conflict](../evidence/uxr-a08/10-already-closed-conflict-narrow-760x768.jpg).
- Duplicate activation and close transition: [`12` single open result](../evidence/uxr-a08/12-opening-duplicate-submit-result-wide-1280x720.jpg), [`13` ready-to-close confirmation](../evidence/uxr-a08/13-close-ready-session-10-wide-1280x720.jpg), [`14a` transition start](../evidence/uxr-a08/14a-close-transition-start-wide-1280x720.jpg), [`14b` settled response with dialog still visible](../evidence/uxr-a08/14b-close-transition-settled-dialog-wide-1280x720.jpg), and [`15` consecutive transition frames](../evidence/uxr-a08/15-close-transition-00-wide-1280x720.jpg).
- Immediate post-close state: [`16`](../evidence/uxr-a08/16-post-close-retained-session-11-wide-1280x720.jpg).
- History: [`17` wide table](../evidence/uxr-a08/17-history-wide-fullpage-1353x939.jpg) and [`18` narrow cards](../evidence/uxr-a08/18-history-narrow-760x768.jpg).
- Detail and Indonesian money/date rendering: [`19` wide](../evidence/uxr-a08/19-detail-session-9-wide-fullpage-1265x939.jpg) and [`20` narrow](../evidence/uxr-a08/20-detail-session-9-narrow-760x768.jpg).

The evidence directory also retains all consecutive transition frames (`15-close-transition-00` through `15-close-transition-03`) rather than selecting only the cleanest frame. This preserves the raw audit sequence and makes the animation/dismissal timing inspectable.
