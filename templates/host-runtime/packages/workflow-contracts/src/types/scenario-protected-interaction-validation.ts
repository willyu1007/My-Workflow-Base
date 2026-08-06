import {
  assertPrepareScenarioDomainActionExchangeV1,
  assertPrepareScenarioDomainActionInputV1,
  assertPrepareScenarioDomainActionResultV1,
  assertScenarioDomainActionContractV1,
  assertScenarioDomainActionExecutionBindingV1,
  assertScenarioDomainActionExecutionResultForBindingV1,
  assertScenarioDomainActionExecutionResultV1,
  assertSubmitScenarioDomainActionContextV1,
  assertSubmitScenarioDomainActionInputV1,
} from "./scenario-domain-action-validation.js";
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
  type PrepareScenarioProtectedInteractionInputV1,
  type PrepareScenarioProtectedInteractionResultV1,
  type ScenarioPreparedProtectedContentControlV1,
  type ScenarioPreparedProtectedContentVerificationV1,
  type ScenarioCommittedProtectedContentControlV1,
  type ScenarioProtectedContentCommitVerificationV1,
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
const protectedPrepareInputKeys = new Set([
  "protected_prepare_version",
  "action_prepare",
  "carrier_binding",
]);
const preparedContentControlKeys = new Set([
  "protected_content_control_version",
  "state",
  "protected_content_ref",
  "protected_content_version",
  "content_kind",
  "keyed_integrity_hash",
  "issued_at",
  "expires_at",
]);
const committedContentControlKeys = new Set([
  "protected_content_control_version",
  "state",
  "protected_content_ref",
  "prepared_content_version",
  "committed_content_version",
  "content_kind",
  "keyed_integrity_hash",
  "committed_at",
]);
const protectedPrepareSuccessKeys = new Set([
  "protected_prepare_result_version",
  "status",
  "action_result",
  "prepared_content",
]);
const protectedPrepareFailureKeys = new Set([
  "protected_prepare_result_version",
  "status",
  "action_result",
]);
const carrierScopes = new Set<string>(scenarioProtectedCarrierScopesV1);
const machineKeyPattern = /^[a-z][a-z0-9._:-]{0,127}$/u;
const opaqueLocatorPattern = /^[A-Za-z0-9_-]{32,512}$/u;
const opaqueVersionPattern = /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,199}$/u;
const sha256Pattern = /^[a-f0-9]{64}$/u;
const canonicalInstantPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;
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
const maximumProtectedPrepareLifetimeMs = 5 * 60 * 1000;
const maximumProtectedControlBytesV1 = 8 * 1024;

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

const assertOpaqueVersion = (value: unknown, path: string): void => {
  if (typeof value !== "string" || !opaqueVersionPattern.test(value)) {
    fail(
      "invalid_opaque_version",
      path,
      `${path} must be a 1-200 character opaque version`,
    );
  }
};

const assertCanonicalInstant = (value: unknown, path: string): number => {
  if (typeof value !== "string" || !canonicalInstantPattern.test(value)) {
    fail("invalid_instant", path, `${path} must be a canonical UTC instant`);
  }
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== value) {
    fail("invalid_instant", path, `${path} must be a real canonical UTC instant`);
  }
  return parsed;
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

const protectedActionInputForbiddenKeyForms = [
  "attachmentrefs",
  "body",
  "carrier",
  "ciphertext",
  "clientcontentkind",
  "contentbytes",
  "encryptionkey",
  "keyid",
  "kmskey",
  "nonce",
  "plaintext",
  "protectedbody",
  "protectedcarrier",
  "protectedcontentref",
  "wrappedkey",
];

