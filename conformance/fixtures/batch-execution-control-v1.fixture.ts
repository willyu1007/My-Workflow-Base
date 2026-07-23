import { createHash } from "node:crypto";

import type {
  WorkflowBatchExecutionControlAuthorityEnvelopeV1,
  WorkflowBatchExecutionControlAuthorityReceiptV1,
  WorkflowBatchExecutionControlBatchHeadV1,
  WorkflowBatchExecutionControlClaimCommandV1,
  WorkflowBatchExecutionControlCommandV1,
  WorkflowBatchExecutionControlConfirmClientCommitCommandV1,
  WorkflowBatchExecutionControlCreateRequestV1,
  WorkflowBatchExecutionControlDispatchCommandV1,
  WorkflowBatchExecutionControlDispatchedRecoverySnapshotV1,
  WorkflowBatchExecutionControlForwardPolicyDecisionV1,
  WorkflowBatchExecutionControlGlobalHeadV1,
  WorkflowBatchExecutionControlOpenRequestV1,
  WorkflowBatchExecutionControlOpenBindingV1,
  WorkflowBatchExecutionControlPageInputV1,
  WorkflowBatchExecutionControlPinsV1,
  WorkflowBatchExecutionControlPositiveGenerationV1,
  WorkflowBatchExecutionControlQuarantineCommandV1,
  WorkflowBatchExecutionControlQuarantinedSnapshotV1,
  WorkflowBatchExecutionControlReadInputV1,
  WorkflowBatchExecutionControlReadObservationV1,
  WorkflowBatchExecutionControlReadOperationV1,
  WorkflowBatchExecutionControlReadbackPolicyDecisionV1,
  WorkflowBatchExecutionControlReconcileCommandV1,
  WorkflowBatchExecutionControlReconciliationClaimV1,
  WorkflowBatchExecutionControlReconciledUnresolvedSnapshotV1,
  WorkflowBatchExecutionControlRecoveryPolicyDecisionV1,
  WorkflowBatchExecutionControlRequestOutcomeInputV1,
  WorkflowBatchExecutionControlReservationV1,
  WorkflowBatchExecutionControlReserveCommandV1,
  WorkflowBatchExecutionControlResolvedEnvelopeV1,
  WorkflowBatchExecutionControlResolverInputV1,
  WorkflowBatchExecutionControlResumeRequestV1,
  WorkflowBatchExecutionControlReservedRecoverySnapshotV1,
  WorkflowBatchExecutionControlSealedRecoverySnapshotV1,
  WorkflowBatchExecutionControlSealCommandV1,
  WorkflowBatchExecutionControllerPortV1,
  WorkflowBatchExecutionReadbackPortV1,
  WorkflowBatchExecutionReceiptResolverPortV1,
  WorkflowHostValidationSnapshot,
} from "@host/workflow-contracts";

const requestDomainPrefix = "workflow_batch_execution_control_v1/request\u0000";
const authorityEnvelopeDomainPrefix =
  "workflow_batch_execution_control_v1/authority-envelope\u0000";
const readObservationDomainPrefix =
  "workflow_batch_execution_control_v1/read-observation\u0000";

function canonicalize(value: unknown): string {
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) throw new Error("Fixture protocol numbers must be safe integers.");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`)
      .join(",")}}`;
  }
  throw new Error(`Unsupported fixture JSON value: ${typeof value}`);
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function domainHash(prefix: string, projection: unknown): string {
  return createHash("sha256")
    .update(Buffer.concat([Buffer.from(prefix, "utf8"), Buffer.from(canonicalize(projection), "utf8")]))
    .digest("hex");
}

function withRequestHash<Request extends { request_meta: { request_hash: string } }>(request: Request): Request {
  const projection = structuredClone(request) as Record<string, unknown>;
  const requestMeta = projection.request_meta as Record<string, unknown>;
  delete requestMeta.request_hash;
  return {
    ...request,
    request_meta: {
      ...request.request_meta,
      request_hash: domainHash(requestDomainPrefix, projection),
    },
  };
}

function withAuthorityEnvelopeHash(
  projection: Omit<WorkflowBatchExecutionControlAuthorityEnvelopeV1, "authority_envelope_hash">,
): WorkflowBatchExecutionControlAuthorityEnvelopeV1 {
  return {
    ...projection,
    authority_envelope_hash: domainHash(authorityEnvelopeDomainPrefix, projection),
  };
}

function withReadObservationHash<Result>(
  projection: Omit<WorkflowBatchExecutionControlReadObservationV1<Result>, "read_observation_hash">,
): WorkflowBatchExecutionControlReadObservationV1<Result> {
  return {
    ...projection,
    read_observation_hash: domainHash(readObservationDomainPrefix, projection),
  };
}

export const batchControlPinsFixture = {
  capability_family: "workflow_batch_execution_control_v1",
  capability_version: 1,
  contract_revision: "contract-revision-1",
  contract_source_hash: "a".repeat(64),
  canonicalization_profile: "rfc8785_jcs_sha256_v1",
  vector_release_hash: "b".repeat(64),
  owner_namespace: "owner.workflow",
  receipt_issuer: "owner.workflow",
  receipt_audience: "consumer.workflow",
  receipt_authority_id: "receipt-authority-1",
  receipt_authority_version: "1",
  owner_deployment_id: "owner-deployment-1",
  owner_deployment_digest: "c".repeat(64),
  ledger_schema_revision: "ledger-v1",
  trust_mode: "opaque_owner_readback_v1",
} satisfies WorkflowBatchExecutionControlPinsV1;

