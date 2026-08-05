import type {
  ListScenarioSubjectContextsInputV1,
  ListScenarioSubjectContextsResultV1,
  ResolveScenarioSubjectContextInputV1,
  ResolveScenarioSubjectContextResultV1,
  ScenarioSubjectContextOptionV1,
} from "@host/workflow-contracts";

const text = (value: string) => ({ kind: "plain_text" as const, value, locale: "en-US" });

export const scenarioSubjectContextOptionsFixture = [
  {
    subject_context_ref: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
    scope_kind: "single_subject",
    route_class: "subject_detail",
    safe_label: text("Example A"),
    safe_disambiguation: text("Current scope"),
    context_version: "context-version-1",
    issued_at: "2026-08-05T10:00:00.000Z",
    expires_at: "2026-08-05T10:30:00.000Z",
  },
  {
    subject_context_ref: "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
    scope_kind: "subject_collection",
    route_class: "subject_collection",
    safe_label: text("Example collection"),
    context_version: "context-version-2",
    issued_at: "2026-08-05T10:00:00.000Z",
    expires_at: "2026-08-05T10:29:59.000Z",
  },
] satisfies ScenarioSubjectContextOptionV1[];

export const listScenarioSubjectContextsInputFixture = {
  provider_version: 1,
  cursor: "HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH",
  page_size: 10,
} satisfies ListScenarioSubjectContextsInputV1;

export const resolveScenarioSubjectContextInputFixture = {
  provider_version: 1,
  subject_context_ref: scenarioSubjectContextOptionsFixture[0].subject_context_ref,
  known_context_version: "context-version-0",
} satisfies ResolveScenarioSubjectContextInputV1;

const unavailable = {
  status: "unavailable" as const,
  safe_reason: {
    reason_code: "example_unavailable",
    message: text("This context is unavailable."),
    retry_class: "refresh" as const,
  },
};

export const listScenarioSubjectContextsResultFixtures = [
  { status: "resolved", context: scenarioSubjectContextOptionsFixture[0] },
  {
    status: "needs_selection",
    scope_kind: "unresolved",
    candidates: scenarioSubjectContextOptionsFixture,
    next_cursor: "IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII",
  },
  unavailable,
] satisfies ListScenarioSubjectContextsResultV1[];

export const resolveScenarioSubjectContextResultFixtures = [
  {
    status: "resolved",
    context: scenarioSubjectContextOptionsFixture[0],
    resolved_at: "2026-08-05T10:00:01.000Z",
  },
  {
    status: "context_changed",
    safe_reason: {
      reason_code: "example_context_changed",
      message: text("The current context changed."),
      retry_class: "refresh",
    },
  },
  unavailable,
] satisfies ResolveScenarioSubjectContextResultV1[];
