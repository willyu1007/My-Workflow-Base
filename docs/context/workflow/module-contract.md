# Workflow module contract

## Purpose
This document defines how a concrete workflow module adopts the base template.
The base repository does not load or run the module. A module is not a plugin
marketplace package and does not execute arbitrary code from users. It is a
controlled product module authored in the host repo or approved distribution.

## Module shape

```ts
export type WorkflowScenarioModule = {
  manifest: ScenarioManifest;
  repositories: ScenarioRepositoryFactory;
  handler_registry: WorkflowHandlerRegistry;
  action_registry: WorkflowActionRegistry;
  adapters: WorkflowSurfaceAdapters;
  presenters: WorkflowPresenters;
  policies: WorkflowPolicies;
  tests: WorkflowScenarioTestContract;
  internal_api?: WorkflowInternalApiRegistry;
};
```

If the host application uses a registry loader, it registers scenario modules at
boot:

```ts
registerWorkflowScenario(exampleScenarioModule);
registerWorkflowScenario(secondScenarioModule);
```

Registration or CI validation fails if contract keys, registry bindings,
presenters, policies, or tests are missing.

YAML is the default declarative contract artifact. A concrete workflow may use
an equivalent TypeScript contract constant when it does not need YAML. TypeScript
registries are the executable binding. The platform must never dynamically
execute user-authored YAML as code.

```ts
export type WorkflowHandlerRegistry = Record<string, WorkflowStepHandler>;
export type WorkflowActionRegistry = Record<string, WorkflowActionHandler>;
export type WorkflowPresenterRegistry = Record<string, unknown>;
export type WorkflowInternalApiRegistry = Record<string, unknown>;
```

Every registry key must be declared in the manifest or equivalent TS contract.
Every declared handler, action, adapter, presenter, policy, and internal route
key must have a registry binding.

## Scenario manifest

```ts
export type ScenarioManifest = {
  manifest_version: number;
  scenario_key: string;
  scenario_record: ScenarioRecordBinding;
  owner: string;
  launch_phase: "dev" | "pilot" | "ga" | "disabled";
  allowed_user_classes: string[];
  capabilities: CapabilityManifest[];
  scenario_data: ScenarioDataManifest;
  artifact_policy: ArtifactPolicyManifest;
  action_availability: ActionPolicyManifest;
  surface_mapping: SurfaceMappingManifest;
  internal_api?: InternalApiManifest;
  handoffs: HandoffManifest[];
  event_registry: EventRegistryManifest;
  governance: GovernanceManifest;
};

export type ScenarioRecordBinding = {
  required_status: "draft" | "pilot" | "active" | "disabled" | "archived";
  display_name: string;
  owner_team: string;
  policy_version: number;
};

export type CapabilityManifest = {
  capability_key: string;
  label: string;
  description?: string;
  enablement_policy: "admin_enabled" | "workspace_enabled" | "always_on";
  entrypoints: WorkflowEntrypointManifest[];
};

export type WorkflowEntrypointManifest = {
  entrypoint_key: string;
  label: string;
  workflow_version: number;
  input_schema_version: number;
  output_schema_version: number;
  allowed_step_types: WorkflowStepType[];
  steps: WorkflowStepManifest[];
};

export type WorkflowStepManifest = {
  step_key: string;
  step_type: WorkflowStepType;
  order: number;
  handler_key: string;
  retry_policy: "none" | "bounded_exponential" | "manual_only";
  timeout_ms?: number;
};

export type WorkflowStepType =
  | "domain_action"
  | "llm_generate"
  | "ocr_extract"
  | "structured_transform"
  | "evaluate"
  | "artifact_write"
  | "approval_gate"
  | "emit_event";

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

export type DomainContextResolver = {
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

export type ScenarioDataManifest = {
  context_ref_types: Array<{
    namespace: string;
    object_type: string;
    resolver_key: string;
    owner_scope: "workspace" | "organization" | "platform" | "external";
    canonical_required: boolean;
    scenario_local_allowed: boolean;
    snapshot_required: boolean;
  }>;
  run_start_requirements: Array<{
    requirement_key: string;
    schema_version: number;
    entrypoints: string[];
    surfaces: Array<"chat_workflow_control" | "web_domain_workbench" | "web_run_workbench">;
    required: boolean;
  }>;
  step_interventions: Array<{
    intervention_type: string;
    schema_version: number;
    step_keys: string[];
    surface: "web_run_workbench";
    handler_key: string;
  }>;
};

export type ArtifactPolicyManifest = {
  artifact_types: string[];
  exposure_levels: Record<"L0" | "L1" | "L2" | "L3" | "L4", string[]>;
  handoff_eligible: Record<string, string[]>;
};

export type ActionPolicyManifest = {
  shared_actions: string[];
  scenario_actions: string[];
  expected_version_required: boolean;
};

export type SurfaceMappingManifest = {
  chat_workflow_control?: Record<string, unknown>;
  chat_dashboard_summary?: Record<string, unknown>;
  chat_citation?: Record<string, unknown>;
  web_domain_workbench?: Record<string, unknown>;
  web_run_workbench?: Record<string, unknown>;
  mobile_dashboard?: Record<string, unknown>;
  forum_publication?: Record<string, unknown>;
  rag_knowledge?: Record<string, unknown>;
  notification_push?: Record<string, unknown>;
  admin_operator?: Record<string, unknown>;
};

export type GovernanceManifest = {
  admin_actions: string[];
  rollback: string;
  projection_review_required: boolean;
  evidence_records: string[];
  outbox_events: string[];
};

export type EventRegistryManifest = {
  standard_workflow_events: string[];
  scenario_internal_events: string[];
  event_payload_policy: {
    signal_version: 1;
    body: "no_body";
    pii: "no_pii";
    status_in_payload: false;
    presenter_output_in_payload: false;
    idempotency_key: "{event_type}:{aggregate_id}:{aggregate_version}";
  };
  producers: Record<string, {
    owner:
      | "workflow_ledger"
      | "approval_service"
      | "artifact_service"
      | "handoff_ledger"
      | "context_binding_owner"
      | "evidence_writer"
      | "platform_owner"
      | "scenario_module";
    write_boundary:
      | "same_transaction"
      | "owner_api"
      | "handoff_receipt"
      | "scenario_internal";
  }>;
  consumers: Record<string, {
    allowed_events: string[];
    forbidden_events: string[];
  }>;
};

export type InternalApiManifest = {
  routes: Array<{
    method: "GET" | "POST" | "PATCH" | "DELETE";
    path: string;
    owner_surface: "web_domain_workbench" | "web_run_workbench" | "admin_operator";
    command_class: "scenario_internal" | "workflow_fact_write";
    writes_workflow_facts: boolean;
    handler_key: string;
  }>;
};

export type HandoffManifest = {
  handoff_type: string;
  source_artifact_types: string[];
  requested_purposes: string[];
  downstream_owner: string;
  policy_key: string;
  receipt_required: boolean;
};
```

