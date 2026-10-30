import {
assertScenarioProtectedContentCommitCompositionV1
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
const e1Fixture = JSON.parse(await readFile(
  new URL("../fixtures/scenario-protected-interaction-e1.valid.json", import.meta.url),
  "utf8",
));
const e2Fixture = JSON.parse(await readFile(
  new URL("../fixtures/scenario-protected-interaction-e2.valid.json", import.meta.url),
  "utf8",
));
const fixture = JSON.parse(await readFile(
  new URL("../fixtures/scenario-protected-interaction-e3.valid.json", import.meta.url),
  "utf8",
));
const domainFixture = JSON.parse(await readFile(
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
  "scenario-committed-protected-content-control-v1.schema.json",
];
const schemas = await Promise.all(
  schemaNames.map(async (name) => JSON.parse(await readFile(new URL(name, schemaRoot), "utf8"))),
);
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
for (const schema of schemas) ajv.addSchema(schema);
const clone = (value) => structuredClone(value);

const contractForDriver = (driver) => ({ ...clone(domainFixture.contract), driver });
const submitContext = () => ({
  submit_token: domainFixture.submit_inputs[0].client_echo.submit_token,
  scenario_key: domainFixture.contract.scenario_key,
  action_key: domainFixture.contract.action_key,
  principal_binding_hash: "7".repeat(64),
  submit_context_expires_at: e2Fixture.results[0].prepared_content.expires_at,
  now: "2026-08-05T00:03:00.000Z",
});
const contextForBinding = (binding) => ({
  submit_context: submitContext(),
  resolved_prepared_content: {
    protected_content_ref: e2Fixture.results[0].prepared_content.protected_content_ref,
    protected_content_version: e2Fixture.results[0].prepared_content.protected_content_version,
    protected_field_key: e1Fixture.contract.protected_field_key,
    content_kind: e2Fixture.results[0].prepared_content.content_kind,
    accepted_carrier_binding_hash: e2Fixture.input.carrier_binding.keyed_binding_hash,
    request_identity_hash: "e".repeat(64),
    verified_keyed_integrity_hash: e2Fixture.results[0].prepared_content.keyed_integrity_hash,
    issued_at: e2Fixture.results[0].prepared_content.issued_at,
    expires_at: e2Fixture.results[0].prepared_content.expires_at,
  },
  execution_path_verification: binding.effect_identity.driver === "scenario_direct_empty_v1"
    ? {
        driver: "scenario_direct_empty_v1",
        submit_context_ref: clone(binding.effect_identity.submit_context_ref),
      }
    : {
        driver: "workflow_claimed_step_v1",
        original_workflow_step_ref: clone(binding.effect_identity.original_workflow_step_ref),
      },
  commit_verification: {
    scenario_key: binding.effect_identity.scenario_key,
    action_key: binding.effect_identity.action_key,
    request_identity_hash: "e".repeat(64),
    accepted_carrier_binding_hash: e2Fixture.input.carrier_binding.keyed_binding_hash,
    canonical_payload_hash: binding.canonical_payload_hash,
    protected_content_ref: fixture.committed_content.protected_content_ref,
    prepared_content_version: fixture.committed_content.prepared_content_version,
    committed_content_version: fixture.committed_content.committed_content_version,
    content_kind: fixture.committed_content.content_kind,
    verified_keyed_integrity_hash: fixture.committed_content.keyed_integrity_hash,
    committed_at: fixture.committed_content.committed_at,
  },
});

const assertComposition = (driverIndex, executionResult, committedContent, context) =>
  assertScenarioProtectedContentCommitCompositionV1(
    e1Fixture.contract,
    contractForDriver(domainFixture.execution_bindings[driverIndex].effect_identity.driver),
    domainFixture.submit_inputs[0],
    e2Fixture.results[0].prepared_content,
    domainFixture.execution_bindings[driverIndex],
    executionResult,
    committedContent,
    context,
  );

test("BA-24 一次合法 prepared → committed 返回正确控制状态", () => { const binding=domainFixture.execution_bindings[0]; assert.doesNotThrow(()=>assertComposition(0,domainFixture.execution_results[0],fixture.committed_content,contextForBinding(binding))); });

test("BA-25 unknown execution 不能被解释为 committed 内容", () => { const context=contextForBinding(domainFixture.execution_bindings[0]); delete context.commit_verification; assert.throws(()=>assertComposition(0,domainFixture.execution_results[3],fixture.committed_content,context),{code:"commit_without_committed_effect"}); });
