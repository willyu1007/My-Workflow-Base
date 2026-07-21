export const workflowRuntimeKinds = [
  "scenario_action",
  "model_call",
  "tool_call",
  "transform",
  "human_gate",
  "wait_for_input",
  "artifact_write",
  "event_emit",
] as const;

export type WorkflowRuntimeKind = (typeof workflowRuntimeKinds)[number];

export const workflowStepPolicyFlags = [
  "policy_gate",
  "generation_record_required",
] as const;

export type WorkflowStepPolicyFlag = (typeof workflowStepPolicyFlags)[number];

export type WorkflowStepTypeDefinition = {
  step_type: string;
  runtime_kind: WorkflowRuntimeKind;
  owner: "host" | "scenario";
  policy_flags?: WorkflowStepPolicyFlag[];
  legacy_aliases?: string[];
};

export const standardWorkflowHandoffTypes = [
  "public_draft",
  "indexing",
  "notification",
  "external_delivery",
] as const;

export type StandardWorkflowHandoffType = (typeof standardWorkflowHandoffTypes)[number];

/** Stable platform namespace for shared My-Chat identity and runtime refs. */
export const platformCanonicalRefNamespace = "my_chat" as const;

/**
 * Cross-owner reference. The value is deliberately metadata-only: callers must
 * reread the canonical owner and must never place PII, authorization snapshots,
 * or domain bodies in any field.
 */
export type CanonicalRefV1 = {
  schema_version: 1;
  namespace: string;
  object_type: string;
  object_id: string;
  version?: number;
};

export type ScenarioContractReleaseRefV1 = {
  scenario_key: string;
  release_id: string;
  contract_version: string;
  base_contract_version: string;
  host_sdk_version: string;
  source_hash: string;
};

export type ScenarioActorContextV1 = {
  actor_ref: CanonicalRefV1;
  represented_organization_ref?: CanonicalRefV1;
};

export type ScenarioCommandEnvelopeV1 = {
  envelope_version: 1;
  command_id: string;
  command_type: string;
  command_schema_version: number;
  idempotency_key: string;
  scenario_release: ScenarioContractReleaseRefV1;
  workspace_ref: CanonicalRefV1;
  workflow_run_ref: CanonicalRefV1;
  workflow_step_ref: CanonicalRefV1;
  actor: ScenarioActorContextV1;
  purpose: string;
  expected_versions: Record<string, number>;
  context_refs: CanonicalRefV1[];
  correlation_id: string;
  trace_id?: string;
};

/**
 * Stable replay identity for a scenario command. Correlation and trace ids are
 * deliberately excluded because they describe a delivery attempt, not the
 * business command. Every authority- or target-bearing field is included so
 * an idempotency key cannot be replayed under another actor, workspace,
 * release, purpose, represented organization, or set of expected versions.
 */
export function scenarioCommandIdentityHash(input: ScenarioCommandEnvelopeV1): string {
  const stableStringify = (value: unknown): string => {
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
    if (value !== null && typeof value === "object") {
      const record = value as Record<string, unknown>;
      return `{${Object.keys(record)
        .sort()
        .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
        .join(",")}}`;
    }
    return JSON.stringify(value);
  };

  return createHash("sha256")
    .update(stableStringify({
      actor: {
        actor_ref: input.actor.actor_ref,
        represented_organization_ref: input.actor.represented_organization_ref ?? null,
      },
      command_id: input.command_id,
      command_schema_version: input.command_schema_version,
      command_type: input.command_type,
      context_refs: input.context_refs,
      expected_versions: input.expected_versions,
      idempotency_key: input.idempotency_key,
      purpose: input.purpose,
      scenario_release: input.scenario_release,
      workflow_run_ref: input.workflow_run_ref,
      workflow_step_ref: input.workflow_step_ref,
      workspace_ref: input.workspace_ref,
    }))
    .digest("hex");
}

export type ScenarioCommandExecutionStatus =
  | "accepted"
  | "applied"
  | "already_applied"
  | "rejected"
  | "compensated";

export type ScenarioCommandReceiptV1 = {
  receipt_version: 1;
  command_id: string;
  idempotency_key: string;
  workflow_step_ref: CanonicalRefV1;
  status: ScenarioCommandExecutionStatus;
  owner_execution_ref: CanonicalRefV1;
  result_refs: CanonicalRefV1[];
  generation_record_refs: CanonicalRefV1[];
  owner_version: number;
  committed_at: string;
  reason_code?: string;
};

export type ScenarioEventEnvelopeV1 = {
  envelope_version: 1;
  event_id: string;
  event_type: string;
  event_schema_version: number;
  scenario_release: ScenarioContractReleaseRefV1;
  owner_event_ref: CanonicalRefV1;
  subject_refs: CanonicalRefV1[];
  purpose: string;
  actor_ref?: CanonicalRefV1;
  correlation_id: string;
  trace_id?: string;
  occurred_at: string;
};

export type GenerationTicketV1 = {
  ticket_version: 1;
  generation_record_ref: CanonicalRefV1;
  scenario_release: ScenarioContractReleaseRefV1;
  actor_ref: CanonicalRefV1;
  workspace_ref: CanonicalRefV1;
  purpose: string;
  intent_key: string;
  prompt_template_hash: string;
  requested_capability: "model" | "embedding" | "ocr";
  correlation_id: string;
  trace_id?: string;
};

export type IntegrationLockRevisionV3 = {
  source: "git" | "package";
  repository?: string;
  revision?: string;
  package?: string;
  version?: string;
  artifact_path?: string;
  logical_paths: string[];
  hash_algorithm: "sha256-path-content-source-hash-normalized-v1";
  source_hash: string;
};

export type IntegrationLockV3 = {
  lock_version: 3;
  generated_at: string;
  scenario_key: string;
  qualification_mode: "ordinary" | "joint_candidate";
  base_contract: IntegrationLockRevisionV3;
  host_sdk: IntegrationLockRevisionV3;
  scenario_artifact: IntegrationLockRevisionV3;
};
import { createHash } from "node:crypto";
