import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "../..");

function optionValue(name, fallback) {
  const optionIndex = process.argv.indexOf(name);
  if (optionIndex < 0) return fallback;
  const value = process.argv[optionIndex + 1];
  if (!value) throw new Error(`${name} requires a path`);
  return resolve(process.cwd(), value);
}

const aggregateRoots = [
  {
    logicalRoot: "workflow-contracts",
    repositoryRoot: "templates/host-runtime/packages/workflow-contracts/src",
    physicalRoot: optionValue(
      "--contracts-root",
      join(repositoryRoot, "templates/host-runtime/packages/workflow-contracts/src"),
    ),
  },
  {
    logicalRoot: "workflow-validator",
    repositoryRoot: "templates/host-runtime/packages/workflow-runtime/src/validation",
    physicalRoot: optionValue(
      "--validator-root",
      join(repositoryRoot, "templates/host-runtime/packages/workflow-runtime/src/validation"),
    ),
  },
];
const schemaRoot = {
  logicalRoot: "workflow-contract-schemas",
  repositoryRoot: "templates/host-runtime/packages/workflow-contracts/schemas",
  physicalRoot: optionValue(
    "--schemas-root",
    join(repositoryRoot, "templates/host-runtime/packages/workflow-contracts/schemas"),
  ),
};
const allRoots = [...aggregateRoots, schemaRoot];

const schemaVersion = 2;
const algorithm = "sha256";
const normalization = "utf8_lf_workflow_contracts_import_alias_path_nul_length_nul_content_nul_v1";

const commonProfilePaths = [
  "workflow-contracts/types/manifest.ts",
  "workflow-contracts/types/scenario-release.ts",
  "workflow-contracts/types/validation.ts",
  "workflow-contract-schemas/scenario-manifest-v2.schema.json",
  "workflow-validator/validate-module.ts",
];
const coreContractPaths = [
  "workflow-contracts/types/federation-validation.ts",
  "workflow-contracts/types/federation.ts",
  "workflow-contracts/types/identity.ts",
];
const invocationContractPaths = [
  "workflow-contracts/types/scenario-invocation-validation.ts",
  "workflow-contracts/types/scenario-invocation.ts",
  "workflow-contract-schemas/canonical-ref-v1.schema.json",
  "workflow-contract-schemas/scenario-human-principal-v1.schema.json",
  "workflow-contract-schemas/scenario-ingress-surface-v1.schema.json",
  "workflow-contract-schemas/scenario-private-invocation-v1.schema.json",
];
const bindingContractPaths = [
  "workflow-contracts/types/scenario-binding-validation.ts",
  "workflow-contracts/types/scenario-binding.ts",
  "workflow-contract-schemas/scenario-canonical-binding-expected-head-v1.schema.json",
  "workflow-contract-schemas/scenario-canonical-binding-intent-v1.schema.json",
  "workflow-contract-schemas/scenario-canonical-binding-pair-request-v1.schema.json",
  "workflow-contract-schemas/scenario-canonical-binding-pair-result-v1.schema.json",
  "workflow-contract-schemas/scenario-canonical-binding-result-item-v1.schema.json",
  "workflow-contract-schemas/scenario-current-owner-binding-pair-evidence-v1.schema.json",
  "workflow-contract-schemas/scenario-identity-operation-status-lookup-request-v1.schema.json",
  "workflow-contract-schemas/scenario-identity-operation-status-lookup-result-v1.schema.json",
  "workflow-contract-schemas/scenario-owner-binding-ref-v1.schema.json",
  "workflow-contract-schemas/scenario-owner-binding-reservation-request-v1.schema.json",
  "workflow-contract-schemas/scenario-owner-binding-reservation-result-v1.schema.json",
];
const presentationContractPaths = [
  "workflow-contracts/types/scenario-presentation-validation.ts",
  "workflow-contracts/types/scenario-presentation.ts",
  "workflow-contract-schemas/scenario-action-offer-v1.schema.json",
  "workflow-contract-schemas/scenario-list-subject-contexts-input-v1.schema.json",
  "workflow-contract-schemas/scenario-list-subject-contexts-result-v1.schema.json",
  "workflow-contract-schemas/scenario-navigation-offer-v1.schema.json",
  "workflow-contract-schemas/scenario-present-subject-context-input-v1.schema.json",
  "workflow-contract-schemas/scenario-presentation-result-v1.schema.json",
  "workflow-contract-schemas/scenario-resolve-subject-context-input-v1.schema.json",
  "workflow-contract-schemas/scenario-resolve-subject-context-result-v1.schema.json",
  "workflow-contract-schemas/scenario-safe-reason-v1.schema.json",
  "workflow-contract-schemas/scenario-safe-text-v1.schema.json",
  "workflow-contract-schemas/scenario-semantic-block-v1.schema.json",
  "workflow-contract-schemas/scenario-semantic-presentation-v1.schema.json",
  "workflow-contract-schemas/scenario-subject-context-option-v1.schema.json",
];
const actionContractPaths = [
  "workflow-contracts/types/handoff.ts",
  "workflow-contracts/types/scenario-domain-action-validation.ts",
  "workflow-contracts/types/scenario-domain-action.ts",
  "workflow-contract-schemas/bind-scenario-domain-action-step-input-v1.schema.json",
  "workflow-contract-schemas/bind-scenario-domain-action-step-result-v1.schema.json",
  "workflow-contract-schemas/lookup-scenario-domain-action-step-binding-input-v1.schema.json",
  "workflow-contract-schemas/lookup-scenario-domain-action-step-binding-result-v1.schema.json",
  "workflow-contract-schemas/prepare-scenario-domain-action-input-v1.schema.json",
  "workflow-contract-schemas/prepare-scenario-domain-action-result-v1.schema.json",
  "workflow-contract-schemas/scenario-authentication-assurance-evidence-v1.schema.json",
  "workflow-contract-schemas/scenario-domain-action-claimed-step-assertion-v1.schema.json",
  "workflow-contract-schemas/scenario-domain-action-claimed-step-driver-v1.schema.json",
  "workflow-contract-schemas/scenario-domain-action-confirmation-prompt-v1.schema.json",
  "workflow-contract-schemas/scenario-domain-action-contract-v1.schema.json",
  "workflow-contract-schemas/scenario-domain-action-current-result-v1.schema.json",
  "workflow-contract-schemas/scenario-domain-action-effect-identity-input-v1.schema.json",
  "workflow-contract-schemas/scenario-domain-action-execution-binding-v1.schema.json",
  "workflow-contract-schemas/scenario-domain-action-execution-result-v1.schema.json",
  "workflow-contract-schemas/scenario-domain-action-submit-echo-v1.schema.json",
  "workflow-contract-schemas/scenario-domain-action-workflow-step-ref-v1.schema.json",
  "workflow-contract-schemas/submit-scenario-domain-action-input-v1.schema.json",
  "workflow-contract-schemas/submit-scenario-domain-action-result-v1.schema.json",
];
const protectedContractPaths = [
  "workflow-contracts/types/scenario-protected-interaction-validation.ts",
  "workflow-contracts/types/scenario-protected-interaction.ts",
  "workflow-contract-schemas/prepare-scenario-protected-interaction-input-v1.schema.json",
  "workflow-contract-schemas/prepare-scenario-protected-interaction-result-v1.schema.json",
  "workflow-contract-schemas/read-scenario-protected-detail-input-v1.schema.json",
  "workflow-contract-schemas/read-scenario-protected-detail-result-v1.schema.json",
  "workflow-contract-schemas/scenario-committed-protected-content-control-v1.schema.json",
  "workflow-contract-schemas/scenario-prepared-protected-content-control-v1.schema.json",
  "workflow-contract-schemas/scenario-protected-carrier-binding-v1.schema.json",
  "workflow-contract-schemas/scenario-protected-content-read-locator-v1.schema.json",
  "workflow-contract-schemas/scenario-protected-display-lease-v1.schema.json",
  "workflow-contract-schemas/scenario-protected-interaction-contract-v1.schema.json",
  "workflow-contract-schemas/scenario-protected-plain-text-carrier-v1.schema.json",
];

