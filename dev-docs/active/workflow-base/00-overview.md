# Workflow Base

## Goal
Converge the workflow base into a v0 plug-in contract that supports controlled
scenario modules and consistent product consumption surfaces.

The first convergence target is the two-layer structure:

```txt
base modules
  -> Scenario registry
  -> Workflow ledger
  -> Surface presenters
  -> Handoff ledger
  -> Governance gates

consumption surfaces
  -> chat workflow control
  -> chat dashboard summary
  -> chat citation
  -> web domain workbench
  -> web run workbench
  -> mobile dashboard
  -> forum/publication
  -> RAG/knowledge
  -> notification/push
  -> admin/operator
  -> worker/runtime
```

## Status
- State: in-progress
- Owner: unassigned
- Created: 2026-05-25
- Updated: 2026-05-26
- Roadmap: `dev-docs/active/workflow-base/roadmap.md`

## Context
This repository is the workflow base template. It defines durable contracts for
scenario modules and host product consumers. It should not encode one product
repo, one local machine path, or one scenario as the core boundary.

The current design stance is:
- `Scenario` is a first-class canonical object.
- Product consumers use shared Workflow APIs and presenters.
- Scenario domain facts are shared through refs and versions across workflows.
- Chat collects lightweight setup/start requirements and summarizes dashboard
  state, but does not perform step interventions or intervention reminders.
- Web/Admin may expose manifest-declared internal APIs.
- The base defines handoff request/receipt contracts only.
- Scenario modules use YAML manifest plus TypeScript registries.

## Scope In
- v0 architecture matrix convergence.
- Base module definitions and ownership boundaries.
- Consumption surface rules for chat workflow control, chat dashboard summary,
  chat citation, web domain workbench, web run workbench, mobile dashboard,
  forum publication, RAG/knowledge, notification push, admin/operator, and
  worker/runtime.
- Shared identity, state, action, exposure, handoff, and presenter contracts.
- Scenario data contracts for shared domain facts, run start requirements, and
  web-owned step interventions.
- Manifest/API/module contract implications.
- Macro roadmap for moving from docs to implementation skeleton.

## Scope Out
- Implementing runtime services.
- Implementing a host product integration.
- Implementing forum, RAG, notification, or public draft downstream modules.
- User-editable workflow builders.
- Plugin marketplace behavior.
- Scenario-specific domain facts beyond examples.

## Key Decisions
- D1: The base has five modules: `Scenario registry`, `Workflow ledger`,
  `Surface presenters`, `Handoff ledger`, and `Governance gates`.
- D2: The product layer has eleven consumption surfaces:
  `chat_workflow_control`, `chat_dashboard_summary`, `chat_citation`,
  `web_domain_workbench`, `web_run_workbench`, `mobile_dashboard`,
  `forum_publication`, `rag_knowledge`, `notification_push`, `admin_operator`,
  and `worker_runtime`.
- D3: Every surface uses the same workflow identity chain and state vocabulary.
- D4: UI surfaces render action availability; durable writes go through standard
  command/action APIs with expected versions.
- D5: Downstream exposure uses handoff request/receipt records. The base sends
  refs and metadata only, never private bodies.
- D6: Internal custom APIs are allowed only for Web/Admin and only when declared
  by the scenario manifest.
- D7: Multiple workflows inside one scenario share data through scenario domain
  facts and domain events, not through another workflow's private run/step
  state.
- D8: Indexing is service-owned and policy-driven from sharing consent and
  artifact eligibility; dashboards must not expose direct knowledge-base
  indexing actions.

## Dependencies
- `docs/context/workflow/v0-convergence.md`
- `docs/context/workflow/architecture-matrix.md`
- `docs/context/workflow/surface-contract.md`
- `docs/context/workflow/api-contract.md`
- `docs/context/workflow/module-contract.md`
- `templates/scenario-module/scenario.manifest.yaml`

## Acceptance Criteria
- [ ] `architecture-matrix.md` is reduced to a v0 contract rather than a broad
  discussion note.
- [ ] Every base module has a single owner statement and non-owner statement.
- [ ] Every surface has explicit `reads`, `actions`, `handoffs`, and
  `forbidden` rules.
- [ ] Matrix rules map to concrete manifest fields.
- [ ] Manifest fields distinguish scenario domain facts, run start
  requirements, and step interventions.
- [ ] Matrix rules map to concrete Workflow API endpoints and DTOs.
- [ ] Handoff request/receipt minimum fields are stable.
- [ ] Internal API boundary is stable and Web/Admin-only.
- [ ] A second scenario can be evaluated against the matrix without adding a new
  product-surface API.
- [ ] Multiple workflows in one scenario can share domain facts without
  coupling to each other's internal run/step state.

## Current Notes
- 2026-05-25: Task package created to preserve macro alignment before further
  contract edits.
- 2026-05-26: Matrix stance updated: chat is workflow control, dashboard
  summary, and citation only; Web owns domain and run workbenches; service-owned
  indexing is driven by sharing consent/policy.