const assertProtectedActionInputShape = (
  value: unknown,
  path: string,
  ancestors: Set<object>,
): void => {
  if (value === null || typeof value !== "object") return;
  if (ancestors.has(value)) {
    fail("cyclic_action_input", path, `${path} must not contain cycles`);
  }
  ancestors.add(value);
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertProtectedActionInputShape(item, `${path}.${index}`, ancestors),
    );
  } else {
    for (const [key, item] of Object.entries(value)) {
      const normalized = normalizedControlKey(key);
      if (
        protectedActionInputForbiddenKeyForms.some(
          (forbidden) => normalized === forbidden || normalized.startsWith(forbidden),
        )
      ) {
        fail(
          "protected_action_input_field",
          `${path}.${key}`,
          `${path}.${key} is not allowed in the body-free protected action input`,
        );
      }
      assertProtectedActionInputShape(item, `${path}.${key}`, ancestors);
    }
  }
  ancestors.delete(value);
};

export const assertPrepareScenarioProtectedInteractionInputV1: (
  value: unknown,
  path?: string,
) => asserts value is PrepareScenarioProtectedInteractionInputV1 = (
  value,
  path = "protected_prepare_input",
) => {
  const record = assertRecord(value, path);
  assertKeys(record, protectedPrepareInputKeys, path);
  if (record.protected_prepare_version !== 1) {
    fail(
      "invalid_version",
      `${path}.protected_prepare_version`,
      "protected_prepare_version must be 1",
    );
  }
  assertPrepareScenarioDomainActionInputV1(
    record.action_prepare,
    `${path}.action_prepare`,
  );
  assertProtectedActionInputShape(
    record.action_prepare.action_input,
    `${path}.action_prepare.action_input`,
    new Set(),
  );
  assertScenarioProtectedCarrierBindingV1(
    record.carrier_binding,
    `${path}.carrier_binding`,
  );
  if (record.carrier_binding.carrier_scope !== "prepare_input") {
    fail(
      "invalid_carrier_scope",
      `${path}.carrier_binding.carrier_scope`,
      "protected prepare requires prepare_input carrier scope",
    );
  }
  if (serializedUtf8Bytes(record, path) > maximumProtectedControlBytesV1) {
    fail("control_too_large", path, `${path} must be at most 8 KiB UTF-8`);
  }
};

export const assertScenarioPreparedProtectedContentControlV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioPreparedProtectedContentControlV1 = (
  value,
  path = "prepared_content",
) => {
  const record = assertRecord(value, path);
  assertKeys(record, preparedContentControlKeys, path);
  if (record.protected_content_control_version !== 1 || record.state !== "prepared") {
    fail("invalid_prepared_control", path, `${path} must be a v1 prepared control`);
  }
  assertScenarioProtectedContentRefV1(
    record.protected_content_ref,
    `${path}.protected_content_ref`,
  );
  assertOpaqueVersion(record.protected_content_version, `${path}.protected_content_version`);
  assertMachineKey(record.content_kind, `${path}.content_kind`);
  assertSha256(record.keyed_integrity_hash, `${path}.keyed_integrity_hash`);
  const issuedAt = assertCanonicalInstant(record.issued_at, `${path}.issued_at`);
  const expiresAt = assertCanonicalInstant(record.expires_at, `${path}.expires_at`);
  if (
    expiresAt <= issuedAt ||
    expiresAt - issuedAt > maximumProtectedPrepareLifetimeMs
  ) {
    fail(
      "invalid_lifetime",
      `${path}.expires_at`,
      "prepared protected content lifetime must be greater than zero and at most five minutes",
    );
  }
  if (serializedUtf8Bytes(record, path) > maximumProtectedControlBytesV1) {
    fail("control_too_large", path, `${path} must be at most 8 KiB UTF-8`);
  }
};