## Scenario canonical record
`Scenario` is a database object. A module cannot activate itself with YAML only.

Required publish flow:

1. Create or update the canonical `Scenario` record through admin workflow APIs.
2. Validate `scenario.manifest.yaml` or equivalent TS contract against the
   module schema.
3. Verify contract `scenario_key` and `scenario_record` match canonical state.
4. Verify every contract registry key exists in TypeScript.
5. Verify every TypeScript registry key is declared by the contract.
6. Run deterministic contract and journey tests.
7. Compute `contract_hash`.
8. Publish by updating `current_manifest_version`,
   `current_manifest_hash`, `policy_version`, and `aggregate_version`.

Concrete workflow runtime APIs reject disabled scenarios, unknown contract
hashes, stale expected versions, and modules whose boot-time registry does not
match the published contract.

## Repository boundary
Scenario repositories hide persistence and return domain entities. Business
services, controllers, presenters, and handlers must not import ORM clients
directly.

```ts
export type ScenarioRepositoryFactory = (deps: {
  db: unknown;
  outbox: OutboxAppender;
  clock: Clock;
}) => ScenarioRepositories;

export type ScenarioRepositories = {
  capability: CapabilityRepository;
  runs: WorkflowRunRepository;
  artifacts: WorkflowArtifactRepository;
  context_resolver: DomainContextResolver;
};
```

## Step handler contract

Queue payloads contain ids only. Handlers must strong-read canonical inputs
through repositories.

```ts
export type WorkflowStepHandler = (
  input: WorkflowStepHandlerInput,
  deps: WorkflowStepHandlerDeps,
) => Promise<WorkflowStepHandlerResult>;

export type WorkflowStepHandlerInput = {
  workspace_id: string;
  actor_id?: string;
  scenario_key: string;
  capability_key: string;
  entrypoint_key: string;
  workflow_version_id: string;
  workflow_version: number;
  run_id: string;
  run_version: number;
  step_id: string;
  step_key: string;
  step_version: number;
  attempt_no: number;
  claim_token: string;
  input_refs: CanonicalRef[];
  trace_id?: string;
  correlation_id: string;
  causation_id?: string;
};

export type WorkflowStepHandlerDeps = {
  repositories: ScenarioRepositories;
  llm?: LlmGateway;
  ocr?: OcrGateway;
  object_storage?: ObjectStorageGateway;
  clock: Clock;
  logger: SafeLogger;
};

export type WorkflowStepHandlerResult =
  | {
      status: "succeeded";
      output_refs: CanonicalRef[];
      artifacts?: WorkflowArtifactDraft[];
      outbox_events?: OutboxEventDraft[];
      action_availability?: WorkflowActionAvailability[];
    }
  | {
      status: "waiting_input" | "manual_review_required";
      reason_code: string;
      action_availability: WorkflowActionAvailability[];
    }
  | {
      status: "failed";
      failure_class: "retryable" | "fatal" | "cancelled";
      reason_code: string;
      safe_message?: string;
    };
```

