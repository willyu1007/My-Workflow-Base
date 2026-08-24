# Architecture

## Context and current state

The repository began with legacy YAML project data under `.ai/project/main/`, one metadata-bearing
root bundle, two unregistered root bundles, a distributed Starter continuity bundle, and a
copyable web-workbench project skill. The shared resource installs a flat JSON hub and a stricter
task-document contract.

## Settled design and boundaries

### Authority model after migration

- Root `dev-docs/active/*` bundles own task identity, intent, progress, design, and verification.
- `.ai/project/registry.json` owns Milestones, Features, Ideas, and task mappings.
- `.ai/project/dashboard.md` and `feature-map.md` are generated projections.
- `.ai/scripts/ctl-project-governance.mjs` and its libraries are the only repository governance
  runtime.
- Global Agent skills remain outside this target repository.

### Project graph

- `M-000/F-000` remains the operational inbox and owns `T-005`.
- The existing federation Milestone/Feature owns `T-001` and `T-003`.
- A dedicated completed UI-kit Milestone/Feature owns `T-004`.
- The legacy Requirement layer is folded into Feature descriptions and task acceptance references.

### Distributed template boundary

The Scenario Starter distributes scenario implementation scaffolding, not repository task identity.
Consumers initialize or use their own governance installation and open their own integration task.

## Interfaces and contracts

- `.ai-task.json` contains only version, stable task ID, directory slug, and search keywords.
- `01-status.md` owns task state and acceptance references; `00-roadmap.md` owns decisions, route,
  kickoff, and recovery; `02-architecture.md` owns settled design; `verification.md` owns evidence.
- Governance commands own registry task projections and generated project views.
- CI calls the dependency-free governance CLI before dependency installation.

## Migration and operation

The cutover uses `b134d52` as its rollback point. Fixed-asset refresh, root-bundle conversion,
flat-hub construction, and removal of `.ai/project/main/` form one checkpoint; partial dual state
is not a valid operating mode.

Starter generation and package staging explicitly exclude `dev-docs`, so a residual or future
template-local directory cannot reintroduce repository identity. The staging safety check uses the
platform path separator, and the UI token checker normalizes line endings before comparison; these
tooling adjustments make the unchanged contracts portable on Windows without altering generated
content or UI behavior.
