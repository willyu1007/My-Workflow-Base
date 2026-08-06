import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import {
  assertScenarioProtectedActionContractPairV1,
  assertScenarioProtectedBodyFreeControlV1,
  assertScenarioProtectedCarrierBindingV1,
  assertScenarioProtectedCarrierBindingVerificationV1,
  assertScenarioProtectedContentRefV1,
  assertScenarioProtectedInteractionContractV1,
  assertScenarioProtectedPlainTextCarrierForContractV1,
  assertScenarioProtectedPlainTextCarrierV1,
} from "@host/workflow-contracts";

const schemaRoot = new URL(
  "../../templates/host-runtime/packages/workflow-contracts/schemas/",
  import.meta.url,
);
const fixture = JSON.parse(await readFile(
  new URL("../fixtures/scenario-protected-interaction-e1.valid.json", import.meta.url),
  "utf8",
));
const domainFixture = JSON.parse(await readFile(
  new URL("../fixtures/scenario-domain-action-d1.valid.json", import.meta.url),
  "utf8",
));
const schemaNames = [
  "scenario-protected-interaction-contract-v1.schema.json",
  "scenario-protected-plain-text-carrier-v1.schema.json",
  "scenario-protected-carrier-binding-v1.schema.json",
];
const schemas = await Promise.all(
  schemaNames.map(async (name) => JSON.parse(await readFile(new URL(name, schemaRoot), "utf8"))),
);
const ajv = new Ajv2020({ allErrors: true, strict: true });
for (const schema of schemas) ajv.addSchema(schema);
const validator = (name) => {
  const validate = ajv.getSchema(`https://morethan.local/contracts/${name}.schema.json`);
  if (!validate) throw new Error(`${name} was not registered`);
  return validate;
};
const validateContract = validator("scenario-protected-interaction-contract-v1");
const validateCarrier = validator("scenario-protected-plain-text-carrier-v1");
const validateBinding = validator("scenario-protected-carrier-binding-v1");
const clone = (value) => structuredClone(value);

const assertParityRejects = (validate, codec, value) => {
  assert.equal(validate(value), false, "JSON Schema unexpectedly accepted mutation");
  assert.throws(() => codec(value));
};

test("E1 accepts the Base-neutral static contract, carrier and keyed bindings", () => {
  assert.equal(validateContract(fixture.contract), true, JSON.stringify(validateContract.errors));
  assert.equal(validateCarrier(fixture.carrier), true, JSON.stringify(validateCarrier.errors));
  for (const binding of [fixture.prepare_binding, fixture.read_binding]) {
    assert.equal(validateBinding(binding), true, JSON.stringify(validateBinding.errors));
    assert.doesNotThrow(() => assertScenarioProtectedCarrierBindingV1(binding));
  }
  assert.doesNotThrow(() => assertScenarioProtectedInteractionContractV1(fixture.contract));
  assert.doesNotThrow(() => assertScenarioProtectedContentRefV1(fixture.content_ref));
  assert.doesNotThrow(() => assertScenarioProtectedPlainTextCarrierV1(fixture.carrier));
  assert.doesNotThrow(() =>
    assertScenarioProtectedPlainTextCarrierForContractV1(fixture.contract, fixture.carrier));
  assert.doesNotThrow(() =>
    assertScenarioProtectedActionContractPairV1(fixture.contract, domainFixture.contract));
  assert.doesNotMatch(
    JSON.stringify(fixture),
    /nurture|child|family|institution|guardian|caregiver|grant|enrollment/iu,
  );
});

test("E1 static join rejects scenario and action drift", () => {
  for (const [field, value, code] of [
    ["scenario_key", "example-other", "scenario_mismatch"],
    ["action_key", "example.other", "action_mismatch"],
  ]) {
    const actionContract = clone(domainFixture.contract);
    actionContract[field] = value;
    assert.throws(() =>
      assertScenarioProtectedActionContractPairV1(fixture.contract, actionContract),
    { code });
  }
});

test("E1 validates the exact normalization boundary without rewriting input", () => {
  const authored = " \talpha\r\nbeta\n ";
  const normalized = authored.replaceAll("\r\n", "\n").trim();
  assert.equal(normalized, "alpha\nbeta");
  const normalizedCarrier = clone(fixture.carrier);
  normalizedCarrier.plain_text = normalized;
  assert.doesNotThrow(() => assertScenarioProtectedPlainTextCarrierV1(normalizedCarrier));

  const decomposedCarrier = clone(fixture.carrier);
  decomposedCarrier.plain_text = "e\u0301";
  assert.doesNotThrow(() => assertScenarioProtectedPlainTextCarrierV1(decomposedCarrier));
  assert.equal(decomposedCarrier.plain_text, "e\u0301");

  const unnormalized = clone(fixture.carrier);
  unnormalized.plain_text = ` ${fixture.carrier.plain_text}`;
  assertParityRejects(validateCarrier, assertScenarioProtectedPlainTextCarrierV1, unnormalized);
});

