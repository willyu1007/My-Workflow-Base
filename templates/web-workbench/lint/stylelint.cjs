/**
 * @willyu1007/web-workbench — shared stylelint preset (design-value lock).
 *
 * Consume in a host project:
 *   // .stylelintrc.json
 *   { "extends": ["@willyu1007/web-workbench/stylelint"] }
 *
 * Bans literal typography, color, and depth values in CONSUMER CSS — the design
 * system's tokens (see tokens.css, TYPOGRAPHY.md, DECISIONS.md) are the only
 * legal source. Allowed everywhere: var(--…) tokens and the CSS-wide resets.
 *
 * The kit's own src/styles is the DEFINITION layer (where the scale and the
 * component-tuned values legitimately live) and is intentionally not linted by this
 * preset — apply it to host-authored CSS only.
 */
const TOKEN = "/^var\\(--/";
const RESETS = ["inherit", "initial", "unset", "revert"];

const FONT_VALUE_ALLOW = [TOKEN, ...RESETS];

/**
 * Raw color literals, in every syntax CSS accepts.
 *
 * Each function form is anchored on its opening paren, which is what keeps
 * `color-mix(in oklab, var(--a) 50%, var(--b))` — a legitimate derivation from
 * tokens, and the exact shape hosts use for tinted surfaces — from being read as
 * the `oklab()` color form. Matching the bare word would reject it.
 */
const COLOR_LITERAL = [
  "/#[0-9a-fA-F]{3,8}\\b/",
  "/\\brgba?\\(/",
  "/\\bhsla?\\(/",
  "/\\b(?:lab|lch|oklab|oklch|color)\\(/",
];

/** Non-token color values a host may legitimately write. */
const COLOR_ALLOW = [TOKEN, ...RESETS, "transparent", "currentColor", "none"];

const COLOR_PROPERTIES = [
  "color",
  "background-color",
  "border-color",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
  "outline-color",
  "caret-color",
  "text-decoration-color",
  "column-rule-color",
  "fill",
  "stroke",
];

module.exports = {
  rules: {
    "declaration-property-value-allowed-list": {
      "font-size": FONT_VALUE_ALLOW,
      "font-weight": FONT_VALUE_ALLOW,
      "font-family": FONT_VALUE_ALLOW,
      // Named colors (`red`, `navy`) carry no punctuation for the literal
      // patterns below to anchor on, so the explicit color properties also
      // run against an allow-list.
      ...Object.fromEntries(COLOR_PROPERTIES.map((p) => [p, COLOR_ALLOW])),
    },

    "declaration-property-value-disallowed-list": {
      // Close the `font:` shorthand loophole — any digit implies a hardcoded size.
      // `font: inherit` / `font: var(--…)` carry no digit and stay allowed.
      font: ["/\\d/"],

      // No raw color literal in ANY declaration. The catch-all is deliberate and
      // covers three things an enumerated list misses:
      //   1. shorthands — `background: #fff`, `border: 1px solid #ddd`;
      //   2. functions  — `linear-gradient(180deg, #FBF7F1 0%, …)`;
      //   3. custom properties — `--ring: 0 0 0 2px rgba(40,62,104,.22)` then
      //      `box-shadow: var(--ring)`, which passes every var()-based check
      //      while smuggling an untokenized brand color into the sheet. That
      //      exact pattern was found in a live consumer; it is the reason this
      //      rule is not scoped to color properties.
      "/./": COLOR_LITERAL,

      // Name the animated properties. `all` transitions whatever happens to
      // change, which makes cost unbounded and intent unreadable.
      transition: ["/\\ball\\b/"],
      "transition-property": ["/\\ball\\b/"],
    },
  },
};
