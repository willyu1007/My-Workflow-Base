import {
assertScenarioSafeTextV1
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
const fixture = JSON.parse(await readFile(
  new URL("../fixtures/scenario-presentation-primitives.valid.json", import.meta.url),
  "utf8",
));
const schemaNames = ["scenario-safe-text-v1.schema.json", "scenario-safe-reason-v1.schema.json"];
const schemas = await Promise.all(
  schemaNames.map(async (name) => JSON.parse(await readFile(new URL(name, schemaRoot), "utf8"))),
);
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
for (const schema of schemas) ajv.addSchema(schema);
const validateText = ajv.getSchema(
  "https://morethan.local/contracts/scenario-safe-text-v1.schema.json",
);
const validateReason = ajv.getSchema(
  "https://morethan.local/contracts/scenario-safe-reason-v1.schema.json",
);
if (!validateText || !validateReason) throw new Error("presentation primitive schemas missing");

const cloneText = () => structuredClone(fixture.safe_text);
const assertSchemaRejects = (validate, value) => {
  assert.equal(validate(value), false, "JSON Schema unexpectedly accepted mutation");
};

test("BA-16 safe-copy 中夹带 HTML 被拒绝", () => { const value=cloneText(); value.value="<strong>unsafe</strong>"; assertSchemaRejects(validateText,value); assert.throws(()=>assertScenarioSafeTextV1(value)); });
