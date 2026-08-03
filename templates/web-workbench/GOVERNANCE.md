# Design-value governance

The kit ships tokens; these presets keep consumers *using* them. One idea:
**a brand value must never be a literal in host code.** Typography was locked
first; 0.9.0 extends the same lock to color, depth, and motion, and adds a way
to adopt it without a same-day cleanup.

Rationale for the values themselves: [DECISIONS.md](./DECISIONS.md).
The type scale: [TYPOGRAPHY.md](./TYPOGRAPHY.md).

## What is locked

| Rule | Blocks | Allows |
|---|---|---|
| `font-size` / `font-weight` / `font-family` / `font` | any literal | `var(--…)`, CSS-wide resets |
| `color`, `background-color`, `border-*-color`, `outline-color`, `caret-color`, `text-decoration-color`, `column-rule-color`, `fill`, `stroke` | literals **and** named colors (`red`, `navy`) | `var(--…)`, resets, `transparent`, `currentColor`, `none` |
| **any declaration** — including shorthands, functions, and custom properties | raw color literals: `#rgb`/`#rrggbb`, `rgb()`/`rgba()`, `hsl()`/`hsla()`, `lab()`/`lch()`/`oklab()`/`oklch()`/`color()` | everything else |
| `transition` / `transition-property` | `all` | named properties |
| JSX `style={{ … }}` | literal font and color values, in both `fontSize:` and `"fontSize":` key forms | `var(--…)`, keywords, any dynamic expression |

### Why the color rule is a catch-all

Scoping it to color properties misses the three ways a literal actually gets in:

1. **Shorthands** — `background: #fff`, `border: 1px solid #ddd`.
2. **Functions** — `linear-gradient(180deg, #FBF7F1 0%, …)`.
3. **Custom properties** — and this is the one that matters:

   ```css
   --kc-focus-ring: 0 0 0 2px rgba(40, 62, 104, 0.22);   /* untokenized navy */
   .field:focus { box-shadow: var(--kc-focus-ring); }     /* passes every var() check */
   ```

   Found in a live consumer. The declaration that a var()-based rule inspects is
   perfectly clean; the drift is one line up. A rule that only reads color
   properties cannot see it.

Precision that this costs nothing: each function pattern is anchored on its
opening paren, so `color-mix(in oklab, var(--a) 50%, var(--b))` — the normal way
to derive a tint from tokens — is **not** mistaken for the `oklab()` color form.
Matching the bare word would have rejected legitimate host CSS.

### A literal on an explicit color property reports twice

`color: #123456` trips both layers — the catch-all literal pattern and the
allow-list on the 13 explicit color properties. Two messages, one line, one fix.

Kept deliberately. Collapsing them means turning the allow-list into a
blacklist of named colors, which would only ever catch the ~17 names enumerated
and would let any future color syntax through. A whitelist on the properties
that carry brand color is the stronger shape, and the redundancy costs a
duplicate line rather than a missed violation. Shorthands, gradients, and custom
properties — where most real drift hides — report once.

### Composed depth is allowed, invented color is not

`box-shadow: 0 0 0 2px var(--ui-color-focus_ring)` passes. The geometry is
layout; the *color* is the brand-critical part. Prefer the kit's five-level
scale (`--shadow-xs` … `--shadow-xl`) — it is a designed system, not five loose
values — but composing an offset around a token color is not drift.

## Adopting

```jsonc
// .stylelintrc.json
{ "extends": ["@willyu1007/web-workbench/stylelint"] }
```

```js
// eslint.config.js  — flat-config `no-restricted-syntax` is last-wins; if you
// already use that rule, merge the preset's selectors into your own entry.
import workbenchDesign from "@willyu1007/web-workbench/eslint";
export default [...workbenchDesign, /* …your config */];
```

Apply them to **host-authored** code only. The kit's own `src/styles` is the
definition layer — where the scale and component-tuned values legitimately
live — and is not linted by these presets.

### Measured cost

Run against the two live consumers before release:

| Repo | Host CSS violations | Inline-style violations |
|---|---|---|
| The-Nurture | 0 (2 files) | 0 (no inline styles) |
| The-Education | 3 (1 file) | 0 (3 of 114 inline styles touch color; all already use `var(--…)`) |

All three Education hits are genuine drift: `background: #fff` twice, and the
`--kc-focus-ring` custom property above. Adoption is close to free — which is
the point of measuring rather than assuming.

## Debt: adopting strict rules without a same-day cleanup

When a host cannot fix everything at once, register the remainder instead of
weakening the rule. Every entry needs all five fields:

```json
{
  "entries": [
    {
      "path": "apps/web/src/styles/app.css",
      "rules": ["declaration-property-value-disallowed-list"],
      "owner": "T-032",
      "expires_at_utc": "2026-12-31T00:00:00Z",
      "reason": "Legacy stylesheet predates the color lock; T-032 rewrites it."
    }
  ]
}
```

```bash
stylelint "src/**/*.css" -f json -o .lint/style.json || true
node node_modules/@willyu1007/web-workbench/dist/lint/design-debt.mjs \
  --report .lint/style.json --debt design-debt.json
```

The gate reads stylelint **or** ESLint JSON (shape auto-detected) and exits
non-zero unless every violation is covered by a live entry.

- `rules` is a list, so an entry covers **one rule in one file** — not the file
  wholesale.
- `path` matches by suffix, so a report holding absolute paths still resolves.
- A **missing field or malformed date** fails the run. An exception with no
  owner and no deadline is a permanent hole with better branding.
- An **expired** entry stops suppressing *and* fails, so debt cannot rot quietly.
- An entry matching nothing is reported as **needless** but does not fail —
  fixing your debt early should not break your build.
- No debt file at all is a valid state: zero debt.

## Literal-required values: use the brand constants

Some places genuinely cannot hold a `var(--…)` — a Next viewport `themeColor`, a
web-app manifest's `theme_color`/`background_color`, an email template. No lint
rule can reach them, and a real consumer drifted to the pre-repair warm cream
exactly there, by hand.

The kit exports those colors instead:

```ts
import { brand } from "@willyu1007/web-workbench/brand";

export const viewport: Viewport = { themeColor: brand.canvas };
```

Available: `canvas`, `surface`, `ink`, `navy`, `orange` — generated from
`tokens/base.json`, so they cannot drift from the stylesheet.

Deliberately small. This is an escape hatch for contexts that take no variable,
not a second way to consume the design system. **Anything that can take a
`var()` must take one**, and the presets still enforce that in CSS and JSX.

One safety rule is worth knowing about, because it protects a silent failure:
the emitter rejects any export whose token value is not a plain hex literal.
Mapping an alias such as `--bg-canvas`, whose value is `var(--mt-cream)`, would
otherwise ship the *string* `"var(--mt-cream)"` into a meta tag — valid TypeScript,
invisible in review, and wrong in the browser.
