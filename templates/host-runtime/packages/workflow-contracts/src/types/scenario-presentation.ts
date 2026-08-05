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
