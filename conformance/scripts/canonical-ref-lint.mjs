#!/usr/bin/env node

import { readdir, readFile, stat } from "node:fs/promises";
import { extname, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const supportedExtensions = new Set([".js", ".json", ".jsx", ".mjs", ".ts", ".tsx", ".yaml", ".yml"]);
const ignoredDirectoryNames = new Set([".git", "dist", "migrations", "node_modules"]);
const ignoredFilePattern = /(?:^|\.)(?:spec|test)\.[^.]+$/u;

const rules = [
  {
    rule_id: "FED-REF-SOURCE-001",
    pattern: /\b(?:CanonicalRefV1|DomainContextRef|LegacyCanonicalRef(?:V0)?|LegacyDomainContextRef)\b/gu,
    message: "Public code must use the sole schema-versioned CanonicalRef type.",
  },
  {
    rule_id: "FED-REF-SOURCE-002",
    pattern: /\blegacy_aliases\s*:/gu,
    message: "Step registries must not expose legacy reference aliases.",
  },
  {
    rule_id: "FED-REF-SOURCE-003",
    pattern: /\bconsumer_scenario_key\s*:/gu,
    message: "Canonical refs must not carry consumer routing fields.",
  },
  {
    rule_id: "FED-REF-SOURCE-004",
    pattern: /\bcanonical_ref\s*:\s*\{\s*service\s*:/gu,
    message: "Nested service/object_type/object_id refs are not a public wire shape.",
  },
  {
    rule_id: "FED-REF-SOURCE-005",
    pattern: /\bkind\s*:\s*["'](?:workflow_run|workflow_artifact|workflow_handoff|context_snapshot|domain_context_ref|downstream_object)["']/gu,
    message: "Kind/id reference objects were removed; use CanonicalRef.",
  },
  {
    rule_id: "FED-REF-SOURCE-006",
    pattern: /\bnamespace\s*:\s*["']host\.workflow["']/gu,
    message: "Platform refs use the canonical my_chat namespace.",
  },
];

function lineNumber(source, offset) {
  return source.slice(0, offset).split("\n").length;
}

function shouldIgnore(path) {
  const segments = path.split(sep);
  return segments.some((segment) => ignoredDirectoryNames.has(segment)) || ignoredFilePattern.test(path);
}

async function collectFiles(path) {
  const absolutePath = resolve(path);
  const pathStat = await stat(absolutePath);
  if (pathStat.isFile()) return supportedExtensions.has(extname(absolutePath)) && !shouldIgnore(absolutePath) ? [absolutePath] : [];
  if (!pathStat.isDirectory() || shouldIgnore(absolutePath)) return [];

  const entries = await readdir(absolutePath, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => collectFiles(resolve(absolutePath, entry.name))));
  return nested.flat();
}

export async function lintCanonicalRefSources(paths, { cwd = process.cwd() } = {}) {
  const files = [...new Set((await Promise.all(paths.map(collectFiles))).flat())].sort();
  const findings = [];

  for (const file of files) {
    const source = await readFile(file, "utf8");
    for (const rule of rules) {
      rule.pattern.lastIndex = 0;
      for (const match of source.matchAll(rule.pattern)) {
        findings.push({
          rule_id: rule.rule_id,
          path: relative(cwd, file),
          line: lineNumber(source, match.index),
          message: rule.message,
        });
      }
    }
  }

  return findings;
}

async function main() {
  const paths = process.argv.slice(2);
  if (paths.length === 0) throw new Error("usage: canonical-ref-lint.mjs <source-path> [...source-path]");
  const findings = await lintCanonicalRefSources(paths);
  process.stdout.write(`${JSON.stringify({ passed: findings.length === 0, findings }, null, 2)}\n`);
  if (findings.length > 0) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main();
}
