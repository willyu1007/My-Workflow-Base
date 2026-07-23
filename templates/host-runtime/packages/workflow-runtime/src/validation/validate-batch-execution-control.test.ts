import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  workflowBatchExecutionControlAuthorityEnvelopeDomainPrefixV1,
  workflowBatchExecutionControlBoundsV1 as contractWorkflowBatchExecutionControlBoundsV1,
  workflowBatchExecutionControlReadObservationDomainPrefixV1,
  workflowBatchExecutionControlRequestDomainPrefixV1,
} from "@host/workflow-contracts";
import type {
  WorkflowBatchExecutionControlAuthorityEnvelopeV1,
  WorkflowBatchExecutionControlAuthorityReceiptV1,
  WorkflowBatchExecutionControlBatchEventV1,
  WorkflowBatchExecutionControlBatchHeadV1,
  WorkflowBatchExecutionControlCapabilityDescriptorV1,
  WorkflowBatchExecutionControlCommandV1,
  WorkflowBatchExecutionControlCompletedSnapshotV1,
  WorkflowBatchExecutionControlCreateRequestV1,
  WorkflowBatchExecutionControlExecutionReceiptItemV1,
  WorkflowBatchExecutionControlForwardPolicyDecisionV1,
  WorkflowBatchExecutionControlGlobalEventV1,
  WorkflowBatchExecutionControlGlobalHeadV1,
  WorkflowBatchExecutionControlHistoryItemV1,
  WorkflowBatchExecutionControlOrdinaryClaimV1,
  WorkflowBatchExecutionControlPinsV1,
  WorkflowBatchExecutionControlPlannedSnapshotV1,
  WorkflowBatchExecutionControlQuarantinedSnapshotV1,
  WorkflowBatchExecutionControlReadInputV1,
  WorkflowBatchExecutionControlReadObservationV1,
  WorkflowBatchExecutionControlReadbackPolicyDecisionV1,
  WorkflowBatchExecutionControlReservationV1,
  WorkflowBatchExecutionControlReconciliationClaimV1,
  WorkflowBatchExecutionControlReconciledCompletedSnapshotV1,
  WorkflowBatchExecutionControlRecoveryPolicyDecisionV1,
  WorkflowBatchExecutionControlRequestMetaV1,
  WorkflowBatchExecutionControlResolvedEnvelopeV1,
  WorkflowBatchExecutionControlResolverInputV1,
  WorkflowBatchExecutionControlResumeRequestV1,
  WorkflowBatchExecutionControlReservedRecoverySnapshotV1,
  WorkflowBatchExecutionControlScopeV1,
} from "@host/workflow-contracts";
import {
  createWorkflowBatchExecutionControlAuthorityEnvelopeHashProjectionV1,
  createWorkflowBatchExecutionControlReadObservationHashProjectionV1,
  createWorkflowBatchExecutionControlRequestHashProjectionV1,
  decodeWorkflowBatchExecutionControlJsonV1,
  verifyWorkflowBatchExecutionControlAuthorityReceiptV1,
  verifyWorkflowBatchExecutionControlAuthorityTransitionV1,
  verifyWorkflowBatchExecutionControlCommittedOutcomeResolutionV1,
  verifyWorkflowBatchExecutionControlReadObservationV1,
  verifyWorkflowBatchExecutionControlResolvedEnvelopeV1,
  verifyWorkflowBatchExecutionControlResumeObservationV1,
  workflowBatchExecutionControlBoundsV1,
  type WorkflowBatchExecutionControlDecodeFindingV1,
  type WorkflowBatchExecutionControlDocumentKindV1,
} from "./validate-batch-execution-control.js";

const hashes = {
  a: "a".repeat(64),
  b: "b".repeat(64),
  c: "c".repeat(64),
  d: "d".repeat(64),
  e: "e".repeat(64),
  f: "f".repeat(64),
} as const;
const timestamp = "2026-07-23T00:00:00.000Z";

const pins = {
  capability_family: "workflow_batch_execution_control_v1",
  capability_version: 1,
  contract_revision: "revision-1",
  contract_source_hash: hashes.a,
  canonicalization_profile: "rfc8785_jcs_sha256_v1",
  vector_release_hash: hashes.b,
  owner_namespace: "owner.namespace",
  receipt_issuer: "owner.issuer",
  receipt_audience: "host.audience",
  receipt_authority_id: "authority-1",
  receipt_authority_version: "1",
  owner_deployment_id: "deployment-1",
  owner_deployment_digest: hashes.c,
  ledger_schema_revision: "1",
  trust_mode: "opaque_owner_readback_v1",
} satisfies WorkflowBatchExecutionControlPinsV1;

const scope = { kind: "platform", scope_id: "platform-1" } satisfies WorkflowBatchExecutionControlScopeV1;

const globalBefore = {
  ledger_sequence: "20",
  last_event_hash: hashes.b,
  registry_version: "3",
  admission_root: hashes.a,
  uniqueness_root: hashes.b,
  active_claim_count: 0,
  active_reserved_execution_count: 0,
  lifetime_logical_unit_count: 1,
  lifetime_task_id_count: 0,
  lifetime_execution_id_count: 0,
} satisfies WorkflowBatchExecutionControlGlobalHeadV1;

const globalAfter = {
  ...globalBefore,
  ledger_sequence: "21",
  last_event_hash: hashes.d,
  registry_version: "4",
  active_claim_count: 1,
} satisfies WorkflowBatchExecutionControlGlobalHeadV1;

const batchBefore = {
  owner_batch_id: "batch-1",
  state: "planned",
  snapshot_version: "1",
  ledger_sequence: "10",
  last_event_hash: hashes.a,
} satisfies WorkflowBatchExecutionControlBatchHeadV1<"planned">;

const batchAfter = {
  ...batchBefore,
  snapshot_version: "2",
  ledger_sequence: "11",
  last_event_hash: hashes.c,
} satisfies WorkflowBatchExecutionControlBatchHeadV1<"planned">;

const forwardPolicy = {
  kind: "forward_window",
  decision_ref: "decision-forward-1",
  decision_hash: hashes.a,
  decision_issuer: "policy.issuer",
  decision_audience: "policy.audience",
  not_before: timestamp,
  expires_at: "2026-07-23T01:00:00.000Z",
} satisfies WorkflowBatchExecutionControlForwardPolicyDecisionV1;

const recoveryPolicy = {
  kind: "recovery_policy",
  decision_ref: "decision-recovery-1",
  decision_hash: hashes.b,
  decision_issuer: "policy.issuer",
  decision_audience: "policy.audience",
  not_before: timestamp,
  expires_at: "2026-07-23T01:00:00.000Z",
  expired_forward_decision_ref: forwardPolicy.decision_ref,
} satisfies WorkflowBatchExecutionControlRecoveryPolicyDecisionV1;

const readPolicy = {
  kind: "readback",
  decision_ref: "decision-read-1",
  decision_hash: hashes.c,
  decision_issuer: "policy.issuer",
  decision_audience: "policy.audience",
  not_before: timestamp,
  expires_at: "2026-07-23T01:00:00.000Z",
} satisfies WorkflowBatchExecutionControlReadbackPolicyDecisionV1;

const requestMeta = {
  command_id: "command-1",
  idempotency_key: "idempotency-1",
  correlation_id: "correlation-1",
  request_hash: hashes.e,
} satisfies WorkflowBatchExecutionControlRequestMetaV1;

const logicalUnit = {
  logical_unit_hash: hashes.a,
  execution_binding_hash: hashes.b,
  workload_class_hash: hashes.c,
} as const;

const binding = {
  owner_batch_id: "batch-1",
  client_generation_key: "generation-0",
  logical_series_hash: hashes.a,
  purpose_profile_hash: hashes.b,
  logical_unit_collection_root: hashes.c,
  logical_unit_count: 1,
  binding_hash: hashes.d,
  generation: 0,
  supersession: null,
} as const;

const precondition = {
  kind: "expected_existing",
  expected_binding_hash: binding.binding_hash,
  expected_batch_head: batchBefore,
  expected_global_head: globalBefore,
} as const;

const ordinaryClaim = {
  kind: "ordinary",
  claim_id: "claim-1",
  lease_id: "lease-1",
  fence: "1",
  owner_issued_at: timestamp,
  lease_expires_at: "2026-07-23T00:01:00.000Z",
} satisfies WorkflowBatchExecutionControlOrdinaryClaimV1;

const reconciliationClaim = {
  kind: "reconciliation_only",
  claim_id: "claim-recovery-1",
  lease_id: "lease-recovery-1",
  fence: "2",
  owner_issued_at: timestamp,
  lease_expires_at: "2026-07-23T00:01:00.000Z",
  original_identity_collection_hash: hashes.d,
  recovery_policy: recoveryPolicy,
  allowed_operations: [
    "confirm_client_commit",
    "dispatch_batch",
    "quarantine_reservation",
    "reconcile_batch",
    "release_batch_claim",
    "renew_batch_claim",
  ],
  allowed_operations_hash: hashes.e,
} satisfies WorkflowBatchExecutionControlReconciliationClaimV1;

const reservedRecoveryClaim = {
  ...reconciliationClaim,
  allowed_operations: ["quarantine_reservation", "release_batch_claim", "renew_batch_claim"],
} satisfies WorkflowBatchExecutionControlReconciliationClaimV1;

const sealedRecoveryClaim = {
  ...reconciliationClaim,
  allowed_operations: [
    "confirm_client_commit",
    "dispatch_batch",
    "reconcile_batch",
    "release_batch_claim",
    "renew_batch_claim",
  ],
} satisfies WorkflowBatchExecutionControlReconciliationClaimV1;

const dispatchedRecoveryClaim = {
  ...reconciliationClaim,
  allowed_operations: ["reconcile_batch", "release_batch_claim", "renew_batch_claim"],
} satisfies WorkflowBatchExecutionControlReconciliationClaimV1;

const forwardCommon = {
  schema_version: 1,
  pins,
  scope,
  policy_decision: forwardPolicy,
  request_meta: requestMeta,
  owner_batch_id: "batch-1",
  purpose_profile_hash: binding.purpose_profile_hash,
  precondition,
} as const;

const recoveryCommon = {
  ...forwardCommon,
  policy_decision: recoveryPolicy,
} as const;

const commandFixtureSeeds = [
  {
    ...forwardCommon,
    operation: "claim_batch",
    expected_claim: { kind: "none" },
    payload: { claim_type: "ordinary", requested_ttl_seconds: 60 },
  },
  {
    ...recoveryCommon,
    operation: "claim_batch",
    expected_claim: { kind: "none" },
    payload: {
      claim_type: "reconciliation_only",
      requested_ttl_seconds: 60,
      original_identity_collection_hash: hashes.d,
      requested_operations: ["quarantine_reservation", "reconcile_batch"],
    },
  },
  { ...forwardCommon, operation: "renew_batch_claim", current_claim: ordinaryClaim, payload: { requested_ttl_seconds: 60 } },
  { ...forwardCommon, operation: "release_batch_claim", current_claim: ordinaryClaim, payload: {} },
  {
    ...forwardCommon,
    operation: "reserve_executions",
    current_claim: ordinaryClaim,
    payload: { logical_unit_collection_root: hashes.c, reservation_intent_hash: hashes.d },
  },
  {
    ...forwardCommon,
    operation: "seal_execution_manifest",
    current_claim: ordinaryClaim,
    payload: { reservation_hash: hashes.c, execution_manifest_hash: hashes.d },
  },
  {
    ...forwardCommon,
    operation: "confirm_client_commit",
    current_claim: ordinaryClaim,
    payload: {
      seal_hash: hashes.a,
      execution_manifest_hash: hashes.b,
      client_commit_ref: "client-commit-1",
      client_commit_hash: hashes.c,
    },
  },
  {
    ...forwardCommon,
    operation: "dispatch_batch",
    current_claim: ordinaryClaim,
    payload: { seal_hash: hashes.a, client_commit_hash: hashes.b, execution_manifest_hash: hashes.c },
  },
  {
    ...recoveryCommon,
    operation: "quarantine_reservation",
    current_claim: reservedRecoveryClaim,
    precondition: {
      ...precondition,
      expected_batch_head: {
        ...precondition.expected_batch_head,
        state: "recovery_required_reserved_unsealed",
      },
    },
    payload: {
      reservation_hash: hashes.a,
      original_identity_collection_hash: hashes.d,
      reason_code: "reservation_abandoned",
    },
  },
  {
    ...recoveryCommon,
    operation: "reconcile_batch",
    current_claim: sealedRecoveryClaim,
    precondition: {
      ...precondition,
      expected_batch_head: {
        ...precondition.expected_batch_head,
        state: "recovery_required_sealed_undispatched",
      },
    },
    payload: {
      outcome: "unresolved",
      expected_completion_collection_root: null,
      expected_lifecycle_head: null,
      reason_code: "outcome_unresolved",
    },
  },
] satisfies WorkflowBatchExecutionControlCommandV1[];

const commandFixtures = commandFixtureSeeds.map((command) => withRequestHashForTest(command)) as WorkflowBatchExecutionControlCommandV1[];

const checkedCreateRequestSeed = {
  kind: "create_if_absent",
  operation: "open_or_resume_batch",
  schema_version: 1,
  pins,
  scope,
  policy_decision: forwardPolicy,
  request_meta: requestMeta,
  binding: {
    client_generation_key: binding.client_generation_key,
    logical_series_hash: binding.logical_series_hash,
    purpose_profile_hash: binding.purpose_profile_hash,
    logical_unit_collection_root: binding.logical_unit_collection_root,
    logical_unit_count: 1,
    binding_hash: binding.binding_hash,
    generation: 0,
    supersession: null,
    logical_units: [logicalUnit],
  },
  precondition: { kind: "expected_absent", expected_global_head: globalBefore },
} satisfies WorkflowBatchExecutionControlCreateRequestV1;

const checkedCreateRequest = withRequestHashForTest(checkedCreateRequestSeed);

const resumeRequest = {
  kind: "resume_existing",
  operation: "open_or_resume_batch",
  schema_version: 1,
  expected_pins: pins,
  scope,
  client_generation_key: binding.client_generation_key,
  query: {
    operation: "read_batch_snapshot",
    query_id: "query-resume-1",
    query_hash: hashes.a,
    read_policy: readPolicy,
  },
  precondition,
} satisfies WorkflowBatchExecutionControlResumeRequestV1;

const plannedSnapshot = {
  schema_version: 1,
  pins,
  scope,
  state: "planned",
  binding,
  logical_units: [logicalUnit],
  batch_head: batchAfter,
  global_head: globalAfter,
  snapshot_hash: hashes.f,
  claim: ordinaryClaim,
} satisfies WorkflowBatchExecutionControlPlannedSnapshotV1;

const reservation = {
  reservation_id: "reservation-1",
  logical_unit_collection_root: binding.logical_unit_collection_root,
  identity_collection_hash: hashes.d,
  allocations: [
    {
      ...logicalUnit,
      owner_task_id: "task-1",
      owner_execution_id: "execution-1",
    },
  ],
  allocation_count: 1,
  reserved_at: timestamp,
  reservation_hash: hashes.a,
} satisfies WorkflowBatchExecutionControlReservationV1;

const seal = {
  seal_id: "seal-1",
  reservation_hash: reservation.reservation_hash,
  execution_manifest_hash: hashes.b,
  allocation_count: 1,
  sealed_at: timestamp,
  seal_hash: hashes.c,
} as const;

const clientCommit = {
  client_commit_ref: "client-commit-1",
  client_commit_hash: hashes.d,
  execution_manifest_hash: seal.execution_manifest_hash,
  confirmed_at: timestamp,
} as const;

const dispatch = {
  dispatch_id: "dispatch-1",
  seal_hash: seal.seal_hash,
  client_commit_hash: clientCommit.client_commit_hash,
  execution_manifest_hash: seal.execution_manifest_hash,
  dispatch_commit_hash: hashes.e,
  outbox_intent_root: hashes.f,
  recorded_before_effect: true,
  recorded_at: timestamp,
} as const;

const dispatchEffect = {
  kind: "started",
  dispatch_commit_hash: dispatch.dispatch_commit_hash,
  effect_started_at: timestamp,
  effect_observation_hash: hashes.a,
} as const;

const completion = {
  kind: "all_terminal",
  receipt_count: 1,
  expected_count: 1,
  collection_root: hashes.b,
  lifecycle_head: hashes.c,
} as const;

const noCompletion = {
  kind: "none",
  receipt_count: 0,
  expected_count: 1,
  collection_root: hashes.a,
} as const;

const recordedDispatchEffect = {
  kind: "recorded",
  dispatch_commit_hash: dispatch.dispatch_commit_hash,
} as const;

const reservationActiveGlobalAfter = {
  ...globalAfter,
  active_reserved_execution_count: 1,
  lifetime_task_id_count: 1,
  lifetime_execution_id_count: 1,
} as const;

const reservationTerminalGlobalAfter = {
  ...globalAfter,
  lifetime_task_id_count: 1,
  lifetime_execution_id_count: 1,
} as const;

const plannedNoClaimSnapshot = { ...plannedSnapshot, claim: { kind: "none" } } as const;
const reservedSnapshot = {
  ...plannedSnapshot,
  state: "executions_reserved",
  batch_head: { ...batchAfter, state: "executions_reserved" },
  global_head: reservationActiveGlobalAfter,
  reservation,
} as const;
const sealedSnapshot = {
  ...reservedSnapshot,
  state: "executions_sealed",
  batch_head: { ...batchAfter, state: "executions_sealed" },
  seal,
} as const;
const clientCommitSnapshot = {
  ...sealedSnapshot,
  state: "client_commit_confirmed",
  batch_head: { ...batchAfter, state: "client_commit_confirmed" },
  client_commit: clientCommit,
} as const;
const dispatchRecordedSnapshot = {
  ...clientCommitSnapshot,
  state: "dispatch_recorded",
  batch_head: { ...batchAfter, state: "dispatch_recorded" },
  dispatch,
  dispatch_effect_status: recordedDispatchEffect,
  completion_status: noCompletion,
} as const;
const awaitingSnapshot = {
  ...dispatchRecordedSnapshot,
  state: "awaiting_completion",
  batch_head: { ...batchAfter, state: "awaiting_completion" },
  dispatch_effect_status: dispatchEffect,
} as const;

const completedBatchHead = { ...batchAfter, state: "completed" } as const;
const completedSnapshot = {
  ...plannedSnapshot,
  state: "completed",
  batch_head: completedBatchHead,
  global_head: reservationTerminalGlobalAfter,
  claim: { kind: "none" },
  reservation,
  seal,
  client_commit: clientCommit,
  dispatch,
  dispatch_effect_status: dispatchEffect,
  completion_status: completion,
} satisfies WorkflowBatchExecutionControlCompletedSnapshotV1;

const recovery = {
  recovery_id: "recovery-1",
  origin_state: "dispatch_recorded",
  original_identity_collection_hash: reservation.identity_collection_hash,
  entered_at: timestamp,
  recovery_hash: hashes.e,
} as const;

const sealedRecovery = {
  ...recovery,
  origin_state: "executions_sealed",
} as const;

const sealedRecoverySnapshot = {
  ...sealedSnapshot,
  state: "recovery_required_sealed_undispatched",
  batch_head: { ...batchAfter, state: "recovery_required_sealed_undispatched" },
  claim: sealedRecoveryClaim,
  client_commit_status: { kind: "not_confirmed" },
  recovery: sealedRecovery,
} as const;

const confirmedSealedRecoverySnapshot = {
  ...sealedRecoverySnapshot,
  client_commit_status: { kind: "confirmed", ...clientCommit },
} as const;

const dispatchedRecoverySnapshot = {
  ...clientCommitSnapshot,
  state: "recovery_required_dispatched",
  batch_head: { ...batchAfter, state: "recovery_required_dispatched" },
  claim: dispatchedRecoveryClaim,
  dispatch,
  dispatch_effect_status: recordedDispatchEffect,
  completion_status: noCompletion,
  recovery: sealedRecovery,
} as const;

const awaitingOriginRecoverySnapshot = {
  ...dispatchedRecoverySnapshot,
  dispatch_effect_status: dispatchEffect,
  recovery: { ...recovery, origin_state: "awaiting_completion" },
} as const;

const dispatchedUnresolvedSnapshot = {
  ...dispatchedRecoverySnapshot,
  state: "reconciled_unresolved",
  batch_head: { ...batchAfter, state: "reconciled_unresolved" },
  reconciliation_origin: "dispatched",
  claim: { kind: "none" },
  dispatch_effect_status: dispatchEffect,
  completion_status: completion,
  reconciliation: {
    reconciliation_id: "reconciliation-unresolved-dispatched-1",
    outcome: "unresolved",
    original_identity_collection_hash: reservation.identity_collection_hash,
    completion_collection_root: completion.collection_root,
    lifecycle_head: completion.lifecycle_head,
    reason_code: "outcome_unresolved",
    reconciled_at: timestamp,
    reconciliation_hash: hashes.f,
  },
} as const;

const sealedUnresolvedSnapshot = {
  ...sealedRecoverySnapshot,
  state: "reconciled_unresolved",
  batch_head: { ...batchAfter, state: "reconciled_unresolved" },
  reconciliation_origin: "sealed_undispatched",
  claim: { kind: "none" },
  reconciliation: {
    reconciliation_id: "reconciliation-unresolved-sealed-1",
    outcome: "unresolved",
    original_identity_collection_hash: reservation.identity_collection_hash,
    completion_collection_root: null,
    lifecycle_head: null,
    reason_code: "outcome_unresolved",
    reconciled_at: timestamp,
    reconciliation_hash: hashes.f,
  },
} as const;

