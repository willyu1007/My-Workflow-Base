import { assertScenarioPrivateInvocationV1 } from "@host/workflow-contracts";
import addFormats from "ajv-formats";
import Ajv2020 from "ajv/dist/2020.js";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

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

test("BA-08 一份合法invocation envelope通过schema与runtime codec（不验detached签名）", () => {
  assertSchemaAccepts(fixture);
  assert.doesNotThrow(() => assertScenarioPrivateInvocationV1(fixture));
});

test("BA-10 invocation 注入 principal role 字段被拒绝", () => { const value=cloneFixture(); value.principal.role="administrator"; assertSchemaRejects(value); assertCodecRejects(value); });

test("BA-09 expires_at等于issued_at的invocation被拒绝（格式时限校验）", () => { const value=cloneFixture(); value.request.expires_at=value.request.issued_at; assertSchemaAccepts(value); assertCodecRejects(value); });
