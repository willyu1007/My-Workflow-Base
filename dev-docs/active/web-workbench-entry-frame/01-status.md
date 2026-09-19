# Status

## Goal
Ship a scenario-neutral pre-shell `EntryFrame` in `templates/web-workbench` so institution workbenches share one navy gate: brand row, empty accessory slot, heading, two-column actions, and choice rows.

## Progress
- State: in-progress
- Current phase: Phase 3 — Publish 0.22.0
- Next step: Confirm Feature placement (proposed: a new Feature under M-002, not the closed F-002). Then the task can be accepted as done.
- Blocker: none

## Done when
- [x] `EntryFrame` ships as pre-shell chrome (not a seventh Scene paradigm) with brand, optional accessory, heading/aside, alert, actions, choice rows, and quiet actions.
- [x] The kit contains no scenario vocabulary, no auth state machine, and no background texture.
- [x] Focused structure tests and package typecheck pass.
- [x] Package `0.22.0` is published; a consumer can pin the registry package.
