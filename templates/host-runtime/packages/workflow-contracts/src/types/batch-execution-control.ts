export const workflowBatchExecutionControlCapabilityV1 = "workflow_batch_execution_control_v1" as const;

export const workflowBatchExecutionControlTrustModeV1 = "opaque_owner_readback_v1" as const;

export const workflowBatchExecutionControlCanonicalizationProfileV1 = "rfc8785_jcs_sha256_v1" as const;

export const workflowBatchExecutionControlRequestDomainPrefixV1 =
  "workflow_batch_execution_control_v1/request\u0000" as const;

export const workflowBatchExecutionControlAuthorityEnvelopeDomainPrefixV1 =
  "workflow_batch_execution_control_v1/authority-envelope\u0000" as const;

export const workflowBatchExecutionControlReadObservationDomainPrefixV1 =
  "workflow_batch_execution_control_v1/read-observation\u0000" as const;

export const workflowBatchExecutionControlStatesV1 = [
  "planned",
  "executions_reserved",
  "executions_sealed",
  "client_commit_confirmed",
  "dispatch_recorded",
  "awaiting_completion",
  "completed",
  "recovery_required_reserved_unsealed",
  "recovery_required_sealed_undispatched",
  "recovery_required_dispatched",
  "quarantined_cancelled",
  "reconciled_completed",
  "reconciled_unresolved",
] as const;

export const workflowBatchExecutionControlErrorCodesV1 = [
  "invalid_request",
  "capability_disabled",
  "contract_pin_mismatch",
  "scope_forbidden",
  "policy_expired",
  "idempotency_conflict",
  "binding_conflict",
  "stale_batch_cas",
  "stale_global_cas",
  "claim_conflict",
  "claim_expired",
  "fence_rejected",
  "capacity_exceeded",
  "uniqueness_conflict",
  "registry_full",
  "invalid_state",
  "terminal_state",
  "recovery_forbidden",
  "receipt_unresolvable",
  "receipt_mismatch",
  "outcome_pending",
  "outcome_unknown",
] as const;

export const workflowBatchExecutionControlBoundsV1 = {
  max_command_bytes: 262_144,
  max_canonical_envelope_bytes: 524_288,
  max_resolved_envelope_bytes: 1_572_864,
  max_json_depth: 64,
  max_json_nodes: 50_000,
  max_protocol_string_bytes: 2_048,
  max_reason_code_bytes: 256,
  max_units_per_batch: 64,
  max_page_size: 100,
  max_recovery_operations: 16,
  min_lease_ttl_seconds: 30,
  max_lease_ttl_seconds: 900,
} as const;

export type WorkflowBatchExecutionControlStateV1 = (typeof workflowBatchExecutionControlStatesV1)[number];

export type WorkflowBatchExecutionControlErrorCodeV1 =
  (typeof workflowBatchExecutionControlErrorCodesV1)[number];

export type WorkflowBatchExecutionControlScopeV1 =
  | { kind: "platform"; scope_id: string }
  | { kind: "organization"; scope_id: string }
  | { kind: "workspace"; scope_id: string };

export type WorkflowBatchExecutionControlPinsV1 = {
  capability_family: typeof workflowBatchExecutionControlCapabilityV1;
  capability_version: 1;
  contract_revision: string;
  contract_source_hash: string;
  canonicalization_profile: typeof workflowBatchExecutionControlCanonicalizationProfileV1;
  vector_release_hash: string;
  owner_namespace: string;
  receipt_issuer: string;
  receipt_audience: string;
  receipt_authority_id: string;
  receipt_authority_version: string;
  owner_deployment_id: string;
  owner_deployment_digest: string;
  ledger_schema_revision: string;
  trust_mode: typeof workflowBatchExecutionControlTrustModeV1;
};

type WorkflowBatchExecutionControlPolicyDecisionBaseV1<
  Kind extends "forward_window" | "recovery_policy" | "readback",
> = {
  kind: Kind;
  decision_ref: string;
  decision_hash: string;
  decision_issuer: string;
  decision_audience: string;
  not_before: string;
  expires_at: string;
};

export type WorkflowBatchExecutionControlForwardPolicyDecisionV1 =
  WorkflowBatchExecutionControlPolicyDecisionBaseV1<"forward_window">;

export type WorkflowBatchExecutionControlRecoveryPolicyDecisionV1 =
  WorkflowBatchExecutionControlPolicyDecisionBaseV1<"recovery_policy"> & {
    expired_forward_decision_ref: string;
  };

export type WorkflowBatchExecutionControlReadbackPolicyDecisionV1 =
  WorkflowBatchExecutionControlPolicyDecisionBaseV1<"readback">;

export type WorkflowBatchExecutionControlCapabilityDescriptorV1 = {
  schema_version: 1;
  capability_family: typeof workflowBatchExecutionControlCapabilityV1;
  capability_version: 1;
  enabled: true;
  supported_scope_kinds: Array<WorkflowBatchExecutionControlScopeV1["kind"]>;
  trust_mode: typeof workflowBatchExecutionControlTrustModeV1;
  pins: WorkflowBatchExecutionControlPinsV1;
  limits: {
    min_lease_ttl_seconds: number;
    max_lease_ttl_seconds: number;
    max_reported_clock_skew_seconds: number;
    minimum_audit_retention_seconds: number;
    max_active_claims: number;
    max_active_reserved_executions: number;
    max_lifetime_logical_units: number;
    max_lifetime_task_ids: number;
    max_lifetime_execution_ids: number;
  };
};

export type WorkflowBatchExecutionControlBatchHeadV1<
  State extends WorkflowBatchExecutionControlStateV1 = WorkflowBatchExecutionControlStateV1,
> = {
  owner_batch_id: string;
  state: State;
  snapshot_version: string;
  ledger_sequence: string;
  last_event_hash: string | null;
};

export type WorkflowBatchExecutionControlGlobalHeadV1 = {
  ledger_sequence: string;
  last_event_hash: string | null;
  registry_version: string;
  admission_root: string;
  uniqueness_root: string;
  active_claim_count: number;
  active_reserved_execution_count: number;
  lifetime_logical_unit_count: number;
  lifetime_task_id_count: number;
  lifetime_execution_id_count: number;
};

export type WorkflowBatchExecutionControlCapacityDeltaV1 = {
  active_claim_count: number;
  active_reserved_execution_count: number;
  lifetime_logical_unit_count: number;
  lifetime_task_id_count: number;
  lifetime_execution_id_count: number;
};

export type WorkflowBatchExecutionControlNoClaimV1 = {
  kind: "none";
};

