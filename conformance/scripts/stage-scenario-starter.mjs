#!/usr/bin/env node

import { existsSync } from "node:fs";
import { cp, rename, rm } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const conformanceRoot = resolve(scriptDirectory, "..");
const sourceTemplateRoot = resolve(
  conformanceRoot,
  "../templates/scenario-module",
);
const bundledTemplateRoot = resolve(conformanceRoot, "starter-template");
const excludedNames = new Set([
  ".typecheck-dist",
  "dist",
  "node_modules",
]);

export async function stageScenarioStarter(
  sourceRoot = sourceTemplateRoot,
  targetRoot = bundledTemplateRoot,
) {
  const source = resolve(sourceRoot);
  const target = resolve(targetRoot);
  if (!existsSync(source)) {
    throw new Error(`scenario Starter source is missing: ${source}`);
  }
  if (target === source || !target.startsWith(`${resolve(target, "..")}/`)) {
    throw new Error(`unsafe scenario Starter staging target: ${target}`);
  }

  await rm(target, { recursive: true, force: true });
  await cp(source, target, {
    recursive: true,
    filter: (path) => !excludedNames.has(basename(path)),
  });
  await rename(
    resolve(target, ".gitignore"),
    resolve(target, "gitignore.template"),
  );
  await rename(
    resolve(target, ".github"),
    resolve(target, "github-template"),
  );
}

export async function cleanStagedScenarioStarter(
  targetRoot = bundledTemplateRoot,
) {
  const target = resolve(targetRoot);
  if (target === "/" || target === resolve(target, "..")) {
    throw new Error(`unsafe scenario Starter cleanup target: ${target}`);
  }
  await rm(target, { recursive: true, force: true });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--clean")) {
    await cleanStagedScenarioStarter();
  } else {
    await stageScenarioStarter();
  }
}
