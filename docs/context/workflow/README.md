# Workflow context

This directory contains the base-template contracts for workflow modules.

Read in this order:

1. `v0-convergence.md` for the current architecture stance and plug-in rules.
2. `architecture-matrix.md` for base modules versus consumption surfaces.
3. `surface-contract.md` for surface ownership and exposure boundaries.
4. `api-contract.md` for HTTP/Command API shape and call sequences.
5. `module-contract.md` for scenario module interfaces and handler contracts.
6. `implementation-skeleton.md` for host package layout, validator, registry
   loader, route, handoff, worker, and journey harness scaffolds.
7. `scenario-readiness-proof.md` for the M5 check that a second scenario can
   plug in without new product-surface APIs.
8. `v0-readiness-checklist.md` for the semantic drift and readiness pass.

Scenario authors should start from `templates/scenario-module/`.
