# Workflow API contract

## Purpose
This document defines the standard API and adapter shape that every concrete
workflow implementation must expose. This repository is not the runtime service.
Scenarios may add domain-specific commands and internal Web/Admin APIs behind
this contract, but product consumption surfaces must call the concrete
workflow's standard surface adapter/API, not private workflow internals.

The examples use REST because the source product uses REST, but the same command
and response envelopes can be mapped to RPC or in-process adapters if a host
project chooses that.

## API principles
- API paths are scenario-neutral.
- `Scenario` is a first-class canonical object. Concrete workflow runtime APIs
  validate `scenario_key` against Postgres state and the published contract
  hash.
- Command endpoints reread Postgres canonical state before writing.
- Reads may use projection for display lists, but confirmation and detail reads
  must use API/Postgres.
- Every write accepts idempotency, trace, and correlation metadata.
- Every write returns canonical refs, aggregate versions, action availability,
  and outbox ids when applicable.
- Scenario-specific payloads live under `input`, `settings`, or `domain`.
- Canonical domain objects are owned by the platform/domain layer, not workflow.
  Workflow APIs consume them only through domain context refs, resolver calls,
  snapshots, and context bindings.
- Handoff APIs create request/receipt records only. Downstream owners implement
  public draft, forum, indexing, knowledge, notification, or delivery behavior.
- Internal scenario APIs are allowed only for contract-declared Web/Admin
  functions and must not be consumed by chat, mobile, forum, RAG, notification,
  public links, or external clients.

## API ownership boundary

| API family | Owner | Owns | Allowed callers | Writes | Forbidden |
|---|---|---|---|---|---|
| `Domain registry API` | Platform/domain layer | Canonical domain objects, object schemas, relations, lifecycle, snapshots, domain evidence/outbox | Web domain workbench, Admin, `DomainContextResolver`, controlled import/worker paths | Canonical domain registry and domain outbox | Direct workflow DB reads/writes; chat/mobile direct domain mutation |
| `Workflow API / adapter` | Concrete workflow implementation | Scenario, capability, run, step, artifact, approval, action availability, handoff, context binding | Chat workflow control, web run workbench, mobile dashboard, admin, worker runtime | Workflow ledger, context refs/snapshots/bindings, workflow outbox | Canonical domain object mutation; private body exposure to low-trust surfaces |
| `Web internal scenario API` | Scenario module plus host Web/API | Heavy editors, import previews, diagnostics, specialized validation, manual-intervention support | Web domain workbench, web run workbench, admin | Calls Domain registry API for domain writes and Workflow API/adapter for workflow writes; must be contract-declared | Consumption by chat/mobile/forum/RAG/notification; bypassing evidence logging, permission, idempotency, or outbox |
| `Chat API` | Chat/product layer | Chat context, workflow recommendations, start requirements, dashboard summaries, citation checks | Chat UI and controlled agent runtime | Calls concrete workflow `ChatWorkflowAdapter` or equivalent Workflow API only; can submit lightweight start requirements and strong-confirmed approve/reject/confirm | Step interventions, intervention reminders, direct domain mutation, direct indexing |
| `Mobile dashboard API` | Product/workflow presenter layer | Dashboard cards, safe previews, action availability | Mobile app | Display projection plus canonical reread before Workflow API commands | Projection mutation, direct indexing, L3/L4 private body reads |
| `Handoff API` | Workflow handoff ledger plus downstream owner | Handoff request/receipt records | Workflow, downstream owner, admin replay | Workflow creates request/records receipt; downstream owner rereads/gates/executes side effect | Private body in handoff payload; workflow performing downstream side effects |

This split lets a host project implement a generic canonical domain registry for
MVP while keeping concrete workflow adapters stable. If a domain object later
moves to a specialized canonical owner, workflow still sees the same
`DomainContextRef`. In that ref, `namespace` is the canonical owner namespace
and `consumer_scenario_key` is optional consuming workflow context.

## Minimal standard API closure
Every concrete workflow must expose the same minimal API or adapter closure.
REST paths are examples; a host may implement the same contract through RPC or
in-process ports. Scenario modules can add Web/Admin internal APIs only behind
this closure.

