import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  assertPrepareScenarioDomainActionExchangeV1,
  assertPrepareScenarioDomainActionInputV1,
  assertPrepareScenarioDomainActionResultV1,
  assertScenarioAuthenticationAssuranceEvidenceV1,
  assertScenarioDomainActionSubmitEchoV1,
  assertSubmitScenarioDomainActionContextV1,
  assertSubmitScenarioDomainActionInputV1,
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
  "scenario-safe-text-v1.schema.json",
  "scenario-safe-reason-v1.schema.json",
  "scenario-domain-action-confirmation-prompt-v1.schema.json",
  "prepare-scenario-domain-action-input-v1.schema.json",
  "prepare-scenario-domain-action-result-v1.schema.json",
  "scenario-domain-action-submit-echo-v1.schema.json",
  "scenario-authentication-assurance-evidence-v1.schema.json",
  "submit-scenario-domain-action-input-v1.schema.json",
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
const validatePrepareInput = validator("prepare-scenario-domain-action-input-v1");
const validatePrepareResult = validator("prepare-scenario-domain-action-result-v1");
const validateSubmitEcho = validator("scenario-domain-action-submit-echo-v1");
const validateAssurance = validator("scenario-authentication-assurance-evidence-v1");
const validateSubmitInput = validator("submit-scenario-domain-action-input-v1");
const clone = (value) => structuredClone(value);

const assertParityRejects = (validate, codec, value) => {
  assert.equal(validate(value), false, "JSON Schema unexpectedly accepted mutation");
  assert.throws(() => codec(value));
};

test("D2 accepts zero-effect prepare and exact submit variants", () => {
  assert.equal(validatePrepareInput(fixture.prepare_input), true, JSON.stringify(validatePrepareInput.errors));
  assert.doesNotThrow(() => assertPrepareScenarioDomainActionInputV1(fixture.prepare_input));
  for (const result of fixture.prepare_results) {
    assert.equal(validatePrepareResult(result), true, JSON.stringify(validatePrepareResult.errors));
    assert.doesNotThrow(() => assertPrepareScenarioDomainActionResultV1(result));
  }
  for (const submit of fixture.submit_inputs) {
    assert.equal(validateSubmitInput(submit), true, JSON.stringify(validateSubmitInput.errors));
    assert.doesNotThrow(() => assertSubmitScenarioDomainActionInputV1(submit));
  }
});

test("D2 closes prepare, result, client echo and assurance envelopes", async (context) => {
  const cases = [
    ["prepare principal", validatePrepareInput, assertPrepareScenarioDomainActionInputV1, fixture.prepare_input, (value) => { value.principal = {}; }],
    ["prepare driver", validatePrepareInput, assertPrepareScenarioDomainActionInputV1, fixture.prepare_input, (value) => { value.driver = "scenario_direct_empty_v1"; }],
    ["prepare array input", validatePrepareInput, assertPrepareScenarioDomainActionInputV1, fixture.prepare_input, (value) => { value.action_input = []; }],
    ["result target echo", validatePrepareResult, assertPrepareScenarioDomainActionResultV1, fixture.prepare_results[0], (value) => { value.target_ref = fixture.prepare_input.target_ref; }],
    ["result action echo", validatePrepareResult, assertPrepareScenarioDomainActionResultV1, fixture.prepare_results[0], (value) => { value.action_input = {}; }],
    ["echo action", validateSubmitEcho, assertScenarioDomainActionSubmitEchoV1, fixture.submit_inputs[0].client_echo, (value) => { value.action_key = "example.record"; }],
    ["echo assurance", validateSubmitEcho, assertScenarioDomainActionSubmitEchoV1, fixture.submit_inputs[0].client_echo, (value) => { value.authentication_assurance = {}; }],
    ["echo claim", validateSubmitEcho, assertScenarioDomainActionSubmitEchoV1, fixture.submit_inputs[0].client_echo, (value) => { value.claim_token = "A".repeat(32); }],
    ["assurance credential", validateAssurance, assertScenarioAuthenticationAssuranceEvidenceV1, fixture.submit_inputs[1].authentication_assurance, (value) => { value.credential = "secret"; }],
    ["assurance authorization", validateAssurance, assertScenarioAuthenticationAssuranceEvidenceV1, fixture.submit_inputs[1].authentication_assurance, (value) => { value.authorized = true; }],
    ["outer metadata", validateSubmitInput, assertSubmitScenarioDomainActionInputV1, fixture.submit_inputs[0], (value) => { value.metadata = {}; }],
  ];
  for (const [name, validate, codec, source, mutate] of cases) {
    await context.test(name, () => {
      const value = clone(source);
      mutate(value);
      assertParityRejects(validate, codec, value);
    });
  }
});

test("D2 codec enforces 32 KiB action input and five-minute lifetimes", () => {
  const oversized = clone(fixture.prepare_input);
  oversized.action_input = { value: "x".repeat(32 * 1024) };
  assert.equal(validatePrepareInput(oversized), true, JSON.stringify(validatePrepareInput.errors));
  assert.throws(() => assertPrepareScenarioDomainActionInputV1(oversized), {
    code: "action_input_too_large",
  });

  const overlongContext = clone(fixture.prepare_results[0]);
  overlongContext.expires_at = "2026-08-05T00:05:00.001Z";
  assert.equal(validatePrepareResult(overlongContext), true, JSON.stringify(validatePrepareResult.errors));
  assert.throws(() => assertPrepareScenarioDomainActionResultV1(overlongContext), {
    code: "invalid_lifetime",
  });

  const overlongAssurance = clone(fixture.submit_inputs[1].authentication_assurance);
  overlongAssurance.expires_at = "2026-08-05T00:06:00.001Z";
  assert.equal(validateAssurance(overlongAssurance), true, JSON.stringify(validateAssurance.errors));
  assert.throws(() => assertScenarioAuthenticationAssuranceEvidenceV1(overlongAssurance), {
    code: "invalid_lifetime",
  });
});