const reconciledCompletedSnapshot = {
  ...completedSnapshot,
  state: "reconciled_completed",
  batch_head: { ...completedBatchHead, state: "reconciled_completed" },
  recovery,
  reconciliation: {
    reconciliation_id: "reconciliation-1",
    outcome: "completed",
    original_identity_collection_hash: reservation.identity_collection_hash,
    completion_collection_root: completion.collection_root,
    lifecycle_head: completion.lifecycle_head,
    reason_code: "owner_reconciled",
    reconciled_at: timestamp,
    reconciliation_hash: hashes.f,
  },
} satisfies WorkflowBatchExecutionControlReconciledCompletedSnapshotV1;

const reservedRecoverySnapshot = {
  ...plannedSnapshot,
  state: "recovery_required_reserved_unsealed",
  batch_head: { ...batchAfter, state: "recovery_required_reserved_unsealed" },
  global_head: reservationActiveGlobalAfter,
  claim: reservedRecoveryClaim,
  reservation,
  recovery: {
    ...recovery,
    origin_state: "executions_reserved",
  },
} satisfies WorkflowBatchExecutionControlReservedRecoverySnapshotV1;

const quarantinedSnapshot = {
  ...reservedRecoverySnapshot,
  state: "quarantined_cancelled",
  batch_head: { ...batchAfter, state: "quarantined_cancelled" },
  global_head: reservationTerminalGlobalAfter,
  claim: { kind: "none" },
  tombstone: {
    tombstone_id: "tombstone-1",
    reservation_hash: reservation.reservation_hash,
    original_identity_collection_hash: reservation.identity_collection_hash,
    reason_code: "reservation_quarantined",
    cancelled_at: timestamp,
    tombstone_hash: hashes.f,
  },
} satisfies WorkflowBatchExecutionControlQuarantinedSnapshotV1;

const capacityDelta = {
  active_claim_count: 1,
  active_reserved_execution_count: 0,
  lifetime_logical_unit_count: 0,
  lifetime_task_id_count: 0,
  lifetime_execution_id_count: 0,
} as const;

const causation = {
  kind: "client_command",
  command_id: requestMeta.command_id,
  idempotency_key: requestMeta.idempotency_key,
  request_hash: requestMeta.request_hash,
} as const;

const batchEvent = {
  event_id: "batch-event-11",
  event_type: "batch_claimed",
  causation,
  stream: { kind: "batch", owner_batch_id: "batch-1" },
  ledger_sequence: batchAfter.ledger_sequence,
  previous_event_hash: batchBefore.last_event_hash,
  owner_event_at: timestamp,
  capacity_delta: capacityDelta,
  fact_root: plannedSnapshot.snapshot_hash,
  event_hash: hashes.c,
} satisfies WorkflowBatchExecutionControlBatchEventV1;

const globalEvent = {
  event_id: "global-event-21",
  event_type: "global_capacity_changed",
  causation,
  stream: { kind: "global", owner_namespace: pins.owner_namespace },
  ledger_sequence: globalAfter.ledger_sequence,
  previous_event_hash: globalBefore.last_event_hash,
  owner_event_at: timestamp,
  capacity_delta: capacityDelta,
  fact_root: globalAfter.admission_root,
  event_hash: hashes.d,
} satisfies WorkflowBatchExecutionControlGlobalEventV1;

const authorityEnvelopeSeed = {
  schema_version: 1,
  receipt_ref: "receipt-1",
  pins,
  scope,
  causation,
  before_batch_head: batchBefore,
  after_batch_head: batchAfter,
  before_global_head: globalBefore,
  after_global_head: globalAfter,
  batch_event: batchEvent,
  global_event: globalEvent,
  capacity_delta: capacityDelta,
  result_snapshot: plannedSnapshot,
  dispatch_commit_hash: null,
  owner_issued_at: timestamp,
  authority_envelope_hash: hashes.e,
} satisfies WorkflowBatchExecutionControlAuthorityEnvelopeV1;

const authorityEnvelope = withAuthorityEnvelopeHashForTest(authorityEnvelopeSeed);

const readQuery = {
  operation: "read_batch_snapshot",
  schema_version: 1,
  expected_pins: pins,
  scope,
  query: { operation: "read_batch_snapshot", query_id: "query-1", query_hash: hashes.a, read_policy: readPolicy },
  as_of_batch_head: batchAfter,
  as_of_global_head: globalAfter,
} satisfies WorkflowBatchExecutionControlReadInputV1<"read_batch_snapshot">;

const readObservationSeed = {
  schema_version: 1,
  observation_ref: "observation-1",
  pins,
  scope,
  query_binding: readQuery.query,
  as_of_batch_head: batchAfter,
  as_of_global_head: globalAfter,
  page: {
    kind: "singleton",
    cursor_start: null,
    cursor_end: null,
    limit: 1,
    item_count: 1,
    page_hash: hashes.a,
    full_collection_root: hashes.b,
  },
  result: plannedSnapshot,
  observed_at: timestamp,
  read_observation_hash: hashes.c,
} satisfies WorkflowBatchExecutionControlReadObservationV1<WorkflowBatchExecutionControlPlannedSnapshotV1>;

const readObservation = withReadObservationHashForTest(readObservationSeed);

const executionReceipts = [
  {
    owner_execution_id: "execution-1",
    terminal_status: "succeeded",
    receipt_ref: "execution-receipt-1",
    receipt_hash: hashes.a,
    owner_completed_at: timestamp,
    output_effect_hash: hashes.b,
    failure_reason_code: null,
  },
  {
    owner_execution_id: "execution-2",
    terminal_status: "failed",
    receipt_ref: "execution-receipt-2",
    receipt_hash: hashes.c,
    owner_completed_at: timestamp,
    output_effect_hash: null,
    failure_reason_code: "owner_failed",
  },
  {
    owner_execution_id: "execution-3",
    terminal_status: "cancelled",
    receipt_ref: "execution-receipt-3",
    receipt_hash: hashes.d,
    owner_completed_at: timestamp,
    output_effect_hash: null,
    failure_reason_code: "owner_cancelled",
  },
] satisfies WorkflowBatchExecutionControlExecutionReceiptItemV1[];

function clone<T>(value: T): T {
  return structuredClone(value);
}

function canonicalizeForTest(value: unknown): string {
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalizeForTest).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalizeForTest(record[key])}`)
    .join(",")}}`;
}

