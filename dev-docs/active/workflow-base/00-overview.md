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
- Updated: 2026-05-26
- Roadmap: `dev-docs/active/workflow-base/roadmap.md`

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

## Scope Out
- Implementing runtime services.
- Implementing a host product integration.
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
