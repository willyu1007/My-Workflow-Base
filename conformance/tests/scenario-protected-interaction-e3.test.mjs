import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  assertScenarioCommittedProtectedContentControlV1,
  assertScenarioDomainActionExecutionBindingV1,
  assertScenarioDomainActionExecutionResultV1,
  assertScenarioProtectedContentCommitCompositionV1,
} from "@host/workflow-contracts";

const schemaRoot = new URL(
  "../../templates/host-runtime/packages/workflow-contracts/schemas/",
  import.meta.url,
);
const e1Fixture = JSON.parse(await readFile(
  new URL("../fixtures/scenario-protected-interaction-e1.valid.json", import.meta.url),
  "utf8",
));
const e2Fixture = JSON.parse(await readFile(
  new URL("../fixtures/scenario-protected-interaction-e2.valid.json", import.meta.url),
  "utf8",
));
const fixture = JSON.parse(await readFile(
  new URL("../fixtures/scenario-protected-interaction-e3.valid.json", import.meta.url),
  "utf8",
));
const domainFixture = JSON.parse(await readFile(
  new URL("../fixtures/scenario-domain-action-d1.valid.json", import.meta.url),
  "utf8",
));
const schemaNames = [
  "canonical-ref-v1.schema.json",
  "scenario-safe-text-v1.schema.json",
  "scenario-safe-reason-v1.schema.json",
  "scenario-domain-action-workflow-step-ref-v1.schema.json",
  "scenario-domain-action-effect-identity-input-v1.schema.json",
  "scenario-domain-action-execution-binding-v1.schema.json",
  "scenario-domain-action-execution-result-v1.schema.json",
  "scenario-committed-protected-content-control-v1.schema.json",
];
const schemas = await Promise.all(
  schemaNames.map(async (name) => JSON.parse(await readFile(new URL(name, schemaRoot), "utf8"))),
);
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
for (const schema of schemas) ajv.addSchema(schema);
const validator = (name) => {
  const validate = ajv.getSchema(`https://morethan.local/contracts/${name}.schema.json`);
  if (!validate) throw new Error(`${name} was not registered`);
  return validate;
};
const validateCommitted = validator("scenario-committed-protected-content-control-v1");
const validateBinding = validator("scenario-domain-action-execution-binding-v1");
const validateExecutionResult = validator("scenario-domain-action-execution-result-v1");
const clone = (value) => structuredClone(value);

const assertParityRejects = (validate, codec, value) => {
  assert.equal(validate(value), false, "JSON Schema unexpectedly accepted mutation");
  assert.throws(() => codec(value));
};

const contractForDriver = (driver) => ({ ...clone(domainFixture.contract), driver });
const submitContext = () => ({
  submit_token: domainFixture.submit_inputs[0].client_echo.submit_token,
  scenario_key: domainFixture.contract.scenario_key,
  action_key: domainFixture.contract.action_key,
  principal_binding_hash: "7".repeat(64),
  submit_context_expires_at: e2Fixture.results[0].prepared_content.expires_at,
  now: "2026-08-05T00:03:00.000Z",
});
const contextForBinding = (binding) => ({
  submit_context: submitContext(),
  resolved_prepared_content: {
    protected_content_ref: e2Fixture.results[0].prepared_content.protected_content_ref,
    protected_content_version: e2Fixture.results[0].prepared_content.protected_content_version,
    protected_field_key: e1Fixture.contract.protected_field_key,
    content_kind: e2Fixture.results[0].prepared_content.content_kind,
    accepted_carrier_binding_hash: e2Fixture.input.carrier_binding.keyed_binding_hash,
    request_identity_hash: "e".repeat(64),
    verified_keyed_integrity_hash: e2Fixture.results[0].prepared_content.keyed_integrity_hash,
    issued_at: e2Fixture.results[0].prepared_content.issued_at,
    expires_at: e2Fixture.results[0].prepared_content.expires_at,
  },
  execution_path_verification: binding.effect_identity.driver === "scenario_direct_empty_v1"
    ? {
        driver: "scenario_direct_empty_v1",
        submit_context_ref: clone(binding.effect_identity.submit_context_ref),
      }
    : {
        driver: "workflow_claimed_step_v1",
        original_workflow_step_ref: clone(binding.effect_identity.original_workflow_step_ref),
      },
  commit_verification: {
    scenario_key: binding.effect_identity.scenario_key,
    action_key: binding.effect_identity.action_key,
    request_identity_hash: "e".repeat(64),
    accepted_carrier_binding_hash: e2Fixture.input.carrier_binding.keyed_binding_hash,
    canonical_payload_hash: binding.canonical_payload_hash,
    protected_content_ref: fixture.committed_content.protected_content_ref,
    prepared_content_version: fixture.committed_content.prepared_content_version,
    committed_content_version: fixture.committed_content.committed_content_version,
    content_kind: fixture.committed_content.content_kind,
    verified_keyed_integrity_hash: fixture.committed_content.keyed_integrity_hash,
    committed_at: fixture.committed_content.committed_at,
  },
});

