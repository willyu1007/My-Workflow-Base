import type {
  CanonicalRef,
  DomainContextRef,
  WorkflowActionAvailability,
  WorkflowCommandMeta,
  WorkflowCommandResponse,
  WorkflowExposureLevel,
  WorkflowRunRef,
} from "./identity.js";
import type { HandoffRequestInput, WorkflowHandoffResult } from "./handoff.js";
import type { WorkflowSignalPayload } from "./events.js";

export type WorkflowStartRequirement = {
  requirement_key: string;
  schema_version: number;
  required: boolean;
  safe_label: string;
  safe_help?: string;
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

export type ChatStartRunInput = {
  workspace_id: string;
  actor_id?: string;
  scenario_key: string;
  capability_key: string;
  entrypoint_key: string;
  requirement_values: Record<string, unknown>;
  context_refs: DomainContextRef[];
  meta: WorkflowCommandMeta;
};

export type StrongConfirmActionInput = {
  workspace_id: string;
  actor_id?: string;
  action: "approve" | "reject" | "confirm";
  target_ref: CanonicalRef;
  expected_version: number;
  reason_code: string;
  meta: WorkflowCommandMeta;
};

export type WorkflowActionKind =
  | "start_run"
  | "submit_start_requirements"
  | "approve"
  | "reject"
  | "confirm"
  | "retry"
  | "cancel"
  | "suppress"
  | "request_manual_review"
  | "step_intervention"
  | "create_handoff";

export type ChatDashboardSummary = {
  safe_title: string;
  safe_summary: string;
  run_refs: CanonicalRef[];
  action_availability: WorkflowActionAvailability[];
};

export type WorkflowArtifactPreview = {
  artifact_id: string;
  run_id: string;
  artifact_type: string;
  exposure_level: WorkflowExposureLevel;
  safe_title?: string;
  safe_summary?: string;
  safe_preview?: string;
  unavailable_reason?: string;
  aggregate_version: number;
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
  findings?: unknown[];
};

export type WorkflowEvidenceView = {
  evidence_refs: CanonicalRef[];
  safe_summary: string;
};

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
  exposure_level: WorkflowExposureLevel;
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
    status?: "completed" | "retry_requested" | "manual_review_required";
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

export type ChatWorkflowAdapter = {
  recommend(input: ChatRecommendInput): Promise<ChatWorkflowRecommendation[]>;
  start_run(input: ChatStartRunInput): Promise<WorkflowCommandResponse<WorkflowRunRef>>;
  execute_strong_confirmed_action(input: StrongConfirmActionInput): Promise<WorkflowCommandResponse<WorkflowRunRef>>;
  summarize_dashboard(input: { workspace_id: string; actor_id?: string; limit?: number }): Promise<ChatDashboardSummary>;
};

export type WorkflowActionCommand = {
  workspace_id: string;
  actor_id?: string;
  action: WorkflowActionKind | (string & {});
  target_ref: CanonicalRef;
  expected_version: number;
  reason_code: string;
  meta: WorkflowCommandMeta;
  client_surface: string;
  reason_text?: string;
};

export type WorkflowActionResult = {
  target: CanonicalRef;
  run?: WorkflowRunRef;
  affected_refs: CanonicalRef[];
  action_availability: WorkflowActionAvailability[];
};

export type WorkflowRunWorkbenchAdapter = {
  get_run_detail(input: { workspace_id: string; actor_id?: string; run_id: string }): Promise<WorkflowRunWorkbench>;
  execute_action(input: WorkflowActionCommand): Promise<WorkflowActionResult>;
  get_artifact_preview(input: {
    workspace_id: string;
    actor_id?: string;
    artifact_id: string;
    requested_level: WorkflowExposureLevel;
  }): Promise<WorkflowArtifactPreview>;
  create_handoff(input: HandoffRequestInput): Promise<WorkflowHandoffResult>;
};

export type WorkflowDashboardAdapter = {
  list_cards(input: { workspace_id: string; actor_id?: string; status?: string; limit?: number }): Promise<WorkflowDashboardCard[]>;
  get_run_summary(input: { workspace_id: string; actor_id?: string; run_id: string }): Promise<WorkflowMobileSummary>;
  execute_action(input: WorkflowActionCommand): Promise<WorkflowActionResult>;
};

export type WorkflowAdminAdapter = {
  validate_module(input: { scenario_key: string; activation_target: string }): Promise<WorkflowAdminSummary>;
  publish_version(input: {
    scenario_key: string;
    capability_key?: string;
    manifest_version: number;
    contract_hash: string;
    dry_run: boolean;
    change_summary: string;
  }): Promise<WorkflowAdminSummary>;
  disable_capability(input: {
    scenario_key: string;
    capability_key: string;
    reason_code: string;
  }): Promise<WorkflowAdminSummary>;
  get_evidence(input: { workspace_id: string; actor_id?: string; target_ref: CanonicalRef }): Promise<WorkflowEvidenceView>;
};

export type WorkflowSurfaceAdapters = {
  chat_workflow_control: ChatWorkflowAdapter;
  web_run_workbench: WorkflowRunWorkbenchAdapter;
  mobile_dashboard: WorkflowDashboardAdapter;
  admin_operator: WorkflowAdminAdapter;
  worker_runtime: WorkflowRuntimePort;
};

export type WorkflowHandoffAdapter = {
  request(input: HandoffRequestInput): Promise<WorkflowHandoffResult>;
};