export const batchControlScopeFixture = {
  kind: "platform",
  scope_id: "platform-control",
} as const;

export const batchControlForwardPolicyFixture = {
  kind: "forward_window",
  decision_ref: "policy:forward-1",
  decision_hash: "d".repeat(64),
  decision_issuer: "policy.workflow",
  decision_audience: "owner.workflow",
  not_before: "2026-07-23T00:00:00.000Z",
  expires_at: "2026-07-23T00:15:00.000Z",
} satisfies WorkflowBatchExecutionControlForwardPolicyDecisionV1;

export const batchControlRecoveryPolicyFixture = {
  ...batchControlForwardPolicyFixture,
  kind: "recovery_policy",
  decision_ref: "policy:recovery-1",
  expired_forward_decision_ref: batchControlForwardPolicyFixture.decision_ref,
} satisfies WorkflowBatchExecutionControlRecoveryPolicyDecisionV1;

export const batchControlReadbackPolicyFixture = {
  ...batchControlForwardPolicyFixture,
  kind: "readback",
  decision_ref: "policy:readback-1",
} satisfies WorkflowBatchExecutionControlReadbackPolicyDecisionV1;

export const batchControlGlobalHeadFixture = {
  ledger_sequence: "0",
  last_event_hash: null,
  registry_version: "0",
  admission_root: "e".repeat(64),
  uniqueness_root: "f".repeat(64),
  active_claim_count: 0,
  active_reserved_execution_count: 0,
  lifetime_logical_unit_count: 0,
  lifetime_task_id_count: 0,
  lifetime_execution_id_count: 0,
} satisfies WorkflowBatchExecutionControlGlobalHeadV1;

const logicalUnits = [
  {
    logical_unit_hash: "1".repeat(64),
    execution_binding_hash: "2".repeat(64),
    workload_class_hash: "0".repeat(64),
  },
  {
    logical_unit_hash: "2".repeat(64),
    execution_binding_hash: "3".repeat(64),
    workload_class_hash: "1".repeat(64),
  },
] satisfies Array<{
  logical_unit_hash: string;
  execution_binding_hash: string;
  workload_class_hash: string;
}>;

const openBinding = {
  client_generation_key: "generation:series-1:0",
  logical_series_hash: "4".repeat(64),
  purpose_profile_hash: "5".repeat(64),
  logical_unit_collection_root: "6".repeat(64),
  logical_unit_count: logicalUnits.length,
  binding_hash: "7".repeat(64),
  logical_units: logicalUnits,
  generation: 0,
  supersession: null,
} satisfies WorkflowBatchExecutionControlOpenBindingV1;

const createRequestSeed = {
  kind: "create_if_absent",
  operation: "open_or_resume_batch",
  schema_version: 1,
  pins: batchControlPinsFixture,
  scope: batchControlScopeFixture,
  policy_decision: batchControlForwardPolicyFixture,
  request_meta: {
    command_id: "command:create-1",
    idempotency_key: "idempotency:create-1",
    correlation_id: "correlation:create-1",
    request_hash: "0".repeat(64),
  },
  binding: openBinding,
  precondition: {
    kind: "expected_absent",
    expected_global_head: batchControlGlobalHeadFixture,
  },
} satisfies WorkflowBatchExecutionControlCreateRequestV1;

export const batchControlCreateRequestFixture = withRequestHash(createRequestSeed);

export function createLaterGenerationFixture(
  generation: WorkflowBatchExecutionControlPositiveGenerationV1,
): WorkflowBatchExecutionControlCreateRequestV1 {
  const seed = {
    ...batchControlCreateRequestFixture,
    request_meta: {
      ...batchControlCreateRequestFixture.request_meta,
      command_id: "command:create-later",
      idempotency_key: "idempotency:create-later",
      correlation_id: "correlation:create-later",
      request_hash: "0".repeat(64),
    },
    binding: {
      ...batchControlCreateRequestFixture.binding,
      client_generation_key: "generation:series-1:1",
      binding_hash: "8".repeat(64),
      generation,
      supersession: {
        prior_owner_batch_id: "batch-previous",
        prior_tombstone_receipt_ref: "receipt:tombstone-previous",
        prior_tombstone_hash: "8".repeat(64),
      },
    },
  } satisfies WorkflowBatchExecutionControlCreateRequestV1;
  return withRequestHash(seed);
}

export const batchControlPositiveGenerationFixture = 1 as WorkflowBatchExecutionControlPositiveGenerationV1;

export const batchControlLaterGenerationRequestFixture = createLaterGenerationFixture(
  batchControlPositiveGenerationFixture,
);

const plannedBatchHead = {
  owner_batch_id: "batch-1",
  state: "planned",
  snapshot_version: "1",
  ledger_sequence: "1",
  last_event_hash: "3".repeat(64),
} as const;

export const batchControlGlobalAfterOpenHeadFixture = {
  ...batchControlGlobalHeadFixture,
  ledger_sequence: "1",
  last_event_hash: "4".repeat(64),
  registry_version: "1",
  admission_root: "a".repeat(64),
  uniqueness_root: "b".repeat(64),
  lifetime_logical_unit_count: logicalUnits.length,
} satisfies WorkflowBatchExecutionControlGlobalHeadV1;

