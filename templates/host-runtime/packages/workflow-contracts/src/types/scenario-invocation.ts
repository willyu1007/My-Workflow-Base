import type { CanonicalRef } from "./identity.js";

export const scenarioPrincipalOrigins = ["interactive_session", "durable_run_actor"] as const;
export type ScenarioPrincipalOrigin = (typeof scenarioPrincipalOrigins)[number];

export const scenarioIngressCategories = [
  "product_surface",
  "host_transition",
  "workflow_runtime",
] as const;
export type ScenarioIngressCategory = (typeof scenarioIngressCategories)[number];

export type ScenarioHumanPrincipalV1 = {
  principal_version: 1;
  principal_kind: "human_user";
  account_ref: CanonicalRef;
  actor_ref: CanonicalRef;
  workspace_ref: CanonicalRef;
  principal_origin: ScenarioPrincipalOrigin;
};

export type ScenarioIngressSurfaceV1 = {
  ingress_version: 1;
  ingress_category: ScenarioIngressCategory;
  ingress_key: string;
};

export type ScenarioInvocationCallerBindingV1 = {
  caller_subject: string;
};

export type ScenarioInvocationRouteV1 = {
  scenario_key: string;
  endpoint_key: string;
  method: "POST";
  ingress: ScenarioIngressSurfaceV1;
};

export type ScenarioInvocationRequestV1 = {
  request_id: string;
  correlation_id: string;
  trace_id?: string;
  issued_at: string;
  expires_at: string;
  nonce: string;
};

export type ScenarioInvocationOperationV1<TInput = unknown> = {
  operation_key: string;
  input_schema_version: number;
  input: TInput;
};

/**
 * Signed private invocation body. Detached signatures and service credentials
 * are transport concerns and must never be embedded in this object.
 */
export type ScenarioPrivateInvocationV1<TInput = unknown> = {
  invocation_version: 1;
  contract_version: 1;
  contract_hash: string;
  issuer: string;
  assertion_audience: string;
  caller_binding: ScenarioInvocationCallerBindingV1;
  principal: ScenarioHumanPrincipalV1;
  route: ScenarioInvocationRouteV1;
  request: ScenarioInvocationRequestV1;
  operation: ScenarioInvocationOperationV1<TInput>;
};
