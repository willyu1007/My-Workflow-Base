import type { ChatWorkflowAdapter } from "@host/workflow-contracts";

export type ChatWorkflowAdapterFactory = (input: {
  scenario_key: string;
}) => ChatWorkflowAdapter;
