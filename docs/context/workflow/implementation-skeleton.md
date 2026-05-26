# Workflow implementation skeleton

## Purpose
This document defines the implementation skeleton a host product can use when it
adopts the workflow base. It is a scaffold contract, not a runtime
implementation. Exact paths may vary by host repository, but ownership,
interfaces, gates, and generated shapes should remain stable.

## Ownership split

| Layer | Owns | Does not own |
|---|---|---|
| Base template | Contract types, manifest shape, validator rule ids, standard API/adapter closure, event and handoff contracts, scenario template, journey harness shape | Host database, HTTP routing, workers, dependency injection, deployments, downstream systems |
| Host workflow runtime | Repository implementations, registry loader, validation command, API routes, worker runtime port, outbox/evidence/handoff services, CI/admin gates | Scenario business logic, downstream side effects, canonical domain object mutation outside owner APIs |
| Scenario module | Manifest or equivalent TS contract, handlers, actions, adapters, presenters, policies, deterministic tests, journey fixtures | New product-surface APIs, direct projection/search/vector/notification writes, direct canonical domain table ownership |
| Downstream owners | Public draft/forum, RAG/knowledge, notification, search/vector, PPR, replay side effects and receipts | Workflow private state, raw private artifact body transport through outbox |

## Host package layout

This is a recommended host layout. A monorepo may split it into packages; a
smaller repo may keep it under one app.

```txt
packages/workflow-contracts/
  src/index.ts
  src/types/
    identity.ts
    manifest.ts
    api.ts
    module.ts
    events.ts
    handoff.ts
    validation.ts

packages/workflow-runtime/
  src/registry/
    loader.ts
    descriptor.ts
    resolve-binding.ts
  src/validation/
    validate-module.ts
    rules/
      identity.ts
      registries.ts
      internal-api.ts
      domain-context.ts
      handoff.ts
      events.ts
      projection.ts
      journey.ts
  src/repositories/
    workflow-ledger.repository.ts
    handoff-ledger.repository.ts
    evidence.repository.ts
  src/services/
    workflow-command.service.ts
    workflow-query.service.ts
    handoff.service.ts
    evidence.service.ts
  src/adapters/
    chat-workflow.adapter.ts
    web-run-workbench.adapter.ts
    mobile-dashboard.adapter.ts
    admin-workflow.adapter.ts
    worker-runtime.port.ts
  src/http/
    workflow.routes.ts
    workflow-admin.routes.ts
    workflow-internal.routes.ts
  src/workers/
    workflow-worker.ts
    outbox-dispatcher.ts

scenarios/<scenario_key>/
  scenario.manifest.yaml
  module.ts
  registry.ts
  handlers/
  actions/
  adapters/
  presenters.ts
  policies.ts
  tests/
    <scenario_key>.journey.test.ts
    fixtures/
```

The base template may provide example files, but the host product owns concrete
runtime code and persistence.

## Contract package exports

The contract package should be importable by both host runtime and scenario
modules. It should contain types only, plus pure validation helpers when useful.

```ts
export type {
  ScenarioManifest,
  WorkflowScenarioModule,
  WorkflowSurfaceAdapters,
  WorkflowHandlerRegistry,
  WorkflowActionRegistry,
  WorkflowPresenters,
  WorkflowPolicies,
  EventRegistryManifest,
  WorkflowModuleValidationReport,
  RegisteredWorkflowScenario,
  WorkflowRuntimePort,
  WorkflowCommandMeta,
  WorkflowCommandResponse,
  WorkflowSignalPayload,
};
```

Contracts must not import host database clients, queue clients, provider SDKs,
or downstream modules.

## Validator scaffold

Validator input:
- scenario manifest or equivalent TS contract
- scenario module registries
- host snapshots for canonical `Scenario`, domain resolvers, downstream owners,
  standard events, platform events, allowed surfaces, and projection reviews

Validator flow:

```txt
parse manifest or TS contract
  -> normalize fields
  -> compute contract_hash
  -> resolve host snapshots
  -> run WF-MAN-* rules
  -> produce WorkflowModuleValidationReport
  -> block pilot/GA on fatal findings
```

Validator rules must be deterministic and side-effect free. They may read host
snapshots but must not write canonical workflow state.

## Registry loader scaffold