Handler rules:
- Do not trust queue payloads for business state.
- Do not write projection/search/vector/notification systems directly.
- Do not include raw private bodies in logs, metrics, queue payloads, or outbox
  payloads.
- External provider calls happen outside DB transactions.
- Result writes must reread current run/step status and expected versions.

## Action handler contract

Shared product surfaces call `/api/workflow/actions`. Scenario modules may
register domain action handlers behind shared action classes.

```ts
export type WorkflowActionHandler = (
  input: WorkflowActionInput,
  deps: WorkflowActionDeps,
) => Promise<WorkflowActionResult>;

export type WorkflowActionInput = {
  action:
    | "start_run"
    | "submit_start_requirements"
    | "approve"
    | "reject"
    | "confirm"
    | "step_intervention"
    | "retry"
    | "request_manual_review"
    | "cancel"
    | "close"
    | "suppress"
    | "release"
    | "create_handoff"
    | string;
  target_type: string;
  target_id: string;
  expected_version?: number;
  reason_code: string;
  reason_text?: string;
  client_surface: string;
  workspace_id: string;
  actor_id: string;
  idempotency_key: string;
  correlation_id: string;
  trace_id?: string;
};
```

Action handlers must return updated refs, aggregate versions, action
availability, and outbox ids.

## Internal API handler contract
Internal APIs are optional and Web/Admin-only. They are for scenario-specific
operator functions that do not belong in the shared product API.

Rules:
- Every route must be declared in `internal_api.routes`.
- Every route must bind to an `internal_api` registry key.
- Routes that write workflow facts must use expected versions, canonical
  repositories, evidence logging, and outbox.
- Routes must not be callable by chat, mobile dashboard, forum, RAG,
  notification, public links, or external clients.
- Routes must not create private run, approval, artifact, or handoff identities.

## Presenter contract

Presenters convert canonical state into safe surface payloads.

```ts
export type WorkflowPresenters = {
  chat_workflow_control(input: ChatWorkflowControlInput): Promise<WorkflowControlView>;
  chat_dashboard_summary(input: PresenterInput): Promise<WorkflowDashboardSummary>;
  chat_citation(input: CitationInput): Promise<WorkflowCitationPackage>;
  web_domain_workbench(input: PresenterInput): Promise<WorkflowDomainWorkbench>;
  web_run_workbench(input: PresenterInput): Promise<WorkflowRunWorkbench>;
  dashboard_card(input: PresenterInput): Promise<WorkflowDashboardCard>;
  mobile_summary(input: PresenterInput): Promise<WorkflowMobileSummary>;
  admin_summary(input: PresenterInput): Promise<WorkflowAdminSummary>;
};
```

Concrete workflows expose these presenters through standard surface adapters or
equivalent route groups. Chat must depend on the chat adapter shape, not on
workflow-private handlers.

The standard adapter closure is intentionally small. A concrete workflow may
implement these as REST routes, RPC handlers, or in-process ports, but shared
product surfaces depend on these shapes rather than scenario-private APIs.
`WorkflowRuntimePort` follows the worker runtime port defined in
`api-contract.md`.

In host code, these DTOs should live in one workflow contract package and be
re-exported by API, module, and surface adapters. They are listed here only to
keep the scenario-module scaffold self-contained.

