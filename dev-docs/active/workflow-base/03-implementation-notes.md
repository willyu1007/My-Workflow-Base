# Implementation Notes

## 2026-05-25 Task Package Creation
- Added a local dev-docs convention file for this base repository.
- Created `dev-docs/active/workflow-base/` as the active convergence package.
- Set the roadmap focus to v0 contract convergence before implementation
  skeleton work.
- Locked the macro sequence: matrix first, then manifest/API alignment, then
  implementation skeleton.

## 2026-05-26 Consumption Surface Convergence
- Split chat into workflow control, dashboard summary, and citation surfaces.
- Removed chat ownership of step interventions and intervention reminders.
- Split web into domain workbench and run workbench.
- Added scenario data classes for domain context refs, run start requirements,
  and web-owned step interventions.
- Clarified that service-owned indexing follows sharing consent/policy and must
  not be exposed as a dashboard direct knowledge-base indexing action.

## 2026-05-27 Lightweight Scaffold
- Added copyable `templates/host-runtime` scaffold with local workflow contract
  and runtime package shapes.
- Added scenario module TypeScript stubs for module wiring, registry, handler,
  action registry, adapter, presenters, policies, repository port placeholder,
  and deterministic journey test.
- Included chat, web run workbench, mobile dashboard, admin operator, and worker
  runtime adapter stubs so the scaffold matches the standard surface closure.
- Added `templates/README.md` and linked scaffold usage from repository README,
  scenario template README, and implementation skeleton docs.
- Fixed scaffold quality findings: worker now uses claim/complete/fail through
  `WorkflowRuntimePort`, validator computes a deterministic contract hash from
  normalized module content, handler resolution uses full workflow identity,
  action command types support the full standard action set, and descriptors are
  deep-frozen.

## 2026-06-26 Web Workbench Public Entry Split
- Added the implementation plan for `@willyu1007/web-workbench@0.6.6`.
- The root entry remains a legacy compatibility barrel.
- Recommended host consumption moves to grouped entries:
  `primitives`, `shell`, `feedback`, `list`, `insight`, `settings`, `hub`,
  `queue`, and `record`.
- The package will continue to keep `dist/components/*` internal; host products
  should not depend on private build output paths.
- Existing local CSS work in `templates/web-workbench/src/styles/components.css`
  is out of scope and must be preserved.
- To satisfy Node ESM package-resolution smoke checks, relative imports/exports
  in `templates/web-workbench/src` now use explicit `.js` specifiers.
- `build` and `prepublishOnly` were made single-layer/npm-invoked so publishing
  is not blocked by a nested bare `pnpm` resolving to the wrong local runtime.

## Open Implementation Notes
- My-Chat X1 must consume `06-x1-adoption-handoff.md`, create its own task
  package, and record the adopted Base/My-Chat revisions and matching hash.
- Keep examples scenario-neutral unless explicitly marked as examples.

## 2026-07-13 X0-A Governance and Conformance Baseline

- Added a root pnpm workspace for the two host-runtime packages and scenario
  module template; the independent web-workbench package remains outside this
  workspace and retains its own lockfile.
- Added the missing host-runtime base tsconfig and scenario-template package/
  tsconfig so all copyable TypeScript surfaces compile in the source repository.
- Added root typecheck/test/`verify:x0-a` commands and a frozen workspace
  lockfile.
- Changed Vitest package scripts to directory entrypoints so root-level and
  nested tests are matched consistently across shells.
- Added a GitHub Actions PR/main gate that performs frozen install and runs the
  same `verify:x0-a` command; it has read-only contents permission and no
  secrets, delivery, release, or deployment behavior.
- Pinned the complete legacy module fixture contract hash to detect accidental
  normalization or contract-hash drift during X0-B/C.
- No workflow contract type, validator rule, runtime persistence, Prisma,
  database, queue, provider, or downstream side-effect implementation changed.

## 2026-07-13 X0-B Additive vNext Contract Types

- Extended `HandoffManifest` with optional `handoff_key`,
  `source_context_ref_types`, and the explicit
  `workflow_step_complete_v1` materialization discriminator.
- Added scenario replay snapshot, host handoff draft, trusted command driver,
  materialization result, host capability, and separately versioned lifecycle
  types. Existing `WorkflowHandoffResult` semantics remain unchanged.
- Added a discriminated v1 completion input requiring transient claim evidence
  and returning deterministic materialization results.
