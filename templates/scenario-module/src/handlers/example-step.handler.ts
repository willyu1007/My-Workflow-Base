import type { WorkflowHandlerRegistry } from "@host/workflow-contracts";

export const exampleHandlers: WorkflowHandlerRegistry = {
  "example.collect_context": async () => ({
    output_refs: [],
    reason_code: "example_context_collected",
  }),
};
