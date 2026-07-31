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
