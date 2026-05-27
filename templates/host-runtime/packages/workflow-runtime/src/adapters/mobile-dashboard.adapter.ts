import type { WorkflowDashboardAdapter } from "@host/workflow-contracts";

export type MobileDashboardAdapterFactory = (input: {
  scenario_key: string;
}) => WorkflowDashboardAdapter;
