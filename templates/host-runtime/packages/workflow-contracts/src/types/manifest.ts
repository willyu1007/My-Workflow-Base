import type { EventRegistryManifest } from "./events.js";
import type { WorkflowRuntimeKind, WorkflowStepPolicyFlag, WorkflowStepTypeDefinition } from "./federation.js";
import type { ScenarioLaunchPhase, WorkflowExposureLevel, WorkflowScenarioStatus, WorkflowSurface } from "./identity.js";

export const scenarioCapabilityEnablementPolicies = [
  "requires_workspace_activation",
  "disabled",
] as const;
export type ScenarioCapabilityEnablementPolicy =
  (typeof scenarioCapabilityEnablementPolicies)[number];

export const legacyScenarioCapabilityEnablementPolicies = [
  "admin_enabled",
  "workspace_enabled",
  "workspace_activation_required",
  "teacher_workspace_enabled",
  "always_on",
] as const;
export type LegacyScenarioCapabilityEnablementPolicy =
  (typeof legacyScenarioCapabilityEnablementPolicies)[number];

export const scenarioAdmittedUserClasses = [
  "teacher",
  "curriculum_researcher",
  "subject_expert",
  "expert",
  "researcher",
  "admin",
] as const;
export type ScenarioAdmittedUserClass = (typeof scenarioAdmittedUserClasses)[number];

export type ManifestStep = {
  step_key: string;
  step_type: string;
  runtime_kind?: WorkflowRuntimeKind;
  policy_flags?: WorkflowStepPolicyFlag[];
  order: number;
  handler_key: string;
  retry_policy: "none" | "bounded_exponential" | string;
  timeout_ms?: number;
};

export type ManifestEntrypoint = {
  entrypoint_key: string;
  label: string;
  workflow_version: number;
  workflow_version_id?: string;
  input_schema_version: number;
  output_schema_version: number;
  allowed_step_types: string[];
  steps: ManifestStep[];
};

export type ManifestCapability = {
  capability_key: string;
  label: string;
  description: string;
  enablement_policy:
    | ScenarioCapabilityEnablementPolicy
    | LegacyScenarioCapabilityEnablementPolicy;
  entrypoints: ManifestEntrypoint[];
};

export const scenarioContractCapabilityKeysV1 = [
  "trusted_scenario_invocation_v1",
  "scenario_subject_presentation_v1",
  "scenario_domain_action_execution_v1",
  "scenario_protected_interaction_v1",
] as const;

export type ScenarioContractCapabilityKeyV1 =
  (typeof scenarioContractCapabilityKeysV1)[number];

export const scenarioContractSourceIdentitiesV1 = [
  "platform_child_family_identity_source_v1",
  "scenario_interface_source_v1",
  "scenario_domain_action_source_v1",
  "scenario_protected_interaction_source_v1",
] as const;

export type ScenarioContractSourceIdentityV1 =
  (typeof scenarioContractSourceIdentitiesV1)[number];

export type ScenarioContractSourceDependencyV1 = {
  source_identity: ScenarioContractSourceIdentityV1;
  source_hash: string;
};

export type ScenarioCapabilityDependencyV1 = {
  capability_key: ScenarioContractCapabilityKeyV1;
  requires_capabilities: ScenarioContractCapabilityKeyV1[];
  requires_sources: ScenarioContractSourceIdentityV1[];
};

export type ScenarioTrustedInvocationIngressManifestV1 = {
  ingress_category: "product_surface" | "host_transition" | "workflow_runtime";
  ingress_key: string;
  principal_origins: Array<"interactive_session" | "durable_run_actor">;
};

export type ScenarioTrustedInvocationOperationManifestV1 = {
  endpoint_key: string;
  method: "POST";
  operation_key: string;
  input_schema_key: string;
  input_schema_version: number;
  handler_key: string;
  ingress: ScenarioTrustedInvocationIngressManifestV1[];
};

export type ScenarioTrustedInvocationManifestV1 = {
  trusted_invocation_version: 1;
  invocation_contract: "scenario-private-invocation-v1";
  operations: ScenarioTrustedInvocationOperationManifestV1[];
};

export type ScenarioSubjectContextProviderManifestV1 = {
  provider_key: string;
  provider_version: 1;
  list_operation_key: "list_subject_contexts";
  resolve_operation_key: "resolve_subject_context";
  handler_key: string;
};

export type ScenarioSemanticPresentationManifestV1 = {
  presentation_key: string;
  presentation_version: 1;
  provider_key: string;
  operation_key: "present_subject_context";
  handler_key: string;
  safe_reason_codes: string[];
};