export const assertPrepareScenarioProtectedInteractionResultV1: (
  value: unknown,
  path?: string,
) => asserts value is PrepareScenarioProtectedInteractionResultV1 = (
  value,
  path = "protected_prepare_result",
) => {
  const record = assertRecord(value, path);
  if (record.protected_prepare_result_version !== 1) {
    fail(
      "invalid_version",
      `${path}.protected_prepare_result_version`,
      "protected_prepare_result_version must be 1",
    );
  }
  if (record.status === "prepared") {
    assertKeys(record, protectedPrepareSuccessKeys, path);
    assertPrepareScenarioDomainActionResultV1(
      record.action_result,
      `${path}.action_result`,
    );
    if (record.action_result.status !== "prepared") {
      fail(
        "mixed_result_branch",
        `${path}.action_result.status`,
        "prepared protected result requires prepared action result",
      );
    }
    assertScenarioPreparedProtectedContentControlV1(
      record.prepared_content,
      `${path}.prepared_content`,
    );
  } else if (record.status === "context_changed" || record.status === "unavailable") {
    assertKeys(record, protectedPrepareFailureKeys, path);
    assertPrepareScenarioDomainActionResultV1(
      record.action_result,
      `${path}.action_result`,
    );
    if (record.action_result.status !== record.status) {
      fail(
        "mixed_result_branch",
        `${path}.action_result.status`,
        "protected and action result statuses must match",
      );
    }
  } else {
    fail("invalid_status", `${path}.status`, `${path}.status is invalid`);
  }
  if (serializedUtf8Bytes(record, path) > maximumProtectedControlBytesV1) {
    fail("control_too_large", path, `${path} must be at most 8 KiB UTF-8`);
  }
};

export const assertPrepareScenarioProtectedInteractionExchangeV1 = (
  protectedContract: unknown,
  actionContract: unknown,
  input: unknown,
  result: unknown,
  carrier: unknown,
  context: {
    carrier_binding_verification: ScenarioProtectedCarrierBindingVerificationV1;
    action_prepare_context: Parameters<
      typeof assertPrepareScenarioDomainActionExchangeV1
    >[3];
    prepared_content_verification?: ScenarioPreparedProtectedContentVerificationV1;
  },
): void => {
  assertScenarioProtectedActionContractPairV1(protectedContract, actionContract);
  assertScenarioProtectedInteractionContractV1(protectedContract);
  assertPrepareScenarioProtectedInteractionInputV1(input);
  assertPrepareScenarioProtectedInteractionResultV1(result);
  assertScenarioProtectedPlainTextCarrierForContractV1(protectedContract, carrier);
  assertScenarioProtectedCarrierBindingVerificationV1(
    input.carrier_binding,
    context.carrier_binding_verification,
  );
  if (input.carrier_binding.protected_field_key !== protectedContract.protected_field_key) {
    fail(
      "protected_field_mismatch",
      "protected_prepare_input.carrier_binding.protected_field_key",
      "carrier binding field must match the static contract",
    );
  }
  assertScenarioProtectedBodyFreeControlV1(input, carrier, "protected_prepare_input");
  assertScenarioProtectedBodyFreeControlV1(result, carrier, "protected_prepare_result");
  assertPrepareScenarioDomainActionExchangeV1(
    actionContract,
    input.action_prepare,
    result.action_result,
    context.action_prepare_context,
  );
  if (result.status !== "prepared") {
    if (context.prepared_content_verification !== undefined) {
      fail(
        "unexpected_prepared_verification",
        "context.prepared_content_verification",
        "failed prepare must not have prepared content verification",
      );
    }
    return;
  }
  const verification = context.prepared_content_verification;
  if (verification === undefined) {
    fail(
      "missing_prepared_verification",
      "context.prepared_content_verification",
      "prepared result requires owner-verified protected content context",
    );
  }
  assertScenarioProtectedContentRefV1(
    verification.protected_content_ref,
    "context.prepared_content_verification.protected_content_ref",
  );
  assertOpaqueVersion(
    verification.protected_content_version,
    "context.prepared_content_verification.protected_content_version",
  );
  assertMachineKey(
    verification.protected_field_key,
    "context.prepared_content_verification.protected_field_key",
  );
  assertMachineKey(
    verification.content_kind,
    "context.prepared_content_verification.content_kind",
  );
  assertSha256(
    verification.verified_keyed_integrity_hash,
    "context.prepared_content_verification.verified_keyed_integrity_hash",
  );
  assertCanonicalInstant(
    verification.issued_at,
    "context.prepared_content_verification.issued_at",
  );
  assertCanonicalInstant(
    verification.expires_at,
    "context.prepared_content_verification.expires_at",
  );
  const prepared = result.prepared_content;
  if (
    prepared.protected_content_ref !== verification.protected_content_ref ||
    prepared.protected_content_version !== verification.protected_content_version
  ) {
    fail(
      "prepared_content_mismatch",
      "protected_prepare_result.prepared_content",
      "prepared content identity must match owner verification",
    );
  }
  if (
    prepared.content_kind !== protectedContract.content_kind ||
    prepared.content_kind !== verification.content_kind
  ) {
    fail(
      "content_kind_mismatch",
      "protected_prepare_result.prepared_content.content_kind",
      "prepared content kind must match static and server-derived context",
    );
  }
  if (verification.protected_field_key !== protectedContract.protected_field_key) {
    fail(
      "protected_field_mismatch",
      "context.prepared_content_verification.protected_field_key",
      "owner integrity evidence must bind the static protected field",
    );
  }
  if (prepared.keyed_integrity_hash !== verification.verified_keyed_integrity_hash) {
    fail(
      "integrity_hash_mismatch",
      "protected_prepare_result.prepared_content.keyed_integrity_hash",
      "prepared integrity must match independently verified owner evidence",
    );
  }
  if (prepared.keyed_integrity_hash === input.carrier_binding.keyed_binding_hash) {
    fail(
      "hash_domain_reuse",
      "protected_prepare_result.prepared_content.keyed_integrity_hash",
      "transport binding and owner integrity hashes must use distinct domains",
    );
  }
  if (
    prepared.issued_at !== result.action_result.issued_at ||
    prepared.expires_at !== result.action_result.expires_at ||
    prepared.issued_at !== verification.issued_at ||
    prepared.expires_at !== verification.expires_at
  ) {
    fail(
      "prepared_time_mismatch",
      "protected_prepare_result.prepared_content.issued_at",
      "action and protected prepared controls must share exact owner-verified times",
    );
  }
};

