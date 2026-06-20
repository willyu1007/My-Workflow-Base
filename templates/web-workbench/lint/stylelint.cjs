/**
 * @willyu1007/web-workbench — shared stylelint preset (typography lock).
 *
 * Consume in a host project:
 *   // .stylelintrc.json
 *   { "extends": ["@willyu1007/web-workbench/stylelint"] }
 *
 * Bans literal font-size / font-weight / font-family in CONSUMER CSS — the design
 * system's type scale (tokens + .mt-* classes, see TYPOGRAPHY.md) is the only legal
 * source. Allowed values: var(--…) tokens and the inherit/initial/unset resets.
 *
 * The kit's own src/styles is the DEFINITION layer (where the scale and the
 * component-tuned values legitimately live) and is intentionally not linted by this
 * preset — apply it to host-authored CSS only.
 */
const FONT_VALUE_ALLOW = ["/^var\\(--/", "inherit", "initial", "unset"];

module.exports = {
  rules: {
    "declaration-property-value-allowed-list": {
      "font-size": FONT_VALUE_ALLOW,
      "font-weight": FONT_VALUE_ALLOW,
      "font-family": FONT_VALUE_ALLOW,
    },
    // Close the `font:` shorthand loophole — any digit implies a hardcoded size.
    // `font: inherit` / `font: var(--…)` carry no digit and stay allowed.
    "declaration-property-value-disallowed-list": {
      font: ["/\\d/"],
    },
  },
};
