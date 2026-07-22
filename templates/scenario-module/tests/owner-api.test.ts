import { describe, expect, it } from "vitest";
import type { CanonicalRef, ScenarioCommandEnvelopeV1, ScenarioEventEnvelopeV1 } from "@host/workflow-contracts";
import { ExampleOwnerApi } from "../src/owner-api.js";
import type { ExampleScenarioRepositories, ScenarioCommandExecutionRecord } from "../src/repositories.js";

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
        applyCommand: async () => [ref("example", "record", "record-1")],
      },
    }),
  };
  const api = new ExampleOwnerApi(
    repositories,
    { authorize: async () => ({ allowed: true, reason_code: "scenario_grant_active" }) },
    () => new Date("2026-07-20T00:00:00.000Z"),
  );
  return { api, repositories, executions, events };
}

describe("federated owner API", () => {
  it("writes command execution and bodyless integration event through one owner transaction", async () => {
    const { api, executions, events } = setup();
    await expect(api.execute(command())).resolves.toMatchObject({ status: "applied", owner_version: 1 });
    expect(executions).toHaveLength(1);
    expect(events).toHaveLength(1);
    expect(events[0]).not.toHaveProperty("body");
  });

  it("replays the same command identity without duplicating domain or outbox writes", async () => {
    const { api, executions, events } = setup();
    await api.execute(command());
    await expect(api.execute(command())).resolves.toMatchObject({ status: "already_applied" });
    expect(executions).toHaveLength(1);
    expect(events).toHaveLength(1);
  });

  it("rejects reuse of an idempotency key by another workflow step", async () => {
    const { api } = setup();
    await api.execute(command());
    await expect(api.execute(command("step-2"))).rejects.toThrow("idempotency_identity_conflict");
  });

  it("reauthorizes an exact response-loss receipt lookup", async () => {
    const { api, repositories } = setup();
    await api.execute(command());
    const revokedApi = new ExampleOwnerApi(
      repositories,
      { authorize: async () => ({ allowed: false, reason_code: "grant_revoked" }) },
    );
    await expect(revokedApi.getReceipt(command())).rejects.toThrow("scenario_authorization_denied:grant_revoked");
  });

  it.each([
    ["actor", (input: ScenarioCommandEnvelopeV1) => ({ ...input, actor: { actor_ref: ref("my_chat", "actor", "actor-2") } })],
    ["workspace", (input: ScenarioCommandEnvelopeV1) => ({ ...input, workspace_ref: ref("my_chat", "workspace", "workspace-2") })],
    ["purpose", (input: ScenarioCommandEnvelopeV1) => ({ ...input, purpose: "another_purpose" })],
    ["release", (input: ScenarioCommandEnvelopeV1) => ({ ...input, scenario_release: { ...input.scenario_release, release_id: "example-v2" } })],
    ["expected version", (input: ScenarioCommandEnvelopeV1) => ({ ...input, expected_versions: { "example:record:record-1": 2 } })],
  ])("rejects replay when %s changes under the same idempotency key", async (_label, mutate) => {
    const { api } = setup();
    const original = command();
    await api.execute(original);
    await expect(api.execute(mutate(original))).rejects.toThrow("idempotency_identity_conflict");
  });
});
