/**
 * @willyu1007/web-workbench — shared ESLint flat-config preset (design-value lock).
 *
 * Consume in a host project:
 *   // eslint.config.js
 *   import workbenchDesign from "@willyu1007/web-workbench/eslint";
 *   export default [ ...workbenchDesign, ...yourConfig ];
 *
 * Bans literal typography and color values in CONSUMER JSX inline styles — the
 * mirror of the stylelint preset, covering the declarations CSS linting cannot
 * see. Use a kit typography class (.mt-h1…mt-caption / .mt-body / .mt-small) or a
 * token (see TYPOGRAPHY.md, tokens.css). `var(--…)` and dynamic expressions
 * (ConditionalExpression etc.) are allowed, so font and color may still sit next
 * to dynamic/layout inline props without forcing a className.
 *
 * NOTE: flat-config `no-restricted-syntax` is last-wins. If you already use this rule,
 * merge the selectors below into your own entry instead of spreading this preset.
 */
const TYPO_MESSAGE =
  "No LITERAL inline font-size/weight/family. Use a scale token (var(--small-size) …) or a kit typography class (.mt-h1…mt-caption / .mt-body / .mt-small). var(--…) and dynamic expressions are allowed.";
const COLOR_MESSAGE =
  "No LITERAL inline color/background/shadow. Use a token (var(--fg-1), var(--bg-surface), var(--shadow-sm) …). var(--…), transparent/currentColor/none, and dynamic expressions are allowed.";

const TYPO_KEYS = "/^(fontSize|fontWeight|fontFamily|font)$/";
const COLOR_KEYS =
  "/^(color|background|backgroundColor|borderColor|borderTopColor|borderRightColor|borderBottomColor|borderLeftColor|outlineColor|caretColor|textDecorationColor|columnRuleColor|boxShadow|fill|stroke)$/";

/** Literal color values that are legal despite not being a var() token. */
const COLOR_VALUE_OK =
  "/^(?:var\\(|transparent$|currentColor$|inherit$|initial$|unset$|revert$|none$)/";
const TYPO_VALUE_OK = "/^var\\(/";

/**
 * Both key forms must be matched. An object key is either an Identifier
 * (`fontSize: 14`, exposing `key.name`) or a string Literal
 * (`"fontSize": "14px"`, exposing `key.value` and no `key.name`). Matching only
 * `key.name` — which is all this preset did before, despite its doc comment
 * claiming otherwise — let a quoted key slip any value past the lock silently.
 *
 * The quoted form needs one extra guard. esquery's `>` has no notion of which
 * field a child sits in, so on `{ "fontSize": "14px" }` it matches BOTH Literal
 * children — the key as well as the value — and the same violation gets
 * reported twice. Excluding literals whose text is itself a watched key name
 * drops the key node; no real style *value* is ever the string "fontSize".
 */
const inlineStyleSelectors = (keys, valueGuard) => [
  `JSXAttribute[name.name='style'] Property[key.name=${keys}] > Literal:not([value=${valueGuard}])`,
  `JSXAttribute[name.name='style'] Property[key.value=${keys}] > Literal:not([value=${valueGuard}]):not([value=${keys}])`,
];

const restrict = (keys, valueGuard, message) =>
  inlineStyleSelectors(keys, valueGuard).map((selector) => ({ selector, message }));

export default [
  {
    rules: {
      "no-restricted-syntax": [
        "error",
        ...restrict(TYPO_KEYS, TYPO_VALUE_OK, TYPO_MESSAGE),
        ...restrict(COLOR_KEYS, COLOR_VALUE_OK, COLOR_MESSAGE),
      ],
    },
  },
];