const assertComposition = (driverIndex, executionResult, committedContent, context) =>
  assertScenarioProtectedContentCommitCompositionV1(
    e1Fixture.contract,
    contractForDriver(domainFixture.execution_bindings[driverIndex].effect_identity.driver),
    domainFixture.submit_inputs[0],
    e2Fixture.results[0].prepared_content,
    domainFixture.execution_bindings[driverIndex],
    executionResult,
    committedContent,
    context,
  );

test("E3 accepts the closed committed control and rejects version aliasing", () => {
  assert.equal(validateCommitted(fixture.committed_content), true, JSON.stringify(validateCommitted.errors));
  assert.doesNotThrow(() =>
    assertScenarioCommittedProtectedContentControlV1(fixture.committed_content));

  const sameVersion = clone(fixture.committed_content);
  sameVersion.committed_content_version = sameVersion.prepared_content_version;
  assert.equal(validateCommitted(sameVersion), true, JSON.stringify(validateCommitted.errors));
  assert.throws(() => assertScenarioCommittedProtectedContentControlV1(sameVersion), {
    code: "content_version_not_advanced",
  });
});

test("E3 schema and codec close the committed control", async (context) => {
  const cases = [
    ["unknown body", (value) => { value.body = "redacted"; }],
    ["wrong state", (value) => { value.state = "prepared"; }],
    ["invalid ref", (value) => { value.protected_content_ref = "short"; }],
    ["uppercase integrity", (value) => { value.keyed_integrity_hash = "C".repeat(64); }],
    ["non-canonical time", (value) => { value.committed_at = "2026-08-05T00:02:30Z"; }],
  ];
  for (const [name, mutate] of cases) {
    await context.test(name, () => {
      const value = clone(fixture.committed_content);
      mutate(value);
      assertParityRejects(validateCommitted, assertScenarioCommittedProtectedContentControlV1, value);
    });
  }
});

test("E3 schema and codec reject missing and null committed fields", () => {
  for (const mutate of [
    (value) => { delete value.committed_content_version; },
    (value) => { value.prepared_content_version = null; },
  ]) {
    const value = clone(fixture.committed_content);
    mutate(value);
    assertParityRejects(validateCommitted, assertScenarioCommittedProtectedContentControlV1, value);
  }
});

test("E3 composes the same prepared object through both existing I1-D drivers", () => {
  for (const [index, result] of [
    [0, domainFixture.execution_results[0]],
    [1, domainFixture.execution_results[1]],
  ]) {
    const binding = domainFixture.execution_bindings[index];
    assert.doesNotThrow(() =>
      assertComposition(index, result, fixture.committed_content, contextForBinding(binding)));
  }
});

