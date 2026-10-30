import {
assertScenarioCanonicalBindingPairExchangeV1
} from "@host/workflow-contracts";
import Ajv2020 from "ajv/dist/2020.js";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const schemaRoot = new URL(
  "../../templates/host-runtime/packages/workflow-contracts/schemas/",
  import.meta.url,
);
const fixtureUrl = new URL("../fixtures/scenario-canonical-binding-pair.valid.json", import.meta.url);
const fixture = JSON.parse(await readFile(fixtureUrl, "utf8"));
const schemaNames = [
  "canonical-ref-v1.schema.json",
  "scenario-canonical-binding-expected-head-v1.schema.json",
  "scenario-canonical-binding-intent-v1.schema.json",
  "scenario-canonical-binding-pair-request-v1.schema.json",
  "scenario-canonical-binding-result-item-v1.schema.json",
  "scenario-canonical-binding-pair-result-v1.schema.json",
];
const schemas = await Promise.all(
  schemaNames.map(async (name) => JSON.parse(await readFile(new URL(name, schemaRoot), "utf8"))),
);
const ajv = new Ajv2020({ allErrors: true, strict: true });
for (const schema of schemas) ajv.addSchema(schema);
const validateRequest = ajv.getSchema(
  "https://morethan.local/contracts/scenario-canonical-binding-pair-request-v1.schema.json",
);
const validateResult = ajv.getSchema(
  "https://morethan.local/contracts/scenario-canonical-binding-pair-result-v1.schema.json",
);
if (!validateRequest || !validateResult) {
  throw new Error("scenario canonical binding pair schemas were not registered");
}

const cloneRequest = () => structuredClone(fixture.request);
const cloneResult = () => structuredClone(fixture.result);

const assertSchemaAccepts = (validate, value) => {
  assert.equal(validate(value), true, JSON.stringify(validate.errors));
};

test("BA-11 一份 canonical binding pair 的 request/result 正确绑定", () => { const request=cloneRequest(),result=cloneResult(); assertSchemaAccepts(validateRequest,request); assertSchemaAccepts(validateResult,result); assert.doesNotThrow(()=>assertScenarioCanonicalBindingPairExchangeV1(request,result)); });

test("BA-12 替换 scenario owner ref 的 binding pair 被拒绝", () => { const request=cloneRequest(),result=cloneResult(); result.bindings[1].scenario_owner_ref.object_id="subject_anchor_02"; assertSchemaAccepts(validateResult,result); assert.throws(()=>assertScenarioCanonicalBindingPairExchangeV1(request,result),{code:"scenario_owner_mismatch"}); });
