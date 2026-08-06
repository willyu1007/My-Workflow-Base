import { describe, expect, it } from "vitest";
import type {
  ChatWorkflowAdapter,
  HandoffManifest,
  ScenarioManifest,
  ScenarioManifestV2,
  WorkflowHostValidationSnapshot,
  WorkflowRuntimePort,
  WorkflowScenarioModule,
} from "@host/workflow-contracts";
import { loadWorkflowRegistry } from "../registry/loader.js";
import { resolveStepHandler } from "../registry/resolve-binding.js";
import { WorkflowWorker } from "../workers/workflow-worker.js";
import { validateWorkflowModule } from "./validate-module.js";

const hostSnapshot: WorkflowHostValidationSnapshot = {
  scenario_records: {
    example: {
      status: "draft",
    },
  },
  domain_resolver_keys: [],
  downstream_owners: [],
  standard_events: ["workflow.run.created", "workflow.run.updated"],
  platform_events: [],
  allowed_surfaces: [
    "chat_workflow_control",
    "web_run_workbench",
    "mobile_dashboard",
    "admin_operator",
    "worker_runtime",
  ],
  projection_reviews: [],
};

const manifest: ScenarioManifest = {
  manifest_version: 1,
  scenario_key: "example",
  scenario_record: {
    display_name: "Example scenario",
    required_status: "draft",
    owner_team: "workflow",
    policy_version: 1,
  },
  owner: "workflow",
  launch_phase: "dev",
  allowed_user_classes: ["internal_admin"],
  capabilities: [
    {
      capability_key: "example_capability",
      label: "Example capability",
      description: "Scenario-neutral test capability.",
      enablement_policy: "workspace_enabled",
      entrypoints: [
        {
          entrypoint_key: "authoring",
          label: "Authoring",
          workflow_version: 1,
          workflow_version_id: "workflow-version-1",
          input_schema_version: 1,
          output_schema_version: 1,
          allowed_step_types: ["domain_action"],
          steps: [
            {
              step_key: "collect_context",
              step_type: "domain_action",
              order: 10,
              handler_key: "example.collect_context",
              retry_policy: "none",
            },
          ],
        },
      ],
    },
  ],
  scenario_data: {
    context_ref_types: [],
    run_start_requirements: [],
    step_interventions: [],
  },
  artifact_policy: {
    artifact_types: ["example_summary"],
    exposure_levels: {
      L0: [],
      L1: ["example_summary"],
      L2: [],
      L3: [],
      L4: [],
    },
    handoff_eligible: {
      public_draft: [],
      indexing: [],
      notification: [],
    },
  },
  action_availability: {
    shared_actions: ["start_run"],
    scenario_actions: [],
    expected_version_required: true,
  },
  handoffs: [],
  surface_mapping: {
    chat_workflow_control: {},
    web_run_workbench: {},
    mobile_dashboard: {},
    admin_operator: {},
  },
  internal_api: {
    routes: [],
  },
  event_registry: {
    standard_workflow_events: ["workflow.run.created", "workflow.run.updated"],
    scenario_internal_events: [],
    event_payload_policy: {
      signal_version: 1,
      body: "no_body",
      pii: "no_pii",
      status_in_payload: false,
      presenter_output_in_payload: false,
      idempotency_key: "{event_type}:{aggregate_id}:{aggregate_version}",
    },
    producers: {
      "workflow.run.created": {
        owner: "workflow_ledger",
        write_boundary: "same_transaction",
      },
      "workflow.run.updated": {
        owner: "workflow_ledger",
        write_boundary: "same_transaction",
      },
    },
    consumers: {},
  },
  governance: {
    admin_actions: [],
    rollback: "Disable capability and preserve canonical facts.",
    projection_review_required: true,
    evidence_records: [],
    outbox_events: ["workflow.run.created", "workflow.run.updated"],
  },
  verification: {
    deterministic_tests: ["example journey"],
    journey_harness: "example-authoring-happy-path",
  },
};

const chatAdapter: ChatWorkflowAdapter = {
  recommend: async () => [],
  start_run: async () => ({
    ok: true,
    data: {
      run_id: "run-1",
      scenario_key: "example",
      capability_key: "example_capability",
      entrypoint_key: "authoring",
      workflow_version_id: "workflow-version-1",
      status: "queued",
      aggregate_version: 1,
    },
    canonical_refs: [],
    aggregate_versions: {},
    action_availability: [],
    outbox_event_ids: [],
  }),
  execute_strong_confirmed_action: async () => ({
    ok: true,
    data: {
      run_id: "run-1",
      scenario_key: "example",
      capability_key: "example_capability",
      entrypoint_key: "authoring",
      workflow_version_id: "workflow-version-1",
      status: "running",
      aggregate_version: 2,
    },
    canonical_refs: [],
    aggregate_versions: {},
    action_availability: [],
    outbox_event_ids: [],
  }),
  summarize_dashboard: async () => ({
    safe_title: "Example",
    safe_summary: "No active runs.",
    run_refs: [],
    action_availability: [],
  }),
};