```ts
import type { WorkflowRuntimePort } from "@workflow/contracts/api";

export type CanonicalRef = {
  kind:
    | "scenario"
    | "capability"
    | "workflow_version"
    | "workflow_run"
    | "workflow_step"
    | "workflow_artifact"
    | "workflow_approval"
    | "workflow_handoff"
    | "domain_context_ref"
    | "context_snapshot"
    | "downstream_object";
  id: string;
  version?: number;
};

export type WorkflowActionAvailability = {
  action: string;
  available: boolean;
  reason_code: string;
  target_type: string;
  target_id: string;
  expected_version?: number;
};

export type WorkflowRunRef = {
  run_id: string;
  scenario_key: string;
  capability_key: string;
  entrypoint_key: string;
  workflow_version_id: string;
  status: string;
  aggregate_version: number;
};

export type PresenterInput = {
  workspace_id: string;
  actor_id?: string;
  target_ref: CanonicalRef;
  client_surface: string;
};

export type ChatWorkflowControlInput = PresenterInput & {
  thread_id?: string;
  message_id?: string;
};

export type CitationInput = {
  workspace_id: string;
  actor_id?: string;
  source_refs: CanonicalRef[];
  purpose: string;
};

export type ChatRecommendInput = {
  workspace_id: string;
  actor_id?: string;
  thread_id: string;
  message_id?: string;
  purpose: string;
  max_results?: number;
};

export type ChatWorkflowRecommendation = {
  scenario_key: string;
  capability_key: string;
  entrypoint_key: string;
  safe_title: string;
  safe_summary?: string;
  start_requirements: WorkflowStartRequirement[];
};

export type WorkflowStartRequirement = {
  requirement_key: string;
  schema_version: number;
  required: boolean;
  safe_label: string;
  safe_help?: string;
};

export type ChatStartRequirementsInput = {
  workspace_id: string;
  actor_id?: string;
  scenario_key: string;
  capability_key: string;
  entrypoint_key: string;
  input: Record<string, unknown>;
};

export type WorkflowRunPreview = {
  scenario_key: string;
  capability_key: string;
  entrypoint_key: string;
  input_refs: CanonicalRef[];
  action_availability: WorkflowActionAvailability[];
};

export type ChatStartRunInput = ChatStartRequirementsInput & {
  idempotency_key: string;
  correlation_id: string;
  expected_workflow_version?: number;
};

export type StrongConfirmActionInput = {
  workspace_id: string;
  actor_id?: string;
  action: string;
  target_type: string;
  target_id: string;
  expected_version: number;
  idempotency_key: string;
  correlation_id: string;
  reason_code: string;
};

export type ChatDashboardSummaryInput = {
  workspace_id: string;
  actor_id?: string;
  limit?: number;
};

export type WorkflowActionCommand = StrongConfirmActionInput & {
  client_surface: string;
  reason_text?: string;
};

export type WorkflowActionResult = {
  target: CanonicalRef;
  run?: WorkflowRunRef;
  affected_refs: CanonicalRef[];
  action_availability: WorkflowActionAvailability[];
};

export type RunDetailInput = {
  workspace_id: string;
  actor_id?: string;
  run_id: string;
};

export type ArtifactPreviewInput = {
  workspace_id: string;
  actor_id?: string;
  artifact_id: string;
  requested_level: "L0" | "L1" | "L2" | "L3" | "L4";
};

export type WorkflowArtifactPreview = {
  artifact_id: string;
  run_id: string;
  artifact_type: string;
  exposure_level: "L0" | "L1" | "L2" | "L3" | "L4";
  safe_title?: string;
  safe_summary?: string;
  safe_preview?: string;
  unavailable_reason?: string;
  aggregate_version: number;
};

export type HandoffRequestInput = {
  workspace_id: string;
  actor_id?: string;
  handoff_type: string;
  source_refs: CanonicalRef[];
  requested_purpose: string;
  expected_versions?: Record<string, number>;
  idempotency_key: string;
  correlation_id: string;
  client_surface: string;
};

export type WorkflowHandoffResult = {
  handoff_id: string;
  handoff_type: string;
  status: "requested" | "accepted" | "rejected" | "duplicate" | "completed" | "failed";
  source_refs: CanonicalRef[];
  downstream_refs: CanonicalRef[];
  reason_code?: string;
  aggregate_version: number;
};

export type DashboardCardListInput = {
  workspace_id: string;
  actor_id?: string;
  status?: string;
  limit?: number;
};

export type RunSummaryInput = {
  workspace_id: string;
  actor_id?: string;
  run_id: string;
};

export type WorkflowControlView = {
  recommendations: ChatWorkflowRecommendation[];
  action_availability: WorkflowActionAvailability[];
};

export type WorkflowDashboardSummary = ChatDashboardSummary;

export type WorkflowCitationPackage = {
  source_refs: CanonicalRef[];
  safe_citations: Array<{
    source_ref: CanonicalRef;
    safe_title: string;
    trust_label?: string;
  }>;
};

export type WorkflowDomainWorkbench = {
  context_refs: DomainContextRef[];
  action_availability: WorkflowActionAvailability[];
};

export type WorkflowRunWorkbench = {
  run: WorkflowRunRef;
  artifacts: WorkflowArtifactPreview[];
  action_availability: WorkflowActionAvailability[];
};

export type WorkflowDashboardCard = {
  run_id: string;
  scenario_key: string;
  capability_key: string;
  entrypoint_key: string;
  title: string;
  status: string;
  requires_attention: boolean;
  action_availability: WorkflowActionAvailability[];
  aggregate_version: number;
};

export type WorkflowMobileSummary = {
  run: WorkflowRunRef;
  cards: WorkflowDashboardCard[];
  action_availability: WorkflowActionAvailability[];
};

export type WorkflowAdminSummary = {
  scenario_key?: string;
  capability_key?: string;
  status: string;
  findings?: WorkflowModuleValidationReport["findings"];
};

export type ModuleValidationInput = {
  scenario_key: string;
  activation_target: "dev" | "pilot" | "ga" | "disabled";
};

export type PublishVersionInput = {
  scenario_key: string;
  capability_key?: string;
  manifest_version: number;
  contract_hash: string;
  dry_run: boolean;
  change_summary: string;
};

export type DisableCapabilityInput = {
  scenario_key: string;
  capability_key: string;
  reason_code: string;
};

export type EvidenceReadInput = {
  workspace_id: string;
  actor_id?: string;
  target_ref: CanonicalRef;
};

export type WorkflowEvidenceView = {
  evidence_refs: CanonicalRef[];
  safe_summary: string;
};

export type WorkflowSurfaceAdapters = {
  chat_workflow_control: ChatWorkflowAdapter;
  web_run_workbench: WorkflowRunWorkbenchAdapter;
  mobile_dashboard: WorkflowDashboardAdapter;
  admin_operator: WorkflowAdminAdapter;
  worker_runtime: WorkflowRuntimePort;
};

export type WorkflowRunWorkbenchAdapter = {
  get_run_detail(input: RunDetailInput): Promise<WorkflowRunWorkbench>;
  execute_action(input: WorkflowActionCommand): Promise<WorkflowActionResult>;
  get_artifact_preview(input: ArtifactPreviewInput): Promise<WorkflowArtifactPreview>;
  create_handoff(input: HandoffRequestInput): Promise<WorkflowHandoffResult>;
};

export type WorkflowDashboardAdapter = {
  list_cards(input: DashboardCardListInput): Promise<WorkflowDashboardCard[]>;
  get_run_summary(input: RunSummaryInput): Promise<WorkflowMobileSummary>;
  execute_action(input: WorkflowActionCommand): Promise<WorkflowActionResult>;
};

export type WorkflowAdminAdapter = {
  validate_module(input: ModuleValidationInput): Promise<WorkflowModuleValidationReport>;
  publish_version(input: PublishVersionInput): Promise<WorkflowAdminSummary>;
  disable_capability(input: DisableCapabilityInput): Promise<WorkflowAdminSummary>;
  get_evidence(input: EvidenceReadInput): Promise<WorkflowEvidenceView>;
};
```

