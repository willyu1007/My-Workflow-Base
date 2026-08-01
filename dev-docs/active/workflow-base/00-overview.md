# Workflow Base

## Goal
Converge the workflow base into a v0 plug-in contract that supports controlled
scenario modules and consistent product consumption surfaces.

The first convergence target is the two-layer structure:

```txt
base modules
  -> Scenario registry
  -> Workflow ledger
  -> Surface presenters
  -> Handoff ledger
  -> Governance gates

consumption surfaces
  -> chat workflow control
  -> chat dashboard summary
  -> chat citation
  -> web domain workbench
  -> web run workbench
  -> mobile dashboard
  -> forum/publication
  -> RAG/knowledge
  -> notification/push
  -> admin/operator
  -> worker/runtime
```

## Status
- State: in-progress
- Owner: unassigned
- Created: 2026-05-25
- Updated: 2026-08-01
- Roadmap: `dev-docs/active/workflow-base/roadmap.md`
- Completed increments:
  - N1 ecosystem model adoption and RB-4
    documentation/template/conformance reconciliation at `df13843`
  - X-5 Base federation-v1 contract convergence at source revision `eb19433`
    and evidence revision `6cf298c`
- Next-gate outcome (recorded 2026-08-01 by My-Chat/T-030 R6): satisfied -
  My-Chat adopted the converged contract layer at `042b880`, Education
  removed its forks and re-pinned (their `e12605b`), Nurture re-pinned
  (their `7a0090b`), and the four-repository qualification lock v4
  `r3-derived-read-2026-07-31-v4` passed locally and in the
  Education-caller cloud run `30641376220`

## Context
This repository is the workflow base template. It defines durable contracts for
scenario modules and host product consumers. It should not encode one product
repo, one local machine path, or one scenario as the core boundary.
It is not a deployed runtime. Concrete workflows adopt the template and expose
standard surface adapters/API shapes to the host product.

The current design stance is:
- `Scenario` is a first-class canonical object.
- Product consumers use concrete workflow standard adapters/API shapes and
  presenters.
- Canonical domain objects are platform-owned outside workflow. Workflow shares
  domain context through refs, resolver-created snapshots, and context bindings.
- Chat collects lightweight setup/start requirements and summarizes dashboard
  state, but does not perform step interventions or intervention reminders.
- Web/Admin may expose internal APIs declared by manifest or equivalent TS
  contract.
- The base template defines handoff request/receipt contracts only; concrete
  workflows create the actual requests.
- Scenario modules use YAML manifest or equivalent TS contract plus TypeScript
  registries.

## Scope In
- v0 architecture matrix convergence.
- Base module definitions and ownership boundaries.
- Consumption surface rules for chat workflow control, chat dashboard summary,
  chat citation, web domain workbench, web run workbench, mobile dashboard,
  forum publication, RAG/knowledge, notification push, admin/operator, and
  worker/runtime.
- Shared identity, state, action, exposure, handoff, and presenter contracts.
- Domain context contracts for context refs, resolver-created snapshots, context
  bindings, run start requirements, and web-owned step interventions.
- Manifest/API/module contract implications.
- Macro roadmap for moving from docs to implementation skeleton.
- X0 additive vNext handoff, durable-driver, host-capability, and completion
  contracts for later explicit host materialization.
- Source-repo workspace, deterministic legacy/vNext conformance fixtures, and CI
  gates that validate templates before host adoption.

## Scope Out
- Implementing runtime services.
- Implementing a host product integration.
- Implementing Prisma models, database transactions, queues, outbox dispatch, or
  a concrete Handoff Ledger.
- Implementing forum, RAG, notification, or public draft downstream modules.
- User-editable workflow builders.
- Plugin marketplace behavior.
- Scenario-specific domain object schemas beyond examples.

## Key Decisions
- D1: The template defines five contract modules: `Scenario registry`, `Workflow ledger`,
  `Surface presenters`, `Handoff ledger`, and `Governance gates`.
- D2: The product layer has eleven consumption surfaces:
  `chat_workflow_control`, `chat_dashboard_summary`, `chat_citation`,
  `web_domain_workbench`, `web_run_workbench`, `mobile_dashboard`,
  `forum_publication`, `rag_knowledge`, `notification_push`, `admin_operator`,
  and `worker_runtime`.
