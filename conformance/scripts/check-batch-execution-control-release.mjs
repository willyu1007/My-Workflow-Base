import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "../..");
const releasePath = resolve(
  repositoryRoot,
  "conformance/workflow-batch-execution-control-release.json",
);

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function assertExactKeys(value, expectedKeys, description) {
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${description} keys do not match the release schema`);
  }
}

const release = readJson(releasePath);
assertExactKeys(
  release,
  [
    "schema_version",
    "capability_family",
    "capability_version",
    "contract_source_revision",
    "contract_source_hash",
    "source_lock_path",
    "canonicalization_profile",
    "vector_file",
    "vector_release_hash",
  ],
  "batch execution-control release",
);

if (release.schema_version !== 1) {
  throw new Error("batch execution-control release schema_version must be 1");
}
if (release.capability_family !== "workflow_batch_execution_control_v1") {
  throw new Error("batch execution-control release capability family mismatch");
}
if (release.capability_version !== 1) {
  throw new Error("batch execution-control release capability version mismatch");
}
if (!/^[a-f0-9]{40}$/.test(release.contract_source_revision)) {
  throw new Error("batch execution-control release requires a full contract source revision");
}
if (!/^[a-f0-9]{64}$/.test(release.contract_source_hash)) {
  throw new Error("batch execution-control release requires a SHA-256 contract source hash");
}
if (release.canonicalization_profile !== "rfc8785_jcs_sha256_v1") {
  throw new Error("batch execution-control canonicalization profile mismatch");
}

const sourceLock = readJson(resolve(repositoryRoot, release.source_lock_path));
if (sourceLock.contract_source_revision !== release.contract_source_revision) {
  throw new Error("release contract revision does not match the aggregate source lock");
}
if (sourceLock.source_hash !== release.contract_source_hash) {
  throw new Error("release contract source hash does not match the aggregate source lock");
}

const vectorBytes = readFileSync(resolve(repositoryRoot, release.vector_file));
const vectorHash = createHash("sha256").update(vectorBytes).digest("hex");
if (vectorHash !== release.vector_release_hash) {
  throw new Error("release vector hash does not match the canonical vector file bytes");
}
const vectors = JSON.parse(vectorBytes.toString("utf8"));
if (vectors.canonicalization_profile !== release.canonicalization_profile) {
  throw new Error("release canonicalization profile does not match the vector file");
}

console.log(
  `batch execution-control release ok: ${release.contract_source_revision} ${release.contract_source_hash} ${vectorHash}`,
);
