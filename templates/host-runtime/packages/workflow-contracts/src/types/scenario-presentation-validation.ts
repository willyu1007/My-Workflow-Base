import {
  scenarioNarrationPolicies,
  scenarioDefaultPageSizeV1,
  scenarioMaximumPageSizeV1,
  scenarioOfferPriorities,
  scenarioPresentationViewModes,
  scenarioSafeReasonRetryClasses,
  scenarioSubjectRouteClasses,
  scenarioSubjectScopeKinds,
  scenarioTones,
  type ListScenarioSubjectContextsInputV1,
  type ListScenarioSubjectContextsResultV1,
  type PresentScenarioSubjectContextInputV1,
  type ResolveScenarioSubjectContextInputV1,
  type ResolveScenarioSubjectContextResultV1,
  type ScenarioActionOfferV1,
  type ScenarioActionTargetRefV1,
  type ScenarioBadgeV1,
  type ScenarioNarrationPolicyV1,
  type ScenarioPresentationItemRefV1,
  type ScenarioPresentationResultV1,
  type ScenarioSafeTextV1,
  type ScenarioSemanticBlockV1,
  type ScenarioNavigationOfferV1,
  type ScenarioSafeLabelV1,
  type ScenarioSafeReasonV1,
  type ScenarioSemanticPresentationV1,
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
const presentInputKeys = new Set([
  "presentation_version",
  "subject_context_ref",
  "presentation_key",
  "view_query",
]);
const viewQueryKeys = new Set([
  "view_mode",
  "presentation_item_ref",
  "cursor",
  "page_size",
]);
const blockCommonKeys = ["kind", "block_key", "tone", "narration"];
const textBlockKeys = new Set([...blockCommonKeys, "title", "body"]);
const factGroupKeys = new Set([...blockCommonKeys, "title", "facts"]);
const metricGroupKeys = new Set([...blockCommonKeys, "title", "metrics"]);
const itemCollectionKeys = new Set([...blockCommonKeys, "title", "items", "next_cursor"]);
const timelineKeys = new Set([...blockCommonKeys, "title", "entries", "next_cursor"]);
const factKeys = new Set(["fact_key", "label", "value", "tone"]);
const metricKeys = new Set(["metric_key", "label", "value", "tone"]);
const badgeKeys = new Set(["label", "tone"]);
const itemKeys = new Set([
  "item_key",
  "title",
  "summary",
  "badges",
  "occurred_at",
  "presentation_item_ref",
]);
const entryKeys = new Set([
  "entry_key",
  "title",
  "summary",
  "badges",
  "occurred_at",
  "presentation_item_ref",
]);
const navigationOfferKeys = new Set([
  "route_class",
  "label",
  "view_mode",
  "continuation_ref",
  "priority",
  "narration",
]);
const availableActionOfferKeys = new Set([
  "availability",
  "action_key",
  "label",
  "help",
  "target_ref",
  "expected_version",
  "confirmation_class",
  "priority",
  "tone",
  "narration",
]);
const unavailableActionOfferKeys = new Set([
  "availability",
  "action_key",
  "label",
  "safe_reason",
  "priority",
  "tone",
  "narration",
]);
const semanticPresentationKeys = new Set([
  "presentation_version",
  "presentation_key",
  "subject_context_ref",
  "context_version",
  "generated_at",
  "blocks",
  "navigation",
  "actions",
]);
const presentationReadyKeys = new Set(["status", "presentation"]);
const tones = new Set<string>(scenarioTones);
const narrationPolicies = new Set<string>(scenarioNarrationPolicies);
const retryClasses = new Set<string>(scenarioSafeReasonRetryClasses);
const subjectScopeKinds = new Set<string>(scenarioSubjectScopeKinds);
const subjectRouteClasses = new Set<string>(scenarioSubjectRouteClasses);
const presentationViewModes = new Set<string>(scenarioPresentationViewModes);
const offerPriorities = new Set<string>(scenarioOfferPriorities);
const machineKeyPattern = /^[a-z][a-z0-9._:-]{0,127}$/u;
const opaqueLocatorPattern = /^[A-Za-z0-9_-]{32,512}$/u;
const opaqueVersionPattern = /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,199}$/u;
const antiMetricKeyPattern =
  /(?:^|[._:-])(?:rank|ranking|score|trend|comparison|comparative)(?:$|[._:-])/u;
const canonicalInstantPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;
const canonicalLocalePattern =
  /^[a-z]{2,3}(?:-[A-Z][a-z]{3})?(?:-(?:[A-Z]{2}|[0-9]{3}))?(?:-[A-Za-z0-9]{5,8})*$/u;
const controlCharacterPattern = /[\u0000-\u001f\u007f-\u009f]/u;
const htmlPattern = /<\/?[A-Za-z][^>]*>|<!--|-->/u;
const uriSchemePattern = /(?:^|[\s(<{\[])[A-Za-z][A-Za-z0-9+.-]{0,31}:[^\s)\]}>]+/u;
const networkPathPattern = /(?:^|[\s(<{\[])\/\/[^\s)\]}>]+/u;
const emailAddressPattern =
  /\b[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*\b/u;
const bareDomainPattern =
  /\b(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}(?::[0-9]{1,5})?(?:\/[^\s]*)?/u;
const ipv4AddressPattern =
  /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}(?::[0-9]{1,5})?(?:\/[^\s]*)?/u;
const markdownPattern =
  /(?:^|\n)\s{0,3}(?:#{1,6}\s|>\s|[-*+]\s|[0-9]+\.\s)|!?\[[^\]]*\]\([^)]+\)|\*\*|__|~~|`/u;
const unresolvedParameterPattern = /\{\{[^}]*\}\}|\$\{[^}]*\}|\{[A-Za-z][A-Za-z0-9_.-]*\}/u;
const internalDetailPattern =
  /\b(?:stack trace|sqlstate|postgresql?|prisma|database error|provider error|internal exception|internal reason)\b/iu;
const maximumSubjectContextLifetimeMs = 30 * 60 * 1000;
const maximumPresentationBytes = 64 * 1024;

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

