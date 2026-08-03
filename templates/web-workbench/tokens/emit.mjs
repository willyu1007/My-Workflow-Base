#!/usr/bin/env node
/**
 * Emit src/styles/tokens.css from tokens/base.json.
 *
 *   node tokens/emit.mjs            # write
 *   node tokens/emit.mjs --check    # verify the committed CSS matches the source
 *
 * Only the `:root` block is generated. Everything after it in tokens.css — the
 * base resets and the `.mt-*` typography classes — is real CSS rather than token
 * data, so it lives in `tokens/tail.css` and is appended verbatim.
 *
 * `elevation` and `state` are deliberately NOT emitted; see their `meta` notes in
 * base.json. They are the platform-neutral source for a future native kit, and
 * the web already has --shadow-* and component-level state rules.
 *
 * Both modes also verify the Motion section against `tokens/motion-role-lock.json`
 * — the cross-repo name mapping onto the platform host's motion roles. See
 * `verifyMotionRoles` below and DECISIONS.md D-A10.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const kit = join(here, "..");
const OUT = join(kit, "src/styles/tokens.css");

const source = JSON.parse(readFileSync(join(here, "base.json"), "utf8"));
const tail = readFileSync(join(here, "tail.css"), "utf8");
const motionLock = JSON.parse(readFileSync(join(here, "motion-role-lock.json"), "utf8"));

const HEADER = `/* =========================================================
   morethan — Foundations
   GENERATED FILE. DO NOT EDIT BY HAND.
   Source: tokens/base.json  ·  Emitter: tokens/emit.mjs
   Run \`pnpm tokens\` after changing the source.
   ========================================================= */

/* Fonts are HOST-PROVIDED — the kit does not self-load webfonts. A
   render-blocking \`@import url('fonts.googleapis.com/...')\` used to live here;
   it was removed so the kit never forces a third-party network dependency (a
   first-paint stall, and a hard block behind the Great Firewall). The --font-*
   tokens below still define the family stacks (one source of truth); the host
   loads the actual faces. See TYPOGRAPHY.md → "Fonts (host-provided)". */