test("E3 rejects prepared-object, payload, effect and transaction drift", () => {
  const binding = domainFixture.execution_bindings[0];
  const cases = [
    ["committed_content_ref_mismatch", (committed) => { committed.protected_content_ref = "S".repeat(43); }],
    ["prepared_version_mismatch", (committed) => { committed.prepared_content_version = "prepared-version-02"; }],
    ["committed_version_mismatch", (committed, context) => { context.commit_verification.committed_content_version = "committed-version-02"; }],
    ["content_kind_mismatch", (committed) => { committed.content_kind = "example.other_content"; }],
    ["integrity_hash_mismatch", (committed) => { committed.keyed_integrity_hash = "d".repeat(64); }],
    ["committed_time_mismatch", (committed) => { committed.committed_at = "2026-08-05T00:02:31.000Z"; }],
    ["commit_payload_mismatch", (committed, context) => { context.commit_verification.canonical_payload_hash = "d".repeat(64); }],
    ["commit_request_identity_mismatch", (committed, context) => { context.commit_verification.request_identity_hash = "d".repeat(64); }],
    ["commit_effect_identity_mismatch", (committed, context) => { context.commit_verification.action_key = "example.other_action"; }],
    ["resolved_prepared_content_mismatch", (committed, context) => { context.resolved_prepared_content.expires_at = "2026-08-05T00:04:59.000Z"; }],
  ];
  for (const [code, mutate] of cases) {
    const committed = clone(fixture.committed_content);
    const context = contextForBinding(binding);
    mutate(committed, context);
    assert.throws(() =>
      assertComposition(0, domainFixture.execution_results[0], committed, context),
    { code });
  }

  const beforePrepare = clone(fixture.committed_content);
  const beforePrepareContext = contextForBinding(binding);
  beforePrepare.committed_at = "2026-08-04T23:59:59.999Z";
  beforePrepareContext.commit_verification.committed_at = beforePrepare.committed_at;
  assert.throws(() =>
    assertComposition(0, domainFixture.execution_results[0], beforePrepare, beforePrepareContext),
  { code: "commit_before_prepare" });

  for (const index of [0, 1]) {
    const futureCommit = clone(fixture.committed_content);
    const futureContext = contextForBinding(domainFixture.execution_bindings[index]);
    futureCommit.committed_at = "2026-08-05T01:00:00.000Z";
    futureContext.commit_verification.committed_at = futureCommit.committed_at;
    assert.throws(() => assertComposition(
      index,
      domainFixture.execution_results[index],
      futureCommit,
      futureContext,
    ), { code: "commit_after_context_now" });
  }

  const wrongStepContext = contextForBinding(domainFixture.execution_bindings[1]);
  wrongStepContext.execution_path_verification.original_workflow_step_ref.object_id =
    "step_example_02";
  assert.throws(() => assertComposition(
    1,
    domainFixture.execution_results[1],
    fixture.committed_content,
    wrongStepContext,
  ), { code: "original_step_mismatch" });

  const wrongSubmitContext = contextForBinding(domainFixture.execution_bindings[0]);
  wrongSubmitContext.execution_path_verification.submit_context_ref.object_id =
    "submit_context_example_02";
  assert.throws(() => assertComposition(
    0,
    domainFixture.execution_results[0],
    fixture.committed_content,
    wrongSubmitContext,
  ), { code: "execution_path_mismatch" });
});

test("E3 never commits failed, unknown or rolled-back execution", () => {
  for (const result of domainFixture.execution_results.slice(2)) {
    const context = contextForBinding(domainFixture.execution_bindings[0]);
    delete context.commit_verification;
    assert.doesNotThrow(() => assertComposition(0, result, undefined, context));
    assert.throws(() =>
      assertComposition(0, result, fixture.committed_content, context),
    { code: "commit_without_committed_effect" });
  }

  const rolledBackContext = contextForBinding(domainFixture.execution_bindings[0]);
  delete rolledBackContext.commit_verification;
  assert.throws(() =>
    assertComposition(0, domainFixture.execution_results[0], undefined, rolledBackContext),
  { code: "missing_committed_content" });

  const expiredContext = contextForBinding(domainFixture.execution_bindings[0]);
  expiredContext.submit_context.now = expiredContext.submit_context.submit_context_expires_at;
  assert.throws(() => assertComposition(
    0,
    domainFixture.execution_results[0],
    fixture.committed_content,
    expiredContext,
  ), { code: "submit_context_expired" });
});

