# Workflow v0 convergence

## Purpose
This document freezes the current base-template direction before implementation
details spread across scenario modules.

The goal is a controlled plug-in foundation: a new scenario can be developed as
a module, validated against the same ledger/API/handoff contracts, and connected
without redefining product surfaces.

This repository is a template and contract source. It is not a deployed runtime
or central workflow service. A concrete workflow implementation adopts these
contracts and exposes standard surface adapters/API shapes to the host product.

## Decisions

### 1. Scenario is a first-class database object
`Scenario` is canonical state, not just a folder name or manifest key.

Minimum canonical fields:
- `scenario_id`
- `scenario_key`
- `display_name`
- `status`: `draft`, `pilot`, `active`, `disabled`, `archived`
- `owner_team`
- `launch_phase`
- `allowed_user_classes`
- `current_manifest_version`
- `current_manifest_hash`
- `policy_version`
- `aggregate_version`
- `metadata_json`
- `created_at`, `updated_at`, `published_at`, `archived_at`

The YAML manifest, or an equivalent TypeScript contract artifact, declares
expected module shape. A concrete workflow implementation may publish that
contract into its own canonical state. Runtime APIs in the concrete workflow
reject unknown, disabled, or contract-mismatched scenarios.

### 2. Internal APIs are allowed, but product consumption stays unified
Scenario modules may expose internal custom APIs for Web/Admin operations such
as heavy editors, diagnostics, import tools, migration previews, and advanced
detail panels.

Internal API rules:
- namespace under `/api/internal/scenarios/{scenario_key}/...` or an equivalent
  host-only route group
- declare every route in the scenario manifest
- allow only Web/Admin/operator clients
- use canonical authorization, evidence logging, idempotency, and outbox rules
- never become the API consumed by chat, mobile dashboard, forum, RAG,
  notification, public links, or external clients
- never redefine workflow run, step, approval, artifact, or handoff identity

Shared product surfaces use concrete workflow surface adapters or
`/api/workflow/*`-equivalent routes. Chat connects to a concrete workflow's
standard chat adapter, not to this template repository.

### 3. Contract artifact plus TS handler registry
YAML is the default declarative module contract. A concrete workflow may use an
equivalent TypeScript contract constant when YAML adds no runtime value.
TypeScript registries are the executable binding.

The host loads:
- `scenario.manifest.yaml`
- `handlerRegistry`
- `actionRegistry`
- `presenters`
- `policies`
- `repositories`

Activation or CI validation fails if a contract handler key has no TS binding,
if a TS binding is not declared by the contract, or if registry capabilities do
not match the published contract hash.

### 4. The template defines handoff contract only
The template does not implement forum publishing, RAG indexing, knowledge
curation, notification dispatch, or external delivery. It defines how a concrete
workflow creates a handoff request and how a downstream owner records a receipt.

Workflow handoff is always by canonical refs:
- source refs: run, step, artifact, approval, domain context ref/snapshot
- expected versions
- handoff type and requested purpose
- client surface
- actor/workspace/trace/correlation/idempotency metadata

Downstream modules own reread, permission/PBR, redaction, privacy, safety,
delivery, indexing, publication, deletion, rollback, and final receipts.

### 5. Canonical domain registry is platform-owned
Canonical domain objects are not part of the workflow base. A host product must
provide a platform/domain registry for cross-scenario objects, schemas,
relations, versions, lifecycle, permission, and domain evidence/outbox.

Workflow consumes those objects only through the domain context contract:
- `DomainContextRef`: stable workflow-facing reference where `namespace`
  identifies the canonical owner and `consumer_scenario_key` is optional
  consuming context
- `DomainContextResolver`: host-implemented resolver and policy gate
- `ContextSnapshot`: frozen safe view used by a run or step
- `ContextBinding`: ledger record of which workflow object depended on which
  context ref/snapshot/version

The MVP host may implement the registry as a generic JSON-schema-backed object
store. That is an implementation choice, not workflow semantics. If a domain
object later moves to a specialized canonical owner, concrete workflow adapters
and APIs should not change.