const workerRuntime: WorkflowRuntimePort = {
  claim_step: async () => ({
    run_id: "run-1",
    step_id: "step-1",
    step_key: "collect_context",
    claim_token: "claim-1",
    aggregate_version: 1,
    expires_at: "2026-05-27T00:00:00.000Z",
  }),
  complete_step: async () => ({
    ok: true,
    data: {
      run_id: "run-1",
      step_id: "step-1",
      status: "completed",
      aggregate_version: 2,
      output_refs: [],
    },
    canonical_refs: [],
    aggregate_versions: {},
    action_availability: [],
    outbox_event_ids: [],
  }),
  fail_step: async () => ({
    ok: true,
    data: {
      run_id: "run-1",
      step_id: "step-1",
      status: "failed",
      aggregate_version: 2,
      output_refs: [],
    },
    canonical_refs: [],
    aggregate_versions: {},
    action_availability: [],
    outbox_event_ids: [],
  }),
};

function createScenarioModule(): WorkflowScenarioModule {
  return {
    manifest,
    handlers: {
      "example.collect_context": async () => ({
        output_refs: [],
        reason_code: "example_context_collected",
      }),
    },
    actions: {},
    adapters: {
      chat_workflow_control: chatAdapter,
      web_run_workbench: {
        get_run_detail: async () => ({
          run: {
            run_id: "run-1",
            scenario_key: "example",
            capability_key: "example_capability",
            entrypoint_key: "authoring",
            workflow_version_id: "workflow-version-1",
            status: "running",
            aggregate_version: 1,
          },
          artifacts: [],
          action_availability: [],
        }),
        execute_action: async (input) => ({
          target: input.target_ref,
          affected_refs: [],
          action_availability: [],
        }),
        get_artifact_preview: async () => ({
          artifact_id: "artifact-1",
          run_id: "run-1",
          artifact_type: "example_summary",
          exposure_level: "L1",
          safe_title: "Example artifact",
          safe_summary: "Example summary",
          aggregate_version: 1,
        }),
        create_handoff: async (input) => ({
          handoff_id: "handoff-1",
          handoff_type: input.handoff_type,
          status: "requested",
          source_refs: input.source_refs,
          downstream_refs: [],
          aggregate_version: 1,
        }),
      },
      mobile_dashboard: {
        list_cards: async () => [],
        get_run_summary: async () => ({
          run: {
            run_id: "run-1",
            scenario_key: "example",
            capability_key: "example_capability",
            entrypoint_key: "authoring",
            workflow_version_id: "workflow-version-1",
            status: "running",
            aggregate_version: 1,
          },
          cards: [],
          action_availability: [],
        }),
        execute_action: async (input) => ({
          target: input.target_ref,
          affected_refs: [],
          action_availability: [],
        }),
      },
      admin_operator: {
        validate_module: async () => ({ scenario_key: "example", status: "valid" }),
        publish_version: async () => ({ scenario_key: "example", status: "published" }),
        disable_capability: async () => ({
          scenario_key: "example",
          capability_key: "example_capability",
          status: "disabled",
        }),
        get_evidence: async () => ({
          evidence_refs: [],
          safe_summary: "No evidence.",
        }),
      },
      worker_runtime: workerRuntime,
    },
    presenters: {
      chat_dashboard_summary: async () => ({
        safe_title: "Example",
        safe_summary: "No active runs.",
        run_refs: [],
        action_availability: [],
      }),
      dashboard_card: async () => ({
        run_id: "run-1",
        scenario_key: "example",
        capability_key: "example_capability",
        entrypoint_key: "authoring",
        title: "Example run",
        status: "running",
        requires_attention: false,
        action_availability: [],
        aggregate_version: 1,
      }),
      artifact_preview: async () => ({
        artifact_id: "artifact-1",
        run_id: "run-1",
        artifact_type: "example_summary",
        exposure_level: "L1",
        safe_title: "Example artifact",
        safe_summary: "Example summary",
        aggregate_version: 1,
      }),
      mobile_summary: async () => ({
        run: {
          run_id: "run-1",
          scenario_key: "example",
          capability_key: "example_capability",
          entrypoint_key: "authoring",
          workflow_version_id: "workflow-version-1",
          status: "running",
          aggregate_version: 1,
        },
        cards: [],
        action_availability: [],
      }),
      web_run_workbench: async () => ({
        run: {
          run_id: "run-1",
          scenario_key: "example",
          capability_key: "example_capability",
          entrypoint_key: "authoring",
          workflow_version_id: "workflow-version-1",
          status: "running",
          aggregate_version: 1,
        },
        artifacts: [],
        action_availability: [],
      }),
    },
    policies: {},
    internal_api_handlers: {},
  };
}

