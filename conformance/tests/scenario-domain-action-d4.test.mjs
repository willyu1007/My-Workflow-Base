import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  assertBindScenarioDomainActionStepContextV1,
  assertBindScenarioDomainActionStepInputV1,
  assertBindScenarioDomainActionStepResultV1,
  assertLookupScenarioDomainActionStepBindingExchangeV1,
  assertLookupScenarioDomainActionStepBindingInputV1,
  assertLookupScenarioDomainActionStepBindingResultV1,
  assertScenarioDomainActionClaimedStepDriverContextV1,
  assertScenarioDomainActionClaimedStepExecutionContextV1,
  assertScenarioDomainActionClaimedStepDriverV1,
  assertScenarioDomainActionExecutionBindingV1,
  assertScenarioDomainActionExecutionResultV1,
} from "@host/workflow-contracts";

const schemaRoot = new URL(
  "../../templates/host-runtime/packages/workflow-contracts/schemas/",
  import.meta.url,
);
const fixture = JSON.parse(await readFile(
  new URL("../fixtures/scenario-domain-action-d1.valid.json", import.meta.url),
  "utf8",
));
const schemaNames = [
  "canonical-ref-v1.schema.json",
  "scenario-safe-text-v1.schema.json",
  "scenario-safe-reason-v1.schema.json",
  "scenario-domain-action-workflow-step-ref-v1.schema.json",
  "scenario-domain-action-submit-echo-v1.schema.json",
  "scenario-authentication-assurance-evidence-v1.schema.json",
  "submit-scenario-domain-action-input-v1.schema.json",
  "scenario-domain-action-claimed-step-assertion-v1.schema.json",
  "bind-scenario-domain-action-step-input-v1.schema.json",
  "bind-scenario-domain-action-step-result-v1.schema.json",
  "lookup-scenario-domain-action-step-binding-input-v1.schema.json",
  "lookup-scenario-domain-action-step-binding-result-v1.schema.json",
  "scenario-domain-action-claimed-step-driver-v1.schema.json",
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
const validateBindInput = validator("bind-scenario-domain-action-step-input-v1");
const validateBindResult = validator("bind-scenario-domain-action-step-result-v1");
const validateLookupInput = validator("lookup-scenario-domain-action-step-binding-input-v1");
const validateLookupResult = validator("lookup-scenario-domain-action-step-binding-result-v1");
const validateClaimedDriver = validator("scenario-domain-action-claimed-step-driver-v1");
const clone = (value) => structuredClone(value);

const assertParityRejects = (validate, codec, value) => {
  assert.equal(validate(value), false, "JSON Schema unexpectedly accepted mutation");
  assert.throws(() => codec(value));
};

test("D4 accepts bind/rebind, body-free lookup and transient claimed driver", () => {
  assert.equal(validateBindInput(fixture.step_binding_input), true, JSON.stringify(validateBindInput.errors));
  assert.doesNotThrow(() => assertBindScenarioDomainActionStepInputV1(fixture.step_binding_input));
  for (const result of fixture.step_binding_results) {
    assert.equal(validateBindResult(result), true, JSON.stringify(validateBindResult.errors));
    assert.doesNotThrow(() => assertBindScenarioDomainActionStepResultV1(result));
  }
  assert.equal(validateLookupInput(fixture.binding_lookup_input), true, JSON.stringify(validateLookupInput.errors));
  assert.doesNotThrow(() => assertLookupScenarioDomainActionStepBindingInputV1(fixture.binding_lookup_input));
  for (const result of fixture.binding_lookup_results) {
    assert.equal(validateLookupResult(result), true, JSON.stringify(validateLookupResult.errors));
    assert.doesNotThrow(() => assertLookupScenarioDomainActionStepBindingResultV1(result));
  }
  assert.equal(validateClaimedDriver(fixture.claimed_step_driver), true, JSON.stringify(validateClaimedDriver.errors));
  assert.doesNotThrow(() => assertScenarioDomainActionClaimedStepDriverV1(fixture.claimed_step_driver));
});

test("D4 binding and lookup envelopes reject body, token and authority leakage", async (context) => {
  const cases = [
    ["binding body", validateBindInput, assertBindScenarioDomainActionStepInputV1, fixture.step_binding_input, (value) => { value.body = {}; }],
    ["binding result claim", validateBindResult, assertBindScenarioDomainActionStepResultV1, fixture.step_binding_results[0], (value) => { value.claim_token = "A".repeat(32); }],
    ["binding result input", validateBindResult, assertBindScenarioDomainActionStepResultV1, fixture.step_binding_results[0], (value) => { value.action_input = {}; }],
    ["lookup token", validateLookupInput, assertLookupScenarioDomainActionStepBindingInputV1, fixture.binding_lookup_input, (value) => { value.submit_token = "A".repeat(32); }],
    ["lookup body", validateLookupInput, assertLookupScenarioDomainActionStepBindingInputV1, fixture.binding_lookup_input, (value) => { value.body = {}; }],
    ["lookup result claim", validateLookupResult, assertLookupScenarioDomainActionStepBindingResultV1, fixture.binding_lookup_results[0], (value) => { value.claim_token = "A".repeat(32); }],
    ["driver action input", validateClaimedDriver, assertScenarioDomainActionClaimedStepDriverV1, fixture.claimed_step_driver, (value) => { value.action_input = {}; }],
    ["driver submit token", validateClaimedDriver, assertScenarioDomainActionClaimedStepDriverV1, fixture.claimed_step_driver, (value) => { value.submit_token = "A".repeat(32); }],
  ];
  for (const [name, validate, codec, source, mutate] of cases) {
    await context.test(name, () => {
      const value = clone(source);
      mutate(value);
      assertParityRejects(validate, codec, value);
    });
  }
});

const bindContext = () => ({
  step_state: "awaiting_scenario_binding",
  workflow_step_ref: clone(fixture.step_assertion.workflow_step_ref),
  action_contract_hash: fixture.step_assertion.action_contract_hash,
  principal_binding_hash: "9".repeat(64),
  principal_provenance_hash: fixture.step_assertion.principal_provenance_hash,
  request_correlation_hash: fixture.step_assertion.request_correlation_hash,
  workspace_ref: clone(fixture.step_assertion.workspace_ref),
  submit_token: fixture.step_binding_input.submit.client_echo.submit_token,
  scenario_key: fixture.contract.scenario_key,
  action_key: fixture.contract.action_key,
  binding_evidence_hash: fixture.step_binding_results[0].binding_evidence_hash,
  context_expires_at: fixture.step_binding_results[0].context_expires_at,
  now: "2026-08-05T00:02:00.000Z",
});

test("D4 binds once and exact-rebinds only the immutable original assertion", () => {
  const claimedContract = clone(fixture.contract);
  claimedContract.driver = "workflow_claimed_step_v1";
  assert.doesNotThrow(() => assertBindScenarioDomainActionStepContextV1(
    claimedContract,
    fixture.step_binding_input,
    fixture.step_binding_results[0],
    bindContext(),
  ));
  assert.doesNotThrow(() => assertBindScenarioDomainActionStepContextV1(
    claimedContract,
    fixture.step_binding_input,
    fixture.step_binding_results[1],
    {
      ...bindContext(),
      step_state: "scenario_bound",
      existing_binding: {
        assertion: clone(fixture.step_assertion),
        binding_evidence_hash: fixture.step_binding_results[0].binding_evidence_hash,
        context_expires_at: fixture.step_binding_results[0].context_expires_at,
      },
    },
  ));

  const changedBinding = clone(fixture.step_binding_input);
  changedBinding.step_assertion.request_correlation_hash = "a".repeat(64);
  assert.doesNotThrow(
    () => assertBindScenarioDomainActionStepContextV1(
      claimedContract,
      changedBinding,
      fixture.step_binding_results[2],
      {
        ...bindContext(),
        step_state: "scenario_bound",
        request_correlation_hash: changedBinding.step_assertion.request_correlation_hash,
        existing_binding: {
          assertion: clone(fixture.step_assertion),
          binding_evidence_hash: fixture.step_binding_results[0].binding_evidence_hash,
          context_expires_at: fixture.step_binding_results[0].context_expires_at,
        },
      },
    ),
  );

  assert.throws(
    () => assertBindScenarioDomainActionStepContextV1(
      claimedContract,
      changedBinding,
      fixture.step_binding_results[1],
      {
        ...bindContext(),
        step_state: "scenario_bound",
        request_correlation_hash: changedBinding.step_assertion.request_correlation_hash,
        existing_binding: {
          assertion: clone(fixture.step_assertion),
          binding_evidence_hash: fixture.step_binding_results[0].binding_evidence_hash,
          context_expires_at: fixture.step_binding_results[0].context_expires_at,
        },
      },
    ),
    { code: "request_conflict" },
  );
});

test("D4 unavailable and request-conflict outcomes do not require success metadata", () => {
  const claimedContract = clone(fixture.contract);
  claimedContract.driver = "workflow_claimed_step_v1";
  assert.doesNotThrow(() => assertBindScenarioDomainActionStepContextV1(
    claimedContract,
    fixture.step_binding_input,
    fixture.step_binding_results[3],
    {},
  ));

  const changedBinding = clone(fixture.step_binding_input);
  changedBinding.step_assertion.request_correlation_hash = "a".repeat(64);
  assert.doesNotThrow(() => assertBindScenarioDomainActionStepContextV1(
    claimedContract,
    changedBinding,
    fixture.step_binding_results[2],
    {
      ...bindContext(),
      step_state: "scenario_bound",
      request_correlation_hash: changedBinding.step_assertion.request_correlation_hash,
      existing_binding: {
        assertion: clone(fixture.step_assertion),
        binding_evidence_hash: fixture.step_binding_results[0].binding_evidence_hash,
        context_expires_at: fixture.step_binding_results[0].context_expires_at,
      },
    },
  ));
  assert.throws(
    () => assertBindScenarioDomainActionStepContextV1(
      claimedContract,
      fixture.step_binding_input,
      fixture.step_binding_results[2],
      bindContext(),
    ),
    { code: "unexpected_request_conflict" },
  );
});

test("D4 exact rebind preserves the stored expiry and binding evidence", () => {
  const claimedContract = clone(fixture.contract);
  claimedContract.driver = "workflow_claimed_step_v1";
  const existingBinding = {
    assertion: clone(fixture.step_assertion),
    binding_evidence_hash: fixture.step_binding_results[0].binding_evidence_hash,
    context_expires_at: fixture.step_binding_results[0].context_expires_at,
  };
  const extended = clone(fixture.step_binding_results[1]);
  extended.context_expires_at = "2026-08-05T00:09:00.000Z";
  assert.throws(
    () => assertBindScenarioDomainActionStepContextV1(
      claimedContract,
      fixture.step_binding_input,
      extended,
      {
        ...bindContext(),
        step_state: "scenario_bound",
        context_expires_at: extended.context_expires_at,
        existing_binding: existingBinding,
      },
    ),
    { code: "context_expiry_changed" },
  );

  const replacedEvidence = clone(fixture.step_binding_results[1]);
  replacedEvidence.binding_evidence_hash = "a".repeat(64);
  assert.throws(
    () => assertBindScenarioDomainActionStepContextV1(
      claimedContract,
      fixture.step_binding_input,
      replacedEvidence,
      {
        ...bindContext(),
        step_state: "scenario_bound",
        binding_evidence_hash: replacedEvidence.binding_evidence_hash,
        existing_binding: existingBinding,
      },
    ),
    { code: "binding_evidence_mismatch" },
  );
});

test("D4 rejects wrong, missing, already-claimable and expired Step binding", () => {
  const claimedContract = clone(fixture.contract);
  claimedContract.driver = "workflow_claimed_step_v1";
  const cases = [
    ["wrong Step", { workflow_step_ref: { ...bindContext().workflow_step_ref, object_id: "step_example_02" } }, "workflow_step_mismatch"],
    ["wrong contract", { action_contract_hash: "a".repeat(64) }, "step_contract_mismatch"],
    ["wrong principal", { principal_provenance_hash: "b".repeat(64) }, "principal_binding_mismatch"],
    ["wrong correlation", { request_correlation_hash: "c".repeat(64) }, "request_correlation_mismatch"],
    ["wrong Workspace", { workspace_ref: { ...bindContext().workspace_ref, object_id: "workspace_example_02" } }, "workspace_mismatch"],
    ["missing Step", { step_state: "missing" }, "step_not_bindable"],
    ["already claimable", { step_state: "claimable" }, "step_not_bindable"],
    ["expired", { now: "2026-08-05T00:05:00.000Z" }, "submit_context_expired"],
  ];
  for (const [name, change, code] of cases) {
    assert.throws(
      () => assertBindScenarioDomainActionStepContextV1(
        claimedContract,
        fixture.step_binding_input,
        fixture.step_binding_results[0],
        { ...bindContext(), ...change },
      ),
      { code },
      name,
    );
  }

  const wrongMutation = clone(fixture.step_binding_input);
  wrongMutation.submit.client_echo.client_mutation_id = "mutation_example_02";
  assert.throws(
    () => assertBindScenarioDomainActionStepContextV1(
      claimedContract,
      wrongMutation,
      fixture.step_binding_results[0],
      bindContext(),
    ),
    { code: "client_mutation_mismatch" },
  );

  const extended = clone(fixture.step_binding_results[0]);
  extended.context_expires_at = "2026-08-05T00:05:00.001Z";
  assert.throws(
    () => assertBindScenarioDomainActionStepContextV1(
      claimedContract,
      fixture.step_binding_input,
      extended,
      bindContext(),
    ),
    { code: "context_expiry_changed" },
  );
});

test("D4 recovers a lost bind response only through the same body-free Step lookup", () => {
  const storedBinding = {
    workflow_step_ref: clone(fixture.step_assertion.workflow_step_ref),
    binding_evidence_hash: fixture.step_binding_results[0].binding_evidence_hash,
    context_expires_at: fixture.step_binding_results[0].context_expires_at,
  };
  assert.doesNotThrow(() => assertLookupScenarioDomainActionStepBindingExchangeV1(
    fixture.binding_lookup_input,
    fixture.binding_lookup_results[0],
    storedBinding,
  ));
  assert.doesNotThrow(() => assertLookupScenarioDomainActionStepBindingExchangeV1(
    fixture.binding_lookup_input,
    fixture.binding_lookup_results[2],
    storedBinding,
  ));
  assert.doesNotThrow(() => assertLookupScenarioDomainActionStepBindingExchangeV1(
    fixture.binding_lookup_input,
    fixture.binding_lookup_results[1],
  ));

  const replacementLookup = clone(fixture.binding_lookup_input);
  replacementLookup.workflow_step_ref.object_id = "step_example_02";
  assert.throws(
    () => assertLookupScenarioDomainActionStepBindingExchangeV1(
      replacementLookup,
      fixture.binding_lookup_results[0],
      storedBinding,
    ),
    { code: "binding_recovery_mismatch" },
  );
  assert.throws(
    () => assertLookupScenarioDomainActionStepBindingExchangeV1(
      fixture.binding_lookup_input,
      fixture.binding_lookup_results[0],
    ),
    { code: "unexpected_binding" },
  );
});

test("D4 forbids claim before bind but permits transient same-Step reclaim rotation", () => {
  const context = {
    binding_published: true,
    workflow_step_ref: clone(fixture.step_assertion.workflow_step_ref),
    action_contract_hash: fixture.step_assertion.action_contract_hash,
  };
  assert.doesNotThrow(() => assertScenarioDomainActionClaimedStepDriverContextV1(
    fixture.claimed_step_driver,
    context,
  ));
  const reclaim = clone(fixture.claimed_step_driver);
  reclaim.claim_token = "G".repeat(43);
  reclaim.expected_step_version = 3;
  assert.doesNotThrow(() => assertScenarioDomainActionClaimedStepDriverContextV1(reclaim, context));
  assert.throws(
    () => assertScenarioDomainActionClaimedStepDriverContextV1(
      fixture.claimed_step_driver,
      { ...context, binding_published: false },
    ),
    { code: "claim_before_bind" },
  );
  assert.throws(
    () => assertScenarioDomainActionClaimedStepDriverContextV1(
      fixture.claimed_step_driver,
      { ...context, action_contract_hash: "a".repeat(64) },
    ),
    { code: "step_contract_mismatch" },
  );
});

test("D4 composes claimed driver, original Step and execution identity", () => {
  const claimedContract = clone(fixture.contract);
  claimedContract.driver = "workflow_claimed_step_v1";
  const context = {
    binding_published: true,
    action_contract_hash: fixture.step_assertion.action_contract_hash,
  };
  assert.doesNotThrow(() => assertScenarioDomainActionClaimedStepExecutionContextV1(
    claimedContract,
    fixture.step_assertion,
    fixture.claimed_step_driver,
    fixture.execution_bindings[1],
    fixture.execution_results[1],
    context,
  ));

  const wrongDriverStep = clone(fixture.claimed_step_driver);
  wrongDriverStep.workflow_step_ref.object_id = "step_example_02";
  assert.throws(
    () => assertScenarioDomainActionClaimedStepExecutionContextV1(
      claimedContract,
      fixture.step_assertion,
      wrongDriverStep,
      fixture.execution_bindings[1],
      fixture.execution_results[1],
      context,
    ),
    { code: "workflow_step_mismatch" },
  );

  const wrongExecutionStep = clone(fixture.execution_bindings[1]);
  wrongExecutionStep.effect_identity.original_workflow_step_ref.object_id = "step_example_02";
  assert.throws(
    () => assertScenarioDomainActionClaimedStepExecutionContextV1(
      claimedContract,
      fixture.step_assertion,
      fixture.claimed_step_driver,
      wrongExecutionStep,
      fixture.execution_results[1],
      context,
    ),
    { code: "workflow_step_mismatch" },
  );

  const wrongWorkspace = clone(fixture.execution_bindings[1]);
  wrongWorkspace.effect_identity.workspace_ref.object_id = "workspace_example_02";
  assert.throws(
    () => assertScenarioDomainActionClaimedStepExecutionContextV1(
      claimedContract,
      fixture.step_assertion,
      fixture.claimed_step_driver,
      wrongWorkspace,
      fixture.execution_results[1],
      context,
    ),
    { code: "workspace_mismatch" },
  );

  const wrongContractHash = clone(fixture.claimed_step_driver);
  wrongContractHash.action_contract_hash = "a".repeat(64);
  assert.throws(
    () => assertScenarioDomainActionClaimedStepExecutionContextV1(
      claimedContract,
      fixture.step_assertion,
      wrongContractHash,
      fixture.execution_bindings[1],
      fixture.execution_results[1],
      context,
    ),
    { code: "step_contract_mismatch" },
  );
  assert.throws(
    () => assertScenarioDomainActionClaimedStepExecutionContextV1(
      claimedContract,
      fixture.step_assertion,
      fixture.claimed_step_driver,
      fixture.execution_bindings[1],
      fixture.execution_results[1],
      { ...context, binding_published: false },
    ),
    { code: "claim_before_bind" },
  );

  const changedAssertion = clone(fixture.step_assertion);
  const changedDriver = clone(fixture.claimed_step_driver);
  changedAssertion.action_contract_hash = "a".repeat(64);
  changedDriver.action_contract_hash = changedAssertion.action_contract_hash;
  assert.throws(
    () => assertScenarioDomainActionClaimedStepExecutionContextV1(
      claimedContract,
      changedAssertion,
      changedDriver,
      fixture.execution_bindings[1],
      fixture.execution_results[1],
      context,
    ),
    { code: "step_contract_mismatch" },
  );
});

test("D4 claim evidence cannot enter binding or execution persistence", () => {
  const claimToken = fixture.claimed_step_driver.claim_token;
  for (const [codec, source] of [
    [assertBindScenarioDomainActionStepResultV1, fixture.step_binding_results[0]],
    [assertLookupScenarioDomainActionStepBindingResultV1, fixture.binding_lookup_results[0]],
    [assertScenarioDomainActionExecutionBindingV1, fixture.execution_bindings[1]],
    [assertScenarioDomainActionExecutionResultV1, fixture.execution_results[1]],
  ]) {
    const value = clone(source);
    value.claim_token = claimToken;
    assert.throws(() => codec(value), { code: "unknown_field" });
  }
});
