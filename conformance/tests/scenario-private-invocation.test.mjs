import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { assertScenarioPrivateInvocationV1 } from "@host/workflow-contracts";

const schemaRoot = new URL(
  "../../templates/host-runtime/packages/workflow-contracts/schemas/",
  import.meta.url,
);
const fixtureUrl = new URL("../fixtures/scenario-private-invocation.valid.json", import.meta.url);
const fixture = JSON.parse(await readFile(fixtureUrl, "utf8"));
const schemaNames = [
  "canonical-ref-v1.schema.json",
  "scenario-human-principal-v1.schema.json",
  "scenario-ingress-surface-v1.schema.json",
  "scenario-private-invocation-v1.schema.json",
];
const schemas = await Promise.all(
  schemaNames.map(async (name) => JSON.parse(await readFile(new URL(name, schemaRoot), "utf8"))),
);
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
for (const schema of schemas) ajv.addSchema(schema);
const validateInvocation = ajv.getSchema(
  "https://morethan.local/contracts/scenario-private-invocation-v1.schema.json",
);
if (!validateInvocation) throw new Error("scenario private invocation schema was not registered");

const cloneFixture = () => structuredClone(fixture);

const assertSchemaAccepts = (value) => {
  assert.equal(validateInvocation(value), true, JSON.stringify(validateInvocation.errors));
};

const assertSchemaRejects = (value) => {
  assert.equal(validateInvocation(value), false, "JSON Schema unexpectedly accepted mutation");
};

const assertCodecRejects = (value) => {
  assert.throws(() => assertScenarioPrivateInvocationV1(value));
};

test("accepts the versioned trusted invocation fixture", () => {
  assertSchemaAccepts(fixture);
  assert.doesNotThrow(() => assertScenarioPrivateInvocationV1(fixture));
});

test("schema and runtime codec reject the same closed-envelope mutations", async (context) => {
  const cases = [
    ["embedded signature", (value) => { value.signature = "detached-only"; }],
    ["principal authority", (value) => { value.principal.role = "administrator"; }],
    ["wrong account ref", (value) => { value.principal.account_ref.object_type = "actor"; }],
    ["invalid principal origin", (value) => { value.principal.principal_origin = "background_job"; }],
    ["invalid ingress category", (value) => { value.route.ingress.ingress_category = "scenario_direct"; }],
    ["non-POST method", (value) => { value.route.method = "GET"; }],
    ["uppercase contract hash", (value) => { value.contract_hash = value.contract_hash.toUpperCase(); }],
    ["unsafe issuer", (value) => { value.issuer = "My Chat Host"; }],
    ["non-canonical instant", (value) => { value.request.issued_at = "2026-08-05T00:00:00Z"; }],
    ["missing operation input", (value) => { delete value.operation.input; }],
    ["embedded request body", (value) => { value.request.body = {}; }],
  ];

  for (const [name, mutate] of cases) {
    await context.test(name, () => {
      const value = cloneFixture();
      mutate(value);
      assertSchemaRejects(value);
      assertCodecRejects(value);
    });
  }
});

test("runtime codec enforces the signed lifetime window", () => {
  for (const expiresAt of [
    "2026-08-05T00:00:00.000Z",
    "2026-08-04T23:59:59.999Z",
    "2026-08-05T00:01:00.001Z",
  ]) {
    const value = cloneFixture();
    value.request.expires_at = expiresAt;
    assertSchemaAccepts(value);
    assertCodecRejects(value);
  }
});

test("operation input remains opaque to the envelope validators", () => {
  const value = cloneFixture();
  value.operation.input = {
    nested: [null, true, 42, { domain_field: "delegated-to-operation-codec" }],
  };
  assertSchemaAccepts(value);
  assert.doesNotThrow(() => assertScenarioPrivateInvocationV1(value));
});
