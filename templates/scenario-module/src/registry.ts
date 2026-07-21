import type { ScenarioManifestV2 } from "@host/workflow-contracts";

export const scenarioManifest = {
  manifest_version: 2,
  scenario_key: "example",
  scenario_record: {
    display_name: "Example scenario",
    required_status: "draft",
    owner_team: "team-name",
    policy_version: 1,
  },
  owner: "team-name",
  contract: {
    base_contract_version: "1.0.0",
    host_sdk_version: "1.0.0",
    host_abi_range: "^1.0.0",
    source_hash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  },
  step_type_registry: [
    {
      step_type: "example.collect_context",
      runtime_kind: "scenario_action",
      owner: "scenario",
      legacy_aliases: ["domain_action"],
    },
  ],
  owner_integration: {
    command_contract: "scenario-command-envelope-v1",
    event_contract: "scenario-event-envelope-v1",
    receipt_contract: "scenario-command-receipt-v1",
    status_lookup_required: true,
    auth_mode: "service_authenticated",
  },
  launch_phase: "dev",
  allowed_user_classes: ["admin"],
  capabilities: [
    {
      capability_key: "example_capability",
      label: "Example capability",
      description: "Replace with scenario-specific description.",
      enablement_policy: "requires_workspace_activation",
      entrypoints: [
        {
          entrypoint_key: "authoring",
          label: "Create example output",
          workflow_version: 1,
          workflow_version_id: "example-version",
          input_schema_version: 1,
          output_schema_version: 1,
          allowed_step_types: ["example.collect_context"],
          steps: [
            {
              step_key: "collect_context",
              step_type: "example.collect_context",
              runtime_kind: "scenario_action",
              order: 10,
              handler_key: "example.collect_context",
              retry_policy: "none",
            },
          ],
        },
      ],
    },
  ],
  scenario_data: {
    context_ref_types: [],
    run_start_requirements: [],
    step_interventions: [],
  },
  artifact_policy: {
    artifact_types: ["example_summary"],
    exposure_levels: { L0: [], L1: ["example_summary"], L2: [], L3: [], L4: [] },
    handoff_eligible: { public_draft: [], indexing: [], notification: [], external_delivery: [] },
  },
  action_availability: {
    shared_actions: ["start_run"],
    scenario_actions: [],
    expected_version_required: true,
  },
  handoffs: [],
  surface_mapping: {},
  internal_api: { routes: [] },
  event_registry: {
    standard_workflow_events: ["workflow.run.created", "workflow.run.updated"],
    scenario_internal_events: [],
    event_payload_policy: {
      signal_version: 1,
      body: "no_body",
      pii: "no_pii",
      status_in_payload: false,
      presenter_output_in_payload: false,
      idempotency_key: "{event_type}:{aggregate_id}:{aggregate_version}",
    },
    producers: {
      "workflow.run.created": { owner: "workflow_ledger", write_boundary: "same_transaction" },
      "workflow.run.updated": { owner: "workflow_ledger", write_boundary: "same_transaction" },
    },
    consumers: {},
  },
  governance: {
    admin_actions: [],
    rollback: "Disable capability and preserve canonical facts.",
    projection_review_required: true,
    evidence_records: [],
    outbox_events: ["workflow.run.created", "workflow.run.updated"],
  },
  verification: {
    deterministic_tests: ["example journey"],
    journey_harness: "example-authoring-happy-path",
  },
} satisfies ScenarioManifestV2;