test("E3 recovery composes an exact replay without carrier resend", () => {
  const replay = clone(domainFixture.execution_results[0]);
  replay.disposition = "replayed";
  assert.doesNotThrow(() => assertComposition(
    0,
    replay,
    fixture.committed_content,
    contextForBinding(domainFixture.execution_bindings[0]),
  ));
});

test("E3 accepts short opaque versions without substring false positives", () => {
  const preparedContent = clone(e2Fixture.results[0].prepared_content);
  const committedContent = clone(fixture.committed_content);
  const binding = domainFixture.execution_bindings[0];
  const context = contextForBinding(binding);
  preparedContent.protected_content_version = "v";
  committedContent.prepared_content_version = "v";
  committedContent.committed_content_version = "w";
  context.resolved_prepared_content.protected_content_version = "v";
  context.commit_verification.prepared_content_version = "v";
  context.commit_verification.committed_content_version = "w";
  assert.doesNotThrow(() => assertScenarioProtectedContentCommitCompositionV1(
    e1Fixture.contract,
    contractForDriver(binding.effect_identity.driver),
    domainFixture.submit_inputs[0],
    preparedContent,
    binding,
    domainFixture.execution_results[0],
    committedContent,
    context,
  ));
});

test("E3 contextual evidence rejects broad metadata extensions", () => {
  const context = contextForBinding(domainFixture.execution_bindings[0]);
  context.metadata = { durable: true };
  assert.throws(() => assertComposition(
    0,
    domainFixture.execution_results[0],
    fixture.committed_content,
    context,
  ), { code: "unknown_field" });
});

test("E3 adds no commit input and keeps I1-D envelopes protected-ref free", () => {
  for (const [validate, codec, source] of [
    [validateBinding, assertScenarioDomainActionExecutionBindingV1, domainFixture.execution_bindings[0]],
    [validateExecutionResult, assertScenarioDomainActionExecutionResultV1, domainFixture.execution_results[0]],
  ]) {
    const value = clone(source);
    value.protected_content_ref = fixture.committed_content.protected_content_ref;
    assertParityRejects(validate, codec, value);
  }

  const hiddenRef = clone(domainFixture.execution_results[0]);
  hiddenRef.output_refs = [{
    schema_version: 1,
    namespace: "scenario.example",
    object_type: "example_output",
    object_id: fixture.committed_content.protected_content_ref,
  }];
  assert.equal(
    validateExecutionResult(hiddenRef),
    true,
    JSON.stringify(validateExecutionResult.errors),
  );
  assert.throws(() => assertComposition(
    0,
    hiddenRef,
    fixture.committed_content,
    contextForBinding(domainFixture.execution_bindings[0]),
  ), { code: "protected_control_copy" });

  const encodedRef = clone(domainFixture.execution_results[0]);
  encodedRef.output_refs = [{
    schema_version: 1,
    namespace: "scenario.example",
    object_type: "example_output",
    object_id: Buffer.from(
      fixture.committed_content.protected_content_ref,
      "utf8",
    ).toString("base64url"),
  }];
  assert.equal(
    validateExecutionResult(encodedRef),
    true,
    JSON.stringify(validateExecutionResult.errors),
  );
  assert.throws(() => assertComposition(
    0,
    encodedRef,
    fixture.committed_content,
    contextForBinding(domainFixture.execution_bindings[0]),
  ), { code: "protected_control_copy" });
});