| API group | Required routes or adapter methods | Primary callers | Writes | Forbidden |
|---|---|---|---|---|
| Discovery | `GET /api/workflow/scenarios`, `GET /api/workflow/scenarios/{scenario_key}`, `GET /api/workflow/capabilities`, `GET /api/workflow/capabilities/{capability_key}` | Chat, web, mobile, admin | None, except admin settings endpoint | Scenario-specific discovery APIs |
| Start requirements | `GET /api/workflow/start-requirements`, `ChatWorkflowAdapter.recommend`, `submit_start_requirements` | Chat workflow control, web domain workbench, web run workbench | Optional draft/preview state only when declared | In-run step intervention; direct domain mutation |
| Run lifecycle | `POST /api/workflow/runs`, `GET /api/workflow/runs/{run_id}`, `GET /api/workflow/runs/{run_id}/timeline` | Chat, web run workbench, mobile, admin, worker runtime | Start run and read canonical run state | Queue payload as source of truth |
| Command action | `POST /api/workflow/actions`, `ChatWorkflowAdapter.confirm_action` | Chat after strong confirmation, web run workbench, mobile, admin | Approve, reject, retry, cancel, suppress, confirm, create declared handoff | Durable writes without expected version and idempotency |
| Artifact preview | `GET /api/workflow/runs/{run_id}/artifacts`, `GET /api/workflow/artifacts/{artifact_id}/preview` | Chat citation, web, mobile, admin | None | L3/L4 private body to low-trust surfaces |
| Handoff | `POST /api/workflow/handoffs`, `POST /api/internal/workflow/handoffs/{handoff_id}/receipts` | Web, mobile, downstream owners, admin replay | Request handoff and record receipt refs | Workflow writing forum/knowledge/vector/notification directly |
| Dashboard | `GET /api/workflow/dashboard/cards`, `GET /api/workflow/dashboard/runs/{run_id}`, `ChatWorkflowAdapter.get_dashboard_summary` | Chat dashboard summary, mobile dashboard, web list views | None | Permission, approval, indexing, or PBR decisions from projection |
| Chat citation | `ChatWorkflowAdapter.get_citation_package` or equivalent route | Chat citation surface | None | Citation from private artifacts or projection-only state |
| Admin governance | `/api/admin/workflow/*` publish, enable, disable, rebuild, evidence endpoints | Admin/operator | Govern scenario, capability, version, rebuild, evidence-backed repair | Direct DB/projection/downstream mutation |
| Worker runtime port | `WorkflowRuntimePort` in-process or internal service methods | Worker runtime only | Claim/complete/fail step, write artifacts, request approval, emit standard events | Public/product surface access |

The closure has four invariants:
- product surfaces consume standard APIs/adapters only
- durable writes use command envelopes with expected versions and idempotency
- all reads that precede writes reread canonical Postgres state
- scenario-specific internal APIs are Web/Admin-only and cannot replace the
  standard closure

### Start requirement read

```http
GET /api/workflow/start-requirements?scenario_key=example&capability_key=example_capability&entrypoint_key=authoring&surface=chat_workflow_control
```

Response:

```ts
type WorkflowStartRequirementsResponse = {
  scenario_key: string;
  capability_key: string;
  entrypoint_key: string;
  workflow_version_id: string;
  requirements: Array<{
    requirement_key: string;
    schema_version: number;
    required: boolean;
    surface: string;
    safe_label: string;
    safe_help?: string;
    current_value_ref?: CanonicalRef;
    unavailable_reason?: string;
  }>;
  allowed_context_ref_types: Array<{
    namespace: string;
    object_type: string;
    resolver_key: string;
    owner_scope: DomainContextRef["owner_scope"];
  }>;
  action_availability: WorkflowActionAvailability[];
};
```

### Worker runtime port

The worker runtime may be implemented as service methods rather than HTTP. It
uses the same canonical identity and command metadata as public commands.

```ts
export type WorkflowStepLease = {
  run_id: string;
  step_id: string;
  step_key: string;
  claim_token: string;
  aggregate_version: number;
  expires_at: string;
};

export type WorkflowArtifactDraft = {
  artifact_type: string;
  exposure_level: "L0" | "L1" | "L2" | "L3" | "L4";
  source_refs: CanonicalRef[];
  storage_ref?: CanonicalRef;
  safe_title?: string;
  safe_summary?: string;
};

export type ContextBindingDraft = {
  target_ref: CanonicalRef;
  context_refs: DomainContextRef[];
  snapshot_refs: CanonicalRef[];
  expected_versions?: Record<string, number>;
};

export type OutboxEventDraft = {
  event_type: string;
  aggregate_type: string;
  aggregate_id: string;
  aggregate_version: number;
  payload: WorkflowSignalPayload;
};

export type WorkflowStepResult = {
  run_id: string;
  step_id: string;
  status: "completed" | "failed" | "retry_requested" | "manual_review_required";
  aggregate_version: number;
  output_refs: CanonicalRef[];
};

export type WorkflowRuntimePort = {
  claim_step(input: {
    run_id: string;
    step_id: string;
    expected_version: number;
    worker_id: string;
    meta: WorkflowCommandMeta;
  }): Promise<WorkflowStepLease>;
  complete_step(input: {
    run_id: string;
    step_id: string;
    expected_version: number;
    output_refs: CanonicalRef[];
    artifact_drafts?: WorkflowArtifactDraft[];
    context_bindings?: ContextBindingDraft[];
    event_drafts?: OutboxEventDraft[];
    meta: WorkflowCommandMeta;
  }): Promise<WorkflowCommandResponse<WorkflowStepResult>>;
  fail_step(input: {
    run_id: string;
    step_id: string;
    expected_version: number;
    reason_code: string;
    retryable: boolean;
    meta: WorkflowCommandMeta;
  }): Promise<WorkflowCommandResponse<WorkflowStepResult>>;
};
```

