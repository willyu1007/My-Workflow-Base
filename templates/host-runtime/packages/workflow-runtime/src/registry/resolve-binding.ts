import {
  assertScenarioPrivateInvocationV1,
  type RegisteredWorkflowScenario,
  type ScenarioManifestV2,
  type WorkflowStepHandler,
  type WorkflowTrustedInvocationHandler,
  type WorkflowVerifiedScenarioInvocationV1,
} from "@host/workflow-contracts";
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

export type ResolvedTrustedInvocationHandlerBinding = {
  scenario: RegisteredWorkflowScenario;
  handler_key: string;
  handler: WorkflowTrustedInvocationHandler;
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

export function resolveTrustedInvocationHandlerBinding(
  registry: WorkflowRegistry,
  verified: WorkflowVerifiedScenarioInvocationV1,
): ResolvedTrustedInvocationHandlerBinding {
  assertScenarioPrivateInvocationV1(verified.invocation);
  const invocation = verified.invocation;
  const declaration = verified.declaration;
  if (
    declaration.scenario_key !== invocation.route.scenario_key ||
    declaration.endpoint_key !== invocation.route.endpoint_key ||
    declaration.method !== invocation.route.method ||
    declaration.operation_key !== invocation.operation.operation_key ||
    declaration.input_schema_version !== invocation.operation.input_schema_version ||
    declaration.ingress_category !== invocation.route.ingress.ingress_category ||
    declaration.ingress_key !== invocation.route.ingress.ingress_key ||
    !declaration.principal_origins.includes(invocation.principal.principal_origin)
  ) {
    throw new Error("verified scenario invocation declaration does not match invocation");
  }

  const scenario = resolveScenario(registry, invocation.route.scenario_key);
  if (scenario.contract_hash !== invocation.contract_hash) {
    throw new Error(`verified scenario invocation contract hash is not registered: ${invocation.contract_hash}`);
  }
  const manifest = scenario.manifest as ScenarioManifestV2;
  if (manifest.manifest_version !== 2 || !manifest.scenario_contracts) {
    throw new Error(`trusted scenario invocation contract is not registered: ${scenario.scenario_key}`);
  }
  const matchingOperations = manifest.scenario_contracts.trusted_invocation.operations
    .filter((operation) =>
      operation.endpoint_key === declaration.endpoint_key &&
      operation.method === declaration.method &&
      operation.operation_key === declaration.operation_key &&
      operation.input_schema_version === declaration.input_schema_version);
  if (matchingOperations.length !== 1) {
    throw new Error(`trusted scenario invocation operation is absent or ambiguous: ${declaration.operation_key}`);
  }
  const operation = matchingOperations[0];
  if (!operation) throw new Error("unreachable trusted scenario operation selection");
  const ingressMatches = operation.ingress.filter((ingress) =>
    ingress.ingress_category === declaration.ingress_category &&
    ingress.ingress_key === declaration.ingress_key &&
    ingress.principal_origins.includes(invocation.principal.principal_origin));
  if (ingressMatches.length !== 1) {
    throw new Error(`trusted scenario invocation ingress is absent or ambiguous: ${declaration.ingress_key}`);
  }
  const handler = scenario.trusted_invocation_handlers[operation.handler_key];
  if (!handler) {
    throw new Error(`trusted scenario invocation handler is not registered: ${operation.handler_key}`);
  }
  return { scenario, handler_key: operation.handler_key, handler };
}

export async function dispatchTrustedScenarioInvocation(
  registry: WorkflowRegistry,
  verified: WorkflowVerifiedScenarioInvocationV1,
): Promise<unknown> {
  const binding = resolveTrustedInvocationHandlerBinding(registry, verified);
  return binding.handler({
    invocation: verified.invocation,
    declaration: {
      scenario_key: verified.declaration.scenario_key,
      endpoint_key: verified.declaration.endpoint_key,
      method: verified.declaration.method,
      operation_key: verified.declaration.operation_key,
      input_schema_version: verified.declaration.input_schema_version,
      ingress_category: verified.declaration.ingress_category,
      ingress_key: verified.declaration.ingress_key,
      principal_origins: [...verified.declaration.principal_origins],
    },
  });
}
