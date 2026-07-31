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

## D — contract docs

1. Port motion gate, fluid-interaction rules, typography validation matrix
   from My-Chat `docs/context/ui/`; strip scenario vocabulary (morethan
   casing rules stay — it is the brand; PBR/publish/actor language goes).
2. Link from README the way PARADIGMS.md is linked ("read first" tier for
   motion when a consumer adds animation).
3. Acceptance: no My-Chat-runtime noun survives in the ported text; each doc
   states its authority relative to `tokens` and `DECISIONS.md`.