Worker runtime methods must not accept executable instructions from queue
payloads. They resolve handlers from the validated registry using canonical
workflow identity and stored contract hash.

## Standard headers

| Header | Required | Purpose |
|---|---:|---|
| `Authorization` | yes | User/session auth. |
| `X-Workspace-Id` | yes | Active workspace or tenant. |
| `X-Actor-Id` | yes for authenticated commands | Active human, agent, system, or workflow actor. |
| `X-Idempotency-Key` | yes for writes | Deduplicate command retries. |
| `X-Correlation-Id` | yes for writes | Tie user action to downstream events. |
| `X-Trace-Id` | recommended | Distributed tracing. |
| `X-Client-Surface` | recommended | `chat_workflow_control`, `chat_dashboard_summary`, `chat_citation`, `web_domain_workbench`, `web_run_workbench`, `mobile_dashboard`, `forum_publication`, `rag_knowledge`, `notification_push`, `admin_operator`, `worker_runtime`, or `api`. |

## Standard envelopes

### Command request metadata

```ts
export type WorkflowCommandMeta = {
  workspace_id: string;
  actor_id?: string;
  idempotency_key: string;
  correlation_id: string;
  trace_id?: string;
  client_surface:
    | "chat_workflow_control"
    | "chat_dashboard_summary"
    | "chat_citation"
    | "web_domain_workbench"
    | "web_run_workbench"
    | "mobile_dashboard"
    | "forum_publication"
    | "rag_knowledge"
    | "notification_push"
    | "admin_operator"
    | "worker_runtime"
    | "api";
};
```

### Command response

```ts
export type ScenarioRecord = {
  scenario_id: string;
  scenario_key: string;
  display_name: string;
  status: "draft" | "pilot" | "active" | "disabled" | "archived";
  owner_team: string;
  launch_phase: "dev" | "pilot" | "ga" | "disabled";
  allowed_user_classes: string[];
  current_manifest_version: number;
  current_manifest_hash: string;
  policy_version: number;
  aggregate_version: number;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  published_at?: string;
  archived_at?: string;
};

export type WorkflowCommandResponse<T> = {
  ok: true;
  data: T;
  canonical_refs: CanonicalRef[];
  aggregate_versions: Record<string, number>;
  action_availability: WorkflowActionAvailability[];
  outbox_event_ids: string[];
};

export type CanonicalRef = {
  kind:
    | "scenario"
    | "capability"
    | "workflow_definition"
    | "workflow_version"
    | "workflow_run"
    | "workflow_step"
    | "workflow_artifact"
    | "workflow_approval"
    | "workflow_handoff"
    | "downstream_object"
    | "domain_context_ref"
    | "context_snapshot";
  id: string;
  version?: number;
};

export type DomainContextRef = {
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

export type ResolvedDomainContext = {
  ref: DomainContextRef;
  resolved_version: number;
  snapshot_id: string;
  snapshot_schema_version: number;
  safe_payload: unknown;
};

export type WorkflowActionAvailability = {
  action: string;
  available: boolean;
  reason_code: string;
  target_type: string;
  target_id: string;
  expected_version?: number;
};

export type WorkflowDashboardCard = {
  run_id: string;
  scenario_key: string;
  capability_key: string;
  entrypoint_key: string;
  title: string;
  status: string;
  progress_percent: number;
  current_step_label?: string;
  requires_attention: boolean;
  attention_reason?: string;
  action_availability: WorkflowActionAvailability[];
  artifact_summaries: Array<{
    artifact_id: string;
    artifact_type: string;
    exposure_level: "L0" | "L1" | "L2";
    safe_title?: string;
    safe_summary?: string;
  }>;
  aggregate_version: number;
  updated_at: string;
};
```

### Surface adapter contract

Concrete workflows may expose REST routes, RPC, or in-process adapters. Product
surfaces should depend on the adapter shape, not on workflow-private handlers or
tables.

```ts
type ChatWorkflowAdapter = {
  recommend(input: ChatRecommendInput): Promise<ChatWorkflowRecommendation[]>;
  submit_start_requirements(
    input: ChatStartRequirementsInput,
  ): Promise<WorkflowRunPreview>;
  start_run(input: ChatStartRunInput): Promise<WorkflowRunRef>;
  confirm_action(input: StrongConfirmActionInput): Promise<WorkflowActionResult>;
  get_dashboard_summary(
    input: ChatDashboardSummaryInput,
  ): Promise<ChatDashboardSummary>;
  get_citation_package(input: CitationInput): Promise<WorkflowCitationPackage>;
};
```

Chat integrates with a concrete workflow through `ChatWorkflowAdapter` or an
equivalent route group. Chat must not call workflow step handlers, repositories,
internal Web/Admin APIs, or this template repository.

### Conflict exposure contract

Concrete workflows may maintain detailed internal conflict records, but surface
adapters must expose conflicts by trust level.

