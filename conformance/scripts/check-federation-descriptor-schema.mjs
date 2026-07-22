import { readFile } from "node:fs/promises";

const schema = JSON.parse(
  await readFile(
    new URL("../schemas/federation-descriptor-v1.schema.json", import.meta.url),
    "utf8",
  ),
);

if (schema.$schema !== "https://json-schema.org/draft/2020-12/schema") {
  throw new Error("federation descriptor must use JSON Schema 2020-12");
}
if (schema.additionalProperties !== false) {
  throw new Error("federation descriptor must reject unknown top-level fields");
}
const roles = schema.properties?.role?.enum ?? [];
if (roles.join(",") !== "contract_owner,platform_host,scenario_owner") {
  throw new Error("federation descriptor role vocabulary drifted");
}
const scenarioBranch = schema.allOf?.[0];
if (!scenarioBranch?.then?.anyOf || !scenarioBranch?.else?.not) {
  throw new Error("federation descriptor must separate scenario manifests from non-scenario roles");
}

process.stdout.write("federation descriptor schema ok\n");
