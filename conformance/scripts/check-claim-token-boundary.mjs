import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "../..");
const contractRoot = join(repositoryRoot, "templates/host-runtime/packages/workflow-contracts/src/types");
const runtimeRoot = join(repositoryRoot, "templates/host-runtime/packages/workflow-runtime/src");

function readTypeBlock(fileName, typeName) {
  const source = readFileSync(join(contractRoot, fileName), "utf8");
  const match = source.match(new RegExp(`export type ${typeName} =[\\s\\S]*?\\n};`));
  if (!match) {
    throw new Error(`claim-token boundary check could not find ${typeName} in ${fileName}`);
  }
  return match[0];
}

function assertTokenAbsent(fileName, typeName) {
  const typeBlock = readTypeBlock(fileName, typeName);
  if (/claimToken|claim_token/.test(typeBlock)) {
    throw new Error(`${typeName} must not retain or expose claim-token fields`);
  }
}

function assertTokenRequired(fileName, typeName, fieldName) {
  const typeBlock = readTypeBlock(fileName, typeName);
  if (!new RegExp(`${fieldName}: string`).test(typeBlock)) {
    throw new Error(`${typeName} must require ${fieldName} as transient claim evidence`);
  }
}

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return sourceFiles(path);
    }
    return entry.isFile() && entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts") ? [path] : [];
  });
}

assertTokenRequired("handoff.ts", "ScenarioCommandDriverContext", "claimToken");
assertTokenRequired("api.ts", "WorkflowCompleteStepMaterializationInputV1", "claim_token");

for (const [fileName, typeName] of [
  ["handoff.ts", "ScenarioHandoffRequestSnapshot"],
  ["handoff.ts", "WorkflowHandoffDraft"],
  ["handoff.ts", "MaterializedHandoff"],
  ["api.ts", "WorkflowStepMaterializationResultV1"],
]) {
  assertTokenAbsent(fileName, typeName);
}

const loggingCallWithClaimToken =
  /(?:console\.[a-z]+|logger(?:\.[a-z]+)?|metrics?(?:\.[a-z]+)?|tracer?(?:\.[a-z]+)?)[\s\S]{0,250}\bclaim(?:Token|_token)\b/i;

for (const file of sourceFiles(runtimeRoot)) {
  const source = readFileSync(file, "utf8");
  if (loggingCallWithClaimToken.test(source)) {
    throw new Error(`runtime source may log or measure claim-token evidence: ${file}`);
  }
}

console.log("claim-token boundary conformance ok");
