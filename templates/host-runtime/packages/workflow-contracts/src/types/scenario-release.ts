import { createHash } from "node:crypto";
import {
  scenarioAdmittedUserClasses,
  scenarioCapabilityEnablementPolicies,
  type ScenarioManifestV2,
} from "./manifest.js";
import {
  standardWorkflowHandoffTypes,
  workflowRuntimeKinds,
  workflowStepPolicyFlags,
} from "./federation.js";
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
const stepTypeKeys = new Set(["step_type", "runtime_kind", "owner", "policy_flags"]);
const entrypointKeys = new Set([
  "entrypoint_key", "label", "workflow_version", "workflow_version_id",
  "input_schema_version", "output_schema_version", "allowed_step_types", "steps",
]);
const stepKeys = new Set([
  "step_key", "step_type", "runtime_kind", "policy_flags", "order", "handler_key",
  "retry_policy", "timeout_ms",
]);
const scenarioDataKeys = new Set(["context_ref_types", "run_start_requirements", "step_interventions"]);
const contextRefTypeKeys = new Set([
  "namespace", "object_type", "resolver_key", "owner_scope", "canonical_required",
  "scenario_local_allowed", "snapshot_required",
]);
const runStartRequirementKeys = new Set([
  "requirement_key", "schema_version", "entrypoints", "surfaces", "required",
]);
const stepInterventionKeys = new Set([
  "intervention_type", "schema_version", "step_keys", "surface", "handler_key",
]);
const artifactPolicyKeys = new Set(["artifact_types", "exposure_levels", "handoff_eligible"]);
const exposureLevelKeys = new Set(["L0", "L1", "L2", "L3", "L4"]);
const actionAvailabilityKeys = new Set(["shared_actions", "scenario_actions", "expected_version_required"]);
const handoffKeys = new Set([
  "handoff_type", "source_artifact_types", "requested_purposes", "downstream_owner",
  "policy_key", "receipt_required", "handoff_key", "source_context_ref_types", "materialization_mode",
]);
const handoffContextRefKeys = new Set(["namespace", "object_type"]);
const internalApiKeys = new Set(["routes"]);
const internalRouteKeys = new Set([
  "method", "path", "owner_surface", "command_class", "writes_workflow_facts", "handler_key",
]);
const eventRegistryKeys = new Set([
  "standard_workflow_events", "scenario_internal_events", "platform_events",
  "event_payload_policy", "producers", "consumers",
]);
const eventPayloadPolicyKeys = new Set([
  "signal_version", "body", "pii", "status_in_payload", "presenter_output_in_payload", "idempotency_key",
]);
const eventProducerKeys = new Set(["owner", "write_boundary"]);
const eventConsumerKeys = new Set(["allowed_events", "forbidden_events"]);
const governanceKeys = new Set([
  "admin_actions", "rollback", "projection_review_required", "evidence_records", "outbox_events",
]);
const verificationKeys = new Set(["deterministic_tests", "journey_harness"]);
const workflowSurfaces = new Set([
  "chat_workflow_control", "chat_dashboard_summary", "chat_citation", "web_domain_workbench",
  "web_run_workbench", "mobile_dashboard", "forum_publication", "rag_knowledge",
  "notification_push", "admin_operator", "worker_runtime", "api",
]);
const scenarioKeyPattern = /^[a-z][a-z0-9-]*$/u;
const sourceHashPattern = /^[a-f0-9]{64}$/u;

const isRecord = (value: unknown): value is Record<string, unknown> => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

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

const requireRecord = (value: unknown, path: string): Record<string, unknown> => {
  if (!isRecord(value)) fail("invalid_object", path, `${path} must be an object`);
  return value as Record<string, unknown>;
};

const requireArray = (value: unknown, path: string): unknown[] => {
  if (!Array.isArray(value)) fail("invalid_array", path, `${path} must be an array`);
  return value as unknown[];
};

const assertBoolean = (value: unknown, path: string): void => {
  if (typeof value !== "boolean") fail("invalid_boolean", path, `${path} must be a boolean`);
};

const assertPositiveInteger = (value: unknown, path: string): void => {
  if (!Number.isInteger(value) || Number(value) < 1) {
    fail("invalid_integer", path, `${path} must be a positive integer`);
  }
};

