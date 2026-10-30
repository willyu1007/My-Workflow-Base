import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { inspectConsumerBoundaries } from "./check-consumer-boundaries.mjs";

test("BA-40 rejects a scenario's private workflow-contracts fork", () => {
  const root = mkdtempSync(join(tmpdir(), "consumer-fork-core-"));
  try {
    const fork = join(root, "packages/fork");
    mkdirSync(fork, { recursive: true });
    writeFileSync(join(fork, "package.json"), JSON.stringify({ name: "@scenario/workflow-contracts" }));
    const findings = inspectConsumerBoundaries({ repository: root, consumerRole: "scenario" });
    assert.ok(findings.some(finding => finding.rule_id === "ECO-CONSUMER-001"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
