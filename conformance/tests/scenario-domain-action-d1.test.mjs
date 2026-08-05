import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import {
  assertScenarioDomainActionClaimedStepAssertionV1,
  assertScenarioDomainActionContractV1,
  assertScenarioDomainActionStaticDriverV1,
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
  "scenario-domain-action-contract-v1.schema.json",
  "scenario-domain-action-workflow-step-ref-v1.schema.json",
  "scenario-domain-action-claimed-step-assertion-v1.schema.json",
];
const schemas = await Promise.all(
  schemaNames.map(async (name) => JSON.parse(await readFile(new URL(name, schemaRoot), "utf8"))),
);
const ajv = new Ajv2020({ allErrors: true, strict: true });
for (const schema of schemas) ajv.addSchema(schema);
const validateContract = ajv.getSchema(
  "https://morethan.local/contracts/scenario-domain-action-contract-v1.schema.json",
);
const validateAssertion = ajv.getSchema(
  "https://morethan.local/contracts/scenario-domain-action-claimed-step-assertion-v1.schema.json",
);
if (!validateContract || !validateAssertion) throw new Error("D1 schemas were not registered");

const clone = (value) => structuredClone(value);

const assertParityRejects = (validate, codec, value) => {
  assert.equal(validate(value), false, "JSON Schema unexpectedly accepted mutation");
  assert.throws(() => codec(value));
};

test("D1 accepts neutral static contract and content-free Step assertion", () => {
  assert.equal(validateContract(fixture.contract), true, JSON.stringify(validateContract.errors));
  assert.equal(validateAssertion(fixture.step_assertion), true, JSON.stringify(validateAssertion.errors));
  assert.doesNotThrow(() => assertScenarioDomainActionContractV1(fixture.contract));
  assert.doesNotThrow(() => assertScenarioDomainActionClaimedStepAssertionV1(fixture.step_assertion));
  assert.doesNotMatch(
    JSON.stringify(fixture),
    /nurture|child|family|institution|guardian|caregiver|grant|enrollment/iu,
  );
});

test("D1 schema and codec close authority and payload fields", async (context) => {
  const cases = [
    ["contract capability", "contract", (value) => { value.capability_key = "example.capability"; }],
    ["contract role", "contract", (value) => { value.role = "operator"; }],
    ["command metadata", "contract", (value) => { value.command_contract.metadata = {}; }],
    ["assertion submit token", "assertion", (value) => { value.submit_token = "A".repeat(32); }],
    ["assertion action input", "assertion", (value) => { value.action_input = {}; }],
    ["assertion claim token", "assertion", (value) => { value.claim_token = "B".repeat(32); }],
    ["Step version", "assertion", (value) => { value.workflow_step_ref.version = 1; }],
    ["workspace mismatch", "assertion", (value) => { value.workspace_ref.object_type = "actor"; }],
  ];
  for (const [name, target, mutate] of cases) {
    await context.test(name, () => {
      const value = clone(target === "contract" ? fixture.contract : fixture.step_assertion);
      mutate(value);
      assertParityRejects(
        target === "contract" ? validateContract : validateAssertion,
        target === "contract"
          ? assertScenarioDomainActionContractV1
          : assertScenarioDomainActionClaimedStepAssertionV1,
        value,
      );
    });
  }
});

test("D1 accepts only the two Base-neutral static drivers", () => {
  for (const driver of ["scenario_direct_empty_v1", "workflow_claimed_step_v1"]) {
    const contract = clone(fixture.contract);
    contract.driver = driver;
    assert.equal(validateContract(contract), true, JSON.stringify(validateContract.errors));
    assert.doesNotThrow(() => assertScenarioDomainActionContractV1(contract));
    assert.doesNotThrow(() => assertScenarioDomainActionStaticDriverV1(contract, driver));
  }

  for (const driver of ["nurture_direct_empty_v1", "workflow_step_v1", "third_driver_v1"]) {
    const contract = clone(fixture.contract);
    contract.driver = driver;
    assertParityRejects(validateContract, assertScenarioDomainActionContractV1, contract);
  }

  assert.throws(
    () => assertScenarioDomainActionStaticDriverV1(fixture.contract, "scenario_direct_empty_v1"),
    { code: "driver_mismatch" },
  );
});

test("D1 runtime enforces ordered unique ingress keys", () => {
  for (const keys of [
    ["example.web", "example.chat"],
    ["example.chat", "example.chat"],
  ]) {
    const contract = clone(fixture.contract);
    contract.entitled_ingress_keys = keys;
    assert.throws(() => assertScenarioDomainActionContractV1(contract), {
      code: "unordered_ingress_keys",
    });
  }
});
