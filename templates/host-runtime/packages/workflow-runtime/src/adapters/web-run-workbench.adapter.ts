import type { WorkflowRunWorkbenchAdapter } from "@host/workflow-contracts";

export type WebRunWorkbenchAdapterFactory = (input: {
  scenario_key: string;
}) => WorkflowRunWorkbenchAdapter;
