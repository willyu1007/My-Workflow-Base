import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import {
  assertScenarioOwnerBindingReservationExchangeV1,
  assertScenarioOwnerBindingReservationRequestV1,
  assertScenarioOwnerBindingReservationResultV1,
} from "@host/workflow-contracts";

const schemaRoot = new URL(
  "../../templates/host-runtime/packages/workflow-contracts/schemas/",
  import.meta.url,
);
const fixtureRoot = new URL("../fixtures/", import.meta.url);
const [requestFixture, resultFixture] = await Promise.all([
  "scenario-owner-binding-reservation-request.valid.json",
  "scenario-owner-binding-reservation-result.valid.json",
].map(async (name) => JSON.parse(await readFile(new URL(name, fixtureRoot), "utf8"))));
const schemaNames = [
  "canonical-ref-v1.schema.json",
  "scenario-owner-binding-ref-v1.schema.json",
  "scenario-owner-binding-reservation-request-v1.schema.json",
  "scenario-owner-binding-reservation-result-v1.schema.json",
];
const schemas = await Promise.all(
  schemaNames.map(async (name) => JSON.parse(await readFile(new URL(name, schemaRoot), "utf8"))),
);
const ajv = new Ajv2020({ allErrors: true, strict: true });
for (const schema of schemas) ajv.addSchema(schema);
const validateRequest = ajv.getSchema(
  "https://morethan.local/contracts/scenario-owner-binding-reservation-request-v1.schema.json",
);
const validateResult = ajv.getSchema(
  "https://morethan.local/contracts/scenario-owner-binding-reservation-result-v1.schema.json",
);
if (!validateRequest || !validateResult) {
  throw new Error("scenario owner-binding reservation schemas were not registered");
}

const cloneRequest = () => structuredClone(requestFixture);
const cloneResult = () => structuredClone(resultFixture);

const assertSchemaAccepts = (validate, value) => {
  assert.equal(validate(value), true, JSON.stringify(validate.errors));
};

const assertSchemaRejects = (validate, value) => {
  assert.equal(validate(value), false, "JSON Schema unexpectedly accepted mutation");
};

test("accepts the neutral reservation request/result exchange", () => {
  assertSchemaAccepts(validateRequest, requestFixture);
  assertSchemaAccepts(validateResult, resultFixture);
  assert.doesNotThrow(() => assertScenarioOwnerBindingReservationExchangeV1(
    requestFixture,
    resultFixture,
  ));
});

test("accepts exact replay and neutral Scenario owner namespaces", () => {
  const result = cloneResult();
  result.disposition = "exact_replay";
  result.owner_binding.owner_ref.namespace = "another_scenario";
  result.owner_binding.owner_ref.object_type = "owner_endpoint";
  assertSchemaAccepts(validateResult, result);
  assert.doesNotThrow(() => assertScenarioOwnerBindingReservationResultV1(result));
});

test("request Schema and runtime codec reject the same closed-body mutations", async (context) => {
  const cases = [
    ["raw canonical object ref", (value) => { value.canonical_object_ref = {}; }],
    ["embedded signature", (value) => { value.signature = "detached-only"; }],
    ["invalid operation id", (value) => { value.identity_operation_id = "not an id"; }],
    ["invalid binding slot", (value) => { value.binding_slot = "Canonical Subject"; }],
    ["uppercase object evidence", (value) => {
      value.canonical_object_evidence_hash = value.canonical_object_evidence_hash.toUpperCase();
    }],
    ["missing request hash", (value) => { delete value.canonical_request_hash; }],
    ["null evidence", (value) => { value.canonical_object_evidence_hash = null; }],
  ];

  for (const [name, mutate] of cases) {
    await context.test(name, () => {
      const value = cloneRequest();
      mutate(value);
      assertSchemaRejects(validateRequest, value);
      assert.throws(() => assertScenarioOwnerBindingReservationRequestV1(value));
    });
  }
});

test("result Schema and runtime codec reject the same closed-body mutations", async (context) => {
  const cases = [
    ["raw binding ref", (value) => { value.platform_binding_ref = {}; }],
    ["embedded key id", (value) => { value.key_id = "embedded-key"; }],
    ["unsupported disposition", (value) => { value.disposition = "created"; }],
    ["negative reservation version", (value) => { value.reservation_version = -1; }],
    ["owner authority field", (value) => { value.owner_binding.role = "owner"; }],
    ["invalid owner namespace", (value) => {
      value.owner_binding.owner_ref.namespace = "Example Scenario";
    }],
    ["uppercase reservation evidence", (value) => {
      value.reservation_evidence_hash = value.reservation_evidence_hash.toUpperCase();
    }],
    ["missing owner ref", (value) => { delete value.owner_binding.owner_ref; }],
  ];

  for (const [name, mutate] of cases) {
    await context.test(name, () => {
      const value = cloneResult();
      mutate(value);
      assertSchemaRejects(validateResult, value);
      assert.throws(() => assertScenarioOwnerBindingReservationResultV1(value));
    });
  }
});

test("exchange codec rejects request/result identity and slot drift", () => {
  const wrongIdentity = cloneResult();
  wrongIdentity.identity_operation_id = "identity-operation-02";
  assertSchemaAccepts(validateResult, wrongIdentity);
  assert.throws(
    () => assertScenarioOwnerBindingReservationExchangeV1(requestFixture, wrongIdentity),
    { code: "identity_operation_mismatch" },
  );

  const wrongSlot = cloneResult();
  wrongSlot.owner_binding.binding_slot = "canonical.subject.secondary";
  assertSchemaAccepts(validateResult, wrongSlot);
  assert.throws(
    () => assertScenarioOwnerBindingReservationExchangeV1(requestFixture, wrongSlot),
    { code: "binding_slot_mismatch" },
  );
});