```ts
type ConflictType =
  | "version_mismatch"
  | "schema_incompatible"
  | "permission_revoked"
  | "lifecycle_invalid"
  | "relation_changed"
  | "snapshot_missing"
  | "resolver_unavailable"
  | "policy_changed";

type ConflictResolutionStatus =
  | "continue_with_snapshot"
  | "re_resolved_and_rebound"
  | "waiting_input"
  | "manual_review_required"
  | "action_denied"
  | "step_failed_retryable"
  | "step_failed_final"
  | "handoff_blocked";

type ChatConflictSummary = {
  conflict_id: string;
  status: "blocked" | "unavailable" | "needs_review";
  severity: "info" | "warning" | "blocking";
  safe_title: string;
  safe_message: string;
  reason_code: string;
  target_link?: string;
};

type ResolutionAction =
  | "confirm_continue_snapshot"
  | "reselect_context"
  | "refresh_context"
  | "edit_domain_object"
  | "rerun_step"
  | "cancel_run"
  | "suppress_artifact"
  | "admin_repair";

type ConflictResolutionView = {
  conflict_id: string;
  type: ConflictType;
  status: ConflictResolutionStatus;
  severity: "info" | "warning" | "blocking";
  target_type: "run" | "step" | "artifact" | "approval" | "handoff" | "context";
  target_id: string;
  safe_title: string;
  safe_message: string;
  reason_code: string;
  resolution_surface:
    | "web_run_workbench"
    | "web_domain_workbench"
    | "admin_operator"
    | "none";
  target_link?: string;
  allowed_resolution_actions: ResolutionAction[];
  context_ref?: DomainContextRef;
  expected_version?: number;
  actual_version?: number;
  affected_bindings?: Array<{
    binding_id: string;
    target_type: string;
    target_id: string;
    snapshot_id: string;
  }>;
};

type EvidenceRecord = {
  evidence_id: string;
  event_type: string;
  actor_id?: string;
  workspace_id: string;
  target_type: string;
  target_id: string;
  action: string;
  result: "succeeded" | "failed" | "denied";
  reason_code?: string;
  before_version?: number;
  after_version?: number;
  resolver_key?: string;
  policy_version?: number;
  correlation_id: string;
  trace_id?: string;
  created_at: string;
};
```

Chat only consumes `ChatConflictSummary`. It has three UI intents:
summarize, block, and link. Chat must not receive `context_ref`, expected/actual
versions, resolver errors, allowed resolution actions, raw artifact/domain
payloads, or evidence details.

Web workbenches consume `ConflictResolutionView`. Admin may receive
`ConflictResolutionView` plus evidence refs. Raw evidence details are exposed
only through allowlisted Admin/API reads and must not become a default product
timeline.

### Resolution action ownership

Resolution actions are not chat capabilities. The template defines standard
action names and execution metadata; concrete workflows implement the actions.

| Resolution action | Owner surface | Purpose | Chat |
|---|---|---|---:|
| `confirm_continue_snapshot` | `web_run_workbench` | Confirm continued use of an existing snapshot. | no |
| `reselect_context` | `web_domain_workbench` / `web_run_workbench` | Select a replacement context ref. | no |
| `refresh_context` | `web_run_workbench` | Rerun resolver and bind a new snapshot. | no |
| `edit_domain_object` | `web_domain_workbench` | Mutate canonical or scenario-local domain object through Domain registry API. | no |
| `rerun_step` | `web_run_workbench` / `admin_operator` | Re-execute a step with expected versions. | no |
| `cancel_run` | `web_run_workbench`; mobile only as a light workflow command | Cancel a run after strong confirmation. | no by default |
| `suppress_artifact` | `web_run_workbench` / `admin_operator` | Suppress or withdraw an artifact. | no |
| `admin_repair` | `admin_operator` | Repair system-level drift such as missing snapshots or resolver migration. | no |

Every resolution action request must include:
- `target_type`
- `target_id`
- `conflict_id`
- `expected_version`
- `reason_code`
- `actor_id`
- `workspace_id`
- `idempotency_key`
- `correlation_id`
- `client_surface`

Workers must not silently choose a resolution action. Admin repair must write a
separate evidence record from ordinary user actions.

### Minimal evidence log

The template requires an MVP evidence log, not a full audit product. The
evidence log is a Postgres canonical append-only record used to explain high
risk writes, policy decisions, conflict handling, and replay/recovery behavior.
It is not a dashboard, review queue, reporting system, or user-visible timeline.

Evidence records are required for:
- high-risk or irreversible commands such as delete, withdraw, suppress, publish,
  permission change, sharing-consent change, and admin repair
- approve/reject/confirm commands that change workflow state
- conflict resolution actions and denied resolution attempts
- handoff request/receipt state transitions
- domain context mutation or rebinding when it can affect multiple workflows

Evidence records are not required for ordinary reads, UI clicks, display-only
projection refreshes, successful presenter renders, or every worker heartbeat.
They store ids, versions, reason codes, policy/resolver identifiers, and trace
metadata only. They must not store private bodies, prompt/provider payloads,
object keys, vectors, secrets, or full before/after snapshots.

