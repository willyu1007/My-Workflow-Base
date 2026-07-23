# BC0 Contract Lock

## Purpose

This document closes BC0-A. It is normative for BC0-B/C types, the reference decoder, fixtures, and the
My-Chat adoption handoff. A later change to a locked item requires a new reviewed contract revision.

## Release And Registration Decisions

- Capability family: `workflow_batch_execution_control_v1`.
- Public owner port: `WorkflowBatchExecutionControllerPortV1` with `open_or_resume_batch` and strict
  mutation-only `invoke`.
- Separate readback port: `describe_capability` plus snapshot/history/global-admission/uniqueness/execution-receipt/
  execution-lifecycle and request-outcome reads.
- Separate opaque resolver port: exact authority-envelope resolution only.
- The generic host-capability list gains `workflow_batch_execution_control_v1`. Absence means disabled.
  No manifest field, existing validator rule, `WorkflowScenarioModule.adapters`, or runtime port is widened.
- The Base package is a private copyable template, so package version and a Git tag are not release
  authority. BC0 release identity is the contract-bearing Git revision plus the existing aggregate source
  hash, bound with canonical-vector hashes by the committed BC0 release manifest.
- Base supports platform/organization/workspace scope kinds. The first My-Chat profile is server-pinned to
  a platform-managed controller scope; callers cannot invent a workspace to satisfy legacy command meta.
- V1 trust mode is only `opaque_owner_readback_v1`. Signed mode is deferred; there is no fallback.
- Base may express policy-scoped original-ID resume. The Education Q4-B5 canary profile disables it.

## State And Claim Model

Claim/lease is an orthogonal overlay over batch state:

- `none`;
- `ordinary` with claim/lease IDs, fence, owner-issued/expiry time;
- `reconciliation_only` with new claim/lease IDs, a strictly higher fence, original identity collection
  hash, recovery-policy decision ref/hash, and an owner-intersected operation allowlist/hash.

The batch-state union is closed:

```text
planned
executions_reserved
executions_sealed
client_commit_confirmed
dispatch_recorded
awaiting_completion
completed
recovery_required_reserved_unsealed
recovery_required_sealed_undispatched
recovery_required_dispatched
quarantined_cancelled
reconciled_completed
reconciled_unresolved
```

Snapshots are state-discriminated unions, not one object with optional fields. The sealed-undispatched
recovery branch has a nested closed `client_commit_status: not_confirmed | confirmed` discriminator. The
dispatched-recovery branch has nested closed effect and completion-status discriminators. Terminal
snapshots retain all previously created owner identities, reservation/seal/dispatch/completion roots, and
tombstones.

Reservation carries both the logical-unit collection root and a distinct immutable owner identity-
collection hash. Every recovery claim, recovery record, tombstone, and reconciliation record for that
reservation repeats the exact identity-collection hash. Seal, client commit, dispatch, effect, and
completion facts likewise preserve the corresponding reservation/manifest/dispatch hashes and counts.

The nested unions are also closed:

```text
client_commit_status
  = not_confirmed
  | confirmed(client_commit_ref, client_commit_hash, manifest_hash, committed_at)

dispatch_effect_status
  = recorded(dispatch_commit_hash)
  | started(dispatch_commit_hash, effect_started_at, effect_observation_hash)

completion_status
  = none(receipt_count=0, collection_root)
  | partial(receipt_count, expected_count, collection_root)
  | all_terminal(receipt_count=expected_count, collection_root, lifecycle_head)
```

No `confirmed` client commit permits a different manifest or owner identity collection. Recovery worker
events monotonically advance these nested unions and never move them backwards.

## Validation Layers And Prior Readback

Strict single-document decoding proves that one observation/receipt/envelope has the closed V1 shape,
canonical hashes, internally valid event/result state, head arithmetic, and fact-root bindings. It does
not, by itself, prove that an otherwise valid result snapshot is a monotonic successor of the actual prior
snapshot.

Cross-version monotonicity therefore requires the exported
`verifyWorkflowBatchExecutionControlAuthorityTransitionV1(beforeObservation, receipt)` verifier. Except
for the initial `batch_opened` receipt, whose prior observation is `null`, callers supply a strict
`read_batch_snapshot` observation at the exact authority `before_batch_head` and `before_global_head`.
The verifier exact-binds pins/scope, immutable binding/logical units, and all event-preserved facts. It
then proves the event-specific delta: claim acquisition/renewal/release/expiry, reservation, seal,
commit, dispatch, effect start, one-receipt completion (`receipt_count + 1`, changed collection root, and
an all-terminal lifecycle head), quarantine, or reconciliation. Expiry additionally requires owner event
time at or after the prior lease expiry. This is the normative implementation of the resolver rule that a
caller reconciles every head, event, and root with independent fixed-head readback.

