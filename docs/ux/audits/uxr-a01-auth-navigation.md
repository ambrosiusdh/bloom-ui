# UXR-A01 — Authentication and application navigation

Status: `EVIDENCE_COMPLETE`  
Execution: read-only live UX audit  
Audit date: 2026-09-13  
Environment: local Bloom frontend (`http://localhost:5173`) and local backend (`http://localhost:8080`), with the documented local `admin` fixture account  
Browser: Codex in-app browser (Chromium-based; exact version unavailable)  
Viewports: 1440×900 and 1024×768 roadmap baselines; 760×768 additionally used to exercise the implemented drawer breakpoint (`max-width: 767px`)

## Scope and method

This audit covered `/login`, protected entry, login failure/success/pending, explicit session invalidation, the back-office shell and header, route-active indication, cashier/back-office transition, authenticated not-found behavior, keyboard focus, and wide/narrow desktop navigation. It did not assess the content quality of destination pages.

The audit read `AGENTS.md`, the Release 1 frontend contract, frontend roadmap, UX rework roadmap, current router, authentication store/API, shell components, and the matching backend authentication controller/request/session service/response DTO. The backend was already running. Vite was started without changing repository files. No application, dependency, configuration, route, backend, or database files were changed.

The route captures numbered 01–28 were already tracked evidence at audit start. The newly captured settled fallback image, `29-not-found-settled-1024x768.png`, is an explicitly approved local untracked artifact. Existing local domain records were viewed but not changed. Authentication created and invalidated only a local HTTP session; no domain test data was created and no reseed or cleanup was required.

## Route inventory inspected

The current router contains `/` (redirecting to `/dashboard`), `/login`, `/dashboard`, `/cashier`, `/items`, `/items/new`, `/items/:sku/edit`, `/item-categories`, `/item-categories/new`, `/item-categories/:code/edit`, `/sales`, `/sales/:code`, `/goods-receipts`, `/goods-receipts/new`, `/goods-receipts/:code`, `/stock-adjustments`, `/stock-adjustments/new`, `/stock-adjustments/:code`, `/stock-movements`, `/stock-transfers/new`, `/cash-sessions`, `/cash-sessions/:sessionId`, `/suppliers`, `/suppliers/maintenance/new`, `/suppliers/:code/edit`, `/suppliers/:code`, `/payables`, `/expenses`, `/expenses/new`, and the `*` fallback.

The sidebar exposes twelve implemented back-office destinations: Dashboard, Data Barang, Kategori Barang, Penerimaan Barang, Penyesuaian Stok, Transfer Stok, Riwayat Pergerakan Stok, Pemasok, Utang Pemasok, Riwayat Penjualan, Riwayat Sesi Kas, and Pengeluaran. It also exposes Kasir and Keluar separately.

## Scenario evidence

### A01-01 — Logged-out protected entry

- **Purpose:** enter a bookmarked protected destination without an authenticated session.
- **Route and start:** `/items?uxr=a01#entry`; logged out.
- **Steps:** navigate directly to the URL and wait for authentication resolution.
- **Evidence:** `01-protected-entry-login-1440x900.png`.
- **Observed fact:** the browser reached `/login?redirect=%2Fitems%3Fuxr%3Da01%23entry`; the login page was shown and no item content was visible. Query and hash were preserved in the redirect value.
- **Expected:** protected content must not flash; unresolved/unauthenticated entry must gate the route and preserve a safe internal destination.
- **Assessment:** matches the contract. The live observation establishes the final gated state; the very short initial `Memeriksa sesi...` phase was not reliably capturable without request throttling.
- **Priority:** no finding.

### A01-02 — Login pending and successful return

- **Purpose:** authenticate once and resume the intended task.
- **Route and start:** redirected login from A01-01; documented local fixture credentials.
- **Steps:** submit the form once, observe pending, then wait for completion.
- **Evidence:** `03-login-validation-1440x900.png` (captured pending state), `02-items-success-1440x900.png`.
- **Observed fact:** during submission the button changed to disabled `Sedang masuk...`. Success returned to the exact `/items?uxr=a01#entry` destination. The shell displayed the authenticated account and Data Barang was visually active and exposed `aria-current="page"`.
- **Expected:** pending must prevent repeated submission; success must establish the current authenticated account and honor a safe internal redirect.
- **Assessment:** matches the contract. Focus after success remained at the document/body level rather than moving to the page heading or another task entry point.
- **Priority:** `P2` for post-login focus continuity.
- **Classification:** the focus state is observed evidence; its effect on keyboard orientation is reviewer inference.

### A01-03 — Login failure

