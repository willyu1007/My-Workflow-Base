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

## C — governance expansion

1. Extend `lint/stylelint.cjs`: `color`, `background(-color)`, `box-shadow`,
   `transition` join the allowed-list regime (`var(--…)` + resets pass).
2. Extend `lint/eslint.js` symmetrically for inline styles.
3. Add allowlist mechanism (five-field `legacy_debt` shape, auto-expiring)
   as a conformance script so consumers can adopt strict lint incrementally.
4. Acceptance: kit's own `src/styles` (definition layer) stays exempt;
   a fixture consumer with a literal color fails; the same fixture with a
   valid debt entry passes until expiry.

## D — contract docs

1. Port motion gate, fluid-interaction rules, typography validation matrix
   from My-Chat `docs/context/ui/`; strip scenario vocabulary (morethan
   casing rules stay — it is the brand; PBR/publish/actor language goes).
2. Link from README the way PARADIGMS.md is linked ("read first" tier for
   motion when a consumer adds animation).
3. Acceptance: no My-Chat-runtime noun survives in the ported text; each doc
   states its authority relative to `tokens` and `DECISIONS.md`.