const assertStringArray = (
  value: unknown,
  path: string,
  options: { nonEmpty?: boolean; unique?: boolean; allowed?: ReadonlySet<string> } = {},
): string[] => {
  const values = requireArray(value, path);
  if (options.nonEmpty && values.length === 0) fail("empty_array", path, `${path} must be non-empty`);
  for (const [index, item] of values.entries()) {
    assertNonEmptyString(item, `${path}.${index}`);
    if (options.allowed && !options.allowed.has(item as string)) {
      fail("invalid_enum", `${path}.${index}`, `${path}.${index} contains an unsupported value`);
    }
  }
  if (options.unique && new Set(values).size !== values.length) {
    fail("duplicate_value", path, `${path} must not contain duplicates`);
  }
  return values as string[];
};

const assertJsonValue = (value: unknown, path: string): void => {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number" && Number.isFinite(value)) return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertJsonValue(item, `${path}.${index}`));
    return;
  }
  if (isRecord(value)) {
    for (const [key, item] of Object.entries(value)) assertJsonValue(item, `${path}.${key}`);
    return;
  }
  fail("invalid_json_value", path, `${path} must contain only JSON values`);
};

const validateStepTypeRegistry = (
  value: unknown,
  scenarioKey: string,
  path: string,
): Map<string, string> => {
  const definitions = requireArray(value, path);
  if (definitions.length === 0) fail("invalid_step_registry", path, `${path} must be non-empty`);
  const runtimeKinds = new Map<string, string>();
  for (const [index, valueDefinition] of definitions.entries()) {
    const definitionPath = `${path}.${index}`;
    const definition = requireRecord(valueDefinition, definitionPath);
    assertExactKeys(definition, stepTypeKeys, new Set(["step_type", "runtime_kind", "owner"]), definitionPath);
    assertNonEmptyString(definition.step_type, `${definitionPath}.step_type`);
    if (runtimeKinds.has(definition.step_type as string)) {
      fail("duplicate_step_type", `${definitionPath}.step_type`, "step_type_registry must not contain duplicates");
    }
    if (!(workflowRuntimeKinds as readonly unknown[]).includes(definition.runtime_kind)) {
      fail("invalid_runtime_kind", `${definitionPath}.runtime_kind`, "runtime_kind must use the closed Base vocabulary");
    }
    if (definition.owner !== "host" && definition.owner !== "scenario") {
      fail("invalid_step_owner", `${definitionPath}.owner`, "step owner must be host or scenario");
    }
    if (definition.owner === "scenario" && !(definition.step_type as string).startsWith(`${scenarioKey}.`)) {
      fail("unnamespaced_step_type", `${definitionPath}.step_type`, `Scenario step types must start with ${scenarioKey}.`);
    }
    if (definition.policy_flags !== undefined) {
      assertStringArray(definition.policy_flags, `${definitionPath}.policy_flags`, {
        unique: true,
        allowed: new Set(workflowStepPolicyFlags),
      });
    }
    runtimeKinds.set(definition.step_type as string, definition.runtime_kind as string);
  }
  return runtimeKinds;
};

