# Bloom UI agent instructions

Before planning or modifying Bloom UI:

1. Inspect Git status and preserve all existing work.
2. Read `docs/architecture/release-1-frontend-contract.md`.
3. Read `docs/plans/release-1-frontend-roadmap.md`.
4. When backend contracts matter, inspect the corresponding controller, request
   DTO, response DTO, validation, and service in the Bloom backend repository.
5. Treat the backend Release 1 domain contract as authoritative for business
   invariants and calculations.
6. Distinguish current implementation from planned behavior.

Implementation rules:

- One frontend business domain per PR.
- Update release-1-frontend-contract.md plan status when finishing the changes.
- Do not invent missing backend endpoints or fields.
- The frontend must not authoritatively calculate stock, sale totals, receipt
  totals, supplier debt, payment status, cash change, or reconciliation.
- Preserve useful existing components and avoid broad rewrites.
- Do not combine feature work with unrelated formatting or migration.
- Include loading, error, empty, conflict, pending, success, accessibility,
  keyboard, and responsive behavior for the touched workflow.
- Do not commit or push unless explicitly requested.