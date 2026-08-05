import {
  scenarioNarrationPolicies,
  scenarioSafeReasonRetryClasses,
  scenarioTones,
  type ScenarioActionTargetRefV1,
  type ScenarioNarrationPolicyV1,
  type ScenarioPresentationItemRefV1,
  type ScenarioSafeLabelV1,
  type ScenarioSafeReasonV1,
  type ScenarioSafeTextV1,
  type ScenarioSubjectContextRefV1,
  type ScenarioToneV1,
} from "./scenario-presentation.js";

export class ScenarioPresentationValidationError extends Error {
  constructor(readonly code: string, readonly path: string, message: string) {
    super(message);
    this.name = "ScenarioPresentationValidationError";
  }
}

const safeTextKeys = new Set(["kind", "value", "locale"]);
const safeReasonKeys = new Set(["reason_code", "message", "help", "retry_class"]);
const tones = new Set<string>(scenarioTones);
const narrationPolicies = new Set<string>(scenarioNarrationPolicies);
const retryClasses = new Set<string>(scenarioSafeReasonRetryClasses);
const machineKeyPattern = /^[a-z][a-z0-9._:-]{0,127}$/u;
const opaqueLocatorPattern = /^[A-Za-z0-9_-]{32,512}$/u;
const canonicalLocalePattern =
  /^[a-z]{2,3}(?:-[A-Z][a-z]{3})?(?:-(?:[A-Z]{2}|[0-9]{3}))?(?:-[A-Za-z0-9]{5,8})*$/u;
const controlCharacterPattern = /[\u0000-\u001f\u007f-\u009f]/u;
const htmlPattern = /<\/?[A-Za-z][^>]*>|<!--|-->/u;
const urlPattern = /\b(?:(?:https?|ftp):\/\/|mailto:|www\.)/iu;
const markdownPattern =
  /(?:^|\n)\s{0,3}(?:#{1,6}\s|>\s|[-*+]\s|[0-9]+\.\s)|!?\[[^\]]*\]\([^)]+\)|\*\*|__|~~|`/u;
const unresolvedParameterPattern = /\{\{[^}]*\}\}|\$\{[^}]*\}|\{[A-Za-z][A-Za-z0-9_.-]*\}/u;
const internalDetailPattern =
  /\b(?:stack trace|sqlstate|postgresql?|prisma|database error|provider error|internal exception|internal reason)\b/iu;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const fail: (code: string, path: string, message: string) => never = (code, path, message) => {
  throw new ScenarioPresentationValidationError(code, path, message);
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

const codePointLength = (value: string) => Array.from(value).length;

const assertSafeText: (
  value: unknown,
  path: string,
  maximumLength: number,
) => asserts value is ScenarioSafeTextV1 = (value, path, maximumLength) => {
  const record = assertRecord(value, path);
  assertKeys(record, safeTextKeys, path);
  if (record.kind !== "plain_text") {
    fail("invalid_safe_text_kind", `${path}.kind`, "safe text kind must be plain_text");
  }
  if (typeof record.value !== "string") {
    fail("invalid_safe_text", `${path}.value`, "safe text value must be a string");
  }
  const text = record.value;
  if (
    codePointLength(text) < 1 ||
    codePointLength(text) > maximumLength ||
    text.trim() !== text ||
    text.normalize("NFC") !== text
  ) {
    fail(
      "invalid_safe_text",
      `${path}.value`,
      `${path}.value must be normalized, non-blank, and at most ${maximumLength} characters`,
    );
  }
  if (
    controlCharacterPattern.test(text) ||
    htmlPattern.test(text) ||
    urlPattern.test(text) ||
    markdownPattern.test(text) ||
    unresolvedParameterPattern.test(text) ||
    internalDetailPattern.test(text)
  ) {
    fail("unsafe_safe_text", `${path}.value`, `${path}.value contains unsafe copy`);
  }
  if (
    typeof record.locale !== "string" ||
    !canonicalLocalePattern.test(record.locale) ||
    Intl.getCanonicalLocales(record.locale)[0] !== record.locale
  ) {
    fail("invalid_locale", `${path}.locale`, `${path}.locale must be normalized BCP-47`);
  }
};

const assertOpaqueLocator = (value: unknown, path: string) => {
  if (typeof value !== "string" || !opaqueLocatorPattern.test(value)) {
    fail(
      "invalid_opaque_locator",
      path,
      `${path} must be a 32-512 character opaque base64url value`,
    );
  }
};

export const assertScenarioSafeTextV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioSafeTextV1 = (value, path = "safe_text") => {
  assertSafeText(value, path, 500);
};

export const assertScenarioSafeLabelV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioSafeLabelV1 = (value, path = "safe_label") => {
  assertSafeText(value, path, 80);
};

export const assertScenarioSafeReasonV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioSafeReasonV1 = (value, path = "safe_reason") => {
  const record = assertRecord(value, path);
  assertKeys(record, safeReasonKeys, path);
  if (typeof record.reason_code !== "string" || !machineKeyPattern.test(record.reason_code)) {
    fail(
      "invalid_reason_code",
      `${path}.reason_code`,
      `${path}.reason_code must be a registered bounded machine key`,
    );
  }
  assertSafeText(record.message, `${path}.message`, 500);
  if (record.help !== undefined) assertSafeText(record.help, `${path}.help`, 240);
  if (typeof record.retry_class !== "string" || !retryClasses.has(record.retry_class)) {
    fail("invalid_retry_class", `${path}.retry_class`, `${path}.retry_class is invalid`);
  }
};

export const assertScenarioToneV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioToneV1 = (value, path = "tone") => {
  if (typeof value !== "string" || !tones.has(value)) {
    fail("invalid_tone", path, `${path} is invalid`);
  }
};

export const assertScenarioNarrationPolicyV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioNarrationPolicyV1 = (value, path = "narration") => {
  if (typeof value !== "string" || !narrationPolicies.has(value)) {
    fail("invalid_narration_policy", path, `${path} is invalid`);
  }
};

export const assertScenarioSubjectContextRefV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioSubjectContextRefV1 = (
  value,
  path = "subject_context_ref",
) => {
  assertOpaqueLocator(value, path);
};

export const assertScenarioPresentationItemRefV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioPresentationItemRefV1 = (
  value,
  path = "presentation_item_ref",
) => {
  assertOpaqueLocator(value, path);
};

export const assertScenarioActionTargetRefV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioActionTargetRefV1 = (value, path = "target_ref") => {
  assertOpaqueLocator(value, path);
};

export const assertScenarioPresentationCursorV1 = (
  value: unknown,
  path = "cursor",
): void => {
  assertOpaqueLocator(value, path);
};

export const assertScenarioContinuationRefV1 = (
  value: unknown,
  path = "continuation_ref",
): void => {
  assertOpaqueLocator(value, path);
};
