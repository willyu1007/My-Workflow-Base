import type { RegisteredWorkflowScenario, WorkflowStepHandler } from "@host/workflow-contracts";
import type { WorkflowRegistry } from "./loader.js";

export type StepHandlerBindingIdentity = {
  scenario_key: string;
  capability_key: string;
  entrypoint_key: string;
  workflow_version_id: string;
  step_key: string;
  handler_key: string;
  contract_hash: string;
};

export type ResolvedStepHandlerBinding = {
  scenario: RegisteredWorkflowScenario;
  handler: WorkflowStepHandler;
};

export function buildStepHandlerBindingKey(input: StepHandlerBindingIdentity): string {
  return [
    input.scenario_key,
    input.capability_key,
    input.entrypoint_key,
    input.workflow_version_id,
    input.step_key,
    input.handler_key,
    input.contract_hash,
  ].join(":");
}

export function resolveScenario(
  registry: WorkflowRegistry,
  scenario_key: string,
): RegisteredWorkflowScenario {
  const scenario = registry.scenarios.get(scenario_key);
  if (!scenario) {
    throw new Error(`workflow scenario not registered: ${scenario_key}`);
  }
  return scenario;
}

export function resolveStepHandler(
  registry: WorkflowRegistry,
  input: StepHandlerBindingIdentity,
): WorkflowStepHandler {
  return resolveStepHandlerBinding(registry, input).handler;
}

export function resolveStepHandlerBinding(
  registry: WorkflowRegistry,
  input: StepHandlerBindingIdentity,
): ResolvedStepHandlerBinding {
  const descriptor = registry.handlers.get(buildStepHandlerBindingKey(input));
  const handler = descriptor?.handlers[input.handler_key];
  if (!handler) {
    throw new Error(`workflow handler not registered for identity: ${buildStepHandlerBindingKey(input)}`);
  }
  return { scenario: descriptor, handler };
}
