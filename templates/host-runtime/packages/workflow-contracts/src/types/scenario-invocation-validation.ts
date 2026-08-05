import { assertCanonicalRef } from "./federation-validation.js";
import {
  scenarioIngressCategories,
  scenarioPrincipalOrigins,
  type ScenarioHumanPrincipalV1,
  type ScenarioIngressSurfaceV1,
  type ScenarioPrivateInvocationV1,
} from "./scenario-invocation.js";

export class ScenarioInvocationValidationError extends Error {
  constructor(readonly code: string, readonly path: string, message: string) {
    super(message);
    this.name = "ScenarioInvocationValidationError";
  }
}

const invocationKeys = new Set([
  "invocation_version",
  "contract_version",
  "contract_hash",
  "issuer",
  "assertion_audience",
  "caller_binding",
  "principal",
  "route",
  "request",
  "operation",
]);
const callerBindingKeys = new Set(["caller_subject"]);
const principalKeys = new Set([
  "principal_version",
  "principal_kind",
  "account_ref",
  "actor_ref",
  "workspace_ref",
  "principal_origin",
]);
const ingressKeys = new Set(["ingress_version", "ingress_category", "ingress_key"]);
const routeKeys = new Set(["scenario_key", "endpoint_key", "method", "ingress"]);
const requestKeys = new Set([
  "request_id",
  "correlation_id",
  "trace_id",
  "issued_at",
  "expires_at",
  "nonce",
]);
const operationKeys = new Set(["operation_key", "input_schema_version", "input"]);
const principalOrigins = new Set<string>(scenarioPrincipalOrigins);
const ingressCategories = new Set<string>(scenarioIngressCategories);
const machineKeyPattern = /^[a-z][a-z0-9._:-]{0,127}$/u;
const scenarioKeyPattern = /^[a-z][a-z0-9-]{0,63}$/u;
const opaqueIdPattern = /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,199}$/u;
const noncePattern = /^[A-Za-z0-9_-]{32,256}$/u;
const sourceHashPattern = /^[a-f0-9]{64}$/u;
const canonicalInstantPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;
const maximumInvocationLifetimeMs = 60_000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const fail: (code: string, path: string, message: string) => never = (code, path, message) => {
  throw new ScenarioInvocationValidationError(code, path, message);
};

const assertRecord = (value: unknown, path: string): Record<string, unknown> => {
  if (!isRecord(value)) fail("invalid_object", path, `${path} must be an object`);
  return value;
};

const assertKeys = (record: Record<string, unknown>, allowed: Set<string>, path: string) => {
  const unknown = Object.keys(record).filter((key) => !allowed.has(key));
  if (unknown.length > 0) {
    fail("unknown_field", path, `${path} contains unknown fields: ${unknown.join(", ")}`);
  }
};

const assertMachineKey = (value: unknown, path: string) => {
  if (typeof value !== "string" || !machineKeyPattern.test(value)) {
    fail("invalid_machine_key", path, `${path} must be a bounded lowercase machine key`);
  }
};

const assertOpaqueId = (value: unknown, path: string) => {
  if (typeof value !== "string" || !opaqueIdPattern.test(value)) {
    fail("invalid_opaque_id", path, `${path} must be a bounded opaque identifier`);
  }
};

const assertCanonicalInstant = (value: unknown, path: string): number => {
  if (typeof value !== "string" || !canonicalInstantPattern.test(value)) {
    fail("invalid_instant", path, `${path} must be a canonical UTC instant`);
  }
  const epoch = Date.parse(value);
  if (!Number.isFinite(epoch) || new Date(epoch).toISOString() !== value) {
    fail("invalid_instant", path, `${path} must be a valid canonical UTC instant`);
  }
  return epoch;
};

const assertPrincipalRef = (
  value: unknown,
  objectType: "user" | "actor" | "workspace",
  path: string,
) => {
  assertCanonicalRef(value, path);
  if (value.namespace !== "my_chat" || value.object_type !== objectType) {
    fail("invalid_principal_ref", path, `${path} must be my_chat/${objectType}`);
  }
  assertOpaqueId(value.object_id, `${path}.object_id`);
};

export const assertScenarioHumanPrincipalV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioHumanPrincipalV1 = (value, path = "principal") => {
  const record = assertRecord(value, path);
  assertKeys(record, principalKeys, path);
  if (record.principal_version !== 1) {
    fail("invalid_principal", `${path}.principal_version`, "principal_version must be 1");
  }
  if (record.principal_kind !== "human_user") {
    fail("invalid_principal", `${path}.principal_kind`, "principal_kind must be human_user");
  }
  assertPrincipalRef(record.account_ref, "user", `${path}.account_ref`);
  assertPrincipalRef(record.actor_ref, "actor", `${path}.actor_ref`);
  assertPrincipalRef(record.workspace_ref, "workspace", `${path}.workspace_ref`);
  if (typeof record.principal_origin !== "string" || !principalOrigins.has(record.principal_origin)) {
    fail("invalid_principal", `${path}.principal_origin`, "principal_origin is invalid");
  }
};

