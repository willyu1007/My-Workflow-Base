# Roadmap

## Scope and constraints

### In scope
- Make `templates/web-workbench` the ecosystem's visually authoritative, scenario-neutral web UI kit.
- Repair token-value drift, establish generated token ownership, and ship governance-grade lint.
- Publish motion, interaction, typography, paradigm, and component contracts with focused tests.

### Out of scope
- Absorbing host-specific composition or scenario semantics.
- Changing My-Chat or consumer product code from this repository.
- Shipping agent skills as part of the UI kit contract.

### Constraints and dependencies
- Same-named shared roles remain byte-equal with adjudicated platform values.
- Tokens and locked components, not prose or host overrides, own reusable visual decisions.
- The kit remains a published dependency; consumers supply adapters, data, fonts, and product behavior.

## Decision alignment

| Decision question | Options / tradeoffs | Current direction | Status | Owner / required confirmation | Closure evidence | Consequences |
|---|---|---|---|---|---|---|
| Drift response | Preserve accidental values or restore reference authority | Restore adjudicated values and record decisions | decided | UI kit owner | Value-fidelity review and adoption evidence | Consumer visuals converge without a new palette. |
| Token ownership | CSS literals or machine-readable source | `tokens/base.json` generates consumed CSS | decided | UI kit owner | `tokens:check` CI gate | Values have one source and generated drift fails. |
| Composition governance | Host freedom or locked paradigms | Controlled component variants and six Scene paradigms | decided | UI kit owner | `PARADIGMS.md` and component contracts | Hosts vary content through adapters, not chrome forks. |
| Project skills | Distribute consumer skills or keep governance global | Do not ship project skills | decided | User | T-005 migration decision | UI contracts remain package/document concerns. |

### Assumptions

| Assumption | Risk if wrong | Validation |
|---|---|---|
| Consumers can adopt the published contract without runtime-value forks. | The kit would not remain authoritative. | Nurture and Education adoption plus zero registered design debt. |

## Task relationships

| Task | Relationship from this task | Owned boundary / exchanged contract | Coordination condition |
|---|---|---|---|
| T-001 | sibling | T-004 owns the web presenter kit; T-001 owns workflow contracts and surface semantics. | The kit stays scenario-neutral and consumes presenter-ready models. |

## Implementation plan

### Phase 1 — Repair values and decisions
- Outcome: Accidental palette and behavior drift is removed and explained.
- Approach: Restore adjudicated values and capture explicit exceptions.
- Planned changes:
  1. Repair neutral/scrim values and motion/accessibility defects.
- Affected boundaries / entry points: token values, styles, decision records.
- Dependencies: reference and host-platform evidence.
- Exit criteria: shared values converge and no unrecorded exception remains.
- Verification: contrast, token, lint, and consumer adoption checks.
- Recovery: restore the last published value set and reopen the authority decision.

### Phase 2 — Establish generated governance
- Outcome: Tokens, lint rules, and debt handling have enforceable owners.
- Approach: Generate CSS from JSON and ship lint/debt contracts.
- Planned changes:
  1. Add token generation and drift checks.
  2. Add color, depth, typography, and motion lint boundaries.
- Affected boundaries / entry points: `tokens/`, `src/styles/`, `lint/`, package exports.
- Dependencies: Phase 1 values.
- Exit criteria: generated output is stable and consumers adopt without unowned debt.
- Verification: token check and consumer lint evidence.
- Recovery: retain published values while reverting only the failed enforcement layer.

### Phase 3 — Complete reusable UI contracts
- Outcome: Six paradigms, stateful components, motion/interaction guidance, and tests form a consumable kit.
- Approach: Encode structure in components and publish focused contracts/tests.
- Planned changes:
  1. Complete paradigm renderers and grouped exports.
  2. Add focused stateful component tests and publish gates.
- Affected boundaries / entry points: component contracts, grouped entries, Markdown contracts, tests.
- Dependencies: Phase 2 governance.
- Exit criteria: published package and consumers can use the kit without duplicating chrome.
- Verification: UI tests, package export review, and consumer adoption.
- Recovery: revert an additive component/export while retaining the stable token contract.

## Kickoff gate

- Status: ready
- Authorized boundary: none
- [x] Decisions: value, token, composition, and skill boundaries are settled.
- [x] Design: consumed contracts and ownership are reflected in `02-architecture.md`.
- [x] Route: all convergence phases completed and shipped.
- [x] Verification: decisive token, test, and adoption evidence is recorded.

## Risks and recovery

| Risk | Detection | Mitigation | Recovery / rollback |
|---|---|---|---|
| Host overrides fork kit chrome. | Consumer lint/debt review and component trace. | Ship controlled variants and route kit defects upstream. | Remove the override and fix the owning contract. |
| Generated tokens diverge from source. | `pnpm check:ui-tokens`. | Treat JSON as source and CSS as generated output. | Regenerate or revert the source change. |
| Accessibility motion regresses. | Reduced-motion and interaction tests/review. | Cover animation and transition paths explicitly. | Revert the motion change without changing unrelated layout. |

## Phase closeout

- Review: Values, generated output, components, contracts, package exports, and consumer evidence agree.
- Record update: Task remains active `done`; later additive UI work opens or uses its own boundary.
- Checkpoint: Published versions and the test/token gates provide rollback evidence.
