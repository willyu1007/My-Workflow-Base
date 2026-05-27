import type { WorkflowRunRef } from "@host/workflow-contracts";
import type { WorkflowLedgerRepository } from "../repositories/workflow-ledger.repository.js";

export class WorkflowQueryService {
  constructor(private readonly workflowLedger: WorkflowLedgerRepository) {}

  get_run(input: { workspace_id: string; run_id: string }): Promise<WorkflowRunRef | null> {
    return this.workflowLedger.get_run(input);
  }
}
