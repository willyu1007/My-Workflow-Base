# Plan

1. Create and commit the legacy-format `T-005` checkpoint.
2. Refresh governance fixed assets from `AI-Related-Auxiliary`.
3. Convert all root task bundles with explicit, pre-agreed identities.
4. Build and validate the flat project hub, then delete the legacy hub and snapshot.
5. Remove project skill and Starter continuity mechanism; update affected tests and docs.
6. Add CI enforcement, run targeted checks, and reconcile the task as done.

## Acceptance checks

- `node .ai/scripts/ctl-project-governance.mjs lint --strict`
- `node .ai/scripts/ctl-project-governance.mjs sync --dry-run`
- `node .ai/scripts/ctl-project-governance.mjs query --json`
- `node .ai/scripts/ctl-project-governance.mjs project-query --json`
- `pnpm typecheck`
- `pnpm test:conformance`
- `pnpm check:ui-tokens`
- web-workbench tests