Claim fences are positive canonical decimals. A renewal verifier proves that claim/lease/fence and all
reconciliation authority stay fixed while expiry strictly increases. A none-to-present acquisition has no
prior active claim from which to prove a historical maximum; strict fence increase across separate claim
cycles remains an owner-ledger/history audit invariant. Hosts must persist and audit that high-water mark;
the bounded prior-snapshot helper does not claim to prove it.

Committed request-outcome resolution is also visibility-bounded: its observation requires a non-null batch
head for the resolved batch, batch ledger/snapshot counters and global ledger/registry counters at or after
the resolved after-heads, exact event hashes whenever those counters are equal, and `observed_at` no earlier
than envelope issuance. A genesis/pre-commit fixed head cannot attest a committed outcome.

## Transition Matrix

All client mutations bind exact before-state batch/global CAS. Each committed mutation appends batch and
global owner events and returns one authority receipt. An exact retry is the exception: it returns the same
logical receipt and appends no event. `owner worker` and `watchdog` transitions use internal idempotency
identities and do not masquerade as caller commands.

| Current state / claim | Actor and trigger | Operation/event | Next state / claim | Required invariant |
| --- | --- | --- | --- | --- |
| absent generation key / `expected_absent` | client | `open_or_resume_batch` generation 0 | `planned` / none | server-pinned scope/profile; atomic global admission and lifetime logical series/generation binding |
| exact creation retry | client | same command/idempotency/request hash | unchanged | return original `created` mutation receipt; no event |
| existing exact generation binding / resume query | client | read-like resume with `query_id/query_hash` | unchanged | return `resumed` fixed-head read observation; no command/idempotency identity, controller event, outcome row, or mutation receipt |
| existing generation key with changed immutable binding | client | resume query | unchanged | `binding_conflict`; zero mutation; a later query is independently evaluated |
| quarantined prior generation / new `expected_absent` generation key | client | `open_or_resume_batch` later generation | new `planned` aggregate / none | generation = prior + 1; same logical series; bind prior batch/tombstone receipt; new owner batch ID only; global CAS |
| any creation command identity with changed request | client | create path | unchanged | `idempotency_conflict`; zero mutation |
| `planned` / none | client | ordinary `claim_batch` | `planned` / ordinary | one winner; active-claim capacity; new monotonically higher fence |
| forward state / ordinary | client | `renew_batch_claim` | same / ordinary | owner clock before expiry; bounded TTL; same fence and new expiry |
| `planned` / ordinary | client | `release_batch_claim` | `planned` / none | release active capacity; lifetime history retained |
| post-reservation forward state / ordinary | client | `release_batch_claim` | matching recovery state / none | release cannot erase IDs or return to `planned` |
| `planned` / ordinary | client | `reserve_executions` | `executions_reserved` / ordinary | atomic owner task/execution IDs; global lifetime uniqueness; no effect |
| `executions_reserved` / ordinary | client | `seal_execution_manifest` | `executions_sealed` / ordinary | later distinct CAS; exact original IDs and immutable manifest hash |
| `executions_sealed` / ordinary | client | `confirm_client_commit` | `client_commit_confirmed` / ordinary | non-path client commit ref/hash binds exact manifest |
| `client_commit_confirmed` / ordinary | client | `dispatch_batch` | `dispatch_recorded` / ordinary | dispatch record + events + refs-only outbox committed before effect |
| `dispatch_recorded` / any current claim | owner worker | `dispatch_effect_started` | `awaiting_completion` / same | worker rereads canonical state; idempotent original execution IDs |
| `awaiting_completion` / any | owner worker | partial completion event | unchanged | append owner-observed receipt; no replacement ID |
| `awaiting_completion` / any | owner worker | all terminal completion event | `completed` / none | release active capacity; retain lifetime registry and receipt root |
| `planned` / expired ordinary | watchdog | `claim_expired` | `planned` / none | explicit event releases active claim; no dynamic query-time capacity drift |
| `executions_reserved` / expired ordinary | watchdog | `claim_expired` | `recovery_required_reserved_unsealed` / none | original IDs retained; seal/dispatch forbidden |
| `executions_sealed` or `client_commit_confirmed` / expired ordinary | watchdog | `claim_expired` | `recovery_required_sealed_undispatched` / none | retain seal and optional client commit; owner proves no dispatch record |
| `dispatch_recorded` or `awaiting_completion` / expired ordinary | watchdog | `claim_expired` | `recovery_required_dispatched` / none | dispatch remains recorded; never redispatch by reconstruction |
| recovery state / none | recovery client | reconciliation `claim_batch` | same / reconciliation | new IDs, strictly higher fence, original IDs, grant ∩ state allowlist |
| recovery state / reconciliation | recovery client | `renew_batch_claim` | same / reconciliation | bounded TTL and recovery deadline; same higher fence |
| recovery state / reconciliation | recovery client | `release_batch_claim` | same / none | no forward state or identity change |
| recovery state / expired reconciliation | watchdog | `claim_expired` | same / none | release claim slot; retain grant/allowlist/original-ID history; the next recovery claim has new IDs and a higher fence |
| `recovery_required_reserved_unsealed` / reconciliation | recovery client | `quarantine_reservation` | `quarantined_cancelled` / none | permanent tombstone; original IDs can never seal/dispatch |
| `recovery_required_sealed_undispatched` / reconciliation | recovery client | allowed `confirm_client_commit` | same / reconciliation | original seal/IDs only; Q4-B5 canary policy forbids this edge |
| `recovery_required_sealed_undispatched` with confirmed commit / reconciliation | recovery client | allowed `dispatch_batch` | `recovery_required_dispatched` / reconciliation | one original dispatch record; record before effect; canary forbids |
| `recovery_required_dispatched` / reconciliation or none | owner worker | `dispatch_effect_started` | same / unchanged | nested effect status `recorded -> started`; internal idempotency; original IDs only |
| `recovery_required_dispatched` with effect `started` / reconciliation or none | owner worker | partial completion event | same / unchanged | append original execution receipt and update nested partial count/root |
| `recovery_required_dispatched` with effect `started` / reconciliation or none | owner worker | all-terminal completion event | same / unchanged | nested completion status becomes `all_terminal`; only explicit reconciliation closes recovery |
| sealed-undispatched recovery / reconciliation | recovery client | `reconcile_batch` unresolved | `reconciled_unresolved` / none | owner proves no dispatch record; original identities and evidence roots retained |
| dispatched recovery with all-terminal nested status / reconciliation | recovery client | `reconcile_batch` unresolved | `reconciled_unresolved` / none | all original executions are terminal but at least one owner outcome remains unresolved/failed |
| dispatched recovery with all-terminal nested status / reconciliation | recovery client | `reconcile_batch` completed | `reconciled_completed` / none | exact original receipt root; no replacement; release active capacity only |
| any terminal state / none | client | any mutation | unchanged | `terminal_state`; reads only |

