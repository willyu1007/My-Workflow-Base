import {
  platformCanonicalRefNamespace,
  type CanonicalRefV1,
  type ScenarioCommandEnvelopeV1,
  type ScenarioCommandReceiptV1,
  type ScenarioContractReleaseRefV1,
  type ScenarioEventEnvelopeV1,
} from "./federation.js";

export class FederationContractValidationError extends Error {
  constructor(readonly code: string, readonly path: string, message: string) {
    super(message);
    this.name = "FederationContractValidationError";
  }
}

const refKeys = new Set(["schema_version", "namespace", "object_type", "object_id", "version"]);
const releaseKeys = new Set(["scenario_key", "release_id", "contract_version", "base_contract_version", "host_sdk_version", "source_hash"]);
const commandKeys = new Set([
  "envelope_version", "command_id", "command_type", "command_schema_version", "idempotency_key",
  "scenario_release", "workspace_ref", "workflow_run_ref", "workflow_step_ref", "actor", "purpose",
  "expected_versions", "context_refs", "correlation_id", "trace_id",
]);
const actorKeys = new Set(["actor_ref", "represented_organization_ref"]);
const receiptKeys = new Set([
  "receipt_version", "command_id", "idempotency_key", "workflow_step_ref", "status",
  "owner_execution_ref", "result_refs", "generation_record_refs", "owner_version", "committed_at", "reason_code",
]);
const eventKeys = new Set([
  "envelope_version", "event_id", "event_type", "event_schema_version", "scenario_release",
  "owner_event_ref", "subject_refs", "purpose", "actor_ref", "correlation_id", "trace_id", "occurred_at",
]);
const receiptStatuses = new Set(["accepted", "applied", "already_applied", "rejected", "compensated"]);
const namePattern = /^[a-z][a-z0-9._-]*$/u;
const scenarioKeyPattern = /^[a-z][a-z0-9-]*$/u;
const sourceHashPattern = /^[a-f0-9]{64}$/u;
const safeReasonCodePattern = /^[a-z0-9][a-z0-9._:-]{0,199}$/u;
const platformRefShapes = {
  workspace_ref: "workspace",
  workflow_run_ref: "workflow_run",
  workflow_step_ref: "workflow_step",
  actor_ref: "actor",
  represented_organization_ref: "organization",
} as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const fail = (code: string, path: string, message: string): never => {
  throw new FederationContractValidationError(code, path, message);
};

const assertKeys = (record: Record<string, unknown>, allowed: Set<string>, path: string) => {
  const unknown = Object.keys(record).filter((key) => !allowed.has(key));
  if (unknown.length > 0) fail("unknown_field", path, `${path} contains unknown fields: ${unknown.join(", ")}`);
};

const assertString = (value: unknown, path: string) => {
  if (typeof value !== "string" || value.length === 0) fail("invalid_string", path, `${path} must be a non-empty string`);
};

const assertOptionalString = (value: unknown, path: string) => {
  if (value !== undefined) assertString(value, path);
};

const assertNonNegativeInteger = (value: unknown, path: string) => {
  if (!Number.isInteger(value) || Number(value) < 0) fail("invalid_integer", path, `${path} must be a non-negative integer`);
};

const assertPlatformRef = (
  value: unknown,
  objectType: (typeof platformRefShapes)[keyof typeof platformRefShapes],
  path: string,
) => {
  assertCanonicalRefV1(value, path);
  if (value.namespace !== platformCanonicalRefNamespace || value.object_type !== objectType) {
    fail(
      "invalid_platform_ref",
      path,
      `${path} must be ${platformCanonicalRefNamespace}/${objectType}`,
    );
  }
};

export const assertCanonicalRefV1: (value: unknown, path?: string) => asserts value is CanonicalRefV1 = (value, path = "ref") => {
  if (!isRecord(value)) fail("invalid_ref", path, `${path} must be an object`);
  const record = value as Record<string, unknown>;
  assertKeys(record, refKeys, path);
  if (record.schema_version !== 1) fail("invalid_ref", `${path}.schema_version`, "Canonical ref schema_version must be 1");
  if (typeof record.namespace !== "string" || !namePattern.test(record.namespace)) fail("invalid_ref", `${path}.namespace`, "Canonical ref namespace is invalid");
  if (typeof record.object_type !== "string" || !namePattern.test(record.object_type)) fail("invalid_ref", `${path}.object_type`, "Canonical ref object_type is invalid");
  if (typeof record.object_id !== "string" || record.object_id.length === 0 || record.object_id.length > 256) fail("invalid_ref", `${path}.object_id`, "Canonical ref object_id is invalid");
  if (record.version !== undefined) assertNonNegativeInteger(record.version, `${path}.version`);
};

export const assertScenarioContractReleaseRefV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioContractReleaseRefV1 = (value, path = "scenario_release") => {
  if (!isRecord(value)) fail("invalid_release", path, `${path} must be an object`);
  const record = value as Record<string, unknown>;
  assertKeys(record, releaseKeys, path);
  if (typeof record.scenario_key !== "string" || !scenarioKeyPattern.test(record.scenario_key)) fail("invalid_release", `${path}.scenario_key`, "Scenario key is invalid");
  for (const field of ["release_id", "contract_version", "base_contract_version", "host_sdk_version"] as const) assertString(record[field], `${path}.${field}`);
  if (typeof record.source_hash !== "string" || !sourceHashPattern.test(record.source_hash)) fail("invalid_release", `${path}.source_hash`, "Release source_hash must be lowercase SHA-256");
};

