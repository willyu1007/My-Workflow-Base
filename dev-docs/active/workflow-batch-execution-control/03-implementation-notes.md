# Implementation Notes

## Decision Log

| Date       | Decision |
| ---------- | -------- |
| 2026-07-23 | Create an independent BC0 task because the existing X0 handoff increment and step runtime port do not own batch admission or dispatch. |
| 2026-07-23 | Name the shared family `workflow_batch_execution_control_v1`; keep Education's capability literal in its host profile mapping. |
| 2026-07-23 | Split command, read, and opaque resolver ports; do not widen `WorkflowScenarioModule.adapters`. |
| 2026-07-23 | Report only owner-observed execution lifecycle; never attest scenario lifecycle credit. |
| 2026-07-23 | Treat a host recovery grant as policy input and require a higher-fence owner reconciliation claim for post-reservation mutation. |
| 2026-07-23 | Preserve the existing aggregate source-lock mechanism and use a contract commit followed by a lock/evidence commit. |
| 2026-07-23 | Publish BC0-C from contract revision `ee7e09b8226a8660f46ec277650c7a6e5ee461e0`; BC0-D binds that revision, aggregate source hash, and canonical-vector file hash without self-reference. |

## Entry Evidence

- Base HEAD at entry: `acba4e792c85131c19e63e08a5f671133c481c57`.
- Existing contract source exposes only step claim/complete/fail plus additive handoff materialization types.
- No current batch/global admission, reservation/seal, dispatch, recovery, or receipt resolver contract
  exists.
- Existing Base and tracked My-Chat contract sources are byte-equal at entry.
- No product code has been changed in BC0-A.

## BC0-A Review Closure

- Three review passes closed state/lease, recovery-worker, later-generation, canonical hash, exact-retry,
  unknown-outcome, resolver pin/rotation, read-only, lifecycle authority, capacity-delta, scalar grammar,
  duplicate-key, strict-decoder, and source-lock coverage findings.
- Final independent verdict: `APPROVE BC0-B`; no residual P0/P1 finding.
- My-Chat T-029 independently passed its task-entry review and remains blocked until BC0-D publishes the
  exact contract-bearing revision/source hash.
