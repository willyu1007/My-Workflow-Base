# Workflow API contract

## Purpose
This document defines the base API surface that every scenario module plugs into.
Scenarios may add domain-specific commands and internal Web/Admin APIs behind
this contract, but product consumption surfaces must call the shared workflow
APIs.

The examples use REST because the source product uses REST, but the same command
and response envelopes can be mapped to RPC if a host project chooses that.

## API principles
- API paths are scenario-neutral.
- `Scenario` is a first-class canonical object. Runtime APIs validate
  `scenario_key` against Postgres state and the published manifest hash.
- Command endpoints reread Postgres canonical state before writing.
- Reads may use projection for display lists, but confirmation and detail reads
  must use API/Postgres.
- Every write accepts idempotency, trace, and correlation metadata.
- Every write returns canonical refs, aggregate versions, action availability,
  and outbox ids when applicable.
- Scenario-specific payloads live under `input`, `settings`, or `domain`.
- Handoff APIs create request/receipt records only. Downstream owners implement
  public draft, forum, indexing, knowledge, notification, or delivery behavior.
- Internal scenario APIs are allowed only for manifest-declared Web/Admin
  functions and must not be consumed by chat, mobile, forum, RAG, notification,
  public links, or external clients.

## Standard headers

| Header | Required | Purpose |
|---|---:|---|
| `Authorization` | yes | User/session auth. |
| `X-Workspace-Id` | yes | Active workspace or tenant. |
| `X-Actor-Id` | yes for authenticated commands | Active human, agent, system, or workflow actor. |
| `X-Idempotency-Key` | yes for writes | Deduplicate command retries. |
| `X-Correlation-Id` | yes for writes | Tie user action to downstream events. |
| `X-Trace-Id` | recommended | Distributed tracing. |
| `X-Client-Surface` | recommended | `chat_workflow_control`, `chat_dashboard_summary`, `chat_citation`, `web_domain_workbench`, `web_run_workbench`, `mobile_dashboard`, `forum_publication`, `rag_knowledge`, `notification_push`, `admin_operator`, `worker_runtime`, or `api`. |

## Standard envelopes

### Command request metadata

```ts
type WorkflowCommandMeta = {
  workspace_id: string;
  actor_id?: string;
  idempotency_key: string;
  correlation_id: string;
  trace_id?: string;
  client_surface:
    | "chat_workflow_control"
    | "chat_dashboard_summary"
    | "chat_citation"
    | "web_domain_workbench"
    | "web_run_workbench"
    | "mobile_dashboard"
    | "forum_publication"
    | "rag_knowledge"
    | "notification_push"
    | "admin_operator"
    | "worker_runtime"
    | "api";
};
```

### Command response

```ts
type ScenarioRecord = {
  scenario_id: string;
  scenario_key: string;
  display_name: string;
  status: "draft" | "pilot" | "active" | "disabled" | "archived";
  owner_team: string;
  launch_phase: "dev" | "pilot" | "ga" | "disabled";
  allowed_user_classes: string[];
  current_manifest_version: number;
  current_manifest_hash: string;
  policy_version: number;
  aggregate_version: number;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  published_at?: string;
  archived_at?: string;
};

type WorkflowCommandResponse<T> = {
  ok: true;
  data: T;
  canonical_refs: CanonicalRef[];
  aggregate_versions: Record<string, number>;
  action_availability: WorkflowActionAvailability[];
  outbox_event_ids: string[];
};

type CanonicalRef = {
  kind:
    | "scenario"
    | "capability"
    | "workflow_definition"
    | "workflow_version"
    | "workflow_run"
    | "workflow_step"
    | "workflow_artifact"
    | "workflow_approval"
    | "workflow_handoff"
    | "downstream_object"
    | "scenario_domain_object";
  id: string;
  version?: number;
};

type WorkflowActionAvailability = {
  action: string;
  available: boolean;
  reason_code: string;
  target_type: string;
  target_id: string;
  expected_version?: number;
};

type WorkflowDashboardCard = {
  run_id: string;
  scenario_key: string;
  capability_key: string;
  entrypoint_key: string;
  title: string;
  status: string;
  progress_percent: number;
  current_step_label?: string;
  requires_attention: boolean;
  attention_reason?: string;
  action_availability: WorkflowActionAvailability[];
  artifact_summaries: Array<{
    artifact_id: string;
    artifact_type: string;
    exposure_level: "L0" | "L1" | "L2";
    safe_title?: string;
    safe_summary?: string;
  }>;
  aggregate_version: number;
  updated_at: string;
};
```