export const batchControlResumeRequestFixture = {
  kind: "resume_existing",
  operation: "open_or_resume_batch",
  schema_version: 1,
  expected_pins: batchControlPinsFixture,
  scope: batchControlScopeFixture,
  client_generation_key: openBinding.client_generation_key,
  query: {
    operation: "read_batch_snapshot",
    query_id: "query:resume-1",
    query_hash: "a".repeat(64),
    read_policy: batchControlReadbackPolicyFixture,
  },
  precondition: {
    kind: "expected_existing",
    expected_binding_hash: openBinding.binding_hash,
    expected_batch_head: plannedBatchHead,
    expected_global_head: batchControlGlobalAfterOpenHeadFixture,
  },
} satisfies WorkflowBatchExecutionControlResumeRequestV1;

const ordinaryClaim = {
  kind: "ordinary",
  claim_id: "claim:ordinary-1",
  lease_id: "lease:ordinary-1",
  fence: "1",
  owner_issued_at: "2026-07-23T00:00:10.000Z",
  lease_expires_at: "2026-07-23T00:01:10.000Z",
} as const;

const claimedBatchHead = {
  ...plannedBatchHead,
  snapshot_version: "2",
  ledger_sequence: "2",
  last_event_hash: "5".repeat(64),
} as const;

const claimedGlobalHead = {
  ...batchControlGlobalAfterOpenHeadFixture,
  ledger_sequence: "2",
  last_event_hash: "6".repeat(64),
  registry_version: "2",
  active_claim_count: 1,
} as const;

function mutationCommon<
  Policy extends
    | WorkflowBatchExecutionControlForwardPolicyDecisionV1
    | WorkflowBatchExecutionControlRecoveryPolicyDecisionV1,
>(input: {
  commandId: string;
  policy: Policy;
  batchHead?: WorkflowBatchExecutionControlBatchHeadV1;
  globalHead?: WorkflowBatchExecutionControlGlobalHeadV1;
}) {
  return {
    schema_version: 1 as const,
    pins: batchControlPinsFixture,
    scope: batchControlScopeFixture,
    policy_decision: input.policy,
    request_meta: {
      command_id: `command:${input.commandId}`,
      idempotency_key: `idempotency:${input.commandId}`,
      correlation_id: `correlation:${input.commandId}`,
      request_hash: "0".repeat(64),
    },
    owner_batch_id: "batch-1",
    purpose_profile_hash: openBinding.purpose_profile_hash,
    precondition: {
      kind: "expected_existing" as const,
      expected_binding_hash: openBinding.binding_hash,
      expected_batch_head: input.batchHead ?? plannedBatchHead,
      expected_global_head: input.globalHead ?? batchControlGlobalAfterOpenHeadFixture,
    },
  };
}

const claimCommandSeed = {
  ...mutationCommon({ commandId: "claim-1", policy: batchControlForwardPolicyFixture }),
  operation: "claim_batch",
  expected_claim: { kind: "none" },
  payload: { claim_type: "ordinary", requested_ttl_seconds: 60 },
} satisfies WorkflowBatchExecutionControlClaimCommandV1;

export const batchControlClaimCommandFixture = withRequestHash(claimCommandSeed);

const renewCommandSeed = {
  ...mutationCommon({
    commandId: "renew-1",
    policy: batchControlForwardPolicyFixture,
    batchHead: claimedBatchHead,
    globalHead: claimedGlobalHead,
  }),
  operation: "renew_batch_claim",
  current_claim: ordinaryClaim,
  payload: { requested_ttl_seconds: 60 },
} satisfies WorkflowBatchExecutionControlCommandV1;

export const batchControlRenewCommandFixture = withRequestHash(renewCommandSeed);

const releaseCommandSeed = {
  ...mutationCommon({
    commandId: "release-1",
    policy: batchControlForwardPolicyFixture,
    batchHead: claimedBatchHead,
    globalHead: claimedGlobalHead,
  }),
  operation: "release_batch_claim",
  current_claim: ordinaryClaim,
  payload: {},
} satisfies WorkflowBatchExecutionControlCommandV1;

export const batchControlReleaseCommandFixture = withRequestHash(releaseCommandSeed);

const reserveCommandSeed = {
  ...mutationCommon({
    commandId: "reserve-1",
    policy: batchControlForwardPolicyFixture,
    batchHead: claimedBatchHead,
    globalHead: claimedGlobalHead,
  }),
  operation: "reserve_executions",
  current_claim: ordinaryClaim,
  payload: {
    logical_unit_collection_root: openBinding.logical_unit_collection_root,
    reservation_intent_hash: "e".repeat(64),
  },
} satisfies WorkflowBatchExecutionControlReserveCommandV1;

export const batchControlReserveCommandFixture = withRequestHash(reserveCommandSeed);

export const batchControlReservationFixture = {
  reservation_id: "reservation-1",
  logical_unit_collection_root: openBinding.logical_unit_collection_root,
  identity_collection_hash: "c".repeat(64),
  allocations: [
    {
      ...logicalUnits[0],
      owner_task_id: "task-1",
      owner_execution_id: "execution-1",
    },
    {
      ...logicalUnits[1],
      owner_task_id: "task-2",
      owner_execution_id: "execution-2",
    },
  ],
  allocation_count: logicalUnits.length,
  reserved_at: "2026-07-23T00:00:20.000Z",
  reservation_hash: "1".repeat(64),
} satisfies WorkflowBatchExecutionControlReservationV1;

