# Scenario module template

Use this template when adding a controlled concrete workflow based on the
workflow base contracts. The base repository is not a runtime dependency.

## Required contract fields

The default artifact is `scenario.manifest.yaml`. A concrete workflow may use an
equivalent TypeScript contract constant if it preserves the same fields.

- `manifest_version`
- `scenario_key`
- `scenario_record`
- `owner`
- `launch_phase`
- `allowed_user_classes`
- `capabilities`
- `scenario_data`
- `artifact_policy`
- `action_availability`
- `handoffs`
- `surface_mapping`
- `internal_api`
- `event_registry`
- `governance`
- `verification`

## Required checks

- Domain context refs declare a resolver key. Canonical domain objects are owned
  by the host platform/domain registry, not by workflow.
- The canonical `Scenario` record exists before activation.
- The published contract hash/version is stored on the `Scenario` record.
- YAML manifest or TS contract handler/action/adapter/presenter/policy keys
  match the TS registries.
- Business layers do not import Prisma directly.
- Durable writes use the concrete workflow Command API, Postgres transaction,
  and outbox.
- High-risk writes append minimal evidence records, but the scenario does not
  need an audit UI, review queue, or reporting workflow for MVP activation.
- Outbox payloads are ref-only downstream signals; downstream owners reread
  canonical state before projection, publication, indexing, notification,
  search/vector, PPR, or replay side effects.
- Shared product consumers depend on platform events and standard `workflow.*`
  events only; scenario internal events are declared implementation details.
- Standard workflow events use refs-only payloads with `signal_version=1`,
  `body=no_body`, `pii=no_pii`, and deterministic idempotency keys.
- Event producers and consumers are declared so shared consumers cannot depend
  on scenario internal events.
- Worker payloads contain ids, versions, trace/correlation metadata, and retry
  hints only.
- Artifact exposure levels are explicitly declared.
- Handoff payloads contain canonical refs and metadata only.
- Public/forum/RAG/indexing/notification/external delivery behavior is owned by
  downstream modules after handoff acceptance.
- Mobile dashboard uses display projection plus canonical reread before writes.
- Web workbenches use Domain registry API, concrete Workflow API/adapter, and
  API/Postgres strong reads through the proper owner.
- Internal Web/Admin APIs, if any, are contract-declared and not consumed by
  chat/mobile/forum/RAG/notification.
- Chat workflow control, dashboard summary, and citation modes are separately
  defined.
- Chat does not perform `step_interventions`; Web run workbench owns manual
  in-run correction and override.
- Admin can govern publication, policy, exceptions, and rebuilds without becoming
  a user workflow builder.
- Deterministic tests and one end-to-end journey harness exist before activation.

## Validation gates

The host project should run a manifest validator in CI, module registration, or
an admin dry-run command before enabling a scenario beyond local development.
The validator should return rule ids, severity, manifest path, owner, and
remediation.

Minimum fatal checks:
- `scenario_key` matches a canonical `Scenario` record.
- Contract hash/version is stored before pilot or GA activation.
- Step handlers, action handlers, adapters, presenters, policies, internal API
  handlers, and tests match the manifest declarations.
- Internal APIs are Web/Admin-only.
- Chat does not declare or consume `step_interventions`.
- Handoffs declare downstream owner, policy key, and receipt requirement.
- `event_registry.producers` and `event_registry.consumers` do not route shared
  consumers to scenario internal events.
- Standard event payload policy is refs-only and uses deterministic idempotency.
- P0/P1 authoritative writes have evidence record declarations.
- Projection field changes have a projection review record.

Migration bridges may warn during pilot only when they are timeboxed and not
presented as shared product-surface contracts.

## Registry loader expectations

The host product owns the registry loader. The base template defines the
expected behavior:
- load approved modules at deploy or application boot, not from user input or
  per-request dynamic code
- run validation before registration and fail fast on fatal findings
- keep YAML or TS contracts declarative; executable bindings come from
  TypeScript registries
