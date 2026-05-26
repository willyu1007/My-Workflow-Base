# Workflow scenario readiness proof

## Purpose
This document checks whether the workflow base can support multiple controlled
scenarios without leaking one scenario's semantics into product surfaces. It is
the M5 sanity check before treating the v0 contracts as implementation-ready.

The proof compares:
- an education-like seed scenario walkthrough used as the MVP validation case
- a non-education scenario sketch using the same base modules, API closure,
  event registry, handoff contract, and activation gates

## Readiness question
A new scenario is ready to plug in when it can add its own manifest, handlers,
adapters, presenters, policies, repositories, fixtures, and journey tests
without adding new chat, mobile, forum, RAG, notification, search/vector, PPR,
or external product APIs.

## Scenario A: education-like seed walkthrough
This walkthrough is an example, not a base dependency.

| Dimension | Example shape |
|---|---|
| `scenario_key` | `learning_review` |
| Capability | `work_item_review` |
| Entrypoint | `review_submission` |
| Canonical context refs | `participant_group`, `work_item`, `rubric_or_policy`, `submission_ref` |
| Run start requirements | select work item, attach or resolve context refs, choose review mode |
| Web in-run interventions | manual correction, override review result, request re-evaluation |
| Artifacts | `review_summary`, `feedback_report`, `evidence_notes` |
| Approvals | approve/reject report before release or handoff |
| Handoffs | `public_draft`, `indexing`, `notification` where policy allows |
| Journey harness | start -> resolve context -> generate artifact -> manual correction or approval -> handoff -> dashboard summary |

The scenario uses:
- `Scenario` canonical record and contract hash
- `DomainContextResolver` for context refs
- standard `WorkflowRuntimePort` for step execution
- standard `ChatWorkflowAdapter` for chat start requirements, strong
  confirmations, dashboard summary, and citation package
- `workflow.*` standard events plus scenario internal migration events only
  inside the scenario module
- handoff request/receipt records for publication, knowledge, and notification

It does not add product APIs such as education-specific chat, mobile, forum,
RAG, notification, or dashboard routes.

## Scenario B: non-education scenario sketch
This sketch intentionally avoids education terms to test the base boundary.

| Dimension | Example shape |
|---|---|
| `scenario_key` | `support_case_resolution` |
| Capability | `case_triage_and_response` |
| Entrypoint | `draft_response_plan` |
| Canonical context refs | `support_case`, `customer_account`, `policy_article`, `prior_resolution_ref` |
| Run start requirements | select support case, choose response goal, resolve policy refs |
| Web in-run interventions | adjust classification, edit response plan, override escalation decision |
| Artifacts | `case_summary`, `response_plan`, `risk_note` |
| Approvals | approve/reject response plan before external delivery |
| Handoffs | `indexing` for approved knowledge source, `notification` for operator alert, `external_delivery` when future policy allows |
| Journey harness | start -> resolve context -> classify case -> draft response plan -> approval -> notification handoff -> dashboard summary |

This scenario still uses the same product closure:

| Surface | Uses | No new API |
|---|---|---|
| Chat workflow control | `ChatWorkflowAdapter.recommend`, `submit_start_requirements`, `start_run`, `confirm_action` | No `support_chat_api` |
| Chat dashboard summary | `ChatWorkflowAdapter.get_dashboard_summary` | No scenario-specific reminders or step interventions |
| Chat citation | `get_citation_package` over accepted knowledge refs | No citation from private workflow artifacts |
| Mobile dashboard | dashboard cards plus canonical reread before actions | No support-case mobile command API |
| Web domain workbench | domain registry API and declared internal Web/Admin APIs | No workflow-owned canonical domain store |
| Web run workbench | run detail, artifact preview, action command, internal Web/Admin APIs | No direct handler calls |
| Forum/publication | handoff receipts from downstream owner | No workflow direct publish |
| RAG/knowledge | accepted indexing handoff and downstream policy | No direct vector/search writes |
| Notification | notification handoff and downstream owner APIs | No workflow-owned push payload body |
| Admin/operator | admin governance and evidence reads | No direct DB/projection mutation |
| Worker/runtime | `WorkflowRuntimePort` and registered handlers | No executable queue payload |

## What changes per scenario
Adding a new scenario may add:
- canonical `Scenario` record and published contract hash
- manifest or equivalent TS contract
- capability and entrypoint declarations
- domain context ref types and resolver keys
- step handlers and action handlers
- standard surface adapters and presenters
- policies for exposure, actions, handoffs, and admin governance
- scenario internal events for implementation and deterministic tests
- repository implementations behind approved interfaces
- journey harness fixtures

## What must not change per scenario
Adding a new scenario must not add:
- new chat, mobile, forum, RAG, notification, public-link, or external product
  APIs
- scenario-specific shared event names in product consumers
- private artifact bodies in outbox or handoff payloads
- direct workflow writes to projection, search, vector, notification, forum, or
  knowledge systems
- direct workflow ownership of cross-scenario canonical domain objects
- chat step interventions or intervention reminders
- dashboard knowledge-indexing buttons
- queue payloads that carry executable instructions

## Do-not-repeat checklist
Reject a scenario integration if it requires any of these shortcuts:
- shared consumers subscribe to `{scenario_key}.*` events
- a product route is named after a scenario instead of the standard workflow API
- mobile or chat reads scenario-private tables for durable decisions
- RAG/search/vector indexes a workflow artifact without accepted handoff and
  downstream policy
- notification payloads contain private body, protected subject data, object
  keys, or provider payloads
- Web/Admin internal APIs are consumed by chat, mobile, forum, RAG,
  notification, public links, or external clients
- the scenario registers handlers without a published contract hash
- projection review is skipped for new projected fields

## Readiness result
The base passes the M5 proof if both scenarios can be represented by:
- the same five base modules
- the same canonical identity chain
- the same standard API/adapter closure
- the same validator and registry loader rules
- the same handoff request/receipt contract
- the same standard workflow event registry and refs-only payload policy
- scenario-specific manifests, handlers, adapters, presenters, policies,
  repositories, and deterministic journey tests

Any requirement to edit shared product-surface APIs means the base has leaked
scenario semantics and M5 fails.
