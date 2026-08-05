import type {
  ScenarioDomainActionClaimedStepAssertionV1,
  ScenarioDomainActionContractV1,
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
