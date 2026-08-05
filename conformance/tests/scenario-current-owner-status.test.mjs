import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  assertScenarioCanonicalBindingPairRequestV1,
  assertScenarioCanonicalBindingPairResultV1,
  assertScenarioCurrentOwnerBindingPairEvidenceV1,
  assertScenarioIdentityOperationStatusLookupExchangeV1,
  assertScenarioIdentityOperationStatusLookupRequestV1,
  assertScenarioIdentityOperationStatusLookupResultV1,
  assertScenarioPrivateInvocationV1,
} from "@host/workflow-contracts";

const schemaRoot = new URL(
  "../../templates/host-runtime/packages/workflow-contracts/schemas/",
  import.meta.url,
);
const fixtureRoot = new URL("../fixtures/", import.meta.url);
const [fixture, invocationFixture, hostPairFixture] = await Promise.all([
  "scenario-current-owner-status.valid.json",
  "scenario-private-invocation.valid.json",
  "scenario-canonical-binding-pair.valid.json",
].map(async (name) => JSON.parse(await readFile(new URL(name, fixtureRoot), "utf8"))));
const schemaNames = [
  "canonical-ref-v1.schema.json",
  "scenario-owner-binding-ref-v1.schema.json",
  "scenario-current-owner-binding-pair-evidence-v1.schema.json",
  "scenario-identity-operation-status-lookup-request-v1.schema.json",
  "scenario-identity-operation-status-lookup-result-v1.schema.json",
];
const schemas = await Promise.all(
  schemaNames.map(async (name) => JSON.parse(await readFile(new URL(name, schemaRoot), "utf8"))),
);
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
for (const schema of schemas) ajv.addSchema(schema);
const validateEvidence = ajv.getSchema(
  "https://morethan.local/contracts/scenario-current-owner-binding-pair-evidence-v1.schema.json",
);
const validateRequest = ajv.getSchema(
  "https://morethan.local/contracts/scenario-identity-operation-status-lookup-request-v1.schema.json",
);
const validateResult = ajv.getSchema(
  "https://morethan.local/contracts/scenario-identity-operation-status-lookup-result-v1.schema.json",
);
if (!validateEvidence || !validateRequest || !validateResult) {
  throw new Error("current-owner/status schemas were not registered");
}

const cloneEvidence = () => structuredClone(fixture.current_evidence);
const cloneRequest = () => structuredClone(fixture.status_request);
const cloneResult = (status) => structuredClone(
  fixture.status_results.find((result) => result.status === status),
);

const assertSchemaAccepts = (validate, value) => {
  assert.equal(validate(value), true, JSON.stringify(validate.errors));
};

const assertSchemaRejects = (validate, value) => {
  assert.equal(validate(value), false, "JSON Schema unexpectedly accepted mutation");
};

test("accepts current owner evidence and all three closed status results", () => {
  assertSchemaAccepts(validateEvidence, fixture.current_evidence);
  assert.doesNotThrow(() => assertScenarioCurrentOwnerBindingPairEvidenceV1(fixture.current_evidence));
  assertSchemaAccepts(validateRequest, fixture.status_request);
  assert.doesNotThrow(() => assertScenarioIdentityOperationStatusLookupRequestV1(fixture.status_request));
  for (const result of fixture.status_results) {
    assertSchemaAccepts(validateResult, result);
    assert.doesNotThrow(() => assertScenarioIdentityOperationStatusLookupExchangeV1(
      fixture.status_request,
      result,
    ));
  }
});

test("accepts every allowlisted unknown quarantine reason", () => {
  for (const reason of [
    "lock_timeout",
    "possible_inflight",
    "owner_unavailable",
    "compatible_evidence_ambiguous",
  ]) {
    const result = cloneResult("unknown");
    result.reason_code = reason;
    assertSchemaAccepts(validateResult, result);
    assert.doesNotThrow(() => assertScenarioIdentityOperationStatusLookupResultV1(result));
  }
});

test("evidence Schema and codec reject closed-body exposure mutations", async (context) => {
  const cases = [
    ["raw canonical object", (value) => { value.canonical_object_ref = {}; }],
    ["nested workspace", (value) => { value.workspace_ref = {}; }],
    ["embedded expiry", (value) => { value.expires_at = "2026-08-05T09:31:00.000Z"; }],
    ["embedded signature", (value) => { value.signature = "detached-only"; }],
    ["one owner binding", (value) => { value.owner_bindings.pop(); }],
    ["invalid purpose", (value) => { value.purpose_key = "Current Owner"; }],
    ["uppercase evidence", (value) => {
      value.current_owner_evidence_hash = value.current_owner_evidence_hash.toUpperCase();
    }],
  ];

  for (const [name, mutate] of cases) {
    await context.test(name, () => {
      const value = cloneEvidence();
      mutate(value);
      assertSchemaRejects(validateEvidence, value);
      assert.throws(() => assertScenarioCurrentOwnerBindingPairEvidenceV1(value));
    });
  }
});

