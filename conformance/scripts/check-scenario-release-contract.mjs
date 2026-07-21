import {
  ScenarioManifestValidationError,
  deriveScenarioReleaseMetadataV1,
} from "@host/workflow-contracts";

const manifest = {
  manifest_version: 2,
  scenario_key: "example",
  scenario_record: {
    display_name: "Example",
    required_status: "draft",
    owner_team: "example-owner",
    policy_version: 1,
  },
  owner: "example-owner",
  contract: {
    base_contract_version: "1.0.0",
    host_sdk_version: "1.0.0",
    host_abi_range: "^1.0.0",
    source_hash: "a".repeat(64),
  },
  step_type_registry: [{
    step_type: "example.action",
    runtime_kind: "scenario_action",
    owner: "scenario",
  }],
  owner_integration: {
    command_contract: "scenario-command-envelope-v1",
    event_contract: "scenario-event-envelope-v1",
    receipt_contract: "scenario-command-receipt-v1",
    status_lookup_required: true,
    auth_mode: "service_authenticated",
  },
  launch_phase: "dev",
  allowed_user_classes: ["teacher", "admin"],
  capabilities: [{
    capability_key: "example",
    label: "Example",
    description: "Example capability.",
    enablement_policy: "requires_workspace_activation",
    entrypoints: [],
  }],
  scenario_data: {
    context_ref_types: [],
    run_start_requirements: [],
    step_interventions: [],
  },
  artifact_policy: {
    artifact_types: [],
    exposure_levels: { L0: [], L1: [], L2: [], L3: [], L4: [] },
    handoff_eligible: {},
  },
  action_availability: {
    shared_actions: [],
    scenario_actions: [],
    expected_version_required: true,
  },
  handoffs: [],
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
    rollback: "Disable activation and preserve owner facts.",
    projection_review_required: false,
    evidence_records: [],
    outbox_events: [],
  },
  verification: {
    deterministic_tests: [],
    journey_harness: "example-release-contract-v1",
  },
};

const first = deriveScenarioReleaseMetadataV1(manifest);
const second = deriveScenarioReleaseMetadataV1({ ...manifest });
if (first.manifest_hash !== second.manifest_hash || !/^[a-f0-9]{64}$/u.test(first.manifest_hash)) {
  throw new Error("scenario manifest hash is not deterministic");
}
if (first.allowed_user_types.join(",") !== "teacher,admin") {
  throw new Error("scenario admitted user types were not derived from the manifest");
}

const expectFailure = (candidate, code) => {
  try {
    deriveScenarioReleaseMetadataV1(candidate);
  } catch (error) {
    if (error instanceof ScenarioManifestValidationError && error.code === code) return;
    throw error;
  }
  throw new Error(`scenario manifest validation did not reject ${code}`);
};

expectFailure({ ...manifest, unknown: true }, "unknown_field");
expectFailure({
  ...manifest,
  step_type_registry: [{ ...manifest.step_type_registry[0], future_field: true }],
}, "unknown_field");
expectFailure({
  ...manifest,
  capabilities: [{
    ...manifest.capabilities[0],
    entrypoints: [{
      entrypoint_key: "invalid",
      label: "Invalid",
      workflow_version: 1,
      input_schema_version: 1,
      output_schema_version: 1,
      allowed_step_types: ["example.missing"],
      steps: [],
    }],
  }],
}, "undeclared_step_type");
expectFailure({
  ...manifest,
  capabilities: [{
    ...manifest.capabilities[0],
    entrypoints: [{
      entrypoint_key: "missing-runtime-kind",
      label: "Missing runtime kind",
      workflow_version: 1,
      input_schema_version: 1,
      output_schema_version: 1,
      allowed_step_types: ["example.action"],
      steps: [{
        step_key: "execute",
        step_type: "example.action",
        order: 10,
        handler_key: "example.execute",
        retry_policy: "none",
      }],
    }],
  }],
}, "missing_field");
expectFailure({
  ...manifest,
  capabilities: [{ ...manifest.capabilities[0], enablement_policy: "workspace_enabled" }],
}, "invalid_enablement_policy");
expectFailure({
  ...manifest,
  scenario_record: { ...manifest.scenario_record, required_status: "pilot" },
}, "invalid_lifecycle_status");
expectFailure({ ...manifest, allowed_user_classes: ["minor"] }, "invalid_user_class");

process.stdout.write(`scenario release contract ok: ${first.manifest_hash}\n`);
