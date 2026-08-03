# web-workbench

Scenario-agnostic **web workbench UI kit** — the presenter layer for a workflow's
web surface. Contracts (types) + presentational React components for the Scene
paradigms; a host scenario writes *adapters* that map its own view-models onto
the contracts, and the components render them. No domain vocabulary lives in the
kit ("lock the chrome, vary the content").

This mirrors the host-runtime template: a host project depends on this **published**
package (GitHub Packages — see Install below), then implements its own adapters + data —
same way it implements handlers/policies against `workflow-contracts`.

> **Read [PARADIGMS.md](./PARADIGMS.md) first.** It is the spec behind the components:
> the 6 Scene paradigms, which component renders each, and the 6 iron rules (e.g.
> *a dashboard's to-dos are rows, never cards* — use `<Hub>` and the wrong thing is
> unreachable). The components ship the rules; this is why.

> **Read [MOTION.md](./MOTION.md) before you animate anything.** The kit ships motion
> tokens but the decision gate is what keeps a product from accumulating motion nobody
> asked for — including when the answer is "no motion". It also covers the two
> reduced-motion traps the kit itself fell into.

### The rules that ship with the kit

**They ship literally — since 0.12.1 the contracts are inside the published tarball**, so
a consumer reads them at `node_modules/@willyu1007/web-workbench/MOTION.md` and the links
below resolve there too. Before 0.12.1 `files` was `["dist"]`: the kit governed consumers
with a set of documents none of them could open, and every link in this table was dead the
moment it arrived in `node_modules`. Point agents and reviewers at those paths.

Note the split: rows about *changing* the kit reference `tokens/…`, which is source-side and
still not published — consumers do not change token values, they consume them.

| Read when | Doc |
| --- | --- |
| Laying out any screen | [PARADIGMS.md](./PARADIGMS.md) — the 6 Scene paradigms + 6 iron rules |
| Adding animation, transitions, or gestures | [MOTION.md](./MOTION.md) · [INTERACTION.md](./INTERACTION.md) |
| Wiring fonts, or touching type | [TYPOGRAPHY.md](./TYPOGRAPHY.md) — the scale, the host font recipe, and how to verify faces actually render |
| Wiring lint, or hitting a lint error | [GOVERNANCE.md](./GOVERNANCE.md) — what is locked, why, and the debt gate |
| Changing a token value | `tokens/base.json` — the source; `src/styles/tokens.css` is generated, never hand-edited |
| Needing a color where `var()` is impossible (meta tag, manifest, email) | `@willyu1007/web-workbench/brand` — see [GOVERNANCE.md](./GOVERNANCE.md) |
| Changing a **motion** token, or adding one | `tokens/motion-role-lock.json` — durations and curves are the platform host's roles under kit names; `pnpm tokens:check` fails on drift *and* on a new motion token nobody classified. See [DECISIONS.md](./DECISIONS.md) D-A10 |
| Wondering why a token has the value it has | [DECISIONS.md](./DECISIONS.md) |
| Changing a component, or adding one | [TESTING.md](./TESTING.md) — `pnpm test`; the suite runs against `src/` and gates publish |
| Reviewing or planning motion in a consuming app | [skills/](./skills/) — copyable agent skills, starting with `audit-workbench-motion` |

## What's inside

| Layer | Files |
| --- | --- |
| **Contracts** (`src/contracts`) | `CardModel` · `RowModel` · `TableModel` · `InsightModel` · `WorkflowModule`/`AttentionItem` (Hub) |
| **Scene shell** | `Scene` + `SceneSkeleton` (loading placeholder) + app shell/navigation chrome |
| **Primitives** | `StatStrip`/`Stat` · `Section` · `EmptyState` · `Meter` · `icons` · `tabs` · `StatusBadge` |
| **Hub paradigm** | `<Hub modules={…}/>` — aggregation台 renderer; structure is component-locked (to-dos = rows, per-workflow stats, topbar filter) |
| **List paradigm** | `EntityCard` · `EntityRow` · `EntityTable` + cell kit (`CellIdentity`/`CellMetric`/`CellProgress`/`CellStatus`) · `ListView` (shared container: topbar filter + stats + empty + load-more) |
| **Insight paradigm** | `InsightCard` (narrative → breakdown → overview, one hairline + whitespace) |
| **Queue paradigm** | `Queue` (rows + trailing action → right `Drawer`; shape is component-locked) |
| **Record paradigm** | `Record` (intro + tabs + top-right action + `Drawer`; shape is component-locked) |
| **Form paradigm** | `FormFrame` (single guided column, required + declarative constraints, validate → submit) · shared `Field` schema |
| **Styles** | `tokens.css` · `components.css` · `workbench.css` |

