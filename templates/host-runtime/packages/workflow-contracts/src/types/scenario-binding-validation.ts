import { assertCanonicalRef } from "./federation-validation.js";
import {
  scenarioCanonicalBindingEffects,
  scenarioCanonicalBindingPairDispositions,
  scenarioOwnerBindingReservationDispositions,
  type ScenarioCanonicalBindingExpectedHeadV1,
  type ScenarioCanonicalBindingIntentV1,
  type ScenarioCanonicalBindingPairRequestV1,
  type ScenarioCanonicalBindingPairResultV1,
  type ScenarioCanonicalBindingResultItemV1,
  type ScenarioOwnerBindingRefV1,
  type ScenarioOwnerBindingReservationRequestV1,
  type ScenarioOwnerBindingReservationResultV1,
} from "./scenario-binding.js";

export class ScenarioBindingValidationError extends Error {
  constructor(readonly code: string, readonly path: string, message: string) {
    super(message);
    this.name = "ScenarioBindingValidationError";
  }
}

const ownerBindingRefKeys = new Set([
  "owner_binding_ref_version",
  "binding_slot",
  "owner_ref",
]);
const reservationRequestKeys = new Set([
  "reservation_request_version",
  "identity_operation_id",
  "binding_slot",
  "canonical_object_evidence_hash",
  "canonical_request_hash",
]);
const reservationResultKeys = new Set([
  "reservation_result_version",
  "identity_operation_id",
  "disposition",
  "owner_binding",
  "reservation_version",
  "reservation_evidence_hash",
]);
const absentExpectedHeadKeys = new Set(["state"]);
const boundExpectedHeadKeys = new Set([
  "state",
  "binding_ref",
  "binding_version",
  "owner_ref",
]);
const bindingIntentKeys = new Set([
  "binding_intent_version",
  "binding_slot",
  "canonical_object_ref",
  "scenario_owner_ref",
  "expected_head",
]);
const pairRequestKeys = new Set([
  "pair_request_version",
  "identity_operation_id",
  "workspace_ref",
  "scenario_key",
  "principal_provenance_hash",
  "continuation_context_hash",
  "pair_relation_evidence_hash",
  "canonical_input_hash",
  "bindings",
]);
const bindingResultItemKeys = new Set([
  "binding_result_version",
  "binding_slot",
  "canonical_object_ref",
  "scenario_owner_ref",
  "binding_ref",
  "binding_version",
  "effect",
]);
const pairResultKeys = new Set([
  "pair_result_version",
  "identity_operation_id",
  "canonical_input_hash",
  "disposition",
  "bindings",
  "pair_commit_evidence_hash",
]);
const reservationDispositions = new Set<string>(scenarioOwnerBindingReservationDispositions);
const bindingEffects = new Set<string>(scenarioCanonicalBindingEffects);
const pairDispositions = new Set<string>(scenarioCanonicalBindingPairDispositions);
const machineKeyPattern = /^[a-z][a-z0-9._:-]{0,127}$/u;
const scenarioKeyPattern = /^[a-z][a-z0-9-]{0,63}$/u;
const opaqueIdPattern = /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,199}$/u;
const sha256Pattern = /^[a-f0-9]{64}$/u;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const fail: (code: string, path: string, message: string) => never = (code, path, message) => {
  throw new ScenarioBindingValidationError(code, path, message);
};

const assertRecord = (value: unknown, path: string): Record<string, unknown> => {
  if (!isRecord(value)) fail("invalid_object", path, `${path} must be an object`);
  return value;
};

const assertKeys = (record: Record<string, unknown>, allowed: Set<string>, path: string) => {
  const unknown = Object.keys(record).filter((key) => !allowed.has(key));
  if (unknown.length > 0) {
    fail("unknown_field", path, `${path} contains unknown fields: ${unknown.join(", ")}`);
  }
};

const assertVersion = (value: unknown, expected: number, path: string) => {
  if (value !== expected) fail("invalid_version", path, `${path} must be ${expected}`);
};

