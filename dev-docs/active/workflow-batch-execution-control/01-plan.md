# Execution Plan

## Phase 0 · Entry Review

- [x] Audit the fixed Base source lock and current step/handoff method surface.
- [x] Confirm the shared capability must not reuse transient step claims or scenario literals.
- [x] Create an independent BC0 task package.
- [x] Close architecture review findings and approve BC0-B entry.

## Phase 1 · Types And Port

- [ ] Add `templates/host-runtime/packages/workflow-contracts/src/types/batch-execution-control.ts` and
      export it from the contract package.
- [ ] Define capability, authority/deployment pin, request meta, batch/global CAS, claim/lease, capacity,
      identity reservation, seal, client commit, dispatch, completion, recovery, event, receipt, and page
      types.
- [ ] Define independent command, read, and opaque receipt resolver ports.
- [ ] Add `workflow_batch_execution_control_v1` to `workflowHostCapabilities`; absence remains disabled and
      no manifest or legacy validator rule changes.
- [ ] Do not attach the ports to existing scenario adapters or runtime ports.

## Phase 2 · Conformance

- [ ] Add positive compile fixtures for forward, readback, recovery, and later-generation flows.
- [ ] Add negative compile fixtures for missing pins, invalid discriminators, caller-owned IDs, authority
      substitution, and scenario/secret field leakage.
- [ ] Add source scans for forbidden scenario and secret vocabulary.
- [ ] Add a strict reference decoder in
      `templates/host-runtime/packages/workflow-runtime/src/validation/validate-batch-execution-control.ts`
      with focused runtime tests for unknown keys/discriminators, nulls, malformed cursors/receipts, and
      size/count/depth limits.
- [ ] Keep the frozen legacy contract hash and existing X0 fixture behavior unchanged.

## Phase 3 · Documentation And Handoff

- [ ] Add `docs/context/workflow/batch-execution-control-contract.md` with the locked
      method/state/invariant/readback tables.
- [ ] Create the contract-bearing commit after focused conformance passes.
- [ ] Regenerate and verify the aggregate source lock using that commit revision.
- [ ] Add `conformance/workflow-batch-execution-control-release.json` binding the aggregate source hash and
      the SHA-256 of canonicalization golden vectors; the BC0-D evidence commit pins this manifest rather
      than creating a second source-hash authority.
- [ ] Add the exact My-Chat BC1 copy map and disabled-capability handoff.

## Phase 4 · Full Verification

- [ ] Run frozen install and `pnpm verify:workflow-contracts`.
- [ ] Run clean-copy conformance without relying on an existing `node_modules`.
- [ ] Run Markdown links/fences, JSON/YAML parse, boundary scans, and `git diff --check`.
- [ ] Obtain independent architecture/security/conformance review.

## Stop Conditions

Stop on any Education/product field in the shared DTOs, a change to an existing port/module obligation,
unbounded history/registry payloads, caller-generated owner IDs, receipt-as-authentication, secret-derived
hashes, recovery without a higher owner fence, record-after-effect wording, or runtime/persistence code.