export const assertScenarioCommittedProtectedContentControlV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioCommittedProtectedContentControlV1 = (
  value,
  path = "committed_content",
) => {
  const record = assertRecord(value, path);
  assertKeys(record, committedContentControlKeys, path);
  if (record.protected_content_control_version !== 1 || record.state !== "committed") {
    fail("invalid_committed_control", path, `${path} must be a v1 committed control`);
  }
  assertScenarioProtectedContentRefV1(
    record.protected_content_ref,
    `${path}.protected_content_ref`,
  );
  assertOpaqueVersion(record.prepared_content_version, `${path}.prepared_content_version`);
  assertOpaqueVersion(record.committed_content_version, `${path}.committed_content_version`);
  if (record.prepared_content_version === record.committed_content_version) {
    fail(
      "content_version_not_advanced",
      `${path}.committed_content_version`,
      "committed content version must differ from the prepared version",
    );
  }
  assertMachineKey(record.content_kind, `${path}.content_kind`);
  assertSha256(record.keyed_integrity_hash, `${path}.keyed_integrity_hash`);
  assertCanonicalInstant(record.committed_at, `${path}.committed_at`);
  if (serializedUtf8Bytes(record, path) > maximumProtectedControlBytesV1) {
    fail("control_too_large", path, `${path} must be at most 8 KiB UTF-8`);
  }
};

