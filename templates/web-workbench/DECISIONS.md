# Design-value decisions

Every deviation between this kit and the morethan design reference is recorded
here — value, reason, and whether it may be changed back. The format mirrors
`meta.deviations_from_source` in My-Chat's `ui/tokens/base.json`: an
undocumented deviation is treated as drift and repaired; a documented one is a
decision and holds.

**Reference authority.** The morethan Claude Design export
(`colors_and_type.css`), adjudicated in My-Chat
`dev-docs/active/ui-visual-system/artifacts/phase-0/01-authority-and-values.md`.
Brand disputes settle by `morethan_UI_guidelines.pdf` v1.1. Cross-repo rule:
same-named roles carry the same value in every repo unless a D-entry here or in
the consumer's token meta says otherwise.

---

## D-A1 — Neutral fidelity repair (2026-07-31)

Nine neutrals (ink 1–5, cream, sand, sand-2, stone) had drifted to a warm
family (`#1F1E1B`/`#2D2C28`/`#4A4843`/`#6E6B65`/`#A09D96`,
`#F5F2EA`/`#EDE9DD`/`#E3DDCD`/`#CFC8B6`) that matches the My-Portal lineage
My-Chat identified and repaired on Mobile — not the morethan reference. The
warming was confirmed unintentional (owner, 2026-07-31). Internal evidence
agreed: the kit's own shadow scale is authored against the cold ink
`rgba(17, 24, 39, …)`, and the window-bar gradient starts at the reference
cream `#FBF7F1`, both inconsistent with the warm values around them.

Restored to the reference: ink `#111827`/`#2A3142`/`#4B5363`/(D-A2)/`#A2A6B2`;
cream `#FBF7F1`, sand `#F5EFE6`, sand-2 `#ECE4D6`, stone `#DDD3C0`.

Do not re-warm without a brand-guideline decision recorded here.

## D-A2 — `--mt-ink-4` is `#6B707D`, not reference `#717684`

Reference muted ink `#717684` measures 4.25:1 on cream `#FBF7F1` and fails
WCAG AA for body text. Adopted My-Chat's correction (T-033 D-01): `#6B707D`
(4.64:1), hue 224.2 and saturation 0.078 held. The two repos must stay
identical on this value. Do not restore `#717684`.

Known scope limit, inherited from D-01: on sand `#F5EFE6` the same pair
measures 4.33:1 — acceptable for small/secondary text, not for body text on
sand. Identical in My-Chat (`text_muted` on `surface_elevated`). If muted body
copy ever lands on sand surfaces, that needs its own decision.

## D-A3 — `--scrim` rebased to the cold ink

The reference defines no backdrop token. The previous
`rgba(20, 25, 35, 0.36)` was a kit invention on an off-palette base. Rebased
to the cold ink at alpha 0.33 — `rgba(17, 24, 39, 0.33)` — matching My-Chat's
derived `overlay_backdrop` `#11182754` (T-033 D-03), so both repos darken
content identically behind overlays.

## D-A4 — Additive semantic roles (no reference counterpart)

`--bg-tint`, `--bg-float`, `--bg-field-quiet`, and the `--wb-reveal-*` pair
are workbench inventions. All are derived via `color-mix()` from token bases,
so they tracked the D-A1 repair automatically and need no per-value decision.
Kept.

## D-A5 — Three off-scale motion durations (2026-07-31)

A motion audit found six hardcoded durations. One — `0.18s` on the nav rail's
opacity transition — was exactly `--t-base` (180ms) and is now the token: an
identifier change with no design change.

Three are genuinely off-scale transitions, **kept as-is**:

| Site | Value | Nearest token | Would change by |
|---|---|---|---|
| `.wb-nav` grid columns | `0.22s` | `--t-slow` 280ms | +27% |
| `.wb-nav` margin | `0.22s` | `--t-slow` 280ms | +27% |
| `.wb-insight__src` color | `0.15s` | `--t-fast` 120ms | −20% |

Snapping them would let a lint rule retime a considered animation. The scale
governs *host* motion; the kit is the definition layer, the same argument
TYPOGRAPHY.md already makes for component-tuned type. Revisit only as a
deliberate motion pass, with the retiming reviewed on screen.

The last two are a **different category** and need no token: `wb-proc` (1.1s
status pulse) and `wb-shimmer` (1.4s skeleton sweep) are perpetual loops. The
duration scale covers discrete state changes — 120/180/280ms — and contains no
loop-period role, correctly. Do not force these onto it.

