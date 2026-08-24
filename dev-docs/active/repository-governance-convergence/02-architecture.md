# Architecture

## Authority model after migration

- Root `dev-docs/active/*` bundles own task identity, intent, progress, design, and verification.
- `.ai/project/registry.json` owns Milestones, Features, Ideas, and task mappings.
- `.ai/project/dashboard.md` and `feature-map.md` are generated projections.
- `.ai/scripts/ctl-project-governance.mjs` and its libraries are the only repository governance
  runtime.
- Global Agent skills remain outside this target repository.

## Project graph

- `M-000/F-000` remains the operational inbox and owns `T-005`.
- The existing federation Milestone/Feature owns `T-001` and `T-003`.
- A dedicated completed UI-kit Milestone/Feature owns `T-004`.
- The legacy Requirement layer is folded into Feature descriptions and task acceptance references.

## Distributed template boundary

The Scenario Starter distributes scenario implementation scaffolding, not repository task identity.
Consumers initialize or use their own governance installation and open their own integration task.

