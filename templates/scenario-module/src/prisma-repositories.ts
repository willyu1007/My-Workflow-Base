import { Prisma, PrismaClient } from "@prisma/client";
import {
  assertCanonicalRef,
  assertScenarioEventEnvelopeV1,
  type CanonicalRef,
  type ScenarioCommandEnvelopeV1,
  type ScenarioCommandReceiptV1,
  type ScenarioEventEnvelopeV1,
} from "@host/workflow-contracts";
import type {
  ExampleOwnerTransaction,
  ExampleScenarioRepositories,
  ScenarioCommandExecutionRecord,
} from "./repositories.js";

const asInputJson = (value: unknown): Prisma.InputJsonValue =>
  value as Prisma.InputJsonValue;

const asStored = <T>(value: Prisma.JsonValue): T => value as T;

const stableJson = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "undefined";
};

const toExecutionRecord = (
  row: Prisma.ScenarioCommandExecutionGetPayload<Record<string, never>>,
): ScenarioCommandExecutionRecord => ({
  scenario_key: row.scenarioKey,
  command_id: row.commandId,
  idempotency_key: row.idempotencyKey,
  command_envelope: asStored<ScenarioCommandEnvelopeV1>(row.commandEnvelope),
  workflow_step_ref: asStored<CanonicalRef>(row.workflowStepRef),
  command_identity_hash: row.commandIdentityHash,
  receipt: asStored<ScenarioCommandReceiptV1>(row.receipt),
});

function transactionAdapter(
  transaction: Prisma.TransactionClient,
): ExampleOwnerTransaction {
  return {
    command_executions: {
      findByIdempotencyKey: async (scenarioKey, idempotencyKey) => {
        const row = await transaction.scenarioCommandExecution.findUnique({
          where: {
            scenarioKey_idempotencyKey: { scenarioKey, idempotencyKey },
          },
        });
        return row ? toExecutionRecord(row) : null;
      },
      insert: async (record) => {
        await transaction.scenarioCommandExecution.create({
          data: {
            scenarioKey: record.scenario_key,
            commandId: record.command_id,
            idempotencyKey: record.idempotency_key,
            commandEnvelope: asInputJson(record.command_envelope),
            workflowRunRef: asInputJson(record.command_envelope.workflow_run_ref),
            workflowStepRef: asInputJson(record.workflow_step_ref),
            commandIdentityHash: record.command_identity_hash,
            status: record.receipt.status,
            receipt: asInputJson(record.receipt),
          },
        });
      },
    },
    integration_outbox: {
      insert: async ({ event }) => {
        if (!event.actor_ref) throw new Error("event_actor_ref_required");
        await transaction.ownerIntegrationOutbox.create({
          data: {
            scenarioKey: event.scenario_release.scenario_key,
            eventId: event.event_id,
            eventType: event.event_type,
            eventSchemaVersion: event.event_schema_version,
            scenarioRelease: asInputJson(event.scenario_release),
            ownerEventRef: asInputJson(event.owner_event_ref),
            subjectRefs: asInputJson(event.subject_refs),
            actorRef: asInputJson(event.actor_ref),
            purpose: event.purpose,
            correlationId: event.correlation_id,
            traceId: event.trace_id,
            occurredAt: new Date(event.occurred_at),
          },
        });
      },
    },
    example_records: {
      applyCommand: async (input) => {
        const target = input.context_refs.find(
          (ref) =>
            ref.namespace === "example" && ref.object_type === "record",
        );
        if (!target) throw new Error("example_record_ref_required");
        const expectedKey = `${target.namespace}:${target.object_type}:${target.object_id}`;
        const expectedVersion = input.expected_versions[expectedKey];
        const existing = await transaction.exampleRecord.findUnique({
          where: { id: target.object_id },
        });

        if (!existing) {
          if (expectedVersion !== undefined && expectedVersion !== 0) {
            throw new Error("expected_version_conflict");
          }
          try {
            const created = await transaction.exampleRecord.create({
              data: {
                id: target.object_id,
                version: 1,
                state: asInputJson({ last_command_id: input.command_id }),
              },
            });
            return [
              {
                schema_version: 1,
                namespace: "example",
                object_type: "record",
                object_id: created.id,
                version: created.version,
              },
            ];
          } catch (error) {
            if (
              error instanceof Prisma.PrismaClientKnownRequestError &&
              error.code === "P2002"
            ) {
              throw new Error("expected_version_conflict");
            }
            throw error;
          }
        }

        if (expectedVersion !== existing.version) {
          throw new Error("expected_version_conflict");
        }
        const updated = await transaction.exampleRecord.updateMany({
          where: { id: existing.id, version: expectedVersion },
          data: {
            version: { increment: 1 },
            state: asInputJson({ last_command_id: input.command_id }),
          },
        });
        if (updated.count !== 1) throw new Error("expected_version_conflict");
        return [
          {
            schema_version: 1,
            namespace: "example",
            object_type: "record",
            object_id: existing.id,
            version: existing.version + 1,
          },
        ];
      },
    },
  };
}

