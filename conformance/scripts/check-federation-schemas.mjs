import { readFile, readdir } from "node:fs/promises";

const schemaRoot = new URL("../../templates/host-runtime/packages/workflow-contracts/schemas/", import.meta.url);
const expected = [
  "canonical-ref-v1.schema.json",
  "generation-ticket-v1.schema.json",
  "integration-lock-v3.schema.json",
  "scenario-command-envelope-v1.schema.json",
  "scenario-command-receipt-v1.schema.json",
  "scenario-contract-release-v1.schema.json",
  "scenario-event-envelope-v1.schema.json",
  "scenario-manifest-v2.schema.json",
  "scenario-workspace-activation-v1.schema.json",
];

const actual = (await readdir(schemaRoot)).filter((name) => name.endsWith(".schema.json")).sort();
if (JSON.stringify(actual) !== JSON.stringify(expected)) {
  throw new Error(`federation schema package is incomplete: ${JSON.stringify(actual)}`);
}

for (const name of expected) {
  const schema = JSON.parse(await readFile(new URL(name, schemaRoot), "utf8"));
  if (schema.$schema !== "https://json-schema.org/draft/2020-12/schema" || typeof schema.$id !== "string") {
    throw new Error(`${name} is not a versioned JSON Schema 2020-12 contract`);
  }
  if (schema.additionalProperties !== false) {
    throw new Error(`${name} must reject unknown top-level fields`);
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