Ordinary claims cannot be acquired after reservation. Reconciliation claims cannot reserve or seal, create
new batch/task/execution work identities, or widen their allowlist; their new claim/lease authority IDs are
required. Previous ordinary/recovery writers fail after a higher fence.
Owner-worker events do not consume or replace a reconciliation claim: inside a fixed-order owner
transaction they reread the latest fence/head, append only worker-observed effect/completion facts, preserve
the claim overlay, and retry on CAS conflict. They cannot execute a client recovery operation.
Once a dispatch record is committed, owner-worker progress is independent of client lease validity. The
watchdog may first move the batch into dispatched recovery and clear an expired claim; the worker still
starts and completes the one original dispatch through the recovery-state edges above.
Completion is never accepted while effect status is only `recorded`. A deterministic no-op that starts and
finishes in one database transaction still appends two ordered owner events—`dispatch_effect_started`
followed by completion—so the event chain cannot skip the start observation. Dispatched recovery cannot
become terminal until all original executions have terminal owner observations.

`open_or_resume_batch` has a closed input union. `create_if_absent` uses command/idempotency/request identity
and an `expected_absent` precondition binding the stable client generation key, generation,
logical-series hash, and current global lifetime root. `resume_existing` uses read `query_id/query_hash` and
an `expected_existing` full batch CAS; it does not enter the controller command/idempotency/outcome domain.
Generation zero forbids supersession fields. A later generation is a new batch
aggregate allowed only after the exact prior aggregate is `quarantined_cancelled`; it binds prior batch ID,
tombstone receipt/hash, generation `prior + 1`, the same logical-series hash, a fresh client generation key,
and current global CAS. Logical-unit uniqueness is recorded by `(logical series, generation, unit hash)`.
Every new generation receives a new owner batch ID at open. New task/execution IDs are allocated only by
the later atomic `reserve_executions` mutation. Crash recovery never opens a generation.
The method result is likewise closed: `created` contains the creation mutation receipt; `resumed` contains
a read observation and no mutation receipt/event. This prevents a new resume request identity from being
misrepresented as the original creation command. Repeating a resume query may produce a new observation
at a later explicitly bound fixed head; it does not promise mutation-style exact receipt replay.

