# Workflow architecture matrix

## Purpose
This matrix aligns the workflow base modules with product consumption surfaces.
It is the v0 contract shape for modular scenario development.

The base should let new scenarios plug in through stable identities, state,
actions, presenters, shared scenario data refs, and handoffs. Product surfaces
can evolve independently only if they continue to consume the same contracts.

## Two-Layer Model

Layer 1 is the workflow base:

| Base module | Owns | Does not own |
|---|---|---|
| `Scenario registry` | `Scenario` canonical records, manifest publication, manifest hash, launch phase, enablement, TS registry validation | Scenario business semantics, product-specific UX, domain table implementation |
| `Workflow ledger` | `Capability`, `Entrypoint`, `WorkflowVersion`, `Run`, `Step`, `Artifact`, `Approval`, lifecycle state, canonical writes | UI rendering, downstream publication, RAG indexing, notification delivery |
| `Surface presenters` | Safe DTOs for chat, mobile, web, forum, RAG, notification, admin; exposure level downgrade; action hints | Durable writes, permission decisions from projection, downstream side effects |
| `Handoff ledger` | Handoff request/receipt identity, source refs, expected versions, idempotency, downstream owner status | Public draft generation, forum routing, indexing, knowledge curation, push delivery |
| `Governance gates` | Scenario/capability enablement, version publication, exposure policy, action policy, audit, rollback, PBR/permission hook points | User-editable DAGs, unrestricted plugin marketplace, direct downstream mutation |

Layer 2 is the product consumption surface:

| Surface | Primary job | Must use |
|---|---|---|
| `chat_workflow_control` | Collect lightweight scenario facts, collect run start requirements, start or user-drive workflow commands with strong confirmation | Scenario registry, Workflow ledger, Surface presenters, Action contract |
| `chat_dashboard_summary` | Summarize dashboard state at the user's request or in controlled chat context | Surface presenters, dashboard-safe projection/summary API |
| `chat_citation` | Cite eligible workflow-derived sources | Handoff ledger, Governance gates, RAG/knowledge downstream APIs |
| `web_domain_workbench` | Maintain long-lived scenario facts shared by multiple workflows | Scenario registry, scenario domain repositories, manifest-declared internal APIs |
| `web_run_workbench` | Handle in-run manual review and step interventions | Workflow ledger, scenario domain repositories, manifest-declared internal APIs |
| `mobile_dashboard` | Show attention cards, status, safe previews, and lightweight confirmations | Workflow ledger, Surface presenters, Action contract |
| `forum_publication` | Publish only accepted public-ready drafts | Handoff ledger, downstream public draft/forum owner |
| `rag_knowledge` | Retrieve/index only accepted eligible sources | Handoff ledger, downstream RAG/knowledge owner |
| `notification_push` | Deliver minimal lifecycle prompts | Handoff ledger, downstream notification owner |
| `admin_operator` | Govern scenarios, versions, recovery, policy, rebuilds | Scenario registry, Workflow ledger, Governance gates |
| `worker_runtime` | Execute steps and reconcile results into the ledger | Scenario registry, Workflow ledger, Handoff ledger, Governance gates |

## Scenario Data Contract

Scenario modules may own domain facts that multiple workflows share. The base
does not own those domain tables, but it defines how workflow refs, versions,
provenance, permissions, and handoffs attach to them.

| Data class | Meaning | Main surfaces | Example |
|---|---|---|---|
| `scenario_domain_facts` | Long-lived scenario data shared across workflows | `web_domain_workbench`, `admin_operator`, limited `chat_workflow_control` | classroom, student profile, assignment, grading rule, historical result |
| `run_start_requirements` | Parameters and refs needed to start one workflow run | `chat_workflow_control`, `web_domain_workbench`, `web_run_workbench` | selected class, selected assignment, deadline, grading mode |
| `step_interventions` | Human correction, override, or manual work during a running workflow | `web_run_workbench` | manual grading, OCR correction, student match correction, feedback edit |

Chat does not perform `step_interventions` and does not proactively remind users
about intervention tasks. Chat may summarize dashboard state. Users choose where
to operate next.

Cross-workflow data sharing happens through scenario domain facts and domain
events, not by reading another workflow's private run/step state.