### 6. MVP uses a minimal evidence log, not a full audit product
The template requires concrete workflows to append minimal evidence records for
P0/P1 authoritative writes and high-risk operations. This keeps compliance,
debugging, and replay explainability without requiring a staffed audit console
or manual review workflow during MVP.

Evidence records are Postgres canonical records containing ids, versions,
reason codes, policy/resolver keys, actor/workspace ids, and trace/correlation
metadata. They must not contain private bodies, prompt/provider payloads, object
keys, vectors, secrets, or full before/after snapshots.

Required evidence scope:
- irreversible or public-impacting commands such as delete, withdraw, suppress,
  publish, permission change, sharing-consent change, and admin repair
- approve/reject/confirm commands that change workflow state
- conflict resolution actions and denied resolution attempts
- handoff request/receipt transitions
- domain context mutation or rebinding that can affect multiple workflows

Out of MVP scope:
- audit dashboard, review queue, reporting, rule engine, and staffed manual
  audit workflow
- evidence records for ordinary reads, UI clicks, presenter renders,
  display-only projection refreshes, or every worker heartbeat

Evidence log and outbox are separate. Evidence records explain what
authoritative action happened and why. Outbox events reliably notify downstream
systems. A command may write both in the same transaction.

### 7. Downstream systems get signals, not payload-owned facts
Outbox is the reliable distribution layer. It is not a content transport layer
and not a second API contract for downstream systems.

Concrete workflow events may tell downstream owners what changed and which refs
to reread:
- aggregate type/id/version
- actor/workspace ids
- source refs and expected versions
- handoff id/type and requested purpose
- target type/id
- reason code or invalidation reason
- correlation/causation/trace ids

Downstream owners must reread canonical state before writing projection rows,
notifications, public drafts, search documents, knowledge chunks, embeddings,
recommendation edges, or admin replay output.

Outbox payloads must never include private bodies, public draft bodies, raw
artifact data, prompt/provider payloads, memory text, object keys, signed URLs,
vectors, permission/PBR internals, billing details, or full before/after
snapshots.

Generic workflow/handoff/lifecycle events are the shared product-surface
contract. Scenario-specific events may exist for internal implementation, but
shared chat/mobile/forum/RAG/notification/PPR consumers must not require them.

### 8. Event registry has three layers
The event registry is deliberately split so new scenarios do not expand product
consumer contracts.

Platform events are owned by the host product outside workflow, for example
`content.*`, `public_draft.*`, `publication.request.*`, `forum.*`,
`knowledge.*`, `notification.*`, `personalization.*`,
`projection.invalidate.requested`, and evidence/audit events.

Standard workflow events are the only workflow event layer that shared product
surfaces and downstream owners may depend on:

```txt
workflow.run.created
workflow.run.updated
workflow.step.started
workflow.step.completed
workflow.step.failed
workflow.step.retry_requested
workflow.step.manual_review_required
workflow.approval.requested
workflow.approval.resolved
workflow.artifact.created
workflow.artifact.updated
workflow.artifact.deleted
workflow.artifact.expired
workflow.handoff.requested
workflow.handoff.receipt_recorded
workflow.handoff.invalidated
workflow.context.bound
workflow.context.rebind_required
workflow.context.rebound
workflow.evidence.recorded
```

Scenario internal events use
`{scenario_key}.{capability_key}.{aggregate}.{verb}` and may support concrete
implementation internals, deterministic tests, or migration bridges. They must
not be consumed directly by chat, mobile, forum, RAG/knowledge, notification,
search/vector, or PPR.

Run terminal states are represented by `workflow.run.updated` plus canonical
`run.status`; the standard registry intentionally avoids
`workflow.run.completed` and `workflow.run.failed`.

### 9. Standard workflow event payloads are refs-only
Standard workflow event payloads use a single `WorkflowSignalPayload` shape:

```txt
body = no_body
pii = no_pii
signal_version = 1
aggregate refs
source refs
expected versions
handoff type / requested purpose
reason code / invalidation reason
client surface
```

The standard event envelope already carries event type, aggregate type/id,
aggregate version, actor/workspace ids, correlation/causation/trace ids, and
idempotency key. Payloads should not duplicate that data except for convenience
refs such as `run_id`, `step_id`, `artifact_id`, `approval_id`, `handoff_id`,
`context_binding_id`, or `evidence_id`.

