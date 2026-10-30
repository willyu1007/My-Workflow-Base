import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir,mkdtemp,rm,writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join,resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { hashGitObject,hashPackageArtifact } from "../scripts/verify-integration-lock.mjs";

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

test("BA-38 可变本地 package path 不能冒充已联合资格的 release", async () => {
  const value = await fixture({ qualification_mode: "joint_candidate" });
  try {
    const result = run(value.lockPath);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /joint qualification requires an exact git source/u);
  } finally {
    await rm(value.root, { recursive: true, force: true });
  }
});

test("BA-37 不可变 commit 与实际 source identity 精确匹配的分发可通过", async () => { const value=await fixture(); try { await useGitPins(value); const result=run(value.lockPath); assert.equal(result.status,0,result.stderr); } finally { await rm(value.root,{recursive:true,force:true}); } });
