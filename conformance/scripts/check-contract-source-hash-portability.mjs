import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "../..");
const temporaryRoot = mkdtempSync(join(tmpdir(), "workflow-contract-source-hash-"));

function computeManifest(contractsRoot, validatorRoot) {
  const output = execFileSync(
    process.execPath,
    [
      join(scriptDirectory, "compute-workflow-contract-source-hash.mjs"),
      "--contracts-root",
      contractsRoot,
      "--validator-root",
      validatorRoot,
    ],
    { cwd: repositoryRoot, encoding: "utf8" },
  );
  return JSON.parse(output);
}

function typescriptSourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return typescriptSourceFiles(path);
    }
    return entry.isFile() && entry.name.endsWith(".ts") ? [path] : [];
  });
}

function rewriteWithBomAndCrlf(file) {
  const source = readFileSync(file, "utf8").replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  writeFileSync(file, `\uFEFF${source.replace(/\n/g, "\r\n")}`, "utf8");
}

try {
  const contractsRoot = join(temporaryRoot, "copied-contracts");
  const validatorRoot = join(temporaryRoot, "renamed-host-validator");
  cpSync(
    join(repositoryRoot, "templates/host-runtime/packages/workflow-contracts/src"),
    contractsRoot,
    { recursive: true },
  );
  cpSync(
    join(repositoryRoot, "templates/host-runtime/packages/workflow-runtime/src/validation"),
    validatorRoot,
    { recursive: true },
  );

  const validatorFile = join(validatorRoot, "validate-module.ts");
  const baseSource = readFileSync(validatorFile, "utf8");
  const myChatSource = baseSource.replace(
    '"@host/workflow-contracts"',
    '"@my-chat/workflow-contracts"',
  );
  if (myChatSource === baseSource) {
    throw new Error("validator fixture no longer contains the expected @host import alias");
  }
  writeFileSync(validatorFile, myChatSource, "utf8");

  for (const sourceFile of [
    ...typescriptSourceFiles(contractsRoot),
    ...typescriptSourceFiles(validatorRoot),
  ]) {
    rewriteWithBomAndCrlf(sourceFile);
  }

  const actual = computeManifest(contractsRoot, validatorRoot);
  const expected = JSON.parse(
    readFileSync(join(repositoryRoot, "conformance/workflow-contract-source-lock.json"), "utf8"),
  );

  if (actual.source_hash !== expected.source_hash || JSON.stringify(actual.files) !== JSON.stringify(expected.files)) {
    throw new Error("workflow contract source hash is not portable across host paths/import aliases");
  }

  const unexpectedAliasSource = myChatSource.replace(
    '"@my-chat/workflow-contracts"',
    '"@unexpected/workflow-contracts"',
  );
  if (unexpectedAliasSource === myChatSource) {
    throw new Error("validator fixture no longer contains the expected @my-chat import alias");
  }
  writeFileSync(validatorFile, unexpectedAliasSource, "utf8");
  const unexpectedAliasManifest = computeManifest(contractsRoot, validatorRoot);
  if (unexpectedAliasManifest.source_hash === expected.source_hash) {
    throw new Error("an unexpected workflow-contracts import alias did not change the source hash");
  }

  console.log(`workflow contract source hash portability ok: ${actual.source_hash}`);
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}
