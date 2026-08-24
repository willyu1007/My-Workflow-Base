# Defect · Recovery Dispatch Allowlist Scope

Status: resolved on 2026-08-24 during integration onto the current `main`.

## Summary

`validateSnapshot` applies the per-recovery-state reconciliation allowlist table as an every-snapshot
invariant, keyed on the snapshot's own state. The table describes which operations a reconciliation claim may
be _created_ carrying, in the state where the claim is issued. Applying it to every later snapshot makes
recovery `dispatch_batch` unrepresentable: no allowlist value satisfies the request-side, preservation, and
snapshot-side rules together.

This is a **validator-scope defect**, not a contract or type problem. `WorkflowBatchExecutionControlReconciliationClaimV1`
and `WorkflowBatchExecutionControlRecoveryOperationV1` are correct as written, and no DTO shape changes. That
distinction matters for adopters: a contract revision forces re-adoption of the byte-locked source, while a
validator fix does not change the aggregate source hash's meaning for any consumer that does not exercise the
recovery-dispatch path.

- Reported: 2026-07-24
- Affected revision: `ee7e09b8226a8660f46ec277650c7a6e5ee461e0` (contract), source lock
  `136bea7a395a18e7c6aa8c3f4d73b475b36f5e0ec5f439fe049df6d345a03ab8`
- Affected file: `templates/host-runtime/packages/workflow-runtime/src/validation/validate-batch-execution-control.ts`
- Severity: blocks any consumer whose recovery policy permits forward continuation to dispatch. Does not block
  a consumer that closes recovery through `reconcile_batch`.

## The Unsatisfiable Rule Set

For a batch in `recovery_required_sealed_undispatched` performing `dispatch_batch` under a
`reconciliation_only` claim, three rules constrain the same value —
`$.receipt.authority_envelope.result_snapshot.claim.allowed_operations`.

| Rule | Location                                                                                                                                                                                     | Constraint                                                                                           |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| A    | `validateMutationCommand`, the `!(claim.allowed_operations).includes(operation)` check                                                                                                       | the request claim MUST contain `dispatch_batch`                                                      |
| B    | `validateAuthorityResultForMutation`, case `"dispatch_batch"` — `requireEqual(snapshot.claim, request.current_claim, …, "Dispatch result must preserve the exact current claim authority.")` | the result claim MUST deep-equal the request claim                                                   |
| C    | `validateSnapshot`, the `allowedForState.has(operation)` loop keyed on the snapshot's own `state`, against `reconciliationClaimOperationsByRecoveryState.recovery_required_dispatched`       | the result allowlist MUST be a subset of `{reconcile_batch, release_batch_claim, renew_batch_claim}` |

`"dispatch_batch" ∈ S` and `S ⊆ {reconcile_batch, release_batch_claim, renew_batch_claim}` cannot both hold.
`requireEqual` is deep structural equality and `allowed_operations` is canonically sorted and unique, so
there is no representational slack in rule B.

The only legal after-state for a recovery dispatch is `recovery_required_dispatched`, so the result cannot
land somewhere the table permits. Narrowing the allowlist to satisfy C makes A fail request-side, and the SQL
rejects it independently (`"request_row"."operation"::TEXT = ANY("claim"."allowed_operations"::TEXT[])`).
Both ends are closed.

## Why This Is A Scope Error, Not A Policy Decision

Three independent pieces of evidence show the allowlist is a claim-creation gate.

**1. The validator's own command path already scopes it correctly.** In `validateMutationCommand`, the
identical `reconciliationClaimOperationsByRecoveryState` table is keyed on
`precondition.expected_batch_head.state` — the state in which the claim is being used — not on some later
snapshot state. The snapshot path keys the same table on `state` of whatever snapshot is being validated. The
two call sites disagree about what the table means.

**2. The canonical ledger gates the identical table on `INSERT`.** The frozen owner migration carries the same
three-way table verbatim, wrapped in `IF TG_OP = 'INSERT' AND (…)`. It is evaluated when a reconciliation
claim row is created and never again.

