import type { CanonicalRef, WorkflowCommandMeta } from "@host/workflow-contracts";
import type { EvidenceRepository } from "../repositories/evidence.repository.js";

export class WorkflowEvidenceService {
  constructor(private readonly evidenceRepository: EvidenceRepository) {}

  append(input: {
    target_ref: CanonicalRef;
    reason_code: string;
    evidence_type: string;
    safe_summary?: string;
    meta: WorkflowCommandMeta;
  }): Promise<{ evidence_ref: CanonicalRef }> {
    return this.evidenceRepository.append(input);
  }
}
