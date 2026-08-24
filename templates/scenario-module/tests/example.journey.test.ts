import { describe, expect, it } from "vitest";
import { scenarioModule } from "../src/module.js";

describe("example scenario journey", () => {
  it("declares a scenario module with a registered handler", () => {
    const step = scenarioModule.manifest.capabilities[0]?.entrypoints[0]?.steps[0];

    expect(step).toBeDefined();
    expect(scenarioModule.handlers[step?.handler_key ?? ""]).toBeDefined();
  });

  it("returns an indexing handoff draft without a domain body", async () => {
    const result = await scenarioModule.handlers["example.collect_context"]?.({
      run_id: "run-1",
      step_id: "step-1",
      step_key: "collect_context",
      scenario_key: "example",
      capability_key: "example_capability",
      entrypoint_key: "authoring",
      workflow_version_id: "example-version",
      contract_hash:
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      meta: {
        workspace_id: "workspace-1",
        actor_id: "actor-1",
        idempotency_key: "run-1:step-1:complete",
        correlation_id: "correlation-1",
        client_surface: "worker_runtime",
      },
    });

    expect(result?.handoff_drafts).toMatchObject([
      {
        handoff_key: "index-example-summary",
        requested_purpose: "knowledge_indexing",
        source_refs: [
          {
            namespace: "example",
            object_type: "record",
            object_id: "run-1",
          },
        ],
      },
    ]);
    expect(result?.handoff_drafts?.[0]).not.toHaveProperty("body");
    expect(result?.handoff_drafts?.[0]).not.toHaveProperty("payload");
  });

  it("exposes presenter and standard handoff adapters without a Host special case", async () => {
    const summary =
      await scenarioModule.presenters.chat_dashboard_summary?.({
        workspace_id: "workspace-1",
        actor_id: "actor-1",
      });
    const handoff =
      await scenarioModule.adapters.web_run_workbench?.create_handoff({
        handoff_type: "indexing",
        source_refs: [
          {
            schema_version: 1,
            namespace: "example",
            object_type: "record",
            object_id: "record-1",
            version: 1,
          },
        ],
        requested_purpose: "knowledge_indexing",
        policy_key: "example.can_index",
        downstream_owner: "indexing",
        meta: {
          workspace_id: "workspace-1",
          actor_id: "actor-1",
          idempotency_key: "handoff-1",
          correlation_id: "correlation-1",
          client_surface: "web_run_workbench",
        },
      });

    expect(summary).toMatchObject({ safe_title: "Example dashboard" });
    expect(handoff).toMatchObject({
      handoff_type: "indexing",
      status: "requested",
      source_refs: [
        {
          namespace: "example",
          object_type: "record",
          object_id: "record-1",
        },
      ],
    });
    expect(handoff).not.toHaveProperty("body");
    expect(handoff).not.toHaveProperty("payload");
  });
});
