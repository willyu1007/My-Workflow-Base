# Verification

## A — value fidelity repair (2026-07-31)

**No warm-lineage literal survives** in `templates/web-workbench/{src,lint,*.md}`:

```bash
grep -rniE '1F1E1B|2D2C28|4A4843|6E6B65|A09D96|F5F2EA|EDE9DD|E3DDCD|CFC8B6|rgba\(20, ?25, ?35' \
  src/ lint/ *.md
# exit 1 (no matches) — DECISIONS.md intentionally records the old values; it is
# excluded by being the decision record itself. Re-run without *.md to confirm
# code-only cleanliness if DECISIONS.md ever trips a future scanner.
```

(Verified: the only remaining mentions of the old values are inside
`DECISIONS.md` and this task bundle, both records by design.)

**Contrast (WCAG relative luminance), matches My-Chat T-033 D-01:**

| Pair | Ratio | Verdict |
|---|---|---|
| `#6B707D` on `#FBF7F1` (muted on cream) | 4.64:1 | AA pass — matches My-Chat's recorded 4.64:1 |
| `#717684` on `#FBF7F1` (reference value) | 4.25:1 | AA fail — why D-A2 exists |
| `#6B707D` on `#F5EFE6` (muted on sand) | 4.33:1 | known scope limit, identical in My-Chat; recorded in D-A2 |
| `#111827` on `#FBF7F1` | 16.62:1 | AA/AAA pass |

**Cross-repo value identity** (workbench ↔ My-Chat `ui/tokens/base.json`):
ink 1–5 ≡ `ink.1-5`, cream/sand/sand-2/stone ≡ `warm.*`, scrim
`rgba(17,24,39,0.33)` ≡ `overlay_backdrop #11182754` (alpha 84/255 ≈ 0.329).

**Source-lock unaffected:** `conformance/workflow-contract-source-lock.json`
contains zero `templates/web-workbench` entries; `check:workflow-contract-source`
scope untouched.

**Not run:** package build (CSS-only change; `prepublishOnly` builds at
publish time), workflow-contract suites (out of scope for this directory).

## C — lint expansion and debt gate (2026-07-31)

**Rule precision — 14-case stylelint fixture**, covering token/reset/composed
passes and shorthand/hex/rgba/named/raw-shadow/gradient/transition-all/
custom-property failures: **14 correct, 0 wrong**. The two cases that matter:

| Case | Result |
|---|---|
| `--kc-field-bg: color-mix(in oklab, var(--a) 50%, var(--b))` | pass (no false positive on the `oklab` word) |
| `--kc-focus-ring: 0 0 0 2px rgba(40, 62, 104, 0.22)` | fail (escape hatch closed) |

**ESLint fixture — 12 cases** (both key forms, colors, keywords, dynamic
expressions, layout-only styles): 12/12 correct. Duplicate-report regression
checked explicitly — exactly 5 messages on exactly the 5 expected lines.

**Measured adoption cost** (final presets, live consumers):

| Repo | Host CSS | Inline styles |
|---|---|---|
| The-Nurture | 0 violations / 2 files | 0 / no inline styles |
| The-Education | 3 violations / 1 file | 0 / 54 TSX files scanned |

All three Education hits are true positives (2× `background: #fff`, 1×
`--kc-focus-ring`). Zero false positives in either repo.