```txt
scenario_domain_facts
  -> workflow A writes versioned domain refs
  -> domain event / outbox
  -> workflow B reads refs through repositories and policy gates
```

Minimum ref shape:

```ts
type ScenarioDomainRef = {
  scenario_key: string;
  object_type: string;
  object_id: string;
  version: number;
};
```

## Surface Contract Matrix

| Surface | reads | actions | handoffs | forbidden |
|---|---|---|---|---|
| `chat_workflow_control` | Enabled scenarios/capabilities, safe labels, input schema summaries, lightweight `scenario_domain_facts`, `run_start_requirements`, current action availability when the user explicitly asks to act | `start_run`, `submit_start_requirements`, lightweight domain fact create/update where manifest allows, user-initiated `approve` / `reject` / `confirm` with strong confirmation and canonical reread | None by default | No `step_interventions`; no proactive intervention reminders; no internal Web/Admin API calls; no light hint starts a run; no private artifact body; no action write without expected version and strong confirmation |
| `chat_dashboard_summary` | Dashboard-safe summary DTOs, counts, safe status labels, attention totals, high-level unavailable reasons | Open target links only; no durable workflow mutation | None | No approve/reject from summary itself; no intervention reminders; no private bodies; no projection-derived permission decisions; no detailed task assignment that steers the user's next action |
| `chat_citation` | Accepted downstream source refs, citation presenter output, source trust/provenance labels | Open cited source | Consumes `indexing` / knowledge accepted receipts | No citation from projection; no citation from private/unreviewed workflow artifacts; no treating workflow output as human fact; no skipped PBR/lifecycle/deletion checks |
| `web_domain_workbench` | Strong-read scenario domain facts, schema/validation state, manifest-declared input contracts, history/provenance where authorized | Create/update/validate/import/merge/archive scenario facts; manage sharing consent/policy inputs; prepare run start requirements | Usually none; may create refs later used by server-side handoff policy | No private workflow identity; no direct projection write; no bypass of permission/audit/PBR; no workflow step override unless routed to `web_run_workbench` |
| `web_run_workbench` | Strong-read run detail, step detail, artifacts, approvals, target `scenario_domain_facts`, intervention history | `step_intervention`, manual review, override, retry, cancel, suppress, approve/reject/confirm, create handoff where allowed | `public_draft`, `notification`, `external_delivery`; indexing is service-owned unless explicitly admin/policy driven | No undocumented internal API; no becoming user workflow builder; no prompt/tool/provider editing; no raw private data in projection/outbox/handoff; no hidden state outside ledger/domain facts |
| `mobile_dashboard` | Display projection cards, safe run summaries, L0-L2 artifact previews, action availability hints, downstream status labels | Lightweight confirmations such as approve/reject/confirm/retry/cancel/create public-draft handoff where available, always after canonical reread | `public_draft` only when action availability allows; notification is downstream-owned; indexing is service-owned | No durable projection mutation; no offline automatic replay; no L3/L4 bodies; no direct knowledge-base indexing action; no direct indexing handoff; no private body in cached state |
| `forum_publication` | Public draft downstream refs, source labels, provenance refs | Publish through forum/public draft owner after user confirmation | Consumes `public_draft` accepted/completed receipt | No direct workflow artifact publication; no safe preview as public body; no raw workflow artifact read for publication |
| `rag_knowledge` | Accepted indexing source refs, provenance refs, lifecycle/PBR state through downstream owner | Index, chunk, embed, promote, invalidate inside downstream owner | Consumes `indexing` accepted/completed receipts; may receive automatic server-created requests based on sharing consent and policy | No direct raw artifact indexing; no dashboard-triggered knowledge-base indexing action; no private artifacts; no stale/deleted/withdrawn source retention |
| `notification_push` | Notification handoff refs, safe labels, reason codes, target ids, timestamps | Delivery, read state, retry, device token handling inside downstream owner | Consumes `notification` request/receipt | No body/private data/prompt/provider payload; no workflow lifecycle mutation; no push payload as state authority |
| `admin_operator` | Strong scenario/capability/version/run/audit/handoff reads; policy and manifest state | Publish/disable/rollback/rebuild/replay by audited commands; inspect handoff failures by refs; manage service-level sharing policies | Inspect/replay handoffs by refs; admin-created handoff only when policy allows | No direct DB edits; no direct projection/downstream mutation; no private body access by default; no user DAG/prompt/toolchain editing |
| `worker_runtime` | Scenario manifest hash, run/step canonical state, input refs, scenario domain refs through repositories, policy decisions | Claim/write step lifecycle, produce artifacts, request approval, emit bodyless events, create automatic handoff requests where policy allows | Service-created `indexing` and `notification`; `public_draft` only when triggered by allowed user/product action; receipts are downstream-owned | No downstream direct writes; no raw body queue payload; no business state from BullMQ; no reading another workflow's private run state instead of shared domain facts |