const reservedBatchHead = {
  ...plannedBatchHead,
  state: "executions_reserved",
  snapshot_version: "3",
  ledger_sequence: "3",
  last_event_hash: "7".repeat(64),
} as const;

const reservedGlobalHead = {
  ...claimedGlobalHead,
  ledger_sequence: "3",
  last_event_hash: "8".repeat(64),
  registry_version: "3",
  active_reserved_execution_count: logicalUnits.length,
  lifetime_task_id_count: logicalUnits.length,
  lifetime_execution_id_count: logicalUnits.length,
} as const;

const sealCommandSeed = {
  ...mutationCommon({
    commandId: "seal-1",
    policy: batchControlForwardPolicyFixture,
    batchHead: reservedBatchHead,
    globalHead: reservedGlobalHead,
  }),
  operation: "seal_execution_manifest",
  current_claim: ordinaryClaim,
  payload: {
    reservation_hash: batchControlReservationFixture.reservation_hash,
    execution_manifest_hash: "3".repeat(64),
  },
} satisfies WorkflowBatchExecutionControlSealCommandV1;

export const batchControlSealCommandFixture = withRequestHash(sealCommandSeed);

export const batchControlSealFixture = {
  seal_id: "seal-1",
  reservation_hash: batchControlReservationFixture.reservation_hash,
  execution_manifest_hash: batchControlSealCommandFixture.payload.execution_manifest_hash,
  allocation_count: batchControlReservationFixture.allocation_count,
  sealed_at: "2026-07-23T00:00:30.000Z",
  seal_hash: "4".repeat(64),
} as const;

const sealedBatchHead = {
  ...plannedBatchHead,
  state: "executions_sealed",
  snapshot_version: "4",
  ledger_sequence: "4",
  last_event_hash: "9".repeat(64),
} as const;

const sealedGlobalHead = {
  ...reservedGlobalHead,
  ledger_sequence: "4",
  last_event_hash: "a".repeat(64),
  registry_version: "4",
} as const;

const confirmCommandSeed = {
  ...mutationCommon({
    commandId: "commit-1",
    policy: batchControlForwardPolicyFixture,
    batchHead: sealedBatchHead,
    globalHead: sealedGlobalHead,
  }),
  operation: "confirm_client_commit",
  current_claim: ordinaryClaim,
  payload: {
    seal_hash: batchControlSealFixture.seal_hash,
    execution_manifest_hash: batchControlSealFixture.execution_manifest_hash,
    client_commit_ref: "commit:client-1",
    client_commit_hash: "5".repeat(64),
  },
} satisfies WorkflowBatchExecutionControlConfirmClientCommitCommandV1;

export const batchControlConfirmClientCommitCommandFixture = withRequestHash(confirmCommandSeed);

export const batchControlClientCommitFixture = {
  client_commit_ref: batchControlConfirmClientCommitCommandFixture.payload.client_commit_ref,
  client_commit_hash: batchControlConfirmClientCommitCommandFixture.payload.client_commit_hash,
  execution_manifest_hash: batchControlSealFixture.execution_manifest_hash,
  confirmed_at: "2026-07-23T00:00:40.000Z",
} as const;

const committedBatchHead = {
  ...plannedBatchHead,
  state: "client_commit_confirmed",
  snapshot_version: "5",
  ledger_sequence: "5",
  last_event_hash: "b".repeat(64),
} as const;

const committedGlobalHead = {
  ...sealedGlobalHead,
  ledger_sequence: "5",
  last_event_hash: "c".repeat(64),
  registry_version: "5",
} as const;

const dispatchCommandSeed = {
  ...mutationCommon({
    commandId: "dispatch-1",
    policy: batchControlForwardPolicyFixture,
    batchHead: committedBatchHead,
    globalHead: committedGlobalHead,
  }),
  operation: "dispatch_batch",
  current_claim: ordinaryClaim,
  payload: {
    seal_hash: batchControlSealFixture.seal_hash,
    client_commit_hash: batchControlClientCommitFixture.client_commit_hash,
    execution_manifest_hash: batchControlSealFixture.execution_manifest_hash,
  },
} satisfies WorkflowBatchExecutionControlDispatchCommandV1;

export const batchControlDispatchCommandFixture = withRequestHash(dispatchCommandSeed);

export const batchControlDispatchFixture = {
  dispatch_id: "dispatch-1",
  seal_hash: batchControlSealFixture.seal_hash,
  client_commit_hash: batchControlClientCommitFixture.client_commit_hash,
  execution_manifest_hash: batchControlSealFixture.execution_manifest_hash,
  dispatch_commit_hash: "6".repeat(64),
  outbox_intent_root: "7".repeat(64),
  recorded_before_effect: true,
  recorded_at: "2026-07-23T00:00:50.000Z",
} as const;

export const batchControlReconciliationClaimFixture = {
  kind: "reconciliation_only",
  claim_id: "claim:recovery-1",
  lease_id: "lease:recovery-1",
  fence: "2",
  owner_issued_at: "2026-07-23T00:01:00.000Z",
  lease_expires_at: "2026-07-23T00:02:00.000Z",
  original_identity_collection_hash: batchControlReservationFixture.identity_collection_hash,
  recovery_policy: batchControlRecoveryPolicyFixture,
  allowed_operations: ["quarantine_reservation", "release_batch_claim", "renew_batch_claim"],
  allowed_operations_hash: "d".repeat(64),
} satisfies WorkflowBatchExecutionControlReconciliationClaimV1;

