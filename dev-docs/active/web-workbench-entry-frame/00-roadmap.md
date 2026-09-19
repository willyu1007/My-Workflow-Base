# Roadmap

## Scope and constraints

### In scope
- Add locked pre-shell entry chrome to `templates/web-workbench`.
- Add dark-canvas action variants that do not change Scene `wb-action--primary`.
- Document that this chrome sits outside the six Scene paradigms.
- Prove the structure with focused tests and a typecheck.

### Out of scope
- Publishing the package (needs the maintainer's registry credentials).
- Consumer pin bumps or `/entry` rewrites in Nurture or other scenarios.
- Auth, Logto, role mapping, opening, apply flows, or developer identity.
- A seventh Scene paradigm, reuse or replacement of `.wb-centered`, or background texture.

### Constraints and dependencies
- Base templates must not learn My-Chat, Education, or Nurture product semantics.
- Consumers adopt through the published package pin, not a copied layout.

## Decision alignment

| Decision question | Options / tradeoffs | Current direction | Status | Owner / required confirmation | Closure evidence | Consequences |
|---|---|---|---|---|---|---|
| Where does the approved navy gate live? | Host-local CSS copies the mock; the kit locks one frame | Kit owns `<EntryFrame>` as pre-shell chrome beside `AppShell` | decided | User, 2026-09-19 | Conversation after scheme B mock approval | Consumers map their own states into slots |
| Visual treatment | Six texture variants versus flat navy-700 | Flat `--mt-navy-700` only | decided | User, 2026-09-19 | “不需要额外的质感添加” | No texture tokens, classes, or switches |
| Status model in the kit | Encode `sign_in` / `unavailable` / `signed_in` versus one frame with slots | One frame with slots; no auth enum | decided | User, 2026-09-19 | Ownership discussion | Mapping stays in the consumer |
| Accessory corner | Kit-owned developer menu versus empty slot | Empty `accessory` slot; optional labeled disclosure helper | decided | User, 2026-09-19 | Developer-slot discussion | Ordinary mode renders nothing there |
| Apply / opening actions | Ship apply buttons in the kit versus consumer body | Consumer body only | decided | User, 2026-09-19 | Ownership discussion | Kit choice rows stay generic |

### Assumptions

| Assumption | Risk if wrong | Validation |
|---|---|---|
| Existing navy-700, orange, cream, and on-navy tokens are enough | A new token would be a kit decision, not a host literal | Implement with current tokens; add a token only if contrast fails review |

## Task relationships

| Task | Relationship from this task | Owned boundary / exchanged contract | Coordination condition |
|---|---|---|---|
| T-004 | derived-from | T-004 shipped the converged kit and six Scene paradigms | This task adds pre-shell chrome without reopening convergence |

## Implementation plan

### Phase 1 — Lock and ship EntryFrame
- Outcome: The kit exports `EntryFrame` and the dark-canvas pieces a consumer needs to compose an unsigned, blocked, or ready gate.
- Approach: Add one presentational module, token-only CSS, a grouped `./entry` export, and tests that observe slots—not domain copy.
- Planned changes:
  1. Add `EntryFrame`, heading, notice, alert, actions, submit, choice, quiet, and accessory helpers.
  2. Add flat navy entry CSS; leave `.wb-centered` and Scene actions unchanged.
  3. Export `./entry`, note the pre-shell rule in PARADIGMS/README, and bump the package to `0.22.0`.
- Affected boundaries / entry points: `templates/web-workbench` public exports and styles.
- Dependencies: Settled scheme B mock; no consumer change.
- Exit criteria: A consumer can compose the three visual recipes from slots; source has no scenario names or texture.
- Verification: Structure tests plus `pnpm test` and `pnpm typecheck` in the kit package.
- Recovery: Revert the additive files; `0.21.1` remains the last published pin.

### Phase 2 — Verify the kit surface
- Outcome: The new export is type-complete and the tests fail for the right missing slots.
- Approach: Run the kit harness against `src/` and record limitations (no layout/browser pixel proof in the kit).
- Planned changes:
  1. Run focused tests and typecheck.
  2. Record evidence and any token-contrast follow-up.
- Affected boundaries / entry points: kit test harness and `./entry` types.
- Dependencies: Phase 1 files.
- Exit criteria: Tests and typecheck pass; publish remains a separate user action.
- Verification: `pnpm test` and `pnpm typecheck` in `templates/web-workbench`.
- Recovery: Keep `0.21.1` published; do not tag a broken `0.22.0`.

### Phase 3 — Publish 0.22.0 (provisional)
- Outcome: Consumers can pin the registry package.
- Approach: Maintainer publishes from `templates/web-workbench` after Phase 2 evidence.
- Planned changes:
  1. `pnpm publish` of `0.22.0`.
- Affected boundaries / entry points: GitHub Packages `@willyu1007/web-workbench`.
- Dependencies: User registry credentials; Phase 2 green.
- Exit criteria: `0.22.0` is on the registry.
- Verification: Registry version visible to a consumer install.
- Recovery: Leave `0.21.1` as the current pin.

## Kickoff gate

- Status: ready
- Authorized boundary: through phase 3
- [x] Decisions: kit ownership, flat navy, slot model, empty accessory, and consumer-owned apply/opening are decided.
- [x] Design: settled `EntryFrame` slots and export path are in `02-architecture.md`.
- [x] Route: Phase 1 is executable; the user authorized Phase 3 publish on 2026-09-19.
- [x] Verification: structure tests and kit typecheck are identified in `verification.md`.

## Risks and recovery

| Risk | Detection | Mitigation | Recovery / rollback |
|---|---|---|---|
| Dark-canvas actions leak into Scene toolbars | Scene screens pick up orange primary | New classes live under `.wb-entry` only | Revert the action CSS |
| A consumer copies the mock instead of waiting for the pin | Host CSS duplicates navy gate | Keep the public API small and documented | Delete the host copy when the pin moves |

## Phase closeout

- Review: Slot API, absence of scenario vocabulary, and unchanged Scene primary.
- Record update: Status, verification evidence, and package version.
- Checkpoint: Kit tests green; publish not implied.
