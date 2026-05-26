# Workflow architecture matrix

## Purpose
This matrix aligns the workflow base modules with product consumption surfaces.
It is the v0 contract shape for modular scenario development.

The template should let new concrete workflows plug in through stable
identities, state, actions, surface adapters, presenters, domain context refs,
and handoffs. Product surfaces can evolve independently only if they continue to
consume the same contracts.

## Two-Layer Model

Layer 1 is the workflow contract that every concrete workflow implementation
must provide:

| Contract module | Concrete implementation owns | Does not own |
|---|---|---|
| `Scenario registry` | `Scenario` canonical records, manifest publication, manifest hash, launch phase, enablement, TS registry validation | Scenario business semantics, product-specific UX, canonical domain object implementation |
| `Workflow ledger` | `Capability`, `Entrypoint`, `WorkflowVersion`, `Run`, `Step`, `Artifact`, `Approval`, lifecycle state, canonical writes | UI rendering, downstream publication, RAG indexing, notification delivery |
| `Surface presenters` | Safe DTOs for chat, mobile, web, forum, RAG, notification, admin; exposure level downgrade; action hints | Durable writes, permission decisions from projection, downstream side effects |
| `Handoff ledger` | Handoff request/receipt identity, source refs, expected versions, idempotency, downstream owner status | Public draft generation, forum routing, indexing, knowledge curation, push delivery |
| `Governance gates` | Scenario/capability enablement, version publication, exposure policy, action policy, minimal evidence log, rollback, PBR/permission hook points | User-editable DAGs, unrestricted plugin marketplace, direct downstream mutation |

Layer 2 is the product consumption surface:

| Surface | Primary job | Must use |
|---|---|---|
| `chat_workflow_control` | Collect lightweight scenario facts, collect run start requirements, start or user-drive workflow commands with strong confirmation | Scenario registry, Workflow ledger, Surface presenters, Action contract |
| `chat_dashboard_summary` | Summarize dashboard state at the user's request or in controlled chat context | Surface presenters, dashboard-safe projection/summary API |
| `chat_citation` | Cite eligible workflow-derived sources | Handoff ledger, Governance gates, RAG/knowledge downstream APIs |
| `web_domain_workbench` | Maintain domain context through platform domain APIs and contract-declared internal APIs | Canonical domain registry, Scenario registry, Domain context resolver |
| `web_run_workbench` | Handle in-run manual review and step interventions | Workflow ledger, Domain context resolver, contract-declared internal APIs |
| `mobile_dashboard` | Show attention cards, status, safe previews, and lightweight confirmations | Workflow ledger, Surface presenters, Action contract |
| `forum_publication` | Publish only accepted public-ready drafts | Handoff ledger, downstream public draft/forum owner |
| `rag_knowledge` | Retrieve/index only accepted eligible sources | Handoff ledger, downstream RAG/knowledge owner |
| `notification_push` | Deliver minimal lifecycle prompts | Handoff ledger, downstream notification owner |
| `admin_operator` | Govern scenarios, versions, recovery, policy, rebuilds | Scenario registry, Workflow ledger, Governance gates |
| `worker_runtime` | Execute steps and reconcile results into the ledger | Scenario registry, Workflow ledger, Handoff ledger, Governance gates |

## Domain Context Contract

Canonical domain objects are platform-level objects. They are not owned by a
concrete workflow. The template defines only the domain context contract: how a
run references, resolves, freezes, records evidence for, and reuses those
objects.

Host products provide a `canonical_domain_registry` and implement a
`DomainContextResolver`. The MVP implementation may be generic and JSON-schema
backed, but workflow contracts must already treat domain objects as externally
owned canonical objects.

| Data class | Meaning | Owner | Main consumers |
|---|---|---|---|
| `canonical_domain_object` | Cross-scenario object with its own schema, lifecycle, version, relation, permission, and evidence trail | Platform/domain registry | Web domain workbench, Admin, resolver |
| `domain_context_ref` | Workflow-facing stable reference to a domain object or scenario-local MVP record | Workflow contract; object owner remains external | Concrete Workflow API/adapter, chat control, web workbenches, worker runtime |
| `context_snapshot` | Frozen safe view of resolved context at run start or step execution time | Workflow ledger, produced through resolver | Run replay, evidence, worker runtime, presenters |
| `context_binding` | Durable record that a run, step, artifact, approval, or handoff depended on a context ref/snapshot/version | Workflow ledger | Evidence, replay, deletion impact analysis, downstream handoff gates |
| `run_start_requirements` | Parameters and context refs needed to start one workflow run | Workflow ledger | Chat workflow control, web domain workbench, web run workbench |
| `step_interventions` | Human correction, override, or manual work during a running workflow | Workflow ledger command/event | Web run workbench |

