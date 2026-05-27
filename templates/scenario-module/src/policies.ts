import type { WorkflowPolicies } from "@host/workflow-contracts";

export const examplePolicies: WorkflowPolicies = {
  "example.can_start": async () => false,
};