- Architecture review rejected changing the legacy runtime port to return a
  broad input/output union: that shape could not correlate v1 input to v1
  output and would burden legacy implementers. The final shape preserves
  `WorkflowRuntimePort` and adds `WorkflowRuntimePortMaterializationV1` with
  correlated overloads.
- Added a dedicated conformance workspace with positive legacy and vNext
  compile fixtures. Negative type and validator cases remain assigned to X0-C.
- Updated workflow context docs and scenario-template guidance. No validator
  rule, runtime persistence, Prisma, queue, Outbox, or scenario-specific logic
  was added.

## 2026-07-13 X0-C Validator and Negative Conformance

- Implemented the locked `WF-MAN-043`–`047` compatibility matrix in the host
  validator scaffold. Legacy handoffs warn without blocking; vNext missing
  key/source/capability and duplicate-key declarations fail closed.
- Capability absence is evaluated once at host-snapshot level. Duplicate-key
  detection covers every non-empty declared key, including migration-prepared
  legacy declarations, so a vNext key cannot resolve ambiguously.
- Added validator tests for no-handoff legacy hash stability, warning-only
  registration, valid vNext, each fatal predicate, absent/empty capability, and
  legacy finding-path stability.
- Added negative TypeScript fixtures proving transient claim evidence is
  required on trusted driver/v1 completion inputs and rejected from persisted
  snapshot/draft and output DTOs.
- Added a source-repo claim-token boundary check for type placement and runtime
  logging/metrics calls, and included it in the generic CI verification command.
- Architecture review found an initial accidental change to existing
  `WF-MAN-040`–`042` finding paths. It was reverted and covered by regression
  test before full verification.
- No workflow contract type, runtime persistence, Prisma/database, queue,
  Outbox, provider, downstream side effect, or capability enablement was added.

## 2026-07-13 X0-D Source Lock and X1 Handoff

- Initially pinned the last contract-bearing revision as
  `e20c0735f450fd4fbc65ca195d7bc9a494c20cda`; the post-review repair below
  intentionally supersedes this historical revision/hash pair.
- Added a deterministic SHA-256 source manifest/lock for the contract package
  and validator non-test source. The aggregate adoption hash is
  `1a393c21192e711a7e87733724fc74d9c0c5bbb36a2ad2824d34157e2be83416`.
- Initial review caught that raw validator bytes would differ only because Base
  imports `@host/workflow-contracts` while My-Chat imports
  `@my-chat/workflow-contracts`. The final normalization maps only those two
  allowed aliases in supported module-import positions to a logical alias; a
  portability test proves physical path and alias independence, while a
  negative case proves an unexpected third-party scope changes the hash.
- Added the lock check to the generic source-repo/CI verification command so
  later contract or validator edits cannot silently invalidate the X1 handoff.
- Added `06-x1-adoption-handoff.md` with source mappings, X1 requirements,
  explicit non-goals, reproduction commands, and exit evidence.
- Verified clean My-Chat pre-adoption revision `e53aa610` currently has a
  different logical hash, as expected; X1 owns convergence and must keep the
  capability disabled.
- No contract/validator behavior, runtime persistence, Prisma/database, queue,
  Outbox, provider, scenario logic, or capability enablement changed in X0-D.

## 2026-07-13 X0 Post-Review Contract Repair

- Reproduced and fixed a fail-open validator path: an explicitly unknown or
  null `materialization_mode` was previously treated as a warning-only legacy
  declaration. `WF-MAN-048` now rejects every explicit unsupported value while
  preserving warning-only behavior for an omitted field.
- Closed `WorkflowCompleteStepResult` with a legacy result branch that forbids
  v1 discriminator/materialization fields. Negative TypeScript conformance now
  proves a v1-looking result cannot omit `materialized_handoffs`.
- Kept the scenario adapter legacy-compatible and made the X1 typed path
  explicit: My-Chat injects its host-owned
  `WorkflowRuntimePortMaterializationV1` directly into the worker. A compile
  fixture composes driver evidence, handler drafts, and v1 completion without a
  type assertion; Base still implements no runtime persistence.
- Promoted BOM/CRLF normalization from manual evidence into the generic source
  hash portability test.
- The repaired contract/validator source revision is
  `c7f904cdb9b647c80f28134ab6967cd76f730962`; its adoption source hash is
  `a97a5b149b222e70b5cfb7592414108fa0684887a08b08b3819ce2037577e981`.
- Repair evidence revision `ee84c29b432441f383d27529dbadabc97c9a2c57`
  records the refreshed lock, portability conformance, documentation, and X1
  handoff without changing contract/validator source.
