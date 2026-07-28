import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { inspectConsumerBoundaries } from "./check-consumer-boundaries.mjs";

const fixtureRoot = mkdtempSync(join(tmpdir(), "workflow-base-consumer-boundaries-"));

function write(relativePath, value) {
  const path = join(fixtureRoot, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, value);
}

try {
  write(
    "packages/fork/package.json",
    JSON.stringify({
      name: "@scenario/workflow-contracts",
      dependencies: {
        "@willyu1007/web-workbench": "link:../../../../My-Workflow-Base/templates/web-workbench",
      },
    }),
  );
  write(
    "apps/api/package.json",
    JSON.stringify({
      name: "@scenario/api",
      dependencies: {
        "@my-chat/workflow-contracts": "file:../../../../My-Chat/packages/workflow-contracts",
      },
    }),
  );
  write(
    "apps/api/src/direct-import.ts",
    'import type { WorkflowRunRef } from "../../../../My-Chat/packages/workflow-contracts/src/index.js";\n',
  );

  const findings = inspectConsumerBoundaries({
    repository: fixtureRoot,
    consumerRole: "scenario",
  });
  const ruleIds = new Set(findings.map((finding) => finding.rule_id));

  for (const expected of [
    "ECO-CONSUMER-001",
    "ECO-CONSUMER-002",
    "ECO-CONSUMER-003",
    "ECO-CONSUMER-004",
  ]) {
    if (!ruleIds.has(expected)) {
      throw new Error(`consumer boundary self-test did not emit ${expected}`);
    }
  }

  console.log("consumer boundary conformance self-test ok");
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true });
}
