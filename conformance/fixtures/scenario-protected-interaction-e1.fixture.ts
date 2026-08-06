import type {
  ScenarioProtectedCarrierBindingV1,
  ScenarioProtectedInteractionContractV1,
  ScenarioProtectedPlainTextCarrierV1,
} from "@host/workflow-contracts";

export const scenarioProtectedInteractionContractFixture = {
  protected_interaction_contract_version: 1,
  scenario_key: "example-care",
  action_key: "example.record",
  protected_field_key: "example_plain_text",
  content_kind: "example.protected_record",
  prepare_operation_key: "prepare_domain_action",
  read_operation_key: "read_protected_detail",
  content_profile: {
    media_type: "text/plain; charset=utf-8",
    normalization: "trim_outer_whitespace_and_crlf_to_lf_v1",
    min_characters: 1,
    max_characters: 2000,
    attachments: "none",
  },
} satisfies ScenarioProtectedInteractionContractV1;

export const scenarioProtectedPlainTextCarrierFixture = {
  protected_carrier_version: 1,
  protected_field_key: "example_plain_text",
  media_type: "text/plain; charset=utf-8",
  plain_text: "Q7vN9xK2pL4mT8rC6wY3dF5sH1jB0zUe\nG4aD8kP2nS6cV9qR",
  attachment_refs: [],
} satisfies ScenarioProtectedPlainTextCarrierV1;

export const scenarioProtectedPrepareBindingFixture = {
  carrier_binding_version: 1,
  carrier_scope: "prepare_input",
  protected_field_key: "example_plain_text",
  keyed_binding_hash: "a".repeat(64),
} satisfies ScenarioProtectedCarrierBindingV1;

export const scenarioProtectedReadBindingFixture = {
  ...scenarioProtectedPrepareBindingFixture,
  carrier_scope: "read_output",
  keyed_binding_hash: "b".repeat(64),
} satisfies ScenarioProtectedCarrierBindingV1;
