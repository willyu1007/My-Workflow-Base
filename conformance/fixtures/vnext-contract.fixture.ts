import type {
  HandoffManifest,
  MaterializedHandoff,
  ScenarioCommandDriverContext,
  ScenarioHandoffRequestSnapshot,
  WorkflowCommandMeta,
  WorkflowCompleteStepMaterializationInputV1,
  WorkflowCompleteStepResult,
  WorkflowHandoffDraft,
  WorkflowHandoffLifecycleStatusV1,
  WorkflowHostValidationSnapshot,
  WorkflowRuntimePortMaterializationV1,
  WorkflowStepHandlerResult,
  WorkflowStepMaterializationResultV1,
  WorkflowStepResult,
} from "@host/workflow-contracts";
import { legacyCompleteStepInputFixture } from "./legacy-contract.fixture.js";

const sourceContextRef = {
  schema_version: 1,
  namespace: "example",
  object_type: "care_item",
  object_id: "care-item-1",
  version: 3,
} as const;

export const vnextHandoffManifestFixture = {
  handoff_key: "user_attention",
  handoff_type: "notification",
  source_artifact_types: [],
  source_context_ref_types: [
    {
      namespace: "scenario.example",
      object_type: "care_item",
    },
  ],
  requested_purposes: ["user_attention"],
  downstream_owner: "notification",
  policy_key: "example.can_request_user_attention",
  receipt_required: true,
  materialization_mode: "workflow_step_complete_v1",
} satisfies HandoffManifest;

export const scenarioSnapshotFixture = {
  requestId: "attention-request-1",
  handoffKey: "user_attention",
  requestedPurpose: "user_attention",
  sourceContextRefs: [sourceContextRef],
  expiresAt: "2026-07-14T00:00:00.000Z",
} satisfies ScenarioHandoffRequestSnapshot;

export const handoffDraftFixture = {
  draft_key: scenarioSnapshotFixture.requestId,
  handoff_key: scenarioSnapshotFixture.handoffKey,
  requested_purpose: scenarioSnapshotFixture.requestedPurpose,
  source_context_refs: scenarioSnapshotFixture.sourceContextRefs,
  expected_versions: {
    "example:care_item:care-item-1": 3,
  },
  expires_at: scenarioSnapshotFixture.expiresAt,
} satisfies WorkflowHandoffDraft;

export function createScenarioCommandDriverFixture(claimToken: string): ScenarioCommandDriverContext {
  return {
    driverRef: {
      schema_version: 1,
      namespace: "my_chat",
      object_type: "workflow_step",
      object_id: "step-1",
    },
    contractHash: "contract-hash",
    capabilityKey: "example_capability",
    entrypointKey: "example_entrypoint",
    claimToken,
    expectedStepVersion: 2,
  };
}

export const vnextHostSnapshotFixture = {
  scenario_records: {},
  domain_resolver_keys: [],
  downstream_owners: ["notification"],
  standard_events: [],
  platform_events: [],
  allowed_surfaces: [],
  projection_reviews: [],
  host_capabilities: ["workflow_handoff_materialization_v1"],
} satisfies WorkflowHostValidationSnapshot;

export const vnextHandlerResultFixture = {
  output_refs: [],
  handoff_drafts: [handoffDraftFixture],
} satisfies WorkflowStepHandlerResult;

export function createVnextCompleteStepInputFixture(
  claimToken: string,
): WorkflowCompleteStepMaterializationInputV1 {
  const driver = createScenarioCommandDriverFixture(claimToken);

  return {
    completion_contract_version: 1,
    run_id: "run-1",
    step_id: "step-1",
    expected_version: driver.expectedStepVersion,
    claim_token: driver.claimToken,
    output_refs: [],
    handoff_drafts: vnextHandlerResultFixture.handoff_drafts,
    meta: {
      workspace_id: "workspace-1",
      idempotency_key: "complete-step-1",
      correlation_id: "correlation-1",
      client_surface: "worker_runtime",
    },
  };
}

export const materializedHandoffFixture = {
  draft_key: handoffDraftFixture.draft_key,
  handoff_ref: {
    schema_version: 1,
    namespace: "my_chat",
    object_type: "workflow_handoff",
    object_id: "handoff-1",
    version: 1,
  },
  disposition: "created",
} satisfies MaterializedHandoff;

export const vnextCompleteStepResultFixture = {
  completion_contract_version: 1,
  run_id: "run-1",
  step_id: "step-1",
  status: "completed",
  aggregate_version: 3,
  output_refs: [materializedHandoffFixture.handoff_ref],
  materialized_handoffs: [materializedHandoffFixture],
} satisfies WorkflowCompleteStepResult;

export const vnextLifecycleFixture = "requested" satisfies WorkflowHandoffLifecycleStatusV1;

export async function invokeVnextCompletionFixture(
  runtimePort: WorkflowRuntimePortMaterializationV1,
  claimToken: string,
): Promise<MaterializedHandoff[]> {
  const response = await runtimePort.complete_step(createVnextCompleteStepInputFixture(claimToken));
  return response.data.materialized_handoffs;
}

export async function invokeLegacyCompletionThroughVnextPortFixture(
  runtimePort: WorkflowRuntimePortMaterializationV1,
): Promise<WorkflowStepResult> {
  const response = await runtimePort.complete_step(legacyCompleteStepInputFixture);
  return response.data;
}

export async function completeClaimedStepThroughHostPortFixture(input: {
  runtimePort: WorkflowRuntimePortMaterializationV1;
  driver: ScenarioCommandDriverContext;
  runId: string;
  handlerResult: WorkflowStepHandlerResult;
  meta: WorkflowCommandMeta;
}): Promise<WorkflowStepMaterializationResultV1> {
  const response = await input.runtimePort.complete_step({
    completion_contract_version: 1,
    run_id: input.runId,
    step_id: input.driver.driverRef.object_id,
    expected_version: input.driver.expectedStepVersion,
    claim_token: input.driver.claimToken,
    output_refs: input.handlerResult.output_refs,
    artifact_drafts: input.handlerResult.artifact_drafts,
    context_bindings: input.handlerResult.context_bindings,
    handoff_drafts: input.handlerResult.handoff_drafts,
    event_drafts: input.handlerResult.event_drafts,
    meta: input.meta,
  });

  return response.data;
}