test("private owner-binding pairs reject duplicate and unsorted slots in the codec", () => {
  for (const [code, mutate] of [
    ["duplicate_binding_slot", (value) => {
      value.owner_bindings[1].binding_slot = value.owner_bindings[0].binding_slot;
    }],
    ["unsorted_binding_slots", (value) => { value.owner_bindings.reverse(); }],
  ]) {
    const evidence = cloneEvidence();
    mutate(evidence);
    assertSchemaAccepts(validateEvidence, evidence);
    assert.throws(() => assertScenarioCurrentOwnerBindingPairEvidenceV1(evidence), { code });

    const request = cloneRequest();
    mutate(request);
    assertSchemaAccepts(validateRequest, request);
    assert.throws(() => assertScenarioIdentityOperationStatusLookupRequestV1(request), { code });
  }
});

test("status request Schema and codec reject transport and protected fields", async (context) => {
  const cases = [
    ["raw binding ref", (value) => { value.platform_binding_ref = {}; }],
    ["membership ref", (value) => { value.membership_ref = {}; }],
    ["caller", (value) => { value.caller = "host"; }],
    ["nonce", (value) => { value.nonce = "embedded"; }],
    ["key id", (value) => { value.key_id = "embedded"; }],
    ["signature", (value) => { value.signature = "embedded"; }],
    ["invalid command id", (value) => { value.scenario_command_id = "not an id"; }],
    ["null attempt hash", (value) => { value.attempt_ledger_hash = null; }],
  ];

  for (const [name, mutate] of cases) {
    await context.test(name, () => {
      const value = cloneRequest();
      mutate(value);
      assertSchemaRejects(validateRequest, value);
      assert.throws(() => assertScenarioIdentityOperationStatusLookupRequestV1(value));
    });
  }
});

test("status result Schema and codec reject mixed or malformed variants", async (context) => {
  const cases = [
    ["committed missing execution", "committed", (value) => { delete value.scenario_execution_ref; }],
    ["committed with no-effect field", "committed", (value) => {
      value.no_effect_fence_evidence_hash = value.scenario_commit_evidence_hash;
    }],
    ["no-effect with reason", "confirmed_no_effect", (value) => {
      value.reason_code = "owner_unavailable";
    }],
    ["unknown with no-effect field", "unknown", (value) => {
      value.no_effect_fence_evidence_hash = "23456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef01";
    }],
    ["unsupported unknown reason", "unknown", (value) => { value.reason_code = "retry_allowed"; }],
    ["non-canonical check time", "unknown", (value) => {
      value.checked_at = "2026-08-05T09:30:00Z";
    }],
    ["embedded signature", "unknown", (value) => { value.signature = "detached-only"; }],
    ["null nonce hash", "unknown", (value) => { value.request_nonce_hash = null; }],
  ];

  for (const [name, status, mutate] of cases) {
    await context.test(name, () => {
      const value = cloneResult(status);
      mutate(value);
      assertSchemaRejects(validateResult, value);
      assert.throws(() => assertScenarioIdentityOperationStatusLookupResultV1(value));
    });
  }
});

test("status exchange rejects operation and command identity drift", () => {
  const wrongOperation = cloneResult("unknown");
  wrongOperation.identity_operation_id = "identity-operation-pair-02";
  assertSchemaAccepts(validateResult, wrongOperation);
  assert.throws(
    () => assertScenarioIdentityOperationStatusLookupExchangeV1(fixture.status_request, wrongOperation),
    { code: "identity_operation_mismatch" },
  );

  const wrongCommand = cloneResult("unknown");
  wrongCommand.scenario_command_id = "scenario-command-02";
  assertSchemaAccepts(validateResult, wrongCommand);
  assert.throws(
    () => assertScenarioIdentityOperationStatusLookupExchangeV1(fixture.status_request, wrongCommand),
    { code: "scenario_command_mismatch" },
  );
});

test("B3 private bodies compose only as I1-A operation inputs", () => {
  const invocation = structuredClone(invocationFixture);
  invocation.operation.input = cloneRequest();
  assert.doesNotThrow(() => assertScenarioPrivateInvocationV1(invocation));
  assert.doesNotThrow(() => assertScenarioIdentityOperationStatusLookupRequestV1(
    invocation.operation.input,
  ));

  invocation.operation.input.nonce = "must-remain-in-i1-a-request";
  assert.doesNotThrow(() => assertScenarioPrivateInvocationV1(invocation));
  assert.throws(() => assertScenarioIdentityOperationStatusLookupRequestV1(
    invocation.operation.input,
  ));
});

test("Host-internal B2 pair bodies cannot pass B3 Scenario-private codecs", () => {
  assert.throws(() => assertScenarioCurrentOwnerBindingPairEvidenceV1(hostPairFixture.request));
  assert.throws(() => assertScenarioIdentityOperationStatusLookupRequestV1(hostPairFixture.request));
  assert.doesNotThrow(() => assertScenarioCanonicalBindingPairRequestV1(hostPairFixture.request));
  assert.doesNotThrow(() => assertScenarioCanonicalBindingPairResultV1(hostPairFixture.result));
});
