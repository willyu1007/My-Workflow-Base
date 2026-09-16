# Roadmap

## Scope and constraints

### In scope
- Define a scenario-neutral workflow contract spine, ownership model, and standard product-surface closure.
- Provide host runtime, contract, and Scenario module scaffolds with validation and conformance.
- Publish reproducible source locks and a package-complete generated Scenario Starter.
- Prove the same contract supports multiple scenario lineages without shared-surface forks.

### Out of scope
- Operating a production workflow runtime, database, queue, or product surface.
- Owning scenario domain facts or downstream publication, RAG, notification, or indexing behavior.
- Enabling a consumer capability without its host-owned gates and exact source adoption.
- A user-editable workflow builder or plugin marketplace.

### Constraints and dependencies
- Postgres is canonical in concrete owners; projections and events are never authority.
- Cross-owner payloads remain refs-only and downstream owners reread canonical state.
- Scenario manifests are declarative; host-owned registries bind executable code and fail closed.
- The template must remain scenario-neutral and reproducible across physical paths and package aliases.

## Decision alignment

| Decision question | Options / tradeoffs | Current direction | Status | Owner / required confirmation | Closure evidence | Consequences |
|---|---|---|---|---|---|---|
| Base shape | Runtime platform or portable contracts/scaffolds | Portable contracts, conformance, and templates | decided | Repository owner | Architecture and implemented package boundaries | Base owns no production fact or traffic. |
| Domain ownership | Workflow-owned objects or platform-owned refs | Platform/domain registry owns canonical objects | decided | Repository owner | Contract docs and validator rules | Workflow stores refs, snapshots, and bindings only. |
| Product consumption | Scenario-specific APIs or standard adapters/presenters | Standard surface closure with declared Web/Admin extensions | decided | Repository owner | Surface/API/module contracts | Shared consumers do not learn scenario internals. |
| Events and handoffs | Payload transport or downstream signals | Refs-only signals and request/receipt records | decided | Repository owner | Schemas, conformance, and readiness proof | Downstream modules own reread, policy, transformation, and effects. |
| Trusted private operations | Raw transport auth in dispatcher or verified invocation registry | Host transport verifies first; exact registered dispatcher receives verified input | decided | Repository owner | Trusted-registry regression suite and source lock | Raw credentials never enter scenario dispatch. |

### Assumptions

| Assumption | Risk if wrong | Validation |
|---|---|---|
| A disposable PostgreSQL environment can exercise the generated Starter journey without changing the contract. | Final Starter qualification remains incomplete. | Run the opt-in database journey against a disposable owner database. |
| Remaining publication/adoption work still belongs to this broad convergence task. | The task could remain open while only external follow-up exists. | Reconcile unchecked acceptance references after database and publication evidence. |

## Task relationships

| Task | Relationship from this task | Owned boundary / exchanged contract | Coordination condition |
|---|---|---|---|
| T-003 | sibling (retired) | T-003 owned the additive batch-execution-control capability within the shared contract package; the contract was retired on 2026-09-17 with zero consumers and the bundle is archived. | None; the capability no longer exists in the package or source lock. |

## Implementation plan

### Phase 1 — Converge the contract model
- Outcome: Modules, product surfaces, domain context, events, handoffs, and ownership have one scenario-neutral model.
- Approach: Reduce discussion documents into explicit matrices, interfaces, and forbidden dependencies.
- Planned changes:
  1. Define architecture, surface, API, module, and readiness contracts.
- Affected boundaries / entry points: `docs/context/workflow/`.
- Dependencies: confirmed host/product ownership decisions.
- Exit criteria: a second scenario needs no new shared product API or private consumer path.
- Verification: semantic scans, cross-document alignment, and readiness proof.
- Recovery: reopen the model before widening public contracts.

### Phase 2 — Realize additive contracts and conformance
- Outcome: TypeScript contracts, validators, runtime scaffolds, and negative fixtures enforce the model.
- Approach: Add compatible vNext types and fail-closed validation without production persistence.
- Planned changes:
  1. Implement contract/runtime/scenario packages and validation fixtures.
  2. Seal source locks after contract-bearing revisions.
- Affected boundaries / entry points: host templates and `conformance/`.
- Dependencies: Phase 1 model.
- Exit criteria: legacy and vNext fixtures pass; private/invalid paths fail.
- Verification: root typecheck, tests, semantic lint, canonical refs, and source hash.
- Recovery: revert an additive slice with its fixtures and lock update.

### Phase 3 — Distribute the Scenario Starter
- Outcome: Consumers can generate a package-complete owner module with exact integration evidence.
- Approach: Ship generator/staging CLIs, owner-local Prisma/outbox/inbox examples, locked migration, and opt-in journey.
- Planned changes:
  1. Complete the template and generation contract.
  2. Integrate trusted invocation and exact source profiles.
- Affected boundaries / entry points: `templates/scenario-module/`, generator CLIs, conformance package.
- Dependencies: Phase 2 public contracts.
- Exit criteria: generated artifacts reproduce the intended package and all non-database checks pass.
- Verification: generator/staging tests, full workflow verifier, and source-lock check.
- Recovery: revert the Starter integration without changing the stable contract package.

### Phase 4 — Close qualification and publication
- Outcome: Remaining environment-backed and publication/adoption claims are either proven or transferred to explicit owners.
- Approach: Run the disposable database journey, reconcile public release state, and review unchecked acceptance references.
- Planned changes:
  1. Execute the opt-in database journey in a disposable PostgreSQL environment.
  2. Reconcile publication/adoption evidence and task completion boundaries.
- Affected boundaries / entry points: release status, verification evidence, and this task record.
- Dependencies: disposable database access and confirmed release evidence.
- Exit criteria: no in-scope acceptance reference remains open or ambiguously owned.
- Verification: database journey, full verifier, package/release evidence review.
- Recovery: keep the task in-progress and the capability disabled; no contract rollback is needed for missing external evidence.

## Kickoff gate

- Status: ready
- Authorized boundary: none
- [x] Decisions: the contract, ownership, event, handoff, and trust boundaries are settled.
- [x] Design: current public interfaces and invariants are captured in `02-architecture.md`.
- [x] Route: the remaining qualification phase has a concrete first action and recovery boundary.
- [x] Verification: environment-backed and repository checks are identified in `verification.md`.

## Risks and recovery

| Risk | Detection | Mitigation | Recovery / rollback |
|---|---|---|---|
| A scenario or consumer introduces a private shared path. | Consumer-boundary, semantic, and manifest checks. | Require standard adapters/events and declared Web/Admin-only extensions. | Reject activation and revert the incompatible additive declaration. |
| Events or projections become a second state source. | Payload/schema review and negative fixtures. | Keep signals refs-only and require canonical reread. | Restore the last source-locked schema. |
| Source evidence cannot be reproduced. | Exact source-lock check across paths/aliases/EOL. | Separate contract-bearing and evidence revisions. | Keep adoption disabled and reseal from an exact commit. |
| Starter qualification depends on an unavailable database. | Database journey remains not-run. | Use a disposable, owner-local PostgreSQL environment. | Keep task in-progress; do not claim database evidence. |

## Phase closeout

- Review: Contracts, docs, templates, conformance, release state, and task evidence agree.
- Record update: Update status and verification only when decisive qualification or ownership evidence changes.
- Checkpoint: Each contract-bearing unit and its later source-lock evidence remain separately recoverable.
