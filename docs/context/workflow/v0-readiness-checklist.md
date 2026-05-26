# Workflow v0 readiness checklist

## Purpose
This checklist records the semantic drift and readiness pass for the v0 workflow
base contracts. It verifies that the base remains scenario-neutral, template
owned, and safe for host implementation.

## Contract readiness

| Area | Status | Evidence |
|---|---|---|
| Base/runtime boundary | Pass | Base docs state the repository is a template/scaffold, not a runtime service. Host products own runtime code. |
| Scenario neutrality | Pass | Education appears only as seed/proof language; non-education readiness proof uses `support_case_resolution`. |
| Canonical identity | Pass | Scenario, capability, entrypoint, workflow version, run, step, artifact, approval, handoff, and contract hash are shared across APIs and loader rules. |
| Domain ownership | Pass | Canonical domain registry is host/platform-owned; workflow consumes `DomainContextRef`, resolver snapshots, and bindings. |
| Chat boundary | Pass | Chat can recommend, collect start requirements, start runs, confirm actions, summarize dashboard state, and cite eligible sources; it cannot perform step interventions or reminders. |
| Web/Admin boundary | Pass | Internal scenario APIs are manifest/TS-contract declared and Web/Admin-only. |
| Handoff boundary | Pass | Workflow creates request/receipt records only; downstream owners reread and own side effects. |
| Event registry | Pass | Shared consumers depend only on platform events and standard `workflow.*` events. Scenario internal events remain private or migration bridges. |
| Event payloads | Pass | Standard payloads are refs-only, bodyless, no PII, no canonical status, no presenter output, deterministic idempotency. |
| Downstream systems | Pass | Projection, forum/public draft, RAG/knowledge, notification, search/vector, PPR, and replay reread canonical owner state before side effects. |
| Audit/evidence scope | Pass | MVP uses minimal evidence records for high-risk authoritative writes, not a full audit product. |
| Validator gates | Pass for contract | `WF-MAN-*` rules define fatal checks; host implementation remains pending. |
| Registry loader | Pass for contract | `WF-LOAD-*` rules define fail-fast host-owned loading; host implementation remains pending. |
| Standard API closure | Pass | Discovery, start requirements, run lifecycle, action, artifact, handoff, dashboard, chat citation, admin, and worker runtime groups are defined. |
| Implementation skeleton | Pass for scaffold | Host package layout, validator, loader, routes, handoff service, worker runtime, and journey harness shape are defined. |
| Scenario readiness | Pass for proof | Education-like seed and non-education support-case scenarios use the same contracts without new shared product APIs. |

## Must-not-regress checks

Before implementation or later edits, reject changes that introduce:
- base repository runtime loading, deployment, or dependency injection ownership
- scenario-specific shared chat, mobile, forum, RAG, notification, public-link,
  external client, or worker-dispatch APIs
- shared product consumers subscribing to scenario internal event names
- `workflow.run.completed` or `workflow.run.failed` as separate shared events
- status fields, presenter output, raw bodies, vectors, object keys, signed URLs,
  or provider payloads in standard workflow event payloads
- direct workflow writes to projection, forum, knowledge, search, vector,
  notification, or PPR systems
- chat step interventions, intervention reminders, or dashboard knowledge-base
  indexing actions
- workflow ownership of cross-scenario canonical domain objects
- queue payloads that carry executable instructions
- validator or registry loader rules that require importing host database,
  queue, provider, or downstream SDKs into contract packages

## Implementation readiness

The contracts are ready to drive host implementation when:
- My-Chat or another host creates local contract/runtime packages from the
  skeleton rather than importing local paths from this repository
- the validator emits `WorkflowModuleValidationReport`
- the loader emits immutable `RegisteredWorkflowScenario` descriptors
- one deterministic journey harness passes for the seed scenario
- one non-education proof scenario can be planned without new shared product
  APIs

The base remains a contract/template repository even after these host
implementation steps exist elsewhere.