export const assertScenarioIngressSurfaceV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioIngressSurfaceV1 = (value, path = "ingress") => {
  const record = assertRecord(value, path);
  assertKeys(record, ingressKeys, path);
  if (record.ingress_version !== 1) {
    fail("invalid_ingress", `${path}.ingress_version`, "ingress_version must be 1");
  }
  if (typeof record.ingress_category !== "string" || !ingressCategories.has(record.ingress_category)) {
    fail("invalid_ingress", `${path}.ingress_category`, "ingress_category is invalid");
  }
  assertMachineKey(record.ingress_key, `${path}.ingress_key`);
};

export const assertScenarioPrivateInvocationV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioPrivateInvocationV1 = (value, path = "invocation") => {
  const record = assertRecord(value, path);
  assertKeys(record, invocationKeys, path);
  if (record.invocation_version !== 1) {
    fail("invalid_invocation", `${path}.invocation_version`, "invocation_version must be 1");
  }
  if (record.contract_version !== 1) {
    fail("invalid_invocation", `${path}.contract_version`, "contract_version must be 1");
  }
  if (typeof record.contract_hash !== "string" || !sourceHashPattern.test(record.contract_hash)) {
    fail("invalid_contract_hash", `${path}.contract_hash`, "contract_hash must be lowercase SHA-256");
  }
  assertMachineKey(record.issuer, `${path}.issuer`);
  assertMachineKey(record.assertion_audience, `${path}.assertion_audience`);

  const callerBinding = assertRecord(record.caller_binding, `${path}.caller_binding`);
  assertKeys(callerBinding, callerBindingKeys, `${path}.caller_binding`);
  assertOpaqueId(callerBinding.caller_subject, `${path}.caller_binding.caller_subject`);

  assertScenarioHumanPrincipalV1(record.principal, `${path}.principal`);

  const route = assertRecord(record.route, `${path}.route`);
  assertKeys(route, routeKeys, `${path}.route`);
  if (typeof route.scenario_key !== "string" || !scenarioKeyPattern.test(route.scenario_key)) {
    fail("invalid_scenario_key", `${path}.route.scenario_key`, "scenario_key is invalid");
  }
  assertMachineKey(route.endpoint_key, `${path}.route.endpoint_key`);
  if (route.method !== "POST") {
    fail("invalid_method", `${path}.route.method`, "scenario private invocations must use POST");
  }
  assertScenarioIngressSurfaceV1(route.ingress, `${path}.route.ingress`);

  const request = assertRecord(record.request, `${path}.request`);
  assertKeys(request, requestKeys, `${path}.request`);
  assertOpaqueId(request.request_id, `${path}.request.request_id`);
  assertOpaqueId(request.correlation_id, `${path}.request.correlation_id`);
  if (request.trace_id !== undefined) {
    assertOpaqueId(request.trace_id, `${path}.request.trace_id`);
  }
  const issuedAt = assertCanonicalInstant(request.issued_at, `${path}.request.issued_at`);
  const expiresAt = assertCanonicalInstant(request.expires_at, `${path}.request.expires_at`);
  if (expiresAt <= issuedAt || expiresAt - issuedAt > maximumInvocationLifetimeMs) {
    fail(
      "invalid_lifetime",
      `${path}.request.expires_at`,
      "expires_at must be after issued_at and no more than 60 seconds later",
    );
  }
  if (typeof request.nonce !== "string" || !noncePattern.test(request.nonce)) {
    fail("invalid_nonce", `${path}.request.nonce`, "nonce must be 32-256 base64url characters");
  }

  const operation = assertRecord(record.operation, `${path}.operation`);
  assertKeys(operation, operationKeys, `${path}.operation`);
  assertMachineKey(operation.operation_key, `${path}.operation.operation_key`);
  if (!Number.isInteger(operation.input_schema_version) || Number(operation.input_schema_version) < 1) {
    fail(
      "invalid_schema_version",
      `${path}.operation.input_schema_version`,
      "input_schema_version must be a positive integer",
    );
  }
  if (!Object.hasOwn(operation, "input")) {
    fail("missing_input", `${path}.operation.input`, "operation.input is required");
  }
};
