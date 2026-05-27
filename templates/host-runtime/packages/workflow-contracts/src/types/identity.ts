export type WorkflowSurface =
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

export type WorkflowExposureLevel = "L0" | "L1" | "L2" | "L3" | "L4";
export type WorkflowActivationTarget = "dev" | "pilot" | "ga" | "disabled";
export type WorkflowScenarioStatus = "draft" | "pilot" | "active" | "disabled" | "archived";

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

export type DomainContextRef = {
  namespace: string;
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

export type WorkflowCommandMeta = {
  workspace_id: string;
  actor_id?: string;
  idempotency_key: string;
  correlation_id: string;
  trace_id?: string;
  client_surface: WorkflowSurface;
};

export type WorkflowCommandResponse<T> = {
  ok: true;
  data: T;
  canonical_refs: CanonicalRef[];
  aggregate_versions: Record<string, number>;
  action_availability: WorkflowActionAvailability[];
  outbox_event_ids: string[];
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
