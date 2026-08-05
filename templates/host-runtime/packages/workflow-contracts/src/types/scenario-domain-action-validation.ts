import { assertCanonicalRef } from "./federation-validation.js";
import {
  scenarioDomainActionConfirmationClassesV1,
  scenarioDomainActionDriversV1,
  type ScenarioDomainActionClaimedStepAssertionV1,
  type ScenarioDomainActionContractV1,
  type ScenarioDomainActionDriverV1,
  type ScenarioDomainActionWorkflowStepRefV1,
} from "./scenario-domain-action.js";

export class ScenarioDomainActionValidationError extends Error {
  constructor(readonly code: string, readonly path: string, message: string) {
    super(message);
    this.name = "ScenarioDomainActionValidationError";
  }
}

const actionContractKeys = new Set([
  "action_contract_version",
  "scenario_key",
  "action_key",
  "input_schema_key",
  "input_schema_version",
  "target_ref_class",
  "confirmation_class",
  "entitled_ingress_keys",
  "handler_key",
  "command_contract",
  "driver",
]);
const commandContractKeys = new Set(["command_key", "command_contract_version"]);
const workflowStepRefKeys = new Set([
  "schema_version",
  "namespace",
  "object_type",
  "object_id",
]);
const claimedStepAssertionKeys = new Set([
  "step_assertion_version",
  "workflow_step_ref",
  "workspace_ref",
  "principal_provenance_hash",
  "scenario_key",
  "action_key",
  "handler_key",
  "action_contract_hash",
  "driver",
  "client_mutation_id",
  "request_correlation_hash",
]);
const drivers = new Set<string>(scenarioDomainActionDriversV1);
const confirmationClasses = new Set<string>(scenarioDomainActionConfirmationClassesV1);
const machineKeyPattern = /^[a-z][a-z0-9._:-]{0,127}$/u;
const opaqueIdPattern = /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,199}$/u;
const sha256Pattern = /^[a-f0-9]{64}$/u;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const fail: (code: string, path: string, message: string) => never = (code, path, message) => {
  throw new ScenarioDomainActionValidationError(code, path, message);
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

const assertPositiveInteger = (value: unknown, path: string) => {
  if (!Number.isInteger(value) || Number(value) < 1) {
    fail("invalid_version", path, `${path} must be a positive integer`);
  }
};

const assertSha256 = (value: unknown, path: string) => {
  if (typeof value !== "string" || !sha256Pattern.test(value)) {
    fail("invalid_sha256", path, `${path} must be lowercase SHA-256`);
  }
};

const assertWorkspaceRef = (value: unknown, path: string) => {
  assertCanonicalRef(value, path);
  if (value.namespace !== "my_chat" || value.object_type !== "workspace") {
    fail("invalid_workspace_ref", path, `${path} must be my_chat/workspace`);
  }
  if (!opaqueIdPattern.test(value.object_id)) {
    fail("invalid_workspace_ref", `${path}.object_id`, `${path}.object_id must be opaque`);
  }
};

export const assertScenarioDomainActionDriverV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioDomainActionDriverV1 = (value, path = "driver") => {
  if (typeof value !== "string" || !drivers.has(value)) {
    fail("invalid_driver", path, `${path} must be a registered static domain-action driver`);
  }
};

export const assertScenarioDomainActionContractV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioDomainActionContractV1 = (value, path = "action_contract") => {
  const record = assertRecord(value, path);
  assertKeys(record, actionContractKeys, path);
  if (record.action_contract_version !== 1) {
    fail("invalid_version", `${path}.action_contract_version`, "action_contract_version must be 1");
  }
  for (const key of [
    "scenario_key",
    "action_key",
    "input_schema_key",
    "target_ref_class",
    "handler_key",
  ] as const) {
    assertMachineKey(record[key], `${path}.${key}`);
  }
  assertPositiveInteger(record.input_schema_version, `${path}.input_schema_version`);
  if (
    typeof record.confirmation_class !== "string" ||
    !confirmationClasses.has(record.confirmation_class)
  ) {
    fail(
      "invalid_confirmation_class",
      `${path}.confirmation_class`,
      `${path}.confirmation_class is invalid`,
    );
  }
  if (
    !Array.isArray(record.entitled_ingress_keys) ||
    record.entitled_ingress_keys.length < 1 ||
    record.entitled_ingress_keys.length > 16
  ) {
    fail(
      "invalid_ingress_keys",
      `${path}.entitled_ingress_keys`,
      `${path}.entitled_ingress_keys must contain 1 through 16 keys`,
    );
  }
  const ingressKeys = record.entitled_ingress_keys;
  ingressKeys.forEach((key, index) =>
    assertMachineKey(key, `${path}.entitled_ingress_keys.${index}`),
  );
  for (let index = 1; index < ingressKeys.length; index += 1) {
    if (String(ingressKeys[index - 1]) >= String(ingressKeys[index])) {
      fail(
        "unordered_ingress_keys",
        `${path}.entitled_ingress_keys.${index}`,
        `${path}.entitled_ingress_keys must be unique and lexicographically ordered`,
      );
    }
  }
  const commandContract = assertRecord(record.command_contract, `${path}.command_contract`);
  assertKeys(commandContract, commandContractKeys, `${path}.command_contract`);
  assertMachineKey(commandContract.command_key, `${path}.command_contract.command_key`);
  assertPositiveInteger(
    commandContract.command_contract_version,
    `${path}.command_contract.command_contract_version`,
  );
  assertScenarioDomainActionDriverV1(record.driver, `${path}.driver`);
};

export const assertScenarioDomainActionWorkflowStepRefV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioDomainActionWorkflowStepRefV1 = (
  value,
  path = "workflow_step_ref",
) => {
  const record = assertRecord(value, path);
  assertKeys(record, workflowStepRefKeys, path);
  if (
    record.schema_version !== 1 ||
    record.namespace !== "my_chat" ||
    record.object_type !== "workflow_step" ||
    typeof record.object_id !== "string" ||
    !opaqueIdPattern.test(record.object_id)
  ) {
    fail("invalid_workflow_step_ref", path, `${path} must be an exact my_chat/workflow_step ref`);
  }
};

export const assertScenarioDomainActionClaimedStepAssertionV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioDomainActionClaimedStepAssertionV1 = (
  value,
  path = "step_assertion",
) => {
  const record = assertRecord(value, path);
  assertKeys(record, claimedStepAssertionKeys, path);
  if (record.step_assertion_version !== 1) {
    fail("invalid_version", `${path}.step_assertion_version`, "step_assertion_version must be 1");
  }
  assertScenarioDomainActionWorkflowStepRefV1(
    record.workflow_step_ref,
    `${path}.workflow_step_ref`,
  );
  assertWorkspaceRef(record.workspace_ref, `${path}.workspace_ref`);
  assertSha256(record.principal_provenance_hash, `${path}.principal_provenance_hash`);
  assertMachineKey(record.scenario_key, `${path}.scenario_key`);
  assertMachineKey(record.action_key, `${path}.action_key`);
  assertMachineKey(record.handler_key, `${path}.handler_key`);
  assertSha256(record.action_contract_hash, `${path}.action_contract_hash`);
  if (record.driver !== "workflow_claimed_step_v1") {
    fail(
      "invalid_driver",
      `${path}.driver`,
      "claimed Step assertions require workflow_claimed_step_v1",
    );
  }
  if (
    typeof record.client_mutation_id !== "string" ||
    !opaqueIdPattern.test(record.client_mutation_id) ||
    record.client_mutation_id.length > 128
  ) {
    fail(
      "invalid_client_mutation_id",
      `${path}.client_mutation_id`,
      `${path}.client_mutation_id must be a 1-128 character opaque identifier`,
    );
  }
  assertSha256(record.request_correlation_hash, `${path}.request_correlation_hash`);
};

export const assertScenarioDomainActionStaticDriverV1 = (
  contract: unknown,
  driver: unknown,
): void => {
  assertScenarioDomainActionContractV1(contract);
  assertScenarioDomainActionDriverV1(driver, "execution.driver");
  if (contract.driver !== driver) {
    fail(
      "driver_mismatch",
      "execution.driver",
      "execution driver must match the immutable action contract",
    );
  }
};