Payloads must not include canonical status fields, presenter summaries, private
bodies, prompt/provider payloads, vectors, object keys, signed URLs, permission
internals, or full before/after snapshots. Consumers reread canonical state and
derive display or downstream behavior through presenters and owner policies.

Default idempotency key:

```txt
{event_type}:{aggregate_id}:{aggregate_version}
```

If one aggregate version emits multiple events of the same type, use a
deterministic suffix such as `reason_code`, `handoff_type`, or `target_id`.
Random UUID idempotency keys are not replay-safe.

### 10. Event ownership follows canonical aggregate ownership
The base owns the event ownership contract, not a runtime event bus. A concrete
workflow emits standard workflow events from the same owner that writes the
canonical aggregate:

| Event family | Producer owner | Shared consumer stance |
|---|---|---|
| Platform events | Corresponding platform owner | Workflow triggers only through owner APIs or handoff receipts. |
| `workflow.run.*` | Workflow ledger command/service | Shared consumers reread run state. |
| `workflow.step.*` | Workflow worker/ledger write path | Shared consumers reread step state; no direct downstream side effects. |
| `workflow.approval.*` | Workflow approval command/service | Shared consumers reread approval state. |
| `workflow.artifact.*` | Workflow artifact repository/service | Indexing/search/vector still require handoff or downstream owner policy. |
| `workflow.handoff.*` | Handoff ledger service | Downstream owners accept/reject through receipts. |
| `workflow.context.*` | Context binding/resolver owner | Consumers use refs and invalidation, not raw context details. |
| `workflow.evidence.recorded` | Evidence log writer | Evidence is admin/replay/compliance oriented by default. |
| Scenario internal events | Scenario module | Shared consumers must not depend on them. |

Manifest validation should reject scenario internal events in shared consumer
allowlists and should require deterministic idempotency for every event family.

### 11. Activation is validator-enforced
The base defines validation rules and activation gates; the host product
implements them in CI, module registration, or admin dry-run commands.

The validator consumes the scenario manifest or equivalent TS contract,
registries, host scenario records, domain resolver registry, downstream owner
registry, standard event registry, and projection review records. It emits a
validation report with rule id, severity, path, owner, and remediation.

Fatal rules block pilot/GA activation. Migration bridges are allowed only as
timeboxed warnings and cannot become shared product-surface contracts. The key
fatal checks are:
- canonical `Scenario` record and stored contract hash/version
- complete handler, action, presenter, policy, internal API, and test bindings
- Web/Admin-only internal APIs
- chat excluded from `step_interventions`
- declared handoffs with downstream owner, policy key, and receipt requirement
- event producer/consumer ownership and refs-only payload policy
- no scenario internal events in shared consumer allowlists
- evidence records for P0/P1 authoritative writes
- projection review before projected field changes
- deterministic tests and one journey harness

### 12. Registry loading is host-owned and fail-fast
The base does not load modules at runtime. It defines the loader contract so host
products can implement the same registration behavior.

The host loader registers approved modules at deploy or application boot, after
validation passes. It never executes YAML as code; YAML or TS contracts declare
keys and TypeScript registries provide executable handlers, actions,
presenters, policies, and internal API bindings.

Runtime dispatch uses canonical workflow identity plus stored contract hash:

```txt
scenario_key
capability_key
entrypoint_key
workflow_version_id
step_key
handler_key
contract_hash
```

Worker dispatch and surface routing fail fast if a handler, action, presenter,
policy, or internal API binding cannot be resolved from the validated registered
descriptor. Disabled modules remain available only for replay, rollback, or
controlled migration; they cannot start new runs through normal product
surfaces.

### 13. Standard API closure is the product contract
Every concrete workflow exposes the same minimal API or adapter closure:
discovery, start requirements, run lifecycle, action command, artifact preview,
handoff request/receipt, dashboard summary, chat citation, admin governance, and
worker runtime ports.

REST, RPC, and in-process ports are implementation choices. The contract is the
stable surface shape, command envelope, canonical identity, expected-version
write behavior, and presenter output. Product surfaces must not depend on
scenario-private APIs, repositories, handlers, or tables.

