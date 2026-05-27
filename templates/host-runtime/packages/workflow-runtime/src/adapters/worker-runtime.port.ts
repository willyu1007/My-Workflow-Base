import type { WorkflowRuntimePort } from "@host/workflow-contracts";

export type WorkerRuntimePortFactory = (input: {
  scenario_key: string;
}) => WorkflowRuntimePort;
