import type { ScenarioContractManifestV1 } from "@host/workflow-contracts";

export const scenarioContractManifestF3Fixture = {
  scenario_contracts_version: 1,
  source_dependencies: [
    {
      source_identity: "platform_child_family_identity_source_v1",
      source_hash: "81d9fb9db244b8e56bc85e8770eb13915ca87b6053bb3411420b569d59d8fed4",
    },
    {
      source_identity: "scenario_interface_source_v1",
      source_hash: "37f0cdae3ad8807073dd250a51f4de990dcccf40952c127b2340161db2e28eaf",
    },
    {
      source_identity: "scenario_domain_action_source_v1",
      source_hash: "b7c35259d03a84778cc909075a08d6b147a43a38a12cddeb875c94f01591e48d",
    },
    {
      source_identity: "scenario_protected_interaction_source_v1",
      source_hash: "78eadaf4448b61ab3629026fefe4befbb2522eccbc7e459366d1032885d90efb",
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
    {
      capability_key: "scenario_domain_action_execution_v1",
      requires_capabilities: [
        "trusted_scenario_invocation_v1",
        "scenario_subject_presentation_v1",
      ],
      requires_sources: ["scenario_domain_action_source_v1"],
    },
    {
      capability_key: "scenario_protected_interaction_v1",
      requires_capabilities: [
        "trusted_scenario_invocation_v1",
        "scenario_subject_presentation_v1",
        "scenario_domain_action_execution_v1",
      ],
      requires_sources: ["scenario_protected_interaction_source_v1"],
    },
  ],
  trusted_invocation: {
    trusted_invocation_version: 1,
    invocation_contract: "scenario-private-invocation-v1",
    operations: [
      ["list_subject_contexts", "example.list_subject_contexts.input", "example.list_subject_contexts.handler"],
      ["resolve_subject_context", "example.resolve_subject_context.input", "example.resolve_subject_context.handler"],
      ["present_subject_context", "example.present_subject_context.input", "example.present_subject_context.handler"],
      ["prepare_domain_action", "example.prepare_domain_action.input", "example.prepare_domain_action.handler"],
      ["read_protected_detail", "example.read_protected_detail.input", "example.read_protected_detail.handler"],
    ].map(([operationKey, inputSchemaKey, handlerKey]) => ({
      endpoint_key: `example.${operationKey}`,
      method: "POST" as const,
      operation_key: operationKey,
      input_schema_key: inputSchemaKey,
      input_schema_version: 1,
      handler_key: handlerKey,
      ingress: [{
        ingress_category: "product_surface" as const,
        ingress_key: "example.dashboard",
        principal_origins: ["interactive_session" as const],
      }],
    })),
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
    action_offer_policy: "declared_actions",
    action_keys: ["example.record"],
  }],
  domain_action_contracts: [{
    action_contract_version: 1,
    scenario_key: "example",
    action_key: "example.record",
    input_schema_key: "example.record.input",
    input_schema_version: 1,
    target_ref_class: "example.record.target",
    confirmation_class: "explicit",
    entitled_ingress_keys: ["example.dashboard"],
    handler_key: "example.record.handler",
    command_contract: {
      command_key: "example.record.command",
      command_contract_version: 1,
    },
    driver: "workflow_claimed_step_v1",
  }],
  protected_interaction_contracts: [{
    protected_interaction_contract_version: 1,
    scenario_key: "example",
    action_key: "example.record",
    protected_field_key: "example_plain_text",
    content_kind: "example.protected_record",
    prepare_operation_key: "prepare_domain_action",
    read_operation_key: "read_protected_detail",
    content_profile: {
      media_type: "text/plain; charset=utf-8",
      normalization: "trim_outer_whitespace_and_crlf_to_lf_v1",
      min_characters: 1,
      max_characters: 2000,
      attachments: "none",
    },
  }],
} satisfies ScenarioContractManifestV1;