**Regression — existing consumers still pass.** Both repos re-linted with the
new presets wired the way they actually wire them (Nurture's
`@typescript-eslint/parser` setup; Education's `tseslint.config`): stylelint
exit 0 on Nurture, 0 design-lock ESLint violations on both.

**Debt gate — five scenarios**, run against Education's real 3-violation report:

| Scenario | Exit | Behavior |
|---|---|---|
| no registry | 1 | 3 unregistered violations reported |
| live entry covering the file+rule | 0 | `clean — 3 violation(s), 3 covered by 1 live entry` |
| expired entry | 1 | stops suppressing, names owner and expiry |
| entry missing `expires_at_utc` | 1 | `registry is invalid`, field named |
| entry matching nothing | 0 | needless-entry warning, does not fail |

**Format auto-detection:** the same gate consumed an ESLint JSON report
(7 messages) and a stylelint JSON report (3 warnings) without configuration.

**Not run:** package build (`prepublishOnly` builds at publish time); no runtime
code changed in C.

## D — contract docs (2026-07-31)

**Kit self-compliance after the fixes** — the contracts must describe the kit,
not aspire:

| Check | Result |
|---|---|
| `transition: all` occurrences in kit CSS | 0 (was 1) |
| `prefers-reduced-motion` covers every spatial motion | yes — reveal, toast, drawer, overlay, skeleton, nav pulse (animations) + `.wb-sidebar` (transition) |
| Hardcoded durations | 5, each classified: 3 off-scale transitions kept with rationale, 2 perpetual loops correctly tokenless (D-A5) |

Counting note: the first duration sweep reported 4 sites because the `grep`
filter excluded any line containing `var(--t-`, which hid a second `0.22s`
sharing a line with the value just tokenized. Re-counted by occurrence rather
than by line — 6 total, 1 fixed, 5 classified. Same failure mode as the C-step
duplicate-report bug: verify counts, not presence.

**CSS integrity after edits:** brace balance 0, 48407 bytes, stylelint parses
without parse errors (rule violations on the kit's own CSS are expected — it is
the definition layer and is not linted by the host preset).

**De-scenarioization:** scanned MOTION.md, INTERACTION.md, and TYPOGRAPHY.md for
PBR, public-ready/public draft, outbox, Postgres, canonical, actor provenance,
audit, scenario_key, My-Chat, AGENTS, skill names, `docs/context`, and the host
brand name. Two hits, both ordinary English (`no external value is canonical`,
`Audit both mechanisms`), no runtime vocabulary.

**Authority anchoring:** MOTION.md and INTERACTION.md each state their authority
order relative to `tokens.css` and `DECISIONS.md` (INTERACTION.md's was added
after the check found it missing).

**Not run:** package build (`prepublishOnly` builds at publish); no visual
regression run — the reduced-motion change is only observable under an OS
setting, and the chip-toggle change removes an unintended font-weight tween.

## Consumer adoption — The-Nurture 0.8.0 → 0.10.0 (2026-07-31)

First real-world adoption of the C-step lint expansion, since this app consumes
the shipped presets directly rather than the source files earlier measurements
used.

| Check | Result |
|---|---|
| Resolved version | 0.10.0, lockfile single resolution |
| Shipped CSS carries D fixes | `transition: all` count 0; `.wb-sidebar { transition: none }` present |
| Shipped tokens still A-repaired | `--mt-ink: #111827` |
| Presets installed with new rules | color keys in `eslint.js`, `COLOR_LITERAL` in `stylelint.cjs`, `design-debt.mjs` present |
| **Rules actually fire** | probe CSS (`color: #123456`, raw `box-shadow`) rejected in the app's own lint setup |
| `pnpm --filter @the-nurture/frontend lint` | exit 0 |
| `tsc --noEmit` | exit 0 |

The probe matters: a clean lint run only counts as evidence once the rules are
proven live. Zero violations under rules that silently failed to load would look
identical.

Predicted adoption cost was 0 violations; actual was 0. No host code changed.

**Incidental finding:** a literal on one of the 13 explicit color properties
reports twice (both the catch-all and the allow-list match). Cosmetic, one fix
per pair; kept deliberately and documented in GOVERNANCE.md — collapsing it
would weaken the allow-list into an enumerable blacklist.

## Consumer adoption — The-Education 0.6.x → 0.10.0 (2026-07-31)

Landed on `main` as `a382c05`, merging the pending 0.8.0 branch first. Prepared
in an isolated worktree so the repo's in-flight `codex/t040-*` checkout was never
touched (confirmed clean and on its own branch afterward).

| Check | Result |
|---|---|
| Pin reconciliation | root and `apps/web` both `^0.10.0`; lockfile single resolution (was 0.6.1 + 0.6.5 resolved simultaneously) |
| Shipped kit sanity | `--mt-ink: #111827`, `--mt-cream: #FBF7F1`, zero active `@import` |
| stylelint (repo's own config, strict presets) | exit 0 |
| **Rules actually fire** | probe `color: #123456` rejected |
| eslint (repo's own config) | 97 files, 0 messages |
| `tsc -b` | 21 errors — identical to the established pre-existing baseline; 0 in touched files |

**The three violations were fixed, not registered as debt.** All three were real
drift and the fixes are appearance-preserving:

| Site | Before | After | Why |
|---|---|---|---|
| `.wb-share-channel__qr` | `background: #fff` | `var(--mt-paper)` | Pure white is functional (QR scan contrast); `--mt-paper` is the kit's pure-white role, same `#FFFFFF` |
| `.qb-resource__img` | `background: #fff` | `var(--bg-surface)` | It is a surface |
| `--kc-focus-ring` | `rgba(40, 62, 104, 0.22)` | `color-mix(in oklab, var(--mt-navy) 22%, transparent)` | `rgb(40,62,104)` **is** `--mt-navy` `#283E68`; same alpha, sourced from the token, matching the kit's own `--bg-tint` idiom |

Deliberately **not** swapped to the kit's `--shadow-focus`: that is orange at 3px
against this ring's navy at 2px, so it would change how focus looks. Whether the
host should adopt the kit's focus treatment is a design decision for the owner —
the same D-A5 principle that kept the off-scale durations.

So the debt gate shipped in C went unused by both consumers. That is the
intended outcome: it exists so a strict rule can land without forcing a
same-day cleanup, not because a cleanup was expected to be unaffordable.
