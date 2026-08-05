import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { hashGitObject, hashPackageArtifact } from "../scripts/verify-integration-lock.mjs";

const verifier = resolve(fileURLToPath(new URL("../scripts/verify-integration-lock.mjs", import.meta.url)));

async function fixture(overrides = {}) {
  const root = await mkdtemp(join(tmpdir(), "integration-lock-v3-"));
  for (const name of ["base", "host", "scenario"]) {
    await mkdir(join(root, name), { recursive: true });
    await writeFile(join(root, name, "package.json"), JSON.stringify({
      name: `@fixture/${name}`,
      version: "1.0.0",
      private: false,
      type: "module",
    }));
    await writeFile(join(root, name, "index.js"), `export const name = ${JSON.stringify(name)};\n`);
  }
  const pin = async (name) => ({
    source: "package",
    package: `@fixture/${name}`,
    version: "1.0.0",
    artifact_path: `./${name}`,
    logical_paths: ["package.json", "index.js"],
    hash_algorithm: "sha256-path-content-source-hash-normalized-v1",
    source_hash: await hashPackageArtifact(join(root, name), ["package.json", "index.js"]),
  });
  const lock = {
    lock_version: 3,
    generated_at: "2026-07-21T00:00:00.000Z",
    scenario_key: "example",
    qualification_mode: "ordinary",
    base_contract: await pin("base"),
    host_sdk: await pin("host"),
    scenario_artifact: await pin("scenario"),
    ...overrides,
  };
  const lockPath = join(root, "integration-lock.json");
  await writeFile(lockPath, JSON.stringify(lock));
  return { root, lock, lockPath };
}

const run = (lockPath, ...flags) => spawnSync(process.execPath, [verifier, lockPath, ...flags], { encoding: "utf8" });

const git = (repository, ...args) => {
  const result = spawnSync("git", ["-C", repository, ...args], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
};

async function useGitPins(value) {
  for (const name of ["base", "host", "scenario"]) {
    const repository = join(value.root, name);
    git(repository, "init", "--quiet");
    git(repository, "add", "package.json", "index.js");
    git(repository, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "--quiet", "-m", "fixture");
    const revision = git(repository, "rev-parse", "HEAD");
    value.lock[name === "base" ? "base_contract" : name === "host" ? "host_sdk" : "scenario_artifact"] = {
      source: "git",
      repository: `./${name}`,
      revision,
      logical_paths: ["package.json", "index.js"],
      hash_algorithm: "sha256-path-content-source-hash-normalized-v1",
      source_hash: hashGitObject(repository, revision, ["package.json", "index.js"]),
    };
  }
  value.lock.qualification_mode = "joint_candidate";
  await writeFile(value.lockPath, JSON.stringify(value.lock));
}

test("verifies exact public package names and versions", async () => {
  const value = await fixture();
  try {
    assert.equal(run(value.lockPath).status, 0);
    value.lock.host_sdk.version = "2.0.0";
    await writeFile(value.lockPath, JSON.stringify(value.lock));
    const mismatch = run(value.lockPath);
    assert.equal(mismatch.status, 1);
    assert.match(mismatch.stderr, /package version mismatch/u);
  } finally {
    await rm(value.root, { recursive: true, force: true });
  }
});

test("fails closed on unknown lock fields", async () => {
  const value = await fixture({ future_contract_mode: true });
  try {
    const result = run(value.lockPath);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /unknown fields future_contract_mode/u);
  } finally {
    await rm(value.root, { recursive: true, force: true });
  }
});

test("joint qualification rejects mutable package-path inputs", async () => {
  const value = await fixture({ qualification_mode: "joint_candidate" });
  try {
    const result = run(value.lockPath);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /joint qualification requires an exact git source/u);
  } finally {
    await rm(value.root, { recursive: true, force: true });
  }
});

test("joint qualification requires exact commit ids and matching checkouts", async () => {
  const value = await fixture();
  try {
    await useGitPins(value);
    assert.equal(run(value.lockPath).status, 0);

    const exactRevision = value.lock.base_contract.revision;
    value.lock.base_contract.revision = "HEAD";
    await writeFile(value.lockPath, JSON.stringify(value.lock));
    const symbolic = run(value.lockPath);
    assert.equal(symbolic.status, 1);
    assert.match(symbolic.stderr, /exact lowercase 40-character commit id/u);

    value.lock.base_contract.revision = exactRevision;
    await writeFile(value.lockPath, JSON.stringify(value.lock));
    await writeFile(join(value.root, "base", "drift.js"), "export const drift = true;\n");
    git(join(value.root, "base"), "add", "drift.js");
    git(join(value.root, "base"), "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "--quiet", "-m", "drift");
    const driftedCheckout = run(value.lockPath);
    assert.equal(driftedCheckout.status, 1);
    assert.match(driftedCheckout.stderr, /joint qualification requires checkout HEAD/u);
  } finally {
    await rm(value.root, { recursive: true, force: true });
  }
});

test("installed-bin symlink executes the verifier main entry", async () => {
  const value = await fixture();
  try {
    const installedBin = join(value.root, "workflow-integration-lock");
    await symlink(verifier, installedBin);
    const result = spawnSync(process.execPath, [installedBin, value.lockPath], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /integration lock v3 verified/u);
  } finally {
    await rm(value.root, { recursive: true, force: true });
  }
});

test("CLI rejects unknown flags", async () => {
  const value = await fixture();
  try {
    const result = run(value.lockPath, "--future-mode");
    assert.equal(result.status, 1);
    assert.match(result.stderr, /unsupported flag/u);
  } finally {
    await rm(value.root, { recursive: true, force: true });
  }
});