function createFederatedScenarioModule(): WorkflowScenarioModule {
  const module = createScenarioModule();
  module.manifest = {
    ...module.manifest,
    manifest_version: 2,
    contract: {
      base_contract_version: "1.0.0",
      host_sdk_version: "1.0.0",
      host_abi_range: "^1.0.0",
      source_hash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    },
    step_type_registry: [
      {
        step_type: "example.collect_context",
        runtime_kind: "scenario_action",
        owner: "scenario",
      },
    ],
    owner_integration: {
      command_contract: "scenario-command-envelope-v1",
      event_contract: "scenario-event-envelope-v1",
      receipt_contract: "scenario-command-receipt-v1",
      status_lookup_required: true,
      auth_mode: "service_authenticated",
    },
    capabilities: module.manifest.capabilities.map((capability) => ({
      ...capability,
      enablement_policy: "requires_workspace_activation",
      entrypoints: capability.entrypoints.map((entrypoint) => ({
        ...entrypoint,
        allowed_step_types: ["example.collect_context"],
        steps: entrypoint.steps.map((step) => ({
          ...step,
          step_type: "example.collect_context",
          runtime_kind: "scenario_action",
        })),
      })),
    })),
  };
  return module;
}

function createScenarioContractModule(): WorkflowScenarioModule {
  const module = createFederatedScenarioModule();
  const manifest = module.manifest as ScenarioManifestV2;
  manifest.allowed_user_classes = ["admin"];
  manifest.scenario_contracts = {
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
        ["list_subject_contexts", "example.list_subject_contexts.input"],
        ["resolve_subject_context", "example.resolve_subject_context.input"],
        ["present_subject_context", "example.present_subject_context.input"],
      ].map(([operationKey, inputSchemaKey]) => ({
        endpoint_key: `scenario.${operationKey}`,
        method: "POST" as const,
        operation_key: operationKey,
        input_schema_key: inputSchemaKey,
        input_schema_version: 1,
        handler_key: `scenario.${operationKey}.handler`,
        ingress: [{
          ingress_category: "product_surface" as const,
          ingress_key: "scenario.dashboard",
          principal_origins: ["interactive_session" as const],
        }],
      })),
    },
    subject_context_providers: [{
      provider_key: "scenario.subject_contexts",
      provider_version: 1,
      list_operation_key: "list_subject_contexts",
      resolve_operation_key: "resolve_subject_context",
      handler_key: "scenario.subject_contexts.handler",
    }],
    semantic_presentations: [{
      presentation_key: "scenario.subject_summary",
      presentation_version: 1,
      provider_key: "scenario.subject_contexts",
      operation_key: "present_subject_context",
      handler_key: "scenario.subject_summary.handler",
      safe_reason_codes: ["context_changed", "unavailable"],
    }],
    product_surfaces: [{
      product_surface_key: "scenario.dashboard",
      presentation_key: "scenario.subject_summary",
      view_modes: ["current", "recent", "history"],
      route_classes: ["subject_collection", "subject_detail"],
      action_offer_policy: "none",
      action_keys: [],
    }],
    domain_action_contracts: [],
    protected_interaction_contracts: [],
  };
  return module;
}

function createScenarioContractHostSnapshot(
  overrides: Partial<WorkflowHostValidationSnapshot> = {},
): WorkflowHostValidationSnapshot {
  return {
    ...hostSnapshot,
    host_capabilities: [
      "scenario_federation_v1",
      "trusted_scenario_invocation_v1",
      "scenario_subject_presentation_v1",
    ],
    ...overrides,
  };
}

function createCompleteScenarioContractModule(): WorkflowScenarioModule {
  const module = createScenarioContractModule();
  const manifest = module.manifest as ScenarioManifestV2;
  const contracts = manifest.scenario_contracts;
  if (!contracts) throw new Error("scenario contract fixture is missing");
  contracts.source_dependencies.push(
    {
      source_identity: "scenario_domain_action_source_v1",
      source_hash: "89abcdef01234567".repeat(4),
    },
    {
      source_identity: "scenario_protected_interaction_source_v1",
      source_hash: "76543210fedcba98".repeat(4),
    },
  );
  contracts.capability_dependencies.push(
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
  );
  contracts.trusted_invocation.operations.push(
    {
      endpoint_key: "scenario.prepare_domain_action",
      method: "POST",
      operation_key: "prepare_domain_action",
      input_schema_key: "scenario.prepare_domain_action.input",
      input_schema_version: 1,
      handler_key: "scenario.prepare_domain_action.handler",
      ingress: [{
        ingress_category: "product_surface",
        ingress_key: "scenario.dashboard",
        principal_origins: ["interactive_session"],
      }],
    },
    {
      endpoint_key: "scenario.read_protected_detail",
      method: "POST",
      operation_key: "read_protected_detail",
      input_schema_key: "scenario.read_protected_detail.input",
      input_schema_version: 1,
      handler_key: "scenario.read_protected_detail.handler",
      ingress: [{
        ingress_category: "product_surface",
        ingress_key: "scenario.dashboard",
        principal_origins: ["interactive_session"],
      }],
    },
  );
  contracts.product_surfaces[0] = {
    ...contracts.product_surfaces[0],
    action_offer_policy: "declared_actions",
    action_keys: ["scenario.record"],
  };
  contracts.domain_action_contracts = [{
    action_contract_version: 1,
    scenario_key: "example",
    action_key: "scenario.record",
    input_schema_key: "scenario.record.input",
    input_schema_version: 1,
    target_ref_class: "scenario.record.target",
    confirmation_class: "explicit",
    entitled_ingress_keys: ["scenario.dashboard"],
    handler_key: "scenario.record.handler",
    command_contract: {
      command_key: "scenario.record.command",
      command_contract_version: 1,
    },
    driver: "workflow_claimed_step_v1",
  }];
  contracts.protected_interaction_contracts = [{
    protected_interaction_contract_version: 1,
    scenario_key: "example",
    action_key: "scenario.record",
    protected_field_key: "example_plain_text",
    content_kind: "scenario.protected_record",
    prepare_operation_key: "prepare_domain_action",
    read_operation_key: "read_protected_detail",
    content_profile: {
      media_type: "text/plain; charset=utf-8",
      normalization: "trim_outer_whitespace_and_crlf_to_lf_v1",
      min_characters: 1,
      max_characters: 2000,
      attachments: "none",
    },
  }];
  return module;
}

