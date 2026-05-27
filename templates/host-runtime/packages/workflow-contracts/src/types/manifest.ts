import type { EventRegistryManifest } from "./events.js";
import type { WorkflowActivationTarget, WorkflowExposureLevel, WorkflowScenarioStatus, WorkflowSurface } from "./identity.js";

export type ManifestStep = {
  step_key: string;
  step_type: string;
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
  enablement_policy: string;
  entrypoints: ManifestEntrypoint[];
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
  launch_phase: WorkflowActivationTarget;
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
  handoffs: Array<{
    handoff_type: string;
    source_artifact_types: string[];
    requested_purposes: string[];
    downstream_owner: string;
    policy_key: string;
    receipt_required: boolean;
  }>;
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
