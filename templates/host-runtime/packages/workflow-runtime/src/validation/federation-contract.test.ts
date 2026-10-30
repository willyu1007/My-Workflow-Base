import {
assertScenarioCommandEnvelopeV1
} from "@host/workflow-contracts";
import { describe,expect,it } from "vitest";

const ref = (object_type: string, object_id: string) => ({
  schema_version: 1,
  namespace: "my_chat",
  object_type,
  object_id,
});
const release = {
  scenario_key: "example",
  release_id: "example-1.0.0",
  contract_version: "1.0.0",
  base_contract_version: "1.0.0",
  host_sdk_version: "1.0.0",
  source_hash: "a".repeat(64),
};
const command = {
  envelope_version: 1,
  command_id: "command-1",
  command_type: "example.execute",
  command_schema_version: 1,
  idempotency_key: "run-1:step-1:attempt-1",
  scenario_release: release,
  workspace_ref: ref("workspace", "workspace-1"),
  workflow_run_ref: ref("workflow_run", "run-1"),
  workflow_step_ref: ref("workflow_step", "step-1"),
  actor: { actor_ref: ref("actor", "actor-1") },
  purpose: "scenario_execution",
  expected_versions: {},
  context_refs: [],
  correlation_id: "correlation-1",
};

describe("federation runtime validators", () => {
  it("BA-06 一份合法 refs-only command 可以通过协议边界", () => { expect(() => assertScenarioCommandEnvelopeV1(command)).not.toThrow(); });

  it("BA-07 嵌套 ref 夹带 private_body 时被拒绝", () => { expect(() => assertScenarioCommandEnvelopeV1({...command, context_refs:[{...ref("child","child-1"),private_body:"forbidden"}]})).toThrow(/unknown fields/u); });
});
