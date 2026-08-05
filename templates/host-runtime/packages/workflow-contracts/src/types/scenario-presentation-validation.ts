import {
  scenarioNarrationPolicies,
  scenarioSafeReasonRetryClasses,
  scenarioSubjectRouteClasses,
  scenarioSubjectScopeKinds,
  scenarioTones,
  type ListScenarioSubjectContextsInputV1,
  type ListScenarioSubjectContextsResultV1,
  type ResolveScenarioSubjectContextInputV1,
  type ResolveScenarioSubjectContextResultV1,
  type ScenarioActionTargetRefV1,
  type ScenarioNarrationPolicyV1,
  type ScenarioPresentationItemRefV1,
  type ScenarioSafeLabelV1,
  type ScenarioSafeReasonV1,
  type ScenarioSafeTextV1,
  type ScenarioSubjectContextRefV1,
  type ScenarioSubjectContextOptionV1,
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
const listSubjectContextsInputKeys = new Set(["provider_version", "cursor", "page_size"]);
const resolveSubjectContextInputKeys = new Set([
  "provider_version",
  "subject_context_ref",
  "known_context_version",
]);
const subjectContextOptionKeys = new Set([
  "subject_context_ref",
  "scope_kind",
  "route_class",
  "safe_label",
  "safe_disambiguation",
  "context_version",
  "issued_at",
  "expires_at",
]);
const listResolvedResultKeys = new Set(["status", "context"]);
const listSelectionResultKeys = new Set([
  "status",
  "scope_kind",
  "candidates",
  "next_cursor",
]);
const unavailableResultKeys = new Set(["status", "safe_reason"]);
const resolveResolvedResultKeys = new Set(["status", "context", "resolved_at"]);
const tones = new Set<string>(scenarioTones);
const narrationPolicies = new Set<string>(scenarioNarrationPolicies);
const retryClasses = new Set<string>(scenarioSafeReasonRetryClasses);
const subjectScopeKinds = new Set<string>(scenarioSubjectScopeKinds);
const subjectRouteClasses = new Set<string>(scenarioSubjectRouteClasses);
const machineKeyPattern = /^[a-z][a-z0-9._:-]{0,127}$/u;
const opaqueLocatorPattern = /^[A-Za-z0-9_-]{32,512}$/u;
const opaqueVersionPattern = /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,199}$/u;
const canonicalInstantPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;
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
const maximumPageSize = 20;
const maximumSubjectContextLifetimeMs = 30 * 60 * 1000;

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

const assertOpaqueVersion = (value: unknown, path: string) => {
  if (typeof value !== "string" || !opaqueVersionPattern.test(value)) {
    fail("invalid_opaque_version", path, `${path} must be a bounded opaque version`);
  }
};

const assertCanonicalInstant = (value: unknown, path: string): number => {
  if (typeof value !== "string" || !canonicalInstantPattern.test(value)) {
    fail("invalid_instant", path, `${path} must be a canonical UTC instant`);
  }
  const epoch = Date.parse(value);
  if (!Number.isFinite(epoch) || new Date(epoch).toISOString() !== value) {
    fail("invalid_instant", path, `${path} must be a valid canonical UTC instant`);
  }
  return epoch;
};

