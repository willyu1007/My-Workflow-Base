import type {
  ScenarioManifestV2,
  WorkflowActivationTarget,
  WorkflowHostValidationSnapshot,
  WorkflowModuleValidationFinding,
  WorkflowModuleValidationReport,
  WorkflowScenarioModule,
} from "@host/workflow-contracts";
import {
  ScenarioManifestValidationError,
  assertScenarioManifestV2,
  scenarioCapabilityEnablementPolicies,
  scenarioLaunchPhases,
  standardWorkflowHandoffTypes,
  workflowScenarioStatuses,
  workflowRuntimeKinds,
  workflowStepPolicyFlags,
} from "@host/workflow-contracts";
import { createHash } from "node:crypto";

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function computeContractHash(module: WorkflowScenarioModule): string {
  const normalized = module.manifest.manifest_version === 2
    ? module.manifest
    : {
        manifest: module.manifest,
        handler_keys: Object.keys(module.handlers).sort(),
        action_keys: Object.keys(module.actions).sort(),
        policy_keys: Object.keys(module.policies).sort(),
        internal_api_handler_keys: Object.keys(module.internal_api_handlers).sort(),
        adapter_keys: Object.keys(module.adapters).sort(),
        presenter_keys: Object.keys(module.presenters).sort(),
      };

  return createHash("sha256").update(stableStringify(normalized)).digest("hex");
}

function addFatal(
  findings: WorkflowModuleValidationFinding[],
  input: Omit<WorkflowModuleValidationFinding, "severity">,
): void {
  findings.push({ ...input, severity: "fatal" });
}

function addWarning(
  findings: WorkflowModuleValidationFinding[],
  input: Omit<WorkflowModuleValidationFinding, "severity">,
): void {
  findings.push({ ...input, severity: "warning" });
}

function isNonEmpty(value: string | undefined): value is string {
  return value !== undefined && value.trim().length > 0;
}

function hasDeclaredHandoffSource(input: {
  source_artifact_types: string[];
  source_context_ref_types?: Array<{ namespace: string; object_type: string }>;
}): boolean {
  return (
    input.source_artifact_types.some(isNonEmpty) ||
    (input.source_context_ref_types ?? []).some(
      (sourceType) => isNonEmpty(sourceType.namespace) && isNonEmpty(sourceType.object_type),
    )
  );
}

function collectStringValues(value: unknown, target: Set<string>): void {
  if (typeof value === "string") {
    target.add(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStringValues(item, target);
    return;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value as Record<string, unknown>)) {
      collectStringValues(item, target);
    }
  }
}