Chat does not perform `step_interventions` and does not proactively remind users
about intervention tasks. Chat may summarize dashboard state. Users choose where
to operate next.

Cross-workflow data sharing happens through domain context refs, context
snapshots, context bindings, and domain events, not by reading another
workflow's private run/step state.

`namespace` identifies the canonical owner of the object. It is not the same as
the consuming scenario. `consumer_scenario_key` is optional context used for
policy, presentation, and manifest validation when a workflow consumes the
object.

```txt
canonical_domain_registry
  -> DomainContextResolver
  -> workflow A records context binding/snapshot
  -> domain event / outbox
  -> workflow B resolves allowed refs through resolver and policy gates
```

Minimum ref shape:

```ts
type DomainContextRef = {
  // canonical owner namespace, not the consuming scenario
  namespace: string;
  // optional consumer context for policy and presentation
  consumer_scenario_key?: string;
  object_type: string;
  object_id: string;
  version?: number;
  owner_scope: "workspace" | "organization" | "platform" | "external";
  canonical_ref?: {
    service: string;
    object_type: string;
    object_id: string;
  };
};
```

A concrete workflow must never read the canonical domain registry directly.
Runtime code calls a resolver contract:

```ts
type DomainContextResolver = {
  resolve(input: {
    refs: DomainContextRef[];
    purpose:
      | "workflow_start"
      | "step_execution"
      | "artifact_generation"
      | "handoff";
    actor_id?: string;
    workspace_id: string;
    expected_versions?: Record<string, number>;
  }): Promise<Array<{
    ref: DomainContextRef;
    resolved_version: number;
    snapshot_id: string;
    snapshot_schema_version: number;
    safe_payload: unknown;
  }>>;
};
```

## Surface Contract Matrix

| Surface | reads | actions | handoffs | forbidden |
|---|---|---|---|---|
| `chat_workflow_control` | Enabled scenarios/capabilities, safe labels, input schema summaries, lightweight `domain_context_ref` summaries, `run_start_requirements`, current action availability when the user explicitly asks to act | `start_run`, `submit_start_requirements`, limited context-ref selection/update through concrete workflow API/adapter where policy allows, user-initiated `approve` / `reject` / `confirm` with strong confirmation and canonical reread | None by default | No `step_interventions`; no proactive intervention reminders; no internal Web/Admin API calls; no direct domain registry mutation; no light hint starts a run; no private artifact body; no action write without expected version and strong confirmation |
| `chat_dashboard_summary` | Dashboard-safe summary DTOs, counts, safe status labels, attention totals, high-level unavailable reasons | Open target links only; no durable workflow mutation | None | No approve/reject from summary itself; no intervention reminders; no private bodies; no projection-derived permission decisions; no detailed task assignment that steers the user's next action |
| `chat_citation` | Accepted downstream source refs, citation presenter output, source trust/provenance labels | Open cited source | Consumes `indexing` / knowledge accepted receipts | No citation from projection; no citation from private/unreviewed workflow artifacts; no treating workflow output as human fact; no skipped PBR/lifecycle/deletion checks |
| `web_domain_workbench` | Strong-read domain registry objects through Domain registry API, schema/validation state, contract-declared input contracts, history/provenance where authorized | Create/update/validate/import/merge/archive canonical or scenario-local domain objects through Domain registry API; manage sharing consent/policy inputs; prepare run start requirements | Usually none; may create refs later used by server-side handoff policy | No private workflow identity; no direct projection write; no bypass of permission/evidence/PBR; no workflow step override unless routed to `web_run_workbench`; no workflow-owned domain object store |
| `web_run_workbench` | Strong-read run detail, step detail, artifacts, approvals, target `domain_context_ref` snapshots/bindings, intervention history | `step_intervention`, manual review, override, retry, cancel, suppress, approve/reject/confirm, create handoff where allowed | `public_draft`, `notification`, `external_delivery`; indexing is service-owned unless explicitly admin/policy driven | No undocumented internal API; no becoming user workflow builder; no prompt/tool/provider editing; no raw private data in projection/outbox/handoff/evidence; no hidden state outside ledger/context bindings |
| `mobile_dashboard` | Display projection cards, safe run summaries, L0-L2 artifact previews, action availability hints, downstream status labels | Lightweight confirmations such as approve/reject/confirm/retry/cancel/create public-draft handoff where available, always after canonical reread | `public_draft` only when action availability allows; notification is downstream-owned; indexing is service-owned | No durable projection mutation; no offline automatic replay; no L3/L4 bodies; no direct knowledge-base indexing action; no direct indexing handoff; no private body in cached state |
| `forum_publication` | Public draft downstream refs, source labels, provenance refs | Publish through forum/public draft owner after user confirmation | Consumes `public_draft` accepted/completed receipt | No direct workflow artifact publication; no safe preview as public body; no raw workflow artifact read for publication |
| `rag_knowledge` | Accepted indexing source refs, provenance refs, lifecycle/PBR state through downstream owner | Index, chunk, embed, promote, invalidate inside downstream owner | Consumes `indexing` accepted/completed receipts; may receive automatic server-created requests based on sharing consent and policy | No direct raw artifact indexing; no dashboard-triggered knowledge-base indexing action; no private artifacts; no stale/deleted/withdrawn source retention |
| `notification_push` | Notification handoff refs, safe labels, reason codes, target ids, timestamps | Delivery, read state, retry, device token handling inside downstream owner | Consumes `notification` request/receipt | No body/private data/prompt/provider payload; no workflow lifecycle mutation; no push payload as state authority |
| `admin_operator` | Strong scenario/capability/version/run/evidence/handoff reads; policy and manifest state | Publish/disable/rollback/rebuild/replay by evidence-backed commands; inspect handoff failures by refs; manage service-level sharing policies | Inspect/replay handoffs by refs; admin-created handoff only when policy allows | No direct DB edits; no direct projection/downstream mutation; no private body access by default; no user DAG/prompt/toolchain editing |
| `worker_runtime` | Scenario manifest hash, run/step canonical state, input refs, domain context refs resolved through `DomainContextResolver`, policy decisions | Claim/write step lifecycle, produce artifacts, request approval, emit bodyless events, record context bindings/snapshots, create automatic handoff requests where policy allows | Service-created `indexing` and `notification`; `public_draft` only when triggered by allowed user/product action; receipts are downstream-owned | No downstream direct writes; no raw body queue payload; no business state from BullMQ; no direct domain registry reads; no reading another workflow's private run state instead of shared context refs |

