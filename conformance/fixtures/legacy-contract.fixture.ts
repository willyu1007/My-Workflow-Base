import type {
  ScenarioManifest,
  WorkflowCompleteStepInput,
  WorkflowCompleteStepResult,
  WorkflowHandoffResult,
  WorkflowHostValidationSnapshot,
  WorkflowRuntimePort,
  WorkflowStepResult,
} from "@host/workflow-contracts";

export const legacyManifestFixture = {
  manifest_version: 1,
  scenario_key: "legacy_example",
  scenario_record: {
    display_name: "Legacy example",
    required_status: "draft",
    owner_team: "workflow",
    policy_version: 1,
  },
  owner: "workflow",
  launch_phase: "dev",
  allowed_user_classes: ["internal_admin"],
  capabilities: [],
  scenario_data: {
    context_ref_types: [],
    run_start_requirements: [],
    step_interventions: [],
  },
  artifact_policy: {
    artifact_types: ["legacy_summary"],
    exposure_levels: { L0: [], L1: ["legacy_summary"], L2: [], L3: [], L4: [] },
    handoff_eligible: { notification: ["legacy_summary"] },
  },
  action_availability: {
    shared_actions: [],
    scenario_actions: [],
    expected_version_required: true,
  },
  handoffs: [
    {
      handoff_type: "notification",
      source_artifact_types: ["legacy_summary"],
      requested_purposes: ["workflow_reminder"],
      downstream_owner: "notification",
      policy_key: "legacy.can_notify",
      receipt_required: true,
    },
  ],
  surface_mapping: {},
  internal_api: { routes: [] },
  event_registry: {
    standard_workflow_events: [],
    scenario_internal_events: [],
    event_payload_policy: {
      signal_version: 1,
      body: "no_body",
      pii: "no_pii",
      status_in_payload: false,
      presenter_output_in_payload: false,
      idempotency_key: "{event_type}:{aggregate_id}:{aggregate_version}",
    },
    producers: {},
    consumers: {},
  },
  governance: {
    admin_actions: [],
    rollback: "Disable the legacy capability.",
    projection_review_required: false,
    evidence_records: [],
    outbox_events: [],
  },
  verification: {
    deterministic_tests: ["legacy fixture"],
    journey_harness: "legacy-fixture",
  },
} satisfies ScenarioManifest;

export const legacyHostSnapshotFixture = {
  scenario_records: {},
  domain_resolver_keys: [],
  downstream_owners: [],
  standard_events: [],
  platform_events: [],
  allowed_surfaces: [],
  projection_reviews: [],
} satisfies WorkflowHostValidationSnapshot;

export const legacyCompleteStepInputFixture = {
  run_id: "run-legacy",
  step_id: "step-legacy",
  expected_version: 1,
  output_refs: [],
  meta: {
    workspace_id: "workspace-legacy",
    idempotency_key: "complete-legacy",
    correlation_id: "correlation-legacy",
    client_surface: "worker_runtime",
  },
} satisfies WorkflowCompleteStepInput;

export const legacyCompleteStepResultFixture = {
  run_id: "run-legacy",
  step_id: "step-legacy",
  status: "completed",
  aggregate_version: 2,
  output_refs: [],
} satisfies WorkflowCompleteStepResult;

export const legacyHandoffResultFixture = {
  handoff_id: "handoff-legacy",
  handoff_type: "notification",
  status: "duplicate",
  source_refs: [],
  downstream_refs: [],
  aggregate_version: 2,
} satisfies WorkflowHandoffResult;

export async function invokeLegacyCompletionFixture(
  runtimePort: WorkflowRuntimePort,
): Promise<WorkflowStepResult> {
  const response = await runtimePort.complete_step(legacyCompleteStepInputFixture);
  return response.data;
}
