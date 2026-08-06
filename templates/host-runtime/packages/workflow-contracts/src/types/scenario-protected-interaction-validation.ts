import {
  assertPrepareScenarioDomainActionExchangeV1,
  assertPrepareScenarioDomainActionInputV1,
  assertPrepareScenarioDomainActionResultV1,
  assertScenarioDomainActionContractV1,
  assertScenarioDomainActionExecutionBindingV1,
  assertScenarioDomainActionExecutionResultForBindingV1,
  assertScenarioDomainActionExecutionResultV1,
  assertScenarioDomainActionWorkflowStepRefV1,
  assertSubmitScenarioDomainActionContextV1,
  assertSubmitScenarioDomainActionInputV1,
} from "./scenario-domain-action-validation.js";
import type {
  ScenarioDomainActionContractV1,
  ScenarioDomainActionExecutionBindingV1,
  ScenarioDomainActionWorkflowStepRefV1,
} from "./scenario-domain-action.js";
import { assertCanonicalRef } from "./federation-validation.js";
import type { CanonicalRef } from "./identity.js";
import { assertScenarioSafeReasonV1 } from "./scenario-presentation-validation.js";
import {
  scenarioProtectedCarrierScopesV1,
  scenarioProtectedMaximumCarrierBytesV1,
  scenarioProtectedMaximumCharactersV1,
  scenarioProtectedMaximumPlainTextBytesV1,
  scenarioProtectedMediaTypeV1,
  scenarioProtectedMinimumCharactersV1,
  scenarioProtectedNormalizationV1,
  type ScenarioProtectedCarrierScopeV1,
  type ScenarioProtectedCarrierBindingV1,
  type ScenarioProtectedContentRefV1,
  type ScenarioProtectedInteractionContractV1,
  type ScenarioProtectedPlainTextCarrierV1,
  type PrepareScenarioProtectedInteractionInputV1,
  type PrepareScenarioProtectedInteractionResultV1,
  type ScenarioPreparedProtectedContentControlV1,
  type ScenarioCommittedProtectedContentControlV1,
  type ScenarioProtectedContentReadLocatorV1,
  type ReadScenarioProtectedDetailInputV1,
  type ScenarioProtectedDisplayLeaseV1,
  type ReadScenarioProtectedDetailResultV1,
} from "./scenario-protected-interaction.js";

type ScenarioProtectedVerifiedRequestContextV1 = {
  request_identity_hash: string;
  workspace_ref: CanonicalRef;
  principal_binding_hash: string;
  scenario_key: string;
  action_key: string;
  surface_key: string;
};

type ScenarioProtectedCarrierBindingVerificationV1 =
  ScenarioProtectedVerifiedRequestContextV1 & {
    carrier_scope: ScenarioProtectedCarrierScopeV1;
    protected_field_key: string;
    verified_keyed_binding_hash: string;
  };

type ScenarioPreparedProtectedContentVerificationV1 = {
  protected_content_ref: ScenarioProtectedContentRefV1;
  protected_content_version: string;
  protected_field_key: string;
  content_kind: string;
  accepted_carrier_binding_hash: string;
  request_identity_hash: string;
  verified_keyed_integrity_hash: string;
  issued_at: string;
  expires_at: string;
};

type ScenarioProtectedContentCommitVerificationV1 = {
  scenario_key: string;
  action_key: string;
  request_identity_hash: string;
  accepted_carrier_binding_hash: string;
  canonical_payload_hash: string;
  protected_content_ref: ScenarioProtectedContentRefV1;
  prepared_content_version: string;
  committed_content_version: string;
  content_kind: string;
  verified_keyed_integrity_hash: string;
  committed_at: string;
};

type ScenarioProtectedExecutionPathVerificationV1 =
  | {
      driver: "scenario_direct_empty_v1";
      submit_context_ref: CanonicalRef;
    }
  | {
      driver: "workflow_claimed_step_v1";
      original_workflow_step_ref: ScenarioDomainActionWorkflowStepRefV1;
    };

type ScenarioProtectedReadLocatorVerificationV1 =
  ScenarioProtectedVerifiedRequestContextV1 & {
    access_mode: "foreground_current";
    protected_content_ref: ScenarioProtectedContentRefV1;
    content_kind: string;
    issued_at: string;
    expires_at: string;
    verified_foreground_context_hash: string;
  };

