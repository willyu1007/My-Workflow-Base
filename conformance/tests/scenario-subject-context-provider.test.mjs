import {
assertResolveScenarioSubjectContextInputV1,
assertResolveScenarioSubjectContextResultActiveV1,
assertResolveScenarioSubjectContextResultV1
} from "@host/workflow-contracts";
import addFormats from "ajv-formats";
import Ajv2020 from "ajv/dist/2020.js";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const fixture = JSON.parse(await readFile(new URL("../fixtures/scenario-subject-context-provider.valid.json", import.meta.url), "utf8"));

const schemaRoot = new URL(
  "../../templates/host-runtime/packages/workflow-contracts/schemas/",
  import.meta.url,
);
const schemaNames = [
  "scenario-safe-text-v1.schema.json",
  "scenario-safe-reason-v1.schema.json",
  "scenario-list-subject-contexts-input-v1.schema.json",
  "scenario-resolve-subject-context-input-v1.schema.json",
  "scenario-subject-context-option-v1.schema.json",
  "scenario-list-subject-contexts-result-v1.schema.json",
  "scenario-resolve-subject-context-result-v1.schema.json",
];
const schemas = await Promise.all(
  schemaNames.map(async (name) => JSON.parse(await readFile(new URL(name, schemaRoot), "utf8"))),
);
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
for (const schema of schemas) ajv.addSchema(schema);
const validator = (name) => {
  const value = ajv.getSchema(`https://morethan.local/contracts/${name}.schema.json`);
  if (!value) throw new Error(`${name} schema missing`);
  return value;
};
const validateResolveInput = validator("scenario-resolve-subject-context-input-v1");
const validateResolveResult = validator("scenario-resolve-subject-context-result-v1");

const clone = (value) => structuredClone(value);
const assertSchemaAccepts = (validate, value) => {
  assert.equal(validate(value), true, JSON.stringify(validate.errors));
};
const assertSchemaRejects = (validate, value) => {
  assert.equal(validate(value), false, "JSON Schema unexpectedly accepted mutation");
};
const activeCurrentTime = "2026-08-05T10:10:00.000Z";

test("BA-13 一份合法 opaque ready subject context 可被消费", () => { const result=fixture.resolve_results[0]; assertSchemaAccepts(validateResolveResult,result); assert.doesNotThrow(()=>assertResolveScenarioSubjectContextResultV1(result)); assert.doesNotThrow(()=>assertResolveScenarioSubjectContextResultActiveV1(result,activeCurrentTime)); });

test("BA-14 用 identity 字段伪造 subject target 被拒绝", () => { const value=clone(fixture.resolve_input); value.subject_context_ref={namespace:"example",object_type:"item",object_id:"1"}; assertSchemaRejects(validateResolveInput,value); assert.throws(()=>assertResolveScenarioSubjectContextInputV1(value)); });
