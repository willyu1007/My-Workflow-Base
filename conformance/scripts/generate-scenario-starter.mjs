#!/usr/bin/env node

import {
  cp,
  mkdir,
  readFile,
  readdir,
  rename,
  stat,
  writeFile,
} from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "../..");
const templateRoot = resolve(repositoryRoot, "templates/scenario-module");

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  const key = process.argv[index];
  const value = process.argv[index + 1];
  if (!key?.startsWith("--") || !value) {
    throw new Error(
      "usage: generate-scenario-starter.mjs --target <empty-dir> --scenario-key <key> --package-name <name> [--host-sdk-spec <spec>] [--conformance-spec <spec>]",
    );
  }
  args.set(key, value);
}

const target = args.get("--target");
const scenarioKey = args.get("--scenario-key");
const packageName = args.get("--package-name");
const hostSdkSpec = args.get("--host-sdk-spec") ?? "^1.0.0";
const conformanceSpec = args.get("--conformance-spec") ?? "^1.0.0";

if (!target || !scenarioKey || !packageName) {
  throw new Error("target, scenario-key and package-name are required");
}
if (!/^[a-z][a-z0-9-]*$/u.test(scenarioKey)) {
  throw new Error("scenario-key must be canonical kebab-case");
}
if (!/^(?:@[a-z0-9-]+\/)?[a-z0-9-]+$/u.test(packageName)) {
  throw new Error("package-name must be a valid lowercase npm package name");
}

const targetRoot = resolve(target);
await mkdir(targetRoot, { recursive: true });
if ((await readdir(targetRoot)).length > 0) {
  throw new Error(`target directory must be empty: ${targetRoot}`);
}

const excludedNames = new Set(["dist", "node_modules", ".typecheck-dist"]);
await cp(templateRoot, targetRoot, {
  recursive: true,
  filter: (source) => {
    const name = basename(source);
    return !excludedNames.has(name) && !name.endsWith(".tsbuildinfo");
  },
});

const textExtensions = new Set([
  ".json",
  ".md",
  ".prisma",
  ".sql",
  ".ts",
  ".yaml",
  ".yml",
]);

const collectFiles = async (directory) => {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectFiles(path)));
    else if (entry.isFile()) files.push(path);
  }
  return files;
};

const extensionOf = (path) => {
  const match = /\.[^.]+$/u.exec(path);
  return match?.[0] ?? "";
};

for (const path of await collectFiles(targetRoot)) {
  if (!textExtensions.has(extensionOf(path))) continue;
  let content = await readFile(path, "utf8");
  content = content
    .replaceAll("@host/workflow-contracts", "@my-chat/workflow-contracts")
    .replaceAll("Generated-Scenario-Example", `Generated-Scenario-${scenarioKey}`)
    .replaceAll("^example\\.", `^${scenarioKey}\\.`)
    .replaceAll('"example"', JSON.stringify(scenarioKey))
    .replaceAll('"example.', `"${scenarioKey}.`)
    .replaceAll("example.", `${scenarioKey}.`)
    .replaceAll("example:record:", `${scenarioKey}:record:`)
    .replaceAll("scenario_key: example", `scenario_key: ${scenarioKey}`)
    .replaceAll("namespace: example", `namespace: ${scenarioKey}`)
    .replaceAll("/example/", `/${scenarioKey}/`);
  await writeFile(path, content, "utf8");
}

const packagePath = resolve(targetRoot, "package.json");
const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
packageJson.name = packageName;
delete packageJson.dependencies["@host/workflow-contracts"];
packageJson.dependencies["@my-chat/workflow-contracts"] = hostSdkSpec;
packageJson.devDependencies["@workflow-base/conformance"] = conformanceSpec;
packageJson.scripts["semantic-lint"] =
  "workflow-semantic-lint federation-descriptor.json";
packageJson.scripts["verify:integration-lock"] =
  `workflow-integration-lock integration-lock.${scenarioKey}.json`;
await writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");

await rename(
  resolve(targetRoot, "integration-lock.example.json"),
  resolve(targetRoot, `integration-lock.${scenarioKey}.json`),
);

const metadata = await stat(targetRoot);
if (!metadata.isDirectory()) throw new Error("generated target is not a directory");
process.stdout.write(
  `${JSON.stringify({ target: targetRoot, scenario_key: scenarioKey, package: packageName })}\n`,
);
