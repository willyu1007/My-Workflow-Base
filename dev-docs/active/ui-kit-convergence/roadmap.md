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

## B — Token structuring (done 2026-08-01, scoped)

`tokens/base.json` holds all 114 custom properties; `tokens/emit.mjs` generates
`src/styles/tokens.css`; `check:ui-tokens` fails the build and CI when the
committed CSS drifts from the source. `elevation` (platform-neutral depth) and
`state` (pressed/disabled/hover) are adopted from the host platform's schema —
they are the prerequisite for a future native kit and the expensive-to-retrofit
part — and are deliberately *not* emitted to CSS, since the web already has
`--shadow-*` and component-level state rules.

**Two plan assumptions turned out wrong and were changed:**

*Category-nested schema.* Rejected. Base's variable names (`--fg-1`, `--r-md`,
`--t-fast`) are a published API that consumers write in their own stylesheets,
and they are not derivable from a category path. A nested schema would have
renamed `--fg-1` to `--color-fg-1` and broken every consumer silently, so the
source stores name and value explicitly. The second commit in the planned
"values-only then structure-only" pair therefore does not apply: there is no
rename to make.

*Byte-identical output as the fidelity proof.* Not achievable, and not the right
bar. The hand-written file aligned its 114 declarations across 12 different
columns, inconsistently even within a section, so reproducing it byte-for-byte
would have meant storing per-token padding in the source — turning a design
document into a formatting record. The emitter normalizes alignment and fidelity
is proven on the value map instead: all 114 name→value pairs unchanged, none
added or removed. That is the stronger guarantee, since byte-identity would also
pass if two comments were swapped.

**Typography stays in the kit's own shape.** The plan assumed Base would adopt
My-Chat's `typography` group. Comparing them shows the opposite: Base already
carries per-role size, line-height, tracking, and weight across nine roles, while
My-Chat has six sizes sharing three line heights and no tracking at all — a gap
its own Phase 0 flagged. Copying would have been a downgrade. Base holds its
shape; convergence on this one group should run host-ward.

Entry condition re-checked 2026-08-01 and found **half met, half unreachable**:

- Dark: **met, and the original reading was wrong.** The host task's non-goals
  say plainly "Do not implement dark theme values; only reserve the schema
  layer". Dark is deferred by design and the theme layer exists — a decision,
  not a gap.
- Full schema freeze: **not met and not dated.** Three groups are still open —
  `typography` (Phase 1b, blocked on font-validation evidence), `state.selected`
  (listed in Phase 1, absent), and `motion` spring parameters (D-05 unresolved,
  and explicitly to be tuned on-device in Phase 5). Phase 5 has not started and
  is blocked on a local backend that is itself still `planned`.

Proceeded anyway because the blocking risk was mis-scoped. The expensive,
retrofit-hostile piece was `elevation`'s *structure* — and that is done. What is
still coming (`state.selected`, `motion.spring.*`) is **additive**: appending
keys to a JSON file, not restructuring emitted consumers.

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
