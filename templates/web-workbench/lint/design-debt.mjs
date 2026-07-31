#!/usr/bin/env node
/**
 * @willyu1007/web-workbench — design-debt gate.
 *
 * Lets a host adopt the strict design-value lock without fixing every existing
 * violation the same day, while making sure the exceptions cannot rot: each one
 * names an owner, states a reason, and expires.
 *
 * Consume in a host project:
 *   stylelint "src/**\/*.css" -f json > .lint/style.json || true
 *   node node_modules/@willyu1007/web-workbench/dist/lint/design-debt.mjs \
 *     --report .lint/style.json --debt design-debt.json
 *
 * Reads a lint report (stylelint or ESLint JSON — the shape is auto-detected)
 * and a debt registry, then exits non-zero unless every violation is covered by
 * a live entry.
 *
 * Registry shape — all five fields are required on every entry, because an
 * exception without an owner or a deadline is just a silent permanent hole:
 *
 *   {
 *     "entries": [
 *       {
 *         "path": "apps/web/src/styles/app.css",
 *         "rules": ["declaration-property-value-disallowed-list"],
 *         "owner": "T-032",
 *         "expires_at_utc": "2026-12-31T00:00:00Z",
 *         "reason": "Why this is not being fixed now, and what will fix it."
 *       }
 *     ]
 *   }
 *
 * `rules` is a list, so an entry suppresses one rule in one file rather than
 * exempting the file wholesale. Paths are repo-relative and matched by suffix,
 * so a report holding absolute paths still resolves.
 *
 * Three failure modes are deliberate, and none of them is "quietly pass":
 *   - a violation with no entry            -> error (the point of the gate)
 *   - an entry missing a field / malformed -> error (debt-invalid)
 *   - an entry past expiry                 -> error, and it stops suppressing
 * An entry that matches nothing is reported as needless, but does not fail the
 * run: a host that fixed its debt early should not be punished for it.
 */
import { readFileSync } from "node:fs";

const REQUIRED = ["path", "rules", "owner", "expires_at_utc", "reason"];


function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function readJson(file, what) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    console.error(`design-debt: cannot read ${what} at ${file} — ${error.message}`);
    process.exit(2);
  }
}

/**
 * Normalize either linter's JSON into {path, rule, line, text}.
 * stylelint: [{ source, warnings: [{ rule, line, text }] }]
 * ESLint:    [{ filePath, messages: [{ ruleId, line, message }] }]
 */
function normalize(report) {
  if (!Array.isArray(report)) return [];
  return report.flatMap((file) => {
    if (Array.isArray(file.warnings)) {
      return file.warnings.map((w) => ({
        path: file.source ?? "",
        rule: w.rule ?? "",
        line: w.line ?? 0,
        text: w.text ?? "",
      }));
    }
    if (Array.isArray(file.messages)) {
      return file.messages
        .filter((m) => m.ruleId)
        .map((m) => ({
          path: file.filePath ?? "",
          rule: m.ruleId,
          line: m.line ?? 0,
          text: m.message ?? "",
        }));
    }
    return [];
  });
}

function validate(entries) {
  const problems = [];
  entries.forEach((entry, i) => {
    const at = `entries[${i}]`;
    for (const field of REQUIRED) {
      if (entry[field] === undefined || entry[field] === null || entry[field] === "") {
        problems.push(`${at} is missing required field "${field}"`);
      }
    }
    if (entry.rules !== undefined && !Array.isArray(entry.rules)) {
      problems.push(`${at}.rules must be a list of rule ids`);
    }
    if (entry.expires_at_utc && Number.isNaN(Date.parse(entry.expires_at_utc))) {
      problems.push(`${at}.expires_at_utc is not a parsable date`);
    }
  });
  return problems;
}

const reportFile = arg("--report");
const debtFile = arg("--debt", "design-debt.json");
if (!reportFile) {
  console.error("design-debt: --report <lint-report.json> is required");
  process.exit(2);
}

const violations = normalize(readJson(reportFile, "lint report"));

// An explicit --debt that cannot be read is an error; a missing default file
// just means the host carries no debt, which is the state we want them to reach.
let registry;
if (process.argv.includes("--debt")) {
  registry = readJson(debtFile, "debt registry");
} else {
  try {
    registry = JSON.parse(readFileSync(debtFile, "utf8"));
  } catch {
    registry = { entries: [] };
  }
}

const entries = Array.isArray(registry.entries) ? registry.entries : [];
const invalid = validate(entries);
if (invalid.length) {
  console.error("design-debt: registry is invalid\n");
  invalid.forEach((p) => console.error(`  ${p}`));
  console.error("\nEvery entry needs path, rules, owner, expires_at_utc, and reason.");
  process.exit(1);
}

// `now` is read once so a long run cannot expire an entry midway through.
const now = Date.now();
const expired = entries.filter((e) => Date.parse(e.expires_at_utc) <= now);
const live = entries.filter((e) => Date.parse(e.expires_at_utc) > now);
const used = new Set();

const uncovered = violations.filter((v) => {
  const i = live.findIndex(
    (e) => v.path.endsWith(e.path) && e.rules.includes(v.rule),
  );
  if (i === -1) return true;
  used.add(i);
  return false;
});

const needless = live
  .map((e, i) => (used.has(i) ? null : e))
  .filter(Boolean);

for (const e of needless) {
  console.warn(
    `design-debt: needless entry — ${e.path} [${e.rules.join(", ")}] matched nothing. Remove it.`,
  );
}

let failed = false;

if (expired.length) {
  failed = true;
  console.error(`\ndesign-debt: ${expired.length} expired entr${expired.length === 1 ? "y" : "ies"} (no longer suppressing):\n`);
  for (const e of expired) {
    console.error(`  ${e.path} [${e.rules.join(", ")}] — owner ${e.owner}, expired ${e.expires_at_utc}`);
  }
}

if (uncovered.length) {
  failed = true;
  console.error(`\ndesign-debt: ${uncovered.length} unregistered violation${uncovered.length === 1 ? "" : "s"}:\n`);
  for (const v of uncovered) {
    console.error(`  ${v.path}:${v.line}  [${v.rule}]  ${v.text}`);
  }
  console.error(
    "\nFix them, or register each one in the debt file with an owner, an expiry, and a reason.",
  );
}

if (failed) process.exit(1);

const suppressed = violations.length - uncovered.length;
console.log(
  `design-debt: clean — ${violations.length} violation(s), ${suppressed} covered by ${used.size} live entr${used.size === 1 ? "y" : "ies"}.`,
);
