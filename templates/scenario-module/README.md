# Scenario module template

Use this template when adding a controlled scenario on top of the workflow base.

## Required manifest fields

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
- `governance`
- `verification`

## Required checks

- Domain facts have repository interfaces and Postgres-backed implementations.
- The canonical `Scenario` record exists before activation.
- The published manifest hash/version is stored on the `Scenario` record.
- YAML manifest handler/action/presenter/policy keys match the TS registries.
- Business layers do not import Prisma directly.
- Durable writes use Command API, Postgres transaction, and outbox.
- Worker payloads contain ids, versions, trace/correlation metadata, and retry
  hints only.
- Artifact exposure levels are explicitly declared.
- Handoff payloads contain canonical refs and metadata only.
- Public/forum/RAG/indexing/notification/external delivery behavior is owned by
  downstream modules after handoff acceptance.
- Mobile dashboard uses display projection plus canonical reread before writes.
- Web workbenches use API/Postgres strong reads.
- Internal Web/Admin APIs, if any, are manifest-declared and not consumed by
  chat/mobile/forum/RAG/notification.
- Chat workflow control, dashboard summary, and citation modes are separately
  defined.
- Chat does not perform `step_interventions`; Web run workbench owns manual
  in-run correction and override.
- Admin can govern publication, policy, exceptions, and rebuilds without becoming
  a user workflow builder.
- Deterministic tests and one end-to-end journey harness exist before activation.

## Required runtime files

A concrete scenario should provide these module files in the host project:

```txt
scenario.manifest.yaml
src/<scenario>/module.ts
src/<scenario>/repositories.ts
src/<scenario>/registry.ts
src/<scenario>/handlers/*.ts
src/<scenario>/actions/*.ts
src/<scenario>/presenters.ts
src/<scenario>/policies.ts
src/<scenario>/tests/<scenario>.journey.test.ts
```

The manifest declares the public contract. `module.ts` wires repositories,
handlers, presenters, and policies into the workflow base.

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
  domain_fact_types: []
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

governance:
  admin_actions: []
  rollback:
  projection_review_required:
  outbox_events: []

verification:
  deterministic_tests: []
  journey_harness:
```
