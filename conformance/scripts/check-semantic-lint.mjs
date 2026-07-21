import { readFile } from "node:fs/promises";
import { lintFederationDescriptors } from "./semantic-lint.mjs";

const valid = JSON.parse(await readFile(new URL("../fixtures/federation-descriptor.valid.json", import.meta.url), "utf8"));
const invalid = JSON.parse(await readFile(new URL("../fixtures/federation-descriptor.invalid.json", import.meta.url), "utf8"));

const validFindings = lintFederationDescriptors([valid]);
if (validFindings.length !== 0) throw new Error(`valid federation descriptor failed: ${JSON.stringify(validFindings)}`);

const namespaceConflict = lintFederationDescriptors([
  valid,
  { ...valid, repository: "Other-Example", manifest: { ...valid.manifest, scenario_key: "other-example" }, platform_ref_namespace: "other_platform" },
]);
if (!namespaceConflict.some((entry) => entry.rule_id === "FED-REF-002")) throw new Error("semantic lint did not reject conflicting platform ref namespaces");

const invalidRules = new Set(lintFederationDescriptors([invalid]).map((entry) => entry.rule_id));
for (const expectedRule of ["FED-REF-001", "FED-KEY-001", "FED-HASH-001", "FED-STEP-001", "FED-STEP-002", "FED-HANDOFF-001", "FED-PROVIDER-001", "FED-ALIAS-001"]) {
  if (!invalidRules.has(expectedRule)) throw new Error(`semantic lint did not emit ${expectedRule}`);
}

const futureAndUnsafe = lintFederationDescriptors([{
  ...valid,
  manifest: {
    ...valid.manifest,
    manifest_version: 3,
    allowed_user_classes: ["internal_admin"],
    event_registry: {
      scenario_internal_events: ["other.event"],
      event_payload_policy: { body: "optional_body", pii: "unknown" },
    },
  },
}]);
const futureAndUnsafeRules = new Set(futureAndUnsafe.map((entry) => entry.rule_id));
for (const expectedRule of ["FED-MANIFEST-001", "FED-USER-001", "FED-EVENT-001", "FED-EVENT-002"]) {
  if (!futureAndUnsafeRules.has(expectedRule)) throw new Error(`semantic lint did not emit ${expectedRule}`);
}
