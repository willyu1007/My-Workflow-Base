import type {
  CanonicalRefV1,
  ScenarioCommandEnvelopeV1,
  ScenarioCommandReceiptV1,
  ScenarioEventEnvelopeV1,
} from "@host/workflow-contracts";
import { assertScenarioCommandEnvelopeV1, scenarioCommandIdentityHash } from "@host/workflow-contracts";
import type { ExampleScenarioRepositories } from "./repositories.js";

export type OwnerAuthorizationPort = {
  /** Recheck current scenario role/grant/purpose/lifecycle. Platform bindings are context only. */
  authorize(input: ScenarioCommandEnvelopeV1): Promise<{ allowed: boolean; reason_code: string }>;
};

function sameRef(left: CanonicalRefV1, right: CanonicalRefV1): boolean {
  return left.namespace === right.namespace && left.object_type === right.object_type && left.object_id === right.object_id && left.version === right.version;
}

export class ExampleOwnerApi {
  constructor(
    private readonly repositories: ExampleScenarioRepositories,
    private readonly authorization: OwnerAuthorizationPort,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: unknown): Promise<ScenarioCommandReceiptV1> {
    assertScenarioCommandEnvelopeV1(input);
    if (input.scenario_release.scenario_key !== "example") throw new Error("scenario_key_mismatch");
    const authorization = await this.authorization.authorize(input);
    if (!authorization.allowed) throw new Error(`scenario_authorization_denied:${authorization.reason_code}`);
    const identityHash = scenarioCommandIdentityHash(input);

    return this.repositories.transaction(async (transaction) => {
      const existing = await transaction.command_executions.findByIdempotencyKey("example", input.idempotency_key);
      if (existing) {
        if (existing.command_identity_hash !== identityHash || !sameRef(existing.workflow_step_ref, input.workflow_step_ref)) {
          throw new Error("idempotency_identity_conflict");
        }
        return { ...existing.receipt, status: "already_applied" };
      }

      const resultRefs = await transaction.example_records.applyCommand(input);
      const executionRef: CanonicalRefV1 = {
        schema_version: 1,
        namespace: "example",
        object_type: "scenario_command_execution",
        object_id: input.command_id,
        version: 1,
      };
      const receipt: ScenarioCommandReceiptV1 = {
        receipt_version: 1,
        command_id: input.command_id,
        idempotency_key: input.idempotency_key,
        workflow_step_ref: input.workflow_step_ref,
        status: "applied",
        owner_execution_ref: executionRef,
        result_refs: resultRefs,
        generation_record_refs: [],
        owner_version: 1,
        committed_at: this.now().toISOString(),
      };
      await transaction.command_executions.insert({
        command_id: input.command_id,
        idempotency_key: input.idempotency_key,
        workflow_step_ref: input.workflow_step_ref,
        command_identity_hash: identityHash,
        receipt,
      });
      const event: ScenarioEventEnvelopeV1 = {
        envelope_version: 1,
        event_id: `${input.command_id}:applied`,
        event_type: "example.command.applied",
        event_schema_version: 1,
        scenario_release: input.scenario_release,
        owner_event_ref: executionRef,
        subject_refs: resultRefs,
        purpose: input.purpose,
        actor_ref: input.actor.actor_ref,
        correlation_id: input.correlation_id,
        ...(input.trace_id ? { trace_id: input.trace_id } : {}),
        occurred_at: this.now().toISOString(),
      };
      await transaction.integration_outbox.insert({ event });
      return receipt;
    });
  }

  async getReceipt(input: unknown): Promise<ScenarioCommandReceiptV1 | null> {
    assertScenarioCommandEnvelopeV1(input);
    if (input.scenario_release.scenario_key !== "example") throw new Error("scenario_key_mismatch");
    const authorization = await this.authorization.authorize(input);
    if (!authorization.allowed) throw new Error(`scenario_authorization_denied:${authorization.reason_code}`);
    const identityHash = scenarioCommandIdentityHash(input);
    return this.repositories.transaction(async (transaction) => {
      const existing = await transaction.command_executions.findByIdempotencyKey("example", input.idempotency_key);
      if (!existing) return null;
      if (existing.command_identity_hash !== identityHash || !sameRef(existing.workflow_step_ref, input.workflow_step_ref)) {
        throw new Error("idempotency_identity_conflict");
      }
      return existing.receipt;
    });
  }
}
