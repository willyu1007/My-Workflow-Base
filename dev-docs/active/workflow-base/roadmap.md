# Roadmap

## Objective
Turn the workflow base from a set of exploratory contracts into a v0 modular
foundation that scenario teams can implement against and host products can
consume without per-scenario API drift.

The roadmap aligns two layers:
- base modules: ownership of identities, state, actions, presenters, handoffs,
  and governance
- consumption surfaces: how chat workflow control, chat dashboard summary, chat
  citation, web domain workbench, web run workbench, mobile dashboard, forum
  publication, RAG/knowledge, notification push, admin/operator, and
  worker/runtime consume those contracts

## Macro Alignment

### M0. Contract stance lock
Purpose: freeze what the base owns and what it deliberately does not own.

Deliverables:
- v0 convergence note
- two-layer architecture matrix
- scenario as canonical object
- handoff-only downstream boundary
- YAML manifest + TS registry stance

Exit criteria:
- The base can explain why it is not a workflow builder, forum publisher,
  indexing service, notification platform, or plugin marketplace.

### M1. Two-layer matrix convergence
Purpose: make the architecture matrix implementation-ready.

Deliverables:
- one compact base-module table
- one compact consumption-surface table
- interaction matrix with four fields per surface: `reads`, `actions`,
  `handoffs`, `forbidden`
- shared identity/state/action/exposure/handoff/presenter contracts
- scenario data contract for `scenario_domain_facts`,
  `run_start_requirements`, and `step_interventions`

Exit criteria:
- A scenario author can tell what to implement.
- A product surface author can tell what APIs/presenters to consume.
- A reviewer can reject a scenario that adds private consumer paths.

### M2. Manifest contract convergence
Purpose: ensure scenario manifests describe exactly what the matrix requires.

Deliverables:
- `Scenario` record binding fields
- capability/entrypoint declarations
- handler/action/presenter/policy registry declarations
- surface mapping declarations
- internal API declarations
- handoff declarations
- verification declarations

Exit criteria:
- Manifest validation can detect missing handlers, undeclared internal APIs,
  unsupported surfaces, missing handoff receipts, and private action paths.

### M3. API contract convergence
Purpose: align the shared Workflow API with the matrix.

Deliverables:
- scenario list/detail/publish endpoints
- capability list/detail/settings endpoints
- run start/detail/timeline endpoints
- action command endpoint
- artifact preview endpoints
- handoff request/receipt endpoints
- internal API namespace rules
- standard envelopes and error taxonomy

Exit criteria:
- Chat, mobile, forum, RAG, notification, and admin can consume workflow without
  scenario-specific API contracts.
- Chat control can submit start requirements and strongly confirmed approvals,
  but cannot perform in-run step interventions.

### M4. Implementation skeleton
Purpose: provide enough code structure for host repos to adopt the base without
inventing shape.

Deliverables:
- package layout proposal
- TypeScript contract types
- manifest schema and validator shape
- registry loader shape
- handoff repository/service shape
- scenario module sample
- deterministic journey harness shape

Exit criteria:
- A host project can scaffold a scenario module and fail fast when contracts are
  incomplete.

### M5. Scenario-readiness proof
Purpose: test that the base is not accidentally education-specific or tied to a
  single host product.

Deliverables:
- example scenario manifest remains generic
- one education-like scenario walkthrough as an example, not a base dependency
- one non-education scenario sketch using the same matrix
- do-not-repeat checklist for host product integrations

Exit criteria:
- Adding a second scenario requires scenario manifest, handlers, presenters,
  policies, repositories, and tests, but no new chat/mobile/forum/RAG/
  notification product API.

## Sequencing

1. Finish M1 before editing API or manifest fields again.
2. Use M1 to drive M2 and M3 changes.
3. Do not start M4 implementation skeleton until M2/M3 fields are stable enough
   to avoid churn.
4. Use M5 as the final sanity check before calling v0 contracts implementation
   ready.

## Locked Principles

- Postgres is canonical.
- Projection is display optimization only.
- Scenario is a canonical object, not just a directory.
- Manifests declare shape; TypeScript registries bind executable handlers.
- Product surfaces use Workflow APIs and presenters.
- Chat has three bounded surfaces: workflow control, dashboard summary, and
  citation. It does not perform step interventions or intervention reminders.
- Web has two bounded workbenches: domain setup/maintenance and in-run
  workflow operations.
- Web/Admin internal APIs are allowed but must be manifest-declared.
- Handoff payloads contain refs and metadata only.
- Downstream modules own reread, gate, transformation, side effects, and
  receipts.
- Scenario workflows share data through scenario domain facts and domain
  events, not through another workflow's private run/step state.
- Indexing is service-owned and policy-driven from sharing consent and artifact
  eligibility; dashboards must not expose direct knowledge-base indexing
  actions.
- No surface can use projection, push payload, or manifest text as authority for
  permission, publication, indexing, billing, audit, or PBR decisions.

## Risks

| Risk | Mitigation |
|---|---|
| Matrix becomes too broad to implement | Reduce each surface to `reads/actions/handoffs/forbidden`. |
| Handoff contract leaks downstream implementation | Keep downstream behavior in owner modules; base records request/receipt only. |
| Web internal API becomes a second public API | Require manifest declaration, Web/Admin-only auth, and no use by chat/mobile/forum/RAG/notification. |
| Scenario modules redefine workflow identity | Reject manifests/registries that create private run, approval, artifact, or handoff ids. |
| Education example becomes base semantics | Keep scenario examples in examples/templates only; base docs use scenario-neutral wording. |
| Chat becomes a hidden operations workbench | Split chat control from dashboard summary and forbid step interventions/reminders. |
| Dashboard implies data-sharing/indexing action | Model sharing as consent/policy settings and make indexing service-owned. |

## Rollback
If contract convergence overfits or introduces ambiguity:
- keep `v0-convergence.md` as the stable decision record
- revert matrix/API/module edits to the last `git diff --check` passing state
- preserve task notes in `03-implementation-notes.md`
- reopen M1 before changing manifest/API again
