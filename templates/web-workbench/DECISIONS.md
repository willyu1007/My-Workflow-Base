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

## D-A10 — Motion roles are bound to the platform host by name, not by luck (2026-08-01)

The cross-repo rule at the top of this file says same-named roles carry the same
value in every repo. The five motion values are **not** same-named:

| Shared role | My-Chat `ui/tokens/base.json` | This kit |
|---|---|---|
| fast duration | `motion.duration_fast` | `--t-fast` |
| normal duration | `motion.duration_normal` | `--t-base` |
| slow duration | `motion.duration_slow` | `--t-slow` |
| standard curve | `motion.ease_standard` | `--ease-out` |
| spring curve | `motion.ease_spring` | `--ease-spring` |

So the rule that was supposed to hold them together could not see them. Audited
2026-08-01: all five values match today — 120/180/280ms,
`cubic-bezier(0.2, 0.8, 0.2, 1)`, `cubic-bezier(0.34, 1.56, 0.64, 1)`. Nothing
was enforcing that; it was hand-maintained agreement, and the failure mode is
silent. A curve retuned on either side produces a clean diff in its own repo and
no signal in the other, while Web and Mobile drift apart in feel.

`tokens/motion-role-lock.json` is the missing name mapping, and `tokens/emit.mjs`
enforces it on every `pnpm tokens` / `pnpm tokens:check` — so also on every
`build`, which means a drifted value cannot be published. Three rules:

1. Each bound role's kit var exists at exactly the locked value.
2. Kit value equals upstream value, unless the role records a `deviation` — the
   same discipline `meta.deviations_from_source` already applies to color.
3. **Every var in the Motion section is classified** as either a bound role or a
   kit-local invention with a reason.

Rule 3 is the point. Rules 1–2 catch a changed value, which someone would
plausibly notice anyway. Rule 3 catches the case nobody notices: a *new* motion
token added on one side only. That is how the two vocabularies actually diverge.

Two vars are recorded as kit-local: `--wb-reveal-duration` (derived from the
bound `--t-base`, so it tracks the role) and `--wb-reveal-shift` (a distance, not
a timing role). Both are D-A4 inventions.

Scope limit, deliberate: this binds the *token* layer. It does not reach the
three off-scale component literals D-A5 kept, and it does not bind motion
*vocabulary* — the kit reasons in CSS transitions, Mobile in Reanimated. Only the
numbers are guaranteed identical; whether both platforms spend them the same way
is a review question, not a lint question.

**Changing a bound value is a cross-repo change.** Update My-Chat first, then
re-pin `upstream.revision` and the values here. Editing this side alone now
fails the build rather than shipping a split.

## D-A11 — `label` role adopted from the platform host (2026-08-03)

The host's Phase 1b added a `label` role — 14px, ratio 1.43 — for control text:
button faces, field text, nav rows. This kit already rendered 14px in **seven**
such places with no name for it, so the role was not an import so much as a name
for something already here. Added as `--label-size` / `--label-lh`, and the seven
sites now read the token.

**Corrected in 0.13.1 — no `.mt-label` class.** 0.13.0 shipped one, which was a
mistake: `components.css` has owned `.mt-label` since long before, for the form
*field* label (12px / 600). `tokens.css` imports first, so the new class lost the
cascade and was dead on arrival — a documented class that could never apply. No
visual regression reached anyone, because the pre-existing rule kept winning.
Removed. Control text uses `font-size: var(--label-size)`, which is what the
kit's own seven sites do.

Two meanings under one name is the underlying problem: this kit's `.mt-label` is a
12px field caption, while the `label` *role* is 14px control text. One names a
control; the other is the text inside one.

**Resolved 0.17.0 — and the earlier reasoning here was wrong twice.**

It said the rename "waits for a major". First, a 0.x package does not need one:
breaking changes go in the minor position, and neither consumer's pin crosses a
minor (`0.15.2` exact, `^0.13.1` → `>=0.13.1 <0.14.0`), so even a hard rename
would reach nobody unnoticed. Second, and more to the point, no break was needed
at all.

`.mt-field-label` is now the name; `.mt-label` remains in the same selector list
and is deprecated.

**Amended 2026-08-04, after actually migrating the consumer: `.mt-label` cannot
be removed, and the premise that it would was wrong.** The-Education writes it 27
times, and only **14** sit inside an `.mt-field` — the row this kit documents as
label + control + help. The other **13** caption a value or a list (已验证, 题目,
学生, 总分, 教师代传上传). Calling those `.mt-field-label` would assert they label a
control when they do not.

So the class carries two jobs, and the rename only names one. What is actually
missing from the kit is a **small-caption** role: 12px/600 without `.mt-caption`'s
uppercase transform. Until that exists, `.mt-label` stays as the name for the
second job and the deprecation covers only the field-label use.