type WorkflowBatchExecutionControlClaimBaseV1 = {
  claim_id: string;
  lease_id: string;
  fence: string;
  owner_issued_at: string;
  lease_expires_at: string;
};

export type WorkflowBatchExecutionControlOrdinaryClaimV1 =
  WorkflowBatchExecutionControlClaimBaseV1 & {
    kind: "ordinary";
  };

export type WorkflowBatchExecutionControlRecoveryOperationV1 =
  | "renew_batch_claim"
  | "release_batch_claim"
  | "confirm_client_commit"
  | "dispatch_batch"
  | "quarantine_reservation"
  | "reconcile_batch";

export type WorkflowBatchExecutionControlReconciliationClaimV1 =
  WorkflowBatchExecutionControlClaimBaseV1 & {
    kind: "reconciliation_only";
    original_identity_collection_hash: string;
    recovery_policy: WorkflowBatchExecutionControlRecoveryPolicyDecisionV1;
    allowed_operations: WorkflowBatchExecutionControlRecoveryOperationV1[];
    allowed_operations_hash: string;
  };

export type WorkflowBatchExecutionControlClaimV1 =
  | WorkflowBatchExecutionControlNoClaimV1
  | WorkflowBatchExecutionControlOrdinaryClaimV1
  | WorkflowBatchExecutionControlReconciliationClaimV1;

export type WorkflowBatchExecutionControlLogicalUnitV1 = {
  logical_unit_hash: string;
  execution_binding_hash: string;
  workload_class_hash: string;
};

export type WorkflowBatchExecutionControlGenerationZeroV1 = {
  generation: 0;
  supersession: null;
};

declare const workflowBatchPositiveGenerationV1: unique symbol;

export type WorkflowBatchExecutionControlPositiveGenerationV1 = number & {
  readonly [workflowBatchPositiveGenerationV1]: "positive_generation";
};

export type WorkflowBatchExecutionControlLaterGenerationV1 = {
  generation: WorkflowBatchExecutionControlPositiveGenerationV1;
  supersession: {
    prior_owner_batch_id: string;
    prior_tombstone_receipt_ref: string;
    prior_tombstone_hash: string;
  };
};

export type WorkflowBatchExecutionControlGenerationV1 =
  | WorkflowBatchExecutionControlGenerationZeroV1
  | WorkflowBatchExecutionControlLaterGenerationV1;

type WorkflowBatchExecutionControlBatchBindingCommonV1 = {
  client_generation_key: string;
  logical_series_hash: string;
  purpose_profile_hash: string;
  logical_unit_collection_root: string;
  logical_unit_count: number;
  binding_hash: string;
};

export type WorkflowBatchExecutionControlBatchBindingV1 =
  WorkflowBatchExecutionControlBatchBindingCommonV1 &
    WorkflowBatchExecutionControlGenerationV1 & {
      owner_batch_id: string;
    };

export type WorkflowBatchExecutionControlOpenBindingV1 =
  WorkflowBatchExecutionControlBatchBindingCommonV1 &
    WorkflowBatchExecutionControlGenerationV1 & {
      logical_units: WorkflowBatchExecutionControlLogicalUnitV1[];
    };

export type WorkflowBatchExecutionControlExpectedAbsentV1 = {
  kind: "expected_absent";
  expected_global_head: WorkflowBatchExecutionControlGlobalHeadV1;
};

export type WorkflowBatchExecutionControlExpectedExistingV1 = {
  kind: "expected_existing";
  expected_binding_hash: string;
  expected_batch_head: WorkflowBatchExecutionControlBatchHeadV1;
  expected_global_head: WorkflowBatchExecutionControlGlobalHeadV1;
};

export type WorkflowBatchExecutionControlRequestMetaV1 = {
  command_id: string;
  idempotency_key: string;
  correlation_id: string;
  request_hash: string;
};

export type WorkflowBatchExecutionControlCreateRequestV1 = {
  kind: "create_if_absent";
  operation: "open_or_resume_batch";
  schema_version: 1;
  pins: WorkflowBatchExecutionControlPinsV1;
  scope: WorkflowBatchExecutionControlScopeV1;
  policy_decision: WorkflowBatchExecutionControlForwardPolicyDecisionV1;
  request_meta: WorkflowBatchExecutionControlRequestMetaV1;
  binding: WorkflowBatchExecutionControlOpenBindingV1;
  precondition: WorkflowBatchExecutionControlExpectedAbsentV1;
};

export type WorkflowBatchExecutionControlResumeRequestV1 = {
  kind: "resume_existing";
  operation: "open_or_resume_batch";
  schema_version: 1;
  expected_pins: WorkflowBatchExecutionControlPinsV1;
  scope: WorkflowBatchExecutionControlScopeV1;
  client_generation_key: string;
  query: WorkflowBatchExecutionControlReadQueryBindingV1<"read_batch_snapshot">;
  precondition: WorkflowBatchExecutionControlExpectedExistingV1;
};

export type WorkflowBatchExecutionControlOpenRequestV1 =
  | WorkflowBatchExecutionControlCreateRequestV1
  | WorkflowBatchExecutionControlResumeRequestV1;

export type WorkflowBatchExecutionControlAllocationV1 = {
  logical_unit_hash: string;
  execution_binding_hash: string;
  workload_class_hash: string;
  owner_task_id: string;
  owner_execution_id: string;
};

export type WorkflowBatchExecutionControlReservationV1 = {
  reservation_id: string;
  logical_unit_collection_root: string;
  identity_collection_hash: string;
  allocations: WorkflowBatchExecutionControlAllocationV1[];
  allocation_count: number;
  reserved_at: string;
  reservation_hash: string;
};

export type WorkflowBatchExecutionControlSealV1 = {
  seal_id: string;
  reservation_hash: string;
  execution_manifest_hash: string;
  allocation_count: number;
  sealed_at: string;
  seal_hash: string;
};

export type WorkflowBatchExecutionControlClientCommitV1 = {
  client_commit_ref: string;
  client_commit_hash: string;
  execution_manifest_hash: string;
  confirmed_at: string;
};

export type WorkflowBatchExecutionControlDispatchV1 = {
  dispatch_id: string;
  seal_hash: string;
  client_commit_hash: string;
  execution_manifest_hash: string;
  dispatch_commit_hash: string;
  outbox_intent_root: string;
  recorded_before_effect: true;
  recorded_at: string;
};

export type WorkflowBatchExecutionControlDispatchEffectRecordedV1 = {
  kind: "recorded";
  dispatch_commit_hash: string;
};

