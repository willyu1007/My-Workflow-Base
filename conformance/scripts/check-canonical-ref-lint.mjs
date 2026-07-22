import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { lintCanonicalRefSources } from "./canonical-ref-lint.mjs";

const temporaryRoot = await mkdtemp(join(tmpdir(), "canonical-ref-lint-"));

try {
  const validPath = join(temporaryRoot, "valid.ts");
  const invalidPath = join(temporaryRoot, "invalid.ts");
  const ignoredTestPath = join(temporaryRoot, "negative.test.ts");

  await writeFile(validPath, 'const ref = { schema_version: 1, namespace: "my_chat", object_type: "workflow_run", object_id: "run-1" };\n');
  await writeFile(invalidPath, 'type Ref = CanonicalRefV1; const ref = { kind: "workflow_run", id: "run-1", consumer_scenario_key: "education" };\n');
  await writeFile(ignoredTestPath, 'const rejected = { kind: "workflow_run", id: "negative-fixture" };\n');

  const validFindings = await lintCanonicalRefSources([validPath]);
  if (validFindings.length !== 0) throw new Error(`valid CanonicalRef source failed: ${JSON.stringify(validFindings)}`);

  const invalidRules = new Set((await lintCanonicalRefSources([temporaryRoot])).map((finding) => finding.rule_id));
  for (const expectedRule of ["FED-REF-SOURCE-001", "FED-REF-SOURCE-003", "FED-REF-SOURCE-005"]) {
    if (!invalidRules.has(expectedRule)) throw new Error(`canonical-ref lint did not emit ${expectedRule}`);
  }
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
