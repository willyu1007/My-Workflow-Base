import { createHash } from "node:crypto";
import {
  scenarioAdmittedUserClasses,
  scenarioCapabilityEnablementPolicies,
  scenarioContractCapabilityKeysV1,
  scenarioContractSourceIdentitiesV1,
  type ScenarioManifestV2,
} from "./manifest.js";
import {
  standardWorkflowHandoffTypes,
  workflowRuntimeKinds,
  workflowStepPolicyFlags,
} from "./federation.js";
import { scenarioLaunchPhases, workflowScenarioStatuses } from "./identity.js";
import { assertScenarioDomainActionContractV1 } from "./scenario-domain-action-validation.js";
import type { ScenarioDomainActionContractV1 } from "./scenario-domain-action.js";
import { assertScenarioProtectedInteractionContractV1 } from "./scenario-protected-interaction-validation.js";
import type { ScenarioProtectedInteractionContractV1 } from "./scenario-protected-interaction.js";

export class ScenarioManifestValidationError extends Error {
  constructor(readonly code: string, readonly path: string, message: string) {
    super(message);
    this.name = "ScenarioManifestValidationError";
  }
}

const requiredManifestKeys = new Set([
  "manifest_version", "scenario_key", "scenario_record", "owner", "contract",
  "step_type_registry", "owner_integration", "launch_phase", "allowed_user_classes",
  "capabilities", "scenario_data", "artifact_policy", "action_availability", "handoffs",
  "surface_mapping", "internal_api", "event_registry", "governance", "verification",
]);
const manifestKeys = new Set([...requiredManifestKeys, "scenario_contracts"]);
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
const scenarioContractKeys = new Set([
  "scenario_contracts_version", "source_dependencies", "capability_dependencies",
  "trusted_invocation", "subject_context_providers", "semantic_presentations",
  "product_surfaces", "domain_action_contracts", "protected_interaction_contracts",
]);
const scenarioContractSourceDependencyKeys = new Set(["source_identity", "source_hash"]);
const scenarioCapabilityDependencyKeys = new Set([
  "capability_key", "requires_capabilities", "requires_sources",
]);
const scenarioTrustedInvocationKeys = new Set([
  "trusted_invocation_version", "invocation_contract", "operations",
]);
const scenarioTrustedOperationKeys = new Set([
  "endpoint_key", "method", "operation_key", "input_schema_key",
  "input_schema_version", "handler_key", "ingress",
]);
const scenarioTrustedIngressKeys = new Set([
  "ingress_category", "ingress_key", "principal_origins",
]);
const scenarioSubjectProviderKeys = new Set([
  "provider_key", "provider_version", "list_operation_key", "resolve_operation_key",
  "handler_key",
]);
const scenarioSemanticPresentationKeys = new Set([
  "presentation_key", "presentation_version", "provider_key", "operation_key",
  "handler_key", "safe_reason_codes",
]);
const scenarioProductSurfaceKeys = new Set([
  "product_surface_key", "presentation_key", "view_modes", "route_classes",
  "action_offer_policy", "action_keys",
]);
const workflowSurfaces = new Set([
  "chat_workflow_control", "chat_dashboard_summary", "chat_citation", "web_domain_workbench",
  "web_run_workbench", "mobile_dashboard", "forum_publication", "rag_knowledge",
  "notification_push", "admin_operator", "worker_runtime", "api",
]);
const scenarioKeyPattern = /^[a-z][a-z0-9-]*$/u;
const sourceHashPattern = /^[a-f0-9]{64}$/u;
const scenarioDeclarationKeyPattern = /^[a-z][a-z0-9._-]{0,127}$/u;
const scenarioReasonCodePattern = /^[a-z][a-z0-9_]{0,63}$/u;
const scenarioPresentationViewModes = ["current", "recent", "history"] as const;
const maximumScenarioSafeReasonCodes = 64;
const maximumScenarioRouteClasses = 64;
const maximumScenarioSurfaceActionKeys = 128;
const scenarioPresentationViewModeSet = new Set<string>(scenarioPresentationViewModes);
const scenarioIngressCategorySet = new Set([
  "product_surface", "host_transition", "workflow_runtime",
]);
const scenarioPrincipalOriginSet = new Set(["interactive_session", "durable_run_actor"]);
const scenarioContractCapabilityKeySet = new Set<string>(scenarioContractCapabilityKeysV1);
const scenarioContractSourceIdentitySet = new Set<string>(scenarioContractSourceIdentitiesV1);
const scenarioContractDependencySets = new Map<string, {
  capabilities: readonly string[];
  sources: readonly string[];
}>([
  ["trusted_scenario_invocation_v1", {
    capabilities: [],
    sources: ["scenario_interface_source_v1"],
  }],
  ["scenario_subject_presentation_v1", {
    capabilities: ["trusted_scenario_invocation_v1"],
    sources: [
      "platform_child_family_identity_source_v1",
      "scenario_interface_source_v1",
    ],
  }],
  ["scenario_domain_action_execution_v1", {
    capabilities: [
      "trusted_scenario_invocation_v1",
      "scenario_subject_presentation_v1",
    ],
    sources: ["scenario_domain_action_source_v1"],
  }],
  ["scenario_protected_interaction_v1", {
    capabilities: [
      "trusted_scenario_invocation_v1",
      "scenario_subject_presentation_v1",
      "scenario_domain_action_execution_v1",
    ],
    sources: ["scenario_protected_interaction_source_v1"],
  }],
]);

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