test("E1 schemas and codecs close contract, carrier and binding shapes", async (context) => {
  const cases = [
    ["contract authority", validateContract, assertScenarioProtectedInteractionContractV1, fixture.contract, (value) => { value.required_role = "operator"; }],
    ["contract operation", validateContract, assertScenarioProtectedInteractionContractV1, fixture.contract, (value) => { value.prepare_operation_key = "commit_protected_content"; }],
    ["contract attachment profile", validateContract, assertScenarioProtectedInteractionContractV1, fixture.contract, (value) => { value.content_profile.attachments = "optional"; }],
    ["carrier unknown field", validateCarrier, assertScenarioProtectedPlainTextCarrierV1, fixture.carrier, (value) => { value.ciphertext = "opaque"; }],
    ["carrier CR", validateCarrier, assertScenarioProtectedPlainTextCarrierV1, fixture.carrier, (value) => { value.plain_text = "alpha\r\nbeta"; }],
    ["carrier NUL", validateCarrier, assertScenarioProtectedPlainTextCarrierV1, fixture.carrier, (value) => { value.plain_text = "alpha\0beta"; }],
    ["carrier HTML", validateCarrier, assertScenarioProtectedPlainTextCarrierV1, fixture.carrier, (value) => { value.plain_text = "<strong>alpha</strong>"; }],
    ["carrier attachment", validateCarrier, assertScenarioProtectedPlainTextCarrierV1, fixture.carrier, (value) => { value.attachment_refs = ["ref"]; }],
    ["binding uppercase hash", validateBinding, assertScenarioProtectedCarrierBindingV1, fixture.prepare_binding, (value) => { value.keyed_binding_hash = "A".repeat(64); }],
    ["binding third scope", validateBinding, assertScenarioProtectedCarrierBindingV1, fixture.prepare_binding, (value) => { value.carrier_scope = "commit_input"; }],
  ];
  for (const [name, validate, codec, source, mutate] of cases) {
    await context.test(name, () => {
      const value = clone(source);
      mutate(value);
      assertParityRejects(validate, codec, value);
    });
  }
});

test("E1 schemas and codecs reject missing and null required values", () => {
  for (const [validate, codec, source, field] of [
    [validateContract, assertScenarioProtectedInteractionContractV1, fixture.contract, "content_profile"],
    [validateCarrier, assertScenarioProtectedPlainTextCarrierV1, fixture.carrier, "plain_text"],
    [validateBinding, assertScenarioProtectedCarrierBindingV1, fixture.prepare_binding, "keyed_binding_hash"],
  ]) {
    for (const mode of ["missing", "null"]) {
      const value = clone(source);
      if (mode === "missing") delete value[field];
      else value[field] = null;
      assertParityRejects(validate, codec, value);
    }
  }
});

test("E1 uses independently verified binding context", () => {
  const bindingVerification = (binding, overrides = {}) => ({
    carrier_scope: binding.carrier_scope,
    protected_field_key: fixture.contract.protected_field_key,
    request_identity_hash: "e".repeat(64),
    workspace_ref: clone(domainFixture.step_assertion.workspace_ref),
    principal_binding_hash: "7".repeat(64),
    scenario_key: fixture.contract.scenario_key,
    action_key: fixture.contract.action_key,
    surface_key: "example.web",
    verified_keyed_binding_hash: binding.keyed_binding_hash,
    ...overrides,
  });
  assert.doesNotThrow(() => assertScenarioProtectedCarrierBindingVerificationV1(
    fixture.prepare_binding,
    bindingVerification(fixture.prepare_binding),
  ));
  for (const candidate of [
    bindingVerification(fixture.prepare_binding, { carrier_scope: "read_output" }),
    bindingVerification(fixture.prepare_binding, { protected_field_key: "example_other_text" }),
    bindingVerification(fixture.prepare_binding, { verified_keyed_binding_hash: "c".repeat(64) }),
  ]) {
    assert.throws(() =>
      assertScenarioProtectedCarrierBindingVerificationV1(fixture.prepare_binding, candidate));
  }
});

test("E1 keeps the carrier body out of generic control objects", () => {
  assert.doesNotThrow(() =>
    assertScenarioProtectedBodyFreeControlV1(fixture.body_free_control, fixture.carrier));
  const plainText = fixture.carrier.plain_text;
  const escaped = JSON.stringify(plainText).slice(1, -1);
  const crlf = plainText.replaceAll("\n", "\r\n");
  const escapedCrlf = JSON.stringify(crlf).slice(1, -1);
  const encoded = Buffer.from(plainText, "utf8").toString("base64");
  const fragment = Array.from(plainText).slice(9, 33).join("");
  for (const value of [
    { plain_text: plainText },
    { detail: plainText },
    { detail: escaped },
    { detail: crlf },
    { detail: escapedCrlf },
    { detail: encoded },
    { detail: fragment },
    { action_input: { carrier: "separate" } },
    { plain_text_dev: "redacted" },
  ]) {
    assert.throws(() => assertScenarioProtectedBodyFreeControlV1(value, fixture.carrier));
  }
});

test("E1 enforces code-point, UTF-8 and serialized carrier bounds", () => {
  const maximum = clone(fixture.carrier);
  maximum.plain_text = "😀".repeat(2000);
  assert.equal(validateCarrier(maximum), true, JSON.stringify(validateCarrier.errors));
  assert.doesNotThrow(() => assertScenarioProtectedPlainTextCarrierV1(maximum));

  const tooManyCharacters = clone(fixture.carrier);
  tooManyCharacters.plain_text = "a".repeat(2001);
  assertParityRejects(validateCarrier, assertScenarioProtectedPlainTextCarrierV1, tooManyCharacters);

  const tooManyBytes = clone(fixture.carrier);
  tooManyBytes.plain_text = "😀".repeat(2000) + "é".repeat(97);
  assert.equal(validateCarrier(tooManyBytes), false);
  assert.throws(() => assertScenarioProtectedPlainTextCarrierV1(tooManyBytes));
});
