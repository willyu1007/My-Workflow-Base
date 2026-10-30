import { describe,expect,it } from "vitest";
import { scenarioModule } from "../src/module.js";

describe("example scenario journey", () => {

  it("BA-28 starter journey 的 refs-only handoff 不夹带 domain body", async () => {
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

    expect(result?.handoff_drafts).toEqual([
      {
        draft_key: "step-1:index-example-summary",
        handoff_key: "index-example-summary",
        requested_purpose: "knowledge_indexing",
        source_refs: [
          {
            schema_version: 1,
            namespace: "example",
            object_type: "record",
            object_id: "run-1",
            version: 1,
          },
        ],
      },
    ]);
  });
});
