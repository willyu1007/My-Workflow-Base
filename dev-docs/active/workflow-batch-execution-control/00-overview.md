# Workflow Batch Execution Control

## Status

- State: complete, with one open defect
- Owner: unassigned
- Created: 2026-07-23
- Updated: 2026-07-24
- Completed increments: BC0-A contract/threat-model lock; BC0-B additive contract and conformance;
  BC0-C reviewed contract-bearing revision; BC0-D source-lock/release evidence and BC1 handoff
- Current increment: complete
- Open defect: `validateSnapshot` applies the reconciliation allowlist as an every-snapshot invariant rather
  than a claim-creation gate, which makes recovery `dispatch_batch` unrepresentable. Validator scope only; no
  contract or type change. See
  [08-defect-recovery-dispatch-allowlist-scope.md](./08-defect-recovery-dispatch-allowlist-scope.md)
- Next gate: My-Chat BC1 exact adoption with the capability absent/disabled

## Goal

Publish an additive, scenario-neutral `workflow_batch_execution_control_v1` contract for a host-owned
controller that durably reserves execution identities, seals immutable manifests, records dispatch before
effect, exposes independently verifiable readback, and supports fenced recovery. Concrete hosts implement
the canonical ledger; scenarios adapt their own work semantics through refs and hashes.

## Scope In

- A transport-neutral `WorkflowBatchExecutionControllerPortV1` split into command and read ports.
- A separate opaque authority-receipt resolver port.
- Batch and global compare-and-swap controls, leases, monotonic fences, active-capacity deltas, and lifetime
  uniqueness observations.
- Atomic owner allocation of task/execution identities, distinct reservation and seal mutations, client
  commit confirmation, record-before-effect dispatch, completion readback, quarantine, and reconciliation.
- Scenario-neutral state, event, snapshot, receipt, capability, pagination, and error vocabularies.
- Positive, negative, scenario-boundary, secret-boundary, and legacy-compatibility conformance.
- Deterministic source-lock refresh and a precise My-Chat BC1 adoption handoff.

## Scope Out

- Any runtime service, Prisma schema, database transaction, queue/outbox implementation, endpoint,
  credential, or deployment. The contract still requires refs-only dispatch commit evidence and the
  record-before-effect invariant.
- Education template-family, question, packet, assignment, reviewer, lane, learner, corpus, Q2/Q4, or
  lifecycle-credit semantics.
- A canary endpoint or production capability activation.
- Extending or reinterpreting `WorkflowRuntimePort`, `WorkflowRuntimePortMaterializationV1`, step claim
  tokens, or `WorkflowScenarioModule.adapters`.
- Defining transport authentication or treating a lease/fence as authentication.
- Signing or attesting a scenario's business lifecycle conclusions.

## Locked Decisions

- Shared capability family: `workflow_batch_execution_control_v1`.
- Shared port: `WorkflowBatchExecutionControllerPortV1`; capability instance keys are host registrations.
- Education's `template_family_batch_controller` remains an Education/My-Chat profile mapping and never
  appears as a Base discriminator.
- Commands and reads are separate. Reads do not append controller events and bind their exact as-of batch
  and global heads, collection hash, and page boundary.
- V1 defines opaque, non-bearer receipt references and an independently authenticated resolver. It does not
  provide mixed signed/opaque fallback.
- V1 freezes RFC 8785/JCS, SHA-256, three document-specific domain prefixes, exact retry, and
  request-outcome readback; signed
  receipts are deferred.
- A host recovery policy reference is policy input only. Post-reservation mutation requires a real owner
  `reconciliation_only` claim with new claim/lease IDs and a strictly higher fence.
- Reservation atomically allocates owner IDs without starting work. Seal is a later CAS. Dispatch requires
  a confirmed client commit and means the durable owner dispatch ledger/outbox commit precedes any effect.
- Owner lifecycle readback reports owner-observed execution states and receipt collection heads only; it
  cannot grant scenario review, lifecycle, or production credit.
- `workflow_batch_execution_control_v1` is added to generic host capability evidence. Absence is disabled;
  no manifest, scenario adapter, or legacy validator obligation is widened.

## Dependencies

- Starting Base commit: `acba4e792c85131c19e63e08a5f671133c481c57`.
- Existing source-lock revision/hash: `c7f904cdb9b647c80f28134ab6967cd76f730962` /
  `a97a5b149b222e70b5cfb7592414108fa0684887a08b08b3819ce2037577e981`.
- My-Chat T-029 `workflow-batch-controller` owns BC1 host adoption and runtime implementation.
- The-Education Q4-B5 preflight remains blocked until BC0 and BC1 are independently pinned.

## Acceptance Criteria

- [x] New exports are additive; all legacy contracts, module shapes, validators, and fixtures remain valid.
- [x] Public types and documentation contain no scenario-specific work or product-data fields.
- [x] Every mutation binds capability/deployment/source pins, request/idempotency metadata, batch CAS,
      global CAS, and current claim/fence where applicable.
- [x] One-winner claims, stale-writer rejection, reservation/seal separation, lifetime uniqueness,
      tombstone/supersession, record-before-effect, and recovery-only takeover are explicit.
- [x] Readback is bounded/paginated and reconstructable without embedding unbounded history or registries.
- [x] Opaque receipts are non-bearer and exact-resolvable; secrets and secret-derived hashes are excluded.
- [x] Positive and negative compile fixtures plus scenario/secret boundary checks pass.
- [x] A contract-bearing commit is followed by a source-lock evidence commit that pins it without
      self-reference.
- [x] My-Chat receives an exact adoption map and keeps the capability disabled until its own gates pass.

## Contract Lock

The complete state/lease transition matrix, canonical envelope/exact-retry protocol, threat model, error
taxonomy, strict-decoder requirements, and release/source-lock decision are fixed in
[06-contract-lock.md](./06-contract-lock.md). BC0-B cannot start while that lock has an unresolved review
finding.

## Handoff Documents

- [Roadmap](./roadmap.md)
- [Execution plan](./01-plan.md)
- [Architecture](./02-architecture.md)
- [Implementation notes](./03-implementation-notes.md)
- [Verification](./04-verification.md)
- [Pitfalls](./05-pitfalls.md)
- [Contract lock](./06-contract-lock.md)
- [My-Chat BC1 adoption handoff](./07-my-chat-adoption.md)
- [Defect · recovery dispatch allowlist scope](./08-defect-recovery-dispatch-allowlist-scope.md)
