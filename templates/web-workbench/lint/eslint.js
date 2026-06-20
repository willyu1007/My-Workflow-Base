/**
 * @willyu1007/web-workbench — shared ESLint flat-config preset (typography lock).
 *
 * Consume in a host project:
 *   // eslint.config.js
 *   import workbenchType from "@willyu1007/web-workbench/eslint";
 *   export default [ ...workbenchType, ...yourConfig ];
 *
 * Bans inline font-size / font-weight / font-family in CONSUMER JSX — use a kit
 * typography class (.mt-h1…mt-caption / .mt-body / .mt-small) or a scale token
 * (see TYPOGRAPHY.md). Covers both identifier keys (`fontSize: 14`) and string keys
 * (`"fontSize": "14px"`).
 *
 * NOTE: flat-config `no-restricted-syntax` is last-wins. If you already use this rule,
 * merge the two selectors below into your own entry instead of spreading this preset.
 */
const MESSAGE =
  "No inline font-size/weight/family. Use a kit typography class (.mt-h1…mt-caption / .mt-body / .mt-small) or a scale token var(--…).";
const KEYS = "/^(fontSize|fontWeight|fontFamily)$/";

export default [
  {
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: `JSXAttribute[name.name='style'] Property[key.name=${KEYS}]`,
          message: MESSAGE,
        },
        {
          selector: `JSXAttribute[name.name='style'] Property[key.value=${KEYS}]`,
          message: MESSAGE,
        },
      ],
    },
  },
];