export type WorkflowBatchExecutionControlDispatchEffectStartedV1 = {
  kind: "started";
  dispatch_commit_hash: string;
  effect_started_at: string;
  effect_observation_hash: string;
};

export type WorkflowBatchExecutionControlDispatchEffectStatusV1 =
  | WorkflowBatchExecutionControlDispatchEffectRecordedV1
  | WorkflowBatchExecutionControlDispatchEffectStartedV1;

export type WorkflowBatchExecutionControlCompletionNoneV1 = {
  kind: "none";
  receipt_count: 0;
  expected_count: number;
  collection_root: string;
};

export type WorkflowBatchExecutionControlCompletionPartialV1 = {
  kind: "partial";
  receipt_count: number;
  expected_count: number;
  collection_root: string;
};

export type WorkflowBatchExecutionControlCompletionAllTerminalV1 = {
  kind: "all_terminal";
  receipt_count: number;
  expected_count: number;
  collection_root: string;
  lifecycle_head: string;
};

export type WorkflowBatchExecutionControlCompletionStatusV1 =
  | WorkflowBatchExecutionControlCompletionNoneV1
  | WorkflowBatchExecutionControlCompletionPartialV1
  | WorkflowBatchExecutionControlCompletionAllTerminalV1;

export type WorkflowBatchExecutionControlRecoveryDispatchProgressV1 =
  | {
      dispatch_effect_status: WorkflowBatchExecutionControlDispatchEffectRecordedV1;
      completion_status: WorkflowBatchExecutionControlCompletionNoneV1;
    }
  | {
      dispatch_effect_status: WorkflowBatchExecutionControlDispatchEffectStartedV1;
      completion_status: WorkflowBatchExecutionControlCompletionStatusV1;
    };

export type WorkflowBatchExecutionControlRecoveryOriginStateV1 =
  | "executions_reserved"
  | "executions_sealed"
  | "client_commit_confirmed"
  | "dispatch_recorded"
  | "awaiting_completion";

export type WorkflowBatchExecutionControlRecoveryV1<
  OriginState extends WorkflowBatchExecutionControlRecoveryOriginStateV1 =
    WorkflowBatchExecutionControlRecoveryOriginStateV1,
> = {
  recovery_id: string;
  origin_state: OriginState;
  original_identity_collection_hash: string;
  entered_at: string;
  recovery_hash: string;
};

export type WorkflowBatchExecutionControlTombstoneV1 = {
  tombstone_id: string;
  reservation_hash: string;
  original_identity_collection_hash: string;
  reason_code: string;
  cancelled_at: string;
  tombstone_hash: string;
};

type WorkflowBatchExecutionControlReconciliationBaseV1 = {
  reconciliation_id: string;
  original_identity_collection_hash: string;
  reason_code: string;
  reconciled_at: string;
  reconciliation_hash: string;
};

export type WorkflowBatchExecutionControlReconciliationV1 =
  | (WorkflowBatchExecutionControlReconciliationBaseV1 & {
      outcome: "completed";
      completion_collection_root: string;
      lifecycle_head: string;
    })
  | (WorkflowBatchExecutionControlReconciliationBaseV1 & {
      outcome: "unresolved";
      completion_collection_root: string | null;
      lifecycle_head: string | null;
    });

export type WorkflowBatchExecutionControlClientCommitStatusV1 =
  | { kind: "not_confirmed" }
  | ({ kind: "confirmed" } & WorkflowBatchExecutionControlClientCommitV1);

type WorkflowBatchExecutionControlSnapshotBaseV1<
  State extends WorkflowBatchExecutionControlStateV1,
> = {
  schema_version: 1;
  pins: WorkflowBatchExecutionControlPinsV1;
  scope: WorkflowBatchExecutionControlScopeV1;
  state: State;
  binding: WorkflowBatchExecutionControlBatchBindingV1;
  logical_units: WorkflowBatchExecutionControlLogicalUnitV1[];
  batch_head: WorkflowBatchExecutionControlBatchHeadV1<State>;
  global_head: WorkflowBatchExecutionControlGlobalHeadV1;
  snapshot_hash: string;
};

export type WorkflowBatchExecutionControlPlannedSnapshotV1 =
  WorkflowBatchExecutionControlSnapshotBaseV1<"planned"> & {
    claim: WorkflowBatchExecutionControlNoClaimV1 | WorkflowBatchExecutionControlOrdinaryClaimV1;
  };

export type WorkflowBatchExecutionControlReservedSnapshotV1 =
  WorkflowBatchExecutionControlSnapshotBaseV1<"executions_reserved"> & {
    claim: WorkflowBatchExecutionControlOrdinaryClaimV1;
    reservation: WorkflowBatchExecutionControlReservationV1;
  };

export type WorkflowBatchExecutionControlSealedSnapshotV1 =
  WorkflowBatchExecutionControlSnapshotBaseV1<"executions_sealed"> & {
    claim: WorkflowBatchExecutionControlOrdinaryClaimV1;
    reservation: WorkflowBatchExecutionControlReservationV1;
    seal: WorkflowBatchExecutionControlSealV1;
  };

export type WorkflowBatchExecutionControlClientCommitSnapshotV1 =
  WorkflowBatchExecutionControlSnapshotBaseV1<"client_commit_confirmed"> & {
    claim: WorkflowBatchExecutionControlOrdinaryClaimV1;
    reservation: WorkflowBatchExecutionControlReservationV1;
    seal: WorkflowBatchExecutionControlSealV1;
    client_commit: WorkflowBatchExecutionControlClientCommitV1;
  };

export type WorkflowBatchExecutionControlDispatchRecordedSnapshotV1 =
  WorkflowBatchExecutionControlSnapshotBaseV1<"dispatch_recorded"> & {
    claim: WorkflowBatchExecutionControlOrdinaryClaimV1;
    reservation: WorkflowBatchExecutionControlReservationV1;
    seal: WorkflowBatchExecutionControlSealV1;
    client_commit: WorkflowBatchExecutionControlClientCommitV1;
    dispatch: WorkflowBatchExecutionControlDispatchV1;
    dispatch_effect_status: WorkflowBatchExecutionControlDispatchEffectRecordedV1;
    completion_status: WorkflowBatchExecutionControlCompletionNoneV1;
  };

