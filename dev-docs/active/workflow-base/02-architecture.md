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

## X0 vNext Compatibility Boundary

X0 extends the template contract for host-owned atomic handoff materialization.
It does not make this repository a runtime and does not give a scenario module
permission to create Handoff Ledger or standard `workflow.handoff.*` outbox
records directly.

Compatibility rules:

- Legacy handoff declarations remain valid and keep their existing lifecycle.
- An explicit optional `materialization_mode` is the vNext discriminator. The
  validator must not infer vNext behavior from a legacy handoff type or owner.
- Host capability evidence is optional in the snapshot type and defaults to an
  empty/disabled capability set for legacy hosts.
- The vNext completion branch requires the claim token and expected version and
  accepts typed handoff drafts. The legacy completion branch remains valid.
- `WorkflowRuntimePort` retains its legacy completion signature. The additive
  `WorkflowRuntimePortMaterializationV1` replaces only `complete_step` with
  correlated overloads so a v1 input yields a v1 result without weakening
  legacy implementers or callers with an uncorrelated union.
- The new Handoff lifecycle status is versioned separately from the existing
  `WorkflowHandoffResult` status union.
- Contract/hash validation occurs before host persistence. Base defines the
  rule and fixture; the host owns transaction, replay, ledger, and outbox.

X0-C validator behavior:

- no handoff declaration produces no migration finding
- a legacy declaration without `materialization_mode` emits warning-only
  `WF-MAN-043`; warnings do not block registry loading
- vNext missing-key/source/capability defects are fatal `WF-MAN-044`–`046`
- host capability absence/empty state produces one host-level finding rather
  than one duplicate finding per vNext declaration
- declared non-empty keys must be unique across legacy migration and vNext
  declarations (`WF-MAN-047`) so pinned-contract lookup cannot be ambiguous
- explicit unknown or null materialization modes fail closed through
  `WF-MAN-048`; only an omitted mode is treated as legacy
- existing `WF-MAN-040`–`042` outputs remain stable

The source repository verifies these rules through copyable packages and
scenario fixtures. It must not rely on My-Chat's workspace to supply TypeScript,
Vitest, aliases, or missing tsconfig files.

## X0 Trusted Driver Boundary

`ScenarioCommandDriverContext` is a trusted service-call contract. The driver
ref and pinned binding identify provenance; `claimToken` and expected Step
version are transient concurrency evidence.

The claim token:

- is required only on the vNext trusted runtime branch
- is never part of semantic command hashing
- is not stored in scenario snapshots or Handoff drafts
- is not returned by presenters or user-facing replay
- is not logged, traced, or emitted in metrics/event payloads

Base conformance can enforce type placement and fixture behavior. My-Chat X2/X3
must enforce lease, claim, replay, transaction, and persistence behavior.

My-Chat X1 injects the host-owned `WorkflowRuntimePortMaterializationV1`
directly into its worker. The scenario registry remains legacy-compatible and
is not used as an unsafe type-narrowing authority for host capability. A compile
fixture proves the driver evidence and handler drafts can reach the injected v1
port without `as WorkflowRuntimePortMaterializationV1`.

## X0-D Source Adoption Hash Boundary

The cross-repo adoption hash identifies copied contract and validator source;
it is not a business/runtime identity.

Logical hash roots:

- `workflow-contracts`: all non-test TypeScript under the contract package
  source root
- `workflow-validator`: all non-test TypeScript under the validator source root

The hash is deterministic across repo locations. It normalizes UTF-8 BOM and
line endings, maps only `@host/workflow-contracts` and
`@my-chat/workflow-contracts` in supported module-import positions to a logical
alias inside validator sources, then hashes sorted logical path + byte length +
normalized bytes with NUL delimiters. Everything else, including other package
scopes, comments, and validator behavior, remains source-sensitive.

This deliberately separates three identities:

| Identity | Authority | Purpose |
| --- | --- | --- |
| Base Git revision | Git commit | Locate the last contract-bearing source revision. |
| Adoption source hash | X0-D source lock | Prove Base/My-Chat contract and validator source parity despite physical path/package alias differences. |
| Runtime `contract_hash` | Host validator over manifest/registries | Pin one registered scenario module at runtime. |

Changing docs, tests, package-manager files, or the hash tool does not change the
adoption source hash. Changing contract or validator non-test source does and
requires an intentional new lock/revision.

## N1 ecosystem adoption boundary

Base is the normative owner of cross-repository conventions but remains a
non-runtime repository. N1 locks three distinct distribution lanes:

| Artifact | Lane |
|---|---|
| Base host contracts and validator | Copy plus logical source hash; My-Chat only |
| Base UI kits | Published npm semver |
| My-Chat contracts used by scenarios | Exact sibling checkout plus revision/hash pin and CI verifier |

The consumer checker is advisory in Base and opt-in strict in consumers. It
detects unsupported scenario forks, Base local-source dependencies, unverified
My-Chat local contract dependencies, and direct sibling-source imports. It does
not mutate consumer repositories or infer that an allocated target port is
already implemented.

The implemented validator inventory is mechanically tied to
`validate-module.ts`; the documented `WorkflowScenarioModule` block is tied to
the exported source type. Loader behavior has no separate stable finding-id
family until code emits one. Scenario templates use one package-root layout:
`packages/<scenario-key>-scenario/`.

## Key Architectural Risk
The main risk is accidental second-system creation: a scenario or surface might
introduce private APIs, private status, private domain stores, or private handoff
semantics because it feels faster. The v0 matrix must make those shortcuts
visibly invalid.
