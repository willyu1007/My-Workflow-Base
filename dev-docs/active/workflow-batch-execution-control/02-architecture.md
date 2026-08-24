# Architecture

## Ownership

```text
Base: method/type/state/readback contract
  -> Host: canonical ledger + admission + trust + transport + dispatch
  -> Scenario: planning + work semantics + local commit + outcome/credit-release gates
```

The Base contract carries only stable refs, hashes, owner-issued IDs, and concurrency evidence. The host is
the sole authority for batch/global state. A scenario remains authoritative only for its own payloads and
business conclusions.

## Public Port Split

The command port has `open_or_resume_batch` and one strict `invoke` method. The `invoke` discriminated union
owns `claim_batch`, `renew_batch_claim`, `release_batch_claim`,
`reserve_executions`, `seal_execution_manifest`, `confirm_client_commit`, `dispatch_batch`,
`quarantine_reservation`, and `reconcile_batch`.

The read port owns capability description, batch snapshot/history pages, global admission snapshot,
uniqueness pages, execution receipt pages, and owner-observed execution lifecycle. Reads never append a
controller event.

The opaque resolver client is constructed over an independently authenticated, environment-injected
transport. Its method input contains only the non-secret receipt ref and expected issuer/audience,
authority/version, capability/source, and deployment pins. Credentials are outside every DTO.

## State And Lease Model

```text
planned -> executions_reserved -> executions_sealed
        -> client_commit_confirmed -> dispatch_recorded
        -> awaiting_completion -> completed

executions_reserved -> recovery_required_reserved_unsealed -> quarantined_cancelled
executions_sealed/client_commit_confirmed
  -> recovery_required_sealed_undispatched
     -> reconciled_unresolved
     -> recovery_required_dispatched (policy-scoped original-ID dispatch only)
dispatch_recorded/awaiting_completion
  -> recovery_required_dispatched -> reconciled_completed|reconciled_unresolved
```

Claim/lease is an orthogonal overlay, not a batch state. Reservation allocates task/execution identities
atomically and has no execution effect. Seal is a separate, later CAS over the exact immutable execution
manifest. Cancellation creates a permanent tombstone. A later generation uses new globally unique IDs and
binds the superseded cancellation; crash recovery never creates replacement IDs. The complete client,
owner-worker, watchdog, release, expiry, and recovery matrix is fixed in `contract-lock.md`.

## Concurrency And Admission

Every mutation exact-binds the capability/contract/deployment pins, namespace, controller run/client batch,
request and idempotency identifiers, before-state batch/global heads, and current claim/fence when required.
Claim issuance has one winner. `reconciliation_only` takeover creates new claim/lease IDs and a strictly
higher fence. Active capacity may be released at terminal state; lifetime logical/task/execution uniqueness
observations are append-only.

## Dispatch Boundary

`dispatch_batch` succeeds only after the immutable seal and client commit are confirmed. Its authority
receipt proves that the host durably committed the dispatch record, batch/global events, and outbox intent
before any enqueue/dequeue/worker effect. The contract does not prescribe a database, but it forbids an
implementation from reporting success based on an effect-first path.

## Readback And Receipts

Snapshots/pages bind their exact `as_of_ledger_sequence`, batch/global heads, stable cursor range, item
count, and collection hash. Pages cannot contain unbounded history or the full lifetime registry. Command
receipts bind issuer/audience, request/idempotency, before/after heads, capacity delta, owner event,
immutable owner IDs, and an opaque authority receipt ref. The ref conveys no authority by possession.
Exact retry returns the same logical receipt without a new event. Request-outcome readback resolves a
timeout from request/idempotency/hash identity when the caller never received the receipt ref.

## Recovery Authority

A host recovery policy reference only narrows which recovery request may be attempted. The owner intersects
that policy with current ledger state and issues a real `reconciliation_only` claim. Post-reservation
quarantine/reconcile requires that current claim and fence. Late ordinary or previous recovery writers are
rejected. Owner readback, not a caller assertion, selects the allowed recovery operation.

## Data And Secret Boundary

Allowed: opaque workload class, logical execution/binding hashes, generation/supersession hash,
owner-issued task/execution IDs, manifest hash, client-commit ref/hash, owner-generated execution receipt
collection hash/lifecycle head, and non-secret authority/deployment identifiers.

Forbidden: scenario work bodies and business vocabulary, local filesystem paths, endpoints, credentials,
bearer/session tokens, private keys, secret-derived hashes, and caller-generated owner identity fields.
