import type { CanonicalRef, WorkflowCommandMeta } from "./identity.js";

export type ScenarioHandoffRequestSnapshot = {
  requestId: string;
  handoffKey: string;
  requestedPurpose: string;
  sourceContextRefs?: CanonicalRef[];
  sourceArtifactRefs?: CanonicalRef[];
  expiresAt?: string;
};

export type WorkflowHandoffDraft = {
  draft_key: string;
  handoff_key: string;
  requested_purpose: string;
  source_context_refs?: CanonicalRef[];
  source_refs?: CanonicalRef[];
  expected_versions?: Record<string, number>;
  expires_at?: string;
};

export type ScenarioCommandDriverContext = {
  driverRef: CanonicalRef;
  contractHash: string;
  capabilityKey: string;
  entrypointKey: string;
  /** Transient claim evidence. Never persist, hash, log, or expose this value. */
  claimToken: string;
  expectedStepVersion: number;
};

export type WorkflowHandoffLifecycleStatusV1 = "requested" | "completed" | "stopped" | "failed";

export type HandoffMaterializationDisposition = "created" | "existing";

export type WorkflowHandoffRef = CanonicalRef & {
  namespace: "my_chat";
  object_type: "workflow_handoff";
};

export type MaterializedHandoff = {
  draft_key: string;
  handoff_ref: WorkflowHandoffRef;
  disposition: HandoffMaterializationDisposition;
};

export type HandoffRequestInput = {
  handoff_type: string;
  source_refs: CanonicalRef[];
  requested_purpose: string;
  expected_versions?: Record<string, number>;
  policy_key: string;
  downstream_owner: string;
  meta: WorkflowCommandMeta;
};

export type HandoffReceiptInput = {
  handoff_id: string;
  downstream_refs: CanonicalRef[];
  status: "accepted" | "rejected" | "completed" | "failed";
  reason_code?: string;
  meta: WorkflowCommandMeta;
};

export type HandoffInvalidationInput = {
  handoff_id: string;
  reason_code: string;
  meta: WorkflowCommandMeta;
};

export type WorkflowHandoffResult = {
  handoff_id: string;
  handoff_type: string;
  status: "requested" | "accepted" | "rejected" | "duplicate" | "completed" | "failed" | "invalidated";
  source_refs: CanonicalRef[];
  downstream_refs: CanonicalRef[];
  reason_code?: string;
  aggregate_version: number;
};
