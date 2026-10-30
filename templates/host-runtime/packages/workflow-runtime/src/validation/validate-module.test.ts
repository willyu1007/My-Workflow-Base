import type {
ChatWorkflowAdapter,
ScenarioManifest,
ScenarioManifestV2,
WorkflowHostValidationSnapshot,
WorkflowRuntimePort,
WorkflowScenarioModule
} from "@host/workflow-contracts";
import { describe,expect,it } from "vitest";
import { loadWorkflowRegistry } from "../registry/loader.js";
import {
dispatchTrustedScenarioInvocation,
resolveStepHandler,
} from "../registry/resolve-binding.js";
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
      enablement_policy: "requires_workspace_activation",
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
      completion_contract_version: 1,
      run_id: "run-1",
      step_id: "step-1",
      status: "completed",
      aggregate_version: 2,
      output_refs: [],
      materialized_handoffs: [],
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
    trusted_invocation_handlers: {},
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
  module.trusted_invocation_handlers = Object.fromEntries(
    manifest.scenario_contracts.trusted_invocation.operations.map((operation) => [
      operation.handler_key,
      async () => ({ operation_key: operation.operation_key }),
    ]),
  );
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

describe("workflow module validation and loading", () => {

  it("BA-03 Host 缺少声明的必需 capability 时拒绝启用", () => {
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

  it("BA-05 manifest 一处语义改变会改变 contract hash", () => {
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

  it("BA-02 声明了但缺少 handler 的模块不能启用", () => {
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

  it("BA-01 合法模块按 contract hash 注册，并解析到正确 handler", async () => {
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

  });

  it("BA-04 验证后调用的 route 与声明不一致时不能 dispatch", async () => {
    const module = createScenarioContractModule();
    const scenarioContracts = (module.manifest as ScenarioManifestV2).scenario_contracts;
    const operation = scenarioContracts?.trusted_invocation.operations[0];
    const ingress = operation?.ingress[0];
    if (!operation || !ingress) throw new Error("trusted invocation fixture is missing");
    const registry = loadWorkflowRegistry({
      modules: [module],
      host_snapshot: createScenarioContractHostSnapshot(),
    });
    const contractHash = registry.scenarios.get("example")?.contract_hash;
    if (!contractHash) throw new Error("scenario descriptor is missing");
    const baseRef = { schema_version: 1 as const, namespace: "my_chat", object_type: "user", object_id: "user_01" };

    await expect(dispatchTrustedScenarioInvocation(registry, {
      invocation: {
        invocation_version: 1,
        contract_version: 1,
        contract_hash: contractHash,
        issuer: "my_chat.host",
        assertion_audience: "scenario.private",
        caller_binding: { caller_subject: "my-chat-host-runtime" },
        principal: {
          principal_version: 1,
          principal_kind: "human_user",
          account_ref: baseRef,
          actor_ref: { ...baseRef, object_type: "actor", object_id: "actor_01" },
          workspace_ref: { ...baseRef, object_type: "workspace", object_id: "workspace_01" },
          principal_origin: "interactive_session",
        },
        route: {
          scenario_key: "example",
          endpoint_key: operation.endpoint_key,
          method: "POST",
          ingress: { ingress_version: 1, ingress_category: ingress.ingress_category, ingress_key: ingress.ingress_key },
        },
        request: {
          request_id: "request_02",
          correlation_id: "correlation_02",
          issued_at: "2026-08-11T00:00:00.000Z",
          expires_at: "2026-08-11T00:00:30.000Z",
          nonce: "fedcba9876543210fedcba9876543210",
        },
        operation: { operation_key: operation.operation_key, input_schema_version: 1, input: {} },
      },
      declaration: {
        scenario_key: "example",
        endpoint_key: "scenario.drifted_endpoint",
        method: "POST",
        operation_key: operation.operation_key,
        input_schema_version: 1,
        ingress_category: ingress.ingress_category,
        ingress_key: ingress.ingress_key,
        principal_origins: ingress.principal_origins,
      },
    })).rejects.toThrow("declaration does not match invocation");
  });
});
