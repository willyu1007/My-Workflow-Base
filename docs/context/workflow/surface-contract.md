# Workflow surface contract

## Purpose
This document is the base-template contract for how workflow facts are consumed,
edited, projected, cited, and handed off across product surfaces.

It is scenario-neutral. Education homework can be the first implementation, but
later controlled scenarios must use the same surface contract instead of
inventing one-off dashboard, chat, forum, or admin paths.

## Scope
In scope:
- workflow consumption surfaces
- scenario canonical ownership
- editable workflow objects and action ownership
- chat workflow control, dashboard summary, and citation boundaries
- mobile dashboard, web domain workbench, and web run workbench boundaries
- generic handoff contract for forum, RAG/indexing, notification, and delivery
- notification and push payload rules
- admin governance boundaries
- scenario-module onboarding checklist

Out of scope:
- user-editable workflow DAGs
- plugin marketplace behavior
- arbitrary workflow code execution
- provider routing strategy
- final UI visual styling
- scenario-only domain semantics

## Workflow object model
Workflow is exposed through stable object layers:

```txt
Scenario
  -> DomainCapability
  -> WorkflowDefinition
  -> WorkflowVersion
  -> WorkflowRun
  -> WorkflowStep
  -> WorkflowArtifact
  -> WorkflowApproval
  -> ActionAvailability
  -> HandoffContract
```

The platform owns the ledger shape. `Scenario` is canonical Postgres state, and
the manifest is the versioned declaration attached to that state. Scenario
modules own domain facts that sit beside the ledger, such as education
assignments or future scenario-specific records.

| Object | Canonical owner | Editable by | Notes |
|---|---|---|---|
| `Scenario` | Platform/API/Postgres | Admin or approved platform release | First-class scenario record with status, owner, allowed user classes, current manifest hash, policy version, and aggregate version. |
| `DomainCapability` | Platform/API/Postgres | Admin or seeded platform task | User-facing capability card and enablement unit. |
| `WorkflowDefinition` | Platform/API/Postgres | Admin or approved platform release | Internal template identity. Users do not edit it. |
| `WorkflowVersion` | Platform/API/Postgres | Admin or approved platform release | Immutable runtime contract. Runs bind to one version. |
| `WorkflowRun` | Command API/Postgres | User actions through commands; worker status transitions | Business run ledger, never queue-owned. |
| `WorkflowStep` | Worker plus Command API/Postgres | Worker claim/result; admin recovery commands | Step state is canonical in Postgres. |
| `WorkflowArtifact` | Command API/Postgres | Worker writes; user/admin may approve, suppress, hand off, or delete through commands | Raw private inputs are not artifacts unless explicitly modeled. |
| `WorkflowApproval` | Command API/Postgres | User/admin through confirmation commands | Approval state must not live only in UI or projection. |
| `ActionAvailability` | API presenter from Postgres policy/state | Not directly edited | UI renders these hints; Command API revalidates before write. |
| `HandoffContract` | Workflow API plus downstream owner | Source surface starts handoff by canonical refs; downstream owner writes receipt | Base defines request/receipt shape only. Public draft, indexing, notification, and delivery own their gates. |

Scenario domain facts are scenario-owned but must be referenced through stable
refs and versions when workflow runs use them:

```ts
type ScenarioDomainRef = {
  scenario_key: string;
  object_type: string;
  object_id: string;
  version: number;
};
```

The base distinguishes:
- `scenario_domain_facts`: long-lived facts shared by multiple workflows.
- `run_start_requirements`: refs and parameters needed to start one run.
- `step_interventions`: human correction, override, or manual work during a
  running workflow.

## Surface matrix
Every workflow consumer must declare a read source, editable objects, allowed
actions, forbidden data, and downstream handoff.

