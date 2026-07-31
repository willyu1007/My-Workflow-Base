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
