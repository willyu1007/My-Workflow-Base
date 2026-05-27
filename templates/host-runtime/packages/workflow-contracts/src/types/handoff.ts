import type { CanonicalRef, WorkflowCommandMeta } from "./identity.js";

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
