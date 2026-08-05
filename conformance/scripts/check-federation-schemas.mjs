import { readFile, readdir } from "node:fs/promises";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const schemaRoot = new URL("../../templates/host-runtime/packages/workflow-contracts/schemas/", import.meta.url);
const expected = [
  "canonical-ref-v1.schema.json",
  "generation-ticket-v1.schema.json",
  "integration-lock-v3.schema.json",
  "scenario-command-envelope-v1.schema.json",
  "scenario-command-receipt-v1.schema.json",
  "scenario-contract-release-v1.schema.json",
  "scenario-event-envelope-v1.schema.json",
  "scenario-human-principal-v1.schema.json",
  "scenario-ingress-surface-v1.schema.json",
  "scenario-manifest-v2.schema.json",
  "scenario-private-invocation-v1.schema.json",
  "scenario-workspace-activation-v1.schema.json",
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
