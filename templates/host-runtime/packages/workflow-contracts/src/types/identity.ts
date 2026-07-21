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

/** Release metadata only. Runtime traffic is controlled by workspace activation. */
export const scenarioLaunchPhases = ["dev", "pilot", "ga", "disabled"] as const;
export type ScenarioLaunchPhase = (typeof scenarioLaunchPhases)[number];

/** @deprecated Use ScenarioLaunchPhase. This value never authorizes traffic. */
export type WorkflowActivationTarget = ScenarioLaunchPhase;

export const workflowScenarioStatuses = ["draft", "active", "disabled", "archived"] as const;
export type WorkflowScenarioStatus = (typeof workflowScenarioStatuses)[number];

export const scenarioWorkspaceActivationStatuses = [
  "disabled",
  "canary",
  "enabled",
  "suspended",
] as const;
export type ScenarioWorkspaceActivationStatus = (typeof scenarioWorkspaceActivationStatuses)[number];

export const isScenarioWorkspaceTrafficEnabled = (
  status: ScenarioWorkspaceActivationStatus,
): boolean => status === "canary" || status === "enabled";

/** Explicit legacy workflow-ledger ref. New durable/cross-owner writes use CanonicalRefV1. */
export type LegacyCanonicalRefV0 = {
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

/** @deprecated Read/replay compatibility only; never accept this shape on new federation writes. */
export type CanonicalRef = LegacyCanonicalRefV0;

/** Explicit legacy context ref. New durable/cross-owner writes use CanonicalRefV1. */
export type LegacyDomainContextRefV0 = {
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

/** @deprecated Read/replay compatibility only; never accept this shape on new federation writes. */
export type DomainContextRef = LegacyDomainContextRefV0;

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