## Shared Contracts

### Identity contract
Every surface uses the same ids:

```txt
scenario_key
capability_key
entrypoint_key
workflow_version_id
run_id
step_id
artifact_id
approval_id
handoff_id
domain_context_ref
context_snapshot_id
```

Scenario modules may require domain object ids, but workflow stores only context
refs, snapshots, and bindings. They must not redefine workflow identity or
pretend scenario-local records are cross-scenario canonical objects.

### State contract
All surfaces consume the same state vocabulary:

- scenario status
- capability enablement
- run status
- step status
- artifact state and exposure level
- approval status
- action availability
- handoff request/receipt status
- domain context object version
- context binding and snapshot version

Projection may cache display state, but confirmation and mutation paths must
reread canonical state.

### Action contract
UI renders `ActionAvailability`. Writes go through standard commands with:

- target type/id
- expected version
- action class
- reason code/text
- client surface
- actor/workspace ids
- idempotency/correlation/trace ids

Chat actions are allowed only when user-initiated and strongly confirmed. Chat
summary output is not an action surface.

Internal Web/Admin APIs are allowed only when declared by the workflow contract
artifact and only if they write canonical facts using the same action rules.

### Exposure contract
All presenters must obey L0-L4 exposure levels:

| Level | Meaning | Default surfaces |
|---|---|---|
| L0 | Metadata only | dashboard, notification, admin list |
| L1 | Safe summary | chat dashboard summary, dashboard, notification |
| L2 | Safe preview | mobile, web, public-draft entry |
| L3 | Strong-read detail | web workbench, authorized admin exception view |
| L4 | Not previewable | no body surface |

Raw private input, original file URLs/object keys, prompt bodies, provider
payloads, vectors, secrets, tokens, and private assessment/feedback bodies are
never L0-L2 payloads.

### Handoff contract
The concrete workflow implementation creates handoff requests and records
receipts according to this template. Downstream owners implement the actual
behavior.

| Handoff type | Downstream owner | Base sends | Downstream owns | Who may request |
|---|---|---|---|---|
| `public_draft` | public draft/forum module | source refs, expected versions, purpose, actor/workspace/trace metadata | reread, PBR, redaction, privacy, risk, user confirmation, forum publication | user/product action from mobile/web/chat control where action availability allows |
| `indexing` | RAG/knowledge module | source refs, expected versions, retrieval purpose, sharing policy refs | lifecycle, permission, PBR, chunking, embedding, invalidation, trust labels | service/worker policy based on sharing consent and artifact eligibility |
| `notification` | notification module | target refs, reason code, safe labels, timestamps | inbox/read state, push rendering, delivery retry, device tokens | service/worker lifecycle policy |
| `external_delivery` | product-specific downstream owner | source refs, destination refs, expected versions | destination authorization, delivery side effects, rollback, receipts | web/admin/product action where policy allows |

