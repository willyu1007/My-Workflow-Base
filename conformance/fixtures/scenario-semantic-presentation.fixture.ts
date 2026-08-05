import type {
  PresentScenarioSubjectContextInputV1,
  ScenarioPresentationResultV1,
  ScenarioSemanticPresentationV1,
} from "@host/workflow-contracts";

const text = (value: string) => ({ kind: "plain_text" as const, value, locale: "en-US" });

export const presentScenarioSubjectContextInputFixture = {
  presentation_version: 1,
  subject_context_ref: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
  presentation_key: "example.current",
  view_query: {
    view_mode: "recent",
    presentation_item_ref: "KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK",
    cursor: "LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL",
    page_size: 10,
  },
} satisfies PresentScenarioSubjectContextInputV1;

export const scenarioSemanticPresentationFixture = {
  presentation_version: 1,
  presentation_key: "example.current",
  subject_context_ref: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
  context_version: "context-version-3",
  generated_at: "2026-08-05T10:05:00.000Z",
  blocks: [
    {
      kind: "summary",
      block_key: "summary.main",
      tone: "informational",
      narration: "allowed",
      title: text("Current summary"),
      body: text("The current view is ready."),
    },
    {
      kind: "notice",
      block_key: "notice.display",
      tone: "warning",
      narration: "display_only",
      body: text("Display this notice only."),
    },
    {
      kind: "fact_group",
      block_key: "facts.main",
      tone: "neutral",
      narration: "allowed",
      facts: [
        {
          fact_key: "fact.state",
          label: text("State"),
          value: text("Ready"),
          tone: "positive",
        },
      ],
    },
    {
      kind: "metric_group",
      block_key: "metrics.display",
      tone: "neutral",
      narration: "display_only",
      metrics: [
        {
          metric_key: "metric.total",
          label: text("Total"),
          value: text("2"),
          tone: "neutral",
        },
      ],
    },
    {
      kind: "item_collection",
      block_key: "items.main",
      tone: "neutral",
      narration: "allowed",
      items: [
        {
          item_key: "item.first",
          title: text("First item"),
          summary: text("Current item summary."),
          badges: [{ label: text("Current"), tone: "positive" }],
          occurred_at: "2026-08-05T10:01:00.000Z",
          presentation_item_ref: "MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM",
        },
      ],
      next_cursor: "NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN",
    },
    {
      kind: "timeline",
      block_key: "timeline.main",
      tone: "neutral",
      narration: "allowed",
      entries: [
        {
          entry_key: "entry.first",
          title: text("First event"),
          badges: [],
          occurred_at: "2026-08-05T10:02:00.000Z",
          presentation_item_ref: "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO",
        },
      ],
    },
  ],
  navigation: [
    {
      route_class: "example.history",
      label: text("Open history"),
      view_mode: "history",
      continuation_ref: "PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP",
      priority: "secondary",
      narration: "allowed",
    },
    {
      route_class: "example.detail",
      label: text("Display-only detail"),
      priority: "tertiary",
      narration: "display_only",
    },
  ],
  actions: [
    {
      availability: "available",
      action_key: "example_review",
      label: text("Review"),
      help: text("Review the current item."),
      target_ref: "QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ",
      expected_version: "target-version-1",
      confirmation_class: "explicit",
      priority: "primary",
      tone: "informational",
      narration: "allowed",
    },
    {
      availability: "unavailable",
      action_key: "example_archive",
      label: text("Archive"),
      safe_reason: {
        reason_code: "example_unavailable",
        message: text("This action is unavailable."),
        retry_class: "refresh",
      },
      priority: "secondary",
      tone: "neutral",
      narration: "allowed",
    },
  ],
} satisfies ScenarioSemanticPresentationV1;

export const scenarioPresentationResultFixtures = [
  { status: "ready", presentation: scenarioSemanticPresentationFixture },
  {
    status: "empty",
    presentation: {
      ...scenarioSemanticPresentationFixture,
      blocks: [
        {
          kind: "notice",
          block_key: "empty.main",
          tone: "neutral",
          narration: "allowed",
          body: text("No current information is available."),
        },
      ],
      navigation: [],
      actions: [],
    },
  },
  {
    status: "context_changed",
    safe_reason: {
      reason_code: "example_context_changed",
      message: text("The current context changed."),
      retry_class: "refresh",
    },
  },
  {
    status: "unavailable",
    safe_reason: {
      reason_code: "example_unavailable",
      message: text("This presentation is unavailable."),
      retry_class: "retry_later",
    },
  },
] satisfies ScenarioPresentationResultV1[];
