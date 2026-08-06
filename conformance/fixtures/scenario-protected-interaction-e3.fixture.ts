import type { ScenarioCommittedProtectedContentControlV1 } from "@host/workflow-contracts";

export const scenarioCommittedProtectedContentControlFixture = {
  protected_content_control_version: 1,
  state: "committed",
  protected_content_ref: "RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR",
  prepared_content_version: "prepared-version-01",
  committed_content_version: "committed-version-01",
  content_kind: "example.protected_record",
  keyed_integrity_hash: "c".repeat(64),
  committed_at: "2026-08-05T00:02:30.000Z",
} satisfies ScenarioCommittedProtectedContentControlV1;
