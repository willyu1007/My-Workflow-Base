# Plan

## Phase 1: Matrix contract reduction

Steps:
1. Rewrite `architecture-matrix.md` so each surface has four explicit fields:
   `reads`, `actions`, `handoffs`, and `forbidden`.
2. Keep base modules to five rows only.
3. Move explanatory prose into shared contracts instead of repeating it in every
   cell.
4. Mark open questions instead of resolving them implicitly.

Acceptance:
- Matrix can be reviewed row by row.
- No row requires scenario-private product APIs.
- The table distinguishes display projection from canonical reads.
- The table distinguishes chat workflow control, chat dashboard summary, and
  chat citation instead of treating chat as one generic surface.

## Phase 2: Manifest alignment

Steps:
1. Map every matrix requirement to `scenario.manifest.yaml` fields.
2. Identify missing fields or overly broad fields.
3. Update `module-contract.md` and template manifest only after the matrix is
   stable.
4. Keep `scenario_data` explicit for domain facts, start requirements, and
   step interventions.

Acceptance:
- Manifest declares all surfaces it supports.
- Manifest declares all handoff types and internal APIs.
- Registry validation can be derived from manifest fields.

## Phase 3: API alignment

Steps:
1. Map every product-surface action to a Workflow API endpoint or handoff.
2. Confirm internal API namespace and ownership rules.
3. Tighten error taxonomy around disabled scenario, manifest mismatch, stale
   version, handoff rejected, and internal API forbidden.

Acceptance:
- Chat/mobile/forum/RAG/notification do not need scenario-private endpoints.
- Chat endpoints cannot perform step interventions or proactive intervention
  reminders.
- Web/Admin internal APIs remain separate from product consumption APIs.

## Phase 4: Skeleton readiness

Steps:
1. Draft package layout and TypeScript type boundaries.
2. Draft manifest validator and registry loader responsibilities.
3. Draft deterministic journey harness contract.
4. Decide which parts remain docs-only for v0.

Acceptance:
- Implementation can start without reopening M1/M2/M3 ownership debates.

## Current First Move
Start with Phase 1. Do not edit implementation skeletons yet.
