import type { CanonicalRef, WorkflowCommandMeta } from "@host/workflow-contracts";

export type EvidenceRepository = {
  append(input: {
    target_ref: CanonicalRef;
    reason_code: string;
    evidence_type: string;
    safe_summary?: string;
    meta: WorkflowCommandMeta;
  }): Promise<{ evidence_ref: CanonicalRef }>;
};