type ScenarioProtectedDecryptedContentVerificationV1 = {
  protected_content_ref: ScenarioProtectedContentRefV1;
  protected_content_version: string;
  protected_field_key: string;
  content_kind: string;
  read_carrier_binding_hash: string;
  request_identity_hash: string;
  verified_keyed_integrity_hash: string;
};

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
const protectedReadLocatorKeys = new Set([
  "protected_read_locator_version",
  "protected_content_ref",
  "content_kind",
  "issued_at",
  "expires_at",
]);
const protectedReadInputKeys = new Set([
  "protected_read_version",
  "protected_content_ref",
  "known_content_version",
]);
const protectedDisplayLeaseKeys = new Set([
  "display_lease_version",
  "cache_policy",
  "issued_at",
  "expires_at",
]);
const protectedReadReadyResultKeys = new Set([
  "protected_read_result_version",
  "status",
  "protected_content_version",
  "content_kind",
  "carrier_binding",
  "display_lease",
]);
const protectedReadSafeResultKeys = new Set([
  "protected_read_result_version",
  "status",
  "safe_reason",
]);
const carrierBindingVerificationKeys = new Set([
  "carrier_scope",
  "protected_field_key",
  "request_identity_hash",
  "workspace_ref",
  "principal_binding_hash",
  "scenario_key",
  "action_key",
  "surface_key",
  "verified_keyed_binding_hash",
]);
const preparedContentVerificationKeys = new Set([
  "protected_content_ref",
  "protected_content_version",
  "protected_field_key",
  "content_kind",
  "accepted_carrier_binding_hash",
  "request_identity_hash",
  "verified_keyed_integrity_hash",
  "issued_at",
  "expires_at",
]);
const protectedPrepareExchangeContextKeys = new Set([
  "request_identity_hash",
  "carrier_binding_verification",
  "action_prepare_context",
  "prepared_content_verification",
]);
const commitVerificationKeys = new Set([
  "scenario_key",
  "action_key",
  "request_identity_hash",
  "accepted_carrier_binding_hash",
  "canonical_payload_hash",
  "protected_content_ref",
  "prepared_content_version",
  "committed_content_version",
  "content_kind",
  "verified_keyed_integrity_hash",
  "committed_at",
]);
const protectedCommitExchangeContextKeys = new Set([
  "submit_context",
  "resolved_prepared_content",
  "execution_path_verification",
  "commit_verification",
]);
const readLocatorVerificationKeys = new Set([
  "access_mode",
  "request_identity_hash",
  "workspace_ref",
  "principal_binding_hash",
  "scenario_key",
  "action_key",
  "surface_key",
  "protected_content_ref",
  "content_kind",
  "issued_at",
  "expires_at",
  "verified_foreground_context_hash",
]);
const decryptedContentVerificationKeys = new Set([
  "protected_content_ref",
  "protected_content_version",
  "protected_field_key",
  "content_kind",
  "read_carrier_binding_hash",
  "request_identity_hash",
  "verified_keyed_integrity_hash",
]);
const protectedReadExchangeContextKeys = new Set([
  "now",
  "locator_verification",
  "carrier_binding_verification",
  "decrypted_content_verification",
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
const maximumProtectedReadLocatorLifetimeMs = 5 * 60 * 1000;
const maximumProtectedDisplayLeaseLifetimeMs = 60 * 1000;
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
  verification: unknown,
): void => {
  assertScenarioProtectedCarrierBindingV1(binding);
  const verificationRecord = assertRecord(verification, "binding_verification");
  assertKeys(
    verificationRecord,
    carrierBindingVerificationKeys,
    "binding_verification",
  );
  const typedVerification =
    verificationRecord as ScenarioProtectedCarrierBindingVerificationV1;
  if (
    typedVerification.carrier_scope !== "prepare_input" &&
    typedVerification.carrier_scope !== "read_output"
  ) {
    fail(
      "invalid_verified_scope",
      "binding_verification.carrier_scope",
      "verified carrier_scope is invalid",
    );
  }
  assertMachineKey(
    typedVerification.protected_field_key,
    "binding_verification.protected_field_key",
  );
  assertSha256(
    typedVerification.request_identity_hash,
    "binding_verification.request_identity_hash",
  );
  assertCanonicalRef(typedVerification.workspace_ref, "binding_verification.workspace_ref");
  if (
    typedVerification.workspace_ref.namespace !== "my_chat" ||
    typedVerification.workspace_ref.object_type !== "workspace"
  ) {
    fail(
      "invalid_workspace_ref",
      "binding_verification.workspace_ref",
      "binding verification must name a my_chat/workspace ref",
    );
  }
  assertSha256(
    typedVerification.principal_binding_hash,
    "binding_verification.principal_binding_hash",
  );
  assertMachineKey(typedVerification.scenario_key, "binding_verification.scenario_key");
  assertMachineKey(typedVerification.action_key, "binding_verification.action_key");
  assertMachineKey(typedVerification.surface_key, "binding_verification.surface_key");
  assertSha256(
    typedVerification.verified_keyed_binding_hash,
    "binding_verification.verified_keyed_binding_hash",
  );
  if (binding.carrier_scope !== typedVerification.carrier_scope) {
    fail(
      "carrier_scope_mismatch",
      "carrier_binding.carrier_scope",
      "carrier scope must match independently verified context",
    );
  }
  if (binding.protected_field_key !== typedVerification.protected_field_key) {
    fail(
      "protected_field_mismatch",
      "carrier_binding.protected_field_key",
      "protected field must match independently verified context",
    );
  }
  if (binding.keyed_binding_hash !== typedVerification.verified_keyed_binding_hash) {
    fail(
      "binding_hash_mismatch",
      "carrier_binding.keyed_binding_hash",
      "keyed binding hash must match independently verified evidence",
    );
  }
};

const canonicalRefEquals = (left: CanonicalRef, right: CanonicalRef): boolean =>
  left.schema_version === right.schema_version &&
  left.namespace === right.namespace &&
  left.object_type === right.object_type &&
  left.object_id === right.object_id &&
  left.version === right.version;

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

const assertNoProtectedControlCopies = (
  value: unknown,
  protectedValues: readonly string[],
  path: string,
  ancestors = new Set<object>(),
): void => {
  if (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "number"
  ) {
    return;
  }
  if (typeof value === "string") {
    if (protectedValues.some((protectedValue) => value.includes(protectedValue))) {
      fail(
        "protected_control_copy",
        path,
        `${path} contains a protected ref, version or integrity value`,
      );
    }
    return;
  }
  if (typeof value !== "object") return;
  if (ancestors.has(value)) {
    fail("cyclic_control_value", path, `${path} must not contain cycles`);
  }
  ancestors.add(value);
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertNoProtectedControlCopies(
        item,
        protectedValues,
        `${path}.${index}`,
        ancestors,
      ),
    );
  } else {
    for (const [key, item] of Object.entries(value)) {
      assertNoProtectedControlCopies(
        item,
        protectedValues,
        `${path}.${key}`,
        ancestors,
      );
    }
  }
  ancestors.delete(value);
};

