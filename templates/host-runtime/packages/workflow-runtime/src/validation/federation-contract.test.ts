import { describe, expect, it } from "vitest";
import {
  assertScenarioCommandEnvelopeV1,
  assertScenarioCommandReceiptV1,
  assertScenarioEventEnvelopeV1,
} from "@host/workflow-contracts";

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
  it("accepts refs-only command, receipt, and event contracts", () => {
    expect(() => assertScenarioCommandEnvelopeV1(command)).not.toThrow();
    expect(() => assertScenarioCommandReceiptV1({
      receipt_version: 1,
      command_id: command.command_id,
      idempotency_key: command.idempotency_key,
      workflow_step_ref: command.workflow_step_ref,
      status: "applied",
      owner_execution_ref: { ...ref("command_execution", "execution-1"), namespace: "example" },
      result_refs: [],
      generation_record_refs: [],
      owner_version: 1,
      committed_at: "2026-07-20T00:00:00.000Z",
    })).not.toThrow();
    expect(() => assertScenarioEventEnvelopeV1({
      envelope_version: 1,
      event_id: "event-1",
      event_type: "example.completed",
      event_schema_version: 1,
      scenario_release: release,
      owner_event_ref: { ...ref("owner_event", "event-1"), namespace: "example" },
      subject_refs: [],
      purpose: command.purpose,
      correlation_id: command.correlation_id,
      occurred_at: "2026-07-20T00:00:00.000Z",
    })).not.toThrow();
  });

  it("fails closed on nested body fields and malformed refs", () => {
    expect(() => assertScenarioCommandEnvelopeV1({
      ...command,
      context_refs: [{ ...ref("child", "child-1"), private_body: "forbidden" }],
    })).toThrow(/unknown fields/u);
    expect(() => assertScenarioCommandEnvelopeV1({
      ...command,
      scenario_release: { ...release, unpinned_revision: "HEAD" },
    })).toThrow(/unknown fields/u);
    expect(() => assertScenarioCommandEnvelopeV1({
      ...command,
      workspace_ref: { ...command.workspace_ref, namespace: "example" },
    })).toThrow(/must be my_chat\/workspace/u);
    expect(() => assertScenarioCommandEnvelopeV1({
      ...command,
      actor: { actor_ref: { ...command.actor.actor_ref, object_type: "user" } },
    })).toThrow(/must be my_chat\/actor/u);
    expect(() => assertScenarioCommandReceiptV1({
      receipt_version: 1,
      command_id: command.command_id,
      idempotency_key: command.idempotency_key,
      workflow_step_ref: command.workflow_step_ref,
      status: "rejected",
      owner_execution_ref: { ...ref("command_execution", "execution-1"), namespace: "example" },
      result_refs: [],
      generation_record_refs: [],
      owner_version: 1,
      committed_at: "2026-07-20T00:00:00.000Z",
      reason_code: "Child Zhang San needs private follow-up",
    })).toThrow(/safe machine token/u);
  });
});