### Error response

```ts
type WorkflowErrorResponse = {
  ok: false;
  error: {
    code: string;
    message: string;
    retryable: boolean;
    reason_code?: string;
    target?: {
      type: string;
      id: string;
    };
    audit_hints?: Record<string, unknown>;
  };
};
```

Common error codes:

| Code | Meaning |
|---|---|
| `workflow_access_denied` | ACL or PBR denied. |
| `workflow_scenario_not_found` | Scenario key is unknown, archived, or disabled. |
| `workflow_capability_not_found` | Capability key is unknown or archived. |
| `workflow_capability_disabled` | Capability disabled for workspace/user. |
| `workflow_manifest_mismatch` | Request targets a manifest version/hash that is not currently published. |
| `workflow_version_not_found` | No active/published version for entrypoint. |
| `workflow_version_conflict` | Expected version differs from canonical state. |
| `workflow_action_unavailable` | Action availability changed or state is stale. |
| `workflow_artifact_not_previewable` | Requested preview level is not allowed. |
| `workflow_artifact_not_handoff_eligible` | Requested handoff type is not allowed for this artifact/state/purpose. |
| `workflow_handoff_rejected` | Downstream owner rejected the handoff request. |
| `workflow_internal_api_forbidden` | Internal scenario API cannot be called by this surface. |
| `workflow_input_invalid` | Input schema validation failed. |
| `workflow_rate_limited` | Quota or rate limit denied. |

## Scenario APIs

### List scenarios

```http
GET /api/workflow/scenarios?surface=chat_workflow_control&status=active
```

Response:

```ts
type ListScenariosResponse = {
  scenarios: Array<{
    scenario_key: string;
    display_name: string;
    status: ScenarioRecord["status"];
    launch_phase: ScenarioRecord["launch_phase"];
    enabled: boolean;
    unavailable_reason?: string;
    current_manifest_version: number;
  }>;
};
```

### Get scenario detail

```http
GET /api/workflow/scenarios/{scenario_key}
```

The response returns the canonical scenario record, enabled capabilities,
published manifest metadata, allowed user classes, surface availability, and
safe governance summary. It does not return raw manifest secrets, handler code,
private policy internals, or internal API implementation details.

### Publish scenario manifest

```http
POST /api/admin/workflow/scenarios/{scenario_key}/publish-manifest
```

Request:

```json
{
  "manifest_version": 3,
  "manifest_hash": "sha256:...",
  "dry_run": false,
  "change_summary": "Enable authoring entrypoint for pilot users"
}
```

Publishing validates the YAML manifest, TS registry bindings, internal API
allowlist, handoff declarations, capability mappings, and deterministic tests
before updating the canonical `Scenario` record.

## Capability APIs

### List capabilities

```http
GET /api/workflow/capabilities?scenario_key=education&surface=chat_workflow_control
```

Response:

```ts
type ListCapabilitiesResponse = {
  capabilities: Array<{
    scenario_key: string;
    capability_key: string;
    label: string;
    description?: string;
    enabled: boolean;
    entrypoints: Array<{
      entrypoint_key: string;
      label: string;
      input_schema_version: number;
      output_schema_version: number;
      supported_surfaces: string[];
    }>;
    unavailable_reason?: string;
  }>;
};
```

### Get capability detail

```http
GET /api/workflow/capabilities/{capability_key}?scenario_key=education
```

The detail response includes current version, entrypoints, input schema summary,
output/artifact policy, and safe surface mappings.

### Update capability settings

```http
POST /api/workflow/capabilities/{capability_key}/settings
```

Request:

```json
{
  "scenario_key": "education",
  "enabled": true,
  "settings": {
    "default_difficulty": "medium"
  }
}
```

Only admin or policy-authorized actors may call this endpoint.

## Run APIs

### Start run

```http
POST /api/workflow/runs
```

Request:

```json
{
  "scenario_key": "education",
  "capability_key": "homework",
  "entrypoint_key": "authoring",
  "expected_workflow_version": 1,
  "input_schema_version": 1,
  "input": {
    "classroom_id": "classroom_123",
    "title": "Unit practice",
    "student_profile_ids": ["student_1", "student_2"]
  },
  "client_surface": "chat_workflow_control"
}
```

