# Pitfalls

- **An undocumented aesthetic tweak in a template repo becomes a brand fork.**
  The warm neutrals shipped in three published versions and were adopted by
  two scenario repos before anyone could say whether they were a decision.
  The fix costs one file; the adjudication cost a cross-repo investigation.
  Rule going forward: any value that differs from the design reference gets a
  D-entry in `DECISIONS.md` in the same commit, or it is drift.

- **Comments claiming intent are not decisions.** "Anthropic paper feel"
  read like a deliberate choice and nearly survived as one. Only the owner
  could settle it, and the answer was "not deliberate". A rationale comment
  without a decision record is evidence of nothing.

- **Internal consistency is the cheapest drift detector.** The kit's shadows
  (`rgba(17,24,39,…)`) and its window-bar gradient (`#FBF7F1`) disagreed
  with the neutrals beside them — either of these would have flagged the
  drift years earlier if anything had checked token families against each
  other. Step C's lint should include a "shadow/scrim base must equal ink
  base" style cross-check if cheap to express.

- **AA can pass by accident.** The drifted muted-ink pair measured 4.75:1 —
  better than the repaired 4.64:1. A contrast gate alone would have defended
  the drift. Contrast checks bound the palette; they do not define it.

- **The reference itself fails AA in one spot** (`#717684` muted ink,
  4.25:1). Fidelity to a design export must not outrank accessibility;
  My-Chat's D-01 correction is the template for how to deviate: hold hue and
  saturation, move lightness, record it, forbid regression.

## From C (lint expansion)

- **Measure the candidate rule before shipping it.** The obvious property-scoped
  color rule (`color`, `background-color`, `box-shadow`, …) caught **zero of
  three** real violations in a live consumer. Every one hid somewhere a property
  list does not look: a shorthand, a gradient, a custom property. Writing the
  rule that sounds right and trusting it would have shipped a lock that locks
  nothing.

- **`var()` checks are not a color lock.** `--ring: 0 0 0 2px rgba(...)` followed
  by `box-shadow: var(--ring)` passes every var()-based rule ever written. Any
  design-value lock must inspect custom-property *declarations*, not just the
  properties that consume them.

- **Precision is a design constraint, not a nicety.** Banning the bare word
  `oklab` would have rejected `color-mix(in oklab, …)` — the sanctioned way to
  derive a tint from tokens, already used by a consumer. Anchor color-function
  patterns on the opening paren.

- **A doc comment is not a test.** The eslint preset claimed to cover quoted
  keys and never had; `{ "fontSize": "14px" }` bypassed the typography lock for
  the life of the preset. Found only by writing the fixture the comment implied.

- **esquery's `>` has no field awareness.** `Property[key.value=…] > Literal`
  matches the key node as well as the value node, so the naive fix for the
  bug above double-reported every quoted-key violation. Verify hit *counts*,
  not just hit presence.

- **Put the debt registry where the debt is.** A suppression list in the
  template repo would gate nothing: Base's conformance scans Base's own
  templates, which have no consumers and no violations. Ship the gate, let the
  consumer own the registry.

## From D (contract docs)

- **Do not write a contract without auditing what it governs.** Porting the
  motion rules as prose would have shipped a document prohibiting
  `transition: all` from a package that used it, and prescribing reduced-motion
  coverage the package did not have. The audit cost one pass and turned three
  latent defects into fixes.

- **`animation: none` does not stop a transition.** The kit's reduced-motion
  block looked thorough — six selectors — and missed the single most vestibular
  motion it ships, because that one moves by `transition: transform`. When
  auditing reduced motion, enumerate both mechanisms separately.

- **A token swap is only free when the numbers are equal.** `0.18s` → `--t-base`
  changed nothing because 180ms *is* `--t-base`. Snapping `0.22s` to the nearest
  token would have retimed a considered animation by 27% — a lint rule driving a
  design change. Check the arithmetic before calling a swap a cleanup.

- **Not every hardcoded value wants a token.** Perpetual loop periods (1.1s
  pulse, 1.4s shimmer) have no place on a 120/180/280ms scale built for discrete
  state changes. "Unowned by a token" and "drift" are different diagnoses.

- **Grep filters can hide what they are counting.** Excluding lines containing
  `var(--t-` to find off-token durations also hid an off-token value sharing a
  line with a tokenized one. Count occurrences, not lines — the same lesson the
  C-step duplicate-report bug taught, arrived at from the opposite direction.

## From B (token structuring)

- **A parser's own total is not a count.** The extractor reported 95 tokens and
  the number looked right; an independent count of `--name:` occurrences said
  114. Nineteen typography tokens would have vanished from the generated CSS.
  When extracting, always count the target a second way, with a different method.

- **CSS packs more than one declaration per line, and headers span lines.** Two
  separate parser generations died on this — first the four-per-line type scale,
  then a multi-line section header that swallowed a whole section. Line-oriented
  regex is the wrong tool for CSS; scan characters.

- **Byte-identity is a weaker proof than it sounds.** It would pass if two
  comments were swapped and fail if alignment improved. The invariant worth
  proving was the name→value map. Pick the assertion that matches the risk.

- **Do not derive public names from a private schema.** Nesting tokens by
  category would have renamed `--fg-1` to `--color-fg-1`. Consumers write these
  names in their own stylesheets: the variable list is an API, and a schema
  refactor must not rewrite it as a side effect.

- **Adopting a schema is not adopting every group in it.** Base's typography was
  already richer than the source it was supposedly converging toward. Compare
  group by group before copying; convergence can be host-ward for one part and
  Base-ward for the rest.