const arraysEqual = (left: readonly string[], right: readonly string[]): boolean =>
  left.length === right.length && left.every((value, index) => value === right[index]);

const requireScenarioDeclarationKey = (value: unknown, path: string): string => {
  if (typeof value !== "string" || !scenarioDeclarationKeyPattern.test(value)) {
    fail(
      "invalid_scenario_declaration_key",
      path,
      `${path} must be a bounded lowercase scenario declaration key`,
    );
  }
  return value as string;
};

const assertMaximumItems = (values: readonly unknown[], maximum: number, path: string): void => {
  if (values.length > maximum) {
    fail("too_many_items", path, `${path} may contain at most ${maximum} items`);
  }
};

const validateScenarioContractDependencies = (
  value: unknown,
  scenarioKey: string,
  path: string,
): void => {
  const contract = requireRecord(value, path);
  assertExactKeys(contract, scenarioContractKeys, scenarioContractKeys, path);
  if (contract.scenario_contracts_version !== 1) {
    fail(
      "unsupported_scenario_contracts_version",
      `${path}.scenario_contracts_version`,
      "scenario_contracts_version must be 1",
    );
  }

  const sourceDependencies = requireArray(
    contract.source_dependencies,
    `${path}.source_dependencies`,
  );
  if (sourceDependencies.length === 0) {
    fail("empty_source_dependencies", `${path}.source_dependencies`, "source_dependencies must be non-empty");
  }
  const sourceIdentities: string[] = [];
  for (const [index, rawDependency] of sourceDependencies.entries()) {
    const dependencyPath = `${path}.source_dependencies.${index}`;
    const dependency = requireRecord(rawDependency, dependencyPath);
    assertExactKeys(
      dependency,
      scenarioContractSourceDependencyKeys,
      scenarioContractSourceDependencyKeys,
      dependencyPath,
    );
    const sourceIdentity = dependency.source_identity;
    if (
      typeof sourceIdentity !== "string" ||
      !scenarioContractSourceIdentitySet.has(sourceIdentity)
    ) {
      fail(
        "invalid_source_identity",
        `${dependencyPath}.source_identity`,
        "source_identity must use the closed scenario-contract source vocabulary",
      );
    }
    const checkedSourceIdentity = sourceIdentity as string;
    const sourceHash = dependency.source_hash;
    if (typeof sourceHash !== "string" || !sourceHashPattern.test(sourceHash)) {
      fail(
        "invalid_source_hash",
        `${dependencyPath}.source_hash`,
        "source_hash must be lowercase SHA-256",
      );
    }
    if (sourceIdentities.includes(checkedSourceIdentity)) {
      fail(
        "duplicate_source_dependency",
        `${dependencyPath}.source_identity`,
        "source_dependencies must not contain duplicate identities",
      );
    }
    sourceIdentities.push(checkedSourceIdentity);
  }

  const capabilityDependencies = requireArray(
    contract.capability_dependencies,
    `${path}.capability_dependencies`,
  );
  if (capabilityDependencies.length === 0) {
    fail(
      "empty_capability_dependencies",
      `${path}.capability_dependencies`,
      "capability_dependencies must be non-empty",
    );
  }

  const dependencies = new Map<string, string[]>();
  const requiredSourcesByCapability = new Map<string, string[]>();
  for (const [index, rawDependency] of capabilityDependencies.entries()) {
    const dependencyPath = `${path}.capability_dependencies.${index}`;
    const dependency = requireRecord(rawDependency, dependencyPath);
    assertExactKeys(
      dependency,
      scenarioCapabilityDependencyKeys,
      scenarioCapabilityDependencyKeys,
      dependencyPath,
    );
    const capabilityKey = dependency.capability_key;
    if (
      typeof capabilityKey !== "string" ||
      !scenarioContractCapabilityKeySet.has(capabilityKey)
    ) {
      fail(
        "invalid_scenario_capability",
        `${dependencyPath}.capability_key`,
        "capability_key must use the closed scenario-contract capability vocabulary",
      );
    }
    const checkedCapabilityKey = capabilityKey as string;
    const expectedCapability = scenarioContractCapabilityKeysV1[index];
    if (checkedCapabilityKey !== expectedCapability) {
      fail(
        "invalid_capability_prefix",
        `${dependencyPath}.capability_key`,
        "capability_dependencies must be one canonical dependency-complete prefix",
      );
    }
    const requiredCapabilities = assertStringArray(
      dependency.requires_capabilities,
      `${dependencyPath}.requires_capabilities`,
      { unique: true, allowed: scenarioContractCapabilityKeySet },
    );
    const requiredSources = assertStringArray(
      dependency.requires_sources,
      `${dependencyPath}.requires_sources`,
      { nonEmpty: true, unique: true, allowed: scenarioContractSourceIdentitySet },
    );
    dependencies.set(checkedCapabilityKey, requiredCapabilities);
    requiredSourcesByCapability.set(checkedCapabilityKey, requiredSources);
  }

  const declaredCapabilities = new Set(dependencies.keys());
  for (const [capability, requiredCapabilities] of dependencies) {
    for (const requiredCapability of requiredCapabilities) {
      if (!declaredCapabilities.has(requiredCapability)) {
        fail(
          "missing_capability_dependency",
          `${path}.capability_dependencies`,
          `${capability} requires undeclared capability ${requiredCapability}`,
        );
      }
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (capability: string): void => {
    if (visiting.has(capability)) {
      fail(
        "cyclic_capability_dependency",
        `${path}.capability_dependencies`,
        "scenario-contract capability dependencies must be acyclic",
      );
    }
    if (visited.has(capability)) return;
    visiting.add(capability);
    for (const requiredCapability of dependencies.get(capability) ?? []) visit(requiredCapability);
    visiting.delete(capability);
    visited.add(capability);
  };
  for (const capability of dependencies.keys()) visit(capability);

  for (const [capability, requiredCapabilities] of dependencies) {
    const expected = scenarioContractDependencySets.get(capability) ?? fail(
      "invalid_scenario_capability",
      `${path}.capability_dependencies`,
      "Unknown capability",
    );
    if (!arraysEqual(requiredCapabilities, expected.capabilities)) {
      fail(
        "invalid_capability_dependency_set",
        `${path}.capability_dependencies`,
        `${capability} must use its exact required capability set`,
      );
    }
    const requiredSources = requiredSourcesByCapability.get(capability) ?? [];
    if (!arraysEqual(requiredSources, expected.sources)) {
      fail(
        "invalid_source_dependency_set",
        `${path}.capability_dependencies`,
        `${capability} must use its exact required source set`,
      );
    }
  }

  const referencedSources = new Set([...requiredSourcesByCapability.values()].flat());
  for (const sourceIdentity of referencedSources) {
    if (!sourceIdentities.includes(sourceIdentity)) {
      fail(
        "missing_source_dependency",
        `${path}.source_dependencies`,
        `source_dependencies is missing ${sourceIdentity}`,
      );
    }
  }
  for (const sourceIdentity of sourceIdentities) {
    if (!referencedSources.has(sourceIdentity)) {
      fail(
        "stale_source_dependency",
        `${path}.source_dependencies`,
        `source_dependencies contains unreferenced ${sourceIdentity}`,
      );
    }
  }
  const expectedSourceOrder = scenarioContractSourceIdentitiesV1.filter((sourceIdentity) =>
    referencedSources.has(sourceIdentity)
  );
  if (!arraysEqual(sourceIdentities, expectedSourceOrder)) {
    fail(
      "invalid_source_dependency_order",
      `${path}.source_dependencies`,
      "source_dependencies must use canonical source-identity order",
    );
  }

  const trustedInvocation = requireRecord(
    contract.trusted_invocation,
    `${path}.trusted_invocation`,
  );
  assertExactKeys(
    trustedInvocation,
    scenarioTrustedInvocationKeys,
    scenarioTrustedInvocationKeys,
    `${path}.trusted_invocation`,
  );
  if (
    trustedInvocation.trusted_invocation_version !== 1 ||
    trustedInvocation.invocation_contract !== "scenario-private-invocation-v1"
  ) {
    fail(
      "invalid_trusted_invocation_contract",
      `${path}.trusted_invocation`,
      "trusted_invocation must use the accepted scenario-private invocation v1 contract",
    );
  }

  const operations = requireArray(
    trustedInvocation.operations,
    `${path}.trusted_invocation.operations`,
  );
  if (operations.length === 0) {
    fail(
      "empty_trusted_operations",
      `${path}.trusted_invocation.operations`,
      "trusted_invocation.operations must be non-empty",
    );
  }
  assertMaximumItems(operations, 128, `${path}.trusted_invocation.operations`);

  const operationTuples = new Set<string>();
  const operationKeys = new Set<string>();
  const operationDeclarations = new Map<string, {
    ingressKeys: Set<string>;
    productIngressKeys: Set<string>;
  }>();
  const declarationHandlerKeys = new Set<string>();
  const productIngressKeys = new Set<string>();
  for (const [operationIndex, rawOperation] of operations.entries()) {
    const operationPath = `${path}.trusted_invocation.operations.${operationIndex}`;
    const operation = requireRecord(rawOperation, operationPath);
    assertExactKeys(
      operation,
      scenarioTrustedOperationKeys,
      scenarioTrustedOperationKeys,
      operationPath,
    );
    const endpointKey = requireScenarioDeclarationKey(
      operation.endpoint_key,
      `${operationPath}.endpoint_key`,
    );
    if (operation.method !== "POST") {
      fail("invalid_http_method", `${operationPath}.method`, "trusted operations must use POST");
    }
    const operationKey = requireScenarioDeclarationKey(
      operation.operation_key,
      `${operationPath}.operation_key`,
    );
    requireScenarioDeclarationKey(operation.input_schema_key, `${operationPath}.input_schema_key`);
    assertPositiveInteger(operation.input_schema_version, `${operationPath}.input_schema_version`);
    const handlerKey = requireScenarioDeclarationKey(
      operation.handler_key,
      `${operationPath}.handler_key`,
    );
    const operationTuple = `${endpointKey}\0POST\0${operationKey}`;
    if (operationTuples.has(operationTuple)) {
      fail("duplicate_trusted_operation", operationPath, "trusted operation tuples must be unique");
    }
    if (operationKeys.has(operationKey)) {
      fail(
        "duplicate_trusted_operation_key",
        `${operationPath}.operation_key`,
        "trusted operation keys must be unique",
      );
    }
    if (declarationHandlerKeys.has(handlerKey)) {
      fail(
        "duplicate_scenario_handler",
        `${operationPath}.handler_key`,
        "scenario declaration handler keys must be unique",
      );
    }
    operationTuples.add(operationTuple);
    operationKeys.add(operationKey);
    declarationHandlerKeys.add(handlerKey);

    const ingressEntries = requireArray(operation.ingress, `${operationPath}.ingress`);
    if (ingressEntries.length === 0) {
      fail("empty_operation_ingress", `${operationPath}.ingress`, "operation ingress must be non-empty");
    }
    assertMaximumItems(ingressEntries, 16, `${operationPath}.ingress`);
    const ingressTuples = new Set<string>();
    const operationIngressKeys = new Set<string>();
    const operationProductIngressKeys = new Set<string>();
    for (const [ingressIndex, rawIngress] of ingressEntries.entries()) {
      const ingressPath = `${operationPath}.ingress.${ingressIndex}`;
      const ingress = requireRecord(rawIngress, ingressPath);
      assertExactKeys(
        ingress,
        scenarioTrustedIngressKeys,
        scenarioTrustedIngressKeys,
        ingressPath,
      );
      if (
        typeof ingress.ingress_category !== "string" ||
        !scenarioIngressCategorySet.has(ingress.ingress_category)
      ) {
        fail(
          "invalid_ingress_category",
          `${ingressPath}.ingress_category`,
          "ingress_category must use the accepted I1-A vocabulary",
        );
      }
      const ingressCategory = ingress.ingress_category as string;
      const ingressKey = requireScenarioDeclarationKey(
        ingress.ingress_key,
        `${ingressPath}.ingress_key`,
      );
      const principalOrigins = assertStringArray(
        ingress.principal_origins,
        `${ingressPath}.principal_origins`,
        { nonEmpty: true, unique: true, allowed: scenarioPrincipalOriginSet },
      );
      const expectedOrigins = ingressCategory === "workflow_runtime"
        ? ["durable_run_actor"]
        : ["interactive_session"];
      if (!arraysEqual(principalOrigins, expectedOrigins)) {
        fail(
          "invalid_ingress_principal_origins",
          `${ingressPath}.principal_origins`,
          "product/transition ingress is interactive and workflow runtime ingress is durable",
        );
      }
      const ingressTuple = `${ingressCategory}\0${ingressKey}\0${principalOrigins.join(",")}`;
      if (ingressTuples.has(ingressTuple)) {
        fail("duplicate_operation_ingress", ingressPath, "operation ingress tuples must be unique");
      }
      ingressTuples.add(ingressTuple);
      operationIngressKeys.add(ingressKey);
      if (ingressCategory === "product_surface") {
        productIngressKeys.add(ingressKey);
        operationProductIngressKeys.add(ingressKey);
      }
    }
    operationDeclarations.set(operationKey, {
      ingressKeys: operationIngressKeys,
      productIngressKeys: operationProductIngressKeys,
    });
  }

  const hasPresentation = declaredCapabilities.has("scenario_subject_presentation_v1");
  const providerValues = requireArray(
    contract.subject_context_providers,
    `${path}.subject_context_providers`,
  );
  const presentationValues = requireArray(
    contract.semantic_presentations,
    `${path}.semantic_presentations`,
  );
  const surfaceValues = requireArray(contract.product_surfaces, `${path}.product_surfaces`);
  for (const [values, field] of [
    [providerValues, "subject_context_providers"],
    [presentationValues, "semantic_presentations"],
    [surfaceValues, "product_surfaces"],
  ] as const) {
    assertMaximumItems(values, 64, `${path}.${field}`);
    if (hasPresentation && values.length === 0) {
      fail(
        "missing_presentation_declaration",
        `${path}.${field}`,
        `${field} must be non-empty when presentation capability is declared`,
      );
    }
    if (!hasPresentation && values.length > 0) {
      fail(
        "undeclared_presentation_capability",
        `${path}.${field}`,
        `${field} requires scenario_subject_presentation_v1`,
      );
    }
  }

  const providerKeys = new Set<string>();
  for (const [index, rawProvider] of providerValues.entries()) {
    const providerPath = `${path}.subject_context_providers.${index}`;
    const provider = requireRecord(rawProvider, providerPath);
    assertExactKeys(provider, scenarioSubjectProviderKeys, scenarioSubjectProviderKeys, providerPath);
    const providerKey = requireScenarioDeclarationKey(provider.provider_key, `${providerPath}.provider_key`);
    if (provider.provider_version !== 1) {
      fail("invalid_provider_version", `${providerPath}.provider_version`, "provider_version must be 1");
    }
    if (
      provider.list_operation_key !== "list_subject_contexts" ||
      provider.resolve_operation_key !== "resolve_subject_context"
    ) {
      fail(
        "invalid_provider_operations",
        providerPath,
        "provider must use the accepted list/resolve operation pair",
      );
    }
    const handlerKey = requireScenarioDeclarationKey(provider.handler_key, `${providerPath}.handler_key`);
    if (providerKeys.has(providerKey)) {
      fail("duplicate_provider", `${providerPath}.provider_key`, "provider keys must be unique");
    }
    if (declarationHandlerKeys.has(handlerKey)) {
      fail("duplicate_scenario_handler", `${providerPath}.handler_key`, "scenario handler keys must be unique");
    }
    for (const operationKey of ["list_subject_contexts", "resolve_subject_context"]) {
      if (!operationKeys.has(operationKey)) {
        fail(
          "missing_provider_operation",
          providerPath,
          `provider requires trusted operation ${operationKey}`,
        );
      }
    }
    providerKeys.add(providerKey);
    declarationHandlerKeys.add(handlerKey);
  }

  const presentationKeys = new Set<string>();
  const presentationOperationKeys = new Map<string, string>();
  for (const [index, rawPresentation] of presentationValues.entries()) {
    const presentationPath = `${path}.semantic_presentations.${index}`;
    const presentation = requireRecord(rawPresentation, presentationPath);
    assertExactKeys(
      presentation,
      scenarioSemanticPresentationKeys,
      scenarioSemanticPresentationKeys,
      presentationPath,
    );
    const presentationKey = requireScenarioDeclarationKey(
      presentation.presentation_key,
      `${presentationPath}.presentation_key`,
    );
    if (presentation.presentation_version !== 1 || presentation.operation_key !== "present_subject_context") {
      fail(
        "invalid_presentation_contract",
        presentationPath,
        "presentation must use version 1 and present_subject_context",
      );
    }
    const providerKey = requireScenarioDeclarationKey(
      presentation.provider_key,
      `${presentationPath}.provider_key`,
    );
    const handlerKey = requireScenarioDeclarationKey(
      presentation.handler_key,
      `${presentationPath}.handler_key`,
    );
    const reasonCodes = assertStringArray(
      presentation.safe_reason_codes,
      `${presentationPath}.safe_reason_codes`,
      { nonEmpty: true, unique: true },
    );
    assertMaximumItems(
      reasonCodes,
      maximumScenarioSafeReasonCodes,
      `${presentationPath}.safe_reason_codes`,
    );
    for (const [reasonIndex, reasonCode] of reasonCodes.entries()) {
      if (!scenarioReasonCodePattern.test(reasonCode)) {
        fail(
          "invalid_safe_reason_code",
          `${presentationPath}.safe_reason_codes.${reasonIndex}`,
          "safe reason codes must use bounded snake_case",
        );
      }
    }
    if (presentationKeys.has(presentationKey)) {
      fail("duplicate_presentation", `${presentationPath}.presentation_key`, "presentation keys must be unique");
    }
    if (!providerKeys.has(providerKey)) {
      fail("missing_presentation_provider", `${presentationPath}.provider_key`, "presentation provider is undeclared");
    }
    if (!operationKeys.has("present_subject_context")) {
      fail(
        "missing_presentation_operation",
        presentationPath,
        "presentation requires trusted operation present_subject_context",
      );
    }
    if (declarationHandlerKeys.has(handlerKey)) {
      fail("duplicate_scenario_handler", `${presentationPath}.handler_key`, "scenario handler keys must be unique");
    }
    presentationKeys.add(presentationKey);
    presentationOperationKeys.set(presentationKey, presentation.operation_key as string);
    declarationHandlerKeys.add(handlerKey);
  }

  const productSurfaceKeys = new Set<string>();
  const offeredActionKeys = new Set<string>();
  const actionSurfaceKeys = new Map<string, Set<string>>();
  for (const [index, rawSurface] of surfaceValues.entries()) {
    const surfacePath = `${path}.product_surfaces.${index}`;
    const surface = requireRecord(rawSurface, surfacePath);
    assertExactKeys(surface, scenarioProductSurfaceKeys, scenarioProductSurfaceKeys, surfacePath);
    const productSurfaceKey = requireScenarioDeclarationKey(
      surface.product_surface_key,
      `${surfacePath}.product_surface_key`,
    );
    const presentationKey = requireScenarioDeclarationKey(
      surface.presentation_key,
      `${surfacePath}.presentation_key`,
    );
    const viewModes = assertStringArray(surface.view_modes, `${surfacePath}.view_modes`, {
      nonEmpty: true,
      unique: true,
      allowed: scenarioPresentationViewModeSet,
    });
    const expectedViewModes = scenarioPresentationViewModes.filter((viewMode) => viewModes.includes(viewMode));
    if (!arraysEqual(viewModes, expectedViewModes)) {
      fail("invalid_view_mode_order", `${surfacePath}.view_modes`, "view_modes must use canonical order");
    }
    const routeClasses = assertStringArray(surface.route_classes, `${surfacePath}.route_classes`, {
      nonEmpty: true,
      unique: true,
    });
    assertMaximumItems(
      routeClasses,
      maximumScenarioRouteClasses,
      `${surfacePath}.route_classes`,
    );
    for (const [routeIndex, routeClass] of routeClasses.entries()) {
      requireScenarioDeclarationKey(routeClass, `${surfacePath}.route_classes.${routeIndex}`);
    }
    const actionKeys = assertStringArray(surface.action_keys, `${surfacePath}.action_keys`, {
      unique: true,
    });
    assertMaximumItems(
      actionKeys,
      maximumScenarioSurfaceActionKeys,
      `${surfacePath}.action_keys`,
    );
    if (surface.action_offer_policy === "none") {
      if (actionKeys.length !== 0) {
        fail("invalid_action_offer_policy", surfacePath, "none requires an empty action_keys array");
      }
    } else if (surface.action_offer_policy === "declared_actions") {
      if (actionKeys.length === 0) {
        fail("invalid_action_offer_policy", surfacePath, "declared_actions requires action keys");
      }
      for (const [actionIndex, actionKey] of actionKeys.entries()) {
        requireScenarioDeclarationKey(actionKey, `${surfacePath}.action_keys.${actionIndex}`);
        offeredActionKeys.add(actionKey);
        const offeringSurfaces = actionSurfaceKeys.get(actionKey) ?? new Set<string>();
        offeringSurfaces.add(productSurfaceKey);
        actionSurfaceKeys.set(actionKey, offeringSurfaces);
      }
    } else {
      fail("invalid_action_offer_policy", `${surfacePath}.action_offer_policy`, "Unknown action offer policy");
    }
    if (productSurfaceKeys.has(productSurfaceKey)) {
      fail("duplicate_product_surface", `${surfacePath}.product_surface_key`, "product surface keys must be unique");
    }
    if (!presentationKeys.has(presentationKey)) {
      fail("missing_surface_presentation", `${surfacePath}.presentation_key`, "surface presentation is undeclared");
    }
    if (!productIngressKeys.has(productSurfaceKey)) {
      fail(
        "missing_product_surface_ingress",
        `${surfacePath}.product_surface_key`,
        "product_surface_key must equal a declared product_surface ingress_key",
      );
    }
    const presentationOperationKey = presentationOperationKeys.get(presentationKey);
    const presentationOperation = presentationOperationKey === undefined
      ? undefined
      : operationDeclarations.get(presentationOperationKey);
    if (!presentationOperation?.productIngressKeys.has(productSurfaceKey)) {
      fail(
        "missing_surface_presentation_ingress",
        `${surfacePath}.product_surface_key`,
        "product surface must be a product_surface ingress of its presentation operation",
      );
    }
    productSurfaceKeys.add(productSurfaceKey);
  }

  for (const productIngressKey of productIngressKeys) {
    if (!productSurfaceKeys.has(productIngressKey)) {
      fail(
        "missing_product_surface_declaration",
        `${path}.trusted_invocation.operations`,
        `product surface ingress ${productIngressKey} has no product surface declaration`,
      );
    }
  }

  const hasActionCapability = declaredCapabilities.has("scenario_domain_action_execution_v1");
  const actionValues = requireArray(
    contract.domain_action_contracts,
    `${path}.domain_action_contracts`,
  );
  assertMaximumItems(actionValues, 128, `${path}.domain_action_contracts`);
  if (hasActionCapability && actionValues.length === 0) {
    fail(
      "missing_domain_action_declaration",
      `${path}.domain_action_contracts`,
      "domain_action_contracts must be non-empty when action capability is declared",
    );
  }
  if (!hasActionCapability && actionValues.length > 0) {
    fail(
      "undeclared_domain_action_capability",
      `${path}.domain_action_contracts`,
      "domain_action_contracts requires scenario_domain_action_execution_v1",
    );
  }

  const prepareOperation = operationDeclarations.get("prepare_domain_action");
  const actionKeys = new Set<string>();
  for (const [index, rawAction] of actionValues.entries()) {
    const actionPath = `${path}.domain_action_contracts.${index}`;
    try {
      assertScenarioDomainActionContractV1(rawAction, actionPath);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "unknown action contract failure";
      fail("invalid_domain_action_contract", actionPath, detail);
    }
    const action = rawAction as ScenarioDomainActionContractV1;
    if (action.scenario_key !== scenarioKey) {
      fail(
        "domain_action_scenario_mismatch",
        `${actionPath}.scenario_key`,
        "domain action scenario_key must equal the manifest scenario_key",
      );
    }
    if (actionKeys.has(action.action_key)) {
      fail("duplicate_domain_action", `${actionPath}.action_key`, "domain action keys must be unique");
    }
    const checkedPrepareOperation = prepareOperation ?? fail(
      "missing_domain_action_handler",
      `${actionPath}.handler_key`,
      "domain action requires a trusted prepare_domain_action operation",
    );
    if (declarationHandlerKeys.has(action.handler_key)) {
      fail(
        "duplicate_scenario_handler",
        `${actionPath}.handler_key`,
        "domain action handlers must be unique across Scenario declarations",
      );
    }
    for (const [ingressIndex, ingressKey] of action.entitled_ingress_keys.entries()) {
      if (!checkedPrepareOperation.ingressKeys.has(ingressKey)) {
        fail(
          "missing_domain_action_ingress",
          `${actionPath}.entitled_ingress_keys.${ingressIndex}`,
          "domain action ingress must be declared by prepare_domain_action",
        );
      }
    }
    for (const surfaceKey of actionSurfaceKeys.get(action.action_key) ?? []) {
      if (!action.entitled_ingress_keys.includes(surfaceKey)) {
        fail(
          "missing_domain_action_surface_ingress",
          `${actionPath}.entitled_ingress_keys`,
          `domain action must entitle its offering product surface ${surfaceKey}`,
        );
      }
    }
    if (!offeredActionKeys.has(action.action_key)) {
      fail(
        "missing_domain_action_surface",
        `${actionPath}.action_key`,
        "every domain action must be offered by a declared product surface",
      );
    }
    actionKeys.add(action.action_key);
    declarationHandlerKeys.add(action.handler_key);
  }
  for (const offeredActionKey of offeredActionKeys) {
    if (!actionKeys.has(offeredActionKey)) {
      fail(
        "missing_domain_action_declaration",
        `${path}.product_surfaces`,
        `product surface action ${offeredActionKey} has no exact domain action contract`,
      );
    }
  }

  const hasProtectedCapability = declaredCapabilities.has("scenario_protected_interaction_v1");
  const protectedValues = requireArray(
    contract.protected_interaction_contracts,
    `${path}.protected_interaction_contracts`,
  );
  assertMaximumItems(protectedValues, 128, `${path}.protected_interaction_contracts`);
  if (hasProtectedCapability && protectedValues.length === 0) {
    fail(
      "missing_protected_interaction_declaration",
      `${path}.protected_interaction_contracts`,
      "protected_interaction_contracts must be non-empty when protected capability is declared",
    );
  }
  if (!hasProtectedCapability && protectedValues.length > 0) {
    fail(
      "undeclared_protected_interaction_capability",
      `${path}.protected_interaction_contracts`,
      "protected_interaction_contracts requires scenario_protected_interaction_v1",
    );
  }
  const protectedKeys = new Set<string>();
  for (const [index, rawProtected] of protectedValues.entries()) {
    const protectedPath = `${path}.protected_interaction_contracts.${index}`;
    try {
      assertScenarioProtectedInteractionContractV1(rawProtected, protectedPath);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "unknown protected contract failure";
      fail("invalid_protected_interaction_contract", protectedPath, detail);
    }
    const protectedContract = rawProtected as ScenarioProtectedInteractionContractV1;
    if (protectedContract.scenario_key !== scenarioKey) {
      fail(
        "protected_interaction_scenario_mismatch",
        `${protectedPath}.scenario_key`,
        "protected interaction scenario_key must equal the manifest scenario_key",
      );
    }
    if (!actionKeys.has(protectedContract.action_key)) {
      fail(
        "missing_protected_domain_action",
        `${protectedPath}.action_key`,
        "protected interaction must resolve one exact domain action",
      );
    }
    if (
      !operationKeys.has(protectedContract.prepare_operation_key) ||
      !operationKeys.has(protectedContract.read_operation_key)
    ) {
      fail(
        "missing_protected_operation",
        protectedPath,
        "protected interaction operations must resolve trusted invocation declarations",
      );
    }
    const protectedKey = `${protectedContract.action_key}\0${protectedContract.protected_field_key}`;
    if (protectedKeys.has(protectedKey)) {
      fail(
        "duplicate_protected_interaction",
        protectedPath,
        "protected action and field pairs must be unique",
      );
    }
    protectedKeys.add(protectedKey);
  }
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
  assertExactKeys(manifest, manifestKeys, requiredManifestKeys, path);
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
  if (manifest.scenario_contracts !== undefined) {
    validateScenarioContractDependencies(
      manifest.scenario_contracts,
      manifest.scenario_key as string,
      `${path}.scenario_contracts`,
    );
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
