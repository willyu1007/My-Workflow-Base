# T-003 — Workflow batch execution control

## Goal and outcome

The task published an additive, scenario-neutral `workflow_batch_execution_control_v1` contract in
the shared workflow-contracts template: durable identity reservation, immutable execution
manifests, record-before-effect dispatch, independently verifiable opaque readback, and fenced
recovery. It shipped as a type module, a host-side strict decoder and transition verifier in the
runtime template, positive/negative compile fixtures, canonical JCS/SHA-256 vectors, scenario- and
secret-boundary checkers, a release manifest, a context document, and an exact disabled-by-default
adoption map for My-Chat. The task was completed and handed off; My-Chat mirrored the source
byte-parallel but never wired a controller, and no scenario ever consumed the capability.

## Retirement

Decision: retire the contract from Base and from the My-Chat mirror. Recorded 2026-09-17 by the
repository owner after confirming zero production consumers in both host repositories.

The last commit carrying the contract is the parent of the retirement commit — the commit that
moved this bundle into the archive. Recover the full contract, validator, fixtures, vectors,
checkers, release manifest, and `docs/context/workflow/batch-execution-control-contract.md` from
that revision; nothing was moved elsewhere.

Removed by the retirement:

- `templates/host-runtime/packages/workflow-contracts/src/types/batch-execution-control.ts` and
  its `index.ts` export; the `workflow_batch_execution_control_v1` entry of
  `workflowHostCapabilities`.
- `templates/host-runtime/packages/workflow-runtime/src/validation/validate-batch-execution-control.ts`
  plus its test and runtime export.
- `conformance/vectors/batch-execution-control-v1.json`, the two batch fixtures, the four
  `check-batch-execution-control-*.mjs` scripts, `workflow-batch-execution-control-release.json`,
  and the `check:workflow-batch-execution-control` scripts.
- The contract-source lock entries for the two source files (lock re-minted in the follow-up commit).

## Decisions that still matter

- The generic host-capability list is the only activation switch for an additive capability;
  absence means disabled. Retiring the capability therefore required no manifest, validator rule,
  adapter, or runtime-port change, which is the compatibility property the task was designed for.
- Release identity for a private copyable template is the contract-bearing Git revision plus the
  aggregate contract source hash; package versions and tags are not authority. The same rule keeps
  Base and My-Chat contract sources byte-parallel after the retirement.
- A re-introduction must start from a new reviewed contract revision; the archived design (closed
  state union, `reconciliation_only` claims with strictly higher fences, opaque non-bearer receipts
  resolved only under exact pins) is historical context, not a live contract.

## Relationships

- T-001 (`workflow-base`) owns the shared contract package; its roadmap relationship row for
  T-003 is marked retired.
- Feature F-001 keeps this task as a completed-then-retired projection.
