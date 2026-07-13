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
- X0-B must implement the documented discriminator and versioned completion
  branch without modifying legacy Handoff lifecycle semantics.
- X0-C must add vNext fixtures only after X0-B types compile; X0-A establishes
  the runner and frozen legacy baseline.
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