Evidence log and outbox are separate:
- Evidence log answers "what authoritative action happened and why?"
- Outbox answers "what downstream systems must be notified reliably?"
- A write may produce both in the same transaction, but consumers must not treat
  outbox events as evidence records or evidence records as delivery messages.

### Downstream signal payload

Outbox events carry a downstream signal, not a business DTO. A concrete workflow
may include only routing refs, versions, reason codes, purpose, and trace
metadata in `payload`; downstream consumers must reread canonical state before
building projection rows, notifications, public drafts, search documents,
knowledge chunks, vectors, or recommendation edges.

```ts
type DownstreamSignalPayload = {
  body: "no_body";
  pii: "no_pii";
  signal_version: 1;
  source_refs?: CanonicalRef[];
  target_type?: string;
  target_id?: string;
  expected_versions?: Record<string, number>;
  handoff_id?: string;
  handoff_type?: "public_draft" | "indexing" | "notification" | "external_delivery" | string;
  requested_purpose?: string;
  reason_code?: string;
  invalidation_reason?: "deleted" | "withdrawn" | "hidden" | "visibility_changed" | string;
  consumer?: "projection" | "public_draft_forum" | "rag_knowledge" | "notification_push" | "search" | "vector_embedding" | "ppr_recommendation" | "admin_replay" | string;
};
```

Allowed payload hints:
- source refs and expected versions
- target type/id for notification, projection, or invalidation routing
- handoff type/id and requested purpose
- invalidation reason for deletion, withdrawal, hidden, visibility, or policy
  changes
- consumer/purpose hints for recommendation or retrieval pipelines

Forbidden payload data:
- raw workflow input, artifact body, private feedback, protected subject data, or
  public draft body
- prompts, tool calls, provider request/response bodies, model internals, or
  memory text
- object storage keys, signed URLs, tokens, secrets, vectors, or embedding body
- permission/PBR internals, billing details, or full before/after snapshots

If a downstream system needs more than the refs above, the concrete workflow
must add canonical state behind an owner API/repository, not enlarge the outbox
payload.

### Event registry layers

Workflow events use a three-layer registry:

1. Platform events are owned outside workflow, such as `content.*`,
   `public_draft.*`, `publication.request.*`, `forum.*`, `knowledge.*`,
   `notification.*`, `personalization.*`, `projection.invalidate.requested`,
   and evidence/audit events.
2. Standard workflow events are the only workflow events shared product
   consumers may depend on.
3. Scenario internal events are declared by the concrete workflow contract and
   may be used by implementation internals, but not by shared chat, mobile,
   forum, RAG, notification, PPR, or search consumers.

Standard workflow events:

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

Consumers must read terminal run state from canonical `run.status` after
`workflow.run.updated`. The standard registry does not define separate
`workflow.run.completed` or `workflow.run.failed` events.

### Event producer and consumer ownership

Standard workflow event production is owned by the canonical aggregate writer:
workflow ledger for run/step/artifact state, approval service for approvals,
handoff ledger for handoff request/receipt state, context binding owner for
context bindings, and evidence writer for evidence records.

Producer rules:
- emit the outbox signal in the same transaction as the canonical aggregate
  write whenever possible
- use deterministic idempotency keys based on event type, aggregate id, and
  aggregate version
- do not emit platform events directly from workflow code except through the
  owning platform API or handoff receipt path

Consumer rules:
- shared consumers subscribe only to platform events and standard `workflow.*`
  events
- shared consumers never subscribe to scenario internal events
- consumers reread the owning canonical source before projection, notification,
  publication, RAG/knowledge, search/vector, PPR, or replay side effects
- downstream side effects are idempotent and owned by their downstream module

### Standard workflow event payload schema

Standard workflow event names identify the aggregate and change class. Payloads
identify refs for downstream reread. They must not carry the authoritative
business result.

```ts
export type WorkflowSignalPayload = {
  body: "no_body";
  pii: "no_pii";
  signal_version: 1;

  run_id?: string;
  step_id?: string;
  artifact_id?: string;
  approval_id?: string;
  handoff_id?: string;
  context_binding_id?: string;
  evidence_id?: string;

  scenario_key?: string;
  capability_key?: string;
  entrypoint_key?: string;
  workflow_version_id?: string;

  target_type?: string;
  target_id?: string;
  source_refs?: CanonicalRef[];
  expected_versions?: Record<string, number>;

  handoff_type?: string;
  requested_purpose?: string;
  reason_code?: string;
  invalidation_reason?: string;
  client_surface?: string;
};
```

Minimum event schema:

