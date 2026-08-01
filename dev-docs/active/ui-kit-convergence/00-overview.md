# UI kit convergence — overview

## Goal

Make `templates/web-workbench` the ecosystem's visually-authoritative web UI
kit by converging it with the morethan reference and My-Chat's adjudicated
token system: repair value drift, then adopt the structured token schema,
governance-grade lint, and the platform-neutral contracts My-Chat's
ui-visual-system task produced.

## Status

**Program complete 2026-08-01.** All four steps landed, published, and adopted by
both consumers; CI enforces the one new gate. Remaining items are follow-ups
owned elsewhere, listed at the bottom.

| Step | Done | Shipped |
|---|---|---|
| A — value fidelity repair | 2026-07-31 | 0.8.0 |
| C — lint expansion + debt gate | 2026-07-31 | 0.9.0 |
| D — contract docs | 2026-07-31 | 0.10.0 |
| B — token structuring (scoped) | 2026-08-01 | 0.11.0 |
| D-A9 — disabled opacity unified | 2026-08-01 | 0.12.0 |

- **A** — nine neutrals + scrim restored to the reference; `DECISIONS.md` created.
- **C** — presets lock color, depth, and `transition: all` alongside typography;
  `design-debt.mjs` ships as `@willyu1007/web-workbench/lint-debt`. Both
  consumers adopted with zero registered debt.
- **D** — `MOTION.md` and `INTERACTION.md` added, `TYPOGRAPHY.md` gained the
  face-verification matrix. The audit behind them found three real kit
  inconsistencies, all fixed (D-A5..D-A7).
- **B** — `tokens/base.json` is the source for all 114 custom properties;
  `tokens/emit.mjs` generates the CSS; `check:ui-tokens` gates drift and is
  green in CI (run `30679995148`). `elevation` and `state` adopted from the host
  platform's schema. Typography deliberately kept in the kit's own richer shape.
- **D-A9** — disabled opacity unified on 0.5 through an emitted token.

**Consumer adoption.** The-Nurture and The-Education are both on 0.12.0. Neither
registered any lint debt: The-Nurture had zero violations, The-Education's three
were fixed at the source.

**Cross-repo record.** The typography convergence direction is recorded on both
sides — here in the roadmap's step B, and in My-Chat
`dev-docs/active/ui-visual-system/01-plan.md` under Phase 1b.

### Follow-ups (not blocking, owned elsewhere)

- `state.selected` and `motion.spring.*` — additive, append once My-Chat's
  Phase 5 settles them on-device.
- The literal-required gap (`themeColor`, web-app manifests, email templates)
  recorded in `GOVERNANCE.md`: no lint rule can reach a value that cannot be a
  `var()`. Closing it means the kit exporting brand colors as JS constants.
  **Unowned.**
- My-Chat Phase 1b adopting Base's typography shape and validating it on iOS and
  Android — owned by that task.

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
