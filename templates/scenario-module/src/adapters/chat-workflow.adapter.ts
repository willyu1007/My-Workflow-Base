import type { WorkflowSurfaceAdapters } from "@host/workflow-contracts";

export const exampleAdapters = {
  chat_workflow_control: {
    recommend: async () => [],
    start_run: async () => {
      throw new Error("wire start_run to the host WorkflowCommandService");
    },
    execute_strong_confirmed_action: async () => {
      throw new Error("wire actions to the host WorkflowCommandService");
    },
    summarize_dashboard: async () => ({
      safe_title: "Example dashboard",
      safe_summary: "No active runs.",
      run_refs: [],
      action_availability: [],
    }),
  },
  web_run_workbench: {
    get_run_detail: async () => ({
      run: {
        run_id: "example-run",
        scenario_key: "example",
        capability_key: "example_capability",
        entrypoint_key: "authoring",
        workflow_version_id: "example-version",
        status: "draft",
        aggregate_version: 1,
      },
      artifacts: [],
      action_availability: [],
    }),
    execute_action: async (input) => ({
      target: input.target_ref,
      affected_refs: [],
      action_availability: [],
    }),
    get_artifact_preview: async () => ({
      artifact_id: "example-artifact",
      run_id: "example-run",
      artifact_type: "example_summary",
      exposure_level: "L1",
      safe_title: "Example artifact",
      safe_summary: "Example summary",
      aggregate_version: 1,
    }),
    create_handoff: async (input) => ({
      handoff_id: "example-handoff",
      handoff_type: input.handoff_type,
      status: "requested",
      source_refs: input.source_refs,
      downstream_refs: [],
      aggregate_version: 1,
    }),
  },
  mobile_dashboard: {
    list_cards: async () => [],
    get_run_summary: async () => ({
      run: {
        run_id: "example-run",
        scenario_key: "example",
        capability_key: "example_capability",
        entrypoint_key: "authoring",
        workflow_version_id: "example-version",
        status: "draft",
        aggregate_version: 1,
      },
      cards: [],
      action_availability: [],
    }),
    execute_action: async (input) => ({
      target: input.target_ref,
      affected_refs: [],
      action_availability: [],
    }),
  },
  admin_operator: {
    validate_module: async () => ({ status: "valid" }),
    publish_version: async () => ({ status: "published" }),
    disable_capability: async () => ({ status: "disabled" }),
    get_evidence: async () => ({ evidence_refs: [], safe_summary: "No evidence." }),
  },
  worker_runtime: {
    claim_step: async () => {
      throw new Error("wire claim_step to the host WorkflowRuntimePort");
    },
    complete_step: async () => {
      throw new Error("wire complete_step to the host WorkflowRuntimePort");
    },
    fail_step: async () => {
      throw new Error("wire fail_step to the host WorkflowRuntimePort");
    },
  },
} satisfies WorkflowSurfaceAdapters;