export class PrismaExampleScenarioRepositories
  implements ExampleScenarioRepositories
{
  constructor(private readonly client: PrismaClient) {}

  transaction<T>(
    operation: (transaction: ExampleOwnerTransaction) => Promise<T>,
  ): Promise<T> {
    return this.client.$transaction((transaction) =>
      operation(transactionAdapter(transaction)),
    );
  }
}

export type OwnerInboxDisposition = "accepted" | "duplicate";

type StoredInboxIdentity = {
  scenarioKey: string;
  hostEventType: string;
  eventSchemaVersion: number;
  scenarioRelease: Prisma.JsonValue;
  ownerEventRef: Prisma.JsonValue;
  subjectRefs: Prisma.JsonValue;
  actorRef: Prisma.JsonValue;
  ownerTargetRef: Prisma.JsonValue;
  purpose: string;
  correlationId: string;
  traceId: string | null;
  occurredAt: Date;
};

function sameInboxIdentity(
  stored: StoredInboxIdentity,
  event: ScenarioEventEnvelopeV1,
  ownerTargetRef: CanonicalRef,
): boolean {
  return (
    stored.scenarioKey === event.scenario_release.scenario_key &&
    stored.hostEventType === event.event_type &&
    stored.eventSchemaVersion === event.event_schema_version &&
    stableJson(stored.scenarioRelease) === stableJson(event.scenario_release) &&
    stableJson(stored.ownerEventRef) === stableJson(event.owner_event_ref) &&
    stableJson(stored.subjectRefs) === stableJson(event.subject_refs) &&
    stableJson(stored.actorRef) === stableJson(event.actor_ref) &&
    stableJson(stored.ownerTargetRef) === stableJson(ownerTargetRef) &&
    stored.purpose === event.purpose &&
    stored.correlationId === event.correlation_id &&
    stored.traceId === (event.trace_id ?? null) &&
    stored.occurredAt.getTime() === Date.parse(event.occurred_at)
  );
}

export class PrismaOwnerIntegrationInbox {
  constructor(private readonly client: PrismaClient) {}

  async receive(
    eventInput: unknown,
    ownerTargetInput: unknown,
  ): Promise<OwnerInboxDisposition> {
    assertScenarioEventEnvelopeV1(eventInput);
    assertCanonicalRef(ownerTargetInput, "owner_target_ref");
    const event: ScenarioEventEnvelopeV1 = eventInput;
    const ownerTargetRef: CanonicalRef = ownerTargetInput;
    if (!event.actor_ref) throw new Error("event_actor_ref_required");
    if (event.scenario_release.scenario_key !== "example") {
      throw new Error("scenario_key_mismatch");
    }

    const findExisting = () =>
      this.client.ownerIntegrationInbox.findUnique({
        where: { hostEventId: event.event_id },
        select: {
          scenarioKey: true,
          hostEventType: true,
          eventSchemaVersion: true,
          scenarioRelease: true,
          ownerEventRef: true,
          subjectRefs: true,
          actorRef: true,
          ownerTargetRef: true,
          purpose: true,
          correlationId: true,
          traceId: true,
          occurredAt: true,
        },
      });
    const existing = await findExisting();
    if (existing) {
      if (sameInboxIdentity(existing, event, ownerTargetRef)) return "duplicate";
      throw new Error("event_identity_conflict");
    }

    try {
      await this.client.ownerIntegrationInbox.create({
        data: {
          scenarioKey: event.scenario_release.scenario_key,
          hostEventId: event.event_id,
          hostEventType: event.event_type,
          eventSchemaVersion: event.event_schema_version,
          scenarioRelease: asInputJson(event.scenario_release),
          ownerEventRef: asInputJson(event.owner_event_ref),
          subjectRefs: asInputJson(event.subject_refs),
          actorRef: asInputJson(event.actor_ref),
          ownerTargetRef: asInputJson(ownerTargetRef),
          purpose: event.purpose,
          correlationId: event.correlation_id,
          traceId: event.trace_id,
          occurredAt: new Date(event.occurred_at),
        },
      });
      return "accepted";
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const raced = await findExisting();
        if (raced && sameInboxIdentity(raced, event, ownerTargetRef)) {
          return "duplicate";
        }
        throw new Error("event_identity_conflict");
      }
      throw error;
    }
  }

  async markProcessed(hostEventId: string, processedAt = new Date()): Promise<void> {
    await this.client.ownerIntegrationInbox.update({
      where: { hostEventId },
      data: { processedAt, failureCode: null },
    });
  }
}