- **Purpose:** recover from incorrect credentials without losing the ability to retry.
- **Route and start:** `/login`; logged out.
- **Steps:** enter deliberately invalid local credentials and submit.
- **Evidence:** `28-login-submit-1024x768.png`.
- **Observed fact:** the page stayed on login, showed `Username atau kata sandi salah. Silakan coba lagi.`, re-enabled `Log in`, retained both fields, and programmatic focus moved to the error alert.
- **Expected:** normalized failure copy, preserved retry path, and deliberate error focus.
- **Assessment:** matches the reliability contract. The heading/button/field labels mix English with an Indonesian error message.
- **Priority:** `P2` for language consistency.
- **Classification:** observed evidence.

### A01-04 — Explicit session invalidation and expiry limit

- **Purpose:** verify that protected access ends when the authenticated local session is invalidated.
- **Route and start:** authenticated back-office page.
- **Steps:** activate Keluar and observe the next route.
- **Evidence:** login state following the navigation; no additional screenshot required.
- **Observed fact:** explicit logout returned to `/login` and removed the protected shell.
- **Expected:** a 401 or invalid session must return the user to login while preserving a safe protected destination when the failure originates from a protected request.
- **Limitation:** natural timeout expiry was not reproduced. The backend config declares a 30-minute session timeout; this audit did not wait 30 minutes, alter server configuration, delete accounts, tamper with cookies, or inject a synthetic 401. Repository tests cover initial expired-session gating and API 401 redirect behavior, but those tests are corroboration, not live evidence.
- **Priority:** no live finding; coverage limitation remains open.
- **Classification:** logout is observed evidence; natural-expiry behavior is not claimed.

### A01-05 — Back-office destinations and active-route indication

- **Purpose:** reach every top-level back-office workflow and keep location visible.
- **Route and start:** authenticated shell at 1440×900.
- **Steps:** activate each of the twelve sidebar destination links and inspect the resulting URL, page heading, and `aria-current` state.
- **Evidence:** `10-navigation-dashboard-1440x900.png` through `21-navigation-expenses-1440x900.png`.
- **Observed fact:** every destination reached its declared route. Exactly one destination exposed `aria-current="page"` after each navigation, matching the route: `/dashboard`, `/items`, `/item-categories`, `/goods-receipts`, `/stock-adjustments`, `/stock-transfers/new`, `/stock-movements`, `/suppliers`, `/payables`, `/sales`, `/cash-sessions`, and `/expenses`.
- **Expected:** all implemented top-level destinations must be reachable, grouped, keyboard-accessible, and correctly identified.
- **Assessment:** route reachability and semantic active indication match the contract. The long sidebar extends beyond a 900-pixel viewport, placing Keluar below the initial visible area and making navigation scanning less efficient.
- **Priority:** `P1` for sidebar access at constrained heights.
- **Classification:** reachability, active state, and clipping are observed evidence; task-friction severity is reviewer inference.

### A01-06 — Cashier/back-office transition

- **Purpose:** enter the focused cashier workspace and return to the exact back-office context.
- **Route and start:** `/expenses?page=1&size=10` in back office.
- **Steps:** activate Kasir, inspect the focused shell, then activate `Kembali ke menu utama`.
- **Evidence:** `22-cashier-1440x900.png`, `23-back-office-1024x768.png`.
- **Observed fact:** cashier mode removed the back-office sidebar, showed a `Kasir` heading and a clear return link, and focused the cashier search input. The return link preserved `/expenses?page=1&size=10`.
- **Observed fact:** after returning, the URL and content were Pengeluaran, but the header breadcrumb still read `Cashier`.
- **Expected:** cashier is a focused working context with a clear, accessible escape to the originating back-office location.
- **Assessment:** route/context preservation works; the stale breadcrumb incorrectly identifies the current context after the return.
- **Priority:** `P1`.
- **Classification:** observed evidence.

### A01-07 — Keyboard shell controls and narrow navigation

- **Purpose:** operate navigation without a pointer and at constrained widths.
- **Route and start:** authenticated `/expenses?page=1&size=10`.
- **Steps:** at 1024×768 activate the toggle with Enter; at 760×768 open the drawer; inspect initial focus; press Escape and inspect returned focus.
- **Evidence:** `23-back-office-1024x768.png`, `24-collapsed-1024x768.png`, `25-drawer-open-760x768.png`, `26-drawer-escape-760x768.png`.
- **Observed fact:** 1024px uses the wide-shell sidebar rather than the drawer. The toggle operates by keyboard and exposes `aria-expanded`. At 760px, opening creates a modal dialog/backdrop and moves focus to Dashboard; Escape closes it and returns focus to `Buka navigasi back office`.
- **Observed fact:** at 760×768 the open fixed drawer displays only through Riwayat Sesi Kas in the captured viewport. Pengeluaran, Kasir, and Keluar are below the visible edge, and the sidebar has no explicit vertical overflow rule. The closing screenshot caught the CSS transition in progress; focus state was verified after closure.
- **Expected:** narrow navigation must expose all destinations and provide predictable open/close focus behavior.
- **Assessment:** focus management and semantics are strong. Destination visibility at short heights is a material access/efficiency problem, especially for Kasir and Keluar.
- **Priority:** `P1`.
- **Classification:** viewport visibility and focus behavior are observed evidence; the accessibility impact is reviewer inference pending physical keyboard confirmation on the store device.