| Event | `aggregate_type` | `aggregate_id` | Payload minimum |
|---|---|---|---|
| `workflow.run.created` | `workflow_run` | `run_id` | `scenario_key`, `capability_key`, `entrypoint_key`, `workflow_version_id` |
| `workflow.run.updated` | `workflow_run` | `run_id` | `reason_code?` |
| `workflow.step.started` / `completed` / `failed` / `retry_requested` / `manual_review_required` | `workflow_step` | `step_id` | `run_id`, `step_id`, `reason_code?` |
| `workflow.approval.requested` / `resolved` | `workflow_approval` | `approval_id` | `run_id?`, `approval_id`, `target_type`, `target_id`, `expected_versions?`, `reason_code?` |
| `workflow.artifact.created` / `updated` / `deleted` / `expired` | `workflow_artifact` | `artifact_id` | `run_id?`, `artifact_id`, `source_refs?`, `invalidation_reason?`, `reason_code?` |
| `workflow.handoff.requested` / `receipt_recorded` / `invalidated` | `workflow_handoff` | `handoff_id` | `handoff_id`, `handoff_type`, `source_refs`, `expected_versions`, `requested_purpose`, `reason_code?` |
| `workflow.context.bound` / `rebind_required` / `rebound` | `workflow_context_binding` | `context_binding_id` | `context_binding_id`, `run_id?`, `target_type`, `target_id`, `source_refs`, `expected_versions?`, `reason_code?` |
| `workflow.evidence.recorded` | `workflow_evidence` | `evidence_id` | `evidence_id`, `target_type`, `target_id`, `reason_code?` |

Payloads should not include canonical status fields such as `run.status`,
`step.status`, `approval.status`, or `artifact.status`. Consumers reread the
canonical aggregate and use presenters to derive display or downstream behavior.

Default idempotency key:

```txt
{event_type}:{aggregate_id}:{aggregate_version}
```

If one aggregate version can emit multiple events of the same type, append a
deterministic suffix such as `reason_code`, `handoff_type`, or `target_id`:

```txt
{event_type}:{aggregate_id}:{aggregate_version}:{reason_code}
{event_type}:{aggregate_id}:{aggregate_version}:{handoff_type}
```

Random UUID idempotency keys are not allowed for standard workflow events
because replay must be deterministic.

### Error response

```ts
type WorkflowErrorResponse = {
  ok: false;
  error: {
    code: string;
    message: string;
    retryable: boolean;
    reason_code?: string;
    target?: {
      type: string;
      id: string;
    };
    evidence_hints?: Record<string, unknown>;
  };
};
```

Common error codes:

| Code | Meaning |
|---|---|
| `workflow_access_denied` | ACL or PBR denied. |
| `workflow_scenario_not_found` | Scenario key is unknown, archived, or disabled. |
| `workflow_capability_not_found` | Capability key is unknown or archived. |
| `workflow_capability_disabled` | Capability disabled for workspace/user. |
| `workflow_manifest_mismatch` | Request targets a manifest version/hash that is not currently published. |
| `workflow_version_not_found` | No active/published version for entrypoint. |
| `workflow_version_conflict` | Expected version differs from canonical state. |
| `workflow_action_unavailable` | Action availability changed or state is stale. |
| `workflow_artifact_not_previewable` | Requested preview level is not allowed. |
| `workflow_artifact_not_handoff_eligible` | Requested handoff type is not allowed for this artifact/state/purpose. |
| `workflow_handoff_rejected` | Downstream owner rejected the handoff request. |
| `workflow_internal_api_forbidden` | Internal scenario API cannot be called by this surface. |
| `workflow_input_invalid` | Input schema validation failed. |
| `workflow_rate_limited` | Quota or rate limit denied. |

## Scenario APIs

### List scenarios

```http
GET /api/workflow/scenarios?surface=chat_workflow_control&status=active
```

Response:

```ts
type ListScenariosResponse = {
  scenarios: Array<{
    scenario_key: string;
    display_name: string;
    status: ScenarioRecord["status"];
    launch_phase: ScenarioRecord["launch_phase"];
    enabled: boolean;
    unavailable_reason?: string;
    current_manifest_version: number;
  }>;
};
```

### Get scenario detail

```http
GET /api/workflow/scenarios/{scenario_key}
```

The response returns the canonical scenario record, enabled capabilities,
published manifest metadata, allowed user classes, surface availability, and
safe governance summary. It does not return raw manifest secrets, handler code,
private policy internals, or internal API implementation details.

### Publish scenario manifest

```http
POST /api/admin/workflow/scenarios/{scenario_key}/publish-manifest
```

Request:

```json
{
  "manifest_version": 3,
  "manifest_hash": "sha256:...",
  "dry_run": false,
  "change_summary": "Enable authoring entrypoint for pilot users"
}
```

Publishing validates the YAML manifest or equivalent TS contract, TS registry
bindings, internal API allowlist, handoff declarations, capability mappings, and
deterministic tests before updating the canonical `Scenario` record.

## Capability APIs

### List capabilities

```http
GET /api/workflow/capabilities?scenario_key=example&surface=chat_workflow_control
```

Response:

```ts
type ListCapabilitiesResponse = {
  capabilities: Array<{
    scenario_key: string;
    capability_key: string;
    label: string;
    description?: string;
    enabled: boolean;
    entrypoints: Array<{
      entrypoint_key: string;
      label: string;
      input_schema_version: number;
      output_schema_version: number;
      supported_surfaces: string[];
    }>;
    unavailable_reason?: string;
  }>;
};
```