const isCanonicalLocale = (value: unknown): value is string => {
  if (typeof value !== "string" || !canonicalLocalePattern.test(value)) return false;
  try {
    return Intl.getCanonicalLocales(value)[0] === value;
  } catch {
    return false;
  }
};

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
    uriSchemePattern.test(text) ||
    networkPathPattern.test(text) ||
    emailAddressPattern.test(text) ||
    bareDomainPattern.test(text) ||
    ipv4AddressPattern.test(text) ||
    markdownPattern.test(text) ||
    unresolvedParameterPattern.test(text) ||
    internalDetailPattern.test(text)
  ) {
    fail("unsafe_safe_text", `${path}.value`, `${path}.value contains unsafe copy`);
  }
  if (!isCanonicalLocale(record.locale)) {
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

const assertPageSize: (
  value: unknown,
  path: string,
) => asserts value is number = (value, path) => {
  if (
    !Number.isInteger(value) ||
    Number(value) < 1 ||
    Number(value) > scenarioMaximumPageSizeV1
  ) {
    fail("invalid_page_size", path, `${path} must be an integer from 1 through 20`);
  }
};

export const resolveScenarioPageSizeV1 = (
  value?: unknown,
  path = "page_size",
): number => {
  const resolved = value === undefined ? scenarioDefaultPageSizeV1 : value;
  assertPageSize(resolved, path);
  return resolved;
};

const assertMachineKey = (value: unknown, path: string) => {
  if (typeof value !== "string" || !machineKeyPattern.test(value)) {
    fail("invalid_machine_key", path, `${path} must be a bounded lowercase machine key`);
  }
};

const assertSafeTitle = (value: unknown, path: string) => assertSafeText(value, path, 120);
const assertSafeSummary = (value: unknown, path: string) => assertSafeText(value, path, 500);

const assertUniqueKeys = (keys: string[], path: string) => {
  const seen = new Set<string>();
  keys.forEach((key, index) => {
    if (seen.has(key)) {
      fail("duplicate_local_key", `${path}[${index}]`, `${path} keys must be unique`);
    }
    seen.add(key);
  });
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
  resolveScenarioPageSizeV1(record.page_size, `${path}.page_size`);
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

const assertActiveSubjectContextOption = (
  value: ScenarioSubjectContextOptionV1,
  currentEpoch: number,
  path: string,
): void => {
  const issuedAt = Date.parse(value.issued_at);
  const expiresAt = Date.parse(value.expires_at);
  if (currentEpoch < issuedAt) {
    fail(
      "subject_context_not_yet_active",
      `${path}.issued_at`,
      `${path} is not active at the supplied current_time`,
    );
  }
  if (currentEpoch >= expiresAt) {
    fail(
      "expired_subject_context",
      `${path}.expires_at`,
      `${path} is expired at the supplied current_time`,
    );
  }
};

export const assertScenarioSubjectContextOptionActiveV1: (
  value: unknown,
  currentTime: unknown,
  path?: string,
) => asserts value is ScenarioSubjectContextOptionV1 = (
  value,
  currentTime,
  path = "subject_context",
) => {
  assertScenarioSubjectContextOptionV1(value, path);
  const currentEpoch = assertCanonicalInstant(currentTime, "current_time");
  assertActiveSubjectContextOption(value, currentEpoch, path);
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

export const assertListScenarioSubjectContextsResultActiveV1: (
  value: unknown,
  currentTime: unknown,
  path?: string,
) => asserts value is ListScenarioSubjectContextsResultV1 = (
  value,
  currentTime,
  path = "list_subject_contexts_result",
) => {
  assertListScenarioSubjectContextsResultV1(value, path);
  const currentEpoch = assertCanonicalInstant(currentTime, "current_time");
  if (value.status === "resolved") {
    assertActiveSubjectContextOption(value.context, currentEpoch, `${path}.context`);
  } else if (value.status === "needs_selection") {
    value.candidates.forEach((candidate, index) => {
      assertActiveSubjectContextOption(
        candidate,
        currentEpoch,
        `${path}.candidates[${index}]`,
      );
    });
  }
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

export const assertResolveScenarioSubjectContextResultActiveV1: (
  value: unknown,
  currentTime: unknown,
  path?: string,
) => asserts value is ResolveScenarioSubjectContextResultV1 = (
  value,
  currentTime,
  path = "resolve_subject_context_result",
) => {
  assertResolveScenarioSubjectContextResultV1(value, path);
  const currentEpoch = assertCanonicalInstant(currentTime, "current_time");
  if (value.status !== "resolved") return;
  assertActiveSubjectContextOption(value.context, currentEpoch, `${path}.context`);
  if (Date.parse(value.resolved_at) > currentEpoch) {
    fail(
      "future_resolved_at",
      `${path}.resolved_at`,
      `${path}.resolved_at cannot be after the supplied current_time`,
    );
  }
};

export const assertPresentScenarioSubjectContextInputV1: (
  value: unknown,
  path?: string,
) => asserts value is PresentScenarioSubjectContextInputV1 = (
  value,
  path = "present_subject_context_input",
) => {
  const record = assertRecord(value, path);
  assertKeys(record, presentInputKeys, path);
  if (record.presentation_version !== 1) {
    fail(
      "invalid_presentation_version",
      `${path}.presentation_version`,
      "presentation_version must be 1",
    );
  }
  assertScenarioSubjectContextRefV1(
    record.subject_context_ref,
    `${path}.subject_context_ref`,
  );
  assertMachineKey(record.presentation_key, `${path}.presentation_key`);
  if (record.view_query !== undefined) {
    const query = assertRecord(record.view_query, `${path}.view_query`);
    assertKeys(query, viewQueryKeys, `${path}.view_query`);
    if (typeof query.view_mode !== "string" || !presentationViewModes.has(query.view_mode)) {
      fail("invalid_view_mode", `${path}.view_query.view_mode`, "view_mode is invalid");
    }
    if (query.presentation_item_ref !== undefined) {
      assertScenarioPresentationItemRefV1(
        query.presentation_item_ref,
        `${path}.view_query.presentation_item_ref`,
      );
    }
    if (query.cursor !== undefined) {
      assertScenarioPresentationCursorV1(query.cursor, `${path}.view_query.cursor`);
    }
    resolveScenarioPageSizeV1(query.page_size, `${path}.view_query.page_size`);
  }
};

const assertScenarioBadgeV1: (
  value: unknown,
  path: string,
) => asserts value is ScenarioBadgeV1 = (value, path) => {
  const record = assertRecord(value, path);
  assertKeys(record, badgeKeys, path);
  assertScenarioSafeLabelV1(record.label, `${path}.label`);
  assertScenarioToneV1(record.tone, `${path}.tone`);
};

export const assertScenarioSemanticBlockV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioSemanticBlockV1 = (value, path = "block") => {
  const record = assertRecord(value, path);
  assertMachineKey(record.block_key, `${path}.block_key`);
  assertScenarioToneV1(record.tone, `${path}.tone`);
  assertScenarioNarrationPolicyV1(record.narration, `${path}.narration`);
  if (record.kind === "summary" || record.kind === "notice") {
    assertKeys(record, textBlockKeys, path);
    if (record.title !== undefined) assertSafeTitle(record.title, `${path}.title`);
    assertSafeSummary(record.body, `${path}.body`);
    return;
  }
  if (record.kind === "fact_group" || record.kind === "metric_group") {
    const rowsKey = record.kind === "fact_group" ? "facts" : "metrics";
    assertKeys(record, record.kind === "fact_group" ? factGroupKeys : metricGroupKeys, path);
    if (record.title !== undefined) assertSafeTitle(record.title, `${path}.title`);
    const rows = record[rowsKey];
    if (!Array.isArray(rows) || rows.length > 20) {
      fail("invalid_block_rows", `${path}.${rowsKey}`, `${rowsKey} must contain at most 20 rows`);
    }
    const localKeys: string[] = [];
    rows.forEach((row, index) => {
      const rowPath = `${path}.${rowsKey}[${index}]`;
      const rowRecord = assertRecord(row, rowPath);
      const keyName = record.kind === "fact_group" ? "fact_key" : "metric_key";
      assertKeys(rowRecord, record.kind === "fact_group" ? factKeys : metricKeys, rowPath);
      assertMachineKey(rowRecord[keyName], `${rowPath}.${keyName}`);
      if (
        record.kind === "metric_group" &&
        typeof rowRecord.metric_key === "string" &&
        antiMetricKeyPattern.test(rowRecord.metric_key)
      ) {
        fail(
          "anti_metric_key",
          `${rowPath}.metric_key`,
          "metric_key cannot encode ranking, score, trend, or comparison semantics",
        );
      }
      localKeys.push(String(rowRecord[keyName]));
      assertScenarioSafeLabelV1(rowRecord.label, `${rowPath}.label`);
      assertSafeSummary(rowRecord.value, `${rowPath}.value`);
      assertScenarioToneV1(rowRecord.tone, `${rowPath}.tone`);
    });
    assertUniqueKeys(localKeys, `${path}.${rowsKey}`);
    return;
  }
  if (record.kind === "item_collection" || record.kind === "timeline") {
    const rowsKey = record.kind === "item_collection" ? "items" : "entries";
    assertKeys(record, record.kind === "item_collection" ? itemCollectionKeys : timelineKeys, path);
    if (record.title !== undefined) assertSafeTitle(record.title, `${path}.title`);
    const rows = record[rowsKey];
    if (!Array.isArray(rows) || rows.length > 20) {
      fail("invalid_block_rows", `${path}.${rowsKey}`, `${rowsKey} must contain at most 20 rows`);
    }
    const localKeys: string[] = [];
    rows.forEach((row, index) => {
      const rowPath = `${path}.${rowsKey}[${index}]`;
      const rowRecord = assertRecord(row, rowPath);
      const keyName = record.kind === "item_collection" ? "item_key" : "entry_key";
      assertKeys(rowRecord, record.kind === "item_collection" ? itemKeys : entryKeys, rowPath);
      assertMachineKey(rowRecord[keyName], `${rowPath}.${keyName}`);
      localKeys.push(String(rowRecord[keyName]));
      assertSafeTitle(rowRecord.title, `${rowPath}.title`);
      if (rowRecord.summary !== undefined) {
        assertSafeSummary(rowRecord.summary, `${rowPath}.summary`);
      }
      if (!Array.isArray(rowRecord.badges)) {
        fail("invalid_badges", `${rowPath}.badges`, "badges must be an array");
      }
      rowRecord.badges.forEach((badge, badgeIndex) => {
        assertScenarioBadgeV1(badge, `${rowPath}.badges[${badgeIndex}]`);
      });
      if (record.kind === "timeline" && rowRecord.occurred_at === undefined) {
        fail("missing_occurred_at", `${rowPath}.occurred_at`, "timeline occurred_at is required");
      }
      if (rowRecord.occurred_at !== undefined) {
        assertCanonicalInstant(rowRecord.occurred_at, `${rowPath}.occurred_at`);
      }
      if (rowRecord.presentation_item_ref !== undefined) {
        assertScenarioPresentationItemRefV1(
          rowRecord.presentation_item_ref,
          `${rowPath}.presentation_item_ref`,
        );
      }
    });
    assertUniqueKeys(localKeys, `${path}.${rowsKey}`);
    if (record.next_cursor !== undefined) {
      assertScenarioPresentationCursorV1(record.next_cursor, `${path}.next_cursor`);
    }
    return;
  }
  fail("invalid_block_kind", `${path}.kind`, `${path}.kind is invalid`);
};

export const assertScenarioNavigationOfferV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioNavigationOfferV1 = (value, path = "navigation_offer") => {
  const record = assertRecord(value, path);
  assertKeys(record, navigationOfferKeys, path);
  assertMachineKey(record.route_class, `${path}.route_class`);
  assertScenarioSafeLabelV1(record.label, `${path}.label`);
  if (record.view_mode !== undefined && (
    typeof record.view_mode !== "string" || !presentationViewModes.has(record.view_mode)
  )) {
    fail("invalid_view_mode", `${path}.view_mode`, `${path}.view_mode is invalid`);
  }
  if (record.continuation_ref !== undefined) {
    assertScenarioContinuationRefV1(record.continuation_ref, `${path}.continuation_ref`);
  }
  if (typeof record.priority !== "string" || !offerPriorities.has(record.priority)) {
    fail("invalid_priority", `${path}.priority`, `${path}.priority is invalid`);
  }
  assertScenarioNarrationPolicyV1(record.narration, `${path}.narration`);
};

export const assertScenarioActionOfferV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioActionOfferV1 = (value, path = "action_offer") => {
  const record = assertRecord(value, path);
  if (record.availability === "available") {
    assertKeys(record, availableActionOfferKeys, path);
    assertScenarioActionTargetRefV1(record.target_ref, `${path}.target_ref`);
    if (record.expected_version !== undefined) {
      assertOpaqueVersion(record.expected_version, `${path}.expected_version`);
    }
    if (record.confirmation_class !== "explicit" && record.confirmation_class !== "strong_authorization") {
      fail(
        "invalid_confirmation_class",
        `${path}.confirmation_class`,
        `${path}.confirmation_class is invalid`,
      );
    }
    if (record.help !== undefined) assertSafeText(record.help, `${path}.help`, 240);
  } else if (record.availability === "unavailable") {
    assertKeys(record, unavailableActionOfferKeys, path);
    assertScenarioSafeReasonV1(record.safe_reason, `${path}.safe_reason`);
  } else {
    fail("invalid_availability", `${path}.availability`, `${path}.availability is invalid`);
  }
  assertMachineKey(record.action_key, `${path}.action_key`);
  assertScenarioSafeLabelV1(record.label, `${path}.label`);
  if (typeof record.priority !== "string" || !offerPriorities.has(record.priority)) {
    fail("invalid_priority", `${path}.priority`, `${path}.priority is invalid`);
  }
  assertScenarioToneV1(record.tone, `${path}.tone`);
  assertScenarioNarrationPolicyV1(record.narration, `${path}.narration`);
};

export const assertScenarioSemanticPresentationV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioSemanticPresentationV1 = (
  value,
  path = "presentation",
) => {
  const record = assertRecord(value, path);
  assertKeys(record, semanticPresentationKeys, path);
  if (record.presentation_version !== 1) {
    fail(
      "invalid_presentation_version",
      `${path}.presentation_version`,
      "presentation_version must be 1",
    );
  }
  assertMachineKey(record.presentation_key, `${path}.presentation_key`);
  assertScenarioSubjectContextRefV1(
    record.subject_context_ref,
    `${path}.subject_context_ref`,
  );
  assertOpaqueVersion(record.context_version, `${path}.context_version`);
  assertCanonicalInstant(record.generated_at, `${path}.generated_at`);
  if (!Array.isArray(record.blocks) || record.blocks.length > 20) {
    fail("invalid_blocks", `${path}.blocks`, "blocks must contain at most 20 entries");
  }
  const responseLocalItemKeys: string[] = [];
  record.blocks.forEach((block, index) => {
    assertScenarioSemanticBlockV1(block, `${path}.blocks[${index}]`);
    if (block.kind === "item_collection") {
      block.items.forEach((item) => responseLocalItemKeys.push(item.item_key));
    } else if (block.kind === "timeline") {
      block.entries.forEach((entry) => responseLocalItemKeys.push(entry.entry_key));
    }
  });
  assertUniqueKeys(record.blocks.map((block) => block.block_key), `${path}.blocks`);
  assertUniqueKeys(responseLocalItemKeys, `${path}.response_local_items`);
  if (!Array.isArray(record.navigation) || record.navigation.length > 8) {
    fail("invalid_navigation", `${path}.navigation`, "navigation must contain at most 8 offers");
  }
  record.navigation.forEach((offer, index) => {
    assertScenarioNavigationOfferV1(offer, `${path}.navigation[${index}]`);
  });
  if (!Array.isArray(record.actions) || record.actions.length > 8) {
    fail("invalid_actions", `${path}.actions`, "actions must contain at most 8 offers");
  }
  record.actions.forEach((offer, index) => {
    assertScenarioActionOfferV1(offer, `${path}.actions[${index}]`);
  });
  assertUniqueKeys(record.actions.map((offer) => offer.action_key), `${path}.actions`);
  const bytes = new TextEncoder().encode(JSON.stringify(record)).byteLength;
  if (bytes > maximumPresentationBytes) {
    fail("presentation_too_large", path, `${path} exceeds 64 KiB UTF-8`);
  }
};

export const assertScenarioPresentationResultV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioPresentationResultV1 = (
  value,
  path = "presentation_result",
) => {
  const record = assertRecord(value, path);
  if (record.status === "ready" || record.status === "empty") {
    assertKeys(record, presentationReadyKeys, path);
    assertScenarioSemanticPresentationV1(record.presentation, `${path}.presentation`);
  } else if (record.status === "context_changed" || record.status === "unavailable") {
    assertKeys(record, unavailableResultKeys, path);
    assertScenarioSafeReasonV1(record.safe_reason, `${path}.safe_reason`);
  } else {
    fail("invalid_presentation_status", `${path}.status`, `${path}.status is invalid`);
  }
  const bytes = new TextEncoder().encode(JSON.stringify(record)).byteLength;
  if (bytes > maximumPresentationBytes) {
    fail("presentation_too_large", path, `${path} exceeds 64 KiB UTF-8`);
  }
};

export const assertPresentScenarioSubjectContextExchangeV1 = (
  input: unknown,
  result: unknown,
): void => {
  assertPresentScenarioSubjectContextInputV1(input, "input");
  assertScenarioPresentationResultV1(result, "result");
  if (result.status !== "ready" && result.status !== "empty") return;
  if (result.presentation.subject_context_ref !== input.subject_context_ref) {
    fail(
      "subject_context_mismatch",
      "result.presentation.subject_context_ref",
      "presentation subject_context_ref must match the request",
    );
  }
  if (result.presentation.presentation_key !== input.presentation_key) {
    fail(
      "presentation_key_mismatch",
      "result.presentation.presentation_key",
      "presentation_key must match the request",
    );
  }
};

const copySafeText = (value: ScenarioSafeTextV1): ScenarioSafeTextV1 => ({
  kind: value.kind,
  value: value.value,
  locale: value.locale,
});

/** Derived AI input. It returns safe text only and is not a wire or persisted DTO. */
export const projectScenarioNarrationTextV1 = (
  presentation: ScenarioSemanticPresentationV1,
): readonly ScenarioSafeTextV1[] => {
  assertScenarioSemanticPresentationV1(presentation);
  const result: ScenarioSafeTextV1[] = [];
  const add = (value: ScenarioSafeTextV1 | undefined) => {
    if (value) result.push(copySafeText(value));
  };
  for (const block of presentation.blocks) {
    if (block.narration !== "allowed") continue;
    add(block.title);
    if (block.kind === "summary" || block.kind === "notice") {
      add(block.body);
    } else if (block.kind === "fact_group") {
      block.facts.forEach((fact) => { add(fact.label); add(fact.value); });
    } else if (block.kind === "metric_group") {
      block.metrics.forEach((metric) => { add(metric.label); add(metric.value); });
    } else if (block.kind === "item_collection") {
      block.items.forEach((item) => {
        add(item.title);
        add(item.summary);
        item.badges.forEach((badge) => add(badge.label));
      });
    } else if (block.kind === "timeline") {
      block.entries.forEach((entry) => {
        add(entry.title);
        add(entry.summary);
        entry.badges.forEach((badge) => add(badge.label));
      });
    }
  }
  presentation.navigation
    .filter((offer) => offer.narration === "allowed")
    .forEach((offer) => add(offer.label));
  presentation.actions
    .filter((offer) => offer.narration === "allowed")
    .forEach((offer) => {
      add(offer.label);
      if (offer.availability === "available") {
        add(offer.help);
      } else {
        add(offer.safe_reason.message);
        add(offer.safe_reason.help);
      }
    });
  return result;
};
