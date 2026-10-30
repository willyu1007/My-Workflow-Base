import {
assertScenarioPresentationResultV1
} from "@host/workflow-contracts";
import addFormats from "ajv-formats";
import Ajv2020 from "ajv/dist/2020.js";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const fixture = JSON.parse(await readFile(new URL("../fixtures/scenario-semantic-presentation.valid.json", import.meta.url), "utf8"));

const schemaRoot = new URL(
  "../../templates/host-runtime/packages/workflow-contracts/schemas/",
  import.meta.url,
);
const schemaNames = [
  "scenario-safe-text-v1.schema.json",
  "scenario-safe-reason-v1.schema.json",
  "scenario-present-subject-context-input-v1.schema.json",
  "scenario-semantic-block-v1.schema.json",
  "scenario-navigation-offer-v1.schema.json",
  "scenario-action-offer-v1.schema.json",
  "scenario-semantic-presentation-v1.schema.json",
  "scenario-presentation-result-v1.schema.json",
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
const validateResult = validator("scenario-presentation-result-v1");
const assertSchemaAccepts = (validate, value) => {
  assert.equal(validate(value), true, JSON.stringify(validate.errors));
};

test("BA-15 一份单一block kind的ready presentation通过schema与runtime codec", () => { const result={status:"ready",presentation:{...fixture.presentation,blocks:[fixture.presentation.blocks[0]],navigation:[],actions:[]}}; assertSchemaAccepts(validateResult,result); assert.doesNotThrow(()=>assertScenarioPresentationResultV1(result)); });
