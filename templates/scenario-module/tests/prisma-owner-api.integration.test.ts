import { PrismaClient } from "@prisma/client";
import {
  type CanonicalRef,
  type ScenarioCommandEnvelopeV1,
  type ScenarioEventEnvelopeV1,
} from "@host/workflow-contracts";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { ExampleOwnerApi } from "../src/owner-api.js";
import {
  PrismaExampleScenarioRepositories,
  PrismaOwnerIntegrationInbox,
} from "../src/prisma-repositories.js";
import type { ExampleScenarioRepositories } from "../src/repositories.js";

const databaseUrl = process.env.STARTER_DATABASE_URL;
const prisma = databaseUrl
  ? new PrismaClient({ datasources: { db: { url: databaseUrl } } })
  : null;

const ref = (
  namespace: string,
  object_type: string,
  object_id: string,
  version = 1,
): CanonicalRef => ({
  schema_version: 1,
  namespace,
  object_type,
  object_id,
  version,
});

function command(
  commandId = "command-1",
  stepId = "step-1",
  expectedVersion?: number,
): ScenarioCommandEnvelopeV1 {
  return {
    envelope_version: 1,
    command_id: commandId,
    command_type: "example.prepare",
    command_schema_version: 1,
    idempotency_key: `run-1:${stepId}:${commandId}`,
    scenario_release: {
      scenario_key: "example",
      release_id: "example-v1",
      contract_version: "1.0.0",
      base_contract_version: "1.0.0",
      host_sdk_version: "1.0.0",
      source_hash:
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    },
    workspace_ref: ref("my_chat", "workspace", "workspace-1"),
    workflow_run_ref: ref("my_chat", "workflow_run", "run-1"),
    workflow_step_ref: ref("my_chat", "workflow_step", stepId),
    actor: { actor_ref: ref("my_chat", "actor", "actor-1") },
    purpose: "scenario_execution",
    expected_versions:
      expectedVersion === undefined
        ? {}
        : { "example:record:record-1": expectedVersion },
    context_refs: [ref("example", "record", "record-1")],
    correlation_id: "correlation-1",
  };
}

function hostEvent(): ScenarioEventEnvelopeV1 {
  return {
    envelope_version: 1,
    event_id: "host-event-1",
    event_type: "workflow.step.completed",
    event_schema_version: 1,
    scenario_release: command().scenario_release,
    owner_event_ref: ref("my_chat", "workflow_step", "step-1"),
    subject_refs: [ref("example", "record", "record-1")],
    purpose: "scenario_execution",
    actor_ref: ref("my_chat", "actor", "actor-1"),
    correlation_id: "correlation-1",
    occurred_at: "2026-07-22T00:00:00.000Z",
  };
}

const integration = databaseUrl ? describe : describe.skip;

