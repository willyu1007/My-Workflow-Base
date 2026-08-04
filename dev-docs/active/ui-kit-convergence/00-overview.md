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

### Post-program work (2026-08-03, after close-out)

The program closed at 0.12.0; consumer-driven work continued in the same bundle:

| Shipped | What |
|---|---|
| 0.13.0 / 0.13.1 | `label` role (host-ward adoption from Phase 1b); `brand` constants for literal-required contexts (`themeColor` gap closed — was the unowned follow-up below); dead `.mt-label` class removed |
| 0.14.0 / 0.14.1 | Form paradigm component (`FormFrame` + shared field contract); Queue/Record named in PARADIGMS.md — all six paradigms now name their renderer |
| 0.15.0–0.15.2 | Test harness: vitest + testing-library, 57 mutation-checked tests over the five stateful components, gating publish and CI |

Consumers are on 0.13.1; 0.14+/0.15+ carry no runtime value changes, so
re-pinning rides the next real change (the natural one: migrating Nurture's
create-project flow from SettingsFrame to FormFrame).

### Follow-ups (not blocking, owned elsewhere)

- ~~`state.selected`~~ — resolved 2026-08-04: **not dropped, never coming as
  planned**. My-Chat's D-07 encoding deliberately omits it (the reference
  expresses selection through palette surfaces that are already tokens); the
  live question is naming — `brand.accent` vs a `selected` state role — tracked
  in its `08-open-items.md` §6, which now also states the cross-repo
  consequence: whichever name lands, this kit appends the same one.
- `motion.spring.*` — My-Chat's Phase 5 completed **without** spring tokens
  (release velocity selects a duration from the existing scale; D-05 refused
  invented values). Springs get minted only if the owner judges the settle
  insufficiently alive on-device. If minted, append here + `motion-role-lock`.
- ~~The literal-required gap~~ — **closed in 0.13.0**. `@willyu1007/web-workbench/brand`
  exports the five colours a meta tag, manifest or email needs, generated from
  the same token source; The-Education's `themeColor` reads `brand.canvas`.
- ~~My-Chat Phase 1b typography~~ — **landed**. Nine per-role line-height ratios
  and the five tracking values are in its `ui/tokens/base.json`, credited to this
  kit in the token file's own note. Cross-platform validation on iOS/Android
  remains that task's, not this one's.
- **`label` naming collision (D-A11)** — this kit's `.mt-label` is a 12px field
  caption while the role it now carries is 14px control text. Renaming the class
  is breaking (consumers write it in JSX), so it waits for a major. Kit-side.
- **Multi-select field kind (D-A13)** — blocked on a contract change, not on
  demand: admitting arrays to `FieldValue` widens `SettingsValues` and breaks
  `SettingsFrame`'s `Object.is` dirty check. Kit-side, deliberate.
- **26 of 31 components untested** — a deliberate stop, not an omission. The
  rule in `TESTING.md` is that a component gets a suite when it grows state.

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
