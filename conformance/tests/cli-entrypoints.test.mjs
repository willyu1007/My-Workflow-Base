import { execFileSync, spawnSync } from "node:child_process";
import { mkdtemp, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { after, before, test } from "node:test";
import assert from "node:assert/strict";

const conformanceRoot = resolve(import.meta.dirname, "..");
let temporaryRoot;

before(async () => {
  temporaryRoot = await mkdtemp(resolve(tmpdir(), "workflow-cli-entrypoints-"));
});

after(async () => {
  await rm(temporaryRoot, { recursive: true, force: true });
});

test("semantic lint executes through a package-bin symlink", async () => {
  const entrypoint = resolve(temporaryRoot, "workflow-semantic-lint");
  await symlink(
    resolve(conformanceRoot, "scripts/semantic-lint.mjs"),
    entrypoint,
  );
  const output = execFileSync(
    process.execPath,
    [
      entrypoint,
      resolve(conformanceRoot, "fixtures/federation-descriptor.valid.json"),
    ],
    { encoding: "utf8" },
  );
  assert.equal(JSON.parse(output).passed, true);
});

test("integration-lock CLI rejects missing input through a symlink", async () => {
  const entrypoint = resolve(temporaryRoot, "workflow-integration-lock");
  await symlink(
    resolve(conformanceRoot, "scripts/verify-integration-lock.mjs"),
    entrypoint,
  );
  const result = spawnSync(process.execPath, [entrypoint], { encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /usage: verify-integration-lock/u);
});

test("canonical-ref lint executes through a package-bin symlink", async () => {
  const entrypoint = resolve(temporaryRoot, "workflow-canonical-ref-lint");
  await symlink(
    resolve(conformanceRoot, "scripts/canonical-ref-lint.mjs"),
    entrypoint,
  );
  const output = execFileSync(
    process.execPath,
    [
      entrypoint,
      resolve(conformanceRoot, "fixtures/federation-descriptor.valid.json"),
    ],
    { encoding: "utf8" },
  );
  assert.equal(JSON.parse(output).passed, true);
});

test("CLI modules remain importable from stdin and eval entrypoints", () => {
  for (const script of [
    "semantic-lint.mjs",
    "verify-integration-lock.mjs",
    "canonical-ref-lint.mjs",
  ]) {
    const result = spawnSync(
      process.execPath,
      [
        "--input-type=module",
        "--eval",
        `await import(${JSON.stringify(resolve(conformanceRoot, "scripts", script))})`,
      ],
      { encoding: "utf8" },
    );
    assert.equal(result.status, 0, result.stderr);
  }
});