| Surface | Reads | Can edit or trigger | Must not do |
|---|---|---|---|
| Chat workflow control | API recommendation/read contracts plus Command API | Collect lightweight scenario facts, collect run start requirements, start workflow, and user-initiated approve/reject/confirm after strong confirmation | Perform step interventions, send intervention reminders, start workflow from a light hint, call internal APIs, write run state directly |
| Chat dashboard summary | Dashboard-safe summary DTOs | Open target links only | Mutate workflow facts, approve/reject from summary, remind about specific step interventions, expose private bodies |
| Chat citation | RAG/knowledge retrieval through accepted downstream refs and PBR | Cite eligible workflow-derived sources with trust labels and source refs | Cite from projection, treat workflow output as human fact, cite private artifacts, skip lifecycle/PBR checks |
| Web domain workbench | Scenario domain facts, schema/validation state, manifest-declared internal APIs | Create/update/validate/import/merge/archive scenario facts; manage sharing consent and run start requirements | Override running steps, bypass audit/permission/PBR, write projection directly, create private workflow identity |
| Web run workbench | API/Postgres strong reads; run/step/artifact/approval detail; target domain refs | Step interventions, manual review, override, retry, cancel, suppress, approve/reject/confirm, create allowed handoffs | Become workflow builder/admin studio, bypass Command API, expose raw provider or prompt payloads, export internal API contracts to other surfaces |
| Mobile dashboard | Display projection for cards; API/Postgres for confirmation reread | Open run, inspect safe previews, approve/reject/confirm/retry/cancel/create public-draft handoff where action availability allows | Mutate card state directly, queue offline durable actions, show L3/L4 private bodies, decide permission/PBR from projection, show direct knowledge-base indexing actions, request indexing handoff directly |
| Forum | Public draft and forum command APIs | Publish only after public-ready draft, routing, and user confirmation | Publish workflow artifacts directly, use safe preview as public body, bypass redaction/risk review |
| RAG/Knowledge | Knowledge/RAG API over eligible source refs | Index only artifacts marked eligible and passed through lifecycle/PBR/privacy gates; accept service-created indexing handoffs | Index raw submissions, private diagnosis, original uploads, prompt/provider payloads, or unreviewed private outputs; accept dashboard-triggered indexing commands |
| Notification/push | Downstream notification API plus workflow handoff refs | Accept workflow notification handoff and push minimal target metadata | Put bodies, student data, object keys, approval policy, PBR details, prompts, or provider data in payloads; treat workflow as notification store |
| Admin governance | API/Postgres strong reads and audited commands | Publish/deprecate versions, enable/disable capabilities, inspect exceptions, run dry-run rebuilds, adjust policy | Direct DB edits, edit user DAGs/prompts/toolchains, mutate projections as source of truth |
| Worker/runtime | Postgres claim/read/write plus outbox | Claim steps, write lifecycle, produce artifacts, emit events | Treat queue state as truth, carry raw private bodies in queue payloads, write downstream projections directly |

## Internal API boundary
Internal custom APIs are allowed for scenario-specific Web/Admin functions such
as heavy editors, diagnostics, migration previews, import tools, and advanced
detail panels.

Rules:
- Internal routes must be declared in the scenario manifest.
- Internal routes must be namespaced under the scenario.
- Internal routes must use the same auth, audit, idempotency, expected-version,
  and outbox rules as shared workflow commands.
- Chat, mobile dashboard, forum, RAG, notification, public links, and external
  clients must not call internal routes.
- Internal routes must not redefine run, step, approval, artifact, action, or
  handoff identity.
- If an internal route changes workflow facts, it must write canonical state and
  emit the same shared events a Workflow API command would emit.

## Chat contract
Chat interacts with workflow in three distinct modes.

### Workflow control mode
Chat may recommend, collect run start requirements, start a workflow, or execute
user-initiated approval/confirmation actions only through a strong interaction:
- show capability label, purpose, required inputs, cost/quota state if applicable
- collect or confirm parameters
- restate visibility, destination, reversibility, and expected outputs
- for approve/reject/confirm, restate target object, current version, impact,
  visibility, reversibility, and stale-state handling
- call Command API with idempotency and correlation metadata

Light hints such as suggestion chips may only escalate into this flow. They must
not start workflow execution.

Chat must not perform `step_interventions`; those belong to Web run workbench.