`;

/**
 * Hold the Motion section to `tokens/motion-role-lock.json`.
 *
 * The kit's motion values are the platform host's, under kit names. Nothing else
 * enforces that: the cross-repo rule in DECISIONS.md keys on same-named roles, and
 * `--t-base` is not named `duration_normal`. Without this, a curve tuned here and a
 * curve tuned in the host drift apart silently and the diff shows nothing wrong.
 *
 * Runs in both write and check mode — a drifted value must not be emittable, only
 * reportable.
 */
function verifyMotionRoles() {
  const section = source.sections.find((s) => s.title === "Motion");
  const errors = [];

  if (!section) {
    errors.push("base.json has no Motion section, but motion-role-lock.json locks one.");
    return errors;
  }

  const byVar = new Map(section.tokens.map((t) => [t.var, t.value]));

  for (const role of motionLock.roles) {
    const actual = byVar.get(role.kit_var);

    if (actual === undefined) {
      errors.push(
        `role "${role.role}" is locked onto ${role.kit_var}, which the Motion section does not define.`,
      );
      continue;
    }

    if (actual !== role.kit_value) {
      errors.push(
        `${role.kit_var} is "${actual}" but the lock records "${role.kit_value}" ` +
          `(role "${role.role}", upstream ${motionLock.upstream.repo} ${role.upstream_key}).\n` +
          `      Changing a bound role is a cross-repo change: update the upstream first, ` +
          `then re-pin this lock — do not edit the value here alone.`,
      );
      continue;
    }

    // A deliberate divergence is allowed, but it has to be written down — same
    // discipline as meta.deviations_from_source.
    if (!role.deviation && role.kit_value !== role.upstream_value) {
      errors.push(
        `role "${role.role}" holds "${role.kit_value}" while upstream ${role.upstream_key} ` +
          `holds "${role.upstream_value}", with no "deviation" recorded on the role.\n` +
          `      Either match upstream or record why this repo differs.`,
      );
    }
  }

  const known = new Set([
    ...motionLock.roles.map((r) => r.kit_var),
    ...motionLock.kit_local.map((l) => l.kit_var),
  ]);

  for (const token of section.tokens) {
    if (!known.has(token.var)) {
      errors.push(
        `${token.var} is a new motion token that the lock does not classify.\n` +
          `      Add it to "roles" if the platform host carries the same role, or to ` +
          `"kit_local" with a reason if it is a kit invention.`,
      );
    }
  }

  return errors;
}

const motionErrors = verifyMotionRoles();
if (motionErrors.length > 0) {
  console.error(
    `tokens: Motion section does not match tokens/motion-role-lock.json\n` +
      motionErrors.map((e) => `  - ${e}`).join("\n") +
      `\n\nSee DECISIONS.md D-A10 and MOTION.md → "Where the values come from".`,
  );
  process.exit(3);
}

/** Wrap a note as a comment block indented into the :root body. */
const noteBlock = (text, indent = "  ") =>
  text.includes("\n")
    ? `${indent}/* ${text.split("\n").join(`\n${indent}   `)} */`
    : `${indent}/* ${text} */`;

const out = [HEADER, ":root {"];

for (const [i, section] of source.sections.entries()) {
  if (i > 0) out.push("");
  if (section.title) {
    out.push(
      section.note
        ? `  /* ---------- ${section.title} ----------\n     ${section.note.split("\n").join("\n     ")}\n  */`
        : `  /* ---------- ${section.title} ---------- */`,
    );
  }

  // Align values to one column per section, so a long name never shifts the
  // whole file. Computed rather than stored: alignment is presentation, and
  // keeping it out of the source is what lets base.json stay a design document.
  const width = Math.max(...section.tokens.map((t) => t.var.length)) + 1;

  for (const token of section.tokens) {
    if (token.note) out.push(noteBlock(token.note));
    const label = `${token.var}:`.padEnd(width + 1);
    const comment = token.comment ? `   /* ${token.comment} */` : "";
    out.push(`  ${label} ${token.value};${comment}`);
  }
}

// `state` is mostly structural (it exists for a native kit), but any leaf listed
// under `state.css` is a value the stylesheet consumes, so it is emitted here —
// one value, one place, read by both platforms.
const stateCss = source.state?.css ?? {};
if (Object.keys(stateCss).length > 0) {
  out.push("", "  /* ---------- State ---------- */");
  const width = Math.max(...Object.keys(stateCss).map((v) => v.length)) + 1;
  for (const [cssVar, path] of Object.entries(stateCss)) {
    const value = path.split(".").reduce((node, key) => node?.[key], source.state);
    if (value === undefined) {
      console.error(`tokens: state.css maps ${cssVar} to "${path}", which does not exist`);
      process.exit(2);
    }
    out.push(`  ${`${cssVar}:`.padEnd(width + 1)} ${value};`);
  }
}

out.push("}", "", tail.trimEnd(), "");
const css = out.join("\n");

/**
 * Brand constants for contexts that cannot hold a var() — a meta tag, a web-app
 * manifest, an email template. Values are resolved from `sections` so there is
 * still one source; anything that is not a plain hex literal is rejected,
 * because an alias like `--bg-canvas` resolves to the *string* "var(--mt-cream)"
 * and would fail silently wherever it landed.
 */
const HEX = /^#[0-9a-fA-F]{3,8}$/;
function buildBrand() {
  const exportsMap = source.literals?.exports ?? {};
  const byVar = new Map(
    source.sections.flatMap((s) => s.tokens.map((t) => [t.var, t.value])),
  );
  const lines = [];
  for (const [name, cssVar] of Object.entries(exportsMap)) {
    const value = byVar.get(cssVar);
    if (value === undefined) {
      console.error(`tokens: literals.exports maps ${name} to ${cssVar}, which does not exist`);
      process.exit(2);
    }
    if (!HEX.test(value)) {
      console.error(
        `tokens: literals.exports maps ${name} to ${cssVar}, whose value "${value}" is not a hex literal.\n` +
          "Only literal colors can be exported — an alias would ship the string var(--…) into a meta tag.",
      );
      process.exit(2);
    }
    lines.push(`  /** ${cssVar} */\n  ${name}: "${value}",`);
  }
  return `/* GENERATED FILE. DO NOT EDIT BY HAND.
 * Source: tokens/base.json  ·  Emitter: tokens/emit.mjs
 *
 * Brand colors for the few contexts that cannot hold a CSS variable — a Next
 * viewport themeColor, a web-app manifest, an email template. Everything that
 * CAN take a var() must: see GOVERNANCE.md.
 */
export const brand = {
${lines.join("\n")}
} as const;

export type BrandColor = keyof typeof brand;
`;
}
const brand = buildBrand();
const BRAND_OUT = join(kit, "src/brand.ts");

if (process.argv.includes("--check")) {
  const current = readFileSync(OUT, "utf8");
  const currentBrand = readFileSync(BRAND_OUT, "utf8");
  if (current === css && currentBrand === brand) {
    console.log("tokens: src/styles/tokens.css and src/brand.ts match tokens/base.json");
    process.exit(0);
  }
  console.error(
    "tokens: generated output is out of date with tokens/base.json.\n" +
      "Run `pnpm tokens` and commit the result. Never hand-edit the generated files.",
  );
  process.exit(1);
}

writeFileSync(OUT, css);
writeFileSync(BRAND_OUT, brand);
const count =
  source.sections.reduce((n, s) => n + s.tokens.length, 0) + Object.keys(stateCss).length;
console.log(`tokens: wrote ${OUT} — ${count} custom properties`);
