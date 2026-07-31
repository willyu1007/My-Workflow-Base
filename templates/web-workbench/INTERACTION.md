# Interaction contract

How a shared interaction intent adapts across input modes without becoming a
different product on each. Governs **behavior**, not appearance — the look comes
from tokens and components; this is what has to stay true underneath.

The kit targets the web today, so the web column is what it enforces. The other
columns exist because the same intent will be implemented against a future
native kit, and writing them down now is what keeps the two from diverging by
accident.

Authority order: this contract and [MOTION.md](./MOTION.md), then `tokens.css`
and [DECISIONS.md](./DECISIONS.md), then platform conventions. Every value an
interaction needs — duration, easing, scrim, elevation — comes from a token; an
implementation-local value needs measured evidence and a DECISIONS.md entry.

## Shared requirements

- **Keep the user in control.** Every gesture can cancel, reverse, or reach the
  same result through an explicit control.
- Use direct manipulation only when the surface tracks input continuously.
- Continue release animation from the current position and velocity.
- Project momentum only toward valid, visible targets.
- Use progressive resistance past a boundary; never hide the real limit.
- Preserve focus, labels, error visibility, and explicit outcomes.
- Honor the user's reduced-motion preference.
- Do not add a gesture, animation, or material dependency without an explicit
  decision — a new runtime dependency is a product decision, not a detail.

## Platform matrix

| Concern | Web | iOS | Android |
|---|---|---|---|
| Primary input | Keyboard, pointer, touch; preserve focus order; check pointer capability before relying on hover. | Touch and platform accessibility actions; keep native navigation expectations. | Touch, accessibility actions, system navigation; account for OEM behavior. |
| Back and dismiss | Escape, browser history, close control, and focus restoration must all agree. | Platform navigation and sheet dismissal; always keep an explicit cancel path. | System back closes the top transient surface first; support predictive back where available. |
| Edge gestures | Never depend on hover or a single pointer type. | Avoid conflicts with platform navigation gestures. | Protect system gesture insets; never claim the system-back edge for a custom drag. |
| Press feedback | Keyboard-visible focus *and* pointer/touch feedback. | Platform-appropriate visual or haptic feedback where meaningful. | Native or equivalent press feedback; do not imitate iOS blindly. |
| Material effects | Capability check plus an opaque fallback. | Native material where supported and legible. | Treat blur as enhancement; ship a performant opaque fallback. |
| Typography | Resolve per [TYPOGRAPHY.md](./TYPOGRAPHY.md). | Native system UI font unless an approved brand role applies. | Native system UI font unless an approved brand role applies. |

The kit's overlay is the material-effect pattern worth copying: it paints
`var(--scrim)` and *then* adds `backdrop-filter: blur(3px)`. Where blur is
unsupported or too expensive, the scrim alone still separates the layers — the
enhancement can fail without taking legibility with it.

## Fluid interaction

For sheets, drawers, swipes, drags, and reorder:

1. Track the active input directly once intent is disambiguated.
2. Keep competing recognizers alive until direction is clear, then cancel the
   losers.
3. Preserve the current presentation value when interrupted.
4. Pass release velocity into the settling behavior where supported.
5. Choose the destination from valid state and momentum, not distance alone.
6. Clamp or resist overshoot without ever exposing invalid state.
7. Restore a coherent state after cancellation, backgrounding, rotation, or
   input loss.
8. Expose an equivalent button or menu action for anyone who cannot perform the
   gesture.

No external spring, damping, or threshold value is canonical. Use tokens, or
document an implementation-local value with measured evidence.

## Capability fallbacks

| Capability absent | Required fallback |
|---|---|
| Reduced motion | Replace spatial movement, parallax, bounce, and overshoot with immediate state change or short non-spatial feedback. |
| Blur / translucency | Opaque token-backed surface with sufficient contrast and separation. |
| Haptics | Preserve the visual and accessible result; haptics are never the only signal. |
| Predictive back | Preserve correct back ordering and final state without the preview. |
| Gesture unavailable or conflicted | An explicit control that reaches the same state. |

## Verification

Use the smallest matrix that covers what changed:

- **Web:** keyboard-only, pointer, and a touch-capable viewport; add browser
  coverage when browser APIs differ.
- **Accessibility:** screen-reader path, text scaling, reduced motion,
  cancellation, focus restoration.
- **Native (when a native kit exists):** current reference runtime plus the
  lowest supported one; a physical device when haptics, system back, edge
  gestures, or rendering capability matter.

Record the exact devices, versions, and fallbacks tested. A single simulator run
is not cross-platform evidence.
