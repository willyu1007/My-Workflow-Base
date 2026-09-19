# Architecture

## Context and current state

`templates/web-workbench` ships six Scene paradigms inside `AppShell`. Institution login is outside that shell. The kit already has cream `.wb-centered` for channel/onboarding; that layout is a different surface and stays as-is.

Institution login previously lived as host-local chrome. The accepted mock is scheme B: full `--mt-navy-700`, no card, orange primary on the dark canvas, `MORETHAN | {scene}`, empty top-right unless the scenario injects accessory content. Consumers compose `<EntryFrame>` from the published `0.22.0` pin.

## Settled design and boundaries

- `<EntryFrame>` is pre-shell chrome, sibling to `AppShell`, not a seventh paradigm.
- The kit owns layout, tokens, and slot structure. The consumer owns copy, actions, auth mapping, opening, apply, and developer items.
- Canvas is flat `--mt-navy-700`. No gradient, grain, vignette, sheen, warm dust, or grid.
- Default wordmark is `MORETHAN` (platform brand already in kit tokens). `scene` is required and supplied by the consumer.
- `accessory` is an optional React node. Omit it and the corner stays empty. `EntryAccessory` is a quiet disclosure whose label is also consumer-supplied.
- Dark actions are `.wb-entry__action--accent|ghost|quiet`. They must not change `.wb-action--primary`.
- `EntrySubmit` is a native `submit` (or an `href` link) so auth forms keep POST/pending semantics.
- `EntryChoice` is a generic row: mark, title, optional caption, action label. No institution or role words.
- No auth status enum, environment read, or developer command lives in the kit.

## Interfaces and contracts

Grouped export: `@willyu1007/web-workbench/entry`.

Composition:

- `EntryFrame` — `scene`, optional `brand`, optional `accessory`, `children`
- `EntryHeading` — title children, optional `aside`
- `EntryNotice` — status or alert text
- `EntryAlert` — icon + title
- `EntryActions` — two-column grid
- `EntrySubmit` — `kind: accent | ghost | quiet`
- `EntryChoice` — mark/title/caption/actionLabel
- `EntryQuiet` — quiet-row wrapper
- `EntryAccessory` — labeled disclosure wrapping consumer items

The root package barrel may re-export these for compatibility; new consumers use `./entry`.

## Migration and operation

Additive `0.22.0`. Existing Scene and `.wb-centered` consumers are unchanged. Adoption is a consumer pin bump after publish.
