import { readFile, readdir } from "node:fs/promises";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const schemaRoot = new URL("../../templates/host-runtime/packages/workflow-contracts/schemas/", import.meta.url);
const expected = [
  "bind-scenario-domain-action-step-input-v1.schema.json",
  "bind-scenario-domain-action-step-result-v1.schema.json",
  "canonical-ref-v1.schema.json",
  "generation-ticket-v1.schema.json",
  "integration-lock-v3.schema.json",
  "lookup-scenario-domain-action-step-binding-input-v1.schema.json",
  "lookup-scenario-domain-action-step-binding-result-v1.schema.json",
  "prepare-scenario-domain-action-input-v1.schema.json",
  "prepare-scenario-domain-action-result-v1.schema.json",
  "prepare-scenario-protected-interaction-input-v1.schema.json",
  "prepare-scenario-protected-interaction-result-v1.schema.json",
  "read-scenario-protected-detail-input-v1.schema.json",
  "read-scenario-protected-detail-result-v1.schema.json",
  "scenario-action-offer-v1.schema.json",
  "scenario-authentication-assurance-evidence-v1.schema.json",
  "scenario-canonical-binding-expected-head-v1.schema.json",
  "scenario-canonical-binding-intent-v1.schema.json",
  "scenario-canonical-binding-pair-request-v1.schema.json",
  "scenario-canonical-binding-pair-result-v1.schema.json",
  "scenario-canonical-binding-result-item-v1.schema.json",
  "scenario-command-envelope-v1.schema.json",
  "scenario-command-receipt-v1.schema.json",
  "scenario-committed-protected-content-control-v1.schema.json",
  "scenario-contract-release-v1.schema.json",
  "scenario-current-owner-binding-pair-evidence-v1.schema.json",
  "scenario-domain-action-claimed-step-assertion-v1.schema.json",
  "scenario-domain-action-claimed-step-driver-v1.schema.json",
  "scenario-domain-action-confirmation-prompt-v1.schema.json",
  "scenario-domain-action-contract-v1.schema.json",
  "scenario-domain-action-current-result-v1.schema.json",
  "scenario-domain-action-effect-identity-input-v1.schema.json",
  "scenario-domain-action-execution-binding-v1.schema.json",
  "scenario-domain-action-execution-result-v1.schema.json",
  "scenario-domain-action-submit-echo-v1.schema.json",
  "scenario-domain-action-workflow-step-ref-v1.schema.json",
  "scenario-event-envelope-v1.schema.json",
  "scenario-human-principal-v1.schema.json",
  "scenario-identity-operation-status-lookup-request-v1.schema.json",
  "scenario-identity-operation-status-lookup-result-v1.schema.json",
  "scenario-ingress-surface-v1.schema.json",
  "scenario-list-subject-contexts-input-v1.schema.json",
  "scenario-list-subject-contexts-result-v1.schema.json",
  "scenario-manifest-v2.schema.json",
  "scenario-navigation-offer-v1.schema.json",
  "scenario-owner-binding-ref-v1.schema.json",
  "scenario-owner-binding-reservation-request-v1.schema.json",
  "scenario-owner-binding-reservation-result-v1.schema.json",
  "scenario-prepared-protected-content-control-v1.schema.json",
  "scenario-present-subject-context-input-v1.schema.json",
  "scenario-presentation-result-v1.schema.json",
  "scenario-private-invocation-v1.schema.json",
  "scenario-protected-carrier-binding-v1.schema.json",
  "scenario-protected-content-read-locator-v1.schema.json",
  "scenario-protected-display-lease-v1.schema.json",
  "scenario-protected-interaction-contract-v1.schema.json",
  "scenario-protected-plain-text-carrier-v1.schema.json",
  "scenario-resolve-subject-context-input-v1.schema.json",
  "scenario-resolve-subject-context-result-v1.schema.json",
  "scenario-safe-reason-v1.schema.json",
  "scenario-safe-text-v1.schema.json",
  "scenario-semantic-block-v1.schema.json",
  "scenario-semantic-presentation-v1.schema.json",
  "scenario-subject-context-option-v1.schema.json",
  "scenario-workspace-activation-v1.schema.json",
  "submit-scenario-domain-action-input-v1.schema.json",
  "submit-scenario-domain-action-result-v1.schema.json",
];

const actual = (await readdir(schemaRoot)).filter((name) => name.endsWith(".schema.json")).sort();
if (JSON.stringify(actual) !== JSON.stringify(expected)) {
  throw new Error(`federation schema package is incomplete: ${JSON.stringify(actual)}`);
}

const schemas = [];
for (const name of expected) {
  const schema = JSON.parse(await readFile(new URL(name, schemaRoot), "utf8"));
  if (schema.$schema !== "https://json-schema.org/draft/2020-12/schema" || typeof schema.$id !== "string") {
    throw new Error(`${name} is not a versioned JSON Schema 2020-12 contract`);
  }
  if (schema.additionalProperties !== false) {
    throw new Error(`${name} must reject unknown top-level fields`);
  }
  schemas.push(schema);
}

