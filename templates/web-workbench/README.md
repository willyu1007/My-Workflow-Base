# web-workbench

Scenario-agnostic **web workbench UI kit** — the presenter layer for a workflow's
web surface. Contracts (types) + presentational React components for the Scene
paradigms; a host scenario writes *adapters* that map its own view-models onto
the contracts, and the components render them. No domain vocabulary lives in the
kit ("lock the chrome, vary the content").

This mirrors the host-runtime template: a host project copies/depends on this
package, then implements its own adapters + data — same way it implements
handlers/policies against `workflow-contracts`.

## What's inside

| Layer | Files |
| --- | --- |
| **Contracts** (`src/contracts`) | `CardModel` · `RowModel` · `TableModel` · `InsightModel` · `WorkflowModule`/`AttentionItem` (Hub) |
| **Scene shell** | `Scene` + `SceneNav` |
| **Primitives** | `StatStrip`/`Stat` · `Section` · `EmptyState` · `Meter` · `icons` · `tabs` · `StatusBadge` |
| **List paradigm** | `EntityCard` · `EntityRow` · `EntityTable` + cell kit (`CellIdentity`/`CellMetric`/`CellProgress`/`CellStatus`) · `ListView` (shared container: topbar filter + stats + empty + load-more) |
| **Insight paradigm** | `InsightCard` (narrative → breakdown → overview, one hairline + whitespace) |
| **Styles** | `tokens.css` · `components.css` · `workbench.css` |

## Consuming it

1. **Depend on it** (workspace or copy into your repo), then import styles once at the app root:

   ```ts
   import "@workflow/web-workbench/styles";
   ```

2. **Write an adapter** mapping your view-model → a contract, and render the component:

   ```tsx
   import { InsightCard, type InsightModel } from "@workflow/web-workbench";

   const model: InsightModel = insightToCard(myReport); // your adapter
   return <InsightCard model={model} />;
   ```

   See [`examples/education-adapters`](./examples/education-adapters) for worked adapters
   (Insight readout, table status resolution).

3. **The one framework touchpoint** is [`src/components/nav.tsx`](./src/components/nav.tsx) —
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

## Not in v1 (extract next if needed)

- **Hub renderer** (`dashboard-client`) — the `WorkflowModule` *contract* is here; the
  aggregating page component stays host-side for now.
- **App shell** (sidebar / topbar / breadcrumb / account menu) — host chrome.
- **`format` util** — date/relative helpers are adapter-side (and need a host "today").