```ts
export type ChatWorkflowAdapter = {
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

Chat adapter conflict payloads must use `ChatConflictSummary` only. Detailed
workflow conflicts are mapped to chat-safe statuses before leaving the concrete
workflow:

```ts
export type ChatConflictSummary = {
  conflict_id: string;
  status: "blocked" | "unavailable" | "needs_review";
  severity: "info" | "warning" | "blocking";
  safe_title: string;
  safe_message: string;
  reason_code: string;
  target_link?: string;
};

export type ChatDashboardSummary = {
  counts: {
    running: number;
    completed: number;
    blocked: number;
    needs_review: number;
    unavailable: number;
  };
  conflicts: ChatConflictSummary[];
  links: Array<{
    label: string;
    target_link: string;
  }>;
};
```

Chat must not receive domain context refs, expected/actual versions, resolver
errors, allowed resolution actions, raw artifact/domain payloads, or evidence
details.

Resolution actions are declared by standard name and implemented by the concrete
workflow. They are exposed only to Web/Admin operation surfaces, except ordinary
lightweight workflow commands such as `cancel_run` where a mobile surface is
explicitly allowed.

```ts
export type ResolutionAction =
  | "confirm_continue_snapshot"
  | "reselect_context"
  | "refresh_context"
  | "edit_domain_object"
  | "rerun_step"
  | "cancel_run"
  | "suppress_artifact"
  | "admin_repair";

export type ResolutionActionRequest = {
  action: ResolutionAction;
  target_type: "run" | "step" | "artifact" | "approval" | "handoff" | "context";
  target_id: string;
  conflict_id: string;
  expected_version: number;
  reason_code: string;
  actor_id: string;
  workspace_id: string;
  idempotency_key: string;
  correlation_id: string;
  client_surface: "web_run_workbench" | "web_domain_workbench" | "admin_operator" | "mobile_dashboard";
};
```

Chat must not submit `ResolutionActionRequest`; it may only expose the
`target_link` supplied in `ChatConflictSummary`.

Concrete workflows must append minimal evidence records for high-risk
resolution actions, denied attempts, handoff transitions, and domain context
mutations that can affect more than one workflow. This is an implementation
obligation for the concrete workflow, not a full audit product requirement.

```ts
export type EvidenceRecord = {
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
  policy_version?: number;
  resolver_key?: string;
  correlation_id: string;
  trace_id?: string;
  created_at: string;
};
```

Evidence records store ids, versions, reason codes, policy/resolver keys, and
trace metadata only. They must not store private bodies, prompt/provider
payloads, object keys, vectors, secrets, or full before/after snapshots.

Presenter rules:
- Projection presenters may return L0-L2 only.
- Web workbench and admin exception presenters may return L3 only after
  authorization.
- Presenters must include reason codes for unavailable actions.
- Presenters must not expose raw provider payloads, object keys, prompt bodies,
  vectors, secrets, or tokens.

## Policy contract

```ts
export type WorkflowPolicies = {
  can_start_run(input: PolicyInput): Promise<PolicyDecision>;
  can_preview_artifact(input: ArtifactPolicyInput): Promise<PolicyDecision>;
  can_create_handoff(input: HandoffPolicyInput): Promise<PolicyDecision>;
  can_admin_govern(input: AdminPolicyInput): Promise<PolicyDecision>;
};