integration("Starter Prisma owner journey", () => {
  if (!prisma) return;

  const repositories = new PrismaExampleScenarioRepositories(prisma);
  const api = new ExampleOwnerApi(
    repositories,
    {
      authorize: async () => ({
        allowed: true,
        reason_code: "scenario_grant_active",
      }),
    },
    () => new Date("2026-07-22T00:00:00.000Z"),
  );

  beforeEach(async () => {
    await prisma.ownerIntegrationInbox.deleteMany();
    await prisma.ownerIntegrationOutbox.deleteMany();
    await prisma.scenarioCommandExecution.deleteMany();
    await prisma.exampleRecord.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("commits the domain fact, execution and owner event atomically", async () => {
    await expect(api.execute(command())).resolves.toMatchObject({
      status: "applied",
      result_refs: [
        {
          namespace: "example",
          object_type: "record",
          object_id: "record-1",
          version: 1,
        },
      ],
    });
    await expect(api.execute(command())).resolves.toMatchObject({
      status: "already_applied",
    });

    await expect(prisma.exampleRecord.count()).resolves.toBe(1);
    await expect(prisma.scenarioCommandExecution.count()).resolves.toBe(1);
    await expect(prisma.ownerIntegrationOutbox.count()).resolves.toBe(1);
    const columns = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'OwnerIntegrationOutbox'
      ORDER BY column_name
    `;
    expect(columns.map((column) => column.column_name)).not.toContain("body");
    expect(columns.map((column) => column.column_name)).not.toContain("payload");
  });

  it("rolls every owner write back when outbox insertion fails", async () => {
    const failingRepositories: ExampleScenarioRepositories = {
      transaction: (operation) =>
        repositories.transaction((transaction) =>
          operation({
            ...transaction,
            integration_outbox: {
              insert: async () => {
                throw new Error("forced_outbox_failure");
              },
            },
          }),
        ),
    };
    const failingApi = new ExampleOwnerApi(failingRepositories, {
      authorize: async () => ({
        allowed: true,
        reason_code: "scenario_grant_active",
      }),
    });

    await expect(failingApi.execute(command())).rejects.toThrow(
      "forced_outbox_failure",
    );
    await expect(prisma.exampleRecord.count()).resolves.toBe(0);
    await expect(prisma.scenarioCommandExecution.count()).resolves.toBe(0);
    await expect(prisma.ownerIntegrationOutbox.count()).resolves.toBe(0);
  });

  it("rejects stale domain versions and wrong-Step idempotency reuse", async () => {
    await api.execute(command());
    await expect(api.execute(command("command-2", "step-2", 0))).rejects.toThrow(
      "expected_version_conflict",
    );
    const replay = command();
    replay.workflow_step_ref = ref("my_chat", "workflow_step", "step-2");
    await expect(api.execute(replay)).rejects.toThrow(
      "idempotency_identity_conflict",
    );
  });

  it("allows only one concurrent create for the same expected absent version", async () => {
    const outcomes = await Promise.allSettled([
      api.execute(command("command-create-a", "step-create-a", 0)),
      api.execute(command("command-create-b", "step-create-b", 0)),
    ]);

    expect(outcomes.filter((outcome) => outcome.status === "fulfilled")).toHaveLength(1);
    expect(outcomes.filter((outcome) => outcome.status === "rejected")).toMatchObject([
      { reason: { message: "expected_version_conflict" } },
    ]);
    await expect(prisma.exampleRecord.count()).resolves.toBe(1);
    await expect(prisma.scenarioCommandExecution.count()).resolves.toBe(1);
    await expect(prisma.ownerIntegrationOutbox.count()).resolves.toBe(1);
  });

  it("allows only one concurrent update for the same expected version", async () => {
    await api.execute(command("command-seed", "step-seed", 0));
    const outcomes = await Promise.allSettled([
      api.execute(command("command-update-a", "step-update-a", 1)),
      api.execute(command("command-update-b", "step-update-b", 1)),
    ]);

    expect(outcomes.filter((outcome) => outcome.status === "fulfilled")).toHaveLength(1);
    expect(outcomes.filter((outcome) => outcome.status === "rejected")).toMatchObject([
      { reason: { message: "expected_version_conflict" } },
    ]);
    await expect(
      prisma.exampleRecord.findUniqueOrThrow({ where: { id: "record-1" } }),
    ).resolves.toMatchObject({ version: 2 });
    await expect(prisma.scenarioCommandExecution.count()).resolves.toBe(2);
    await expect(prisma.ownerIntegrationOutbox.count()).resolves.toBe(2);
  });

  it("deduplicates and completes a bodyless Host event inbox record", async () => {
    const inbox = new PrismaOwnerIntegrationInbox(prisma);
    const event = hostEvent();
    const ownerTarget = ref("example", "record", "record-1");

    await expect(inbox.receive(event, ownerTarget)).resolves.toBe("accepted");
    await expect(inbox.receive(event, ownerTarget)).resolves.toBe("duplicate");
    await expect(
      inbox.receive({ ...event, body: "private text" }, ownerTarget),
    ).rejects.toThrow();
    await inbox.markProcessed(event.event_id);

    const stored = await prisma.ownerIntegrationInbox.findUniqueOrThrow({
      where: { hostEventId: event.event_id },
    });
    expect(stored.processedAt).not.toBeNull();
    expect(stored.failureCode).toBeNull();
    await expect(prisma.ownerIntegrationInbox.count()).resolves.toBe(1);
  });

  it("rejects reuse of a Host event id by a different valid identity", async () => {
    const inbox = new PrismaOwnerIntegrationInbox(prisma);
    const event = hostEvent();
    const ownerTarget = ref("example", "record", "record-1");
    await inbox.receive(event, ownerTarget);

    await expect(
      inbox.receive({ ...event, event_type: "workflow.step.failed" }, ownerTarget),
    ).rejects.toThrow("event_identity_conflict");
    await expect(
      inbox.receive(event, ref("example", "record", "record-2")),
    ).rejects.toThrow("event_identity_conflict");
    await expect(prisma.ownerIntegrationInbox.count()).resolves.toBe(1);
  });
});