- D3: Every surface uses the same workflow identity chain and state vocabulary.
- D4: UI surfaces render action availability; durable writes go through standard
  command/action APIs with expected versions.
- D5: Downstream exposure uses handoff request/receipt records. The base sends
  refs and metadata only, never private bodies.
- D6: Internal custom APIs are allowed only for Web/Admin and only when declared
  by the scenario manifest or equivalent TS contract.
- D7: Multiple workflows inside one scenario share data through domain context
  refs, snapshots, bindings, and domain events, not through another workflow's
  private run/step state.
- D8: Indexing is service-owned and policy-driven from sharing consent and
  artifact eligibility; dashboards must not expose direct knowledge-base
  indexing actions.
- D9: Canonical domain registry is a platform/domain capability implemented by
  the host product. Workflow base only defines the Domain Context contract and
  consumes canonical domain through a resolver.
- D10: Chat does not call this template as a runtime. It calls the concrete workflow's
  standard `ChatWorkflowAdapter` or equivalent route group.
- D11: Chat consumes conflicts only through `ChatConflictSummary`. Detailed
  conflict resolution views belong to Web workbenches/Admin; evidence details
  stay behind allowlisted Admin/API reads.
- D12: Resolution actions are Web/Admin operation-surface capabilities. Chat
  does not execute resolution actions; it only receives safe target links.
- D13: MVP requires a minimal evidence log for P0/P1 authoritative writes, not a
  full audit product, review queue, reporting dashboard, or staffed manual audit
  process.
- D14: Outbox events are downstream signals only. They carry refs, versions,
  purpose/reason, and trace metadata; downstream systems reread canonical state
  before projection, notification, publication, indexing, search/vector, PPR, or
  replay side effects.
- D15: Event registry has three layers: platform events, standard workflow
  events, and scenario internal events. Shared product consumers may depend only
  on platform events and standard `workflow.*` events, never on scenario
  internal event names.
- D16: Standard workflow event payloads use refs-only
  `WorkflowSignalPayload`; canonical status and presenter output stay out of
  payloads and are derived by canonical reread.
- D17: Event ownership follows canonical aggregate ownership. The base defines
  the producer/consumer contract; concrete workflows emit standard events from
  the aggregate owner, and shared consumers must not depend on scenario internal
  events.
- D18: Activation is validator-enforced. The base defines manifest validation
  rules and activation gates; the host product runs them in CI, registration, or
  admin dry-run before pilot/GA enablement.
- D19: Registry loading is host-owned and fail-fast. The base defines registered
  descriptor and loader rules; the host loads approved modules at deploy/boot
  and resolves runtime handlers from canonical workflow identity plus contract
  hash.
- D20: Standard API closure is the product contract. Concrete workflows expose
  the same discovery, start requirements, run lifecycle, action, artifact,
  handoff, dashboard, chat citation, admin, and worker runtime ports; scenario
  internal APIs remain Web/Admin-only extensions.
- D21: Implementation skeleton is scaffold-only. The base defines recommended
  host package layout, validator, registry loader, routes, handoff service,
  worker runtime, and journey harness shapes; host products implement them.
- D22: Scenario readiness is proven by a second scenario. A non-education
  scenario must plug into the same base modules and product surfaces without new
  shared product APIs.
- D23: V0 readiness requires a semantic drift pass. Base-runtime wording,
  scenario-specific shared APIs/events, bodyful payloads, direct downstream
  writes, chat interventions, dashboard indexing, and workflow-owned canonical
  domain objects are explicit regressions.
- D24: X0 remains additive. Existing manifest, runtime-port, and
  `WorkflowHandoffResult` shapes continue to compile and retain their legacy
  semantics.
- D25: A handoff opts into vNext materialization through an explicit optional
  `materialization_mode: "workflow_step_complete_v1"`; the validator does not
  infer activation from `handoff_type` or downstream owner.
- D26: Host capability evidence is additive and absent means disabled. The
  vNext path requires `workflow_handoff_materialization_v1`; legacy handoffs do
  not.
- D27: `complete_step` vNext uses a discriminated input/result branch so its
  `claim_token` and deterministic materialization result can be required without
  making legacy completion calls invalid.