Handoff payloads must not include source body content.

### Downstream information matrix
Downstream systems receive routing signals and refs. They must reread canonical
state through their owner API/repository before making decisions or producing
side effects. Outbox payloads are not data transfer objects.

| Downstream owner | Trigger signals | Canonical reread source | Required signal fields | Forbidden payload | Invalidation behavior |
|---|---|---|---|---|---|
| `projection` | `workflow.run.*`, `workflow.step.*`, `workflow.approval.*`, `workflow.artifact.*`, `workflow.handoff.*`, lifecycle invalidations | Workflow ledger plus surface presenters | `aggregate_type`, `aggregate_id`, `aggregate_version`, `workspace_id`, `actor_id`, `event_id`, `reason_code?` | Private bodies, permission/PBR detail, prompts, provider payloads, object keys | Upsert, tombstone, or delete projection rows by aggregate refs; projection never becomes authority. |
| `public_draft_forum` | `workflow.handoff.requested` with `handoff_type=public_draft`, accepted/completed receipts | Handoff ledger, artifact/content refs, privacy checks, public draft owner | `handoff_id`, `handoff_type`, `source_refs`, `expected_versions`, `requested_purpose`, `actor_id`, `workspace_id` | Raw artifact body, private inputs, pre-redacted public body, routing choices | If source is deleted/withdrawn/hidden or version changes, invalidate draft/request and require reread. |
| `rag_knowledge` | `workflow.handoff.requested` with `handoff_type=indexing`, lifecycle invalidations, knowledge receipts | Knowledge owner, artifact/content refs, retrieval policy, privacy/PBR, generation records | `handoff_id`, `source_refs`, `expected_versions`, `requested_purpose`, `sharing_policy_ref?`, `reason_code?` | Raw private artifact, unreviewed body, prompt/provider payload, vectors | Mark sources/chunks/embeddings stale or invalidated; retrieval must reject stale/deleted/withdrawn sources. |
| `notification_push` | `workflow.run.updated` with completed/failed state, `workflow.approval.requested`, `workflow.artifact.created/updated`, handoff unavailable signals | Notification owner rereads source facts and writes canonical notification | `target_type`, `target_id`, `reason_code`, `actor_id`, `workspace_id`, `deep_link_ref?` | Private bodies, protected subject data, prompt/provider payload, device tokens | Notification owner owns read state, delivery retry, and cancellation; push payload is never state authority. |
| `search` | Public/eligible content or artifact lifecycle changes, publication receipts | Content/forum/public draft owner, or knowledge owner for indexed sources | `source_refs`, `source_revision_id?`, `visibility`, `invalidation_reason?`, `workspace_id` | Source body in outbox, private URLs, permission internals | Remove or reindex by source refs after reread; search is disabled for stale or non-public sources. |
| `vector_embedding` | Accepted knowledge chunks, embedding rebuild requests, source invalidations | Knowledge chunks/embeddings and retrieval policy | `chunk_id?`, `source_id?`, `embedding_profile_key?`, `invalidation_reason?` | Embedding vectors in outbox, raw chunk body outside knowledge owner | Recompute or invalidate embeddings by chunk/source refs; deleted source clears vectors and caches. |
| `ppr_recommendation` | Personalization events, forum/content lifecycle invalidations, projection invalidation requests | Personalization event/edge/snapshot owner | `personalization_event_id?`, `target_type`, `target_id`, `purpose`, `consumer`, `invalidation_reason?` | Permission decisions, private body, ranking rationale as policy | Aggregate or invalidate ranking edges/snapshots; PPR never authorizes visibility. |
| `admin_replay` | Dead letter, rebuild request, evidence record, handoff exception | Outbox, evidence log, canonical owner repositories | `event_id`, `aggregate_type`, `aggregate_id`, `trace_id`, `correlation_id`, `reason_code?` | Private bodies by default, secrets, prompt/provider bodies | Replay from canonical state and idempotency keys; admin repair writes separate evidence. |

### Event registry boundary
Generic workflow events are the product-surface contract. Scenario-specific
events may exist for internal implementation, but chat, mobile, forum, RAG,
notification, search/vector, and PPR consumers must not require
scenario-specific event names.

