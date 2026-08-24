# Repository governance convergence

## Goal

Converge My-Workflow-Base on the shared task-governance contract without retaining project-local
skills, the legacy hub layout, or the Starter's embedded task mechanism, while preserving the
meaning and stable identity of existing repository tasks.

## Status

- State: in-progress
- Owner: unassigned
- Created: 2026-08-24
- Updated: 2026-08-24
- Current increment: establish the legacy-contract checkpoint, then perform the atomic cutover
- Next gate: new governance lint, dry-run sync, task query, project query, and affected repository
  checks all pass with no competing old authority left

## Scope In

- Refresh the shared `.ai/` and `dev-docs/` fixed assets.
- Convert the three existing root task bundles and this migration bundle to the new format.
- Preserve `T-001`, reserve historical `T-002`, and assign `T-003` through `T-005` as agreed.
- Replace `.ai/project/main/registry.yaml` and its generated views with the flat JSON project hub.
- Remove project-local skills and the Scenario Starter's embedded legacy `dev-docs` mechanism.
- Reconcile CI, repository documentation, generated Starter expectations, and pnpm-only scripts.

## Scope Out

- Rewriting Git history or manufacturing a recovered bundle for historical `T-002` commits.
- Redesigning or restructuring the web-workbench UI kit.
- Changing workflow runtime, contract, schema, or product behavior.
- Archiving completed tasks during the format migration.

## Locked Decisions

- `T-001` remains `workflow-base`.
- `T-002` remains reserved by existing commit trailers and is not reused.
- `T-003` is `workflow-batch-execution-control`.
- `T-004` is `ui-kit-convergence`.
- `T-005` is this migration.
- Completed bundles convert to active `done`; archiving is a later explicit action.
- The Scenario Starter stops distributing a task bundle and instead leaves task creation to the
  consuming repository.
- `templates/web-workbench` keeps its UI contracts, tokens, components, and tests; only its
  copyable agent skill surface is removed.

## Acceptance Criteria

- [ ] Every retained root task bundle satisfies the new task-governance contract and has the
      agreed stable ID.
- [ ] The flat JSON project hub is the only project authority under `.ai/project`.
- [ ] No tracked project-local skill or embedded Starter task mechanism remains.
- [ ] CI checks strict governance lint and existing relevant conformance/UI gates remain green.
- [ ] Documentation points only to current bundle paths and current governance behavior.
- [ ] No workflow contract, runtime, or UI behavior changes as a consequence of the migration.

