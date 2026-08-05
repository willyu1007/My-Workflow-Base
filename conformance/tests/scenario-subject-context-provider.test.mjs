import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  assertListScenarioSubjectContextsInputV1,
  assertListScenarioSubjectContextsResultV1,
  assertResolveScenarioSubjectContextInputV1,
  assertResolveScenarioSubjectContextResultV1,
  assertScenarioPrivateInvocationV1,
  assertScenarioSubjectContextOptionV1,
} from "@host/workflow-contracts";

const schemaRoot = new URL(
  "../../templates/host-runtime/packages/workflow-contracts/schemas/",
  import.meta.url,
);
const fixtureRoot = new URL("../fixtures/", import.meta.url);
const [fixture, invocationFixture] = await Promise.all([
  "scenario-subject-context-provider.valid.json",
  "scenario-private-invocation.valid.json",
].map(async (name) => JSON.parse(await readFile(new URL(name, fixtureRoot), "utf8"))));
const schemaNames = [
  "scenario-safe-text-v1.schema.json",
  "scenario-safe-reason-v1.schema.json",
  "scenario-list-subject-contexts-input-v1.schema.json",
  "scenario-resolve-subject-context-input-v1.schema.json",
  "scenario-subject-context-option-v1.schema.json",
  "scenario-list-subject-contexts-result-v1.schema.json",
  "scenario-resolve-subject-context-result-v1.schema.json",
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
const validateListInput = validator("scenario-list-subject-contexts-input-v1");
const validateResolveInput = validator("scenario-resolve-subject-context-input-v1");
const validateOption = validator("scenario-subject-context-option-v1");
const validateListResult = validator("scenario-list-subject-contexts-result-v1");
const validateResolveResult = validator("scenario-resolve-subject-context-result-v1");

const clone = (value) => structuredClone(value);
const assertSchemaAccepts = (validate, value) => {
  assert.equal(validate(value), true, JSON.stringify(validate.errors));
};
const assertSchemaRejects = (validate, value) => {
  assert.equal(validate(value), false, "JSON Schema unexpectedly accepted mutation");
};

test("accepts exact list/resolve inputs and every closed result branch", () => {
  assertSchemaAccepts(validateListInput, fixture.list_input);
  assert.doesNotThrow(() => assertListScenarioSubjectContextsInputV1(fixture.list_input));
  assertSchemaAccepts(validateResolveInput, fixture.resolve_input);
  assert.doesNotThrow(() => assertResolveScenarioSubjectContextInputV1(fixture.resolve_input));
  for (const option of fixture.options) {
    assertSchemaAccepts(validateOption, option);
    assert.doesNotThrow(() => assertScenarioSubjectContextOptionV1(option));
  }
  for (const result of fixture.list_results) {
    assertSchemaAccepts(validateListResult, result);
    assert.doesNotThrow(() => assertListScenarioSubjectContextsResultV1(result));
  }
  for (const result of fixture.resolve_results) {
    assertSchemaAccepts(validateResolveResult, result);
    assert.doesNotThrow(() => assertResolveScenarioSubjectContextResultV1(result));
  }
});

test("list input rejects Host selection, identity and pagination smuggling", async (context) => {
  const cases = [
    ["wrong version", (value) => { value.provider_version = 2; }],
    ["zero page", (value) => { value.page_size = 0; }],
    ["over page", (value) => { value.page_size = 21; }],
    ["fractional page", (value) => { value.page_size = 1.5; }],
    ["raw workspace", (value) => { value.workspace_ref = {}; }],
    ["surface", (value) => { value.surface = "example"; }],
    ["sort", (value) => { value.sort = "label"; }],
    ["filter", (value) => { value.filter = {}; }],
    ["short cursor", (value) => { value.cursor = "short"; }],
  ];
  for (const [name, mutate] of cases) {
    await context.test(name, () => {
      const value = clone(fixture.list_input);
      mutate(value);
      assertSchemaRejects(validateListInput, value);
      assert.throws(() => assertListScenarioSubjectContextsInputV1(value));
    });
  }
});

test("resolve input accepts opaque staleness evidence and rejects identity-shaped targets", async (context) => {
  const cases = [
    ["canonical ref", (value) => {
      value.subject_context_ref = { namespace: "example", object_type: "item", object_id: "1" };
    }],
    ["raw target", (value) => { value.target_id = "database-id"; }],
    ["expected version", (value) => { value.expected_version = "mutation-version"; }],
    ["empty known version", (value) => { value.known_context_version = ""; }],
    ["embedded caller", (value) => { value.caller = "host"; }],
  ];
  for (const [name, mutate] of cases) {
    await context.test(name, () => {
      const value = clone(fixture.resolve_input);
      mutate(value);
      assertSchemaRejects(validateResolveInput, value);
      assert.throws(() => assertResolveScenarioSubjectContextInputV1(value));
    });
  }
});

test("subject options enforce closed display allowlist, route pairing and lifetime", async (context) => {
  const cases = [
    ["raw id", (value) => { value.object_id = "database-id"; }, true],
    ["member count", (value) => { value.member_count = 2; }, true],
    ["members", (value) => { value.members = []; }, true],
    ["action availability", (value) => { value.actions = []; }, true],
    ["wrong route pairing", (value) => { value.route_class = "subject_collection"; }, true],
    ["over lifetime", (value) => { value.expires_at = "2026-08-05T10:30:00.001Z"; }, false],
    ["non-canonical issue time", (value) => { value.issued_at = "2026-08-05T10:00:00Z"; }, true],
    ["overlong label", (value) => { value.safe_label.value = "x".repeat(81); }, true],
  ];
  for (const [name, mutate, schemaRejects] of cases) {
    await context.test(name, () => {
      const value = clone(fixture.options[0]);
      mutate(value);
      if (schemaRejects) assertSchemaRejects(validateOption, value);
      assert.throws(() => assertScenarioSubjectContextOptionV1(value));
    });
  }
});

test("selection remains owner-curated, bounded and unique", () => {
  const selection = clone(fixture.list_results[1]);
  selection.candidates = [selection.candidates[0]];
  assertSchemaRejects(validateListResult, selection);
  assert.throws(() => assertListScenarioSubjectContextsResultV1(selection));

  const duplicate = clone(fixture.list_results[1]);
  duplicate.candidates[1].subject_context_ref = duplicate.candidates[0].subject_context_ref;
  assertSchemaAccepts(validateListResult, duplicate);
  assert.throws(() => assertListScenarioSubjectContextsResultV1(duplicate), {
    code: "duplicate_subject_context_ref",
  });

  const mixed = clone(fixture.list_results[1]);
  delete mixed.next_cursor;
  mixed.safe_reason = clone(fixture.list_results[2].safe_reason);
  assertSchemaRejects(validateListResult, mixed);
  assert.throws(() => assertListScenarioSubjectContextsResultV1(mixed));

  const over = clone(fixture.list_results[1]);
  over.candidates = Array.from({ length: 21 }, (_, index) => ({
    ...clone(fixture.options[0]),
    subject_context_ref: `${String(index).padStart(3, "0")}${"J".repeat(40)}`,
  }));
  assertSchemaRejects(validateListResult, over);
  assert.throws(() => assertListScenarioSubjectContextsResultV1(over));
});

test("result unions reject mixed branches and unsupported aliases", () => {
  for (const status of ["partial", "not_modified", "error", "needs_selection"]) {
    const result = clone(fixture.resolve_results[1]);
    result.status = status;
    assertSchemaRejects(validateResolveResult, result);
    assert.throws(() => assertResolveScenarioSubjectContextResultV1(result));
  }
  const mixed = clone(fixture.list_results[2]);
  mixed.context = clone(fixture.options[0]);
  assertSchemaRejects(validateListResult, mixed);
  assert.throws(() => assertListScenarioSubjectContextsResultV1(mixed));
});

test("resolved_at must remain inside the newly issued context lifetime", () => {
  for (const resolvedAt of ["2026-08-05T09:59:59.999Z", "2026-08-05T10:30:00.001Z"]) {
    const result = clone(fixture.resolve_results[0]);
    result.resolved_at = resolvedAt;
    assertSchemaAccepts(validateResolveResult, result);
    assert.throws(() => assertResolveScenarioSubjectContextResultV1(result), {
      code: "invalid_resolved_at",
    });
  }
});

test("provider inputs compose only inside the I1-A delegated operation input", () => {
  const invocation = clone(invocationFixture);
  invocation.operation.input = clone(fixture.resolve_input);
  assert.doesNotThrow(() => assertScenarioPrivateInvocationV1(invocation));
  assert.doesNotThrow(() => assertResolveScenarioSubjectContextInputV1(invocation.operation.input));

  invocation.operation.input.nonce = "must-remain-in-i1-a-request";
  assert.doesNotThrow(() => assertScenarioPrivateInvocationV1(invocation));
  assert.throws(() => assertResolveScenarioSubjectContextInputV1(invocation.operation.input));
});

test("neutral provider fixture carries no product or role vocabulary", () => {
  assert.doesNotMatch(
    JSON.stringify(fixture),
    /nurture|my_chat|child|family|institution|guardian|caregiver|grant|enrollment/iu,
  );
});