### Dashboard summary mode
Chat may summarize dashboard state through safe summary DTOs:
- counts by status
- safe scenario/capability labels
- high-level attention totals
- safe unavailable reasons
- links to dashboard or workbench targets

Chat dashboard summaries are not intervention reminders. They must not assign
the user's next action, expose private bodies, or write workflow facts.

### Citation mode
Chat may cite workflow output only after the artifact has entered an eligible
retrieval source path. The citation consumer must verify:
- artifact lifecycle is still valid
- source version is current enough for display
- permission and PBR allow the current purpose
- trust label and workflow authorship are visible
- deleted, withdrawn, hidden, expired, or blocked sources are rejected

## Artifact exposure levels
Workflow artifacts move through exposure levels. A surface may only render the
level explicitly allowed by the artifact policy and current authorization.

| Level | Meaning | Allowed consumers |
|---|---|---|
| L0 `metadata_only` | Type, status, count, unavailable reason, ids | Mobile, Web, Admin, notifications |
| L1 `safe_summary` | Safe title or short summary with no private body | Mobile, Web, chat dashboard summary, notification |
| L2 `safe_preview` | Content-backed generated preview marked preview-eligible | Mobile, Web, public-draft entry |
| L3 `strong_read_detail` | Authorized full detail from API/Postgres | Web domain workbench, Web run workbench, Admin exception view |
| L4 `not_previewable` | No UI body preview | All surfaces show unavailable state only |

Original uploads, raw submissions, raw OCR text, private diagnosis, student-level
feedback, prompt bodies, provider payloads, object keys, vectors, secrets, and
tokens are never L0-L2 payloads.

## Action model
UI surfaces display action availability, but commands own action decisions.

Action requests must include:
- target type and target id
- expected aggregate version when available
- action type
- reason code and optional reason text
- client surface
- trace id and correlation id
- idempotency key for writes

The Command API must reread canonical state and reject stale, forbidden, expired,
deleted, or purpose-denied actions. Projection hints and push payloads are not
authority.

Allowed shared action classes:
- `start_run`
- `approve`
- `reject`
- `confirm`
- `submit_start_requirements`
- `step_intervention`
- `retry`
- `request_manual_review`
- `cancel`
- `close`
- `suppress`
- `release`
- `create_handoff`

Scenario modules may define domain-specific commands, but they must map back to
the shared action class where a product surface renders them.

## Public draft and forum boundary
Workflow artifacts enter forum only through public-ready draft.

The workflow base does not implement the public draft module. It creates a
handoff request with canonical refs only:
- source refs such as `workflow_artifact_id`, `workflow_run_id`, and expected
  versions
- `handoff_type=public_draft`
- requested purpose and client surface
- trace/correlation/idempotency ids

The handoff must not send raw artifact body, private inputs, student names, raw
answers, OCR text, feedback or diagnosis body, file URL/object key, prompt or
provider data, routing choices, or pre-redacted public text.

The public draft module owns reread, PBR, redaction, privacy checks, risk
marking, generation records, audit/outbox, user confirmation, routing, forum
publication, and handoff receipt.

## RAG and indexing boundary
Workflow artifacts are not retrievable by default.

The workflow base creates `handoff_type=indexing` requests only from server-side
policy, worker lifecycle, or admin/governance paths. Dashboards must not expose
indexing as a direct knowledge-base workflow action. The indexing or knowledge
owner decides whether to accept the request. Acceptance requires:
- explicit artifact indexing eligibility
- content-backed source refs
- valid lifecycle status
- permission and PBR approval for the target purpose
- privacy and safety checks
- deletion and withdrawal invalidation path
- source version and provenance links

RAG must treat workflow output as workflow-authored source material, not human
experience. Trust labels must remain visible to chat and downstream consumers.

Products may expose a higher-level consent or setting such as
`allow_anonymized_learning`, `contribute_to_shared_knowledge`, or
`data_sharing_consent`. That setting is policy input, not an indexing command.

## Notification and projection boundary
Workflow projection and notification surfaces are display-only.

The workflow base may create notification handoff requests and bodyless events.
It does not own push rendering, delivery retries, device token policy, or final
notification storage.

