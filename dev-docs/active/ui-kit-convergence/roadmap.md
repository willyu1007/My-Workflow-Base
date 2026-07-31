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

## C — Governance expansion (done 2026-07-31)

- stylelint preset: bans color literals in **any** declaration (shorthands,
  functions, and custom properties — not just color properties), named colors
  in the explicit color properties, and `transition: all`. Shipped 0.9.0.
- eslint preset: mirrors it for JSX inline styles, and fixes a pre-existing
  hole where a quoted key (`"fontSize": "14px"`) bypassed the typography lock.
- Debt gate: `lint/design-debt.mjs`, exported as
  `@willyu1007/web-workbench/lint-debt`.

**Design change from the original plan.** The debt registry was scoped to
`conformance/scripts/` — wrong place. Base's conformance runs against Base's own
templates, which have no consumers and no violations; a debt filter there would
gate nothing. Debt has to live where the violations live, so the mechanism ships
inside the package as a runner the *consumer* invokes against its own lint
report. Base keeps no registry of its own.

Full rule table, rationale, and measured adoption cost:
`templates/web-workbench/GOVERNANCE.md`.

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

Strip scenario/runtime vocabulary; keep only platform-neutral rules.

**Ported as three docs, not one:** `MOTION.md` (decision gate + reduced motion),
`INTERACTION.md` (platform matrix, fluid-interaction rules, capability
fallbacks), and a new section in `TYPOGRAPHY.md` (face-verification matrix —
placed there because it is the direct continuation of "fonts are host-provided",
not a standalone contract).

The port was grounded in an audit of what the kit actually does, rather than
translated as prose. That surfaced three inconsistencies between the rules being
written and the kit's own CSS — a `transition: all`, a reduced-motion block that
missed the kit's most vestibular motion, and an off-token duration that was an
exact token match. All fixed before the docs shipped, so the contracts describe
the kit rather than aspiring to it.
