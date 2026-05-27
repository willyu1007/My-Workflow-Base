import type { WorkflowScenarioModule } from "@host/workflow-contracts";
import { exampleAdapters } from "./adapters/chat-workflow.adapter.js";
import { exampleActions } from "./actions/example-action.js";
import { exampleHandlers } from "./handlers/example-step.handler.js";
import { examplePolicies } from "./policies.js";
import { examplePresenters } from "./presenters.js";
import { scenarioManifest } from "./registry.js";

export const scenarioModule: WorkflowScenarioModule = {
  manifest: scenarioManifest,
  handlers: exampleHandlers,
  actions: exampleActions,
  adapters: exampleAdapters,
  presenters: examplePresenters,
  policies: examplePolicies,
  internal_api_handlers: {},
};