Internal scenario APIs may extend only Web/Admin operation surfaces. They can
support heavy editors, diagnostics, import previews, or manual correction, but
they cannot replace the standard closure for chat, mobile, forum, RAG,
notification, public links, external clients, or worker dispatch.

### 14. Implementation skeleton is a scaffold, not runtime
The base can define a host implementation skeleton so teams do not invent
different layouts for each scenario. The skeleton covers contract types,
validator, registry loader, API routes, handoff service, worker runtime, and
journey harness.

The skeleton remains non-runtime:
- contract packages export types and pure helpers only
- host runtime owns repositories, dependency injection, HTTP/RPC routing,
  workers, outbox, evidence, handoff service, and CI/admin commands
- scenario modules own business handlers, actions, adapters, presenters,
  policies, fixtures, and deterministic journeys
- downstream owners own public draft/forum, RAG/knowledge, notification,
  search/vector, PPR, and replay side effects

The implementation skeleton is acceptable when a host can scaffold a scenario,
validate it, register it, execute a deterministic journey, and fail fast on
missing bindings without adding new product-surface APIs.

### 15. Scenario readiness is proven by a second scenario
The final v0 sanity check is whether a non-education scenario can use the same
base modules and product surfaces. The base passes only if an education-like
seed scenario and a non-education scenario can both use the same canonical
identity chain, standard API/adapter closure, validator, registry loader,
handoff contract, event registry, and refs-only outbox policy.

The second scenario may add its own manifest, handlers, adapters, presenters,
policies, repositories, fixtures, and journey harness. It must not add new
chat, mobile, forum, RAG, notification, public-link, external client, or worker
dispatch APIs.

See `scenario-readiness-proof.md` for the proof checklist and non-education
scenario sketch.

### 16. V0 readiness requires drift checks
The v0 contract is ready for host implementation only after semantic drift
checks pass. These checks reject base-runtime wording, scenario-specific shared
APIs, shared scenario events, bodyful outbox payloads, direct downstream writes,
chat step interventions, direct dashboard indexing, workflow-owned canonical
domain objects, and executable queue payloads.

See `v0-readiness-checklist.md` for the current readiness pass and
must-not-regress list.

## Reference From The-UniAssist-Entrance-App
The reference project is useful as a workflow-platform pattern, not as a module
to copy directly.

Reusable observations:
- `workflow-platform-api` is the authoritative control API.
- `workflow-runtime` owns the run/node/approval/artifact ledger.
- Postgres/Prisma is the authoritative data plane.
- projection adapters are optional read optimizations and must fall back to
  authoritative APIs.
- `apps/control-console` is an operator surface over the platform API.
- sample scenarios under `docs/scenarios/` are validation fixtures, not product
  vertical definitions.
- connector/runtime bridge integration writes back to the same run ledger and
  does not redefine run, approval, artifact, or callback identity.
- event-subscription handoff records receipts into runtime instead of creating a
  parallel workflow state machine.

Base-template consequences:
- validation scenarios are test fixtures; real scenarios are DB objects plus
  contract-published modules
- external or internal capabilities are ledger extensions, not alternate
  workflow systems
- Web/Admin can be richer than other surfaces, but their writes still reconcile
  through canonical workflow facts
- projection, dashboard, chat, forum, RAG, notification, and downstream delivery
  must never become hidden sources of truth
- chat does not call this template repository; it calls the concrete workflow's
  standard `ChatWorkflowAdapter` or equivalent route group

## Module Acceptance Bar
A scenario is plug-in ready only when:

1. Its `Scenario` record exists and is enabled for the target workspace/user
   class.
2. Its YAML manifest or equivalent TS contract validates and has a published
   hash.
3. Its TS registries bind every declared handler/action/adapter/presenter/policy key.
4. Its internal APIs, if any, are contract-declared and Web/Admin-only.
5. Its workflow starts, steps, approvals, artifacts, actions, context bindings,
   and handoffs use
   shared workflow identities.
6. It resolves canonical domain context only through the host
   `DomainContextResolver`.
7. Its handoff requests contain refs and metadata only, never private bodies.
8. Its deterministic journey harness proves `start -> step -> artifact ->
   surface -> handoff receipt` for at least one happy path.