export type WorkflowBatchExecutionControlAwaitingCompletionSnapshotV1 =
  WorkflowBatchExecutionControlSnapshotBaseV1<"awaiting_completion"> & {
    claim: WorkflowBatchExecutionControlOrdinaryClaimV1;
    reservation: WorkflowBatchExecutionControlReservationV1;
    seal: WorkflowBatchExecutionControlSealV1;
    client_commit: WorkflowBatchExecutionControlClientCommitV1;
    dispatch: WorkflowBatchExecutionControlDispatchV1;
    dispatch_effect_status: WorkflowBatchExecutionControlDispatchEffectStartedV1;
    completion_status:
      | WorkflowBatchExecutionControlCompletionNoneV1
      | WorkflowBatchExecutionControlCompletionPartialV1;
  };

export type WorkflowBatchExecutionControlCompletedSnapshotV1 =
  WorkflowBatchExecutionControlSnapshotBaseV1<"completed"> & {
    claim: WorkflowBatchExecutionControlNoClaimV1;
    reservation: WorkflowBatchExecutionControlReservationV1;
    seal: WorkflowBatchExecutionControlSealV1;
    client_commit: WorkflowBatchExecutionControlClientCommitV1;
    dispatch: WorkflowBatchExecutionControlDispatchV1;
    dispatch_effect_status: WorkflowBatchExecutionControlDispatchEffectStartedV1;
    completion_status: WorkflowBatchExecutionControlCompletionAllTerminalV1;
  };

type WorkflowBatchExecutionControlRecoveryClaimV1 =
  | WorkflowBatchExecutionControlNoClaimV1
  | WorkflowBatchExecutionControlReconciliationClaimV1;

export type WorkflowBatchExecutionControlReservedRecoverySnapshotV1 =
  WorkflowBatchExecutionControlSnapshotBaseV1<"recovery_required_reserved_unsealed"> & {
    claim: WorkflowBatchExecutionControlRecoveryClaimV1;
    reservation: WorkflowBatchExecutionControlReservationV1;
    recovery: WorkflowBatchExecutionControlRecoveryV1<"executions_reserved">;
  };

export type WorkflowBatchExecutionControlSealedRecoverySnapshotV1 =
  WorkflowBatchExecutionControlSnapshotBaseV1<"recovery_required_sealed_undispatched"> &
    {
      claim: WorkflowBatchExecutionControlRecoveryClaimV1;
      reservation: WorkflowBatchExecutionControlReservationV1;
      seal: WorkflowBatchExecutionControlSealV1;
    } & (
      | {
          client_commit_status: { kind: "not_confirmed" };
          recovery: WorkflowBatchExecutionControlRecoveryV1<"executions_sealed">;
        }
      | {
          client_commit_status: WorkflowBatchExecutionControlClientCommitV1 & { kind: "confirmed" };
          recovery: WorkflowBatchExecutionControlRecoveryV1<
            "executions_sealed" | "client_commit_confirmed"
          >;
        }
    );

export type WorkflowBatchExecutionControlDispatchedRecoverySnapshotV1 =
  WorkflowBatchExecutionControlSnapshotBaseV1<"recovery_required_dispatched"> & {
      claim: WorkflowBatchExecutionControlRecoveryClaimV1;
      reservation: WorkflowBatchExecutionControlReservationV1;
      seal: WorkflowBatchExecutionControlSealV1;
      client_commit: WorkflowBatchExecutionControlClientCommitV1;
      dispatch: WorkflowBatchExecutionControlDispatchV1;
    } & (
      | (WorkflowBatchExecutionControlRecoveryDispatchProgressV1 & {
          recovery: WorkflowBatchExecutionControlRecoveryV1<
            "executions_sealed" | "client_commit_confirmed" | "dispatch_recorded"
          >;
        })
      | {
          dispatch_effect_status: WorkflowBatchExecutionControlDispatchEffectStartedV1;
          completion_status: WorkflowBatchExecutionControlCompletionStatusV1;
          recovery: WorkflowBatchExecutionControlRecoveryV1<"awaiting_completion">;
        }
    );

export type WorkflowBatchExecutionControlQuarantinedSnapshotV1 =
  WorkflowBatchExecutionControlSnapshotBaseV1<"quarantined_cancelled"> & {
    claim: WorkflowBatchExecutionControlNoClaimV1;
    reservation: WorkflowBatchExecutionControlReservationV1;
    recovery: WorkflowBatchExecutionControlRecoveryV1<"executions_reserved">;
    tombstone: WorkflowBatchExecutionControlTombstoneV1;
  };

export type WorkflowBatchExecutionControlReconciledCompletedSnapshotV1 =
  WorkflowBatchExecutionControlSnapshotBaseV1<"reconciled_completed"> & {
    claim: WorkflowBatchExecutionControlNoClaimV1;
    reservation: WorkflowBatchExecutionControlReservationV1;
    seal: WorkflowBatchExecutionControlSealV1;
    client_commit: WorkflowBatchExecutionControlClientCommitV1;
    dispatch: WorkflowBatchExecutionControlDispatchV1;
    dispatch_effect_status: WorkflowBatchExecutionControlDispatchEffectStartedV1;
    completion_status: WorkflowBatchExecutionControlCompletionAllTerminalV1;
    recovery: WorkflowBatchExecutionControlRecoveryV1<
      | "executions_sealed"
      | "client_commit_confirmed"
      | "dispatch_recorded"
      | "awaiting_completion"
    >;
    reconciliation: WorkflowBatchExecutionControlReconciliationV1 & { outcome: "completed" };
  };

type WorkflowBatchExecutionControlSealedUnresolvedFactsV1 = {
  reconciliation_origin: "sealed_undispatched";
  reservation: WorkflowBatchExecutionControlReservationV1;
  seal: WorkflowBatchExecutionControlSealV1;
  reconciliation: WorkflowBatchExecutionControlReconciliationV1 & {
    outcome: "unresolved";
    completion_collection_root: null;
    lifecycle_head: null;
  };
} & (
  | {
      client_commit_status: { kind: "not_confirmed" };
      recovery: WorkflowBatchExecutionControlRecoveryV1<"executions_sealed">;
    }
  | {
      client_commit_status: WorkflowBatchExecutionControlClientCommitV1 & { kind: "confirmed" };
      recovery: WorkflowBatchExecutionControlRecoveryV1<
        "executions_sealed" | "client_commit_confirmed"
      >;
    }
);

