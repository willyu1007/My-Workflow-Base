import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const lock = JSON.parse(await readFile(
  new URL("../workflow-contract-source-lock.json", import.meta.url),
  "utf8",
));
const completeContracts = JSON.parse(await readFile(
  new URL("../fixtures/scenario-contract-manifest-f3.valid.json", import.meta.url),
  "utf8",
));

const sourceIdentities = [
  "platform_child_family_identity_source_v1",
  "scenario_interface_source_v1",
  "scenario_domain_action_source_v1",
  "scenario_protected_interaction_source_v1",
];
const commonPaths = [
  "workflow-contracts/types/manifest.ts",
  "workflow-contracts/types/scenario-release.ts",
  "workflow-contracts/types/validation.ts",
  "workflow-contract-schemas/scenario-manifest-v2.schema.json",
  "workflow-validator/validate-module.ts",
];
const requiredRolePaths = new Map([
  ["platform_child_family_identity_source_v1", [
    "workflow-contracts/types/scenario-invocation.ts",
    "workflow-contracts/types/scenario-binding.ts",
    "workflow-contract-schemas/scenario-owner-binding-reservation-request-v1.schema.json",
  ]],
  ["scenario_interface_source_v1", [
    "workflow-contracts/types/scenario-invocation.ts",
    "workflow-contracts/types/scenario-presentation.ts",
    "workflow-contract-schemas/scenario-semantic-presentation-v1.schema.json",
  ]],
  ["scenario_domain_action_source_v1", [
    "workflow-contracts/types/scenario-domain-action.ts",
    "workflow-contracts/types/scenario-domain-action-validation.ts",
    "workflow-contract-schemas/scenario-domain-action-contract-v1.schema.json",
  ]],
  ["scenario_protected_interaction_source_v1", [
    "workflow-contracts/types/scenario-protected-interaction.ts",
    "workflow-contracts/types/scenario-protected-interaction-validation.ts",
    "workflow-contract-schemas/scenario-protected-interaction-contract-v1.schema.json",
  ]],
]);

test("F4 lock publishes exactly four deterministic named Base source profiles", () => {
  assert.equal(lock.schema_version, 2);
  assert.deepEqual(
    lock.source_profiles.map((profile) => profile.source_identity),
    sourceIdentities,
  );
  assert.deepEqual(
    completeContracts.source_dependencies,
    lock.source_profiles.map(({ source_identity, source_hash }) => ({
      source_identity,
      source_hash,
    })),
  );
  for (const profile of lock.source_profiles) {
    assert.match(profile.source_hash, /^[a-f0-9]{64}$/u);
    const paths = profile.files.map((file) => file.path);
    assert.deepEqual(paths, [...paths].sort());
    assert.equal(new Set(paths).size, paths.length);
    for (const path of [...commonPaths, ...requiredRolePaths.get(profile.source_identity)]) {
      assert.equal(paths.includes(path), true, `${profile.source_identity} is missing ${path}`);
    }
    for (const path of paths) {
      assert.match(path, /^(workflow-contracts|workflow-contract-schemas|workflow-validator)\//u);
      assert.doesNotMatch(path, /(?:^|\/)(?:docs|dist|fixtures|tests)(?:\/|$)|\.test\./u);
    }
  }
});

test("F4 source identities remain separately keyed instead of umbrella-merged", () => {
  assert.equal(new Set(lock.source_profiles.map((profile) => profile.source_identity)).size, 4);
  assert.equal(new Set(lock.source_profiles.map((profile) => profile.source_hash)).size, 4);
  assert.equal(lock.source_profiles.some((profile) =>
    profile.source_hash === lock.source_hash), false);
});
