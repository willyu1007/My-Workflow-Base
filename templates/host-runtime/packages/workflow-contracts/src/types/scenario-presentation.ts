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

export const scenarioDefaultPageSizeV1 = 10;
export const scenarioMaximumPageSizeV1 = 20;

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

export const scenarioPresentationViewModes = ["current", "recent", "history"] as const;
export type ScenarioPresentationViewModeV1 = (typeof scenarioPresentationViewModes)[number];

export const scenarioOfferPriorities = ["primary", "secondary", "tertiary"] as const;
export type ScenarioOfferPriorityV1 = (typeof scenarioOfferPriorities)[number];

export type PresentScenarioSubjectContextInputV1 = {
  presentation_version: 1;
  subject_context_ref: ScenarioSubjectContextRefV1;
  presentation_key: string;
  view_query?: {
    view_mode: ScenarioPresentationViewModeV1;
    presentation_item_ref?: ScenarioPresentationItemRefV1;
    cursor?: string;
    page_size?: number;
  };
};

export type ScenarioSemanticBlockBaseV1 = {
  block_key: string;
  tone: ScenarioToneV1;
  narration: ScenarioNarrationPolicyV1;
};

export type ScenarioBadgeV1 = {
  label: ScenarioSafeTextV1;
  tone: ScenarioToneV1;
};

export type ScenarioSemanticBlockV1 =
  | (ScenarioSemanticBlockBaseV1 & {
      kind: "summary" | "notice";
      title?: ScenarioSafeTextV1;
      body: ScenarioSafeTextV1;
    })
  | (ScenarioSemanticBlockBaseV1 & {
      kind: "fact_group";
      title?: ScenarioSafeTextV1;
      facts: Array<{
        fact_key: string;
        label: ScenarioSafeTextV1;
        value: ScenarioSafeTextV1;
        tone: ScenarioToneV1;
      }>;
    })
  | (ScenarioSemanticBlockBaseV1 & {
      kind: "metric_group";
      title?: ScenarioSafeTextV1;
      metrics: Array<{
        metric_key: string;
        label: ScenarioSafeTextV1;
        value: ScenarioSafeTextV1;
        tone: ScenarioToneV1;
      }>;
    })
  | (ScenarioSemanticBlockBaseV1 & {
      kind: "item_collection";
      title?: ScenarioSafeTextV1;
      items: Array<{
        item_key: string;
        title: ScenarioSafeTextV1;
        summary?: ScenarioSafeTextV1;
        badges: ScenarioBadgeV1[];
        occurred_at?: string;
        presentation_item_ref?: ScenarioPresentationItemRefV1;
      }>;
      next_cursor?: string;
    })
  | (ScenarioSemanticBlockBaseV1 & {
      kind: "timeline";
      title?: ScenarioSafeTextV1;
      entries: Array<{
        entry_key: string;
        title: ScenarioSafeTextV1;
        summary?: ScenarioSafeTextV1;
        badges: ScenarioBadgeV1[];
        occurred_at: string;
        presentation_item_ref?: ScenarioPresentationItemRefV1;
      }>;
      next_cursor?: string;
    });

export type ScenarioNavigationOfferV1 = {
  route_class: string;
  label: ScenarioSafeTextV1;
  view_mode?: ScenarioPresentationViewModeV1;
  continuation_ref?: string;
  priority: ScenarioOfferPriorityV1;
  narration: ScenarioNarrationPolicyV1;
};

export type ScenarioActionOfferV1 =
  | {
      availability: "available";
      action_key: string;
      label: ScenarioSafeTextV1;
      help?: ScenarioSafeTextV1;
      target_ref: ScenarioActionTargetRefV1;
      expected_version?: string;
      confirmation_class: "explicit" | "strong_authorization";
      priority: ScenarioOfferPriorityV1;
      tone: ScenarioToneV1;
      narration: ScenarioNarrationPolicyV1;
    }
  | {
      availability: "unavailable";
      action_key: string;
      label: ScenarioSafeTextV1;
      safe_reason: ScenarioSafeReasonV1;
      priority: ScenarioOfferPriorityV1;
      tone: ScenarioToneV1;
      narration: ScenarioNarrationPolicyV1;
    };

export type ScenarioSemanticPresentationV1 = {
  presentation_version: 1;
  presentation_key: string;
  subject_context_ref: ScenarioSubjectContextRefV1;
  context_version: string;
  generated_at: string;
  blocks: ScenarioSemanticBlockV1[];
  navigation: ScenarioNavigationOfferV1[];
  actions: ScenarioActionOfferV1[];
};

export type ScenarioPresentationResultV1 =
  | { status: "ready"; presentation: ScenarioSemanticPresentationV1 }
  | { status: "empty"; presentation: ScenarioSemanticPresentationV1 }
  | { status: "context_changed"; safe_reason: ScenarioSafeReasonV1 }
  | { status: "unavailable"; safe_reason: ScenarioSafeReasonV1 };