function validateScenarioContractModule(input: {
  manifest: ScenarioManifestV2;
  host_snapshot: WorkflowHostValidationSnapshot;
  findings: WorkflowModuleValidationFinding[];
}): void {
  const scenarioContracts = input.manifest.scenario_contracts;
  if (!scenarioContracts) return;

  for (const [index, dependency] of scenarioContracts.capability_dependencies.entries()) {
    if (!input.host_snapshot.host_capabilities?.includes(dependency.capability_key)) {
      addFatal(input.findings, {
        rule_id: "WF-MAN-119",
        message: `Host does not support scenario contract capability: ${dependency.capability_key}`,
        path: `scenario_contracts.capability_dependencies.${index}.capability_key`,
        remediation: "Keep the scenario contract inactive until the Host declares exact contract support.",
      });
    }
  }

  const legacyHandlerKeys = new Set<string>();
  const legacyEntrypointKeys = new Set<string>();
  for (const capability of input.manifest.capabilities) {
    for (const entrypoint of capability.entrypoints) {
      legacyEntrypointKeys.add(entrypoint.entrypoint_key);
      for (const step of entrypoint.steps) legacyHandlerKeys.add(step.handler_key);
    }
  }
  const legacyRouteAliases = new Set<string>();
  for (const route of input.manifest.internal_api.routes) {
    legacyHandlerKeys.add(route.handler_key);
    legacyRouteAliases.add(route.path);
  }
  const legacySurfaceValues = new Set<string>();
  collectStringValues(input.manifest.surface_mapping, legacySurfaceValues);

  const declarationHandlers: Array<{ key: string; path: string }> = [];
  for (const [index, operation] of scenarioContracts.trusted_invocation.operations.entries()) {
    declarationHandlers.push({
      key: operation.handler_key,
      path: `scenario_contracts.trusted_invocation.operations.${index}.handler_key`,
    });
    if (
      legacyEntrypointKeys.has(operation.operation_key) ||
      legacyRouteAliases.has(operation.operation_key) ||
      legacyRouteAliases.has(operation.endpoint_key)
    ) {
      addFatal(input.findings, {
        rule_id: "WF-MAN-121",
        message: `Scenario operation aliases a legacy entrypoint or route: ${operation.operation_key}`,
        path: `scenario_contracts.trusted_invocation.operations.${index}`,
        remediation: "Use one canonical vNext operation key and remove the legacy alias before adoption.",
      });
    }
  }
  for (const [index, provider] of scenarioContracts.subject_context_providers.entries()) {
    declarationHandlers.push({
      key: provider.handler_key,
      path: `scenario_contracts.subject_context_providers.${index}.handler_key`,
    });
  }
  for (const [index, presentation] of scenarioContracts.semantic_presentations.entries()) {
    declarationHandlers.push({
      key: presentation.handler_key,
      path: `scenario_contracts.semantic_presentations.${index}.handler_key`,
    });
  }

  for (const declaration of declarationHandlers) {
    if (
      legacyHandlerKeys.has(declaration.key) ||
      legacySurfaceValues.has(declaration.key)
    ) {
      addFatal(input.findings, {
        rule_id: "WF-MAN-120",
        message: `Scenario declaration handler aliases a legacy implementation: ${declaration.key}`,
        path: declaration.path,
        remediation: "Use a dedicated vNext handler key and keep legacy registries separate.",
      });
    }
  }

  const legacySurfaceKeys = new Set(Object.keys(input.manifest.surface_mapping));
  for (const [index, surface] of scenarioContracts.product_surfaces.entries()) {
    if (legacySurfaceKeys.has(surface.product_surface_key)) {
      addFatal(input.findings, {
        rule_id: "WF-MAN-122",
        message: `Scenario product surface aliases legacy surface_mapping: ${surface.product_surface_key}`,
        path: `scenario_contracts.product_surfaces.${index}.product_surface_key`,
        remediation: "Use a dedicated product-surface key; do not reinterpret legacy Host surfaces.",
      });
    }
  }

  const legacyActionKeys = new Set(input.manifest.action_availability.scenario_actions);
  for (const [index, action] of scenarioContracts.domain_action_contracts.entries()) {
    if (legacyActionKeys.has(action.action_key)) {
      addFatal(input.findings, {
        rule_id: "WF-MAN-123",
        message: `Scenario domain action aliases legacy action_availability: ${action.action_key}`,
        path: `scenario_contracts.domain_action_contracts.${index}.action_key`,
        remediation: "Use one vNext action declaration and remove the legacy scenario-action alias.",
      });
    }
  }
}

