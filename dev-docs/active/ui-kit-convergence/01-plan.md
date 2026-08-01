# Plan

## A — value fidelity repair (done)

Steps and acceptance, all met 2026-07-31:

1. Confirm drift verdict with owner (unintentional) and locate every warm
   literal — `grep` over `templates/web-workbench` found all ten in
   `src/styles/tokens.css` only. ✔
2. Restore nine neutrals to reference; adopt D-01 (`ink-4 #6B707D`) and
   D-03 (scrim = cold ink @ 0.33). ✔
3. Record deviations in `DECISIONS.md`; update misleading comments. ✔
4. Bump 0.8.0; README upgrade note. ✔
5. Acceptance: warm-literal grep exits empty on code; contrast table matches
   My-Chat T-033 numbers; same-named roles byte-equal My-Chat values. ✔
   (Evidence: `04-verification.md`.)

Remaining A follow-ups (owner):

- [ ] Publish 0.8.0 (`PUBLISHING.md` runbook; needs `write:packages` auth).
- [ ] Re-pin The-Education and The-Nurture; visual QA one screen each
      (expect: cooler text, lighter surfaces, nothing structural).

## B — token structuring (done 2026-08-01, scoped)

Entry condition re-checked and found half met (dark is deferred *by design* in
the host task's non-goals, not merely unfinished) and half unreachable (three
groups still open, gated on a Phase 5 that is itself blocked on an unbuilt local
backend). Proceeded because the retrofit-hostile piece — `elevation`'s structure
— is done, and what remains is additive. See the roadmap for the full re-check.

1. `tokens/base.json` holds all 114 custom properties plus `elevation` and
   `state`; `meta.deviations_from_source` seeded from `DECISIONS.md`. ✔
2. `tokens/emit.mjs` generates `src/styles/tokens.css`, with `--check`. ✔
3. Acceptance, met with two deliberate substitutions (evidence in
   `04-verification.md`):
   - fidelity proven on the **value map** (114/114 unchanged, tail byte-identical)
     rather than by byte-identity, which the ad-hoc hand alignment made
     unachievable without storing padding in the source; ✔
   - **no rename commit** — variable names are a consumer-facing API and were
     held fixed, so the planned second commit has nothing to do; ✔
   - drift check proven to fail on a hand-edited value, wired into `build` and
     into Base CI as `check:ui-tokens`. ✔
4. Follow-ups (owner): publish 0.11.0; decide D-A9 (0.5 vs 0.55 disabled
   opacity) before pointing `components.css` at the `state` tokens; append
   `state.selected` and `motion.spring.*` when the host settles them.

## C — governance expansion (done 2026-07-31)

1. `lint/stylelint.cjs` — color literals banned in **any** declaration (a
   property list was measured and caught 0 of 3 real violations), named colors
   banned in the 13 explicit color properties, `transition: all` banned. ✔
2. `lint/eslint.js` — color keys added to the inline-style lock; the quoted-key
   bypass and the resulting duplicate-report bug both fixed. ✔
3. Debt mechanism shipped as `lint/design-debt.mjs`
   (`@willyu1007/web-workbench/lint-debt`) rather than a Base conformance
   script — see the roadmap note on why placement changed. ✔
4. Acceptance, all met (evidence in `04-verification.md`):
   - kit's own `src/styles` stays exempt (presets target host code by
     convention; unchanged from the typography lock); ✔
   - fixture with a literal color fails — 14/14 stylelint cases, 12/12 eslint
     cases correct; ✔
   - the same fixture with a valid debt entry passes, and fails again once the
     entry expires or loses a field. ✔
5. Follow-ups (owner): publish 0.9.0; adopt in consumers — The-Nurture is
   already clean, The-Education must fix or register its 3 violations after the
   0.8.0 branch merges.

## D — contract docs (done 2026-07-31)

1. Ported as `MOTION.md`, `INTERACTION.md`, and a new verification section in
   `TYPOGRAPHY.md`; scenario/runtime vocabulary stripped. ✔
2. `MOTION.md` added to the README read-first tier, plus a "rules that ship
   with the kit" index table covering all five docs. ✔
3. Acceptance, both met (evidence in `04-verification.md`):
   - no runtime noun survives — scan returned two hits, both ordinary English; ✔
   - each doc states authority relative to `tokens.css` and `DECISIONS.md`
     (INTERACTION.md's was missing and was added after the check caught it). ✔
4. Unplanned but required: the audit backing the docs found three kit
   inconsistencies — a `transition: all`, a reduced-motion block that missed
   `.wb-sidebar`, and an off-token duration that was an exact token match. All
   fixed so the contracts describe the kit (D-A5..D-A7). ✔
5. Follow-up (owner): publish 0.10.0. No consumer action needed — the
   reduced-motion fix ships with the bump.
