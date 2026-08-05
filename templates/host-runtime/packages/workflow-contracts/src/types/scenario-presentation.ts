export const scenarioTones = [
  "neutral",
  "informational",
  "positive",
  "warning",
  "critical",
] as const;
export type ScenarioToneV1 = (typeof scenarioTones)[number];

export const scenarioNarrationPolicies = ["allowed", "display_only"] as const;
export type ScenarioNarrationPolicyV1 = (typeof scenarioNarrationPolicies)[number];

export const scenarioSafeReasonRetryClasses = [
  "none",
  "refresh",
  "retry_later",
  "contact_support",
] as const;
export type ScenarioSafeReasonRetryClassV1 =
  (typeof scenarioSafeReasonRetryClasses)[number];

export type ScenarioSafeTextV1 = {
  kind: "plain_text";
  value: string;
  locale: string;
};

export type ScenarioSafeLabelV1 = ScenarioSafeTextV1;

export type ScenarioSafeReasonV1 = {
  reason_code: string;
  message: ScenarioSafeTextV1;
  help?: ScenarioSafeTextV1;
  retry_class: ScenarioSafeReasonRetryClassV1;
};

/** Owner-issued locator. It carries no canonical identity or authorization. */
export type ScenarioSubjectContextRefV1 = string;

/** Owner-issued read locator. It is not an action target. */
export type ScenarioPresentationItemRefV1 = string;

/** Owner-issued prepare locator. It is never submit authority. */
export type ScenarioActionTargetRefV1 = string;

export const scenarioSubjectScopeKinds = ["single_subject", "subject_collection"] as const;
export type ScenarioSubjectScopeKindV1 = (typeof scenarioSubjectScopeKinds)[number];

export const scenarioSubjectRouteClasses = ["subject_detail", "subject_collection"] as const;
export type ScenarioSubjectRouteClassV1 = (typeof scenarioSubjectRouteClasses)[number];

export type ListScenarioSubjectContextsInputV1 = {
  provider_version: 1;
  cursor?: string;
  page_size?: number;
};

export type ResolveScenarioSubjectContextInputV1 = {
  provider_version: 1;
  subject_context_ref: ScenarioSubjectContextRefV1;
  known_context_version?: string;
};

export type ScenarioSubjectContextOptionV1 = {
  subject_context_ref: ScenarioSubjectContextRefV1;
  scope_kind: ScenarioSubjectScopeKindV1;
  route_class: ScenarioSubjectRouteClassV1;
  safe_label: ScenarioSafeLabelV1;
  safe_disambiguation?: ScenarioSafeLabelV1;
  context_version: string;
  issued_at: string;
  expires_at: string;
};

export type ListScenarioSubjectContextsResultV1 =
  | { status: "resolved"; context: ScenarioSubjectContextOptionV1 }
  | {
      status: "needs_selection";
      scope_kind: "unresolved";
      candidates: ScenarioSubjectContextOptionV1[];
      next_cursor?: string;
    }
  | { status: "unavailable"; safe_reason: ScenarioSafeReasonV1 };

export type ResolveScenarioSubjectContextResultV1 =
  | {
      status: "resolved";
      context: ScenarioSubjectContextOptionV1;
      resolved_at: string;
    }
  | { status: "context_changed"; safe_reason: ScenarioSafeReasonV1 }
  | { status: "unavailable"; safe_reason: ScenarioSafeReasonV1 };