export function validateWorkflowModule(input: {
  module: WorkflowScenarioModule;
  host_snapshot: WorkflowHostValidationSnapshot;
  activation_target: WorkflowActivationTarget;
}): WorkflowModuleValidationReport {
  const findings: WorkflowModuleValidationFinding[] = [];
  const manifest = input.module.manifest;
  const contract_hash = computeContractHash(input.module);
  const scenarioRecord = input.host_snapshot.scenario_records[manifest.scenario_key];

  if (manifest.manifest_version !== 1 && manifest.manifest_version !== 2) {
    addFatal(findings, {
      rule_id: "WF-MAN-099",
      message: `Unsupported manifest version: ${manifest.manifest_version}`,
      path: "manifest_version",
      remediation: "Use a manifest version explicitly supported by this Host SDK.",
    });
  }

  if (manifest.manifest_version === 2) {
    const allowedManifestKeys = new Set([
      "manifest_version", "scenario_key", "scenario_record", "owner", "contract",
      "step_type_registry", "owner_integration", "launch_phase", "allowed_user_classes",
      "capabilities", "scenario_data", "artifact_policy", "action_availability", "handoffs",
      "surface_mapping", "internal_api", "event_registry", "governance", "verification",
      "scenario_contracts",
    ]);
    const unknownManifestKeys = Object.keys(manifest).filter((key) => !allowedManifestKeys.has(key));
    if (unknownManifestKeys.length > 0) {
      addFatal(findings, {
        rule_id: "WF-MAN-113",
        message: `Federated manifest contains unknown top-level fields: ${unknownManifestKeys.join(", ")}`,
        path: "manifest",
        remediation: "Remove unknown fields or publish an additive contract minor version before using them.",
      });
    }

    if (!(scenarioLaunchPhases as readonly string[]).includes(manifest.launch_phase)) {
      addFatal(findings, {
        rule_id: "WF-MAN-115",
        message: `Unknown release launch phase: ${String(manifest.launch_phase)}`,
        path: "launch_phase",
        remediation: "Use dev, pilot, ga, or disabled as release metadata; workspace activation controls traffic.",
      });
    }

    if (!(workflowScenarioStatuses as readonly string[]).includes(manifest.scenario_record.required_status)) {
      addFatal(findings, {
        rule_id: "WF-MAN-116",
        message: `Unknown Scenario lifecycle status: ${String(manifest.scenario_record.required_status)}`,
        path: "scenario_record.required_status",
        remediation: "Use draft, active, disabled, or archived. Pilot traffic is represented by canary activation.",
      });
    }

    const contract = manifest.contract;
    if (
      !contract ||
      !isNonEmpty(contract.base_contract_version) ||
      !isNonEmpty(contract.host_sdk_version) ||
      !isNonEmpty(contract.host_abi_range) ||
      !/^[a-f0-9]{64}$/u.test(contract.source_hash)
    ) {
      addFatal(findings, {
        rule_id: "WF-MAN-100",
        message: "Federated manifest requires an exact contract and logical source hash.",
        path: "contract",
        remediation: "Lock Base, Host SDK, ABI range, and a 64-character lowercase SHA-256 source hash.",
      });
    }

    const stepTypeRegistry = manifest.step_type_registry ?? [];
    if (stepTypeRegistry.length === 0) {
      addFatal(findings, {
        rule_id: "WF-MAN-101",
        message: "Federated manifest requires a non-empty step type registry.",
        path: "step_type_registry",
        remediation: "Declare every durable step type and map it to one closed runtime_kind.",
      });
    }

    const stepTypes = new Map<string, (typeof stepTypeRegistry)[number]>();
    for (const [definitionIndex, definition] of stepTypeRegistry.entries()) {
      const definitionPath = `step_type_registry.${definitionIndex}`;
      const unknownDefinitionKeys = Object.keys(definition).filter(
        (key) => !["step_type", "runtime_kind", "owner", "policy_flags"].includes(key),
      );
      if (unknownDefinitionKeys.length > 0) {
        addFatal(findings, {
          rule_id: "WF-MAN-114",
          message: `Step type definition contains unknown fields: ${unknownDefinitionKeys.join(", ")}`,
          path: definitionPath,
          remediation: "Remove unknown fields or publish an additive contract minor version.",
        });
      }
      if (stepTypes.has(definition.step_type)) {
        addFatal(findings, {
          rule_id: "WF-MAN-102",
          message: `Step type is declared more than once: ${definition.step_type}`,
          path: `${definitionPath}.step_type`,
          remediation: "Keep exactly one definition for each durable step type.",
        });
      }
      stepTypes.set(definition.step_type, definition);

      if (!(workflowRuntimeKinds as readonly string[]).includes(definition.runtime_kind)) {
        addFatal(findings, {
          rule_id: "WF-MAN-103",
          message: `Unknown runtime kind: ${String(definition.runtime_kind)}`,
          path: `${definitionPath}.runtime_kind`,
          remediation: "Use a runtime kind from the closed Base contract registry.",
        });
      }

      if (
        definition.owner === "scenario" &&
        !definition.step_type.startsWith(`${manifest.scenario_key}.`)
      ) {
        addFatal(findings, {
          rule_id: "WF-MAN-104",
          message: `Scenario-owned step type is not namespaced: ${definition.step_type}`,
          path: `${definitionPath}.step_type`,
          remediation: `Prefix scenario-owned step types with ${manifest.scenario_key}.`,
        });
      }

      for (const policyFlag of definition.policy_flags ?? []) {
        if (!(workflowStepPolicyFlags as readonly string[]).includes(policyFlag)) {
          addFatal(findings, {
            rule_id: "WF-MAN-105",
            message: `Unknown step policy flag: ${String(policyFlag)}`,
            path: `${definitionPath}.policy_flags`,
            remediation: "Use a policy flag from the closed Base contract registry.",
          });
        }
      }
    }

    for (const capability of manifest.capabilities) {
      if (!(scenarioCapabilityEnablementPolicies as readonly string[]).includes(capability.enablement_policy)) {
        addFatal(findings, {
          rule_id: "WF-MAN-117",
          message: `Unsupported capability enablement policy: ${String(capability.enablement_policy)}`,
          path: `capabilities.${capability.capability_key}.enablement_policy`,
          remediation: "Use requires_workspace_activation or disabled; capability metadata cannot enable traffic.",
        });
      }
      for (const entrypoint of capability.entrypoints) {
        for (const allowedStepType of entrypoint.allowed_step_types) {
          if (!stepTypes.has(allowedStepType)) {
            addFatal(findings, {
              rule_id: "WF-MAN-106",
              message: `Entrypoint allows an undeclared step type: ${allowedStepType}`,
              path: `capabilities.${capability.capability_key}.${entrypoint.entrypoint_key}.allowed_step_types`,
              remediation: "Declare the step type in step_type_registry.",
            });
          }
        }

        for (const step of entrypoint.steps) {
          const definition = stepTypes.get(step.step_type);
          if (!definition) {
            addFatal(findings, {
              rule_id: "WF-MAN-107",
              message: `Durable step uses an undeclared step type: ${step.step_type}`,
              path: `capabilities.${capability.capability_key}.${entrypoint.entrypoint_key}.${step.step_key}.step_type`,
              remediation: "Declare the step type in step_type_registry.",
            });
          } else if (step.runtime_kind !== definition.runtime_kind) {
            addFatal(findings, {
              rule_id: "WF-MAN-108",
              message: `Step runtime kind does not match its registry definition: ${step.step_type}`,
              path: `capabilities.${capability.capability_key}.${entrypoint.entrypoint_key}.${step.step_key}.runtime_kind`,
              remediation: `Set runtime_kind to ${definition.runtime_kind}.`,
            });
          }
        }
      }
    }

    for (const [handoffIndex, handoff] of manifest.handoffs.entries()) {
      if (!(standardWorkflowHandoffTypes as readonly string[]).includes(handoff.handoff_type)) {
        addFatal(findings, {
          rule_id: "WF-MAN-109",
          message: `Federated manifest uses a non-standard handoff type: ${handoff.handoff_type}`,
          path: `handoffs.${handoffIndex}.handoff_type`,
          remediation: "Use public_draft, indexing, notification, or external_delivery.",
        });
      }
    }

    if (
      !manifest.owner_integration ||
      manifest.owner_integration.command_contract !== "scenario-command-envelope-v1" ||
      manifest.owner_integration.event_contract !== "scenario-event-envelope-v1" ||
      manifest.owner_integration.receipt_contract !== "scenario-command-receipt-v1" ||
      manifest.owner_integration.status_lookup_required !== true ||
      manifest.owner_integration.auth_mode !== "service_authenticated"
    ) {
      addFatal(findings, {
        rule_id: "WF-MAN-110",
        message: "Federated manifest requires the versioned Owner API integration contract.",
        path: "owner_integration",
        remediation: "Declare command, event, receipt, status lookup, and service authentication v1 contracts.",
      });
    }

    if (!input.host_snapshot.host_capabilities?.includes("scenario_federation_v1")) {
      addFatal(findings, {
        rule_id: "WF-MAN-111",
        message: "Host does not enable scenario_federation_v1.",
        path: "host_capabilities",
        remediation: "Keep activation disabled until the Host SDK federation capability is available.",
      });
    }

    const hasGenerationStep = stepTypeRegistry.some((definition) =>
      definition.policy_flags?.includes("generation_record_required"),
    );
    if (
      hasGenerationStep &&
      !input.host_snapshot.host_capabilities?.includes("generation_ticket_v1")
    ) {
      addFatal(findings, {
        rule_id: "WF-MAN-112",
        message: "Generation steps require generation_ticket_v1 from the Host Gateway.",
        path: "host_capabilities",
        remediation: "Keep generation capabilities disabled until the Host Gateway issues auditable tickets.",
      });
    }

    const federatedManifest = manifest as ScenarioManifestV2;
    if (federatedManifest.scenario_contracts !== undefined) {
      let scenarioContractStructureValid = true;
      try {
        assertScenarioManifestV2(federatedManifest);
      } catch (error) {
        scenarioContractStructureValid = false;
        const detail = error instanceof ScenarioManifestValidationError
          ? `${error.code} at ${error.path}`
          : "unknown scenario-contract validation failure";
        addFatal(findings, {
          rule_id: "WF-MAN-118",
          message: `Scenario contract manifest is invalid: ${detail}`,
          path: "scenario_contracts",
          remediation: "Fix the closed dependency and declaration envelope before module registration.",
        });
      }
      if (scenarioContractStructureValid) {
        validateScenarioContractModule({
          manifest: federatedManifest,
          host_snapshot: input.host_snapshot,
          findings,
        });
      }
    }
  }

  if (!scenarioRecord) {
    addFatal(findings, {
      rule_id: "WF-MAN-001",
      message: "Canonical Scenario record is missing.",
      path: "scenario_key",
      remediation: "Create or publish the Scenario record before activation.",
    });
  } else {
    if (scenarioRecord.status !== manifest.scenario_record.required_status) {
      addFatal(findings, {
        rule_id: "WF-MAN-002",
        message: "Canonical Scenario record status does not match manifest requirement.",
        path: "scenario_record.required_status",
        remediation: "Align the Scenario record status or manifest activation target before registration.",
      });
    }

    if (scenarioRecord.current_manifest_hash && scenarioRecord.current_manifest_hash !== contract_hash) {
      addFatal(findings, {
        rule_id: "WF-MAN-003",
        message: "Canonical Scenario manifest hash does not match the module contract hash.",
        path: "scenario_record.current_manifest_hash",
        remediation: "Publish the new contract hash before pilot or GA activation.",
      });
    }
  }

  for (const capability of manifest.capabilities) {
    for (const entrypoint of capability.entrypoints) {
      for (const step of entrypoint.steps) {
        if (!input.module.handlers[step.handler_key]) {
          addFatal(findings, {
            rule_id: "WF-MAN-010",
            message: `Step handler is missing: ${step.handler_key}`,
            path: `capabilities.${capability.capability_key}.${entrypoint.entrypoint_key}.${step.step_key}`,
            remediation: "Register a TypeScript handler for every manifest step.",
          });
        }
      }
    }
  }

  for (const action of manifest.action_availability.scenario_actions) {
    if (!input.module.actions[action]) {
      addFatal(findings, {
        rule_id: "WF-MAN-011",
        message: `Scenario action handler is missing: ${action}`,
        path: "action_availability.scenario_actions",
        remediation: "Register every scenario-specific action handler.",
      });
    }
  }

  for (const route of manifest.internal_api.routes) {
    if (!["web_domain_workbench", "web_run_workbench", "admin_operator"].includes(route.owner_surface)) {
      addFatal(findings, {
        rule_id: "WF-MAN-020",
        message: "Internal API route owner must be Web/Admin only.",
        path: `internal_api.routes.${route.path}`,
        remediation: "Move the operation to a standard adapter or change the owner surface.",
      });
    }

    if (!input.module.internal_api_handlers[route.handler_key]) {
      addFatal(findings, {
        rule_id: "WF-MAN-021",
        message: `Internal API handler is missing: ${route.handler_key}`,
        path: `internal_api.routes.${route.path}`,
        remediation: "Register every declared internal API handler in the TS registry.",
      });
    }
  }

  for (const contextRefType of manifest.scenario_data.context_ref_types) {
    if (!input.host_snapshot.domain_resolver_keys.includes(contextRefType.resolver_key)) {
      addFatal(findings, {
        rule_id: "WF-MAN-030",
        message: `Domain context resolver is missing: ${contextRefType.resolver_key}`,
        path: "scenario_data.context_ref_types",
        remediation: "Register the resolver in the host domain registry before activation.",
      });
    }
  }

  for (const intervention of manifest.scenario_data.step_interventions) {
    if (intervention.surface !== "web_run_workbench") {
      addFatal(findings, {
        rule_id: "WF-MAN-031",
        message: "Step interventions must be restricted to web_run_workbench.",
        path: "scenario_data.step_interventions",
        remediation: "Move chat/mobile operations to start requirements or standard actions.",
      });
    }
  }

  const declaredHandoffKeys = new Map<string, number>();
  let hasVnextHandoff = false;

  for (const [handoffIndex, handoff] of manifest.handoffs.entries()) {
    const handoffPath = `handoffs.${handoffIndex}`;

    if (!handoff.receipt_required) {
      addFatal(findings, {
        rule_id: "WF-MAN-040",
        message: `Handoff receipt is not required: ${handoff.handoff_type}`,
        path: "handoffs",
        remediation: "Require downstream receipts for every workflow handoff.",
      });
    }

    if (!input.module.policies[handoff.policy_key]) {
      addFatal(findings, {
        rule_id: "WF-MAN-041",
        message: `Handoff policy is missing: ${handoff.policy_key}`,
        path: "handoffs",
        remediation: "Register every handoff policy key in the scenario policy registry.",
      });
    }

    if (!input.host_snapshot.downstream_owners.includes(handoff.downstream_owner)) {
      addFatal(findings, {
        rule_id: "WF-MAN-042",
        message: `Downstream owner is not registered: ${handoff.downstream_owner}`,
        path: "handoffs",
        remediation: "Register the downstream owner in the host handoff registry.",
      });
    }

    const handoffKey = handoff.handoff_key?.trim();
    if (handoffKey) {
      const firstDeclarationIndex = declaredHandoffKeys.get(handoffKey);
      if (firstDeclarationIndex === undefined) {
        declaredHandoffKeys.set(handoffKey, handoffIndex);
      } else {
        addFatal(findings, {
          rule_id: "WF-MAN-047",
          message: `Handoff key is declared more than once: ${handoffKey}`,
          path: `${handoffPath}.handoff_key`,
          remediation: `Use a unique stable handoff_key; first declared at handoffs.${firstDeclarationIndex}.handoff_key.`,
        });
      }
    }

    const materializationMode: unknown = handoff.materialization_mode;

    if (materializationMode === undefined) {
      addWarning(findings, {
        rule_id: "WF-MAN-043",
        message: `Legacy handoff does not opt into vNext materialization: ${handoff.handoff_type}`,
        path: `${handoffPath}.materialization_mode`,
        remediation: "Keep legacy behavior or migrate explicitly with materialization_mode and all vNext requirements.",
      });
      continue;
    }

    if (materializationMode !== "workflow_step_complete_v1") {
      addFatal(findings, {
        rule_id: "WF-MAN-048",
        message: `Unsupported handoff materialization mode: ${String(materializationMode)}`,
        path: `${handoffPath}.materialization_mode`,
        remediation: "Omit materialization_mode for legacy behavior or use workflow_step_complete_v1.",
      });
      continue;
    }

    hasVnextHandoff = true;

    if (!handoffKey) {
      addFatal(findings, {
        rule_id: "WF-MAN-044",
        message: "vNext handoff requires a stable handoff_key.",
        path: `${handoffPath}.handoff_key`,
        remediation: "Declare a non-empty stable handoff_key before enabling vNext materialization.",
      });
    }

    if (!hasDeclaredHandoffSource(handoff)) {
      addFatal(findings, {
        rule_id: "WF-MAN-045",
        message: "vNext handoff requires at least one declared artifact or context source type.",
        path: handoffPath,
        remediation: "Declare a non-empty source_artifact_types or source_context_ref_types entry.",
      });
    }
  }

  if (
    hasVnextHandoff &&
    !input.host_snapshot.host_capabilities?.includes("workflow_handoff_materialization_v1")
  ) {
    addFatal(findings, {
      rule_id: "WF-MAN-046",
      message: "Host does not enable workflow_handoff_materialization_v1.",
      path: "host_capabilities",
      remediation: "Keep vNext activation disabled until the host declares the materialization capability.",
    });
  }

  const registeredEvents = new Set([
    ...(manifest.event_registry.platform_events ?? []),
    ...manifest.event_registry.standard_workflow_events,
    ...manifest.event_registry.scenario_internal_events,
  ]);
  const scenarioInternalEvents = new Set(manifest.event_registry.scenario_internal_events);

  for (const standardEvent of manifest.event_registry.standard_workflow_events) {
    if (!input.host_snapshot.standard_events.includes(standardEvent)) {
      addFatal(findings, {
        rule_id: "WF-MAN-051",
        message: `Standard workflow event is not registered by host: ${standardEvent}`,
        path: "event_registry.standard_workflow_events",
        remediation: "Use a host-supported standard workflow event or register it before activation.",
      });
    }
  }

  for (const platformEvent of manifest.event_registry.platform_events ?? []) {
    if (!input.host_snapshot.platform_events.includes(platformEvent)) {
      addFatal(findings, {
        rule_id: "WF-MAN-052",
        message: `Platform event is not registered by host: ${platformEvent}`,
        path: "event_registry.platform_events",
        remediation: "Use a host-supported platform event or register it before activation.",
      });
    }
  }

  if (
    manifest.event_registry.event_payload_policy.body !== "no_body" ||
    manifest.event_registry.event_payload_policy.pii !== "no_pii" ||
    manifest.event_registry.event_payload_policy.status_in_payload !== false ||
    manifest.event_registry.event_payload_policy.presenter_output_in_payload !== false
  ) {
    addFatal(findings, {
      rule_id: "WF-MAN-050",
      message: "Workflow event payload policy must be refs-only and bodyless.",
      path: "event_registry.event_payload_policy",
      remediation: "Set body=no_body, pii=no_pii, and remove status/presenter output from payloads.",
    });
  }

  for (const outboxEvent of manifest.governance.outbox_events) {
    if (!registeredEvents.has(outboxEvent)) {
      addFatal(findings, {
        rule_id: "WF-MAN-060",
        message: `Outbox event is not registered: ${outboxEvent}`,
        path: "governance.outbox_events",
        remediation: "Add every outbox event to the event registry.",
      });
    }

    if (!manifest.event_registry.producers[outboxEvent]) {
      addFatal(findings, {
        rule_id: "WF-MAN-061",
        message: `Outbox event producer is missing: ${outboxEvent}`,
        path: "event_registry.producers",
        remediation: "Declare the canonical producer for every outbox event.",
      });
    }
  }

  for (const [consumer, declaration] of Object.entries(manifest.event_registry.consumers)) {
    for (const allowedEvent of declaration.allowed_events) {
      if (scenarioInternalEvents.has(allowedEvent)) {
        addFatal(findings, {
          rule_id: "WF-MAN-062",
          message: `Shared consumer depends on scenario internal event: ${consumer}`,
          path: `event_registry.consumers.${consumer}`,
          remediation: "Route shared consumers to platform or standard workflow events only.",
        });
      }

      if (!allowedEvent.endsWith(".*") && !registeredEvents.has(allowedEvent)) {
        addFatal(findings, {
          rule_id: "WF-MAN-063",
          message: `Consumer allowed event is not registered: ${allowedEvent}`,
          path: `event_registry.consumers.${consumer}`,
          remediation: "Register the event or remove it from the consumer allow-list.",
        });
      }
    }
  }

  if (manifest.governance.projection_review_required && input.activation_target !== "dev") {
    const hasProjectionReview = input.host_snapshot.projection_reviews.includes(manifest.scenario_key);
    if (!hasProjectionReview) {
      addFatal(findings, {
        rule_id: "WF-MAN-070",
        message: "Projection review is required before pilot or GA activation.",
        path: "governance.projection_review_required",
        remediation: "Add a projection review record before activating this scenario.",
      });
    }
  }

  if (manifest.verification.deterministic_tests.length === 0 || !manifest.verification.journey_harness) {
    addFatal(findings, {
      rule_id: "WF-MAN-080",
      message: "Deterministic tests and a journey harness are required.",
      path: "verification",
      remediation: "Add at least one deterministic test and one journey harness before activation.",
    });
  }

  for (const requirement of manifest.scenario_data.run_start_requirements) {
    for (const surface of requirement.surfaces) {
      if (!input.host_snapshot.allowed_surfaces.includes(surface)) {
        addFatal(findings, {
          rule_id: "WF-MAN-090",
          message: `Run start requirement references unsupported surface: ${surface}`,
          path: "scenario_data.run_start_requirements",
          remediation: "Use a host-supported standard surface.",
        });
      }
    }
  }

  for (const surface of Object.keys(manifest.surface_mapping)) {
    if (!input.host_snapshot.allowed_surfaces.includes(surface)) {
      addFatal(findings, {
        rule_id: "WF-MAN-091",
        message: `Surface mapping references unsupported surface: ${surface}`,
        path: "surface_mapping",
        remediation: "Use a host-supported standard surface.",
      });
    }
  }

  const surfaceMapping = manifest.surface_mapping;
  if (surfaceMapping.chat_workflow_control && !input.module.adapters.chat_workflow_control) {
    addFatal(findings, {
      rule_id: "WF-MAN-092",
      message: "Chat workflow control adapter is missing.",
      path: "surface_mapping.chat_workflow_control",
      remediation: "Register the chat workflow control adapter.",
    });
  }
  if (surfaceMapping.web_run_workbench && !input.module.adapters.web_run_workbench) {
    addFatal(findings, {
      rule_id: "WF-MAN-093",
      message: "Web run workbench adapter is missing.",
      path: "surface_mapping.web_run_workbench",
      remediation: "Register the web run workbench adapter.",
    });
  }
  if (surfaceMapping.mobile_dashboard && !input.module.adapters.mobile_dashboard) {
    addFatal(findings, {
      rule_id: "WF-MAN-094",
      message: "Mobile dashboard adapter is missing.",
      path: "surface_mapping.mobile_dashboard",
      remediation: "Register the mobile dashboard adapter.",
    });
  }
  if (surfaceMapping.admin_operator && !input.module.adapters.admin_operator) {
    addFatal(findings, {
      rule_id: "WF-MAN-095",
      message: "Admin operator adapter is missing.",
      path: "surface_mapping.admin_operator",
      remediation: "Register the admin operator adapter.",
    });
  }

  return {
    scenario_key: manifest.scenario_key,
    contract_hash,
    activation_target: input.activation_target,
    passed: findings.every((finding) => finding.severity !== "fatal"),
    findings,
  };
}
