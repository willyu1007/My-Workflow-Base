import {
assertLookupScenarioDomainActionStepBindingExchangeV1,
assertScenarioDomainActionClaimedStepDriverContextV1
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
  "scenario-domain-action-submit-echo-v1.schema.json",
  "scenario-authentication-assurance-evidence-v1.schema.json",
  "submit-scenario-domain-action-input-v1.schema.json",
  "scenario-domain-action-claimed-step-assertion-v1.schema.json",
  "bind-scenario-domain-action-step-input-v1.schema.json",
  "bind-scenario-domain-action-step-result-v1.schema.json",
  "lookup-scenario-domain-action-step-binding-input-v1.schema.json",
  "lookup-scenario-domain-action-step-binding-result-v1.schema.json",
  "scenario-domain-action-claimed-step-driver-v1.schema.json",
];
const schemas = await Promise.all(
  schemaNames.map(async (name) => JSON.parse(await readFile(new URL(name, schemaRoot), "utf8"))),
);
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
for (const schema of schemas) ajv.addSchema(schema);
const clone = (value) => structuredClone(value);

test("BA-19 bind 响应丢失后通过 body-free lookup 恢复原 Step", () => { const storedBinding={workflow_step_ref:clone(fixture.step_assertion.workflow_step_ref),binding_evidence_hash:fixture.step_binding_results[0].binding_evidence_hash,context_expires_at:fixture.step_binding_results[0].context_expires_at}; assert.doesNotThrow(()=>assertLookupScenarioDomainActionStepBindingExchangeV1(fixture.binding_lookup_input,fixture.binding_lookup_results[0],storedBinding)); });

test("BA-20 尚未绑定的 Step 不能被 claim", () => { assert.throws(()=>assertScenarioDomainActionClaimedStepDriverContextV1(fixture.claimed_step_driver,{binding_published:false,workflow_step_ref:clone(fixture.step_assertion.workflow_step_ref),action_contract_hash:fixture.step_assertion.action_contract_hash}),{code:"claim_before_bind"}); });
