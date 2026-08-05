import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  assertScenarioDomainActionEffectIdentityInputV1,
  assertScenarioDomainActionExactReplayV1,
  assertScenarioDomainActionExecutionBindingV1,
  assertScenarioDomainActionExecutionResultForBindingV1,
  assertScenarioDomainActionExecutionResultV1,
  assertSubmitScenarioDomainActionResultForContractV1,
  assertSubmitScenarioDomainActionResultV1,
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
  "scenario-domain-action-effect-identity-input-v1.schema.json",
  "scenario-domain-action-execution-binding-v1.schema.json",
  "scenario-domain-action-execution-result-v1.schema.json",
  "scenario-domain-action-current-result-v1.schema.json",
  "submit-scenario-domain-action-result-v1.schema.json",
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
const validateIdentity = validator("scenario-domain-action-effect-identity-input-v1");
const validateBinding = validator("scenario-domain-action-execution-binding-v1");
const validateExecutionResult = validator("scenario-domain-action-execution-result-v1");
const validateSubmitResult = validator("submit-scenario-domain-action-result-v1");
const clone = (value) => structuredClone(value);

const assertParityRejects = (validate, codec, value) => {
  assert.equal(validate(value), false, "JSON Schema unexpectedly accepted mutation");
  assert.throws(() => codec(value));
};

test("D3 accepts both scenario-keyed identity branches and every result vocabulary", () => {
  for (const binding of fixture.execution_bindings) {
    assert.equal(validateIdentity(binding.effect_identity), true, JSON.stringify(validateIdentity.errors));
    assert.equal(validateBinding(binding), true, JSON.stringify(validateBinding.errors));
    assert.doesNotThrow(() => assertScenarioDomainActionEffectIdentityInputV1(binding.effect_identity));
    assert.doesNotThrow(() => assertScenarioDomainActionExecutionBindingV1(binding));
  }
  for (const result of fixture.execution_results) {
    assert.equal(validateExecutionResult(result), true, JSON.stringify(validateExecutionResult.errors));
    assert.doesNotThrow(() => assertScenarioDomainActionExecutionResultV1(result));
  }
  for (const result of fixture.submit_results) {
    assert.equal(validateSubmitResult(result), true, JSON.stringify(validateSubmitResult.errors));
    assert.doesNotThrow(() => assertSubmitScenarioDomainActionResultV1(result));
  }
});

test("D3 requires scenario_key and enforces identity branch exclusion", async (context) => {
  const cases = [
    ["direct missing scenario", 0, (value) => { delete value.scenario_key; }],
    ["claimed missing scenario", 1, (value) => { delete value.scenario_key; }],
    ["direct Step", 0, (value) => { value.original_workflow_step_ref = clone(fixture.step_assertion.workflow_step_ref); }],
    ["claimed submit context", 1, (value) => { value.submit_context_ref = clone(fixture.execution_bindings[0].effect_identity.submit_context_ref); }],
    ["client mutation", 0, (value) => { value.client_mutation_id = "mutation_example_01"; }],
    ["claim token", 1, (value) => { value.claim_token = "A".repeat(32); }],
    ["attempt", 1, (value) => { value.attempt = 2; }],
  ];
  for (const [name, index, mutate] of cases) {
    await context.test(name, () => {
      const identity = clone(fixture.execution_bindings[index].effect_identity);
      mutate(identity);
      assertParityRejects(validateIdentity, assertScenarioDomainActionEffectIdentityInputV1, identity);
    });
  }
});

test("D3 binding accepts only lowercase canonical payload evidence", () => {
  const binding = clone(fixture.execution_bindings[0]);
  binding.canonical_payload_hash = "A".repeat(64);
  assertParityRejects(validateBinding, assertScenarioDomainActionExecutionBindingV1, binding);
});

test("D3 execution result separates outcome, disposition and closed exposure", async (context) => {
  const committed = fixture.execution_results[1];
  const cases = [
    ["business outcome alias", (value) => { value.business_outcome = "duplicate"; }],
    ["disposition alias", (value) => { value.disposition = "already_satisfied"; }],
    ["claim token", (value) => { value.claim_token = "A".repeat(32); }],
    ["workflow Step", (value) => { value.workflow_step_ref = clone(fixture.step_assertion.workflow_step_ref); }],
    ["mixed decision", (value) => { value.decision = "request_conflict"; }],
    ["snapshot body", (value) => { value.handoff_request_snapshots[0].body = {}; }],
  ];
  for (const [name, mutate] of cases) {
    await context.test(name, () => {
      const value = clone(committed);
      mutate(value);
      assertParityRejects(validateExecutionResult, assertScenarioDomainActionExecutionResultV1, value);
    });
  }
});