function createCompleteScenarioContractHostSnapshot(): WorkflowHostValidationSnapshot {
  return createScenarioContractHostSnapshot({
    host_capabilities: [
      "scenario_federation_v1",
      "trusted_scenario_invocation_v1",
      "scenario_subject_presentation_v1",
      "scenario_domain_action_execution_v1",
      "scenario_protected_interaction_v1",
    ],
  });
}

function createLegacyHandoff(overrides: Partial<HandoffManifest> = {}): HandoffManifest {
  return {
    handoff_type: "notification",
    source_artifact_types: ["example_summary"],
    requested_purposes: ["user_attention"],
    downstream_owner: "notification",
    policy_key: "example.can_request_user_attention",
    receipt_required: true,
    ...overrides,
  };
}

function createVnextHandoff(overrides: Partial<HandoffManifest> = {}): HandoffManifest {
  return createLegacyHandoff({
    handoff_key: "user_attention",
    source_artifact_types: [],
    source_context_ref_types: [
      {
        namespace: "scenario.example",
        object_type: "care_item",
      },
    ],
    materialization_mode: "workflow_step_complete_v1",
    ...overrides,
  });
}

function createModuleWithHandoffs(handoffs: HandoffManifest[]): WorkflowScenarioModule {
  const module = createScenarioModule();
  module.manifest = {
    ...module.manifest,
    handoffs,
  };
  module.policies = {
    "example.can_request_user_attention": async () => true,
  };
  return module;
}

function createHandoffHostSnapshot(
  overrides: Partial<WorkflowHostValidationSnapshot> = {},
): WorkflowHostValidationSnapshot {
  return {
    ...hostSnapshot,
    downstream_owners: ["notification"],
    ...overrides,
  };
}