function sha256ForTest(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function domainHashForTest(prefix: string, projection: unknown): string {
  return sha256ForTest(`${prefix}${canonicalizeForTest(projection)}`);
}

function withRequestHashForTest<T>(value: T): T {
  const candidate = structuredClone(value) as T;
  const projection = expectProjection(createWorkflowBatchExecutionControlRequestHashProjectionV1(candidate));
  const requestMetaForHash = (candidate as Record<string, unknown>).request_meta as Record<string, unknown>;
  requestMetaForHash.request_hash = domainHashForTest(workflowBatchExecutionControlRequestDomainPrefixV1, projection);
  return candidate;
}

function withAuthorityEnvelopeHashForTest<T>(value: T): T {
  const candidate = structuredClone(value) as T;
  const projection = expectProjection(createWorkflowBatchExecutionControlAuthorityEnvelopeHashProjectionV1(candidate));
  (candidate as Record<string, unknown>).authority_envelope_hash = domainHashForTest(
    workflowBatchExecutionControlAuthorityEnvelopeDomainPrefixV1,
    projection,
  );
  return candidate;
}

function withReadObservationHashForTest<T>(value: T): T {
  const candidate = structuredClone(value) as T;
  const projection = expectProjection(createWorkflowBatchExecutionControlReadObservationHashProjectionV1(candidate));
  (candidate as Record<string, unknown>).read_observation_hash = domainHashForTest(
    workflowBatchExecutionControlReadObservationDomainPrefixV1,
    projection,
  );
  return candidate;
}

function observationSeedForSnapshot(snapshot: Record<string, unknown>): Record<string, unknown> {
  return {
    ...readObservation,
    as_of_batch_head: snapshot.batch_head,
    as_of_global_head: snapshot.global_head,
    result: snapshot,
  };
}

function observationForSnapshot(snapshot: Record<string, unknown>): Record<string, unknown> {
  return withReadObservationHashForTest(observationSeedForSnapshot(snapshot));
}

function authorityTransitionPairForTest(
  beforeSnapshot: Record<string, unknown> | null,
  eventType: string,
  afterSnapshot: Record<string, unknown>,
  causationKind: "client_command" | "owner_worker" | "watchdog",
): {
  beforeObservation: Record<string, unknown> | null;
  receipt: WorkflowBatchExecutionControlAuthorityReceiptV1;
} {
  const envelope = envelopeForTransition(
    eventType,
    beforeSnapshot === null ? null : (beforeSnapshot.state as string),
    afterSnapshot,
    causationKind,
  );
  if (beforeSnapshot === null) {
    return { beforeObservation: null, receipt: authorityReceiptForEnvelope(envelope) };
  }
  const fixedBefore = clone(beforeSnapshot);
  fixedBefore.batch_head = envelope.before_batch_head;
  fixedBefore.global_head = envelope.before_global_head;
  return {
    beforeObservation: observationForSnapshot(fixedBefore),
    receipt: authorityReceiptForEnvelope(envelope),
  };
}

function causationForTest(kind: "client_command" | "owner_worker" | "watchdog"): Record<string, unknown> {
  return kind === "client_command"
    ? { ...causation }
    : { kind, internal_idempotency_key: `${kind}-idempotency-1` };
}

function capacityDeltaForTransition(eventType: string, snapshot: Record<string, unknown>): Record<string, number> {
  const zero = {
    active_claim_count: 0,
    active_reserved_execution_count: 0,
    lifetime_logical_unit_count: 0,
    lifetime_task_id_count: 0,
    lifetime_execution_id_count: 0,
  };
  const reservationCount = Object.hasOwn(snapshot, "reservation")
    ? (((snapshot.reservation as Record<string, unknown>).allocation_count as number) ?? 0)
    : 0;
  if (eventType === "batch_opened") {
    return { ...zero, lifetime_logical_unit_count: (snapshot.binding as Record<string, unknown>).logical_unit_count as number };
  }
  if (eventType === "batch_claimed") return { ...zero, active_claim_count: 1 };
  if (eventType === "executions_reserved") {
    return {
      ...zero,
      active_reserved_execution_count: reservationCount,
      lifetime_task_id_count: reservationCount,
      lifetime_execution_id_count: reservationCount,
    };
  }
  if (eventType === "batch_claim_released" || eventType === "claim_expired") {
    return { ...zero, active_claim_count: -1 };
  }
  if (eventType === "reservation_quarantined" || eventType === "batch_reconciled") {
    return { ...zero, active_claim_count: -1, active_reserved_execution_count: -reservationCount };
  }
  if (eventType === "execution_completion_recorded" && snapshot.state === "completed") {
    return { ...zero, active_claim_count: -1, active_reserved_execution_count: -reservationCount };
  }
  return zero;
}

function envelopeForTransition(
  eventType: string,
  beforeState: string | null,
  resultSnapshot: Record<string, unknown>,
  causationKind: "client_command" | "owner_worker" | "watchdog",
): Record<string, unknown> {
  const result = structuredClone(resultSnapshot);
  const afterState = result.state as string;
  const eventCausation = causationForTest(causationKind);
  const beforeGlobal = {
    ...globalBefore,
    active_claim_count: 10,
    active_reserved_execution_count: 10,
    lifetime_logical_unit_count: 100,
    lifetime_task_id_count: 100,
    lifetime_execution_id_count: 100,
  };
  const delta = capacityDeltaForTransition(eventType, result);
  const afterGlobal = {
    ...beforeGlobal,
    ledger_sequence: "21",
    last_event_hash: hashes.d,
    registry_version: "4",
    active_claim_count: beforeGlobal.active_claim_count + delta.active_claim_count,
    active_reserved_execution_count:
      beforeGlobal.active_reserved_execution_count + delta.active_reserved_execution_count,
    lifetime_logical_unit_count: beforeGlobal.lifetime_logical_unit_count + delta.lifetime_logical_unit_count,
    lifetime_task_id_count: beforeGlobal.lifetime_task_id_count + delta.lifetime_task_id_count,
    lifetime_execution_id_count: beforeGlobal.lifetime_execution_id_count + delta.lifetime_execution_id_count,
  };
  const beforeBatch =
    beforeState === null
      ? null
      : {
          owner_batch_id: "batch-1",
          state: beforeState,
          snapshot_version: "10",
          ledger_sequence: "10",
          last_event_hash: hashes.a,
        };
  const afterBatch = {
    owner_batch_id: "batch-1",
    state: afterState,
    snapshot_version: beforeState === null ? "1" : "11",
    ledger_sequence: beforeState === null ? "1" : "11",
    last_event_hash: hashes.c,
  };
  result.batch_head = afterBatch;
  result.global_head = afterGlobal;
  return withAuthorityEnvelopeHashForTest({
    schema_version: 1,
    receipt_ref: `receipt-${eventType}`,
    pins,
    scope,
    causation: eventCausation,
    before_batch_head: beforeBatch,
    after_batch_head: afterBatch,
    before_global_head: beforeGlobal,
    after_global_head: afterGlobal,
    batch_event: {
      event_id: `batch-event-${eventType}`,
      event_type: eventType,
      causation: eventCausation,
      stream: { kind: "batch", owner_batch_id: "batch-1" },
      ledger_sequence: afterBatch.ledger_sequence,
      previous_event_hash: beforeBatch?.last_event_hash ?? null,
      owner_event_at: timestamp,
      capacity_delta: delta,
      fact_root: result.snapshot_hash,
      event_hash: hashes.c,
    },
    global_event: {
      event_id: `global-event-${eventType}`,
      event_type: "global_capacity_changed",
      causation: eventCausation,
      stream: { kind: "global", owner_namespace: pins.owner_namespace },
      ledger_sequence: afterGlobal.ledger_sequence,
      previous_event_hash: beforeGlobal.last_event_hash,
      owner_event_at: timestamp,
      capacity_delta: delta,
      fact_root: afterGlobal.admission_root,
      event_hash: hashes.d,
    },
    capacity_delta: delta,
    result_snapshot: result,
    dispatch_commit_hash: Object.hasOwn(result, "dispatch")
      ? (result.dispatch as Record<string, unknown>).dispatch_commit_hash
      : null,
    owner_issued_at: timestamp,
    authority_envelope_hash: hashes.e,
  });
}

function authorityReceiptForEnvelope(
  envelope: Record<string, unknown>,
): WorkflowBatchExecutionControlAuthorityReceiptV1 {
  const canonicalEnvelope = canonicalizeForTest(envelope);
  return {
    receipt_ref: envelope.receipt_ref as string,
    authority_envelope: envelope as WorkflowBatchExecutionControlAuthorityEnvelopeV1,
    canonical_envelope_utf8: canonicalEnvelope,
    authority_envelope_hash: envelope.authority_envelope_hash as string,
    canonical_envelope_bytes_sha256: sha256ForTest(Buffer.from(canonicalEnvelope, "utf8")),
  };
}

function rebindReceiptCausationForTest(
  receipt: WorkflowBatchExecutionControlAuthorityReceiptV1,
  request: WorkflowBatchExecutionControlCreateRequestV1 | WorkflowBatchExecutionControlCommandV1,
): WorkflowBatchExecutionControlAuthorityReceiptV1 {
  const envelope = clone(receipt.authority_envelope) as unknown as Record<string, unknown>;
  const requestCausation = {
    kind: "client_command",
    command_id: request.request_meta.command_id,
    idempotency_key: request.request_meta.idempotency_key,
    request_hash: request.request_meta.request_hash,
  };
  envelope.causation = requestCausation;
  (envelope.batch_event as Record<string, unknown>).causation = requestCausation;
  (envelope.global_event as Record<string, unknown>).causation = requestCausation;
  return authorityReceiptForEnvelope(withAuthorityEnvelopeHashForTest(envelope));
}

function authorityPairForRequest(
  requestSeed: WorkflowBatchExecutionControlCreateRequestV1 | WorkflowBatchExecutionControlCommandV1,
  eventType: string,
  beforeState: string | null,
  resultSnapshot: Record<string, unknown>,
): {
  request: WorkflowBatchExecutionControlCreateRequestV1 | WorkflowBatchExecutionControlCommandV1;
  receipt: WorkflowBatchExecutionControlAuthorityReceiptV1;
} {
  const envelope = envelopeForTransition(eventType, beforeState, resultSnapshot, "client_command");
  const requestWithHeads = clone(requestSeed) as unknown as Record<string, unknown>;
  const precondition = requestWithHeads.precondition as Record<string, unknown>;
  precondition.expected_global_head = envelope.before_global_head;
  if (requestWithHeads.kind !== "create_if_absent") {
    precondition.expected_batch_head = envelope.before_batch_head;
  }
  const request = withRequestHashForTest(requestWithHeads) as
    | WorkflowBatchExecutionControlCreateRequestV1
    | WorkflowBatchExecutionControlCommandV1;
  const receipt = rebindReceiptCausationForTest(
    authorityReceiptForEnvelope(envelope),
    request,
  );
  return { request, receipt };
}

function mutationFixtureForPair(
  operation: WorkflowBatchExecutionControlCommandV1["operation"],
  resultSnapshot: Record<string, unknown>,
): WorkflowBatchExecutionControlCommandV1 {
  const source = commandFixtures.find((command) => command.operation === operation);
  if (source === undefined) throw new Error(`Missing command fixture for ${operation}.`);
  const command = clone(source) as unknown as Record<string, unknown>;
  const payload = command.payload as Record<string, unknown>;
  switch (operation) {
    case "reserve_executions":
      payload.logical_unit_collection_root = (resultSnapshot.reservation as Record<string, unknown>)
        .logical_unit_collection_root;
      break;
    case "seal_execution_manifest": {
      const result = resultSnapshot.seal as Record<string, unknown>;
      payload.reservation_hash = result.reservation_hash;
      payload.execution_manifest_hash = result.execution_manifest_hash;
      break;
    }
    case "confirm_client_commit": {
      const resultSeal = resultSnapshot.seal as Record<string, unknown>;
      const resultCommit = (resultSnapshot.client_commit ?? resultSnapshot.client_commit_status) as Record<string, unknown>;
      payload.seal_hash = resultSeal.seal_hash;
      payload.execution_manifest_hash = resultCommit.execution_manifest_hash;
      payload.client_commit_ref = resultCommit.client_commit_ref;
      payload.client_commit_hash = resultCommit.client_commit_hash;
      break;
    }
    case "dispatch_batch": {
      const result = resultSnapshot.dispatch as Record<string, unknown>;
      payload.seal_hash = result.seal_hash;
      payload.client_commit_hash = result.client_commit_hash;
      payload.execution_manifest_hash = result.execution_manifest_hash;
      break;
    }
    case "quarantine_reservation": {
      const result = resultSnapshot.tombstone as Record<string, unknown>;
      payload.reservation_hash = result.reservation_hash;
      payload.original_identity_collection_hash = result.original_identity_collection_hash;
      payload.reason_code = result.reason_code;
      break;
    }
    case "reconcile_batch": {
      const result = resultSnapshot.reconciliation as Record<string, unknown>;
      payload.outcome = result.outcome;
      payload.expected_completion_collection_root = result.completion_collection_root;
      payload.expected_lifecycle_head = result.lifecycle_head;
      payload.reason_code = result.reason_code;
      break;
    }
  }
  if (operation === "renew_batch_claim") {
    command.current_claim = {
      ...(resultSnapshot.claim as Record<string, unknown>),
      owner_issued_at: "2026-07-22T23:59:30.000Z",
      lease_expires_at: "2026-07-23T00:00:30.000Z",
    };
  } else if (
    Object.hasOwn(command, "current_claim") &&
    !["release_batch_claim", "quarantine_reservation", "reconcile_batch"].includes(operation)
  ) {
    command.current_claim = resultSnapshot.claim;
  }
  return withRequestHashForTest(command) as WorkflowBatchExecutionControlCommandV1;
}

function authorityPairCasesForTest(): Array<{
  name: string;
  request: WorkflowBatchExecutionControlCreateRequestV1 | WorkflowBatchExecutionControlCommandV1;
  receipt: WorkflowBatchExecutionControlAuthorityReceiptV1;
}> {
  const cases: Array<[
    WorkflowBatchExecutionControlCommandV1["operation"],
    string,
    string,
    Record<string, unknown>,
  ]> = [
    ["claim_batch", "batch_claimed", "planned", plannedSnapshot as unknown as Record<string, unknown>],
    ["renew_batch_claim", "batch_claim_renewed", "planned", plannedSnapshot as unknown as Record<string, unknown>],
    ["release_batch_claim", "batch_claim_released", "planned", plannedNoClaimSnapshot as unknown as Record<string, unknown>],
    ["reserve_executions", "executions_reserved", "planned", reservedSnapshot as unknown as Record<string, unknown>],
    ["seal_execution_manifest", "execution_manifest_sealed", "executions_reserved", sealedSnapshot as unknown as Record<string, unknown>],
    ["confirm_client_commit", "client_commit_confirmed", "executions_sealed", clientCommitSnapshot as unknown as Record<string, unknown>],
    ["dispatch_batch", "dispatch_recorded", "client_commit_confirmed", dispatchRecordedSnapshot as unknown as Record<string, unknown>],
    ["quarantine_reservation", "reservation_quarantined", "recovery_required_reserved_unsealed", quarantinedSnapshot as unknown as Record<string, unknown>],
    ["reconcile_batch", "batch_reconciled", "recovery_required_sealed_undispatched", sealedUnresolvedSnapshot as unknown as Record<string, unknown>],
  ];
  const createPair = authorityPairForRequest(
    checkedCreateRequest,
    "batch_opened",
    null,
    plannedNoClaimSnapshot as unknown as Record<string, unknown>,
  );
  return [
    { name: "create_if_absent", ...createPair },
    ...cases.map(([operation, eventType, beforeState, snapshot]) => ({
      name: operation,
      ...authorityPairForRequest(
        mutationFixtureForPair(operation, snapshot),
        eventType,
        beforeState,
        snapshot,
      ),
    })),
  ];
}

function decodeFailure(
  input: string,
  kind: WorkflowBatchExecutionControlDocumentKindV1,
): WorkflowBatchExecutionControlDecodeFindingV1 {
  const result = decodeWorkflowBatchExecutionControlJsonV1(input, kind);
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error("Expected strict decoding to fail.");
  return result.findings[0];
}

function expectProjection(result: ReturnType<typeof createWorkflowBatchExecutionControlRequestHashProjectionV1>): Record<string, unknown> {
  if (!result.ok) throw new Error(JSON.stringify(result.findings));
  expect(result.ok).toBe(true);
  return result.value as Record<string, unknown>;
}

describe("decodeWorkflowBatchExecutionControlJsonV1", () => {
  it("accepts current typed create/resume/read/envelope/observation DTOs and every mutation operation", () => {
    expect(decodeWorkflowBatchExecutionControlJsonV1(JSON.stringify(checkedCreateRequest), "open_input").ok).toBe(true);
    expect(decodeWorkflowBatchExecutionControlJsonV1(JSON.stringify(resumeRequest), "open_input").ok).toBe(true);
    for (const command of commandFixtures) {
      expect(decodeWorkflowBatchExecutionControlJsonV1(JSON.stringify(command), "mutation_command")).toEqual(
        expect.objectContaining({ ok: true }),
      );
    }
    expect(decodeWorkflowBatchExecutionControlJsonV1(JSON.stringify(readQuery), "read_query").ok).toBe(true);
    expect(decodeWorkflowBatchExecutionControlJsonV1(JSON.stringify(authorityEnvelope), "authority_envelope").ok).toBe(true);
    expect(decodeWorkflowBatchExecutionControlJsonV1(JSON.stringify(readObservation), "read_observation").ok).toBe(true);
  });

  it("rejects claim fence zero", () => {
    const zeroFenceObservation = clone(readObservation) as unknown as Record<string, unknown>;
    (((zeroFenceObservation.result as Record<string, unknown>).claim) as Record<string, unknown>).fence = "0";
    expect(
      decodeFailure(
        JSON.stringify(zeroFenceObservation),
        "read_observation",
      ),
    ).toMatchObject({
      code: "invalid_scalar",
      path: "$.result.claim.fence",
    });
  });

  it("strictly decodes authority receipts and pairs create plus every mutation operation", () => {
    const cases = authorityPairCasesForTest();
    expect(cases).toHaveLength(10);
    for (const { name, request, receipt } of cases) {
      expect(
        decodeWorkflowBatchExecutionControlJsonV1(JSON.stringify(receipt), "authority_receipt"),
        name,
      ).toMatchObject({ ok: true });
      expect(
        verifyWorkflowBatchExecutionControlAuthorityReceiptV1(request, receipt),
        name,
      ).toMatchObject({ ok: true });
    }
  });

  it("rejects authority-receipt wrapper tampering and request/receipt cross-pairing", () => {
    const [createPair, claimPair, renewPair] = authorityPairCasesForTest();
    for (const [field, value] of [
      ["receipt_ref", "receipt-other"],
      ["authority_envelope_hash", hashes.a],
      ["canonical_envelope_utf8", `${createPair.receipt.canonical_envelope_utf8} `],
      ["canonical_envelope_bytes_sha256", hashes.a],
    ] as const) {
      const tampered = { ...createPair.receipt, [field]: value };
      expect(decodeWorkflowBatchExecutionControlJsonV1(JSON.stringify(tampered), "authority_receipt")).toMatchObject({
        ok: false,
      });
    }
    const innerHashTamper = clone(createPair.receipt) as unknown as Record<string, unknown>;
    (innerHashTamper.authority_envelope as Record<string, unknown>).authority_envelope_hash = hashes.a;
    expect(decodeWorkflowBatchExecutionControlJsonV1(JSON.stringify(innerHashTamper), "authority_receipt")).toMatchObject({
      ok: false,
    });

    expect(
      verifyWorkflowBatchExecutionControlAuthorityReceiptV1(claimPair.request, renewPair.receipt),
    ).toMatchObject({ ok: false });
    const reboundWrongOperation = rebindReceiptCausationForTest(renewPair.receipt, claimPair.request);
    expect(
      verifyWorkflowBatchExecutionControlAuthorityReceiptV1(claimPair.request, reboundWrongOperation),
    ).toMatchObject({
      ok: false,
      findings: [expect.objectContaining({ path: "$.receipt.authority_envelope.batch_event.event_type" })],
    });
  });

  it("rejects independently rebound request pins, scope, heads, binding, purpose, and claim authority", () => {
    const [createPair, claimPair, , , reservePair] = authorityPairCasesForTest();
    const expectReboundReject = (
      pair: typeof createPair,
      mutate: (request: Record<string, unknown>) => void,
      expectedPath: string,
    ): void => {
      const requestSeed = clone(pair.request) as unknown as Record<string, unknown>;
      mutate(requestSeed);
      const request = withRequestHashForTest(requestSeed) as
        | WorkflowBatchExecutionControlCreateRequestV1
        | WorkflowBatchExecutionControlCommandV1;
      const receipt = rebindReceiptCausationForTest(pair.receipt, request);
      expect(verifyWorkflowBatchExecutionControlAuthorityReceiptV1(request, receipt)).toMatchObject({
        ok: false,
        findings: [expect.objectContaining({ path: expectedPath })],
      });
    };

    expectReboundReject(createPair, (request) => {
      (request.pins as Record<string, unknown>).contract_revision = "other-revision";
    }, "$.receipt.authority_envelope.pins");
    expectReboundReject(createPair, (request) => {
      (request.scope as Record<string, unknown>).scope_id = "other-scope";
    }, "$.receipt.authority_envelope.scope");
    expectReboundReject(createPair, (request) => {
      const preconditionRecord = request.precondition as Record<string, unknown>;
      (preconditionRecord.expected_global_head as Record<string, unknown>).admission_root = hashes.f;
    }, "$.receipt.authority_envelope.before_global_head");
    expectReboundReject(createPair, (request) => {
      (request.binding as Record<string, unknown>).logical_series_hash = hashes.f;
    }, "$.receipt.authority_envelope.result_snapshot.binding");
    expectReboundReject(createPair, (request) => {
      const units = (request.binding as Record<string, unknown>).logical_units as Array<Record<string, unknown>>;
      units[0].workload_class_hash = hashes.f;
    }, "$.receipt.authority_envelope.result_snapshot.logical_units");
    expectReboundReject(claimPair, (request) => {
      const preconditionRecord = request.precondition as Record<string, unknown>;
      (preconditionRecord.expected_batch_head as Record<string, unknown>).last_event_hash = hashes.f;
    }, "$.receipt.authority_envelope.before_batch_head");
    expectReboundReject(claimPair, (request) => {
      request.purpose_profile_hash = hashes.f;
    }, "$.receipt.authority_envelope.result_snapshot.binding.purpose_profile_hash");
    expectReboundReject(claimPair, (request) => {
      (request.precondition as Record<string, unknown>).expected_binding_hash = hashes.f;
    }, "$.receipt.authority_envelope.result_snapshot.binding.binding_hash");
    expectReboundReject(reservePair, (request) => {
      (request.current_claim as Record<string, unknown>).claim_id = "claim-other";
    }, "$.receipt.authority_envelope.result_snapshot.claim");
    expectReboundReject(reservePair, (request) => {
      (request.current_claim as Record<string, unknown>).fence = "2";
    }, "$.receipt.authority_envelope.result_snapshot.claim");
  });

  it("binds every mutation payload to its authoritative result facts", () => {
    const pairs = authorityPairCasesForTest();
    const expectPayloadReject = (
      operation: WorkflowBatchExecutionControlCommandV1["operation"],
      mutatePayload: (payload: Record<string, unknown>) => void,
      expectedPath: string,
    ): void => {
      const pair = pairs.find((candidate) => candidate.name === operation);
      if (pair === undefined) throw new Error(`Missing pair for ${operation}.`);
      const requestSeed = clone(pair.request) as unknown as Record<string, unknown>;
      mutatePayload(requestSeed.payload as Record<string, unknown>);
      const request = withRequestHashForTest(requestSeed) as WorkflowBatchExecutionControlCommandV1;
      const receipt = rebindReceiptCausationForTest(pair.receipt, request);
      expect(verifyWorkflowBatchExecutionControlAuthorityReceiptV1(request, receipt)).toMatchObject({
        ok: false,
        findings: [expect.objectContaining({ path: expectedPath })],
      });
    };

    expectPayloadReject("claim_batch", (payload) => {
      payload.requested_ttl_seconds = 61;
    }, "$.receipt.authority_envelope.result_snapshot.claim.lease_expires_at");
    expectPayloadReject("renew_batch_claim", (payload) => {
      payload.requested_ttl_seconds = 61;
    }, "$.receipt.authority_envelope.result_snapshot.claim.lease_expires_at");
    expectPayloadReject("reserve_executions", (payload) => {
      payload.logical_unit_collection_root = hashes.f;
    }, "$.receipt.authority_envelope.result_snapshot.reservation.logical_unit_collection_root");
    expectPayloadReject("seal_execution_manifest", (payload) => {
      payload.execution_manifest_hash = hashes.f;
    }, "$.receipt.authority_envelope.result_snapshot.seal.execution_manifest_hash");
    expectPayloadReject("confirm_client_commit", (payload) => {
      payload.client_commit_hash = hashes.f;
    }, "$.receipt.authority_envelope.result_snapshot.client_commit.client_commit_hash");
    expectPayloadReject("dispatch_batch", (payload) => {
      payload.seal_hash = hashes.f;
    }, "$.receipt.authority_envelope.result_snapshot.dispatch.seal_hash");
    expectPayloadReject("quarantine_reservation", (payload) => {
      payload.reason_code = "different_reason";
    }, "$.receipt.authority_envelope.result_snapshot.tombstone.reason_code");
    expectPayloadReject("reconcile_batch", (payload) => {
      payload.reason_code = "different_reason";
    }, "$.receipt.authority_envelope.result_snapshot.reconciliation.reason_code");
  });

  it("binds recovery claim grants, renewals, cleared-claim identity, policy, and lease windows", () => {
    const recoveryClaimSeed = commandFixtures.find(
      (command) => command.operation === "claim_batch" && command.payload.claim_type === "reconciliation_only",
    );
    if (recoveryClaimSeed === undefined) throw new Error("Missing recovery claim command fixture.");
    const recoverySnapshot = clone(reservedRecoverySnapshot) as unknown as Record<string, unknown>;
    recoverySnapshot.claim = {
      ...reservedRecoveryClaim,
      allowed_operations: ["quarantine_reservation"],
      allowed_operations_hash: hashes.f,
    };
    const recoveryPair = authorityPairForRequest(
      recoveryClaimSeed,
      "batch_claimed",
      "recovery_required_reserved_unsealed",
      recoverySnapshot,
    );
    expect(verifyWorkflowBatchExecutionControlAuthorityReceiptV1(recoveryPair.request, recoveryPair.receipt)).toMatchObject({
      ok: true,
    });

    const widenedReceiptSeed = clone(recoveryPair.receipt) as unknown as Record<string, unknown>;
    const widenedSnapshot = (widenedReceiptSeed.authority_envelope as Record<string, unknown>)
      .result_snapshot as Record<string, unknown>;
    (widenedSnapshot.claim as Record<string, unknown>).allowed_operations = [
      "quarantine_reservation",
      "release_batch_claim",
    ];
    const widenedEnvelope = withAuthorityEnvelopeHashForTest(
      widenedReceiptSeed.authority_envelope as Record<string, unknown>,
    );
    const widenedReceipt = authorityReceiptForEnvelope(widenedEnvelope);
    expect(verifyWorkflowBatchExecutionControlAuthorityReceiptV1(recoveryPair.request, widenedReceipt)).toMatchObject({
      ok: false,
      findings: [expect.objectContaining({ path: "$.receipt.authority_envelope.result_snapshot.claim.allowed_operations" })],
    });

    const changedPolicyReceiptSeed = clone(recoveryPair.receipt) as unknown as Record<string, unknown>;
    const changedPolicySnapshot = (changedPolicyReceiptSeed.authority_envelope as Record<string, unknown>)
      .result_snapshot as Record<string, unknown>;
    (changedPolicySnapshot.claim as Record<string, unknown>).recovery_policy = {
      ...recoveryPolicy,
      decision_hash: hashes.f,
    };
    const changedPolicyReceipt = authorityReceiptForEnvelope(
      withAuthorityEnvelopeHashForTest(changedPolicyReceiptSeed.authority_envelope as Record<string, unknown>),
    );
    expect(verifyWorkflowBatchExecutionControlAuthorityReceiptV1(recoveryPair.request, changedPolicyReceipt)).toMatchObject({
      ok: false,
      findings: [expect.objectContaining({ path: "$.receipt.authority_envelope.result_snapshot.claim.recovery_policy" })],
    });

    const renewPair = authorityPairCasesForTest().find((candidate) => candidate.name === "renew_batch_claim");
    if (renewPair === undefined) throw new Error("Missing renew pair.");
    const changedRenewSeed = clone(renewPair.receipt) as unknown as Record<string, unknown>;
    const changedRenewSnapshot = (changedRenewSeed.authority_envelope as Record<string, unknown>)
      .result_snapshot as Record<string, unknown>;
    (changedRenewSnapshot.claim as Record<string, unknown>).claim_id = "claim-other";
    const changedRenewReceipt = authorityReceiptForEnvelope(
      withAuthorityEnvelopeHashForTest(changedRenewSeed.authority_envelope as Record<string, unknown>),
    );
    expect(verifyWorkflowBatchExecutionControlAuthorityReceiptV1(renewPair.request, changedRenewReceipt)).toMatchObject({
      ok: false,
      findings: [expect.objectContaining({ path: "$.receipt.authority_envelope.result_snapshot.claim.claim_id" })],
    });

    const ordinaryClaimPair = authorityPairCasesForTest().find((candidate) => candidate.name === "claim_batch");
    if (ordinaryClaimPair === undefined) throw new Error("Missing ordinary claim pair.");
    const shortPolicySeed = clone(ordinaryClaimPair.request) as unknown as Record<string, unknown>;
    shortPolicySeed.policy_decision = {
      ...(shortPolicySeed.policy_decision as Record<string, unknown>),
      expires_at: "2026-07-23T00:00:30.000Z",
    };
    const shortPolicyRequest = withRequestHashForTest(
      shortPolicySeed,
    ) as WorkflowBatchExecutionControlCommandV1;
    expect(
      verifyWorkflowBatchExecutionControlAuthorityReceiptV1(
        shortPolicyRequest,
        rebindReceiptCausationForTest(ordinaryClaimPair.receipt, shortPolicyRequest),
      ),
    ).toMatchObject({
      ok: false,
      findings: [
        expect.objectContaining({
          path: "$.receipt.authority_envelope.result_snapshot.claim.lease_expires_at",
        }),
      ],
    });

    const releaseSeed = commandFixtures.find((command) => command.operation === "release_batch_claim");
    if (releaseSeed === undefined) throw new Error("Missing release command fixture.");
    const recoveryReleaseRequest = {
      ...releaseSeed,
      policy_decision: recoveryPolicy,
      current_claim: reservedRecoveryClaim,
    } as WorkflowBatchExecutionControlCommandV1;
    const releasedRecoverySnapshot = {
      ...reservedRecoverySnapshot,
      claim: { kind: "none" },
    } as unknown as Record<string, unknown>;
    const recoveryReleasePair = authorityPairForRequest(
      recoveryReleaseRequest,
      "batch_claim_released",
      "recovery_required_reserved_unsealed",
      releasedRecoverySnapshot,
    );
    expect(
      verifyWorkflowBatchExecutionControlAuthorityReceiptV1(
        recoveryReleasePair.request,
        recoveryReleasePair.receipt,
      ),
    ).toMatchObject({ ok: true });
    const illegalReservedGrant = clone(recoveryReleasePair.request) as unknown as Record<string, unknown>;
    (illegalReservedGrant.current_claim as Record<string, unknown>).allowed_operations = [
      "quarantine_reservation",
      "reconcile_batch",
      "release_batch_claim",
      "renew_batch_claim",
    ];
    expect(decodeFailure(JSON.stringify(illegalReservedGrant), "mutation_command")).toMatchObject({
      path: "$.current_claim.allowed_operations[1]",
    });
    const wrongReleaseIdentitySeed = clone(recoveryReleasePair.request) as unknown as Record<string, unknown>;
    (wrongReleaseIdentitySeed.current_claim as Record<string, unknown>).original_identity_collection_hash = hashes.f;
    const wrongReleaseIdentity = withRequestHashForTest(
      wrongReleaseIdentitySeed,
    ) as WorkflowBatchExecutionControlCommandV1;
    expect(
      verifyWorkflowBatchExecutionControlAuthorityReceiptV1(
        wrongReleaseIdentity,
        rebindReceiptCausationForTest(recoveryReleasePair.receipt, wrongReleaseIdentity),
      ),
    ).toMatchObject({
      ok: false,
      findings: [
        expect.objectContaining({
          path: "$.receipt.authority_envelope.result_snapshot.reservation.identity_collection_hash",
        }),
      ],
    });

    const reconcilePair = authorityPairCasesForTest().find((candidate) => candidate.name === "reconcile_batch");
    if (reconcilePair === undefined) throw new Error("Missing reconcile pair.");
    const wrongReconcileIdentitySeed = clone(reconcilePair.request) as unknown as Record<string, unknown>;
    (wrongReconcileIdentitySeed.current_claim as Record<string, unknown>).original_identity_collection_hash = hashes.f;
    const wrongReconcileIdentity = withRequestHashForTest(
      wrongReconcileIdentitySeed,
    ) as WorkflowBatchExecutionControlCommandV1;
    expect(
      verifyWorkflowBatchExecutionControlAuthorityReceiptV1(
        wrongReconcileIdentity,
        rebindReceiptCausationForTest(reconcilePair.receipt, wrongReconcileIdentity),
      ),
    ).toMatchObject({
      ok: false,
      findings: [
        expect.objectContaining({
          path: "$.receipt.authority_envelope.result_snapshot.reservation.identity_collection_hash",
        }),
      ],
    });

    const claimAtExpiryRequestSeed = clone(ordinaryClaimPair.request) as unknown as Record<string, unknown>;
    claimAtExpiryRequestSeed.policy_decision = {
      ...(claimAtExpiryRequestSeed.policy_decision as Record<string, unknown>),
      not_before: "2026-07-22T23:59:00.000Z",
    };
    const claimAtExpiryRequest = withRequestHashForTest(
      claimAtExpiryRequestSeed,
    ) as WorkflowBatchExecutionControlCommandV1;
    const claimAtExpiryReceiptSeed = clone(ordinaryClaimPair.receipt) as unknown as Record<string, unknown>;
    const claimAtExpirySnapshot = (claimAtExpiryReceiptSeed.authority_envelope as Record<string, unknown>)
      .result_snapshot as Record<string, unknown>;
    (claimAtExpirySnapshot.claim as Record<string, unknown>).owner_issued_at =
      "2026-07-22T23:59:00.000Z";
    (claimAtExpirySnapshot.claim as Record<string, unknown>).lease_expires_at = timestamp;
    const claimAtExpiryReceipt = rebindReceiptCausationForTest(
      authorityReceiptForEnvelope(
        withAuthorityEnvelopeHashForTest(
          claimAtExpiryReceiptSeed.authority_envelope as Record<string, unknown>,
        ),
      ),
      claimAtExpiryRequest,
    );
    expect(
      verifyWorkflowBatchExecutionControlAuthorityReceiptV1(
        claimAtExpiryRequest,
        claimAtExpiryReceipt,
      ),
    ).toMatchObject({
      ok: false,
      findings: [
        expect.objectContaining({
          path: "$.receipt.authority_envelope.result_snapshot.claim.lease_expires_at",
        }),
      ],
    });

    const nonExtendingRenewSeed = clone(renewPair.request) as unknown as Record<string, unknown>;
    const renewResultClaim = renewPair.receipt.authority_envelope.result_snapshot.claim as Record<string, unknown>;
    (nonExtendingRenewSeed.current_claim as Record<string, unknown>).lease_expires_at =
      renewResultClaim.lease_expires_at;
    const nonExtendingRenew = withRequestHashForTest(
      nonExtendingRenewSeed,
    ) as WorkflowBatchExecutionControlCommandV1;
    expect(
      verifyWorkflowBatchExecutionControlAuthorityReceiptV1(
        nonExtendingRenew,
        rebindReceiptCausationForTest(renewPair.receipt, nonExtendingRenew),
      ),
    ).toMatchObject({
      ok: false,
      findings: [
        expect.objectContaining({
          path: "$.receipt.authority_envelope.result_snapshot.claim.lease_expires_at",
        }),
      ],
    });

    for (const [kind, mutate] of [
      ["policy", (request: Record<string, unknown>) => {
        request.policy_decision = {
          ...(request.policy_decision as Record<string, unknown>),
          not_before: "2026-07-22T23:59:00.000Z",
          expires_at: timestamp,
        };
      }],
      ["lease", (request: Record<string, unknown>) => {
        const currentClaim = request.current_claim as Record<string, unknown>;
        currentClaim.owner_issued_at = "2026-07-22T23:59:00.000Z";
        currentClaim.lease_expires_at = timestamp;
      }],
    ] as const) {
      const reservePair = authorityPairCasesForTest().find((candidate) => candidate.name === "reserve_executions");
      if (reservePair === undefined) throw new Error("Missing reserve pair.");
      const requestSeed = clone(reservePair.request) as unknown as Record<string, unknown>;
      mutate(requestSeed);
      const request = withRequestHashForTest(requestSeed) as WorkflowBatchExecutionControlCommandV1;
      const receipt = rebindReceiptCausationForTest(reservePair.receipt, request);
      expect(verifyWorkflowBatchExecutionControlAuthorityReceiptV1(request, receipt), kind).toMatchObject({ ok: false });
    }
  });

  it("pairs resume_existing only with its exact fixed-head snapshot observation", () => {
    const request = {
      ...resumeRequest,
      query: readObservation.query_binding,
      precondition: {
        ...resumeRequest.precondition,
        expected_binding_hash: binding.binding_hash,
        expected_batch_head: readObservation.as_of_batch_head,
        expected_global_head: readObservation.as_of_global_head,
      },
    } satisfies WorkflowBatchExecutionControlResumeRequestV1;
    expect(verifyWorkflowBatchExecutionControlResumeObservationV1(request, readObservation)).toMatchObject({ ok: true });

    for (const [name, mutate, expectedPath] of [
      ["query", (candidate: Record<string, unknown>) => {
        (candidate.query as Record<string, unknown>).query_id = "query-other";
      }, "$.observation.query_binding"],
      ["pins", (candidate: Record<string, unknown>) => {
        (candidate.expected_pins as Record<string, unknown>).contract_revision = "other-revision";
      }, "$.observation.pins"],
      ["scope", (candidate: Record<string, unknown>) => {
        (candidate.scope as Record<string, unknown>).scope_id = "other-scope";
      }, "$.observation.scope"],
      ["batch head", (candidate: Record<string, unknown>) => {
        const requestPrecondition = candidate.precondition as Record<string, unknown>;
        (requestPrecondition.expected_batch_head as Record<string, unknown>).last_event_hash = hashes.f;
      }, "$.observation.as_of_batch_head"],
      ["global head", (candidate: Record<string, unknown>) => {
        const requestPrecondition = candidate.precondition as Record<string, unknown>;
        (requestPrecondition.expected_global_head as Record<string, unknown>).admission_root = hashes.f;
      }, "$.observation.as_of_global_head"],
      ["generation", (candidate: Record<string, unknown>) => {
        candidate.client_generation_key = "generation-other";
      }, "$.observation.result.binding.client_generation_key"],
      ["binding", (candidate: Record<string, unknown>) => {
        (candidate.precondition as Record<string, unknown>).expected_binding_hash = hashes.f;
      }, "$.observation.result.binding.binding_hash"],
    ] as const) {
      const candidate = clone(request) as unknown as Record<string, unknown>;
      mutate(candidate);
      expect(verifyWorkflowBatchExecutionControlResumeObservationV1(candidate, readObservation), name).toMatchObject({
        ok: false,
        findings: [expect.objectContaining({ path: expectedPath })],
      });
    }

    const expiredObservation = clone(readObservation) as unknown as Record<string, unknown>;
    const expiredQuery = expiredObservation.query_binding as Record<string, unknown>;
    expiredQuery.read_policy = {
      ...(expiredQuery.read_policy as Record<string, unknown>),
      not_before: "2026-07-22T23:59:00.000Z",
      expires_at: readObservation.observed_at,
    };
    const expiredResumeRequest = {
      ...request,
      query: expiredObservation.query_binding,
    };
    expect(
      verifyWorkflowBatchExecutionControlResumeObservationV1(expiredResumeRequest, expiredObservation),
    ).toMatchObject({
      ok: false,
      findings: [expect.objectContaining({ path: "$.observation.observed_at" })],
    });
  });

  it("verifies every authority event against a bounded prior fixed-head snapshot", () => {
    const renewalBefore = clone(plannedSnapshot) as unknown as Record<string, unknown>;
    renewalBefore.claim = {
      ...ordinaryClaim,
      owner_issued_at: "2026-07-22T23:59:30.000Z",
      lease_expires_at: "2026-07-23T00:00:30.000Z",
    };
    const expiryBefore = clone(plannedSnapshot) as unknown as Record<string, unknown>;
    expiryBefore.claim = {
      ...ordinaryClaim,
      owner_issued_at: "2026-07-22T23:59:00.000Z",
      lease_expires_at: timestamp,
    };
    const reservedRecoveryNoClaim = clone(reservedRecoverySnapshot) as unknown as Record<string, unknown>;
    reservedRecoveryNoClaim.claim = { kind: "none" };
    const recoveryRenewBefore = clone(reservedRecoverySnapshot) as unknown as Record<string, unknown>;
    recoveryRenewBefore.claim = {
      ...reservedRecoveryClaim,
      owner_issued_at: timestamp,
      lease_expires_at: "2026-07-23T00:00:30.000Z",
    };
    const recoveryReleased = clone(reservedRecoverySnapshot) as unknown as Record<string, unknown>;
    recoveryReleased.claim = { kind: "none" };
    const reservedExpiryBefore = clone(reservedSnapshot) as unknown as Record<string, unknown>;
    reservedExpiryBefore.claim = {
      ...ordinaryClaim,
      owner_issued_at: "2026-07-22T23:59:00.000Z",
      lease_expires_at: timestamp,
    };
    const recoveryEffectStarted = clone(dispatchedRecoverySnapshot) as unknown as Record<string, unknown>;
    recoveryEffectStarted.dispatch_effect_status = dispatchEffect;
    const recoveryCompletion = clone(recoveryEffectStarted);
    recoveryCompletion.completion_status = completion;

    const cases: Array<[
      string,
      Record<string, unknown> | null,
      string,
      Record<string, unknown>,
      "client_command" | "owner_worker" | "watchdog",
    ]> = [
      ["open", null, "batch_opened", plannedNoClaimSnapshot as unknown as Record<string, unknown>, "client_command"],
      ["ordinary claim", plannedNoClaimSnapshot as unknown as Record<string, unknown>, "batch_claimed", plannedSnapshot as unknown as Record<string, unknown>, "client_command"],
      ["ordinary renew", renewalBefore, "batch_claim_renewed", plannedSnapshot as unknown as Record<string, unknown>, "client_command"],
      ["ordinary release", plannedSnapshot as unknown as Record<string, unknown>, "batch_claim_released", plannedNoClaimSnapshot as unknown as Record<string, unknown>, "client_command"],
      ["reserve", plannedSnapshot as unknown as Record<string, unknown>, "executions_reserved", reservedSnapshot as unknown as Record<string, unknown>, "client_command"],
      ["seal", reservedSnapshot as unknown as Record<string, unknown>, "execution_manifest_sealed", sealedSnapshot as unknown as Record<string, unknown>, "client_command"],
      ["commit", sealedSnapshot as unknown as Record<string, unknown>, "client_commit_confirmed", clientCommitSnapshot as unknown as Record<string, unknown>, "client_command"],
      ["dispatch", clientCommitSnapshot as unknown as Record<string, unknown>, "dispatch_recorded", dispatchRecordedSnapshot as unknown as Record<string, unknown>, "client_command"],
      ["effect start", dispatchRecordedSnapshot as unknown as Record<string, unknown>, "dispatch_effect_started", awaitingSnapshot as unknown as Record<string, unknown>, "owner_worker"],
      ["completion", awaitingSnapshot as unknown as Record<string, unknown>, "execution_completion_recorded", completedSnapshot as unknown as Record<string, unknown>, "owner_worker"],
      ["expiry", expiryBefore, "claim_expired", plannedNoClaimSnapshot as unknown as Record<string, unknown>, "watchdog"],
      ["recovery claim", reservedRecoveryNoClaim, "batch_claimed", reservedRecoverySnapshot as unknown as Record<string, unknown>, "client_command"],
      ["recovery renew", recoveryRenewBefore, "batch_claim_renewed", reservedRecoverySnapshot as unknown as Record<string, unknown>, "client_command"],
      ["recovery release", reservedRecoverySnapshot as unknown as Record<string, unknown>, "batch_claim_released", recoveryReleased, "client_command"],
      ["forward release enters recovery", reservedSnapshot as unknown as Record<string, unknown>, "batch_claim_released", reservedRecoveryNoClaim, "client_command"],
      ["forward expiry enters recovery", reservedExpiryBefore, "claim_expired", reservedRecoveryNoClaim, "watchdog"],
      ["recovery commit", sealedRecoverySnapshot as unknown as Record<string, unknown>, "client_commit_confirmed", confirmedSealedRecoverySnapshot as unknown as Record<string, unknown>, "client_command"],
      ["recovery effect start", dispatchedRecoverySnapshot as unknown as Record<string, unknown>, "dispatch_effect_started", recoveryEffectStarted, "owner_worker"],
      ["recovery completion", recoveryEffectStarted, "execution_completion_recorded", recoveryCompletion, "owner_worker"],
      ["quarantine", reservedRecoverySnapshot as unknown as Record<string, unknown>, "reservation_quarantined", quarantinedSnapshot as unknown as Record<string, unknown>, "client_command"],
      ["reconcile", sealedRecoverySnapshot as unknown as Record<string, unknown>, "batch_reconciled", sealedUnresolvedSnapshot as unknown as Record<string, unknown>, "client_command"],
      ["reconcile dispatched", recoveryCompletion, "batch_reconciled", dispatchedUnresolvedSnapshot as unknown as Record<string, unknown>, "client_command"],
    ];

    for (const [name, before, eventType, after, actor] of cases) {
      const pair = authorityTransitionPairForTest(before, eventType, after, actor);
      expect(
        verifyWorkflowBatchExecutionControlAuthorityTransitionV1(pair.beforeObservation, pair.receipt),
        name,
      ).toMatchObject({ ok: true });
    }
  });

  it("rejects no-op progress, early expiry, and cross-bound transition readbacks", () => {
    const expectTransitionReject = (
      before: Record<string, unknown> | null,
      eventType: string,
      after: Record<string, unknown>,
      actor: "client_command" | "owner_worker" | "watchdog",
      expectedPath: string,
    ): void => {
      const pair = authorityTransitionPairForTest(before, eventType, after, actor);
      expect(
        verifyWorkflowBatchExecutionControlAuthorityTransitionV1(pair.beforeObservation, pair.receipt),
      ).toMatchObject({
        ok: false,
        findings: [expect.objectContaining({ path: expectedPath })],
      });
    };

    const recoveryEffectStarted = clone(dispatchedRecoverySnapshot) as unknown as Record<string, unknown>;
    recoveryEffectStarted.dispatch_effect_status = dispatchEffect;
    expectTransitionReject(
      recoveryEffectStarted,
      "dispatch_effect_started",
      recoveryEffectStarted,
      "owner_worker",
      "$.receipt.authority_envelope.result_snapshot.dispatch_effect_status.kind",
    );
    expectTransitionReject(
      confirmedSealedRecoverySnapshot as unknown as Record<string, unknown>,
      "client_commit_confirmed",
      confirmedSealedRecoverySnapshot as unknown as Record<string, unknown>,
      "client_command",
      "$.receipt.authority_envelope.result_snapshot.client_commit_status.kind",
    );
    expectTransitionReject(
      plannedSnapshot as unknown as Record<string, unknown>,
      "batch_claim_renewed",
      plannedSnapshot as unknown as Record<string, unknown>,
      "client_command",
      "$.receipt.authority_envelope.result_snapshot.claim.lease_expires_at",
    );

    const secondLogicalUnit = {
      logical_unit_hash: hashes.f,
      execution_binding_hash: hashes.a,
      workload_class_hash: hashes.b,
    };
    const partialSnapshot = clone(awaitingSnapshot) as unknown as Record<string, unknown>;
    partialSnapshot.binding = {
      ...(partialSnapshot.binding as Record<string, unknown>),
      logical_unit_collection_root: hashes.e,
      logical_unit_count: 2,
      binding_hash: hashes.f,
    };
    partialSnapshot.logical_units = [logicalUnit, secondLogicalUnit];
    partialSnapshot.reservation = {
      ...(partialSnapshot.reservation as Record<string, unknown>),
      logical_unit_collection_root: hashes.e,
      allocations: [
        ...((partialSnapshot.reservation as Record<string, unknown>).allocations as unknown[]),
        { ...secondLogicalUnit, owner_task_id: "task-2", owner_execution_id: "execution-2" },
      ],
      allocation_count: 2,
    };
    partialSnapshot.seal = {
      ...(partialSnapshot.seal as Record<string, unknown>),
      allocation_count: 2,
    };
    partialSnapshot.completion_status = {
      kind: "partial",
      receipt_count: 1,
      expected_count: 2,
      collection_root: hashes.d,
    };
    expectTransitionReject(
      partialSnapshot,
      "execution_completion_recorded",
      partialSnapshot,
      "owner_worker",
      "$.receipt.authority_envelope.result_snapshot.completion_status.receipt_count",
    );

    const completionJumpBefore = clone(partialSnapshot);
    completionJumpBefore.completion_status = {
      kind: "none",
      receipt_count: 0,
      expected_count: 2,
      collection_root: hashes.a,
    };
    const completionJumpAfter = clone(partialSnapshot);
    completionJumpAfter.state = "completed";
    completionJumpAfter.claim = { kind: "none" };
    completionJumpAfter.completion_status = {
      kind: "all_terminal",
      receipt_count: 2,
      expected_count: 2,
      collection_root: hashes.e,
      lifecycle_head: hashes.f,
    };
    expectTransitionReject(
      completionJumpBefore,
      "execution_completion_recorded",
      completionJumpAfter,
      "owner_worker",
      "$.receipt.authority_envelope.result_snapshot.completion_status.receipt_count",
    );
    const unchangedCompletionRoot = clone(completedSnapshot) as unknown as Record<string, unknown>;
    (unchangedCompletionRoot.completion_status as Record<string, unknown>).collection_root =
      noCompletion.collection_root;
    expectTransitionReject(
      awaitingSnapshot as unknown as Record<string, unknown>,
      "execution_completion_recorded",
      unchangedCompletionRoot,
      "owner_worker",
      "$.receipt.authority_envelope.result_snapshot.completion_status.collection_root",
    );

    const reservationDrift = clone(sealedSnapshot) as unknown as Record<string, unknown>;
    (reservationDrift.reservation as Record<string, unknown>).reservation_id = "reservation-other";
    expectTransitionReject(
      reservedSnapshot as unknown as Record<string, unknown>,
      "execution_manifest_sealed",
      reservationDrift,
      "client_command",
      "$.receipt.authority_envelope.result_snapshot.reservation",
    );
    const sealDrift = clone(clientCommitSnapshot) as unknown as Record<string, unknown>;
    (sealDrift.seal as Record<string, unknown>).seal_id = "seal-other";
    expectTransitionReject(
      sealedSnapshot as unknown as Record<string, unknown>,
      "client_commit_confirmed",
      sealDrift,
      "client_command",
      "$.receipt.authority_envelope.result_snapshot.seal",
    );
    const recoveryRenewBefore = clone(reservedRecoverySnapshot) as unknown as Record<string, unknown>;
    recoveryRenewBefore.claim = {
      ...reservedRecoveryClaim,
      owner_issued_at: timestamp,
      lease_expires_at: "2026-07-23T00:00:30.000Z",
    };
    const recoveryHashDrift = clone(reservedRecoverySnapshot) as unknown as Record<string, unknown>;
    (recoveryHashDrift.recovery as Record<string, unknown>).recovery_hash = hashes.f;
    expectTransitionReject(
      recoveryRenewBefore,
      "batch_claim_renewed",
      recoveryHashDrift,
      "client_command",
      "$.receipt.authority_envelope.result_snapshot.recovery",
    );
    const recoveryOriginDrift = clone(dispatchedRecoverySnapshot) as unknown as Record<string, unknown>;
    recoveryOriginDrift.claim = { kind: "none" };
    (recoveryOriginDrift.recovery as Record<string, unknown>).origin_state = "client_commit_confirmed";
    expectTransitionReject(
      dispatchedRecoverySnapshot as unknown as Record<string, unknown>,
      "batch_claim_released",
      recoveryOriginDrift,
      "client_command",
      "$.receipt.authority_envelope.result_snapshot.recovery",
    );

    const notYetExpired = clone(plannedSnapshot) as unknown as Record<string, unknown>;
    (notYetExpired.claim as Record<string, unknown>).lease_expires_at = "2026-07-23T00:00:30.000Z";
    expectTransitionReject(
      notYetExpired,
      "claim_expired",
      plannedNoClaimSnapshot as unknown as Record<string, unknown>,
      "watchdog",
      "$.receipt.authority_envelope.batch_event.owner_event_at",
    );

    const reservePair = authorityTransitionPairForTest(
      plannedSnapshot as unknown as Record<string, unknown>,
      "executions_reserved",
      reservedSnapshot as unknown as Record<string, unknown>,
      "client_command",
    );
    if (reservePair.beforeObservation === null) throw new Error("Expected a prior observation.");
    for (const [name, mutate, expectedPath] of [
      [
        "pins",
        (candidate: Record<string, unknown>) => {
          (candidate.pins as Record<string, unknown>).contract_revision = "other-revision";
          ((candidate.result as Record<string, unknown>).pins as Record<string, unknown>).contract_revision =
            "other-revision";
        },
        "$.before_observation.pins",
      ],
      [
        "scope",
        (candidate: Record<string, unknown>) => {
          (candidate.scope as Record<string, unknown>).scope_id = "other-scope";
          ((candidate.result as Record<string, unknown>).scope as Record<string, unknown>).scope_id = "other-scope";
        },
        "$.before_observation.scope",
      ],
      [
        "head",
        (candidate: Record<string, unknown>) => {
          (candidate.as_of_batch_head as Record<string, unknown>).last_event_hash = hashes.f;
          ((candidate.result as Record<string, unknown>).batch_head as Record<string, unknown>).last_event_hash =
            hashes.f;
        },
        "$.before_observation.as_of_batch_head",
      ],
    ] as const) {
      const candidate = clone(reservePair.beforeObservation) as Record<string, unknown>;
      mutate(candidate);
      const rehashed = withReadObservationHashForTest(candidate);
      expect(
        verifyWorkflowBatchExecutionControlAuthorityTransitionV1(rehashed, reservePair.receipt),
        name,
      ).toMatchObject({
        ok: false,
        findings: [expect.objectContaining({ path: expectedPath })],
      });
    }

    expect(verifyWorkflowBatchExecutionControlAuthorityTransitionV1(null, reservePair.receipt)).toMatchObject({
      ok: false,
      findings: [expect.objectContaining({ path: "$.before_observation" })],
    });
    const openPair = authorityTransitionPairForTest(
      null,
      "batch_opened",
      plannedNoClaimSnapshot as unknown as Record<string, unknown>,
      "client_command",
    );
    expect(
      verifyWorkflowBatchExecutionControlAuthorityTransitionV1(
        reservePair.beforeObservation,
        openPair.receipt,
      ),
    ).toMatchObject({
      ok: false,
      findings: [expect.objectContaining({ path: "$.before_observation" })],
    });

    const completionPair = authorityTransitionPairForTest(
      awaitingSnapshot as unknown as Record<string, unknown>,
      "execution_completion_recorded",
      completedSnapshot as unknown as Record<string, unknown>,
      "owner_worker",
    );
    const missingLifecycleReceipt = clone(completionPair.receipt) as unknown as Record<string, unknown>;
    delete ((((missingLifecycleReceipt.authority_envelope as Record<string, unknown>).result_snapshot) as Record<string, unknown>)
      .completion_status as Record<string, unknown>).lifecycle_head;
    expect(
      verifyWorkflowBatchExecutionControlAuthorityTransitionV1(
        completionPair.beforeObservation,
        missingLifecycleReceipt,
      ),
    ).toMatchObject({
      ok: false,
      findings: [
        expect.objectContaining({
          path: "$.receipt.authority_envelope.result_snapshot.completion_status.lifecycle_head",
        }),
      ],
    });
  });

  it("pairs committed request outcomes to the exact resolved authority envelope", () => {
    const createPair = authorityPairCasesForTest()[0];
    const createRequest = createPair.request as WorkflowBatchExecutionControlCreateRequestV1;
    const envelope = createPair.receipt.authority_envelope;
    const queryBinding = {
      operation: "read_request_outcome",
      query_id: "query-outcome-pair-1",
      query_hash: hashes.a,
      read_policy: readPolicy,
      client_generation_key: createRequest.binding.client_generation_key,
      command_id: createRequest.request_meta.command_id,
      idempotency_key: createRequest.request_meta.idempotency_key,
      request_hash: createRequest.request_meta.request_hash,
    } as const;
    const observation = withReadObservationHashForTest({
      ...readObservation,
      pins: envelope.pins,
      scope: envelope.scope,
      query_binding: queryBinding,
      as_of_batch_head: envelope.after_batch_head,
      as_of_global_head: envelope.after_global_head,
      result: {
        kind: "committed",
        receipt_ref: createPair.receipt.receipt_ref,
        authority_envelope_hash: createPair.receipt.authority_envelope_hash,
      },
    });
    expect(
      verifyWorkflowBatchExecutionControlCommittedOutcomeResolutionV1(observation, createPair.receipt),
    ).toMatchObject({ ok: true });

    const laterHeadObservation = withReadObservationHashForTest({
      ...observation,
      as_of_batch_head: {
        ...envelope.after_batch_head,
        ledger_sequence: String(BigInt(envelope.after_batch_head.ledger_sequence) + 1n),
        snapshot_version: String(BigInt(envelope.after_batch_head.snapshot_version) + 1n),
        last_event_hash: hashes.f,
      },
      as_of_global_head: {
        ...envelope.after_global_head,
        ledger_sequence: String(BigInt(envelope.after_global_head.ledger_sequence) + 1n),
        registry_version: String(BigInt(envelope.after_global_head.registry_version) + 1n),
        last_event_hash: hashes.f,
      },
    });
    expect(
      verifyWorkflowBatchExecutionControlCommittedOutcomeResolutionV1(
        laterHeadObservation,
        createPair.receipt,
      ),
    ).toMatchObject({ ok: true });

    const expectOutcomeReject = (
      mutate: (candidate: Record<string, unknown>) => void,
      expectedPath: string,
    ): void => {
      const candidate = clone(observation) as unknown as Record<string, unknown>;
      mutate(candidate);
      const rehashed = withReadObservationHashForTest(candidate);
      expect(
        verifyWorkflowBatchExecutionControlCommittedOutcomeResolutionV1(rehashed, createPair.receipt),
      ).toMatchObject({
        ok: false,
        findings: [expect.objectContaining({ path: expectedPath })],
      });
    };
    expectOutcomeReject((candidate) => {
      (candidate.result as Record<string, unknown>).receipt_ref = "receipt-other";
    }, "$.resolved.receipt_ref");
    expectOutcomeReject((candidate) => {
      (candidate.result as Record<string, unknown>).authority_envelope_hash = hashes.f;
    }, "$.resolved.authority_envelope_hash");
    expectOutcomeReject((candidate) => {
      (candidate.pins as Record<string, unknown>).contract_revision = "other-revision";
    }, "$.resolved.authority_envelope.pins");
    expectOutcomeReject((candidate) => {
      (candidate.scope as Record<string, unknown>).scope_id = "other-scope";
    }, "$.resolved.authority_envelope.scope");
    expectOutcomeReject((candidate) => {
      (candidate.query_binding as Record<string, unknown>).client_generation_key = "generation-other";
    }, "$.resolved.authority_envelope.result_snapshot.binding.client_generation_key");
    for (const key of ["command_id", "idempotency_key", "request_hash"] as const) {
      expectOutcomeReject((candidate) => {
        (candidate.query_binding as Record<string, unknown>)[key] =
          key === "request_hash" ? hashes.f : `${key}-other`;
      }, "$.resolved.authority_envelope.causation");
    }
    expectOutcomeReject((candidate) => {
      candidate.result = { kind: "pending" };
    }, "$.observation.result.kind");
    expectOutcomeReject((candidate) => {
      candidate.as_of_batch_head = null;
    }, "$.observation.as_of_batch_head");
    const zeroBatchHeadOutcome = clone(observation) as unknown as Record<string, unknown>;
    zeroBatchHeadOutcome.as_of_batch_head = {
      ...envelope.after_batch_head,
      ledger_sequence: "0",
      snapshot_version: "0",
      last_event_hash: null,
    };
    expect(
      verifyWorkflowBatchExecutionControlCommittedOutcomeResolutionV1(
        zeroBatchHeadOutcome,
        createPair.receipt,
      ),
    ).toMatchObject({
      ok: false,
      findings: [expect.objectContaining({ path: "$.observation.as_of_batch_head.snapshot_version" })],
    });
    expectOutcomeReject((candidate) => {
      candidate.as_of_global_head = {
        ...envelope.after_global_head,
        ledger_sequence: "0",
        registry_version: "0",
        last_event_hash: null,
      };
    }, "$.observation.as_of_global_head.ledger_sequence");
    expectOutcomeReject((candidate) => {
      (candidate.as_of_batch_head as Record<string, unknown>).last_event_hash = hashes.f;
    }, "$.observation.as_of_batch_head.last_event_hash");
    expectOutcomeReject((candidate) => {
      (candidate.as_of_global_head as Record<string, unknown>).last_event_hash = hashes.f;
    }, "$.observation.as_of_global_head.last_event_hash");
    expectOutcomeReject((candidate) => {
      candidate.observed_at = "2026-07-22T23:59:59.000Z";
      const binding = candidate.query_binding as Record<string, unknown>;
      binding.read_policy = {
        ...(binding.read_policy as Record<string, unknown>),
        not_before: "2026-07-22T23:59:00.000Z",
      };
    }, "$.observation.observed_at");

    const expiredOutcome = clone(observation) as unknown as Record<string, unknown>;
    const expiredOutcomeQuery = expiredOutcome.query_binding as Record<string, unknown>;
    expiredOutcomeQuery.read_policy = {
      ...(expiredOutcomeQuery.read_policy as Record<string, unknown>),
      not_before: "2026-07-22T23:59:00.000Z",
      expires_at: observation.observed_at,
    };
    expect(
      verifyWorkflowBatchExecutionControlCommittedOutcomeResolutionV1(expiredOutcome, createPair.receipt),
    ).toMatchObject({
      ok: false,
      findings: [expect.objectContaining({ path: "$.observation.observed_at" })],
    });
  });

  it("rejects result owner facts later than the committing batch event", () => {
    const futureFact = clone(authorityEnvelope) as unknown as Record<string, unknown>;
    const snapshot = futureFact.result_snapshot as Record<string, unknown>;
    const resultClaim = snapshot.claim as Record<string, unknown>;
    resultClaim.owner_issued_at = "2099-01-01T00:00:00.000Z";
    resultClaim.lease_expires_at = "2099-01-01T00:01:00.000Z";
    expect(decodeFailure(JSON.stringify(futureFact), "authority_envelope")).toMatchObject({
      code: "invalid_scalar",
      path: "$.result_snapshot.claim.owner_issued_at",
    });

    const afterEventBeforeReceipt = clone(authorityEnvelope) as unknown as Record<string, unknown>;
    afterEventBeforeReceipt.owner_issued_at = "2026-07-23T00:00:10.000Z";
    const betweenSnapshot = afterEventBeforeReceipt.result_snapshot as Record<string, unknown>;
    const betweenClaim = betweenSnapshot.claim as Record<string, unknown>;
    betweenClaim.owner_issued_at = "2026-07-23T00:00:05.000Z";
    betweenClaim.lease_expires_at = "2026-07-23T00:01:05.000Z";
    expect(decodeFailure(JSON.stringify(afterEventBeforeReceipt), "authority_envelope")).toMatchObject({
      code: "invalid_scalar",
      path: "$.result_snapshot.claim.owner_issued_at",
    });
  });

  it("rejects read observations that predate returned owner facts or hit policy expiry", () => {
    const future = "2026-07-23T00:00:10.000Z";
    const futureSnapshot = clone(readObservation) as unknown as Record<string, unknown>;
    const futureSnapshotClaim = (futureSnapshot.result as Record<string, unknown>).claim as Record<string, unknown>;
    futureSnapshotClaim.owner_issued_at = future;
    futureSnapshotClaim.lease_expires_at = "2026-07-23T00:01:10.000Z";

    const historyObservation = {
      ...readObservation,
      query_binding: { ...readObservation.query_binding, operation: "read_batch_history_page" },
      page: {
        kind: "collection_page",
        cursor_start: null,
        cursor_end: null,
        next_cursor: null,
        limit: 1,
        item_count: 1,
        page_hash: hashes.a,
        full_collection_root: hashes.b,
      },
      result: [
        {
          owner_event: { ...batchEvent, owner_event_at: future },
          authority_envelope_hash: hashes.e,
          receipt_ref: "receipt-history-future",
        },
      ],
    };
    const receiptsObservation = {
      ...historyObservation,
      query_binding: { ...historyObservation.query_binding, operation: "read_execution_receipts_page" },
      result: [{ ...executionReceipts[0], owner_completed_at: future }],
    };
    const lifecycleObservation = {
      ...historyObservation,
      query_binding: { ...historyObservation.query_binding, operation: "read_execution_lifecycle" },
      result: [
        {
          owner_execution_id: "execution-1",
          status: "started",
          observation_ref: "lifecycle-future-1",
          observation_hash: hashes.a,
          owner_observed_at: future,
        },
      ],
    };
    for (const [candidate, path] of [
      [futureSnapshot, "$.result.claim.owner_issued_at"],
      [historyObservation, "$.result[0].owner_event.owner_event_at"],
      [receiptsObservation, "$.result[0].owner_completed_at"],
      [lifecycleObservation, "$.result[0].owner_observed_at"],
    ] as const) {
      expect(decodeFailure(JSON.stringify(candidate), "read_observation")).toMatchObject({ path });
    }

    const expiredObservation = clone(readObservation) as unknown as Record<string, unknown>;
    const expiredBinding = expiredObservation.query_binding as Record<string, unknown>;
    expiredBinding.read_policy = {
      ...(expiredBinding.read_policy as Record<string, unknown>),
      not_before: "2026-07-22T23:59:00.000Z",
      expires_at: readObservation.observed_at,
    };
    expect(decodeFailure(JSON.stringify(expiredObservation), "read_observation")).toMatchObject({
      path: "$.observed_at",
    });
    expect(verifyWorkflowBatchExecutionControlReadObservationV1(readQuery, expiredObservation)).toMatchObject({
      ok: false,
      findings: [expect.objectContaining({ path: "$.observation.observed_at" })],
    });
  });

  it("rejects legacy fields that are no longer in the current contract", () => {
    const oldLogicalUnit = clone(checkedCreateRequest) as unknown as Record<string, unknown>;
    const oldBinding = oldLogicalUnit.binding as Record<string, unknown>;
    const units = oldBinding.logical_units as Array<Record<string, unknown>>;
    units[0] = { logical_unit_hash: hashes.a, execution_binding_hash: hashes.b, workload_class: "legacy" };
    expect(decodeFailure(JSON.stringify(oldLogicalUnit), "open_input")).toMatchObject({ code: "unknown_key" });

    const oldMutation = clone(commandFixtures[0]) as unknown as Record<string, unknown>;
    delete oldMutation.precondition;
    oldMutation.expected_batch_head = batchBefore;
    oldMutation.expected_global_head = globalBefore;
    expect(decodeFailure(JSON.stringify(oldMutation), "mutation_command")).toMatchObject({ code: "unknown_key" });

    const oldEnvelope = clone(authorityEnvelope) as unknown as Record<string, unknown>;
    delete oldEnvelope.batch_event;
    delete oldEnvelope.global_event;
    oldEnvelope.owner_events = [batchEvent, globalEvent];
    expect(decodeFailure(JSON.stringify(oldEnvelope), "authority_envelope")).toMatchObject({ code: "unknown_key" });
  });

  it("enforces nested exact keys, duplicate-key raw parsing, and null/unknown discriminators", () => {
    const unknown = clone(commandFixtures[0]) as unknown as Record<string, unknown>;
    (unknown.pins as Record<string, unknown>).endpoint = "https://forbidden.invalid";
    expect(decodeFailure(JSON.stringify(unknown), "mutation_command")).toMatchObject({
      code: "unknown_key",
      path: "$.pins.endpoint",
    });

    for (const prototypeKey of ["constructor", "toString", "__proto__"]) {
      const withPrototypeNamedKey = JSON.parse(JSON.stringify(checkedCreateRequest)) as Record<
        string,
        unknown
      >;
      Object.defineProperty(withPrototypeNamedKey, prototypeKey, {
        configurable: true,
        enumerable: true,
        value: "forbidden",
      });
      expect(decodeFailure(JSON.stringify(withPrototypeNamedKey), "open_input")).toMatchObject({
        code: "unknown_key",
      });
    }

    const duplicate = JSON.stringify(commandFixtures[0]).replace(
      '"operation":"claim_batch"',
      '"operation":"claim_batch","oper\\u0061tion":"dispatch_batch"',
    );
    expect(decodeFailure(duplicate, "mutation_command")).toMatchObject({ code: "duplicate_key" });

    const nullOperation = { ...commandFixtures[0], operation: null };
    expect(decodeFailure(JSON.stringify(nullOperation), "mutation_command")).toMatchObject({
      code: "invalid_discriminator",
    });
  });

  it("requires the current binding CAS, purpose hash, and recovery expired-forward reference", () => {
    const missingBinding = clone(commandFixtures[0]) as unknown as Record<string, unknown>;
    delete (missingBinding.precondition as Record<string, unknown>).expected_binding_hash;
    expect(decodeFailure(JSON.stringify(missingBinding), "mutation_command")).toMatchObject({
      code: "missing_key",
      path: "$.precondition.expected_binding_hash",
    });

    const missingPurpose = clone(commandFixtures[0]) as unknown as Record<string, unknown>;
    delete missingPurpose.purpose_profile_hash;
    expect(decodeFailure(JSON.stringify(missingPurpose), "mutation_command")).toMatchObject({ code: "missing_key" });

    const missingRecoveryRef = clone(commandFixtures[1]) as unknown as Record<string, unknown>;
    delete (missingRecoveryRef.policy_decision as Record<string, unknown>).expired_forward_decision_ref;
    expect(decodeFailure(JSON.stringify(missingRecoveryRef), "mutation_command")).toMatchObject({
      code: "missing_key",
    });
  });

  it("checks authority head/event/snapshot equality, sequence arithmetic, and capacity arithmetic", () => {
    const cases: Array<[WorkflowBatchExecutionControlAuthorityEnvelopeV1, string]> = [];

    const badPrevious = {
      ...authorityEnvelope,
      batch_event: { ...authorityEnvelope.batch_event, previous_event_hash: hashes.f },
    } satisfies WorkflowBatchExecutionControlAuthorityEnvelopeV1;
    cases.push([badPrevious, "$.batch_event.previous_event_hash"]);

    const badSequence = {
      ...authorityEnvelope,
      after_global_head: { ...authorityEnvelope.after_global_head, ledger_sequence: "22" },
      global_event: { ...authorityEnvelope.global_event, ledger_sequence: "22" },
      result_snapshot: {
        ...authorityEnvelope.result_snapshot,
        global_head: { ...authorityEnvelope.result_snapshot.global_head, ledger_sequence: "22" },
      },
    } satisfies WorkflowBatchExecutionControlAuthorityEnvelopeV1;
    cases.push([badSequence, "$.after_global_head.ledger_sequence"]);

    const badCapacity = {
      ...authorityEnvelope,
      after_global_head: { ...authorityEnvelope.after_global_head, active_claim_count: 2 },
      result_snapshot: {
        ...authorityEnvelope.result_snapshot,
        global_head: { ...authorityEnvelope.result_snapshot.global_head, active_claim_count: 2 },
      },
    } satisfies WorkflowBatchExecutionControlAuthorityEnvelopeV1;
    cases.push([badCapacity, "$.after_global_head.active_claim_count"]);

    const badSnapshot = {
      ...authorityEnvelope,
      result_snapshot: {
        ...authorityEnvelope.result_snapshot,
        batch_head: { ...authorityEnvelope.result_snapshot.batch_head, snapshot_version: "3" },
      },
    } satisfies WorkflowBatchExecutionControlAuthorityEnvelopeV1;
    cases.push([badSnapshot, "$.result_snapshot.batch_head"]);

    const badEventDelta = {
      ...authorityEnvelope,
      batch_event: {
        ...authorityEnvelope.batch_event,
        capacity_delta: { ...authorityEnvelope.batch_event.capacity_delta, active_claim_count: 0 },
      },
    } satisfies WorkflowBatchExecutionControlAuthorityEnvelopeV1;
    cases.push([badEventDelta, "$.batch_event.capacity_delta"]);

    const badBindingIdentity = {
      ...authorityEnvelope,
      result_snapshot: {
        ...authorityEnvelope.result_snapshot,
        binding: { ...authorityEnvelope.result_snapshot.binding, owner_batch_id: "batch-other" },
      },
    } satisfies WorkflowBatchExecutionControlAuthorityEnvelopeV1;
    cases.push([badBindingIdentity, "$.result_snapshot.binding.owner_batch_id"]);

    const badRegistryVersion = {
      ...authorityEnvelope,
      after_global_head: { ...authorityEnvelope.after_global_head, registry_version: "5" },
      result_snapshot: {
        ...authorityEnvelope.result_snapshot,
        global_head: { ...authorityEnvelope.result_snapshot.global_head, registry_version: "5" },
      },
    } satisfies WorkflowBatchExecutionControlAuthorityEnvelopeV1;
    cases.push([badRegistryVersion, "$.after_global_head.registry_version"]);

    const badGlobalFactRoot = {
      ...authorityEnvelope,
      global_event: { ...authorityEnvelope.global_event, fact_root: hashes.f },
    } satisfies WorkflowBatchExecutionControlAuthorityEnvelopeV1;
    cases.push([badGlobalFactRoot, "$.global_event.fact_root"]);

    const badBatchFactRoot = {
      ...authorityEnvelope,
      batch_event: { ...authorityEnvelope.batch_event, fact_root: hashes.a },
    } satisfies WorkflowBatchExecutionControlAuthorityEnvelopeV1;
    cases.push([badBatchFactRoot, "$.batch_event.fact_root"]);

    const zeroCapacityDelta = {
      active_claim_count: 0,
      active_reserved_execution_count: 0,
      lifetime_logical_unit_count: 0,
      lifetime_task_id_count: 0,
      lifetime_execution_id_count: 0,
    } as const;
    const badEventSpecificDelta = {
      ...authorityEnvelope,
      before_global_head: { ...authorityEnvelope.before_global_head, active_claim_count: 1 },
      after_global_head: { ...authorityEnvelope.after_global_head, active_claim_count: 1 },
      batch_event: { ...authorityEnvelope.batch_event, capacity_delta: zeroCapacityDelta },
      global_event: { ...authorityEnvelope.global_event, capacity_delta: zeroCapacityDelta },
      capacity_delta: zeroCapacityDelta,
      result_snapshot: {
        ...authorityEnvelope.result_snapshot,
        global_head: { ...authorityEnvelope.result_snapshot.global_head, active_claim_count: 1 },
      },
    } satisfies WorkflowBatchExecutionControlAuthorityEnvelopeV1;
    cases.push([badEventSpecificDelta, "$.capacity_delta"]);

    for (const [candidate, path] of cases) {
      expect(decodeFailure(JSON.stringify(candidate), "authority_envelope")).toMatchObject({
        code: "invalid_scalar",
        path,
      });
    }

    const initialCapacityDelta = { ...zeroCapacityDelta, lifetime_logical_unit_count: 1 } as const;
    const initialGlobalAfter = {
      ...authorityEnvelope.after_global_head,
      active_claim_count: 0,
      lifetime_logical_unit_count: 2,
    } as const;
    const initialEnvelope = withAuthorityEnvelopeHashForTest({
      ...authorityEnvelope,
      before_batch_head: null,
      after_batch_head: {
        ...authorityEnvelope.after_batch_head,
        snapshot_version: "1",
        ledger_sequence: "1",
      },
      batch_event: {
        ...authorityEnvelope.batch_event,
        event_type: "batch_opened",
        ledger_sequence: "1",
        previous_event_hash: null,
        capacity_delta: initialCapacityDelta,
      },
      after_global_head: initialGlobalAfter,
      global_event: { ...authorityEnvelope.global_event, capacity_delta: initialCapacityDelta },
      capacity_delta: initialCapacityDelta,
      result_snapshot: {
        ...authorityEnvelope.result_snapshot,
        global_head: initialGlobalAfter,
        claim: { kind: "none" },
        batch_head: {
          ...authorityEnvelope.result_snapshot.batch_head,
          snapshot_version: "1",
          ledger_sequence: "1",
        },
      },
    } satisfies WorkflowBatchExecutionControlAuthorityEnvelopeV1);
    expect(decodeWorkflowBatchExecutionControlJsonV1(JSON.stringify(initialEnvelope), "authority_envelope").ok).toBe(true);

    const invalidInitialEnvelope = {
      ...initialEnvelope,
      after_batch_head: { ...initialEnvelope.after_batch_head, ledger_sequence: "2" },
      batch_event: { ...initialEnvelope.batch_event, ledger_sequence: "2" },
      result_snapshot: {
        ...initialEnvelope.result_snapshot,
        batch_head: { ...initialEnvelope.result_snapshot.batch_head, ledger_sequence: "2" },
      },
    } satisfies WorkflowBatchExecutionControlAuthorityEnvelopeV1;
    expect(decodeFailure(JSON.stringify(invalidInitialEnvelope), "authority_envelope")).toMatchObject({
      code: "invalid_scalar",
      path: "$.batch_event.previous_event_hash",
    });
  });

  it("closes every batch event transition, causation actor, and result claim overlay", () => {
    const positiveTransitions = [
      ["batch_opened", null, plannedNoClaimSnapshot, "client_command"],
      ["batch_claimed", "planned", plannedSnapshot, "client_command"],
      ["batch_claim_renewed", "planned", plannedSnapshot, "client_command"],
      ["batch_claim_released", "planned", plannedNoClaimSnapshot, "client_command"],
      ["executions_reserved", "planned", reservedSnapshot, "client_command"],
      ["execution_manifest_sealed", "executions_reserved", sealedSnapshot, "client_command"],
      ["client_commit_confirmed", "executions_sealed", clientCommitSnapshot, "client_command"],
      ["dispatch_recorded", "client_commit_confirmed", dispatchRecordedSnapshot, "client_command"],
      ["dispatch_effect_started", "dispatch_recorded", awaitingSnapshot, "owner_worker"],
      ["execution_completion_recorded", "awaiting_completion", completedSnapshot, "owner_worker"],
      ["claim_expired", "planned", plannedNoClaimSnapshot, "watchdog"],
      ["reservation_quarantined", "recovery_required_reserved_unsealed", quarantinedSnapshot, "client_command"],
      ["batch_reconciled", "recovery_required_dispatched", reconciledCompletedSnapshot, "client_command"],
    ] as const;
    for (const [eventType, beforeState, snapshot, actor] of positiveTransitions) {
      const candidate = envelopeForTransition(
        eventType,
        beforeState,
        snapshot as unknown as Record<string, unknown>,
        actor,
      );
      expect(decodeWorkflowBatchExecutionControlJsonV1(JSON.stringify(candidate), "authority_envelope")).toMatchObject({
        ok: true,
      });
    }

    const retainedSealedOriginDispatch = envelopeForTransition(
      "dispatch_recorded",
      "recovery_required_sealed_undispatched",
      dispatchedRecoverySnapshot as unknown as Record<string, unknown>,
      "client_command",
    );
    expect(decodeWorkflowBatchExecutionControlJsonV1(JSON.stringify(retainedSealedOriginDispatch), "authority_envelope")).toMatchObject({
      ok: true,
    });
    const retainedRecovery = (retainedSealedOriginDispatch.result_snapshot as Record<string, unknown>)
      .recovery as Record<string, unknown>;
    expect(retainedRecovery).toMatchObject({
      recovery_id: sealedRecovery.recovery_id,
      origin_state: "executions_sealed",
      recovery_hash: sealedRecovery.recovery_hash,
    });

    const wrongActor = clone(
      envelopeForTransition("batch_claimed", "planned", plannedSnapshot as unknown as Record<string, unknown>, "client_command"),
    );
    const workerCausation = causationForTest("owner_worker");
    wrongActor.causation = workerCausation;
    (wrongActor.batch_event as Record<string, unknown>).causation = workerCausation;
    (wrongActor.global_event as Record<string, unknown>).causation = workerCausation;
    expect(decodeFailure(JSON.stringify(wrongActor), "authority_envelope")).toMatchObject({
      code: "invalid_scalar",
      path: "$.batch_event.causation.kind",
    });

    for (const [eventType, beforeState, snapshot, correctActor, wrongActorKind] of [
      ["dispatch_effect_started", "dispatch_recorded", awaitingSnapshot, "owner_worker", "client_command"],
      ["execution_completion_recorded", "awaiting_completion", completedSnapshot, "owner_worker", "watchdog"],
      ["claim_expired", "planned", plannedNoClaimSnapshot, "watchdog", "owner_worker"],
    ] as const) {
      const candidate = clone(
        envelopeForTransition(
          eventType,
          beforeState,
          snapshot as unknown as Record<string, unknown>,
          correctActor,
        ),
      );
      const wrongCausation = causationForTest(wrongActorKind);
      candidate.causation = wrongCausation;
      (candidate.batch_event as Record<string, unknown>).causation = wrongCausation;
      (candidate.global_event as Record<string, unknown>).causation = wrongCausation;
      expect(decodeFailure(JSON.stringify(candidate), "authority_envelope")).toMatchObject({
        path: "$.batch_event.causation.kind",
      });
    }

    const claimedWithoutClaim = clone(
      envelopeForTransition("batch_claimed", "planned", plannedSnapshot as unknown as Record<string, unknown>, "client_command"),
    );
    (claimedWithoutClaim.result_snapshot as Record<string, unknown>).claim = { kind: "none" };
    expect(decodeFailure(JSON.stringify(claimedWithoutClaim), "authority_envelope")).toMatchObject({
      path: "$.result_snapshot.claim.kind",
    });

    const recoveryDispatchWithoutClaim = clone(retainedSealedOriginDispatch);
    (recoveryDispatchWithoutClaim.result_snapshot as Record<string, unknown>).claim = { kind: "none" };
    expect(decodeFailure(JSON.stringify(recoveryDispatchWithoutClaim), "authority_envelope")).toMatchObject({
      path: "$.result_snapshot.claim.kind",
    });

    const releasedWithClaim = clone(
      envelopeForTransition("batch_claim_released", "planned", plannedNoClaimSnapshot as unknown as Record<string, unknown>, "client_command"),
    );
    (releasedWithClaim.result_snapshot as Record<string, unknown>).claim = ordinaryClaim;
    expect(decodeFailure(JSON.stringify(releasedWithClaim), "authority_envelope")).toMatchObject({
      path: "$.result_snapshot.claim.kind",
    });

    const completionProgressSnapshot = clone(awaitingOriginRecoverySnapshot) as unknown as Record<string, unknown>;
    completionProgressSnapshot.completion_status = completion;
    const noOpCompletion = clone(envelopeForTransition(
      "execution_completion_recorded",
      "recovery_required_dispatched",
      completionProgressSnapshot,
      "owner_worker",
    ));
    (noOpCompletion.result_snapshot as Record<string, unknown>).completion_status = noCompletion;
    expect(decodeFailure(JSON.stringify(noOpCompletion), "authority_envelope")).toMatchObject({
      path: "$.result_snapshot.completion_status.kind",
    });

    const recoveryEffectProgressSnapshot = clone(dispatchedRecoverySnapshot) as unknown as Record<string, unknown>;
    recoveryEffectProgressSnapshot.dispatch_effect_status = dispatchEffect;
    const validRecoveryEffectStart = envelopeForTransition(
      "dispatch_effect_started",
      "recovery_required_dispatched",
      recoveryEffectProgressSnapshot,
      "owner_worker",
    );
    const effectStartWithoutStartedFact = clone(validRecoveryEffectStart);
    (effectStartWithoutStartedFact.result_snapshot as Record<string, unknown>).dispatch_effect_status =
      recordedDispatchEffect;
    expect(decodeFailure(JSON.stringify(effectStartWithoutStartedFact), "authority_envelope")).toMatchObject({
      path: "$.result_snapshot.dispatch_effect_status.kind",
    });

    const duplicateRecoveryEffectStart = clone(validRecoveryEffectStart);
    (duplicateRecoveryEffectStart.result_snapshot as Record<string, unknown>).recovery = {
      ...recovery,
      origin_state: "awaiting_completion",
    };
    expect(decodeFailure(JSON.stringify(duplicateRecoveryEffectStart), "authority_envelope")).toMatchObject({
      path: "$.result_snapshot.recovery.origin_state",
    });

    const collapsedDispatch = clone(retainedSealedOriginDispatch);
    const collapsedDispatchSnapshot = collapsedDispatch.result_snapshot as Record<string, unknown>;
    collapsedDispatchSnapshot.dispatch_effect_status = dispatchEffect;
    collapsedDispatchSnapshot.completion_status = completion;
    expect(decodeFailure(JSON.stringify(collapsedDispatch), "authority_envelope")).toMatchObject({
      path: "$.result_snapshot.dispatch_effect_status.kind",
    });

    const recoveryCommitWithoutConfirmation = clone(envelopeForTransition(
      "client_commit_confirmed",
      "recovery_required_sealed_undispatched",
      confirmedSealedRecoverySnapshot as unknown as Record<string, unknown>,
      "client_command",
    ));
    (recoveryCommitWithoutConfirmation.result_snapshot as Record<string, unknown>).client_commit_status = {
      kind: "not_confirmed",
    };
    expect(decodeFailure(JSON.stringify(recoveryCommitWithoutConfirmation), "authority_envelope")).toMatchObject({
      path: "$.result_snapshot.client_commit_status.kind",
    });

    const duplicateRecoveryCommit = clone(
      envelopeForTransition(
        "client_commit_confirmed",
        "recovery_required_sealed_undispatched",
        confirmedSealedRecoverySnapshot as unknown as Record<string, unknown>,
        "client_command",
      ),
    );
    (duplicateRecoveryCommit.result_snapshot as Record<string, unknown>).recovery = {
      ...sealedRecovery,
      origin_state: "client_commit_confirmed",
    };
    expect(decodeFailure(JSON.stringify(duplicateRecoveryCommit), "authority_envelope")).toMatchObject({
      path: "$.result_snapshot.recovery.origin_state",
    });

    const sealedEntrySnapshot = clone(sealedRecoverySnapshot) as unknown as Record<string, unknown>;
    sealedEntrySnapshot.claim = { kind: "none" };
    const sealedEntryWithCommit = clone(
      envelopeForTransition("batch_claim_released", "executions_sealed", sealedEntrySnapshot, "client_command"),
    );
    (sealedEntryWithCommit.result_snapshot as Record<string, unknown>).client_commit_status = {
      kind: "confirmed",
      ...clientCommit,
    };
    expect(decodeFailure(JSON.stringify(sealedEntryWithCommit), "authority_envelope")).toMatchObject({
      path: "$.result_snapshot.client_commit_status.kind",
    });

    const commitEntrySnapshot = clone(confirmedSealedRecoverySnapshot) as unknown as Record<string, unknown>;
    commitEntrySnapshot.claim = { kind: "none" };
    (commitEntrySnapshot.recovery as Record<string, unknown>).origin_state = "client_commit_confirmed";
    const commitEntryWithSealedOrigin = clone(
      envelopeForTransition("batch_claim_released", "client_commit_confirmed", commitEntrySnapshot, "client_command"),
    );
    (commitEntryWithSealedOrigin.result_snapshot as Record<string, unknown>).recovery = sealedRecovery;
    expect(decodeFailure(JSON.stringify(commitEntryWithSealedOrigin), "authority_envelope")).toMatchObject({
      path: "$.result_snapshot.recovery.origin_state",
    });

    const dispatchEntrySnapshot = clone(dispatchedRecoverySnapshot) as unknown as Record<string, unknown>;
    dispatchEntrySnapshot.claim = { kind: "none" };
    (dispatchEntrySnapshot.recovery as Record<string, unknown>).origin_state = "dispatch_recorded";
    const dispatchEntryWithSealedOrigin = clone(
      envelopeForTransition("batch_claim_released", "dispatch_recorded", dispatchEntrySnapshot, "client_command"),
    );
    (dispatchEntryWithSealedOrigin.result_snapshot as Record<string, unknown>).recovery = sealedRecovery;
    expect(decodeFailure(JSON.stringify(dispatchEntryWithSealedOrigin), "authority_envelope")).toMatchObject({
      path: "$.result_snapshot.recovery.origin_state",
    });

    const awaitingEntrySnapshot = clone(awaitingOriginRecoverySnapshot) as unknown as Record<string, unknown>;
    awaitingEntrySnapshot.claim = { kind: "none" };
    const awaitingEntryWithDispatchOrigin = clone(
      envelopeForTransition("batch_claim_released", "awaiting_completion", awaitingEntrySnapshot, "client_command"),
    );
    (awaitingEntryWithDispatchOrigin.result_snapshot as Record<string, unknown>).recovery = recovery;
    expect(decodeFailure(JSON.stringify(awaitingEntryWithDispatchOrigin), "authority_envelope")).toMatchObject({
      path: "$.result_snapshot.recovery.origin_state",
    });
  });

  it("rejects batch-opened misuse and every terminal-state outgoing transition", () => {
    const openedAfterReserved = clone(
      envelopeForTransition("executions_reserved", "planned", reservedSnapshot as unknown as Record<string, unknown>, "client_command"),
    );
    openedAfterReserved.before_batch_head = null;
    const openedEvent = openedAfterReserved.batch_event as Record<string, unknown>;
    openedEvent.event_type = "batch_opened";
    openedEvent.ledger_sequence = "1";
    openedEvent.previous_event_hash = null;
    (openedAfterReserved.after_batch_head as Record<string, unknown>).ledger_sequence = "1";
    (openedAfterReserved.after_batch_head as Record<string, unknown>).snapshot_version = "1";
    const openedSnapshotHead = (openedAfterReserved.result_snapshot as Record<string, unknown>)
      .batch_head as Record<string, unknown>;
    openedSnapshotHead.ledger_sequence = "1";
    openedSnapshotHead.snapshot_version = "1";
    expect(decodeFailure(JSON.stringify(openedAfterReserved), "authority_envelope")).toMatchObject({
      path: "$.batch_event.event_type",
    });

    const openedWithExistingBefore = clone(
      envelopeForTransition("batch_claimed", "planned", plannedSnapshot as unknown as Record<string, unknown>, "client_command"),
    );
    (openedWithExistingBefore.batch_event as Record<string, unknown>).event_type = "batch_opened";
    expect(decodeFailure(JSON.stringify(openedWithExistingBefore), "authority_envelope")).toMatchObject({
      path: "$.batch_event.event_type",
    });

    for (const terminalState of [
      "completed",
      "quarantined_cancelled",
      "reconciled_completed",
      "reconciled_unresolved",
    ]) {
      const candidate = clone(
        envelopeForTransition("batch_claimed", "planned", plannedSnapshot as unknown as Record<string, unknown>, "client_command"),
      );
      (candidate.before_batch_head as Record<string, unknown>).state = terminalState;
      expect(decodeFailure(JSON.stringify(candidate), "authority_envelope")).toMatchObject({
        path: "$.before_batch_head.state",
      });
    }
  });

  it("closes snapshot reservation, manifest, dispatch, completion, and recovery identity facts", () => {
    const completedObservation = withReadObservationHashForTest({
      ...readObservation,
      as_of_batch_head: completedSnapshot.batch_head,
      as_of_global_head: completedSnapshot.global_head,
      result: completedSnapshot,
    } satisfies WorkflowBatchExecutionControlReadObservationV1<WorkflowBatchExecutionControlCompletedSnapshotV1>);
    const reservedRecoveryObservation = withReadObservationHashForTest({
      ...readObservation,
      as_of_batch_head: reservedRecoverySnapshot.batch_head,
      as_of_global_head: reservedRecoverySnapshot.global_head,
      result: reservedRecoverySnapshot,
    } satisfies WorkflowBatchExecutionControlReadObservationV1<WorkflowBatchExecutionControlReservedRecoverySnapshotV1>);
    const quarantinedObservation = withReadObservationHashForTest({
      ...readObservation,
      as_of_batch_head: quarantinedSnapshot.batch_head,
      as_of_global_head: quarantinedSnapshot.global_head,
      result: quarantinedSnapshot,
    } satisfies WorkflowBatchExecutionControlReadObservationV1<WorkflowBatchExecutionControlQuarantinedSnapshotV1>);
    const reconciledObservation = withReadObservationHashForTest({
      ...readObservation,
      as_of_batch_head: reconciledCompletedSnapshot.batch_head,
      as_of_global_head: reconciledCompletedSnapshot.global_head,
      result: reconciledCompletedSnapshot,
    } satisfies WorkflowBatchExecutionControlReadObservationV1<WorkflowBatchExecutionControlReconciledCompletedSnapshotV1>);

    for (const candidate of [
      completedObservation,
      reservedRecoveryObservation,
      quarantinedObservation,
      reconciledObservation,
    ]) {
      expect(decodeWorkflowBatchExecutionControlJsonV1(JSON.stringify(candidate), "read_observation").ok).toBe(true);
    }

    const expectSnapshotTamper = (
      source: WorkflowBatchExecutionControlReadObservationV1<unknown>,
      mutate: (snapshot: Record<string, unknown>) => void,
      expectedPath: string,
      expectedCode: WorkflowBatchExecutionControlDecodeFindingV1["code"] = "invalid_scalar",
    ): void => {
      const candidate = clone(source) as unknown as Record<string, unknown>;
      mutate(candidate.result as Record<string, unknown>);
      expect(decodeFailure(JSON.stringify(candidate), "read_observation")).toMatchObject({
        code: expectedCode,
        path: expectedPath,
      });
    };

    expectSnapshotTamper(completedObservation, (snapshot) => {
      (snapshot.reservation as Record<string, unknown>).logical_unit_collection_root = hashes.f;
    }, "$.result.reservation.logical_unit_collection_root");
    expectSnapshotTamper(completedObservation, (snapshot) => {
      const allocations = (snapshot.reservation as Record<string, unknown>).allocations as Array<Record<string, unknown>>;
      allocations[0].workload_class_hash = hashes.f;
    }, "$.result.reservation.allocations[0].workload_class_hash");
    expectSnapshotTamper(completedObservation, (snapshot) => {
      (snapshot.seal as Record<string, unknown>).reservation_hash = hashes.f;
    }, "$.result.seal.reservation_hash");
    expectSnapshotTamper(completedObservation, (snapshot) => {
      (snapshot.seal as Record<string, unknown>).allocation_count = 2;
    }, "$.result.seal.allocation_count");
    expectSnapshotTamper(completedObservation, (snapshot) => {
      (snapshot.client_commit as Record<string, unknown>).execution_manifest_hash = hashes.f;
    }, "$.result.client_commit.execution_manifest_hash");
    expectSnapshotTamper(completedObservation, (snapshot) => {
      (snapshot.dispatch as Record<string, unknown>).client_commit_hash = hashes.f;
    }, "$.result.dispatch.client_commit_hash");
    expectSnapshotTamper(completedObservation, (snapshot) => {
      (snapshot.dispatch_effect_status as Record<string, unknown>).dispatch_commit_hash = hashes.f;
    }, "$.result.dispatch_effect_status.dispatch_commit_hash");
    expectSnapshotTamper(completedObservation, (snapshot) => {
      const status = snapshot.completion_status as Record<string, unknown>;
      status.receipt_count = 2;
      status.expected_count = 2;
    }, "$.result.completion_status.expected_count");
    expectSnapshotTamper(reservedRecoveryObservation, (snapshot) => {
      (snapshot.claim as Record<string, unknown>).original_identity_collection_hash = hashes.f;
    }, "$.result.claim.original_identity_collection_hash");
    expectSnapshotTamper(reservedRecoveryObservation, (snapshot) => {
      (snapshot.recovery as Record<string, unknown>).origin_state = "dispatch_recorded";
    }, "$.result.recovery.origin_state", "invalid_discriminator");
    expectSnapshotTamper(quarantinedObservation, (snapshot) => {
      (snapshot.tombstone as Record<string, unknown>).reservation_hash = hashes.f;
    }, "$.result.tombstone.reservation_hash");
    expectSnapshotTamper(reconciledObservation, (snapshot) => {
      (snapshot.reconciliation as Record<string, unknown>).original_identity_collection_hash = hashes.f;
    }, "$.result.reconciliation.original_identity_collection_hash");
    expectSnapshotTamper(reconciledObservation, (snapshot) => {
      (snapshot.reconciliation as Record<string, unknown>).completion_collection_root = hashes.f;
    }, "$.result.reconciliation.completion_collection_root");
    expectSnapshotTamper(reconciledObservation, (snapshot) => {
      (snapshot.reconciliation as Record<string, unknown>).lifecycle_head = hashes.f;
    }, "$.result.reconciliation.lifecycle_head");
  });

  it("binds read operation, result schema, page, fixed heads, pins, scope, and batch history identity", () => {
    const mismatchedQuery = {
      ...readQuery,
      query: { ...readQuery.query, operation: "read_global_admission_snapshot" },
    };
    expect(decodeFailure(JSON.stringify(mismatchedQuery), "read_query")).toMatchObject({
      code: "invalid_scalar",
      path: "$.query.operation",
    });

    const mismatchedSnapshotHead = {
      ...readObservation,
      as_of_batch_head: { ...readObservation.as_of_batch_head, snapshot_version: "3" },
    } satisfies WorkflowBatchExecutionControlReadObservationV1<WorkflowBatchExecutionControlPlannedSnapshotV1>;
    expect(decodeFailure(JSON.stringify(mismatchedSnapshotHead), "read_observation")).toMatchObject({
      code: "invalid_scalar",
      path: "$.result.batch_head",
    });

    const mismatchedSnapshotPins = {
      ...readObservation,
      result: {
        ...readObservation.result,
        pins: { ...readObservation.result.pins, contract_revision: "other-revision" },
      },
    } satisfies WorkflowBatchExecutionControlReadObservationV1<WorkflowBatchExecutionControlPlannedSnapshotV1>;
    expect(decodeFailure(JSON.stringify(mismatchedSnapshotPins), "read_observation")).toMatchObject({
      code: "invalid_scalar",
      path: "$.result.pins",
    });

    const mismatchedSnapshotScope = {
      ...readObservation,
      result: {
        ...readObservation.result,
        scope: { ...readObservation.result.scope, scope_id: "other-scope" },
      },
    } satisfies WorkflowBatchExecutionControlReadObservationV1<WorkflowBatchExecutionControlPlannedSnapshotV1>;
    expect(decodeFailure(JSON.stringify(mismatchedSnapshotScope), "read_observation")).toMatchObject({
      code: "invalid_scalar",
      path: "$.result.scope",
    });

    const globalObservation = withReadObservationHashForTest({
      ...readObservation,
      query_binding: { ...readObservation.query_binding, operation: "read_global_admission_snapshot" },
      result: globalAfter,
    } satisfies WorkflowBatchExecutionControlReadObservationV1<WorkflowBatchExecutionControlGlobalHeadV1>);
    expect(decodeWorkflowBatchExecutionControlJsonV1(JSON.stringify(globalObservation), "read_observation").ok).toBe(true);
    const badGlobalObservation = {
      ...globalObservation,
      result: { ...globalObservation.result, admission_root: hashes.f },
    } satisfies WorkflowBatchExecutionControlReadObservationV1<WorkflowBatchExecutionControlGlobalHeadV1>;
    expect(decodeFailure(JSON.stringify(badGlobalObservation), "read_observation")).toMatchObject({
      code: "invalid_scalar",
      path: "$.result",
    });

    const capability = {
      schema_version: 1,
      capability_family: "workflow_batch_execution_control_v1",
      capability_version: 1,
      enabled: true,
      supported_scope_kinds: ["organization", "platform", "workspace"],
      trust_mode: "opaque_owner_readback_v1",
      pins,
      limits: {
        min_lease_ttl_seconds: 30,
        max_lease_ttl_seconds: 900,
        max_reported_clock_skew_seconds: 0,
        minimum_audit_retention_seconds: 1,
        max_active_claims: 1,
        max_active_reserved_executions: 1,
        max_lifetime_logical_units: 1,
        max_lifetime_task_ids: 1,
        max_lifetime_execution_ids: 1,
      },
    } satisfies WorkflowBatchExecutionControlCapabilityDescriptorV1;
    const capabilityObservation = withReadObservationHashForTest({
      ...readObservation,
      query_binding: { ...readObservation.query_binding, operation: "describe_capability" },
      result: capability,
    } satisfies WorkflowBatchExecutionControlReadObservationV1<WorkflowBatchExecutionControlCapabilityDescriptorV1>);
    expect(decodeWorkflowBatchExecutionControlJsonV1(JSON.stringify(capabilityObservation), "read_observation").ok).toBe(true);

    const history = [
      { owner_event: batchEvent, authority_envelope_hash: hashes.e, receipt_ref: "receipt-1" },
    ] satisfies WorkflowBatchExecutionControlHistoryItemV1[];
    const historyObservation = withReadObservationHashForTest({
      ...readObservation,
      query_binding: { ...readObservation.query_binding, operation: "read_batch_history_page" },
      page: {
        kind: "collection_page",
        cursor_start: null,
        cursor_end: null,
        next_cursor: null,
        limit: 1,
        item_count: 1,
        page_hash: hashes.a,
        full_collection_root: hashes.b,
      },
      result: history,
    } satisfies WorkflowBatchExecutionControlReadObservationV1<WorkflowBatchExecutionControlHistoryItemV1[]>);
    expect(decodeWorkflowBatchExecutionControlJsonV1(JSON.stringify(historyObservation), "read_observation").ok).toBe(true);
    const wrongHistoryBatch = clone(historyObservation) as unknown as Record<string, unknown>;
    const historyItems = wrongHistoryBatch.result as Array<Record<string, unknown>>;
    const historyEvent = historyItems[0].owner_event as Record<string, unknown>;
    (historyEvent.stream as Record<string, unknown>).owner_batch_id = "batch-other";
    expect(decodeFailure(JSON.stringify(wrongHistoryBatch), "read_observation")).toMatchObject({
      code: "invalid_scalar",
      path: "$.result[0].owner_event.stream.owner_batch_id",
    });

    const tooManyItems = clone(historyObservation) as unknown as Record<string, unknown>;
    const page = tooManyItems.page as Record<string, unknown>;
    page.limit = 1;
    page.item_count = 2;
    expect(decodeFailure(JSON.stringify(tooManyItems), "read_observation")).toMatchObject({
      code: "invalid_scalar",
      path: "$.page.item_count",
    });
  });

  it("verifies exact read request-observation pairs including operation-specific lookup identity and pages", () => {
    expect(verifyWorkflowBatchExecutionControlReadObservationV1(readQuery, readObservation)).toMatchObject({ ok: true });
    for (const [mutate, expectedPath] of [
      [(input: Record<string, unknown>) => {
        (input.query as Record<string, unknown>).query_id = "query-other";
      }, "$.observation.query_binding"],
      [(input: Record<string, unknown>) => {
        (input.expected_pins as Record<string, unknown>).contract_revision = "other-revision";
      }, "$.observation.pins"],
      [(input: Record<string, unknown>) => {
        (input.scope as Record<string, unknown>).scope_id = "other-scope";
      }, "$.observation.scope"],
      [(input: Record<string, unknown>) => {
        (input.as_of_batch_head as Record<string, unknown>).snapshot_version = "3";
      }, "$.observation.as_of_batch_head"],
      [(input: Record<string, unknown>) => {
        (input.as_of_global_head as Record<string, unknown>).registry_version = "5";
      }, "$.observation.as_of_global_head"],
    ] as const) {
      const input = clone(readQuery) as unknown as Record<string, unknown>;
      mutate(input);
      expect(verifyWorkflowBatchExecutionControlReadObservationV1(input, readObservation)).toMatchObject({
        ok: false,
        findings: [expect.objectContaining({ path: expectedPath })],
      });
    }

    const outcomeQuery = {
      operation: "read_request_outcome",
      schema_version: 1,
      expected_pins: pins,
      scope,
      query: {
        operation: "read_request_outcome",
        query_id: "query-outcome-1",
        query_hash: hashes.a,
        read_policy: readPolicy,
        client_generation_key: binding.client_generation_key,
        command_id: requestMeta.command_id,
        idempotency_key: requestMeta.idempotency_key,
        request_hash: checkedCreateRequest.request_meta.request_hash,
      },
      as_of_batch_head: batchAfter,
      as_of_global_head: globalAfter,
    } as const;
    const outcomeObservation = withReadObservationHashForTest({
      ...readObservation,
      query_binding: outcomeQuery.query,
      result: { kind: "not_found" },
    });
    expect(decodeWorkflowBatchExecutionControlJsonV1(JSON.stringify(outcomeQuery), "read_query")).toMatchObject({ ok: true });
    expect(decodeWorkflowBatchExecutionControlJsonV1(JSON.stringify(outcomeObservation), "read_observation")).toMatchObject({ ok: true });
    expect(verifyWorkflowBatchExecutionControlReadObservationV1(outcomeQuery, outcomeObservation)).toMatchObject({ ok: true });

    const swappedLookupIdentity = clone(outcomeQuery) as unknown as Record<string, unknown>;
    (swappedLookupIdentity.query as Record<string, unknown>).command_id = "command-other";
    expect(verifyWorkflowBatchExecutionControlReadObservationV1(swappedLookupIdentity, outcomeObservation)).toMatchObject({
      ok: false,
      findings: [expect.objectContaining({ path: "$.observation.query_binding" })],
    });
    const legacyTopLevelIdentity = { ...outcomeQuery, command_id: requestMeta.command_id };
    expect(decodeFailure(JSON.stringify(legacyTopLevelIdentity), "read_query")).toMatchObject({
      code: "unknown_key",
      path: "$.command_id",
    });

    const historyEvent10 = {
      ...batchEvent,
      event_id: "batch-event-10",
      ledger_sequence: "10",
      previous_event_hash: hashes.b,
      event_hash: hashes.a,
    };
    const historyEvent11 = {
      ...batchEvent,
      event_id: "batch-event-11",
      ledger_sequence: "11",
      previous_event_hash: historyEvent10.event_hash,
      event_hash: batchAfter.last_event_hash,
    };
    const historyResult = [historyEvent10, historyEvent11].map((ownerEvent, index) => ({
      owner_event: ownerEvent,
      authority_envelope_hash: hashes.e,
      receipt_ref: `history-receipt-${index}`,
    }));
    const historyQuery = {
      operation: "read_batch_history_page",
      schema_version: 1,
      expected_pins: pins,
      scope,
      query: {
        operation: "read_batch_history_page",
        query_id: "query-history-1",
        query_hash: hashes.a,
        read_policy: readPolicy,
      },
      as_of_batch_head: batchAfter,
      as_of_global_head: globalAfter,
      cursor: null,
      limit: 2,
    } as const;
    const historyObservation = withReadObservationHashForTest({
      ...readObservation,
      query_binding: historyQuery.query,
      page: {
        kind: "collection_page",
        cursor_start: null,
        cursor_end: null,
        next_cursor: null,
        limit: 2,
        item_count: 2,
        page_hash: hashes.a,
        full_collection_root: hashes.b,
      },
      result: historyResult,
    });
    expect(verifyWorkflowBatchExecutionControlReadObservationV1(historyQuery, historyObservation)).toMatchObject({ ok: true });

    const wrongCursor = { ...historyQuery, cursor: "abcdefghijklmnop" };
    expect(verifyWorkflowBatchExecutionControlReadObservationV1(wrongCursor, historyObservation)).toMatchObject({
      ok: false,
      findings: [expect.objectContaining({ path: "$.observation.page.cursor_start" })],
    });
    const wrongLimit = { ...historyQuery, limit: 1 };
    expect(verifyWorkflowBatchExecutionControlReadObservationV1(wrongLimit, historyObservation)).toMatchObject({
      ok: false,
      findings: [expect.objectContaining({ path: "$.observation.page.limit" })],
    });

    for (const [mutate, expectedPath] of [
      [(observation: Record<string, unknown>) => {
        const events = observation.result as Array<Record<string, unknown>>;
        (events[1].owner_event as Record<string, unknown>).ledger_sequence = "12";
      }, "$.result[1].owner_event.ledger_sequence"],
      [(observation: Record<string, unknown>) => {
        const events = observation.result as Array<Record<string, unknown>>;
        (events[1].owner_event as Record<string, unknown>).ledger_sequence = "10";
      }, "$.result[1].owner_event.ledger_sequence"],
      [(observation: Record<string, unknown>) => {
        (observation.result as unknown[]).reverse();
      }, "$.result[1].owner_event.ledger_sequence"],
      [(observation: Record<string, unknown>) => {
        const events = observation.result as Array<Record<string, unknown>>;
        (events[1].owner_event as Record<string, unknown>).previous_event_hash = hashes.f;
      }, "$.result[1].owner_event.previous_event_hash"],
      [(observation: Record<string, unknown>) => {
        const events = observation.result as Array<Record<string, unknown>>;
        (events[1].owner_event as Record<string, unknown>).event_hash = hashes.f;
      }, "$.result[1].owner_event.event_hash"],
      [(observation: Record<string, unknown>) => {
        const events = observation.result as Array<Record<string, unknown>>;
        (events[0].owner_event as Record<string, unknown>).stream = {
          kind: "global",
          owner_namespace: pins.owner_namespace,
        };
      }, "$.result[0].owner_event.stream.owner_namespace"],
    ] as const) {
      const candidate = clone(historyObservation) as unknown as Record<string, unknown>;
      mutate(candidate);
      expect(decodeFailure(JSON.stringify(candidate), "read_observation")).toMatchObject({ path: expectedPath });
    }
  });

  it("constructs exact self-excluding request, envelope, and read-observation projections", () => {
    const { request_hash: createRequestHash, ...expectedCreateRequestMeta } = checkedCreateRequest.request_meta;
    const createProjection = expectProjection(
      createWorkflowBatchExecutionControlRequestHashProjectionV1(checkedCreateRequest),
    );
    expect(createProjection).toEqual({ ...checkedCreateRequest, request_meta: expectedCreateRequestMeta });
    expect(createRequestHash).toBe(
      domainHashForTest(workflowBatchExecutionControlRequestDomainPrefixV1, createProjection),
    );

    const { request_hash: mutationRequestHash, ...expectedMutationRequestMeta } = commandFixtures[0].request_meta;
    const requestProjection = expectProjection(
      createWorkflowBatchExecutionControlRequestHashProjectionV1(commandFixtures[0]),
    );
    expect(requestProjection).toEqual({ ...commandFixtures[0], request_meta: expectedMutationRequestMeta });
    expect(mutationRequestHash).toBe(
      domainHashForTest(workflowBatchExecutionControlRequestDomainPrefixV1, requestProjection),
    );

    const { authority_envelope_hash: authorityEnvelopeHash, ...expectedEnvelopeProjection } = authorityEnvelope;
    const envelopeProjection = expectProjection(
      createWorkflowBatchExecutionControlAuthorityEnvelopeHashProjectionV1(authorityEnvelope),
    );
    expect(envelopeProjection).toEqual(expectedEnvelopeProjection);
    expect(authorityEnvelopeHash).toMatch(/^[a-f0-9]{64}$/);

    const { read_observation_hash: readObservationHash, ...expectedObservationProjection } = readObservation;
    const observationProjection = expectProjection(
      createWorkflowBatchExecutionControlReadObservationHashProjectionV1(readObservation),
    );
    expect(observationProjection).toEqual(expectedObservationProjection);
    expect(readObservationHash).toMatch(/^[a-f0-9]{64}$/);

    expect(createWorkflowBatchExecutionControlRequestHashProjectionV1(resumeRequest)).toMatchObject({ ok: false });
  });

  it("recomputes every raw domain hash while keeping output-hash projection helpers non-recursive", () => {
    for (const [kind, source, hashContainer, hashKey, expectedPath] of [
      ["open_input", checkedCreateRequest, "request_meta", "request_hash", "$.request_meta.request_hash"],
      ["mutation_command", commandFixtures[0], "request_meta", "request_hash", "$.request_meta.request_hash"],
      ["authority_envelope", authorityEnvelope, null, "authority_envelope_hash", "$.authority_envelope_hash"],
      ["read_observation", readObservation, null, "read_observation_hash", "$.read_observation_hash"],
    ] as const) {
      const candidate = clone(source) as unknown as Record<string, unknown>;
      const container = hashContainer === null ? candidate : (candidate[hashContainer] as Record<string, unknown>);
      container[hashKey] = hashes.a;
      expect(decodeFailure(JSON.stringify(candidate), kind)).toMatchObject({
        code: "invalid_hash_projection",
        path: expectedPath,
      });
    }

    const mutatedCreateHash = clone(checkedCreateRequest) as unknown as Record<string, unknown>;
    (mutatedCreateHash.request_meta as Record<string, unknown>).request_hash = hashes.a;
    expect(createWorkflowBatchExecutionControlRequestHashProjectionV1(mutatedCreateHash)).toMatchObject({ ok: true });
    const mutatedEnvelopeHash = { ...authorityEnvelope, authority_envelope_hash: hashes.a };
    expect(createWorkflowBatchExecutionControlAuthorityEnvelopeHashProjectionV1(mutatedEnvelopeHash)).toMatchObject({ ok: true });
    const mutatedObservationHash = { ...readObservation, read_observation_hash: hashes.a };
    expect(createWorkflowBatchExecutionControlReadObservationHashProjectionV1(mutatedObservationHash)).toMatchObject({ ok: true });
  });

  it("binds envelope dispatch hash exactly to snapshot dispatch presence and value", () => {
    const dispatchedEnvelope = envelopeForTransition(
      "dispatch_recorded",
      "client_commit_confirmed",
      dispatchRecordedSnapshot as unknown as Record<string, unknown>,
      "client_command",
    );
    expect(decodeWorkflowBatchExecutionControlJsonV1(JSON.stringify(dispatchedEnvelope), "authority_envelope")).toMatchObject({
      ok: true,
    });
    for (const dispatchCommitHash of [null, hashes.a]) {
      const candidate = { ...dispatchedEnvelope, dispatch_commit_hash: dispatchCommitHash };
      expect(decodeFailure(JSON.stringify(candidate), "authority_envelope")).toMatchObject({
        code: "invalid_scalar",
        path: "$.dispatch_commit_hash",
      });
    }
    const undispatchedEnvelope = envelopeForTransition(
      "batch_claimed",
      "planned",
      plannedSnapshot as unknown as Record<string, unknown>,
      "client_command",
    );
    undispatchedEnvelope.dispatch_commit_hash = hashes.e;
    expect(decodeFailure(JSON.stringify(undispatchedEnvelope), "authority_envelope")).toMatchObject({
      code: "invalid_scalar",
      path: "$.dispatch_commit_hash",
    });
  });

  it("closes recovery snapshot unions, reconciliation roots, and state-specific claim grants", () => {
    for (const snapshot of [
      sealedRecoverySnapshot,
      confirmedSealedRecoverySnapshot,
      dispatchedRecoverySnapshot,
      awaitingOriginRecoverySnapshot,
      dispatchedUnresolvedSnapshot,
      sealedUnresolvedSnapshot,
      quarantinedSnapshot,
    ]) {
      const observation = observationForSnapshot(snapshot as unknown as Record<string, unknown>);
      expect(decodeWorkflowBatchExecutionControlJsonV1(JSON.stringify(observation), "read_observation")).toMatchObject({
        ok: true,
      });
    }

    const unconfirmedClientOrigin = clone(sealedRecoverySnapshot) as unknown as Record<string, unknown>;
    (unconfirmedClientOrigin.recovery as Record<string, unknown>).origin_state = "client_commit_confirmed";
    expect(decodeFailure(JSON.stringify(observationSeedForSnapshot(unconfirmedClientOrigin)), "read_observation")).toMatchObject({
      path: "$.result.client_commit_status.kind",
    });

    const awaitingOriginWithoutStartedEffect = clone(dispatchedRecoverySnapshot) as unknown as Record<string, unknown>;
    (awaitingOriginWithoutStartedEffect.recovery as Record<string, unknown>).origin_state = "awaiting_completion";
    expect(decodeFailure(JSON.stringify(observationSeedForSnapshot(awaitingOriginWithoutStartedEffect)), "read_observation")).toMatchObject({
      path: "$.result.dispatch_effect_status.kind",
    });

    const badDispatchedRoot = clone(dispatchedUnresolvedSnapshot) as unknown as Record<string, unknown>;
    (badDispatchedRoot.reconciliation as Record<string, unknown>).completion_collection_root = hashes.f;
    expect(decodeFailure(JSON.stringify(observationSeedForSnapshot(badDispatchedRoot)), "read_observation")).toMatchObject({
      path: "$.result.reconciliation.completion_collection_root",
    });

    const badSealedRoots = clone(sealedUnresolvedSnapshot) as unknown as Record<string, unknown>;
    (badSealedRoots.reconciliation as Record<string, unknown>).completion_collection_root = hashes.a;
    expect(decodeFailure(JSON.stringify(observationSeedForSnapshot(badSealedRoots)), "read_observation")).toMatchObject({
      path: "$.result.reconciliation.completion_collection_root",
    });

    const widenedDispatchedClaim = clone(dispatchedRecoverySnapshot) as unknown as Record<string, unknown>;
    (widenedDispatchedClaim.claim as Record<string, unknown>).allowed_operations = [
      "quarantine_reservation",
      "reconcile_batch",
      "release_batch_claim",
      "renew_batch_claim",
    ];
    expect(decodeFailure(JSON.stringify(observationSeedForSnapshot(widenedDispatchedClaim)), "read_observation")).toMatchObject({
      path: "$.result.claim.allowed_operations[0]",
    });

    const emptyRecoveryGrant = clone(reservedRecoverySnapshot) as unknown as Record<string, unknown>;
    (emptyRecoveryGrant.claim as Record<string, unknown>).allowed_operations = [];
    expect(decodeFailure(JSON.stringify(observationSeedForSnapshot(emptyRecoveryGrant)), "read_observation")).toMatchObject({
      code: "invalid_scalar",
      path: "$.result.claim.allowed_operations",
    });
  });

  it("binds recovery mutations to claim operation, policy, and quarantine identity", () => {
    const quarantine = commandFixtures.find((command) => command.operation === "quarantine_reservation");
    expect(quarantine).toBeDefined();
    if (quarantine === undefined) throw new Error("Missing quarantine fixture.");

    const disallowedOperation = clone(quarantine) as unknown as Record<string, unknown>;
    disallowedOperation.current_claim = dispatchedRecoveryClaim;
    expect(decodeFailure(JSON.stringify(disallowedOperation), "mutation_command")).toMatchObject({
      path: "$.current_claim.allowed_operations[0]",
    });

    const mismatchedPolicy = clone(quarantine) as unknown as Record<string, unknown>;
    mismatchedPolicy.policy_decision = {
      ...(mismatchedPolicy.policy_decision as Record<string, unknown>),
      decision_hash: hashes.f,
    };
    expect(decodeFailure(JSON.stringify(mismatchedPolicy), "mutation_command")).toMatchObject({
      path: "$.policy_decision",
    });

    const mismatchedIdentity = clone(quarantine) as unknown as Record<string, unknown>;
    (mismatchedIdentity.payload as Record<string, unknown>).original_identity_collection_hash = hashes.f;
    expect(decodeFailure(JSON.stringify(mismatchedIdentity), "mutation_command")).toMatchObject({
      path: "$.payload.original_identity_collection_hash",
    });

    const emptyRequestedOperations = clone(commandFixtures[1]) as unknown as Record<string, unknown>;
    (emptyRequestedOperations.payload as Record<string, unknown>).requested_operations = [];
    expect(decodeFailure(JSON.stringify(emptyRequestedOperations), "mutation_command")).toMatchObject({
      code: "invalid_scalar",
      path: "$.payload.requested_operations",
    });
  });

  it("enforces bounded claim leases, recovery policy windows, and descriptor lease bounds", () => {
    for (const leaseExpiresAt of [
      "2026-07-22T23:59:59.000Z",
      "2026-07-23T00:00:29.999Z",
      "2026-07-23T00:15:00.001Z",
    ]) {
      const candidate = clone(commandFixtures[2]) as unknown as Record<string, unknown>;
      (candidate.current_claim as Record<string, unknown>).lease_expires_at = leaseExpiresAt;
      expect(decodeFailure(JSON.stringify(candidate), "mutation_command")).toMatchObject({
        code: "invalid_scalar",
        path: "$.current_claim.lease_expires_at",
      });
    }

    const beforePolicyWindow = clone(commandFixtures[8]) as unknown as Record<string, unknown>;
    const beforeWindowClaim = beforePolicyWindow.current_claim as Record<string, unknown>;
    beforeWindowClaim.owner_issued_at = "2026-07-22T23:59:30.000Z";
    beforeWindowClaim.lease_expires_at = "2026-07-23T00:00:30.000Z";
    expect(decodeFailure(JSON.stringify(beforePolicyWindow), "mutation_command")).toMatchObject({
      path: "$.current_claim.owner_issued_at",
    });

    const beyondPolicyWindow = clone(commandFixtures[8]) as unknown as Record<string, unknown>;
    const beyondWindowClaim = beyondPolicyWindow.current_claim as Record<string, unknown>;
    beyondWindowClaim.owner_issued_at = "2026-07-23T00:59:30.000Z";
    beyondWindowClaim.lease_expires_at = "2026-07-23T01:00:30.000Z";
    expect(decodeFailure(JSON.stringify(beyondPolicyWindow), "mutation_command")).toMatchObject({
      path: "$.current_claim.lease_expires_at",
    });

    const capability = {
      schema_version: 1,
      capability_family: "workflow_batch_execution_control_v1",
      capability_version: 1,
      enabled: true,
      supported_scope_kinds: ["organization", "platform", "workspace"],
      trust_mode: "opaque_owner_readback_v1",
      pins,
      limits: {
        min_lease_ttl_seconds: 30,
        max_lease_ttl_seconds: 900,
        max_reported_clock_skew_seconds: 0,
        minimum_audit_retention_seconds: 1,
        max_active_claims: 1,
        max_active_reserved_executions: 1,
        max_lifetime_logical_units: 1,
        max_lifetime_task_ids: 1,
        max_lifetime_execution_ids: 1,
      },
    } as const;
    const capabilityObservation = withReadObservationHashForTest({
      ...readObservation,
      query_binding: { ...readObservation.query_binding, operation: "describe_capability" },
      result: capability,
    });
    expect(decodeWorkflowBatchExecutionControlJsonV1(JSON.stringify(capabilityObservation), "read_observation")).toMatchObject({
      ok: true,
    });

    const reversedDescriptorRange = clone(capabilityObservation) as unknown as Record<string, unknown>;
    const limits = (reversedDescriptorRange.result as Record<string, unknown>).limits as Record<string, unknown>;
    limits.min_lease_ttl_seconds = 60;
    limits.max_lease_ttl_seconds = 30;
    expect(decodeFailure(JSON.stringify(reversedDescriptorRange), "read_observation")).toMatchObject({
      path: "$.result.limits.min_lease_ttl_seconds",
    });
    for (const [key, value] of [
      ["min_lease_ttl_seconds", 29],
      ["max_lease_ttl_seconds", 901],
    ] as const) {
      const outsideContractBounds = clone(capabilityObservation) as unknown as Record<string, unknown>;
      ((outsideContractBounds.result as Record<string, unknown>).limits as Record<string, unknown>)[key] = value;
      expect(decodeFailure(JSON.stringify(outsideContractBounds), "read_observation")).toMatchObject({
        path: `$.result.limits.${key}`,
      });
    }
  });

  it("enforces unique owner task and execution IDs within a reservation", () => {
    const secondLogicalUnit = {
      logical_unit_hash: hashes.b,
      execution_binding_hash: hashes.c,
      workload_class_hash: hashes.d,
    };
    const twoUnitReservation = {
      ...reservation,
      allocations: [
        reservation.allocations[0],
        { ...secondLogicalUnit, owner_task_id: "task-2", owner_execution_id: "execution-2" },
      ],
      allocation_count: 2,
    };
    const twoUnitSnapshot = {
      ...reservedSnapshot,
      binding: { ...reservedSnapshot.binding, logical_unit_count: 2 },
      logical_units: [logicalUnit, secondLogicalUnit],
      reservation: twoUnitReservation,
      global_head: {
        ...reservedSnapshot.global_head,
        active_reserved_execution_count: 2,
        lifetime_logical_unit_count: 2,
        lifetime_task_id_count: 2,
        lifetime_execution_id_count: 2,
      },
    };
    const observation = observationForSnapshot(twoUnitSnapshot as unknown as Record<string, unknown>);
    expect(decodeWorkflowBatchExecutionControlJsonV1(JSON.stringify(observation), "read_observation")).toMatchObject({
      ok: true,
    });

    for (const [key, value, expectedPath] of [
      ["owner_task_id", "task-1", "$.result.reservation.allocations[1].owner_task_id"],
      ["owner_execution_id", "execution-1", "$.result.reservation.allocations[1].owner_execution_id"],
    ] as const) {
      const candidate = clone(observation) as unknown as Record<string, unknown>;
      const snapshot = candidate.result as Record<string, unknown>;
      const allocations = (snapshot.reservation as Record<string, unknown>).allocations as Array<Record<string, unknown>>;
      allocations[1][key] = value;
      expect(decodeFailure(JSON.stringify(candidate), "read_observation")).toMatchObject({ path: expectedPath });
    }
  });

  it("binds snapshot facts to lower-bounded global counters and fresh later-generation batch identity", () => {
    for (const [snapshotSource, mutate, expectedPath] of [
      [plannedSnapshot, (snapshot: Record<string, unknown>) => {
        (snapshot.global_head as Record<string, unknown>).active_claim_count = 0;
      }, "$.result.global_head.active_claim_count"],
      [plannedSnapshot, (snapshot: Record<string, unknown>) => {
        (snapshot.global_head as Record<string, unknown>).lifetime_logical_unit_count = 0;
      }, "$.result.global_head.lifetime_logical_unit_count"],
      [reservedSnapshot, (snapshot: Record<string, unknown>) => {
        (snapshot.global_head as Record<string, unknown>).active_reserved_execution_count = 0;
      }, "$.result.global_head.active_reserved_execution_count"],
      [reservedSnapshot, (snapshot: Record<string, unknown>) => {
        (snapshot.global_head as Record<string, unknown>).lifetime_task_id_count = 0;
      }, "$.result.global_head.lifetime_task_id_count"],
      [reservedSnapshot, (snapshot: Record<string, unknown>) => {
        (snapshot.global_head as Record<string, unknown>).lifetime_execution_id_count = 0;
      }, "$.result.global_head.lifetime_execution_id_count"],
    ] as const) {
      const snapshot = clone(snapshotSource) as unknown as Record<string, unknown>;
      mutate(snapshot);
      expect(decodeFailure(JSON.stringify(observationSeedForSnapshot(snapshot)), "read_observation")).toMatchObject({
        path: expectedPath,
      });
    }

    const laterGenerationSnapshot = clone(plannedSnapshot) as unknown as Record<string, unknown>;
    const laterBinding = laterGenerationSnapshot.binding as Record<string, unknown>;
    laterBinding.generation = 1;
    laterBinding.supersession = {
      prior_owner_batch_id: "batch-prior",
      prior_tombstone_receipt_ref: "receipt-prior",
      prior_tombstone_hash: hashes.a,
    };
    expect(
      decodeWorkflowBatchExecutionControlJsonV1(
        JSON.stringify(observationForSnapshot(laterGenerationSnapshot)),
        "read_observation",
      ),
    ).toMatchObject({ ok: true });

    const reusedOwnerBatch = clone(laterGenerationSnapshot) as unknown as Record<string, unknown>;
    ((reusedOwnerBatch.binding as Record<string, unknown>).supersession as Record<string, unknown>).prior_owner_batch_id =
      "batch-1";
    expect(decodeFailure(JSON.stringify(observationSeedForSnapshot(reusedOwnerBatch)), "read_observation")).toMatchObject({
      path: "$.result.binding.supersession.prior_owner_batch_id",
    });
  });

  it("enforces monotonic fact, recovery, claim, and authority receipt timestamps", () => {
    const recoveryTimelineSnapshot = clone(dispatchedRecoverySnapshot) as unknown as Record<string, unknown>;
    (recoveryTimelineSnapshot.reservation as Record<string, unknown>).reserved_at = "2026-07-23T00:00:00.000Z";
    (recoveryTimelineSnapshot.seal as Record<string, unknown>).sealed_at = "2026-07-23T00:00:30.000Z";
    (recoveryTimelineSnapshot.recovery as Record<string, unknown>).entered_at = "2026-07-23T00:01:00.000Z";
    (recoveryTimelineSnapshot.client_commit as Record<string, unknown>).confirmed_at = "2026-07-23T00:01:30.000Z";
    (recoveryTimelineSnapshot.dispatch as Record<string, unknown>).recorded_at = "2026-07-23T00:02:00.000Z";
    const timelineClaim = recoveryTimelineSnapshot.claim as Record<string, unknown>;
    timelineClaim.owner_issued_at = "2026-07-23T00:01:00.000Z";
    timelineClaim.lease_expires_at = "2026-07-23T00:02:00.000Z";
    const validRecoveryTimeline = withReadObservationHashForTest({
      ...observationSeedForSnapshot(recoveryTimelineSnapshot),
      observed_at: "2026-07-23T00:03:00.000Z",
    });
    expect(decodeWorkflowBatchExecutionControlJsonV1(JSON.stringify(validRecoveryTimeline), "read_observation")).toMatchObject({
      ok: true,
    });

    const awaitingTimelineSnapshot = clone(awaitingOriginRecoverySnapshot) as unknown as Record<string, unknown>;
    (awaitingTimelineSnapshot.dispatch_effect_status as Record<string, unknown>).effect_started_at =
      "2026-07-23T00:01:00.000Z";
    (awaitingTimelineSnapshot.recovery as Record<string, unknown>).entered_at = "2026-07-23T00:02:00.000Z";
    const awaitingClaim = awaitingTimelineSnapshot.claim as Record<string, unknown>;
    awaitingClaim.owner_issued_at = "2026-07-23T00:02:00.000Z";
    awaitingClaim.lease_expires_at = "2026-07-23T00:03:00.000Z";
    expect(
      decodeWorkflowBatchExecutionControlJsonV1(
        JSON.stringify(withReadObservationHashForTest({
          ...observationSeedForSnapshot(awaitingTimelineSnapshot),
          observed_at: "2026-07-23T00:03:00.000Z",
        })),
        "read_observation",
      ),
    ).toMatchObject({ ok: true });

    for (const [snapshotSource, mutate, expectedPath] of [
      [completedSnapshot, (snapshot: Record<string, unknown>) => {
        (snapshot.seal as Record<string, unknown>).sealed_at = "2026-07-22T23:59:59.000Z";
      }, "$.result.seal.sealed_at"],
      [completedSnapshot, (snapshot: Record<string, unknown>) => {
        (snapshot.client_commit as Record<string, unknown>).confirmed_at = "2026-07-22T23:59:59.000Z";
      }, "$.result.client_commit.confirmed_at"],
      [completedSnapshot, (snapshot: Record<string, unknown>) => {
        (snapshot.dispatch as Record<string, unknown>).recorded_at = "2026-07-22T23:59:59.000Z";
      }, "$.result.dispatch.recorded_at"],
      [completedSnapshot, (snapshot: Record<string, unknown>) => {
        (snapshot.dispatch_effect_status as Record<string, unknown>).effect_started_at = "2026-07-22T23:59:59.000Z";
      }, "$.result.dispatch_effect_status.effect_started_at"],
      [reservedRecoverySnapshot, (snapshot: Record<string, unknown>) => {
        (snapshot.reservation as Record<string, unknown>).reserved_at = "2026-07-23T00:01:00.000Z";
      }, "$.result.recovery.entered_at"],
      [quarantinedSnapshot, (snapshot: Record<string, unknown>) => {
        (snapshot.recovery as Record<string, unknown>).entered_at = "2026-07-23T00:01:00.000Z";
      }, "$.result.tombstone.cancelled_at"],
      [reconciledCompletedSnapshot, (snapshot: Record<string, unknown>) => {
        (snapshot.recovery as Record<string, unknown>).entered_at = "2026-07-23T00:01:00.000Z";
        (snapshot.dispatch_effect_status as Record<string, unknown>).effect_started_at = "2026-07-23T00:01:00.000Z";
      }, "$.result.reconciliation.reconciled_at"],
      [reservedRecoverySnapshot, (snapshot: Record<string, unknown>) => {
        (snapshot.recovery as Record<string, unknown>).entered_at = "2026-07-23T00:01:00.000Z";
      }, "$.result.claim.owner_issued_at"],
      [confirmedSealedRecoverySnapshot, (snapshot: Record<string, unknown>) => {
        (snapshot.recovery as Record<string, unknown>).entered_at = "2026-07-23T00:01:00.000Z";
      }, "$.result.client_commit_status.confirmed_at"],
    ] as const) {
      const candidateSnapshot = clone(snapshotSource) as unknown as Record<string, unknown>;
      mutate(candidateSnapshot);
      expect(decodeFailure(JSON.stringify(observationSeedForSnapshot(candidateSnapshot)), "read_observation")).toMatchObject({
        path: expectedPath,
      });
    }

    const earlyReceipt = clone(authorityEnvelope) as unknown as Record<string, unknown>;
    earlyReceipt.owner_issued_at = "2026-07-22T23:59:59.000Z";
    expect(decodeFailure(JSON.stringify(earlyReceipt), "authority_envelope")).toMatchObject({
      path: "$.owner_issued_at",
    });
  });

  it("closes existing head and owner-event genesis invariants", () => {
    const forgedBatchHead = clone(commandFixtures[0]) as unknown as Record<string, unknown>;
    const expectedHead = ((forgedBatchHead.precondition as Record<string, unknown>).expected_batch_head as Record<string, unknown>);
    expectedHead.snapshot_version = "0";
    expectedHead.ledger_sequence = "0";
    expectedHead.last_event_hash = null;
    expect(decodeFailure(JSON.stringify(forgedBatchHead), "mutation_command")).toMatchObject({
      path: "$.precondition.expected_batch_head.snapshot_version",
    });

    for (const [ledgerSequence, lastEventHash] of [["0", hashes.a], ["1", null]] as const) {
      const forgedGlobalHead = clone(readQuery) as unknown as Record<string, unknown>;
      const head = forgedGlobalHead.as_of_global_head as Record<string, unknown>;
      head.ledger_sequence = ledgerSequence;
      head.last_event_hash = lastEventHash;
      expect(decodeFailure(JSON.stringify(forgedGlobalHead), "read_query")).toMatchObject({
        path: "$.as_of_global_head.last_event_hash",
      });
    }

    const genesisGlobalQuery = clone(readQuery) as unknown as Record<string, unknown>;
    (genesisGlobalQuery.as_of_global_head as Record<string, unknown>).ledger_sequence = "0";
    (genesisGlobalQuery.as_of_global_head as Record<string, unknown>).last_event_hash = null;
    expect(decodeWorkflowBatchExecutionControlJsonV1(JSON.stringify(genesisGlobalQuery), "read_query")).toMatchObject({ ok: true });

    for (const [ledgerSequence, previousEventHash, expectedPath] of [
      ["0", null, "$.result[0].owner_event.ledger_sequence"],
      ["2", null, "$.result[0].owner_event.previous_event_hash"],
      ["1", hashes.a, "$.result[0].owner_event.previous_event_hash"],
    ] as const) {
      const historyObservation = {
        ...readObservation,
        query_binding: { ...readObservation.query_binding, operation: "read_batch_history_page" },
        page: {
          kind: "collection_page",
          cursor_start: null,
          cursor_end: null,
          next_cursor: null,
          limit: 1,
          item_count: 1,
          page_hash: hashes.a,
          full_collection_root: hashes.b,
        },
        result: [{ owner_event: { ...batchEvent, ledger_sequence: ledgerSequence, previous_event_hash: previousEventHash }, authority_envelope_hash: hashes.e, receipt_ref: "receipt-1" }],
      };
      expect(decodeFailure(JSON.stringify(historyObservation), "read_observation")).toMatchObject({ path: expectedPath });
    }
  });

  it("strictly decodes and cryptographically verifies resolver inputs and resolved envelopes", () => {
    expect(workflowBatchExecutionControlBoundsV1).toBe(contractWorkflowBatchExecutionControlBoundsV1);
    const resolverInput = {
      receipt_ref: authorityEnvelope.receipt_ref,
      expected_pins: pins,
    } satisfies WorkflowBatchExecutionControlResolverInputV1;
    const projection = expectProjection(
      createWorkflowBatchExecutionControlAuthorityEnvelopeHashProjectionV1(authorityEnvelope),
    );
    const authorityHash = sha256ForTest(
      Buffer.concat([
        Buffer.from(workflowBatchExecutionControlAuthorityEnvelopeDomainPrefixV1, "utf8"),
        Buffer.from(canonicalizeForTest(projection), "utf8"),
      ]),
    );
    const verifiedAuthorityEnvelope = {
      ...authorityEnvelope,
      authority_envelope_hash: authorityHash,
    } satisfies WorkflowBatchExecutionControlAuthorityEnvelopeV1;
    const canonicalEnvelope = canonicalizeForTest(verifiedAuthorityEnvelope);
    const resolvedEnvelope = {
      receipt_ref: verifiedAuthorityEnvelope.receipt_ref,
      authority_envelope: verifiedAuthorityEnvelope,
      canonical_envelope_utf8: canonicalEnvelope,
      authority_envelope_hash: authorityHash,
      canonical_envelope_bytes_sha256: sha256ForTest(Buffer.from(canonicalEnvelope, "utf8")),
    } satisfies WorkflowBatchExecutionControlResolvedEnvelopeV1;

    expect(decodeWorkflowBatchExecutionControlJsonV1(JSON.stringify(resolverInput), "resolver_input").ok).toBe(true);
    expect(decodeWorkflowBatchExecutionControlJsonV1(JSON.stringify(resolvedEnvelope), "resolved_envelope").ok).toBe(true);
    expect(verifyWorkflowBatchExecutionControlResolvedEnvelopeV1(resolverInput, resolvedEnvelope).ok).toBe(true);
    expect(Buffer.byteLength(canonicalEnvelope, "utf8")).toBeGreaterThan(
      workflowBatchExecutionControlBoundsV1.max_protocol_string_bytes,
    );

    const badOuterReceipt = { ...resolvedEnvelope, receipt_ref: "receipt-other" };
    expect(decodeFailure(JSON.stringify(badOuterReceipt), "resolved_envelope")).toMatchObject({
      code: "invalid_scalar",
      path: "$.receipt_ref",
    });
    const badOuterHash = { ...resolvedEnvelope, authority_envelope_hash: hashes.f };
    expect(decodeFailure(JSON.stringify(badOuterHash), "resolved_envelope")).toMatchObject({
      code: "invalid_scalar",
      path: "$.authority_envelope_hash",
    });

    const wrongHashEnvelope = { ...verifiedAuthorityEnvelope, authority_envelope_hash: hashes.f };
    const wrongHashCanonical = canonicalizeForTest(wrongHashEnvelope);
    const wrongDomainHash = {
      ...resolvedEnvelope,
      authority_envelope: wrongHashEnvelope,
      authority_envelope_hash: hashes.f,
      canonical_envelope_utf8: wrongHashCanonical,
      canonical_envelope_bytes_sha256: sha256ForTest(Buffer.from(wrongHashCanonical, "utf8")),
    };
    expect(decodeFailure(JSON.stringify(wrongDomainHash), "resolved_envelope")).toMatchObject({
      code: "invalid_hash_projection",
      path: "$.authority_envelope.authority_envelope_hash",
    });

    const nonCanonical = `${canonicalEnvelope} `;
    const badCanonical = {
      ...resolvedEnvelope,
      canonical_envelope_utf8: nonCanonical,
      canonical_envelope_bytes_sha256: sha256ForTest(Buffer.from(nonCanonical, "utf8")),
    };
    expect(decodeFailure(JSON.stringify(badCanonical), "resolved_envelope")).toMatchObject({
      code: "invalid_scalar",
      path: "$.canonical_envelope_utf8",
    });
    const badRawHash = { ...resolvedEnvelope, canonical_envelope_bytes_sha256: hashes.f };
    expect(decodeFailure(JSON.stringify(badRawHash), "resolved_envelope")).toMatchObject({
      code: "invalid_scalar",
      path: "$.canonical_envelope_bytes_sha256",
    });

    const wrongReceiptInput = { ...resolverInput, receipt_ref: "receipt-other" };
    expect(decodeWorkflowBatchExecutionControlJsonV1(JSON.stringify(wrongReceiptInput), "resolver_input").ok).toBe(true);
    expect(verifyWorkflowBatchExecutionControlResolvedEnvelopeV1(wrongReceiptInput, resolvedEnvelope)).toMatchObject({
      ok: false,
      findings: [expect.objectContaining({ path: "$.resolved.receipt_ref" })],
    });
    const wrongPinsInput = {
      ...resolverInput,
      expected_pins: { ...resolverInput.expected_pins, contract_revision: "other-revision" },
    };
    expect(verifyWorkflowBatchExecutionControlResolvedEnvelopeV1(wrongPinsInput, resolvedEnvelope)).toMatchObject({
      ok: false,
      findings: [expect.objectContaining({ path: "$.resolved.authority_envelope.pins" })],
    });
  });

  it("structurally rejects caller-supplied self-containing projection containers", () => {
    for (const [kind, candidate] of [
      ["mutation_command", { ...commandFixtures[0], request_hash_projection: { request_hash: hashes.a } }],
      ["authority_envelope", { ...authorityEnvelope, authority_envelope_hash_projection: { authority_envelope_hash: hashes.a } }],
      ["read_observation", { ...readObservation, read_observation_hash_projection: { read_observation_hash: hashes.a } }],
    ] as const) {
      expect(decodeFailure(JSON.stringify(candidate), kind)).toMatchObject({ code: "invalid_hash_projection" });
    }
  });

  it("accepts all closed execution-receipt variants and rejects hybrid combinations", () => {
    const observation = withReadObservationHashForTest({
      ...readObservation,
      query_binding: {
        ...readObservation.query_binding,
        operation: "read_execution_receipts_page",
      },
      page: {
        kind: "collection_page",
        cursor_start: null,
        cursor_end: null,
        next_cursor: null,
        limit: 3,
        item_count: 3,
        page_hash: hashes.a,
        full_collection_root: hashes.b,
      },
      result: executionReceipts,
    } satisfies WorkflowBatchExecutionControlReadObservationV1<WorkflowBatchExecutionControlExecutionReceiptItemV1[]>);
    expect(decodeWorkflowBatchExecutionControlJsonV1(JSON.stringify(observation), "read_observation").ok).toBe(true);

    for (const [index, key, value] of [
      [0, "failure_reason_code", "should_be_null"],
      [0, "output_effect_hash", null],
      [1, "failure_reason_code", null],
      [2, "output_effect_hash", hashes.e],
    ] as const) {
      const hybrid = clone(observation) as unknown as Record<string, unknown>;
      const receipts = hybrid.result as Array<Record<string, unknown>>;
      receipts[index][key] = value;
      expect(decodeFailure(JSON.stringify(hybrid), "read_observation")).toMatchObject({ code: "invalid_scalar" });
    }
  });

  it("keeps raw parser and exported byte/depth/node/collection bounds fail-closed", () => {
    expect(
      decodeFailure(" ".repeat(workflowBatchExecutionControlBoundsV1.max_command_bytes + 1), "mutation_command"),
    ).toMatchObject({ code: "document_too_large" });

    let nested: Record<string, unknown> = {};
    for (let index = 0; index < workflowBatchExecutionControlBoundsV1.max_json_depth; index += 1) nested = { nested };
    expect(decodeFailure(JSON.stringify(nested), "mutation_command")).toMatchObject({
      code: "maximum_depth_exceeded",
    });

    const manyNodes = Array.from({ length: workflowBatchExecutionControlBoundsV1.max_json_nodes }, () => 0);
    expect(decodeFailure(JSON.stringify(manyNodes), "mutation_command")).toMatchObject({
      code: "maximum_nodes_exceeded",
    });

    const tooManyOperations = clone(commandFixtures[1]) as unknown as Record<string, unknown>;
    (tooManyOperations.payload as Record<string, unknown>).requested_operations = Array.from(
      { length: workflowBatchExecutionControlBoundsV1.max_recovery_operations + 1 },
      () => "reconcile_batch",
    );
    expect(decodeFailure(JSON.stringify(tooManyOperations), "mutation_command")).toMatchObject({
      code: "limit_exceeded",
    });
  });
});
