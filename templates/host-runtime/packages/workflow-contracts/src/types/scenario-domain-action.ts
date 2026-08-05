import type { CanonicalRef } from "./identity.js";

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
