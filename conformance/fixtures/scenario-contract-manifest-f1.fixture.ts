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
  trusted_invocation: {
    trusted_invocation_version: 1,
    invocation_contract: "scenario-private-invocation-v1",
    operations: [
      {
        endpoint_key: "example.refresh_context",
        method: "POST",
        operation_key: "refresh_scenario_context",
        input_schema_key: "example.refresh_context.input",
        input_schema_version: 1,
        handler_key: "example.refresh_context.handler",
        ingress: [
          {
            ingress_category: "host_transition",
            ingress_key: "example.refresh_context",
            principal_origins: ["interactive_session"],
          },
        ],
      },
    ],
  },
  subject_context_providers: [],
  semantic_presentations: [],
  product_surfaces: [],
  domain_action_contracts: [],
  protected_interaction_contracts: [],
} satisfies ScenarioContractManifestV1;
