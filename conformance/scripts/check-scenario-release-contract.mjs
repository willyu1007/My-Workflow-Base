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
  scenario_data: {},
  artifact_policy: {},
  action_availability: {},
  handoffs: [],
  surface_mapping: {},
  internal_api: {},
  event_registry: {},
  governance: {},
  verification: {},
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
  capabilities: [{ ...manifest.capabilities[0], enablement_policy: "workspace_enabled" }],
}, "invalid_enablement_policy");
expectFailure({
  ...manifest,
  scenario_record: { ...manifest.scenario_record, required_status: "pilot" },
}, "invalid_lifecycle_status");
expectFailure({ ...manifest, allowed_user_classes: ["minor"] }, "invalid_user_class");

process.stdout.write(`scenario release contract ok: ${first.manifest_hash}\n`);
