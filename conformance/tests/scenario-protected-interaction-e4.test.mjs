import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  assertReadScenarioProtectedDetailExchangeV1,
  assertReadScenarioProtectedDetailInputV1,
  assertReadScenarioProtectedDetailResultV1,
  assertScenarioProtectedBodyFreeControlV1,
  assertScenarioProtectedContentReadLocatorV1,
  assertScenarioProtectedDisplayLeaseV1,
} from "@host/workflow-contracts";

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
const validateLocator = validator("scenario-protected-content-read-locator-v1");
const validateInput = validator("read-scenario-protected-detail-input-v1");
const validateLease = validator("scenario-protected-display-lease-v1");
const validateResult = validator("read-scenario-protected-detail-result-v1");
const clone = (value) => structuredClone(value);

const assertParityRejects = (validate, codec, value) => {
  assert.equal(validate(value), false, "JSON Schema unexpectedly accepted mutation");
  assert.throws(() => codec(value));
};

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

test("E4 accepts the locator, body-free input, ready and all safe result branches", () => {
  assert.equal(validateLocator(fixture.locator), true, JSON.stringify(validateLocator.errors));
  assert.equal(validateInput(fixture.input), true, JSON.stringify(validateInput.errors));
  assert.doesNotThrow(() => assertScenarioProtectedContentReadLocatorV1(fixture.locator));
  assert.doesNotThrow(() => assertReadScenarioProtectedDetailInputV1(fixture.input));
  for (const result of fixture.results) {
    assert.equal(validateResult(result), true, JSON.stringify(validateResult.errors));
    assert.doesNotThrow(() => assertReadScenarioProtectedDetailResultV1(result));
  }
  assert.equal(validateLease(fixture.results[0].display_lease), true, JSON.stringify(validateLease.errors));
  assert.doesNotThrow(() => assertScenarioProtectedDisplayLeaseV1(fixture.results[0].display_lease));
});

test("E4 schemas and codecs close locator, input, lease and result unions", async (context) => {
  const cases = [
    ["locator URL", validateLocator, assertScenarioProtectedContentReadLocatorV1, fixture.locator, (value) => { value.url = "/protected/example"; }],
    ["locator canonical ref", validateLocator, assertScenarioProtectedContentReadLocatorV1, fixture.locator, (value) => { value.schema_version = 1; }],
    ["input erase", validateInput, assertReadScenarioProtectedDetailInputV1, fixture.input, (value) => { value.erase = true; }],
    ["input object ref", validateInput, assertReadScenarioProtectedDetailInputV1, fixture.input, (value) => { value.protected_content_ref = { object_id: "example" }; }],
    ["lease caching", validateLease, assertScenarioProtectedDisplayLeaseV1, fixture.results[0].display_lease, (value) => { value.cache_policy = "private"; }],
    ["ready body", validateResult, assertReadScenarioProtectedDetailResultV1, fixture.results[0], (value) => { value.plain_text = "redacted"; }],
    ["ready prepare scope", validateResult, assertReadScenarioProtectedDetailResultV1, fixture.results[0], (value) => { value.carrier_binding.carrier_scope = "prepare_input"; }],
    ["ready mixed reason", validateResult, assertReadScenarioProtectedDetailResultV1, fixture.results[0], (value) => { value.safe_reason = clone(fixture.results[1].safe_reason); }],
    ["tombstone carrier", validateResult, assertReadScenarioProtectedDetailResultV1, fixture.results[1], (value) => { value.carrier_binding = clone(fixture.results[0].carrier_binding); }],
  ];
  for (const [name, validate, codec, source, mutate] of cases) {
    await context.test(name, () => {
      const value = clone(source);
      mutate(value);
      assertParityRejects(validate, codec, value);
    });
  }
});