**3. The ledger then freezes the field and requires the claim to survive.** `allowed_operations` and
`allowed_operations_hash` are immutable on `UPDATE` (`'workflow batch claim authority identity is
immutable'`), and the request/claim consistency check requires `"claim"."status" = 'active'` for
`operation IN ('renew_batch_claim', 'confirm_client_commit', 'dispatch_batch')`. The database therefore
_expects_ a claim created in `recovery_required_sealed_undispatched`, carrying `dispatch_batch`, to still be
active and unchanged after the batch reaches `recovery_required_dispatched` — exactly the state the validator
rejects.

The persistence layer and the validator disagree, and the persistence layer is self-consistent.

## Proposed Fix

Scope the snapshot-side assertion to the claim's issuing state rather than the snapshot's current state,
matching `TG_OP = 'INSERT'` and the validator's own command-path precedent. Either:

- evaluate the allowlist subset check only where the claim is established (the `batch_claimed` overlay path),
  leaving `validateSnapshot` to check claim _shape_ but not per-state membership; or
- carry the issuing state on the claim so `validateSnapshot` can key the table on it.

The first is smaller and needs no contract change. Recovery `confirm_client_commit` is unaffected either way:
its transition is state-preserving, so the preserved allowlist is re-checked against
`recovery_required_sealed_undispatched`, whose set already contains it.

## Supporting Finding · Fixture Inconsistency

`validate-batch-execution-control.test.ts` ships `dispatchedRecoverySnapshot` with a _narrowed_
`dispatchedRecoveryClaim`. That shape would fail rule B if it were ever checked against a mutation request,
and would fail `requirePreservedSnapshotFacts` if it were ever checked as a transition — `"claim"` is in
`snapshotTransitionFactKeys` and absent from the `dispatch_recorded` mutable set. It passes only because the
fixture is exercised through a bare `authority_envelope` decode, which reaches neither
`verifyWorkflowBatchExecutionControlAuthorityReceiptV1` nor
`verifyWorkflowBatchExecutionControlAuthorityTransitionV1`.

The single artifact shipped as evidence for this edge is therefore self-inconsistent with the contract it
demonstrates, and its narrowing is the shape the defect would force a producer to attempt.

## Supporting Finding · Zero Conformance Coverage

`conformance/vectors/batch-execution-control-v1.json` contains only `planned` / `batch_opened` material. There
is no `recovery_required_*` vector, no `dispatch_batch` request vector, and no `dispatch_recorded` authority
envelope. The unreachable edge was never release-gated, which is why the contradiction survived the BC0
approval and the source lock.

A fix should add a recovery-dispatch **mutation-receipt** vector, since that is the path where rules A, B, and
C compose.

## Consumer Status

My-Chat T-029 (`codex/q4b5-batch-controller-owner`) does not claim recovery `dispatch_batch`. Its
service-layer transition table retains the `recovery_required_sealed_undispatched -> recovery_required_dispatched`
edge, annotated as deliberately unreachable pending this fix, because deleting it would hide the gap and would
also make the service table disagree with the migration its conformance test compares against.

The current consumer is unblocked: The-Education Q4-B5 forbids its recovery executor from confirming or
dispatching and closes the affected crash windows through `reconcile_batch` to `reconciled_unresolved`, which
its closure criterion accepts. This defect is therefore not urgent for that consumer, and no adopter should be
blocked on it.

## Resolution

The integration applies the smaller proposed fix. `validateSnapshot` continues to enforce the closed
state-specific snapshot shape, but no longer reinterprets a preserved reconciliation claim against the
snapshot's later state. `validateMutationCommand` remains the authority gate and checks the requested
operation against the recovery state where the claim is used.

The dispatched recovery fixture now preserves the exact sealed-state claim, including `dispatch_batch`.
A focused authority-receipt test composes the recovery dispatch request, preserved claim, dispatched result
snapshot, and receipt verification so the previously unreachable transition is release-visible.