describe("workflow module validation and loading", () => {
  it("passes a presentation-complete scenario contract with exact Host support", () => {
    const report = validateWorkflowModule({
      module: createScenarioContractModule(),
      host_snapshot: createScenarioContractHostSnapshot(),
      activation_target: "dev",
    });

    expect(report.passed).toBe(true);
    expect(report.findings.filter((finding) =>
      ["WF-MAN-118", "WF-MAN-119", "WF-MAN-120", "WF-MAN-121", "WF-MAN-122"]
        .includes(finding.rule_id)
    )).toEqual([]);
  });

  it("fails when exact scenario contract Host support is absent", () => {
    const report = validateWorkflowModule({
      module: createScenarioContractModule(),
      host_snapshot: createScenarioContractHostSnapshot({
        host_capabilities: ["scenario_federation_v1", "trusted_scenario_invocation_v1"],
      }),
      activation_target: "dev",
    });

    expect(report.passed).toBe(false);
    expect(report.findings).toContainEqual(expect.objectContaining({
      rule_id: "WF-MAN-119",
      severity: "fatal",
      path: "scenario_contracts.capability_dependencies.1.capability_key",
    }));
  });

  it("rejects scenario declaration handlers that alias legacy implementations", () => {
    const module = createScenarioContractModule();
    const manifest = module.manifest as ScenarioManifestV2;
    if (!manifest.scenario_contracts) throw new Error("scenario contract fixture is missing");
    manifest.scenario_contracts.trusted_invocation.operations[0].handler_key =
      "example.collect_context";
    const report = validateWorkflowModule({
      module,
      host_snapshot: createScenarioContractHostSnapshot(),
      activation_target: "dev",
    });

    expect(report.passed).toBe(false);
    expect(report.findings).toContainEqual(expect.objectContaining({
      rule_id: "WF-MAN-120",
      severity: "fatal",
    }));
  });

  it("rejects scenario operations and surfaces that alias legacy paths", () => {
    const module = createScenarioContractModule();
    const manifest = module.manifest as ScenarioManifestV2;
    if (!manifest.scenario_contracts) throw new Error("scenario contract fixture is missing");
    manifest.scenario_contracts.trusted_invocation.operations.push({
      endpoint_key: "scenario.authoring",
      method: "POST",
      operation_key: "authoring",
      input_schema_key: "scenario.authoring.input",
      input_schema_version: 1,
      handler_key: "scenario.authoring.handler",
      ingress: [{
        ingress_category: "host_transition",
        ingress_key: "scenario.authoring",
        principal_origins: ["interactive_session"],
      }],
    });
    for (const operation of manifest.scenario_contracts.trusted_invocation.operations) {
      for (const ingress of operation.ingress) {
        if (ingress.ingress_category === "product_surface") {
          ingress.ingress_key = "mobile_dashboard";
        }
      }
    }
    manifest.scenario_contracts.product_surfaces[0].product_surface_key = "mobile_dashboard";
    const report = validateWorkflowModule({
      module,
      host_snapshot: createScenarioContractHostSnapshot(),
      activation_target: "dev",
    });

    expect(report.passed).toBe(false);
    expect(report.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ rule_id: "WF-MAN-121", severity: "fatal" }),
      expect.objectContaining({ rule_id: "WF-MAN-122", severity: "fatal" }),
    ]));
  });

  it("passes the complete action and protected contract graph with exact Host support", () => {
    const report = validateWorkflowModule({
      module: createCompleteScenarioContractModule(),
      host_snapshot: createCompleteScenarioContractHostSnapshot(),
      activation_target: "dev",
    });

    expect(report.passed).toBe(true);
    expect(report.findings.filter((finding) => finding.rule_id === "WF-MAN-123"))
      .toEqual([]);
  });

  it("rejects vNext actions that alias legacy action availability", () => {
    const module = createCompleteScenarioContractModule();
    module.manifest.action_availability = {
      ...module.manifest.action_availability,
      scenario_actions: ["scenario.record"],
    };
    const report = validateWorkflowModule({
      module,
      host_snapshot: createCompleteScenarioContractHostSnapshot(),
      activation_target: "dev",
    });

    expect(report.passed).toBe(false);
    expect(report.findings).toContainEqual(expect.objectContaining({
      rule_id: "WF-MAN-123",
      severity: "fatal",
      path: "scenario_contracts.domain_action_contracts.0.action_key",
    }));
  });

  it("rejects vNext action handlers that alias legacy implementations", () => {
    const module = createCompleteScenarioContractModule();
    const manifest = module.manifest as ScenarioManifestV2;
    if (!manifest.scenario_contracts) throw new Error("scenario contract fixture is missing");
    manifest.scenario_contracts.domain_action_contracts[0].handler_key =
      "example.collect_context";
    const report = validateWorkflowModule({
      module,
      host_snapshot: createCompleteScenarioContractHostSnapshot(),
      activation_target: "dev",
    });

    expect(report.passed).toBe(false);
    expect(report.findings).toContainEqual(expect.objectContaining({
      rule_id: "WF-MAN-120",
      severity: "fatal",
      path: "scenario_contracts.domain_action_contracts.0.handler_key",
    }));
  });

  it("passes a federated v2 module with exact Host capabilities", () => {
    const report = validateWorkflowModule({
      module: createFederatedScenarioModule(),
      host_snapshot: {
        ...hostSnapshot,
        host_capabilities: ["scenario_federation_v1"],
      },
      activation_target: "dev",
    });

    expect(report.passed).toBe(true);
    expect(report.findings.filter((finding) => finding.rule_id.startsWith("WF-MAN-1"))).toEqual([]);
  });

  it("fails closed when a federated manifest contains an unknown field", () => {
    const module = createFederatedScenarioModule();
    module.manifest = { ...module.manifest, future_field: true } as unknown as ScenarioManifest;
    const report = validateWorkflowModule({
      module,
      host_snapshot: { ...hostSnapshot, host_capabilities: ["scenario_federation_v1"] },
      activation_target: "dev",
    });

    expect(report.passed).toBe(false);
    expect(report.findings).toContainEqual(expect.objectContaining({ rule_id: "WF-MAN-113", severity: "fatal" }));
  });

  it.each([
    ["release launch phase", (module: WorkflowScenarioModule) => {
      module.manifest.launch_phase = "preview" as never;
    }, "WF-MAN-115"],
    ["scenario lifecycle", (module: WorkflowScenarioModule) => {
      module.manifest.scenario_record = {
        ...module.manifest.scenario_record,
        required_status: "pilot" as never,
      };
    }, "WF-MAN-116"],
    ["capability enablement policy", (module: WorkflowScenarioModule) => {
      module.manifest.capabilities[0].enablement_policy = "workspace_enabled";
    }, "WF-MAN-117"],
  ])("fails closed on an invalid %s", (_label, mutate, ruleId) => {
    const module = createFederatedScenarioModule();
    mutate(module);
    const report = validateWorkflowModule({
      module,
      host_snapshot: { ...hostSnapshot, host_capabilities: ["scenario_federation_v1"] },
      activation_target: "dev",
    });

    expect(report.passed).toBe(false);
    expect(report.findings).toContainEqual(expect.objectContaining({ rule_id: ruleId, severity: "fatal" }));
  });

  it("fails closed on an unsupported future manifest version", () => {
    const module = createFederatedScenarioModule();
    module.manifest = { ...module.manifest, manifest_version: 3 };
    const report = validateWorkflowModule({
      module,
      host_snapshot: { ...hostSnapshot, host_capabilities: ["scenario_federation_v1"] },
      activation_target: "dev",
    });

    expect(report.passed).toBe(false);
    expect(report.findings).toContainEqual(expect.objectContaining({ rule_id: "WF-MAN-099", severity: "fatal" }));
  });

  it("rejects undeclared runtime mappings and a host without federation support", () => {
    const module = createFederatedScenarioModule();
    module.manifest.capabilities[0].entrypoints[0].steps[0].runtime_kind = "tool_call";
    const report = validateWorkflowModule({ module, host_snapshot: hostSnapshot, activation_target: "dev" });

    expect(report.passed).toBe(false);
    expect(report.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ rule_id: "WF-MAN-108" }),
      expect.objectContaining({ rule_id: "WF-MAN-111" }),
    ]));
  });

  it("passes the legacy scenario module without changing its contract hash", () => {
    const report = validateWorkflowModule({
      module: createScenarioModule(),
      host_snapshot: hostSnapshot,
      activation_target: "dev",
    });

    expect(report.passed).toBe(true);
    expect(report.contract_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(report.contract_hash).toBe("9f568ff772d3dafc02dd96f284f7cedb85aff18839b8f26f4691a8b2dc0d0ca6");
    expect(report.findings.some((finding) => finding.rule_id.startsWith("WF-MAN-04"))).toBe(false);
  });

  it("warns for a legacy handoff without blocking registration", () => {
    const module = createModuleWithHandoffs([createLegacyHandoff()]);
    const handoffHostSnapshot = createHandoffHostSnapshot();
    const report = validateWorkflowModule({
      module,
      host_snapshot: handoffHostSnapshot,
      activation_target: "dev",
    });

    expect(report.passed).toBe(true);
    expect(report.findings).toEqual([
      expect.objectContaining({
        rule_id: "WF-MAN-043",
        severity: "warning",
        path: "handoffs.0.materialization_mode",
      }),
    ]);
    expect(() =>
      loadWorkflowRegistry({
        modules: [module],
        host_snapshot: handoffHostSnapshot,
      }),
    ).not.toThrow();
  });

  it.each([
    ["unknown", "workflow_step_complete_v2"],
    ["null", null],
  ])("rejects an explicitly %s materialization mode", (_label, materializationMode) => {
    const invalidHandoff = {
      ...createLegacyHandoff(),
      materialization_mode: materializationMode,
    } as unknown as HandoffManifest;
    const report = validateWorkflowModule({
      module: createModuleWithHandoffs([invalidHandoff]),
      host_snapshot: createHandoffHostSnapshot(),
      activation_target: "dev",
    });

    expect(report.passed).toBe(false);
    expect(report.findings).toContainEqual(
      expect.objectContaining({
        rule_id: "WF-MAN-048",
        severity: "fatal",
        path: "handoffs.0.materialization_mode",
      }),
    );
    expect(report.findings.some((finding) => finding.rule_id === "WF-MAN-043")).toBe(false);
  });

  it("preserves existing legacy handoff finding paths", () => {
    const report = validateWorkflowModule({
      module: createModuleWithHandoffs([
        createLegacyHandoff({
          receipt_required: false,
        }),
      ]),
      host_snapshot: createHandoffHostSnapshot(),
      activation_target: "dev",
    });

    expect(report.passed).toBe(false);
    expect(report.findings).toContainEqual(
      expect.objectContaining({
        rule_id: "WF-MAN-040",
        severity: "fatal",
        path: "handoffs",
      }),
    );
  });

  it("passes a valid vNext handoff when the host capability is enabled", () => {
    const report = validateWorkflowModule({
      module: createModuleWithHandoffs([createVnextHandoff()]),
      host_snapshot: createHandoffHostSnapshot({
        host_capabilities: ["workflow_handoff_materialization_v1"],
      }),
      activation_target: "dev",
    });

    expect(report.passed).toBe(true);
    expect(report.findings.some((finding) => /^WF-MAN-04[3-7]$/.test(finding.rule_id))).toBe(false);
  });

  it("rejects a vNext handoff without a stable handoff key", () => {
    const report = validateWorkflowModule({
      module: createModuleWithHandoffs([
        createVnextHandoff({
          handoff_key: " ",
        }),
      ]),
      host_snapshot: createHandoffHostSnapshot({
        host_capabilities: ["workflow_handoff_materialization_v1"],
      }),
      activation_target: "dev",
    });

    expect(report.passed).toBe(false);
    expect(report.findings).toContainEqual(
      expect.objectContaining({ rule_id: "WF-MAN-044", severity: "fatal" }),
    );
  });

  it("rejects a vNext handoff without a declared artifact or context source type", () => {
    const report = validateWorkflowModule({
      module: createModuleWithHandoffs([
        createVnextHandoff({
          source_artifact_types: [],
          source_context_ref_types: [{ namespace: " ", object_type: "care_item" }],
        }),
      ]),
      host_snapshot: createHandoffHostSnapshot({
        host_capabilities: ["workflow_handoff_materialization_v1"],
      }),
      activation_target: "dev",
    });

    expect(report.passed).toBe(false);
    expect(report.findings).toContainEqual(
      expect.objectContaining({ rule_id: "WF-MAN-045", severity: "fatal" }),
    );
  });

  it.each([
    ["absent", {}],
    ["empty", { host_capabilities: [] }],
  ])("rejects a vNext handoff when host capability evidence is %s", (_label, hostOverrides) => {
    const report = validateWorkflowModule({
      module: createModuleWithHandoffs([createVnextHandoff()]),
      host_snapshot: createHandoffHostSnapshot(hostOverrides),
      activation_target: "dev",
    });

    expect(report.passed).toBe(false);
    expect(report.findings).toContainEqual(
      expect.objectContaining({
        rule_id: "WF-MAN-046",
        severity: "fatal",
        path: "host_capabilities",
      }),
    );
  });

  it("emits one host-capability fatal for multiple vNext handoffs", () => {
    const report = validateWorkflowModule({
      module: createModuleWithHandoffs([
        createVnextHandoff(),
        createVnextHandoff({
          handoff_key: "external_delivery",
          handoff_type: "external_delivery",
        }),
      ]),
      host_snapshot: createHandoffHostSnapshot(),
      activation_target: "dev",
    });

    expect(report.findings.filter((finding) => finding.rule_id === "WF-MAN-046")).toHaveLength(1);
  });

  it("rejects duplicate declared handoff keys across migration and vNext declarations", () => {
    const report = validateWorkflowModule({
      module: createModuleWithHandoffs([
        createLegacyHandoff({ handoff_key: "user_attention" }),
        createVnextHandoff({ handoff_type: "external_delivery" }),
      ]),
      host_snapshot: createHandoffHostSnapshot({
        host_capabilities: ["workflow_handoff_materialization_v1"],
      }),
      activation_target: "dev",
    });

    expect(report.passed).toBe(false);
    expect(report.findings).toContainEqual(
      expect.objectContaining({
        rule_id: "WF-MAN-047",
        severity: "fatal",
        path: "handoffs.1.handoff_key",
      }),
    );
  });

  it("changes the contract hash when the manifest changes", () => {
    const originalReport = validateWorkflowModule({
      module: createScenarioModule(),
      host_snapshot: hostSnapshot,
      activation_target: "dev",
    });
    const changedManifest = structuredClone(manifest);
    changedManifest.capabilities[0].label = "Changed capability";
    const changedReport = validateWorkflowModule({
      module: {
        ...createScenarioModule(),
        manifest: changedManifest,
      },
      host_snapshot: hostSnapshot,
      activation_target: "dev",
    });

    expect(changedReport.contract_hash).not.toBe(originalReport.contract_hash);
  });

  it("fails when a declared step handler is missing", () => {
    const module = createScenarioModule();
    module.handlers = {};

    const report = validateWorkflowModule({
      module,
      host_snapshot: hostSnapshot,
      activation_target: "dev",
    });

    expect(report.passed).toBe(false);
    expect(report.findings.map((finding) => finding.rule_id)).toContain("WF-MAN-010");
  });

  it("loads a registry and resolves a step handler by contract hash", async () => {
    const registry = loadWorkflowRegistry({
      modules: [createScenarioModule()],
      host_snapshot: hostSnapshot,
    });
    const contractHash = registry.scenarios.get("example")?.contract_hash;
    expect(contractHash).toBeDefined();

    const handler = resolveStepHandler(registry, {
      scenario_key: "example",
      capability_key: "example_capability",
      entrypoint_key: "authoring",
      workflow_version_id: "workflow-version-1",
      step_key: "collect_context",
      handler_key: "example.collect_context",
      contract_hash: contractHash ?? "",
    });

    await expect(
      handler({
        run_id: "run-1",
        step_id: "step-1",
        step_key: "collect_context",
        scenario_key: "example",
        capability_key: "example_capability",
        entrypoint_key: "authoring",
        workflow_version_id: "workflow-version-1",
        contract_hash: contractHash ?? "",
        meta: {
          workspace_id: "workspace-1",
          idempotency_key: "run-1:step-1:1",
          correlation_id: "correlation-1",
          client_surface: "worker_runtime",
        },
      }),
    ).resolves.toEqual({
      output_refs: [],
      reason_code: "example_context_collected",
    });

    expect(() =>
      resolveStepHandler(registry, {
        scenario_key: "example",
        capability_key: "wrong_capability",
        entrypoint_key: "authoring",
        workflow_version_id: "workflow-version-1",
        step_key: "collect_context",
        handler_key: "example.collect_context",
        contract_hash: contractHash ?? "",
      }),
    ).toThrow(/workflow handler not registered/);
  });

  it("returns runtime read-only registry maps", () => {
    const registry = loadWorkflowRegistry({
      modules: [createScenarioModule()],
      host_snapshot: hostSnapshot,
    });

    expect(() => {
      (registry.scenarios as Map<string, unknown>).set("other", {});
    }).toThrow(/read-only/);
  });

  it("fails when a manifest references an unsupported surface", () => {
    const module = createScenarioModule();
    module.manifest = {
      ...module.manifest,
      surface_mapping: {
        unsupported_surface: {},
      },
    };

    const report = validateWorkflowModule({
      module,
      host_snapshot: hostSnapshot,
      activation_target: "dev",
    });

    expect(report.passed).toBe(false);
    expect(report.findings.map((finding) => finding.rule_id)).toContain("WF-MAN-091");
  });

  it("claims and completes a worker step through the runtime port", async () => {
    const calls: string[] = [];
    const module = createScenarioModule();
    module.adapters.worker_runtime = {
      claim_step: async (input) => {
        calls.push(`claim:${input.expected_version}:${input.worker_id}`);
        return {
          run_id: input.run_id,
          step_id: input.step_id,
          step_key: "collect_context",
          claim_token: "claim-1",
          aggregate_version: 2,
          expires_at: "2026-05-27T00:00:00.000Z",
        };
      },
      complete_step: async (input) => {
        calls.push(`complete:${input.expected_version}:${input.status ?? "completed"}`);
        return {
          ok: true,
          data: {
            run_id: input.run_id,
            step_id: input.step_id,
            status: input.status ?? "completed",
            aggregate_version: 3,
            output_refs: input.output_refs,
          },
          canonical_refs: [],
          aggregate_versions: {},
          action_availability: [],
          outbox_event_ids: [],
        };
      },
      fail_step: async (input) => {
        calls.push(`fail:${input.expected_version}:${input.reason_code}`);
        return {
          ok: true,
          data: {
            run_id: input.run_id,
            step_id: input.step_id,
            status: "failed",
            aggregate_version: 3,
            output_refs: [],
          },
          canonical_refs: [],
          aggregate_versions: {},
          action_availability: [],
          outbox_event_ids: [],
        };
      },
    };

    const registry = loadWorkflowRegistry({ modules: [module], host_snapshot: hostSnapshot });
    const contractHash = registry.scenarios.get("example")?.contract_hash ?? "";
    const worker = new WorkflowWorker(registry);

    await worker.run({
      workspace_id: "workspace-1",
      run_id: "run-1",
      step_id: "step-1",
      expected_step_version: 1,
      scenario_key: "example",
      capability_key: "example_capability",
      entrypoint_key: "authoring",
      workflow_version_id: "workflow-version-1",
      step_key: "collect_context",
      handler_key: "example.collect_context",
      contract_hash: contractHash,
      worker_id: "worker-1",
      correlation_id: "correlation-1",
    });

    expect(calls).toEqual(["claim:1:worker-1", "complete:2:completed"]);
  });

  it("records a failed worker step through the runtime port", async () => {
    const calls: string[] = [];
    const module = createScenarioModule();
    module.handlers["example.collect_context"] = async () => {
      throw new Error("handler failed");
    };
    module.adapters.worker_runtime = {
      ...workerRuntime,
      claim_step: async (input) => {
        calls.push(`claim:${input.expected_version}`);
        return {
          run_id: input.run_id,
          step_id: input.step_id,
          step_key: "collect_context",
          claim_token: "claim-1",
          aggregate_version: 2,
          expires_at: "2026-05-27T00:00:00.000Z",
        };
      },
      fail_step: async (input) => {
        calls.push(`fail:${input.expected_version}:${input.reason_code}`);
        return {
          ok: true,
          data: {
            run_id: input.run_id,
            step_id: input.step_id,
            status: "failed",
            aggregate_version: 3,
            output_refs: [],
          },
          canonical_refs: [],
          aggregate_versions: {},
          action_availability: [],
          outbox_event_ids: [],
        };
      },
    };

    const registry = loadWorkflowRegistry({ modules: [module], host_snapshot: hostSnapshot });
    const contractHash = registry.scenarios.get("example")?.contract_hash ?? "";
    const worker = new WorkflowWorker(registry);

    await expect(
      worker.run({
        workspace_id: "workspace-1",
        run_id: "run-1",
        step_id: "step-1",
        expected_step_version: 1,
        scenario_key: "example",
        capability_key: "example_capability",
        entrypoint_key: "authoring",
        workflow_version_id: "workflow-version-1",
        step_key: "collect_context",
        handler_key: "example.collect_context",
        contract_hash: contractHash,
        worker_id: "worker-1",
        correlation_id: "correlation-1",
      }),
    ).rejects.toThrow("handler failed");

    expect(calls).toEqual(["claim:1", "fail:2:workflow_handler_failed"]);
  });
});
