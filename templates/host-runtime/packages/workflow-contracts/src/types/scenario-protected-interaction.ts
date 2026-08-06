export const scenarioProtectedMediaTypeV1 =
  "text/plain; charset=utf-8" as const;
export const scenarioProtectedNormalizationV1 =
  "trim_outer_whitespace_and_crlf_to_lf_v1" as const;

export const scenarioProtectedMinimumCharactersV1 = 1;
export const scenarioProtectedMaximumCharactersV1 = 2000;
export const scenarioProtectedMaximumPlainTextBytesV1 = 8 * 1024;
export const scenarioProtectedMaximumCarrierBytesV1 = 12 * 1024;

export const scenarioProtectedCarrierScopesV1 = [
  "prepare_input",
  "read_output",
] as const;

export type ScenarioProtectedCarrierScopeV1 =
  (typeof scenarioProtectedCarrierScopesV1)[number];

export type ScenarioProtectedInteractionContractV1 = {
  protected_interaction_contract_version: 1;
  scenario_key: string;
  action_key: string;
  protected_field_key: string;
  content_kind: string;
  prepare_operation_key: "prepare_domain_action";
  read_operation_key: "read_protected_detail";
  content_profile: {
    media_type: typeof scenarioProtectedMediaTypeV1;
    normalization: typeof scenarioProtectedNormalizationV1;
    min_characters: 1;
    max_characters: 2000;
    attachments: "none";
  };
};

export type ScenarioProtectedContentRefV1 = string;

export type ScenarioProtectedPlainTextCarrierV1 = {
  protected_carrier_version: 1;
  protected_field_key: string;
  media_type: typeof scenarioProtectedMediaTypeV1;
  plain_text: string;
  attachment_refs: [];
};

export type ScenarioProtectedCarrierBindingV1 = {
  carrier_binding_version: 1;
  carrier_scope: ScenarioProtectedCarrierScopeV1;
  protected_field_key: string;
  keyed_binding_hash: string;
};

export type ScenarioProtectedCarrierBindingVerificationV1 = {
  carrier_scope: ScenarioProtectedCarrierScopeV1;
  protected_field_key: string;
  verified_keyed_binding_hash: string;
};
