# Roadmap

## Scope and constraints

### In scope
- Publish the additive, scenario-neutral `workflow_batch_execution_control_v1` contract.
- Define durable reservation, seal, dispatch, readback, and fenced recovery semantics.
- Provide positive, negative, scenario-boundary, secret-boundary, and source-lock evidence.
- Hand the exact disabled-by-default adoption contract to My-Chat.

### Out of scope
- Runtime services, database or queue implementations, endpoints, credentials, or deployment.
- Scenario-specific work semantics or production activation.
- Reinterpreting existing step claims, runtime ports, or scenario module adapters.

### Constraints and dependencies
- The capability remains additive and absent/disabled for legacy consumers.
- Commands and reads remain separate; cross-owner payloads and dispatch evidence remain refs-only.
- Recovery mutation requires a real reconciliation claim with a strictly higher fence.

## Decision alignment

| Decision question | Options / tradeoffs | Current direction | Status | Owner / required confirmation | Closure evidence | Consequences |
|---|---|---|---|---|---|---|
| Authority model | Reuse step claims or define batch authority | Independent batch/global CAS, claims, leases, and fences | decided | Contract owner | Contract lock and adversarial conformance | Step claims cannot substitute for batch authority. |
| Receipt trust | Mixed signed/opaque or one v1 mode | Opaque non-bearer refs with authenticated resolver | decided | Contract owner | Contract lock and secret-boundary checks | Signed receipts remain deferred. |
| Dispatch meaning | Effect-first or record-before-effect | Durable owner dispatch ledger/outbox commit precedes effect | decided | Contract owner | Release contract and source lock | Readback can prove dispatch without trusting worker effects. |
| Recovery scope | Policy reference or explicit claim | Explicit `reconciliation_only` claim and higher fence | decided | Contract owner | Recovery defect repair | Recovery cannot widen the ordinary dispatch allowlist. |

### Assumptions

| Assumption | Risk if wrong | Validation |
|---|---|---|
| Host implementations can provide canonical ledgers and authenticated receipt resolution. | The portable contract could not be realized without scenario leakage. | My-Chat adoption handoff names the required owner boundaries and disabled gate. |

## Task relationships

| Task | Relationship from this task | Owned boundary / exchanged contract | Coordination condition |
|---|---|---|---|
| T-001 | sibling | T-003 owns batch control; T-001 owns the broader federation contract and template. | Batch capability remains additive and source-locked within the shared package. |

## Implementation plan

### Phase 1 — Lock authority and threat model
- Outcome: Naming, ownership, state transitions, trust mode, and forbidden data are unambiguous.
- Approach: Freeze the contract and adversarial boundary before types.
- Planned changes:
  1. Define contract-lock matrices and recovery rules.
- Affected boundaries / entry points: batch contract documentation.
- Dependencies: existing workflow contract source.
- Exit criteria: no unresolved shared-scenario or authority ambiguity.
- Verification: independent review recorded in the contract lock.
- Recovery: reopen the contract lock before editing public types.

### Phase 2 — Add contract and conformance
- Outcome: Additive types, validators, fixtures, and boundary checks express the locked model.
- Approach: Extend exports without widening legacy obligations.
- Planned changes:
  1. Add command/read/resolver ports and DTOs.
  2. Add positive and negative validation and type fixtures.
- Affected boundaries / entry points: workflow-contract exports, validation, conformance.
- Dependencies: Phase 1 lock.
- Exit criteria: legacy and new fixtures typecheck; adversarial cases fail closed.
- Verification: contract/runtime/scenario/conformance typecheck and tests.
- Recovery: remove only additive batch exports, fixtures, and validation.

### Phase 3 — Publish source lock and adoption handoff
- Outcome: Consumers can reproduce exact bytes while the capability remains disabled.
- Approach: Separate contract-bearing commit from source-lock evidence and document the copy map.
- Planned changes:
  1. Seal the source lock and release evidence.
  2. Publish My-Chat adoption and recovery-defect guidance.
- Affected boundaries / entry points: source lock, release descriptor, adoption docs.
- Dependencies: Phase 2 conformance.
- Exit criteria: full shared conformance passes and adoption has no implicit enablement.
- Verification: source-hash check, release check, and exact handoff review.
- Recovery: revert the additive capability and its source-lock update together.

## Kickoff gate

- Status: ready
- Authorized boundary: none
- [x] Decisions: authority, trust, dispatch, and recovery choices are settled.
- [x] Design: the public contract and owner boundaries are recorded.
- [x] Route: all planned phases completed with exit evidence.
- [x] Verification: decisive checks and source evidence are recorded in `verification.md`.

## Risks and recovery

| Risk | Detection | Mitigation | Recovery / rollback |
|---|---|---|---|
| Scenario semantics leak into Base. | Scenario-boundary source check. | Keep public vocabulary scenario-neutral and refs-only. | Remove offending additive fields before resealing. |
| Authority receipts become bearer secrets. | Secret-boundary validation. | Use opaque references plus independently authenticated resolution. | Reject the release and restore the prior source lock. |
| Recovery bypasses dispatch gating. | Recovery dispatch allowlist fixture. | Apply allowlist at the recovery-state command gate. | Revert the defect repair and keep adoption disabled. |

## Phase closeout

- Review: Contract, validator, fixtures, source lock, and handoff agree on one authority model.
- Record update: Task remains active `done`; host adoption stays outside this task.
- Checkpoint: Contract commits, source-lock commits, and the integrated main revision are the rollback evidence.