const uniqueSorted = (values) => [...new Set(values)].sort((left, right) =>
  left.localeCompare(right));
const profileDefinitions = [
  {
    source_identity: "platform_child_family_identity_source_v1",
    paths: uniqueSorted([
      ...commonProfilePaths,
      ...coreContractPaths,
      ...invocationContractPaths,
      ...bindingContractPaths,
    ]),
  },
  {
    source_identity: "scenario_interface_source_v1",
    paths: uniqueSorted([
      ...commonProfilePaths,
      ...coreContractPaths,
      ...invocationContractPaths,
      ...presentationContractPaths,
    ]),
  },
  {
    source_identity: "scenario_domain_action_source_v1",
    paths: uniqueSorted([
      ...commonProfilePaths,
      ...coreContractPaths,
      ...presentationContractPaths,
      ...actionContractPaths,
    ]),
  },
  {
    source_identity: "scenario_protected_interaction_source_v1",
    paths: uniqueSorted([
      ...commonProfilePaths,
      ...coreContractPaths,
      ...presentationContractPaths,
      ...actionContractPaths,
      ...protectedContractPaths,
    ]),
  },
];

function aggregateSourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => {
      const path = join(directory, entry.name);
      if (entry.isSymbolicLink()) {
        throw new Error(`contract source hash does not accept symbolic links: ${path}`);
      }
      if (entry.isDirectory()) return aggregateSourceFiles(path);
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

function resolveLogicalPath(path) {
  const root = allRoots.find((candidate) =>
    path.startsWith(`${candidate.logicalRoot}/`));
  if (!root) throw new Error(`unknown contract source logical root: ${path}`);
  const suffix = path.slice(root.logicalRoot.length + 1);
  const file = resolve(root.physicalRoot, suffix);
  const relativeFile = relative(root.physicalRoot, file);
  if (relativeFile.startsWith("..") || relativeFile.split(sep).includes("..")) {
    throw new Error(`contract source path escapes its logical root: ${path}`);
  }
  const stat = lstatSync(file);
  if (stat.isSymbolicLink() || !stat.isFile()) {
    throw new Error(`contract source profile requires a regular file: ${path}`);
  }
  return { root, file };
}

function fileRecord(path, root, file) {
  const content = normalizedSource(file, root.logicalRoot);
  return {
    path,
    bytes: content.length,
    sha256: createHash(algorithm).update(content).digest("hex"),
    content,
  };
}

function hashFileRecords(files) {
  const aggregate = createHash(algorithm);
  for (const file of files) {
    aggregate.update(file.path, "utf8");
    aggregate.update("\0", "utf8");
    aggregate.update(String(file.bytes), "utf8");
    aggregate.update("\0", "utf8");
    aggregate.update(file.content);
    aggregate.update("\0", "utf8");
  }
  return aggregate.digest("hex");
}

function publicFileRecords(files) {
  return files.map(({ path, bytes, sha256 }) => ({ path, bytes, sha256 }));
}

function computeManifest() {
  const files = aggregateRoots
    .flatMap((root) => aggregateSourceFiles(root.physicalRoot).map((file) =>
      fileRecord(logicalPath(root, file), root, file)))
    .sort((left, right) => left.path.localeCompare(right.path));
  const sourceProfiles = profileDefinitions.map((definition) => {
    const profileFiles = definition.paths.map((path) => {
      const { root, file } = resolveLogicalPath(path);
      return fileRecord(path, root, file);
    });
    return {
      source_identity: definition.source_identity,
      source_hash: hashFileRecords(profileFiles),
      files: publicFileRecords(profileFiles),
    };
  });
  return {
    schema_version: schemaVersion,
    algorithm,
    normalization,
    logical_roots: aggregateRoots.map((root) => root.logicalRoot),
    source_hash: hashFileRecords(files),
    files: publicFileRecords(files),
    source_profiles: sourceProfiles,
  };
}

function assertExactKeys(value, keys, label) {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label} has missing or unknown fields`);
  }
}

function assertLock(expected, actual, lockPath) {
  assertExactKeys(expected, [
    "schema_version", "algorithm", "normalization", "logical_roots", "source_hash",
    "files", "source_profiles", "contract_source_revision",
  ], "workflow contract source lock");
  const fields = [
    "schema_version", "algorithm", "normalization", "logical_roots", "source_hash",
    "files", "source_profiles",
  ];
  for (const field of fields) {
    if (JSON.stringify(expected[field]) !== JSON.stringify(actual[field])) {
      throw new Error(`workflow contract source lock mismatch for ${field}: ${lockPath}`);
    }
  }

  for (const [index, profile] of expected.source_profiles.entries()) {
    assertExactKeys(profile, ["source_identity", "source_hash", "files"], `source profile ${index}`);
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

  const lockedPaths = uniqueSorted([
    ...actual.files.map((file) => file.path),
    ...actual.source_profiles.flatMap((profile) => profile.files.map((file) => file.path)),
  ]);
  for (const path of lockedPaths) {
    const { root, file } = resolveLogicalPath(path);
    const repositoryPath = `${root.repositoryRoot}/${path.slice(root.logicalRoot.length + 1)}`;
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
  for (const repositoryPath of [
    "conformance/scripts/compute-workflow-contract-source-hash.mjs",
    "conformance/scripts/check-contract-source-hash-portability.mjs",
  ]) {
    const committedSource = execFileSync(
      "git",
      ["show", `${expected.contract_source_revision}:${repositoryPath}`],
      { cwd: repositoryRoot, encoding: "utf8" },
    ).replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
    const currentSource = readFileSync(join(repositoryRoot, repositoryPath), "utf8")
      .replace(/^\uFEFF/, "")
      .replace(/\r\n?/g, "\n");
    if (committedSource !== currentSource) {
      throw new Error(
        `workflow contract source revision does not contain current ${repositoryPath}: ${lockPath}`,
      );
    }
  }
}

const manifest = computeManifest();
const checkIndex = process.argv.indexOf("--check");
if (checkIndex >= 0) {
  const lockArgument = process.argv[checkIndex + 1];
  if (!lockArgument) throw new Error("--check requires a lock-file path");
  const lockPath = resolve(repositoryRoot, lockArgument);
  const expected = JSON.parse(readFileSync(lockPath, "utf8"));
  assertLock(expected, manifest, lockPath);
  console.log(`workflow contract source lock ok: ${manifest.source_hash}`);
} else {
  console.log(JSON.stringify(manifest, null, 2));
}
