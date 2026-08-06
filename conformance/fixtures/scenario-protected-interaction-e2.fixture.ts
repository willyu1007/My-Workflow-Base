import type {
  PrepareScenarioProtectedInteractionInputV1,
  PrepareScenarioProtectedInteractionResultV1,
} from "@host/workflow-contracts";
import { scenarioProtectedPrepareBindingFixture } from "./scenario-protected-interaction-e1.fixture.js";

export const prepareScenarioProtectedInteractionInputFixture = {
  protected_prepare_version: 1,
  action_prepare: {
    prepare_version: 1,
    action_key: "example.record",
    target_ref: "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
    expected_version: "version-01",
    action_input: { example_mode: "neutral" },
  },
  carrier_binding: scenarioProtectedPrepareBindingFixture,
} satisfies PrepareScenarioProtectedInteractionInputV1;

export const prepareScenarioProtectedInteractionResultFixture = {
  protected_prepare_result_version: 1,
  status: "prepared",
  action_result: {
    status: "prepared",
    submit_token: "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
    confirmation: {
      confirmation_class: "explicit",
      prompt: {
        kind: "plain_text",
        value: "Confirm this example action.",
        locale: "en-US",
      },
    },
    issued_at: "2026-08-05T00:00:00.000Z",
    expires_at: "2026-08-05T00:05:00.000Z",
  },
  prepared_content: {
    protected_content_control_version: 1,
    state: "prepared",
    protected_content_ref: "RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR",
    protected_content_version: "prepared-version-01",
    content_kind: "example.protected_record",
    keyed_integrity_hash: "c".repeat(64),
    issued_at: "2026-08-05T00:00:00.000Z",
    expires_at: "2026-08-05T00:05:00.000Z",
  },
} satisfies PrepareScenarioProtectedInteractionResultV1;