### A01-08 — Authenticated not-found route

- **Purpose:** recover from an unknown internal URL.
- **Route and start:** authenticated `/uxr-a01-missing` at 1024×768.
- **Steps:** navigate directly and allow the lazy route to settle.
- **Evidence:** `29-not-found-settled-1024x768.png`.
- **Observed fact:** the authenticated shell remained available and the content area rendered only `Not found`. The message is English, is not a heading or status landmark, and offers no direct recovery action.
- **Expected:** the fallback should identify the state clearly and allow useful navigation; user-facing copy should be Indonesian.
- **Assessment:** the route does not crash and global navigation remains available, but the local recovery experience is weak.
- **Priority:** `P2`.
- **Classification:** observed evidence; the recovery recommendation is inference.

## Findings

| ID | Priority | Classification | Finding |
| --- | --- | --- | --- |
| NAV-01 | P1 | Evidence + inference | The long sidebar does not keep all critical destinations visible at the audited heights; the 760px fixed drawer lacks an explicit vertical-scroll treatment, and Kasir/Keluar fall below the captured viewport. |
| NAV-02 | P1 | Evidence | Returning from Cashier restores the correct `/expenses?page=1&size=10` route and page content but leaves the breadcrumb as `Cashier`. |
| AUTH-01 | P2 | Evidence + inference | Successful login restores the exact destination but leaves focus at document level, weakening keyboard orientation. |
| AUTH-02 | P2 | Evidence | Login mixes English labels/actions (`Login`, `Username`, `Password`, `Log in`) with Indonesian status/error copy. |
| NAV-03 | P2 | Evidence + inference | The not-found page provides only English `Not found` text with no semantic heading or local recovery action. |

No `P0` finding was observed. Authentication failure did not expose backend details, duplicate submission was disabled during the observed pending state, protected content was not visible after logged-out entry, and every top-level route had exactly one semantic active item.

## Preserved strengths

- Protected redirects retain path, query, and hash and successful login resumes the intended route.
- Login pending is explicit and disables resubmission; failure is generic, retryable, and focused.
- Sidebar groups have semantic headings; destination links expose accessible names and one `aria-current="page"` state.
- Cashier mode removes unrelated navigation, provides a clear return link, and places focus in item search.
- The responsive drawer exposes dialog/modal semantics, focuses its first destination, traps keyboard focus by implementation, supports Escape, and restores focus to its toggle.
- Unknown authenticated routes retain the global shell rather than crashing.

## Inferences for design work

These are audit interpretations, not approved product decisions:

1. Give the navigation region its own reliable vertical scrolling behavior so the final destinations and account actions remain reachable without moving the task content.
2. Clear or replace cashier breadcrumbs when leaving the cashier context; the breadcrumb should be derived from the destination route rather than retained page state.
3. Move focus to the resumed page heading or first meaningful task control after successful login.
4. Use consistent Indonesian authentication and not-found copy and give the not-found content a heading plus a safe back-office destination.

## Owner decisions needed

1. Confirm whether the store device height/scaling makes the sidebar clipping visible in normal use; the roadmap's temporary viewports may differ from the real laptop.
2. Decide the preferred post-login focus target: destination page heading or first task control.
3. Approve Indonesian wording and the recovery destination for the not-found experience.
4. Decide whether the new settled fallback screenshot should remain local/untracked, be committed alongside the existing evidence, or move to Figma/external storage.

## Limitations

- Natural 30-minute expiry was not forced; only explicit local logout was observed live.
- The initial authentication-check state was too brief to capture reliably without artificial throttling. The final protected gate was observed; repository tests separately prove that `Memeriksa sesi...` renders while the current-user request is unresolved and protected content is absent.
- Browser version and Windows display scaling were unavailable from the audit surface.
- Keyboard checks used browser automation rather than the physical store keyboard. The responsive closing capture includes an in-progress transition, while focus restoration was verified from the accessibility tree.
- Domain content, authorization by role, transaction flows, and physical scanner behavior are outside UXR-A01.

## Evidence index

- Authentication: `01-protected-entry-login-1440x900.png`, `02-items-success-1440x900.png`, `03-login-validation-1440x900.png` (pending state), `28-login-submit-1024x768.png`.
- Top-level navigation: `10-navigation-dashboard-1440x900.png` through `21-navigation-expenses-1440x900.png`.
- Cashier and responsive shell: `22-cashier-1440x900.png` through `26-drawer-escape-760x768.png`.
- Fallback route: `29-not-found-settled-1024x768.png`.