## D-A6 — `transition: all` removed from `.wb-chip-toggle`

The one `transition: all` in the kit. It also animated `font-weight` (the `--on`
state changes it), which reflows the chip and thrashes a variable font for no
legible benefit. Now names `background`, `border-color`, and `color`; weight
snaps, which is the correct read. MOTION.md prohibits `all` for consumers, and
the kit now holds itself to it.

## D-A7 — Reduced motion reaches the mobile sidebar

The `prefers-reduced-motion` block nulled `animation` on `.wb-reveal`,
`.wb-toast`, `.wb-drawer`, `.wb-overlay`, and the skeleton shimmer, but the
mobile `.wb-sidebar` arrives by `transition: transform` — a 280px panel sweeping
the viewport, the most vestibular motion in the kit, and the only one the block
did not reach. `transition: none` added. It still opens and closes; it arrives
rather than travels.

## D-A8 — `tokens/base.json` is the token source; `tokens.css` is generated

The CSS was its own source of truth, which is the wrong shape for a template
repo: values could only be diffed as CSS, nothing could verify a consumer had
not drifted, and a future native kit would have had to re-derive every value by
reading stylesheets. `tokens/base.json` now holds all 114 custom properties and
`tokens/emit.mjs` writes `src/styles/tokens.css`. `pnpm tokens:check` fails when
the committed CSS does not match the source, and `build` runs it, so a stale
artifact cannot be published.

**CSS variable names are a public API.** Consumers write `var(--fg-1)` in their
own stylesheets, so the source stores name and value explicitly rather than
deriving names from a category path. A nested schema would have renamed `--fg-1`
to `--color-fg-1` and broken every consumer silently; the flat mapping is
deliberate.

**Fidelity was proven by value, not by bytes.** The old file was hand-aligned ad
hoc — 114 declarations across 12 different value-start columns, inconsistent even
within a section — so byte-identical output would have required storing per-token
padding and turning a design document into a formatting record. The emitter
normalizes alignment instead, and the guarantee is stronger than byte-identity:
all 114 name→value pairs are unchanged, with none added, removed, or altered.
Everything after the `:root` block is byte-identical.

**`elevation` and `state` are in the source but not in the CSS.** `elevation` is
the platform-neutral depth encoding a future native kit needs (iOS shadow
primitives plus an Android scalar, with the two-layer reduction rule recorded
next to the values); the web already has `--shadow-*`, so emitting 25 unused
custom properties onto every page would cost bytes for nothing. `state` records
the canonical pressed/disabled/hover values, which currently live as literals
inside `components.css`. Pointing those at variables is a behaviour-affecting
refactor and is deliberately not part of this change — see D-A9.

## D-A9 RESOLVED 2026-08-01 — disabled opacity unifies on 0.5

`components.css` carried `opacity: 0.5` for disabled on `.mt-btn` and
`.wb-action` and `opacity: 0.55` on `.mt-date-button` and
`.mt-expandable-text-field`. All four are the same semantic role; the reference
specifies 0.5. Owner decided to unify on 0.5.

Fixed at the source rather than by editing four literals: `state.disabled.opacity`
is now emitted as `--state-disabled-opacity`, and all four sites read it. The
split cannot silently return, because there is one value and the token gate
fails if the CSS stops matching it.

**This is a visual change**, small but real: the date button and the expandable
text field render slightly more faded when disabled (0.55 → 0.5). Nothing else
moves.

Only this leaf of `state` is emitted. `pressed` and `hover` stay structural —
the reference expresses them as a transform and a `color-mix()` inside component
rules, so consuming them is a refactor rather than a token emission, and there
is no drift to fix there today.

## Accepted off-scale literals

- `components.css` `.mt-window-bar` gradient endpoint `#F2EBDF` — decorative
  macOS window chrome; the endpoint has no scale value. The gradient start is
  the canonical cream.
- macOS window dots `#FF5F57` / `#FEBC2E` / `#28C840` — deliberate platform
  mimicry, not brand color.
- `#fff` foregrounds on navy/orange fills — equivalent to the reference's
  `--fg-on-navy` / `--fg-on-orange`.

## Honest ledger

The accidental warm ink-4 on the accidental warm cream measured 4.75:1 —
slightly better muted contrast than the repaired pair. The repair still wins:
it restores the adjudicated brand system, re-aligns text with the shadow and
border families that were always cold, and keeps this kit byte-comparable with
My-Chat's token layer for the planned schema convergence.