// Legacy package schemas predate Ajv strict annotations; execution still
// proves that every published schema resolves and compiles as JSON Schema.
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
for (const schema of schemas) ajv.addSchema(schema);
for (const schema of schemas) {
  if (!ajv.getSchema(schema.$id)) throw new Error(`${schema.$id} did not compile`);
}

const invocationFixture = JSON.parse(await readFile(
  new URL("../fixtures/scenario-private-invocation.valid.json", import.meta.url),
  "utf8",
));
const validateInvocation = ajv.getSchema(
  "https://morethan.local/contracts/scenario-private-invocation-v1.schema.json",
);
if (!validateInvocation || !validateInvocation(invocationFixture)) {
  throw new Error(`scenario private invocation fixture failed schema execution: ${JSON.stringify(validateInvocation?.errors)}`);
}

const presentationPrimitiveFixture = JSON.parse(await readFile(
  new URL("../fixtures/scenario-presentation-primitives.valid.json", import.meta.url),
  "utf8",
));
for (const [schemaName, value] of [
  ["scenario-safe-text-v1", presentationPrimitiveFixture.safe_text],
  ["scenario-safe-reason-v1", presentationPrimitiveFixture.safe_reason],
]) {
  const validate = ajv.getSchema(`https://morethan.local/contracts/${schemaName}.schema.json`);
  if (!validate || !validate(value)) {
    throw new Error(`presentation primitive fixture failed ${schemaName}: ${JSON.stringify(validate?.errors)}`);
  }
}

const subjectContextProviderFixture = JSON.parse(await readFile(
  new URL("../fixtures/scenario-subject-context-provider.valid.json", import.meta.url),
  "utf8",
));
for (const [schemaName, values] of [
  ["scenario-list-subject-contexts-input-v1", [subjectContextProviderFixture.list_input]],
  ["scenario-resolve-subject-context-input-v1", [subjectContextProviderFixture.resolve_input]],
  ["scenario-subject-context-option-v1", subjectContextProviderFixture.options],
  ["scenario-list-subject-contexts-result-v1", subjectContextProviderFixture.list_results],
  ["scenario-resolve-subject-context-result-v1", subjectContextProviderFixture.resolve_results],
]) {
  const validate = ajv.getSchema(`https://morethan.local/contracts/${schemaName}.schema.json`);
  if (!validate || values.some((value) => !validate(value))) {
    throw new Error(`subject-context provider fixture failed ${schemaName}: ${JSON.stringify(validate?.errors)}`);
  }
}

const semanticPresentationFixture = JSON.parse(await readFile(
  new URL("../fixtures/scenario-semantic-presentation.valid.json", import.meta.url),
  "utf8",
));
for (const [schemaName, values] of [
  ["scenario-present-subject-context-input-v1", [semanticPresentationFixture.input]],
  ["scenario-semantic-block-v1", semanticPresentationFixture.presentation.blocks],
  ["scenario-navigation-offer-v1", semanticPresentationFixture.presentation.navigation],
  ["scenario-action-offer-v1", semanticPresentationFixture.presentation.actions],
  ["scenario-semantic-presentation-v1", [semanticPresentationFixture.presentation]],
  ["scenario-presentation-result-v1", [
    { status: "ready", presentation: semanticPresentationFixture.presentation },
  ]],
]) {
  const validate = ajv.getSchema(`https://morethan.local/contracts/${schemaName}.schema.json`);
  if (!validate || values.some((value) => !validate(value))) {
    throw new Error(`semantic presentation fixture failed ${schemaName}: ${JSON.stringify(validate?.errors)}`);
  }
}

for (const [schemaName, fixtureName] of [
  ["scenario-owner-binding-reservation-request-v1", "scenario-owner-binding-reservation-request.valid.json"],
  ["scenario-owner-binding-reservation-result-v1", "scenario-owner-binding-reservation-result.valid.json"],
]) {
  const fixture = JSON.parse(await readFile(new URL(`../fixtures/${fixtureName}`, import.meta.url), "utf8"));
  const validate = ajv.getSchema(`https://morethan.local/contracts/${schemaName}.schema.json`);
  if (!validate || !validate(fixture)) {
    throw new Error(`${fixtureName} failed schema execution: ${JSON.stringify(validate?.errors)}`);
  }
}

const bindingPairFixture = JSON.parse(await readFile(
  new URL("../fixtures/scenario-canonical-binding-pair.valid.json", import.meta.url),
  "utf8",
));
for (const [schemaName, value] of [
  ["scenario-canonical-binding-pair-request-v1", bindingPairFixture.request],
  ["scenario-canonical-binding-pair-result-v1", bindingPairFixture.result],
]) {
  const validate = ajv.getSchema(`https://morethan.local/contracts/${schemaName}.schema.json`);
  if (!validate || !validate(value)) {
    throw new Error(`binding pair fixture failed ${schemaName}: ${JSON.stringify(validate?.errors)}`);
  }
}

