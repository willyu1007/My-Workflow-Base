import {
assertReadScenarioProtectedDetailExchangeV1,
assertScenarioProtectedDisplayLeaseV1
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
const e3Fixture = JSON.parse(await readFile(
  new URL("../fixtures/scenario-protected-interaction-e3.valid.json", import.meta.url),
  "utf8",
));
const fixture = JSON.parse(await readFile(
  new URL("../fixtures/scenario-protected-interaction-e4.valid.json", import.meta.url),
  "utf8",
));
const domainFixture = JSON.parse(await readFile(
  new URL("../fixtures/scenario-domain-action-d1.valid.json", import.meta.url),
  "utf8",
));
const schemaNames = [
  "scenario-safe-text-v1.schema.json",
  "scenario-safe-reason-v1.schema.json",
  "scenario-protected-carrier-binding-v1.schema.json",
  "scenario-protected-content-read-locator-v1.schema.json",
  "read-scenario-protected-detail-input-v1.schema.json",
  "scenario-protected-display-lease-v1.schema.json",
  "read-scenario-protected-detail-result-v1.schema.json",
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
const validateLease = validator("scenario-protected-display-lease-v1");
const clone = (value) => structuredClone(value);

const readyContext = () => ({
  now: "2026-08-05T00:02:30.000Z",
  locator_verification: {
    access_mode: "foreground_current",
    request_identity_hash: "9".repeat(64),
    workspace_ref: clone(domainFixture.step_assertion.workspace_ref),
    principal_binding_hash: "7".repeat(64),
    scenario_key: e1Fixture.contract.scenario_key,
    action_key: e1Fixture.contract.action_key,
    surface_key: "example.web",
    protected_content_ref: fixture.locator.protected_content_ref,
    content_kind: fixture.locator.content_kind,
    issued_at: fixture.locator.issued_at,
    expires_at: fixture.locator.expires_at,
    verified_foreground_context_hash: "f".repeat(64),
  },
  carrier_binding_verification: {
    carrier_scope: "read_output",
    protected_field_key: e1Fixture.contract.protected_field_key,
    request_identity_hash: "9".repeat(64),
    workspace_ref: clone(domainFixture.step_assertion.workspace_ref),
    principal_binding_hash: "7".repeat(64),
    scenario_key: e1Fixture.contract.scenario_key,
    action_key: e1Fixture.contract.action_key,
    surface_key: "example.web",
    verified_keyed_binding_hash: fixture.results[0].carrier_binding.keyed_binding_hash,
  },
  decrypted_content_verification: {
    protected_content_ref: e3Fixture.committed_content.protected_content_ref,
    protected_content_version: e3Fixture.committed_content.committed_content_version,
    protected_field_key: e1Fixture.contract.protected_field_key,
    content_kind: e3Fixture.committed_content.content_kind,
    read_carrier_binding_hash: fixture.results[0].carrier_binding.keyed_binding_hash,
    request_identity_hash: "9".repeat(64),
    verified_keyed_integrity_hash: e3Fixture.committed_content.keyed_integrity_hash,
  },
});

const assertReadyExchange = (locator, input, committed, result, carrier, context) =>
  assertReadScenarioProtectedDetailExchangeV1(
    e1Fixture.contract,
    locator,
    input,
    committed,
    result,
    carrier,
    context,
  );

test("BA-26 显示lease有效窗口超过60秒时被codec拒绝（格式时限校验）", () => { const lease=clone(fixture.results[0].display_lease); lease.expires_at="2026-08-05T00:03:00.001Z"; assert.equal(validateLease(lease),true,JSON.stringify(validateLease.errors)); assert.throws(()=>assertScenarioProtectedDisplayLeaseV1(lease),{code:"invalid_lifetime"}); });

test("BA-27 只有 locator 而没有当前资格不能读取 protected body", () => { const context=readyContext(); delete context.locator_verification; assert.throws(()=>assertReadyExchange(fixture.locator,fixture.input,e3Fixture.committed_content,fixture.results[0],e1Fixture.carrier,context),{code:"invalid_object"}); });