test("E4 schemas and codecs reject missing and null read fields", () => {
  for (const [validate, codec, source, mutate] of [
    [validateLocator, assertScenarioProtectedContentReadLocatorV1, fixture.locator, (value) => { delete value.expires_at; }],
    [validateInput, assertReadScenarioProtectedDetailInputV1, fixture.input, (value) => { value.protected_content_ref = null; }],
    [validateResult, assertReadScenarioProtectedDetailResultV1, fixture.results[0], (value) => { value.carrier_binding = null; }],
    [validateResult, assertReadScenarioProtectedDetailResultV1, fixture.results[1], (value) => { value.safe_reason = null; }],
  ]) {
    const value = clone(source);
    mutate(value);
    assertParityRejects(validate, codec, value);
  }
});

test("E4 runtime enforces five-minute locator and 60-second display bounds", () => {
  const locator = clone(fixture.locator);
  locator.expires_at = "2026-08-05T00:05:00.001Z";
  assert.equal(validateLocator(locator), true, JSON.stringify(validateLocator.errors));
  assert.throws(() => assertScenarioProtectedContentReadLocatorV1(locator), {
    code: "invalid_lifetime",
  });

  const lease = clone(fixture.results[0].display_lease);
  lease.expires_at = "2026-08-05T00:03:00.001Z";
  assert.equal(validateLease(lease), true, JSON.stringify(validateLease.errors));
  assert.throws(() => assertScenarioProtectedDisplayLeaseV1(lease), {
    code: "invalid_lifetime",
  });
});

test("E4 ready requires current foreground context and verified separate carrier", () => {
  assert.doesNotThrow(() => assertReadyExchange(
    fixture.locator,
    fixture.input,
    e3Fixture.committed_content,
    fixture.results[0],
    e1Fixture.carrier,
    readyContext(),
  ));

  const cases = [
    ["read_locator_mismatch", (locator) => { locator.protected_content_ref = "S".repeat(43); }],
    ["read_locator_not_current", (locator, result, context) => { context.now = locator.expires_at; }],
    ["invalid_read_access_mode", (locator, result, context) => { context.locator_verification.access_mode = "offline_cached"; }],
    ["read_content_context_mismatch", (locator, result) => { result.protected_content_version = "committed-version-02"; }],
    ["decrypted_integrity_mismatch", (locator, result, context) => { context.decrypted_content_verification.verified_keyed_integrity_hash = "d".repeat(64); }],
    ["display_lease_not_current", (locator, result, context) => { context.now = result.display_lease.expires_at; }],
    ["hash_domain_reuse", (locator, result, context) => {
      result.carrier_binding.keyed_binding_hash = e3Fixture.committed_content.keyed_integrity_hash;
      context.carrier_binding_verification.verified_keyed_binding_hash = result.carrier_binding.keyed_binding_hash;
      context.decrypted_content_verification.read_carrier_binding_hash =
        result.carrier_binding.keyed_binding_hash;
    }],
    ["carrier_request_context_mismatch", (locator, result, context) => {
      context.carrier_binding_verification.request_identity_hash = "8".repeat(64);
    }],
  ];
  for (const [code, mutate] of cases) {
    const locator = clone(fixture.locator);
    const result = clone(fixture.results[0]);
    const context = readyContext();
    mutate(locator, result, context);
    assert.throws(() => assertReadyExchange(
      locator,
      fixture.input,
      e3Fixture.committed_content,
      result,
      e1Fixture.carrier,
      context,
    ), { code });
  }

  assert.throws(() => assertReadyExchange(
    fixture.locator,
    fixture.input,
    e3Fixture.committed_content,
    fixture.results[0],
    undefined,
    readyContext(),
  ), { code: "missing_read_carrier" });
});

