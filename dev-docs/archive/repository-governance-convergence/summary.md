# T-005 — Repository governance convergence

## Goal and outcome

My-Workflow-Base was converged on the shared repository-governance contract without retaining
project-local agent skills, the legacy project hub, or the Scenario Starter's embedded task
identity. Existing task identities and durable technical evidence were preserved while duplicated
or chronological task documents were removed.

The repository now uses root task bundles under `dev-docs/`, the flat JSON hub at
`.ai/project/registry.json`, generated dashboard and Feature-map views, and the dependency-free
governance CLI under `.ai/scripts/`. CI runs strict governance lint before dependency installation.

## Durable decisions and boundaries

- Stable task identity remains `T-001`, reserved historical `T-002`, `T-003`, `T-004`, and
  `T-005`; `T-002` must not be reused or given a fabricated replacement bundle.
- `T-001` and `T-003` map to `F-001`; `T-004` maps to `F-002`; this archived migration remains
  mapped to the inbox `F-000`.
- Completed product tasks remain active with `State: done` until separately archived.
- The Scenario Starter distributes implementation scaffolding only. Consuming repositories own
  governance installation, Task IDs, and task creation; generation and package staging explicitly
  exclude `dev-docs`.
- Agent skills are external to this repository. The removed workbench skill must not return as a
  project-local compatibility surface.
- UI components, token values, motion, interactions, dependencies, workflow contracts, and runtime
  behavior were outside the migration scope and were not changed. The token checker only gained
  cross-platform line-ending normalization.

## Verification and evidence

- Governance strict lint and sync dry-run passed with one valid occurrence for each retained task
  and no project-graph conflict or stale projection.
- Scenario generation and package-staging tests confirmed that Starter output contains no
  `dev-docs` task mechanism.
- Workbench token verification, TypeScript checking, and 70 tests passed; contracts source
  TypeScript passed with `--noEmit`.
- No tracked legacy hub, YAML task metadata, project skill, old task-contract filename, or Starter
  task bundle remained on the migration branch.
- The aggregate build-dependent workspace verification was not rerun because repository policy
  requires separate authorization for `pnpm build`; no workflow source changed in this migration.

The recoverable pre-cutover checkpoint is `b134d52`; the verified convergence checkpoint is
`3a9ad95`. Both commits carry exactly one `Task: T-005` trailer.
