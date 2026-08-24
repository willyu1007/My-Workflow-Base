# Roadmap

## Scope and constraints

### In scope
- Refresh the shared repository-governance fixed assets.
- Convert the existing root task bundles while preserving agreed identities and current evidence.
- Replace the legacy hub with the flat JSON project hub and generated views.
- Remove tracked project skills and the Scenario Starter's embedded task mechanism.
- Align CI, task links, Starter expectations, and pnpm-only package scripts.

### Out of scope
- Rewriting Git history or creating a speculative recovered bundle for `T-002`.
- Archiving completed tasks.
- Changing workflow contracts, runtime behavior, UI behavior, tokens, or dependencies.

### Constraints and dependencies
- `b134d52` is the legacy-contract rollback checkpoint.
- The cutover cannot land with both `.ai/project/main/` and the flat hub present.
- Stable identities are fixed as `T-001`, reserved `T-002`, `T-003`, `T-004`, and `T-005`.

## Decision alignment

| Decision question | Options / tradeoffs | Current direction | Status | Owner / required confirmation | Closure evidence | Consequences |
|---|---|---|---|---|---|---|
| Completed task lifecycle | Archive now or convert active `done` | Convert active `done`; archive separately | decided | User | Confirmed 2026-08-24 | Migration does not destroy active evidence. |
| Historical `T-002` | Reuse, fabricate a bundle, or reserve | Reserve without a bundle | decided | User | 37 existing `Task: T-002` trailers | History remains intact and future allocation skips the ID. |
| Starter continuity | Convert embedded bundle or remove it | Remove it; consumer owns task creation | decided | User | Confirmed 2026-08-24 | Generated starters no longer ship repository identity. |
| UI scope | Restructure UI or remove only project skill | Remove only the skill surface | decided | User | Confirmed 2026-08-24 | UI runtime and visual contracts remain unchanged. |

### Assumptions

| Assumption | Risk if wrong | Validation |
|---|---|---|
| No downstream consumer relies on `docs/context/project.registry.json`. | Removing it could break an undocumented integration. | Repository-wide reference search found only the legacy generator and snapshot itself. |

## Task relationships

| Task | Relationship from this task | Owned boundary / exchanged contract | Coordination condition |
|---|---|---|---|
| T-001 | migration-of | This task changes only its record shape and hub projection. | Preserve its in-progress outcome and technical authorities. |
| T-003 | migration-of | This task changes only its record shape and hub projection. | Preserve its completed batch-control evidence. |
| T-004 | migration-of | This task changes only its record shape and hub projection. | Preserve its completed UI-kit evidence without changing UI behavior. |

## Implementation plan

### Phase 1 — Establish rollback identity
- Outcome: The migration is recoverable before fixed assets change.
- Approach: Open `T-005` under the legacy contract and commit its registry projection.
- Planned changes:
  1. Record the identity ledger, boundaries, route, and checks.
- Affected boundaries / entry points: legacy `dev-docs/` and `.ai/project/main/`.
- Dependencies: clean baseline at `40352d9`.
- Exit criteria: committed checkpoint `b134d52` passes legacy sync and lint in the write session.
- Verification: Git status, old CLI sync, old CLI lint.
- Recovery: reset the migration branch to `b134d52` only if the later cutover must be abandoned.

### Phase 2 — Replace governance authorities
- Outcome: Root bundles and the project hub satisfy the new contract with no competing old authority.
- Approach: Refresh fixed assets, reshape the four bundles, construct the confirmed graph, then remove the old hub.
- Planned changes:
  1. Install fixed assets and explicit task metadata.
  2. Rebuild registry semantics and task mappings through governance commands.
  3. Remove the legacy hub and generated snapshot.
- Affected boundaries / entry points: `.ai/`, `dev-docs/`.
- Dependencies: Phase 1 checkpoint.
- Exit criteria: strict lint and dry-run sync are clean; query outputs match the identity ledger.
- Verification: governance lint, sync dry-run, task query, project query.
- Recovery: return to the Phase 1 checkpoint; never retain a partial dual hub.

### Phase 3 — Remove distributed legacy surfaces
- Outcome: No tracked project skill or Starter task mechanism remains.
- Approach: Delete those sources and update their direct documentation and tests.
- Planned changes:
  1. Remove `templates/web-workbench/skills/` and its README entry.
  2. Remove `templates/scenario-module/dev-docs/` and invert the generator assertions.
  3. Update current task links and Starter ownership guidance.
- Affected boundaries / entry points: template distribution and conformance CLI tests.
- Dependencies: Phase 2 record contract.
- Exit criteria: repository searches find no unintended legacy surface.
- Verification: conformance tests and targeted searches.
- Recovery: restore the removed template sources and assertions together.

### Phase 4 — Enforce and close
- Outcome: CI and repository checks prove the migrated state.
- Approach: Add strict governance lint, align the pnpm publish hook, run focused verification, and reconcile this task.
- Planned changes:
  1. Add the CI gate and pnpm-only hook.
  2. Run governance, typecheck, conformance, token, and UI tests.
  3. Record decisive evidence and mark the task done only after review.
- Affected boundaries / entry points: `.github/workflows/ci.yml`, web-workbench package scripts, task records.
- Dependencies: Phases 2 and 3.
- Exit criteria: all planned checks pass and no old authority remains.
- Verification: checks listed in `verification.md`.
- Recovery: revert the enforcement change independently only if the command is proven non-portable; do not restore the legacy mechanism as a workaround.

## Kickoff gate

- Status: ready
- [x] Decisions: the user confirmed identity, lifecycle, Starter, and UI boundaries.
- [x] Design: the authority and migration boundaries are settled in `02-architecture.md`.
- [x] Route: the cutover has a committed rollback point and an atomic convergence boundary.
- [x] Verification: governance and affected repository checks are identified in `verification.md`.

## Risks and recovery

| Risk | Detection | Mitigation | Recovery / rollback |
|---|---|---|---|
| Task meaning is lost during reshaping. | Review new authorities against old records and Git history. | Preserve current decisions and decisive evidence; remove only journals and duplicate authority. | Restore from `b134d52` and reconverge the affected bundle. |
| Old and new hubs coexist. | Path search and strict governance lint. | Delete `.ai/project/main/` before checkpointing. | Return to `b134d52`; do not commit dual state. |
| Starter output silently changes beyond governance. | Focused generator and staging tests. | Change only the dev-docs assertion and README boundary. | Restore the Starter directory and test expectations together. |

## Phase closeout

- Review: Completed; the final diff contains no competing authority, ID drift, dependency drift, or product behavior change.
- Record update: Completed; `01-status.md`, `verification.md`, and generated project projections agree.
- Checkpoint: Commit this verified migration unit with one `Task: T-005` trailer.
