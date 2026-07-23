import { existsSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "../..");

// Keep this list deliberately narrow. Negative fixtures and task documentation must
// be free to name forbidden fields while proving that the public boundary rejects them.
const publicBatchSources = [
  "templates/host-runtime/packages/workflow-contracts/src/types/batch-execution-control.ts",
  "templates/host-runtime/packages/workflow-runtime/src/validation/validate-batch-execution-control.ts",
];

const forbiddenVocabulary = [
  ["Education product", /\beducation\b/i],
  ["Nurture product", /\bnurture\b/i],
  ["template family", /\btemplate(?:[_-]?family|Family)\b/i],
  ["question", /\bquestions?\b/i],
  ["assignment", /\bassignments?\b/i],
  ["reviewer", /\breviewers?\b/i],
  ["packet", /\bpackets?\b/i],
  ["lane", /\blanes?\b/i],
  ["learner", /\blearners?\b/i],
  ["student", /\bstudents?\b/i],
  ["child", /\b(?:child|children)\b/i],
  ["corpus", /\bcorpus\b/i],
  ["teacher", /\bteachers?\b/i],
  ["parent", /\bparents?\b/i],
  ["school", /\bschools?\b/i],
  ["rubric", /\brubrics?\b/i],
  ["Q2/Q4 phase", /\bq[24]\b/i],
  ["lifecycle credit", /\blifecycle(?:[_ -]?credit|Credit)\b/i],
  ["production credit", /\bproduction(?:[_ -]?credit|Credit)\b/i],
  ["scenario profile discriminator", /\btemplate_family_batch_controller\b/i],
];

const findings = [];

for (const sourcePath of publicBatchSources) {
  const absolutePath = resolve(repositoryRoot, sourcePath);
  if (!existsSync(absolutePath)) {
    findings.push(`${sourcePath}: missing required public batch source`);
    continue;
  }

  const lines = readFileSync(absolutePath, "utf8").split(/\r?\n/);
  for (const [lineIndex, line] of lines.entries()) {
    for (const [label, pattern] of forbiddenVocabulary) {
      if (pattern.test(line)) {
        findings.push(
          `${relative(repositoryRoot, absolutePath)}:${lineIndex + 1}: forbidden ${label} vocabulary`,
        );
      }
    }
  }
}

if (findings.length > 0) {
  throw new Error(`batch execution-control scenario boundary failed:\n${findings.join("\n")}`);
}

console.log(
  `batch execution-control scenario boundary ok: ${publicBatchSources.length} public sources`,
);