const assertMachineKey = (value: unknown, path: string) => {
  if (typeof value !== "string" || !machineKeyPattern.test(value)) {
    fail("invalid_machine_key", path, `${path} must be a bounded lowercase machine key`);
  }
};

const assertOpaqueId = (value: unknown, path: string) => {
  if (typeof value !== "string" || !opaqueIdPattern.test(value)) {
    fail("invalid_opaque_id", path, `${path} must be a bounded opaque identifier`);
  }
};

const assertSha256 = (value: unknown, path: string) => {
  if (typeof value !== "string" || !sha256Pattern.test(value)) {
    fail("invalid_sha256", path, `${path} must be lowercase SHA-256`);
  }
};

const assertNonNegativeInteger = (value: unknown, path: string) => {
  if (!Number.isInteger(value) || Number(value) < 0) {
    fail("invalid_integer", path, `${path} must be a non-negative integer`);
  }
};

const canonicalRefEquals = (
  left: ScenarioCanonicalBindingIntentV1["canonical_object_ref"],
  right: ScenarioCanonicalBindingIntentV1["canonical_object_ref"],
): boolean =>
  left.schema_version === right.schema_version &&
  left.namespace === right.namespace &&
  left.object_type === right.object_type &&
  left.object_id === right.object_id &&
  left.version === right.version;

function assertExactOrderedPair<T extends { binding_slot: string }>(
  value: unknown,
  assertItem: (item: unknown, path: string) => asserts item is T,
  path: string,
): asserts value is [T, T] {
  if (!Array.isArray(value) || value.length !== 2) {
    fail("invalid_pair", path, `${path} must contain exactly two bindings`);
  }
  assertItem(value[0], `${path}.0`);
  assertItem(value[1], `${path}.1`);
  if (value[0].binding_slot === value[1].binding_slot) {
    fail("duplicate_binding_slot", path, `${path} binding slots must be distinct`);
  }
  if (value[0].binding_slot > value[1].binding_slot) {
    fail("unsorted_binding_slots", path, `${path} must be sorted by binding_slot`);
  }
}

export const assertScenarioOwnerBindingRefV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioOwnerBindingRefV1 = (value, path = "owner_binding") => {
  const record = assertRecord(value, path);
  assertKeys(record, ownerBindingRefKeys, path);
  assertVersion(record.owner_binding_ref_version, 1, `${path}.owner_binding_ref_version`);
  assertMachineKey(record.binding_slot, `${path}.binding_slot`);
  assertCanonicalRef(record.owner_ref, `${path}.owner_ref`);
};

export const assertScenarioOwnerBindingReservationRequestV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioOwnerBindingReservationRequestV1 = (
  value,
  path = "reservation_request",
) => {
  const record = assertRecord(value, path);
  assertKeys(record, reservationRequestKeys, path);
  assertVersion(record.reservation_request_version, 1, `${path}.reservation_request_version`);
  assertOpaqueId(record.identity_operation_id, `${path}.identity_operation_id`);
  assertMachineKey(record.binding_slot, `${path}.binding_slot`);
  assertSha256(record.canonical_object_evidence_hash, `${path}.canonical_object_evidence_hash`);
  assertSha256(record.canonical_request_hash, `${path}.canonical_request_hash`);
};

export const assertScenarioOwnerBindingReservationResultV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioOwnerBindingReservationResultV1 = (
  value,
  path = "reservation_result",
) => {
  const record = assertRecord(value, path);
  assertKeys(record, reservationResultKeys, path);
  assertVersion(record.reservation_result_version, 1, `${path}.reservation_result_version`);
  assertOpaqueId(record.identity_operation_id, `${path}.identity_operation_id`);
  if (typeof record.disposition !== "string" || !reservationDispositions.has(record.disposition)) {
    fail("invalid_disposition", `${path}.disposition`, `${path}.disposition is invalid`);
  }
  assertScenarioOwnerBindingRefV1(record.owner_binding, `${path}.owner_binding`);
  assertNonNegativeInteger(record.reservation_version, `${path}.reservation_version`);
  assertSha256(record.reservation_evidence_hash, `${path}.reservation_evidence_hash`);
};

