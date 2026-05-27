import type { RegisteredWorkflowScenario, WorkflowScenarioModule } from "@host/workflow-contracts";
import type { WorkflowHostValidationSnapshot, WorkflowModuleValidationReport } from "@host/workflow-contracts";
import { createWorkflowDescriptor } from "./descriptor.js";
import { validateWorkflowModule } from "../validation/validate-module.js";
import { buildStepHandlerBindingKey } from "./resolve-binding.js";

export type WorkflowRegistry = {
  scenarios: ReadonlyMap<string, RegisteredWorkflowScenario>;
  handlers: ReadonlyMap<string, RegisteredWorkflowScenario>;
};

function readonlyMap<K, V>(source: Map<K, V>, label: string): ReadonlyMap<K, V> {
  const target = new Map(source);
  return new Proxy(target, {
    get(mapTarget, property) {
      if (property === "set" || property === "delete" || property === "clear") {
        return () => {
          throw new Error(`workflow registry ${label} map is read-only`);
        };
      }

      const value = Reflect.get(mapTarget, property, mapTarget) as unknown;
      return typeof value === "function" ? value.bind(mapTarget) : value;
    },
  }) as ReadonlyMap<K, V>;
}

function entrypointWorkflowVersionId(input: {
  scenario_key: string;
  capability_key: string;
  entrypoint_key: string;
  workflow_version: number;
  workflow_version_id?: string;
}): string {
  return (
    input.workflow_version_id ??
    `${input.scenario_key}:${input.capability_key}:${input.entrypoint_key}:v${input.workflow_version}`
  );
}

export function loadWorkflowRegistry(input: {
  modules: WorkflowScenarioModule[];
  host_snapshot: WorkflowHostValidationSnapshot;
}): WorkflowRegistry {
  const scenarios = new Map<string, RegisteredWorkflowScenario>();
  const handlers = new Map<string, RegisteredWorkflowScenario>();

  for (const module of input.modules) {
    const report: WorkflowModuleValidationReport = validateWorkflowModule({
      module,
      host_snapshot: input.host_snapshot,
      activation_target: module.manifest.launch_phase,
    });

    if (!report.passed) {
      throw new Error(`workflow module validation failed: ${module.manifest.scenario_key}`);
    }

    const descriptor = createWorkflowDescriptor(module, report);
    if (scenarios.has(descriptor.scenario_key)) {
      throw new Error(`workflow scenario registered more than once: ${descriptor.scenario_key}`);
    }
    scenarios.set(descriptor.scenario_key, descriptor);

    for (const capability of descriptor.manifest.capabilities) {
      for (const entrypoint of capability.entrypoints) {
        for (const step of entrypoint.steps) {
          const key = buildStepHandlerBindingKey({
            scenario_key: descriptor.scenario_key,
            capability_key: capability.capability_key,
            entrypoint_key: entrypoint.entrypoint_key,
            workflow_version_id: entrypointWorkflowVersionId({
              scenario_key: descriptor.scenario_key,
              capability_key: capability.capability_key,
              entrypoint_key: entrypoint.entrypoint_key,
              workflow_version: entrypoint.workflow_version,
              workflow_version_id: entrypoint.workflow_version_id,
            }),
            step_key: step.step_key,
            handler_key: step.handler_key,
            contract_hash: descriptor.contract_hash,
          });

          if (handlers.has(key)) {
            throw new Error(`workflow handler binding registered more than once: ${key}`);
          }

          handlers.set(key, descriptor);
        }
      }
    }
  }

  return Object.freeze({
    scenarios: readonlyMap(scenarios, "scenarios"),
    handlers: readonlyMap(handlers, "handlers"),
  });
}
