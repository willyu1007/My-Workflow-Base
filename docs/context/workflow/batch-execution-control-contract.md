# Workflow Batch Execution Control Contract

## Contract Identity

- Capability family: `workflow_batch_execution_control_v1`.
- Owner port: `WorkflowBatchExecutionControllerPortV1`.
- Readback port: `WorkflowBatchExecutionReadbackPortV1`.
- Receipt resolver: `WorkflowBatchExecutionReceiptResolverPortV1`.
- Trust profile: `opaque_owner_readback_v1` only.
- Canonicalization: RFC 8785/JCS with SHA-256 and the exported domain prefixes.

This is an additive host capability. Absence means disabled. It does not extend the required scenario
adapter/module shape or the existing step/runtime ports.

## Ownership

The host owns batch/global ledger state, owner task/execution identities, claims/leases/fences, admission,
lifetime uniqueness, dispatch commit evidence, owner-observed execution receipts, and authority readback.

Scenarios own planning, work bodies, local materialization, business outcomes, credit, and release gates.
Only stable refs and hashes cross this boundary. A controller receipt never attests a scenario conclusion.

## Port Surface

The owner port exposes:

- `open_or_resume_batch`: closed `create_if_absent` command or `resume_existing` query;
- `invoke`: mutation-only discriminated union for claim, renew, release, reserve, seal, confirm client
  commit, dispatch, quarantine, and reconcile.

The readback port exposes capability description, batch/global snapshots, fixed-head history and uniqueness
pages, execution receipt/lifecycle pages, and request-outcome reads. The opaque resolver returns exact
canonical authority-envelope bytes plus the parsed envelope and both domain-separated/raw-byte hashes.
Each read query and observation binds the same explicit operation discriminator; result/page schemas and
snapshot/global heads are validated against that operation.

All readback/resolution operations are controller-state read-only. They append no controller event/outbox,
alter no CAS/capacity/registry, create no mutation/outcome row, and consume no mutation budget.

## Mutation Order

```text
create -> ordinary claim -> reserve owner identities -> seal immutable manifest
       -> confirm client commit -> record dispatch before effect
       -> owner effect start -> owner completion observations -> completed
```

Reservation and seal are separate CAS mutations. Reservation has no execution effect and records a
distinct immutable owner identity-collection hash that every recovery/tombstone/reconciliation fact must
preserve. Dispatch succeeds
only after the dispatch record, batch/global events, and refs-only outbox intent are durably committed.
Workers operate idempotently on the original dispatch/execution IDs; the contract makes no physical
exactly-once queue claim.

Each authority envelope closes the full chain: repeated reservation/manifest/dispatch/count facts match,
the batch-event fact root equals the result snapshot hash, the global fact root matches the corresponding
after-global root, and the event-specific capacity delta reconciles exactly with both global heads.

Single-document decoding establishes only that one envelope/observation is strict, canonically hashed, and
internally consistent. Cross-version monotonicity additionally requires
`verifyWorkflowBatchExecutionControlAuthorityTransitionV1`: `batch_opened` uses a `null` prior value; every
other event uses a strict `read_batch_snapshot` observation at the envelope's exact before batch/global
heads. The verifier binds pins/scope and immutable binding/logical-unit/fact history, rejects no-op or
skipped progress, and permits completion only as one newly recorded receipt with a changed collection
root. This is how callers reconcile every head/event/root with independent readback; decoding the result
document alone is not a transition proof.

Claim fences are positive decimals. Renewal retains the same fence and recovery authority while extending
expiry. A new acquisition proves only `none -> present` within the bounded snapshot pair; strict fence
increase across separate claim cycles is enforced and audited by the owner's durable ledger/history
high-water mark.

## Recovery

Claim/lease is an orthogonal overlay over batch state. A host recovery-policy ref is not ledger authority.
Post-reservation recovery requires an owner-issued `reconciliation_only` claim with new claim/lease IDs, a
strictly higher fence, original identity roots, and the intersection of host policy with owner state.

- reserved/unsealed recovery can only quarantine the original reservation;
- sealed/undispatched recovery may reconcile unresolved or, when policy permits, confirm/dispatch original
  IDs;
- dispatched recovery continues the already recorded owner worker lifecycle and cannot close until every
  original execution has a terminal owner observation;
- recovery never creates replacement work IDs or a later generation.

A later generation is a new batch aggregate created only after an exact quarantine tombstone. It binds the
same logical series, `prior + 1` generation, prior batch/tombstone receipt, and current global CAS. Open
allocates only the new batch ID; reserve later allocates new task/execution IDs.

## Concurrency And Idempotency

Every mutation binds exact authority/source/deployment pins, scope/profile, request identity/hash,
batch/global CAS, and the current claim/fence where applicable.

- exact command retry returns the original logical receipt and appends nothing;
- changed content under a command/idempotency identity conflicts with zero mutation;
- `resume_existing` uses query identity, not mutation idempotency;
- timeout recovery uses request-outcome readback or an exact command retry;
- active-capacity counters are event-backed; lifetime logical/task/execution registries never decrement.

A `committed` outcome is accepted only from a non-null fixed batch head for the resolved batch whose
batch/global version counters cover the resolved after-heads (with exact equal-version event hashes), and
whose observation time is not earlier than the resolved envelope issue time. Genesis or pre-commit heads
cannot make a receipt visible.

## Canonical And Secret Boundary

All protocol strings use the locked ASCII grammar. Claim fences are positive canonical decimals;
ledger/snapshot/registry versions are non-negative canonical decimals subject to genesis/existing-head
rules. Owner timestamps are UTC RFC 3339 with millisecond precision. The raw decoder rejects duplicate
object keys, unknown keys, null/unknown discriminators, malformed scalars/cursors, duplicate or canonically
unsorted logical-unit keys, and all exported byte/count/depth limits before JCS
hashing. JCS normalizes ordinary object-member order; the decoder does not reject an otherwise valid object
merely because its raw members arrived in a different order.

Resolver input and resolved-envelope output are separate strict document kinds. The latter verifies the
full-envelope JCS string, domain-separated envelope hash, and raw canonical-byte hash; the pair verifier
also requires the requested receipt ref and expected pins to match the returned authority envelope.

Transport credentials are injected outside the ports. No bearer/session token, private material, endpoint,
credential, or secret-derived hash is accepted by the contract, retained by a receipt, or emitted in an
error/fixture. Receipt refs are opaque non-bearer identifiers and require independently authenticated
readback with exact historical pins; signed or local fallback is forbidden.

## Error Families

The closed error vocabulary distinguishes invalid input, disabled/pin/scope/policy failures,
idempotency/binding conflicts, stale batch/global CAS, claim/expiry/fence failures, capacity/uniqueness/
registry exhaustion, state/recovery errors, receipt mismatch, and pending/unknown outcome. Errors may expose
non-secret head/receipt refs for readback but never a replacement mutation result.

## Host Adoption Gate

A host may register an instance only after exact contract/source adoption, strict decoder and conformance
tests, canonical ledger/transaction review, opaque resolver/readback configuration, and default-disabled
composition. A scenario-specific instance/profile cannot change the shared method, state, trust, or secret
contract.
