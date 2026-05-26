# Roadmap

## Objective
Turn the workflow base from a set of exploratory contracts into a v0 modular
template that concrete workflow teams can implement against and host products
can consume without per-scenario API drift.

The roadmap aligns two layers:
- template contract modules: ownership expectations for identities, state,
  actions, presenters, handoffs, and governance inside concrete workflows
- consumption surfaces: how chat workflow control, chat dashboard summary, chat
  citation, web domain workbench, web run workbench, mobile dashboard, forum
  publication, RAG/knowledge, notification push, admin/operator, and
  worker/runtime consume those contracts

## Macro Alignment

### M0. Contract stance lock
Purpose: freeze what the template defines and what it deliberately does not
implement.

Deliverables:
- v0 convergence note
- two-layer architecture matrix
- scenario as canonical object
- handoff-only downstream boundary
- YAML manifest or equivalent TS contract + TS registry stance

Exit criteria:
- The base can explain why it is not a runtime service, workflow builder, forum
  publisher, indexing service, notification platform, or plugin marketplace.

### M1. Two-layer matrix convergence
Purpose: make the architecture matrix implementation-ready.

Deliverables:
- one compact base-module table
- one compact consumption-surface table
- interaction matrix with four fields per surface: `reads`, `actions`,
  `handoffs`, `forbidden`
- shared identity/state/action/exposure/handoff/presenter contracts
- domain context contract for `domain_context_ref`, `context_snapshot`,
  `context_binding`, `run_start_requirements`, and `step_interventions`
- conflict exposure contract for chat-safe summaries, web resolution views, and
  admin-visible evidence refs
- resolution action ownership table for Web/Admin repair actions
- MVP evidence-log boundary that keeps audit product UI/reporting out of scope
- downstream information matrix with trigger signals, canonical reread sources,
  required refs, forbidden payloads, and invalidation behavior
- three-layer event registry: platform events, standard workflow events, and
  scenario internal events
- standard workflow event payload schema with aggregate mapping, minimum refs,
  forbidden fields, and deterministic idempotency keys
- event ownership registry with producer owners, write boundaries, allowed
  consumers, and forbidden consumers

Exit criteria:
- A scenario author can tell what concrete workflow adapter/API to implement.
- A product surface author can tell what adapters/presenters to consume.
- A reviewer can reject a scenario that adds private consumer paths.
- A downstream owner can implement projection/publication/RAG/notification/
  search/vector/PPR/replay without reading scenario-private payloads.
- Product consumers do not depend on scenario internal event names.
- Standard event payloads can be validated without knowing scenario business
  schemas.
- Shared consumers can be checked against producer/consumer ownership rules
  before a scenario is activated.

### M2. Manifest contract convergence
Purpose: ensure scenario manifests or equivalent TS contracts describe exactly
what the matrix requires.

Deliverables:
- `Scenario` record binding fields
- capability/entrypoint declarations
- handler/action/adapter/presenter/policy registry declarations
- standard surface adapter declarations, especially chat
- surface mapping declarations
- internal API declarations
- handoff declarations
- event registry producer/consumer declarations
- validation report shape with rule ids, severity, path, owner, and remediation
- activation phases for dev, pilot, GA, disabled, and migration bridge warnings
- verification declarations

Exit criteria:
- Contract validation can detect missing handlers, undeclared internal APIs,
  unsupported surfaces, missing handoff receipts, private action paths, scenario
  internal event dependencies, non-ref event payloads, and missing projection
  review.

### M3. API contract convergence
Purpose: align the standard concrete Workflow API/adapter shape with the matrix.

Deliverables:
- scenario list/detail/publish endpoints
- capability list/detail/settings endpoints
- start requirement read/preview endpoint
- run start/detail/timeline endpoints
- action command endpoint
- artifact preview endpoints
- handoff request/receipt endpoints
- dashboard/card and chat citation adapter contract
- worker runtime port contract
- internal API namespace rules
- `ChatWorkflowAdapter` shape
- conflict summary and resolution view DTOs
- standard envelopes and error taxonomy

Exit criteria:
- Chat, mobile, forum, RAG, notification, and admin can consume workflow without
  scenario-specific API contracts.
- Chat control can submit start requirements and strongly confirmed approvals,
  but cannot perform in-run step interventions.
- Worker dispatch can use the runtime port without accepting executable
  instructions from queue payloads.

### M4. Implementation skeleton
Purpose: provide enough code structure for host repos to adopt the base without
inventing shape.

Deliverables:
- package layout proposal for contract/runtime/scenario modules
- TypeScript contract type export list
- manifest schema and validator scaffold
- host-owned registry loader shape with registered descriptor, fail-fast rules,
  and canonical identity resolution
- handoff repository/service shape
- surface adapter shape
- scenario module sample
- deterministic journey harness shape

Exit criteria:
- A host project can scaffold a scenario module and fail fast when contracts are
  incomplete.
- Worker dispatch and surface routing can resolve concrete bindings from
  `scenario_key`, `capability_key`, `entrypoint_key`, `workflow_version_id`,
  `step_key`, and stored `contract_hash`.
- The skeleton makes clear which files are base contract artifacts, host runtime
  implementation, scenario module implementation, and downstream owner code.

### M5. Scenario-readiness proof
Purpose: test that the base is not accidentally education-specific or tied to a
  single host product.

