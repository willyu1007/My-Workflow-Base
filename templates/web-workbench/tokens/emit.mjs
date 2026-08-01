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
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const kit = join(here, "..");
const OUT = join(kit, "src/styles/tokens.css");

const source = JSON.parse(readFileSync(join(here, "base.json"), "utf8"));
const tail = readFileSync(join(here, "tail.css"), "utf8");

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

if (process.argv.includes("--check")) {
  const current = readFileSync(OUT, "utf8");
  if (current === css) {
    console.log("tokens: src/styles/tokens.css matches tokens/base.json");
    process.exit(0);
  }
  console.error(
    "tokens: src/styles/tokens.css is out of date with tokens/base.json.\n" +
      "Run `pnpm tokens` and commit the result. Never hand-edit the CSS.",
  );
  process.exit(1);
}

writeFileSync(OUT, css);
const count =
  source.sections.reduce((n, s) => n + s.tokens.length, 0) + Object.keys(stateCss).length;
console.log(`tokens: wrote ${OUT} — ${count} custom properties`);
