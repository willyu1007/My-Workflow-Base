# Workflow module contract

## Purpose
This document defines how a scenario module plugs into the workflow base. A
module is not a plugin marketplace package and does not execute arbitrary code
from users. It is a controlled product module authored in the repo or approved
distribution.

## Module shape

```ts
export type WorkflowScenarioModule = {
  manifest: ScenarioManifest;
  repositories: ScenarioRepositoryFactory;
  handler_registry: WorkflowHandlerRegistry;
  action_registry: WorkflowActionRegistry;
  presenters: WorkflowPresenters;
  policies: WorkflowPolicies;
  tests: WorkflowScenarioTestContract;
  internal_api?: WorkflowInternalApiRegistry;
};
```

The host application registers scenario modules at boot:

```ts
registerWorkflowScenario(educationScenarioModule);
registerWorkflowScenario(localLifeScenarioModule);
```

Registration fails if manifest keys, registry bindings, presenters, policies, or
tests are missing.

YAML is the declarative contract. TypeScript registries are the executable
binding. The platform must never dynamically execute user-authored YAML as code.

```ts
export type WorkflowHandlerRegistry = Record<string, WorkflowStepHandler>;
export type WorkflowActionRegistry = Record<string, WorkflowActionHandler>;
export type WorkflowPresenterRegistry = Record<string, unknown>;
export type WorkflowInternalApiRegistry = Record<string, unknown>;
```

Every registry key must be declared in the manifest. Every manifest handler,
action, presenter, policy, and internal route key must have a registry binding.

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
  | "grade"
  | "artifact_write"
  | "approval_gate"
  | "emit_event";

export type ScenarioDataManifest = {
  domain_fact_types: Array<{
    object_type: string;
    schema_version: number;
    shared_across_workflows: boolean;
    repository_key: string;
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
  outbox_events: string[];
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
2. Validate `scenario.manifest.yaml` against the module schema.
3. Verify manifest `scenario_key` and `scenario_record` match canonical state.
4. Verify every manifest registry key exists in TypeScript.
5. Verify every TypeScript registry key is declared by the manifest.
6. Run deterministic manifest and journey tests.
7. Compute `manifest_hash`.
8. Publish by updating `current_manifest_version`,
   `current_manifest_hash`, `policy_version`, and `aggregate_version`.

Runtime APIs reject disabled scenarios, unknown manifest hashes, stale expected
versions, and modules whose boot-time registry does not match the published
manifest.

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
  domain: Record<string, unknown>;
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
  repositories, audit, and outbox.
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
  audit_hints?: Record<string, unknown>;
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
bodyless and contain ids, versions, statuses, reason codes, trace metadata, and
actor/workspace ids.

Event name format:

```txt
{scenario_key}.{capability_key}.{aggregate}.{verb}
```

Examples:

```txt
education.homework.assignment.generated
education.homework.submission.received
education.homework.diagnosis.generated
local_life.booking.plan.generated
```

Shared platform events may keep platform names:

```txt
workflow.run.created
workflow.step.completed
workflow.artifact.created
workflow.approval.resolved
workflow.handoff.requested
workflow.handoff.receipted
```

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
9. Internal APIs, if any, are manifest-declared and Web/Admin-only.
10. Handoff types are registered and receipts are required where declared.
11. Outbox events are registered and bodyless.
12. Projection fields are reviewed.
13. Deterministic tests pass.
14. At least one journey harness proves start -> step -> artifact -> surface
    consumption.
