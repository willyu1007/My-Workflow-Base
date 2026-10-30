import {
assertScenarioDomainActionExactReplayV1
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
  "canonical-ref-v1.schema.json",
  "scenario-safe-text-v1.schema.json",
  "scenario-safe-reason-v1.schema.json",
  "scenario-domain-action-workflow-step-ref-v1.schema.json",
  "scenario-domain-action-effect-identity-input-v1.schema.json",
  "scenario-domain-action-execution-binding-v1.schema.json",
  "scenario-domain-action-execution-result-v1.schema.json",
  "scenario-domain-action-current-result-v1.schema.json",
  "submit-scenario-domain-action-result-v1.schema.json",
];
const schemas = await Promise.all(
  schemaNames.map(async (name) => JSON.parse(await readFile(new URL(name, schemaRoot), "utf8"))),
);
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
for (const schema of schemas) ajv.addSchema(schema);
const clone = (value) => structuredClone(value);

test("BA-18 绑定到错误 Step 的 execute 被拒绝", () => { const previous=fixture.execution_bindings[1],wrongStep=clone(previous),replay=clone(fixture.execution_results[1]); wrongStep.effect_identity.original_workflow_step_ref.object_id="step_example_02"; replay.disposition="replayed"; assert.throws(()=>assertScenarioDomainActionExactReplayV1(previous,wrongStep,fixture.execution_results[1],replay),{code:"request_conflict"}); });