const assertPageSize = (value: unknown, path: string) => {
  if (!Number.isInteger(value) || Number(value) < 1 || Number(value) > maximumPageSize) {
    fail("invalid_page_size", path, `${path} must be an integer from 1 through 20`);
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

export const assertListScenarioSubjectContextsInputV1: (
  value: unknown,
  path?: string,
) => asserts value is ListScenarioSubjectContextsInputV1 = (
  value,
  path = "list_subject_contexts_input",
) => {
  const record = assertRecord(value, path);
  assertKeys(record, listSubjectContextsInputKeys, path);
  if (record.provider_version !== 1) {
    fail("invalid_provider_version", `${path}.provider_version`, "provider_version must be 1");
  }
  if (record.cursor !== undefined) {
    assertScenarioPresentationCursorV1(record.cursor, `${path}.cursor`);
  }
  if (record.page_size !== undefined) assertPageSize(record.page_size, `${path}.page_size`);
};

export const assertResolveScenarioSubjectContextInputV1: (
  value: unknown,
  path?: string,
) => asserts value is ResolveScenarioSubjectContextInputV1 = (
  value,
  path = "resolve_subject_context_input",
) => {
  const record = assertRecord(value, path);
  assertKeys(record, resolveSubjectContextInputKeys, path);
  if (record.provider_version !== 1) {
    fail("invalid_provider_version", `${path}.provider_version`, "provider_version must be 1");
  }
  assertScenarioSubjectContextRefV1(
    record.subject_context_ref,
    `${path}.subject_context_ref`,
  );
  if (record.known_context_version !== undefined) {
    assertOpaqueVersion(record.known_context_version, `${path}.known_context_version`);
  }
};

export const assertScenarioSubjectContextOptionV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioSubjectContextOptionV1 = (
  value,
  path = "subject_context",
) => {
  const record = assertRecord(value, path);
  assertKeys(record, subjectContextOptionKeys, path);
  assertScenarioSubjectContextRefV1(
    record.subject_context_ref,
    `${path}.subject_context_ref`,
  );
  if (typeof record.scope_kind !== "string" || !subjectScopeKinds.has(record.scope_kind)) {
    fail("invalid_scope_kind", `${path}.scope_kind`, `${path}.scope_kind is invalid`);
  }
  if (typeof record.route_class !== "string" || !subjectRouteClasses.has(record.route_class)) {
    fail("invalid_route_class", `${path}.route_class`, `${path}.route_class is invalid`);
  }
  const expectedRoute = record.scope_kind === "single_subject"
    ? "subject_detail"
    : "subject_collection";
  if (record.route_class !== expectedRoute) {
    fail(
      "scope_route_mismatch",
      `${path}.route_class`,
      `${path}.route_class does not match scope_kind`,
    );
  }
  assertScenarioSafeLabelV1(record.safe_label, `${path}.safe_label`);
  if (record.safe_disambiguation !== undefined) {
    assertScenarioSafeLabelV1(record.safe_disambiguation, `${path}.safe_disambiguation`);
  }
  assertOpaqueVersion(record.context_version, `${path}.context_version`);
  const issuedAt = assertCanonicalInstant(record.issued_at, `${path}.issued_at`);
  const expiresAt = assertCanonicalInstant(record.expires_at, `${path}.expires_at`);
  if (
    expiresAt <= issuedAt ||
    expiresAt - issuedAt > maximumSubjectContextLifetimeMs
  ) {
    fail(
      "invalid_context_lifetime",
      `${path}.expires_at`,
      `${path}.expires_at must be after issued_at and no more than 30 minutes later`,
    );
  }
};

export const assertListScenarioSubjectContextsResultV1: (
  value: unknown,
  path?: string,
) => asserts value is ListScenarioSubjectContextsResultV1 = (
  value,
  path = "list_subject_contexts_result",
) => {
  const record = assertRecord(value, path);
  if (record.status === "resolved") {
    assertKeys(record, listResolvedResultKeys, path);
    assertScenarioSubjectContextOptionV1(record.context, `${path}.context`);
    return;
  }
  if (record.status === "needs_selection") {
    assertKeys(record, listSelectionResultKeys, path);
    if (record.scope_kind !== "unresolved") {
      fail("invalid_scope_kind", `${path}.scope_kind`, "selection scope_kind must be unresolved");
    }
    if (!Array.isArray(record.candidates) || record.candidates.length < 2 || record.candidates.length > 20) {
      fail("invalid_candidates", `${path}.candidates`, "selection requires 2-20 candidates");
    }
    const refs = new Set<string>();
    record.candidates.forEach((candidate, index) => {
      assertScenarioSubjectContextOptionV1(candidate, `${path}.candidates[${index}]`);
      if (refs.has(candidate.subject_context_ref)) {
        fail(
          "duplicate_subject_context_ref",
          `${path}.candidates[${index}].subject_context_ref`,
          "candidate refs must be unique",
        );
      }
      refs.add(candidate.subject_context_ref);
    });
    if (record.next_cursor !== undefined) {
      assertScenarioPresentationCursorV1(record.next_cursor, `${path}.next_cursor`);
    }
    return;
  }
  if (record.status === "unavailable") {
    assertKeys(record, unavailableResultKeys, path);
    assertScenarioSafeReasonV1(record.safe_reason, `${path}.safe_reason`);
    return;
  }
  fail("invalid_list_status", `${path}.status`, `${path}.status is invalid`);
};

export const assertResolveScenarioSubjectContextResultV1: (
  value: unknown,
  path?: string,
) => asserts value is ResolveScenarioSubjectContextResultV1 = (
  value,
  path = "resolve_subject_context_result",
) => {
  const record = assertRecord(value, path);
  if (record.status === "resolved") {
    assertKeys(record, resolveResolvedResultKeys, path);
    assertScenarioSubjectContextOptionV1(record.context, `${path}.context`);
    const resolvedAt = assertCanonicalInstant(record.resolved_at, `${path}.resolved_at`);
    const issuedAt = Date.parse(record.context.issued_at);
    const expiresAt = Date.parse(record.context.expires_at);
    if (resolvedAt < issuedAt || resolvedAt > expiresAt) {
      fail(
        "invalid_resolved_at",
        `${path}.resolved_at`,
        "resolved_at must fall within the newly issued context lifetime",
      );
    }
    return;
  }
  if (record.status === "context_changed" || record.status === "unavailable") {
    assertKeys(record, unavailableResultKeys, path);
    assertScenarioSafeReasonV1(record.safe_reason, `${path}.safe_reason`);
    return;
  }
  fail("invalid_resolve_status", `${path}.status`, `${path}.status is invalid`);
};
