import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

test("BA-39 starts the freshly packed Starter through its package exports", async () => {
  const root = resolve(import.meta.dirname, "../..");
  const temporary = await mkdtemp(resolve(tmpdir(), "starter-package-core-"));
  const consumer = resolve(temporary, "consumer");
  const artifacts = resolve(temporary, "artifacts");
  const run = (command, args, cwd) => {
    const result = spawnSync(command, args, { cwd, encoding: "utf8", timeout: 60_000 });
    assert.equal(result.status, 0, result.stderr + result.stdout);
    return result;
  };
  try {
    await mkdir(artifacts);
    await mkdir(resolve(consumer, "node_modules/@host"), { recursive: true });
    await writeFile(resolve(consumer, "package.json"), JSON.stringify({ type: "module" }));
    // The two production artifacts form this one startup scenario. prepack
    // rebuilds each from current source after removing only our worktree's dist.
    for (const [source, name] of [
      ["templates/host-runtime/packages/workflow-contracts", "workflow-contracts"],
      ["templates/scenario-module", "scenario-module-example"],
    ]) {
      const packageRoot = resolve(root, source);
      await rm(resolve(packageRoot, "dist"), { recursive: true, force: true });
      run("pnpm", ["pack", "--pack-destination", artifacts], packageRoot);
      const archive = (await readdir(artifacts)).find(file => file.startsWith(`host-${name}-`) && file.endsWith(".tgz"));
      assert.ok(archive, `Missing ${name} package artifact`);
      const installed = resolve(consumer, "node_modules/@host", name);
      await mkdir(installed);
      run("tar", ["-xzf", resolve(artifacts, archive), "--strip-components=1", "-C", installed], consumer);
    }
    // A pinned production dependency is reused from the local cache. Neither
    // the Starter nor its contracts resolve to a workspace source symlink.
    await mkdir(resolve(consumer, "node_modules/@prisma"));
    await symlink(resolve(root, "templates/scenario-module/node_modules/@prisma/client"), resolve(consumer, "node_modules/@prisma/client"));
    const started = run(process.execPath, ["--input-type=module", "--eval",
      'const m=await import("@host/scenario-module-example"); if(m.scenarioModule.manifest.scenario_key!=="example") throw Error("wrong package"); console.log("starter ready");',
    ], consumer);
    assert.match(started.stdout, /starter ready/u);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