## Crash-Window Closure

| Window | Authoritative recovery |
| --- | --- |
| claim before reserve | explicit expiry/release returns `planned`; a later ordinary claim may win |
| reserve before seal | enter reserved/unsealed recovery; reconciliation claim may only quarantine |
| seal before client commit | prove no dispatch; policy may confirm the original sealed IDs or reconcile unresolved |
| client commit before dispatch | prove no dispatch; policy may dispatch the original IDs once or reconcile unresolved |
| dispatch commit before response/effect | request-outcome/readback returns the original receipt; worker consumes the one outbox record; never redispatch |
| partial completion | read original completion pages; reconciliation resolves the same executions |

## Canonical Request And Receipt Protocol

- Canonical JSON: RFC 8785/JCS.
- Hash: SHA-256, lowercase hexadecimal.
- Claim fences cross the boundary as positive canonical decimal strings. Ledger, snapshot, and registry
  versions use non-negative canonical decimal strings subject to their genesis/existing-head constraints.
  No JSON `BigInt` or floating-point value enters a hash.
- Request domain prefix: UTF-8 `workflow_batch_execution_control_v1/request\u0000`.
- Authority-envelope domain prefix: UTF-8
  `workflow_batch_execution_control_v1/authority-envelope\u0000`.
- Page-observation domain prefix: UTF-8
  `workflow_batch_execution_control_v1/read-observation\u0000`.
- A hash is SHA-256 over `domain-prefix || JCS(canonical projection)`.
- The request projection includes schema/capability/source/deployment pins, issuer/audience expectations,
  server-pinned scope, purpose/profile hash, non-bearer policy decision ref/hash, command ID,
  idempotency key, correlation ID, operation, batch/global CAS, and payload. It omits `request_hash`, trace
  hints, endpoints, and all transport/auth material.
- Before envelope construction the owner allocates an opaque, non-derived receipt ref independently of all
  hashes. The `authority_envelope_hash_projection` includes that ref plus issuer/audience, receipt
  authority/version, capability/contract/source/
  deployment/ledger pins, request binding, before/after batch and global heads, batch/global events,
  capacity delta, immutable owner result roots, dispatch commit evidence when present, owner issue time,
  and every other envelope field except `authority_envelope_hash` itself. The envelope then adds exactly
  that computed hash. Hash/recanonicalization never includes the hash field recursively.
- Before read observation construction the owner likewise allocates an independent observation ref. The
  `read_observation_hash_projection` includes the ref, query binding, authority pins, as-of batch/global
  heads, cursor/limit/counts, items/page/full roots, and observation time, but excludes
  `read_observation_hash` itself. The observation then adds the computed hash.
- Opaque resolver input contains receipt ref plus expected non-secret pins only. It returns bounded canonical
  envelope UTF-8, parsed envelope, the domain-separated `authority_envelope_hash`, and a separate raw
  `canonical_envelope_bytes_sha256`. The caller recanonicalizes the parsed value, exact-compares bytes and
  both hashes, and reconciles every head/event/root with independent readback.

Resolver expected pins are mandatory and exact: issuer, audience, receipt authority ID/version,
capability family/version, contract-bearing revision, aggregate source hash, canonicalization profile and
vector-release hash, owner deployment ID/digest, and ledger schema revision. Missing/optional/unknown pins
fail closed. After authority/deployment rotation, historical refs remain resolvable for the descriptor's
minimum audit-retention window only under their originally recorded exact pins; the resolver never upgrades
an old ref to current pins and never falls back to signed/local verification.

### Exact Retry And Unknown Outcome

- `(owner namespace, idempotency key)` and `(owner namespace, command ID)` are unique.
- Same key/ID plus identical request hash returns the original receipt ref, canonical envelope, and envelope
  hash; it appends no batch/global event and no outbox row.