const validateCapabilities = (
  value: unknown,
  stepRuntimeKinds: ReadonlyMap<string, string>,
  path: string,
): void => {
  const capabilities = requireArray(value, path);
  if (capabilities.length === 0) fail("invalid_capabilities", path, `${path} must be non-empty`);
  const capabilityKeysSeen = new Set<string>();
  for (const [capabilityIndex, rawCapability] of capabilities.entries()) {
    const capabilityPath = `${path}.${capabilityIndex}`;
    const capability = requireRecord(rawCapability, capabilityPath);
    assertExactKeys(capability, capabilityKeys, capabilityKeys, capabilityPath);
    for (const field of ["capability_key", "label", "description"] as const) {
      assertNonEmptyString(capability[field], `${capabilityPath}.${field}`);
    }
    if (capabilityKeysSeen.has(capability.capability_key as string)) {
      fail("duplicate_capability", `${capabilityPath}.capability_key`, "capability_key must be unique");
    }
    capabilityKeysSeen.add(capability.capability_key as string);
    if (!(scenarioCapabilityEnablementPolicies as readonly unknown[]).includes(capability.enablement_policy)) {
      fail("invalid_enablement_policy", `${capabilityPath}.enablement_policy`, "Capability policy may only require Host workspace activation or remain disabled");
    }
    const entrypoints = requireArray(capability.entrypoints, `${capabilityPath}.entrypoints`);
    const entrypointKeysSeen = new Set<string>();
    for (const [entrypointIndex, rawEntrypoint] of entrypoints.entries()) {
      const entrypointPath = `${capabilityPath}.entrypoints.${entrypointIndex}`;
      const entrypoint = requireRecord(rawEntrypoint, entrypointPath);
      assertExactKeys(entrypoint, entrypointKeys, new Set([
        "entrypoint_key", "label", "workflow_version", "input_schema_version",
        "output_schema_version", "allowed_step_types", "steps",
      ]), entrypointPath);
      for (const field of ["entrypoint_key", "label"] as const) assertNonEmptyString(entrypoint[field], `${entrypointPath}.${field}`);
      if (entrypoint.workflow_version_id !== undefined) assertNonEmptyString(entrypoint.workflow_version_id, `${entrypointPath}.workflow_version_id`);
      for (const field of ["workflow_version", "input_schema_version", "output_schema_version"] as const) {
        assertPositiveInteger(entrypoint[field], `${entrypointPath}.${field}`);
      }
      if (entrypointKeysSeen.has(entrypoint.entrypoint_key as string)) {
        fail("duplicate_entrypoint", `${entrypointPath}.entrypoint_key`, "entrypoint_key must be unique within a capability");
      }
      entrypointKeysSeen.add(entrypoint.entrypoint_key as string);
      const allowedStepTypes = assertStringArray(entrypoint.allowed_step_types, `${entrypointPath}.allowed_step_types`, { unique: true });
      for (const [allowedIndex, allowedStepType] of allowedStepTypes.entries()) {
        if (!stepRuntimeKinds.has(allowedStepType)) {
          fail("undeclared_step_type", `${entrypointPath}.allowed_step_types.${allowedIndex}`, "Entrypoints may only allow declared step types");
        }
      }
      const steps = requireArray(entrypoint.steps, `${entrypointPath}.steps`);
      const stepKeysSeen = new Set<string>();
      for (const [stepIndex, rawStep] of steps.entries()) {
        const stepPath = `${entrypointPath}.steps.${stepIndex}`;
        const step = requireRecord(rawStep, stepPath);
        assertExactKeys(step, stepKeys, new Set([
          "step_key", "step_type", "runtime_kind", "order", "handler_key", "retry_policy",
        ]), stepPath);
        for (const field of ["step_key", "step_type", "handler_key", "retry_policy"] as const) assertNonEmptyString(step[field], `${stepPath}.${field}`);
        if (!Number.isInteger(step.order) || Number(step.order) < 0) fail("invalid_integer", `${stepPath}.order`, "step order must be a non-negative integer");
        if (step.timeout_ms !== undefined) assertPositiveInteger(step.timeout_ms, `${stepPath}.timeout_ms`);
        if (step.policy_flags !== undefined) {
          assertStringArray(step.policy_flags, `${stepPath}.policy_flags`, { unique: true, allowed: new Set(workflowStepPolicyFlags) });
        }
        if (stepKeysSeen.has(step.step_key as string)) fail("duplicate_step", `${stepPath}.step_key`, "step_key must be unique within an entrypoint");
        stepKeysSeen.add(step.step_key as string);
        const declaredRuntimeKind = stepRuntimeKinds.get(step.step_type as string);
        if (!declaredRuntimeKind) fail("undeclared_step_type", `${stepPath}.step_type`, "Durable steps may only use declared step types");
        if (step.runtime_kind !== declaredRuntimeKind) {
          fail("runtime_kind_mismatch", `${stepPath}.runtime_kind`, "Step runtime_kind must match step_type_registry");
        }
      }
    }
  }
};