export type ScenarioProductSurfaceManifestV1 = {
  product_surface_key: string;
  presentation_key: string;
  view_modes: Array<"current" | "recent" | "history">;
  route_classes: string[];
  action_offer_policy: "none" | "declared_actions";
  action_keys: string[];
};

export type ScenarioContractManifestV1 = {
  scenario_contracts_version: 1;
  source_dependencies: ScenarioContractSourceDependencyV1[];
  capability_dependencies: ScenarioCapabilityDependencyV1[];
  trusted_invocation: ScenarioTrustedInvocationManifestV1;
  subject_context_providers: ScenarioSubjectContextProviderManifestV1[];
  semantic_presentations: ScenarioSemanticPresentationManifestV1[];
  product_surfaces: ScenarioProductSurfaceManifestV1[];
};

export type HandoffContextRefTypeManifest = {
  namespace: string;
  object_type: string;
};

export type WorkflowHandoffMaterializationMode = "workflow_step_complete_v1";

export type HandoffManifest = {
  handoff_type: string;
  source_artifact_types: string[];
  requested_purposes: string[];
  downstream_owner: string;
  policy_key: string;
  receipt_required: boolean;
  handoff_key?: string;
  source_context_ref_types?: HandoffContextRefTypeManifest[];
  materialization_mode?: WorkflowHandoffMaterializationMode;
};

export type ScenarioManifest = {
  manifest_version: number;
  scenario_key: string;
  scenario_record: {
    display_name: string;
    required_status: WorkflowScenarioStatus;
    owner_team: string;
    policy_version: number;
  };
  owner: string;
  /** Required for manifest_version >= 2. */
  contract?: {
    base_contract_version: string;
    host_sdk_version: string;
    host_abi_range: string;
    source_hash: string;
  };
  /** Required for manifest_version >= 2. */
  step_type_registry?: WorkflowStepTypeDefinition[];
  /** Required for manifest_version >= 2. */
  owner_integration?: {
    command_contract: "scenario-command-envelope-v1";
    event_contract: "scenario-event-envelope-v1";
    receipt_contract: "scenario-command-receipt-v1";
    status_lookup_required: true;
    auth_mode: "service_authenticated";
  };
  launch_phase: ScenarioLaunchPhase;
  allowed_user_classes: string[];
  capabilities: ManifestCapability[];
  scenario_data: {
    context_ref_types: Array<{
      namespace: string;
      object_type: string;
      resolver_key: string;
      owner_scope: "workspace" | "organization" | "platform" | "external";
      canonical_required: boolean;
      scenario_local_allowed: boolean;
      snapshot_required: boolean;
    }>;
    run_start_requirements: Array<{
      requirement_key: string;
      schema_version: number;
      entrypoints: string[];
      surfaces: WorkflowSurface[];
      required: boolean;
    }>;
    step_interventions: Array<{
      intervention_type: string;
      schema_version: number;
      step_keys: string[];
      surface: "web_run_workbench";
      handler_key: string;
    }>;
  };
  artifact_policy: {
    artifact_types: string[];
    exposure_levels: Record<WorkflowExposureLevel, string[]>;
    handoff_eligible: Record<string, string[]>;
  };
  action_availability: {
    shared_actions: string[];
    scenario_actions: string[];
    expected_version_required: boolean;
  };
  handoffs: HandoffManifest[];
  surface_mapping: Record<string, Record<string, unknown>>;
  internal_api: {
    routes: Array<{
      method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
      path: string;
      owner_surface: "web_domain_workbench" | "web_run_workbench" | "admin_operator";
      command_class: "scenario_internal" | "workflow_fact_write";
      writes_workflow_facts: boolean;
      handler_key: string;
    }>;
  };
  event_registry: EventRegistryManifest;
  governance: {
    admin_actions: string[];
    rollback: string;
    projection_review_required: boolean;
    evidence_records: string[];
    outbox_events: string[];
  };
  verification: {
    deterministic_tests: string[];
    journey_harness: string;
  };
};

export type ScenarioManifestV2 = Omit<
  ScenarioManifest,
  "manifest_version" | "contract" | "step_type_registry" | "owner_integration" | "allowed_user_classes" | "capabilities"
> & {
  manifest_version: 2;
  contract: NonNullable<ScenarioManifest["contract"]>;
  step_type_registry: NonNullable<ScenarioManifest["step_type_registry"]>;
  owner_integration: NonNullable<ScenarioManifest["owner_integration"]>;
  allowed_user_classes: ScenarioAdmittedUserClass[];
  capabilities: Array<Omit<ManifestCapability, "enablement_policy"> & {
    enablement_policy: ScenarioCapabilityEnablementPolicy;
  }>;
  scenario_contracts?: ScenarioContractManifestV1;
};
