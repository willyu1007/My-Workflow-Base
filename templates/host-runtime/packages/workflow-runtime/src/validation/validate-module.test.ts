import { describe, expect, it } from "vitest";
import type {
  ChatWorkflowAdapter,
  ScenarioManifest,
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

describe("workflow module validation and loading", () => {
  it("passes a complete scenario module", () => {
    const report = validateWorkflowModule({
      module: createScenarioModule(),
      host_snapshot: hostSnapshot,
      activation_target: "dev",
    });

    expect(report.passed).toBe(true);
    expect(report.contract_hash).toMatch(/^[a-f0-9]{64}$/);
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
