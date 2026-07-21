import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { hashPackageArtifact } from "../scripts/verify-integration-lock.mjs";

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

const run = (lockPath) => spawnSync(process.execPath, [verifier, lockPath], { encoding: "utf8" });

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