const assertProtectedCommitVerification = (
  verification: ScenarioProtectedContentCommitVerificationV1,
): void => {
  assertMachineKey(verification.scenario_key, "context.commit_verification.scenario_key");
  assertMachineKey(verification.action_key, "context.commit_verification.action_key");
  assertSha256(
    verification.canonical_payload_hash,
    "context.commit_verification.canonical_payload_hash",
  );
  assertScenarioProtectedContentRefV1(
    verification.protected_content_ref,
    "context.commit_verification.protected_content_ref",
  );
  assertOpaqueVersion(
    verification.prepared_content_version,
    "context.commit_verification.prepared_content_version",
  );
  assertOpaqueVersion(
    verification.committed_content_version,
    "context.commit_verification.committed_content_version",
  );
  assertMachineKey(verification.content_kind, "context.commit_verification.content_kind");
  assertSha256(
    verification.verified_keyed_integrity_hash,
    "context.commit_verification.verified_keyed_integrity_hash",
  );
  assertCanonicalInstant(
    verification.committed_at,
    "context.commit_verification.committed_at",
  );
};

export const assertScenarioProtectedContentCommitCompositionV1 = (
  protectedContract: unknown,
  actionContract: unknown,
  submit: unknown,
  preparedContent: unknown,
  executionBinding: unknown,
  executionResult: unknown,
  committedContent: unknown | undefined,
  context: {
    submit_context: Parameters<typeof assertSubmitScenarioDomainActionContextV1>[2];
    resolved_prepared_content: ScenarioPreparedProtectedContentVerificationV1;
    commit_verification?: ScenarioProtectedContentCommitVerificationV1;
  },
): void => {
  assertScenarioProtectedActionContractPairV1(protectedContract, actionContract);
  assertScenarioProtectedInteractionContractV1(protectedContract);
  assertSubmitScenarioDomainActionInputV1(submit);
  assertScenarioPreparedProtectedContentControlV1(preparedContent);
  assertScenarioDomainActionExecutionBindingV1(executionBinding);
  assertScenarioDomainActionExecutionResultV1(executionResult);
  assertSubmitScenarioDomainActionContextV1(
    actionContract,
    submit,
    context.submit_context,
  );
  const resolvedPrepared = context.resolved_prepared_content;
  assertScenarioProtectedContentRefV1(
    resolvedPrepared.protected_content_ref,
    "context.resolved_prepared_content.protected_content_ref",
  );
  assertOpaqueVersion(
    resolvedPrepared.protected_content_version,
    "context.resolved_prepared_content.protected_content_version",
  );
  assertMachineKey(
    resolvedPrepared.protected_field_key,
    "context.resolved_prepared_content.protected_field_key",
  );
  assertMachineKey(
    resolvedPrepared.content_kind,
    "context.resolved_prepared_content.content_kind",
  );
  assertSha256(
    resolvedPrepared.verified_keyed_integrity_hash,
    "context.resolved_prepared_content.verified_keyed_integrity_hash",
  );
  assertCanonicalInstant(
    resolvedPrepared.issued_at,
    "context.resolved_prepared_content.issued_at",
  );
  assertCanonicalInstant(
    resolvedPrepared.expires_at,
    "context.resolved_prepared_content.expires_at",
  );
  if (
    resolvedPrepared.protected_content_ref !== preparedContent.protected_content_ref ||
    resolvedPrepared.protected_content_version !== preparedContent.protected_content_version ||
    resolvedPrepared.protected_field_key !== protectedContract.protected_field_key ||
    resolvedPrepared.content_kind !== preparedContent.content_kind ||
    resolvedPrepared.content_kind !== protectedContract.content_kind ||
    resolvedPrepared.verified_keyed_integrity_hash !== preparedContent.keyed_integrity_hash ||
    resolvedPrepared.issued_at !== preparedContent.issued_at ||
    resolvedPrepared.expires_at !== preparedContent.expires_at ||
    resolvedPrepared.expires_at !== context.submit_context.submit_context_expires_at
  ) {
    fail(
      "resolved_prepared_content_mismatch",
      "context.resolved_prepared_content",
      "resolved submit context must name the exact prepared protected object",
    );
  }
  assertScenarioDomainActionExecutionResultForBindingV1(
    actionContract,
    executionBinding,
    executionResult,
  );
  if (executionResult.status !== "committed") {
    if (committedContent !== undefined || context.commit_verification !== undefined) {
      fail(
        "commit_without_committed_effect",
        "committed_content",
        "not-committed or unknown execution cannot produce committed protected content",
      );
    }
    return;
  }
  if (committedContent === undefined) {
    fail(
      "missing_committed_content",
      "committed_content",
      "committed execution requires a committed protected content control",
    );
  }
  assertScenarioCommittedProtectedContentControlV1(committedContent);
  const verification = context.commit_verification;
  if (verification === undefined) {
    fail(
      "missing_commit_verification",
      "context.commit_verification",
      "committed protected content requires owner transaction verification",
    );
  }
  assertProtectedCommitVerification(verification);
  if (
    verification.scenario_key !== protectedContract.scenario_key ||
    verification.action_key !== protectedContract.action_key ||
    verification.scenario_key !== executionBinding.effect_identity.scenario_key ||
    verification.action_key !== executionBinding.effect_identity.action_key
  ) {
    fail(
      "commit_effect_identity_mismatch",
      "context.commit_verification",
      "commit verification must bind the same scenario/action effect identity",
    );
  }
  if (verification.canonical_payload_hash !== executionBinding.canonical_payload_hash) {
    fail(
      "commit_payload_mismatch",
      "context.commit_verification.canonical_payload_hash",
      "commit verification must bind the exact execution payload",
    );
  }
  if (
    committedContent.protected_content_ref !== preparedContent.protected_content_ref ||
    committedContent.protected_content_ref !== verification.protected_content_ref
  ) {
    fail(
      "committed_content_ref_mismatch",
      "committed_content.protected_content_ref",
      "commit must use the exact prepared protected content reference",
    );
  }
  if (
    committedContent.prepared_content_version !== preparedContent.protected_content_version ||
    committedContent.prepared_content_version !== verification.prepared_content_version
  ) {
    fail(
      "prepared_version_mismatch",
      "committed_content.prepared_content_version",
      "commit must name the exact prepared content version",
    );
  }
  if (
    committedContent.committed_content_version !== verification.committed_content_version ||
    committedContent.committed_content_version === preparedContent.protected_content_version
  ) {
    fail(
      "committed_version_mismatch",
      "committed_content.committed_content_version",
      "commit must produce the new owner-verified content version",
    );
  }
  if (
    committedContent.content_kind !== preparedContent.content_kind ||
    committedContent.content_kind !== protectedContract.content_kind ||
    committedContent.content_kind !== verification.content_kind
  ) {
    fail(
      "content_kind_mismatch",
      "committed_content.content_kind",
      "committed content kind must match prepared, static and owner-verified context",
    );
  }
  if (
    committedContent.keyed_integrity_hash !== preparedContent.keyed_integrity_hash ||
    committedContent.keyed_integrity_hash !== verification.verified_keyed_integrity_hash
  ) {
    fail(
      "integrity_hash_mismatch",
      "committed_content.keyed_integrity_hash",
      "committed content must preserve the exact prepared owner integrity evidence",
    );
  }
  if (committedContent.committed_at !== verification.committed_at) {
    fail(
      "committed_time_mismatch",
      "committed_content.committed_at",
      "committed time must match owner transaction verification",
    );
  }
  const committedAt = assertCanonicalInstant(
    committedContent.committed_at,
    "committed_content.committed_at",
  );
  const preparedAt = assertCanonicalInstant(
    preparedContent.issued_at,
    "prepared_content.issued_at",
  );
  if (committedAt < preparedAt) {
    fail(
      "commit_before_prepare",
      "committed_content.committed_at",
      "protected content cannot commit before it was prepared",
    );
  }
};
