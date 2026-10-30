import { readFile, readdir } from "node:fs/promises";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

// Production artifact integrity only; bounded behavior samples live in tests.
const root = new URL("../../templates/host-runtime/packages/workflow-contracts/schemas/", import.meta.url);
const names = (await readdir(root)).filter(name => name.endsWith(".schema.json"));
if (names.length === 0) throw new Error("No published workflow schemas found");
const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false });
addFormats(ajv);
const schemas = await Promise.all(names.map(async name => JSON.parse(await readFile(new URL(name, root), "utf8"))));
for (const schema of schemas) ajv.addSchema(schema);
for (const schema of schemas) {
  if (typeof schema.$id !== "string" || !ajv.getSchema(schema.$id)) throw new Error("Published schema failed compilation");
}
console.log(`Compiled ${schemas.length} published schemas with resolved references`);