const validateScenarioData = (value: unknown, path: string): void => {
  const data = requireRecord(value, path);
  assertExactKeys(data, scenarioDataKeys, scenarioDataKeys, path);
  for (const [index, rawRefType] of requireArray(data.context_ref_types, `${path}.context_ref_types`).entries()) {
    const itemPath = `${path}.context_ref_types.${index}`;
    const refType = requireRecord(rawRefType, itemPath);
    assertExactKeys(refType, contextRefTypeKeys, contextRefTypeKeys, itemPath);
    for (const field of ["namespace", "object_type", "resolver_key"] as const) assertNonEmptyString(refType[field], `${itemPath}.${field}`);
    if (!["workspace", "organization", "platform", "external"].includes(refType.owner_scope as string)) {
      fail("invalid_owner_scope", `${itemPath}.owner_scope`, "owner_scope must use the closed contract vocabulary");
    }
    for (const field of ["canonical_required", "scenario_local_allowed", "snapshot_required"] as const) assertBoolean(refType[field], `${itemPath}.${field}`);
  }
  for (const [index, rawRequirement] of requireArray(data.run_start_requirements, `${path}.run_start_requirements`).entries()) {
    const itemPath = `${path}.run_start_requirements.${index}`;
    const requirement = requireRecord(rawRequirement, itemPath);
    assertExactKeys(requirement, runStartRequirementKeys, runStartRequirementKeys, itemPath);
    assertNonEmptyString(requirement.requirement_key, `${itemPath}.requirement_key`);
    assertPositiveInteger(requirement.schema_version, `${itemPath}.schema_version`);
    assertStringArray(requirement.entrypoints, `${itemPath}.entrypoints`, { unique: true });
    assertStringArray(requirement.surfaces, `${itemPath}.surfaces`, { unique: true, allowed: workflowSurfaces });
    assertBoolean(requirement.required, `${itemPath}.required`);
  }
  for (const [index, rawIntervention] of requireArray(data.step_interventions, `${path}.step_interventions`).entries()) {
    const itemPath = `${path}.step_interventions.${index}`;
    const intervention = requireRecord(rawIntervention, itemPath);
    assertExactKeys(intervention, stepInterventionKeys, stepInterventionKeys, itemPath);
    for (const field of ["intervention_type", "handler_key"] as const) assertNonEmptyString(intervention[field], `${itemPath}.${field}`);
    assertPositiveInteger(intervention.schema_version, `${itemPath}.schema_version`);
    assertStringArray(intervention.step_keys, `${itemPath}.step_keys`, { unique: true });
    if (intervention.surface !== "web_run_workbench") fail("invalid_surface", `${itemPath}.surface`, "step interventions are served by web_run_workbench");
  }
};

const validateArtifactPolicy = (value: unknown, path: string): void => {
  const policy = requireRecord(value, path);
  assertExactKeys(policy, artifactPolicyKeys, artifactPolicyKeys, path);
  assertStringArray(policy.artifact_types, `${path}.artifact_types`, { unique: true });
  const exposureLevels = requireRecord(policy.exposure_levels, `${path}.exposure_levels`);
  assertExactKeys(exposureLevels, exposureLevelKeys, exposureLevelKeys, `${path}.exposure_levels`);
  for (const level of exposureLevelKeys) assertStringArray(exposureLevels[level], `${path}.exposure_levels.${level}`, { unique: true });
  const handoffEligible = requireRecord(policy.handoff_eligible, `${path}.handoff_eligible`);
  for (const [handoffType, artifactTypes] of Object.entries(handoffEligible)) {
    if (!(standardWorkflowHandoffTypes as readonly string[]).includes(handoffType)) {
      fail("invalid_handoff_type", `${path}.handoff_eligible.${handoffType}`, "handoff_eligible keys must use the standard handoff vocabulary");
    }
    assertStringArray(artifactTypes, `${path}.handoff_eligible.${handoffType}`, { unique: true });
  }
};

