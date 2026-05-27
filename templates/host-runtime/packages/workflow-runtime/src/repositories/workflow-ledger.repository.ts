import type { WorkflowCommandMeta, WorkflowCommandResponse, WorkflowRunRef } from "@host/workflow-contracts";

export type WorkflowLedgerRepository = {
  start_run(input: {
    scenario_key: string;
    capability_key: string;
    entrypoint_key: string;
    requirement_values: Record<string, unknown>;
    meta: WorkflowCommandMeta;
  }): Promise<WorkflowCommandResponse<WorkflowRunRef>>;
  get_run(input: { workspace_id: string; run_id: string }): Promise<WorkflowRunRef | null>;
};