- D28: The new `requested/completed/stopped/failed` Handoff lifecycle is a
  versioned type. It does not reinterpret the existing
  `WorkflowHandoffResult.status` union; `created/existing` is a materialization
  disposition only.
- D29: Claim tokens are transient secrets. Contracts may carry them only on the
  trusted runtime call path; fixtures, logs, hashes, persisted snapshots, and
  presenter/output DTOs must not retain them.
- D30: Base contract changes must pass in-repo typecheck/tests, a frozen legacy
  contract-hash fixture, and vNext conformance before My-Chat adoption begins.
- D31: Cross-repo source adoption uses a separate deterministic source hash over
  logical contract/validator roots. It normalizes physical host package aliases
  but is never substituted for a runtime scenario `contract_hash`.
- D32: Only an omitted `materialization_mode` is legacy. Any explicit unknown,
  null, or otherwise unsupported value fails closed before activation.
- D33: The exported completion result is a closed legacy/v1 union; a result with
  the v1 discriminator must include deterministic materialization output.
- D34: My-Chat X1 injects the host-owned
  `WorkflowRuntimePortMaterializationV1` directly into its worker. It does not
  recover the v1 overload from the legacy scenario adapter through a cast.

## Dependencies
- `docs/context/workflow/v0-convergence.md`
- `docs/context/workflow/architecture-matrix.md`
- `docs/context/workflow/surface-contract.md`
- `docs/context/workflow/api-contract.md`
- `docs/context/workflow/module-contract.md`
- `docs/context/workflow/implementation-skeleton.md`
- `docs/context/workflow/scenario-readiness-proof.md`
- `docs/context/workflow/v0-readiness-checklist.md`
- `templates/scenario-module/scenario.manifest.yaml`

## Acceptance Criteria
- [ ] `architecture-matrix.md` is reduced to a v0 contract rather than a broad
  discussion note.
- [ ] Every base module has a single owner statement and non-owner statement.
- [ ] Every surface has explicit `reads`, `actions`, `handoffs`, and
  `forbidden` rules.
- [ ] Matrix rules map to concrete manifest fields.
- [ ] Manifest fields distinguish domain context refs, run start requirements,
  and step interventions.
- [ ] Matrix rules map to concrete workflow API/adapter endpoints and DTOs.
- [ ] Handoff request/receipt minimum fields are stable.
- [ ] Internal API boundary is stable and Web/Admin-only.
- [ ] A second scenario can be evaluated against the matrix without adding a new
  product-surface API.
- [ ] Multiple workflows in one scenario can share domain context without
  coupling to each other's internal run/step state.
- [ ] Downstream information matrix states trigger signals, canonical reread
  sources, required refs, forbidden payloads, and invalidation behavior for
  projection, public draft/forum, RAG/knowledge, notification, search/vector,
  PPR, and admin replay.
- [ ] Standard workflow event registry is stable and scenario internal events
  cannot become shared chat/mobile/forum/RAG/notification/PPR dependencies.
- [ ] Standard workflow event payload schema defines aggregate type/id, minimum
  refs, forbidden fields, and deterministic idempotency key rules.
- [ ] Event producer/consumer ownership is declared in the manifest or TS
  contract and rejects shared consumer dependencies on scenario internal events.
- [ ] Manifest validation rules define fatal checks for identity, registry
  bindings, internal API boundaries, handoffs, event ownership, payload policy,
  evidence records, projection review, and journey tests.
- [ ] Registry loader contract defines registered descriptor, runtime identity
  resolution, fail-fast loader rules, disabled-module behavior, and migration
  bridge warnings.
- [ ] Standard API/adapter closure maps each product surface to stable required
  routes or ports and rejects scenario-specific product APIs.
- [ ] Implementation skeleton defines host package layout, contract exports,
  validator scaffold, registry loader scaffold, route scaffold, handoff service,
  worker runtime, journey harness, and scaffold acceptance.
- [ ] Scenario readiness proof shows an education-like seed walkthrough and a
  non-education scenario sketch using the same contracts without new shared
  product APIs.
- [ ] V0 readiness checklist records the semantic drift pass and
  must-not-regress checks.

### X0-A Acceptance Criteria

- [x] Root workspace and frozen lockfile install from a clean checkout.
- [x] Workflow contracts, runtime scaffold, and scenario template independently
  typecheck.