const validateHandoffs = (value: unknown, path: string): void => {
  for (const [index, rawHandoff] of requireArray(value, path).entries()) {
    const itemPath = `${path}.${index}`;
    const handoff = requireRecord(rawHandoff, itemPath);
    assertExactKeys(handoff, handoffKeys, new Set([
      "handoff_type", "source_artifact_types", "requested_purposes", "downstream_owner",
      "policy_key", "receipt_required",
    ]), itemPath);
    if (!(standardWorkflowHandoffTypes as readonly unknown[]).includes(handoff.handoff_type)) {
      fail("invalid_handoff_type", `${itemPath}.handoff_type`, "handoff_type must use the standard Base vocabulary");
    }
    assertStringArray(handoff.source_artifact_types, `${itemPath}.source_artifact_types`, { unique: true });
    assertStringArray(handoff.requested_purposes, `${itemPath}.requested_purposes`, { unique: true });
    for (const field of ["downstream_owner", "policy_key"] as const) assertNonEmptyString(handoff[field], `${itemPath}.${field}`);
    assertBoolean(handoff.receipt_required, `${itemPath}.receipt_required`);
    if (handoff.handoff_key !== undefined) assertNonEmptyString(handoff.handoff_key, `${itemPath}.handoff_key`);
    if (handoff.materialization_mode !== undefined && handoff.materialization_mode !== "workflow_step_complete_v1") {
      fail("invalid_materialization_mode", `${itemPath}.materialization_mode`, "Unknown handoff materialization mode");
    }
    if (handoff.source_context_ref_types !== undefined) {
      for (const [refIndex, rawRef] of requireArray(handoff.source_context_ref_types, `${itemPath}.source_context_ref_types`).entries()) {
        const refPath = `${itemPath}.source_context_ref_types.${refIndex}`;
        const ref = requireRecord(rawRef, refPath);
        assertExactKeys(ref, handoffContextRefKeys, handoffContextRefKeys, refPath);
        assertNonEmptyString(ref.namespace, `${refPath}.namespace`);
        assertNonEmptyString(ref.object_type, `${refPath}.object_type`);
      }
    }
  }
};

const validateInternalApi = (value: unknown, path: string): void => {
  const api = requireRecord(value, path);
  assertExactKeys(api, internalApiKeys, internalApiKeys, path);
  for (const [index, rawRoute] of requireArray(api.routes, `${path}.routes`).entries()) {
    const itemPath = `${path}.routes.${index}`;
    const route = requireRecord(rawRoute, itemPath);
    assertExactKeys(route, internalRouteKeys, internalRouteKeys, itemPath);
    if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(route.method as string)) fail("invalid_http_method", `${itemPath}.method`, "Unsupported internal API method");
    assertNonEmptyString(route.path, `${itemPath}.path`);
    if (!["web_domain_workbench", "web_run_workbench", "admin_operator"].includes(route.owner_surface as string)) fail("invalid_surface", `${itemPath}.owner_surface`, "Unsupported internal API owner surface");
    if (!["scenario_internal", "workflow_fact_write"].includes(route.command_class as string)) fail("invalid_command_class", `${itemPath}.command_class`, "Unsupported internal API command class");
    assertBoolean(route.writes_workflow_facts, `${itemPath}.writes_workflow_facts`);
    assertNonEmptyString(route.handler_key, `${itemPath}.handler_key`);
  }
};

const validateEventRegistry = (value: unknown, path: string): void => {
  const registry = requireRecord(value, path);
  assertExactKeys(registry, eventRegistryKeys, new Set([
    "standard_workflow_events", "scenario_internal_events", "event_payload_policy", "producers", "consumers",
  ]), path);
  assertStringArray(registry.standard_workflow_events, `${path}.standard_workflow_events`, { unique: true });
  assertStringArray(registry.scenario_internal_events, `${path}.scenario_internal_events`, { unique: true });
  if (registry.platform_events !== undefined) assertStringArray(registry.platform_events, `${path}.platform_events`, { unique: true });
  const payloadPolicy = requireRecord(registry.event_payload_policy, `${path}.event_payload_policy`);
  assertExactKeys(payloadPolicy, eventPayloadPolicyKeys, eventPayloadPolicyKeys, `${path}.event_payload_policy`);
  if (
    payloadPolicy.signal_version !== 1 || payloadPolicy.body !== "no_body" || payloadPolicy.pii !== "no_pii" ||
    payloadPolicy.status_in_payload !== false || payloadPolicy.presenter_output_in_payload !== false
  ) fail("invalid_event_payload_policy", `${path}.event_payload_policy`, "Event payload policy must remain refs-only and bodyless");
  assertNonEmptyString(payloadPolicy.idempotency_key, `${path}.event_payload_policy.idempotency_key`);
  const producers = requireRecord(registry.producers, `${path}.producers`);
  for (const [eventType, rawProducer] of Object.entries(producers)) {
    const producerPath = `${path}.producers.${eventType}`;
    assertNonEmptyString(eventType, producerPath);
    const producer = requireRecord(rawProducer, producerPath);
    assertExactKeys(producer, eventProducerKeys, eventProducerKeys, producerPath);
    assertNonEmptyString(producer.owner, `${producerPath}.owner`);
    if (!["same_transaction", "scenario_internal", "downstream_owner"].includes(producer.write_boundary as string)) fail("invalid_write_boundary", `${producerPath}.write_boundary`, "Unknown event write boundary");
  }
  const consumers = requireRecord(registry.consumers, `${path}.consumers`);
  for (const [consumerKey, rawConsumer] of Object.entries(consumers)) {
    const consumerPath = `${path}.consumers.${consumerKey}`;
    assertNonEmptyString(consumerKey, consumerPath);
    const consumer = requireRecord(rawConsumer, consumerPath);
    assertExactKeys(consumer, eventConsumerKeys, new Set(["allowed_events"]), consumerPath);
    assertStringArray(consumer.allowed_events, `${consumerPath}.allowed_events`, { unique: true });
    if (consumer.forbidden_events !== undefined) assertStringArray(consumer.forbidden_events, `${consumerPath}.forbidden_events`, { unique: true });
  }
};

