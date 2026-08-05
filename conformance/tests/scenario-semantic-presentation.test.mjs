import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  assertPresentScenarioSubjectContextInputV1,
  assertPresentScenarioSubjectContextExchangeV1,
  assertScenarioActionOfferV1,
  assertScenarioNavigationOfferV1,
  assertScenarioPresentationResultV1,
  assertScenarioPrivateInvocationV1,
  assertScenarioSemanticBlockV1,
  assertScenarioSemanticPresentationV1,
  projectScenarioNarrationTextV1,
  resolveScenarioPageSizeV1,
  scenarioDefaultPageSizeV1,
} from "@host/workflow-contracts";

const schemaRoot = new URL(
  "../../templates/host-runtime/packages/workflow-contracts/schemas/",
  import.meta.url,
);
const fixtureRoot = new URL("../fixtures/", import.meta.url);
const [fixture, invocationFixture] = await Promise.all([
  "scenario-semantic-presentation.valid.json",
  "scenario-private-invocation.valid.json",
].map(async (name) => JSON.parse(await readFile(new URL(name, fixtureRoot), "utf8"))));
const schemaNames = [
  "scenario-safe-text-v1.schema.json",
  "scenario-safe-reason-v1.schema.json",
  "scenario-present-subject-context-input-v1.schema.json",
  "scenario-semantic-block-v1.schema.json",
  "scenario-navigation-offer-v1.schema.json",
  "scenario-action-offer-v1.schema.json",
  "scenario-semantic-presentation-v1.schema.json",
  "scenario-presentation-result-v1.schema.json",
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
const validateInput = validator("scenario-present-subject-context-input-v1");
const validateBlock = validator("scenario-semantic-block-v1");
const validateNavigation = validator("scenario-navigation-offer-v1");
const validateAction = validator("scenario-action-offer-v1");
const validatePresentation = validator("scenario-semantic-presentation-v1");
const validateResult = validator("scenario-presentation-result-v1");

const clone = (value) => structuredClone(value);
const assertSchemaAccepts = (validate, value) => {
  assert.equal(validate(value), true, JSON.stringify(validate.errors));
};
const assertSchemaRejects = (validate, value) => {
  assert.equal(validate(value), false, "JSON Schema unexpectedly accepted mutation");
};
const text = (value) => ({ kind: "plain_text", value, locale: "en-US" });

test("accepts the read-only input, all six blocks, offers and four result variants", () => {
  assertSchemaAccepts(validateInput, fixture.input);
  assert.doesNotThrow(() => assertPresentScenarioSubjectContextInputV1(fixture.input));
  for (const block of fixture.presentation.blocks) {
    assertSchemaAccepts(validateBlock, block);
    assert.doesNotThrow(() => assertScenarioSemanticBlockV1(block));
  }
  for (const offer of fixture.presentation.navigation) {
    assertSchemaAccepts(validateNavigation, offer);
    assert.doesNotThrow(() => assertScenarioNavigationOfferV1(offer));
  }
  for (const offer of fixture.presentation.actions) {
    assertSchemaAccepts(validateAction, offer);
    assert.doesNotThrow(() => assertScenarioActionOfferV1(offer));
  }
  assertSchemaAccepts(validatePresentation, fixture.presentation);
  assert.doesNotThrow(() => assertScenarioSemanticPresentationV1(fixture.presentation));
  const results = [
    { status: "ready", presentation: fixture.presentation },
    { status: "empty", presentation: { ...fixture.presentation, blocks: [], navigation: [], actions: [] } },
    {
      status: "context_changed",
      safe_reason: {
        reason_code: "example_context_changed",
        message: text("The current context changed."),
        retry_class: "refresh",
      },
    },
    {
      status: "unavailable",
      safe_reason: {
        reason_code: "example_unavailable",
        message: text("This presentation is unavailable."),
        retry_class: "retry_later",
      },
    },
  ];
  for (const result of results) {
    assertSchemaAccepts(validateResult, result);
    assert.doesNotThrow(() => assertScenarioPresentationResultV1(result));
  }
});

test("presentation input rejects authority, target, surface and command smuggling", async (context) => {
  const cases = [
    ["wrong version", (value) => { value.presentation_version = 2; }],
    ["raw target", (value) => { value.target_id = "database-id"; }],
    ["surface", (value) => { value.surface = "example"; }],
    ["role", (value) => { value.role = "operator"; }],
    ["action", (value) => { value.action_key = "example"; }],
    ["command", (value) => { value.command_id = "command"; }],
    ["submit token", (value) => { value.submit_token = "token"; }],
    ["invalid view", (value) => { value.view_query.view_mode = "all"; }],
    ["over page", (value) => { value.view_query.page_size = 21; }],
  ];
  for (const [name, mutate] of cases) {
    await context.test(name, () => {
      const value = clone(fixture.input);
      mutate(value);
      assertSchemaRejects(validateInput, value);
      assert.throws(() => assertPresentScenarioSubjectContextInputV1(value));
    });
  }
});

test("presentation pagination uses the shared default contract", () => {
  assert.equal(schemas[2].properties.view_query.properties.page_size.default, 10);
  const input = clone(fixture.input);
  delete input.view_query.page_size;
  assertSchemaAccepts(validateInput, input);
  assert.doesNotThrow(() => assertPresentScenarioSubjectContextInputV1(input));
  assert.equal(resolveScenarioPageSizeV1(input.view_query.page_size), scenarioDefaultPageSizeV1);
});

test("block union rejects recursion, raw identities, renderer fields and mixed variants", async (context) => {
  const cases = [
    ["recursive", 0, (value) => { value.blocks = []; }],
    ["raw id", 0, (value) => { value.object_id = "database-id"; }],
    ["canonical ref", 2, (value) => { value.canonical_ref = {}; }],
    ["command ref", 4, (value) => { value.command_ref = "command"; }],
    ["protected body", 4, (value) => { value.protected_body = "secret"; }],
    ["renderer", 0, (value) => { value.component = "Card"; }],
    ["mixed variant", 2, (value) => { value.metrics = []; }],
    ["timeline without time", 5, (value) => { delete value.entries[0].occurred_at; }],
    ["rank Anti-Metric", 3, (value) => { value.metrics[0].rank = 1; }],
    ["rank metric key", 3, (value) => { value.metrics[0].metric_key = "metric.rank"; }],
  ];
  for (const [name, index, mutate] of cases) {
    await context.test(name, () => {
      const value = clone(fixture.presentation.blocks[index]);
      mutate(value);
      assertSchemaRejects(validateBlock, value);
      assert.throws(() => assertScenarioSemanticBlockV1(value));
    });
  }
});

test("block and presentation codecs enforce local-key and count bounds", () => {
  const facts = clone(fixture.presentation.blocks[2]);
  facts.facts = Array.from({ length: 21 }, (_, index) => ({
    ...clone(facts.facts[0]),
    fact_key: `fact.${index}`,
  }));
  assertSchemaRejects(validateBlock, facts);
  assert.throws(() => assertScenarioSemanticBlockV1(facts));

  const duplicateRows = clone(fixture.presentation.blocks[2]);
  duplicateRows.facts.push(clone(duplicateRows.facts[0]));
  assertSchemaAccepts(validateBlock, duplicateRows);
  assert.throws(() => assertScenarioSemanticBlockV1(duplicateRows), {
    code: "duplicate_local_key",
  });

  const duplicateBlocks = clone(fixture.presentation);
  duplicateBlocks.blocks.push(clone(duplicateBlocks.blocks[0]));
  assertSchemaAccepts(validatePresentation, duplicateBlocks);
  assert.throws(() => assertScenarioSemanticPresentationV1(duplicateBlocks), {
    code: "duplicate_local_key",
  });

  const tooManyBlocks = clone(fixture.presentation);
  tooManyBlocks.blocks = Array.from({ length: 21 }, (_, index) => ({
    ...clone(fixture.presentation.blocks[0]),
    block_key: `summary.${index}`,
  }));
  assertSchemaRejects(validatePresentation, tooManyBlocks);
  assert.throws(() => assertScenarioSemanticPresentationV1(tooManyBlocks));
});

test("presentation item and timeline keys share one response-local namespace", () => {
  const duplicateAcrossBlocks = clone(fixture.presentation);
  const secondCollection = clone(duplicateAcrossBlocks.blocks[4]);
  secondCollection.block_key = "items.second";
  duplicateAcrossBlocks.blocks.push(secondCollection);
  assertSchemaAccepts(validatePresentation, duplicateAcrossBlocks);
  assert.throws(() => assertScenarioSemanticPresentationV1(duplicateAcrossBlocks), {
    code: "duplicate_local_key",
  });

  const duplicateAcrossKinds = clone(fixture.presentation);
  duplicateAcrossKinds.blocks[5].entries[0].entry_key =
    duplicateAcrossKinds.blocks[4].items[0].item_key;
  assertSchemaAccepts(validatePresentation, duplicateAcrossKinds);
  assert.throws(() => assertScenarioSemanticPresentationV1(duplicateAcrossKinds), {
    code: "duplicate_local_key",
  });
});

test("navigation remains read-only and action offers remain prepare-only", async (context) => {
  const navigationCases = [
    ["URL", (value) => { value.url = "https://example.invalid"; }],
    ["raw target", (value) => { value.target_id = "database-id"; }],
    ["action", (value) => { value.action_key = "example"; }],
    ["effect", (value) => { value.effect = "submit"; }],
  ];
  for (const [name, mutate] of navigationCases) {
    await context.test(`navigation ${name}`, () => {
      const value = clone(fixture.presentation.navigation[0]);
      mutate(value);
      assertSchemaRejects(validateNavigation, value);
      assert.throws(() => assertScenarioNavigationOfferV1(value));
    });
  }
  const actionCases = [
    ["raw target", 0, (value) => { value.target_id = "database-id"; }],
    ["Run target type", 0, (value) => { value.target_type = "Run"; }],
    ["server action", 0, (value) => { value.serverAction = "execute"; }],
    ["params", 0, (value) => { value.params = {}; }],
    ["command", 0, (value) => { value.command_key = "command"; }],
    ["submit token", 0, (value) => { value.submit_token = "token"; }],
    ["available reason", 0, (value) => { value.safe_reason = clone(fixture.presentation.actions[1].safe_reason); }],
    ["unavailable target", 1, (value) => { value.target_ref = "R".repeat(43); }],
    ["unavailable version", 1, (value) => { value.expected_version = "version"; }],
  ];
  for (const [name, index, mutate] of actionCases) {
    await context.test(`action ${name}`, () => {
      const value = clone(fixture.presentation.actions[index]);
      mutate(value);
      assertSchemaRejects(validateAction, value);
      assert.throws(() => assertScenarioActionOfferV1(value));
    });
  }
});

test("result union rejects partial aliases and enforces 64 KiB UTF-8", () => {
  for (const status of ["partial", "not_modified", "error", "needs_selection"]) {
    const result = { status, presentation: clone(fixture.presentation) };
    assertSchemaRejects(validateResult, result);
    assert.throws(() => assertScenarioPresentationResultV1(result));
  }

  const oversizedPresentation = clone(fixture.presentation);
  oversizedPresentation.blocks = Array.from({ length: 20 }, (_, blockIndex) => ({
    kind: "item_collection",
    block_key: `items.${blockIndex}`,
    tone: "neutral",
    narration: "allowed",
    items: Array.from({ length: 20 }, (_, itemIndex) => ({
      item_key: `item.${blockIndex}.${itemIndex}`,
      title: text("x".repeat(120)),
      summary: text("x".repeat(500)),
      badges: Array.from({ length: 4 }, () => ({
        label: text("x".repeat(80)),
        tone: "neutral",
      })),
    })),
  }));
  const result = { status: "ready", presentation: oversizedPresentation };
  assertSchemaAccepts(validateResult, result);
  assert.throws(() => assertScenarioPresentationResultV1(result), {
    code: "presentation_too_large",
  });
});

test("presentation exchange rejects subject and presentation-key drift", () => {
  const ready = { status: "ready", presentation: clone(fixture.presentation) };
  assert.doesNotThrow(() => assertPresentScenarioSubjectContextExchangeV1(fixture.input, ready));

  const wrongSubject = clone(ready);
  wrongSubject.presentation.subject_context_ref = "RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR";
  assert.throws(
    () => assertPresentScenarioSubjectContextExchangeV1(fixture.input, wrongSubject),
    { code: "subject_context_mismatch" },
  );

  const wrongKey = clone(ready);
  wrongKey.presentation.presentation_key = "example.other";
  assert.throws(
    () => assertPresentScenarioSubjectContextExchangeV1(fixture.input, wrongKey),
    { code: "presentation_key_mismatch" },
  );
});

test("AI narration projection returns copied allowed safe text and strips control data", () => {
  const projection = projectScenarioNarrationTextV1(fixture.presentation);
  const serialized = JSON.stringify(projection);
  assert.match(serialized, /Current summary/u);
  assert.match(serialized, /Review the current item/u);
  assert.match(serialized, /This action is unavailable/u);
  assert.doesNotMatch(serialized, /Display this notice only|Display-only detail|metric\.total/u);
  assert.doesNotMatch(
    serialized,
    /subject_context_ref|context_version|presentation_item_ref|continuation_ref|target_ref|expected_version|reason_code|action_key|cursor/u,
  );
  for (const value of projection) {
    assert.deepEqual(Object.keys(value).sort(), ["kind", "locale", "value"]);
  }
  projection[0].value = "mutated copy";
  assert.equal(fixture.presentation.blocks[0].title.value, "Current summary");
});

test("presentation input composes as I1-A operation input and fixture stays neutral", () => {
  const invocation = clone(invocationFixture);
  invocation.operation.input = clone(fixture.input);
  assert.doesNotThrow(() => assertScenarioPrivateInvocationV1(invocation));
  assert.doesNotThrow(() => assertPresentScenarioSubjectContextInputV1(invocation.operation.input));
  assert.doesNotMatch(
    JSON.stringify(fixture),
    /nurture|my_chat|child|family|institution|guardian|caregiver|grant|enrollment/iu,
  );
});
