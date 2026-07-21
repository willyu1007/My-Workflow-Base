#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { lstat, readFile, readdir } from "node:fs/promises";
import { isAbsolute, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const failures = [];
const fail = (message) => failures.push(message);
const gitText = (repository, args) => execFileSync("git", ["-C", repository, ...args], { encoding: "utf8" }).trim();
const gitBytes = (repository, args) => execFileSync("git", ["-C", repository, ...args]);

const assertLogicalPath = (value) => {
  if (typeof value !== "string" || value.length === 0 || isAbsolute(value) || value.split(/[\\/]/u).includes("..")) {
    throw new Error(`unsafe logical path: ${String(value)}`);
  }
  return value.replaceAll("\\", "/").replace(/^\.\//u, "");
};

export const INTEGRATION_SOURCE_HASH_ALGORITHM = "sha256-path-content-source-hash-normalized-v1";
const lockKeys = new Set(["lock_version", "generated_at", "scenario_key", "qualification_mode", "base_contract", "host_sdk", "scenario_artifact"]);
const revisionKeys = new Set(["source", "repository", "revision", "package", "version", "artifact_path", "logical_paths", "hash_algorithm", "source_hash"]);

const normalizeDeclaredSourceHash = (path, content) => {
  if (!/\.(?:json|mjs|js|ts|yaml|yml)$/u.test(path)) return content;
  const text = content.toString("utf8")
    .replace(/("source_hash"\s*:\s*")[a-f0-9]{64}("?)/gu, `$1${"0".repeat(64)}$2`)
    .replace(/(source_hash:\s*)[a-f0-9]{64}/gu, `$1${"0".repeat(64)}`)
    .replace(/(SOURCE_HASH(?:_PLACEHOLDER)?\s*=\s*")[a-f0-9]{64}(")/gu, `$1${"0".repeat(64)}$2`);
  return Buffer.from(text, "utf8");
};

const digest = (files) => {
  const hash = createHash("sha256");
  for (const file of files.sort((left, right) => left.path.localeCompare(right.path))) {
    hash.update(file.path);
    hash.update("\0");
    hash.update(normalizeDeclaredSourceHash(file.path, file.content));
    hash.update("\0");
  }
  return hash.digest("hex");
};

export const hashGitObject = (repository, revision, logicalPaths) => {
  const safePaths = logicalPaths.map(assertLogicalPath);
  const output = gitText(repository, ["ls-tree", "-r", "--name-only", revision, "--", ...safePaths]);
  const paths = output.length === 0 ? [] : output.split("\n").filter(Boolean);
  if (paths.length === 0) throw new Error("logical paths resolve to no files at the pinned revision");
  return digest(paths.map((path) => ({ path, content: gitBytes(repository, ["show", `${revision}:${path}`]) })));
};

const collectPackageFiles = async (root, logicalPath) => {
  const safePath = assertLogicalPath(logicalPath);
  const absolute = resolve(root, safePath);
  const rootPrefix = `${resolve(root)}${sep}`;
  if (absolute !== resolve(root) && !absolute.startsWith(rootPrefix)) throw new Error(`logical path escapes artifact: ${safePath}`);
  const metadata = await lstat(absolute);
  if (metadata.isSymbolicLink()) throw new Error(`symlink is not a logical source: ${safePath}`);
  if (metadata.isFile()) return [{ path: safePath, content: await readFile(absolute) }];
  if (!metadata.isDirectory()) throw new Error(`unsupported logical source: ${safePath}`);
  const files = [];
  for (const entry of (await readdir(absolute, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    files.push(...await collectPackageFiles(root, `${safePath}/${entry.name}`));
  }
  return files;
};

export const hashPackageArtifact = async (artifactPath, logicalPaths) => {
  const root = resolve(artifactPath);
  const files = [];
  for (const logicalPath of logicalPaths) files.push(...await collectPackageFiles(root, logicalPath));
  if (files.length === 0) throw new Error("logical paths resolve to no package files");
  return digest([...new Map(files.map((file) => [file.path, file])).values()]);
};

const validateExactKeys = (value, allowed, path) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(`${path}: must be an object`);
    return false;
  }
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length > 0) fail(`${path}: unknown fields ${unknown.join(", ")}`);
  return unknown.length === 0;
};

const validateLockShape = (lock) => {
  validateExactKeys(lock, lockKeys, "lock");
  if (lock.lock_version !== 3) fail("integration lock must use lock_version 3");
  if (typeof lock.generated_at !== "string" || Number.isNaN(Date.parse(lock.generated_at))) fail("generated_at must be an ISO date-time");
  if (typeof lock.scenario_key !== "string" || !/^[a-z][a-z0-9-]*$/u.test(lock.scenario_key)) fail("scenario_key is invalid");
  if (!["ordinary", "joint_candidate"].includes(lock.qualification_mode)) fail("qualification_mode is invalid");
  for (const name of ["base_contract", "host_sdk", "scenario_artifact"]) {
    const pin = lock[name];
    if (!validateExactKeys(pin, revisionKeys, name)) continue;
    if (pin.source === "git") {
      if (typeof pin.repository !== "string" || typeof pin.revision !== "string") fail(`${name}: git pins require repository and revision`);
      if (pin.package !== undefined || pin.version !== undefined || pin.artifact_path !== undefined) fail(`${name}: git pins must not declare package fields`);
    } else if (pin.source === "package") {
      if (typeof pin.package !== "string" || typeof pin.version !== "string" || typeof pin.artifact_path !== "string") fail(`${name}: package pins require package, version, and artifact_path`);
      if (pin.repository !== undefined || pin.revision !== undefined) fail(`${name}: package pins must not declare git fields`);
    } else {
      fail(`${name}: unsupported source ${String(pin.source)}`);
    }
    if (!Array.isArray(pin.logical_paths) || pin.logical_paths.length === 0 || new Set(pin.logical_paths).size !== pin.logical_paths.length) {
      fail(`${name}: logical_paths must be a non-empty unique array`);
    }
  }
};

const verifyPackageManifest = async (name, pin, artifactRoot) => {
  const files = [];
  for (const logicalPath of pin.logical_paths) files.push(...await collectPackageFiles(artifactRoot, logicalPath));
  const manifests = files.filter((file) => file.path.endsWith("package.json"));
  const matching = [];
  for (const manifest of manifests) {
    try {
      const value = JSON.parse(manifest.content.toString("utf8"));
      if (value.name === pin.package) matching.push({ path: manifest.path, value });
    } catch (error) {
      throw new Error(`invalid package manifest ${manifest.path}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (matching.length !== 1) throw new Error(`locked logical_paths must contain exactly one package.json named ${pin.package}; found ${matching.length}`);
  const [{ path, value }] = matching;
  if (value.version !== pin.version) throw new Error(`package version mismatch in ${path}: expected ${pin.version}, got ${String(value.version)}`);
  if (value.private === true) throw new Error(`package ${pin.package} is private and cannot serve as a published integration artifact`);
};

async function verifyRevision(name, pin, jointCandidate, lockRoot) {
  if (pin.hash_algorithm !== INTEGRATION_SOURCE_HASH_ALGORITHM) {
    fail(`${name}: unsupported hash_algorithm ${String(pin.hash_algorithm)}`);
    return;
  }
  if (!/^[a-f0-9]{64}$/u.test(pin.source_hash ?? "")) fail(`${name}: source_hash must be an exact lowercase SHA-256 value`);
  if (!Array.isArray(pin.logical_paths) || pin.logical_paths.length === 0) {
    fail(`${name}: logical_paths must lock at least one artifact path`);
    return;
  }

  try {
    let actualHash;
    if (pin.source === "git") {
      if (!pin.repository || !pin.revision) throw new Error("git pins require repository and revision");
      const repository = resolve(lockRoot, pin.repository);
      gitText(repository, ["cat-file", "-e", `${pin.revision}^{commit}`]);
      actualHash = hashGitObject(repository, pin.revision, pin.logical_paths);
      if (jointCandidate) {
        const head = gitText(repository, ["rev-parse", "HEAD"]);
        const revision = gitText(repository, ["rev-parse", pin.revision]);
        if (head !== revision) fail(`${name}: joint qualification requires checkout HEAD ${head} to equal ${revision}`);
      }
    } else if (pin.source === "package") {
      if (!pin.package || !pin.version || !pin.artifact_path) throw new Error("package pins require package, version, and artifact_path");
      const artifactRoot = resolve(lockRoot, pin.artifact_path);
      await verifyPackageManifest(name, pin, artifactRoot);
      actualHash = await hashPackageArtifact(artifactRoot, pin.logical_paths);
    } else {
      throw new Error(`unsupported source ${String(pin.source)}`);
    }
    if (actualHash !== pin.source_hash) fail(`${name}: logical source hash mismatch: expected ${pin.source_hash}, got ${actualHash}`);
  } catch (error) {
    fail(`${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function main() {
  const [lockPathArgument, ...flags] = process.argv.slice(2);
  if (!lockPathArgument) throw new Error("usage: verify-integration-lock.mjs <integration-lock.json> [--joint-candidate]");
  const lockPath = resolve(lockPathArgument);
  const lockRoot = resolve(lockPath, "..");
  const lock = JSON.parse(await readFile(lockPath, "utf8"));
  validateLockShape(lock);
  const jointCandidate = flags.includes("--joint-candidate") || lock.qualification_mode === "joint_candidate";
  await verifyRevision("base_contract", lock.base_contract ?? {}, jointCandidate, lockRoot);
  await verifyRevision("host_sdk", lock.host_sdk ?? {}, jointCandidate, lockRoot);
  await verifyRevision("scenario_artifact", lock.scenario_artifact ?? {}, jointCandidate, lockRoot);
  if (failures.length > 0) {
    for (const failure of failures) process.stderr.write(`[error] ${failure}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(`[ok] integration lock v3 verified (${jointCandidate ? "joint_candidate" : "ordinary"})\n`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
