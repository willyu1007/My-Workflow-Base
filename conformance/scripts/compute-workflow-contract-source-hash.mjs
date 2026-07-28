import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "../..");

function optionValue(name, fallback) {
  const optionIndex = process.argv.indexOf(name);
  if (optionIndex < 0) {
    return fallback;
  }
  const value = process.argv[optionIndex + 1];
  if (!value) {
    throw new Error(`${name} requires a path`);
  }
  return resolve(process.cwd(), value);
}

const sourceRoots = [
  {
    logicalRoot: "workflow-contracts",
    physicalRoot: optionValue(
      "--contracts-root",
      join(repositoryRoot, "templates/host-runtime/packages/workflow-contracts/src"),
    ),
  },
  {
    logicalRoot: "workflow-validator",
    physicalRoot: optionValue(
      "--validator-root",
      join(repositoryRoot, "templates/host-runtime/packages/workflow-runtime/src/validation"),
    ),
  },
];

const schemaVersion = 1;
const algorithm = "sha256";
const normalization = "utf8_lf_workflow_contracts_import_alias_path_nul_length_nul_content_nul_v1";

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => {
      const path = join(directory, entry.name);
      if (entry.isSymbolicLink()) {
        throw new Error(`contract source hash does not accept symbolic links: ${path}`);
      }
      if (entry.isDirectory()) {
        return sourceFiles(path);
      }
      return entry.isFile() && entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")
        ? [path]
        : [];
    });
}

function normalizedSource(file, logicalRoot) {
  let source = readFileSync(file, "utf8").replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  if (logicalRoot === "workflow-validator") {
    source = source.replace(
      /(\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|\bimport\s*)(["'])@(host|my-chat)\/workflow-contracts\2/g,
      '$1"@workflow-contracts"',
    );

    if (/(["'])@(host|my-chat)\/workflow-contracts\1/.test(source)) {
      throw new Error(
        `workflow-contracts alias appears outside a supported module specifier: ${file}`,
      );
    }
  }
  return Buffer.from(source, "utf8");
}

function logicalPath(root, file) {
  const suffix = relative(root.physicalRoot, file).split(sep).join("/");
  return `${root.logicalRoot}/${suffix}`;
}

function computeManifest() {
  const files = sourceRoots
    .flatMap((root) =>
      sourceFiles(root.physicalRoot).map((file) => {
        const content = normalizedSource(file, root.logicalRoot);
        return {
          path: logicalPath(root, file),
          bytes: content.length,
          sha256: createHash(algorithm).update(content).digest("hex"),
          content,
        };
      }),
    )
    .sort((left, right) => left.path.localeCompare(right.path));

  const aggregate = createHash(algorithm);
  for (const file of files) {
    aggregate.update(file.path, "utf8");
    aggregate.update("\0", "utf8");
    aggregate.update(String(file.bytes), "utf8");
    aggregate.update("\0", "utf8");
    aggregate.update(file.content);
    aggregate.update("\0", "utf8");
  }

  return {
    schema_version: schemaVersion,
    algorithm,
    normalization,
    logical_roots: sourceRoots.map((root) => root.logicalRoot),
    source_hash: aggregate.digest("hex"),
    files: files.map(({ path, bytes, sha256 }) => ({ path, bytes, sha256 })),
  };
}

function assertLock(expected, actual, lockPath) {
  const fields = ["schema_version", "algorithm", "normalization", "logical_roots", "source_hash", "files"];
  for (const field of fields) {
    if (JSON.stringify(expected[field]) !== JSON.stringify(actual[field])) {
      throw new Error(`workflow contract source lock mismatch for ${field}: ${lockPath}`);
    }
  }

  if (!/^[a-f0-9]{40}$/.test(expected.contract_source_revision ?? "")) {
    throw new Error(`workflow contract source lock has no full contract_source_revision: ${lockPath}`);
  }

  const resolvedRevision = execFileSync(
    "git",
    ["rev-parse", "--verify", `${expected.contract_source_revision}^{commit}`],
    { cwd: repositoryRoot, encoding: "utf8" },
  ).trim();
  if (resolvedRevision !== expected.contract_source_revision) {
    throw new Error(`workflow contract source revision is not an exact reachable commit: ${lockPath}`);
  }

  for (const root of sourceRoots) {
    for (const file of sourceFiles(root.physicalRoot)) {
      const suffix = relative(root.physicalRoot, file).split(sep).join("/");
      const repositoryPath = root.logicalRoot === "workflow-contracts"
        ? `templates/host-runtime/packages/workflow-contracts/src/${suffix}`
        : `templates/host-runtime/packages/workflow-runtime/src/validation/${suffix}`;
      const committedSource = execFileSync(
        "git",
        ["show", `${expected.contract_source_revision}:${repositoryPath}`],
        { cwd: repositoryRoot, encoding: "utf8" },
      ).replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
      const currentSource = readFileSync(file, "utf8")
        .replace(/^\uFEFF/, "")
        .replace(/\r\n?/g, "\n");
      if (committedSource !== currentSource) {
        throw new Error(
          `workflow contract source revision does not contain current ${repositoryPath}: ${lockPath}`,
        );
      }
    }
  }
}

const manifest = computeManifest();
const checkIndex = process.argv.indexOf("--check");

if (checkIndex >= 0) {
  const lockArgument = process.argv[checkIndex + 1];
  if (!lockArgument) {
    throw new Error("--check requires a lock-file path");
  }
  const lockPath = resolve(repositoryRoot, lockArgument);
  const expected = JSON.parse(readFileSync(lockPath, "utf8"));
  assertLock(expected, manifest, lockPath);
  console.log(`workflow contract source lock ok: ${manifest.source_hash}`);
} else {
  console.log(JSON.stringify(manifest, null, 2));
}
