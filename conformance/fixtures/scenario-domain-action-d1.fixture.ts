import type {
  PrepareScenarioDomainActionInputV1,
  PrepareScenarioDomainActionResultV1,
  ScenarioDomainActionClaimedStepAssertionV1,
  ScenarioDomainActionContractV1,
  SubmitScenarioDomainActionInputV1,
} from "@host/workflow-contracts";

export const scenarioDomainActionContractFixture = {
  action_contract_version: 1,
  scenario_key: "example-care",
  action_key: "example.record",
  input_schema_key: "example.record.input",
  input_schema_version: 1,
  target_ref_class: "example.record.target",
  confirmation_class: "explicit",
  entitled_ingress_keys: ["example.chat", "example.web"],
  handler_key: "example.record.handler",
  command_contract: {
    command_key: "example.record.command",
    command_contract_version: 1,
  },
  driver: "workflow_claimed_step_v1",
} satisfies ScenarioDomainActionContractV1;

export const scenarioDomainActionClaimedStepAssertionFixture = {
  step_assertion_version: 1,
  workflow_step_ref: {
    schema_version: 1,
    namespace: "my_chat",
    object_type: "workflow_step",
    object_id: "step_example_01",
  },
  workspace_ref: {
    schema_version: 1,
    namespace: "my_chat",
    object_type: "workspace",
    object_id: "workspace_example_01",
  },
  principal_provenance_hash: "1".repeat(64),
  scenario_key: "example-care",
  action_key: "example.record",
  handler_key: "example.record.handler",
  action_contract_hash: "2".repeat(64),
  driver: "workflow_claimed_step_v1",
  client_mutation_id: "mutation_example_01",
  request_correlation_hash: "3".repeat(64),
} satisfies ScenarioDomainActionClaimedStepAssertionV1;

export const prepareScenarioDomainActionInputFixture = {
  prepare_version: 1,
  action_key: "example.record",
  target_ref: "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
  expected_version: "version-01",
  action_input: { example_value: "neutral" },
} satisfies PrepareScenarioDomainActionInputV1;

export const prepareScenarioDomainActionResultFixture = {
  status: "prepared",
  submit_token: "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
  confirmation: {
    confirmation_class: "explicit",
    prompt: {
      kind: "plain_text",
      value: "Confirm this example action.",
      locale: "en-US",
    },
  },
  issued_at: "2026-08-05T00:00:00.000Z",
  expires_at: "2026-08-05T00:05:00.000Z",
} satisfies PrepareScenarioDomainActionResultV1;

export const submitScenarioDomainActionInputFixture = {
  submit_request_version: 1,
  client_echo: {
    submit_version: 1,
    submit_token: "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
    confirmation: "confirmed",
    client_mutation_id: "mutation_example_01",
  },
} satisfies SubmitScenarioDomainActionInputV1;
