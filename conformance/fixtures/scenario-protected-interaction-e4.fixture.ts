import type {
  ReadScenarioProtectedDetailInputV1,
  ReadScenarioProtectedDetailResultV1,
  ScenarioProtectedContentReadLocatorV1,
} from "@host/workflow-contracts";

export const scenarioProtectedContentReadLocatorFixture = {
  protected_read_locator_version: 1,
  protected_content_ref: "RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR",
  content_kind: "example.protected_record",
  issued_at: "2026-08-05T00:00:00.000Z",
  expires_at: "2026-08-05T00:05:00.000Z",
} satisfies ScenarioProtectedContentReadLocatorV1;

export const readScenarioProtectedDetailInputFixture = {
  protected_read_version: 1,
  protected_content_ref: "RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR",
  known_content_version: "committed-version-00",
} satisfies ReadScenarioProtectedDetailInputV1;

export const readScenarioProtectedDetailResultFixture = {
  protected_read_result_version: 1,
  status: "ready",
  protected_content_version: "committed-version-01",
  content_kind: "example.protected_record",
  carrier_binding: {
    carrier_binding_version: 1,
    carrier_scope: "read_output",
    protected_field_key: "example_plain_text",
    keyed_binding_hash: "b".repeat(64),
  },
  display_lease: {
    display_lease_version: 1,
    cache_policy: "no_store",
    issued_at: "2026-08-05T00:02:00.000Z",
    expires_at: "2026-08-05T00:03:00.000Z",
  },
} satisfies ReadScenarioProtectedDetailResultV1;