export const batchControlDispatchedReconciliationClaimFixture = {
  ...batchControlReconciliationClaimFixture,
  claim_id: "claim:recovery-dispatched-1",
  lease_id: "lease:recovery-dispatched-1",
  owner_issued_at: "2026-07-23T00:02:00.000Z",
  lease_expires_at: "2026-07-23T00:03:00.000Z",
  allowed_operations: ["reconcile_batch", "release_batch_claim", "renew_batch_claim"],
  allowed_operations_hash: "e".repeat(64),
} satisfies WorkflowBatchExecutionControlReconciliationClaimV1;

export const batchControlRecoveryFixture = {
  recovery_id: "recovery-1",
  origin_state: "dispatch_recorded",
  original_identity_collection_hash: batchControlReservationFixture.identity_collection_hash,
  entered_at: "2026-07-23T00:02:00.000Z",
  recovery_hash: "8".repeat(64),
} as const;

const dispatchedRecoveryHead = {
  ...plannedBatchHead,
  state: "recovery_required_dispatched",
  snapshot_version: "8",
  ledger_sequence: "8",
  last_event_hash: "d".repeat(64),
} as const;

const recoveryGlobalHead = {
  ...committedGlobalHead,
  ledger_sequence: "8",
  last_event_hash: "e".repeat(64),
  registry_version: "8",
  active_claim_count: 1,
} as const;

const batchBinding = {
  owner_batch_id: "batch-1",
  client_generation_key: openBinding.client_generation_key,
  logical_series_hash: openBinding.logical_series_hash,
  purpose_profile_hash: openBinding.purpose_profile_hash,
  logical_unit_collection_root: openBinding.logical_unit_collection_root,
  logical_unit_count: openBinding.logical_unit_count,
  binding_hash: openBinding.binding_hash,
  generation: 0,
  supersession: null,
} as const;

export const batchControlDispatchedRecoverySnapshotFixture = {
  schema_version: 1,
  pins: batchControlPinsFixture,
  scope: batchControlScopeFixture,
  state: "recovery_required_dispatched",
  binding: batchBinding,
  logical_units: logicalUnits,
  batch_head: dispatchedRecoveryHead,
  global_head: recoveryGlobalHead,
  snapshot_hash: "9".repeat(64),
  claim: batchControlDispatchedReconciliationClaimFixture,
  reservation: batchControlReservationFixture,
  seal: batchControlSealFixture,
  client_commit: batchControlClientCommitFixture,
  dispatch: batchControlDispatchFixture,
  recovery: batchControlRecoveryFixture,
  dispatch_effect_status: {
    kind: "started",
    dispatch_commit_hash: batchControlDispatchFixture.dispatch_commit_hash,
    effect_started_at: "2026-07-23T00:02:10.000Z",
    effect_observation_hash: "a".repeat(64),
  },
  completion_status: {
    kind: "partial",
    receipt_count: 1,
    expected_count: logicalUnits.length,
    collection_root: "b".repeat(64),
  },
} satisfies WorkflowBatchExecutionControlDispatchedRecoverySnapshotV1;

const reservedRecoveryHead = {
  ...plannedBatchHead,
  state: "recovery_required_reserved_unsealed",
  snapshot_version: "6",
  ledger_sequence: "6",
  last_event_hash: "c".repeat(64),
} as const;

const sealedRecoveryHead = {
  ...plannedBatchHead,
  state: "recovery_required_sealed_undispatched",
  snapshot_version: "6",
  ledger_sequence: "6",
  last_event_hash: "d".repeat(64),
} as const;

const recoveryCommandGlobalHead = {
  ...reservedGlobalHead,
  ledger_sequence: "6",
  last_event_hash: "e".repeat(64),
  registry_version: "6",
  active_claim_count: 1,
} as const;

const reservedRecoveryFact = {
  recovery_id: "recovery-reserved-1",
  origin_state: "executions_reserved",
  original_identity_collection_hash: batchControlReservationFixture.identity_collection_hash,
  entered_at: "2026-07-23T00:01:00.000Z",
  recovery_hash: "9".repeat(64),
} as const;

export const batchControlReservedRecoverySnapshotFixture = {
  schema_version: 1,
  pins: batchControlPinsFixture,
  scope: batchControlScopeFixture,
  state: "recovery_required_reserved_unsealed",
  binding: batchBinding,
  logical_units: logicalUnits,
  batch_head: reservedRecoveryHead,
  global_head: recoveryCommandGlobalHead,
  snapshot_hash: "a".repeat(64),
  claim: batchControlReconciliationClaimFixture,
  reservation: batchControlReservationFixture,
  recovery: reservedRecoveryFact,
} satisfies WorkflowBatchExecutionControlReservedRecoverySnapshotV1;

export const batchControlSealedReconciliationClaimFixture = {
  ...batchControlReconciliationClaimFixture,
  claim_id: "claim:recovery-sealed-1",
  lease_id: "lease:recovery-sealed-1",
  allowed_operations: [
    "confirm_client_commit",
    "dispatch_batch",
    "reconcile_batch",
    "release_batch_claim",
    "renew_batch_claim",
  ],
  allowed_operations_hash: "f".repeat(64),
} satisfies WorkflowBatchExecutionControlReconciliationClaimV1;

const sealedRecoveryFact = {
  recovery_id: "recovery-sealed-1",
  origin_state: "executions_sealed",
  original_identity_collection_hash: batchControlReservationFixture.identity_collection_hash,
  entered_at: "2026-07-23T00:01:00.000Z",
  recovery_hash: "a".repeat(64),
} as const;

