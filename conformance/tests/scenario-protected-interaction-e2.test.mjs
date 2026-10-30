import {
assertPrepareScenarioProtectedInteractionExchangeV1,
assertPrepareScenarioProtectedInteractionInputV1
} from "@host/workflow-contracts";
import addFormats from "ajv-formats";
import Ajv2020 from "ajv/dist/2020.js";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

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
  request_identity_hash: "e".repeat(64),
  carrier_binding_verification: {
    carrier_scope: "prepare_input",
    protected_field_key: e1Fixture.contract.protected_field_key,
    request_identity_hash: "e".repeat(64),
    workspace_ref: clone(domainFixture.step_assertion.workspace_ref),
    principal_binding_hash: "7".repeat(64),
    scenario_key: e1Fixture.contract.scenario_key,
    action_key: e1Fixture.contract.action_key,
    surface_key: "example.web",
    verified_keyed_binding_hash: fixture.input.carrier_binding.keyed_binding_hash,
  },
  action_prepare_context: actionPrepareContext(),
  prepared_content_verification: {
    protected_content_ref: fixture.results[0].prepared_content.protected_content_ref,
    protected_content_version: fixture.results[0].prepared_content.protected_content_version,
    protected_field_key: e1Fixture.contract.protected_field_key,
    content_kind: e1Fixture.contract.content_kind,
    accepted_carrier_binding_hash: fixture.input.carrier_binding.keyed_binding_hash,
    request_identity_hash: "e".repeat(64),
    verified_keyed_integrity_hash: fixture.results[0].prepared_content.keyed_integrity_hash,
    issued_at: fixture.results[0].prepared_content.issued_at,
    expires_at: fixture.results[0].prepared_content.expires_at,
  },
});

test("BA-22 控制 envelope 内直接夹带 protected body 被拒绝", () => { const value=clone(fixture.input); value.action_prepare.action_input.body="redacted"; assertParityRejects(validateInput,assertPrepareScenarioProtectedInteractionInputV1,value); });

test("BA-23 替换 principal 的 protected carrier 被拒绝", () => { const context=exchangeContext(); context.carrier_binding_verification.principal_binding_hash="8".repeat(64); assert.throws(()=>assertPrepareScenarioProtectedInteractionExchangeV1(e1Fixture.contract,domainFixture.contract,fixture.input,fixture.results[0],e1Fixture.carrier,context),{code:"carrier_request_context_mismatch"}); });


test("BA-21 accepts a carrier bound to the original protected prepare request", () => {
  assert.doesNotThrow(() => assertPrepareScenarioProtectedInteractionExchangeV1(
    e1Fixture.contract,
    domainFixture.contract,
    fixture.input,
    fixture.results[0],
    e1Fixture.carrier,
    exchangeContext(),
  ));
});
