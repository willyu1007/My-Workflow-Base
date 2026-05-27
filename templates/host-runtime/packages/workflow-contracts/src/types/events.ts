import type { CanonicalRef } from "./identity.js";

export const standardWorkflowEvents = [
  "workflow.run.created",
  "workflow.run.updated",
  "workflow.step.started",
  "workflow.step.completed",
  "workflow.step.failed",
  "workflow.step.retry_requested",
  "workflow.step.manual_review_required",
  "workflow.approval.requested",
  "workflow.approval.resolved",
  "workflow.artifact.created",
  "workflow.artifact.updated",
  "workflow.artifact.deleted",
  "workflow.artifact.expired",
  "workflow.handoff.requested",
  "workflow.handoff.receipt_recorded",
  "workflow.handoff.invalidated",
  "workflow.context.bound",
  "workflow.context.rebind_required",
  "workflow.context.rebound",
  "workflow.evidence.recorded",
] as const;

export type StandardWorkflowEvent = (typeof standardWorkflowEvents)[number];

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

export type EventProducerDeclaration = {
  owner: string;
  write_boundary: "same_transaction" | "scenario_internal" | "downstream_owner";
};

export type EventConsumerDeclaration = {
  allowed_events: string[];
  forbidden_events?: string[];
};

export type EventRegistryManifest = {
  standard_workflow_events: string[];
  scenario_internal_events: string[];
  platform_events?: string[];
  event_payload_policy: {
    signal_version: 1;
    body: "no_body";
    pii: "no_pii";
    status_in_payload: false;
    presenter_output_in_payload: false;
    idempotency_key: string;
  };
  producers: Record<string, EventProducerDeclaration>;
  consumers: Record<string, EventConsumerDeclaration>;
};
