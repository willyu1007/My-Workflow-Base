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

## B — token structuring (blocked on entry condition)

Entry: My-Chat ui-visual-system schema stable (dark values landed or frozen).

1. Copy schema shape (not values pipeline) into
   `templates/web-workbench/tokens/base.json`; include `elevation.*`,
   `state.*`, `meta.deviations_from_source` seeded from `DECISIONS.md`.
2. Emitter (`.mjs`) → `src/styles/tokens.css`. Commit 1: generated output
   byte-identical to hand-written file (proves emitter fidelity). Commit 2:
   structural renames only, values held byte-identical.
3. Acceptance: CSS diff between commits is provably identifiers-only; a
   conformance check fails when `tokens.css` drifts from `base.json`.

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