export const batchControlSealedRecoverySnapshotFixture = {
  schema_version: 1,
  pins: batchControlPinsFixture,
  scope: batchControlScopeFixture,
  state: "recovery_required_sealed_undispatched",
  binding: batchBinding,
  logical_units: logicalUnits,
  batch_head: sealedRecoveryHead,
  global_head: recoveryCommandGlobalHead,
  snapshot_hash: "b".repeat(64),
  claim: batchControlSealedReconciliationClaimFixture,
  reservation: batchControlReservationFixture,
  seal: batchControlSealFixture,
  client_commit_status: { kind: "not_confirmed" },
  recovery: sealedRecoveryFact,
} satisfies WorkflowBatchExecutionControlSealedRecoverySnapshotV1;

export const batchControlReconciledUnresolvedSnapshotFixture = {
  ...batchControlSealedRecoverySnapshotFixture,
  state: "reconciled_unresolved",
  reconciliation_origin: "sealed_undispatched",
  batch_head: {
    ...sealedRecoveryHead,
    state: "reconciled_unresolved",
    snapshot_version: "7",
    ledger_sequence: "7",
    last_event_hash: "b".repeat(64),
  },
  global_head: {
    ...recoveryCommandGlobalHead,
    ledger_sequence: "7",
    last_event_hash: "c".repeat(64),
    registry_version: "7",
    active_claim_count: 0,
    active_reserved_execution_count: 0,
  },
  snapshot_hash: "c".repeat(64),
  claim: { kind: "none" },
  reconciliation: {
    reconciliation_id: "reconciliation-unresolved-sealed-1",
    outcome: "unresolved",
    original_identity_collection_hash: batchControlReservationFixture.identity_collection_hash,
    completion_collection_root: null,
    lifecycle_head: null,
    reason_code: "outcome_unresolved",
    reconciled_at: "2026-07-23T00:03:00.000Z",
    reconciliation_hash: "d".repeat(64),
  },
} satisfies WorkflowBatchExecutionControlReconciledUnresolvedSnapshotV1;

const quarantineCommandSeed = {
  ...mutationCommon({
    commandId: "quarantine-1",
    policy: batchControlRecoveryPolicyFixture,
    batchHead: reservedRecoveryHead,
    globalHead: recoveryCommandGlobalHead,
  }),
  operation: "quarantine_reservation",
  current_claim: batchControlReconciliationClaimFixture,
  payload: {
    reservation_hash: batchControlReservationFixture.reservation_hash,
    original_identity_collection_hash: batchControlReservationFixture.identity_collection_hash,
    reason_code: "reserved_unsealed",
  },
} satisfies WorkflowBatchExecutionControlQuarantineCommandV1;

export const batchControlQuarantineCommandFixture = withRequestHash(quarantineCommandSeed);

const reconcileCommandSeed = {
  ...mutationCommon({
    commandId: "reconcile-1",
    policy: batchControlRecoveryPolicyFixture,
    batchHead: sealedRecoveryHead,
    globalHead: recoveryCommandGlobalHead,
  }),
  operation: "reconcile_batch",
  current_claim: batchControlSealedReconciliationClaimFixture,
  payload: {
    outcome: "unresolved",
    expected_completion_collection_root: null,
    expected_lifecycle_head: null,
    reason_code: "outcome_unresolved",
  },
} satisfies WorkflowBatchExecutionControlReconcileCommandV1;

export const batchControlReconcileCommandFixture = withRequestHash(reconcileCommandSeed);

export const batchControlMutationCommandFixtures = [
  batchControlClaimCommandFixture,
  batchControlRenewCommandFixture,
  batchControlReleaseCommandFixture,
  batchControlReserveCommandFixture,
  batchControlSealCommandFixture,
  batchControlConfirmClientCommitCommandFixture,
  batchControlDispatchCommandFixture,
  batchControlQuarantineCommandFixture,
  batchControlReconcileCommandFixture,
] satisfies WorkflowBatchExecutionControlCommandV1[];

export const batchControlTombstoneFixture = {
  tombstone_id: "tombstone-1",
  reservation_hash: batchControlReservationFixture.reservation_hash,
  original_identity_collection_hash: batchControlReservationFixture.identity_collection_hash,
  reason_code: "reserved_unsealed",
  cancelled_at: "2026-07-23T00:03:00.000Z",
  tombstone_hash: "e".repeat(64),
} as const;

export const batchControlQuarantinedSnapshotFixture = {
  schema_version: 1,
  pins: batchControlPinsFixture,
  scope: batchControlScopeFixture,
  state: "quarantined_cancelled",
  binding: batchBinding,
  logical_units: logicalUnits,
  batch_head: {
    ...reservedRecoveryHead,
    state: "quarantined_cancelled",
    snapshot_version: "7",
    ledger_sequence: "7",
    last_event_hash: "f".repeat(64),
  },
  global_head: {
    ...recoveryCommandGlobalHead,
    ledger_sequence: "7",
    last_event_hash: "f".repeat(64),
    registry_version: "7",
    active_claim_count: 0,
    active_reserved_execution_count: 0,
  },
  snapshot_hash: "0".repeat(64),
  claim: { kind: "none" },
  reservation: batchControlReservationFixture,
  recovery: {
    ...batchControlRecoveryFixture,
    origin_state: "executions_reserved",
  },
  tombstone: batchControlTombstoneFixture,
} satisfies WorkflowBatchExecutionControlQuarantinedSnapshotV1;

