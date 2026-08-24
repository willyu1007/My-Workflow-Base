# Roadmap

## Objective

Replace the repository's legacy governance authorities with the shared task-governance contract in
one recoverable cutover, preserving task identity and current technical evidence.

## Phases

### G0. Legacy checkpoint

- Open this migration under the effective legacy contract as `T-005`.
- Record the agreed identity ledger and migration boundaries.
- Commit a clean rollback point before replacing governance fixed assets.

Exit: the migration is recoverable from the repository before the cutover begins.

### G1. Governance cutover

- Refresh shared fixed assets.
- Convert `T-001`, `T-003`, `T-004`, and `T-005` bundles without retaining competing document
  authorities.
- Build the flat project graph and remove the legacy hub and generated snapshot.

Exit: new lint, task query, project query, and dry-run sync agree.

### G2. Distributed legacy cleanup

- Remove the web-workbench project skill and its documentation entry.
- Remove the Scenario Starter's embedded `dev-docs` mechanism and update its generator tests.
- Update repository documentation and pnpm-only package scripts.

Exit: searches find no unintended project skill or old governance path.

### G3. Enforcement and completion

- Add strict governance lint to CI.
- Run targeted repository checks and reconcile decisive evidence.
- Mark this task done only after semantic convergence is proven.

Exit: the migrated repository is internally consistent and the old path is absent.

## Risks

| Risk | Control |
|---|---|
| Existing task meaning is lost during document reshaping | Preserve current decisions and decisive evidence in their new authorities; rely on Git for journals. |
| Old and new hubs coexist | Do not commit the cutover until the old hub is removed and new lint is clean. |
| Historical `T-002` is accidentally reused | Reserve it explicitly and verify the new CLI's history-aware allocation. |
| Starter consumers inherit an incomplete governance bundle | Remove the embedded mechanism and require consumer-owned task creation. |
| UI migration expands into redesign | Keep all UI runtime, token, and component files out of scope. |

## Rollback

Return to the G0 checkpoint. Do not retain a partial mixture of old and new hub layouts or bundle
contracts.