const protectedActionInputForbiddenKeyForms = [
  "attachmentrefs",
  "body",
  "carrier",
  "ciphertext",
  "clientcontentkind",
  "contentbytes",
  "detail",
  "encryptionkey",
  "keyid",
  "kmskey",
  "nonce",
  "plaintext",
  "protectedbody",
  "protectedcarrier",
  "protectedcontentref",
  "summary",
  "narration",
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
    request_identity_hash: string;
    carrier_binding_verification: ScenarioProtectedCarrierBindingVerificationV1;
    action_prepare_context: Parameters<
      typeof assertPrepareScenarioDomainActionExchangeV1
    >[3];
    prepared_content_verification?: ScenarioPreparedProtectedContentVerificationV1;
  },
): void => {
  assertKeys(
    assertRecord(context, "context"),
    protectedPrepareExchangeContextKeys,
    "context",
  );
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
  assertSha256(context.request_identity_hash, "context.request_identity_hash");
  assertCanonicalRef(
    context.action_prepare_context.workspace_ref,
    "context.action_prepare_context.workspace_ref",
  );
  const bindingVerification = context.carrier_binding_verification;
  if (
    bindingVerification.request_identity_hash !== context.request_identity_hash ||
    !canonicalRefEquals(
      bindingVerification.workspace_ref,
      context.action_prepare_context.workspace_ref,
    ) ||
    bindingVerification.principal_binding_hash !==
      context.action_prepare_context.principal_binding_hash ||
    bindingVerification.scenario_key !== protectedContract.scenario_key ||
    bindingVerification.scenario_key !== context.action_prepare_context.scenario_key ||
    bindingVerification.action_key !== protectedContract.action_key ||
    bindingVerification.action_key !== input.action_prepare.action_key ||
    bindingVerification.surface_key !== context.action_prepare_context.ingress_key
  ) {
    fail(
      "carrier_request_context_mismatch",
      "context.carrier_binding_verification",
      "verified carrier must bind the exact request, Workspace, principal, scenario, action and surface",
    );
  }
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
  assertKeys(
    assertRecord(verification, "context.prepared_content_verification"),
    preparedContentVerificationKeys,
    "context.prepared_content_verification",
  );
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
    verification.accepted_carrier_binding_hash,
    "context.prepared_content_verification.accepted_carrier_binding_hash",
  );
  assertSha256(
    verification.request_identity_hash,
    "context.prepared_content_verification.request_identity_hash",
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
  for (const [value, path] of [
    [input.action_prepare, "protected_prepare_input.action_prepare"],
    [result.action_result, "protected_prepare_result.action_result"],
  ] as const) {
    assertNoProtectedControlCopies(
      value,
      [
        prepared.protected_content_ref,
        prepared.protected_content_version,
        prepared.keyed_integrity_hash,
      ],
      path,
    );
  }
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
  if (
    verification.accepted_carrier_binding_hash !== input.carrier_binding.keyed_binding_hash ||
    verification.request_identity_hash !== context.request_identity_hash
  ) {
    fail(
      "owner_carrier_context_mismatch",
      "context.prepared_content_verification.accepted_carrier_binding_hash",
      "owner integrity evidence must bind the exact accepted carrier request",
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
  assertKeys(
    assertRecord(verification, "context.commit_verification"),
    commitVerificationKeys,
    "context.commit_verification",
  );
  assertMachineKey(verification.scenario_key, "context.commit_verification.scenario_key");
  assertMachineKey(verification.action_key, "context.commit_verification.action_key");
  assertSha256(
    verification.request_identity_hash,
    "context.commit_verification.request_identity_hash",
  );
  assertSha256(
    verification.accepted_carrier_binding_hash,
    "context.commit_verification.accepted_carrier_binding_hash",
  );
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

const workflowStepRefEquals = (
  left: ScenarioDomainActionWorkflowStepRefV1,
  right: ScenarioDomainActionWorkflowStepRefV1,
): boolean =>
  left.schema_version === right.schema_version &&
  left.namespace === right.namespace &&
  left.object_type === right.object_type &&
  left.object_id === right.object_id;

const assertExecutionPathVerification = (
  verification: ScenarioProtectedExecutionPathVerificationV1,
  executionBinding: ScenarioDomainActionExecutionBindingV1,
): void => {
  assertRecord(verification, "context.execution_path_verification");
  if (verification.driver === "scenario_direct_empty_v1") {
    if (
      Object.keys(verification).some(
        (key) => key !== "driver" && key !== "submit_context_ref",
      )
    ) {
      fail(
        "invalid_execution_path_verification",
        "context.execution_path_verification",
        "direct execution-path verification contains unknown fields",
      );
    }
    assertCanonicalRef(
      verification.submit_context_ref,
      "context.execution_path_verification.submit_context_ref",
    );
    if (
      executionBinding.effect_identity.driver !== verification.driver ||
      !canonicalRefEquals(
        verification.submit_context_ref,
        executionBinding.effect_identity.submit_context_ref,
      )
    ) {
      fail(
        "execution_path_mismatch",
        "context.execution_path_verification",
        "direct execution path must retain the exact I1-D submit context identity",
      );
    }
    return;
  }
  if (verification.driver !== "workflow_claimed_step_v1") {
    fail(
      "invalid_execution_path_verification",
      "context.execution_path_verification.driver",
      "execution path must use an accepted I1-D driver",
    );
  }
  if (
    Object.keys(verification).some(
      (key) => key !== "driver" && key !== "original_workflow_step_ref",
    )
  ) {
    fail(
      "invalid_execution_path_verification",
      "context.execution_path_verification",
      "claimed execution-path verification contains unknown fields",
    );
  }
  assertScenarioDomainActionExecutionBindingV1(executionBinding);
  if (executionBinding.effect_identity.driver !== "workflow_claimed_step_v1") {
    fail(
      "execution_path_mismatch",
      "context.execution_path_verification.driver",
      "claimed execution path must match the I1-D effect identity",
    );
  }
  const originalStep = verification.original_workflow_step_ref;
  if (originalStep === undefined) {
    fail(
      "missing_original_step",
      "context.execution_path_verification.original_workflow_step_ref",
      "claimed execution path requires the independently resolved original Step",
    );
  }
  assertScenarioDomainActionWorkflowStepRefV1(
    originalStep,
    "context.execution_path_verification.original_workflow_step_ref",
  );
  if (
    !workflowStepRefEquals(
      originalStep,
      executionBinding.effect_identity.original_workflow_step_ref,
    )
  ) {
    fail(
      "original_step_mismatch",
      "context.execution_path_verification.original_workflow_step_ref",
      "protected commit must retain the exact original claimed Step",
    );
  }
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
    execution_path_verification: ScenarioProtectedExecutionPathVerificationV1;
    commit_verification?: ScenarioProtectedContentCommitVerificationV1;
  },
): void => {
  assertKeys(
    assertRecord(context, "context"),
    protectedCommitExchangeContextKeys,
    "context",
  );
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
  assertKeys(
    assertRecord(resolvedPrepared, "context.resolved_prepared_content"),
    preparedContentVerificationKeys,
    "context.resolved_prepared_content",
  );
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
    resolvedPrepared.accepted_carrier_binding_hash,
    "context.resolved_prepared_content.accepted_carrier_binding_hash",
  );
  assertSha256(
    resolvedPrepared.request_identity_hash,
    "context.resolved_prepared_content.request_identity_hash",
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
  assertExecutionPathVerification(
    context.execution_path_verification,
    executionBinding,
  );
  assertScenarioDomainActionExecutionResultForBindingV1(
    actionContract,
    executionBinding,
    executionResult,
  );
  for (const [value, path] of [
    [submit, "submit_input"],
    [executionBinding, "execution_binding"],
    [executionResult, "execution_result"],
  ] as const) {
    assertNoProtectedControlCopies(
      value,
      [
        preparedContent.protected_content_ref,
        preparedContent.protected_content_version,
        preparedContent.keyed_integrity_hash,
      ],
      path,
    );
  }
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
  for (const [value, path] of [
    [submit, "submit_input"],
    [executionBinding, "execution_binding"],
    [executionResult, "execution_result"],
  ] as const) {
    assertNoProtectedControlCopies(
      value,
      [committedContent.committed_content_version],
      path,
    );
  }
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
    verification.request_identity_hash !== resolvedPrepared.request_identity_hash ||
    verification.accepted_carrier_binding_hash !==
      resolvedPrepared.accepted_carrier_binding_hash
  ) {
    fail(
      "commit_request_identity_mismatch",
      "context.commit_verification.request_identity_hash",
      "commit verification must retain the exact prepared request and carrier binding",
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

export const assertScenarioProtectedContentReadLocatorV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioProtectedContentReadLocatorV1 = (
  value,
  path = "protected_read_locator",
) => {
  const record = assertRecord(value, path);
  assertKeys(record, protectedReadLocatorKeys, path);
  if (record.protected_read_locator_version !== 1) {
    fail(
      "invalid_version",
      `${path}.protected_read_locator_version`,
      "protected_read_locator_version must be 1",
    );
  }
  assertScenarioProtectedContentRefV1(
    record.protected_content_ref,
    `${path}.protected_content_ref`,
  );
  assertMachineKey(record.content_kind, `${path}.content_kind`);
  const issuedAt = assertCanonicalInstant(record.issued_at, `${path}.issued_at`);
  const expiresAt = assertCanonicalInstant(record.expires_at, `${path}.expires_at`);
  if (
    expiresAt <= issuedAt ||
    expiresAt - issuedAt > maximumProtectedReadLocatorLifetimeMs
  ) {
    fail(
      "invalid_lifetime",
      `${path}.expires_at`,
      "protected read locator lifetime must be greater than zero and at most five minutes",
    );
  }
  if (serializedUtf8Bytes(record, path) > maximumProtectedControlBytesV1) {
    fail("control_too_large", path, `${path} must be at most 8 KiB UTF-8`);
  }
};

export const assertReadScenarioProtectedDetailInputV1: (
  value: unknown,
  path?: string,
) => asserts value is ReadScenarioProtectedDetailInputV1 = (
  value,
  path = "protected_read_input",
) => {
  const record = assertRecord(value, path);
  assertKeys(record, protectedReadInputKeys, path);
  if (record.protected_read_version !== 1) {
    fail(
      "invalid_version",
      `${path}.protected_read_version`,
      "protected_read_version must be 1",
    );
  }
  assertScenarioProtectedContentRefV1(
    record.protected_content_ref,
    `${path}.protected_content_ref`,
  );
  if (record.known_content_version !== undefined) {
    assertOpaqueVersion(record.known_content_version, `${path}.known_content_version`);
  }
  if (serializedUtf8Bytes(record, path) > maximumProtectedControlBytesV1) {
    fail("control_too_large", path, `${path} must be at most 8 KiB UTF-8`);
  }
};

export const assertScenarioProtectedDisplayLeaseV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioProtectedDisplayLeaseV1 = (
  value,
  path = "display_lease",
) => {
  const record = assertRecord(value, path);
  assertKeys(record, protectedDisplayLeaseKeys, path);
  if (record.display_lease_version !== 1 || record.cache_policy !== "no_store") {
    fail("invalid_display_lease", path, `${path} must be a v1 no-store display lease`);
  }
  const issuedAt = assertCanonicalInstant(record.issued_at, `${path}.issued_at`);
  const expiresAt = assertCanonicalInstant(record.expires_at, `${path}.expires_at`);
  if (
    expiresAt <= issuedAt ||
    expiresAt - issuedAt > maximumProtectedDisplayLeaseLifetimeMs
  ) {
    fail(
      "invalid_lifetime",
      `${path}.expires_at`,
      "display lease lifetime must be greater than zero and at most 60 seconds",
    );
  }
};

export const assertReadScenarioProtectedDetailResultV1: (
  value: unknown,
  path?: string,
) => asserts value is ReadScenarioProtectedDetailResultV1 = (
  value,
  path = "protected_read_result",
) => {
  const record = assertRecord(value, path);
  if (record.protected_read_result_version !== 1) {
    fail(
      "invalid_version",
      `${path}.protected_read_result_version`,
      "protected_read_result_version must be 1",
    );
  }
  if (record.status === "ready") {
    assertKeys(record, protectedReadReadyResultKeys, path);
    assertOpaqueVersion(record.protected_content_version, `${path}.protected_content_version`);
    assertMachineKey(record.content_kind, `${path}.content_kind`);
    assertScenarioProtectedCarrierBindingV1(
      record.carrier_binding,
      `${path}.carrier_binding`,
    );
    if (record.carrier_binding.carrier_scope !== "read_output") {
      fail(
        "invalid_carrier_scope",
        `${path}.carrier_binding.carrier_scope`,
        "ready protected read requires read_output carrier scope",
      );
    }
    assertScenarioProtectedDisplayLeaseV1(record.display_lease, `${path}.display_lease`);
  } else if (
    record.status === "tombstone" ||
    record.status === "context_changed" ||
    record.status === "unavailable"
  ) {
    assertKeys(record, protectedReadSafeResultKeys, path);
    assertScenarioSafeReasonV1(record.safe_reason, `${path}.safe_reason`);
  } else {
    fail("invalid_status", `${path}.status`, `${path}.status is invalid`);
  }
  if (serializedUtf8Bytes(record, path) > maximumProtectedControlBytesV1) {
    fail("control_too_large", path, `${path} must be at most 8 KiB UTF-8`);
  }
};

const assertReadLocatorVerification = (
  verification: ScenarioProtectedReadLocatorVerificationV1,
): void => {
  assertKeys(
    assertRecord(verification, "context.locator_verification"),
    readLocatorVerificationKeys,
    "context.locator_verification",
  );
  if (verification.access_mode !== "foreground_current") {
    fail(
      "invalid_read_access_mode",
      "context.locator_verification.access_mode",
      "protected reads require freshly verified foreground access",
    );
  }
  assertSha256(
    verification.request_identity_hash,
    "context.locator_verification.request_identity_hash",
  );
  assertCanonicalRef(
    verification.workspace_ref,
    "context.locator_verification.workspace_ref",
  );
  if (
    verification.workspace_ref.namespace !== "my_chat" ||
    verification.workspace_ref.object_type !== "workspace"
  ) {
    fail(
      "invalid_workspace_ref",
      "context.locator_verification.workspace_ref",
      "read verification must name a my_chat/workspace ref",
    );
  }
  assertSha256(
    verification.principal_binding_hash,
    "context.locator_verification.principal_binding_hash",
  );
  assertMachineKey(verification.scenario_key, "context.locator_verification.scenario_key");
  assertMachineKey(verification.action_key, "context.locator_verification.action_key");
  assertMachineKey(verification.surface_key, "context.locator_verification.surface_key");
  assertScenarioProtectedContentRefV1(
    verification.protected_content_ref,
    "context.locator_verification.protected_content_ref",
  );
  assertMachineKey(verification.content_kind, "context.locator_verification.content_kind");
  assertCanonicalInstant(verification.issued_at, "context.locator_verification.issued_at");
  assertCanonicalInstant(verification.expires_at, "context.locator_verification.expires_at");
  assertSha256(
    verification.verified_foreground_context_hash,
    "context.locator_verification.verified_foreground_context_hash",
  );
};

const assertDecryptedContentVerification = (
  verification: ScenarioProtectedDecryptedContentVerificationV1,
): void => {
  assertKeys(
    assertRecord(verification, "context.decrypted_content_verification"),
    decryptedContentVerificationKeys,
    "context.decrypted_content_verification",
  );
  assertScenarioProtectedContentRefV1(
    verification.protected_content_ref,
    "context.decrypted_content_verification.protected_content_ref",
  );
  assertOpaqueVersion(
    verification.protected_content_version,
    "context.decrypted_content_verification.protected_content_version",
  );
  assertMachineKey(
    verification.protected_field_key,
    "context.decrypted_content_verification.protected_field_key",
  );
  assertMachineKey(
    verification.content_kind,
    "context.decrypted_content_verification.content_kind",
  );
  assertSha256(
    verification.read_carrier_binding_hash,
    "context.decrypted_content_verification.read_carrier_binding_hash",
  );
  assertSha256(
    verification.request_identity_hash,
    "context.decrypted_content_verification.request_identity_hash",
  );
  assertSha256(
    verification.verified_keyed_integrity_hash,
    "context.decrypted_content_verification.verified_keyed_integrity_hash",
  );
};

export const assertReadScenarioProtectedDetailExchangeV1 = (
  protectedContract: unknown,
  locator: unknown,
  input: unknown,
  committedContent: unknown | undefined,
  result: unknown,
  carrier: unknown | undefined,
  context: {
    now: string;
    locator_verification: ScenarioProtectedReadLocatorVerificationV1;
    carrier_binding_verification?: ScenarioProtectedCarrierBindingVerificationV1;
    decrypted_content_verification?: ScenarioProtectedDecryptedContentVerificationV1;
  },
): void => {
  assertKeys(
    assertRecord(context, "context"),
    protectedReadExchangeContextKeys,
    "context",
  );
  assertScenarioProtectedInteractionContractV1(protectedContract);
  assertScenarioProtectedContentReadLocatorV1(locator);
  assertReadScenarioProtectedDetailInputV1(input);
  assertReadScenarioProtectedDetailResultV1(result);
  assertReadLocatorVerification(context.locator_verification);
  const locatorVerification = context.locator_verification;
  if (
    locator.protected_content_ref !== input.protected_content_ref ||
    locator.protected_content_ref !== locatorVerification.protected_content_ref ||
    locator.content_kind !== protectedContract.content_kind ||
    locator.content_kind !== locatorVerification.content_kind ||
    locatorVerification.scenario_key !== protectedContract.scenario_key ||
    locatorVerification.action_key !== protectedContract.action_key ||
    locator.issued_at !== locatorVerification.issued_at ||
    locator.expires_at !== locatorVerification.expires_at
  ) {
    fail(
      "read_locator_mismatch",
      "protected_read_locator",
      "read input and independently verified foreground context must match the locator",
    );
  }
  const now = assertCanonicalInstant(context.now, "context.now");
  const locatorIssuedAt = assertCanonicalInstant(locator.issued_at, "protected_read_locator.issued_at");
  const locatorExpiresAt = assertCanonicalInstant(
    locator.expires_at,
    "protected_read_locator.expires_at",
  );
  if (now < locatorIssuedAt || now >= locatorExpiresAt) {
    fail(
      "read_locator_not_current",
      "context.now",
      "protected read requires a current independently verified foreground locator",
    );
  }
  if (result.status !== "ready") {
    if (
      carrier !== undefined ||
      context.carrier_binding_verification !== undefined ||
      context.decrypted_content_verification !== undefined
    ) {
      fail(
        "carrier_on_non_ready_result",
        "protected_read_result",
        "non-ready protected reads must not produce a carrier or decrypted-content evidence",
      );
    }
    return;
  }
  if (committedContent === undefined) {
    fail(
      "missing_committed_content",
      "committed_content",
      "ready protected read requires current committed content control",
    );
  }
  assertScenarioCommittedProtectedContentControlV1(committedContent);
  if (carrier === undefined) {
    fail(
      "missing_read_carrier",
      "protected_carrier",
      "ready protected read requires exactly one separately transported carrier",
    );
  }
  assertScenarioProtectedPlainTextCarrierForContractV1(protectedContract, carrier);
  const bindingVerification = context.carrier_binding_verification;
  if (bindingVerification === undefined) {
    fail(
      "missing_binding_verification",
      "context.carrier_binding_verification",
      "ready protected read requires independently verified carrier binding",
    );
  }
  assertScenarioProtectedCarrierBindingVerificationV1(
    result.carrier_binding,
    bindingVerification,
  );
  if (
    bindingVerification.request_identity_hash !==
      locatorVerification.request_identity_hash ||
    !canonicalRefEquals(
      bindingVerification.workspace_ref,
      locatorVerification.workspace_ref,
    ) ||
    bindingVerification.principal_binding_hash !==
      locatorVerification.principal_binding_hash ||
    bindingVerification.scenario_key !== locatorVerification.scenario_key ||
    bindingVerification.action_key !== locatorVerification.action_key ||
    bindingVerification.surface_key !== locatorVerification.surface_key
  ) {
    fail(
      "carrier_request_context_mismatch",
      "context.carrier_binding_verification",
      "read carrier must bind the exact current foreground request context",
    );
  }
  if (result.carrier_binding.protected_field_key !== protectedContract.protected_field_key) {
    fail(
      "protected_field_mismatch",
      "protected_read_result.carrier_binding.protected_field_key",
      "read carrier binding field must match the static contract",
    );
  }
  const decryptedVerification = context.decrypted_content_verification;
  if (decryptedVerification === undefined) {
    fail(
      "missing_decrypted_verification",
      "context.decrypted_content_verification",
      "ready protected read requires owner verification of decrypted bytes",
    );
  }
  assertDecryptedContentVerification(decryptedVerification);
  if (
    committedContent.protected_content_ref !== locator.protected_content_ref ||
    committedContent.protected_content_ref !== decryptedVerification.protected_content_ref ||
    committedContent.committed_content_version !== result.protected_content_version ||
    committedContent.committed_content_version !== decryptedVerification.protected_content_version ||
    committedContent.content_kind !== result.content_kind ||
    committedContent.content_kind !== protectedContract.content_kind ||
    committedContent.content_kind !== decryptedVerification.content_kind ||
    decryptedVerification.protected_field_key !== protectedContract.protected_field_key ||
    decryptedVerification.read_carrier_binding_hash !==
      result.carrier_binding.keyed_binding_hash ||
    decryptedVerification.request_identity_hash !==
      locatorVerification.request_identity_hash
  ) {
    fail(
      "read_content_context_mismatch",
      "protected_read_result",
      "ready read must bind the exact committed object, version, kind and protected field",
    );
  }
  if (
    committedContent.keyed_integrity_hash !==
      decryptedVerification.verified_keyed_integrity_hash
  ) {
    fail(
      "decrypted_integrity_mismatch",
      "context.decrypted_content_verification.verified_keyed_integrity_hash",
      "decrypted bytes must match stored owner integrity before ready is returned",
    );
  }
  if (result.carrier_binding.keyed_binding_hash === committedContent.keyed_integrity_hash) {
    fail(
      "hash_domain_reuse",
      "protected_read_result.carrier_binding.keyed_binding_hash",
      "read transport binding and stored owner integrity hashes must use distinct domains",
    );
  }
  const leaseIssuedAt = assertCanonicalInstant(
    result.display_lease.issued_at,
    "protected_read_result.display_lease.issued_at",
  );
  const leaseExpiresAt = assertCanonicalInstant(
    result.display_lease.expires_at,
    "protected_read_result.display_lease.expires_at",
  );
  if (now < leaseIssuedAt || now >= leaseExpiresAt) {
    fail(
      "display_lease_not_current",
      "context.now",
      "ready protected content requires a current no-store display lease",
    );
  }
  assertScenarioProtectedBodyFreeControlV1(result, carrier, "protected_read_result");
};