| Registry layer | Examples | Who may consume | Rule |
|---|---|---|---|
| Platform events | `content.*`, `public_draft.*`, `publication.request.*`, `forum.*`, `knowledge.*`, `notification.*`, `personalization.*`, `projection.invalidate.requested`, evidence/audit events | Platform owners and downstream systems | Owned by the corresponding platform module, not by workflow. |
| Standard workflow events | `workflow.run.created`, `workflow.run.updated`, `workflow.step.*`, `workflow.approval.*`, `workflow.artifact.*`, `workflow.handoff.*`, `workflow.context.*`, `workflow.evidence.recorded` | Shared product consumers and downstream systems | Stable cross-scenario contract. Consumers reread canonical workflow state. |
| Scenario internal events | `{scenario_key}.{capability_key}.{aggregate}.{verb}` | Concrete workflow internals, tests, migration bridges | Must be declared by manifest or TS contract and must not become a shared consumer dependency. |

### Event ownership registry
Event ownership follows the canonical aggregate owner. The same owner that
writes the aggregate state emits the corresponding outbox signal in the same
transaction whenever possible.

| Event family | Producer owner | Write boundary | Allowed consumers | Forbidden consumers |
|---|---|---|---|---|
| Platform events | Corresponding platform owner | Owner command transaction | Owner downstreams and explicitly declared integration readers | Workflow modules directly producing them except through owner APIs or handoff receipts |
| `workflow.run.*` | Workflow ledger command/service | Same transaction as `Run` write | Projection, notification source reader, admin replay | Scenario-specific downstream side effects |
| `workflow.step.*` | Workflow worker/ledger write path | Same transaction as `Step` write | Projection, admin replay | Notification, RAG, search, vector, or PPR direct side effects |
| `workflow.approval.*` | Workflow approval command/service | Same transaction as `Approval` write | Projection, notification source reader, admin replay | Chat dashboard summary direct writes or scenario-internal consumers as shared dependencies |
| `workflow.artifact.*` | Workflow artifact repository/service | Same transaction as `Artifact` write | Projection, notification source reader, handoff policy evaluator, admin replay | RAG/search/vector direct indexing without handoff |
| `workflow.handoff.*` | Handoff ledger service | Same transaction as `Handoff` write/receipt | Public draft/forum, RAG/knowledge, notification, admin replay | Workflow directly writing forum, knowledge, vector, search, or push systems |
| `workflow.context.*` | Context binding/resolver owner | Same transaction as binding/rebind write | Workflow replay, admin, downstream invalidation evaluator | Chat/mobile direct context-detail consumption |
| `workflow.evidence.recorded` | Evidence log writer | Same transaction as evidence append where possible | Admin/replay/compliance tooling | Projection, chat, mobile, RAG, search, vector, or PPR by default |
| Scenario internal events | Scenario module | Scenario-owned transaction/handler | Scenario internals, deterministic tests, migration bridge | Shared product consumers and downstream systems |

During migration, a concrete scenario may emit both scenario internal events and
standard workflow events. Shared consumers still subscribe only to platform
events and standard workflow events. Downstream side effects must be idempotent
and must not treat event payloads as the business body.

The standard registry uses `workflow.run.updated` for terminal states. Consumers
inspect canonical `run.status` after reread instead of subscribing to separate
`workflow.run.completed` or `workflow.run.failed` events.

Standard workflow event payloads use `WorkflowSignalPayload`: `body=no_body`,
`pii=no_pii`, `signal_version=1`, aggregate refs, source refs, expected
versions, purpose/reason, and trace metadata. Payloads do not include canonical
status fields or presenter output.

### Sharing consent and knowledge policy
Dashboards must not present indexing as a direct knowledge-base action. Indexing is a
server-side policy decision.

Products may expose a higher-level consent or setting such as:

```txt
allow_anonymized_learning
contribute_to_shared_knowledge
data_sharing_consent
```

That setting is policy input, not an indexing command. The server still checks
artifact eligibility, lifecycle, privacy, PBR, deletion state, and downstream
acceptance before creating an `indexing` handoff.

### Presenter contract
Scenario modules supply presenters, but presenters emit stable surface DTOs.
Surfaces should not need to understand canonical domain schemas or
scenario-private payloads.

Presenter outputs must include:
- source refs
- safe labels
- exposure level
- action availability where the surface can act
- unavailable reason codes
- provenance/trust labels where relevant
- no raw private bodies unless L3 is explicitly authorized

## Acceptance Rule
A scenario is plug-in ready only when the matrix can be filled without adding a
new product-surface API. If a scenario requires a new consumer path, the base
contract must be extended first, then the scenario can adopt it.
