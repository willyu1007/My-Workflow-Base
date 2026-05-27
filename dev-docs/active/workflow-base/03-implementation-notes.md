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

## Open Implementation Notes
- The next concrete review should confirm whether copied host projects preserve
  the template/runtime boundary without importing this repository.
- Keep examples scenario-neutral unless explicitly marked as examples.
