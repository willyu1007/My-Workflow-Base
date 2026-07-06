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

## What's inside

| Layer | Files |
| --- | --- |
| **Contracts** (`src/contracts`) | `CardModel` · `RowModel` · `TableModel` · `InsightModel` · `WorkflowModule`/`AttentionItem` (Hub) |
| **Scene shell** | `Scene` + `SceneSkeleton` (loading placeholder) + app shell/navigation chrome |
| **Primitives** | `StatStrip`/`Stat` · `Section` · `EmptyState` · `Meter` · `icons` · `tabs` · `StatusBadge` |
| **Hub paradigm** | `<Hub modules={…}/>` — aggregation台 renderer; structure is component-locked (to-dos = rows, per-workflow stats, topbar filter) |
| **List paradigm** | `EntityCard` · `EntityRow` · `EntityTable` + cell kit (`CellIdentity`/`CellMetric`/`CellProgress`/`CellStatus`) · `ListView` (shared container: topbar filter + stats + empty + load-more) |
| **Insight paradigm** | `InsightCard` (narrative → breakdown → overview, one hairline + whitespace) |
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
pnpm add @willyu1007/web-workbench@^0.7.0
```

```ts
import "@willyu1007/web-workbench/styles/index.css";
```

> **Fonts are host-provided.** The kit ships the family *stacks* but does not load the
> webfont files (no third-party `@import`). Load them once host-side — `next/font` is the
> recommended, self-hosted path — and map them onto the `--font-*` tokens. Full recipe:
> [TYPOGRAPHY.md → Fonts (host-provided)](./TYPOGRAPHY.md#fonts-host-provided).

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

## Typography contract (enforced)

All type comes from **one scale** (`tokens.css`) — never hardcode `font-size` /
`font-weight` / `font-family`. App-authored text uses a semantic class
(`.mt-h1`…`.mt-caption`, `.mt-body`, `.mt-small`, `.mt-code`) or a scale token; everything
structured uses the kit's components (which carry their own tuned type). This keeps every
project on the kit visually identical. Wire the shipped lint presets into CI:

```jsonc
// .stylelintrc.json — bans literal font-size/weight/family in CSS
{ "extends": ["@willyu1007/web-workbench/stylelint"] }
```

```js
// eslint.config.js — bans LITERAL inline fontSize/fontWeight/fontFamily in JSX
//                     (var(--…) tokens + dynamic expressions are allowed)
import workbenchType from "@willyu1007/web-workbench/eslint";
export default [ ...workbenchType, /* …your config */ ];
```

Full rationale, the scale table, and a migration cheatsheet: [TYPOGRAPHY.md](./TYPOGRAPHY.md).

## Not yet in the kit (extract next if needed)

- **`format` util** — date/relative helpers are adapter-side (and need a host "today").
