import type { RegisteredWorkflowScenario, WorkflowScenarioModule } from "@host/workflow-contracts";
import type { WorkflowModuleValidationReport } from "@host/workflow-contracts";

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return value;
  }

  for (const property of Object.getOwnPropertyNames(value)) {
    const child = (value as Record<string, unknown>)[property];
    deepFreeze(child);
  }

  return Object.freeze(value);
}

export function createWorkflowDescriptor(
  module: WorkflowScenarioModule,
  validation: WorkflowModuleValidationReport,
): RegisteredWorkflowScenario {
  return deepFreeze({
    scenario_key: module.manifest.scenario_key,
    contract_hash: validation.contract_hash,
    manifest: module.manifest,
    handlers: Object.freeze({ ...module.handlers }),
    actions: Object.freeze({ ...module.actions }),
    adapters: Object.freeze({ ...module.adapters }),
    presenters: Object.freeze({ ...module.presenters }),
    policies: Object.freeze({ ...module.policies }),
    internal_api_handlers: Object.freeze({ ...module.internal_api_handlers }),
    validation,
  });
}