Worth recording how the classification was reached, because the first attempt was
wrong: proximity to an `<input>` misses wrappers that take their control through
`children` — three real field labels looked like captions. **Container membership
(`.mt-field`) is the reliable signal**, and it is reliable because it is the kit's
own documented contract rather than a guess about markup shape.

**The token name did NOT change, deliberately.** `--label-size` is externally
unused (0 consumer references) and would have been the cheapest thing to rename,
which is exactly the trap: `label` is the role name shared with the platform
host, and renaming it here would break the same-named/same-value rule at the top
of this file. The collision is Base-local — the host has no `.mt-label` — so the
Base-local name is the one that moves.

Also tokenized on the way: the rule's `font-size: 12px` was exactly
`--caption-size`, so it now reads the token (D-A5's arithmetic rule — free only
because the numbers were equal).

Two other 14px sites were deliberately left as literals: `.wb-stat__unit` (a
unit suffix inside a figure) and `.wb-insight__summary` (running prose). They are
14px by coincidence, not because they are control text. Folding them in would
have been visually identical today and wrong the moment `label` is retuned.

`body_lg` was **not** adopted. The host carries it at 16px alongside `h4` at
16px — two names for one size, with no line height on `body_lg` — which is a
leftover from the pre-Phase-1b naming rather than a role this kit lacks.

## D-A12 — brand colors exported as JS constants (2026-08-03)

Closes the gap GOVERNANCE.md had recorded as unowned. A Next `themeColor`, a
web-app manifest, an email template: none can hold a `var()`, so the only way to
write one was a hardcoded hex — and The-Education drifted to the pre-0.8.0 warm
cream `#F5F2EA` exactly that way, caught by hand rather than by any rule.

`tokens/base.json` → `literals.exports` names five colors; the emitter resolves
them from the same `sections` the stylesheet comes from and writes `src/brand.ts`,
published as `@willyu1007/web-workbench/brand`.

The emitter **rejects any export whose value is not a plain hex literal**. This
is the part worth keeping: mapping an alias like `--bg-canvas` (value
`var(--mt-cream)`) would compile, pass review, and put the string `var(--mt-cream)`
into a `<meta>` tag. Verified by probe — the alias is refused with the reason.

Scope is deliberately five colors. This is an escape hatch for contexts that take
no variable, not a parallel way to consume the system.

## D-A13 — `FormGroup.columns`, and the two field kinds deliberately not added

Assessing whether The-Education's onboarding form could move to `<FormFrame>`
produced three candidate capabilities. They got three different answers, and the
reasoning is worth keeping because the demand evidence was identical for all
three — **one consumer, zero others**, which by the rule of two justifies none of
them on demand alone.

**`columns` — added (0.16.0).** Not an extraction: `.wb-form__row` and
`.wb-form__row--3` were already in the kit's CSS, complete with a 560px collapse.
A component that cannot reach CSS the package already ships is incomplete, not
under-featured, so the consumer count does not apply. It also removes a real
foot-gun: `--3` is a modifier that sets only `grid-template-columns`, so using it
alone leaves `display: block` and the fields stack **silently**. The-Education
had exactly that bug in its province/city/district row — three columns rendering
as three stacked rows, in production, invisible in review because the markup
looks right. Pairing the classes is now the component's job.

**Multi-select — not added.** The blocker is not demand, it is a shared type.
`FieldValue` is `string | number | boolean` and `SettingsValues` is an alias of
`FieldValues`, so admitting arrays widens the **settings** API too — and
`SettingsFrame`'s dirty check is `Object.is(a[k], b[k])`, which compares arrays
by reference. Dirty tracking would break the moment an array value existed: the
"typing and undoing is not dirty" behaviour, which has a test holding it, would
start reporting dirty forever. That makes this a deliberate contract change with
a component fix and new tests attached, not a new field kind.

**Correcting the word "blocked" above**: nothing prevents this technically. The
work is known and doable today — widen the type, fix `valuesEqual` for arrays,
add the kind against the existing `.wb-chip-toggle` CSS, extend the tests. What
is missing is *benefit*: the only consumer that wants it is The-Education's
onboarding, and that form also needs a searchable select, which is not being
added. Shipping multi-select alone moves nothing. Revisit when a second consumer
needs it, or when someone commits to the searchable select as well.

**Searchable select — not added.** The consumer's `SearchSelect` is a 17-line
wrapper around a native `<datalist>`: no keyboard navigation, no filter logic, no
async options. Lifting it would publish `datalist`'s cross-browser rendering
differences as a kit promise. Building a real one is a component-sized project,
and the three call sites are a province/city/district cascade — a domain control,
not a generic one. The consumer keeps its own.

Consequence to state plainly, so nobody reads the `columns` release as a green
light: **onboarding still cannot move.** It needs all three, and it has one.

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
