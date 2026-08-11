import type {
  ChatDashboardSummary,
  ChatWorkflowAdapter,
  WorkflowArtifactPreview,
  WorkflowArtifactDraft,
  WorkflowDashboardCard,
  WorkflowMobileSummary,
  WorkflowRunWorkbench,
  WorkflowRuntimePort,
  WorkflowSurfaceAdapters,
  ContextBindingDraft,
  OutboxEventDraft,
} from "./api.js";
import type { WorkflowHandoffDraft } from "./handoff.js";
import type { CanonicalRef, WorkflowCommandMeta, WorkflowCommandResponse, WorkflowRunRef } from "./identity.js";
import type { ScenarioManifest } from "./manifest.js";
import type { ScenarioPrivateInvocationV1 } from "./scenario-invocation.js";
import type { WorkflowModuleValidationReport } from "./validation.js";

export type WorkflowStepHandlerInput = {
  run_id: string;
  step_id: string;
  step_key: string;
  claim_token?: string;
  expected_step_version?: number;
  scenario_key: string;
  capability_key: string;
  entrypoint_key: string;
  workflow_version_id: string;
  contract_hash: string;
  meta: WorkflowCommandMeta;
};

export type WorkflowStepHandlerResult = {
  status?: "completed" | "retry_requested" | "manual_review_required";
  output_refs: CanonicalRef[];
  artifact_drafts?: WorkflowArtifactDraft[];
  context_bindings?: ContextBindingDraft[];
  handoff_drafts?: WorkflowHandoffDraft[];
  event_drafts?: OutboxEventDraft[];
  reason_code?: string;
};

export type WorkflowStepHandler = (
  input: WorkflowStepHandlerInput,
) => Promise<WorkflowStepHandlerResult>;

export type WorkflowActionHandler = (
  input: WorkflowStepHandlerInput & { action: string; expected_version: number },
) => Promise<WorkflowCommandResponse<WorkflowRunRef>>;

export type WorkflowHandlerRegistry = Record<string, WorkflowStepHandler>;
export type WorkflowActionRegistry = Record<string, WorkflowActionHandler>;

export type WorkflowPresenters = {
  chat_dashboard_summary(input: { workspace_id: string; actor_id?: string }): Promise<ChatDashboardSummary>;
  dashboard_card(input: { run_id: string; actor_id?: string }): Promise<WorkflowDashboardCard>;
  artifact_preview(input: { artifact_id: string; actor_id?: string }): Promise<WorkflowArtifactPreview>;
  mobile_summary(input: { workspace_id: string; actor_id?: string; run_id: string }): Promise<WorkflowMobileSummary>;
  web_run_workbench(input: { workspace_id: string; actor_id?: string; run_id: string }): Promise<WorkflowRunWorkbench>;
};

export type WorkflowPolicies = Record<string, (input: Record<string, unknown>) => Promise<boolean>>;

export type WorkflowInternalApiHandler = (input: {
  method: string;
  path: string;
  payload: unknown;
  meta: WorkflowCommandMeta;
}) => Promise<unknown>;

export type WorkflowInternalApiRegistry = Record<string, WorkflowInternalApiHandler>;

export type ScenarioTrustedInvocationDeclarationV1 = {
  scenario_key: string;
  endpoint_key: string;
  method: "POST";
  operation_key: string;
  input_schema_version: number;
  ingress_category: ScenarioPrivateInvocationV1["route"]["ingress"]["ingress_category"];
  ingress_key: string;
  principal_origins: readonly ScenarioPrivateInvocationV1["principal"]["principal_origin"][];
};

/**
 * Sanitized output of the trusted transport verification boundary.
 * Detached signatures, transport credentials and trust-policy key material
 * must not be forwarded to scenario handlers.
 */
export type WorkflowVerifiedScenarioInvocationV1<TInput = unknown> = {
  invocation: ScenarioPrivateInvocationV1<TInput>;
  declaration: ScenarioTrustedInvocationDeclarationV1;
};

export type WorkflowTrustedInvocationHandler = (
  verified: WorkflowVerifiedScenarioInvocationV1,
) => Promise<unknown>;

export type WorkflowTrustedInvocationHandlerRegistry = Record<
  string,
  WorkflowTrustedInvocationHandler
>;

export type WorkflowScenarioModule = {
  manifest: ScenarioManifest;
  handlers: WorkflowHandlerRegistry;
  actions: WorkflowActionRegistry;
  adapters: WorkflowSurfaceAdapters & {
    chat_workflow_control: ChatWorkflowAdapter;
    worker_runtime: WorkflowRuntimePort;
  };
  presenters: WorkflowPresenters;
  policies: WorkflowPolicies;
  trusted_invocation_handlers: WorkflowTrustedInvocationHandlerRegistry;
  internal_api_handlers: WorkflowInternalApiRegistry;
};

export type RegisteredWorkflowScenario = {
  scenario_key: string;
  contract_hash: string;
  manifest: ScenarioManifest;
  handlers: WorkflowHandlerRegistry;
  actions: WorkflowActionRegistry;
  adapters: WorkflowSurfaceAdapters;
  presenters: WorkflowPresenters;
  policies: WorkflowPolicies;
  trusted_invocation_handlers: WorkflowTrustedInvocationHandlerRegistry;
  internal_api_handlers: WorkflowInternalApiRegistry;
  validation: WorkflowModuleValidationReport;
};
