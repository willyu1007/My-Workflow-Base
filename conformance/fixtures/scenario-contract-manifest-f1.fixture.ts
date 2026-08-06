import type { ScenarioContractManifestV1 } from "@host/workflow-contracts";

export const scenarioContractManifestF1Fixture = {
  scenario_contracts_version: 1,
  source_dependencies: [
    {
      source_identity: "scenario_interface_source_v1",
      source_hash: "fedcba9876543210".repeat(4),
    },
  ],
  capability_dependencies: [
    {
      capability_key: "trusted_scenario_invocation_v1",
      requires_capabilities: [],
      requires_sources: ["scenario_interface_source_v1"],
    },
  ],
} satisfies ScenarioContractManifestV1;
