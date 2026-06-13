# Scene Paradigms — the rules that ship with the kit

The kit gives you **bricks** (components + tokens). These are the **rules** that turn
bricks into a coherent product. Any new scenario picks from the fixed paradigms below —
it does not invent layouts. The components are built so the right structure is the easy
(often the only) one; this file is the spec behind that.

## Mental model: letters → words → sentences

- **Letters** = `Scene` shell + primitives (`StatStrip`/`Stat`/`Section`/`EmptyState`/`Meter`,
  `icons`, `StatusBadge`, `Menu`, `TopbarPortal`).
- **Words** = the 6 paradigms below — fixed "postures" assembled from the letters.
- **Sentences** = your scenario. You write *adapters* that map your view-models onto the
  contracts; the components render them. No domain vocabulary lives in the kit.

## The 6 paradigms — and which component renders each

| Paradigm | Mind-set | Render with | Hard rule |
| --- | --- | --- | --- |
| **Hub** (概览台) | "What do I act on today?" | **`<Hub modules={…}/>`** | To-dos are **`EntityRow` rows, never cards**. Stats = per-workflow `StatStrip`. Filter + quick-actions live in the **topbar** menu, not the body. |
| **List** (列表) | "Browse a kind of object, pick one." | **`<ListView present={…}/>`** + a presentation: `EntityCard` (live objects), `EntityTable` (compare/sort), `EntityRow` (directory) | Filter is a **topbar dropdown**; whole card/row → detail. |
| **Queue** (队列) | "Work a pile down, one by one." | `EntityRow` with a `trailing` action button | Inline button = 去做; act in a right-side `Drawer`, no page jump. |
| **Record** (详情) | "See one object whole, act on it." | `Scene` (intro + `Tabs`) | Primary action top-right; sub-actions in a `Drawer`. |
| **Insight** (洞察) | "Read data + conclusion." | **`<InsightCard model={…}/>`** | Narrative → breakdown → overview; one hairline + whitespace; tone = signal only. |
| **Form** (表单) | "Create / edit one object." | Single-column guided form | Validate → submit → toast; whole page or in a `Drawer`. |

## 6 iron rules (hold in every paradigm)

1. **Primary action is always top-right of the scene bar** (the one orange button).
2. **Segmented = workflow-step nav (in the scene bar); filter = topbar dropdown.** Never mix.
3. **Status always uses one semantic-tone source** — same color, same meaning, every screen.
4. **Affordance:** trailing `chevron` = 去看 (navigate); inline button = 去做 (act).
   A **card means "click to view detail"** — so an actionable to-do is a **row with a `cta`**, not a card.
5. **"Do one thing" always opens a right `Drawer`**, never a page jump — keep context.
6. **Stats are always a top `StatStrip`** (line-free; no tray/card/icon).

## Governance: lock the chrome, vary the content

- **Status is pre-resolved.** Your adapter maps your status vocabulary → `{ tone, label }`
  upstream. `EntityCard`/`EntityRow`/`CellStatus` never see raw status strings.
- **Tone = signal, not decoration.** Figures default to ink; only flagged values color,
  drawn from the `CardTone` palette — never custom colors.
- **Controlled variants only.** Tune via enumerated knobs (`emphasis`, `primary` kind,
  column defs, the `--nav-gap-*` tokens) — never new colors or bespoke layout.

> Rule of thumb: if you reach for `EntityCard` on a dashboard, stop — the Hub wants rows.
> Use `<Hub>`; it makes the wrong thing unreachable.
