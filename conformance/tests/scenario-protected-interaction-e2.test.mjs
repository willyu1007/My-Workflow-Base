import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  assertPrepareScenarioProtectedInteractionExchangeV1,
  assertPrepareScenarioProtectedInteractionInputV1,
  assertPrepareScenarioProtectedInteractionResultV1,
  assertScenarioPreparedProtectedContentControlV1,
} from "@host/workflow-contracts";

const schemaRoot = new URL(
  "../../templates/host-runtime/packages/workflow-contracts/schemas/",
  import.meta.url,
);
const e1Fixture = JSON.parse(await readFile(
  new URL("../fixtures/scenario-protected-interaction-e1.valid.json", import.meta.url),
  "utf8",
));
const fixture = JSON.parse(await readFile(
  new URL("../fixtures/scenario-protected-interaction-e2.valid.json", import.meta.url),
  "utf8",
));
const domainFixture = JSON.parse(await readFile(
  new URL("../fixtures/scenario-domain-action-d1.valid.json", import.meta.url),
  "utf8",
));
const schemaNames = [
  "scenario-safe-text-v1.schema.json",
  "scenario-safe-reason-v1.schema.json",
  "scenario-domain-action-confirmation-prompt-v1.schema.json",
  "prepare-scenario-domain-action-input-v1.schema.json",
  "prepare-scenario-domain-action-result-v1.schema.json",
  "scenario-protected-carrier-binding-v1.schema.json",
  "prepare-scenario-protected-interaction-input-v1.schema.json",
  "scenario-prepared-protected-content-control-v1.schema.json",
  "prepare-scenario-protected-interaction-result-v1.schema.json",
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
const validateInput = validator("prepare-scenario-protected-interaction-input-v1");
const validateControl = validator("scenario-prepared-protected-content-control-v1");
const validateResult = validator("prepare-scenario-protected-interaction-result-v1");
const clone = (value) => structuredClone(value);

const assertParityRejects = (validate, codec, value) => {
  assert.equal(validate(value), false, "JSON Schema unexpectedly accepted mutation");
  assert.throws(() => codec(value));
};

const actionPrepareContext = () => ({
  scenario_key: domainFixture.contract.scenario_key,
  ingress_key: "example.web",
  principal_binding_hash: "7".repeat(64),
  target_principal_binding_hash: "7".repeat(64),
  workspace_ref: clone(domainFixture.step_assertion.workspace_ref),
  target_workspace_ref: clone(domainFixture.step_assertion.workspace_ref),
  target_ref: fixture.input.action_prepare.target_ref,
  target_ref_class: domainFixture.contract.target_ref_class,
  current_expected_version: fixture.input.action_prepare.expected_version,
  input_schema_key: domainFixture.contract.input_schema_key,
  input_schema_version: domainFixture.contract.input_schema_version,
  assert_action_input: (value) => assert.deepEqual(value, { example_mode: "neutral" }),
});

const exchangeContext = () => ({
  carrier_binding_verification: {
    carrier_scope: "prepare_input",
    protected_field_key: e1Fixture.contract.protected_field_key,
    verified_keyed_binding_hash: fixture.input.carrier_binding.keyed_binding_hash,
  },
  action_prepare_context: actionPrepareContext(),
  prepared_content_verification: {
    protected_content_ref: fixture.results[0].prepared_content.protected_content_ref,
    protected_content_version: fixture.results[0].prepared_content.protected_content_version,
    protected_field_key: e1Fixture.contract.protected_field_key,
    content_kind: e1Fixture.contract.content_kind,
    verified_keyed_integrity_hash: fixture.results[0].prepared_content.keyed_integrity_hash,
    issued_at: fixture.results[0].prepared_content.issued_at,
    expires_at: fixture.results[0].prepared_content.expires_at,
  },
});

test("E2 accepts body-free prepare control and all closed result branches", () => {
  assert.equal(validateInput(fixture.input), true, JSON.stringify(validateInput.errors));
  assert.doesNotThrow(() => assertPrepareScenarioProtectedInteractionInputV1(fixture.input));
  for (const result of fixture.results) {
    assert.equal(validateResult(result), true, JSON.stringify(validateResult.errors));
    assert.doesNotThrow(() => assertPrepareScenarioProtectedInteractionResultV1(result));
  }
  assert.equal(
    validateControl(fixture.results[0].prepared_content),
    true,
    JSON.stringify(validateControl.errors),
  );
  assert.doesNotThrow(() =>
    assertScenarioPreparedProtectedContentControlV1(fixture.results[0].prepared_content));
});

test("E2 schemas and codecs reject payload, authority and mixed branches", async (context) => {
  const cases = [
    ["prepare carrier", validateInput, assertPrepareScenarioProtectedInteractionInputV1, fixture.input, (value) => { value.action_prepare.action_input.carrier = {}; }],
    ["prepare plaintext dev", validateInput, assertPrepareScenarioProtectedInteractionInputV1, fixture.input, (value) => { value.action_prepare.action_input.plain_text_dev = "redacted"; }],
    ["prepare content ref", validateInput, assertPrepareScenarioProtectedInteractionInputV1, fixture.input, (value) => { value.action_prepare.action_input.protected_content_ref = "R".repeat(43); }],
    ["prepare read scope", validateInput, assertPrepareScenarioProtectedInteractionInputV1, fixture.input, (value) => { value.carrier_binding.carrier_scope = "read_output"; }],
    ["prepared unknown", validateControl, assertScenarioPreparedProtectedContentControlV1, fixture.results[0].prepared_content, (value) => { value.body = "redacted"; }],
    ["prepared uppercase integrity", validateControl, assertScenarioPreparedProtectedContentControlV1, fixture.results[0].prepared_content, (value) => { value.keyed_integrity_hash = "C".repeat(64); }],
    ["prepared wrong state", validateControl, assertScenarioPreparedProtectedContentControlV1, fixture.results[0].prepared_content, (value) => { value.state = "committed"; }],
    ["success missing control", validateResult, assertPrepareScenarioProtectedInteractionResultV1, fixture.results[0], (value) => { delete value.prepared_content; }],
    ["failure with control", validateResult, assertPrepareScenarioProtectedInteractionResultV1, fixture.results[1], (value) => { value.prepared_content = clone(fixture.results[0].prepared_content); }],
    ["mixed result", validateResult, assertPrepareScenarioProtectedInteractionResultV1, fixture.results[0], (value) => { value.action_result = clone(fixture.results[1].action_result); }],
  ];
  for (const [name, validate, codec, source, mutate] of cases) {
    await context.test(name, () => {
      const value = clone(source);
      mutate(value);
      assertParityRejects(validate, codec, value);
    });
  }
});

test("E2 contextual composition binds carrier, action, integrity, kind and exact times", () => {
  assert.doesNotThrow(() => assertPrepareScenarioProtectedInteractionExchangeV1(
    e1Fixture.contract,
    domainFixture.contract,
    fixture.input,
    fixture.results[0],
    e1Fixture.carrier,
    exchangeContext(),
  ));

  const failures = [
    ["binding_hash_mismatch", (result, context) => {
      context.carrier_binding_verification.verified_keyed_binding_hash = "d".repeat(64);
    }],
    ["content_kind_mismatch", (result, context) => {
      context.prepared_content_verification.content_kind = "example.other_content";
    }],
    ["protected_field_mismatch", (result, context) => {
      context.prepared_content_verification.protected_field_key = "example_other_text";
    }],
    ["integrity_hash_mismatch", (result, context) => {
      context.prepared_content_verification.verified_keyed_integrity_hash = "d".repeat(64);
    }],
    ["prepared_time_mismatch", (result) => {
      result.prepared_content.expires_at = "2026-08-05T00:04:59.000Z";
    }],
    ["hash_domain_reuse", (result) => {
      result.prepared_content.keyed_integrity_hash = fixture.input.carrier_binding.keyed_binding_hash;
    }],
  ];
  for (const [code, mutate] of failures) {
    const result = clone(fixture.results[0]);
    const context = exchangeContext();
    mutate(result, context);
    if (code === "hash_domain_reuse") {
      context.prepared_content_verification.verified_keyed_integrity_hash =
        fixture.input.carrier_binding.keyed_binding_hash;
    }
    assert.throws(() => assertPrepareScenarioProtectedInteractionExchangeV1(
      e1Fixture.contract,
      domainFixture.contract,
      fixture.input,
      result,
      e1Fixture.carrier,
      context,
    ), { code });
  }
});

test("E2 failures never carry prepared content or owner success verification", () => {
  for (const result of fixture.results.slice(1)) {
    const context = exchangeContext();
    delete context.prepared_content_verification;
    assert.doesNotThrow(() => assertPrepareScenarioProtectedInteractionExchangeV1(
      e1Fixture.contract,
      domainFixture.contract,
      fixture.input,
      result,
      e1Fixture.carrier,
      context,
    ));
  }
});

test("E2 rejects carrier copies hidden under otherwise generic action keys", () => {
  const input = clone(fixture.input);
  input.action_prepare.action_input.example_note = e1Fixture.carrier.plain_text;
  assert.equal(validateInput(input), true, JSON.stringify(validateInput.errors));
  assert.throws(() => assertPrepareScenarioProtectedInteractionExchangeV1(
    e1Fixture.contract,
    domainFixture.contract,
    input,
    fixture.results[0],
    e1Fixture.carrier,
    exchangeContext(),
  ), { code: "protected_copy" });
});
