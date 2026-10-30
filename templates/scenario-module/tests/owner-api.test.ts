import type { CanonicalRef,ScenarioCommandEnvelopeV1,ScenarioEventEnvelopeV1 } from "@host/workflow-contracts";
import { describe,expect,it } from "vitest";
import { ExampleOwnerApi } from "../src/owner-api.js";
import type { ExampleScenarioRepositories,ScenarioCommandExecutionRecord } from "../src/repositories.js";

const ref = (namespace: string, object_type: string, object_id: string): CanonicalRef => ({
  schema_version: 1,
  namespace,
  object_type,
  object_id,
  version: 1,
});

function command(stepId = "step-1"): ScenarioCommandEnvelopeV1 {
  return {
    envelope_version: 1,
    command_id: "command-1",
    command_type: "example.prepare",
    command_schema_version: 1,
    idempotency_key: "run-1:step-1:attempt-1",
    scenario_release: {
      scenario_key: "example",
      release_id: "example-v1",
      contract_version: "1.0.0",
      base_contract_version: "1.0.0",
      host_sdk_version: "1.0.0",
      source_hash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    },
    workspace_ref: ref("my_chat", "workspace", "workspace-1"),
    workflow_run_ref: ref("my_chat", "workflow_run", "run-1"),
    workflow_step_ref: ref("my_chat", "workflow_step", stepId),
    actor: { actor_ref: ref("my_chat", "actor", "actor-1") },
    purpose: "scenario_execution",
    expected_versions: { "example:record:record-1": 1 },
    context_refs: [ref("example", "record", "record-1")],
    correlation_id: "correlation-1",
  };
}

function setup() {
  const executions: ScenarioCommandExecutionRecord[] = [];
  const events: ScenarioEventEnvelopeV1[] = [];
  let domainWrites = 0;
  const repositories: ExampleScenarioRepositories = {
    transaction: async (operation) => operation({
      command_executions: {
        findByIdempotencyKey: async (scenarioKey, idempotencyKey) =>
          scenarioKey === "example"
            ? executions.find((record) => record.idempotency_key === idempotencyKey) ?? null
            : null,
        insert: async (record) => { executions.push(record); },
      },
      integration_outbox: {
        insert: async (draft) => { events.push(draft.event); },
      },
      example_records: {
        applyCommand: async () => {
          domainWrites += 1;
          return [ref("example", "record", "record-1")];
        },
      },
    }),
  };
  const api = new ExampleOwnerApi(
    repositories,
    { authorize: async () => ({ allowed: true, reason_code: "scenario_grant_active" }) },
    () => new Date("2026-07-20T00:00:00.000Z"),
  );
  return { api, executions, events, domainWrites: () => domainWrites };
}

describe("federated owner API", () => {

  it("BA-29 starter Owner API 重放不重复 domain write 或 outbox", async () => {
    const { api, executions, events, domainWrites } = setup();
    await api.execute(command());
    await expect(api.execute(command())).resolves.toMatchObject({ status: "already_applied" });
    expect(executions).toHaveLength(1);
    expect(events).toHaveLength(1);
    expect(domainWrites()).toBe(1);
  });
});
