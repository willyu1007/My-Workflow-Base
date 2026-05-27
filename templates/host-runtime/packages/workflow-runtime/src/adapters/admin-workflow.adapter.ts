import type { WorkflowAdminAdapter } from "@host/workflow-contracts";

export type AdminWorkflowAdapterFactory = (input: {
  scenario_key: string;
}) => WorkflowAdminAdapter;
