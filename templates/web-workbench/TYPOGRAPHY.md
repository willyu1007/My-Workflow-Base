# Typography contract

One scale, consumed — never redeclared. This is how every project on the kit keeps
identical type. It is the same principle as the components: **lock the foundation,
vary the content.**

## The scale (defined once in `tokens.css`)

| Role | Size / line-height / weight | Class | Use for |
| --- | --- | --- | --- |
| Display | 56 / 1.05 / 800 | `.mt-display` | hero wordmark |
| H1 | 40 / 1.1 / 700 | `.mt-h1` | page title |
| H2 | 28 / 1.2 / 700 | `.mt-h2` | section title |
| H3 | 20 / 1.3 / 600 | `.mt-h3` | subsection |
| H4 | 16 / 1.35 / 600 | `.mt-h4` | card / block title |
| Body | 15 / 1.55 / 400 | `.mt-body` | running text |
| Small | 13 / 1.5 | `.mt-small` | secondary / meta |
| Caption | 12 / 1.4 / 600 · uppercase | `.mt-caption` | labels, eyebrows |
| Code | 13 (mono) | `.mt-code` | inline code / timestamps |

The font **families** are declared once as token stacks (`--font-sans` / `--font-display`
/ `--font-serif` / `--font-mono` / `--font-hand`) in `tokens.css`. The kit does **not**
load the webfont files — that is the host's job (see [Fonts (host-provided)](#fonts-host-provided)
below). Keeping the *stacks* in one place is what guarantees the family order is identical
across projects; the host only supplies the actual faces.

## Fonts (host-provided)

The kit ships the family **stacks** but not the font **files** — it deliberately does
**not** `@import` from `fonts.googleapis.com` (that import was render-blocking on first
paint and hard-blocked behind the Great Firewall). Load the faces host-side, once, and
map them onto the kit tokens. The recommended path is `next/font` (self-hosted, no
third-party request, no layout shift):

```tsx
// app/layout.tsx — load once at the app root
import "@willyu1007/web-workbench/styles";
import "./fonts.css"; // AFTER the kit styles, so its :root override wins
import { Manrope, Source_Serif_4, JetBrains_Mono, Caveat } from "next/font/google";

const sans  = Manrope({ subsets: ["latin"], variable: "--f-sans",  display: "swap" });
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--f-serif", display: "swap" });
const mono  = JetBrains_Mono({ subsets: ["latin"], variable: "--f-mono",  display: "swap" });
const hand  = Caveat({ subsets: ["latin"], variable: "--f-hand",  display: "swap" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${sans.variable} ${serif.variable} ${mono.variable} ${hand.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

```css
/* fonts.css — point the kit tokens at the self-hosted faces, keeping the
   system CJK fallbacks. (Latin faces are self-hosted; Chinese resolves to the
   platform Han font — PingFang SC / system-ui — instead of a heavy CJK webfont.) */
