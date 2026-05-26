# Architecture

## Ownership Boundary

The workflow base defines template contracts, identity vocabulary, and
validation boundaries. It is not a runtime service and does not own
product-specific scenario behavior or downstream side effects.

```txt
Scenario registry
  -> Workflow ledger
  -> Surface presenters
  -> Handoff ledger
  -> Governance gates
  -> host product consumption surfaces
```

## Contract Modules

### Scenario registry
Owns:
- canonical `Scenario` record
- scenario status and lifecycle
- manifest version/hash
- scenario enablement
- manifest publication checks

Does not own:
- canonical domain object tables
- product UX
- downstream publication/indexing/delivery behavior

### Workflow ledger
Owns:
- capability, entrypoint, workflow version, run, step, artifact, approval
- lifecycle state
- canonical writes
- idempotency and expected-version checks

Does not own:
- projection state as authority
- product-specific pages
- downstream side effects

### Surface presenters
Own:
- safe DTOs per product surface
- exposure level downgrade
- action availability hints
- unavailable reason codes

Do not own:
- durable writes
- permission decisions from projection
- downstream transformation or delivery

### Handoff ledger
Owns:
- handoff request identity
- handoff receipt identity
- source refs and expected versions
- idempotency/correlation/trace metadata
- downstream owner status

Does not own:
- public draft body generation
- forum routing/publication
- indexing/chunking/embedding
- notification push delivery
- external delivery execution

### Governance gates
Own:
- scenario/capability enablement
- workflow version publication
- exposure/action/handoff policy hook points
- minimal evidence log and rollback expectations

Do not own:
- user-authored workflow builders
- unrestricted plugin marketplace
- direct DB/projection/downstream mutation shortcuts

## Consumption Surfaces

All product surfaces consume shared workflow contracts. They should not depend
on scenario-private tables except where Web/Admin internal APIs explicitly allow
that access.

Surface categories:
- Chat workflow control
- Chat dashboard summary
- Chat citation
- Mobile dashboard
- Web domain workbench
- Web run workbench
- Forum/publication
- RAG/Knowledge
- Notification/push
- Admin/operator
- Worker/runtime

## Contract Spine

The shared object spine is:

```txt
Scenario
  -> Capability
  -> Entrypoint
  -> WorkflowVersion
  -> Run
  -> Step
  -> Artifact
  -> Approval
  -> ActionAvailability
  -> HandoffRequest
  -> HandoffReceipt
```

Scenario modules can attach domain context refs, snapshots, and bindings to this
spine, but they must not replace it.

## Domain Context Boundary

Canonical domain objects are maintained by a platform/domain registry outside
workflow. Workflow can reference them only through the host
`DomainContextResolver`. Scenario modules must distinguish:
- `domain_context_ref`: stable workflow-facing pointer to a domain object or
  scenario-local MVP record
- `context_snapshot`: frozen safe view created for a run or step
- `context_binding`: ledger dependency linking run/step/artifact/handoff to a
  context ref and snapshot
- `run_start_requirements`: pre-run or run-start inputs used to initialize a
  workflow
- `step_interventions`: in-run manual operations owned by Web/Admin workbenches

Chat can collect allowed context refs and run start requirements, but it is not
a step intervention surface and should not remind users to perform
interventions. Chat dashboard output is summary-only.

## Internal API Boundary

Internal APIs are allowed only for Web/Admin/operator workflows. They must:
- be declared in the manifest or equivalent TS contract
- be namespaced by scenario
- use canonical auth, evidence logging, expected versions, and outbox rules
- avoid consumption by chat, mobile, forum, RAG, notification, public links, and
  external clients
- avoid redefining run, approval, artifact, or handoff identity

## Handoff Boundary

Concrete workflows create requests and record receipts according to this
template. Downstream owners own reread, gate, transform, side effect, rollback,
and receipt semantics.

Handoff payloads are refs-only:
- source refs
- expected versions
- requested purpose
- client surface
- actor/workspace ids
- idempotency/correlation/trace ids
- safe metadata

Private body content does not cross the handoff boundary.

## Key Architectural Risk
The main risk is accidental second-system creation: a scenario or surface might
introduce private APIs, private status, private domain stores, or private handoff
semantics because it feels faster. The v0 matrix must make those shortcuts
visibly invalid.