### Get capability detail

```http
GET /api/workflow/capabilities/{capability_key}?scenario_key=example
```

The detail response includes current version, entrypoints, input schema summary,
output/artifact policy, and safe surface mappings.

### Update capability settings

```http
POST /api/workflow/capabilities/{capability_key}/settings
```

Request:

```json
{
  "scenario_key": "example",
  "enabled": true,
  "settings": {
    "default_mode": "standard"
  }
}
```

Only admin or policy-authorized actors may call this endpoint.

## Run APIs

### Start run

```http
POST /api/workflow/runs
```

Request:

```json
{
  "scenario_key": "example",
  "capability_key": "example_capability",
  "entrypoint_key": "authoring",
  "expected_workflow_version": 1,
  "input_schema_version": 1,
  "input": {
    "context_refs": [
      {
        "namespace": "example",
        "consumer_scenario_key": "example",
        "object_type": "example_context_object",
        "object_id": "ctx_123",
        "version": 4
      }
    ],
    "title": "Example run"
  },
  "client_surface": "chat_workflow_control"
}
```

Response:

```ts
type StartRunResponse = {
  run: WorkflowRunRef;
  dashboard_card?: WorkflowDashboardCard;
  next_actions: WorkflowActionAvailability[];
};

type WorkflowRunRef = {
  run_id: string;
  scenario_key: string;
  capability_key: string;
  entrypoint_key: string;
  workflow_version_id: string;
  status: "queued" | "running" | "waiting_approval" | "completed" | "failed" | "cancelled";
  aggregate_version: number;
};
```

### Get run detail

```http
GET /api/workflow/runs/{run_id}
```

Use this for strong reads before confirmation screens, web workbench, and
deep-link entry. The response includes run, steps, artifacts, approvals, action
availability, context refs, context snapshots, and context bindings.

### List run timeline

```http
GET /api/workflow/runs/{run_id}/timeline
```

Timeline is display-safe. It may be rendered in mobile, web, or chat dashboard
surfaces.

## Action API

### Execute workflow action

```http
POST /api/workflow/actions
```

Request:

```json
{
  "action": "approve",
  "target_type": "workflow_approval",
  "target_id": "approval_123",
  "expected_version": 3,
  "reason_code": "user_confirmed",
  "reason_text": "Looks good",
  "client_surface": "mobile_dashboard"
}
```

Response:

```ts
type ExecuteActionResponse = {
  target: CanonicalRef;
  run?: WorkflowRunRef;
  affected_refs: CanonicalRef[];
  action_availability: WorkflowActionAvailability[];
};
```

Allowed shared actions are defined in `surface-contract.md`. Scenario-specific
actions must declare their mapping in the scenario manifest.

## Artifact APIs

### List artifacts for a run

```http
GET /api/workflow/runs/{run_id}/artifacts
```

The list returns artifact ids, types, status, exposure level, handoff eligibility
by type, and safe summary only.

### Get artifact preview

```http
GET /api/workflow/artifacts/{artifact_id}/preview?level=L2
```

The server may downgrade the requested level. L3 detail always requires a strong
read and authorization.

Response:

```ts
type WorkflowArtifactPreview = {
  artifact_id: string;
  run_id: string;
  artifact_type: string;
  status: string;
  exposure_level: "L0" | "L1" | "L2" | "L3" | "L4";
  safe_title?: string;
  safe_summary?: string;
  safe_preview?: string;
  unavailable_reason?: string;
  handoff_availability: Record<string, boolean>;
  aggregate_version: number;
};
```

## Handoff APIs

### Create handoff request

```http
POST /api/workflow/handoffs
```

Request:

```json
{
  "handoff_type": "public_draft",
  "source_refs": [
    {
      "kind": "workflow_artifact",
      "id": "artifact_123",
      "version": 4
    },
    {
      "kind": "workflow_run",
      "id": "run_123",
      "version": 8
    }
  ],
  "requested_purpose": "forum_publication",
  "client_surface": "mobile_dashboard",
  "expected_versions": {
    "workflow_artifact:artifact_123": 4,
    "workflow_run:run_123": 8
  },
  "metadata": {
    "reason_code": "user_requested_public_draft"
  }
}
```

Response:

```ts
type WorkflowHandoffResponse = {
  handoff: {
    handoff_id: string;
    handoff_type: string;
    status: "requested" | "accepted" | "rejected" | "duplicate";
    source_refs: CanonicalRef[];
    downstream_owner?: string;
    downstream_refs: CanonicalRef[];
    reason_code?: string;
    safe_message?: string;
    aggregate_version: number;
  };
  run?: WorkflowRunRef;
  action_availability: WorkflowActionAvailability[];
};
```

The response returns canonical source refs and downstream refs only. Public
draft, forum, RAG/indexing, knowledge, notification, and external delivery
modules reread canonical content and own their own gates, side effects, and
receipts.

### Record handoff receipt

```http
POST /api/internal/workflow/handoffs/{handoff_id}/receipts
```

