import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "../..");

function read(relativePath) {
  return readFileSync(join(repositoryRoot, relativePath), "utf8");
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function assertEqual(label, actual, expected) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${label} drifted\nactual: ${JSON.stringify(actual)}\nexpected: ${JSON.stringify(expected)}`,
    );
  }
}

const validatorSource = read(
  "templates/host-runtime/packages/workflow-runtime/src/validation/validate-module.ts",
);
const moduleContract = read("docs/context/workflow/module-contract.md");
const readinessChecklist = read("docs/context/workflow/v0-readiness-checklist.md");
const implementationSkeleton = read("docs/context/workflow/implementation-skeleton.md");
const scenarioTemplateReadme = read("templates/scenario-module/README.md");
const moduleTypeSource = read(
  "templates/host-runtime/packages/workflow-contracts/src/types/module.ts",
);
const materializationWorker = read(
  "templates/host-runtime/packages/workflow-runtime/src/workers/workflow-worker.materialization-v1.example.ts",
);

const inventoryMatch = moduleContract.match(
  /<!-- VALIDATOR-RULE-INVENTORY:START -->([\s\S]*?)<!-- VALIDATOR-RULE-INVENTORY:END -->/,
);
if (!inventoryMatch) {
  throw new Error("module contract is missing the validator rule inventory markers");
}

const sourceRuleIds = uniqueSorted(
  [...validatorSource.matchAll(/rule_id:\s*"(WF-MAN-\d{3})"/g)].map((match) => match[1]),
);
const documentedRuleIds = uniqueSorted(
  [...inventoryMatch[1].matchAll(/`(WF-MAN-\d{3})`/g)].map((match) => match[1]),
);
assertEqual("validator rule inventory", documentedRuleIds, sourceRuleIds);

function extractModuleType(source, label) {
  const match = source.match(/export type WorkflowScenarioModule = \{[\s\S]*?\n\};/);
  if (!match) {
    throw new Error(`${label} is missing WorkflowScenarioModule`);
  }
  return match[0].replace(/\s+/g, " ").trim();
}

assertEqual(
  "documented WorkflowScenarioModule",
  extractModuleType(moduleContract, "module contract"),
  extractModuleType(moduleTypeSource, "contract source"),
);

for (const [label, source] of [
  ["module contract", moduleContract],
  ["readiness checklist", readinessChecklist],
]) {
  if (/WF-LOAD-\d{3}/.test(source)) {
    throw new Error(`${label} allocates a loader rule id that the loader does not emit`);
  }
}

for (const [label, source] of [
  ["implementation skeleton", implementationSkeleton],
  ["scenario template README", scenarioTemplateReadme],
]) {
  if (/scenarios\/<scenario_key>|src\/<scenario>/.test(source)) {
    throw new Error(`${label} still documents the retired scenario directory layout`);
  }
  if (!source.includes("packages/<scenario-key>-scenario/")) {
    throw new Error(`${label} is missing the normative scenario package layout`);
  }
}

for (const token of [
  "WorkflowRuntimePortMaterializationV1",
  "completion_contract_version: 1",
  "claim_token: lease.claim_token",
  "handoff_drafts: result.handoff_drafts",
]) {
  if (!materializationWorker.includes(token)) {
    throw new Error(`materialization-v1 worker example is missing ${token}`);
  }
}

console.log("contract documentation alignment conformance ok");