Response:

```ts
type StartRunResponse = {
  run: WorkflowRunRef;
  dashboard_card?: WorkflowDashboardCard;
  next_actions: WorkflowActionAvailability[];
};

type WorkflowRunRef = {
  run_id: string;
  scenario_key: string;
  capability_key: string;
  entrypoint_key: string;
  workflow_version_id: string;
  status: "queued" | "running" | "waiting_approval" | "completed" | "failed" | "cancelled";
  aggregate_version: number;
};
```

### Get run detail

```http
GET /api/workflow/runs/{run_id}
```

Use this for strong reads before confirmation screens, web workbench, and
deep-link entry. The response includes run, steps, artifacts, approvals, action
availability, and scenario domain refs.

### List run timeline

```http
GET /api/workflow/runs/{run_id}/timeline
```

Timeline is display-safe. It may be rendered in mobile, web, or chat dashboard
surfaces.

## Action API

### Execute workflow action

```http
POST /api/workflow/actions
```

Request:

```json
{
  "action": "approve",
  "target_type": "workflow_approval",
  "target_id": "approval_123",
  "expected_version": 3,
  "reason_code": "user_confirmed",
  "reason_text": "Looks good",
  "client_surface": "mobile_dashboard"
}
```

Response:

```ts
type ExecuteActionResponse = {
  target: CanonicalRef;
  run?: WorkflowRunRef;
  affected_refs: CanonicalRef[];
  action_availability: WorkflowActionAvailability[];
};
```

Allowed shared actions are defined in `surface-contract.md`. Scenario-specific
actions must declare their mapping in the scenario manifest.

## Artifact APIs

### List artifacts for a run

```http
GET /api/workflow/runs/{run_id}/artifacts
```

The list returns artifact ids, types, status, exposure level, handoff eligibility
by type, and safe summary only.

### Get artifact preview

```http
GET /api/workflow/artifacts/{artifact_id}/preview?level=L2
```

The server may downgrade the requested level. L3 detail always requires a strong
read and authorization.

Response:

```ts
type WorkflowArtifactPreview = {
  artifact_id: string;
  run_id: string;
  artifact_type: string;
  status: string;
  exposure_level: "L0" | "L1" | "L2" | "L3" | "L4";
  safe_title?: string;
  safe_summary?: string;
  safe_preview?: string;
  unavailable_reason?: string;
  handoff_availability: Record<string, boolean>;
  aggregate_version: number;
};
```

## Handoff APIs

### Create handoff request

```http
POST /api/workflow/handoffs
```

Request:

```json
{
  "handoff_type": "public_draft",
  "source_refs": [
    {
      "kind": "workflow_artifact",
      "id": "artifact_123",
      "version": 4
    },
    {
      "kind": "workflow_run",
      "id": "run_123",
      "version": 8
    }
  ],
  "requested_purpose": "forum_publication",
  "client_surface": "mobile_dashboard",
  "expected_versions": {
    "workflow_artifact:artifact_123": 4,
    "workflow_run:run_123": 8
  },
  "metadata": {
    "reason_code": "user_requested_public_draft"
  }
}
```

Response:

```ts
type WorkflowHandoffResponse = {
  handoff: {
    handoff_id: string;
    handoff_type: string;
    status: "requested" | "accepted" | "rejected" | "duplicate";
    source_refs: CanonicalRef[];
    downstream_owner?: string;
    downstream_refs: CanonicalRef[];
    reason_code?: string;
    safe_message?: string;
    aggregate_version: number;
  };
  run?: WorkflowRunRef;
  action_availability: WorkflowActionAvailability[];
};
```

The response returns canonical source refs and downstream refs only. Public
draft, forum, RAG/indexing, knowledge, notification, and external delivery
modules reread canonical content and own their own gates, side effects, and
receipts.

### Record handoff receipt

```http
POST /api/internal/workflow/handoffs/{handoff_id}/receipts
```

This internal endpoint is for downstream owners. It records accepted, rejected,
duplicate, completed, or failed receipts against the workflow handoff ledger.
Receipts contain downstream refs and safe reason codes, not downstream private
bodies.

## Dashboard APIs

### List dashboard cards

```http
GET /api/workflow/dashboard/cards?status=attention&limit=30
```

This endpoint may read from display projection when available. It must not be
used for permission, approval, public draft, or indexing decisions. Dashboard
surfaces must not present indexing as a direct knowledge-base action.

