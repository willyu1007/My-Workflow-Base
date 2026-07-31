# UI kit convergence — roadmap

Sequenced program. Each step is independently shippable; A unblocks nothing
downstream except that B's emitter must produce A's values.

## A — Value fidelity repair (done 2026-07-31)

Restore the nine drifted neutrals and `--scrim` in
`templates/web-workbench/src/styles/tokens.css` to the morethan reference,
adopting My-Chat's two recorded deviations (D-01 ink-4 AA correction, D-03
backdrop derivation). Record every deviation in `DECISIONS.md`. Ship 0.8.0.

Risk: consumers (The-Education, The-Nurture, pinned 0.7.0) see a subtle
global visual change on re-pin. Mitigation: README upgrade note; no API
change, so rollback is a version pin.

## B — Token structuring

Introduce `templates/web-workbench/tokens/base.json` (schema shape from
My-Chat: color / typography / space / radius / shadow / **elevation** /
**state** / motion / z / sizing + meta.deviations) and an emitter that
generates `src/styles/tokens.css`. Two-commit discipline copied from
My-Chat's mobile migration: values-only first (byte-comparable CSS output),
then structure-only.

`elevation.*` (platform-neutral depth) and `state.*` (pressed/disabled/hover)
land here — they are the prerequisite for a future mobile kit and are the
expensive-to-retrofit part of the schema.

Entry condition: My-Chat ui-visual-system token schema stabilized (its dark
theme completed or explicitly deferred with values frozen).

## C — Governance expansion

- stylelint preset: extend beyond typography to ban literal colors, raw
  `box-shadow`, and `transition: all` in consumer CSS (allow `var(--…)`).
- eslint preset: same for inline styles.
- Conformance: a `legacy_debt`-style allowlist (path + rules + owner +
  expires_at_utc + reason; per-file per-rule, auto-expiring) so new checks
  can land strict without forcing same-day fixes on consumers. `.mjs`, in
  `conformance/scripts/`.

## D — Contract docs

De-scenarioized ports into `templates/web-workbench/docs/` (or kit root):

- Motion decision gate (frequency / purpose / safety / accessibility /
  performance; "no motion" is a valid outcome) from My-Chat
  `docs/context/ui/motion-contract.md`.
- Fluid-interaction 8 rules + capability fallback table from
  `platform-interaction-contract.md`.
- Typography validation matrix (Chinese / mixed / numeric / states / scale /
  weights specimens) from `typography-contract.md` — especially needed here
  because fonts are host-provided.

Strip morethan/PBR/publish vocabulary; keep only platform-neutral rules.
