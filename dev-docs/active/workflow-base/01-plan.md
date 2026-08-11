# Plan

## Current local increment: trusted invocation handler registry

- [x] Add a scenario-neutral verified invocation context with no detached
  signature, credential or trust-policy payload.
- [x] Add the dedicated `trusted_invocation_handlers` registry to module and
  frozen descriptor shapes.
- [x] Require exact declared/registered bindings and reject legacy registry
  aliases through executable validator findings.
- [x] Add one dispatcher that matches contract hash, route, operation, schema,
  ingress and principal origin before invoking only the dedicated registry.
- [x] Preserve the frozen legacy manifest contract hash and pass all unlocked
  typecheck/runtime/scenario/conformance checks.
- [ ] Land the source-bearing change in an exact Base revision, then refresh
  the aggregate/per-file/profile source lock against that revision and rerun
  the complete source-lock portability gate.

No deploy, publish, capability activation or traffic change belongs to this
increment.

## Current increment: X-5 federation convergence

- [x] Replay the four required federation code changes onto current Base main
  instead of merging the stale candidate branch.
- [x] Preserve the N1 documentation-alignment and consumer-boundary checks while
  adding federation schemas, release validation, canonical-reference linting,
  and integration-lock verification.
- [x] Publish `@my-chat/base-contract-conformance` as a public `1.0.0`
  conformance package with executable integration-lock support.
- [x] Bind the aggregate source hash and per-file manifest to the exact
  contract-bearing source revision `eb19433c6e68ad1abaaddc356e6afe5ea52dcf97`.
- [x] Expand the mechanically checked validator inventory for every newly
  emitted rule id.
- [x] Pass the complete sequential `pnpm verify:workflow-contracts` gate from a
  frozen clean worktree.

Contract source revision: `eb19433c6e68ad1abaaddc356e6afe5ea52dcf97`.
Evidence revision before this handoff update: `6cf298c`.
Adoption source hash:
`caebe85d492724a727b0ccb7a99fe9da15e0536393c4a0ab42069f8264ea7b2e`.

## Completed increment: N1 ecosystem alignment

- [x] Adopt `docs/context/ecosystem/development-model.md` as the normative
  cross-repository role and extraction model.
- [x] Publish the sanctioned contract distribution lanes, re-pin ritual,
  forward-only schema convention, collision-free target ports, and status
  labels.
- [x] Reconcile `WorkflowScenarioModule` documentation with the exported type.
- [x] Reconcile the validator rule inventory with every rule id emitted by
  `validate-module.ts`.
- [x] Remove the unimplemented loader rule-id family and document only
  executable loader invariants.
- [x] Select `packages/<scenario-key>-scenario/` as the single template layout.
- [x] Add a compiling materialization-v1 worker example with a directly
  injected host port.
- [x] Add mechanical documentation alignment and advisory consumer-boundary
  checks to Base conformance.
- [x] Run the checker against Base, My-Chat, The-Education, and The-Nurture;
  preserve unresolved consumer findings for their owner phases.

Implementation revision: `df13843`.

## Historical increment: X0

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
1. Map every matrix requirement to `scenario.manifest.yaml` fields.
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
Adopt the converged Base contract and validator source in `My-Chat/T-030` while
preserving the already published Nurture API boundary. Then execute
`The-Education/T-041`: replace scenario-owned shared workflow forks with the
sanctioned Base/My-Chat lane, update exact revisions and hashes, and run the
consumer checker with `--consumer-role scenario --strict`.