- register a descriptor containing scenario identity, contract hash,
  capabilities, handlers, actions, adapters, presenters, policies, handoffs,
  event registry, and validation report
- resolve worker handlers from canonical run identity plus stored contract hash
- expose only standard adapters/presenters to shared product surfaces
- mount internal APIs only for declared Web/Admin surfaces
- keep disabled modules available only for replay, rollback, or controlled
  migration

## Standard API closure

Each concrete scenario must fit the host product's standard workflow API or
adapter closure:
- discovery: scenario and capability list/detail
- start requirements: pre-run requirement read, preview, and start run
- run lifecycle: start, detail, and timeline
- action command: approve, reject, retry, cancel, suppress, confirm, and create
  declared handoff with expected versions
- artifact preview: list and preview by exposure level
- handoff: request and receipt ledger operations
- dashboard: safe cards, summaries, and target links
- chat citation: eligible citation package only
- admin governance: validate, publish, enable/disable, rebuild, and evidence
- worker runtime: claim, complete, and fail steps from canonical identity

Scenario-specific APIs may exist only as declared Web/Admin internal APIs. They
cannot become new chat, mobile, forum, RAG, notification, public-link, external
client, or worker-dispatch contracts.

## Required runtime files

A concrete scenario should provide these module files in the host project:

```txt
scenario.manifest.yaml
src/<scenario>/module.ts
src/<scenario>/repositories.ts
src/<scenario>/registry.ts
src/<scenario>/handlers/*.ts
src/<scenario>/actions/*.ts
src/<scenario>/adapters/*.ts
src/<scenario>/presenters.ts
src/<scenario>/policies.ts
src/<scenario>/tests/<scenario>.journey.test.ts
```

The manifest or equivalent TS constant declares the public contract. `module.ts`
wires repositories, handlers, presenters, adapters, and policies into the
concrete workflow implementation.

Host runtime scaffolding is described in
`docs/context/workflow/implementation-skeleton.md`. Scenario modules should not
copy host registry loader, route, worker, outbox, or downstream owner code into
the scenario folder.

This template now includes lightweight TypeScript stubs under `src/` and
`tests/`. Copy them as a starting point, then rename the scenario key, package
imports, handlers, adapters, presenters, policies, and fixtures to the concrete
host project conventions.

## Minimal manifest skeleton

```yaml
manifest_version:
scenario_key:
scenario_record:
  display_name:
  required_status:
  owner_team:
  policy_version:
owner:
launch_phase:
allowed_user_classes: []

capabilities:
  - capability_key:
    label:
    description:
    enablement_policy:
    entrypoints: []

scenario_data:
  context_ref_types: []
  run_start_requirements: []
  step_interventions: []

artifact_policy:
  artifact_types: []
  exposure_levels:
    L0: []
    L1: []
    L2: []
    L3: []
    L4: []
  handoff_eligible:
    public_draft: []
    indexing: []

action_availability:
  shared_actions: []
  scenario_actions: []
  expected_version_required: true

handoffs:
  - handoff_type:
    source_artifact_types: []
    requested_purposes: []
    downstream_owner:
    policy_key:
    receipt_required: true

surface_mapping:
  chat_workflow_control:
  chat_dashboard_summary:
  chat_citation:
  web_domain_workbench:
  web_run_workbench:
  mobile_dashboard:
  forum_publication:
  rag_knowledge:
  notification_push:
  admin_operator:

internal_api:
  routes: []

event_registry:
  standard_workflow_events: []
  scenario_internal_events: []
  event_payload_policy:
    signal_version: 1
    body: no_body
    pii: no_pii
    status_in_payload: false
    presenter_output_in_payload: false
    idempotency_key: "{event_type}:{aggregate_id}:{aggregate_version}"
  producers: {}
  consumers: {}

governance:
  admin_actions: []
  rollback:
  projection_review_required:
  evidence_records: []
  outbox_events: []

verification:
  deterministic_tests: []
  journey_harness:
```
