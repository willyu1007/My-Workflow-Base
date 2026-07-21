import type {
  CanonicalRefV1,
  ScenarioCommandEnvelopeV1,
  ScenarioCommandReceiptV1,
  ScenarioEventEnvelopeV1,
} from "@host/workflow-contracts";

export type ScenarioCommandExecutionRecord = {
  command_id: string;
  idempotency_key: string;
  workflow_step_ref: CanonicalRefV1;
  command_identity_hash: string;
  receipt: ScenarioCommandReceiptV1;
};

export type OwnerIntegrationOutboxDraft = {
  event: ScenarioEventEnvelopeV1;
  /** Domain bodies and PII are forbidden; the host rereads the owner by refs. */
  body: never;
};

export type ExampleOwnerTransaction = {
  command_executions: {
    findByIdempotencyKey(scenarioKey: string, idempotencyKey: string): Promise<ScenarioCommandExecutionRecord | null>;
    insert(record: ScenarioCommandExecutionRecord): Promise<void>;
  };
  integration_outbox: {
    insert(draft: Omit<OwnerIntegrationOutboxDraft, "body">): Promise<void>;
  };
  example_records: {
    applyCommand(input: ScenarioCommandEnvelopeV1): Promise<CanonicalRefV1[]>;
  };
};

export type ExampleScenarioRepositories = {
  transaction<T>(operation: (transaction: ExampleOwnerTransaction) => Promise<T>): Promise<T>;
};
