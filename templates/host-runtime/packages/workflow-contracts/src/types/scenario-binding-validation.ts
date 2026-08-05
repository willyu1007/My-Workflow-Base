import { assertCanonicalRef } from "./federation-validation.js";
import {
  scenarioOwnerBindingReservationDispositions,
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
const reservationDispositions = new Set<string>(scenarioOwnerBindingReservationDispositions);
const machineKeyPattern = /^[a-z][a-z0-9._:-]{0,127}$/u;
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
