import { createHash } from "node:crypto";
import {
  scenarioAdmittedUserClasses,
  scenarioCapabilityEnablementPolicies,
  type ScenarioManifestV2,
} from "./manifest.js";
import { scenarioLaunchPhases, workflowScenarioStatuses } from "./identity.js";

export class ScenarioManifestValidationError extends Error {
  constructor(readonly code: string, readonly path: string, message: string) {
    super(message);
    this.name = "ScenarioManifestValidationError";
  }
}

const manifestKeys = new Set([
  "manifest_version", "scenario_key", "scenario_record", "owner", "contract",
  "step_type_registry", "owner_integration", "launch_phase", "allowed_user_classes",
  "capabilities", "scenario_data", "artifact_policy", "action_availability", "handoffs",
  "surface_mapping", "internal_api", "event_registry", "governance", "verification",
]);
const contractKeys = new Set([
  "base_contract_version", "host_sdk_version", "host_abi_range", "source_hash",
]);
const scenarioRecordKeys = new Set([
  "display_name", "required_status", "owner_team", "policy_version",
]);
const ownerIntegrationKeys = new Set([
  "command_contract", "event_contract", "receipt_contract", "status_lookup_required", "auth_mode",
]);
const capabilityKeys = new Set([
  "capability_key", "label", "description", "enablement_policy", "entrypoints",
]);
const scenarioKeyPattern = /^[a-z][a-z0-9-]*$/u;
const sourceHashPattern = /^[a-f0-9]{64}$/u;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const fail = (code: string, path: string, message: string): never => {
  throw new ScenarioManifestValidationError(code, path, message);
};

const assertExactKeys = (
  value: Record<string, unknown>,
  allowed: Set<string>,
  required: Set<string>,
  path: string,
): void => {
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length > 0) fail("unknown_field", path, `${path} contains unknown fields: ${unknown.join(", ")}`);
  const missing = [...required].filter((key) => !(key in value));
  if (missing.length > 0) fail("missing_field", path, `${path} is missing fields: ${missing.join(", ")}`);
};

const assertNonEmptyString = (value: unknown, path: string): void => {
  if (typeof value !== "string" || value.trim().length === 0) {
    fail("invalid_string", path, `${path} must be a non-empty string`);
  }
};