test("D2 codec rejects values that JSON serialization would silently rewrite", () => {
  for (const actionInput of [
    { value: undefined },
    { value: Number.NaN },
    { value: new Date("2026-08-05T00:00:00.000Z") },
    { value: () => "omitted" },
  ]) {
    const input = clone(fixture.prepare_input);
    input.action_input = actionInput;
    assert.throws(() => assertPrepareScenarioDomainActionInputV1(input), {
      code: "invalid_json_value",
    });
  }
  const cyclic = {};
  cyclic.self = cyclic;
  const input = clone(fixture.prepare_input);
  input.action_input = cyclic;
  assert.throws(() => assertPrepareScenarioDomainActionInputV1(input), {
    code: "invalid_json_value",
  });
});

test("D2 prepare exchange binds contract, target, ingress and delegated input codec", () => {
  const context = {
    scenario_key: fixture.contract.scenario_key,
    ingress_key: "example.web",
    principal_binding_hash: "7".repeat(64),
    target_principal_binding_hash: "7".repeat(64),
    workspace_ref: clone(fixture.step_assertion.workspace_ref),
    target_workspace_ref: clone(fixture.step_assertion.workspace_ref),
    target_ref: fixture.prepare_input.target_ref,
    target_ref_class: fixture.contract.target_ref_class,
    current_expected_version: fixture.prepare_input.expected_version,
    input_schema_key: fixture.contract.input_schema_key,
    input_schema_version: fixture.contract.input_schema_version,
    assert_action_input: (value) => {
      assert.deepEqual(Object.keys(value), ["example_value"]);
    },
  };
  assert.doesNotThrow(() => assertPrepareScenarioDomainActionExchangeV1(
    fixture.contract,
    fixture.prepare_input,
    fixture.prepare_results[0],
    context,
  ));

  for (const [field, value, code] of [
    ["scenario_key", "other-scenario", "scenario_mismatch"],
    ["ingress_key", "example.mobile", "ingress_mismatch"],
    ["target_ref", "F".repeat(43), "target_mismatch"],
    ["current_expected_version", "version-02", "target_version_changed"],
    ["input_schema_key", "example.other.input", "input_schema_mismatch"],
  ]) {
    assert.throws(
      () => assertPrepareScenarioDomainActionExchangeV1(
        fixture.contract,
        fixture.prepare_input,
        fixture.prepare_results[0],
        { ...context, [field]: value },
      ),
      { code },
    );
  }

  assert.throws(
    () => assertPrepareScenarioDomainActionExchangeV1(
      fixture.contract,
      fixture.prepare_input,
      fixture.prepare_results[0],
      { ...context, target_principal_binding_hash: "8".repeat(64) },
    ),
    { code: "principal_binding_mismatch" },
  );
  assert.throws(
    () => assertPrepareScenarioDomainActionExchangeV1(
      fixture.contract,
      fixture.prepare_input,
      fixture.prepare_results[0],
      {
        ...context,
        target_workspace_ref: { ...context.target_workspace_ref, object_id: "workspace_other_01" },
      },
    ),
    { code: "workspace_mismatch" },
  );

  assert.throws(
    () => assertPrepareScenarioDomainActionExchangeV1(
      fixture.contract,
      fixture.prepare_input,
      fixture.prepare_results[0],
      { ...context, assert_action_input: () => { throw new Error("invalid nested field"); } },
    ),
    { code: "delegated_input_invalid" },
  );
});

test("D2 contextual submit keeps explicit and strong assurance mutually exclusive", () => {
  const explicitContract = clone(fixture.contract);
  explicitContract.confirmation_class = "explicit";
  const strongContract = clone(fixture.contract);
  strongContract.confirmation_class = "strong_authorization";
  const context = {
    principal_binding_hash: "4".repeat(64),
    submit_context_expires_at: "2026-08-05T00:04:00.000Z",
    now: "2026-08-05T00:02:00.000Z",
  };

  assert.doesNotThrow(() => assertSubmitScenarioDomainActionContextV1(
    explicitContract,
    fixture.submit_inputs[0],
    context,
  ));
  assert.doesNotThrow(() => assertSubmitScenarioDomainActionContextV1(
    strongContract,
    fixture.submit_inputs[1],
    context,
  ));
  assert.throws(
    () => assertSubmitScenarioDomainActionContextV1(
      explicitContract,
      fixture.submit_inputs[1],
      context,
    ),
    { code: "unexpected_assurance" },
  );
  assert.throws(
    () => assertSubmitScenarioDomainActionContextV1(
      strongContract,
      fixture.submit_inputs[0],
      context,
    ),
    { code: "missing_assurance" },
  );

  const wrongPrincipal = clone(fixture.submit_inputs[1]);
  wrongPrincipal.authentication_assurance.principal_binding_hash = "6".repeat(64);
  assert.throws(
    () => assertSubmitScenarioDomainActionContextV1(strongContract, wrongPrincipal, context),
    { code: "principal_binding_mismatch" },
  );

  const lateAssurance = clone(fixture.submit_inputs[1]);
  lateAssurance.authentication_assurance.expires_at = "2026-08-05T00:04:00.001Z";
  assert.throws(
    () => assertSubmitScenarioDomainActionContextV1(strongContract, lateAssurance, context),
    { code: "assurance_not_current" },
  );
});