export type PolicyDecision = {
  allowed: boolean;
  reason_code: string;
  policy: string;
  evidence_hints?: Record<string, unknown>;
};

export type HandoffPolicyInput = ArtifactPolicyInput & {
  handoff_type: string;
  requested_purpose: string;
  source_refs: CanonicalRef[];
};
```

Unknown policy, missing purpose, stale lifecycle, or unsupported surface defaults
to deny.

## Event contract

Scenario modules may emit only registered event names. Event payloads are
bodyless and contain ids, versions, reason codes, trace metadata, and
actor/workspace ids. Canonical statuses stay in the canonical aggregate and are
read after reread.

Event registry has three layers.

Layer 1: platform events. These belong to host product owners outside workflow,
for example content, public draft, publication, forum, knowledge, notification,
personalization, projection invalidation, and evidence/audit owners. Concrete
workflow modules may trigger them only through the appropriate owner API or
handoff receipt path.

Layer 2: standard workflow events. These are the only workflow events that
shared product consumers may depend on:

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

Run terminal states are carried by `workflow.run.updated` plus canonical
`run.status`; the registry intentionally avoids separate
`workflow.run.completed` and `workflow.run.failed` events.

Standard workflow event payloads use one refs-only shape:

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

Payload minimums:

| Event family | Aggregate | Required payload refs |
|---|---|---|
| `workflow.run.created` | `workflow_run` | scenario/capability/entrypoint/version refs |
| `workflow.run.updated` | `workflow_run` | `reason_code?` |
| `workflow.step.*` | `workflow_step` | `run_id`, `step_id`, `reason_code?` |
| `workflow.approval.*` | `workflow_approval` | `approval_id`, `target_type`, `target_id`, `expected_versions?` |
| `workflow.artifact.*` | `workflow_artifact` | `artifact_id`, `run_id?`, `source_refs?`, `invalidation_reason?` |
| `workflow.handoff.*` | `workflow_handoff` | `handoff_id`, `handoff_type`, `source_refs`, `expected_versions`, `requested_purpose` |
| `workflow.context.*` | `workflow_context_binding` | `context_binding_id`, `target_type`, `target_id`, `source_refs` |
| `workflow.evidence.recorded` | `workflow_evidence` | `evidence_id`, `target_type`, `target_id` |

Payloads must not include canonical status fields. Consumers reread canonical
state and derive behavior through presenters.

Default standard idempotency key:

```txt
{event_type}:{aggregate_id}:{aggregate_version}
```

Use a deterministic suffix only when one aggregate version emits multiple
same-type events. Random UUID idempotency keys are not replay-safe.

Layer 3: scenario internal events. These may exist for concrete implementation
internals, deterministic tests, or migration bridges, but shared chat, mobile,
forum, RAG, notification, PPR, and search consumers must not require them.

Scenario internal event name format:

```txt
{scenario_key}.{capability_key}.{aggregate}.{verb}
```

Examples:

```txt
example.authoring.artifact.generated
example.review.input.received
example.evaluation.result.generated
second_scenario.delivery.plan.generated
```

Event payloads must be sufficient for routing and idempotency, not for downstream
business execution. Downstream systems reread canonical state from the workflow
ledger, handoff ledger, content/public-draft owner, knowledge owner,
notification owner, or personalization owner.

Minimum downstream signal fields:
- `body: "no_body"` and `pii: "no_pii"`
- `source_refs` or `target_type` / `target_id`
- `expected_versions` when downstream reread must guard staleness
- `handoff_id`, `handoff_type`, and `requested_purpose` for handoffs
- `reason_code` or `invalidation_reason` for unavailable or cleanup paths
- `correlation_id`, `causation_id`, `trace_id`, actor/workspace ids, and
  idempotency key from the standard event envelope

Forbidden event payloads:
- raw input or artifact body
- private feedback, protected subject data, prompt bodies, provider payloads, or
  memory text
- object storage keys, signed URLs, tokens, secrets, vectors, or embedding text
- permission/PBR internals, billing details, or full before/after snapshots

Scenario-specific event names may exist for implementation internals, but shared
product consumers must rely on standard workflow events and platform events.

Event ownership follows the canonical aggregate owner:

| Event family | Producer owner | Allowed shared consumers |
|---|---|---|
| Platform events | Corresponding platform owner | Owner downstreams and declared integration readers |
| `workflow.run.*` | Workflow ledger command/service | Projection, notification source reader, admin replay |
| `workflow.step.*` | Workflow worker/ledger write path | Projection, admin replay |
| `workflow.approval.*` | Workflow approval command/service | Projection, notification source reader, admin replay |
| `workflow.artifact.*` | Workflow artifact repository/service | Projection, notification source reader, handoff policy evaluator, admin replay |
| `workflow.handoff.*` | Handoff ledger service | Public draft/forum, RAG/knowledge, notification, admin replay |
| `workflow.context.*` | Context binding/resolver owner | Workflow replay, admin, downstream invalidation evaluator |
| `workflow.evidence.recorded` | Evidence log writer | Admin/replay/compliance tooling |
| Scenario internal events | Scenario module | No shared consumers |

Manifests must declare `event_registry.producers` and
`event_registry.consumers` so validation can reject shared consumers that depend
on scenario internal events or direct workflow writes into downstream systems.

## Standard API closure
Concrete workflow modules must provide the standard API or adapter closure used
by product surfaces:

| Adapter/API group | Required capability | Shared consumers |
|---|---|---|
| Discovery | scenario/capability list and detail | Chat, web, mobile, admin |
| Start requirements | pre-run requirement read, preview, start run | Chat workflow control, web workbenches |
| Run lifecycle | start/detail/timeline | Chat, web run workbench, mobile, admin, worker runtime |
| Action command | approve/reject/retry/cancel/suppress/confirm/create handoff with expected version | Chat after strong confirmation, web run workbench, mobile, admin |
| Artifact preview | list and preview by exposure level | Chat citation, web, mobile, admin |
| Handoff | request and receipt ledger operations | Web, mobile, downstream owners, admin replay |
| Dashboard | display cards, safe summaries, target links | Chat dashboard summary, mobile dashboard, web list views |
| Admin governance | validate, publish, enable/disable, rebuild, evidence | Admin/operator |
| Worker runtime | claim/complete/fail step through canonical identity | Worker runtime only |

Scenario-specific APIs may extend only Web/Admin operation surfaces. They cannot
replace the standard closure for chat, mobile, forum, RAG, notification, public
links, external clients, or worker dispatch.

## Validation contract
The base defines validator rules. The host product implements the validator in
CI, module registration, or an admin dry-run command. Validation does not make
the base a runtime service.

Validator inputs:
- scenario manifest or equivalent TypeScript contract
- TypeScript registries for handlers, actions, adapters, presenters, policies,
  internal APIs, and tests
- host registry snapshots for scenarios, domain resolvers, downstream owners,
  standard workflow events, platform events, and allowed surfaces
- projection review records when a module adds or changes projected fields

Validator output:

```ts
export type WorkflowModuleValidationReport = {
  scenario_key: string;
  manifest_version: number;
  contract_hash?: string;
  activation_target: "dev" | "pilot" | "ga" | "disabled";
  status: "pass" | "warn" | "fail";
  findings: Array<{
    rule_id: string;
    severity: "fatal" | "warning" | "info";
    path: string;
    message: string;
    owner: "scenario" | "host" | "downstream";
    remediation: string;
  }>;
};
```

Fatal findings block pilot/GA activation. Warnings may be allowed only for
explicitly timeboxed migration bridges.

Minimum validation rules:

| Rule id | Severity | Check |
|---|---|---|
| `WF-MAN-001` | Fatal | `scenario_key` matches a canonical `Scenario` record and the target status is compatible with `launch_phase`. |
| `WF-MAN-002` | Fatal | Published manifest hash/version is stored on the `Scenario` record before pilot/GA activation. |
| `WF-MAN-010` | Fatal | Every declared step has exactly one registered handler key. |
| `WF-MAN-011` | Fatal | Every declared shared/scenario action has a registered action handler and requires expected versions for durable writes. |
| `WF-MAN-012` | Fatal | Every declared surface has a presenter or adapter binding. |
| `WF-MAN-013` | Fatal | Policies default-deny unsupported surfaces, actions, handoffs, and artifact exposure paths. |
| `WF-MAN-014` | Fatal | Every supported shared surface maps to the standard API/adapter closure and does not require scenario-specific product APIs. |
| `WF-MAN-020` | Fatal | Internal APIs are Web/Admin-only and are declared with owner surface, command class, and handler key. |
| `WF-MAN-021` | Fatal | Chat, mobile, forum, RAG, notification, public links, and external clients do not consume internal APIs. |
| `WF-MAN-030` | Fatal | Domain context ref types declare resolver keys and owner scope; workflow does not declare itself as canonical domain owner. |
| `WF-MAN-031` | Fatal | `step_interventions` are restricted to `web_run_workbench`; chat does not declare or consume them. |
| `WF-MAN-040` | Fatal | Handoffs declare type, source artifact types, requested purposes, downstream owner, policy key, and receipt requirement. |
| `WF-MAN-041` | Fatal | Public draft, indexing, notification, and external delivery side effects are reachable only through handoff or owner APIs. |
| `WF-MAN-050` | Fatal | Standard workflow events match the base registry; scenario internal events use `{scenario_key}.{capability_key}.{aggregate}.{verb}`. |
| `WF-MAN-051` | Fatal | `event_registry.producers` maps every emitted event to an allowed owner and write boundary. |
| `WF-MAN-052` | Fatal | Shared consumer `allowed_events` contain no scenario internal events. |
| `WF-MAN-053` | Fatal | Event payload policy is refs-only: `body=no_body`, `pii=no_pii`, no canonical status, no presenter output. |
| `WF-MAN-054` | Fatal | Standard event idempotency keys are deterministic. |
| `WF-MAN-060` | Fatal | Outbox events are registered, classified, and produced with the canonical write where possible. |
| `WF-MAN-070` | Fatal | P0/P1 authoritative writes have minimal evidence record declarations. |
| `WF-MAN-080` | Fatal | Projection field changes have a projection review record before activation. |
| `WF-MAN-090` | Fatal | Deterministic tests and at least one journey harness are declared. |

Activation phases:

| Phase | Gate |
|---|---|
| `dev` | Manifest parses; handler/action/adapter/presenter/policy registries can be incomplete only inside local development fixtures. |
| `pilot` | All fatal rules pass; migration bridges are documented and timeboxed. |
| `ga` | All fatal rules pass; no shared consumer depends on migration bridge events; rollback path and replay path are proven. |
| `disabled` | Module remains registered only for historical replay, migration, or controlled rollback. |

## Registry loader contract
The base defines the loader contract shape. The host product owns the actual
registry loader, dependency injection, routing, worker dispatch, and CI/admin
commands.

Loader rules:
- load approved scenario modules at deploy or application boot, not from user
  input or per-request dynamic code
- run validation before registration and fail fast on fatal findings
- never execute YAML as code; YAML or TS contracts declare keys, while
  TypeScript registries provide executable bindings
- make the registered registry read-only after boot; activation changes happen
  through scenario/version records and deployment, not mutable in-memory edits
- route all product surfaces through standard adapters/APIs and presenters
- mount internal APIs only for declared Web/Admin owner surfaces
- keep disabled modules available only for historical replay, rollback, or
  controlled migration

Registered descriptor:

```ts
export type RegisteredWorkflowScenario = {
  scenario_key: string;
  manifest_version: number;
  contract_hash: string;
  launch_phase: "dev" | "pilot" | "ga" | "disabled";
  capabilities: CapabilityManifest[];
  scenario_record: ScenarioRecordBinding;
  handlers: WorkflowHandlerRegistry;
  actions: WorkflowActionRegistry;
  adapters: WorkflowSurfaceAdapters;
  presenters: WorkflowPresenters;
  policies: WorkflowPolicies;
  internal_api?: WorkflowInternalApiRegistry;
  handoffs: HandoffManifest[];
  event_registry: EventRegistryManifest;
  validation_report: WorkflowModuleValidationReport;
};
```

Runtime resolution must use canonical workflow identity, not ad hoc module
names:

```txt
scenario_key
capability_key
entrypoint_key
workflow_version_id
step_key
handler_key
contract_hash
```

Worker dispatch resolves `handler_key` from the validated registry and verifies
that the run's stored `contract_hash` and workflow version are compatible before
executing a step. Surface routing resolves presenters/adapters from the same
registered descriptor and still rereads canonical state before durable writes.

Minimum loader rules:

| Rule id | Severity | Check |
|---|---|---|
| `WF-LOAD-001` | Fatal | Module registration has a passing validation report for the activation target. |
| `WF-LOAD-002` | Fatal | `scenario_key`, capability keys, entrypoint keys, step keys, handler keys, action keys, presenter keys, and policy keys are unique inside the registered module. |
| `WF-LOAD-003` | Fatal | Registered `contract_hash` matches the canonical `Scenario` record or approved version record for pilot/GA. |
| `WF-LOAD-004` | Fatal | Worker dispatch can resolve every declared `handler_key` from canonical run identity and stored contract hash. |
| `WF-LOAD-005` | Fatal | Surface routing exposes only standard adapters/presenters to chat, mobile, forum, RAG, notification, public links, and external clients. |
| `WF-LOAD-006` | Fatal | Internal APIs are mounted only for declared Web/Admin owner surfaces. |
| `WF-LOAD-007` | Fatal | Disabled modules cannot start new runs except through explicit migration/replay tooling. |
| `WF-LOAD-008` | Warning | Migration bridge events or legacy handlers are present and must have an owner, expiry, and removal checkpoint. |

## Activation gates
A module is not plug-and-play until these gates pass:

1. Canonical `Scenario` record exists and matches manifest `scenario_key`.
2. Manifest validates and has a published version/hash.
3. Repository interfaces exist.
4. API commands use standard envelopes.
5. Step handlers are registered for every step.
6. Action handlers are registered for every declared scenario action.
7. Presenters exist for all declared surfaces.
8. Policies default-deny unsupported paths.
9. Internal APIs, if any, are contract-declared and Web/Admin-only.
10. Handoff types are registered and receipts are required where declared.
11. Outbox events are registered, bodyless, and classified as platform,
    standard workflow, or scenario internal.
12. Event producers and consumers are declared, and no shared consumer depends
    on scenario internal events.
13. Registry loader can register the module and resolve handlers, actions,
    presenters, policies, and internal APIs from canonical workflow identity.
14. Projection fields are reviewed.
15. Deterministic tests pass.
16. At least one journey harness proves start -> step -> artifact -> surface
    consumption.