- Same key or command ID plus a different canonical request hash returns `idempotency_conflict` with zero
  controller mutation.
- The readback port exposes `read_request_outcome` keyed by authority pins, scope, command ID, idempotency
  key, and request hash. It returns `committed` with the original receipt ref/envelope hash, `pending`, or
  `not_found` at explicitly bound as-of batch/global heads.
- `not_found` is not proof against a later commit. After timeout, the client either repeats the exact same
  command or reads outcome again; it never changes the request under the same key.
- Before a batch exists, request-outcome lookup binds owner namespace, server-pinned control scope, stable
  client generation key, command/idempotency/request hash, and an as-of global head; its batch head is
  explicitly `null`. After creation it also binds the resolved batch head.

## Lease And Owner Time

- Owner database/service time is authoritative.
- Capability descriptor declares minimum/maximum TTL, maximum reported clock skew, and retention bounds.
- V1 TTL range is 30–900 seconds; a host may configure a tighter range.
- Renewal at or after `lease_expires_at` fails. Client and recovery-client mutations after expiry are
  rejected; watchdog and owner-worker internal events remain allowed under their separate owner authority.
- Expiry is an explicit watchdog/maintenance transaction that appends batch/global events and updates active
  capacity. Before evaluating a subsequent client mutation, the owner materializes any applicable expiry;
  the requested mutation then fails `claim_expired` against the post-expiry head and receives no mutation
  receipt of its own.
- After a forward/recovery policy deadline, forward/recovery client mutation is denied even if its lease
  timestamp is later. Watchdog/owner-worker internal events continue under separate owner authority, and
  reads remain available under the independent readback policy.

## Error Taxonomy

Errors are stable discriminators and never contain credentials or raw canonical bodies:

```text
invalid_request
capability_disabled
contract_pin_mismatch
scope_forbidden
policy_expired
idempotency_conflict
binding_conflict
stale_batch_cas
stale_global_cas
claim_conflict
claim_expired
fence_rejected
capacity_exceeded
uniqueness_conflict
registry_full
invalid_state
terminal_state
recovery_forbidden
receipt_unresolvable
receipt_mismatch
outcome_pending
outcome_unknown
```

Errors may carry non-secret current-head/receipt refs sufficient for readback, but never a replacement
mutation result.

## Bounds And Strict Decoding

The public contract exports bounds: command 256 KiB, canonical envelope 512 KiB, resolved-envelope wrapper
1.5 MiB, JSON depth 64, JSON nodes 50,000, identifier/string 2,048 UTF-8 bytes, reason code 256 bytes, units
per batch 64, page size 100, and recovery operations 16. The wrapper budget accounts for the parsed
envelope plus its escaped canonical UTF-8 copy; the canonical string itself remains capped at 512 KiB.
My-Chat may configure tighter limits.

The reference decoder must recursively reject unknown keys (including prototype-named keys), unknown/null
discriminators, unsafe canonical
decimal/timestamp/hash forms, duplicate/canonically unsorted unit keys, mixed trust fields, malformed
cursors, invalid count/hash combinations, self-referential hash projections, and every byte/count/depth
limit. It also strictly decodes resolver inputs and resolved-envelope wrappers, verifies exact canonical
full-envelope bytes, the domain-separated authority hash, and the raw-byte hash, and compares resolver
input receipt/pins to the returned envelope through the exported pair verifier. TypeScript fixtures do not
substitute for runtime decoding. Golden vectors include omitted/changed
projection fields, mutated output hash fields, a forbidden attempt to include the output hash in its own
projection, and preallocated receipt/observation refs.

Canonical protocol scalars are closed:

- hashes: lowercase 64-character hexadecimal;
- claim fence decimal strings: a non-zero digit followed by digits, no sign or leading zero, range
  `1..9223372036854775807`;
- ledger/snapshot/registry decimal strings: `0` or a non-zero digit followed by digits, no sign or leading
  zero, maximum `9223372036854775807`; global ledger genesis may use zero, while existing batch heads and
  their snapshot/ledger versions are strictly positive;
- owner timestamps: UTC RFC 3339 with exactly millisecond precision,
  `YYYY-MM-DDTHH:mm:ss.SSSZ`;
- counts, limits, TTL, generation, and page sizes: non-negative JSON safe integers; operation-specific
  bounds still apply;
