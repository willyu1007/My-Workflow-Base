import { existsSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "../..");

// Scan only the new public contract and its reference validator. Fixtures and task
// documentation intentionally contain forbidden examples and are not public DTOs.
const publicBatchSources = [
  "templates/host-runtime/packages/workflow-contracts/src/types/batch-execution-control.ts",
  "templates/host-runtime/packages/workflow-runtime/src/validation/validate-batch-execution-control.ts",
];

const forbiddenVocabulary = [
  ["authorization material", /\b(?:authorization|authentication)\b/i],
  ["credential", /\bcredentials?\b/i],
  ["password", /\bpasswords?\b/i],
  ["private key", /\bprivate(?:[_ -]?key|Key)s?\b/i],
  ["secret", /\bsecrets?\b/i],
  ["bearer material", /\bbearer\b/i],
  [
    "token field",
    /\b[A-Za-z][A-Za-z0-9]*(?:Token|_token)\b|\btokens?\s*[?:]|["']tokens?["']/i,
  ],
  ["API key", /\bapi(?:[_ -]?key|Key)s?\b/i],
  ["access key", /\baccess(?:[_ -]?key|Key)s?\b/i],
  ["session", /\bsessions?\b/i],
  ["cookie", /\bcookies?\b/i],
  ["endpoint", /\bendpoints?\b/i],
  ["URL", /\b(?:callback|service|transport)?(?:[_-]?url|Url)s?\b/],
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
          `${relative(repositoryRoot, absolutePath)}:${lineIndex + 1}: forbidden ${label}`,
        );
      }
    }
  }
}

if (findings.length > 0) {
  throw new Error(`batch execution-control secret boundary failed:\n${findings.join("\n")}`);
}

console.log(
  `batch execution-control secret boundary ok: ${publicBatchSources.length} public sources`,
);