type WorkflowBatchExecutionControlDispatchedUnresolvedFactsV1 = {
  reconciliation_origin: "dispatched";
  reservation: WorkflowBatchExecutionControlReservationV1;
  seal: WorkflowBatchExecutionControlSealV1;
  client_commit: WorkflowBatchExecutionControlClientCommitV1;
  dispatch: WorkflowBatchExecutionControlDispatchV1;
  dispatch_effect_status: WorkflowBatchExecutionControlDispatchEffectStartedV1;
  completion_status: WorkflowBatchExecutionControlCompletionAllTerminalV1;
  recovery: WorkflowBatchExecutionControlRecoveryV1<
    | "executions_sealed"
    | "client_commit_confirmed"
    | "dispatch_recorded"
    | "awaiting_completion"
  >;
  reconciliation: WorkflowBatchExecutionControlReconciliationV1 & {
    outcome: "unresolved";
    completion_collection_root: string;
    lifecycle_head: string;
  };
};

export type WorkflowBatchExecutionControlReconciledUnresolvedSnapshotV1 =
  WorkflowBatchExecutionControlSnapshotBaseV1<"reconciled_unresolved"> &
    (
      | WorkflowBatchExecutionControlSealedUnresolvedFactsV1
      | WorkflowBatchExecutionControlDispatchedUnresolvedFactsV1
    ) & {
      claim: WorkflowBatchExecutionControlNoClaimV1;
    };

export type WorkflowBatchExecutionControlSnapshotV1 =
  | WorkflowBatchExecutionControlPlannedSnapshotV1
  | WorkflowBatchExecutionControlReservedSnapshotV1
  | WorkflowBatchExecutionControlSealedSnapshotV1
  | WorkflowBatchExecutionControlClientCommitSnapshotV1
  | WorkflowBatchExecutionControlDispatchRecordedSnapshotV1
  | WorkflowBatchExecutionControlAwaitingCompletionSnapshotV1
  | WorkflowBatchExecutionControlCompletedSnapshotV1
  | WorkflowBatchExecutionControlReservedRecoverySnapshotV1
  | WorkflowBatchExecutionControlSealedRecoverySnapshotV1
  | WorkflowBatchExecutionControlDispatchedRecoverySnapshotV1
  | WorkflowBatchExecutionControlQuarantinedSnapshotV1
  | WorkflowBatchExecutionControlReconciledCompletedSnapshotV1
  | WorkflowBatchExecutionControlReconciledUnresolvedSnapshotV1;

export type WorkflowBatchExecutionControlBatchEventTypeV1 =
  | "batch_opened"
  | "batch_claimed"
  | "batch_claim_renewed"
  | "batch_claim_released"
  | "executions_reserved"
  | "execution_manifest_sealed"
  | "client_commit_confirmed"
  | "dispatch_recorded"
  | "dispatch_effect_started"
  | "execution_completion_recorded"
  | "claim_expired"
  | "reservation_quarantined"
  | "batch_reconciled";

export type WorkflowBatchExecutionControlGlobalEventTypeV1 =
  | "global_admission_changed"
  | "global_uniqueness_changed"
  | "global_capacity_changed";

export type WorkflowBatchExecutionControlEventTypeV1 =
  | WorkflowBatchExecutionControlBatchEventTypeV1
  | WorkflowBatchExecutionControlGlobalEventTypeV1;

export type WorkflowBatchExecutionControlEventCausationV1 =
  | {
      kind: "client_command";
      command_id: string;
      idempotency_key: string;
      request_hash: string;
    }
  | {
      kind: "owner_worker";
      internal_idempotency_key: string;
    }
  | {
      kind: "watchdog";
      internal_idempotency_key: string;
    };

type WorkflowBatchExecutionControlOwnerEventHashProjectionBaseV1 = {
  event_id: string;
  causation: WorkflowBatchExecutionControlEventCausationV1;
  ledger_sequence: string;
  previous_event_hash: string | null;
  owner_event_at: string;
  capacity_delta: WorkflowBatchExecutionControlCapacityDeltaV1;
  fact_root: string;
};

export type WorkflowBatchExecutionControlBatchEventHashProjectionV1 =
  WorkflowBatchExecutionControlOwnerEventHashProjectionBaseV1 & {
    event_type: WorkflowBatchExecutionControlBatchEventTypeV1;
    stream: { kind: "batch"; owner_batch_id: string };
  };

export type WorkflowBatchExecutionControlGlobalEventHashProjectionV1 =
  WorkflowBatchExecutionControlOwnerEventHashProjectionBaseV1 & {
    event_type: WorkflowBatchExecutionControlGlobalEventTypeV1;
    stream: { kind: "global"; owner_namespace: string };
  };

export type WorkflowBatchExecutionControlOwnerEventHashProjectionV1 =
  | WorkflowBatchExecutionControlBatchEventHashProjectionV1
  | WorkflowBatchExecutionControlGlobalEventHashProjectionV1;

export type WorkflowBatchExecutionControlBatchEventV1 =
  WorkflowBatchExecutionControlBatchEventHashProjectionV1 & {
    event_hash: string;
  };

export type WorkflowBatchExecutionControlGlobalEventV1 =
  WorkflowBatchExecutionControlGlobalEventHashProjectionV1 & {
    event_hash: string;
  };

export type WorkflowBatchExecutionControlOwnerEventV1 =
  | WorkflowBatchExecutionControlBatchEventV1
  | WorkflowBatchExecutionControlGlobalEventV1;

type WorkflowBatchExecutionControlMutationCommonV1<
  Policy extends
    | WorkflowBatchExecutionControlForwardPolicyDecisionV1
    | WorkflowBatchExecutionControlRecoveryPolicyDecisionV1,
> = {
  schema_version: 1;
  pins: WorkflowBatchExecutionControlPinsV1;
  scope: WorkflowBatchExecutionControlScopeV1;
  policy_decision: Policy;
  request_meta: WorkflowBatchExecutionControlRequestMetaV1;
  owner_batch_id: string;
  purpose_profile_hash: string;
  precondition: WorkflowBatchExecutionControlExpectedExistingV1;
};

export type WorkflowBatchExecutionControlClaimCommandV1 =
  | (WorkflowBatchExecutionControlMutationCommonV1<WorkflowBatchExecutionControlForwardPolicyDecisionV1> & {
    operation: "claim_batch";
    expected_claim: WorkflowBatchExecutionControlNoClaimV1;
    payload: { claim_type: "ordinary"; requested_ttl_seconds: number };
  })
  | (WorkflowBatchExecutionControlMutationCommonV1<WorkflowBatchExecutionControlRecoveryPolicyDecisionV1> & {
      operation: "claim_batch";
      expected_claim: WorkflowBatchExecutionControlNoClaimV1;
      payload: {
        claim_type: "reconciliation_only";
        requested_ttl_seconds: number;
        original_identity_collection_hash: string;
        requested_operations: WorkflowBatchExecutionControlRecoveryOperationV1[];
      };
    });

