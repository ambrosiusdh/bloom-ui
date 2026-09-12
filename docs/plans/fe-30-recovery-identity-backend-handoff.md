# Backend handoff: unblock FE-28, FE-29, and FE-30 recovery ownership

## Copyable task prompt

Work in the Bloom backend repository at `E:/Project/Bloom App/bloom-app`. Inspect Git status and preserve existing work. Follow its `AGENTS.md`, architecture, code style, and test conventions. Recheck the current implementation before changing anything; this handoff describes the source inspected on 2026-09-11.

Unblock Release 1 durable recovery ownership for FE-28 supplier payment, FE-29 expense creation, and FE-30 expense reversal by exposing a stable authenticated account identity. These frontend workflows persist an unresolved transaction intent together with the verified username from `/api/auth/current`. Username alone is insufficient: the backend allows deleting a user and creating a different user with that same username. A recreated account must not acquire the original account's saved recovery.

Inspect these contracts and their implementations:

- `AuthController`: login and `/api/auth/current`.
- `UserSessionData`: currently username, name, and role only.
- `User`: generated primary key and account lifecycle.
- `UserController` and `UserServiceImpl`: deletion and recreation behavior.
- Relevant authentication/session tests and Release 1 domain documentation.

Implement the smallest supported contract change that provides a stable, non-recycled account identifier in the authenticated current-user response. Choose and document the field name and JSON type using backend conventions; do not assume the frontend can already consume an entity ID. Reuse an existing identifier only if its lifecycle guarantees are suitable. Normal profile updates must preserve identity, while deleting and recreating the same username must produce a different identity.

Populate the identifier from the authenticated account when establishing a session. Define and implement what happens to existing sessions without that identifier. Do not resolve an old username-only session to a newly created account simply by looking up its username. Requiring reauthentication is an acceptable safe migration when historical ownership cannot be proven. Also verify that a session for a deleted account cannot become a session for its replacement account.

Add focused backend tests proving:

1. Successful authentication and `/api/auth/current` expose the documented identity consistently.
2. Reauthentication and supported profile updates preserve the same account identity.
3. Deleting and recreating a username produces a different identity.
4. Legacy sessions without identity follow the explicit migration policy and cannot inherit a replacement account's identity.
5. Unauthenticated and deleted-account sessions remain rejected according to the authentication contract.

Update the authoritative API/domain contract with the field name, JSON type, uniqueness/lifecycle scope, and legacy-session behavior. Report exact tests run and any limitations. Include a beginner-friendly TL;DR and change intention. Do not commit or push unless requested. Do not change expense amounts, eligibility rules, reason validation, reversal audit, idempotency, drawer calculation, post-close policy, sale corrections, or supplier-payment corrections.

Return a concrete frontend handoff containing the exact current-user response example and field semantics. FE-28, FE-29, and FE-30 will then bind persisted recovery to that verified identifier in separate frontend domain changes. Existing username-only frontend recovery must remain locked for manual reconciliation; it must not be migrated by username matching. Each frontend domain needs account-recreation and recovery-rehydration regression tests before its production-approval blocker can be cleared.