## Shared Contracts

### Identity contract
Every surface uses the same ids:

```txt
scenario_key
capability_key
entrypoint_key
workflow_version_id
run_id
step_id
artifact_id
approval_id
handoff_id
scenario_domain_ref
```

Scenario modules may add domain object ids, but they must be linked through
canonical workflow refs. They must not redefine workflow identity.

### State contract
All surfaces consume the same state vocabulary:

- scenario status
- capability enablement
- run status
- step status
- artifact state and exposure level
- approval status
- action availability
- handoff request/receipt status
- scenario domain object version

Projection may cache display state, but confirmation and mutation paths must
reread canonical state.

### Action contract
UI renders `ActionAvailability`. Writes go through standard commands with:

- target type/id
- expected version
- action class
- reason code/text
- client surface
- actor/workspace ids
- idempotency/correlation/trace ids

Chat actions are allowed only when user-initiated and strongly confirmed. Chat
summary output is not an action surface.

Internal Web/Admin APIs are allowed only when manifest-declared and only if they
write canonical facts using the same action rules.

### Exposure contract
All presenters must obey L0-L4 exposure levels:

| Level | Meaning | Default surfaces |
|---|---|---|
| L0 | Metadata only | dashboard, notification, admin list |
| L1 | Safe summary | chat dashboard summary, dashboard, notification |
| L2 | Safe preview | mobile, web, public-draft entry |
| L3 | Strong-read detail | web workbench, authorized admin exception view |
| L4 | Not previewable | no body surface |

Raw private input, original file URLs/object keys, prompt bodies, provider
payloads, vectors, secrets, tokens, and private diagnosis/feedback bodies are
never L0-L2 payloads.

### Handoff contract
The workflow base creates handoff requests and records receipts. Downstream
owners implement the actual behavior.

| Handoff type | Downstream owner | Base sends | Downstream owns | Who may request |
|---|---|---|---|---|
| `public_draft` | public draft/forum module | source refs, expected versions, purpose, actor/workspace/trace metadata | reread, PBR, redaction, privacy, risk, user confirmation, forum publication | user/product action from mobile/web/chat control where action availability allows |
| `indexing` | RAG/knowledge module | source refs, expected versions, retrieval purpose, sharing policy refs | lifecycle, permission, PBR, chunking, embedding, invalidation, trust labels | service/worker policy based on sharing consent and artifact eligibility |
| `notification` | notification module | target refs, reason code, safe labels, timestamps | inbox/read state, push rendering, delivery retry, device tokens | service/worker lifecycle policy |
| `external_delivery` | product-specific downstream owner | source refs, destination refs, expected versions | destination authorization, delivery side effects, rollback, receipts | web/admin/product action where policy allows |

Handoff payloads must not include source body content.

### Sharing consent and knowledge policy
Dashboards must not present indexing as a direct knowledge-base action. Indexing is a
server-side policy decision.

Products may expose a higher-level consent or setting such as:

```txt
allow_anonymized_learning
contribute_to_shared_knowledge
data_sharing_consent
```

That setting is policy input, not an indexing command. The server still checks
artifact eligibility, lifecycle, privacy, PBR, deletion state, and downstream
acceptance before creating an `indexing` handoff.

### Presenter contract
Scenario modules supply presenters, but presenters emit stable surface DTOs.
Surfaces should not need to understand scenario-private domain facts.

Presenter outputs must include:
- source refs
- safe labels
- exposure level
- action availability where the surface can act
- unavailable reason codes
- provenance/trust labels where relevant
- no raw private bodies unless L3 is explicitly authorized

## Acceptance Rule
A scenario is plug-in ready only when the matrix can be filled without adding a
new product-surface API. If a scenario requires a new consumer path, the base
contract must be extended first, then the scenario can adopt it.
