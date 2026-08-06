import { assertScenarioDomainActionContractV1 } from "./scenario-domain-action-validation.js";
import type { ScenarioDomainActionContractV1 } from "./scenario-domain-action.js";
import {
  scenarioProtectedCarrierScopesV1,
  scenarioProtectedMaximumCarrierBytesV1,
  scenarioProtectedMaximumCharactersV1,
  scenarioProtectedMaximumPlainTextBytesV1,
  scenarioProtectedMediaTypeV1,
  scenarioProtectedMinimumCharactersV1,
  scenarioProtectedNormalizationV1,
  type ScenarioProtectedCarrierBindingV1,
  type ScenarioProtectedCarrierBindingVerificationV1,
  type ScenarioProtectedContentRefV1,
  type ScenarioProtectedInteractionContractV1,
  type ScenarioProtectedPlainTextCarrierV1,
} from "./scenario-protected-interaction.js";

export class ScenarioProtectedInteractionValidationError extends Error {
  constructor(readonly code: string, readonly path: string, message: string) {
    super(message);
    this.name = "ScenarioProtectedInteractionValidationError";
  }
}

const interactionContractKeys = new Set([
  "protected_interaction_contract_version",
  "scenario_key",
  "action_key",
  "protected_field_key",
  "content_kind",
  "prepare_operation_key",
  "read_operation_key",
  "content_profile",
]);
const contentProfileKeys = new Set([
  "media_type",
  "normalization",
  "min_characters",
  "max_characters",
  "attachments",
]);
const carrierKeys = new Set([
  "protected_carrier_version",
  "protected_field_key",
  "media_type",
  "plain_text",
  "attachment_refs",
]);
const carrierBindingKeys = new Set([
  "carrier_binding_version",
  "carrier_scope",
  "protected_field_key",
  "keyed_binding_hash",
]);
const carrierScopes = new Set<string>(scenarioProtectedCarrierScopesV1);
const machineKeyPattern = /^[a-z][a-z0-9._:-]{0,127}$/u;
const opaqueLocatorPattern = /^[A-Za-z0-9_-]{32,512}$/u;
const sha256Pattern = /^[a-f0-9]{64}$/u;
const htmlMarkupPattern = /<\/?[A-Za-z][^>]*>|<!--|-->/u;
const forbiddenControlKeyForms = new Set([
  "attachmentrefs",
  "body",
  "carrier",
  "ciphertext",
  "contentbytes",
  "kmskey",
  "kmskeyid",
  "plaintext",
  "protectedbody",
  "protectedcarrier",
  "wrappedkey",
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const fail: (code: string, path: string, message: string) => never = (
  code,
  path,
  message,
) => {
  throw new ScenarioProtectedInteractionValidationError(code, path, message);
};

const assertRecord = (value: unknown, path: string): Record<string, unknown> => {
  if (!isRecord(value)) fail("invalid_object", path, `${path} must be an object`);
  return value;
};

const assertKeys = (
  record: Record<string, unknown>,
  allowed: Set<string>,
  path: string,
): void => {
  const unknown = Object.keys(record).filter((key) => !allowed.has(key));
  if (unknown.length > 0) {
    fail("unknown_field", path, `${path} contains unknown fields: ${unknown.join(", ")}`);
  }
};

const assertMachineKey = (value: unknown, path: string): void => {
  if (typeof value !== "string" || !machineKeyPattern.test(value)) {
    fail("invalid_machine_key", path, `${path} must be a 1-128 character machine key`);
  }
};

const assertSha256 = (value: unknown, path: string): void => {
  if (typeof value !== "string" || !sha256Pattern.test(value)) {
    fail("invalid_hash", path, `${path} must be a lowercase SHA-256 hex digest`);
  }
};

const serializedUtf8Bytes = (value: unknown, path: string): number => {
  let serialized: string | undefined;
  try {
    serialized = JSON.stringify(value);
  } catch {
    fail("not_serializable", path, `${path} must be JSON serializable`);
  }
  if (serialized === undefined) {
    fail("not_serializable", path, `${path} must be JSON serializable`);
  }
  return Buffer.byteLength(serialized, "utf8");
};

const assertNormalizedPlainText = (value: unknown, path: string): void => {
  if (typeof value !== "string") {
    fail("invalid_plain_text", path, `${path} must be a string`);
  }
  if (value.includes("\r")) {
    fail("invalid_normalization", path, `${path} must not contain CR characters`);
  }
  if (value.includes("\0")) {
    fail("invalid_plain_text", path, `${path} must not contain NUL characters`);
  }
  if (value.trim() !== value) {
    fail("invalid_normalization", path, `${path} must already have outer whitespace trimmed`);
  }
  const characters = Array.from(value).length;
  if (
    characters < scenarioProtectedMinimumCharactersV1 ||
    characters > scenarioProtectedMaximumCharactersV1
  ) {
    fail(
      "invalid_plain_text_length",
      path,
      `${path} must contain 1 through 2000 Unicode code points`,
    );
  }
  if (Buffer.byteLength(value, "utf8") > scenarioProtectedMaximumPlainTextBytesV1) {
    fail("plain_text_too_large", path, `${path} must be at most 8 KiB UTF-8`);
  }
  if (htmlMarkupPattern.test(value)) {
    fail("rich_text_not_supported", path, `${path} must not contain HTML markup`);
  }
};

export const normalizeScenarioProtectedPlainTextV1 = (
  value: unknown,
  path = "plain_text",
): string => {
  if (typeof value !== "string") {
    fail("invalid_plain_text", path, `${path} must be a string`);
  }
  const normalizedLineEndings = value.replaceAll("\r\n", "\n");
  if (normalizedLineEndings.includes("\r")) {
    fail("invalid_normalization", path, `${path} contains a lone CR character`);
  }
  const normalized = normalizedLineEndings.trim();
  assertNormalizedPlainText(normalized, path);
  return normalized;
};

export const assertScenarioProtectedInteractionContractV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioProtectedInteractionContractV1 = (
  value,
  path = "protected_contract",
) => {
  const record = assertRecord(value, path);
  assertKeys(record, interactionContractKeys, path);
  if (record.protected_interaction_contract_version !== 1) {
    fail(
      "invalid_version",
      `${path}.protected_interaction_contract_version`,
      "protected_interaction_contract_version must be 1",
    );
  }
  for (const key of [
    "scenario_key",
    "action_key",
    "protected_field_key",
    "content_kind",
  ] as const) {
    assertMachineKey(record[key], `${path}.${key}`);
  }
  if (record.prepare_operation_key !== "prepare_domain_action") {
    fail(
      "invalid_prepare_operation",
      `${path}.prepare_operation_key`,
      "prepare_operation_key must be prepare_domain_action",
    );
  }
  if (record.read_operation_key !== "read_protected_detail") {
    fail(
      "invalid_read_operation",
      `${path}.read_operation_key`,
      "read_operation_key must be read_protected_detail",
    );
  }
  const profile = assertRecord(record.content_profile, `${path}.content_profile`);
  assertKeys(profile, contentProfileKeys, `${path}.content_profile`);
  if (
    profile.media_type !== scenarioProtectedMediaTypeV1 ||
    profile.normalization !== scenarioProtectedNormalizationV1 ||
    profile.min_characters !== scenarioProtectedMinimumCharactersV1 ||
    profile.max_characters !== scenarioProtectedMaximumCharactersV1 ||
    profile.attachments !== "none"
  ) {
    fail(
      "invalid_content_profile",
      `${path}.content_profile`,
      `${path}.content_profile must be the closed protected plaintext profile`,
    );
  }
};

export const assertScenarioProtectedContentRefV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioProtectedContentRefV1 = (
  value,
  path = "protected_content_ref",
) => {
  if (typeof value !== "string" || !opaqueLocatorPattern.test(value)) {
    fail(
      "invalid_content_ref",
      path,
      `${path} must be a 32-512 character opaque base64url reference`,
    );
  }
};

export const assertScenarioProtectedPlainTextCarrierV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioProtectedPlainTextCarrierV1 = (
  value,
  path = "protected_carrier",
) => {
  const record = assertRecord(value, path);
  assertKeys(record, carrierKeys, path);
  if (record.protected_carrier_version !== 1) {
    fail(
      "invalid_version",
      `${path}.protected_carrier_version`,
      "protected_carrier_version must be 1",
    );
  }
  assertMachineKey(record.protected_field_key, `${path}.protected_field_key`);
  if (record.media_type !== scenarioProtectedMediaTypeV1) {
    fail(
      "invalid_media_type",
      `${path}.media_type`,
      `${path}.media_type must be ${scenarioProtectedMediaTypeV1}`,
    );
  }
  assertNormalizedPlainText(record.plain_text, `${path}.plain_text`);
  if (!Array.isArray(record.attachment_refs) || record.attachment_refs.length !== 0) {
    fail(
      "attachments_not_supported",
      `${path}.attachment_refs`,
      `${path}.attachment_refs must be an empty array`,
    );
  }
  if (serializedUtf8Bytes(record, path) > scenarioProtectedMaximumCarrierBytesV1) {
    fail("carrier_too_large", path, `${path} must be at most 12 KiB UTF-8`);
  }
};

export const assertScenarioProtectedCarrierBindingV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioProtectedCarrierBindingV1 = (
  value,
  path = "carrier_binding",
) => {
  const record = assertRecord(value, path);
  assertKeys(record, carrierBindingKeys, path);
  if (record.carrier_binding_version !== 1) {
    fail(
      "invalid_version",
      `${path}.carrier_binding_version`,
      "carrier_binding_version must be 1",
    );
  }
  if (typeof record.carrier_scope !== "string" || !carrierScopes.has(record.carrier_scope)) {
    fail(
      "invalid_carrier_scope",
      `${path}.carrier_scope`,
      `${path}.carrier_scope must be prepare_input or read_output`,
    );
  }
  assertMachineKey(record.protected_field_key, `${path}.protected_field_key`);
  assertSha256(record.keyed_binding_hash, `${path}.keyed_binding_hash`);
};

export const assertScenarioProtectedActionContractPairV1 = (
  protectedContract: unknown,
  actionContract: unknown,
): void => {
  assertScenarioProtectedInteractionContractV1(protectedContract);
  assertScenarioDomainActionContractV1(actionContract);
  const typedActionContract: ScenarioDomainActionContractV1 = actionContract;
  if (protectedContract.scenario_key !== typedActionContract.scenario_key) {
    fail(
      "scenario_mismatch",
      "protected_contract.scenario_key",
      "protected and domain-action contracts must name the same scenario",
    );
  }
  if (protectedContract.action_key !== typedActionContract.action_key) {
    fail(
      "action_mismatch",
      "protected_contract.action_key",
      "protected and domain-action contracts must name the same action",
    );
  }
};

export const assertScenarioProtectedPlainTextCarrierForContractV1 = (
  protectedContract: unknown,
  carrier: unknown,
): void => {
  assertScenarioProtectedInteractionContractV1(protectedContract);
  assertScenarioProtectedPlainTextCarrierV1(carrier);
  if (carrier.protected_field_key !== protectedContract.protected_field_key) {
    fail(
      "protected_field_mismatch",
      "protected_carrier.protected_field_key",
      "carrier protected_field_key must match the static contract",
    );
  }
};

export const assertScenarioProtectedCarrierBindingVerificationV1 = (
  binding: unknown,
  verification: ScenarioProtectedCarrierBindingVerificationV1,
): void => {
  assertScenarioProtectedCarrierBindingV1(binding);
  if (
    verification.carrier_scope !== "prepare_input" &&
    verification.carrier_scope !== "read_output"
  ) {
    fail(
      "invalid_verified_scope",
      "binding_verification.carrier_scope",
      "verified carrier_scope is invalid",
    );
  }
  assertMachineKey(
    verification.protected_field_key,
    "binding_verification.protected_field_key",
  );
  assertSha256(
    verification.verified_keyed_binding_hash,
    "binding_verification.verified_keyed_binding_hash",
  );
  if (binding.carrier_scope !== verification.carrier_scope) {
    fail(
      "carrier_scope_mismatch",
      "carrier_binding.carrier_scope",
      "carrier scope must match independently verified context",
    );
  }
  if (binding.protected_field_key !== verification.protected_field_key) {
    fail(
      "protected_field_mismatch",
      "carrier_binding.protected_field_key",
      "protected field must match independently verified context",
    );
  }
  if (binding.keyed_binding_hash !== verification.verified_keyed_binding_hash) {
    fail(
      "binding_hash_mismatch",
      "carrier_binding.keyed_binding_hash",
      "keyed binding hash must match independently verified evidence",
    );
  }
};

const normalizedControlKey = (key: string): string =>
  key.toLowerCase().replaceAll(/[^a-z0-9]/gu, "");

const isForbiddenControlKey = (key: string): boolean => {
  const normalized = normalizedControlKey(key);
  return (
    forbiddenControlKeyForms.has(normalized) ||
    [
      "attachmentrefs",
      "ciphertext",
      "contentbytes",
      "kmskey",
      "plaintext",
      "protectedbody",
      "protectedcarrier",
      "wrappedkey",
    ].some((prefix) => normalized.startsWith(prefix))
  );
};

const assertBodyFreeString = (
  value: string,
  plainText: string,
  path: string,
): void => {
  const escapedPlainText = JSON.stringify(plainText).slice(1, -1);
  const base64PlainText = Buffer.from(plainText, "utf8").toString("base64");
  const base64UrlPlainText = Buffer.from(plainText, "utf8").toString("base64url");
  const candidateValues = new Set([
    value,
    value.replaceAll("\r\n", "\n").trim(),
    value.replaceAll("\\r\\n", "\\n"),
  ]);
  for (const candidate of candidateValues) {
    if (
      candidate.includes(plainText) ||
      candidate.includes(escapedPlainText) ||
      candidate.includes(base64PlainText) ||
      candidate.includes(base64UrlPlainText)
    ) {
      fail("protected_copy", path, `${path} contains protected carrier content`);
    }
    if (Array.from(candidate).length >= 16 && plainText.includes(candidate)) {
      fail("protected_fragment", path, `${path} contains a protected carrier fragment`);
    }
  }
};

const assertBodyFreeValue = (
  value: unknown,
  plainText: string,
  path: string,
  ancestors: Set<object>,
): void => {
  if (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "number"
  ) {
    return;
  }
  if (typeof value === "string") {
    assertBodyFreeString(value, plainText, path);
    return;
  }
  if (typeof value !== "object") {
    fail("invalid_control_value", path, `${path} must be JSON serializable`);
  }
  if (ancestors.has(value)) {
    fail("cyclic_control_value", path, `${path} must not contain cycles`);
  }
  ancestors.add(value);
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertBodyFreeValue(item, plainText, `${path}.${index}`, ancestors),
    );
  } else {
    for (const [key, item] of Object.entries(value)) {
      if (isForbiddenControlKey(key)) {
        fail("protected_body_field", `${path}.${key}`, `${path}.${key} is not a control field`);
      }
      assertBodyFreeValue(item, plainText, `${path}.${key}`, ancestors);
    }
  }
  ancestors.delete(value);
};

export const assertScenarioProtectedBodyFreeControlV1 = (
  value: unknown,
  carrier: unknown,
  path = "control",
): void => {
  assertScenarioProtectedPlainTextCarrierV1(carrier);
  assertBodyFreeValue(value, carrier.plain_text, path, new Set());
  serializedUtf8Bytes(value, path);
};
