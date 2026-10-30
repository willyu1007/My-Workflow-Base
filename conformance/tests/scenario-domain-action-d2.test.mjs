import {
assertPrepareScenarioDomainActionResultV1
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
  new URL("../fixtures/scenario-domain-action-d1.valid.json", import.meta.url),
  "utf8",
));
const schemaNames = [
  "scenario-safe-text-v1.schema.json",
  "scenario-safe-reason-v1.schema.json",
  "scenario-domain-action-confirmation-prompt-v1.schema.json",
  "prepare-scenario-domain-action-input-v1.schema.json",
  "prepare-scenario-domain-action-result-v1.schema.json",
  "scenario-domain-action-submit-echo-v1.schema.json",
  "scenario-authentication-assurance-evidence-v1.schema.json",
  "submit-scenario-domain-action-input-v1.schema.json",
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
const validatePrepareResult = validator("prepare-scenario-domain-action-result-v1");

test("BA-17 一份声明零业务效果的合法prepare结果通过schema与runtime codec", () => { const result=fixture.prepare_results[0]; assert.equal(validatePrepareResult(result),true,JSON.stringify(validatePrepareResult.errors)); assert.doesNotThrow(()=>assertPrepareScenarioDomainActionResultV1(result)); });
