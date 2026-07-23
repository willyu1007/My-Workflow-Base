import type {
  WorkflowBatchExecutionControlCreateRequestV1,
  WorkflowBatchExecutionControlDispatchEffectRecordedV1,
  WorkflowBatchExecutionControlLaterGenerationV1,
  WorkflowBatchExecutionControlReadInputV1,
  WorkflowBatchExecutionControlRecoveryDispatchProgressV1,
  WorkflowBatchExecutionControlReserveCommandV1,
  WorkflowBatchExecutionControlResolverInputV1,
  WorkflowBatchExecutionControlResumeRequestV1,
  WorkflowBatchExecutionControllerPortV1,
} from "@host/workflow-contracts";
import {
  batchControlCreateRequestFixture,
  batchControlForwardPolicyFixture,
  batchControlPinsFixture,
  batchControlResumeRequestFixture,
  batchControlScopeFixture,
  batchControlSnapshotReadFixture,
} from "./batch-execution-control-v1.fixture.js";

const { pins: intentionallyOmittedPins, ...createWithoutPins } =
  batchControlCreateRequestFixture;
void intentionallyOmittedPins;

// @ts-expect-error -- every create mutation must carry the complete authority/source pin set.
export const createRejectsMissingPins: WorkflowBatchExecutionControlCreateRequestV1 =
  createWithoutPins;

export const laterGenerationRejectsZero: WorkflowBatchExecutionControlLaterGenerationV1 = {
  // @ts-expect-error -- a later generation is produced only after positive-integer decoding.
  generation: 0,
  supersession: {
    prior_owner_batch_id: "batch-prior",
    prior_tombstone_receipt_ref: "receipt:tombstone-prior",
    prior_tombstone_hash: "a".repeat(64),
  },
};

export const createRejectsReadQuery: WorkflowBatchExecutionControlCreateRequestV1 = {
  ...batchControlCreateRequestFixture,
  // @ts-expect-error -- create is a mutation and cannot carry a read query.
  query: batchControlResumeRequestFixture.query,
};

export const resumeRejectsMutationMeta: WorkflowBatchExecutionControlResumeRequestV1 = {
  ...batchControlResumeRequestFixture,
  // @ts-expect-error -- resume is read-like and cannot create command identity.
  request_meta: batchControlCreateRequestFixture.request_meta,
};

export const readRejectsMethodNameInference: WorkflowBatchExecutionControlReadInputV1<"read_batch_snapshot"> = {
  ...batchControlSnapshotReadFixture,
  // @ts-expect-error -- raw read DTOs carry their own exact operation discriminator.
  operation: "read_batch_history_page",
};

export const readRejectsNestedOperationMismatch: WorkflowBatchExecutionControlReadInputV1<"read_batch_snapshot"> = {
  ...batchControlSnapshotReadFixture,
  query: {
    ...batchControlSnapshotReadFixture.query,
    // @ts-expect-error -- the query binding must repeat the same exact operation discriminator.
    operation: "read_global_admission_snapshot",
  },
};

export const resolverRejectsCallerConnectionData: WorkflowBatchExecutionControlResolverInputV1 = {
  receipt_ref: "receipt:negative",
  expected_pins: batchControlPinsFixture,
  // @ts-expect-error -- resolver construction owns connection data outside the DTO.
  connection_data: "caller-value",
};

export const resolverRejectsAuthoritySubstitution: WorkflowBatchExecutionControlResolverInputV1 = {
  receipt_ref: "receipt:negative-authority",
  expected_pins: batchControlPinsFixture,
  // @ts-expect-error -- callers cannot override the pinned receipt authority.
  receipt_authority_override: "caller-authority",
};

export const resolverRejectsBearerMaterial: WorkflowBatchExecutionControlResolverInputV1 = {
  receipt_ref: "receipt:negative-secret",
  expected_pins: batchControlPinsFixture,
  // @ts-expect-error -- transport bearer material is injected outside the public DTO.
  bearer_token: "caller-secret",
};

export const createRejectsScenarioPayload: WorkflowBatchExecutionControlCreateRequestV1 = {
  ...batchControlCreateRequestFixture,
  binding: {
    ...batchControlCreateRequestFixture.binding,
    // @ts-expect-error -- scenario/product identifiers never enter the shared binding.
    learner_id: "scenario-owned-learner",
  },
};

export const reserveRejectsCallerAllocatedWorkId: WorkflowBatchExecutionControlReserveCommandV1 = {
  schema_version: 1,
  pins: batchControlPinsFixture,
  scope: batchControlScopeFixture,
  policy_decision: batchControlForwardPolicyFixture,
  request_meta: {
    command_id: "command:negative-reserve",
    idempotency_key: "idempotency:negative-reserve",
    correlation_id: "correlation:negative-reserve",
    request_hash: "b".repeat(64),
  },
  owner_batch_id: "batch-negative",
  purpose_profile_hash: "5".repeat(64),
  precondition: {
    kind: "expected_existing",
    expected_binding_hash: "7".repeat(64),
    expected_batch_head: {
      owner_batch_id: "batch-negative",
      state: "planned",
      snapshot_version: "1",
      ledger_sequence: "1",
      last_event_hash: "c".repeat(64),
    },
    expected_global_head: batchControlCreateRequestFixture.precondition.expected_global_head,
  },
  operation: "reserve_executions",
  current_claim: {
    kind: "ordinary",
    claim_id: "claim:negative",
    lease_id: "lease:negative",
    fence: "1",
    owner_issued_at: "2026-07-23T00:00:00.000Z",
    lease_expires_at: "2026-07-23T00:01:00.000Z",
  },
  payload: {
    logical_unit_collection_root: "d".repeat(64),
    reservation_intent_hash: "e".repeat(64),
    // @ts-expect-error -- only the owner allocates work identities during reservation.
    allocated_work_id: "caller-work-id",
  },
};

type AssertFalse<Value extends false> = Value;
type RecordedWithPartial = {
  dispatch_effect_status: WorkflowBatchExecutionControlDispatchEffectRecordedV1;
  completion_status: {
    kind: "partial";
    receipt_count: 1;
    expected_count: 2;
    collection_root: string;
  };
};

export type RecordedEffectRejectsCompletion = AssertFalse<
  RecordedWithPartial extends WorkflowBatchExecutionControlRecoveryDispatchProgressV1 ? true : false
>;

export async function controllerRejectsReadbackMethod(
  controller: WorkflowBatchExecutionControllerPortV1,
): Promise<void> {
  // @ts-expect-error -- controller and readback ports are independent capabilities.
  await controller.read_batch_snapshot(batchControlSnapshotReadFixture);
}
