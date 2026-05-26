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
- Added scenario data classes for shared domain facts, run start requirements,
  and web-owned step interventions.
- Clarified that service-owned indexing follows sharing consent/policy and must
  not be exposed as a dashboard direct knowledge-base indexing action.

## Open Implementation Notes
- The next concrete review should confirm whether `architecture-matrix.md`,
  `surface-contract.md`, `module-contract.md`, and `api-contract.md` now agree
  closely enough to start implementation skeleton work.
- Avoid adding runtime code until the matrix, manifest, and API contracts agree.
- Keep examples scenario-neutral unless explicitly marked as examples.