This internal endpoint is for downstream owners. It records accepted, rejected,
duplicate, completed, or failed receipts against the workflow handoff ledger.
Receipts contain downstream refs and safe reason codes, not downstream private
bodies.

## Dashboard APIs

### List dashboard cards

```http
GET /api/workflow/dashboard/cards?status=attention&limit=30
```

This endpoint may read from display projection when available. It must not be
used for permission, approval, public draft, or indexing decisions. Dashboard
surfaces must not present indexing as a direct knowledge-base action.

### Get dashboard run detail

```http
GET /api/workflow/dashboard/runs/{run_id}
```

This returns display-safe detail plus action hints. Confirmation screens must
reread `/api/workflow/runs/{run_id}` or execute action with expected version.

## Chat APIs

These routes are REST examples for a concrete workflow implementation of
`ChatWorkflowAdapter`.

### Recommend or control workflow from chat context

```http
POST /api/workflow/chat/control
```

Request:

```json
{
  "thread_id": "thread_123",
  "message_id": "message_456",
  "purpose": "workflow_execution",
  "max_results": 3
}
```

The response returns capability recommendations and required parameters. It does
not start a run unless the request is a strong-confirmed command with
idempotency and expected-version metadata.

### Get workflow dashboard summary for chat

```http
GET /api/workflow/chat/dashboard-summary
```

The response is display-only. It may summarize counts, statuses, safe labels,
and target links. It must not include private bodies, intervention reminders, or
durable action writes.

## Notification handoff

```http
POST /api/workflow/handoffs with handoff_type=notification
```

The concrete workflow does not own device tokens, push rendering, delivery
retry, or read/unread state. The notification owner records handoff receipts and
exposes its own notification APIs if the host product needs them. Workflow
payloads contain ids, safe labels, reason codes, timestamps, and refs only.

## Admin APIs

```http
GET /api/admin/workflow/scenarios
POST /api/admin/workflow/scenarios/{scenario_key}/publish-manifest
POST /api/admin/workflow/scenarios/{scenario_key}/enable
POST /api/admin/workflow/scenarios/{scenario_key}/disable
GET /api/admin/workflow/capabilities
POST /api/admin/workflow/capabilities/{capability_key}/publish-version
POST /api/admin/workflow/capabilities/{capability_key}/deprecate-version
POST /api/admin/workflow/capabilities/{capability_key}/enable
POST /api/admin/workflow/capabilities/{capability_key}/disable
GET /api/admin/workflow/runs/{run_id}/evidence
POST /api/admin/workflow/rebuilds/dry-run
POST /api/admin/workflow/rebuilds/apply
```

Admin APIs that mutate state must append evidence records and must not expose raw
private bodies by default.

## Internal scenario API boundary

Scenario modules may expose host-only Web/Admin APIs:

```http
GET /api/internal/scenarios/{scenario_key}/...
POST /api/internal/scenarios/{scenario_key}/...
```

These routes must be declared in the scenario manifest:

```yaml
internal_api:
  routes:
    - method: POST
      path: /api/internal/scenarios/example/import-preview
      owner_surface: web_domain_workbench
      command_class: scenario_internal
      writes_workflow_facts: false
```

Internal APIs are not part of the shared product consumption contract. If they
change workflow facts, they must write the same canonical ledger and emit the
same outbox/formal events as a Workflow API command.

## Required call sequences

### Chat-triggered run

```txt
chat message
  -> POST /api/workflow/chat/control
  -> user selects capability
  -> UI collects parameters in strong interaction
  -> POST /api/workflow/runs
  -> response writes summary back to chat timeline
  -> run lifecycle updates dashboard/notifications through outbox
```

### Mobile approval

```txt
dashboard card
  -> user opens approval
  -> GET /api/workflow/runs/{run_id}
  -> POST /api/workflow/actions with expected_version
  -> API rereads canonical state
  -> writes approval/run/artifact facts + outbox
  -> dashboard projection updates eventually
```

### Public draft handoff

```txt
artifact preview L2
  -> POST /api/workflow/handoffs with handoff_type=public_draft
  -> public draft module rereads canonical refs
  -> privacy/PBR/redaction/risk checks
  -> user confirms draft
  -> downstream owner records handoff receipt
  -> forum routing/publication flow
```

### Indexing handoff

```txt
eligible artifact
  -> service/worker policy checks sharing consent + artifact eligibility
  -> POST /api/workflow/handoffs with handoff_type=indexing
  -> indexing owner rereads canonical refs
  -> lifecycle/PBR/privacy/provenance checks
  -> indexing owner records accepted/rejected/completed receipt
  -> retrieval source becomes available only through RAG/knowledge API
```

### Worker step execution

```txt
outbox/queue message with ids only
  -> worker claims step in Postgres
  -> worker loads scenario module handler
  -> handler strong-reads canonical inputs through repositories
  -> external calls happen outside DB transaction
  -> result write rereads canonical status/version
  -> write step/artifact/evidence/outbox facts where required
```
