import type {
  ScenarioActionTargetRefV1,
  ScenarioPresentationItemRefV1,
  ScenarioSafeReasonV1,
  ScenarioSafeTextV1,
  ScenarioSubjectContextRefV1,
} from "@host/workflow-contracts";

export const scenarioSafeTextFixture = {
  kind: "plain_text",
  value: "Current information is ready.",
  locale: "en-US",
} satisfies ScenarioSafeTextV1;

export const scenarioSafeReasonFixture = {
  reason_code: "example_temporarily_unavailable",
  message: {
    kind: "plain_text",
    value: "This view is temporarily unavailable.",
    locale: "en-US",
  },
  help: {
    kind: "plain_text",
    value: "Try again later.",
    locale: "en-US",
  },
  retry_class: "retry_later",
} satisfies ScenarioSafeReasonV1;

export const scenarioSubjectContextRefFixture =
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" satisfies ScenarioSubjectContextRefV1;
export const scenarioPresentationItemRefFixture =
  "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB" satisfies ScenarioPresentationItemRefV1;
export const scenarioActionTargetRefFixture =
  "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC" satisfies ScenarioActionTargetRefV1;
