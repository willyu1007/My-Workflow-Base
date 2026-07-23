# Plan

## Current Increment: X0

X0 is the additive contract increment required before My-Chat can adopt durable
handoff materialization. It is split so the validation environment exists before
the contract surface changes.

### X0-A: Governance and conformance baseline

- [x] Synchronize the active task bundle with the cross-repo X0 scope and
  ownership boundary.
- [x] Add a root pnpm workspace and frozen lockfile for the workflow templates.
- [x] Typecheck `workflow-contracts`, `workflow-runtime`, and the scenario module
  template in the Base repository.
- [x] Run validator/worker tests and the scenario journey test from a single
  command.
- [x] Pin the legacy fixture contract hash.
- [x] Add a fast GitHub Actions conformance gate with no secrets or delivery
  behavior.

Acceptance:
- `corepack pnpm install --frozen-lockfile` succeeds from the repository root.
- `corepack pnpm verify:x0-a` passes.
- No files under workflow contract types, manifest shape, Prisma, database,
  queue, provider, or downstream runtime behavior change.

### X0-B: Additive vNext contract types

- [x] Add stable `handoff_key`, context-source declarations, snapshot/draft/driver,
  host-capability, materialized-handoff, versioned lifecycle, and discriminated
  `complete_step` input/result types.
- [x] Keep legacy types and calls valid.
- [x] Add dedicated positive legacy/vNext compile fixtures to the source-repo
  conformance package.
- [x] Keep validator warning/fatal behavior and negative fixtures out of X0-B.

### X0-C: Validator and conformance rules

- [x] Add warning-only legacy handoff migration findings.
- [x] Add fatal vNext key/source/host-capability/duplicate-key rules.
- [x] Add positive and negative vNext fixtures, including claim-token compile and
  no-persistence/logging checks.

### X0-D: Handoff and adoption record

- [x] Run clean/frozen install, typecheck, tests, YAML/template checks, boundary
  scans, and legacy hash checks.
- [x] Record the Base revision and contract source hash for My-Chat X1 adoption.
- [x] Do not enable a host capability or non-empty scenario path in Base.

### X0 post-review quality repair

- [x] Fail closed on every explicit unsupported materialization mode.
- [x] Close the generic completion-result union and add negative conformance.
- [x] Prove a host-owned v1 runtime port can be injected into the worker call
  path without narrowing a legacy scenario adapter.
- [x] Refresh contract docs, source revision/hash lock, handoff evidence, and CI.

## X0 Compatibility Rule Matrix

| Manifest/runtime state | X0 behavior |
| --- | --- |
| No handoff declaration | No migration finding. |
| Legacy handoff without `materialization_mode` | Warning only; legacy behavior and hash remain unchanged. |
| Explicit unknown or null `materialization_mode` | Fatal. |
| vNext mode without stable `handoff_key` | Fatal. |
| vNext mode without any declared artifact/context source type | Fatal. |
| vNext mode with missing/disabled host capability | Fatal. |
| vNext mode with all requirements and capability enabled | Pass. |

Implemented validator mapping:

| Rule id | Severity | Predicate |
| --- | --- | --- |
| `WF-MAN-043` | Warning | Legacy handoff omits `materialization_mode`. |
| `WF-MAN-044` | Fatal | vNext handoff has no non-empty stable `handoff_key`. |
| `WF-MAN-045` | Fatal | vNext handoff has no non-empty artifact/context source type. |
| `WF-MAN-046` | Fatal | Any vNext handoff exists while host capability evidence is absent/empty. |
| `WF-MAN-047` | Fatal | Any non-empty declared `handoff_key` is duplicated. |
| `WF-MAN-048` | Fatal | An explicit `materialization_mode` is not the supported v1 value. |

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
1. Map every matrix requirement to the canonical scenario contract fields.
2. Identify missing fields or overly broad fields.
3. Update `module-contract.md` and template manifest only after the matrix is
   stable.
4. Keep `scenario_data` explicit for domain context refs, start requirements,
   and step interventions.

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
Generate the fresh third-scenario candidate from committed revision
`be17a8880aa4aea16dfc303d6af06dcfdbe38ee7`, then run exact joint-candidate
qualification with the committed Host, Education and Nurture sources. Keep
every Scenario activation disabled until its independent product decision.

## 2026-07-22 post-review hardening

- [x] Make `src/registry.ts` the Starter's sole canonical manifest authority.
- [x] Make `expected_version` updates atomic under concurrent commands.
- [x] Distinguish an exact Owner event replay from an event-id identity
      collision.
- [x] Run integration-lock verification in generated CI and reject dirty
      logical source during joint-candidate qualification.
- [x] Accept the documented package-manager `--` argument separator when
      generating a scenario into an empty directory.
- [x] Regenerate a third scenario from an empty directory and rerun the common
      five-descriptor semantic lint.

Exit: the review findings are closed locally. Publication, environment
inventory and activation remain separate gates.

## 2026-07-21 federation v1 quality checkpoint

- [x] Close command/event/ref/release/receipt validation and fail on future
      manifest versions or unknown fields.
- [x] Hash the complete command authority/target identity for idempotent replay.
- [x] Require safe machine-token receipt reason codes.
- [x] Add a Starter Owner API with atomic execution/outbox, full-envelope
      authorized receipt recovery, independent Prisma and reproducible tests.
- [x] Verify actual package names/versions/public status and reject unknown
      integration-lock v3 fields.
- [x] Build package `dist` before runtime tests so green tests cannot consume a
      stale generated contract.
- [ ] Publish exact Base/Host candidates and run joint-candidate qualification
      with Education, Nurture and a generated third scenario.

## 2026-07-22 CF-010/CF-011 closure increment

- [x] Add a concrete Starter Prisma repository that commits the domain fact,
      command execution and bodyless owner outbox in one short transaction.
- [x] Persist the full refs-only event identity and add an idempotent owner
      inbox with recovery state.
- [x] Add a real PostgreSQL migration and deterministic fresh/migrated Starter
      journey; keep unit tests independent from a database.
- [x] Split the Base contract-owner descriptor from the generated Starter
      scenario descriptor.
- [x] Make descriptor validation role-aware and fail when the contract owner
      omits a normative contract object or Host/contract descriptors pretend to
      be registrable scenarios.
- [x] Update My-Chat to a manifest-free `platform_host` descriptor and pass the
      common lint with Base, Starter, Education and Nurture.

Exit: an empty generated scenario can migrate, execute, replay, receive an
event and package without Host special cases; descriptor roles cannot hide a
second scenario or incomplete contract inventory.