const plannedSnapshot = {
  schema_version: 1,
  pins: batchControlPinsFixture,
  scope: batchControlScopeFixture,
  state: "planned",
  binding: batchBinding,
  logical_units: logicalUnits,
  batch_head: plannedBatchHead,
  global_head: batchControlGlobalAfterOpenHeadFixture,
  snapshot_hash: "1".repeat(64),
  claim: { kind: "none" },
} satisfies import("@host/workflow-contracts").WorkflowBatchExecutionControlPlannedSnapshotV1;

const openingCapacityDelta = {
  active_claim_count: 0,
  active_reserved_execution_count: 0,
  lifetime_logical_unit_count: logicalUnits.length,
  lifetime_task_id_count: 0,
  lifetime_execution_id_count: 0,
} as const;

export const batchControlBatchEventFixture = {
  event_id: "event:batch-opened-1",
  event_type: "batch_opened",
  causation: {
    kind: "client_command",
    command_id: batchControlCreateRequestFixture.request_meta.command_id,
    idempotency_key: batchControlCreateRequestFixture.request_meta.idempotency_key,
    request_hash: batchControlCreateRequestFixture.request_meta.request_hash,
  },
  stream: { kind: "batch", owner_batch_id: "batch-1" },
  ledger_sequence: "1",
  previous_event_hash: null,
  owner_event_at: "2026-07-23T00:00:01.000Z",
  capacity_delta: openingCapacityDelta,
  fact_root: plannedSnapshot.snapshot_hash,
  event_hash: plannedBatchHead.last_event_hash,
} as const;

export const batchControlGlobalEventFixture = {
  event_id: "event:global-admission-1",
  event_type: "global_admission_changed",
  causation: batchControlBatchEventFixture.causation,
  stream: { kind: "global", owner_namespace: batchControlPinsFixture.owner_namespace },
  ledger_sequence: "1",
  previous_event_hash: null,
  owner_event_at: "2026-07-23T00:00:01.000Z",
  capacity_delta: openingCapacityDelta,
  fact_root: batchControlGlobalAfterOpenHeadFixture.admission_root,
  event_hash: batchControlGlobalAfterOpenHeadFixture.last_event_hash,
} as const;

const authorityEnvelopeProjection = {
  schema_version: 1,
  receipt_ref: "receipt:batch-opened-1",
  pins: batchControlPinsFixture,
  scope: batchControlScopeFixture,
  causation: batchControlBatchEventFixture.causation,
  before_batch_head: null,
  after_batch_head: plannedBatchHead,
  before_global_head: batchControlGlobalHeadFixture,
  after_global_head: batchControlGlobalAfterOpenHeadFixture,
  batch_event: batchControlBatchEventFixture,
  global_event: batchControlGlobalEventFixture,
  capacity_delta: openingCapacityDelta,
  result_snapshot: plannedSnapshot,
  dispatch_commit_hash: null,
  owner_issued_at: "2026-07-23T00:00:01.000Z",
} satisfies Omit<WorkflowBatchExecutionControlAuthorityEnvelopeV1, "authority_envelope_hash">;

export const batchControlAuthorityEnvelopeFixture = withAuthorityEnvelopeHash(authorityEnvelopeProjection);

const canonicalAuthorityEnvelope = canonicalize(batchControlAuthorityEnvelopeFixture);
const canonicalAuthorityEnvelopeBytesSha256 = sha256(canonicalAuthorityEnvelope);

export const batchControlAuthorityReceiptFixture = {
  receipt_ref: batchControlAuthorityEnvelopeFixture.receipt_ref,
  authority_envelope: batchControlAuthorityEnvelopeFixture,
  canonical_envelope_utf8: canonicalAuthorityEnvelope,
  authority_envelope_hash: batchControlAuthorityEnvelopeFixture.authority_envelope_hash,
  canonical_envelope_bytes_sha256: canonicalAuthorityEnvelopeBytesSha256,
} satisfies WorkflowBatchExecutionControlAuthorityReceiptV1;

export const batchControlResolvedEnvelopeFixture = {
  receipt_ref: batchControlAuthorityEnvelopeFixture.receipt_ref,
  authority_envelope: batchControlAuthorityEnvelopeFixture,
  canonical_envelope_utf8: canonicalAuthorityEnvelope,
  authority_envelope_hash: batchControlAuthorityEnvelopeFixture.authority_envelope_hash,
  canonical_envelope_bytes_sha256: canonicalAuthorityEnvelopeBytesSha256,
} satisfies WorkflowBatchExecutionControlResolvedEnvelopeV1;

const historyPageProjection = {
  schema_version: 1,
  observation_ref: "observation:history-1",
  pins: batchControlPinsFixture,
  scope: batchControlScopeFixture,
  query_binding: {
    operation: "read_batch_history_page",
    query_id: "query:history-1",
    query_hash: "7".repeat(64),
    read_policy: batchControlReadbackPolicyFixture,
  },
  as_of_batch_head: plannedBatchHead,
  as_of_global_head: batchControlGlobalAfterOpenHeadFixture,
  page: {
    kind: "collection_page",
    cursor_start: null,
    cursor_end: "cursor_end_value1",
    next_cursor: null,
    limit: 100,
    item_count: 1,
    page_hash: "8".repeat(64),
    full_collection_root: "9".repeat(64),
  },
  result: [
    {
      owner_event: batchControlBatchEventFixture,
      authority_envelope_hash: batchControlAuthorityEnvelopeFixture.authority_envelope_hash,
      receipt_ref: batchControlAuthorityEnvelopeFixture.receipt_ref,
    },
  ],
  observed_at: "2026-07-23T00:04:00.000Z",
} as const;