export type WorkflowBatchExecutionControlRenewClaimCommandV1 =
  | (WorkflowBatchExecutionControlMutationCommonV1<WorkflowBatchExecutionControlForwardPolicyDecisionV1> & {
      operation: "renew_batch_claim";
      current_claim: WorkflowBatchExecutionControlOrdinaryClaimV1;
      payload: { requested_ttl_seconds: number };
    })
  | (WorkflowBatchExecutionControlMutationCommonV1<WorkflowBatchExecutionControlRecoveryPolicyDecisionV1> & {
      operation: "renew_batch_claim";
      current_claim: WorkflowBatchExecutionControlReconciliationClaimV1;
      payload: { requested_ttl_seconds: number };
    });

export type WorkflowBatchExecutionControlReleaseClaimCommandV1 =
  | (WorkflowBatchExecutionControlMutationCommonV1<WorkflowBatchExecutionControlForwardPolicyDecisionV1> & {
      operation: "release_batch_claim";
      current_claim: WorkflowBatchExecutionControlOrdinaryClaimV1;
      payload: Record<string, never>;
    })
  | (WorkflowBatchExecutionControlMutationCommonV1<WorkflowBatchExecutionControlRecoveryPolicyDecisionV1> & {
      operation: "release_batch_claim";
      current_claim: WorkflowBatchExecutionControlReconciliationClaimV1;
      payload: Record<string, never>;
    });

export type WorkflowBatchExecutionControlReserveCommandV1 =
  WorkflowBatchExecutionControlMutationCommonV1<WorkflowBatchExecutionControlForwardPolicyDecisionV1> & {
    operation: "reserve_executions";
    current_claim: WorkflowBatchExecutionControlOrdinaryClaimV1;
    payload: {
      logical_unit_collection_root: string;
      reservation_intent_hash: string;
    };
  };

export type WorkflowBatchExecutionControlSealCommandV1 =
  WorkflowBatchExecutionControlMutationCommonV1<WorkflowBatchExecutionControlForwardPolicyDecisionV1> & {
    operation: "seal_execution_manifest";
    current_claim: WorkflowBatchExecutionControlOrdinaryClaimV1;
    payload: {
      reservation_hash: string;
      execution_manifest_hash: string;
    };
  };

export type WorkflowBatchExecutionControlConfirmClientCommitCommandV1 =
  (
    | (WorkflowBatchExecutionControlMutationCommonV1<WorkflowBatchExecutionControlForwardPolicyDecisionV1> & {
        current_claim: WorkflowBatchExecutionControlOrdinaryClaimV1;
      })
    | (WorkflowBatchExecutionControlMutationCommonV1<WorkflowBatchExecutionControlRecoveryPolicyDecisionV1> & {
        current_claim: WorkflowBatchExecutionControlReconciliationClaimV1;
      })
  ) & {
    operation: "confirm_client_commit";
    payload: {
      seal_hash: string;
      execution_manifest_hash: string;
      client_commit_ref: string;
      client_commit_hash: string;
    };
  };

export type WorkflowBatchExecutionControlDispatchCommandV1 =
  (
    | (WorkflowBatchExecutionControlMutationCommonV1<WorkflowBatchExecutionControlForwardPolicyDecisionV1> & {
        current_claim: WorkflowBatchExecutionControlOrdinaryClaimV1;
      })
    | (WorkflowBatchExecutionControlMutationCommonV1<WorkflowBatchExecutionControlRecoveryPolicyDecisionV1> & {
        current_claim: WorkflowBatchExecutionControlReconciliationClaimV1;
      })
  ) & {
    operation: "dispatch_batch";
    payload: {
      seal_hash: string;
      client_commit_hash: string;
      execution_manifest_hash: string;
    };
  };

export type WorkflowBatchExecutionControlQuarantineCommandV1 =
  WorkflowBatchExecutionControlMutationCommonV1<WorkflowBatchExecutionControlRecoveryPolicyDecisionV1> & {
    operation: "quarantine_reservation";
    current_claim: WorkflowBatchExecutionControlReconciliationClaimV1;
    payload: {
      reservation_hash: string;
      original_identity_collection_hash: string;
      reason_code: string;
    };
  };

export type WorkflowBatchExecutionControlReconcileCommandV1 =
  WorkflowBatchExecutionControlMutationCommonV1<WorkflowBatchExecutionControlRecoveryPolicyDecisionV1> & {
    operation: "reconcile_batch";
    current_claim: WorkflowBatchExecutionControlReconciliationClaimV1;
    payload:
      | {
          outcome: "completed";
          expected_completion_collection_root: string;
          expected_lifecycle_head: string;
          reason_code: string;
        }
      | {
          outcome: "unresolved";
          expected_completion_collection_root: string | null;
          expected_lifecycle_head: string | null;
          reason_code: string;
        };
  };

export type WorkflowBatchExecutionControlCommandV1 =
  | WorkflowBatchExecutionControlClaimCommandV1
  | WorkflowBatchExecutionControlRenewClaimCommandV1
  | WorkflowBatchExecutionControlReleaseClaimCommandV1
  | WorkflowBatchExecutionControlReserveCommandV1
  | WorkflowBatchExecutionControlSealCommandV1
  | WorkflowBatchExecutionControlConfirmClientCommitCommandV1
  | WorkflowBatchExecutionControlDispatchCommandV1
  | WorkflowBatchExecutionControlQuarantineCommandV1
  | WorkflowBatchExecutionControlReconcileCommandV1;

type WorkflowBatchExecutionControlRequestHashProjectionOfV1<
  Request extends { request_meta: WorkflowBatchExecutionControlRequestMetaV1 },
> = Request extends unknown
  ? Omit<Request, "request_meta"> & {
      request_meta: Omit<WorkflowBatchExecutionControlRequestMetaV1, "request_hash">;
    }
  : never;

export type WorkflowBatchExecutionControlRequestHashProjectionV1 =
  | WorkflowBatchExecutionControlRequestHashProjectionOfV1<WorkflowBatchExecutionControlCreateRequestV1>
  | WorkflowBatchExecutionControlRequestHashProjectionOfV1<WorkflowBatchExecutionControlCommandV1>;