- protocol IDs and non-cursor refs: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,2047}$`;
- reason codes: `^[a-z][a-z0-9._-]{0,255}$`;
- non-null opaque cursors: base64url `^[A-Za-z0-9_-]{16,2048}$`;
- every protocol string is ASCII, so no Unicode normalization or locale-sensitive comparison enters
  canonical input.

The raw JSON decoder is duplicate-key aware and rejects a repeated object key before creating a JavaScript
object or applying JCS. Ordinary `JSON.parse` alone is not a conforming decoder.

## Read Semantics

Capability, snapshot, history, global-admission, uniqueness, execution-receipt, execution-lifecycle,
request-outcome, and opaque-resolution operations are read-only against controller state. They do not
append batch/global controller events or outbox, alter CAS/capacity/uniqueness/admission, create controller
idempotency/outcome rows, consume mutation/registry budget, or create mutation receipts. Every
observation/page binds authority pins, the exact read operation, query ID/hash, non-bearer read policy
ref/hash, as-of batch and global
heads, cursor range/limit/count, page hash, full collection root, and observation time/hash. The only
permitted write is an independent security access-audit record outside the controller ledger and hashes.

## Owner Lifecycle Boundary

Owner execution lifecycle is limited to owner-generated dispatch/effect/completion observations for the
original owner execution IDs. Completion items contain execution ID, terminal owner status, receipt ref/hash,
owner completion time, and a secret-free output/effect hash or failure reason code. Collection readback
contains only count/root/head and bounded pages. These facts do not assert or change scenario review
results, evidence sufficiency, lifecycle/production credit, release gates, child/learner facts, or any other
business conclusion. Caller-submitted business lifecycle hashes are not accepted or signed.

## Capacity Delta Ledger

Every mutation/owner event receipt names all five deltas, including zeros:

`active_claim_count`, `active_reserved_execution_count`, `lifetime_logical_unit_count`,
`lifetime_task_id_count`, and `lifetime_execution_id_count`.

- ordinary/reconciliation claim: active claims `+1`; renew `0`; release/expiry/terminal claim cleanup `-1`;
- open generation: lifetime logical units `+N`, other counters `0`;
- reserve: active reserved executions `+N`, lifetime task IDs `+N`, lifetime execution IDs `+N`;
- seal, client commit, dispatch, effect start, and partial completion: all deltas `0`;
- completed, quarantined, reconciled-completed, or reconciled-unresolved: active reserved executions `-N`
  exactly once, plus active claim `-1` only when one remains;
- lifetime counts/roots never decrement or delete entries.

Global before/after snapshots must equal these deltas and their collection roots. Exact retry returns the
original deltas but does not apply them again. The batch event `fact_root` equals the committed result
snapshot hash; the global event `fact_root` equals the matching after-global admission or uniqueness root.

## Threat Matrix

| Threat | Required control |
| --- | --- |
| caller selects namespace/profile | server-side registration and exact pin comparison |
| changed-request replay | command/idempotency uniqueness plus canonical request hash conflict |
| timeout creates duplicate dispatch | request-outcome readback and exact retry with one receipt/outbox row |
| stale or late writer | owner time, lease, strict fence, batch/global CAS |
| recovery grant becomes authority | policy ref separate from real owner reconciliation claim |
| reserve/seal crash creates replacements | immutable original IDs, separate CAS, tombstone/generation rules |
| effect precedes authority | dispatch record/events/refs-only outbox commit before worker visibility |
| repeated queue delivery | worker idempotency by dispatch/execution ID; no physical exactly-once claim |
| receipt forgery/downgrade | opaque-only pinned resolver, exact canonical bytes, no signed fallback |
| unbounded receipt/history | roots/counts in receipts and bounded fixed-head pagination |
| product or child data leakage | refs/hashes only, strict unknown-key decoder, scenario-boundary scan |
| credential leakage | environment-injected transport; no secret or secret-derived field/hash |
| capacity/registry exhaustion | hard descriptor limits, explicit active counts, append-only lifetime roots, fail closed |

## Source-Lock Coverage

The aggregate source lock continues to cover all workflow-contract TypeScript and reference-validator
TypeScript. Canonical golden vectors live in `conformance/vectors/batch-execution-control-v1.json`. BC0-D
creates one release manifest that records:

- contract-bearing Git revision;
- aggregate source hash;
- vector file path and SHA-256;
- capability family/version and canonicalization profile.

The evidence commit pins that release manifest. It does not introduce a second aggregate contract hash.