test("D3 direct execution requires exact empty snapshots and static contract identity", () => {
  const directContract = clone(fixture.contract);
  directContract.driver = "scenario_direct_empty_v1";
  const claimedContract = clone(fixture.contract);
  claimedContract.driver = "workflow_claimed_step_v1";
  assert.doesNotThrow(() => assertScenarioDomainActionExecutionResultForBindingV1(
    directContract,
    fixture.execution_bindings[0],
    fixture.execution_results[0],
  ));
  assert.doesNotThrow(() => assertScenarioDomainActionExecutionResultForBindingV1(
    claimedContract,
    fixture.execution_bindings[1],
    fixture.execution_results[1],
  ));

  assert.throws(
    () => assertScenarioDomainActionExecutionResultForBindingV1(
      directContract,
      fixture.execution_bindings[0],
      fixture.execution_results[1],
    ),
    { code: "direct_snapshot_forbidden" },
  );

  const wrongScenario = clone(fixture.execution_bindings[0]);
  wrongScenario.effect_identity.scenario_key = "example-other";
  assert.throws(
    () => assertScenarioDomainActionExecutionResultForBindingV1(
      directContract,
      wrongScenario,
      fixture.execution_results[0],
    ),
    { code: "execution_contract_mismatch" },
  );
});

test("D3 exact replay rejects payload drift, wrong Step and changed seed", () => {
  const directReplay = clone(fixture.execution_results[0]);
  directReplay.disposition = "replayed";
  assert.doesNotThrow(() => assertScenarioDomainActionExactReplayV1(
    fixture.execution_bindings[0],
    fixture.execution_bindings[0],
    fixture.execution_results[0],
    directReplay,
  ));

  const changedPayload = clone(fixture.execution_bindings[0]);
  changedPayload.canonical_payload_hash = "8".repeat(64);
  assert.throws(
    () => assertScenarioDomainActionExactReplayV1(
      fixture.execution_bindings[0],
      changedPayload,
      fixture.execution_results[0],
      directReplay,
    ),
    { code: "request_conflict" },
  );

  const wrongStep = clone(fixture.execution_bindings[1]);
  wrongStep.effect_identity.original_workflow_step_ref.object_id = "step_example_02";
  const claimedReplay = clone(fixture.execution_results[1]);
  claimedReplay.disposition = "replayed";
  assert.throws(
    () => assertScenarioDomainActionExactReplayV1(
      fixture.execution_bindings[1],
      wrongStep,
      fixture.execution_results[1],
      claimedReplay,
    ),
    { code: "request_conflict" },
  );

  const changedSeed = clone(claimedReplay);
  changedSeed.handoff_request_snapshots = [];
  assert.throws(
    () => assertScenarioDomainActionExactReplayV1(
      fixture.execution_bindings[1],
      fixture.execution_bindings[1],
      fixture.execution_results[1],
      changedSeed,
    ),
    { code: "replay_result_mismatch" },
  );
});

test("D3 public shell is reference-free and driver-compatible", async (context) => {
  const cases = [
    ["execution ref", (value) => { value.execution_ref = clone(fixture.execution_results[0].execution_ref); }],
    ["output refs", (value) => { value.output_refs = []; }],
    ["snapshot refs", (value) => { value.handoff_request_snapshots = []; }],
    ["Step ref", (value) => { value.workflow_step_ref = clone(fixture.step_assertion.workflow_step_ref); }],
    ["driver", (value) => { value.driver = "scenario_direct_empty_v1"; }],
    ["internal reason", (value) => { value.internal_reason = "database unavailable"; }],
  ];
  for (const [name, mutate] of cases) {
    await context.test(name, () => {
      const value = clone(fixture.submit_results[1]);
      mutate(value);
      assertParityRejects(validateSubmitResult, assertSubmitScenarioDomainActionResultV1, value);
    });
  }

  const directContract = clone(fixture.contract);
  directContract.driver = "scenario_direct_empty_v1";
  const claimedContract = clone(fixture.contract);
  claimedContract.driver = "workflow_claimed_step_v1";
  assert.doesNotThrow(() => assertSubmitScenarioDomainActionResultForContractV1(
    directContract,
    fixture.submit_results[1],
  ));
  assert.doesNotThrow(() => assertSubmitScenarioDomainActionResultForContractV1(
    claimedContract,
    fixture.submit_results[0],
  ));
  assert.throws(
    () => assertSubmitScenarioDomainActionResultForContractV1(
      directContract,
      fixture.submit_results[0],
    ),
    { code: "public_mode_mismatch" },
  );
  assert.throws(
    () => assertSubmitScenarioDomainActionResultForContractV1(
      claimedContract,
      fixture.submit_results[1],
    ),
    { code: "public_mode_mismatch" },
  );
});

test("D3 runtime caps the private result at 64 KiB", () => {
  const oversized = clone(fixture.execution_results[1]);
  const largeRef = {
    schema_version: 1,
    namespace: "scenario.example",
    object_type: "example_context",
    object_id: `context_${"x".repeat(190)}`,
  };
  oversized.handoff_request_snapshots = Array.from({ length: 32 }, (_, index) => ({
    requestId: `request-example-${index}`,
    handoffKey: "example_attention",
    requestedPurpose: "example_attention",
    sourceContextRefs: Array.from({ length: 32 }, () => clone(largeRef)),
    sourceArtifactRefs: Array.from({ length: 32 }, () => clone(largeRef)),
  }));
  assert.equal(validateExecutionResult(oversized), true, JSON.stringify(validateExecutionResult.errors));
  assert.throws(() => assertScenarioDomainActionExecutionResultV1(oversized), {
    code: "execution_result_too_large",
  });
});