## Install

Published to **GitHub Packages** as `@willyu1007/web-workbench`. GitHub Packages requires a
token even for public packages, so a consumer configures two `.npmrc` entries:

- **Project `.npmrc`** (scope → registry; no secret, commit it):

  ```
  @willyu1007:registry=https://npm.pkg.github.com
  ```

- **`~/.npmrc`** (auth token; keep out of the repo — a `read:packages` token is enough):

  ```
  //npm.pkg.github.com/:_authToken=YOUR_TOKEN
  ```

Then add the dependency and import the styles once at the app root:

```bash
pnpm add @willyu1007/web-workbench@^0.13.0
```

```ts
import "@willyu1007/web-workbench/styles/index.css";
```

> **Fonts are host-provided.** The kit ships the family *stacks* but does not load the
> webfont files (no third-party `@import`). Load them once host-side — `next/font` is the
> recommended, self-hosted path — and map them onto the `--font-*` tokens. Full recipe:
> [TYPOGRAPHY.md → Fonts (host-provided)](./TYPOGRAPHY.md#fonts-host-provided).

> ⚠️ **Upgrading to 0.15.0 (no runtime change).** The kit finally has a test harness —
> vitest + testing-library, 19 tests on `FormFrame`, mutation-checked. `prepublishOnly`
> and CI now run it, so a failing component cannot ship. Nothing in `dist/` changed;
> tests are source-side and stay out of the tarball. See [TESTING.md](./TESTING.md).

> ⚠️ **Upgrading to 0.14.0 (additive).** The Form paradigm finally has a component:
> `<FormFrame>` at `@willyu1007/web-workbench/form` — one guided column, required
> fields and declarative constraints, validate → submit, works in a page or a Drawer.
> Use it instead of `SettingsFrame` for create/edit; that one is for settings and has
> no notion of required. The field kinds moved to a shared `contracts/field.ts`, but
> every `Settings*` type name is preserved as an alias, so nothing breaks.

> ⚠️ **Upgrading to 0.13.0 (additive).** Two things arrive, neither breaking. A `label`
> role (14px / 1.43) for control text — button faces, field text, nav rows — as
> `--label-size` / `--label-lh`; the kit's own seven control sites now read it, at the
> same 14px they already were. (0.13.0 also shipped a `.mt-label` class; 0.13.1 removes
> it — `components.css` already owned that name for the form field label, so the new
> class lost the cascade and never applied. Nothing rendered differently either way.) And
> `@willyu1007/web-workbench/brand` exports the five brand colors as JS constants for
> places that cannot hold a `var()` — a Next `themeColor`, a manifest, an email. Use
> `brand.canvas` instead of hardcoding a hex; see [GOVERNANCE.md](./GOVERNANCE.md).

> ⚠️ **Upgrading to 0.12.0 (one small visual change).** Disabled opacity was split
> across the kit — 0.5 on buttons and actions, 0.55 on the date button and the
> expandable text field. All four now read `--state-disabled-opacity`, unified on the
> reference value 0.5, so those two controls render slightly more faded when disabled.
> Nothing else moves. Overriding the variable retunes all disabled states at once.

> ⚠️ **Upgrading to 0.11.0 (no value change).** Tokens now have a machine-readable
> source: `tokens/base.json` generates `src/styles/tokens.css`. All 114 custom
> properties keep their exact names and values — the shipped CSS differs only in
> comment wording and alignment. Nothing to do but re-pin. If you contribute to the
> kit, edit the JSON and run `pnpm tokens`; `build` refuses a stale CSS artifact.

> ⚠️ **Upgrading to 0.10.0 (small behavior fixes).** Reduced motion now also stops the
> mobile sidebar slide — it was moved by `transition`, which the old
> `animation: none` block never reached, making a 280px sweep the one vestibular
> motion that ignored the user's preference. The filter chip no longer uses
> `transition: all`, so its font-weight change snaps instead of tweening (it was
> reflowing the chip). Ships [MOTION.md](./MOTION.md) and
> [INTERACTION.md](./INTERACTION.md). No API change; nothing to do but re-pin.

> ⚠️ **Upgrading to 0.9.0 (lint only, no runtime change).** The shipped lint presets now
> also ban color literals, raw shadows, and `transition: all` — previously they covered
> typography only. Nothing in `dist/` that ships to the browser changed. Adopting may
> surface existing violations in your CSS: fix them, or register them with an owner and an
> expiry using the new debt gate ([GOVERNANCE.md](./GOVERNANCE.md)). Measured on the two
> live consumers: 0 and 3 violations respectively. Also fixes a preset bug — a quoted
> inline-style key (`"fontSize": "14px"`) silently bypassed the typography lock.

> ⚠️ **Upgrading to 0.8.0 (visual, no API change).** The nine neutral tokens (ink 1–5,
> cream, sand, sand-2, stone) and `--scrim` were restored to the morethan reference
> values — the previous warm family was unrecorded drift from an outside lineage (full
> record: [DECISIONS.md](./DECISIONS.md)). Text renders slightly cooler and surfaces
> slightly lighter across every screen; no selector, class, contract, or export changed.
> Nothing to do beyond re-pinning, unless you overrode a neutral token — then re-check it
> against DECISIONS.md.

> ⚠️ **Upgrading from 0.6.x (breaking).** 0.7.0 removed the built-in Google Fonts `@import`.
> If you upgrade and change nothing else, every Latin face silently falls back to a system
> font (Manrope → system sans, Source Serif 4 → Georgia, JetBrains Mono → Menlo, Caveat →
> cursive). To keep the intended type, wire the faces host-side per the recipe above **before**
> shipping. Nothing else in 0.7.0 is breaking.

> **Loading states.** Give each App Router route segment a `loading.tsx` that renders
> `<SceneSkeleton/>`. It's server-safe and mirrors the Scene layout, so a nav click paints
> an instant on-brand placeholder instead of freezing on the previous page until the
> server responds.

> Full publish + auth runbook: [PUBLISHING.md](./PUBLISHING.md). For token-free public
> installs, publish to npmjs.com instead (GitHub Packages always needs a token).

## Use

1. **Write an adapter** mapping your view-model → a contract, and render the component.
   Prefer grouped public entries so host route chunks only pull the surface they use:

   ```tsx
   import { InsightCard, type InsightModel } from "@willyu1007/web-workbench/insight";

   const model: InsightModel = insightToCard(myReport); // your adapter
   return <InsightCard model={model} />;
   ```

   Available grouped entries: `primitives`, `shell`, `feedback`, `list`, `insight`,
   `settings`, `hub`, `queue`, and `record`. The root package entry remains for
   legacy consumers, but new code should avoid it.

   See [`examples/education-adapters`](./examples/education-adapters) for worked adapters
   (Insight readout, table status resolution).

2. **The one framework touchpoint** is [`src/components/nav.tsx`](./src/components/nav.tsx) —
   it wraps `next/link` + `next/navigation`. The kit targets **Next.js (App Router) +
   React 19**. To port to another router (Vite + react-router, Remix, TanStack), reimplement
   *only* `nav.tsx`; nothing else imports a router.

## Governance (carried from the source design system)

- **Status is pre-resolved**: a scenario maps its status vocabulary → `{ tone, label }`
  upstream (single tone source). `EntityCard`/`EntityRow`/`CellStatus` never see raw status
  strings, so the kit stays domain-free.
- **Tone = signal, not decoration**: figures default to ink; only flagged values color.
- **Controlled variants only**: scenarios tune via enumerated knobs (`emphasis`, `primary`
  kind, column defs) drawn from the token palette — never custom colors or layout.

## Design-value contract (enforced)

All type **and color** come from tokens (`tokens.css`) — never hardcode
`font-size` / `font-weight` / `font-family`, and never write a color literal
anywhere, including inside a custom property. App-authored text uses a semantic
class (`.mt-h1`…`.mt-caption`, `.mt-body`, `.mt-small`, `.mt-code`) or a scale
token; everything structured uses the kit's components (which carry their own
tuned type). This keeps every project on the kit visually identical. Wire the
shipped lint presets into CI:

```jsonc
// .stylelintrc.json — bans literal font, color, shadow, and `transition: all`
{ "extends": ["@willyu1007/web-workbench/stylelint"] }
```

```js
// eslint.config.js — bans LITERAL inline font/color values in JSX
//                     (var(--…) tokens + dynamic expressions are allowed)
import workbenchDesign from "@willyu1007/web-workbench/eslint";
export default [ ...workbenchDesign, /* …your config */ ];
```

Adopting on a codebase that is not clean yet? Register the remainder with an
owner and an expiry rather than weakening the rule — see the debt gate in
[GOVERNANCE.md](./GOVERNANCE.md).

What each rule blocks and why, the measured adoption cost, and the debt
mechanism: [GOVERNANCE.md](./GOVERNANCE.md). The scale table and a migration
cheatsheet: [TYPOGRAPHY.md](./TYPOGRAPHY.md). Why the token values are what they
are: [DECISIONS.md](./DECISIONS.md).

## Not yet in the kit (extract next if needed)

- **`format` util** — date/relative helpers are adapter-side (and need a host "today").
