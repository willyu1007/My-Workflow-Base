import type { WorkflowCommandResponse, WorkflowRunRef } from "@host/workflow-contracts";
import type { WorkflowLedgerRepository } from "../repositories/workflow-ledger.repository.js";

export class WorkflowCommandService {
  constructor(private readonly workflowLedger: WorkflowLedgerRepository) {}

  start_run(input: Parameters<WorkflowLedgerRepository["start_run"]>[0]): Promise<WorkflowCommandResponse<WorkflowRunRef>> {
    return this.workflowLedger.start_run(input);
  }
}
