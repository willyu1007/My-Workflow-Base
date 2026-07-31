# Architecture

## Value authority chain (after A)

```text
morethan reference (colors_and_type.css; disputes → morethan_UI_guidelines.pdf v1.1)
        │  adjudicated in My-Chat ui-visual-system phase-0
        ▼
templates/web-workbench/DECISIONS.md   ← every sanctioned deviation
        ▼
src/styles/tokens.css                  ← kit SSOT today; becomes generated in B
        ▼
components.css / workbench.css         ← consume vars only (verified: zero
                                          palette literals outside tokens.css)
        ▼
consumer repos (@willyu1007/web-workbench@pinned)
```

Cross-repo invariant: a role that exists under the same name in My-Chat
`ui/tokens/base.json` carries the identical value, or one side documents the
divergence (DECISIONS.md here; `meta.deviations_from_source` there).
Today the shared-name set is value-identical.

## Ownership and boundaries

| Concern | Owner | Note |
|---|---|---|
| Brand values, deviations | Base (this kit) + DECISIONS.md | Base is the template source for scenario repos |
| Token schema shape | My-Chat ui-visual-system until stable, then copied here (B) | shape only; no runtime coupling |
| Component chrome / paradigms | Base (PARADIGMS.md, components) | unchanged by this program |
| Enforcement in consumers | Base ships presets; consumers wire them into their CI (C) | Base has no gate of its own to run against consumers |
| `data-ui` role contract | My-Chat only | competing composition model; excluded (00-overview non-goals) |

## Key risks

- **Two chrome-locking philosophies.** The workbench locks structure via
  components; My-Chat's web app locks semantics via `data-ui`. They coexist
  per-app, not per-kit. Nothing in B–D may import the `data-ui` vocabulary
  into the workbench.
- **B before My-Chat stabilizes** would copy a moving schema (dark theme
  roles are explicitly unfinished there). The entry condition in 01-plan is
  the guard.
- **Consumer visual drift during the 0.7→0.8 window.** Until Education and
  Nurture re-pin, screenshots across repos disagree on neutrals. Keep the
  window short.
