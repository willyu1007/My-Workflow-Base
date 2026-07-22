import type {
  MaterializedHandoff,
  ScenarioCommandDriverContext,
  ScenarioHandoffRequestSnapshot,
  WorkflowCompleteStepLegacyInput,
  WorkflowCompleteStepMaterializationInputV1,
  WorkflowCompleteStepResult,
  WorkflowHandoffDraft,
  WorkflowStepMaterializationResultV1,
} from "@host/workflow-contracts";

declare const transientClaimToken: string;

const commandMeta = {
  workspace_id: "workspace-negative",
  idempotency_key: "negative-completion",
  correlation_id: "negative-correlation",
  client_surface: "worker_runtime",
} as const;

// @ts-expect-error -- the trusted driver must carry transient claim evidence.
export const driverWithoutClaimToken: ScenarioCommandDriverContext = {
  driverRef: {
    schema_version: 1,
    namespace: "my_chat",
    object_type: "workflow_step",
    object_id: "step-negative",
  },
  contractHash: "contract-hash",
  capabilityKey: "negative_capability",
  entrypointKey: "negative_entrypoint",
  expectedStepVersion: 1,
};

// @ts-expect-error -- the v1 completion branch must carry transient claim evidence.
export const vnextCompletionWithoutClaimToken: WorkflowCompleteStepMaterializationInputV1 = {
  completion_contract_version: 1,
  run_id: "run-negative",
  step_id: "step-negative",
  expected_version: 1,
  output_refs: [],
  meta: commandMeta,
};

export const legacyCompletionRejectsClaimToken: WorkflowCompleteStepLegacyInput = {
  run_id: "run-negative",
  step_id: "step-negative",
  expected_version: 1,
  output_refs: [],
  // @ts-expect-error -- legacy completion cannot silently opt into the trusted v1 branch.
  claim_token: transientClaimToken,
  meta: commandMeta,
};

export const snapshotRejectsClaimToken: ScenarioHandoffRequestSnapshot = {
  requestId: "request-negative",
  handoffKey: "user_attention",
  requestedPurpose: "user_attention",
  // @ts-expect-error -- persisted scenario replay snapshots cannot retain claim evidence.
  claimToken: transientClaimToken,
};

export const draftRejectsClaimToken: WorkflowHandoffDraft = {
  draft_key: "request-negative",
  handoff_key: "user_attention",
  requested_purpose: "user_attention",
  // @ts-expect-error -- host materialization drafts cannot retain claim evidence.
  claim_token: transientClaimToken,
};

export const materializedHandoffRejectsClaimToken: MaterializedHandoff = {
  draft_key: "request-negative",
  handoff_ref: {
    schema_version: 1,
    namespace: "my_chat",
    object_type: "workflow_handoff",
    object_id: "handoff-negative",
    version: 1,
  },
  disposition: "created",
  // @ts-expect-error -- materialized result DTOs cannot expose claim evidence.
  claim_token: transientClaimToken,
};

export const completionResultRejectsClaimToken: WorkflowStepMaterializationResultV1 = {
  completion_contract_version: 1,
  run_id: "run-negative",
  step_id: "step-negative",
  status: "completed",
  aggregate_version: 2,
  output_refs: [],
  materialized_handoffs: [],
  // @ts-expect-error -- completion results cannot expose claim evidence.
  claim_token: transientClaimToken,
};

// @ts-expect-error -- a v1-discriminated completion result must include deterministic materialization output.
export const vnextCompletionResultRequiresMaterializedHandoffs: WorkflowCompleteStepResult = {
  completion_contract_version: 1,
  run_id: "run-negative",
  step_id: "step-negative",
  status: "completed",
  aggregate_version: 2,
  output_refs: [],
};