:root {
  --font-sans:    var(--f-sans),  "Noto Sans SC", "PingFang SC", "HarmonyOS Sans", "Source Han Sans SC", system-ui, sans-serif;
  --font-display: var(--f-sans),  "Noto Sans SC", "PingFang SC", system-ui, sans-serif;
  --font-serif:   var(--f-serif), "Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong", Georgia, serif;
  --font-mono:    var(--f-mono),  "SF Mono", ui-monospace, Menlo, Consolas, monospace;
  --font-hand:    var(--f-hand),  "Ma Shan Zheng", "Kaiti SC", "STKaiti", "KaiTi", cursive;
  --font-hand-cn: "Ma Shan Zheng", "Kaiti SC", "STKaiti", "KaiTi", var(--f-hand), cursive;
}
```

> **Notes.** Do not pass a `weight` array to variable fonts (Manrope / Source Serif 4 /
> JetBrains Mono / Caveat are variable) — omit it to load the full axis. Redefining the
> `--font-*` stacks is the *one* sanctioned host override of a kit token, because font
> *loading* is a host concern; do not otherwise redeclare `--font-*`, and never restyle
> font size/weight (those stay governed by the scale and the lint below). Want the
> original Google-hosted CJK faces? Self-host `Noto Sans SC` / `Noto Serif SC` /
> `Ma Shan Zheng` too and prepend their variables — the kit stays out of it.

### Load only what you render

Every face you wire is bytes on first paint. Manrope drives `--font-sans` and
`--font-display` (26 call sites in the kit) and JetBrains Mono drives
`--font-mono` — including kit chrome like the sidebar's `.wb-nav__count`, so a
host that never writes a mono class still renders one. `--font-serif` and
`--font-hand` are declared but unused by the kit: wire them only if your app
renders `.mt-serif` or `.mt-hand`. Both live consumers load exactly two faces.

## Verifying the faces actually render

A font stack is a **declaration, not evidence.** The kit ships stacks and the
host supplies the files, so nothing in this package can guarantee what a user
sees — the first face may be missing, unlicensed, or missing the glyphs your
copy needs, and the browser will silently substitute without telling anyone.
That silence is the risk: the whole point of 0.7.0 moving font loading host-side
is that the host now owns a failure mode it cannot see by reading CSS.

Run this after wiring fonts, and again after changing any face.

| Set | Specimen | Check |
|---|---|---|
| Chinese | `新的聊天。请确认后再继续。` | Glyph coverage, punctuation shape, line box, wrapping, weight |
| Mixed | `workbench 工作流 v2 — actor 记录` | CJK/Latin baseline, spacing, fallback switches mid-run |
| Numeric | `2026-07-31 12:48 · 38% · ¥1,024.50` | Tabular alignment where it matters, symbol coverage, clipping |
| States | Label, body, caption, error, disabled, a long heading | Hierarchy, contrast, truncation, vertical centering |
| Scale | Default plus the browser text sizes you support | Reflow, clipping, fixed-height failures |
| Weights | Regular, medium, semibold, bold | Whether the real face resolves, or the browser is synthesizing |

For a Chinese-language product the first three rows are release-blocking: they
all appear on the default screen, so a miss there is not an edge case.

Two things worth checking explicitly, because both fail quietly:

- **Resolved face, not declared face.** Read the rendered font in DevTools
  (Inspect → Computed → Rendered Fonts), per specimen. A stack whose first entry
  never loads looks fine in the source and wrong on screen.
- **Synthetic weights.** If a weight is missing, browsers fake it by smearing the
  glyphs. It reads as "slightly off" rather than broken, which is why it ships.
  Variable fonts avoid this — which is why the recipe above passes no `weight`
  array.

Record, for each platform: declared stack, resolved face, license and
redistribution terms for anything self-hosted, and any missing-glyph, fallback,
clipping, or scaling finding.

## The two rules

1. **App-authored text** → use a semantic class (`.mt-h1`…`.mt-caption`, `.mt-body`,
   `.mt-small`, `.mt-code`) **or** a scale token (`font-size: var(--h3-size)` etc.).
   Never a literal `font-size` / `font-weight` / `font-family`.
2. **Everything structured** → use the kit's components. They carry their own
   (component-tuned) type — you do not restyle their text.

### Why components may hold "off-scale" values but your app may not

The scale governs **content** typography. A component legitimately needs fine-grained,
tuned values for its own anatomy — an 11px uppercase table header, a 30px stat figure,
the 13.5px breadcrumb path tier. Those live in the kit's `src/styles`, which is the
**definition layer** — one file, shipped identically to every consumer, so they never
drift. Your app re-inventing `font-size: 17px` for a "card title", however, *is* drift:
the same role renders differently in every project. That is exactly what the lint blocks.

## Enforcement (shipped with the kit)

Wire both presets into CI. They target **consumer-authored** code, not the kit.

**stylelint** — bans literal font properties in your CSS (allows `var(--…)` + resets):

```jsonc
// .stylelintrc.json
{ "extends": ["@willyu1007/web-workbench/stylelint"] }
```

**ESLint** (flat config) — bans **literal** inline `style={{ fontSize / fontWeight / fontFamily }}` (allows `var(--…)` tokens + dynamic expressions, matching stylelint):

```js
// eslint.config.js
import workbenchType from "@willyu1007/web-workbench/eslint";
export default [
  ...workbenchType,
  // …your config
];
```

> Flat-config `no-restricted-syntax` is last-wins. If you already use that rule, merge
> the two selectors from the preset into your own entry rather than spreading it.

## Migration cheatsheet (snap off-scale → nearest role)

When a lint error fires, replace the literal with the nearest scale role — **do not add
a new step.**

| Found literal | → Role |
| --- | --- |
| 11px / 12px | `.mt-caption` (12) |
| 13px / 14px | `.mt-small` (13) |
| 15px | `.mt-body` (15) |
| 16px / 17px / 18px | `.mt-h4` (16) |
| 19px / 20px / 22px | `.mt-h3` (20) |
| 24px–28px | `.mt-h2` (28) |
| weight 800 | reserve for `.mt-display`; titles use the role's own weight (700/600) |
