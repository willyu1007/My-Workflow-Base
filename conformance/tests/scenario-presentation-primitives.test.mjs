import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  assertScenarioActionTargetRefV1,
  assertScenarioContinuationRefV1,
  assertScenarioNarrationPolicyV1,
  assertScenarioPresentationCursorV1,
  assertScenarioPresentationItemRefV1,
  assertScenarioSafeLabelV1,
  assertScenarioSafeReasonV1,
  assertScenarioSafeTextV1,
  assertScenarioSubjectContextRefV1,
  assertScenarioToneV1,
} from "@host/workflow-contracts";

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
const cloneReason = () => structuredClone(fixture.safe_reason);
const assertSchemaAccepts = (validate, value) => {
  assert.equal(validate(value), true, JSON.stringify(validate.errors));
};
const assertSchemaRejects = (validate, value) => {
  assert.equal(validate(value), false, "JSON Schema unexpectedly accepted mutation");
};

test("accepts neutral safe-copy fixtures and all closed generic enums", () => {
  assertSchemaAccepts(validateText, fixture.safe_text);
  assertSchemaAccepts(validateReason, fixture.safe_reason);
  assert.doesNotThrow(() => assertScenarioSafeTextV1(fixture.safe_text));
  assert.doesNotThrow(() => assertScenarioSafeReasonV1(fixture.safe_reason));
  for (const tone of ["neutral", "informational", "positive", "warning", "critical"]) {
    assert.doesNotThrow(() => assertScenarioToneV1(tone));
  }
  for (const narration of ["allowed", "display_only"]) {
    assert.doesNotThrow(() => assertScenarioNarrationPolicyV1(narration));
  }
});

test("safe-copy Schema and codec reject structural and copy exposure mutations", async (context) => {
  const cases = [
    ["unknown field", (value) => { value.html = "<strong>unsafe</strong>"; }],
    ["wrong kind", (value) => { value.kind = "markdown"; }],
    ["blank", (value) => { value.value = ""; }],
    ["padded", (value) => { value.value = " padded"; }],
    ["control", (value) => { value.value = "line one\nline two"; }],
    ["HTML", (value) => { value.value = "<strong>unsafe</strong>"; }],
    ["URL", (value) => { value.value = "Open https://example.invalid"; }],
    ["Markdown", (value) => { value.value = "[open](target)"; }],
    ["template", (value) => { value.value = "Hello {{name}}"; }],
    ["invalid locale", (value) => { value.locale = "EN_us"; }],
  ];
  for (const [name, mutate] of cases) {
    await context.test(name, () => {
      const value = cloneText();
      mutate(value);
      assertSchemaRejects(validateText, value);
      assert.throws(() => assertScenarioSafeTextV1(value));
    });
  }
});

test("codec applies semantic normalization and internal-detail negatives", () => {
  for (const value of [
    "Cafe\u0301",
    "Database error while loading the view.",
    "Provider error while loading the view.",
    "Stack trace is available.",
  ]) {
    const text = cloneText();
    text.value = value;
    assert.throws(() => assertScenarioSafeTextV1(text));
  }
});

test("enforces text, label, and help bounds", () => {
  const text = cloneText();
  text.value = "x".repeat(500);
  assert.doesNotThrow(() => assertScenarioSafeTextV1(text));
  text.value += "x";
  assertSchemaRejects(validateText, text);
  assert.throws(() => assertScenarioSafeTextV1(text));

  const label = cloneText();
  label.value = "x".repeat(80);
  assert.doesNotThrow(() => assertScenarioSafeLabelV1(label));
  label.value += "x";
  assert.throws(() => assertScenarioSafeLabelV1(label));

  const reason = cloneReason();
  reason.help.value = "x".repeat(240);
  assertSchemaAccepts(validateReason, reason);
  assert.doesNotThrow(() => assertScenarioSafeReasonV1(reason));
  reason.help.value += "x";
  assertSchemaRejects(validateReason, reason);
  assert.throws(() => assertScenarioSafeReasonV1(reason));
});

test("safe reasons remain closed and owner-registered", async (context) => {
  const cases = [
    ["unknown field", (value) => { value.internal_reason = "hidden"; }],
    ["invalid code", (value) => { value.reason_code = "Not Registered"; }],
    ["invalid retry", (value) => { value.retry_class = "retry_now"; }],
    ["unsafe message", (value) => { value.message.value = "SQLSTATE 22000"; }],
    ["unsafe help", (value) => { value.help.value = "Open www.example.invalid"; }],
  ];
  for (const [name, mutate] of cases) {
    await context.test(name, () => {
      const value = cloneReason();
      mutate(value);
      assert.throws(() => assertScenarioSafeReasonV1(value));
    });
  }
});

test("opaque locator slots accept bounded base64url and reject identity-shaped values", () => {
  for (const [value, assertValue] of [
    [fixture.subject_context_ref, assertScenarioSubjectContextRefV1],
    [fixture.presentation_item_ref, assertScenarioPresentationItemRefV1],
    [fixture.action_target_ref, assertScenarioActionTargetRefV1],
    [fixture.cursor, assertScenarioPresentationCursorV1],
    [fixture.continuation_ref, assertScenarioContinuationRefV1],
  ]) {
    assert.doesNotThrow(() => assertValue(value));
    assert.throws(() => assertValue("a".repeat(31)));
    assert.throws(() => assertValue("a".repeat(513)));
    assert.throws(() => assertValue("example:item:database-id"));
    assert.throws(() => assertValue({ namespace: "example", object_type: "item", object_id: "1" }));
  }
});

test("neutral fixture carries no product vocabulary", () => {
  assert.doesNotMatch(
    JSON.stringify(fixture),
    /nurture|my_chat|child|family|institution|guardian|caregiver/iu,
  );
});