### Get dashboard run detail

```http
GET /api/workflow/dashboard/runs/{run_id}
```

This returns display-safe detail plus action hints. Confirmation screens must
reread `/api/workflow/runs/{run_id}` or execute action with expected version.

## Chat APIs

### Recommend or control workflow from chat context

```http
POST /api/workflow/chat/control
```

Request:

```json
{
  "thread_id": "thread_123",
  "message_id": "message_456",
  "purpose": "workflow_execution",
  "max_results": 3
}
```

The response returns capability recommendations and required parameters. It does
not start a run unless the request is a strong-confirmed command with
idempotency and expected-version metadata.

### Get workflow dashboard summary for chat

```http
GET /api/workflow/chat/dashboard-summary
```

The response is display-only. It may summarize counts, statuses, safe labels,
and target links. It must not include private bodies, intervention reminders, or
durable action writes.

## Notification handoff

```http
POST /api/workflow/handoffs with handoff_type=notification
```

The workflow base does not own device tokens, push rendering, delivery retry, or
read/unread state. The notification owner records handoff receipts and exposes
its own notification APIs if the host product needs them. Workflow payloads
contain ids, safe labels, reason codes, timestamps, and refs only.

## Admin APIs

```http
GET /api/admin/workflow/scenarios
POST /api/admin/workflow/scenarios/{scenario_key}/publish-manifest
POST /api/admin/workflow/scenarios/{scenario_key}/enable
POST /api/admin/workflow/scenarios/{scenario_key}/disable
GET /api/admin/workflow/capabilities
POST /api/admin/workflow/capabilities/{capability_key}/publish-version
POST /api/admin/workflow/capabilities/{capability_key}/deprecate-version
POST /api/admin/workflow/capabilities/{capability_key}/enable
POST /api/admin/workflow/capabilities/{capability_key}/disable
GET /api/admin/workflow/runs/{run_id}/audit
POST /api/admin/workflow/rebuilds/dry-run
POST /api/admin/workflow/rebuilds/apply
```

Admin APIs must be audited and must not expose raw private bodies by default.

## Internal scenario API boundary

Scenario modules may expose host-only Web/Admin APIs:

```http
GET /api/internal/scenarios/{scenario_key}/...
POST /api/internal/scenarios/{scenario_key}/...
```

These routes must be declared in the scenario manifest:

```yaml
internal_api:
  routes:
    - method: POST
      path: /api/internal/scenarios/example/import-preview
      owner_surface: web_domain_workbench
      command_class: scenario_internal
      writes_workflow_facts: false
```

Internal APIs are not part of the shared product consumption contract. If they
change workflow facts, they must write the same canonical ledger and emit the
same outbox/formal events as a Workflow API command.

## Required call sequences

### Chat-triggered run

```txt
chat message
  -> POST /api/workflow/chat/control
  -> user selects capability
  -> UI collects parameters in strong interaction
  -> POST /api/workflow/runs
  -> response writes summary back to chat timeline
  -> run lifecycle updates dashboard/notifications through outbox
```

### Mobile approval

```txt
dashboard card
  -> user opens approval
  -> GET /api/workflow/runs/{run_id}
  -> POST /api/workflow/actions with expected_version
  -> API rereads canonical state
  -> writes approval/run/artifact facts + outbox
  -> dashboard projection updates eventually
```

### Public draft handoff

```txt
artifact preview L2
  -> POST /api/workflow/handoffs with handoff_type=public_draft
  -> public draft module rereads canonical refs
  -> privacy/PBR/redaction/risk checks
  -> user confirms draft
  -> downstream owner records handoff receipt
  -> forum routing/publication flow
```

### Indexing handoff

```txt
eligible artifact
  -> service/worker policy checks sharing consent + artifact eligibility
  -> POST /api/workflow/handoffs with handoff_type=indexing
  -> indexing owner rereads canonical refs
  -> lifecycle/PBR/privacy/provenance checks
  -> indexing owner records accepted/rejected/completed receipt
  -> retrieval source becomes available only through RAG/knowledge API
```

### Worker step execution

```txt
outbox/queue message with ids only
  -> worker claims step in Postgres
  -> worker loads scenario module handler
  -> handler strong-reads canonical inputs through repositories
  -> external calls happen outside DB transaction
  -> result write rereads canonical status/version
  -> write step/artifact/audit/outbox facts
```