Allowed projection fields:
- ids and versions
- run, step, approval, and artifact statuses
- safe labels and summaries
- timestamps
- attention reason codes
- action availability hints
- tombstone metadata

Forbidden projection and push fields:
- raw workflow input
- private/student/class details
- raw answers or OCR text
- original upload URLs or object keys
- prompt bodies
- provider request or response bodies
- feedback or diagnosis bodies
- permission/PBR decision detail
- approval policy internals
- audit internals
- private memory text
- vectors, secrets, or tokens

## Admin governance boundary
Admin governs workflow exposure and recovery. It does not become a workflow
builder in MVP.

Admin may:
- enable or disable capabilities
- publish, deprecate, or roll back workflow versions
- inspect run, projection, indexing, and notification exceptions through
  allowlisted metadata
- run dry-run-first rebuild or replay operations
- adjust policy and eligibility gates through audited commands

Admin must not:
- edit user workflow DAGs, prompts, toolchains, or provider configuration
- directly mutate projection, search, vector, or personalization stores as source
  of truth
- inspect private bodies by default
- bypass public-draft, PBR, privacy, safety, or audit gates

## Handoff contract
All downstream integrations use the same handoff shape. The base guarantees
source identity, expected versions, safe metadata, and idempotency. The
downstream owner guarantees acceptance policy, reread, side effects, and
receipt.

Handoff request:

```ts
type WorkflowHandoffRequest = {
  handoff_id: string;
  handoff_type:
    | "public_draft"
    | "indexing"
    | "notification"
    | "external_delivery"
    | string;
  source_refs: CanonicalRef[];
  expected_versions: Record<string, number>;
  requested_purpose: string;
  client_surface: string;
  actor_id: string;
  workspace_id: string;
  idempotency_key: string;
  correlation_id: string;
  trace_id?: string;
  metadata?: Record<string, unknown>;
};
```

Handoff receipt:

```ts
type WorkflowHandoffReceipt = {
  handoff_id: string;
  handoff_type: string;
  status: "accepted" | "rejected" | "duplicate" | "completed" | "failed";
  downstream_owner: string;
  downstream_refs: CanonicalRef[];
  reason_code?: string;
  safe_message?: string;
  received_at: string;
};
```

Handoff payloads must never include private body content. Downstream refs are
opaque to workflow surfaces unless a downstream presenter explicitly exposes a
safe view.

## Scenario module onboarding checklist
A new scenario may be added only after it defines these contracts:

- scenario key, owner, launch phase, and allowed user classes
- canonical `Scenario` record fields, status transitions, and manifest publish
  process
- YAML manifest version and published manifest hash
- TS handler/action/presenter/policy registry keys
- capability manifest with user-facing labels and enablement policy
- workflow entrypoint manifest with immutable version metadata
- input and output schemas with version numbers
- domain facts and repository interfaces
- Command API actions and expected version gates
- worker step handlers and idempotency strategy
- artifact types, exposure levels, and handoff eligibility
- action availability presenter
- mobile dashboard mapping
- web domain workbench and web run workbench mapping
- chat workflow control, dashboard summary, and citation behavior
- notification and push event types
- internal Web/Admin APIs, if any
- admin governance and rollback controls
- outbox event names and no-body payload policy
- projection review note if schema/projection changes are needed
- deterministic tests and at least one end-to-end journey harness

## Non-negotiable rules
- Postgres is canonical. Realtime stores are projection or transient state only.
- Scenario is canonical state. A manifest can declare a scenario but cannot
  activate one without a matching published `Scenario` record.
- All durable writes go through Command API/Postgres plus outbox.
- Permission, audit, billing, PBR, publication, and indexing decisions must read
  Postgres canonical state.
- Queue payloads, outbox payloads, projection rows, notification rows, and push
  payloads must not become hidden content stores.
- Workflow output must be labeled as workflow-authored and must never
  masquerade as human experience.
- Public exposure, retrieval, indexing, notification, and external delivery
  require downstream handoff acceptance and receipt.