export const batchControlHistoryPageFixture = withReadObservationHash(historyPageProjection);

function readQuery<const Operation extends WorkflowBatchExecutionControlReadOperationV1>(
  operation: Operation,
  suffix: string,
  batch = false,
) {
  return {
    operation,
    schema_version: 1 as const,
    expected_pins: batchControlPinsFixture,
    scope: batchControlScopeFixture,
    query: {
      operation,
      query_id: `query:${suffix}`,
      query_hash: sha256(`query:${suffix}`),
      read_policy: batchControlReadbackPolicyFixture,
    },
    as_of_batch_head: batch ? plannedBatchHead : null,
    as_of_global_head: batchControlGlobalAfterOpenHeadFixture,
  };
}

export const batchControlDescribeCapabilityReadFixture = readQuery(
  "describe_capability",
  "capability-1",
) satisfies WorkflowBatchExecutionControlReadInputV1<"describe_capability">;

export const batchControlSnapshotReadFixture = readQuery(
  "read_batch_snapshot",
  "snapshot-1",
  true,
) satisfies WorkflowBatchExecutionControlReadInputV1<"read_batch_snapshot">;

export const batchControlHistoryReadFixture = {
  ...readQuery("read_batch_history_page", "history-1", true),
  cursor: null,
  limit: 100,
} satisfies WorkflowBatchExecutionControlPageInputV1<"read_batch_history_page">;

export const batchControlGlobalAdmissionReadFixture = readQuery(
  "read_global_admission_snapshot",
  "global-1",
) satisfies WorkflowBatchExecutionControlReadInputV1<"read_global_admission_snapshot">;

export const batchControlUniquenessReadFixture = {
  ...readQuery("read_uniqueness_page", "uniqueness-1"),
  cursor: null,
  limit: 100,
} satisfies WorkflowBatchExecutionControlPageInputV1<"read_uniqueness_page">;

export const batchControlExecutionReceiptsReadFixture = {
  ...readQuery("read_execution_receipts_page", "receipts-1", true),
  cursor: null,
  limit: 100,
} satisfies WorkflowBatchExecutionControlPageInputV1<"read_execution_receipts_page">;

export const batchControlExecutionLifecycleReadFixture = {
  ...readQuery("read_execution_lifecycle", "lifecycle-1", true),
  cursor: null,
  limit: 100,
} satisfies WorkflowBatchExecutionControlPageInputV1<"read_execution_lifecycle">;

const requestOutcomeReadBase = readQuery("read_request_outcome", "outcome-1", true);

export const batchControlRequestOutcomeReadFixture = {
  ...requestOutcomeReadBase,
  query: {
    ...requestOutcomeReadBase.query,
    client_generation_key: openBinding.client_generation_key,
    command_id: batchControlCreateRequestFixture.request_meta.command_id,
    idempotency_key: batchControlCreateRequestFixture.request_meta.idempotency_key,
    request_hash: batchControlCreateRequestFixture.request_meta.request_hash,
  },
} satisfies WorkflowBatchExecutionControlRequestOutcomeInputV1;

export const batchControlReadInputFixtures = [
  batchControlDescribeCapabilityReadFixture,
  batchControlSnapshotReadFixture,
  batchControlHistoryReadFixture,
  batchControlGlobalAdmissionReadFixture,
  batchControlUniquenessReadFixture,
  batchControlExecutionReceiptsReadFixture,
  batchControlExecutionLifecycleReadFixture,
  batchControlRequestOutcomeReadFixture,
] as const;

export const batchControlResolverInputFixture = {
  receipt_ref: batchControlAuthorityEnvelopeFixture.receipt_ref,
  expected_pins: batchControlPinsFixture,
} satisfies WorkflowBatchExecutionControlResolverInputV1;

export const batchControlHostSnapshotFixture = {
  scenario_records: {},
  domain_resolver_keys: [],
  downstream_owners: [],
  standard_events: [],
  platform_events: [],
  allowed_surfaces: [],
  projection_reviews: [],
  host_capabilities: ["workflow_batch_execution_control_v1"],
} satisfies WorkflowHostValidationSnapshot;

export async function invokeBatchControlPortsFixture(input: {
  controller: WorkflowBatchExecutionControllerPortV1;
  readback: WorkflowBatchExecutionReadbackPortV1;
  resolver: WorkflowBatchExecutionReceiptResolverPortV1;
}): Promise<{
  request: WorkflowBatchExecutionControlOpenRequestV1;
  opened: boolean;
  receipt: WorkflowBatchExecutionControlAuthorityReceiptV1 | null;
}> {
  const opened = await input.controller.open_or_resume_batch(batchControlCreateRequestFixture);
  const claimed = await input.controller.invoke(batchControlClaimCommandFixture);
  await input.readback.read_batch_snapshot(batchControlSnapshotReadFixture);
  await input.resolver.resolve_authority_envelope(batchControlResolverInputFixture);

  return {
    request: batchControlCreateRequestFixture,
    opened: opened.ok,
    receipt: claimed.ok ? claimed.value : null,
  };
}