- [x] Validator/worker tests and scenario journey tests run from one root
  command.
- [x] Legacy validator fixture pins its existing contract hash.
- [x] GitHub Actions runs the same frozen-install and verification command.
- [x] No vNext contract fields, runtime persistence, Prisma, queue, or outbox
  implementation is introduced in X0-A.

### X0-B Acceptance Criteria

- [x] Legacy manifest, host snapshot, completion input/result, and Handoff
  lifecycle fixtures still compile without vNext fields.
- [x] vNext manifest, snapshot, draft, trusted driver, host capability,
  completion input/result, and versioned lifecycle fixtures compile.
- [x] `WorkflowRuntimePort` retains its legacy `complete_step` contract while
  `WorkflowRuntimePortMaterializationV1` correlates legacy and v1 input/result
  overloads.
- [x] Newly added vNext claim-token fields occur only on trusted
  driver/completion inputs and are not retained by snapshot, draft, lifecycle,
  or materialized-result types.
- [x] No validator behavior, runtime persistence, Prisma, queue, Outbox, or
  scenario-specific logic is introduced in X0-B.

### X0-C Acceptance Criteria

- [x] No-handoff manifests produce no migration finding and retain the frozen
  legacy contract hash.
- [x] Legacy handoffs without `materialization_mode` produce warning-only
  `WF-MAN-043` and remain registerable.
- [x] Invalid vNext declarations fail on missing key, missing source,
  missing/empty host capability, or duplicate declared key through
  `WF-MAN-044`–`047`.
- [x] Explicit unknown or null `materialization_mode` values fail closed through
  `WF-MAN-048`; only an omitted field receives the legacy warning.
- [x] A valid vNext declaration passes when all requirements and the host
  capability are present.
- [x] Negative compile fixtures reject missing trusted claim evidence and reject
  claim fields on snapshot, draft, materialization, and completion-result DTOs.
- [x] Existing `WF-MAN-040`–`042` semantics/finding paths, legacy lifecycle,
  contract types, and runtime ownership remain unchanged.

### X0-D Acceptance Criteria

- [x] The last contract-bearing Base revision is pinned independently from
  later documentation/evidence commits.
- [x] A machine-readable lock records the aggregate source hash, logical roots,
  normalized file manifest, and per-file hashes.
- [x] Hash reproduction is independent of physical repo path, LF/CRLF, and the
  expected `@host`/`@my-chat` workflow-contracts package alias.
- [x] The generic verification command checks the source lock on every CI run.
- [x] My-Chat X1 has an explicit adoption mapping, required actions, non-goals,
  reproduction command, and exit evidence checklist.
- [x] X0-D adds no contract/validator behavior, runtime persistence, Prisma,
  queue, Outbox, provider, scenario logic, or capability enablement.

### X0 Post-Review Repair Acceptance Criteria

- [x] A v1-looking completion result without `materialized_handoffs` fails
  TypeScript conformance.
- [x] Unknown and null materialization modes fail validator conformance.
- [x] A compile fixture composes claimed driver evidence, handler drafts, and a
  directly injected host v1 runtime port without a type assertion.
- [x] BOM/CRLF, physical-root, and allowed package-alias portability are part of
  the generic CI conformance command.
- [x] Contract docs, validator rule tables, X1 handoff, source revision, and
  source hash identify the repaired contract consistently.

## Current Notes
- 2026-05-25: Task package created to preserve macro alignment before further
  contract edits.
- 2026-05-26: Matrix stance updated: chat is workflow control, dashboard
  summary, and citation only; Web owns domain and run workbenches; service-owned
  indexing is driven by sharing consent/policy.
- 2026-05-26: Canonical domain registry stance added: host/platform owns domain
  objects; workflow consumes refs through resolver snapshots and bindings.
- 2026-05-26: Conflict exposure stance added: chat gets simple summarize/block/
  link conflict summaries only.
- 2026-05-26: Resolution action ownership added: concrete workflows implement
  standard action names; Web/Admin own conflict repair, while chat only links.
- 2026-05-26: Audit scope reduced to MVP evidence log: record high-risk writes
  and resolution/handoff/domain-context mutations, but do not build audit UI or
  log low-value reads/clicks.