/**
 * Structural exchange parity only. Reservation replay and conflict detection
 * remain owner-runtime responsibilities.
 */
export const assertScenarioOwnerBindingReservationExchangeV1 = (
  request: unknown,
  result: unknown,
): void => {
  assertScenarioOwnerBindingReservationRequestV1(request);
  assertScenarioOwnerBindingReservationResultV1(result);
  if (request.identity_operation_id !== result.identity_operation_id) {
    fail(
      "identity_operation_mismatch",
      "reservation_result.identity_operation_id",
      "reservation request and result must have the same identity_operation_id",
    );
  }
  if (request.binding_slot !== result.owner_binding.binding_slot) {
    fail(
      "binding_slot_mismatch",
      "reservation_result.owner_binding.binding_slot",
      "reservation request and result must have the same binding_slot",
    );
  }
};

export const assertScenarioCanonicalBindingExpectedHeadV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioCanonicalBindingExpectedHeadV1 = (
  value,
  path = "expected_head",
) => {
  const record = assertRecord(value, path);
  if (record.state === "absent") {
    assertKeys(record, absentExpectedHeadKeys, path);
    return;
  }
  if (record.state !== "bound") {
    fail("invalid_expected_head", `${path}.state`, `${path}.state must be absent or bound`);
  }
  assertKeys(record, boundExpectedHeadKeys, path);
  assertCanonicalRef(record.binding_ref, `${path}.binding_ref`);
  assertNonNegativeInteger(record.binding_version, `${path}.binding_version`);
  assertCanonicalRef(record.owner_ref, `${path}.owner_ref`);
};

export const assertScenarioCanonicalBindingIntentV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioCanonicalBindingIntentV1 = (value, path = "binding_intent") => {
  const record = assertRecord(value, path);
  assertKeys(record, bindingIntentKeys, path);
  assertVersion(record.binding_intent_version, 1, `${path}.binding_intent_version`);
  assertMachineKey(record.binding_slot, `${path}.binding_slot`);
  assertCanonicalRef(record.canonical_object_ref, `${path}.canonical_object_ref`);
  assertCanonicalRef(record.scenario_owner_ref, `${path}.scenario_owner_ref`);
  assertScenarioCanonicalBindingExpectedHeadV1(record.expected_head, `${path}.expected_head`);
  if (
    record.expected_head.state === "bound" &&
    !canonicalRefEquals(record.expected_head.owner_ref, record.scenario_owner_ref)
  ) {
    fail(
      "expected_owner_mismatch",
      `${path}.expected_head.owner_ref`,
      "bound expected head owner_ref must match scenario_owner_ref",
    );
  }
};

export const assertScenarioCanonicalBindingPairRequestV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioCanonicalBindingPairRequestV1 = (
  value,
  path = "binding_pair_request",
) => {
  const record = assertRecord(value, path);
  assertKeys(record, pairRequestKeys, path);
  assertVersion(record.pair_request_version, 1, `${path}.pair_request_version`);
  assertOpaqueId(record.identity_operation_id, `${path}.identity_operation_id`);
  assertCanonicalRef(record.workspace_ref, `${path}.workspace_ref`);
  if (typeof record.scenario_key !== "string" || !scenarioKeyPattern.test(record.scenario_key)) {
    fail("invalid_scenario_key", `${path}.scenario_key`, `${path}.scenario_key is invalid`);
  }
  for (const field of [
    "principal_provenance_hash",
    "continuation_context_hash",
    "pair_relation_evidence_hash",
    "canonical_input_hash",
  ] as const) {
    assertSha256(record[field], `${path}.${field}`);
  }
  assertExactOrderedPair(
    record.bindings,
    assertScenarioCanonicalBindingIntentV1,
    `${path}.bindings`,
  );
};

