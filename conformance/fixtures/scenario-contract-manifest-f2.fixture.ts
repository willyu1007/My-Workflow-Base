import type { ScenarioContractManifestV1 } from "@host/workflow-contracts";

export const scenarioContractManifestF2Fixture = {
  scenario_contracts_version: 1,
  source_dependencies: [
    {
      source_identity: "platform_child_family_identity_source_v1",
      source_hash: "0123456789abcdef".repeat(4),
    },
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
    {
      capability_key: "scenario_subject_presentation_v1",
      requires_capabilities: ["trusted_scenario_invocation_v1"],
      requires_sources: [
        "platform_child_family_identity_source_v1",
        "scenario_interface_source_v1",
      ],
    },
  ],
  trusted_invocation: {
    trusted_invocation_version: 1,
    invocation_contract: "scenario-private-invocation-v1",
    operations: [
      {
        endpoint_key: "example.list_subject_contexts",
        method: "POST",
        operation_key: "list_subject_contexts",
        input_schema_key: "example.list_subject_contexts.input",
        input_schema_version: 1,
        handler_key: "example.list_subject_contexts.handler",
        ingress: [{
          ingress_category: "product_surface",
          ingress_key: "example.dashboard",
          principal_origins: ["interactive_session"],
        }],
      },
      {
        endpoint_key: "example.resolve_subject_context",
        method: "POST",
        operation_key: "resolve_subject_context",
        input_schema_key: "example.resolve_subject_context.input",
        input_schema_version: 1,
        handler_key: "example.resolve_subject_context.handler",
        ingress: [{
          ingress_category: "product_surface",
          ingress_key: "example.dashboard",
          principal_origins: ["interactive_session"],
        }],
      },
      {
        endpoint_key: "example.present_subject_context",
        method: "POST",
        operation_key: "present_subject_context",
        input_schema_key: "example.present_subject_context.input",
        input_schema_version: 1,
        handler_key: "example.present_subject_context.handler",
        ingress: [{
          ingress_category: "product_surface",
          ingress_key: "example.dashboard",
          principal_origins: ["interactive_session"],
        }],
      },
    ],
  },
  subject_context_providers: [{
    provider_key: "example.subject_contexts",
    provider_version: 1,
    list_operation_key: "list_subject_contexts",
    resolve_operation_key: "resolve_subject_context",
    handler_key: "example.subject_contexts.handler",
  }],
  semantic_presentations: [{
    presentation_key: "example.subject_summary",
    presentation_version: 1,
    provider_key: "example.subject_contexts",
    operation_key: "present_subject_context",
    handler_key: "example.subject_summary.handler",
    safe_reason_codes: ["context_changed", "unavailable"],
  }],
  product_surfaces: [{
    product_surface_key: "example.dashboard",
    presentation_key: "example.subject_summary",
    view_modes: ["current", "recent", "history"],
    route_classes: ["subject_collection", "subject_detail"],
    action_offer_policy: "none",
    action_keys: [],
  }],
} satisfies ScenarioContractManifestV1;