Loader input:
- approved `WorkflowScenarioModule[]`
- validation report for each module
- canonical scenario/version snapshot
- host dependency container

Loader flow:

```txt
for each module
  -> verify validation report passes target activation phase
  -> verify contract_hash against canonical scenario/version record
  -> build RegisteredWorkflowScenario
  -> freeze descriptor
  -> index by scenario_key, capability_key, entrypoint_key, step_key, handler_key
publish read-only registry
```

The registry is read-only after boot. Activation changes happen through
canonical scenario/version records and deployment, not mutable in-memory edits.

Runtime resolution uses:

```txt
scenario_key
capability_key
entrypoint_key
workflow_version_id
step_key
handler_key
contract_hash
```

If a binding cannot be resolved, worker dispatch and surface routing fail fast
with a standard workflow error and do not fall back to scenario-private code.

## API route scaffold

Host HTTP/RPC routes should be scenario-neutral:

```txt
GET  /api/workflow/scenarios
GET  /api/workflow/scenarios/{scenario_key}
GET  /api/workflow/capabilities
GET  /api/workflow/capabilities/{capability_key}
GET  /api/workflow/start-requirements
POST /api/workflow/runs
GET  /api/workflow/runs/{run_id}
GET  /api/workflow/runs/{run_id}/timeline
POST /api/workflow/actions
GET  /api/workflow/runs/{run_id}/artifacts
GET  /api/workflow/artifacts/{artifact_id}/preview
POST /api/workflow/handoffs
POST /api/internal/workflow/handoffs/{handoff_id}/receipts
GET  /api/workflow/dashboard/cards
GET  /api/workflow/dashboard/runs/{run_id}
POST /api/workflow/chat/control
GET  /api/workflow/chat/dashboard-summary
GET  /api/admin/workflow/*
POST /api/admin/workflow/*
```

Scenario-specific internal routes are mounted under a separate internal
namespace and only for declared Web/Admin owner surfaces.

## Handoff service skeleton

The host handoff service owns request and receipt records. It does not execute
downstream side effects.

```ts
type WorkflowHandoffService = {
  request(input: HandoffRequestInput): Promise<WorkflowHandoffResult>;
  record_receipt(input: HandoffReceiptInput): Promise<WorkflowHandoffResult>;
  invalidate(input: HandoffInvalidationInput): Promise<WorkflowHandoffResult>;
};
```

Rules:
- request payload contains source refs, expected versions, requested purpose,
  handoff type, actor/workspace, trace, and idempotency metadata
- downstream owner rereads canonical sources before side effects
- receipt payload contains downstream refs and safe reason codes only
- public draft, RAG/knowledge, notification, search/vector, and PPR remain
  downstream-owned

## Worker runtime skeleton

Worker payloads carry ids and versions only:

```txt
workspace_id
run_id
step_id
expected_step_version
scenario_key
capability_key
entrypoint_key
workflow_version_id
contract_hash
trace_id
correlation_id
```

Worker flow:

```txt
claim step through WorkflowRuntimePort
  -> resolve handler from registered descriptor
  -> strong-read run/step/context/artifact refs
  -> execute handler with controlled dependencies
  -> complete/fail step through WorkflowRuntimePort
  -> write canonical state + outbox in the owner transaction
```

The queue is never the source of business truth.

## Journey harness skeleton

Every scenario needs at least one deterministic journey harness before pilot:

```txt
validate module contract
  -> register module in test registry
  -> seed canonical Scenario and domain context refs
  -> read start requirements
  -> start run
  -> claim step
  -> complete step with artifact refs
  -> read artifact preview through exposure policy
  -> execute one action with expected version
  -> request one allowed handoff
  -> record downstream receipt fixture
  -> read dashboard summary/card
  -> verify outbox events are refs-only
  -> replay idempotent command
```

Harnesses should use fixtures for model/provider outputs. They should not call
live LLMs, external notification providers, external vector stores, or public
forum services.

## Scaffold acceptance

A host implementation skeleton is acceptable when:
- contract types can be imported by scenario modules without runtime deps
- validator emits `WorkflowModuleValidationReport`
- registry loader produces immutable `RegisteredWorkflowScenario` descriptors
- standard API/adapter closure can route every shared surface
- worker runtime resolves handlers from canonical identity and contract hash
- handoff service writes request/receipt records only
- deterministic journey harness passes for the example scenario
