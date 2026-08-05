import { assertCanonicalRef } from "./federation-validation.js";
import type { CanonicalRef } from "./identity.js";
import type { ScenarioHandoffRequestSnapshot } from "./handoff.js";
import {
  assertScenarioActionTargetRefV1,
  assertScenarioSafeReasonV1,
  assertScenarioSafeTextV1,
} from "./scenario-presentation-validation.js";
import {
  scenarioDomainActionConfirmationClassesV1,
  scenarioDomainActionDriversV1,
  type ScenarioDomainActionClaimedStepAssertionV1,
  type ScenarioDomainActionContractV1,
  type ScenarioDomainActionDriverV1,
  type ScenarioDomainActionWorkflowStepRefV1,
  type PrepareScenarioDomainActionInputV1,
  type PrepareScenarioDomainActionResultV1,
  type ScenarioAuthenticationAssuranceEvidenceV1,
  type ScenarioDomainActionConfirmationPromptV1,
  type ScenarioDomainActionSubmitEchoV1,
  type SubmitScenarioDomainActionInputV1,
  type ScenarioDomainActionCurrentResultV1,
  type ScenarioDomainActionEffectIdentityInputV1,
  type ScenarioDomainActionExecutionBindingV1,
  type ScenarioDomainActionExecutionResultV1,
  type SubmitScenarioDomainActionResultV1,
  type BindScenarioDomainActionStepInputV1,
  type BindScenarioDomainActionStepResultV1,
  type LookupScenarioDomainActionStepBindingInputV1,
  type LookupScenarioDomainActionStepBindingResultV1,
  type ScenarioDomainActionClaimedStepDriverV1,
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
const prepareInputKeys = new Set([
  "prepare_version",
  "action_key",
  "target_ref",
  "expected_version",
  "action_input",
]);
const confirmationPromptKeys = new Set(["confirmation_class", "prompt"]);
const preparedResultKeys = new Set([
  "status",
  "submit_token",
  "confirmation",
  "issued_at",
  "expires_at",
]);
const safeResultKeys = new Set(["status", "safe_reason"]);
const submitEchoKeys = new Set([
  "submit_version",
  "submit_token",
  "confirmation",
  "client_mutation_id",
]);
const assuranceEvidenceKeys = new Set([
  "assurance_evidence_version",
  "assurance_class",
  "principal_binding_hash",
  "ceremony_evidence_hash",
  "verified_at",
  "expires_at",
]);
const submitInputKeys = new Set([
  "submit_request_version",
  "client_echo",
  "authentication_assurance",
]);
const directEffectIdentityKeys = new Set([
  "effect_identity_version",
  "driver",
  "workspace_ref",
  "scenario_key",
  "action_key",
  "submit_context_ref",
]);
const claimedEffectIdentityKeys = new Set([
  "effect_identity_version",
  "driver",
  "workspace_ref",
  "scenario_key",
  "action_key",
  "original_workflow_step_ref",
]);
const executionBindingKeys = new Set([
  "execution_binding_version",
  "effect_identity",
  "canonical_payload_hash",
]);
const committedExecutionResultKeys = new Set([
  "status",
  "disposition",
  "business_outcome",
  "execution_ref",
  "output_refs",
  "handoff_request_snapshots",
]);
const notCommittedExecutionResultKeys = new Set([
  "status",
  "decision",
  "safe_reason",
]);
const safeExecutionResultKeys = new Set(["status", "safe_reason"]);
const handoffSnapshotKeys = new Set([
  "requestId",
  "handoffKey",
  "requestedPurpose",
  "sourceContextRefs",
  "sourceArtifactRefs",
  "expiresAt",
]);
const currentSimpleResultKeys = new Set(["state"]);
const currentUnavailableResultKeys = new Set(["state", "safe_reason"]);
const submitAcceptedResultKeys = new Set(["status"]);
const submitCompletedResultKeys = new Set(["status", "current_result"]);
const bindStepInputKeys = new Set([
  "step_binding_version",
  "submit",
  "step_assertion",
]);
const boundStepResultKeys = new Set([
  "status",
  "workflow_step_ref",
  "binding_evidence_hash",
  "context_expires_at",
]);
const lookupStepInputKeys = new Set([
  "binding_lookup_version",
  "workflow_step_ref",
]);
const lookupNotBoundResultKeys = new Set(["status"]);
const claimedStepDriverKeys = new Set([
  "claimed_driver_version",
  "workflow_step_ref",
  "action_contract_hash",
  "claim_token",
  "expected_step_version",
]);
const drivers = new Set<string>(scenarioDomainActionDriversV1);
const confirmationClasses = new Set<string>(scenarioDomainActionConfirmationClassesV1);
const machineKeyPattern = /^[a-z][a-z0-9._:-]{0,127}$/u;
const opaqueIdPattern = /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,199}$/u;
const sha256Pattern = /^[a-f0-9]{64}$/u;
const opaqueLocatorPattern = /^[A-Za-z0-9_-]{32,512}$/u;
const opaqueVersionPattern = /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,199}$/u;
const canonicalInstantPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;
const maximumSubmitContextLifetimeMs = 5 * 60 * 1000;
const maximumActionInputBytes = 32 * 1024;
const maximumExecutionResultBytes = 64 * 1024;
const maximumSubmitResultBytes = 8 * 1024;
const maximumResultRefs = 32;
const executionDispositions = new Set(["executed", "replayed"]);
const businessOutcomes = new Set(["applied", "already_satisfied"]);
const notCommittedDecisions = new Set([
  "invalid_request",
  "request_conflict",
  "rate_limited",
]);

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