export type WorkflowBatchExecutionControlAuthorityEnvelopeHashProjectionV1 = {
  schema_version: 1;
  receipt_ref: string;
  pins: WorkflowBatchExecutionControlPinsV1;
  scope: WorkflowBatchExecutionControlScopeV1;
  causation: WorkflowBatchExecutionControlEventCausationV1;
  before_batch_head: WorkflowBatchExecutionControlBatchHeadV1 | null;
  after_batch_head: WorkflowBatchExecutionControlBatchHeadV1;
  before_global_head: WorkflowBatchExecutionControlGlobalHeadV1;
  after_global_head: WorkflowBatchExecutionControlGlobalHeadV1;
  batch_event: WorkflowBatchExecutionControlBatchEventV1;
  global_event: WorkflowBatchExecutionControlGlobalEventV1;
  capacity_delta: WorkflowBatchExecutionControlCapacityDeltaV1;
  result_snapshot: WorkflowBatchExecutionControlSnapshotV1;
  dispatch_commit_hash: string | null;
  owner_issued_at: string;
};

export type WorkflowBatchExecutionControlAuthorityEnvelopeV1 =
  WorkflowBatchExecutionControlAuthorityEnvelopeHashProjectionV1 & {
    authority_envelope_hash: string;
  };

export type WorkflowBatchExecutionControlAuthorityReceiptV1 = {
  receipt_ref: string;
  authority_envelope: WorkflowBatchExecutionControlAuthorityEnvelopeV1;
  canonical_envelope_utf8: string;
  authority_envelope_hash: string;
  canonical_envelope_bytes_sha256: string;
};

export type WorkflowBatchExecutionControlReadPageBindingV1 =
  | {
      kind: "singleton";
      cursor_start: null;
      cursor_end: null;
      limit: 1;
      item_count: 1;
      page_hash: string;
      full_collection_root: string;
    }
  | {
      kind: "collection_page";
      cursor_start: string | null;
      cursor_end: string | null;
      next_cursor: string | null;
      limit: number;
      item_count: number;
      page_hash: string;
      full_collection_root: string;
    };

type WorkflowBatchExecutionControlReadQueryBindingBaseV1<
  Operation extends WorkflowBatchExecutionControlReadOperationV1,
> = {
  operation: Operation;
  query_id: string;
  query_hash: string;
  read_policy: WorkflowBatchExecutionControlReadbackPolicyDecisionV1;
};

export type WorkflowBatchExecutionControlRequestOutcomeQueryBindingV1 =
  WorkflowBatchExecutionControlReadQueryBindingBaseV1<"read_request_outcome"> & {
    client_generation_key: string;
    command_id: string;
    idempotency_key: string;
    request_hash: string;
  };

export type WorkflowBatchExecutionControlReadQueryBindingV1<
  Operation extends WorkflowBatchExecutionControlReadOperationV1 = WorkflowBatchExecutionControlReadOperationV1,
> = Operation extends "read_request_outcome"
  ? WorkflowBatchExecutionControlRequestOutcomeQueryBindingV1
  : WorkflowBatchExecutionControlReadQueryBindingBaseV1<Operation>;

export type WorkflowBatchExecutionControlReadObservationHashProjectionV1<
  Result,
  Operation extends WorkflowBatchExecutionControlReadOperationV1 = WorkflowBatchExecutionControlReadOperationV1,
> = {
  schema_version: 1;
  observation_ref: string;
  pins: WorkflowBatchExecutionControlPinsV1;
  scope: WorkflowBatchExecutionControlScopeV1;
  query_binding: WorkflowBatchExecutionControlReadQueryBindingV1<Operation>;
  as_of_batch_head: WorkflowBatchExecutionControlBatchHeadV1 | null;
  as_of_global_head: WorkflowBatchExecutionControlGlobalHeadV1;
  page: WorkflowBatchExecutionControlReadPageBindingV1;
  result: Result;
  observed_at: string;
};

export type WorkflowBatchExecutionControlReadObservationV1<
  Result,
  Operation extends WorkflowBatchExecutionControlReadOperationV1 = WorkflowBatchExecutionControlReadOperationV1,
> = WorkflowBatchExecutionControlReadObservationHashProjectionV1<Result, Operation> & {
    read_observation_hash: string;
  };

export type WorkflowBatchExecutionControlCreatedResultV1 = {
  kind: "created";
  receipt: WorkflowBatchExecutionControlAuthorityReceiptV1;
};

export type WorkflowBatchExecutionControlResumedResultV1 = {
  kind: "resumed";
  observation: WorkflowBatchExecutionControlReadObservationV1<
    WorkflowBatchExecutionControlSnapshotV1,
    "read_batch_snapshot"
  >;
};

export type WorkflowBatchExecutionControlOpenResultV1 =
  | WorkflowBatchExecutionControlCreatedResultV1
  | WorkflowBatchExecutionControlResumedResultV1;

export type WorkflowBatchExecutionControlOpenResultForV1<
  Request extends WorkflowBatchExecutionControlOpenRequestV1,
> = Request extends WorkflowBatchExecutionControlCreateRequestV1
  ? WorkflowBatchExecutionControlCreatedResultV1
  : WorkflowBatchExecutionControlResumedResultV1;

export type WorkflowBatchExecutionControlErrorV1 = {
  code: WorkflowBatchExecutionControlErrorCodeV1;
  retryability: "never" | "exact_retry_only" | "readback_required";
  current_batch_head: WorkflowBatchExecutionControlBatchHeadV1 | null;
  current_global_head: WorkflowBatchExecutionControlGlobalHeadV1 | null;
  receipt_ref: string | null;
};

export type WorkflowBatchExecutionControlResultV1<Value> =
  | { ok: true; value: Value }
  | { ok: false; error: WorkflowBatchExecutionControlErrorV1 };

export type WorkflowBatchExecutionControlReadOperationV1 =
  | "describe_capability"
  | "read_batch_snapshot"
  | "read_batch_history_page"
  | "read_global_admission_snapshot"
  | "read_uniqueness_page"
  | "read_execution_receipts_page"
  | "read_execution_lifecycle"
  | "read_request_outcome";

export type WorkflowBatchExecutionControlReadInputV1<
  Operation extends WorkflowBatchExecutionControlReadOperationV1,
> = {
  operation: Operation;
  schema_version: 1;
  expected_pins: WorkflowBatchExecutionControlPinsV1;
  scope: WorkflowBatchExecutionControlScopeV1;
  query: WorkflowBatchExecutionControlReadQueryBindingV1<Operation>;
  as_of_batch_head: WorkflowBatchExecutionControlBatchHeadV1 | null;
  as_of_global_head: WorkflowBatchExecutionControlGlobalHeadV1;
};

export type WorkflowBatchExecutionControlPageInputV1<
  Operation extends WorkflowBatchExecutionControlReadOperationV1,
> = WorkflowBatchExecutionControlReadInputV1<Operation> & {
    cursor: string | null;
    limit: number;
  };