test("E4 rejects locator-as-bearer and cross-context read carrier swaps", () => {
  const mutations = [
    (context) => { context.carrier_binding_verification.request_identity_hash = "8".repeat(64); },
    (context) => { context.carrier_binding_verification.workspace_ref.object_id = "workspace_other_01"; },
    (context) => { context.carrier_binding_verification.principal_binding_hash = "8".repeat(64); },
    (context) => { context.carrier_binding_verification.scenario_key = "example-other"; },
    (context) => { context.carrier_binding_verification.action_key = "example.other"; },
    (context) => { context.carrier_binding_verification.surface_key = "example.chat"; },
  ];
  for (const mutate of mutations) {
    const context = readyContext();
    mutate(context);
    assert.throws(() => assertReadyExchange(
      fixture.locator,
      fixture.input,
      e3Fixture.committed_content,
      fixture.results[0],
      e1Fixture.carrier,
      context,
    ), { code: "carrier_request_context_mismatch" });
  }

  const missingForegroundVerification = readyContext();
  delete missingForegroundVerification.locator_verification;
  assert.throws(() => assertReadyExchange(
    fixture.locator,
    fixture.input,
    e3Fixture.committed_content,
    fixture.results[0],
    e1Fixture.carrier,
    missingForegroundVerification,
  ), { code: "invalid_object" });

  const swappedDecryptedCarrier = readyContext();
  swappedDecryptedCarrier.decrypted_content_verification.read_carrier_binding_hash =
    "8".repeat(64);
  assert.throws(() => assertReadyExchange(
    fixture.locator,
    fixture.input,
    e3Fixture.committed_content,
    fixture.results[0],
    e1Fixture.carrier,
    swappedDecryptedCarrier,
  ), { code: "read_content_context_mismatch" });

  const broadContext = readyContext();
  broadContext.metadata = { offline: true };
  assert.throws(() => assertReadyExchange(
    fixture.locator,
    fixture.input,
    e3Fixture.committed_content,
    fixture.results[0],
    e1Fixture.carrier,
    broadContext,
  ), { code: "unknown_field" });
});

test("E4 non-ready branches never emit a carrier or decrypted evidence", () => {
  for (const result of fixture.results.slice(1)) {
    const context = readyContext();
    delete context.carrier_binding_verification;
    delete context.decrypted_content_verification;
    assert.doesNotThrow(() => assertReadyExchange(
      fixture.locator,
      fixture.input,
      undefined,
      result,
      undefined,
      context,
    ));
    assert.throws(() => assertReadyExchange(
      fixture.locator,
      fixture.input,
      undefined,
      result,
      e1Fixture.carrier,
      context,
    ), { code: "carrier_on_non_ready_result" });
  }
});

test("E4 no-copy sentinels stay absent from generic Base fixtures", async () => {
  const fixtureRoot = new URL("../fixtures/", import.meta.url);
  const genericFixtureNames = (await readdir(fixtureRoot))
    .filter((name) => !name.startsWith("scenario-protected-interaction-"));
  const genericFixtures = await Promise.all(genericFixtureNames.map(async (name) => {
    const source = await readFile(new URL(name, fixtureRoot), "utf8");
    return {
      name,
      source,
      value: name.endsWith(".valid.json") ? JSON.parse(source) : undefined,
    };
  }));
  const plainText = e1Fixture.carrier.plain_text;
  const sentinels = [
    plainText,
    JSON.stringify(plainText).slice(1, -1),
    Buffer.from(plainText, "utf8").toString("base64"),
    Array.from(plainText).slice(9, 33).join(""),
    e3Fixture.committed_content.protected_content_ref,
    e3Fixture.committed_content.prepared_content_version,
    e3Fixture.committed_content.committed_content_version,
    e3Fixture.committed_content.keyed_integrity_hash,
    fixture.results[0].carrier_binding.keyed_binding_hash,
  ];
  for (const generic of genericFixtures) {
    if (generic.value !== undefined) {
      assert.doesNotThrow(() =>
        assertScenarioProtectedBodyFreeControlV1(generic.value, e1Fixture.carrier),
      generic.name);
    }
    for (const sentinel of sentinels) assert.equal(generic.source.includes(sentinel), false);
  }
});

test("E4 publishes no generic commit, erase or tombstone write input", async () => {
  const publishedSchemas = await readdir(schemaRoot);
  assert.equal(
    publishedSchemas.some((name) => /(?:commit|erase|tombstone).*(?:input|request)/u.test(name)),
    false,
  );
});