const assertOpaqueLocator = (value: unknown, path: string) => {
  if (typeof value !== "string" || !opaqueLocatorPattern.test(value)) {
    fail(
      "invalid_opaque_locator",
      path,
      `${path} must be a 32-512 character opaque base64url value`,
    );
  }
};

const assertOpaqueVersion = (value: unknown, path: string) => {
  if (typeof value !== "string" || !opaqueVersionPattern.test(value)) {
    fail("invalid_opaque_version", path, `${path} must be a bounded opaque version`);
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

const serializedUtf8Bytes = (value: unknown, path: string): number => {
  let serialized: string | undefined;
  try {
    serialized = JSON.stringify(value);
  } catch {
    fail("invalid_json_value", path, `${path} must be JSON serializable`);
  }
  if (serialized === undefined) {
    fail("invalid_json_value", path, `${path} must be JSON serializable`);
  }
  return Buffer.byteLength(serialized, "utf8");
};

const assertWorkspaceRef: (
  value: unknown,
  path: string,
) => asserts value is CanonicalRef = (value, path) => {
  assertCanonicalRef(value, path);
  if (value.namespace !== "my_chat" || value.object_type !== "workspace") {
    fail("invalid_workspace_ref", path, `${path} must be my_chat/workspace`);
  }
  if (!opaqueIdPattern.test(value.object_id)) {
    fail("invalid_workspace_ref", `${path}.object_id`, `${path}.object_id must be opaque`);
  }
};

const canonicalRefEquals = (
  left: CanonicalRef,
  right: CanonicalRef,
): boolean =>
  left.schema_version === right.schema_version &&
  left.namespace === right.namespace &&
  left.object_type === right.object_type &&
  left.object_id === right.object_id &&
  left.version === right.version;

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

export const assertPrepareScenarioDomainActionInputV1: (
  value: unknown,
  path?: string,
) => asserts value is PrepareScenarioDomainActionInputV1 = (
  value,
  path = "prepare_input",
) => {
  const record = assertRecord(value, path);
  assertKeys(record, prepareInputKeys, path);
  if (record.prepare_version !== 1) {
    fail("invalid_version", `${path}.prepare_version`, "prepare_version must be 1");
  }
  assertMachineKey(record.action_key, `${path}.action_key`);
  assertScenarioActionTargetRefV1(record.target_ref, `${path}.target_ref`);
  if (record.expected_version !== undefined) {
    assertOpaqueVersion(record.expected_version, `${path}.expected_version`);
  }
  if (!isRecord(record.action_input)) {
    fail("invalid_action_input", `${path}.action_input`, "action_input must be a JSON object");
  }
  if (serializedUtf8Bytes(record.action_input, `${path}.action_input`) > maximumActionInputBytes) {
    fail(
      "action_input_too_large",
      `${path}.action_input`,
      "action_input must be at most 32 KiB UTF-8",
    );
  }
};

export const assertScenarioDomainActionConfirmationPromptV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioDomainActionConfirmationPromptV1 = (
  value,
  path = "confirmation",
) => {
  const record = assertRecord(value, path);
  assertKeys(record, confirmationPromptKeys, path);
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
  assertScenarioSafeTextV1(record.prompt, `${path}.prompt`);
};

export const assertPrepareScenarioDomainActionResultV1: (
  value: unknown,
  path?: string,
) => asserts value is PrepareScenarioDomainActionResultV1 = (
  value,
  path = "prepare_result",
) => {
  const record = assertRecord(value, path);
  if (record.status === "prepared") {
    assertKeys(record, preparedResultKeys, path);
    assertOpaqueLocator(record.submit_token, `${path}.submit_token`);
    assertScenarioDomainActionConfirmationPromptV1(record.confirmation, `${path}.confirmation`);
    const issuedAt = assertCanonicalInstant(record.issued_at, `${path}.issued_at`);
    const expiresAt = assertCanonicalInstant(record.expires_at, `${path}.expires_at`);
    if (
      expiresAt <= issuedAt ||
      expiresAt - issuedAt > maximumSubmitContextLifetimeMs
    ) {
      fail(
        "invalid_lifetime",
        `${path}.expires_at`,
        "prepared context lifetime must be greater than zero and at most five minutes",
      );
    }
    return;
  }
  if (record.status !== "context_changed" && record.status !== "unavailable") {
    fail("invalid_status", `${path}.status`, `${path}.status is invalid`);
  }
  assertKeys(record, safeResultKeys, path);
  assertScenarioSafeReasonV1(record.safe_reason, `${path}.safe_reason`);
};

export const assertScenarioDomainActionSubmitEchoV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioDomainActionSubmitEchoV1 = (
  value,
  path = "client_echo",
) => {
  const record = assertRecord(value, path);
  assertKeys(record, submitEchoKeys, path);
  if (record.submit_version !== 1) {
    fail("invalid_version", `${path}.submit_version`, "submit_version must be 1");
  }
  assertOpaqueLocator(record.submit_token, `${path}.submit_token`);
  if (record.confirmation !== "confirmed") {
    fail("invalid_confirmation", `${path}.confirmation`, "confirmation must be confirmed");
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
};

export const assertScenarioAuthenticationAssuranceEvidenceV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioAuthenticationAssuranceEvidenceV1 = (
  value,
  path = "authentication_assurance",
) => {
  const record = assertRecord(value, path);
  assertKeys(record, assuranceEvidenceKeys, path);
  if (record.assurance_evidence_version !== 1) {
    fail(
      "invalid_version",
      `${path}.assurance_evidence_version`,
      "assurance_evidence_version must be 1",
    );
  }
  assertMachineKey(record.assurance_class, `${path}.assurance_class`);
  assertSha256(record.principal_binding_hash, `${path}.principal_binding_hash`);
  assertSha256(record.ceremony_evidence_hash, `${path}.ceremony_evidence_hash`);
  const verifiedAt = assertCanonicalInstant(record.verified_at, `${path}.verified_at`);
  const expiresAt = assertCanonicalInstant(record.expires_at, `${path}.expires_at`);
  if (
    expiresAt <= verifiedAt ||
    expiresAt - verifiedAt > maximumSubmitContextLifetimeMs
  ) {
    fail(
      "invalid_lifetime",
      `${path}.expires_at`,
      "assurance lifetime must be greater than zero and at most five minutes",
    );
  }
};

export const assertSubmitScenarioDomainActionInputV1: (
  value: unknown,
  path?: string,
) => asserts value is SubmitScenarioDomainActionInputV1 = (
  value,
  path = "submit_input",
) => {
  const record = assertRecord(value, path);
  assertKeys(record, submitInputKeys, path);
  if (record.submit_request_version !== 1) {
    fail(
      "invalid_version",
      `${path}.submit_request_version`,
      "submit_request_version must be 1",
    );
  }
  assertScenarioDomainActionSubmitEchoV1(record.client_echo, `${path}.client_echo`);
  if (record.authentication_assurance !== undefined) {
    assertScenarioAuthenticationAssuranceEvidenceV1(
      record.authentication_assurance,
      `${path}.authentication_assurance`,
    );
  }
};

export const assertPrepareScenarioDomainActionExchangeV1 = (
  contract: unknown,
  input: unknown,
  result: unknown,
  context: {
    scenario_key: string;
    ingress_key: string;
    principal_binding_hash: string;
    target_principal_binding_hash: string;
    workspace_ref: unknown;
    target_workspace_ref: unknown;
    target_ref: string;
    target_ref_class: string;
    current_expected_version?: string;
    input_schema_key: string;
    input_schema_version: number;
    assert_action_input: (value: unknown) => void;
  },
): void => {
  assertScenarioDomainActionContractV1(contract);
  assertPrepareScenarioDomainActionInputV1(input);
  assertPrepareScenarioDomainActionResultV1(result);
  if (contract.scenario_key !== context.scenario_key) {
    fail("scenario_mismatch", "context.scenario_key", "prepare scenario must match the contract");
  }
  if (contract.action_key !== input.action_key) {
    fail("action_mismatch", "prepare_input.action_key", "prepare action must match the contract");
  }
  if (!contract.entitled_ingress_keys.includes(context.ingress_key)) {
    fail("ingress_mismatch", "context.ingress_key", "prepare ingress is not entitled");
  }
  assertSha256(context.principal_binding_hash, "context.principal_binding_hash");
  assertSha256(
    context.target_principal_binding_hash,
    "context.target_principal_binding_hash",
  );
  if (context.principal_binding_hash !== context.target_principal_binding_hash) {
    fail(
      "principal_binding_mismatch",
      "context.principal_binding_hash",
      "prepare target must bind the exact current principal",
    );
  }
  assertWorkspaceRef(context.workspace_ref, "context.workspace_ref");
  assertWorkspaceRef(context.target_workspace_ref, "context.target_workspace_ref");
  if (!canonicalRefEquals(context.workspace_ref, context.target_workspace_ref)) {
    fail(
      "workspace_mismatch",
      "context.workspace_ref",
      "prepare target must bind the exact current Workspace",
    );
  }
  if (input.target_ref !== context.target_ref || contract.target_ref_class !== context.target_ref_class) {
    fail("target_mismatch", "prepare_input.target_ref", "prepare target must match current owner context");
  }
  if (
    input.expected_version !== undefined &&
    input.expected_version !== context.current_expected_version
  ) {
    fail(
      "target_version_changed",
      "prepare_input.expected_version",
      "prepare target version is no longer current",
    );
  }
  if (
    contract.input_schema_key !== context.input_schema_key ||
    contract.input_schema_version !== context.input_schema_version
  ) {
    fail("input_schema_mismatch", "context.input_schema_key", "prepare input Schema must match the contract");
  }
  try {
    context.assert_action_input(input.action_input);
  } catch {
    fail("delegated_input_invalid", "prepare_input.action_input", "registered action input is invalid");
  }
  if (
    result.status === "prepared" &&
    result.confirmation.confirmation_class !== contract.confirmation_class
  ) {
    fail(
      "confirmation_class_mismatch",
      "prepare_result.confirmation.confirmation_class",
      "prepared confirmation class must match the contract",
    );
  }
};

export const assertSubmitScenarioDomainActionContextV1 = (
  contract: unknown,
  submit: unknown,
  context: {
    principal_binding_hash: string;
    submit_context_expires_at: string;
    now: string;
  },
): void => {
  assertScenarioDomainActionContractV1(contract);
  assertSubmitScenarioDomainActionInputV1(submit);
  assertSha256(context.principal_binding_hash, "context.principal_binding_hash");
  const submitContextExpiresAt = assertCanonicalInstant(
    context.submit_context_expires_at,
    "context.submit_context_expires_at",
  );
  const now = assertCanonicalInstant(context.now, "context.now");
  if (now >= submitContextExpiresAt) {
    fail("submit_context_expired", "context.now", "submit context must still be current");
  }
  if (contract.confirmation_class === "explicit") {
    if (submit.authentication_assurance !== undefined) {
      fail(
        "unexpected_assurance",
        "submit_input.authentication_assurance",
        "explicit confirmation must not include authentication assurance",
      );
    }
    return;
  }
  const assurance = submit.authentication_assurance;
  if (assurance === undefined) {
    fail(
      "missing_assurance",
      "submit_input.authentication_assurance",
      "strong authorization requires authentication assurance",
    );
  }
  if (assurance.principal_binding_hash !== context.principal_binding_hash) {
    fail(
      "principal_binding_mismatch",
      "submit_input.authentication_assurance.principal_binding_hash",
      "assurance must bind the exact current principal",
    );
  }
  const verifiedAt = assertCanonicalInstant(
    assurance.verified_at,
    "submit_input.authentication_assurance.verified_at",
  );
  const assuranceExpiresAt = assertCanonicalInstant(
    assurance.expires_at,
    "submit_input.authentication_assurance.expires_at",
  );
  if (verifiedAt > now || now >= assuranceExpiresAt || assuranceExpiresAt > submitContextExpiresAt) {
    fail(
      "assurance_not_current",
      "submit_input.authentication_assurance.expires_at",
      "assurance must be current and no later than the submit context",
    );
  }
};

export const assertScenarioDomainActionEffectIdentityInputV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioDomainActionEffectIdentityInputV1 = (
  value,
  path = "effect_identity",
) => {
  const record = assertRecord(value, path);
  if (record.driver === "scenario_direct_empty_v1") {
    assertKeys(record, directEffectIdentityKeys, path);
  } else if (record.driver === "workflow_claimed_step_v1") {
    assertKeys(record, claimedEffectIdentityKeys, path);
  } else {
    fail("invalid_driver", `${path}.driver`, `${path}.driver is invalid`);
  }
  if (record.effect_identity_version !== 1) {
    fail(
      "invalid_version",
      `${path}.effect_identity_version`,
      "effect_identity_version must be 1",
    );
  }
  assertWorkspaceRef(record.workspace_ref, `${path}.workspace_ref`);
  assertMachineKey(record.scenario_key, `${path}.scenario_key`);
  assertMachineKey(record.action_key, `${path}.action_key`);
  if (record.driver === "scenario_direct_empty_v1") {
    assertCanonicalRef(record.submit_context_ref, `${path}.submit_context_ref`);
    return;
  }
  assertScenarioDomainActionWorkflowStepRefV1(
    record.original_workflow_step_ref,
    `${path}.original_workflow_step_ref`,
  );
};

export const assertScenarioDomainActionExecutionBindingV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioDomainActionExecutionBindingV1 = (
  value,
  path = "execution_binding",
) => {
  const record = assertRecord(value, path);
  assertKeys(record, executionBindingKeys, path);
  if (record.execution_binding_version !== 1) {
    fail(
      "invalid_version",
      `${path}.execution_binding_version`,
      "execution_binding_version must be 1",
    );
  }
  assertScenarioDomainActionEffectIdentityInputV1(
    record.effect_identity,
    `${path}.effect_identity`,
  );
  assertSha256(record.canonical_payload_hash, `${path}.canonical_payload_hash`);
};

const assertCanonicalRefArray: (
  value: unknown,
  path: string,
) => asserts value is CanonicalRef[] = (value, path) => {
  if (!Array.isArray(value) || value.length > maximumResultRefs) {
    fail("invalid_ref_array", path, `${path} must contain at most 32 canonical refs`);
  }
  value.forEach((ref, index) => assertCanonicalRef(ref, `${path}.${index}`));
};

const assertHandoffRequestSnapshot: (
  value: unknown,
  path: string,
) => asserts value is ScenarioHandoffRequestSnapshot = (value, path) => {
  const record = assertRecord(value, path);
  assertKeys(record, handoffSnapshotKeys, path);
  if (
    typeof record.requestId !== "string" ||
    !opaqueIdPattern.test(record.requestId)
  ) {
    fail("invalid_snapshot", `${path}.requestId`, `${path}.requestId must be opaque`);
  }
  assertMachineKey(record.handoffKey, `${path}.handoffKey`);
  assertMachineKey(record.requestedPurpose, `${path}.requestedPurpose`);
  if (record.sourceContextRefs !== undefined) {
    assertCanonicalRefArray(record.sourceContextRefs, `${path}.sourceContextRefs`);
  }
  if (record.sourceArtifactRefs !== undefined) {
    assertCanonicalRefArray(record.sourceArtifactRefs, `${path}.sourceArtifactRefs`);
  }
  if (record.expiresAt !== undefined) {
    assertCanonicalInstant(record.expiresAt, `${path}.expiresAt`);
  }
};

export const assertScenarioDomainActionExecutionResultV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioDomainActionExecutionResultV1 = (
  value,
  path = "execution_result",
) => {
  const record = assertRecord(value, path);
  if (record.status === "committed") {
    assertKeys(record, committedExecutionResultKeys, path);
    if (
      typeof record.disposition !== "string" ||
      !executionDispositions.has(record.disposition)
    ) {
      fail("invalid_disposition", `${path}.disposition`, `${path}.disposition is invalid`);
    }
    if (
      typeof record.business_outcome !== "string" ||
      !businessOutcomes.has(record.business_outcome)
    ) {
      fail(
        "invalid_business_outcome",
        `${path}.business_outcome`,
        `${path}.business_outcome is invalid`,
      );
    }
    assertCanonicalRef(record.execution_ref, `${path}.execution_ref`);
    assertCanonicalRefArray(record.output_refs, `${path}.output_refs`);
    if (
      !Array.isArray(record.handoff_request_snapshots) ||
      record.handoff_request_snapshots.length > maximumResultRefs
    ) {
      fail(
        "invalid_snapshot_array",
        `${path}.handoff_request_snapshots`,
        `${path}.handoff_request_snapshots must contain at most 32 snapshots`,
      );
    }
    record.handoff_request_snapshots.forEach((snapshot, index) =>
      assertHandoffRequestSnapshot(snapshot, `${path}.handoff_request_snapshots.${index}`),
    );
  } else if (record.status === "not_committed") {
    assertKeys(record, notCommittedExecutionResultKeys, path);
    if (typeof record.decision !== "string" || !notCommittedDecisions.has(record.decision)) {
      fail("invalid_decision", `${path}.decision`, `${path}.decision is invalid`);
    }
    assertScenarioSafeReasonV1(record.safe_reason, `${path}.safe_reason`);
  } else if (record.status === "outcome_unknown") {
    assertKeys(record, safeExecutionResultKeys, path);
    assertScenarioSafeReasonV1(record.safe_reason, `${path}.safe_reason`);
  } else {
    fail("invalid_status", `${path}.status`, `${path}.status is invalid`);
  }
  if (serializedUtf8Bytes(record, path) > maximumExecutionResultBytes) {
    fail(
      "execution_result_too_large",
      path,
      "private execution result must be at most 64 KiB UTF-8",
    );
  }
};

export const assertScenarioDomainActionCurrentResultV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioDomainActionCurrentResultV1 = (
  value,
  path = "current_result",
) => {
  const record = assertRecord(value, path);
  if (record.state === "changed" || record.state === "already_current") {
    assertKeys(record, currentSimpleResultKeys, path);
    return;
  }
  if (record.state !== "processed_but_unavailable") {
    fail("invalid_state", `${path}.state`, `${path}.state is invalid`);
  }
  assertKeys(record, currentUnavailableResultKeys, path);
  assertScenarioSafeReasonV1(record.safe_reason, `${path}.safe_reason`);
};

export const assertSubmitScenarioDomainActionResultV1: (
  value: unknown,
  path?: string,
) => asserts value is SubmitScenarioDomainActionResultV1 = (
  value,
  path = "submit_result",
) => {
  const record = assertRecord(value, path);
  if (record.status === "accepted") {
    assertKeys(record, submitAcceptedResultKeys, path);
  } else if (record.status === "completed") {
    assertKeys(record, submitCompletedResultKeys, path);
    assertScenarioDomainActionCurrentResultV1(record.current_result, `${path}.current_result`);
  } else if (record.status === "context_changed" || record.status === "unavailable") {
    assertKeys(record, safeResultKeys, path);
    assertScenarioSafeReasonV1(record.safe_reason, `${path}.safe_reason`);
  } else {
    fail("invalid_status", `${path}.status`, `${path}.status is invalid`);
  }
  if (serializedUtf8Bytes(record, path) > maximumSubmitResultBytes) {
    fail(
      "submit_result_too_large",
      path,
      "public submit result must be at most 8 KiB UTF-8",
    );
  }
};

export const assertScenarioDomainActionExecutionResultForBindingV1 = (
  contract: unknown,
  binding: unknown,
  result: unknown,
): void => {
  assertScenarioDomainActionContractV1(contract);
  assertScenarioDomainActionExecutionBindingV1(binding);
  assertScenarioDomainActionExecutionResultV1(result);
  const identity = binding.effect_identity;
  if (
    contract.driver !== identity.driver ||
    contract.scenario_key !== identity.scenario_key ||
    contract.action_key !== identity.action_key
  ) {
    fail(
      "execution_contract_mismatch",
      "execution_binding.effect_identity",
      "effect identity must match the immutable action contract",
    );
  }
  if (
    identity.driver === "scenario_direct_empty_v1" &&
    result.status === "committed" &&
    result.handoff_request_snapshots.length !== 0
  ) {
    fail(
      "direct_snapshot_forbidden",
      "execution_result.handoff_request_snapshots",
      "direct execution must persist an exact empty snapshot array",
    );
  }
};

export const assertSubmitScenarioDomainActionResultForContractV1 = (
  contract: unknown,
  result: unknown,
): void => {
  assertScenarioDomainActionContractV1(contract);
  assertSubmitScenarioDomainActionResultV1(result);
  if (result.status === "accepted" && contract.driver !== "workflow_claimed_step_v1") {
    fail(
      "public_mode_mismatch",
      "submit_result.status",
      "accepted is available only to the claimed-Step driver",
    );
  }
  if (result.status === "completed" && contract.driver !== "scenario_direct_empty_v1") {
    fail(
      "public_mode_mismatch",
      "submit_result.status",
      "completed is available only to the direct driver",
    );
  }
};

const canonicalRefProjection = (ref: CanonicalRef) => [
  ref.schema_version,
  ref.namespace,
  ref.object_type,
  ref.object_id,
  ref.version ?? null,
];

const effectIdentityKey = (identity: ScenarioDomainActionEffectIdentityInputV1): string =>
  identity.driver === "scenario_direct_empty_v1"
    ? JSON.stringify([
        canonicalRefProjection(identity.workspace_ref),
        identity.scenario_key,
        identity.action_key,
        canonicalRefProjection(identity.submit_context_ref),
      ])
    : JSON.stringify([
        canonicalRefProjection(identity.workspace_ref),
        identity.scenario_key,
        identity.action_key,
        [
          identity.original_workflow_step_ref.schema_version,
          identity.original_workflow_step_ref.namespace,
          identity.original_workflow_step_ref.object_type,
          identity.original_workflow_step_ref.object_id,
        ],
      ]);

const committedReplayProjection = (
  result: Extract<ScenarioDomainActionExecutionResultV1, { status: "committed" }>,
): string => JSON.stringify({
  business_outcome: result.business_outcome,
  execution_ref: canonicalRefProjection(result.execution_ref),
  output_refs: result.output_refs.map(canonicalRefProjection),
  handoff_request_snapshots: result.handoff_request_snapshots.map((snapshot) => ({
    requestId: snapshot.requestId,
    handoffKey: snapshot.handoffKey,
    requestedPurpose: snapshot.requestedPurpose,
    sourceContextRefs: snapshot.sourceContextRefs?.map(canonicalRefProjection) ?? null,
    sourceArtifactRefs: snapshot.sourceArtifactRefs?.map(canonicalRefProjection) ?? null,
    expiresAt: snapshot.expiresAt ?? null,
  })),
});

export const assertScenarioDomainActionExactReplayV1 = (
  originalBinding: unknown,
  replayBinding: unknown,
  originalResult: unknown,
  replayResult: unknown,
): void => {
  assertScenarioDomainActionExecutionBindingV1(originalBinding, "original_binding");
  assertScenarioDomainActionExecutionBindingV1(replayBinding, "replay_binding");
  assertScenarioDomainActionExecutionResultV1(originalResult, "original_result");
  assertScenarioDomainActionExecutionResultV1(replayResult, "replay_result");
  if (
    effectIdentityKey(originalBinding.effect_identity) !==
      effectIdentityKey(replayBinding.effect_identity) ||
    originalBinding.canonical_payload_hash !== replayBinding.canonical_payload_hash
  ) {
    fail(
      "request_conflict",
      "replay_binding",
      "changed immutable identity or payload cannot exact-replay",
    );
  }
  if (originalResult.status === "committed" && replayResult.status === "committed") {
    if (replayResult.disposition !== "replayed") {
      fail(
        "invalid_replay_disposition",
        "replay_result.disposition",
        "an exact replay invocation must report replayed",
      );
    }
    if (committedReplayProjection(originalResult) !== committedReplayProjection(replayResult)) {
      fail(
        "replay_result_mismatch",
        "replay_result",
        "exact replay must preserve outcome, refs and snapshots",
      );
    }
  }
};

export const assertBindScenarioDomainActionStepInputV1: (
  value: unknown,
  path?: string,
) => asserts value is BindScenarioDomainActionStepInputV1 = (
  value,
  path = "step_binding_input",
) => {
  const record = assertRecord(value, path);
  assertKeys(record, bindStepInputKeys, path);
  if (record.step_binding_version !== 1) {
    fail(
      "invalid_version",
      `${path}.step_binding_version`,
      "step_binding_version must be 1",
    );
  }
  assertSubmitScenarioDomainActionInputV1(record.submit, `${path}.submit`);
  assertScenarioDomainActionClaimedStepAssertionV1(
    record.step_assertion,
    `${path}.step_assertion`,
  );
};

export const assertBindScenarioDomainActionStepResultV1: (
  value: unknown,
  path?: string,
) => asserts value is BindScenarioDomainActionStepResultV1 = (
  value,
  path = "step_binding_result",
) => {
  const record = assertRecord(value, path);
  if (record.status === "bound" || record.status === "exact_replay") {
    assertKeys(record, boundStepResultKeys, path);
    assertScenarioDomainActionWorkflowStepRefV1(
      record.workflow_step_ref,
      `${path}.workflow_step_ref`,
    );
    assertSha256(record.binding_evidence_hash, `${path}.binding_evidence_hash`);
    assertCanonicalInstant(record.context_expires_at, `${path}.context_expires_at`);
    return;
  }
  if (record.status !== "request_conflict" && record.status !== "unavailable") {
    fail("invalid_status", `${path}.status`, `${path}.status is invalid`);
  }
  assertKeys(record, safeResultKeys, path);
  assertScenarioSafeReasonV1(record.safe_reason, `${path}.safe_reason`);
};

export const assertLookupScenarioDomainActionStepBindingInputV1: (
  value: unknown,
  path?: string,
) => asserts value is LookupScenarioDomainActionStepBindingInputV1 = (
  value,
  path = "binding_lookup_input",
) => {
  const record = assertRecord(value, path);
  assertKeys(record, lookupStepInputKeys, path);
  if (record.binding_lookup_version !== 1) {
    fail(
      "invalid_version",
      `${path}.binding_lookup_version`,
      "binding_lookup_version must be 1",
    );
  }
  assertScenarioDomainActionWorkflowStepRefV1(
    record.workflow_step_ref,
    `${path}.workflow_step_ref`,
  );
};

export const assertLookupScenarioDomainActionStepBindingResultV1: (
  value: unknown,
  path?: string,
) => asserts value is LookupScenarioDomainActionStepBindingResultV1 = (
  value,
  path = "binding_lookup_result",
) => {
  const record = assertRecord(value, path);
  if (record.status === "bound") {
    assertKeys(record, boundStepResultKeys, path);
    assertScenarioDomainActionWorkflowStepRefV1(
      record.workflow_step_ref,
      `${path}.workflow_step_ref`,
    );
    assertSha256(record.binding_evidence_hash, `${path}.binding_evidence_hash`);
    assertCanonicalInstant(record.context_expires_at, `${path}.context_expires_at`);
    return;
  }
  if (record.status === "not_bound") {
    assertKeys(record, lookupNotBoundResultKeys, path);
    return;
  }
  if (record.status !== "unavailable") {
    fail("invalid_status", `${path}.status`, `${path}.status is invalid`);
  }
  assertKeys(record, safeResultKeys, path);
  assertScenarioSafeReasonV1(record.safe_reason, `${path}.safe_reason`);
};

export const assertScenarioDomainActionClaimedStepDriverV1: (
  value: unknown,
  path?: string,
) => asserts value is ScenarioDomainActionClaimedStepDriverV1 = (
  value,
  path = "claimed_driver",
) => {
  const record = assertRecord(value, path);
  assertKeys(record, claimedStepDriverKeys, path);
  if (record.claimed_driver_version !== 1) {
    fail(
      "invalid_version",
      `${path}.claimed_driver_version`,
      "claimed_driver_version must be 1",
    );
  }
  assertScenarioDomainActionWorkflowStepRefV1(
    record.workflow_step_ref,
    `${path}.workflow_step_ref`,
  );
  assertSha256(record.action_contract_hash, `${path}.action_contract_hash`);
  assertOpaqueLocator(record.claim_token, `${path}.claim_token`);
  if (!Number.isInteger(record.expected_step_version) || Number(record.expected_step_version) < 0) {
    fail(
      "invalid_step_version",
      `${path}.expected_step_version`,
      "expected_step_version must be a non-negative integer",
    );
  }
};

const workflowStepRefEquals = (
  left: ScenarioDomainActionWorkflowStepRefV1,
  right: ScenarioDomainActionWorkflowStepRefV1,
): boolean =>
  left.schema_version === right.schema_version &&
  left.namespace === right.namespace &&
  left.object_type === right.object_type &&
  left.object_id === right.object_id;

const claimedStepAssertionKey = (
  assertion: ScenarioDomainActionClaimedStepAssertionV1,
): string => JSON.stringify({
  step_assertion_version: assertion.step_assertion_version,
  workflow_step_ref: [
    assertion.workflow_step_ref.schema_version,
    assertion.workflow_step_ref.namespace,
    assertion.workflow_step_ref.object_type,
    assertion.workflow_step_ref.object_id,
  ],
  workspace_ref: canonicalRefProjection(assertion.workspace_ref),
  principal_provenance_hash: assertion.principal_provenance_hash,
  scenario_key: assertion.scenario_key,
  action_key: assertion.action_key,
  handler_key: assertion.handler_key,
  action_contract_hash: assertion.action_contract_hash,
  driver: assertion.driver,
  client_mutation_id: assertion.client_mutation_id,
  request_correlation_hash: assertion.request_correlation_hash,
});

export const assertBindScenarioDomainActionStepContextV1 = (
  contract: unknown,
  input: unknown,
  result: unknown,
  context: {
    step_state: "awaiting_scenario_binding" | "scenario_bound" | "claimable" | "missing";
    workflow_step_ref: unknown;
    action_contract_hash: string;
    principal_binding_hash: string;
    principal_provenance_hash: string;
    request_correlation_hash: string;
    workspace_ref: unknown;
    binding_evidence_hash: string;
    context_expires_at: string;
    now: string;
    existing_binding?: unknown;
  },
): void => {
  assertScenarioDomainActionContractV1(contract);
  assertBindScenarioDomainActionStepInputV1(input);
  assertBindScenarioDomainActionStepResultV1(result);
  if (contract.driver !== "workflow_claimed_step_v1") {
    fail("driver_mismatch", "action_contract.driver", "Step binding requires claimed-Step driver");
  }
  const assertion = input.step_assertion;
  assertScenarioDomainActionWorkflowStepRefV1(context.workflow_step_ref, "context.workflow_step_ref");
  assertWorkspaceRef(context.workspace_ref, "context.workspace_ref");
  assertSha256(context.action_contract_hash, "context.action_contract_hash");
  assertSha256(context.principal_binding_hash, "context.principal_binding_hash");
  assertSha256(context.principal_provenance_hash, "context.principal_provenance_hash");
  assertSha256(context.request_correlation_hash, "context.request_correlation_hash");
  assertSha256(context.binding_evidence_hash, "context.binding_evidence_hash");
  const contextExpiresAt = assertCanonicalInstant(
    context.context_expires_at,
    "context.context_expires_at",
  );
  const now = assertCanonicalInstant(context.now, "context.now");
  if (now >= contextExpiresAt) {
    fail("submit_context_expired", "context.now", "Step binding requires a current submit context");
  }
  assertSubmitScenarioDomainActionContextV1(contract, input.submit, {
    principal_binding_hash: context.principal_binding_hash,
    submit_context_expires_at: context.context_expires_at,
    now: context.now,
  });
  if (
    contract.scenario_key !== assertion.scenario_key ||
    contract.action_key !== assertion.action_key ||
    contract.handler_key !== assertion.handler_key ||
    assertion.action_contract_hash !== context.action_contract_hash
  ) {
    fail(
      "step_contract_mismatch",
      "step_binding_input.step_assertion",
      "Step assertion must match the immutable action contract",
    );
  }
  if (!workflowStepRefEquals(assertion.workflow_step_ref, context.workflow_step_ref)) {
    fail("workflow_step_mismatch", "context.workflow_step_ref", "binding must use the original Step");
  }
  if (!canonicalRefEquals(assertion.workspace_ref, context.workspace_ref)) {
    fail("workspace_mismatch", "context.workspace_ref", "binding Workspace must match the assertion");
  }
  if (assertion.principal_provenance_hash !== context.principal_provenance_hash) {
    fail(
      "principal_binding_mismatch",
      "context.principal_provenance_hash",
      "binding principal must match the assertion",
    );
  }
  if (assertion.client_mutation_id !== input.submit.client_echo.client_mutation_id) {
    fail(
      "client_mutation_mismatch",
      "step_binding_input.step_assertion.client_mutation_id",
      "Step assertion must bind the exact submit client mutation",
    );
  }
  if (assertion.request_correlation_hash !== context.request_correlation_hash) {
    fail(
      "request_correlation_mismatch",
      "context.request_correlation_hash",
      "Step assertion must bind the exact Host request correlation",
    );
  }
  if (context.step_state === "claimable" || context.step_state === "missing") {
    fail(
      "step_not_bindable",
      "context.step_state",
      "only the original awaiting or already-bound Step is bindable",
    );
  }
  if (context.existing_binding === undefined) {
    if (context.step_state !== "awaiting_scenario_binding" || result.status !== "bound") {
      fail("binding_state_mismatch", "step_binding_result.status", "new binding must return bound");
    }
  } else {
    assertScenarioDomainActionClaimedStepAssertionV1(
      context.existing_binding,
      "context.existing_binding",
    );
    if (claimedStepAssertionKey(context.existing_binding) !== claimedStepAssertionKey(assertion)) {
      fail(
        "request_conflict",
        "context.existing_binding",
        "different immutable assertion cannot exact-rebind",
      );
    }
    if (context.step_state !== "scenario_bound" || result.status !== "exact_replay") {
      fail(
        "binding_state_mismatch",
        "step_binding_result.status",
        "existing exact binding must return exact_replay",
      );
    }
  }
  if (result.status === "bound" || result.status === "exact_replay") {
    if (!workflowStepRefEquals(result.workflow_step_ref, assertion.workflow_step_ref)) {
      fail(
        "workflow_step_mismatch",
        "step_binding_result.workflow_step_ref",
        "binding result must preserve the original Step",
      );
    }
    if (result.binding_evidence_hash !== context.binding_evidence_hash) {
      fail(
        "binding_evidence_mismatch",
        "step_binding_result.binding_evidence_hash",
        "binding result evidence must match stored evidence",
      );
    }
    if (result.context_expires_at !== context.context_expires_at) {
      fail(
        "context_expiry_changed",
        "step_binding_result.context_expires_at",
        "binding must not extend or replace the submit-context expiry",
      );
    }
  }
};

export const assertLookupScenarioDomainActionStepBindingExchangeV1 = (
  input: unknown,
  result: unknown,
  storedBinding?: {
    workflow_step_ref: unknown;
    binding_evidence_hash: string;
    context_expires_at: string;
  },
): void => {
  assertLookupScenarioDomainActionStepBindingInputV1(input);
  assertLookupScenarioDomainActionStepBindingResultV1(result);
  if (storedBinding === undefined) {
    if (result.status === "bound") {
      fail("unexpected_binding", "binding_lookup_result", "lookup cannot invent a binding");
    }
    return;
  }
  assertScenarioDomainActionWorkflowStepRefV1(
    storedBinding.workflow_step_ref,
    "stored_binding.workflow_step_ref",
  );
  assertSha256(storedBinding.binding_evidence_hash, "stored_binding.binding_evidence_hash");
  assertCanonicalInstant(storedBinding.context_expires_at, "stored_binding.context_expires_at");
  if (
    !workflowStepRefEquals(input.workflow_step_ref, storedBinding.workflow_step_ref) ||
    result.status !== "bound" ||
    !workflowStepRefEquals(result.workflow_step_ref, input.workflow_step_ref) ||
    result.binding_evidence_hash !== storedBinding.binding_evidence_hash ||
    result.context_expires_at !== storedBinding.context_expires_at
  ) {
    fail(
      "binding_recovery_mismatch",
      "binding_lookup_result",
      "lookup must recover only the exact stored original-Step binding",
    );
  }
};

export const assertScenarioDomainActionClaimedStepDriverContextV1 = (
  driver: unknown,
  context: {
    binding_published: boolean;
    workflow_step_ref: unknown;
    action_contract_hash: string;
  },
): void => {
  assertScenarioDomainActionClaimedStepDriverV1(driver);
  assertScenarioDomainActionWorkflowStepRefV1(context.workflow_step_ref, "context.workflow_step_ref");
  assertSha256(context.action_contract_hash, "context.action_contract_hash");
  if (!context.binding_published) {
    fail("claim_before_bind", "context.binding_published", "Step cannot be claimed before binding");
  }
  if (!workflowStepRefEquals(driver.workflow_step_ref, context.workflow_step_ref)) {
    fail("workflow_step_mismatch", "claimed_driver.workflow_step_ref", "driver must use the bound Step");
  }
  if (driver.action_contract_hash !== context.action_contract_hash) {
    fail(
      "step_contract_mismatch",
      "claimed_driver.action_contract_hash",
      "driver contract hash must match the bound assertion",
    );
  }
};
