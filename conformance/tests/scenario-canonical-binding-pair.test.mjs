import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import {
  assertScenarioCanonicalBindingPairExchangeV1,
  assertScenarioCanonicalBindingPairRequestV1,
  assertScenarioCanonicalBindingPairResultV1,
  assertScenarioOwnerBindingReservationRequestV1,
  assertScenarioOwnerBindingReservationResultV1,
} from "@host/workflow-contracts";

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

const assertSchemaRejects = (validate, value) => {
  assert.equal(validate(value), false, "JSON Schema unexpectedly accepted mutation");
};

const applyBranch = (request, result, reuseByIndex) => {
  reuseByIndex.forEach((reused, index) => {
    const intent = request.bindings[index];
    const item = result.bindings[index];
    intent.expected_head = reused
      ? {
          state: "bound",
          binding_ref: structuredClone(item.binding_ref),
          binding_version: item.binding_version,
          owner_ref: structuredClone(intent.scenario_owner_ref),
        }
      : { state: "absent" };
    item.effect = reused ? "reused" : "created";
  });
};

test("accepts all four legal atomic pair resolution branches", async (context) => {
  const cases = [
    ["reuse both", [true, true]],
    ["reuse A and create B", [true, false]],
    ["create A and reuse B", [false, true]],
    ["create both with exact replay result", [false, false]],
  ];

  for (const [name, reuseByIndex] of cases) {
    await context.test(name, () => {
      const request = cloneRequest();
      const result = cloneResult();
      applyBranch(request, result, reuseByIndex);
      if (name.includes("exact replay")) result.disposition = "exact_replay";
      assertSchemaAccepts(validateRequest, request);
      assertSchemaAccepts(validateResult, result);
      assert.doesNotThrow(() => assertScenarioCanonicalBindingPairExchangeV1(request, result));
    });
  }
});

test("request Schema and codec reject the same closed structural mutations", async (context) => {
  const cases = [
    ["unknown field", (value) => { value.membership_ref = {}; }],
    ["one binding", (value) => { value.bindings.pop(); }],
    ["three bindings", (value) => { value.bindings.push(structuredClone(value.bindings[1])); }],
    ["invalid scenario key", (value) => { value.scenario_key = "Example Scenario"; }],
    ["uppercase input hash", (value) => {
      value.canonical_input_hash = value.canonical_input_hash.toUpperCase();
    }],
    ["absent head with bound fields", (value) => {
      value.bindings[1].expected_head.binding_version = 0;
    }],
    ["null expected head", (value) => { value.bindings[0].expected_head = null; }],
  ];

  for (const [name, mutate] of cases) {
    await context.test(name, () => {
      const value = cloneRequest();
      mutate(value);
      assertSchemaRejects(validateRequest, value);
      assert.throws(() => assertScenarioCanonicalBindingPairRequestV1(value));
    });
  }
});

test("request codec alone rejects ordering and bound-owner cross-field drift", () => {
  const duplicate = cloneRequest();
  duplicate.bindings[1].binding_slot = duplicate.bindings[0].binding_slot;
  assertSchemaAccepts(validateRequest, duplicate);
  assert.throws(() => assertScenarioCanonicalBindingPairRequestV1(duplicate), {
    code: "duplicate_binding_slot",
  });

  const unsorted = cloneRequest();
  unsorted.bindings.reverse();
  assertSchemaAccepts(validateRequest, unsorted);
  assert.throws(() => assertScenarioCanonicalBindingPairRequestV1(unsorted), {
    code: "unsorted_binding_slots",
  });

  const wrongOwner = cloneRequest();
  wrongOwner.bindings[0].expected_head.owner_ref.object_id = "wrong_anchor";
  assertSchemaAccepts(validateRequest, wrongOwner);
  assert.throws(() => assertScenarioCanonicalBindingPairRequestV1(wrongOwner), {
    code: "expected_owner_mismatch",
  });
});

test("result Schema and codec reject the same closed structural mutations", async (context) => {
  const cases = [
    ["unknown field", (value) => { value.signature = "detached-only"; }],
    ["partial result", (value) => { value.bindings.pop(); }],
    ["unsupported disposition", (value) => { value.disposition = "partial"; }],
    ["unsupported effect", (value) => { value.bindings[0].effect = "updated"; }],
    ["negative version", (value) => { value.bindings[0].binding_version = -1; }],
    ["uppercase commit evidence", (value) => {
      value.pair_commit_evidence_hash = value.pair_commit_evidence_hash.toUpperCase();
    }],
    ["missing binding ref", (value) => { delete value.bindings[0].binding_ref; }],
  ];

  for (const [name, mutate] of cases) {
    await context.test(name, () => {
      const value = cloneResult();
      mutate(value);
      assertSchemaRejects(validateResult, value);
      assert.throws(() => assertScenarioCanonicalBindingPairResultV1(value));
    });
  }
});

test("result codec alone rejects duplicate and unsorted slots", () => {
  const duplicate = cloneResult();
  duplicate.bindings[1].binding_slot = duplicate.bindings[0].binding_slot;
  assertSchemaAccepts(validateResult, duplicate);
  assert.throws(() => assertScenarioCanonicalBindingPairResultV1(duplicate), {
    code: "duplicate_binding_slot",
  });

  const unsorted = cloneResult();
  unsorted.bindings.reverse();
  assertSchemaAccepts(validateResult, unsorted);
  assert.throws(() => assertScenarioCanonicalBindingPairResultV1(unsorted), {
    code: "unsorted_binding_slots",
  });
});

test("exchange codec rejects identity, hash, ref, head and effect drift", async (context) => {
  const cases = [
    ["identity operation", "identity_operation_mismatch", (_request, result) => {
      result.identity_operation_id = "identity-operation-pair-02";
    }],
    ["canonical input", "canonical_input_mismatch", (_request, result) => {
      result.canonical_input_hash = "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";
    }],
    ["binding slot", "binding_slot_mismatch", (_request, result) => {
      result.bindings[1].binding_slot = "canonical.subject.secondary";
    }],
    ["canonical object", "canonical_object_mismatch", (_request, result) => {
      result.bindings[1].canonical_object_ref.object_id = "subject_02";
    }],
    ["scenario owner", "scenario_owner_mismatch", (_request, result) => {
      result.bindings[1].scenario_owner_ref.object_id = "subject_anchor_02";
    }],
    ["bound binding ref", "binding_ref_mismatch", (_request, result) => {
      result.bindings[0].binding_ref.object_id = "binding_context_02";
    }],
    ["bound binding version", "binding_version_mismatch", (_request, result) => {
      result.bindings[0].binding_version = 4;
    }],
    ["bound effect", "binding_effect_mismatch", (_request, result) => {
      result.bindings[0].effect = "created";
    }],
    ["absent effect", "binding_effect_mismatch", (_request, result) => {
      result.bindings[1].effect = "reused";
    }],
  ];

  for (const [name, code, mutate] of cases) {
    await context.test(name, () => {
      const request = cloneRequest();
      const result = cloneResult();
      mutate(request, result);
      assertSchemaAccepts(validateRequest, request);
      assertSchemaAccepts(validateResult, result);
      assert.throws(() => assertScenarioCanonicalBindingPairExchangeV1(request, result), { code });
    });
  }
});

test("Host-internal pair bodies cannot pass Scenario-private reservation codecs", () => {
  assert.throws(() => assertScenarioOwnerBindingReservationRequestV1(fixture.request));
  assert.throws(() => assertScenarioOwnerBindingReservationResultV1(fixture.result));
});