export const assertScenarioCommandEnvelopeV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioCommandEnvelopeV1 = (value, path = "command") => {
  if (!isRecord(value)) fail("invalid_command", path, `${path} must be an object`);
  const record = value as Record<string, unknown>;
  assertKeys(record, commandKeys, path);
  if (record.envelope_version !== 1) fail("invalid_command", `${path}.envelope_version`, "Command envelope_version must be 1");
  for (const field of ["command_id", "command_type", "idempotency_key", "purpose", "correlation_id"] as const) assertString(record[field], `${path}.${field}`);
  if (!Number.isInteger(record.command_schema_version) || Number(record.command_schema_version) < 1) fail("invalid_command", `${path}.command_schema_version`, "command_schema_version must be a positive integer");
  assertOptionalString(record.trace_id, `${path}.trace_id`);
  assertScenarioContractReleaseRefV1(record.scenario_release, `${path}.scenario_release`);
  assertPlatformRef(record.workspace_ref, platformRefShapes.workspace_ref, `${path}.workspace_ref`);
  assertPlatformRef(record.workflow_run_ref, platformRefShapes.workflow_run_ref, `${path}.workflow_run_ref`);
  assertPlatformRef(record.workflow_step_ref, platformRefShapes.workflow_step_ref, `${path}.workflow_step_ref`);
  if (!isRecord(record.actor)) fail("invalid_actor", `${path}.actor`, "actor must be an object");
  const actor = record.actor as Record<string, unknown>;
  assertKeys(actor, actorKeys, `${path}.actor`);
  assertPlatformRef(actor.actor_ref, platformRefShapes.actor_ref, `${path}.actor.actor_ref`);
  if (actor.represented_organization_ref !== undefined) {
    assertPlatformRef(
      actor.represented_organization_ref,
      platformRefShapes.represented_organization_ref,
      `${path}.actor.represented_organization_ref`,
    );
  }
  if (!isRecord(record.expected_versions)) fail("invalid_expected_versions", `${path}.expected_versions`, "expected_versions must be an object");
  const expectedVersions = record.expected_versions as Record<string, unknown>;
  for (const [key, version] of Object.entries(expectedVersions)) assertNonNegativeInteger(version, `${path}.expected_versions.${key}`);
  if (!Array.isArray(record.context_refs)) fail("invalid_context_refs", `${path}.context_refs`, "context_refs must be an array");
  (record.context_refs as unknown[]).forEach((ref, index) => assertCanonicalRefV1(ref, `${path}.context_refs.${index}`));
};

export const assertScenarioCommandReceiptV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioCommandReceiptV1 = (value, path = "receipt") => {
  if (!isRecord(value)) fail("invalid_receipt", path, `${path} must be an object`);
  const record = value as Record<string, unknown>;
  assertKeys(record, receiptKeys, path);
  if (record.receipt_version !== 1) fail("invalid_receipt", `${path}.receipt_version`, "Receipt version must be 1");
  for (const field of ["command_id", "idempotency_key", "committed_at"] as const) assertString(record[field], `${path}.${field}`);
  if (record.reason_code !== undefined && (
    typeof record.reason_code !== "string" || !safeReasonCodePattern.test(record.reason_code)
  )) fail("invalid_receipt", `${path}.reason_code`, "Receipt reason_code must be a safe machine token");
  if (typeof record.status !== "string" || !receiptStatuses.has(record.status)) fail("invalid_receipt", `${path}.status`, "Receipt status is invalid");
  assertNonNegativeInteger(record.owner_version, `${path}.owner_version`);
  if (Number.isNaN(Date.parse(record.committed_at as string))) fail("invalid_receipt", `${path}.committed_at`, "Receipt committed_at must be an ISO date-time");
  assertCanonicalRefV1(record.workflow_step_ref, `${path}.workflow_step_ref`);
  assertCanonicalRefV1(record.owner_execution_ref, `${path}.owner_execution_ref`);
  for (const field of ["result_refs", "generation_record_refs"] as const) {
    if (!Array.isArray(record[field])) fail("invalid_receipt", `${path}.${field}`, `${field} must be an array`);
    (record[field] as unknown[]).forEach((ref, index) => assertCanonicalRefV1(ref, `${path}.${field}.${index}`));
  }
};

export const assertScenarioEventEnvelopeV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioEventEnvelopeV1 = (value, path = "event") => {
  if (!isRecord(value)) fail("invalid_event", path, `${path} must be an object`);
  const record = value as Record<string, unknown>;
  assertKeys(record, eventKeys, path);
  if (record.envelope_version !== 1) fail("invalid_event", `${path}.envelope_version`, "Event envelope_version must be 1");
  for (const field of ["event_id", "event_type", "purpose", "correlation_id", "occurred_at"] as const) assertString(record[field], `${path}.${field}`);
  if (!Number.isInteger(record.event_schema_version) || Number(record.event_schema_version) < 1) fail("invalid_event", `${path}.event_schema_version`, "event_schema_version must be a positive integer");
  assertOptionalString(record.trace_id, `${path}.trace_id`);
  if (Number.isNaN(Date.parse(record.occurred_at as string))) fail("invalid_event", `${path}.occurred_at`, "Event occurred_at must be an ISO date-time");
  assertScenarioContractReleaseRefV1(record.scenario_release, `${path}.scenario_release`);
  assertCanonicalRefV1(record.owner_event_ref, `${path}.owner_event_ref`);
  if (record.actor_ref !== undefined) assertCanonicalRefV1(record.actor_ref, `${path}.actor_ref`);
  if (!Array.isArray(record.subject_refs)) fail("invalid_event", `${path}.subject_refs`, "subject_refs must be an array");
  (record.subject_refs as unknown[]).forEach((ref, index) => assertCanonicalRefV1(ref, `${path}.subject_refs.${index}`));
};
