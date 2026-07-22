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
        }

        if (expectedVersion !== existing.version) {
          throw new Error("expected_version_conflict");
        }
        const updated = await transaction.exampleRecord.update({
          where: { id: existing.id },
          data: {
            version: { increment: 1 },
            state: asInputJson({ last_command_id: input.command_id }),
          },
        });
        return [
          {
            schema_version: 1,
            namespace: "example",
            object_type: "record",
            object_id: updated.id,
            version: updated.version,
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

    const existing = await this.client.ownerIntegrationInbox.findUnique({
      where: { hostEventId: event.event_id },
      select: { id: true },
    });
    if (existing) return "duplicate";

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
        return "duplicate";
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
