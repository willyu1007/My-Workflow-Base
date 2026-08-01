# Motion contract

The kit ships motion tokens (`--t-fast` / `--t-base` / `--t-slow`, `--ease-out`,
`--ease-spring`, `--wb-reveal-*`) but no rule for *when* to move. That gap is
where craft usually goes wrong: motion is the easiest thing to add and the
hardest thing to notice you have too much of. This is the rule.

Authority order:

1. This contract and [INTERACTION.md](./INTERACTION.md).
2. `tokens.css` and [DECISIONS.md](./DECISIONS.md).
3. Platform conventions.
4. Anything else.

Durations and easing come only from tokens. If no role fits, propose the
smallest token addition — do not invent a parallel value in a component.

## Decision gate

Apply in order. **"No motion" is a valid, frequently correct outcome.**

| Question | Reject when | Continue when |
|---|---|---|
| **Frequency** | Motion delays typing, core navigation, streaming, or another high-frequency action. | The action is occasional, or feedback stays immediate and unobtrusive. |
| **Purpose** | The reason is decoration alone. | Motion gives feedback, explains a state change, preserves spatial continuity, or prevents a jarring jump. |
| **Safety** | Motion implies consent, completion, or permission before the underlying action has actually confirmed it. | Motion visualizes a state transition that already happened. |
| **Accessibility** | Meaning depends on movement, or there is no reduced-motion path. | A calmer equivalent preserves meaning and operability. |
| **Performance** | It animates unbounded or expensive properties with no evidence. | Animated properties are named and bounded. |

## Required behavior

- Respond to input without avoidable delay.
- Make rapidly repeated and gesture-driven transitions interruptible, and
  continue from the current presentation state when direction changes.
- Keep enter and exit paths spatially consistent.
- **Name the animated properties.** `transition: all` is prohibited: it animates
  whatever happens to change, so cost is unbounded and intent is unreadable. The
  shipped stylelint preset enforces this ([GOVERNANCE.md](./GOVERNANCE.md)).
- Prefer compositor-friendly properties (`transform`, `opacity`). Measure before
  accepting layout-affecting animation in a hot path.
- Gate hover motion by pointer capability — see INTERACTION.md.
- Provide a reduced-motion path that removes vestibular movement while keeping
  feedback.
- Keep perpetual and streaming indicators restrained and easy to ignore.

## Reduced motion

Remove large spatial movement, parallax, bounce, and overshoot. Keep state
legible: a panel that slid should still appear, a toast that rose should still
show. Replace travel with arrival, not with nothing.

Two failure modes are easy to miss, and the kit hit both before this contract
existed (both fixed — DECISIONS.md D-A6, D-A7):

1. **`animation: none` does not stop a transition.** A panel moved by
   `transition: transform` is untouched by a reduce block that only nulls
   `animation`. Audit both mechanisms.
2. **The biggest movement is often the least obviously "an animation."** A
   sidebar sweeping 280px across a phone viewport is more vestibular than any
   keyframe in the kit, and it was the one thing the reduce block missed.

What the kit already handles for you, in `prefers-reduced-motion: reduce`:
scene reveal, toast, drawer, overlay, skeleton shimmer, nav status pulse, and
the mobile sidebar. Host motion is the host's to cover.

## Where the values come from

The three durations and two curves are not this kit's to choose. They are the
platform host's motion roles (`My-Chat` `ui/tokens/base.json` → `motion.*`),
which also reach React Native through that repo's native token emitter. The kit
publishes them under its own names, so the same value is `motion.duration_normal`
upstream and `--t-base` here.

`tokens/motion-role-lock.json` records that mapping, and `pnpm tokens:check`
enforces it — including on every `build`, so a drifted value cannot be
published. The check also fails on a **new** motion token that has not been
classified as either a shared role or a kit-local invention; that classification
is the decision the lock exists to force. Rationale: DECISIONS.md D-A10.

Practical consequence: retuning a curve or a duration is a cross-repo change,
not a local one. Change the host first, then re-pin the lock.

## Motion is not authorization

Motion may confirm that input was received, expose progress, or make a
reversible change legible. It must never be the thing that authorizes an
action — a swipe that publishes, a drag that grants access, a transition that
substitutes for a confirmation step. Nor may it delay or obscure errors,
warnings, or cancellation. Whatever gates the action stays gating it; motion
only reports.

## Review evidence

Record, for anything beyond a hover tint:

- location, and the user-visible state change;
- purpose, and expected frequency;
- token roles used;
- interrupt, cancel, and reverse behavior;
- reduced-motion result;
- performance evidence when the path is hot or layout-affecting;
- confirmation that no sensitive action depends on the motion.
