import type { WorkflowPresenters } from "@host/workflow-contracts";

export const examplePresenters: WorkflowPresenters = {
  chat_dashboard_summary: async () => ({
    safe_title: "Example dashboard",
    safe_summary: "No active runs.",
    run_refs: [],
    action_availability: [],
  }),
  dashboard_card: async () => ({
    run_id: "example-run",
    scenario_key: "example",
    capability_key: "example_capability",
    entrypoint_key: "authoring",
    title: "Example run",
    status: "draft",
    requires_attention: false,
    action_availability: [],
    aggregate_version: 1,
  }),
  artifact_preview: async () => ({
    artifact_id: "example-artifact",
    run_id: "example-run",
    artifact_type: "example_summary",
    exposure_level: "L1",
    safe_title: "Example artifact",
    safe_summary: "Example summary",
    aggregate_version: 1,
  }),
  mobile_summary: async () => ({
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
  web_run_workbench: async () => ({
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
};