export const stableFederationJson = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stableFederationJson).join(",")}]`;
  if (isRecord(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableFederationJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "undefined";
};

export const assertScenarioManifestV2: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioManifestV2 = (value, path = "manifest") => {
  if (!isRecord(value)) fail("invalid_manifest", path, `${path} must be an object`);
  const manifest = value as Record<string, unknown>;
  assertExactKeys(manifest, manifestKeys, manifestKeys, path);
  if (manifest.manifest_version !== 2) fail("unsupported_manifest_version", `${path}.manifest_version`, "Only manifest v2 can be registered for new releases");
  if (typeof manifest.scenario_key !== "string" || !scenarioKeyPattern.test(manifest.scenario_key)) {
    fail("invalid_scenario_key", `${path}.scenario_key`, "scenario_key must be stable kebab-case");
  }
  assertNonEmptyString(manifest.owner, `${path}.owner`);

  if (!isRecord(manifest.scenario_record)) fail("invalid_scenario_record", `${path}.scenario_record`, "scenario_record must be an object");
  const scenarioRecord = manifest.scenario_record as Record<string, unknown>;
  assertExactKeys(scenarioRecord, scenarioRecordKeys, scenarioRecordKeys, `${path}.scenario_record`);
  assertNonEmptyString(scenarioRecord.display_name, `${path}.scenario_record.display_name`);
  assertNonEmptyString(scenarioRecord.owner_team, `${path}.scenario_record.owner_team`);
  if (!(workflowScenarioStatuses as readonly unknown[]).includes(scenarioRecord.required_status)) {
    fail("invalid_lifecycle_status", `${path}.scenario_record.required_status`, "pilot is activation metadata, not a Scenario lifecycle status");
  }
  if (!Number.isInteger(scenarioRecord.policy_version) || Number(scenarioRecord.policy_version) < 1) {
    fail("invalid_policy_version", `${path}.scenario_record.policy_version`, "policy_version must be a positive integer");
  }

  if (!isRecord(manifest.contract)) fail("invalid_contract", `${path}.contract`, "contract must be an object");
  const contract = manifest.contract as Record<string, unknown>;
  assertExactKeys(contract, contractKeys, contractKeys, `${path}.contract`);
  for (const field of ["base_contract_version", "host_sdk_version", "host_abi_range"] as const) {
    assertNonEmptyString(contract[field], `${path}.contract.${field}`);
  }
  if (typeof contract.source_hash !== "string" || !sourceHashPattern.test(contract.source_hash)) {
    fail("invalid_source_hash", `${path}.contract.source_hash`, "source_hash must be lowercase SHA-256");
  }

  if (!isRecord(manifest.owner_integration)) fail("invalid_owner_integration", `${path}.owner_integration`, "owner_integration must be an object");
  const ownerIntegration = manifest.owner_integration as Record<string, unknown>;
  assertExactKeys(ownerIntegration, ownerIntegrationKeys, ownerIntegrationKeys, `${path}.owner_integration`);
  if (
    ownerIntegration.command_contract !== "scenario-command-envelope-v1" ||
    ownerIntegration.event_contract !== "scenario-event-envelope-v1" ||
    ownerIntegration.receipt_contract !== "scenario-command-receipt-v1" ||
    ownerIntegration.status_lookup_required !== true ||
    ownerIntegration.auth_mode !== "service_authenticated"
  ) {
    fail("invalid_owner_integration", `${path}.owner_integration`, "owner_integration must use the v1 service-authenticated command/event/receipt contract");
  }

  if (!(scenarioLaunchPhases as readonly unknown[]).includes(manifest.launch_phase)) {
    fail("invalid_launch_phase", `${path}.launch_phase`, "launch_phase is release metadata and must use the closed Base vocabulary");
  }
  if (!Array.isArray(manifest.allowed_user_classes) || manifest.allowed_user_classes.length === 0) {
    fail("invalid_user_classes", `${path}.allowed_user_classes`, "allowed_user_classes must be a non-empty array");
  }
  const allowedUserClasses = manifest.allowed_user_classes as unknown[];
  for (const [index, userClass] of allowedUserClasses.entries()) {
    if (!(scenarioAdmittedUserClasses as readonly unknown[]).includes(userClass)) {
      fail("invalid_user_class", `${path}.allowed_user_classes.${index}`, `Unsupported admitted user class: ${String(userClass)}`);
    }
  }
  if (new Set(allowedUserClasses).size !== allowedUserClasses.length) {
    fail("duplicate_user_class", `${path}.allowed_user_classes`, "allowed_user_classes must not contain duplicates");
  }

  if (!Array.isArray(manifest.step_type_registry) || manifest.step_type_registry.length === 0) {
    fail("invalid_step_registry", `${path}.step_type_registry`, "step_type_registry must be non-empty");
  }
  if (!Array.isArray(manifest.capabilities) || manifest.capabilities.length === 0) {
    fail("invalid_capabilities", `${path}.capabilities`, "capabilities must be non-empty");
  }
  const capabilities = manifest.capabilities as unknown[];
  for (const [index, rawCapability] of capabilities.entries()) {
    const capabilityPath = `${path}.capabilities.${index}`;
    if (!isRecord(rawCapability)) fail("invalid_capability", capabilityPath, `${capabilityPath} must be an object`);
    const capabilityValue = rawCapability as Record<string, unknown>;
    assertExactKeys(capabilityValue, capabilityKeys, capabilityKeys, capabilityPath);
    for (const field of ["capability_key", "label", "description"] as const) {
      assertNonEmptyString(capabilityValue[field], `${capabilityPath}.${field}`);
    }
    if (!(scenarioCapabilityEnablementPolicies as readonly unknown[]).includes(capabilityValue.enablement_policy)) {
      fail("invalid_enablement_policy", `${capabilityPath}.enablement_policy`, "Capability policy may only require Host workspace activation or remain disabled");
    }
    if (!Array.isArray(capabilityValue.entrypoints)) {
      fail("invalid_entrypoints", `${capabilityPath}.entrypoints`, "entrypoints must be an array");
    }
  }
};

export const scenarioManifestHashV2 = (manifest: ScenarioManifestV2): string =>
  createHash("sha256").update(stableFederationJson(manifest)).digest("hex");

export type DerivedScenarioReleaseMetadataV1 = {
  scenario_key: string;
  display_name: string;
  owner_service: string;
  manifest_version: 2;
  base_contract_version: string;
  host_sdk_version: string;
  host_abi_range: string;
  manifest_hash: string;
  source_hash: string;
  allowed_user_types: string[];
};

export const deriveScenarioReleaseMetadataV1 = (
  value: unknown,
): DerivedScenarioReleaseMetadataV1 => {
  assertScenarioManifestV2(value);
  return {
    scenario_key: value.scenario_key,
    display_name: value.scenario_record.display_name,
    owner_service: value.owner,
    manifest_version: 2,
    base_contract_version: value.contract.base_contract_version,
    host_sdk_version: value.contract.host_sdk_version,
    host_abi_range: value.contract.host_abi_range,
    manifest_hash: scenarioManifestHashV2(value),
    source_hash: value.contract.source_hash,
    allowed_user_types: [...value.allowed_user_classes],
  };
};