Deliverables:
- example scenario manifest remains generic
- one education-like scenario walkthrough as an example, not a base dependency
- one non-education scenario sketch using the same matrix
- do-not-repeat checklist for host product integrations
- scenario-readiness proof document linked from workflow context docs

Exit criteria:
- Adding a second scenario requires scenario manifest, handlers, presenters,
  policies, repositories, and tests, but no new chat/mobile/forum/RAG/
  notification product API.
- M5 fails if a second scenario needs scenario-specific shared product APIs,
  shared scenario event names, or direct downstream writes.

## Sequencing

1. Finish M1 before editing API or manifest fields again.
2. Use M1 to drive M2 and M3 changes.
3. Do not start M4 implementation skeleton until M2/M3 fields are stable enough
   to avoid churn.
4. Use M5 as the final sanity check before calling v0 contracts implementation
   ready.
5. Run the v0 readiness checklist before host implementation starts.

## Locked Principles

- Postgres is canonical.
- Projection is display optimization only.
- Scenario is a canonical object, not just a directory.
- Canonical domain registry is platform-owned, not workflow-owned.
- Workflow consumes canonical domain only through Domain Context refs,
  resolver-created snapshots, and context bindings.
- Manifest or equivalent TS contract declares shape; TypeScript registries bind
  executable handlers.
- Product surfaces use concrete workflow standard adapters/APIs and presenters.
- Standard API closure is the product contract. Scenario-specific APIs are
  Web/Admin-only extensions.
- Registry loading is host-owned. The base defines contract shape and loader
  checks, but does not dynamically load or execute modules.
- Chat connects to a concrete workflow `ChatWorkflowAdapter`, not to this base
  template as a runtime.
- Chat consumes conflict state only as `ChatConflictSummary` with summarize,
  block, and link intents.
- Resolution actions belong to Web/Admin operation surfaces. Chat does not
  execute them.
- MVP keeps only a minimal evidence log for P0/P1 authoritative writes. It does
  not include audit dashboard, review queue, reporting, rule engine, or
  low-value logging of ordinary reads/clicks.
- Chat has three bounded surfaces: workflow control, dashboard summary, and
  citation. It does not perform step interventions or intervention reminders.
- Web has two bounded workbenches: domain setup/maintenance and in-run
  workflow operations.
- Web/Admin internal APIs are allowed but must be declared in the workflow
  contract artifact.
- Handoff payloads contain refs and metadata only.
- Downstream modules own reread, gate, transformation, side effects, and
  receipts.
- Outbox events are downstream signals only; they carry refs, versions,
  purpose/reason, and trace metadata, not private bodies or downstream-owned
  data payloads.
- Standard `workflow.*` events are the cross-scenario workflow event contract.
  Scenario internal events are declared implementation details and must not be
  consumed by chat/mobile/forum/RAG/notification/search/vector/PPR.
- Standard workflow event payloads are refs-only. Canonical status, artifact
  summary, and presenter output are derived by reread, not copied into payloads.
- Scenario workflows share data through domain context refs, snapshots,
  bindings, and domain events, not through another workflow's private run/step
  state.
- Indexing is service-owned and policy-driven from sharing consent and artifact
  eligibility; dashboards must not expose direct knowledge-base indexing
  actions.
- No surface can use projection, push payload, or manifest text as authority for
  permission, publication, indexing, billing, evidence/audit, or PBR decisions.

## Risks

| Risk | Mitigation |
|---|---|
| Matrix becomes too broad to implement | Reduce each surface to `reads/actions/handoffs/forbidden`. |
| Handoff contract leaks downstream implementation | Keep downstream behavior in owner modules; concrete workflow records request/receipt only. |
| Web internal API becomes a second public API | Require contract declaration, Web/Admin-only auth, and no use by chat/mobile/forum/RAG/notification. |
| Scenario modules redefine workflow identity | Reject manifests/registries that create private run, approval, artifact, or handoff ids. |
| Workflow becomes the domain object store | Keep canonical domain registry in platform/domain layer and expose only resolver contracts to workflow. |
| Base template is mistaken for a runtime platform | State that concrete workflows implement adapters/APIs; chat calls the concrete workflow adapter. |
| Education example becomes base semantics | Keep scenario examples in examples/templates only; base docs use scenario-neutral wording. |
| Chat becomes a hidden operations workbench | Split chat control from dashboard summary and forbid step interventions/reminders. |
| Dashboard implies data-sharing/indexing action | Model sharing as consent/policy settings and make indexing service-owned. |
| Audit scope exceeds team capacity | Keep MVP to a minimal evidence log and postpone audit UI/reporting/review queues. |
| Outbox becomes a hidden data transport | Require downstream canonical reread and reject private body/vector/prompt payloads. |
| Scenario events leak into product consumers | Require consumers to depend on platform events or standard `workflow.*` events only. |
| Event payload becomes second state source | Forbid status/presenter output in payloads and require canonical reread. |
| Event ownership becomes ambiguous during migration | Require a base-owned producer/consumer table and scenario manifest ownership declarations. |
| Contract drifts after convergence | Run `v0-readiness-checklist.md` before host implementation and after major contract edits. |

## Rollback
If contract convergence overfits or introduces ambiguity:
- keep `v0-convergence.md` as the stable decision record
- revert matrix/API/module edits to the last `git diff --check` passing state
- preserve task notes in `03-implementation-notes.md`
- reopen M1 before changing manifest/API again