const currentOwnerStatusFixture = JSON.parse(await readFile(
  new URL("../fixtures/scenario-current-owner-status.valid.json", import.meta.url),
  "utf8",
));
for (const [schemaName, values] of [
  ["scenario-current-owner-binding-pair-evidence-v1", [currentOwnerStatusFixture.current_evidence]],
  ["scenario-identity-operation-status-lookup-request-v1", [currentOwnerStatusFixture.status_request]],
  ["scenario-identity-operation-status-lookup-result-v1", currentOwnerStatusFixture.status_results],
]) {
  const validate = ajv.getSchema(`https://morethan.local/contracts/${schemaName}.schema.json`);
  if (!validate || values.some((value) => !validate(value))) {
    throw new Error(`current owner/status fixture failed ${schemaName}: ${JSON.stringify(validate?.errors)}`);
  }
}

const protectedInteractionFixture = JSON.parse(await readFile(
  new URL("../fixtures/scenario-protected-interaction-e1.valid.json", import.meta.url),
  "utf8",
));
for (const [schemaName, values] of [
  ["scenario-protected-interaction-contract-v1", [protectedInteractionFixture.contract]],
  ["scenario-protected-plain-text-carrier-v1", [protectedInteractionFixture.carrier]],
  ["scenario-protected-carrier-binding-v1", [
    protectedInteractionFixture.prepare_binding,
    protectedInteractionFixture.read_binding,
  ]],
]) {
  const validate = ajv.getSchema(`https://morethan.local/contracts/${schemaName}.schema.json`);
  if (!validate || values.some((value) => !validate(value))) {
    throw new Error(`protected-interaction E1 fixture failed ${schemaName}: ${JSON.stringify(validate?.errors)}`);
  }
}

const protectedPrepareFixture = JSON.parse(await readFile(
  new URL("../fixtures/scenario-protected-interaction-e2.valid.json", import.meta.url),
  "utf8",
));
for (const [schemaName, values] of [
  ["prepare-scenario-protected-interaction-input-v1", [protectedPrepareFixture.input]],
  ["scenario-prepared-protected-content-control-v1", [
    protectedPrepareFixture.results[0].prepared_content,
  ]],
  ["prepare-scenario-protected-interaction-result-v1", protectedPrepareFixture.results],
]) {
  const validate = ajv.getSchema(`https://morethan.local/contracts/${schemaName}.schema.json`);
  if (!validate || values.some((value) => !validate(value))) {
    throw new Error(`protected-interaction E2 fixture failed ${schemaName}: ${JSON.stringify(validate?.errors)}`);
  }
}

const protectedCommitFixture = JSON.parse(await readFile(
  new URL("../fixtures/scenario-protected-interaction-e3.valid.json", import.meta.url),
  "utf8",
));
{
  const validate = ajv.getSchema(
    "https://morethan.local/contracts/scenario-committed-protected-content-control-v1.schema.json",
  );
  if (!validate || !validate(protectedCommitFixture.committed_content)) {
    throw new Error(`protected-interaction E3 fixture failed committed control: ${JSON.stringify(validate?.errors)}`);
  }
}

const protectedReadFixture = JSON.parse(await readFile(
  new URL("../fixtures/scenario-protected-interaction-e4.valid.json", import.meta.url),
  "utf8",
));
for (const [schemaName, values] of [
  ["scenario-protected-content-read-locator-v1", [protectedReadFixture.locator]],
  ["read-scenario-protected-detail-input-v1", [protectedReadFixture.input]],
  ["scenario-protected-display-lease-v1", [protectedReadFixture.results[0].display_lease]],
  ["read-scenario-protected-detail-result-v1", protectedReadFixture.results],
]) {
  const validate = ajv.getSchema(`https://morethan.local/contracts/${schemaName}.schema.json`);
  if (!validate || values.some((value) => !validate(value))) {
    throw new Error(`protected-interaction E4 fixture failed ${schemaName}: ${JSON.stringify(validate?.errors)}`);
  }
}

const receipt = JSON.parse(await readFile(new URL("scenario-command-receipt-v1.schema.json", schemaRoot), "utf8"));
if (!receipt.required.includes("workflow_step_ref")) throw new Error("receipt must bind the exact workflow step identity");

const manifest = JSON.parse(await readFile(new URL("scenario-manifest-v2.schema.json", schemaRoot), "utf8"));
if (manifest.properties.capabilities.items.properties.enablement_policy.enum.join(",") !== "requires_workspace_activation,disabled") {
  throw new Error("manifest capability policy must be closed and Host-activation restrictive");
}
if (manifest.properties.scenario_record.properties.required_status.enum.includes("pilot")) {
  throw new Error("pilot must be represented by canary activation, not Scenario lifecycle");
}
if (
  manifest.properties.scenario_data.additionalProperties !== false ||
  manifest.properties.capabilities.items.properties.entrypoints.items.additionalProperties !== false ||
  manifest.$defs.eventRegistry.additionalProperties !== false
) {
  throw new Error("manifest nested release structures must reject unknown fields");
}

process.stdout.write(`federation schema package ok: ${expected.length} schemas\n`);
