import type { CanonicalRef } from "./identity.js";
import type { ScenarioHandoffRequestSnapshot } from "./handoff.js";
import type {
  ScenarioActionTargetRefV1,
  ScenarioSafeReasonV1,
  ScenarioSafeTextV1,
} from "./scenario-presentation.js";

export const scenarioDomainActionDriversV1 = [
  "scenario_direct_empty_v1",
  "workflow_claimed_step_v1",
] as const;

export type ScenarioDomainActionDriverV1 =
  (typeof scenarioDomainActionDriversV1)[number];

export const scenarioDomainActionConfirmationClassesV1 = [
  "explicit",
  "strong_authorization",
] as const;

export type ScenarioDomainActionConfirmationClassV1 =
  (typeof scenarioDomainActionConfirmationClassesV1)[number];

export type ScenarioDomainActionContractV1 = {
  action_contract_version: 1;
  scenario_key: string;
  action_key: string;
  input_schema_key: string;
  input_schema_version: number;
  target_ref_class: string;
  confirmation_class: ScenarioDomainActionConfirmationClassV1;
  entitled_ingress_keys: string[];
  handler_key: string;
  command_contract: {
    command_key: string;
    command_contract_version: number;
  };
  driver: ScenarioDomainActionDriverV1;
};

export type ScenarioDomainActionWorkflowStepRefV1 = {
  schema_version: 1;
  namespace: "my_chat";
  object_type: "workflow_step";
  object_id: string;
};

export type ScenarioDomainActionClaimedStepAssertionV1 = {
  step_assertion_version: 1;
  workflow_step_ref: ScenarioDomainActionWorkflowStepRefV1;
  workspace_ref: CanonicalRef;
  principal_provenance_hash: string;
  scenario_key: string;
  action_key: string;
  handler_key: string;
  action_contract_hash: string;
  driver: "workflow_claimed_step_v1";
  client_mutation_id: string;
  request_correlation_hash: string;
};

export type PrepareScenarioDomainActionInputV1 = {
  prepare_version: 1;
  action_key: string;
  target_ref: ScenarioActionTargetRefV1;
  expected_version?: string;
  action_input: Record<string, unknown>;
};

export type ScenarioDomainActionConfirmationPromptV1 = {
  confirmation_class: ScenarioDomainActionConfirmationClassV1;
  prompt: ScenarioSafeTextV1;
};

export type PrepareScenarioDomainActionResultV1 =
  | {
      status: "prepared";
      submit_token: string;
      confirmation: ScenarioDomainActionConfirmationPromptV1;
      issued_at: string;
      expires_at: string;
    }
  | { status: "context_changed"; safe_reason: ScenarioSafeReasonV1 }
  | { status: "unavailable"; safe_reason: ScenarioSafeReasonV1 };

export type ScenarioDomainActionSubmitEchoV1 = {
  submit_version: 1;
  submit_token: string;
  confirmation: "confirmed";
  client_mutation_id: string;
};

export type ScenarioAuthenticationAssuranceEvidenceV1 = {
  assurance_evidence_version: 1;
  assurance_class: string;
  principal_binding_hash: string;
  ceremony_evidence_hash: string;
  verified_at: string;
  expires_at: string;
};

export type SubmitScenarioDomainActionInputV1 = {
  submit_request_version: 1;
  client_echo: ScenarioDomainActionSubmitEchoV1;
  authentication_assurance?: ScenarioAuthenticationAssuranceEvidenceV1;
};

export type ScenarioDomainActionEffectIdentityInputV1 =
  | {
      effect_identity_version: 1;
      driver: "scenario_direct_empty_v1";
      workspace_ref: CanonicalRef;
      scenario_key: string;
      action_key: string;
      submit_context_ref: CanonicalRef;
    }
  | {
      effect_identity_version: 1;
      driver: "workflow_claimed_step_v1";
      workspace_ref: CanonicalRef;
      scenario_key: string;
      action_key: string;
      original_workflow_step_ref: ScenarioDomainActionWorkflowStepRefV1;
    };

export type ScenarioDomainActionExecutionBindingV1 = {
  execution_binding_version: 1;
  effect_identity: ScenarioDomainActionEffectIdentityInputV1;
  canonical_payload_hash: string;
};

export type ScenarioDomainActionBusinessOutcomeV1 =
  | "applied"
  | "already_satisfied";

export type ScenarioDomainActionExecutionDispositionV1 =
  | "executed"
  | "replayed";

export type ScenarioDomainActionExecutionResultV1 =
  | {
      status: "committed";
      disposition: ScenarioDomainActionExecutionDispositionV1;
      business_outcome: ScenarioDomainActionBusinessOutcomeV1;
      execution_ref: CanonicalRef;
      output_refs: CanonicalRef[];
      handoff_request_snapshots: ScenarioHandoffRequestSnapshot[];
    }
  | {
      status: "not_committed";
      decision: "invalid_request" | "request_conflict" | "rate_limited";
      safe_reason: ScenarioSafeReasonV1;
    }
  | { status: "outcome_unknown"; safe_reason: ScenarioSafeReasonV1 };

export type ScenarioDomainActionCurrentResultV1 =
  | { state: "changed" }
  | { state: "already_current" }
  | {
      state: "processed_but_unavailable";
      safe_reason: ScenarioSafeReasonV1;
    };

export type SubmitScenarioDomainActionResultV1 =
  | { status: "accepted" }
  | {
      status: "completed";
      current_result: ScenarioDomainActionCurrentResultV1;
    }
  | { status: "context_changed"; safe_reason: ScenarioSafeReasonV1 }
  | { status: "unavailable"; safe_reason: ScenarioSafeReasonV1 };