export type WorkflowBatchExecutionControlHistoryItemV1 = {
  owner_event: WorkflowBatchExecutionControlBatchEventV1;
  authority_envelope_hash: string;
  receipt_ref: string;
};

export type WorkflowBatchExecutionControlUniquenessItemV1 =
  | {
      kind: "logical_unit";
      logical_series_hash: string;
      generation: number;
      logical_unit_hash: string;
      owner_batch_id: string;
    }
  | {
      kind: "owner_task_id";
      owner_task_id: string;
      owner_batch_id: string;
    }
  | {
      kind: "owner_execution_id";
      owner_execution_id: string;
      owner_batch_id: string;
    };

type WorkflowBatchExecutionControlExecutionReceiptItemBaseV1 = {
  owner_execution_id: string;
  receipt_ref: string;
  receipt_hash: string;
  owner_completed_at: string;
};

export type WorkflowBatchExecutionControlExecutionReceiptItemV1 =
  | (WorkflowBatchExecutionControlExecutionReceiptItemBaseV1 & {
      terminal_status: "succeeded";
      output_effect_hash: string;
      failure_reason_code: null;
    })
  | (WorkflowBatchExecutionControlExecutionReceiptItemBaseV1 & {
      terminal_status: "failed";
      output_effect_hash: string | null;
      failure_reason_code: string;
    })
  | (WorkflowBatchExecutionControlExecutionReceiptItemBaseV1 & {
      terminal_status: "cancelled";
      output_effect_hash: null;
      failure_reason_code: string;
    });

export type WorkflowBatchExecutionControlExecutionLifecycleItemV1 = {
  owner_execution_id: string;
  status: "reserved" | "dispatch_recorded" | "started" | "succeeded" | "failed" | "cancelled";
  observation_ref: string;
  observation_hash: string;
  owner_observed_at: string;
};

export type WorkflowBatchExecutionControlRequestOutcomeV1 =
  | {
      kind: "committed";
      receipt_ref: string;
      authority_envelope_hash: string;
    }
  | { kind: "pending" }
  | { kind: "not_found" };

export type WorkflowBatchExecutionControlRequestOutcomeInputV1 =
  WorkflowBatchExecutionControlReadInputV1<"read_request_outcome">;

export type WorkflowBatchExecutionControlResolvedEnvelopeV1 =
  WorkflowBatchExecutionControlAuthorityReceiptV1;

export type WorkflowBatchExecutionControlResolverInputV1 = {
  receipt_ref: string;
  expected_pins: WorkflowBatchExecutionControlPinsV1;
};

export type WorkflowBatchExecutionControllerCommandPortV1 = {
  open_or_resume_batch<Request extends WorkflowBatchExecutionControlOpenRequestV1>(
    input: Request,
  ): Promise<
    WorkflowBatchExecutionControlResultV1<WorkflowBatchExecutionControlOpenResultForV1<Request>>
  >;
  invoke(
    input: WorkflowBatchExecutionControlCommandV1,
  ): Promise<WorkflowBatchExecutionControlResultV1<WorkflowBatchExecutionControlAuthorityReceiptV1>>;
};

export type WorkflowBatchExecutionReadbackPortV1 = {
  describe_capability(
    input: WorkflowBatchExecutionControlReadInputV1<"describe_capability">,
  ): Promise<
    WorkflowBatchExecutionControlResultV1<
      WorkflowBatchExecutionControlReadObservationV1<
        WorkflowBatchExecutionControlCapabilityDescriptorV1,
        "describe_capability"
      >
    >
  >;
  read_batch_snapshot(
    input: WorkflowBatchExecutionControlReadInputV1<"read_batch_snapshot">,
  ): Promise<
    WorkflowBatchExecutionControlResultV1<
      WorkflowBatchExecutionControlReadObservationV1<
        WorkflowBatchExecutionControlSnapshotV1,
        "read_batch_snapshot"
      >
    >
  >;
  read_batch_history_page(
    input: WorkflowBatchExecutionControlPageInputV1<"read_batch_history_page">,
  ): Promise<
    WorkflowBatchExecutionControlResultV1<
      WorkflowBatchExecutionControlReadObservationV1<
        WorkflowBatchExecutionControlHistoryItemV1[],
        "read_batch_history_page"
      >
    >
  >;
  read_global_admission_snapshot(
    input: WorkflowBatchExecutionControlReadInputV1<"read_global_admission_snapshot">,
  ): Promise<
    WorkflowBatchExecutionControlResultV1<
      WorkflowBatchExecutionControlReadObservationV1<
        WorkflowBatchExecutionControlGlobalHeadV1,
        "read_global_admission_snapshot"
      >
    >
  >;
  read_uniqueness_page(
    input: WorkflowBatchExecutionControlPageInputV1<"read_uniqueness_page">,
  ): Promise<
    WorkflowBatchExecutionControlResultV1<
      WorkflowBatchExecutionControlReadObservationV1<
        WorkflowBatchExecutionControlUniquenessItemV1[],
        "read_uniqueness_page"
      >
    >
  >;
  read_execution_receipts_page(
    input: WorkflowBatchExecutionControlPageInputV1<"read_execution_receipts_page">,
  ): Promise<
    WorkflowBatchExecutionControlResultV1<
      WorkflowBatchExecutionControlReadObservationV1<
        WorkflowBatchExecutionControlExecutionReceiptItemV1[],
        "read_execution_receipts_page"
      >
    >
  >;
  read_execution_lifecycle(
    input: WorkflowBatchExecutionControlPageInputV1<"read_execution_lifecycle">,
  ): Promise<
    WorkflowBatchExecutionControlResultV1<
      WorkflowBatchExecutionControlReadObservationV1<
        WorkflowBatchExecutionControlExecutionLifecycleItemV1[],
        "read_execution_lifecycle"
      >
    >
  >;
  read_request_outcome(
    input: WorkflowBatchExecutionControlRequestOutcomeInputV1,
  ): Promise<
    WorkflowBatchExecutionControlResultV1<
      WorkflowBatchExecutionControlReadObservationV1<
        WorkflowBatchExecutionControlRequestOutcomeV1,
        "read_request_outcome"
      >
    >
  >;
};

export type WorkflowBatchExecutionReceiptResolverPortV1 = {
  resolve_authority_envelope(
    input: WorkflowBatchExecutionControlResolverInputV1,
  ): Promise<WorkflowBatchExecutionControlResultV1<WorkflowBatchExecutionControlResolvedEnvelopeV1>>;
};

export type WorkflowBatchExecutionControllerPortV1 =
  WorkflowBatchExecutionControllerCommandPortV1;
