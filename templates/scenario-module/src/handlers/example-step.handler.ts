import type { WorkflowHandlerRegistry } from "@host/workflow-contracts";

export const exampleHandlers: WorkflowHandlerRegistry = {
  "example.collect_context": async (input) => ({
    output_refs: [
      {
        schema_version: 1,
        namespace: "example",
        object_type: "record",
        object_id: input.run_id,
        version: 1,
      },
    ],
    artifact_drafts: [
      {
        artifact_type: "example_summary",
        exposure_level: "L1",
        source_refs: [
          {
            schema_version: 1,
            namespace: "example",
            object_type: "record",
            object_id: input.run_id,
            version: 1,
          },
        ],
      },
    ],
    handoff_drafts: [
      {
        draft_key: `${input.step_id}:index-example-summary`,
        handoff_key: "index-example-summary",
        requested_purpose: "knowledge_indexing",
        source_refs: [
          {
            schema_version: 1,
            namespace: "example",
            object_type: "record",
            object_id: input.run_id,
            version: 1,
          },
        ],
      },
    ],
    reason_code: "example_context_collected",
  }),
};