- 2026-06-26: Web workbench package boundary follow-up added. The UI kit keeps
  its root entry for compatibility and adds grouped public subpath entries so
  host products can avoid broad route chunks.
- 2026-07-13: Cross-repo readiness review confirmed Base and My-Chat contract
  source parity, but found that the Base host/scenario templates could not
  independently install, typecheck, or run tests.
- 2026-07-13: X0-A started on an isolated branch. The current work is limited to
  governance and source-repo conformance; X0-B owns vNext type additions.
- 2026-07-13: X0-A implementation and clean-install verification completed. The
  task remains `in-progress`; X0-B is the next gate and no host activation is
  enabled.
- 2026-07-13: X0-B additive contract types and positive legacy/vNext compile
  fixtures completed. The legacy runtime port remains unchanged; the vNext
  materialization port is an explicit additive extension. X0-C remains the
  validator/negative-conformance gate, and no host activation is enabled.
- 2026-07-13: X0-C implemented the reserved `WF-MAN-043`–`047` matrix,
  negative type fixtures, and claim-token persistence/logging guard. The task
  remains `in-progress`; X0-D must record the final revision/source hash before
  My-Chat X1 adoption, and no capability is enabled.
- 2026-07-13: X0-D pinned contract source revision `e20c073`, source hash
  `1a393c21192e711a7e87733724fc74d9c0c5bbb36a2ad2824d34157e2be83416`,
  and the My-Chat X1 adoption handoff. The broader workflow-base task remains
  `in-progress`; ownership now moves to the separate My-Chat X1 task, and the
  host capability remains disabled.
- 2026-07-13: Post-X0 quality review superseded that initial revision/hash with
  repaired contract revision `c7f904c` and source hash
  `a97a5b149b222e70b5cfb7592414108fa0684887a08b08b3819ce2037577e981`.
  Repair evidence revision `ee84c29` and remote CI passed; My-Chat X1 is
  unblocked while the host capability remains disabled.
- 2026-05-26: Downstream information matrix added: outbox carries signals and
  refs only; downstream consumers must reread canonical state and own their
  side effects.
- 2026-05-26: Event registry convergence added: product consumers depend on
  platform events and standard workflow events; scenario internal events remain
  implementation-only.
- 2026-05-26: Standard workflow event payload schema added: refs-only payloads,
  no status/presenter output, deterministic idempotency keys.
- 2026-05-26: Event ownership registry added: producers follow canonical
  aggregate ownership; shared consumers subscribe only to platform events and
  standard workflow events.
- 2026-05-26: Manifest validation and activation gates added: fatal findings
  block pilot/GA activation; migration bridges are warnings only when timeboxed.
- 2026-05-26: Registry loader contract added: host-owned loader registers
  validated modules and resolves handlers/adapters from canonical identity plus
  contract hash.
- 2026-05-26: Standard API closure added: concrete workflows expose stable
  product-facing API/adapter groups while scenario internal APIs stay Web/Admin
  only.
- 2026-05-26: Implementation skeleton added: host layout, validator, registry
  loader, route, handoff, worker, and deterministic journey harness scaffolds.
- 2026-05-26: Scenario readiness proof added: education-like seed walkthrough
  and non-education support-case sketch use the same base contracts and surface
  APIs.
- 2026-05-26: V0 readiness checklist added: semantic drift pass records
  contract readiness and must-not-regress checks.
- 2026-07-28: N1 adopted the ecosystem development model, distribution lanes,
  forward-only schema convention, local port allocation, and status labels.
  RB-4 drift is closed for the implemented module shape, validator inventory,
  loader claims, scenario package layout, and materialization-v1 worker example.
  Advisory consumer checks reproduce the known Education and Nurture boundary
  violations; owner-repository cleanup is the next increment.
- 2026-07-28: X-5 replayed the federation-v1 contract work onto the N1 baseline
  without merging the stale candidate branch. The converged source revision is
  `eb19433c6e68ad1abaaddc356e6afe5ea52dcf97`, the evidence revision is
  `6cf298c`, and the exact adoption source hash is
  `caebe85d492724a727b0ccb7a99fe9da15e0536393c4a0ab42069f8264ea7b2e`.
  The N1 documentation and consumer-boundary gates remain active. My-Chat
  adoption is now the next cross-repository gate.