const validateGovernanceAndVerification = (manifest: Record<string, unknown>, path: string): void => {
  const governance = requireRecord(manifest.governance, `${path}.governance`);
  assertExactKeys(governance, governanceKeys, governanceKeys, `${path}.governance`);
  assertStringArray(governance.admin_actions, `${path}.governance.admin_actions`, { unique: true });
  assertNonEmptyString(governance.rollback, `${path}.governance.rollback`);
  assertBoolean(governance.projection_review_required, `${path}.governance.projection_review_required`);
  assertStringArray(governance.evidence_records, `${path}.governance.evidence_records`, { unique: true });
  assertStringArray(governance.outbox_events, `${path}.governance.outbox_events`, { unique: true });
  const verification = requireRecord(manifest.verification, `${path}.verification`);
  assertExactKeys(verification, verificationKeys, verificationKeys, `${path}.verification`);
  assertStringArray(verification.deterministic_tests, `${path}.verification.deterministic_tests`, { unique: true });
  assertNonEmptyString(verification.journey_harness, `${path}.verification.journey_harness`);
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
  assertJsonValue(value, path);
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

  const stepRuntimeKinds = validateStepTypeRegistry(manifest.step_type_registry, manifest.scenario_key as string, `${path}.step_type_registry`);
  validateCapabilities(manifest.capabilities, stepRuntimeKinds, `${path}.capabilities`);
  validateScenarioData(manifest.scenario_data, `${path}.scenario_data`);
  validateArtifactPolicy(manifest.artifact_policy, `${path}.artifact_policy`);

  const actionAvailability = requireRecord(manifest.action_availability, `${path}.action_availability`);
  assertExactKeys(actionAvailability, actionAvailabilityKeys, actionAvailabilityKeys, `${path}.action_availability`);
  assertStringArray(actionAvailability.shared_actions, `${path}.action_availability.shared_actions`, { unique: true });
  assertStringArray(actionAvailability.scenario_actions, `${path}.action_availability.scenario_actions`, { unique: true });
  assertBoolean(actionAvailability.expected_version_required, `${path}.action_availability.expected_version_required`);

  validateHandoffs(manifest.handoffs, `${path}.handoffs`);
  const surfaceMapping = requireRecord(manifest.surface_mapping, `${path}.surface_mapping`);
  for (const [surface, mapping] of Object.entries(surfaceMapping)) {
    if (!workflowSurfaces.has(surface)) fail("invalid_surface", `${path}.surface_mapping.${surface}`, "surface_mapping key must use a supported Host surface");
    requireRecord(mapping, `${path}.surface_mapping.${surface}`);
  }
  validateInternalApi(manifest.internal_api, `${path}.internal_api`);
  validateEventRegistry(manifest.event_registry, `${path}.event_registry`);
  validateGovernanceAndVerification(manifest, path);
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
