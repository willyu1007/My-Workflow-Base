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

export type PrepareScenarioProtectedInteractionInputV1 = {
  protected_prepare_version: 1;
  action_prepare: PrepareScenarioDomainActionInputV1;
  carrier_binding: ScenarioProtectedCarrierBindingV1 & {
    carrier_scope: "prepare_input";
  };
};

export type ScenarioPreparedProtectedContentControlV1 = {
  protected_content_control_version: 1;
  state: "prepared";
  protected_content_ref: ScenarioProtectedContentRefV1;
  protected_content_version: string;
  content_kind: string;
  keyed_integrity_hash: string;
  issued_at: string;
  expires_at: string;
};

export type PrepareScenarioProtectedInteractionResultV1 =
  | {
      protected_prepare_result_version: 1;
      status: "prepared";
      action_result: Extract<
        PrepareScenarioDomainActionResultV1,
        { status: "prepared" }
      >;
      prepared_content: ScenarioPreparedProtectedContentControlV1;
    }
  | {
      protected_prepare_result_version: 1;
      status: "context_changed";
      action_result: Extract<
        PrepareScenarioDomainActionResultV1,
        { status: "context_changed" }
      >;
    }
  | {
      protected_prepare_result_version: 1;
      status: "unavailable";
      action_result: Extract<
        PrepareScenarioDomainActionResultV1,
        { status: "unavailable" }
      >;
    };

export type ScenarioPreparedProtectedContentVerificationV1 = {
  protected_content_ref: ScenarioProtectedContentRefV1;
  protected_content_version: string;
  protected_field_key: string;
  content_kind: string;
  verified_keyed_integrity_hash: string;
  issued_at: string;
  expires_at: string;
};

export type ScenarioCommittedProtectedContentControlV1 = {
  protected_content_control_version: 1;
  state: "committed";
  protected_content_ref: ScenarioProtectedContentRefV1;
  prepared_content_version: string;
  committed_content_version: string;
  content_kind: string;
  keyed_integrity_hash: string;
  committed_at: string;
};

export type ScenarioProtectedContentCommitVerificationV1 = {
  scenario_key: string;
  action_key: string;
  canonical_payload_hash: string;
  protected_content_ref: ScenarioProtectedContentRefV1;
  prepared_content_version: string;
  committed_content_version: string;
  content_kind: string;
  verified_keyed_integrity_hash: string;
  committed_at: string;
};
import type {
  PrepareScenarioDomainActionInputV1,
  PrepareScenarioDomainActionResultV1,
} from "./scenario-domain-action.js";
