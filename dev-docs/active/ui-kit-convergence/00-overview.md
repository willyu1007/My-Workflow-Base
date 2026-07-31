# UI kit convergence — overview

## Goal

Make `templates/web-workbench` the ecosystem's visually-authoritative web UI
kit by converging it with the morethan reference and My-Chat's adjudicated
token system: repair value drift, then adopt the structured token schema,
governance-grade lint, and the platform-neutral contracts My-Chat's
ui-visual-system task produced.

## Status

- **A — value fidelity repair: done 2026-07-31** (this session). Nine
  neutrals + scrim restored to reference; `DECISIONS.md` created; 0.8.0
  staged (publish pending — needs owner auth).
- B — token structuring (`tokens/base.json` + emitter): not started.
- **C — lint expansion + debt gate: done 2026-07-31.** Presets now lock color,
  depth, and `transition: all` alongside typography; `design-debt.mjs` ships as
  `@willyu1007/web-workbench/lint-debt`. 0.9.0 staged (publish pending).
- D — contract docs (motion gate, fluid-interaction rules, typography
  validation matrix, de-scenarioized): not started.

## Scope

`templates/web-workbench` only. Conformance scripts gain new checks in C.
No runtime, no host code.

## Non-goals

- No absorption of My-Chat's `data-ui` role contract — it is a competing
  composition model to the workbench's locked components; two chrome-locking
  systems in one kit would be incoherent.
- No port of `ui_gate.py` — rules worth having get re-expressed as `.mjs`
  conformance checks; the Python scanner stays in My-Chat.
- No skills — Base is never a runtime; agent workflow assets stay host-side.
- My-Chat does not change. Convergence is one-directional in this program.

## Key decisions

- Warm neutral family confirmed **unintentional** drift (owner, 2026-07-31);
  repair, not redesign. Evidence and per-value record:
  `templates/web-workbench/DECISIONS.md` (D-A1..D-A4).
- Cross-repo value authority: the morethan reference as adjudicated in My-Chat
  `dev-docs/active/ui-visual-system/artifacts/phase-0/01-authority-and-values.md`;
  same-named roles must carry identical values in both repos.
- Rule-of-two timing: A is maintenance of Base's own asset (not extraction) —
  allowed now. B waits until My-Chat's ui-visual-system token schema
  stabilizes (currently active, token_version 1.2.0, dark theme incomplete).
