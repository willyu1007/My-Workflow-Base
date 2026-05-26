# Workflow v0 convergence

## Purpose
This document freezes the current base-template direction before implementation
details spread across scenario modules.

The goal is a controlled plug-in foundation: a new scenario can be developed as
a module, validated against the same ledger/API/handoff contracts, and connected
without redefining product surfaces.

## Decisions

### 1. Scenario is a first-class database object
`Scenario` is canonical state, not just a folder name or manifest key.

Minimum canonical fields:
- `scenario_id`
- `scenario_key`
- `display_name`
- `status`: `draft`, `pilot`, `active`, `disabled`, `archived`
- `owner_team`
- `launch_phase`
- `allowed_user_classes`
- `current_manifest_version`
- `current_manifest_hash`
- `policy_version`
- `aggregate_version`
- `metadata_json`
- `created_at`, `updated_at`, `published_at`, `archived_at`

The YAML manifest declares expected module shape. Publishing a manifest validates
it against the existing `Scenario` record, computes a hash, and stores the
accepted version in canonical state. Runtime APIs reject unknown, disabled, or
manifest-mismatched scenarios.

### 2. Internal APIs are allowed, but product consumption stays unified
Scenario modules may expose internal custom APIs for Web/Admin operations such
as heavy editors, diagnostics, import tools, migration previews, and advanced
detail panels.

Internal API rules:
- namespace under `/api/internal/scenarios/{scenario_key}/...` or an equivalent
  host-only route group
- declare every route in the scenario manifest
- allow only Web/Admin/operator clients
- use canonical authorization, audit, idempotency, and outbox rules
- never become the API consumed by chat, mobile dashboard, forum, RAG,
  notification, public links, or external clients
- never redefine workflow run, step, approval, artifact, or handoff identity

Shared product surfaces use `/api/workflow/*`.

### 3. YAML manifest plus TS handler registry
YAML is the declarative module contract. TypeScript is the executable binding.

The host loads:
- `scenario.manifest.yaml`
- `handlerRegistry`
- `actionRegistry`
- `presenters`
- `policies`
- `repositories`

Activation fails if a manifest handler key has no TS binding, if a TS binding is
not declared by the manifest, or if registry capabilities do not match the
published manifest hash.

### 4. The base defines handoff contract only
The base does not implement forum publishing, RAG indexing, knowledge curation,
notification dispatch, or external delivery. It defines how workflow creates a
handoff request and how a downstream owner records a receipt.

Workflow handoff is always by canonical refs:
- source refs: run, step, artifact, approval, scenario domain object
- expected versions
- handoff type and requested purpose
- client surface
- actor/workspace/trace/correlation/idempotency metadata

Downstream modules own reread, permission/PBR, redaction, privacy, safety,
delivery, indexing, publication, deletion, rollback, and final receipts.

## Reference From The-UniAssist-Entrance-App
The reference project is useful as a workflow-platform pattern, not as a module
to copy directly.

Reusable observations:
- `workflow-platform-api` is the authoritative control API.
- `workflow-runtime` owns the run/node/approval/artifact ledger.
- Postgres/Prisma is the authoritative data plane.
- projection adapters are optional read optimizations and must fall back to
  authoritative APIs.
- `apps/control-console` is an operator surface over the platform API.
- sample scenarios under `docs/scenarios/` are validation fixtures, not product
  vertical definitions.
- connector/runtime bridge integration writes back to the same run ledger and
  does not redefine run, approval, artifact, or callback identity.
- event-subscription handoff records receipts into runtime instead of creating a
  parallel workflow state machine.

Base-template consequences:
- validation scenarios are test fixtures; real scenarios are DB objects plus
  manifest-published modules
- external or internal capabilities are ledger extensions, not alternate
  workflow systems
- Web/Admin can be richer than other surfaces, but their writes still reconcile
  through canonical workflow facts
- projection, dashboard, chat, forum, RAG, notification, and downstream delivery
  must never become hidden sources of truth

## Module Acceptance Bar
A scenario is plug-in ready only when:

1. Its `Scenario` record exists and is enabled for the target workspace/user
   class.
2. Its YAML manifest validates and has a published hash.
3. Its TS registries bind every declared handler/action/presenter/policy key.
4. Its internal APIs, if any, are manifest-declared and Web/Admin-only.
5. Its workflow starts, steps, approvals, artifacts, actions, and handoffs use
   shared workflow identities.
6. Its handoff requests contain refs and metadata only, never private bodies.
7. Its deterministic journey harness proves `start -> step -> artifact ->
   surface -> handoff receipt` for at least one happy path.