export const assertScenarioCanonicalBindingResultItemV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioCanonicalBindingResultItemV1 = (
  value,
  path = "binding_result",
) => {
  const record = assertRecord(value, path);
  assertKeys(record, bindingResultItemKeys, path);
  assertVersion(record.binding_result_version, 1, `${path}.binding_result_version`);
  assertMachineKey(record.binding_slot, `${path}.binding_slot`);
  assertCanonicalRef(record.canonical_object_ref, `${path}.canonical_object_ref`);
  assertCanonicalRef(record.scenario_owner_ref, `${path}.scenario_owner_ref`);
  assertCanonicalRef(record.binding_ref, `${path}.binding_ref`);
  assertNonNegativeInteger(record.binding_version, `${path}.binding_version`);
  if (typeof record.effect !== "string" || !bindingEffects.has(record.effect)) {
    fail("invalid_binding_effect", `${path}.effect`, `${path}.effect is invalid`);
  }
};

export const assertScenarioCanonicalBindingPairResultV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioCanonicalBindingPairResultV1 = (
  value,
  path = "binding_pair_result",
) => {
  const record = assertRecord(value, path);
  assertKeys(record, pairResultKeys, path);
  assertVersion(record.pair_result_version, 1, `${path}.pair_result_version`);
  assertOpaqueId(record.identity_operation_id, `${path}.identity_operation_id`);
  assertSha256(record.canonical_input_hash, `${path}.canonical_input_hash`);
  if (typeof record.disposition !== "string" || !pairDispositions.has(record.disposition)) {
    fail("invalid_pair_disposition", `${path}.disposition`, `${path}.disposition is invalid`);
  }
  assertExactOrderedPair(
    record.bindings,
    assertScenarioCanonicalBindingResultItemV1,
    `${path}.bindings`,
  );
  assertSha256(record.pair_commit_evidence_hash, `${path}.pair_commit_evidence_hash`);
};

/** Structural request/result parity only; transaction and replay are Host responsibilities. */
export const assertScenarioCanonicalBindingPairExchangeV1 = (
  request: unknown,
  result: unknown,
): void => {
  assertScenarioCanonicalBindingPairRequestV1(request);
  assertScenarioCanonicalBindingPairResultV1(result);
  if (request.identity_operation_id !== result.identity_operation_id) {
    fail(
      "identity_operation_mismatch",
      "binding_pair_result.identity_operation_id",
      "binding pair request and result must have the same identity_operation_id",
    );
  }
  if (request.canonical_input_hash !== result.canonical_input_hash) {
    fail(
      "canonical_input_mismatch",
      "binding_pair_result.canonical_input_hash",
      "binding pair request and result must have the same canonical_input_hash",
    );
  }

  request.bindings.forEach((intent, index) => {
    const item = result.bindings[index];
    const path = `binding_pair_result.bindings.${index}`;
    if (intent.binding_slot !== item.binding_slot) {
      fail("binding_slot_mismatch", `${path}.binding_slot`, "binding slots must match the request");
    }
    if (!canonicalRefEquals(intent.canonical_object_ref, item.canonical_object_ref)) {
      fail(
        "canonical_object_mismatch",
        `${path}.canonical_object_ref`,
        "canonical object refs must match the request",
      );
    }
    if (!canonicalRefEquals(intent.scenario_owner_ref, item.scenario_owner_ref)) {
      fail(
        "scenario_owner_mismatch",
        `${path}.scenario_owner_ref`,
        "scenario owner refs must match the request",
      );
    }
    if (intent.expected_head.state === "absent") {
      if (item.effect !== "created") {
        fail("binding_effect_mismatch", `${path}.effect`, "absent expected head must create the binding");
      }
      return;
    }
    if (item.effect !== "reused") {
      fail("binding_effect_mismatch", `${path}.effect`, "bound expected head must reuse the binding");
    }
    if (!canonicalRefEquals(intent.expected_head.binding_ref, item.binding_ref)) {
      fail(
        "binding_ref_mismatch",
        `${path}.binding_ref`,
        "reused binding_ref must match the bound expected head",
      );
    }
    if (intent.expected_head.binding_version !== item.binding_version) {
      fail(
        "binding_version_mismatch",
        `${path}.binding_version`,
        "reused binding_version must match the bound expected head",
      );
    }
  });
};
